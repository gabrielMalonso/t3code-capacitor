/** Keep phone pickers browsable; tapping their search field still opens the keyboard. */
export function allowAutomaticSearchFocus(): boolean {
  return (
    typeof window === "undefined" ||
    !window.matchMedia?.("(max-width: 639px) and (pointer: coarse)").matches
  );
}
