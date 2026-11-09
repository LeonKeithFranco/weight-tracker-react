import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHiddenSeries } from "./useHiddenSeries";

describe("useHiddenSeries", () => {
  it("starts with every series shown", () => {
    const { result } = renderHook(() => useHiddenSeries());

    expect(result.current.hidden.size).toBe(0);
  });

  it("hides a series, then shows it again", () => {
    const { result } = renderHook(() => useHiddenSeries());

    act(() => result.current.toggle("weight"));
    expect([...result.current.hidden]).toEqual(["weight"]);

    act(() => result.current.toggle("weight"));
    expect(result.current.hidden.size).toBe(0);
  });

  it("keeps other hidden series when one changes", () => {
    const { result } = renderHook(() => useHiddenSeries());

    act(() => result.current.toggle("weight"));
    act(() => result.current.toggle("average7"));
    act(() => result.current.toggle("weight"));

    expect([...result.current.hidden]).toEqual(["average7"]);
  });
});
