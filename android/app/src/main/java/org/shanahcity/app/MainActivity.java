package org.shanahcity.app;

import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private static volatile boolean filePickerOpen = false;
  private static volatile boolean backgroundAudioActive = false;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebView webView = getBridge().getWebView();
    if (webView != null) {
      // Keep long-press paste/copy menus working inside form fields.
      webView.setOnLongClickListener(view -> false);
      webView.setLongClickable(true);
      webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
      webView.addJavascriptInterface(new ShanahBridge(), "ShanahBridge");
    }
  }

  @Override
  public void onPause() {
    super.onPause();
    keepWebViewAliveIfNeeded();
  }

  @Override
  public void onStop() {
    super.onStop();
    keepWebViewAliveIfNeeded();
  }

  private void keepWebViewAliveIfNeeded() {
    if (filePickerOpen || !backgroundAudioActive) {
      return;
    }

    if (getBridge() == null) {
      return;
    }

    WebView webView = getBridge().getWebView();
    if (webView == null) {
      return;
    }

    // Keep JS/TTS running so devotion audio can continue in another app.
    webView.onResume();
    webView.resumeTimers();
  }

  private class ShanahBridge {
    @JavascriptInterface
    public void setFilePickerOpen(boolean open) {
      filePickerOpen = open;
    }

    @JavascriptInterface
    public void setBackgroundAudioActive(boolean active) {
      backgroundAudioActive = active;
    }
  }
}
