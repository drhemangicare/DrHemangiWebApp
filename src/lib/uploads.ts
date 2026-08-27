import sharp from "sharp";

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_FILES_PER_REQUEST = 8;
export const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

/**
 * Cost/storage efficiency: images are downsized (max 2000px on the long
 * edge) and re-encoded as compressed JPEG before they ever reach Supabase
 * Storage. Medical reports uploaded from a phone camera are routinely 4-8 MB;
 * this typically gets them under 400 KB with no visible quality loss for
 * document review, which matters a lot on a 1 GB free storage tier.
 * PDFs are left untouched (compressing them well needs a much heavier
 * dependency than is justified here).
 */
export async function compressIfImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  if (!mimeType.startsWith("image/") || mimeType === "image/heic") {
    // HEIC re-encoding needs libheif support that isn't guaranteed to be
    // present in every deploy target; pass it through unchanged rather than
    // risk a failed upload.
    return { buffer, mimeType, extension: extFromMime(mimeType) };
  }
  try {
    const out = await sharp(buffer)
      .rotate() // respect EXIF orientation before resizing
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    return { buffer: out, mimeType: "image/jpeg", extension: "jpg" };
  } catch {
    return { buffer, mimeType, extension: extFromMime(mimeType) };
  }
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 80);
}

/**
 * Magic-byte sniffing. `file.type` on a multipart part is whatever the client
 * chose to send, so it cannot be the only gate on what gets stored and later
 * handed to the doctor to open.
 */
export function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "%PDF") return "application/pdf";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  // HEIC/HEIF: ISO-BMFF box with an `ftyp` brand of heic/heix/hevc/mif1
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("ascii");
    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) return "image/heic";
  }
  return null;
}
