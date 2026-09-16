"use client";

import { Capacitor } from "@capacitor/core";
import { COMMUNITY_STORY_MAX_MEDIA } from "@/lib/community-story-utils";
import { isNativeAppPlatform } from "@/lib/native-app";
import { setNativeBackgroundAudioActive, setNativeFilePickerOpen } from "@/lib/native-webview-bridge";

async function readPhotoBlob(webPath: string) {
  const readUrl = Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(webPath) : webPath;
  const response = await fetch(readUrl);
  if (!response.ok) {
    throw new Error("Could not read the selected photo.");
  }
  return response.blob();
}

async function blobToStoryFile(blob: Blob, ext: string, index: number) {
  const type = blob.type || `image/${ext}`;
  return new File([blob], `story-${Date.now()}-${index}.${ext}`, { type });
}

async function blobToProfileFile(blob: Blob, ext: string) {
  const type = blob.type || `image/${ext}`;
  return new File([blob], `profile-${Date.now()}.${ext}`, { type });
}

async function uriToImageFile(webPath: string, format: string | undefined, prefix: string, index = 0) {
  const blob = await readPhotoBlob(webPath);
  const ext = format === "png" ? "png" : format === "webp" ? "webp" : "jpeg";
  return prefix === "profile"
    ? blobToProfileFile(blob, ext)
    : blobToStoryFile(blob, ext, index);
}

function dataUrlToProfileFile(dataUrl: string, format: string | undefined) {
  const parts = dataUrl.split(",");
  const base64 = parts[1];
  if (!base64) {
    throw new Error("Could not read the selected photo.");
  }
  const mime =
    parts[0]?.match(/data:(.*?);/i)?.[1] ??
    (format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg");
  const ext = format === "png" ? "png" : format === "webp" ? "webp" : "jpg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], `profile-${Date.now()}.${ext}`, { type: mime });
}

/** Native camera / photo library picker for profile photos (avoids WKWebView camera crash on iOS). */
export async function pickProfilePhotoFile(): Promise<File | null> {
  if (!isNativeAppPlatform()) return null;

  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
    });
    if (!photo.dataUrl) return null;
    return dataUrlToProfileFile(photo.dataUrl, photo.format);
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) {
      return null;
    }
    throw error instanceof Error ? error : new Error("Could not open the photo picker.");
  }
}

async function pickAndroidGalleryImages(limit: number): Promise<File[]> {
  if (Capacitor.getPlatform() !== "android") return [];
  try {
    const { Camera } = await import("@capacitor/camera");
    const result = await Camera.pickImages({
      quality: 90,
      limit: Math.max(1, Math.min(limit, COMMUNITY_STORY_MAX_MEDIA)),
    });
    const files: File[] = [];
    for (let index = 0; index < result.photos.length; index += 1) {
      const photo = result.photos[index];
      if (!photo?.webPath) continue;
      files.push(await uriToImageFile(photo.webPath, photo.format, "story", index));
    }
    return files;
  } catch {
    return [];
  }
}

function pickNativeGalleryFiles(input: HTMLInputElement): Promise<File[]> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (files: File[]) => {
      if (settled) return;
      settled = true;
      input.removeEventListener("change", onChange);
      setNativeFilePickerOpen(false);
      window.setTimeout(() => {
        input.value = "";
      }, 1000);
      resolve(files);
    };

    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      finish(Array.from(target.files ?? []));
    };

    input.addEventListener("change", onChange);
    setNativeFilePickerOpen(true);
    input.click();
  });
}

function pickWebGalleryFiles(input: HTMLInputElement): Promise<File[]> {
  return new Promise((resolve) => {
    const onChange = (event: Event) => {
      input.removeEventListener("change", onChange);
      const files = Array.from((event.target as HTMLInputElement).files ?? []);
      input.value = "";
      resolve(files);
    };
    input.addEventListener("change", onChange);
    input.click();
  });
}

export async function pickCommunityGalleryFiles(
  input: HTMLInputElement,
  options?: { preferNativePhotoPicker?: boolean },
): Promise<File[]> {
  if (options?.preferNativePhotoPicker) {
    const limit = input.multiple ? COMMUNITY_STORY_MAX_MEDIA : 1;
    const images = await pickAndroidGalleryImages(limit);
    if (images.length) return images;
  }

  if (isNativeAppPlatform()) {
    return pickNativeGalleryFiles(input);
  }

  return pickWebGalleryFiles(input);
}

export function openCommunityGalleryPicker(
  input: HTMLInputElement | null,
  onFiles: (files: File[]) => void,
  options?: { preferNativePhotoPicker?: boolean },
) {
  if (!input) return;
  void pickCommunityGalleryFiles(input, options).then((files) => {
    if (files.length) onFiles(files);
  });
}

export { setNativeBackgroundAudioActive, setNativeFilePickerOpen };
