import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

/**
 * The background of icons that can't be transparent. It matches the rounded
 * square in `favicon.svg`, so its corners blend in.
 */
const background = "#2a78d6";

/**
 * Makes every icon size the app needs from `public/favicon.svg`, and writes
 * them next to it. Run `npm run generate-icons` after changing the SVG.
 */
export default defineConfig({
  // `minimal2023Preset` is the generator's list of the sizes current browsers
  // and phones ask for. These two kinds of icon change it.
  preset: {
    ...minimal2023Preset,
    // Android crops these to a circle or other shape, so they fill the whole
    // square. The scale stays inside the middle 80%, which is never cropped.
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { background },
    },
    // iOS rounds the corners itself and shows transparency as black.
    apple: {
      ...minimal2023Preset.apple,
      padding: 0,
      resizeOptions: { background },
    },
  },
  images: ["public/favicon.svg"],
});
