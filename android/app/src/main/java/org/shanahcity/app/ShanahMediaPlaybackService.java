package org.shanahcity.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.DefaultMediaNotificationProvider;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;
import java.lang.ref.WeakReference;

public class ShanahMediaPlaybackService extends MediaSessionService {
  public static final String ACTION_LOAD = "org.shanahcity.app.media.LOAD";
  public static final String ACTION_PAUSE = "org.shanahcity.app.media.PAUSE";
  public static final String ACTION_RESUME = "org.shanahcity.app.media.RESUME";
  public static final String ACTION_STOP = "org.shanahcity.app.media.STOP";
  public static final String ACTION_SEEK = "org.shanahcity.app.media.SEEK";
  public static final String ACTION_SET_RATE = "org.shanahcity.app.media.SET_RATE";

  public static final String EXTRA_URL = "url";
  public static final String EXTRA_TITLE = "title";
  public static final String EXTRA_ARTIST = "artist";
  public static final String EXTRA_ARTWORK = "artwork";
  public static final String EXTRA_START_AT_SEC = "startAtSec";
  public static final String EXTRA_POSITION_SEC = "positionSec";
  public static final String EXTRA_RATE = "rate";

  private static final String NOTIFICATION_CHANNEL_ID = "shanah_media_playback";

  private static WeakReference<ShanahMediaPlaybackService> instanceRef = new WeakReference<>(null);

  private MediaSession mediaSession;
  private ExoPlayer player;

  public static @Nullable ExoPlayer getPlayerOrNull() {
    ShanahMediaPlaybackService service = instanceRef.get();
    return service != null ? service.player : null;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    instanceRef = new WeakReference<>(this);
    ensurePlaybackNotificationChannel();

    setMediaNotificationProvider(new DefaultMediaNotificationProvider(this));

    AudioAttributes audioAttributes = new AudioAttributes.Builder()
      .setUsage(C.USAGE_MEDIA)
      .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
      .build();

    player = new ExoPlayer.Builder(this).build();
    player.setAudioAttributes(audioAttributes, true);
    player.setHandleAudioBecomingNoisy(true);

    Player.Listener listener = new Player.Listener() {
      @Override
      public void onPlaybackStateChanged(int playbackState) {
        ShanahMediaEventRelay.emitState(player);
      }

      @Override
      public void onIsPlayingChanged(boolean isPlaying) {
        ShanahMediaEventRelay.emitState(player);
      }

      @Override
      public void onPositionDiscontinuity(
        Player.PositionInfo oldPosition,
        Player.PositionInfo newPosition,
        int reason
      ) {
        ShanahMediaEventRelay.emitState(player);
      }
    };
    player.addListener(listener);

    mediaSession = new MediaSession.Builder(this, player).setId("ShanahMediaSession").build();
  }

  @Override
  public int onStartCommand(@Nullable Intent intent, int flags, int startId) {
    if (intent != null && intent.getAction() != null) {
      handleCommand(intent);
    }
    return START_STICKY;
  }

  private void handleCommand(Intent intent) {
    String action = intent.getAction();
    if (action == null) {
      return;
    }

    switch (action) {
      case ACTION_LOAD:
        loadFromIntent(intent);
        break;
      case ACTION_PAUSE:
        if (player != null) {
          player.pause();
        }
        break;
      case ACTION_RESUME:
        if (player != null) {
          player.play();
        }
        break;
      case ACTION_STOP:
        if (player != null) {
          player.stop();
          player.clearMediaItems();
        }
        stopSelf();
        break;
      case ACTION_SEEK:
        if (player != null && intent.hasExtra(EXTRA_POSITION_SEC)) {
          double sec = intent.getDoubleExtra(EXTRA_POSITION_SEC, 0);
          player.seekTo((long) (sec * 1000));
        }
        break;
      case ACTION_SET_RATE:
        if (player != null && intent.hasExtra(EXTRA_RATE)) {
          float rate = intent.getFloatExtra(EXTRA_RATE, 1f);
          player.setPlaybackSpeed(rate);
        }
        break;
      default:
        break;
    }
    if (player != null) {
      ShanahMediaEventRelay.emitState(player);
    }
  }

  private void loadFromIntent(Intent intent) {
    String url = intent.getStringExtra(EXTRA_URL);
    if (url == null || url.isEmpty() || player == null) {
      return;
    }

    String title = intent.getStringExtra(EXTRA_TITLE);
    String artist = intent.getStringExtra(EXTRA_ARTIST);
    String artwork = intent.getStringExtra(EXTRA_ARTWORK);
    double startAtSec = intent.getDoubleExtra(EXTRA_START_AT_SEC, 0);

    MediaMetadata.Builder metadata = new MediaMetadata.Builder();
    if (title != null) {
      metadata.setTitle(title);
    }
    if (artist != null) {
      metadata.setArtist(artist);
    }
    if (artwork != null && !artwork.isEmpty()) {
      metadata.setArtworkUri(Uri.parse(artwork));
    }

    MediaItem item = new MediaItem.Builder().setUri(url).setMediaMetadata(metadata.build()).build();

    player.setMediaItem(item);
    player.prepare();
    if (startAtSec > 0) {
      player.seekTo((long) (startAtSec * 1000));
    }
    player.play();
    ShanahMediaEventRelay.emitState(player);
  }

  @Nullable
  @Override
  public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
    return mediaSession;
  }

  @Override
  public void onTaskRemoved(@Nullable Intent rootIntent) {
    if (player != null) {
      player.stop();
      player.clearMediaItems();
    }
    stopSelf();
    super.onTaskRemoved(rootIntent);
  }

  @Override
  public void onDestroy() {
    instanceRef = new WeakReference<>(null);
    if (mediaSession != null) {
      mediaSession.release();
      mediaSession = null;
    }
    if (player != null) {
      player.release();
      player = null;
    }
    super.onDestroy();
  }

  private void ensurePlaybackNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    NotificationChannel channel = new NotificationChannel(
      NOTIFICATION_CHANNEL_ID,
      "Shanah Media",
      NotificationManager.IMPORTANCE_LOW
    );
    channel.setDescription("Background sermon and rehearsal audio");
    NotificationManager manager = getSystemService(NotificationManager.class);
    if (manager != null) {
      manager.createNotificationChannel(channel);
    }
  }
}
