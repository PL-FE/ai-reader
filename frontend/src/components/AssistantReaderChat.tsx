import React, { useMemo, useState } from 'react'
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
} from '@assistant-ui/react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User, Send, StopCircle, Copy, Check, MessageSquare, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface AssistantReaderChatProps {
  articleTitle?: string
  articleContent?: string
  summaryText: string
  isSummaryStreaming: boolean
}

// 供 MessagePrimitive 内部多轮追问使用的 Markdown 富文本渲染器
const AssistantMarkdown = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      smooth
      className="text-sm leading-relaxed text-zinc-200 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1]:text-base [&>h1]:font-bold [&>h1]:text-white [&>h1]:my-2 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:text-purple-300 [&>h2]:my-2 [&>p]:mb-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&>li]:mb-1 [&>blockquote]:border-l-2 [&>blockquote]:border-purple-500 [&>blockquote]:bg-purple-950/20 [&>blockquote]:pl-3 [&>blockquote]:py-1 [&>blockquote]:my-2 [&>blockquote]:rounded-r [&>blockquote]:text-zinc-400 [&>strong]:text-purple-200 [&>strong]:font-semibold [&>table]:w-full [&>table]:text-xs [&>table]:border [&>table]:border-zinc-800 [&>table]:my-2 [&>th]:bg-zinc-800 [&>th]:p-2 [&>td]:p-2 [&>td]:border-t [&>td]:border-zinc-800 [&>pre]:p-3 [&>pre]:my-2 [&>pre]:rounded-xl [&>pre]:bg-zinc-950 [&>pre]:border [&>pre]:border-zinc-800/80 [&>pre]:overflow-x-auto [&>code]:font-mono"
    />
  )
}

export const AssistantReaderChat: React.FC<AssistantReaderChatProps> = ({
  articleTitle,
  articleContent,
  summaryText,
  isSummaryStreaming,
}) => {
  const [copied, setCopied] = useState(false)

  // 1. 配置 assistant-ui 的本地多轮问答运行时 (ChatModelAdapter)
  const adapter = useMemo<ChatModelAdapter>(() => {
    return {
      async *run({ messages, abortSignal }) {
        const payloadMessages = messages.map((m) => {
          let text = ''
          for (const part of m.content) {
            if (part.type === 'text') {
              text += part.text
            }
          }
          return {
            role: m.role,
            content: text,
          }
        })

        const res = await fetch('/api/reader/stream-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: articleTitle,
            content: articleContent,
            messages: payloadMessages,
          }),
          signal: abortSignal,
        })

        if (!res.ok || !res.body) {
          throw new Error(`请求失败: ${res.statusText}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let accumulatedText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue

            const dataStr = trimmed.replace('data:', '').trim()
            if (dataStr === '[DONE]') break

            try {
              const parsed = JSON.parse(dataStr)
              if (parsed.text) {
                accumulatedText += parsed.text
                yield {
                  content: [
                    {
                      type: 'text',
                      text: accumulatedText,
                    },
                  ],
                }
              }
            } catch {
              // 忽略解析碎片
            }
          }
        }
      },
    }
  }, [articleTitle, articleContent])

  const runtime = useLocalRuntime(adapter)

  // 快捷复制当前速读
  const handleCopySummary = () => {
    if (summaryText) {
      navigator.clipboard.writeText(summaryText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative backdrop-blur-xl gap-4">
        {/* 顶部标题与复制工具栏 */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              AI 智能研报速读报告
            </span>
            {isSummaryStreaming && (
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-ping ml-1" />
            )}
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded ml-1">
              assistant-ui 驱动
            </span>
          </div>

          {summaryText && (
            <button
              onClick={handleCopySummary}
              className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制简报'}</span>
            </button>
          )}
        </div>

        {/* 滚动区域：包含速读正文与后续的多轮对话 */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 focus:outline-none">
          {summaryText ? (
            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-xl text-sm leading-relaxed text-zinc-200 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1]:text-base [&>h1]:font-bold [&>h1]:text-white [&>h1]:my-2 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:text-purple-300 [&>h2]:my-2 [&>p]:mb-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&>li]:mb-1 [&>blockquote]:border-l-2 [&>blockquote]:border-purple-500 [&>blockquote]:bg-purple-950/20 [&>blockquote]:pl-3 [&>blockquote]:py-1 [&>blockquote]:my-2 [&>blockquote]:rounded-r [&>blockquote]:text-zinc-400 [&>strong]:text-purple-200 [&>strong]:font-semibold [&>table]:w-full [&>table]:text-xs [&>table]:border [&>table]:border-zinc-800 [&>table]:my-2 [&>th]:bg-zinc-800 [&>th]:p-2 [&>td]:p-2 [&>td]:border-t [&>td]:border-zinc-800 [&>pre]:p-3 [&>pre]:my-2 [&>pre]:rounded-xl [&>pre]:bg-zinc-950 [&>pre]:border [&>pre]:border-zinc-800/80 [&>pre]:overflow-x-auto [&>code]:font-mono">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
              {isSummaryStreaming && (
                <span className="inline-block w-1.5 h-4 bg-purple-400 animate-pulse ml-1 align-middle rounded-sm shadow-sm shadow-purple-500/50" />
              )}
            </div>
          ) : isSummaryStreaming ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-500 gap-3 py-10 bg-zinc-950/40 rounded-xl border border-zinc-800/30">
              <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
              <span className="text-xs tracking-wide">AI 正在深度解构全文论点，即将流式呈现...</span>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-600 text-xs py-10 bg-zinc-950/20 rounded-xl border border-dashed border-zinc-800">
              <Sparkles className="w-6 h-6 text-zinc-600 mb-2" />
              请在上方输入链接并点击“一键智能萃取”
            </div>
          )}

          {/* 2. 多轮追问消息列表 (由 assistant-ui Thread 驱动) */}
          <ThreadPrimitive.Root className="flex flex-col">
            <ThreadPrimitive.Viewport className="space-y-3 focus:outline-none">
              <ThreadPrimitive.Messages
                components={{
                  UserMessage: () => (
                    <MessagePrimitive.Root className="flex justify-end my-2">
                      <div className="max-w-[85%] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 text-sm shadow-md flex items-start gap-2">
                        <div className="flex-1">
                          <MessagePrimitive.Content />
                        </div>
                        <User className="w-3.5 h-3.5 text-purple-200 mt-1 flex-shrink-0" />
                      </div>
                    </MessagePrimitive.Root>
                  ),
                  AssistantMessage: () => (
                    <MessagePrimitive.Root className="flex justify-start my-2">
                      <div className="w-full rounded-2xl bg-zinc-950/80 border border-purple-500/20 p-4 shadow-sm relative">
                        <div className="flex items-center gap-1.5 mb-2 text-xs text-purple-400 border-b border-zinc-900 pb-1.5 font-medium">
                          <Bot className="w-3.5 h-3.5" />
                          <span>研报 Copilot 解答</span>
                        </div>
                        <MessagePrimitive.Content
                          components={{
                            Text: AssistantMarkdown,
                          }}
                        />
                      </div>
                    </MessagePrimitive.Root>
                  ),
                }}
              />
            </ThreadPrimitive.Viewport>
          </ThreadPrimitive.Root>
        </div>

        {/* 底部交互追问输入框（仅当已提取文章或已有简报时激活） */}
        <div className="pt-2 border-t border-zinc-800/80 flex-shrink-0">
          <ComposerPrimitive.Root className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-purple-500 transition-colors">
            <MessageSquare className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <ComposerPrimitive.Input
              placeholder={articleTitle ? `继续就《${articleTitle}》向 AI 深度追问...` : '针对文章内容提问...'}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none py-1"
              rows={1}
            />
            {/* 未处于生成状态：展示发送按钮 */}
            <ThreadPrimitive.If running={false}>
              <ComposerPrimitive.Send asChild>
                <button className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-sm">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </ComposerPrimitive.Send>
            </ThreadPrimitive.If>

            {/* 大模型正在吐字生成中：动态切换为打断按钮 */}
            <ThreadPrimitive.If running={true}>
              <ComposerPrimitive.Cancel asChild>
                <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center justify-center cursor-pointer border border-red-500/20 shadow-sm">
                  <StopCircle className="w-3.5 h-3.5" />
                </button>
              </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
          </ComposerPrimitive.Root>
        </div>
      </div>
    </AssistantRuntimeProvider>
  )
}
