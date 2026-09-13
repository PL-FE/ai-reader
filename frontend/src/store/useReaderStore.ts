import { create } from 'zustand'

export interface ArticleData {
  url: string
  title: string
  content: string
  char_count: number
}

interface ReaderState {
  // 界面输入与加载状态
  url: string
  isExtracting: boolean
  isStreaming: boolean
  
  // 文章与总结数据
  currentArticle: ArticleData | null
  summaryText: string
  errorMessage: string | null

  // 操作 Actions
  setUrl: (url: string) => void
  setCurrentArticle: (article: ArticleData | null) => void
  setSummaryText: (text: string) => void
  appendSummaryText: (delta: string) => void
  setIsExtracting: (val: boolean) => void
  setIsStreaming: (val: boolean) => void
  setErrorMessage: (msg: string | null) => void
  reset: () => void
}

export const useReaderStore = create<ReaderState>((set) => ({
  url: '',
  isExtracting: false,
  isStreaming: false,
  currentArticle: null,
  summaryText: '',
  errorMessage: null,

  setUrl: (url) => set({ url }),
  setCurrentArticle: (currentArticle) => set({ currentArticle }),
  setSummaryText: (summaryText) => set({ summaryText }),
  appendSummaryText: (delta) => set((state) => ({ summaryText: state.summaryText + delta })),
  setIsExtracting: (isExtracting) => set({ isExtracting }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  reset: () => set({ currentArticle: null, summaryText: '', errorMessage: null }),
}))
