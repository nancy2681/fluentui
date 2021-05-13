import { resolveClassesBySlots } from './runtime/resolveClassesBySlots';
import { MakeStylesOptions } from './types';
import { ClassnamesMapping, CSSRules } from './makeStyles';

/**
 * A version of makeStyles() that accepts build output as an input and skips all runtime transforms.
 *
 * @internal
 */
export function __styles<Slots extends string>(classnamesMapping: ClassnamesMapping<Slots>, cssRules: CSSRules) {
  let resolvedClassesLtr: Record<Slots, string> | null = null;
  let resolvedClassesRtl: Record<Slots, string> | null = null;

  const insertionCache: Record<string, boolean> = {};

  function computeClasses(options: Pick<MakeStylesOptions, 'dir' | 'renderer'>): Record<Slots, string> {
    const { dir, renderer } = options;

    if (dir === 'rtl') {
      // As RTL classes are different they should have a different cache key for insertion
      const rendererId = renderer.id + 'r';

      if (resolvedClassesRtl === null) {
        resolvedClassesRtl = resolveClassesBySlots(classnamesMapping, dir);
      }

      if (insertionCache[rendererId] === undefined) {
        renderer.insertCSSRules(cssRules!);
        insertionCache[rendererId] = true;
      }
    } else {
      if (resolvedClassesLtr === null) {
        resolvedClassesLtr = resolveClassesBySlots(classnamesMapping, dir);
      }

      if (insertionCache[renderer.id] === undefined) {
        renderer.insertCSSRules(cssRules!);
        insertionCache[renderer.id] = true;
      }
    }

    return dir === 'ltr'
      ? (resolvedClassesLtr as Record<Slots, string>)
      : (resolvedClassesRtl as Record<Slots, string>);
  }

  return computeClasses;
}
