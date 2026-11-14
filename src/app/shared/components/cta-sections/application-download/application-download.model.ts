import { ImageConfig } from '../../ui/image/image.model';

export interface StoreLink {
  href: string;
  img: ImageConfig;
  /**
   * Which store the badge stands for. Analytics reads it rather than work it
   * out from the address.
   */
  store: 'google_play' | 'app_store';
}
