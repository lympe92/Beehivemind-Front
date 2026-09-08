import { ImageConfig } from '../../ui/image/image.model';

/** One block of a post body. The article renders `h2` and `p` blocks. */
export interface PostBlock {
  type: 'p' | 'h2';
  text: string;
}

/**
 * The blog's content model. There is no CMS in the repo yet; this is the shape
 * one would map onto. `date` is a pre-formatted display string.
 */
export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag?: string;
  readingTime?: string;
  image?: ImageConfig;
  body: PostBlock[];
}
