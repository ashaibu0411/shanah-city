package org.shanahcity.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebView webView = getBridge().getWebView();
    if (webView != null) {
      // Keep long-press paste/copy menus working inside form fields.
      webView.setOnLongClickListener(view -> false);
      webView.setLongClickable(true);
      webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
  }

  @Override
  public void onPause() {
    super.onPause();
    keepWebViewAlive();
  }

  @Override
  public void onStop() {
    super.onStop();
    keepWebViewAlive();
  }

  private void keepWebViewAlive() {
    if (getBridge() == null) return;
    WebView webView = getBridge().getWebView();
    if (webView == null) return;
    // Keep JS/TTS running so devotion audio can continue in another app.
    webView.onResume();
    webView.resumeTimers();
  }
}
