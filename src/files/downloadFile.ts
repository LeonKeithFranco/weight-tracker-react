/**
 * How long the browser keeps the file's data after the download starts. Some
 * browsers read it a moment after the click, so freeing it at once can break
 * the download.
 */
const KEEP_URL_MS = 60_000;

/**
 * Saves text as a file in the browser's downloads. Browsers have no function
 * for this, so it puts the text in a `Blob`, gives the blob a temporary URL,
 * and clicks a link to that URL with a `download` attribute.
 */
export function downloadFile(
  contents: string,
  fileName: string,
  type: string,
): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  // Saves the file under this name rather than opening it.
  link.download = fileName;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), KEEP_URL_MS);
}
