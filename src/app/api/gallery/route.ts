import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  addGalleryPhoto,
  canUploadGallery,
  getGalleryPhotos,
  isAllowedImage,
  normalizeExternalPhotoUrl,
  saveUploadedFile,
} from "@/lib/gallery-server";

export async function GET() {
  const photos = await getGalleryPhotos();
  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    const formData = await request.formData();
    const file = formData.get("file");
    const externalUrl = String(formData.get("externalUrl") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const album = String(formData.get("album") ?? "Community").trim();
    const uploadedBy = String(formData.get("uploadedBy") ?? "Shanah City Team").trim();
    const pin = String(formData.get("pin") ?? "");

    if (!canUploadGallery(user, pin)) {
      return NextResponse.json(
        { error: "Backend team access required. Sign in as team/leader or use the team upload PIN." },
        { status: 403 },
      );
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const hasFile = file instanceof File && file.size > 0;
    const hasLink = Boolean(externalUrl);

    if (!hasFile && !hasLink) {
      return NextResponse.json(
        { error: "Choose a photo file or paste a cloud share link." },
        { status: 400 },
      );
    }

    if (hasFile && hasLink) {
      return NextResponse.json(
        { error: "Use either a file upload or a link, not both." },
        { status: 400 },
      );
    }

    let url: string;
    let linkProvider: string | undefined;

    if (hasLink) {
      try {
        const normalized = normalizeExternalPhotoUrl(externalUrl);
        url = normalized.storedUrl;
        linkProvider = normalized.provider;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid photo link.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else {
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No photo file provided." }, { status: 400 });
      }
      if (!isAllowedImage(file)) {
        return NextResponse.json(
          { error: "Use JPG, PNG, WEBP, or GIF under 10 MB." },
          { status: 400 },
        );
      }
      url = await saveUploadedFile(file);
    }

    const photo = {
      id: `upload-${Date.now()}`,
      url,
      title,
      album,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name ?? uploadedBy,
      ...(linkProvider ? { linkProvider } : {}),
    };

    await addGalleryPhoto(photo);

    return NextResponse.json({ photo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
