from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langserve import add_routes
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_community.chat_models import ChatOllama
import json

from app.config import settings
from app.chains.chat_chain import create_chat_chain
from app.graphs.chat_graph import create_chat_graph, create_streaming_chat_graph, convert_messages
from app.api.routes import models

app = FastAPI(
    title="e1soft LLM Backend",
    version="1.0.0",
    description="LangServe + LangGraph backend for local LLM chat system",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# LangServe 채팅 라우트 (기존 Chain 기반)
add_routes(
    app,
    create_chat_chain(),
    path="/chat",
    enable_feedback_endpoint=True,
    enable_public_trace_link_endpoint=True,
)


# LangGraph 기반 채팅 그래프 라우트
chat_graph = create_chat_graph()
streaming_chat_graph = create_streaming_chat_graph()


@app.post("/graph/chat")
async def graph_chat(request: Request):
    """LangGraph 기반 채팅 (non-streaming)"""
    body = await request.json()
    messages = body.get("messages", [])
    model_name = body.get("model", settings.OLLAMA_DEFAULT_MODEL)

    # 메시지 변환
    langchain_messages = convert_messages(messages)

    # 그래프 실행
    result = chat_graph.invoke({
        "messages": langchain_messages,
        "model_name": model_name,
    })

    # 마지막 AI 메시지 반환
    last_message = result["messages"][-1]
    return {
        "role": "assistant",
        "content": last_message.content,
    }


@app.post("/graph/chat/stream")
async def graph_chat_stream(request: Request):
    """LangGraph 기반 스트리밍 채팅"""
    import time

    body = await request.json()
    messages = body.get("messages", [])
    model_name = body.get("model", settings.OLLAMA_DEFAULT_MODEL)
    debug_mode = body.get("debug", False)

    # 시스템 프롬프트
    system_prompt = (
        "You are a helpful AI assistant. "
        "Respond in the same language as the user. "
        "If the user speaks Korean, respond in Korean. "
        "Provide clear, concise, and helpful responses. "
        "/no_think"
    )

    # LLM 초기화
    llm = ChatOllama(
        base_url=settings.OLLAMA_HOST,
        model=model_name,
        temperature=0.7,
    )

    # 메시지 준비
    langchain_messages = [SystemMessage(content=system_prompt)]
    langchain_messages.extend(convert_messages(messages))

    async def generate():
        """스트리밍 응답 생성"""
        full_response = ""
        token_count = 0
        start_time = time.time()
        first_token_time = None

        # 그래프 실행 시작 이벤트
        if debug_mode:
            yield f"data: {json.dumps({'type': 'graph_start', 'node': 'chat', 'model': model_name, 'timestamp': start_time})}\n\n"

        async for chunk in llm.astream(langchain_messages):
            content = chunk.content
            if content:  # 빈 토큰 필터링
                current_time = time.time()

                if first_token_time is None:
                    first_token_time = current_time

                full_response += content
                token_count += 1

                # SSE 형식으로 전송
                event_data = {'content': content}

                if debug_mode:
                    event_data['type'] = 'token'
                    event_data['token_index'] = token_count
                    event_data['elapsed_ms'] = int((current_time - start_time) * 1000)

                yield f"data: {json.dumps(event_data)}\n\n"

        # 완료 이벤트
        end_time = time.time()
        total_time = end_time - start_time
        ttft = (first_token_time - start_time) if first_token_time else 0  # Time to First Token
        tokens_per_sec = token_count / total_time if total_time > 0 else 0

        done_data = {
            'done': True,
            'full_response': full_response,
        }

        if debug_mode:
            done_data['type'] = 'graph_end'
            done_data['stats'] = {
                'total_tokens': token_count,
                'total_time_ms': int(total_time * 1000),
                'ttft_ms': int(ttft * 1000),  # Time to First Token
                'tokens_per_sec': round(tokens_per_sec, 2),
                'model': model_name,
                'node': 'chat',
            }

        yield f"data: {json.dumps(done_data)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/graph/info")
async def graph_info():
    """LangGraph 구조 정보 반환"""
    return {
        "name": "chat_graph",
        "description": "LangGraph 기반 채팅 워크플로우",
        "nodes": [
            {
                "id": "chat",
                "name": "Chat Node",
                "description": "Ollama LLM을 사용한 응답 생성",
                "type": "llm",
            }
        ],
        "edges": [
            {"from": "__start__", "to": "chat"},
            {"from": "chat", "to": "__end__"},
        ],
        "features": [
            "스트리밍 응답",
            "동적 모델 선택",
            "다국어 지원",
            "토큰 통계",
        ],
    }


# 모델 관리 API 라우트
app.include_router(models.router, prefix="/api/models", tags=["models"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
