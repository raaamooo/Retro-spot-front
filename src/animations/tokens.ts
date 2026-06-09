/**
 * Retro Spot Animation Constitution — Global Tokens
 *
 * Every animation should feel like an old brass music box winding to life —
 * movements are deliberate, slightly weighted, never frantic.
 * Entrances ease in with warmth. Exits dissolve rather than snap.
 * Interactions have a satisfying click — snappy trigger, elegant settle.
 * Nothing should feel sterile or digital-cold.
 * Think warm hands, worn wood, and gold that catches the light slowly.
 */

// ── Easing curves ──────────────────────────────────────────────
/** Warm entrance ease — decelerates gently into rest */
export const EASE_OUT = 'easeOutExpo' as const;

/** Dissolving exit ease — accelerates smoothly out of frame */
export const EASE_IN = 'easeInQuart' as const;

/** Smooth transition ease — for state changes and layout shifts */
export const EASE_IN_OUT = 'easeInOutQuart' as const;

// ── Durations (ms) ─────────────────────────────────────────────
/** Micro-interactions: toggle, click feedback, hover settle */
export const DURATION_SHORT = 280;

/** Element entrances: cards, text blocks, images fading in */
export const DURATION_MED = 520;

/** Page-level transitions: route changes, overlay reveals */
export const DURATION_LONG = 900;

// ── Stagger ────────────────────────────────────────────────────
/** Delay between staggered children (ms) */
export const STAGGER_DELAY = 60;
