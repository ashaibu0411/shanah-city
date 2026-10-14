package org.shanahcity.app;

import android.app.Activity;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShanahNativeHostedVideo")
public class ShanahHostedVideoPlugin extends Plugin {

  @PluginMethod
  public void isAvailable(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("available", true);
    call.resolve(ret);
  }

  @PluginMethod
  public void present(PluginCall call) {
    String url = call.getString("url");
    if (url == null || url.isEmpty()) {
      call.reject("Missing video url");
      return;
    }

    Intent intent = new Intent(getActivity(), HostedSermonVideoActivity.class);
    intent.putExtra(HostedSermonVideoActivity.EXTRA_URL, url);
    intent.putExtra(HostedSermonVideoActivity.EXTRA_TITLE, call.getString("title", "Shanah City"));
    intent.putExtra(HostedSermonVideoActivity.EXTRA_ARTIST, call.getString("artist", ""));
    intent.putExtra(HostedSermonVideoActivity.EXTRA_PUBLISHED, call.getString("publishedAt", ""));

    Double startAt = call.getDouble("startAtSec");
    if (startAt != null && startAt > 0) {
      intent.putExtra(HostedSermonVideoActivity.EXTRA_START_AT_SEC, startAt);
    }

    Double rate = call.getDouble("playbackRate");
    if (rate != null && rate > 0) {
      intent.putExtra(HostedSermonVideoActivity.EXTRA_PLAYBACK_RATE, rate);
    }

    startActivityForResult(call, intent, "hostedVideoFinished");
  }

  @ActivityCallback
  private void hostedVideoFinished(PluginCall call, ActivityResult result) {
    JSObject ret = new JSObject();
    if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
      ret.put(
        "lastPositionSec",
        result.getData().getDoubleExtra(HostedSermonVideoActivity.EXTRA_LAST_POSITION, 0)
      );
      ret.put(
        "completed",
        result.getData().getBooleanExtra(HostedSermonVideoActivity.EXTRA_COMPLETED, false)
      );
    }
    call.resolve(ret);
  }
}
