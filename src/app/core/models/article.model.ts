import { SEOApiResponseModel } from './seo.model';

export interface ArticleModel {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: { url: string } | null;
  author: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  tags: string[];
  published_at: string;
  updated_at: string;
  seo: SEOApiResponseModel;
}
