/**
 * The text a screen reader reads in an element: its text, leaving out parts
 * hidden with `aria-hidden`, such as the rolling digits in Latest figures.
 *
 * @param element - The element to read.
 * @returns Its text content, without any `aria-hidden` parts.
 */
export function readableText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll("[aria-hidden='true']")) {
    hidden.remove();
  }
  return copy.textContent;
}
