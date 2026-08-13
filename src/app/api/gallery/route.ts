import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canUploadGallery } from "@/lib/gallery-access-server";
import {
  addGalleryPhoto,
  deleteGalleryPhoto,
  getGalleryPhotos,
  isAllowedImage,
  normalizeExternalPhotoUrl,
  saveUploadedFile,
  updateGalleryPhotoVisibility,
} from "@/lib/gallery-server";
import type { GalleryVisibility } from "@/lib/gallery-types";
import { sanitizeGalleryPhotoForViewer } from "@/lib/gallery-utils";
import { mediaGroupMatchHint } from "@/lib/media-group";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const photos = (await getGalleryPhotos()).map((photo) =>
    sanitizeGalleryPhotoForViewer(photo, user),
  );
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
    const visibilityRaw = String(formData.get("visibility") ?? "private").trim();
    const visibility: GalleryVisibility =
      visibilityRaw === "public" ? "public" : "private";

    if (!user) {
      return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });
    }

    if (!(await canUploadGallery(user))) {
      return NextResponse.json(
        {
          error: `Media team access required. Ask a leader to assign the media role, or join ${mediaGroupMatchHint()} on Groups.`,
        },
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
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      title,
      album,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name ?? uploadedBy,
      visibility,
      ...(linkProvider ? { linkProvider } : {}),
    };

    await addGalleryPhoto(photo);

    return NextResponse.json({ photo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    if (!(await canUploadGallery(user))) {
      return NextResponse.json(
        {
          error: `Media team access required. Ask a leader to assign the media role, or join ${mediaGroupMatchHint()} on Groups.`,
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const visibilityRaw = String(body.visibility ?? "").trim();
    const visibility: GalleryVisibility =
      visibilityRaw === "public" ? "public" : "private";

    if (!id) {
      return NextResponse.json({ error: "Photo id is required." }, { status: 400 });
    }

    const photo = await updateGalleryPhotoVisibility(id, visibility);
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    return NextResponse.json({ photo });
  } catch {
    return NextResponse.json({ error: "Could not update photo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    if (!(await canUploadGallery(user))) {
      return NextResponse.json(
        {
          error: `Media team access required. Ask a leader to assign the media role, or join ${mediaGroupMatchHint()} on Groups.`,
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Photo id is required." }, { status: 400 });
    }

    const photo = await deleteGalleryPhoto(id);
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, photo });
  } catch {
    return NextResponse.json({ error: "Could not delete photo." }, { status: 500 });
  }
}
