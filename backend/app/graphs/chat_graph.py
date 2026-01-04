"""
LangGraph 기반 채팅 워크플로우

Features:
- 상태 기반 대화 관리
- 스트리밍 응답 지원
- 동적 모델 선택
- 확장 가능한 그래프 구조
"""

from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_community.chat_models import ChatOllama
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from app.config import settings


# 상태 정의
class ChatState(TypedDict):
    """채팅 그래프의 상태"""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    model_name: str


def create_chat_graph():
    """
    LangGraph 기반 채팅 그래프 생성

    그래프 구조:
    START -> chat_node -> END

    확장 가능:
    - 도구 사용 노드 추가
    - 조건부 라우팅
    - 멀티 에이전트 구조
    """

    # 시스템 프롬프트
    SYSTEM_PROMPT = (
        "You are a helpful AI assistant. "
        "Respond in the same language as the user. "
        "If the user speaks Korean, respond in Korean. "
        "Provide clear, concise, and helpful responses."
    )

    def chat_node(state: ChatState) -> ChatState:
        """메인 채팅 노드"""
        model_name = state.get("model_name", settings.OLLAMA_DEFAULT_MODEL)

        # LLM 초기화
        llm = ChatOllama(
            base_url=settings.OLLAMA_HOST,
            model=model_name,
            temperature=0.7,
        )

        # 메시지 준비 (시스템 메시지 추가)
        messages = list(state["messages"])

        # 시스템 메시지가 없으면 추가
        if not messages or not isinstance(messages[0], SystemMessage):
            messages.insert(0, SystemMessage(content=SYSTEM_PROMPT))

        # LLM 호출
        response = llm.invoke(messages)

        return {"messages": [response]}

    # 그래프 빌드
    workflow = StateGraph(ChatState)

    # 노드 추가
    workflow.add_node("chat", chat_node)

    # 엣지 정의
    workflow.set_entry_point("chat")
    workflow.add_edge("chat", END)

    # 그래프 컴파일
    graph = workflow.compile()

    return graph


def create_streaming_chat_graph():
    """
    스트리밍을 지원하는 채팅 그래프

    이 버전은 astream_events를 사용하여 토큰 단위 스트리밍 지원
    """

    SYSTEM_PROMPT = (
        "You are a helpful AI assistant. "
        "Respond in the same language as the user. "
        "If the user speaks Korean, respond in Korean. "
        "Provide clear, concise, and helpful responses. "
        "/no_think"  # qwen3 thinking 모드 비활성화
    )

    async def chat_node(state: ChatState) -> ChatState:
        """비동기 채팅 노드"""
        model_name = state.get("model_name", settings.OLLAMA_DEFAULT_MODEL)

        llm = ChatOllama(
            base_url=settings.OLLAMA_HOST,
            model=model_name,
            temperature=0.7,
        )

        messages = list(state["messages"])

        if not messages or not isinstance(messages[0], SystemMessage):
            messages.insert(0, SystemMessage(content=SYSTEM_PROMPT))

        response = await llm.ainvoke(messages)

        return {"messages": [response]}

    workflow = StateGraph(ChatState)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("chat")
    workflow.add_edge("chat", END)

    return workflow.compile()


# 메시지 변환 헬퍼
def convert_messages(messages: list[dict]) -> list[BaseMessage]:
    """프론트엔드 메시지 형식을 LangChain 메시지로 변환"""
    result = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "user":
            result.append(HumanMessage(content=content))
        elif role == "assistant":
            result.append(AIMessage(content=content))
        elif role == "system":
            result.append(SystemMessage(content=content))

    return result
