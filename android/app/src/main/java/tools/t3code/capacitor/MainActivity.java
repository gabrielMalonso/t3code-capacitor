package tools.t3code.capacitor;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    private static final String SAFE_AREA_SCRIPT =
        """
        (() => {
          if (window.__t3CapacitorSafeAreaObserver) return;
          const set = (element, property, value) => element?.style.setProperty(property, value, 'important');
          const composerSelector = '[data-testid="composer-editor"]';
          let observedPath = location.pathname;
          let guardedDraftPath = observedPath.startsWith('/draft/') ? observedPath : null;
          let lastComposerPointerDown = Number.NEGATIVE_INFINITY;
          const updateDraftFocusGuard = () => {
            const path = location.pathname;
            if (path === observedPath) return;
            observedPath = path;
            guardedDraftPath = path.startsWith('/draft/') ? path : null;
          };
          const suppressDraftAutofocus = (editor) => {
            updateDraftFocusGuard();
            if (guardedDraftPath !== location.pathname) return;
            if (performance.now() - lastComposerPointerDown < 750) {
              guardedDraftPath = null;
              return;
            }
            editor.blur();
            window.getSelection()?.removeAllRanges();
          };
          document.addEventListener('pointerdown', (event) => {
            if (event.target instanceof Element && event.target.closest(composerSelector)) {
              lastComposerPointerDown = performance.now();
            }
          }, true);
          document.addEventListener('focusin', (event) => {
            if (event.target instanceof HTMLElement && event.target.matches(composerSelector)) {
              suppressDraftAutofocus(event.target);
            }
          }, true);
          document.addEventListener('keydown', (event) => {
            if (
              event.key !== 'Enter' ||
              event.shiftKey ||
              event.isComposing ||
              event.keyCode === 229 ||
              !(event.target instanceof Element) ||
              !event.target.matches(composerSelector)
            ) return;
            try {
              Object.defineProperty(event, 'shiftKey', { configurable: true, get: () => true });
            } catch {
              event.preventDefault();
              event.stopImmediatePropagation();
              document.execCommand('insertLineBreak');
            }
          }, true);
          const syncStatusBar = () => {
            const style = document.documentElement.classList.contains('dark') ? 'DARK' : 'LIGHT';
            if (window.__t3CapacitorStatusBarStyle === style) return;
            const systemBars = window.Capacitor?.Plugins?.SystemBars;
            if (!systemBars?.setStyle) return;
            window.__t3CapacitorStatusBarStyle = style;
            systemBars.setStyle({ style, bar: 'StatusBar' }).catch(() => {
              window.__t3CapacitorStatusBarStyle = null;
            });
          };
          const apply = () => {
            updateDraftFocusGuard();
            if (document.activeElement instanceof HTMLElement && document.activeElement.matches(composerSelector)) {
              suppressDraftAutofocus(document.activeElement);
            }
            syncStatusBar();
            set(document.documentElement, 'min-height', '100svh');
            set(document.documentElement, 'height', '100%');
            set(document.body, 'min-height', '100svh');
            set(document.body, 'height', '100%');

            const root = document.querySelector('#root');
            set(root, 'min-height', '0');
            set(root, 'height', '100%');
            set(root, 'box-sizing', 'border-box');
            set(root, 'padding-top', 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))');
            set(root, 'padding-bottom', 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))');

            for (const wrapper of document.querySelectorAll('[data-slot="sidebar-wrapper"]')) {
              set(wrapper, 'height', 'calc(100dvh - var(--safe-area-inset-top) - var(--safe-area-inset-bottom))');
              set(wrapper, 'min-height', '0');
            }
            for (const inset of document.querySelectorAll('[data-slot="sidebar-inset"]')) {
              set(inset, 'height', '100%');
              set(inset, 'min-height', '0');
            }
            for (const sidebar of document.querySelectorAll('[data-slot="sidebar-container"]')) {
              set(sidebar, 'top', 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))');
              set(sidebar, 'bottom', 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))');
              set(sidebar, 'height', 'auto');
            }

            const sidebarToggle = document.querySelector('button[aria-label="Toggle main sidebar"]');
            set(sidebarToggle?.parentElement, 'top', 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))');
          };

          const observer = new MutationObserver(apply);
          observer.observe(document.documentElement, { childList: true, subtree: true });
          const themeObserver = new MutationObserver(apply);
          themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
          window.__t3CapacitorSafeAreaObserver = { observer, themeObserver };
          window.__t3CapacitorComposerBehavior = true;
          apply();
        })();
        """;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge == null) return;
        bridge.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageLoaded(WebView webView) {
                    applySafeArea(webView);
                }
            }
        );
        bridge.getWebView().post(() -> applySafeArea(bridge.getWebView()));
    }

    private void applySafeArea(WebView webView) {
        webView.evaluateJavascript(SAFE_AREA_SCRIPT, null);
    }
}
