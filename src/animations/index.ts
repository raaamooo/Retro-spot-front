// Retro Spot Animation Engine — public surface

// ── Tokens ──
export {
  EASE_OUT,
  EASE_IN,
  EASE_IN_OUT,
  DURATION_SHORT,
  DURATION_MED,
  DURATION_LONG,
  STAGGER_DELAY,
} from './tokens';

// ── Core utility ──
export { useReducedMotion } from './useReducedMotion';
export { animate } from './animate';
export type { AnimateOptions } from './animate';

// ── Global animation hooks ──
export { usePageEntrance } from './usePageEntrance';
export { useAnimeScrollReveal } from './useAnimeScrollReveal';
export type { UseScrollRevealOptions } from './useAnimeScrollReveal';
export { useNavHoverAnimation } from './useNavHoverAnimation';
export { useButtonAnimation } from './useButtonAnimation';
export { useSectionTimeline } from './useSectionTimeline';
export { useStaggeredEntrance } from './useStaggeredEntrance';
export { useParticleBurst } from './useParticleBurst';
export { useTabIndicator } from './useTabIndicator';
export { useCardHover3D } from './useCardHover3D';
export { useImageFadeIn } from './useImageFadeIn';
export { useHeroTimeline } from './useHeroTimeline';
export { useCartItemEntrance, animateCartItemRemoval, pulseCartQuantity, flashOrderTotal } from './useCartItemAnimations';
export { useCheckoutStagger, useStepIndicator, animateSuccessCheckmark } from './useCheckoutAnimations';
export { useOrderStatusTimeline, useActiveStepPulse, useProgressLine } from './useOrderStatusAnimations';

// ── Layout components ──
export { default as TransitionWrapper } from './TransitionWrapper';
