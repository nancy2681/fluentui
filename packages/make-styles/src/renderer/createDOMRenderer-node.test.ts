/**
 * @jest-environment node
 */

// 👆 this is intentionally to test in SSR like environment

import { CSSRules } from '../makeStyles';
import { createDOMRenderer } from './createDOMRenderer';

describe('createDOMRenderer', () => {
  it('"document" should not be defined', () => {
    expect(typeof document).toBe('undefined');
  });

  it('should not throw in document-less environment', () => {
    const renderer = createDOMRenderer(undefined);
    const cssRules: CSSRules = {
      d: ['.foo { color: red }'],
    };

    expect(() => renderer.insertCSSRules(cssRules)).not.toThrow();
  });
});
