"""
网页内容抽取服务 (Extractor Service)
-----------------------------------
【前端概念类比】：
类似于前端爬虫中的 DOM 解析，但比 cheerio 更智能。
普通的网页充满了导航栏、侧边广告、页脚版权等“噪音”，
我们使用 `trafilatura` 库，它能像“阅读模式”一样，自动从 HTML 中剔除无关标签，
精准提取出文章的真实标题、正文纯文本与 Markdown 格式。
"""

import httpx
import trafilatura
from typing import Dict, Any

async def extract_article_from_url(url: str) -> Dict[str, Any]:
    """
    输入网页 URL，异步下载 HTML 并提取出文章标题与纯净正文
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
    }

    # 1. 异步发起网络请求（类似前端的 async fetch）
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            raise ValueError(f"无法访问该网页，HTTP 状态码: {response.status_code}")
        html_content = response.text

    # 2. 智能提取正文内容
    extracted_text = trafilatura.extract(
        html_content,
        include_links=False,
        include_images=False,
        output_format="txt"
    )

    # 3. 提取网页元信息（标题、发布时间等）
    metadata = trafilatura.extract_metadata(html_content)
    title = metadata.title if metadata and metadata.title else "未命名文章"

    if not extracted_text:
        # 如果常规解析失败，尝试回退提取
        raise ValueError("未能从该网页提取出有效的文章正文内容，请检查链接或权限。")

    return {
        "url": url,
        "title": title,
        "content": extracted_text,
        "char_count": len(extracted_text)
    }
