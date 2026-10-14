package org.shanahcity.app;

import androidx.annotation.Nullable;
import java.io.File;

/** In-memory session state shared between the recording service and plugin. */
public final class ShanahRecordingSession {
  public enum State {
    IDLE,
    RECORDING,
    PAUSED,
    STOPPED
  }

  private static final Object LOCK = new Object();

  private static State state = State.IDLE;
  private static String recordingId = "";
  private static String title = "Rehearsal recording";
  private static long segmentStartedAtMs = 0L;
  private static long accumulatedMs = 0L;
  @Nullable private static File outputFile = null;
  @Nullable private static String lastError = null;
  @Nullable private static String interruptionReason = null;

  private ShanahRecordingSession() {}

  public static void reset() {
    synchronized (LOCK) {
      state = State.IDLE;
      recordingId = "";
      title = "Rehearsal recording";
      segmentStartedAtMs = 0L;
      accumulatedMs = 0L;
      outputFile = null;
      lastError = null;
      interruptionReason = null;
    }
  }

  public static void markRecording(String id, String sessionTitle, File file) {
    synchronized (LOCK) {
      recordingId = id;
      title = sessionTitle != null && !sessionTitle.isEmpty() ? sessionTitle : "Rehearsal recording";
      outputFile = file;
      state = State.RECORDING;
      segmentStartedAtMs = System.currentTimeMillis();
      accumulatedMs = 0L;
      lastError = null;
      interruptionReason = null;
    }
  }

  public static void markPaused() {
    synchronized (LOCK) {
      if (state != State.RECORDING) {
        return;
      }
      accumulatedMs += System.currentTimeMillis() - segmentStartedAtMs;
      segmentStartedAtMs = 0L;
      state = State.PAUSED;
    }
  }

  public static void markResumed() {
    synchronized (LOCK) {
      if (state != State.PAUSED) {
        return;
      }
      segmentStartedAtMs = System.currentTimeMillis();
      state = State.RECORDING;
    }
  }

  public static void markStopped() {
    synchronized (LOCK) {
      if (state == State.RECORDING) {
        accumulatedMs += System.currentTimeMillis() - segmentStartedAtMs;
      }
      segmentStartedAtMs = 0L;
      state = State.STOPPED;
    }
  }

  public static void setError(String message) {
    synchronized (LOCK) {
      lastError = message;
    }
  }

  public static void setInterruptionReason(@Nullable String reason) {
    synchronized (LOCK) {
      interruptionReason = reason;
    }
  }

  @Nullable
  public static String getInterruptionReason() {
    synchronized (LOCK) {
      return interruptionReason;
    }
  }

  public static void clearInterruptionReason() {
    synchronized (LOCK) {
      interruptionReason = null;
    }
  }

  public static long elapsedMs() {
    synchronized (LOCK) {
      if (state == State.RECORDING && segmentStartedAtMs > 0) {
        return accumulatedMs + (System.currentTimeMillis() - segmentStartedAtMs);
      }
      return accumulatedMs;
    }
  }

  public static State getState() {
    synchronized (LOCK) {
      return state;
    }
  }

  public static String getRecordingId() {
    synchronized (LOCK) {
      return recordingId;
    }
  }

  public static String getTitle() {
    synchronized (LOCK) {
      return title;
    }
  }

  @Nullable
  public static File getOutputFile() {
    synchronized (LOCK) {
      return outputFile;
    }
  }

  @Nullable
  public static String getLastError() {
    synchronized (LOCK) {
      return lastError;
    }
  }
}
