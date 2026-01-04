from langchain_community.chat_models import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, ConfigurableField, RunnableLambda
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.language_models.chat_models import BaseChatModel

from app.config import settings


def get_llm_by_provider(
    provider: str,
    model: str,
    endpoint: str = None,
    api_key: str = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> BaseChatModel:
    """
    프로바이더에 따라 적절한 LLM 인스턴스 생성
    """
    provider = provider.upper()

    if provider == "OLLAMA":
        return ChatOllama(
            base_url=endpoint or settings.OLLAMA_HOST,
            model=model,
            temperature=temperature,
        )
    elif provider == "OPENAI":
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            base_url=endpoint if endpoint else None,
        )
    elif provider == "ANTHROPIC":
        return ChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
        )
    elif provider == "CUSTOM":
        # Custom은 OpenAI 호환 API로 처리
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key or "dummy-key",
            base_url=endpoint,
        )
    else:
        # 기본값은 Ollama
        return ChatOllama(
            base_url=settings.OLLAMA_HOST,
            model=model,
            temperature=temperature,
        )


def create_chat_chain():
    """
    Ollama 모델을 사용한 채팅 체인 생성 (기본)

    Features:
    - 스트리밍 지원
    - 동적 모델 선택 (configurable)
    - 대화 히스토리 관리
    """
    # 기본 모델 설정 (configurable로 런타임에 변경 가능)
    llm = ChatOllama(
        base_url=settings.OLLAMA_HOST,
        model=settings.OLLAMA_DEFAULT_MODEL,
        temperature=0.7,
    ).configurable_fields(
        model=ConfigurableField(
            id="model_name",
            name="Model Name",
            description="The Ollama model to use for chat",
        )
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a helpful AI assistant. Respond in the same language as the user. "
                "If the user speaks Korean, respond in Korean. "
                "Provide clear, concise, and helpful responses. "
                "/no_think",  # Disable thinking mode for qwen3
            ),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )

    def format_history(x):
        """대화 히스토리를 LangChain 메시지 포맷으로 변환"""
        history = x.get("history", [])
        formatted = []
        for msg in history:
            if isinstance(msg, dict):
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    formatted.append(HumanMessage(content=content))
                elif role == "assistant":
                    formatted.append(AIMessage(content=content))
            elif hasattr(msg, "type"):
                formatted.append(msg)
        return formatted

    chain = (
        RunnablePassthrough.assign(history=format_history) | prompt | llm | StrOutputParser()
    )

    return chain


def create_dynamic_chat_chain(
    provider: str,
    model: str,
    endpoint: str = None,
    api_key: str = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str = None,
):
    """
    동적 프로바이더를 지원하는 채팅 체인 생성

    Args:
        provider: 모델 프로바이더 (OLLAMA, OPENAI, ANTHROPIC, CUSTOM)
        model: 모델 이름
        endpoint: API 엔드포인트 (선택)
        api_key: API 키 (선택)
        temperature: 온도 파라미터
        max_tokens: 최대 토큰 수
        system_prompt: 시스템 프롬프트 (선택)
    """
    llm = get_llm_by_provider(
        provider=provider,
        model=model,
        endpoint=endpoint,
        api_key=api_key,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    # 시스템 프롬프트 설정
    default_system_prompt = (
        "You are a helpful AI assistant. Respond in the same language as the user. "
        "If the user speaks Korean, respond in Korean. "
        "Provide clear, concise, and helpful responses."
    )

    # Ollama의 경우 /no_think 추가
    if provider.upper() == "OLLAMA":
        system_msg = (system_prompt or default_system_prompt) + " /no_think"
    else:
        system_msg = system_prompt or default_system_prompt

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_msg),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )

    def format_history(x):
        """대화 히스토리를 LangChain 메시지 포맷으로 변환"""
        history = x.get("history", [])
        formatted = []
        for msg in history:
            if isinstance(msg, dict):
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    formatted.append(HumanMessage(content=content))
                elif role == "assistant":
                    formatted.append(AIMessage(content=content))
            elif hasattr(msg, "type"):
                formatted.append(msg)
        return formatted

    chain = (
        RunnablePassthrough.assign(history=format_history) | prompt | llm | StrOutputParser()
    )

    return chain
