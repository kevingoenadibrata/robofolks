/* robofolks/react: <RoboFolk seed="kevingo" state="active" />

   It renders the SVG itself rather than wrapping the custom element, so
   server rendering gives you the finished robot: no flicker, nothing to
   hydrate, and it works on React 18 as well as 19. React is a peer
   dependency; nothing else in the package imports this file. */
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { folkTraits, folkSvg, folkWalkSvg } from './core.js';
import { folkAnimatedSvg } from './animated.js';
import { mountFolk, updateFolk, unmountFolk } from './dom.js';

const STATE_LABELS = { active: 'working', needs: 'needs you', waiting: 'idle' };

// Animated SVGs are the same for the same robot, and cost a few milliseconds
// to build, so they're kept (100 most recent) and shared by every avatar.
const CACHE_LIMIT = 100;
const cache = new Map();

function animated(key, traits, state, view) {
  let svg = cache.get(key);
  if (svg === undefined) {
    svg = folkAnimatedSvg(traits, state, { view });
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
  } else {
    cache.delete(key);
  }
  cache.set(key, svg);
  return svg;
}

/**
 * A robot avatar.
 *
 * seed    any string; the same seed always gets the same robot
 * traits  a robot to show instead of a seed's (from folkTraits)
 * state   'active' | 'needs' | 'waiting' (default)
 * view    'front' | 'back' | 'left' | 'right': walk that way instead
 * motion  'css' (default): the animated SVG, played by CSS with no timer
 *         'clock': drawn on the shared clock from robofolks/dom, in step
 *                  with other clock robots
 *         'none': hold the first frame
 * size    CSS width (default 72)
 *
 * Anything else is passed to the wrapping <span>.
 */
export function RoboFolk({
  seed = '',
  traits,
  state = 'waiting',
  view = null,
  motion = 'css',
  size = 72,
  style,
  ...rest
}) {
  const robot = useMemo(() => traits ?? folkTraits(seed), [traits, seed]);
  const key = useMemo(() => JSON.stringify([robot, state, view]), [robot, state, view]);

  const still = useMemo(() => (view ? folkWalkSvg(robot, view, 0) : folkSvg(robot, state, 0)), [key]);
  // The clock draws into this span, so its markup is set once and left alone.
  const [firstFrame] = useState(still);
  const box = useRef(null);
  const folk = useRef(null);

  useEffect(() => {
    if (motion !== 'clock') {
      if (folk.current) {
        unmountFolk(folk.current);
        folk.current = null;
      }
      return undefined;
    }
    if (folk.current) updateFolk(folk.current, { who: robot, state, view });
    else folk.current = mountFolk(box.current, robot, state, { view });
    return undefined;
  }, [motion, key]);

  useEffect(() => () => {
    if (folk.current) unmountFolk(folk.current);
    folk.current = null;
  }, []);

  const html = motion === 'clock' ? firstFrame : motion === 'none' ? still : animated(key, robot, state, view);
  return createElement('span', {
    role: 'img',
    'aria-label': `Robot avatar, ${view ? 'walking' : STATE_LABELS[state] ?? state}`,
    ...rest,
    ref: box,
    style: { display: 'inline-block', width: size, aspectRatio: '36 / 44', ...style },
    dangerouslySetInnerHTML: { __html: html },
  });
}

export default RoboFolk;
