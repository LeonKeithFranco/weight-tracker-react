import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RollingDate } from "./RollingDate";

/** An animation the component started, and hasn't cancelled. */
type AnimationCall = { text: string | null; keyframes: Keyframe[] };

describe("RollingDate", () => {
  /** The animations still running. */
  let calls: AnimationCall[];
  let reducedMotion: boolean;

  // jsdom has neither `animate` nor `matchMedia`, so these stand in for the
  // browser and record what the component asks for. Tests render in
  // StrictMode, which runs each effect, its cleanup and the effect again, so
  // a cancelled animation is taken off the list.
  beforeEach(() => {
    calls = [];
    reducedMotion = false;
    Element.prototype.animate = function (this: Element, keyframes) {
      const call = {
        text: this.textContent,
        keyframes: keyframes as Keyframe[],
      };
      calls.push(call);
      return {
        cancel: () => calls.splice(calls.indexOf(call), 1),
      } as unknown as Animation;
    };
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
    }));
  });

  afterEach(() => {
    // @ts-expect-error -- removes the stand-in, as jsdom has no `animate`.
    delete Element.prototype.animate;
    vi.unstubAllGlobals();
  });

  it("doesn't animate when it first appears", () => {
    render(<RollingDate text="30 Oct 2026" order="2026-10-30" />);

    expect(calls).toEqual([]);
  });

  it("slides a new month name up when the date gets later", () => {
    const { rerender } = render(
      <RollingDate text="30 Oct 2026" order="2026-10-30" />,
    );

    rerender(<RollingDate text="10 Nov 2026" order="2026-11-10" />);

    expect(calls).toEqual([
      {
        text: " Nov ",
        keyframes: [
          { transform: "translateY(0.5em)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
      },
    ]);
  });

  it("slides a new month name down when the date gets earlier", () => {
    const { rerender } = render(
      <RollingDate text="10 Nov 2026" order="2026-11-10" />,
    );

    rerender(<RollingDate text="30 Oct 2026" order="2026-10-30" />);

    expect(calls).toHaveLength(1);
    expect(calls[0].keyframes[0]).toEqual({
      transform: "translateY(-0.5em)",
      opacity: 0,
    });
  });

  it("leaves text that didn't change where it is", () => {
    const { rerender } = render(
      <RollingDate text="10 Nov 2026" order="2026-11-10" />,
    );

    rerender(<RollingDate text="12 Nov 2026" order="2026-11-12" />);
    rerender(<RollingDate text="20 Nov 2026" order="2026-11-20" />);

    expect(calls).toEqual([]);
  });

  it("slides in a status that replaces a date", () => {
    const { rerender } = render(
      <RollingDate text="22 Jan 2027" order="2027-01-22" />,
    );

    rerender(<RollingDate text="Target reached" order={null} />);

    expect(calls.map((call) => call.text)).toEqual(["Target reached"]);
  });

  it("doesn't animate when the device asks for reduced motion", () => {
    reducedMotion = true;
    const { rerender } = render(
      <RollingDate text="30 Oct 2026" order="2026-10-30" />,
    );

    rerender(<RollingDate text="10 Nov 2026" order="2026-11-10" />);

    expect(calls).toEqual([]);
  });

  it("is hidden from screen readers, who read the plain date beside it", () => {
    const { container } = render(
      <RollingDate text="30 Oct 2026" order="2026-10-30" />,
    );

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
