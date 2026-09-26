function parseArtistFromTitle(title: string) {
  const trimmed = title.trim();
  const separators = [" - ", " – ", " — ", " | "];
  for (const separator of separators) {
    const index = trimmed.indexOf(separator);
    if (index > 0) {
      return {
        artist: trimmed.slice(0, index).trim(),
        song: trimmed.slice(index + separator.length).trim(),
      };
    }
  }
  return { artist: undefined, song: trimmed };
}

export async function fetchSongLyrics(input: { title: string; artist?: string | null }) {
  const title = input.title?.trim();
  if (!title) return null;

  let artist = input.artist?.trim();
  let songTitle = title;
  if (!artist) {
    const parsed = parseArtistFromTitle(title);
    artist = parsed.artist;
    songTitle = parsed.song || title;
  }

  if (!artist) {
    return null;
  }

  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(songTitle)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { lyrics?: string };
    const lyrics = data.lyrics?.trim();
    return lyrics || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
