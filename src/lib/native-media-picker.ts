"use client";

import { Capacitor } from "@capacitor/core";
import { COMMUNITY_STORY_MAX_MEDIA } from "@/lib/community-story-utils";
import { isNativeAppPlatform } from "@/lib/native-app";
import { setNativeBackgroundAudioActive, setNativeFilePickerOpen } from "@/lib/native-webview-bridge";

async function blobToStoryFile(blob: Blob, ext: string, index: number) {
  const type = blob.type || `image/${ext}`;
  return new File([blob], `story-${Date.now()}-${index}.${ext}`, { type });
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
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const ext =
        photo.format === "png" ? "png" : photo.format === "webp" ? "webp" : "jpeg";
      files.push(await blobToStoryFile(blob, ext, index));
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
