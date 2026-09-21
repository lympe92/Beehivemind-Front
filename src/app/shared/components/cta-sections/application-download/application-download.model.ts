import { ImageConfig } from '../../ui/image/image.model';

export interface StoreLink {
  href: string;
  img: ImageConfig;
  /**
   * Which store the badge stands for. Analytics reads it rather than the
   * address, because the App Store badge points at Play until the iOS build
   * exists.
   */
  store: 'google_play' | 'app_store';
}
