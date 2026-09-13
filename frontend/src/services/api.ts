/**
 * 知模 (ZhiMoHub) 前端 API 交互服务
 */

export interface ModelAssetItem {
  id: string;
  title: string;
  filename: string;
  file_size_display: string;
  su_version: string;
  thumbnail_url: string;
  category: string;
  tags: string[];
  dimensions: {
    width: number;
    depth: number;
    height: number;
    display: string;
  };
  specs?: {
    style: string;
    faces_count: string;
    file_size: string;
    textures_count: number;
    texture_replaceable: string;
    components_count: number;
    scenes_count: number;
    created_at: string;
  };
  components: string[];
  views_count: number;
  downloads_count: number;
  created_at: string;
}

export interface SearchParams {
  q?: string;
  category?: string;
  su_version?: string;
  min_width?: number;
  max_width?: number;
  min_height?: number;
  max_height?: number;
  sort_by?: 'newest' | 'views' | 'size';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: ModelAssetItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CategoryItem {
  name: string;
  count: number;
  key: string;
}

export interface SimilarModelItem {
  id: string;
  title: string;
  thumbnail_url: string;
  category: string;
  su_version: string;
  similarity_score: string;
  dimensions: string;
}

const API_BASE = '/api';

export const api = {
  // 获取分类统计
  async getCategories(): Promise<CategoryItem[]> {
    const res = await fetch(`${API_BASE}/assets/categories`);
    if (!res.ok) throw new Error('获取分类失败');
    return res.json();
  },

  // 多维检索与过滤
  async searchAssets(params: SearchParams): Promise<SearchResult> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.su_version && params.su_version !== 'all') query.set('su_version', params.su_version);
    if (params.min_width) query.set('min_width', params.min_width.toString());
    if (params.max_width) query.set('max_width', params.max_width.toString());
    if (params.min_height) query.set('min_height', params.min_height.toString());
    if (params.max_height) query.set('max_height', params.max_height.toString());
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/assets/search?${query.toString()}`);
    if (!res.ok) throw new Error('搜索模型失败');
    return res.json();
  },

  // 获取详情
  async getAssetDetail(id: string): Promise<ModelAssetItem & { file_path: string }> {
    const res = await fetch(`${API_BASE}/assets/${id}`);
    if (!res.ok) throw new Error('获取详情失败');
    return res.json();
  },

  // 获取相似模型
  async getSimilarModels(id: string, limit = 6): Promise<SimilarModelItem[]> {
    const res = await fetch(`${API_BASE}/assets/${id}/similar?limit=${limit}`);
    if (!res.ok) throw new Error('获取相似模型失败');
    return res.json();
  },

  // 批量上传 .skp 文件
  async uploadFiles(files: File[]): Promise<{ message: string; count: number }> {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    const res = await fetch(`${API_BASE}/assets/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('上传模型解析失败');
    return res.json();
  },

  // 扫描 NAS 共享目录
  async scanDirectory(folderPath: string): Promise<{ message: string; indexed_count: number }> {
    const formData = new FormData();
    formData.append('folder_path', folderPath);
    const res = await fetch(`${API_BASE}/assets/scan`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || '扫盘失败');
    }
    return res.json();
  },
};
