import { useMediaQuery } from "~/hooks/useMediaQuery";

export function useIsPhone(): boolean {
  return useMediaQuery({ max: "sm", pointer: "coarse" });
}
