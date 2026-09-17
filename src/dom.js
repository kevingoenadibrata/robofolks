/* bot-avatar/dom: robots mounted into a page and kept animating.

   Every mounted robot and tick listener shares one clock. It starts when the
   first one arrives and stops once they're all gone (robots are dropped when
   their element leaves the page), and it holds still while the viewer prefers
   reduced motion. */
import { BOT_TICK_MS, botTraits, botSvg, botWalkSvg } from './index.js';

const bots = new Set();
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
export function currentBotTick() {
  return tick;
}

function toTraits(who) {
  return typeof who === 'string' ? botTraits(who) : { phase: 0, ...who };
}

function draw(bot) {
  const t = prefersReducedMotion() ? 0 : tick;
  bot.el.innerHTML = bot.view
    ? botWalkSvg(bot.traits, bot.view, Math.floor(t / 2))
    : botSvg(bot.traits, bot.state, t);
}

function startClock() {
  if (timer !== null) return;
  timer = setInterval(() => {
    for (const bot of bots) if (!bot.el.isConnected) bots.delete(bot); // card or panel was re-rendered
    if (!bots.size && !tickListeners.size) {
      clearInterval(timer);
      timer = null;
      return;
    }
    if (prefersReducedMotion()) return;
    tick++;
    for (const bot of bots) draw(bot);
    for (const fn of tickListeners) fn(tick);
  }, BOT_TICK_MS);
}

/** Draw a robot into `el` and keep it animating. `who` is a seed string, or
 *  a traits object to show a specific build. Pass `{ view }` to show it
 *  walking that way instead of animating a state. */
export function mountBot(el, who, state = 'waiting', { view = null } = {}) {
  const bot = { el, traits: toTraits(who), state, view };
  bots.add(bot);
  draw(bot);
  startClock();
  return bot;
}

/** Change a mounted robot and redraw it now. `who` is a seed or traits, as
 *  for mountBot; leave out what isn't changing. */
export function updateBot(bot, { who, state, view } = {}) {
  if (who !== undefined) bot.traits = toTraits(who);
  if (state !== undefined) bot.state = state;
  if (view !== undefined) bot.view = view;
  draw(bot);
}

export function setBotState(bot, state) {
  if (bot.state === state) return;
  bot.state = state;
  draw(bot);
}

/** Stop animating a robot. Its element keeps the last frame. */
export function unmountBot(bot) {
  bots.delete(bot);
}

/** Call `fn(tick)` on every tick of the shared clock. Returns a function
 *  that stops it. */
export function onBotTick(fn) {
  tickListeners.add(fn);
  startClock();
  return () => tickListeners.delete(fn);
}
