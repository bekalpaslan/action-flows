/**
 * Chrome MCP Test Helper Functions
 *
 * Shared utility functions used by automation scripts in generated tests.
 * When a health check automation script references an undefined function,
 * implement it here.
 */

/**
 * Check if two rectangles overlap
 */
export function rectsOverlap(
  rect1: DOMRect | { left: number; right: number; top: number; bottom: number },
  rect2: DOMRect | { left: number; right: number; top: number; bottom: number }
): boolean {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

/**
 * Wait for element to appear in DOM
 */
export async function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<Element> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

/**
 * Get computed style property
 */
export function getStyleProperty(element: Element, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Check if element is visible (not display:none or visibility:hidden)
 */
export function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

/**
 * Get all text content from element (recursive)
 */
export function getAllTextContent(element: Element): string {
  return element.textContent?.trim() || '';
}
