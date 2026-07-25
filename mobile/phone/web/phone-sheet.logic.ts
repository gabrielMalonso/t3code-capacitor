export type PhoneSheetSnap = "medium" | "full";

export type PhoneSheetGestureResult = PhoneSheetSnap | "dismiss";

export function resolvePhoneSheetGesture(input: {
  snap: PhoneSheetSnap;
  deltaY: number;
  elapsedMs: number;
  allowMediumSnap: boolean;
}): PhoneSheetGestureResult {
  const velocityY = input.deltaY / Math.max(input.elapsedMs, 1);

  if (input.deltaY > 96 || velocityY > 0.55) {
    return "dismiss";
  }
  if (!input.allowMediumSnap) {
    return "full";
  }
  if (input.snap === "medium" && input.deltaY < -56) {
    return "full";
  }
  if (input.snap === "full" && input.deltaY > 36) {
    return "medium";
  }
  return input.snap;
}
