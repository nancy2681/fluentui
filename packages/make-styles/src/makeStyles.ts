import { createCSSVariablesProxy } from './runtime/createCSSVariablesProxy';
import { resolveClassesBySlots } from './runtime/resolveClassesBySlots';
import { resolveStyleRules } from './runtime/resolveStyleRules';
import {
  MakeStylesOptions,
  MakeStylesResolvedRule,
  MakeStylesStyleFunctionRule,
  MakeStylesStyleRule,
  ResolvedStylesBySlots,
  StyleBucketName,
} from './types';
import {
  RULE_CLASSNAME_INDEX,
  RULE_CSS_INDEX,
  RULE_RTL_CLASSNAME_INDEX,
  RULE_RTL_CSS_INDEX,
  RULE_STYLE_BUCKET_INDEX,
} from './constants';

export type StylesBySlots<Slots extends string, Tokens> = Record<Slots, MakeStylesStyleRule<Tokens>>;

export type ClassnamesMappingForSlot = Record<string, string | [string, string]>;
export type ClassnamesMapping<Slots extends string> = Record<Slots, ClassnamesMappingForSlot>;
export type CSSRules = Partial<Record<StyleBucketName, string[]>>;

export function resolveStyles<Slots extends string, Tokens>(
  stylesBySlots: StylesBySlots<Slots, Tokens>,
  unstable_cssPriority: number,
): [ClassnamesMapping<Slots>, CSSRules] {
  const resolvedStylesBySlots = {} as ResolvedStylesBySlots<Slots>;
  const tokensProxy = createCSSVariablesProxy() as Tokens;

  // eslint-disable-next-line guard-for-in
  for (const slotName in stylesBySlots) {
    const slotStyles = stylesBySlots[slotName];
    const preparedSlotStyles =
      typeof slotStyles === 'function' ? (slotStyles as MakeStylesStyleFunctionRule<Tokens>)(tokensProxy) : slotStyles;

    resolvedStylesBySlots[slotName] = resolveStyleRules(preparedSlotStyles, unstable_cssPriority);
  }

  // ---

  const classnamesMapping: ClassnamesMapping<Slots> = {} as ClassnamesMapping<Slots>;
  const cssRules: CSSRules = {} as CSSRules;

  // eslint-disable-next-line guard-for-in
  for (const slotName in resolvedStylesBySlots) {
    const resolvedStylesForSlot = resolvedStylesBySlots[slotName];
    const classnamesMappingForSlot: Record<string, string | [string, string]> = {};

    // eslint-disable-next-line guard-for-in
    for (const propertyHash in resolvedStylesForSlot) {
      const propertyDefinition: MakeStylesResolvedRule = resolvedStylesForSlot[propertyHash];

      const className = propertyDefinition[RULE_CLASSNAME_INDEX]!;
      const rtlClassName = propertyDefinition[RULE_RTL_CLASSNAME_INDEX];

      const styleBucketName = propertyDefinition[RULE_STYLE_BUCKET_INDEX]!;
      const cssRule = propertyDefinition[RULE_CSS_INDEX]!;
      const rtlCSSRule = propertyDefinition[RULE_RTL_CSS_INDEX];

      classnamesMappingForSlot[propertyHash] = rtlClassName ? [className, rtlClassName] : className;
      cssRules[styleBucketName] = cssRules[styleBucketName] || [];

      if (rtlCSSRule) {
        cssRules[styleBucketName]!.push(cssRule, rtlCSSRule);
      } else {
        cssRules[styleBucketName]!.push(cssRule);
      }
    }

    classnamesMapping[slotName] = classnamesMappingForSlot;
  }

  const filteredRules: CSSRules = {} as CSSRules;

  // eslint-disable-next-line guard-for-in
  for (const styleBucketName in cssRules) {
    const unfilteredRules = cssRules[styleBucketName as StyleBucketName]!;

    filteredRules[styleBucketName as StyleBucketName] = unfilteredRules.filter((v, i, a) => a.indexOf(v) === i);
  }

  return [classnamesMapping, filteredRules];
}

export function makeStyles<Slots extends string, Tokens>(
  stylesBySlots: StylesBySlots<Slots, Tokens>,
  unstable_cssPriority: number = 0,
) {
  let classnamesMapping: ClassnamesMapping<Slots> | null = null;
  let cssRules: CSSRules | null = null;

  let resolvedClassesLtr: Record<Slots, string> | null = null;
  let resolvedClassesRtl: Record<Slots, string> | null = null;

  const insertionCache: Record<string, boolean> = {};

  function computeClasses(options: MakeStylesOptions): Record<Slots, string> {
    const { dir, renderer } = options;

    if (classnamesMapping === null) {
      [classnamesMapping, cssRules] = resolveStyles(stylesBySlots, unstable_cssPriority);
    }

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

    return (dir === 'ltr' ? resolvedClassesLtr : resolvedClassesRtl) as Record<Slots, string>;
  }

  return computeClasses;
}
