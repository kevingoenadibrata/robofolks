/* robofolks/element: the <robo-folk> custom element. Importing this module
   registers it (in a browser; in Node it imports cleanly and does nothing).

     <robo-folk seed="kevingo" state="active"></robo-folk>

   Attributes, all optional:
     seed     any string; the same seed always gets the same robot
     state    active | needs | waiting (default)
     view     front | back | left | right: walk that way instead of a state
     motion   css (default): the animated SVG, played by CSS with no timer
              clock: drawn frame by frame on the shared clock from ./dom.js,
                     in step with every other clock robot, and a state change
                     carries on mid-animation instead of restarting the loop
              none: hold the first frame
     body, build, antenna, ears, chest
              parts picked by hand, as for folkTraits overrides

   It's 72px wide by default (and 36:44 tall); size it with CSS width. */
import { FOLK_PARTS, FOLK_STATES, FOLK_VIEWS, folkTraits, folkSvg, folkWalkSvg } from './core.js';
import { folkAnimatedSvg } from './animated.js';
import { mountFolk, updateFolk, unmountFolk } from './dom.js';

const PARTS = ['body', ...Object.keys(FOLK_PARTS)];
const MOTIONS = ['css', 'clock', 'none'];
const STATE_LABELS = { active: 'working', needs: 'needs you', waiting: 'idle' };
const STYLE = ':host{display:inline-block;width:72px;aspect-ratio:36/44;vertical-align:middle}'
  + ':host([hidden]){display:none}div,svg{display:block;width:100%;height:100%}';

// Building an animated SVG takes a few milliseconds, so they're cached, and
// built when the browser is idle while the first frame stands in.
const CACHE_LIMIT = 100;
const animatedCache = new Map();
const whenIdle = globalThis.requestIdleCallback ?? ((fn) => setTimeout(fn, 1));

function animatedSvg(key, traits, state, view) {
  let svg = animatedCache.get(key);
  if (svg === undefined) {
    svg = folkAnimatedSvg(traits, state, { view });
    if (animatedCache.size >= CACHE_LIMIT) animatedCache.delete(animatedCache.keys().next().value);
  } else {
    animatedCache.delete(key); // re-added below, so the cache drops the least recently used
  }
  animatedCache.set(key, svg);
  return svg;
}

// Lets the module load where there's no DOM, e.g. during server rendering.
const Base = globalThis.HTMLElement ?? class {};

export class RoboFolkElement extends Base {
  static observedAttributes = ['seed', 'state', 'view', 'motion', ...PARTS];

  #box;
  #internals;
  #folk = null; // mounted on the shared clock, in clock motion
  #drawn = null; // what's showing otherwise, so unchanged renders are skipped
  #queued = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    // The element itself is the labeled image; the drawing inside is decoration.
    root.innerHTML = `<style>${STYLE}</style><div part="robot" aria-hidden="true"></div>`;
    this.#box = root.lastElementChild;
    this.#internals = this.attachInternals();
    this.#internals.role = 'img';
  }

  get seed() { return this.getAttribute('seed') ?? ''; }
  set seed(value) { this.setAttribute('seed', value); }

  get state() {
    const state = this.getAttribute('state');
    return FOLK_STATES.includes(state) ? state : 'waiting';
  }
  set state(value) { this.setAttribute('state', value); }

  get view() {
    const view = this.getAttribute('view');
    return FOLK_VIEWS.includes(view) ? view : null;
  }
  set view(value) {
    if (value == null) this.removeAttribute('view');
    else this.setAttribute('view', value);
  }

  get motion() {
    const motion = this.getAttribute('motion');
    return MOTIONS.includes(motion) ? motion : 'css';
  }
  set motion(value) { this.setAttribute('motion', value); }

  /** The robot being shown: the seed's traits with any parts picked by hand. */
  get traits() {
    const overrides = {};
    for (const part of PARTS) if (this.hasAttribute(part)) overrides[part] = this.getAttribute(part);
    return folkTraits(this.seed, overrides);
  }

  connectedCallback() {
    // A framework may have set properties before this element was defined;
    // those landed on the instance and hide the accessors, so re-apply them.
    for (const prop of ['seed', 'state', 'view', 'motion']) {
      if (Object.hasOwn(this, prop)) {
        const value = this[prop];
        delete this[prop];
        this[prop] = value;
      }
    }
    this.#render();
  }

  disconnectedCallback() {
    if (this.#folk) unmountFolk(this.#folk);
    this.#folk = null;
    this.#drawn = null;
  }

  attributeChangedCallback() {
    // Several attributes often change at once (and on first parse); draw once.
    if (this.#queued || !this.isConnected) return;
    this.#queued = true;
    queueMicrotask(() => this.#render());
  }

  #render() {
    this.#queued = false;
    if (!this.isConnected) return;
    const { traits, state, view, motion } = this;
    this.#internals.ariaLabel = `Robot avatar, ${view ? 'walking' : STATE_LABELS[state]}`;

    if (motion === 'clock') {
      this.#drawn = null;
      if (this.#folk) updateFolk(this.#folk, { who: traits, state, view });
      else this.#folk = mountFolk(this.#box, traits, state, { view });
      return;
    }
    if (this.#folk) {
      unmountFolk(this.#folk);
      this.#folk = null;
    }

    const key = JSON.stringify([traits, state, view]);
    const drawn = `${motion}:${key}`;
    if (drawn === this.#drawn) return;
    this.#drawn = drawn;

    if (motion === 'css' && animatedCache.has(key)) {
      this.#box.innerHTML = animatedSvg(key, traits, state, view);
      return;
    }
    // The animated SVG opens on this same frame, so swapping it in doesn't jump.
    this.#box.innerHTML = view ? folkWalkSvg(traits, view, 0) : folkSvg(traits, state, 0);
    if (motion === 'css') {
      whenIdle(() => {
        if (this.#drawn === drawn) this.#box.innerHTML = animatedSvg(key, traits, state, view);
      });
    }
  }
}

/** Register the element under `name` (default robo-folk). Safe to call
 *  more than once, and a no-op outside a browser. */
export function defineRoboFolk(name = 'robo-folk') {
  if (!globalThis.customElements || customElements.get(name)) return;
  // A class can only be registered once, so other names get a subclass.
  customElements.define(name, name === 'robo-folk' ? RoboFolkElement : class extends RoboFolkElement {});
}

defineRoboFolk();
