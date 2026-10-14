package org.shanahcity.app;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;

@CapacitorPlugin(name = "ShanahNativeMedia")
public class ShanahNativeMediaPlugin extends Plugin {

  @Override
  public void load() {
    super.load();
    ShanahMediaEventRelay.setPlugin(this);
  }

  @Override
  protected void handleOnDestroy() {
    ShanahMediaEventRelay.clearPlugin(this);
    super.handleOnDestroy();
  }

  @PluginMethod
  public void isAvailable(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("available", true);
    call.resolve(ret);
  }

  @PluginMethod
  public void play(PluginCall call) {
    String url = call.getString("url");
    if (url == null || url.isEmpty()) {
      call.reject("Missing audio url");
      return;
    }

    Intent intent = new Intent(getContext(), ShanahMediaPlaybackService.class);
    intent.setAction(ShanahMediaPlaybackService.ACTION_LOAD);
    intent.putExtra(ShanahMediaPlaybackService.EXTRA_URL, url);
    intent.putExtra(ShanahMediaPlaybackService.EXTRA_TITLE, call.getString("title", "Shanah City"));
    intent.putExtra(ShanahMediaPlaybackService.EXTRA_ARTIST, call.getString("artist", "Shanah City"));
    String artwork = call.getString("artworkUrl");
    if (artwork != null) {
      intent.putExtra(ShanahMediaPlaybackService.EXTRA_ARTWORK, artwork);
    }
    Double startAt = call.getDouble("startAtSec");
    if (startAt != null && startAt > 0) {
      intent.putExtra(ShanahMediaPlaybackService.EXTRA_START_AT_SEC, startAt);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      getContext().startForegroundService(intent);
    } else {
      getContext().startService(intent);
    }
    call.resolve();
  }

  @PluginMethod
  public void pause(PluginCall call) {
    sendSimpleAction(ShanahMediaPlaybackService.ACTION_PAUSE);
    call.resolve();
  }

  @PluginMethod
  public void resume(PluginCall call) {
    sendSimpleAction(ShanahMediaPlaybackService.ACTION_RESUME);
    call.resolve();
  }

  @PluginMethod
  public void stop(PluginCall call) {
    sendSimpleAction(ShanahMediaPlaybackService.ACTION_STOP);
    call.resolve();
  }

  @PluginMethod
  public void seek(PluginCall call) {
    Double positionSec = call.getDouble("positionSec");
    if (positionSec == null) {
      call.reject("Missing positionSec");
      return;
    }
    Intent intent = new Intent(getContext(), ShanahMediaPlaybackService.class);
    intent.setAction(ShanahMediaPlaybackService.ACTION_SEEK);
    intent.putExtra(ShanahMediaPlaybackService.EXTRA_POSITION_SEC, positionSec);
    getContext().startService(intent);
    call.resolve();
  }

  @PluginMethod
  public void setRate(PluginCall call) {
    Double rate = call.getDouble("rate");
    if (rate == null) {
      call.reject("Missing rate");
      return;
    }
    Intent intent = new Intent(getContext(), ShanahMediaPlaybackService.class);
    intent.setAction(ShanahMediaPlaybackService.ACTION_SET_RATE);
    intent.putExtra(ShanahMediaPlaybackService.EXTRA_RATE, rate.floatValue());
    getContext().startService(intent);
    call.resolve();
  }

  @PluginMethod
  public void getState(PluginCall call) {
    ExoPlayer player = ShanahMediaPlaybackService.getPlayerOrNull();
    if (player == null) {
      JSObject empty = new JSObject();
      empty.put("playing", false);
      empty.put("position", 0);
      empty.put("duration", 0);
      call.resolve(empty);
      return;
    }
    call.resolve(buildState(player));
  }

  private void sendSimpleAction(String action) {
    Intent intent = new Intent(getContext(), ShanahMediaPlaybackService.class);
    intent.setAction(action);
    getContext().startService(intent);
  }

  private JSObject buildState(Player player) {
    JSObject data = new JSObject();
    data.put("playing", player.isPlaying());
    data.put("paused", !player.isPlaying() && player.getPlaybackState() != Player.STATE_ENDED);
    data.put("position", player.getCurrentPosition() / 1000.0);
    double duration = player.getDuration();
    data.put("duration", duration > 0 ? duration / 1000.0 : 0);
    data.put(
      "buffering",
      player.getPlaybackState() == Player.STATE_BUFFERING
        || player.getPlaybackState() == Player.STATE_IDLE
    );
    data.put("ended", player.getPlaybackState() == Player.STATE_ENDED);
    return data;
  }
}
