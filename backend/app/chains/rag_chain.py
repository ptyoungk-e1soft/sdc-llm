"""
RAG (Retrieval-Augmented Generation) Chain

이 파일은 RAG 파이프라인을 구현합니다.
- 문서 로딩 및 파싱
- 청킹 (텍스트 분할)
- 임베딩 생성
- 벡터 저장소 관리
- 검색 및 리랭킹
- LLM 응답 생성
"""

from typing import List, Optional, Dict, Any
from langchain_community.chat_models import ChatOllama
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.documents import Document
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    MarkdownHeaderTextSplitter,
    HTMLHeaderTextSplitter,
    Language,
    RecursiveCharacterTextSplitter as CodeSplitter,
)

from app.config import settings


def get_embeddings(
    provider: str,
    model_name: str,
    endpoint: str = None,
    api_key: str = None,
):
    """
    임베딩 프로바이더에 따라 적절한 임베딩 인스턴스 생성
    """
    provider = provider.upper()

    if provider == "OLLAMA":
        return OllamaEmbeddings(
            base_url=endpoint or settings.OLLAMA_HOST,
            model=model_name,
        )
    elif provider == "OPENAI":
        return OpenAIEmbeddings(
            model=model_name,
            api_key=api_key,
            base_url=endpoint if endpoint else None,
        )
    elif provider == "HUGGINGFACE":
        from langchain_huggingface import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name=model_name)
    elif provider == "CUSTOM":
        # Custom은 OpenAI 호환으로 처리
        return OpenAIEmbeddings(
            model=model_name,
            api_key=api_key or "dummy-key",
            base_url=endpoint,
        )
    else:
        return OllamaEmbeddings(
            base_url=settings.OLLAMA_HOST,
            model=model_name,
        )


def get_text_splitter(
    strategy: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    separators: List[str] = None,
):
    """
    청킹 전략에 따라 적절한 텍스트 분할기 생성
    """
    strategy = strategy.upper()

    if strategy == "FIXED":
        return CharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separator="\n" if not separators else separators[0],
        )
    elif strategy == "RECURSIVE":
        return RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators or ["\n\n", "\n", " ", ""],
        )
    elif strategy == "SEMANTIC":
        # 시맨틱 분할은 추가 설정 필요
        return RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
    elif strategy == "MARKDOWN":
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        return MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    elif strategy == "HTML":
        headers_to_split_on = [
            ("h1", "Header 1"),
            ("h2", "Header 2"),
            ("h3", "Header 3"),
        ]
        return HTMLHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    elif strategy == "CODE":
        return CodeSplitter.from_language(
            language=Language.PYTHON,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
    else:
        return RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )


def get_vector_store(
    db_type: str,
    embeddings,
    collection_name: str = "default",
    connection_url: str = None,
    settings_dict: Dict = None,
):
    """
    벡터 데이터베이스 타입에 따라 적절한 벡터 저장소 생성
    """
    db_type = db_type.upper()

    if db_type == "CHROMA":
        from langchain_chroma import Chroma
        return Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory=settings_dict.get("persist_directory", "./chroma_db") if settings_dict else "./chroma_db",
        )
    elif db_type == "FAISS":
        from langchain_community.vectorstores import FAISS
        # FAISS는 기존 인덱스 로드 또는 새로 생성
        return None  # FAISS는 문서 추가 시 생성
    elif db_type == "PGVECTOR":
        from langchain_postgres import PGVector
        return PGVector(
            embeddings=embeddings,
            collection_name=collection_name,
            connection=connection_url,
        )
    elif db_type == "QDRANT":
        from langchain_qdrant import Qdrant
        from qdrant_client import QdrantClient
        client = QdrantClient(url=connection_url) if connection_url else QdrantClient(":memory:")
        return Qdrant(
            client=client,
            collection_name=collection_name,
            embeddings=embeddings,
        )
    else:
        from langchain_chroma import Chroma
        return Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
        )


def format_docs(docs: List[Document]) -> str:
    """검색된 문서들을 문자열로 포맷팅"""
    return "\n\n".join(doc.page_content for doc in docs)


def create_rag_chain(
    # 임베딩 설정
    embedding_provider: str = "OLLAMA",
    embedding_model: str = "nomic-embed-text",
    embedding_endpoint: str = None,
    embedding_api_key: str = None,
    # 벡터 DB 설정
    vectordb_type: str = "CHROMA",
    vectordb_collection: str = "default",
    vectordb_url: str = None,
    vectordb_settings: Dict = None,
    # 청킹 설정
    chunk_strategy: str = "RECURSIVE",
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    chunk_separators: List[str] = None,
    # LLM 설정
    llm_provider: str = "OLLAMA",
    llm_model: str = "llama3",
    llm_endpoint: str = None,
    llm_api_key: str = None,
    llm_temperature: float = 0.7,
    llm_max_tokens: int = 4096,
    # RAG 설정
    top_k: int = 5,
    score_threshold: float = 0.7,
    system_prompt: str = None,
    context_template: str = None,
):
    """
    완전한 RAG 파이프라인 생성
    """
    # 임베딩 생성
    embeddings = get_embeddings(
        provider=embedding_provider,
        model_name=embedding_model,
        endpoint=embedding_endpoint,
        api_key=embedding_api_key,
    )

    # 벡터 저장소 생성
    vectorstore = get_vector_store(
        db_type=vectordb_type,
        embeddings=embeddings,
        collection_name=vectordb_collection,
        connection_url=vectordb_url,
        settings_dict=vectordb_settings,
    )

    # 리트리버 생성
    retriever = vectorstore.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={
            "k": top_k,
            "score_threshold": score_threshold,
        },
    )

    # LLM 생성
    llm_provider = llm_provider.upper()
    if llm_provider == "OLLAMA":
        llm = ChatOllama(
            base_url=llm_endpoint or settings.OLLAMA_HOST,
            model=llm_model,
            temperature=llm_temperature,
        )
    elif llm_provider == "OPENAI":
        llm = ChatOpenAI(
            model=llm_model,
            temperature=llm_temperature,
            max_tokens=llm_max_tokens,
            api_key=llm_api_key,
            base_url=llm_endpoint if llm_endpoint else None,
        )
    elif llm_provider == "ANTHROPIC":
        llm = ChatAnthropic(
            model=llm_model,
            temperature=llm_temperature,
            max_tokens=llm_max_tokens,
            api_key=llm_api_key,
        )
    else:
        llm = ChatOllama(
            base_url=settings.OLLAMA_HOST,
            model=llm_model,
            temperature=llm_temperature,
        )

    # 기본 시스템 프롬프트
    default_system_prompt = """You are a helpful AI assistant.
Answer the question based on the provided context.
If you cannot find the answer in the context, say so.
Respond in the same language as the user's question."""

    # 기본 컨텍스트 템플릿
    default_context_template = """Context:
{context}

Question: {question}"""

    # 프롬프트 템플릿 생성
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt or default_system_prompt),
        ("human", context_template or default_context_template),
    ])

    # RAG 체인 구성
    rag_chain = (
        RunnableParallel(
            context=retriever | format_docs,
            question=RunnablePassthrough(),
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain, vectorstore, embeddings


def create_rag_chain_with_history(
    # 위와 동일한 파라미터들...
    **kwargs,
):
    """
    대화 히스토리를 지원하는 RAG 체인 생성
    """
    base_chain, vectorstore, embeddings = create_rag_chain(**kwargs)

    # 히스토리 포맷팅 함수
    def format_history(x):
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
        return formatted

    # 히스토리가 있는 프롬프트
    system_prompt = kwargs.get("system_prompt") or """You are a helpful AI assistant.
Answer the question based on the provided context and conversation history.
If you cannot find the answer in the context, say so.
Respond in the same language as the user's question."""

    prompt_with_history = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "Context:\n{context}\n\nQuestion: {question}"),
    ])

    # 히스토리 포함 체인
    rag_chain_with_history = (
        RunnablePassthrough.assign(
            history=format_history,
            context=lambda x: vectorstore.as_retriever().invoke(x["question"]) | format_docs,
        )
        | prompt_with_history
        | base_chain.last  # LLM
        | StrOutputParser()
    )

    return rag_chain_with_history, vectorstore, embeddings


# 문서 인덱싱 함수
def index_documents(
    documents: List[Document],
    vectorstore,
    text_splitter,
) -> int:
    """
    문서들을 청킹하고 벡터 저장소에 인덱싱
    """
    # 청킹
    chunks = text_splitter.split_documents(documents)

    # 벡터 저장소에 추가
    vectorstore.add_documents(chunks)

    return len(chunks)
