/**
 * The text a screen reader reads in an element: its text, leaving out parts
 * hidden with `aria-hidden`, such as the rolling digits in Latest figures.
 */
export function readableText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll("[aria-hidden='true']")) {
    hidden.remove();
  }
  return copy.textContent;
}
