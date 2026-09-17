import type { BotState, BotTraits, BotView } from './index.js';

/** A seed string, or traits for a specific build. */
export type BotWho = string | (Omit<BotTraits, 'phase'> & { phase?: number });

/** Anything robots can be drawn into; a DOM element in practice. */
export interface BotElement {
  innerHTML: string;
  readonly isConnected: boolean;
}

export interface MountedBot {
  el: BotElement;
  traits: BotTraits;
  state: BotState;
  view: BotView | null;
}

export function mountBot(
  el: BotElement,
  who: BotWho,
  state?: BotState,
  options?: { view?: BotView | null },
): MountedBot;
export function updateBot(
  bot: MountedBot,
  changes?: { who?: BotWho; state?: BotState; view?: BotView | null },
): void;
export function setBotState(bot: MountedBot, state: BotState): void;
export function unmountBot(bot: MountedBot): void;
/** Returns a function that removes the listener. */
export function onBotTick(fn: (tick: number) => void): () => void;
export function currentBotTick(): number;
export function prefersReducedMotion(): boolean;
