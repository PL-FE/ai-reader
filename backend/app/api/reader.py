"""
文章阅读与解析 API 路由 (Reader API)
-----------------------------------
【前端概念类比】：
类似于 Express 的 `router.post('/api/extract')` 或 Next.js 中的 `app/api/route.ts`。
重点关注：FastAPI 中的 Pydantic Schema 充当强类型的入参验证，不合法的入参会被自动 422 拦截。
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl
from app.services.extractor import extract_article_from_url
from app.services.llm import stream_article_analysis, stream_article_chat

router = APIRouter(prefix="/reader", tags=["文章阅读器"])

# 1. 定义入参契约 (类似 TypeScript 中的 interface ExtractRequest { url: string })
class ExtractRequest(BaseModel):
    url: str

class SummaryRequest(BaseModel):
    title: str
    content: str

class ChatMessagePayload(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    title: str | None = None
    content: str | None = None
    messages: list[ChatMessagePayload]

@router.post("/extract")
async def extract_url(payload: ExtractRequest):
    """
    抓取并提取指定网页的正文与元信息
    """
    try:
        data = await extract_article_from_url(payload.url)
        return {"code": 0, "message": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stream-summary")
async def stream_summary(payload: SummaryRequest):
    """
    【核心流式接口】：使用 Server-Sent Events (text/event-stream) 格式源源不断向前端推送文字
    【前端对应】：前端使用 `fetch` 搭配 `res.body.getReader()` 进行逐字节解码呈现打字机效果
    """
    generator = stream_article_analysis(payload.title, payload.content)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", # 禁用 Nginx 缓冲，确保毫秒级流出
        }
    )

@router.post("/stream-chat")
async def stream_chat(payload: ChatRequest):
    """
    【多轮对话流式接口】：结合当前研报正文，处理来自 assistant-ui 的实时追问流
    """
    msg_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
    generator = stream_article_chat(payload.title, payload.content, msg_dicts)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

