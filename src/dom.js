/* robofolks/dom: robots mounted into a page and kept animating.

   Every mounted robot and tick listener shares one clock. It starts when the
   first one arrives and stops once they're all gone (robots are dropped when
   their element leaves the page), and it holds still while the viewer prefers
   reduced motion. */
import { FOLK_TICK_MS, folkTraits, folkSvg, folkWalkSvg } from './core.js';

const folks = new Set();
const tickListeners = new Set();
let tick = 0;
let timer = null;
let motionQuery;

/** Whether the viewer asked for reduced motion. False outside a browser. */
export function prefersReducedMotion() {
  if (motionQuery === undefined) {
    motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  }
  return Boolean(motionQuery?.matches);
}

/** The shared clock's current tick. */
export function currentFolkTick() {
  return tick;
}

function toTraits(who) {
  return typeof who === 'string' ? folkTraits(who) : { phase: 0, ...who };
}

function draw(folk) {
  const t = prefersReducedMotion() ? 0 : tick;
  folk.el.innerHTML = folk.view
    ? folkWalkSvg(folk.traits, folk.view, Math.floor(t / 2))
    : folkSvg(folk.traits, folk.state, t);
}

function startClock() {
  if (timer !== null) return;
  timer = setInterval(() => {
    for (const folk of folks) if (!folk.el.isConnected) folks.delete(folk); // card or panel was re-rendered
    if (!folks.size && !tickListeners.size) {
      clearInterval(timer);
      timer = null;
      return;
    }
    if (prefersReducedMotion()) return;
    tick++;
    for (const folk of folks) draw(folk);
    for (const fn of tickListeners) fn(tick);
  }, FOLK_TICK_MS);
}

/** Draw a robot into `el` and keep it animating. `who` is a seed string, or
 *  a traits object to show a specific build. Pass `{ view }` to show it
 *  walking that way instead of animating a state. */
export function mountFolk(el, who, state = 'waiting', { view = null } = {}) {
  const folk = { el, traits: toTraits(who), state, view };
  folks.add(folk);
  draw(folk);
  startClock();
  return folk;
}

/** Change a mounted robot and redraw it now. `who` is a seed or traits, as
 *  for mountFolk; leave out what isn't changing. */
export function updateFolk(folk, { who, state, view } = {}) {
  if (who !== undefined) folk.traits = toTraits(who);
  if (state !== undefined) folk.state = state;
  if (view !== undefined) folk.view = view;
  draw(folk);
}

export function setFolkState(folk, state) {
  if (folk.state === state) return;
  folk.state = state;
  draw(folk);
}

/** Stop animating a robot. Its element keeps the last frame. */
export function unmountFolk(folk) {
  folks.delete(folk);
}

/** Call `fn(tick)` on every tick of the shared clock. Returns a function
 *  that stops it. */
export function onFolkTick(fn) {
  tickListeners.add(fn);
  startClock();
  return () => tickListeners.delete(fn);
}
