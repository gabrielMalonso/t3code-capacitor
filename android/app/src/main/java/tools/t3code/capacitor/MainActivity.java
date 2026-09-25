package tools.t3code.capacitor;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {

    private String mobileBridgeScript;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge == null) return;
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            private boolean pending;

            @Override
            public void handleOnBackPressed() {
                if (pending) return;
                WebView webView = bridge.getWebView();
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(webView);
                if (insets != null && insets.isVisible(WindowInsetsCompat.Type.ime())) {
                    new WindowInsetsControllerCompat(getWindow(), webView).hide(WindowInsetsCompat.Type.ime());
                    return;
                }

                // The web UI consumes Back before Android returns the root task to the background.
                pending = true;
                webView.evaluateJavascript(
                    "!window.dispatchEvent(new Event('t3code:android-back', { cancelable: true }))",
                    handled -> {
                        pending = false;
                        if (isFinishing() || isDestroyed() || "true".equals(handled)) return;
                        moveTaskToBack(true);
                    }
                );
            }
        });
        bridge.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageLoaded(WebView webView) {
                    applyMobileBridge(webView);
                }
            }
        );
        bridge.getWebView().post(() -> applyMobileBridge(bridge.getWebView()));
    }

    private void applyMobileBridge(WebView webView) {
        webView.evaluateJavascript(loadMobileBridgeScript(), null);
    }

    private String loadMobileBridgeScript() {
        if (mobileBridgeScript != null) return mobileBridgeScript;
        try (
            InputStream input = getAssets().open("native-bridge.js");
            ByteArrayOutputStream output = new ByteArrayOutputStream()
        ) {
            byte[] buffer = new byte[8192];
            int length;
            while ((length = input.read(buffer)) != -1) {
                output.write(buffer, 0, length);
            }
            mobileBridgeScript = output.toString(StandardCharsets.UTF_8.name());
            return mobileBridgeScript;
        } catch (IOException error) {
            throw new IllegalStateException("Unable to load native-bridge.js", error);
        }
    }
}
