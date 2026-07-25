import { describe, expect, it } from "vite-plus/test";

import { resolvePhoneSheetGesture } from "./phone-sheet.logic";

describe("resolvePhoneSheetGesture", () => {
  it("dismisses a sheet after a downward swipe", () => {
    expect(
      resolvePhoneSheetGesture({
        snap: "medium",
        deltaY: 110,
        elapsedMs: 400,
        allowMediumSnap: true,
      }),
    ).toBe("dismiss");
  });

  it("dismisses a sheet after a short fast flick", () => {
    expect(
      resolvePhoneSheetGesture({
        snap: "full",
        deltaY: 50,
        elapsedMs: 80,
        allowMediumSnap: true,
      }),
    ).toBe("dismiss");
  });

  it("expands a medium sheet after an upward drag", () => {
    expect(
      resolvePhoneSheetGesture({
        snap: "medium",
        deltaY: -70,
        elapsedMs: 300,
        allowMediumSnap: true,
      }),
    ).toBe("full");
  });

  it("settles a full sheet at medium after a small downward drag", () => {
    expect(
      resolvePhoneSheetGesture({
        snap: "full",
        deltaY: 45,
        elapsedMs: 300,
        allowMediumSnap: true,
      }),
    ).toBe("medium");
  });

  it("keeps a full-only sheet expanded when the gesture does not dismiss it", () => {
    expect(
      resolvePhoneSheetGesture({
        snap: "full",
        deltaY: 40,
        elapsedMs: 300,
        allowMediumSnap: false,
      }),
    ).toBe("full");
  });
});
