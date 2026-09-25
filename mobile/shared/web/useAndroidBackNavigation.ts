import { useCanGoBack, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useEffectEvent } from "react";

import { dismissContextMenu, isContextMenuOpen } from "~/contextMenuFallback";
import { isSidebarUtilityPage } from "~/components/sidebar/mainAppLocation";
import {
  ANDROID_BACK_EVENT,
  closeAndroidBackPanel,
  dismissAndroidBackOverlay,
} from "./androidBack";

/** Installed by the root route, including onboarding and connection screens. */
export function useAndroidBackNavigation() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const pathname = useLocation({ select: (location) => location.pathname });
  const onBack = useEffectEvent((event: Event) => {
    if (isContextMenuOpen()) {
      event.preventDefault();
      dismissContextMenu();
      return;
    }
    if (dismissAndroidBackOverlay() || closeAndroidBackPanel()) {
      event.preventDefault();
      return;
    }
    if (canGoBack) {
      event.preventDefault();
      router.history.back();
    } else if (isSidebarUtilityPage(pathname)) {
      event.preventDefault();
      void router.navigate({ to: "/", replace: true });
    }
    // The index redirects to a draft with replace:true. A thread/draft with no
    // history is already the root; navigating to "/" would create another draft.
  });

  useEffect(() => {
    const handler = (event: Event) => onBack(event);
    window.addEventListener(ANDROID_BACK_EVENT, handler);
    return () => window.removeEventListener(ANDROID_BACK_EVENT, handler);
  }, []);
}
