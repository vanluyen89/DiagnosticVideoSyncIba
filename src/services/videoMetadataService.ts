const CHUNK_SIZE = 1024 * 1024;
const CHUNK_OVERLAP = 256;
const QUICKTIME_CREATION_KEY = 'com.apple.quicktime.creationdate';
const ISO_DATE_PATTERN =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})/;

function normalizeIsoTimezone(value: string): string {
  return value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
}

export async function readQuickTimeCreationTimeMs(
  file: File,
): Promise<number | null> {
  let carry = '';

  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const chunk = await file.slice(offset, offset + CHUNK_SIZE).text();
    const searchable = carry + chunk;
    const keyIndex = searchable.indexOf(QUICKTIME_CREATION_KEY);

    if (keyIndex >= 0) {
      const nearbyMetadata = searchable.slice(
        keyIndex + QUICKTIME_CREATION_KEY.length,
        keyIndex + QUICKTIME_CREATION_KEY.length + 512,
      );
      const match = nearbyMetadata.match(ISO_DATE_PATTERN);
      if (match) {
        const timestampMs = Date.parse(normalizeIsoTimezone(match[0]));
        return Number.isFinite(timestampMs) ? timestampMs : null;
      }
    }

    carry = searchable.slice(-CHUNK_OVERLAP);
  }

  return null;
}
