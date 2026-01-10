# e1soft LLM 기능 명세서 (Feature Specification)

**버전**: 1.0.0
**최종 수정일**: 2026-01-04
**작성자**: 시스템 자동 생성

---

## 목차

1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [데이터 모델 명세](#2-데이터-모델-명세)
3. [API 엔드포인트 명세](#3-api-엔드포인트-명세)
4. [프론트엔드 컴포넌트 명세](#4-프론트엔드-컴포넌트-명세)
5. [워크플로우 명세](#5-워크플로우-명세)
6. [상태 관리 명세](#6-상태-관리-명세)
7. [인증 및 권한 명세](#7-인증-및-권한-명세)
8. [RAG 파이프라인 명세](#8-rag-파이프라인-명세)
9. [LLM 모델 통합 명세](#9-llm-모델-통합-명세)
10. [Human-in-the-Loop 데이터 수집 명세](#10-human-in-the-loop-데이터-수집-명세)
11. [기본분석 워크플로우 명세](#11-기본분석-워크플로우-명세)

---

## 1. 시스템 아키텍처

### 1.1 전체 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              클라이언트 계층                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16 Frontend (React 18)                    │   │
│  │  ├── App Router (Route Groups: auth, main, admin)                   │   │
│  │  ├── Tailwind CSS + Lucide Icons                                    │   │
│  │  ├── Zustand (상태 관리)                                             │   │
│  │  └── React Query / SWR (데이터 페칭)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway 계층                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes (Edge/Node)                    │   │
│  │  ├── /api/auth/* (NextAuth.js 인증)                                 │   │
│  │  ├── /api/chat/* (채팅 API)                                         │   │
│  │  ├── /api/admin/* (관리자 API)                                      │   │
│  │  └── /api/models/* (모델 관리)                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│       데이터베이스 계층         │       │        백엔드 AI 계층          │
│  ┌────────────────────────┐  │       │  ┌────────────────────────┐  │
│  │     PostgreSQL         │  │       │  │    LangServe API       │  │
│  │  (Prisma ORM)          │  │       │  │    (FastAPI 기반)       │  │
│  │  ├── 사용자/인증 정보   │  │       │  │  ├── LangGraph 체인     │  │
│  │  ├── 채팅 이력         │  │       │  │  ├── RAG Pipeline       │  │
│  │  ├── 모델 설정         │  │       │  │  └── Streaming 응답     │  │
│  │  └── RAG 파이프라인 설정│  │       │  └────────────────────────┘  │
│  └────────────────────────┘  │       │              │               │
└──────────────────────────────┘       │              ▼               │
                                       │  ┌────────────────────────┐  │
                                       │  │   LLM Providers        │  │
                                       │  │  ├── Ollama (로컬)     │  │
                                       │  │  ├── OpenAI            │  │
                                       │  │  ├── Anthropic         │  │
                                       │  │  └── Custom API        │  │
                                       │  └────────────────────────┘  │
                                       │              │               │
                                       │              ▼               │
                                       │  ┌────────────────────────┐  │
                                       │  │   Vector Database      │  │
                                       │  │  ├── ChromaDB          │  │
                                       │  │  ├── FAISS             │  │
                                       │  │  ├── PGVector          │  │
                                       │  │  └── Qdrant/Weaviate   │  │
                                       │  └────────────────────────┘  │
                                       └──────────────────────────────┘
```

### 1.2 기술 스택 상세

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Frontend | Next.js | 16.x | React 프레임워크, App Router |
| Frontend | React | 18.x | UI 라이브러리 |
| Frontend | TypeScript | 5.x | 타입 안전성 |
| Frontend | Tailwind CSS | 3.x | 유틸리티 CSS |
| Frontend | Zustand | 5.x | 상태 관리 |
| Frontend | Lucide React | - | 아이콘 라이브러리 |
| Backend (Node) | NextAuth.js | 5.x | 인증 |
| Backend (Node) | Prisma | 6.x | ORM |
| Database | PostgreSQL | 16.x | 관계형 데이터베이스 |
| AI Backend | FastAPI | - | Python API 서버 |
| AI Backend | LangServe | - | LangChain 서빙 |
| AI Backend | LangGraph | - | AI 워크플로우 |

---

## 2. 데이터 모델 명세

### 2.1 사용자 관련 모델

#### 2.1.1 User 모델

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  password      String?
  image         String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  userGroupId   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts   Account[]
  sessions   Session[]
  chats      Chat[]
  chatGroups ChatGroup[]
  userGroup  UserGroup?  @relation(...)
}
```

**필드 설명:**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | String | O | 사용자 고유 식별자 (CUID) |
| name | String | X | 사용자 표시 이름 |
| email | String | X | 이메일 주소 (고유) |
| emailVerified | DateTime | X | 이메일 인증 일시 |
| password | String | X | 해시된 비밀번호 |
| image | String | X | 프로필 이미지 URL |
| role | UserRole | O | 사용자 권한 (ADMIN/USER/HOLDING) |
| isActive | Boolean | O | 계정 활성화 상태 |
| userGroupId | String | X | 소속 그룹 ID |

#### 2.1.2 UserRole 열거형

```typescript
enum UserRole {
  ADMIN    // 시스템 관리자 - 모든 기능 접근 가능
  USER     // 일반 사용자 - 채팅 및 분석 기능 사용
  HOLDING  // 대기 사용자 - 가입 승인 대기 상태
}
```

#### 2.1.3 UserGroup 모델

```prisma
model UserGroup {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users User[]
}
```

### 2.2 채팅 관련 모델

#### 2.2.1 Chat 모델

```prisma
model Chat {
  id        String   @id @default(cuid())
  title     String   @default("New Chat")
  userId    String
  modelName String   @default("llama3")
  groupId   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User       @relation(...)
  group    ChatGroup? @relation(...)
  messages Message[]
}
```

**필드 설명:**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | String | O | 채팅 고유 식별자 |
| title | String | O | 채팅 제목 (첫 메시지 기반 자동 생성) |
| userId | String | O | 채팅 소유자 ID |
| modelName | String | O | 사용된 LLM 모델명 |
| groupId | String | X | 채팅 그룹 ID |

#### 2.2.2 Message 모델

```prisma
model Message {
  id        String   @id @default(cuid())
  chatId    String
  role      Role     @default(USER)
  content   String   @db.Text
  createdAt DateTime @default(now())

  chat Chat @relation(...)
}
```

**Role 열거형:**

```typescript
enum Role {
  USER       // 사용자 메시지
  ASSISTANT  // AI 응답 메시지
  SYSTEM     // 시스템 메시지
}
```

#### 2.2.3 ChatGroup 모델

```prisma
model ChatGroup {
  id        String   @id @default(cuid())
  name      String
  userId    String
  parentId  String?
  color     String?  @default("#6B7280")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User        @relation(...)
  parent   ChatGroup?  @relation("GroupHierarchy", ...)
  children ChatGroup[] @relation("GroupHierarchy")
  chats    Chat[]
}
```

### 2.3 모델 설정 관련

#### 2.3.1 ModelConfig 모델

```prisma
model ModelConfig {
  id          String        @id @default(cuid())
  name        String        @unique
  displayName String
  provider    ModelProvider @default(OLLAMA)
  endpoint    String?
  apiKey      String?
  isActive    Boolean       @default(true)
  isDefault   Boolean       @default(false)
  temperature Float         @default(0.7)
  maxTokens   Int           @default(4096)
  systemPrompt String?      @db.Text
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

**ModelProvider 열거형:**

```typescript
enum ModelProvider {
  OLLAMA     // 로컬 Ollama 서버
  OPENAI     // OpenAI API
  ANTHROPIC  // Anthropic (Claude) API
  CUSTOM     // 사용자 정의 API
}
```

### 2.4 RAG 파이프라인 관련 모델

#### 2.4.1 EmbeddingConfig 모델

```prisma
model EmbeddingConfig {
  id          String            @id @default(cuid())
  name        String            @unique
  displayName String
  provider    EmbeddingProvider @default(OLLAMA)
  modelName   String            @default("nomic-embed-text")
  endpoint    String?
  apiKey      String?
  dimension   Int               @default(768)
  isActive    Boolean           @default(true)
  isDefault   Boolean           @default(false)
}
```

**EmbeddingProvider 열거형:**

```typescript
enum EmbeddingProvider {
  OLLAMA      // Ollama 임베딩
  OPENAI      // OpenAI Embeddings API
  HUGGINGFACE // HuggingFace 모델
  CUSTOM      // 사용자 정의
}
```

#### 2.4.2 VectorDBConfig 모델

```prisma
model VectorDBConfig {
  id              String       @id @default(cuid())
  name            String       @unique
  displayName     String
  type            VectorDBType @default(CHROMA)
  connectionUrl   String?
  apiKey          String?
  collectionName  String       @default("default")
  isActive        Boolean      @default(true)
  isDefault       Boolean      @default(false)
  settings        String?      @db.Text  // JSON
}
```

**VectorDBType 열거형:**

```typescript
enum VectorDBType {
  CHROMA     // ChromaDB
  FAISS      // Facebook AI Similarity Search
  PGVECTOR   // PostgreSQL Vector Extension
  QDRANT     // Qdrant Vector DB
  WEAVIATE   // Weaviate
  PINECONE   // Pinecone
}
```

#### 2.4.3 ChunkConfig 모델

```prisma
model ChunkConfig {
  id            String        @id @default(cuid())
  name          String        @unique
  displayName   String
  strategy      ChunkStrategy @default(RECURSIVE)
  chunkSize     Int           @default(1000)
  chunkOverlap  Int           @default(200)
  separators    String?       @db.Text  // JSON 배열
  modelName     String?
  isActive      Boolean       @default(true)
  isDefault     Boolean       @default(false)
}
```

**ChunkStrategy 열거형:**

```typescript
enum ChunkStrategy {
  FIXED      // 고정 크기 분할
  RECURSIVE  // 재귀적 분할
  SEMANTIC   // 의미 기반 분할
  MARKDOWN   // 마크다운 구조 기반
  HTML       // HTML 구조 기반
  CODE       // 코드 구조 기반
}
```

#### 2.4.4 RAGPipeline 모델

```prisma
model RAGPipeline {
  id              String   @id @default(cuid())
  name            String   @unique
  displayName     String
  description     String?  @db.Text

  embeddingId     String
  vectorDBId      String
  chunkId         String
  parserId        String?
  rerankerId      String?
  modelConfigId   String?

  topK            Int      @default(5)
  scoreThreshold  Float    @default(0.7)
  systemPrompt    String?  @db.Text
  contextTemplate String?  @db.Text

  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
}
```

---

## 3. API 엔드포인트 명세

### 3.1 인증 API (`/api/auth/*`)

#### 3.1.1 NextAuth 핸들러

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| * | `/api/auth/[...nextauth]` | NextAuth.js 인증 핸들러 |
| GET | `/api/auth/check-admin` | 관리자 권한 확인 |

**NextAuth 지원 경로:**

- `GET/POST /api/auth/signin` - 로그인 페이지
- `GET/POST /api/auth/signout` - 로그아웃
- `GET /api/auth/session` - 세션 정보 조회
- `GET /api/auth/providers` - 인증 제공자 목록
- `GET /api/auth/csrf` - CSRF 토큰

#### 3.1.2 회원가입 API

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| POST | `/api/register` | 신규 사용자 등록 |

**요청 본문:**

```typescript
interface RegisterRequest {
  name: string;      // 사용자 이름
  email: string;     // 이메일
  password: string;  // 비밀번호
}
```

**응답:**

```typescript
interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
```

### 3.2 채팅 API (`/api/chat/*`)

#### 3.2.1 채팅 스트리밍

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| POST | `/api/chat` | LLM 채팅 스트리밍 응답 |

**요청 본문:**

```typescript
interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content?: string;
    parts?: Array<{ type: string; text: string }>;
  }>;
  model: string;      // 모델명 (예: "qwen3:32b")
  chatId: string;     // 채팅 세션 ID
  debug?: boolean;    // 디버그 모드 활성화
}
```

**응답 (SSE 스트리밍):**

```
0:"응답 텍스트 청크"
d:{"type":"node_start","node":"retrieve"}  // 디버그 이벤트
d:{"type":"token_usage","input":100,"output":50}
```

**처리 흐름:**

```
클라이언트 요청
    │
    ▼
인증 확인 (session?.user?.id)
    │
    ▼
메시지 형식 변환 (parts → content)
    │
    ▼
사용자 메시지 DB 저장
    │
    ▼
첫 메시지인 경우 채팅 제목 업데이트
    │
    ▼
LangGraph 백엔드 호출 (POST /graph/chat/stream)
    │
    ▼
SSE 스트리밍 응답 변환
    │
    ▼
완료 후 AI 응답 DB 저장
```

#### 3.2.2 채팅 목록 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/chats` | 채팅 목록 조회 |
| POST | `/api/chats` | 새 채팅 생성 |
| GET | `/api/chats/[chatId]` | 특정 채팅 조회 |
| PUT | `/api/chats/[chatId]` | 채팅 수정 |
| DELETE | `/api/chats/[chatId]` | 채팅 삭제 |

**채팅 목록 응답:**

```typescript
interface ChatListResponse {
  chats: Array<{
    id: string;
    title: string;
    modelName: string;
    groupId: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { messages: number };
  }>;
}
```

### 3.3 관리자 API (`/api/admin/*`)

#### 3.3.1 사용자 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/users` | 사용자 목록 조회 |
| POST | `/api/admin/users` | 사용자 생성 |
| GET | `/api/admin/users/[userId]` | 특정 사용자 조회 |
| PUT | `/api/admin/users/[userId]` | 사용자 수정 |
| DELETE | `/api/admin/users/[userId]` | 사용자 삭제 |

**사용자 수정 요청:**

```typescript
interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER" | "HOLDING";
  isActive?: boolean;
  userGroupId?: string;
}
```

#### 3.3.2 그룹 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/groups` | 그룹 목록 조회 |
| POST | `/api/admin/groups` | 그룹 생성 |
| GET | `/api/admin/groups/[groupId]` | 특정 그룹 조회 |
| PUT | `/api/admin/groups/[groupId]` | 그룹 수정 |
| DELETE | `/api/admin/groups/[groupId]` | 그룹 삭제 |

#### 3.3.3 모델 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/models` | 모델 목록 조회 |
| POST | `/api/admin/models` | 모델 추가 |
| PUT | `/api/admin/models/[modelId]` | 모델 수정 |
| DELETE | `/api/admin/models/[modelId]` | 모델 삭제 |

**모델 생성 요청:**

```typescript
interface ModelCreateRequest {
  name: string;           // 모델 식별자
  displayName: string;    // 표시 이름
  provider: ModelProvider;
  endpoint?: string;      // API 엔드포인트
  apiKey?: string;        // API 키
  isActive?: boolean;
  isDefault?: boolean;
  temperature?: number;   // 0.0 ~ 2.0
  maxTokens?: number;
  systemPrompt?: string;
}
```

#### 3.3.4 RAG 파이프라인 관리

**임베딩 설정:**

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/rag/embeddings` | 임베딩 목록 |
| POST | `/api/admin/rag/embeddings` | 임베딩 추가 |
| PUT | `/api/admin/rag/embeddings/[id]` | 임베딩 수정 |
| DELETE | `/api/admin/rag/embeddings/[id]` | 임베딩 삭제 |

**벡터 DB 설정:**

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/rag/vectordb` | VectorDB 목록 |
| POST | `/api/admin/rag/vectordb` | VectorDB 추가 |
| PUT | `/api/admin/rag/vectordb/[id]` | VectorDB 수정 |
| DELETE | `/api/admin/rag/vectordb/[id]` | VectorDB 삭제 |

**청킹 설정:**

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/rag/chunks` | 청킹 설정 목록 |
| POST | `/api/admin/rag/chunks` | 청킹 설정 추가 |
| PUT | `/api/admin/rag/chunks/[id]` | 청킹 설정 수정 |
| DELETE | `/api/admin/rag/chunks/[id]` | 청킹 설정 삭제 |

**파서 설정:**

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/rag/parsers` | 파서 목록 |
| POST | `/api/admin/rag/parsers` | 파서 추가 |
| PUT | `/api/admin/rag/parsers/[id]` | 파서 수정 |
| DELETE | `/api/admin/rag/parsers/[id]` | 파서 삭제 |

**리랭커 설정:**

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/rag/rerankers` | 리랭커 목록 |
| POST | `/api/admin/rag/rerankers` | 리랭커 추가 |
| PUT | `/api/admin/rag/rerankers/[id]` | 리랭커 수정 |
| DELETE | `/api/admin/rag/rerankers/[id]` | 리랭커 삭제 |

**파이프라인 설정:**

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/admin/rag/pipelines` | 파이프라인 목록 |
| POST | `/api/admin/rag/pipelines` | 파이프라인 추가 |
| PUT | `/api/admin/rag/pipelines/[id]` | 파이프라인 수정 |
| DELETE | `/api/admin/rag/pipelines/[id]` | 파이프라인 삭제 |

**파이프라인 생성 요청:**

```typescript
interface PipelineCreateRequest {
  name: string;
  displayName: string;
  description?: string;
  embeddingId: string;    // 필수
  vectorDBId: string;     // 필수
  chunkId: string;        // 필수
  parserId?: string;
  rerankerId?: string;
  modelConfigId?: string;
  topK?: number;          // 기본값: 5
  scoreThreshold?: number; // 기본값: 0.7
  systemPrompt?: string;
  contextTemplate?: string;
  isActive?: boolean;
  isDefault?: boolean;
}
```

### 3.4 기타 API

#### 3.4.1 모델 조회

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/models` | 활성화된 모델 목록 |
| GET | `/api/models/configured` | 설정된 모델 목록 |

#### 3.4.2 그래프 정보

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/graph/info` | LangGraph 상태 정보 |

---

## 4. 프론트엔드 컴포넌트 명세

### 4.1 레이아웃 컴포넌트

#### 4.1.1 MainLayout

**경로:** `src/components/layout/MainLayout.tsx`

**Props:**

```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}
```

**구조:**

```
MainLayout
├── Header (상단 네비게이션)
│   ├── Logo (로고 - 클릭시 홈)
│   ├── Navigation (메뉴)
│   └── UserMenu (사용자 메뉴)
├── Sidebar (채팅 목록)
│   ├── NewChatButton
│   ├── ChatList
│   └── ChatGroups
└── MainContent (children)
```

### 4.2 채팅 컴포넌트

#### 4.2.1 ChatInterface

**경로:** `src/components/chat/ChatInterface.tsx`

**Props:**

```typescript
interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: Message[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}
```

**주요 기능:**

- 메시지 목록 표시
- 메시지 입력 및 전송
- 스트리밍 응답 처리
- 마크다운 렌더링
- 코드 블록 하이라이팅
- Excel 다운로드 기능

#### 4.2.2 ChatMessage

**경로:** `src/components/chat/ChatMessage.tsx`

**Props:**

```typescript
interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: Date;
  };
  isStreaming?: boolean;
}
```

**렌더링 로직:**

```
if (role === "user") {
  → 우측 정렬, 사용자 아이콘, 파란 배경
} else if (role === "assistant") {
  → 좌측 정렬, AI 아이콘, 회색 배경
  → 마크다운 렌더링 적용
  → 테이블 → Excel 다운로드 버튼
  → 코드 블록 → 복사 버튼
}
```

#### 4.2.3 ChatInput

**경로:** `src/components/chat/ChatInput.tsx`

**Props:**

```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

**기능:**

- 텍스트 입력
- Enter 키 전송 (Shift+Enter 줄바꿈)
- 전송 버튼
- 파일 첨부 (예정)

### 4.3 데이터 수집 컴포넌트

#### 4.3.1 DataCollectionFlow

**경로:** `src/components/chat/DataCollectionFlow.tsx`

**Props:**

```typescript
interface DataCollectionFlowProps {
  analysisTarget: BaseAnalysisTarget;
  onComplete: (data: CollectedData) => void;
  onRecollect: (target: BaseAnalysisTarget) => void;
}

interface BaseAnalysisTarget {
  productModel: string;  // 제품 모델명
  lotId: string;         // LOT ID
}

type CollectionStep =
  | "production_result"      // 생산 실적 조회
  | "lot_history"            // LOT 이력 조회
  | "defect_history"         // 불량 이력 조회
  | "spec_document"          // Spec 문서 조회
  | "analysis_standard"      // 분석 기준서 조회
  | "reference_document"     // 관련 근거 문서 조회
  | "quality_data";          // 품질 데이터 조회
```

**워크플로우 상태:**

```typescript
type FlowState =
  | "init"           // 초기 화면
  | CollectionStep   // 7단계 수집
  | "final_review";  // 최종 검토
```

**컴포넌트 구조:**

```
DataCollectionFlow
├── InitScreen (초기 화면)
│   ├── AnalysisTargetCard
│   ├── LOT 편집 패널
│   ├── 수집 단계 선택 체크박스
│   └── 데이터 수집 시작 버튼
├── CollectionStepScreen (수집 단계)
│   ├── StepHeader
│   ├── MockDataDisplay
│   ├── ActionButtons (다음/이전/처음으로)
│   └── ProgressIndicator
├── FinalReviewScreen (최종 검토)
│   ├── CollectedDataSummary
│   ├── 기본 분석 시작 버튼
│   └── 데이터 재수집 버튼
└── RecollectForm (재수집 폼)
    ├── ProductSelector
    ├── LOT ID 입력
    └── 재수집 시작 버튼
```

#### 4.3.2 AnalysisActionSidebar

**경로:** `src/components/chat/AnalysisActionSidebar.tsx`

**Props:**

```typescript
interface AnalysisActionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: AnalysisStage;
  onStageSelect: (stage: AnalysisStage) => void;
  completedStages: AnalysisStage[];
}

type AnalysisStage =
  | "data_review"        // 데이터수집 내용 확인
  | "primary_analysis"   // 1차분석 결과 확인
  | "customer_contact"   // 고객담당자 확인
  | "quality_review"     // 품질담당자/귀책부서 확인
  | "email_discussion"   // 분석 협의 메일발송
  | "submit_result";     // 분석결과 상신
```

**UI 구조:**

```
AnalysisActionSidebar (width: 320px)
├── Header (보라색 그라데이션)
│   ├── 제목: "기본분석 진행"
│   └── 닫기 버튼
├── ProgressSection
│   ├── 진행률 텍스트
│   └── 프로그레스 바
├── ActionButtonList
│   └── ActionButton × 6
│       ├── 아이콘 (상태별 색상)
│       ├── 라벨
│       ├── 설명
│       └── 상태 아이콘 (pending/in_progress/completed)
└── Footer
    └── 다음 단계로 / 분석 완료 버튼
```

### 4.4 관리자 컴포넌트

#### 4.4.1 AdminLayout

**경로:** `src/app/(admin)/layout.tsx`

**구조:**

```
AdminLayout
├── AdminSidebar
│   ├── 대시보드
│   ├── 사용자 관리
│   ├── 그룹 관리
│   ├── 모델 설정
│   ├── RAG 파이프라인
│   ├── 시스템 설정
│   └── 코드 관리
└── AdminContent (children)
```

#### 4.4.2 DataTable

**경로:** `src/components/admin/DataTable.tsx`

**Props:**

```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}
```

**기능:**

- 정렬 가능한 컬럼
- 검색 필터
- 페이지네이션
- 행 선택
- 커스텀 셀 렌더러

---

## 5. 워크플로우 명세

### 5.1 사용자 인증 워크플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  로그인 페이지  │───▶│  자격증명 확인  │───▶│  세션 생성    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                    │
                          ▼                    ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  인증 실패    │    │  권한 확인    │
                   │  (에러 메시지) │    │  (ADMIN/USER) │
                   └─────────────┘    └─────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │   ADMIN     │    │    USER     │    │   HOLDING   │
                   │  관리자 대시보드│    │   채팅 화면   │    │  대기 화면    │
                   └─────────────┘    └─────────────┘    └─────────────┘
```

### 5.2 채팅 메시지 처리 워크플로우

```
사용자 입력
    │
    ▼
┌─────────────────────────────────────────────┐
│              프론트엔드 처리                   │
│  1. 메시지 상태 업데이트                        │
│  2. UI에 사용자 메시지 표시                     │
│  3. 로딩 상태 활성화                           │
└─────────────────────────────────────────────┘
    │
    ▼
POST /api/chat
    │
    ▼
┌─────────────────────────────────────────────┐
│              Next.js API Route               │
│  1. 세션 인증 확인                             │
│  2. 사용자 메시지 DB 저장                       │
│  3. 채팅 제목 업데이트 (첫 메시지)               │
│  4. LangGraph 백엔드 호출                      │
└─────────────────────────────────────────────┘
    │
    ▼
POST /graph/chat/stream (LangGraph)
    │
    ▼
┌─────────────────────────────────────────────┐
│              LangGraph 처리                   │
│  1. 컨텍스트 구성                              │
│  2. RAG 검색 (필요시)                          │
│  3. LLM 추론                                  │
│  4. 스트리밍 응답 생성                          │
└─────────────────────────────────────────────┘
    │
    ▼ (SSE 스트리밍)
┌─────────────────────────────────────────────┐
│              응답 처리                         │
│  1. 청크 수신 및 UI 업데이트                    │
│  2. 완료 시 AI 응답 DB 저장                    │
│  3. 로딩 상태 해제                             │
└─────────────────────────────────────────────┘
```

### 5.3 RAG 파이프라인 처리 워크플로우

```
사용자 질의
    │
    ▼
┌─────────────────────────────────────────────┐
│              Query Processing                │
│  1. 질의 전처리                               │
│  2. 임베딩 벡터 생성                           │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│              Vector Search                   │
│  1. VectorDB에서 유사 문서 검색                 │
│  2. TopK 결과 반환 (scoreThreshold 적용)       │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│              Reranking (선택적)               │
│  1. 검색 결과 재순위화                          │
│  2. 최종 관련 문서 선정                         │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│              Context Construction            │
│  1. contextTemplate 적용                      │
│  2. 시스템 프롬프트 구성                        │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│              LLM Generation                  │
│  1. 컨텍스트 + 질의 → LLM                      │
│  2. 응답 생성                                  │
└─────────────────────────────────────────────┘
```

---

## 6. 상태 관리 명세

### 6.1 Zustand Store 구조

#### 6.1.1 ChatStore

```typescript
interface ChatStore {
  // State
  currentChatId: string | null;
  messages: Message[];
  isLoading: boolean;
  selectedModel: string;

  // View Mode
  viewMode: "chat" | "data_collection" | "analysis";
  analysisTarget: AnalysisTarget | null;

  // Analysis Stage
  currentAnalysisStage: AnalysisStage;
  completedAnalysisStages: AnalysisStage[];

  // Actions
  setCurrentChat: (chatId: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setAnalysisStage: (stage: AnalysisStage) => void;
  completeAnalysisStage: (stage: AnalysisStage) => void;
}
```

#### 6.1.2 UIStore

```typescript
interface UIStore {
  // Sidebar State
  sidebarOpen: boolean;
  analysisActionSidebarOpen: boolean;

  // Debug Mode
  debugMode: boolean;
  debugEvents: DebugEvent[];

  // Actions
  toggleSidebar: () => void;
  toggleAnalysisActionSidebar: () => void;
  setDebugMode: (enabled: boolean) => void;
  addDebugEvent: (event: DebugEvent) => void;
}
```

### 6.2 상태 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│                        Zustand Store                         │
│                                                              │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │   ChatStore   │◀──▶│    UIStore    │◀──▶│ AdminStore  │  │
│  └───────────────┘    └───────────────┘    └─────────────┘  │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │  채팅 컴포넌트  │    │  UI 컴포넌트   │    │ 관리자 화면  │  │
│  └───────────────┘    └───────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
│                                                              │
│  컴포넌트 → useStore() → 상태 읽기                            │
│  컴포넌트 → store.action() → 상태 업데이트                     │
│  상태 변경 → 자동 리렌더링                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 인증 및 권한 명세

### 7.1 인증 설정

**NextAuth.js 설정 (lib/auth.ts):**

```typescript
export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 이메일/비밀번호 검증
        // bcrypt로 해시 비교
        // User 객체 반환
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
};
```

### 7.2 권한 매트릭스

| 기능 | ADMIN | USER | HOLDING |
|------|:-----:|:----:|:-------:|
| 로그인 | O | O | O |
| 채팅 | O | O | X |
| 데이터 수집 | O | O | X |
| 기본분석 | O | O | X |
| 관리자 대시보드 | O | X | X |
| 사용자 관리 | O | X | X |
| 모델 설정 | O | X | X |
| RAG 파이프라인 관리 | O | X | X |
| 시스템 설정 | O | X | X |

### 7.3 API 권한 검증

```typescript
// 관리자 권한 확인 함수
async function checkAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return { authorized: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true };
}

// 사용 예시
export async function GET() {
  const authCheck = await checkAdmin();
  if (!authCheck.authorized) {
    return Response.json(
      { error: authCheck.error },
      { status: authCheck.error === "Unauthorized" ? 401 : 403 }
    );
  }
  // ... 비즈니스 로직
}
```

---

## 8. RAG 파이프라인 명세

### 8.1 파이프라인 구성 요소

```
┌─────────────────────────────────────────────────────────────┐
│                      RAG Pipeline                            │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Parser    │───▶│   Chunker   │───▶│  Embedding  │      │
│  │ (문서 파싱)  │    │ (텍스트 분할) │    │ (벡터 변환)  │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                              │               │
│                                              ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │     LLM     │◀───│  Reranker   │◀───│  VectorDB   │      │
│  │  (응답 생성) │    │ (재순위화)   │    │ (벡터 검색)  │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 구성 요소별 옵션

#### 8.2.1 임베딩 설정

| 프로바이더 | 모델 예시 | 차원 | 특징 |
|------------|----------|------|------|
| OLLAMA | nomic-embed-text | 768 | 로컬 실행 |
| OLLAMA | mxbai-embed-large | 1024 | 고성능 로컬 |
| OPENAI | text-embedding-3-small | 1536 | 클라우드 API |
| OPENAI | text-embedding-3-large | 3072 | 고정밀도 |
| HUGGINGFACE | all-MiniLM-L6-v2 | 384 | 경량 모델 |

#### 8.2.2 청킹 전략

| 전략 | 용도 | 파라미터 |
|------|------|----------|
| FIXED | 단순 분할 | chunkSize |
| RECURSIVE | 일반 텍스트 | chunkSize, chunkOverlap, separators |
| SEMANTIC | 의미 기반 | 임베딩 모델 필요 |
| MARKDOWN | 마크다운 문서 | 헤더 기반 분할 |
| HTML | 웹 페이지 | 태그 기반 분할 |
| CODE | 소스 코드 | 함수/클래스 단위 |

#### 8.2.3 벡터 DB 옵션

| DB 타입 | 특징 | 적합한 용도 |
|---------|------|-------------|
| CHROMA | 경량, 임베딩 내장 | 개발/테스트 |
| FAISS | 고성능, 메모리 기반 | 대규모 검색 |
| PGVECTOR | PostgreSQL 통합 | 기존 DB 활용 |
| QDRANT | 분산 처리, 필터링 | 프로덕션 |
| WEAVIATE | 그래프 지원 | 복잡한 관계 |
| PINECONE | 완전관리형 | 클라우드 네이티브 |

### 8.3 파이프라인 처리 시퀀스

```
1. 문서 업로드
   │
   ▼
2. Parser: 문서 → 텍스트 추출
   - PDF: PyPDF2/Unstructured
   - DOCX: python-docx
   - HTML: BeautifulSoup
   │
   ▼
3. Chunker: 텍스트 → 청크 분할
   - Recursive: 재귀적 분할
   - 오버랩: 문맥 유지
   │
   ▼
4. Embedding: 청크 → 벡터 변환
   - 벡터 차원: 768~3072
   - 정규화 적용
   │
   ▼
5. VectorDB: 벡터 저장
   - 인덱싱
   - 메타데이터 저장
   │
   ▼
[검색 시점]
   │
   ▼
6. Query Embedding: 질의 → 벡터
   │
   ▼
7. Similarity Search: 유사 벡터 검색
   - TopK: 상위 K개
   - Score Threshold: 최소 점수
   │
   ▼
8. Reranker (선택): 결과 재순위화
   - Cross-encoder 모델
   - 정밀도 향상
   │
   ▼
9. Context Construction: 프롬프트 구성
   - contextTemplate 적용
   - 시스템 프롬프트 결합
   │
   ▼
10. LLM Generation: 응답 생성
```

---

## 9. LLM 모델 통합 명세

### 9.1 지원 프로바이더

#### 9.1.1 Ollama (로컬)

```typescript
// 설정 예시
{
  provider: "OLLAMA",
  name: "qwen3:32b",
  displayName: "Qwen3 32B",
  endpoint: "http://localhost:11434",
  temperature: 0.7,
  maxTokens: 4096
}
```

**지원 모델:**

- Llama 3.x (8B, 70B)
- Qwen 2.5/3 (7B, 14B, 32B, 72B)
- Mistral (7B, Mixtral)
- Gemma 2 (9B, 27B)
- Phi-3 (3.8B, 14B)

#### 9.1.2 OpenAI

```typescript
// 설정 예시
{
  provider: "OPENAI",
  name: "gpt-4o",
  displayName: "GPT-4o",
  endpoint: "https://api.openai.com/v1",
  apiKey: "sk-...",
  temperature: 0.7,
  maxTokens: 4096
}
```

**지원 모델:**

- GPT-4o, GPT-4o-mini
- GPT-4 Turbo
- GPT-3.5 Turbo

#### 9.1.3 Anthropic

```typescript
// 설정 예시
{
  provider: "ANTHROPIC",
  name: "claude-3-5-sonnet-20241022",
  displayName: "Claude 3.5 Sonnet",
  endpoint: "https://api.anthropic.com",
  apiKey: "sk-ant-...",
  temperature: 0.7,
  maxTokens: 4096
}
```

**지원 모델:**

- Claude 3.5 Sonnet/Haiku
- Claude 3 Opus/Sonnet/Haiku

#### 9.1.4 Custom API

```typescript
// 설정 예시
{
  provider: "CUSTOM",
  name: "local-model",
  displayName: "Custom Local Model",
  endpoint: "http://localhost:8080/v1/chat/completions",
  systemPrompt: "You are a helpful assistant."
}
```

### 9.2 모델 선택 로직

```typescript
// 모델 우선순위
1. 사용자 명시적 선택
2. 채팅별 저장된 모델
3. 사용자 기본 설정
4. 시스템 기본 모델 (isDefault: true)
5. 첫 번째 활성 모델
```

### 9.3 스트리밍 응답 처리

```typescript
// LangGraph 백엔드 호출
const response = await fetch(`${BACKEND_URL}/graph/chat/stream`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: backendMessages,
    model: model || "qwen3:32b",
    debug: debug || false,
  }),
});

// SSE 스트리밍 파싱
const stream = new ReadableStream({
  async start(controller) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            // AI SDK 호환 형식으로 변환
            controller.enqueue(`0:${JSON.stringify(data.content)}\n`);
          }
          if (debug && data.type) {
            // 디버그 이벤트 전달
            controller.enqueue(`d:${JSON.stringify(data)}\n`);
          }
        }
      }
    }
  },
});
```

---

## 10. Human-in-the-Loop 데이터 수집 명세

### 10.1 수집 단계 정의

| 단계 | ID | 설명 | 데이터 소스 |
|------|-----|------|------------|
| 1 | production_result | 생산 실적 조회 | MES 시스템 |
| 2 | lot_history | LOT 이력 조회 | Tracking 시스템 |
| 3 | defect_history | 불량 이력 조회 | 품질관리 시스템 |
| 4 | spec_document | Spec 문서 조회 | 문서관리 시스템 |
| 5 | analysis_standard | 분석 기준서 조회 | 표준문서 DB |
| 6 | reference_document | 관련 근거 문서 조회 | 문서관리 시스템 |
| 7 | quality_data | 품질 데이터 조회 | SPC 시스템 |

### 10.2 수집 데이터 인터페이스

```typescript
interface CollectedData {
  productionResult?: ProductionResult;
  lotHistory?: LotHistory;
  defectHistory?: DefectHistory;
  specDocument?: SpecDocument;
  analysisStandard?: AnalysisStandard;
  referenceDocument?: ReferenceDocument;
  qualityData?: QualityData;
}

interface ProductionResult {
  date: string;
  line: string;
  productModel: string;
  lotId: string;
  targetQty: number;
  productQty: number;
  goodQty: number;
  defectQty: number;
  defectRate: number;
  operationTime: string;
  downtime: string;
  operator: string;
  defectDetails: DefectDetail[];
}

interface DefectDetail {
  code: string;
  name: string;
  count: number;
  rate: number;
}
```

### 10.3 LOT 관리 기능

#### 10.3.1 복수 LOT 입력

```typescript
// 상태
const [initLotIds, setInitLotIds] = useState<string[]>([analysisTarget.lotId]);
const [initLotInput, setInitLotInput] = useState("");

// LOT 추가
const addInitLot = () => {
  if (initLotInput && !initLotIds.includes(initLotInput)) {
    setInitLotIds([...initLotIds, initLotInput]);
    setInitLotInput("");
  }
};

// LOT 삭제
const removeInitLot = (lotId: string) => {
  if (initLotIds.length > 1) {
    setInitLotIds(initLotIds.filter((id) => id !== lotId));
  }
};
```

#### 10.3.2 수집 단계 선택

```typescript
// 단계별 활성화 상태
const [enabledSteps, setEnabledSteps] = useState<Record<CollectionStep, boolean>>({
  production_result: true,
  lot_history: true,
  defect_history: true,
  spec_document: true,
  analysis_standard: true,
  reference_document: true,
  quality_data: true,
});

// 단계 토글
const toggleStep = (stepId: CollectionStep) => {
  setEnabledSteps((prev) => ({
    ...prev,
    [stepId]: !prev[stepId],
  }));
};

// 다음 활성 단계 찾기
const findNextEnabledStep = (fromIndex: number): CollectionStep | "final_review" => {
  const stepOrder = [...] as CollectionStep[];
  for (let i = fromIndex; i < stepOrder.length; i++) {
    if (enabledSteps[stepOrder[i]]) {
      return stepOrder[i];
    }
  }
  return "final_review";
};
```

### 10.4 Mock 데이터 구조

**생산 실적 Mock:**

```typescript
export const PRODUCTION_RESULT: ProductionResult = {
  date: "2024-12-03",
  line: "OLED Line 1",
  productModel: "OLED_67_FHD",
  lotId: "LOT20241203001",
  targetQty: 1000,
  productQty: 980,
  goodQty: 950,
  defectQty: 30,
  defectRate: 3.06,
  operationTime: "08:00 ~ 20:00",
  downtime: "30분 (설비점검)",
  operator: "김생산",
  defectDetails: [
    { code: "D001", name: "픽셀 불량", count: 12, rate: 1.22 },
    { code: "D002", name: "색상 불균일", count: 8, rate: 0.82 },
    { code: "D003", name: "얼룩", count: 6, rate: 0.61 },
    { code: "D004", name: "스크래치", count: 4, rate: 0.41 },
  ],
};
```

---

## 11. 기본분석 워크플로우 명세

### 11.1 분석 단계 정의

| 단계 | ID | 설명 | 담당 |
|------|-----|------|------|
| 1 | data_review | 데이터수집 내용 확인 | 분석자 |
| 2 | primary_analysis | 1차분석 결과 확인 | AI + 분석자 |
| 3 | customer_contact | 고객담당자 확인 | 분석자 |
| 4 | quality_review | 품질담당자/귀책부서 확인 | 품질담당 |
| 5 | email_discussion | 분석 협의 메일발송 | 분석자 |
| 6 | submit_result | 분석결과 상신 | 분석자 |

### 11.2 단계별 프롬프트 생성

#### 11.2.1 고객담당자 확인

```typescript
export function getCustomerContactPrompt(): string {
  const contact = CUSTOMER_CONTACTS[0];
  return `## 고객 담당자 정보 확인

**고객사:** ${contact.company}
**담당자:** ${contact.name} (${contact.position})
**연락처:** ${contact.phone}
**이메일:** ${contact.email}

### 최근 이력
${contact.history.map(h =>
  `- ${h.date}: ${h.type} - ${h.description}`
).join('\n')}

고객사 담당자 정보를 확인했습니다. 분석 협의가 필요한 경우 연락 부탁드립니다.`;
}
```

#### 11.2.2 품질담당자/귀책부서 확인

```typescript
export function getQualityReviewPrompt(): string {
  const manager = QUALITY_MANAGERS[0];
  const dept = RESPONSIBLE_DEPARTMENTS[0];
  return `## 품질 담당자 및 귀책부서 정보

### 품질 담당자
- **담당자:** ${manager.name} (${manager.position})
- **부서:** ${manager.department}
- **담당영역:** ${manager.specialty}
- **연락처:** ${manager.phone}

### 귀책부서 정보
- **부서:** ${dept.name}
- **귀책유형:** ${dept.responsibilityType}
- **조치필요사항:** ${dept.actions.join(', ')}
- **예상처리기간:** ${dept.estimatedDays}일

품질 담당자와 귀책부서 정보를 확인했습니다.`;
}
```

#### 11.2.3 메일 발송

```typescript
export function getEmailDraftPrompt(): string {
  const template = EMAIL_TEMPLATES[0];
  return `## 분석 협의 메일 초안

**수신:** ${template.to.join(', ')}
**참조:** ${template.cc.join(', ')}
**제목:** ${template.subject}

---

${template.body}

---

위 메일을 검토해주시고, 수정이 필요한 부분이 있으면 말씀해주세요.`;
}
```

#### 11.2.4 결과 상신

```typescript
export function getApprovalRequestPrompt(): string {
  const approval = APPROVAL_TEMPLATES[0];
  return `## 분석결과 상신

**문서번호:** ${approval.documentNo}
**제목:** ${approval.title}
**기안일:** ${approval.createdDate}

### 결재라인
${approval.approvalLine.map(a =>
  `- ${a.role}: ${a.name} (${a.status})`
).join('\n')}

### 분석 결과 요약
${approval.summary}

### 개선 권고사항
${approval.recommendations.map((r, i) =>
  `${i+1}. ${r}`
).join('\n')}

### 첨부파일
${approval.attachments.join('\n')}

상신 문서를 확인해주시고, 승인 부탁드립니다.`;
}
```

### 11.3 상태 관리

```typescript
// 분석 단계 상태
const [currentAnalysisStage, setCurrentAnalysisStage] =
  useState<AnalysisStage>("primary_analysis");

const [completedAnalysisStages, setCompletedAnalysisStages] =
  useState<AnalysisStage[]>(["data_review"]);

// 단계 선택 핸들러
const handleAnalysisStageSelect = (stage: AnalysisStage) => {
  setCurrentAnalysisStage(stage);

  let prompt = "";
  switch (stage) {
    case "data_review":
      prompt = "수집된 데이터를 확인하고 분석을 시작합니다.";
      break;
    case "primary_analysis":
      prompt = "1차 분석 결과를 확인합니다.";
      break;
    case "customer_contact":
      prompt = getCustomerContactPrompt();
      break;
    case "quality_review":
      prompt = getQualityReviewPrompt();
      break;
    case "email_discussion":
      prompt = getEmailDraftPrompt();
      break;
    case "submit_result":
      prompt = getApprovalRequestPrompt();
      break;
  }

  if (prompt) {
    handleSubmit(prompt);
  }
};
```

### 11.4 UI 표시 상태

```typescript
// 단계별 상태 계산
const getStatus = (stageId: AnalysisStage) => {
  if (completedStages.includes(stageId)) return "completed";
  if (currentStage === stageId) return "in_progress";
  return "pending";
};

// 상태별 스타일
const getStatusColor = (status: string, isSelected: boolean) => {
  if (isSelected) return "bg-blue-50 border-blue-500 border-l-4";
  switch (status) {
    case "completed": return "bg-green-50 border-green-200";
    case "in_progress": return "bg-blue-50 border-blue-200";
    default: return "bg-white border-gray-200 hover:bg-gray-50";
  }
};

// 상태 아이콘
const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="text-green-500" />;
    case "in_progress": return <Clock className="text-blue-500 animate-pulse" />;
    default: return <AlertCircle className="text-gray-300" />;
  }
};
```

---

## 부록: 환경 변수 명세

### A.1 필수 환경 변수

```env
# 데이터베이스
DATABASE_URL="postgresql://user:password@localhost:5432/e1soft_llm"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 백엔드
BACKEND_URL="http://localhost:8000"
```

### A.2 선택적 환경 변수

```env
# OpenAI (선택)
OPENAI_API_KEY="sk-..."

# Anthropic (선택)
ANTHROPIC_API_KEY="sk-ant-..."

# Ollama (기본값: localhost:11434)
OLLAMA_HOST="http://localhost:11434"
```

---

**문서 끝**
