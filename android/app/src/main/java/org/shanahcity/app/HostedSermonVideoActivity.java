package org.shanahcity.app;

import android.app.PictureInPictureParams;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Rational;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.SeekBar;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

public class HostedSermonVideoActivity extends AppCompatActivity {
  public static final String EXTRA_URL = "url";
  public static final String EXTRA_TITLE = "title";
  public static final String EXTRA_ARTIST = "artist";
  public static final String EXTRA_PUBLISHED = "publishedAt";
  public static final String EXTRA_START_AT_SEC = "startAtSec";
  public static final String EXTRA_PLAYBACK_RATE = "playbackRate";
  public static final String EXTRA_LAST_POSITION = "lastPositionSec";
  public static final String EXTRA_COMPLETED = "completed";

  private ExoPlayer player;
  private PlayerView playerView;
  private SeekBar seekBar;
  private ImageButton playPauseButton;
  private boolean scrubbing = false;
  private final Handler handler = new Handler(Looper.getMainLooper());
  private final Runnable progressTick =
    new Runnable() {
      @Override
      public void run() {
        updateSeekUi();
        handler.postDelayed(this, 500);
      }
    };

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_hosted_sermon_video);

    String url = getIntent().getStringExtra(EXTRA_URL);
    if (url == null || url.isEmpty()) {
      finishWithResult(0, false);
      return;
    }

    TextView titleView = findViewById(R.id.hosted_video_title);
    TextView metaView = findViewById(R.id.hosted_video_meta);
    titleView.setText(getIntent().getStringExtra(EXTRA_TITLE));
    String artist = getIntent().getStringExtra(EXTRA_ARTIST);
    String published = getIntent().getStringExtra(EXTRA_PUBLISHED);
    metaView.setText(artist != null ? artist + (published != null ? " · " + published : "") : published);

    playerView = findViewById(R.id.hosted_video_player_view);
    seekBar = findViewById(R.id.hosted_video_seek);
    playPauseButton = findViewById(R.id.hosted_video_play_pause);
    Button rewind = findViewById(R.id.hosted_video_rewind);
    Button forward = findViewById(R.id.hosted_video_forward);
    ImageButton close = findViewById(R.id.hosted_video_close);

    player = new ExoPlayer.Builder(this).build();
    playerView.setPlayer(player);
    player.setMediaItem(MediaItem.fromUri(Uri.parse(url)));
    player.prepare();

    double startAt = getIntent().getDoubleExtra(EXTRA_START_AT_SEC, 0);
    if (startAt > 0) {
      player.seekTo((long) (startAt * 1000));
    }

    float rate = (float) getIntent().getDoubleExtra(EXTRA_PLAYBACK_RATE, 1.0);
    if (rate > 0) {
      player.setPlaybackSpeed(rate);
    }

    player.setPlayWhenReady(true);
    updatePlayPauseIcon();

    player.addListener(
      new Player.Listener() {
        @Override
        public void onPlaybackStateChanged(int playbackState) {
          updatePlayPauseIcon();
          if (playbackState == Player.STATE_ENDED) {
            finishWithResult(player.getDuration() / 1000.0, true);
          }
        }

        @Override
        public void onIsPlayingChanged(boolean isPlaying) {
          updatePlayPauseIcon();
        }
      }
    );

    playPauseButton.setOnClickListener(v -> {
      if (player.isPlaying()) {
        player.pause();
      } else {
        player.play();
      }
    });

    rewind.setOnClickListener(v -> player.seekTo(Math.max(0, player.getCurrentPosition() - 15_000)));
    forward.setOnClickListener(
      v -> player.seekTo(Math.min(player.getDuration(), player.getCurrentPosition() + 15_000))
    );

    close.setOnClickListener(v -> finishWithResult(player.getCurrentPosition() / 1000.0, false));

    seekBar.setOnSeekBarChangeListener(
      new SeekBar.OnSeekBarChangeListener() {
        @Override
        public void onProgressChanged(SeekBar bar, int progress, boolean fromUser) {
          if (fromUser && player.getDuration() > 0) {
            player.seekTo((long) ((progress / 1000.0) * player.getDuration()));
          }
        }

        @Override
        public void onStartTrackingTouch(SeekBar bar) {
          scrubbing = true;
        }

        @Override
        public void onStopTrackingTouch(SeekBar bar) {
          scrubbing = false;
        }
      }
    );

    handler.post(progressTick);
  }

  @Override
  public void onUserLeaveHint() {
    super.onUserLeaveHint();
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || player == null) {
      return;
    }
    if (isInPictureInPictureMode()) {
      return;
    }
    try {
      PictureInPictureParams params =
        new PictureInPictureParams.Builder().setAspectRatio(new Rational(16, 9)).build();
      enterPictureInPictureMode(params);
    } catch (IllegalStateException ignored) {
      // Activity not resumed.
    }
  }

  @Override
  protected void onStop() {
    super.onStop();
    if (player != null && player.isPlaying() && !isInPictureInPictureMode()) {
      player.pause();
    }
  }

  @Override
  protected void onDestroy() {
    handler.removeCallbacks(progressTick);
    if (playerView != null) {
      playerView.setPlayer(null);
    }
    if (player != null) {
      player.release();
      player = null;
    }
    super.onDestroy();
  }

  @Override
  public void onBackPressed() {
    if (player != null) {
      finishWithResult(player.getCurrentPosition() / 1000.0, false);
    } else {
      super.onBackPressed();
    }
  }

  private void updateSeekUi() {
    if (player == null || scrubbing) {
      return;
    }
    long duration = player.getDuration();
    if (duration > 0) {
      int progress = (int) Math.round((player.getCurrentPosition() / (double) duration) * 1000);
      seekBar.setProgress(progress);
    }
  }

  private void updatePlayPauseIcon() {
    if (player == null || playPauseButton == null) {
      return;
    }
    playPauseButton.setImageResource(
      player.isPlaying() ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play
    );
  }

  private void finishWithResult(double lastPositionSec, boolean completed) {
    Intent data = new Intent();
    data.putExtra(EXTRA_LAST_POSITION, lastPositionSec);
    data.putExtra(EXTRA_COMPLETED, completed);
    setResult(RESULT_OK, data);
    finish();
  }
}
