import anime, { type AnimeParams } from 'animejs';

/**
 * Resolve the final CSS state from an anime.js options object so we can
 * apply it instantly when motion is reduced.
 *
 * We extract every animatable property (anything that isn't an anime.js
 * control key) and pick the last value if the property is keyframed.
 */
function extractFinalState(opts: AnimeParams): Record<string, unknown> {
  const controlKeys = new Set([
    'targets',
    'duration',
    'delay',
    'endDelay',
    'easing',
    'round',
    'direction',
    'loop',
    'autoplay',
    'keyframes',
    'begin',
    'update',
    'complete',
    'loopBegin',
    'loopComplete',
    'changeBegin',
    'changeComplete',
    'change',
  ]);

  const final: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(opts)) {
    if (controlKeys.has(key)) continue;

    // If value is an array (keyframes shorthand), take the last frame
    if (Array.isArray(value)) {
      final[key] = value[value.length - 1];
    } else {
      final[key] = value;
    }
  }

  return final;
}

/**
 * Apply a style map directly to one or more DOM targets, skipping animation.
 */
function applyImmediately(
  targets: AnimeParams['targets'],
  finalState: Record<string, unknown>
): void {
  if (!targets) return;

  // Normalise targets into an array of Elements
  let elements: Element[] = [];

  if (typeof targets === 'string') {
    elements = Array.from(document.querySelectorAll(targets));
  } else if (targets instanceof Element) {
    elements = [targets];
  } else if (targets instanceof NodeList || Array.isArray(targets)) {
    elements = Array.from(targets as Iterable<Element>);
  }

  for (const el of elements) {
    if (!(el instanceof HTMLElement || el instanceof SVGElement)) continue;

    for (const [prop, value] of Object.entries(finalState)) {
      const strValue = String(value);

      // CSS property (kebab-case or camelCase)
      if (prop in el.style || prop.includes('-')) {
        el.style.setProperty(
          prop.replace(/([A-Z])/g, '-$1').toLowerCase(),
          strValue
        );
      } else {
        // SVG attribute or other
        el.setAttribute(prop, strValue);
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

export interface AnimateOptions extends AnimeParams {
  /**
   * When `true`, the animation is skipped entirely and targets are set
   * to their final CSS state immediately.
   *
   * This is the escape-hatch that `useReducedMotion` feeds into.
   */
  reducedMotion?: boolean;
}

/**
 * Thin wrapper around `anime()` that respects reduced motion.
 *
 * Usage (inside a component):
 * ```ts
 * const reduced = useReducedMotion();
 *
 * useEffect(() => {
 *   animate({
 *     targets: ref.current,
 *     opacity: [0, 1],
 *     translateY: [24, 0],
 *     duration: DURATION_MED,
 *     easing: EASE_OUT,
 *     reducedMotion: reduced,
 *   });
 * }, [reduced]);
 * ```
 *
 * @returns The `anime.AnimeInstance` when animating, or `null` when skipped.
 */
export function animate(
  opts: AnimateOptions
): anime.AnimeInstance | null {
  const { reducedMotion, ...animeOpts } = opts;

  if (reducedMotion) {
    // Jump straight to the end state — no motion at all.
    const finalState = extractFinalState(animeOpts);
    applyImmediately(animeOpts.targets, finalState);
    return null;
  }

  return anime(animeOpts);
}
