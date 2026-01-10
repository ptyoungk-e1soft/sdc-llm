# e1soft LLM 운영 매뉴얼

## 목차
1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [설치 및 배포](#2-설치-및-배포)
3. [관리자 기능](#3-관리자-기능)
4. [사용자 관리](#4-사용자-관리)
5. [모델 관리](#5-모델-관리)
6. [RAG 시스템 설정](#6-rag-시스템-설정)
7. [코드 편집](#7-코드-편집)
8. [모니터링 및 로깅](#8-모니터링-및-로깅)
9. [백업 및 복구](#9-백업-및-복구)
10. [문제 해결](#10-문제-해결)

---

## 1. 시스템 아키텍처

### 1.1 전체 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 (브라우저)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 프론트엔드 (3000)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Pages     │  │    API      │  │    Server Components    │ │
│  │  (React)    │  │   Routes    │  │      (Next.js)          │ │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘ │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │   Ollama     │ │   LangServe     │
│   (Database)    │ │  (Local LLM) │ │   (Backend)     │
└─────────────────┘ └──────────────┘ └─────────────────┘
```

### 1.2 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| **Frontend** | Next.js | 16.1.1 |
| | React | 19.2.3 |
| | TypeScript | 5.x |
| | Tailwind CSS | 4.x |
| **State** | Zustand | 5.0.9 |
| **Auth** | NextAuth.js | 5.0.0-beta |
| **ORM** | Prisma | 6.19.1 |
| **Database** | PostgreSQL | 14+ |
| **LLM** | Ollama | Latest |

### 1.3 디렉토리 구조

```
frontend/
├── prisma/                 # Prisma 스키마 및 마이그레이션
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # 인증 페이지 그룹
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/         # 메인 앱 페이지 그룹
│   │   │   └── chat/
│   │   ├── (admin)/        # 관리자 페이지 그룹
│   │   │   └── admin/
│   │   └── api/            # API Routes
│   ├── components/         # React 컴포넌트
│   │   ├── chat/           # 채팅 관련 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   └── ui/             # 공통 UI 컴포넌트
│   ├── stores/             # Zustand 스토어
│   ├── data/               # 목업 데이터
│   └── lib/                # 유틸리티 라이브러리
├── docs/                   # 문서
└── public/                 # 정적 파일
```

---

## 2. 설치 및 배포

### 2.1 사전 요구사항

```bash
# Node.js 18+ 설치 확인
node --version  # v18.0.0 이상

# PostgreSQL 14+ 설치 확인
psql --version  # 14.0 이상

# Ollama 설치 (선택사항)
ollama --version
```

### 2.2 환경 설정

`.env` 파일 생성:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/e1soft_llm?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Ollama (선택사항)
OLLAMA_HOST="http://localhost:11434"

# LangServe Backend (선택사항)
LANGSERVE_URL="http://localhost:8000"
```

### 2.3 설치 절차

```bash
# 1. 의존성 설치
npm install

# 2. Prisma 클라이언트 생성
npx prisma generate

# 3. 데이터베이스 마이그레이션
npx prisma migrate deploy

# 4. 초기 관리자 계정 생성 (선택사항)
npx prisma db seed

# 5. 개발 서버 시작
npm run dev

# 또는 프로덕션 빌드
npm run build
npm start
```

### 2.4 프로덕션 배포

```bash
# 빌드
npm run build

# PM2로 실행 (권장)
pm2 start npm --name "e1soft-llm" -- start

# 또는 systemd 서비스로 등록
sudo systemctl start e1soft-llm
```

### 2.5 Docker 배포 (선택사항)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Docker 빌드 및 실행
docker build -t e1soft-llm .
docker run -p 3000:3000 --env-file .env e1soft-llm
```

---

## 3. 관리자 기능

### 3.1 관리자 대시보드 접근

1. 관리자 계정으로 로그인
2. 헤더의 **⚙ (설정)** 아이콘 클릭
3. 관리자 대시보드 접속

> **URL**: `http://localhost:3000/admin`

### 3.2 대시보드 통계

| 통계 항목 | 설명 |
|-----------|------|
| **Total Users** | 등록된 전체 사용자 수 |
| **Total Chats** | 생성된 전체 대화 수 |
| **Total Messages** | 전송된 전체 메시지 수 |

### 3.3 관리자 메뉴 구조

```
관리자
├── 대시보드 (/admin)
├── 사용자 관리 (/admin/users)
├── 그룹 관리 (/admin/groups)
├── LLM 설정 (/admin/settings)
├── RAG 설정 (/admin/rag)
└── 코드 편집 (/admin/code)
```

---

## 4. 사용자 관리

### 4.1 사용자 목록 조회

**경로**: `/admin/users`

표시 정보:
- 이름
- 이메일
- 역할 (ADMIN/USER/HOLDING)
- 그룹
- 대화 수
- 상태 (활성/비활성)
- 생성일

### 4.2 사용자 생성

1. **+ 사용자 추가** 버튼 클릭
2. 정보 입력:
   - 이름 (필수)
   - 이메일 (필수, 고유)
   - 비밀번호 (필수, 8자 이상)
   - 역할 (ADMIN/USER/HOLDING)
   - 그룹 (선택)
3. **저장** 클릭

### 4.3 사용자 권한 (역할)

| 역할 | 권한 |
|------|------|
| **ADMIN** | 전체 관리 기능 접근, 시스템 설정 변경 |
| **USER** | 채팅 및 분석 기능 사용 |
| **HOLDING** | 제한된 접근 (승인 대기) |

### 4.4 사용자 비활성화

1. 사용자 목록에서 해당 사용자 찾기
2. **활성** 토글 클릭하여 비활성화
3. 비활성화된 사용자는 로그인 불가

### 4.5 사용자 삭제

1. 사용자 목록에서 **🗑 삭제** 버튼 클릭
2. 확인 대화상자에서 **삭제** 클릭

> **주의**: 사용자 삭제 시 관련 대화 및 메시지도 함께 삭제됩니다.

---

## 5. 모델 관리

### 5.1 LLM 설정 페이지

**경로**: `/admin/settings`

### 5.2 기본 모델 설정

```
기본 모델 설정
───────────────────────────────────
기본 모델: [Ollama 모델 선택 ▼]

전역 설정:
- Temperature: [0.7]
- Max Tokens: [4096]
- System Prompt: [...]

Ollama Host URL: [http://localhost:11434]
```

### 5.3 커스텀 모델 추가

1. **+ 모델 추가** 버튼 클릭
2. 모델 정보 입력:

| 필드 | 설명 | 예시 |
|------|------|------|
| **이름** | 모델 식별자 | `gpt-4` |
| **표시 이름** | UI 표시명 | `GPT-4 Turbo` |
| **제공자** | 모델 제공자 | OLLAMA/OPENAI/ANTHROPIC/CUSTOM |
| **Endpoint** | API 엔드포인트 | `https://api.openai.com/v1` |
| **API Key** | 인증 키 | `sk-...` |
| **Temperature** | 응답 창의성 | `0.7` |
| **Max Tokens** | 최대 토큰 수 | `4096` |
| **System Prompt** | 시스템 프롬프트 | `You are a helpful assistant.` |

3. **저장** 클릭

### 5.4 Ollama 모델 관리

```bash
# 사용 가능한 모델 목록
ollama list

# 모델 다운로드
ollama pull llama2
ollama pull codellama
ollama pull mistral

# 모델 삭제
ollama rm model-name
```

### 5.5 기본 모델 지정

1. 모델 목록에서 해당 모델 찾기
2. **기본 모델로 설정** 토글 활성화
3. 기존 기본 모델은 자동 해제

---

## 6. RAG 시스템 설정

### 6.1 RAG 설정 페이지

**경로**: `/admin/rag`

### 6.2 탭 구조

```
┌─────────┬───────────┬──────────┬──────────┬─────────┬───────────┐
│ Pipeline│ Embedding │ VectorDB │ Chunking │ Parser  │ Reranker  │
└─────────┴───────────┴──────────┴──────────┴─────────┴───────────┘
```

### 6.3 Embedding 설정

**지원 제공자**:
- OLLAMA
- OPENAI
- HUGGINGFACE
- CUSTOM

**설정 항목**:
| 필드 | 설명 |
|------|------|
| 이름 | 설정 식별자 |
| 모델 | 임베딩 모델명 (예: `text-embedding-ada-002`) |
| 차원 | 벡터 차원 수 (예: 1536) |
| API Key | 인증 키 |
| Endpoint | API 엔드포인트 |

### 6.4 Vector DB 설정

**지원 벡터 DB**:
| DB | 설명 |
|----|------|
| **CHROMA** | 경량 임베딩 DB |
| **FAISS** | Facebook AI Similarity Search |
| **PGVECTOR** | PostgreSQL 벡터 확장 |
| **QDRANT** | 고성능 벡터 검색 엔진 |
| **WEAVIATE** | 오픈소스 벡터 DB |
| **PINECONE** | 관리형 벡터 DB |

**설정 항목**:
- Collection/Index 이름
- Host URL
- API Key
- 연결 설정

### 6.5 Chunking 설정

**전략 유형**:
| 전략 | 설명 |
|------|------|
| **FIXED** | 고정 크기 청킹 |
| **RECURSIVE** | 재귀적 문자 분할 |
| **SEMANTIC** | 의미 기반 분할 |
| **MARKDOWN** | 마크다운 구조 기반 |
| **HTML** | HTML 구조 기반 |
| **CODE** | 코드 구문 기반 |

**설정 항목**:
- Chunk Size (예: 1000)
- Chunk Overlap (예: 200)
- Separator

### 6.6 Parser 설정

**지원 파서**:
- DEFAULT
- UNSTRUCTURED
- PYPDF
- DOCX
- MARKDOWN
- HTML

### 6.7 Reranker 설정

**지원 Reranker**:
| 유형 | 설명 |
|------|------|
| **NONE** | Reranking 미적용 |
| **COHERE** | Cohere Rerank API |
| **CROSSENCODER** | Cross-Encoder 모델 |
| **COLBERT** | ColBERT 모델 |
| **CUSTOM** | 커스텀 Reranker |

### 6.8 Pipeline 생성

1. **+ 파이프라인 추가** 클릭
2. 구성 요소 선택:
   - Embedding 선택
   - Vector DB 선택
   - Chunking 전략 선택
   - Parser 선택
   - Reranker 선택 (선택사항)
3. 파라미터 설정:
   - Top K (검색 결과 수)
   - Score Threshold (최소 점수)
   - System Prompt
   - Context Template

---

## 7. 코드 편집

### 7.1 코드 편집기 접근

**경로**: `/admin/code`

### 7.2 편집 가능 파일

```
backend/
├── chains/          # LangChain 체인 파일
│   └── *.py
├── graphs/          # LangGraph 그래프 파일
│   └── *.py
└── routes/          # API 라우트 파일
    └── *.py
```

### 7.3 편집기 기능

- **파일 탐색기**: 좌측 패널에서 파일 선택
- **Monaco Editor**: VS Code 기반 편집기
- **구문 강조**: Python 문법 하이라이팅
- **자동 저장 알림**: 변경 사항 추적

### 7.4 파일 저장

1. 코드 수정 후 **저장** 버튼 클릭
2. **자동 리로드** 체크 시 백엔드 자동 재시작

> **주의**: 코드 변경은 시스템에 직접 영향을 미칩니다. 신중하게 수정하세요.

---

## 8. 모니터링 및 로깅

### 8.1 로그 위치

```bash
# Next.js 로그
./logs/nextjs.log

# PM2 로그 (PM2 사용 시)
pm2 logs e1soft-llm

# Docker 로그 (Docker 사용 시)
docker logs e1soft-llm
```

### 8.2 데이터베이스 모니터링

```bash
# Prisma Studio (개발 환경)
npx prisma studio

# PostgreSQL 직접 접속
psql -U user -d e1soft_llm
```

### 8.3 성능 모니터링

**LangGraph Debug Panel** 기능:
- 현재 실행 노드
- 토큰 사용량 (Total Tokens, TTFT, Tokens/sec)
- 실행 시간

### 8.4 헬스체크

```bash
# 서버 상태 확인
curl http://localhost:3000/api/health

# Ollama 상태 확인
curl http://localhost:11434/api/tags
```

---

## 9. 백업 및 복구

### 9.1 데이터베이스 백업

```bash
# PostgreSQL 백업
pg_dump -U user -d e1soft_llm > backup_$(date +%Y%m%d).sql

# 압축 백업
pg_dump -U user -d e1soft_llm | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 9.2 데이터베이스 복구

```bash
# 복구
psql -U user -d e1soft_llm < backup_20241204.sql

# 압축 파일 복구
gunzip -c backup_20241204.sql.gz | psql -U user -d e1soft_llm
```

### 9.3 자동 백업 설정

```bash
# crontab 설정
crontab -e

# 매일 새벽 2시 백업
0 2 * * * pg_dump -U user -d e1soft_llm | gzip > /backup/e1soft_$(date +\%Y\%m\%d).sql.gz
```

### 9.4 백업 대상

| 항목 | 위치 | 중요도 |
|------|------|--------|
| 데이터베이스 | PostgreSQL | 높음 |
| 환경 설정 | `.env` | 높음 |
| 코드 변경사항 | `backend/` | 중간 |
| 로그 파일 | `logs/` | 낮음 |

---

## 10. 문제 해결

### 10.1 일반적인 문제

#### 로그인 불가
```bash
# 세션 문제 확인
# .env의 NEXTAUTH_SECRET 확인
echo $NEXTAUTH_SECRET

# 데이터베이스 연결 확인
npx prisma db pull
```

#### 데이터베이스 연결 오류
```bash
# PostgreSQL 서비스 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U user -d e1soft_llm -c "SELECT 1"
```

#### Ollama 연결 오류
```bash
# Ollama 서비스 확인
systemctl status ollama

# API 테스트
curl http://localhost:11434/api/tags
```

### 10.2 성능 문제

#### 느린 응답
1. Ollama 모델 크기 확인 (작은 모델 사용 권장)
2. Max Tokens 값 조정
3. 데이터베이스 인덱스 확인

#### 메모리 부족
```bash
# 메모리 사용량 확인
free -h

# Ollama 메모리 사용량
ollama ps
```

### 10.3 오류 코드

| 코드 | 설명 | 해결책 |
|------|------|--------|
| 401 | 인증 실패 | 로그인 상태 확인 |
| 403 | 권한 없음 | 관리자 권한 확인 |
| 500 | 서버 오류 | 로그 확인 |
| 502 | 백엔드 연결 실패 | LangServe 상태 확인 |

### 10.4 로그 분석

```bash
# 오류 로그 검색
grep -i "error" logs/nextjs.log

# 최근 로그 확인
tail -f logs/nextjs.log
```

### 10.5 긴급 복구 절차

1. **서비스 중지**
   ```bash
   pm2 stop e1soft-llm
   ```

2. **최근 백업 복원**
   ```bash
   psql -U user -d e1soft_llm < latest_backup.sql
   ```

3. **서비스 재시작**
   ```bash
   pm2 restart e1soft-llm
   ```

4. **상태 확인**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 부록: 환경 변수 참조

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `DATABASE_URL` | ✓ | PostgreSQL 연결 문자열 | `postgresql://...` |
| `NEXTAUTH_SECRET` | ✓ | 세션 암호화 키 (32자+) | `your-secret-key` |
| `NEXTAUTH_URL` | ✓ | 애플리케이션 URL | `http://localhost:3000` |
| `OLLAMA_HOST` | | Ollama API 호스트 | `http://localhost:11434` |
| `LANGSERVE_URL` | | LangServe 백엔드 URL | `http://localhost:8000` |

---

**문서 버전**: 1.0
**최종 수정일**: 2024-12-04
**작성자**: e1soft 개발팀
