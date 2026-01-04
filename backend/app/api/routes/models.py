from fastapi import APIRouter, HTTPException
import httpx

from app.config import settings

router = APIRouter()


@router.get("")
async def list_models():
    """Ollama에서 사용 가능한 모델 목록 조회"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.OLLAMA_HOST}/api/tags")
            response.raise_for_status()
            data = response.json()

            models = []
            for model in data.get("models", []):
                models.append(
                    {
                        "name": model.get("name", ""),
                        "size": model.get("size", 0),
                        "modified_at": model.get("modified_at", ""),
                        "digest": model.get("digest", "")[:12] if model.get("digest") else "",
                    }
                )

            return {"models": models}
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Ollama 서버에 연결할 수 없습니다: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{model_name}/pull")
async def pull_model(model_name: str):
    """새 모델 다운로드 (Ollama pull)"""
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/pull",
                json={"name": model_name, "stream": False},
            )
            response.raise_for_status()
            return {"status": "success", "message": f"{model_name} 모델 다운로드 완료"}
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Ollama 서버에 연결할 수 없습니다: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{model_name}/info")
async def get_model_info(model_name: str):
    """특정 모델의 상세 정보 조회"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/show", json={"name": model_name}
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Ollama 서버에 연결할 수 없습니다: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
