/** A short labelled row in SplitContent's optional sequence. */
export interface SplitContentStep {
  title: string;
  body: string;
}

/** Which side the media takes at the two-up breakpoint. Below 992 the column stacks in DOM order. */
export type MediaSide = 'start' | 'end';
