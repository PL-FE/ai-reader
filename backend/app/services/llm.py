"""
大模型驱动服务 (LLM Service)
-----------------------------
【前端概念类比】：
类似于前端封装的 API 请求层（比如 `request.ts`），
但在后端，我们使用 `async generator`（异步生成器 `yield`），
实现 Server-Sent Events (SSE) 服务端推送，源源不断向前端吐字。
"""

import json
import asyncio
from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.core.config import settings

def get_ai_client() -> AsyncOpenAI:
    """初始化 OpenAI 兼容客户端"""
    return AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY or "dummy_key",
        base_url=settings.OPENAI_BASE_URL,
    )

async def stream_article_analysis(title: str, content: str) -> AsyncGenerator[str, None]:
    """
    流式分析文章，生成核心摘要、关键要点与思维导图
    【技术亮点】：使用 Python 的 `yield` 关键字，每次产生一段文字就立刻推送到网络通道！
    """
    # 如果用户尚未配置真实的 API Key，自动启用高质量本地演示生成器（保证初次体验零门槛）
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.strip() == "":
        mock_chunks = [
            f"### 📑 《{title}》核心速读简报\n\n",
            "**一、 核心论点聚焦**\n",
            "- 本文深入剖析了当前技术演进的关键瓶颈与解决方案。\n",
            "- 核心主张：技术选型应以研发交付效率与长期维护性为首要考量。\n",
            "- 架构建议：采用前后端职责清晰的现代双层架构，降低跨系统通信消耗。\n\n",
            "**二、 关键洞察（Key Takeaways）**\n",
            "1. **轻量与解耦**：避免盲目引入过重的基础设施，小步快跑验证商业与工程价值。\n",
            "2. **全栈心智统一**：前端专注于交互体验与状态渲染，后端聚焦数据流转与算力编排。\n",
            "3. **拥抱 AI 范式**：将传统业务流与大模型流式推理无缝结合，提升终端用户满意度。\n\n",
            "**三、 结构化知识要点**\n",
            "```text\n",
            f"文章核心主题: {title}\n",
            f"字数统计: 约 {len(content)} 字符\n",
            "推荐阅读深度: 精读核心段落，关注架构实践细节\n",
            "```\n\n",
            "*(💡 提示：检测到当前未配置 OPENAI_API_KEY，以上为本地高拟真流式演示。在 backend/.env 中填入真实 Key 即可切换为实时大模型思考！)*"
        ]
        for chunk in mock_chunks:
            # 模拟大模型思考与打字机输出延迟
            await asyncio.sleep(0.08)
            # 以 SSE 规范格式返回：data: <内容>\n\n
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
        return

    # 如果配置了真实 API Key，调用真实大模型（如 DeepSeek 或 OpenAI）
    client = get_ai_client()
    system_prompt = (
        "你是一个顶尖的技术研报与深度文章分析专家。请对用户提供的文章正文进行高密度的结构化拆解：\n"
        "1. 核心论点（一句话总结）；\n"
        "2. 3 个最具价值的关键洞察；\n"
        "3. 核心思维大纲或知识框架；\n"
        "输出风格使用严谨、有条理的 Markdown。"
    )

    user_prompt = f"文章标题：《{title}》\n\n文章正文节选：\n{content[:4000]}"

    try:
        response = await client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            temperature=0.3,
        )

        async for chunk in response:
            content_delta = chunk.choices[0].delta.content or ""
            if content_delta:
                yield f"data: {json.dumps({'text': content_delta}, ensure_ascii=False)}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        error_msg = f"大模型接口请求异常: {str(e)}"
        yield f"data: {json.dumps({'error': error_msg}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"


async def stream_article_chat(
    title: str | None,
    content: str | None,
    messages: list[dict[str, str]]
) -> AsyncGenerator[str, None]:
    """
    针对文章正文与上下文进行多轮流式追问（供 Assistant-UI 对话流调用）
    """
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.strip() == "":
        latest_question = messages[-1].get("content", "这个问题") if messages else "这个问题"
        mock_reply_chunks = [
            f"针对您关于《{title or '研报'}》的追问「**{latest_question}**」：\n\n",
            "1. **核心要点对应**：根据文章上下文，核心重点在于降低认知负荷与提升全流程敏捷交付效率；\n",
            "2. **架构实践建议**：采用分层治理策略，前台轻量接入标准 AI UI 交互规范，后台统一调度安全网关与大模型；\n",
            "3. **风险把控**：关注长会话上下文 token 消耗与防幻觉校验机制。\n\n",
            "*(💡 提示：当前处于演示环境，在 backend/.env 中填入真实 API Key 即可实时多轮对话！)*"
        ]
        for chunk in mock_reply_chunks:
            await asyncio.sleep(0.08)
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
        return

    client = get_ai_client()
    context_prompt = (
        f"你是一位资深技术研报分析专家与 AI 助手。用户正在就研报《{title or '研报'}》向你提问。\n"
        f"请基于以下文章上下文，准确、专业、严谨地用 Markdown 格式解答用户的问题：\n\n"
        f"【文章正文（节选）】\n{content[:4000] if content else '（无上下文）'}"
    )

    full_messages = [{"role": "system", "content": context_prompt}]
    for msg in messages:
        role = msg.get("role", "user")
        # 兼容 assistant-ui 角色
        if role not in ("system", "user", "assistant"):
            role = "user"
        full_messages.append({"role": role, "content": msg.get("content", "")})

    try:
        response = await client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=full_messages,
            stream=True,
            temperature=0.4,
        )
        async for chunk in response:
            content_delta = chunk.choices[0].delta.content or ""
            if content_delta:
                yield f"data: {json.dumps({'text': content_delta}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_msg = f"对话流请求异常: {str(e)}"
        yield f"data: {json.dumps({'error': error_msg}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

