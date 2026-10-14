package org.shanahcity.app;

import androidx.media3.common.Player;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import java.lang.ref.WeakReference;

/** Forwards ExoPlayer state to the Capacitor plugin listeners on the JS thread. */
public final class ShanahMediaEventRelay {
  private static WeakReference<Plugin> pluginRef = new WeakReference<>(null);

  private ShanahMediaEventRelay() {}

  public static void setPlugin(Plugin plugin) {
    pluginRef = new WeakReference<>(plugin);
  }

  public static void clearPlugin(Plugin plugin) {
    Plugin current = pluginRef.get();
    if (current == plugin) {
      pluginRef = new WeakReference<>(null);
    }
  }

  public static void emitState(Player player) {
    Plugin plugin = pluginRef.get();
    if (plugin == null || player == null) {
      return;
    }

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

    plugin.notifyListeners("state", data);
  }
}
