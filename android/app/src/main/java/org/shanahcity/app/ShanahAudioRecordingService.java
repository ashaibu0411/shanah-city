package org.shanahcity.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import java.io.File;
import java.io.IOException;

public class ShanahAudioRecordingService extends Service {
  public static final String ACTION_START = "org.shanahcity.app.recording.START";
  public static final String ACTION_PAUSE = "org.shanahcity.app.recording.PAUSE";
  public static final String ACTION_RESUME = "org.shanahcity.app.recording.RESUME";
  public static final String ACTION_STOP = "org.shanahcity.app.recording.STOP";
  public static final String ACTION_DISCARD = "org.shanahcity.app.recording.DISCARD";

  public static final String EXTRA_RECORDING_ID = "recordingId";
  public static final String EXTRA_TITLE = "title";

  private static final int NOTIFICATION_ID = 4102;
  private static final String CHANNEL_ID = "shanah_rehearsal_recording";

  @Nullable private MediaRecorder mediaRecorder;
  @Nullable private AudioManager audioManager;
  @Nullable private AudioFocusRequest audioFocusRequest;

  private final AudioManager.OnAudioFocusChangeListener audioFocusListener = focusChange -> {
    switch (focusChange) {
      case AudioManager.AUDIOFOCUS_LOSS:
      case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
      case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
        if (ShanahRecordingSession.getState() == ShanahRecordingSession.State.RECORDING) {
          ShanahRecordingSession.setInterruptionReason(
            focusChange == AudioManager.AUDIOFOCUS_LOSS
              ? "Another app took audio focus. Recording paused."
              : "Audio interrupted (call or another app). Recording paused."
          );
          pauseRecordingInternal();
        }
        break;
      default:
        break;
    }
  };

  @Override
  public int onStartCommand(@Nullable Intent intent, int flags, int startId) {
    if (intent == null || intent.getAction() == null) {
      return START_NOT_STICKY;
    }

    switch (intent.getAction()) {
      case ACTION_START:
        startRecording(intent);
        break;
      case ACTION_PAUSE:
        pauseRecordingInternal();
        break;
      case ACTION_RESUME:
        resumeRecordingInternal();
        break;
      case ACTION_STOP:
        stopRecording(false);
        break;
      case ACTION_DISCARD:
        stopRecording(true);
        break;
      default:
        break;
    }

    return START_STICKY;
  }

  private void startRecording(Intent intent) {
    if (ShanahRecordingSession.getState() == ShanahRecordingSession.State.RECORDING
      || ShanahRecordingSession.getState() == ShanahRecordingSession.State.PAUSED) {
      return;
    }

    String recordingId = intent.getStringExtra(EXTRA_RECORDING_ID);
    if (recordingId == null || recordingId.isEmpty()) {
      ShanahRecordingSession.setError("Missing recording id.");
      return;
    }

    if (!requestAudioFocus()) {
      ShanahRecordingSession.setError("Microphone is in use by another app.");
      return;
    }

    String title = intent.getStringExtra(EXTRA_TITLE);
    File dir = new File(getFilesDir(), "rehearsal-recordings");
    if (!dir.exists() && !dir.mkdirs()) {
      abandonAudioFocus();
      ShanahRecordingSession.setError("Could not create recording folder.");
      return;
    }

    File output = new File(dir, recordingId + ".m4a");
    if (output.exists()) {
      output.delete();
    }

    MediaRecorder recorder = new MediaRecorder();
    try {
      recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
      recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
      recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
      recorder.setAudioEncodingBitRate(128_000);
      recorder.setAudioSamplingRate(44_100);
      recorder.setOutputFile(output.getAbsolutePath());
      recorder.prepare();
      recorder.start();

      mediaRecorder = recorder;
      ShanahRecordingSession.markRecording(recordingId, title, output);
      startForeground(NOTIFICATION_ID, buildNotification(title, false, null));
    } catch (IOException | RuntimeException error) {
      abandonAudioFocus();
      ShanahRecordingSession.setError(
        error.getMessage() != null ? error.getMessage() : "Could not start recording."
      );
      safeReleaseRecorder(recorder);
      mediaRecorder = null;
      stopForeground(true);
      stopSelf();
    }
  }

  private void pauseRecordingInternal() {
    if (mediaRecorder == null || ShanahRecordingSession.getState() != ShanahRecordingSession.State.RECORDING) {
      return;
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      try {
        mediaRecorder.pause();
        ShanahRecordingSession.markPaused();
        updateNotification(
          ShanahRecordingSession.getTitle(),
          true,
          ShanahRecordingSession.getInterruptionReason()
        );
      } catch (RuntimeException error) {
        ShanahRecordingSession.setError(error.getMessage());
      }
    }
  }

  private void resumeRecordingInternal() {
    if (mediaRecorder == null || ShanahRecordingSession.getState() != ShanahRecordingSession.State.PAUSED) {
      return;
    }
    if (!requestAudioFocus()) {
      ShanahRecordingSession.setError("Microphone is still in use. Try again in a moment.");
      return;
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      try {
        mediaRecorder.resume();
        ShanahRecordingSession.markResumed();
        ShanahRecordingSession.clearInterruptionReason();
        updateNotification(ShanahRecordingSession.getTitle(), false, null);
      } catch (RuntimeException error) {
        ShanahRecordingSession.setError(error.getMessage());
      }
    }
  }

  private void stopRecording(boolean discard) {
    MediaRecorder recorder = mediaRecorder;
    mediaRecorder = null;

    if (recorder != null) {
      try {
        recorder.stop();
      } catch (RuntimeException ignored) {
        // Can happen if stop is called immediately after start.
      }
      safeReleaseRecorder(recorder);
    }

    abandonAudioFocus();

    File file = ShanahRecordingSession.getOutputFile();
    if (discard && file != null && file.exists()) {
      file.delete();
    }

    if (!discard) {
      ShanahRecordingSession.markStopped();
    } else {
      ShanahRecordingSession.reset();
    }

    stopForeground(true);
    stopSelf();
  }

  private boolean requestAudioFocus() {
    audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
    if (audioManager == null) {
      return true;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      AudioAttributes attributes = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build();
      audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(attributes)
        .setOnAudioFocusChangeListener(audioFocusListener)
        .setAcceptsDelayedFocusGain(false)
        .build();
      int result = audioManager.requestAudioFocus(audioFocusRequest);
      return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    int result = audioManager.requestAudioFocus(
      audioFocusListener,
      AudioManager.STREAM_MUSIC,
      AudioManager.AUDIOFOCUS_GAIN
    );
    return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
  }

  private void abandonAudioFocus() {
    if (audioManager == null) {
      return;
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
      audioManager.abandonAudioFocusRequest(audioFocusRequest);
      audioFocusRequest = null;
    } else {
      audioManager.abandonAudioFocus(audioFocusListener);
    }
  }

  private void safeReleaseRecorder(@Nullable MediaRecorder recorder) {
    if (recorder == null) {
      return;
    }
    try {
      recorder.reset();
    } catch (RuntimeException ignored) {
    }
    try {
      recorder.release();
    } catch (RuntimeException ignored) {
    }
  }

  private Notification buildNotification(String title, boolean paused, @Nullable String subtitle) {
    ensureChannel();

    Intent launchIntent = new Intent(this, MainActivity.class);
    launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    PendingIntent contentIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );

    String status = paused ? "Paused" : "Recording";
    if (subtitle != null && !subtitle.isEmpty()) {
      status = subtitle;
    }

    return new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title != null ? title : "Rehearsal recording")
      .setContentText(status + " — tap to return to Shanah City")
      .setSmallIcon(R.drawable.ic_stat_shanah)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(contentIntent)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .build();
  }

  private void updateNotification(String title, boolean paused, @Nullable String subtitle) {
    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager != null) {
      manager.notify(NOTIFICATION_ID, buildNotification(title, paused, subtitle));
    }
  }

  private void ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    NotificationManager manager = getSystemService(NotificationManager.class);
    if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) {
      return;
    }
    NotificationChannel channel = new NotificationChannel(
      CHANNEL_ID,
      "Rehearsal recording",
      NotificationManager.IMPORTANCE_LOW
    );
    channel.setDescription("Shows when Shanah Worship rehearsal audio is being recorded.");
    manager.createNotificationChannel(channel);
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }
}
