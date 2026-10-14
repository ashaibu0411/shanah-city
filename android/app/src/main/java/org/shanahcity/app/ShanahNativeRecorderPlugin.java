package org.shanahcity.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;

@CapacitorPlugin(
  name = "ShanahNativeRecorder",
  permissions = {
    @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = ShanahNativeRecorderPlugin.PERM_MIC)
  }
)
public class ShanahNativeRecorderPlugin extends Plugin {
  static final String PERM_MIC = "microphone";

  @PluginMethod
  public void isAvailable(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("available", true);
    ret.put("incrementalFile", true);
    ret.put("backgroundCapable", true);
    call.resolve(ret);
  }

  @PluginMethod
  public void start(PluginCall call) {
    if (!hasRequiredPermissions()) {
      requestAllPermissions(call, "permCallbackStart");
      return;
    }
    startInternal(call);
  }

  @PermissionCallback
  private void permCallbackStart(PluginCall call) {
    if (!hasRequiredPermissions()) {
      call.reject("Microphone permission is required to record.");
      return;
    }
    startInternal(call);
  }

  private void startInternal(PluginCall call) {
    bridge
      .getExecutor()
      .execute(
        () -> {
          String recordingId = call.getString("recordingId");
          if (recordingId == null || recordingId.isEmpty()) {
            call.reject("Missing recordingId");
            return;
          }

          ShanahRecordingSession.reset();

          Intent intent = new Intent(getContext(), ShanahAudioRecordingService.class);
          intent.setAction(ShanahAudioRecordingService.ACTION_START);
          intent.putExtra(ShanahAudioRecordingService.EXTRA_RECORDING_ID, recordingId);
          intent.putExtra(ShanahAudioRecordingService.EXTRA_TITLE, call.getString("title", "Rehearsal recording"));

          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
          } else {
            getContext().startService(intent);
          }

          waitForState(ShanahRecordingSession.State.RECORDING, 5_000);
          if (ShanahRecordingSession.getLastError() != null) {
            call.reject(ShanahRecordingSession.getLastError());
            return;
          }
          call.resolve(buildStatus());
        }
      );
  }

  @PluginMethod
  public void pause(PluginCall call) {
    sendAction(ShanahAudioRecordingService.ACTION_PAUSE);
    call.resolve(buildStatus());
  }

  @PluginMethod
  public void resume(PluginCall call) {
    sendAction(ShanahAudioRecordingService.ACTION_RESUME);
    call.resolve(buildStatus());
  }

  @PluginMethod
  public void stop(PluginCall call) {
    bridge
      .getExecutor()
      .execute(
        () -> {
          sendAction(ShanahAudioRecordingService.ACTION_STOP);
          waitForState(ShanahRecordingSession.State.STOPPED, 8_000);
          call.resolve(buildResultAfterStop());
        }
      );
  }

  @PluginMethod
  public void discard(PluginCall call) {
    sendAction(ShanahAudioRecordingService.ACTION_DISCARD);
    ShanahRecordingSession.reset();
    call.resolve(buildStatus());
  }

  @PluginMethod
  public void getStatus(PluginCall call) {
    call.resolve(buildStatus());
  }

  @PluginMethod
  public void listLocalRecordings(PluginCall call) {
    bridge
      .getExecutor()
      .execute(
        () -> {
          JSArray recordings = new JSArray();
          File dir = new File(getContext().getFilesDir(), "rehearsal-recordings");
          File[] files = dir.exists() ? dir.listFiles() : null;
          if (files != null) {
            java.util.Arrays.sort(
              files,
              (left, right) -> Long.compare(right.lastModified(), left.lastModified())
            );
            for (File file : files) {
              if (!file.isFile() || !file.getName().endsWith(".m4a")) {
                continue;
              }
              JSObject entry = new JSObject();
              String name = file.getName();
              String id = name.endsWith(".m4a") ? name.substring(0, name.length() - 4) : name;
              entry.put("recordingId", id);
              entry.put("path", file.getAbsolutePath());
              entry.put("fileName", name);
              entry.put("fileSizeBytes", file.length());
              entry.put("lastModified", file.lastModified());
              recordings.put(entry);
            }
          }
          JSObject ret = new JSObject();
          ret.put("recordings", recordings);
          call.resolve(ret);
        }
      );
  }

  @PluginMethod
  public void deleteLocalRecording(PluginCall call) {
    String recordingId = call.getString("recordingId");
    if (recordingId == null || recordingId.isEmpty()) {
      call.reject("Missing recordingId");
      return;
    }
    File file = new File(getContext().getFilesDir(), "rehearsal-recordings/" + recordingId + ".m4a");
    if (file.exists()) {
      file.delete();
    }
    call.resolve();
  }

  private void sendAction(String action) {
    Intent intent = new Intent(getContext(), ShanahAudioRecordingService.class);
    intent.setAction(action);
    getContext().startService(intent);
  }

  private JSObject buildStatus() {
    JSObject data = new JSObject();
    data.put("state", mapState(ShanahRecordingSession.getState()));
    data.put("elapsedMs", ShanahRecordingSession.elapsedMs());
    data.put("recordingId", ShanahRecordingSession.getRecordingId());
    String error = ShanahRecordingSession.getLastError();
    if (error != null) {
      data.put("error", error);
    }
    String interruption = ShanahRecordingSession.getInterruptionReason();
    if (interruption != null) {
      data.put("interruptionReason", interruption);
    }
    return data;
  }

  private JSObject buildResultAfterStop() {
    JSObject data = buildStatus();
    File file = ShanahRecordingSession.getOutputFile();
    if (file != null && file.exists()) {
      data.put("path", file.getAbsolutePath());
      data.put("fileName", file.getName());
      data.put("mimeType", "audio/mp4");
      data.put("fileSizeBytes", file.length());
      data.put("durationMs", ShanahRecordingSession.elapsedMs());
    }
    return data;
  }

  private void waitForState(ShanahRecordingSession.State target, long timeoutMs) {
    long deadline = System.currentTimeMillis() + timeoutMs;
    while (System.currentTimeMillis() < deadline) {
      ShanahRecordingSession.State current = ShanahRecordingSession.getState();
      if (current == target) {
        return;
      }
      if (ShanahRecordingSession.getLastError() != null) {
        return;
      }
      try {
        Thread.sleep(80);
      } catch (InterruptedException ignored) {
        return;
      }
    }
  }

  private String mapState(ShanahRecordingSession.State state) {
    switch (state) {
      case RECORDING:
        return "recording";
      case PAUSED:
        return "paused";
      case STOPPED:
        return "stopped";
      case IDLE:
      default:
        return "idle";
    }
  }
}
