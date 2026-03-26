export interface MarketSkill {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  rating: number;
  downloads: number;
  tags: string[];
  createdAt: string;
}

export interface SearchQuery {
  keyword?: string;
  tags?: string[];
  sortBy?: 'downloads' | 'rating' | 'newest';
}

export interface ListResult {
  items: MarketSkill[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DownloadResult {
  package: string;
  path: string;
}
