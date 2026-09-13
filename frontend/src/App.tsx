import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  BookOpen, 
  Send, 
  AlertCircle, 
  Loader2, 
  FileText, 
  ExternalLink,
} from 'lucide-react'
import { useReaderStore } from '@/store/useReaderStore'
import { AssistantReaderChat } from '@/components/AssistantReaderChat'

export default function App() {
  const {
    url,
    isExtracting,
    isStreaming,
    currentArticle,
    summaryText,
    errorMessage,
    setUrl,
    setCurrentArticle,
    appendSummaryText,
    setIsExtracting,
    setIsStreaming,
    setErrorMessage,
    reset
  } = useReaderStore()

  const [backendHealth, setBackendHealth] = useState<'checking' | 'ok' | 'fail'>('checking')

  // 检查后端健康状态 (验证全栈链路是否打通)
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(() => setBackendHealth('ok'))
      .catch(() => setBackendHealth('fail'))
  }, [])

  // 快捷填入示例链接
  const handleFillSample = () => {
    setUrl('https://python.org/blogs/')
  }

  /**
   * 核心函数：触发文章抓取并开启流式总结
   * 【前端学习重点】：这里完整展示了如何用浏览器原生 fetch 处理服务端的 SSE 流式数据！
   */
  const handleStartAnalysis = async () => {
    if (!url.trim()) return

    reset()
    setErrorMessage(null)
    setIsExtracting(true)

    try {
      // 1. 第一步：调用后端提取文章正文
      const extractRes = await fetch('/api/reader/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const extractJson = await extractRes.json()
      if (!extractRes.ok || extractJson.code !== 0) {
        throw new Error(extractJson.detail || '抓取文章失败，请检查链接或网络')
      }

      const article = extractJson.data
      setCurrentArticle(article)
      setIsExtracting(false)

      // 2. 第二步：发起 SSE 流式总结请求
      setIsStreaming(true)
      const streamRes = await fetch('/api/reader/stream-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
        }),
      })

      if (!streamRes.ok || !streamRes.body) {
        throw new Error('流式连接建立失败')
      }

      // 3. 第三步：逐字节读取流数据（打字机效果的核心）
      const reader = streamRes.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // 保持未完整的末尾数据

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const dataStr = trimmed.replace('data:', '').trim()
          if (dataStr === '[DONE]') {
            break
          }

          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.text) {
              appendSummaryText(parsed.text)
            } else if (parsed.error) {
              setErrorMessage(parsed.error)
            }
          } catch {
            // 忽略非 JSON 碎片
          }
        }
      }

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setErrorMessage(errorMsg)
    } finally {
      setIsExtracting(false)
      setIsStreaming(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* 顶部导航栏 */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                AI 网页研报速读
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  全栈 MVP
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              <span className={`w-2 h-2 rounded-full ${backendHealth === 'ok' ? 'bg-emerald-500 animate-pulse' : backendHealth === 'checking' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span>FastAPI 后端: {backendHealth === 'ok' ? '已连接' : backendHealth === 'checking' ? '检测中' : '离线'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        {/* 输入面板 */}
        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <h2 className="text-lg font-medium text-zinc-200 mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            输入任意文章或研报链接
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            支持微信公众号、掘金、知乎专栏、技术博客、海外 Medium/Substack 等公开网页
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isExtracting && !isStreaming && handleStartAnalysis()}
                placeholder="https://example.com/article/123"
                className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <button
              onClick={handleStartAnalysis}
              disabled={isExtracting || isStreaming || !url.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>抓取正文中...</span>
                </>
              ) : isStreaming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>AI 思考生成中...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>一键智能萃取</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <span>试一试示例：</span>
            <button
              onClick={handleFillSample}
              className="text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              Python 官方博客 <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </section>

        {/* 双栏展示区：左侧原文信息，右侧 AI 分析结果 */}
        {(currentArticle || summaryText || isExtracting || isStreaming) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* 左侧：文章原貌概览 */}
            <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  原文抓取快照
                </span>
                {currentArticle && (
                  <span className="text-[11px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                    约 {currentArticle.char_count} 字符
                  </span>
                )}
              </div>

              {currentArticle ? (
                <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                  <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
                    {currentArticle.title}
                  </h3>
                  <a
                    href={currentArticle.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-400 hover:underline truncate flex items-center gap-1"
                  >
                    {currentArticle.url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  <div className="mt-2 text-xs text-zinc-400 bg-zinc-950/60 border border-zinc-800/50 p-3 rounded-xl flex-1 overflow-y-auto max-h-[480px] font-mono whitespace-pre-wrap leading-relaxed">
                    {currentArticle.content}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 py-12 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  <span className="text-xs">正在分析提取网页 HTML...</span>
                </div>
              )}
            </div>

            {/* 右侧：AI 智能速读报告与多轮交互 (基于 assistant-ui) */}
            <div className="lg:col-span-7 flex flex-col min-h-[550px]">
              <AssistantReaderChat
                articleTitle={currentArticle?.title}
                articleContent={currentArticle?.content}
                summaryText={summaryText}
                isSummaryStreaming={isStreaming}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
