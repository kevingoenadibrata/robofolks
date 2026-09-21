import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import type { FolkState, FolkTraits, FolkView } from './index.js';
import type { FolkMotion } from './element.js';

export interface RoboFolkProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'dangerouslySetInnerHTML' | 'style'> {
  /** Any string; the same seed always gets the same robot. */
  seed?: string;
  /** A robot to show instead of a seed's, from folkTraits. */
  traits?: FolkTraits;
  state?: FolkState;
  /** Walk this way instead of showing a state. */
  view?: FolkView | null;
  /** css: animated SVG (default). clock: the shared JavaScript clock.
   *  none: the first frame, held. */
  motion?: FolkMotion;
  /** CSS width; default 72. */
  size?: number | string;
  style?: ComponentPropsWithoutRef<'span'>['style'];
}

export function RoboFolk(props: RoboFolkProps): ReactElement;
export default RoboFolk;
