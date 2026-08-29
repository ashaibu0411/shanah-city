export async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (response.status === 413) {
      throw new Error("That file is too large to upload.");
    }
    throw new Error(
      response.ok
        ? "Unexpected server response. Try again in a moment."
        : `Upload failed (${response.status}). Try a smaller MP4 video.`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Could not read the server response. Try again.");
  }
}
