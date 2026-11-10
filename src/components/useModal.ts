import { useEffect, useRef } from "react";

/**
 * Opens a `<dialog>` as a modal as soon as it's drawn. Put the returned ref on
 * the dialog, and close it with `ref.current?.close()` rather than by removing
 * it, so the browser puts focus back on the button that opened it.
 *
 * @returns A ref to put on the `<dialog>` element.
 */
export function useModal() {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    // StrictMode runs this twice in development, and the check stops it
    // opening an already open dialog.
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return ref;
}
