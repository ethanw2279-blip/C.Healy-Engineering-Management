// Works out when a photo was taken, so the app can show it alongside who
// uploaded it. Phones write the capture time into the JPEG's EXIF data; we read
// that directly (no library) and fall back to the file's own timestamp only
// when it's clearly a real one.

/** Returns an ISO timestamp for when the photo was taken, or null if unknown. */
export async function photoTakenAt(file: File, opts: { justCaptured?: boolean } = {}): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null
  try {
    const exif = await readExifDate(file)
    if (exif) return exif
  } catch {
    /* unreadable EXIF — fall through */
  }
  // Taken with the in-app camera button, so it was taken just now.
  if (opts.justCaptured) return new Date().toISOString()
  // Some browsers stamp picked files with the current time, which would be
  // misleading; a timestamp more than a minute old is a genuine file time.
  if (file.lastModified && Date.now() - file.lastModified > 60_000) return new Date(file.lastModified).toISOString()
  return null
}

// EXIF lives in the JPEG's APP1 segment near the start of the file.
async function readExifDate(file: Blob): Promise<string | null> {
  const v = new DataView(await file.slice(0, 256 * 1024).arrayBuffer())
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null // not a JPEG
  let off = 2
  while (off + 4 <= v.byteLength) {
    if (v.getUint8(off) !== 0xff) return null
    const marker = v.getUint8(off + 1)
    if (marker === 0xff) { off++; continue } // fill byte
    if (marker === 0xd9 || marker === 0xda) return null // end of image / start of pixel data
    const len = v.getUint16(off + 2)
    // APP1 starting "Exif\0\0"
    if (marker === 0xe1 && off + 10 <= v.byteLength && v.getUint32(off + 4) === 0x45786966 && v.getUint16(off + 8) === 0) {
      return parseTiff(v, off + 10)
    }
    off += 2 + len
  }
  return null
}

function parseTiff(v: DataView, tiff: number): string | null {
  const le = v.getUint16(tiff) === 0x4949 // "II" = little-endian, "MM" = big-endian
  const u16 = (o: number) => v.getUint16(o, le)
  const u32 = (o: number) => v.getUint32(o, le)
  if (u16(tiff + 2) !== 42) return null

  // tag → offset of its 12-byte directory entry
  const readIfd = (ifd: number) => {
    const tags: Record<number, number> = {}
    if (ifd + 2 > v.byteLength) return tags
    const n = u16(ifd)
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12
      if (e + 12 > v.byteLength) break
      tags[u16(e)] = e
    }
    return tags
  }
  const ascii = (entry: number) => {
    const count = u32(entry + 4)
    const at = count > 4 ? tiff + u32(entry + 8) : entry + 8
    if (at + count > v.byteLength) return null
    let s = ''
    for (let i = 0; i < count; i++) {
      const c = v.getUint8(at + i)
      if (c === 0) break
      s += String.fromCharCode(c)
    }
    return s.trim()
  }

  const ifd0 = readIfd(tiff + u32(tiff + 4))
  let taken: string | null = null
  let offset: string | null = null
  if (ifd0[0x8769] !== undefined) {
    const exif = readIfd(tiff + u32(ifd0[0x8769] + 8))
    if (exif[0x9003] !== undefined) taken = ascii(exif[0x9003]) // DateTimeOriginal
    else if (exif[0x9004] !== undefined) taken = ascii(exif[0x9004]) // DateTimeDigitized
    if (exif[0x9011] !== undefined) offset = ascii(exif[0x9011]) // OffsetTimeOriginal, e.g. "+01:00"
  }
  if (!taken && ifd0[0x0132] !== undefined) taken = ascii(ifd0[0x0132]) // DateTime
  return taken ? toIso(taken, offset) : null
}

// EXIF format is "YYYY:MM:DD HH:MM:SS" with no timezone. With a recorded UTC
// offset the moment is exact; otherwise it's the camera's local clock, which we
// read as this device's local time.
function toIso(exif: string, offset: string | null): string | null {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(exif)
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  if (y === '0000') return null
  const date = offset && /^[+-]\d{2}:\d{2}$/.test(offset)
    ? new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`)
    : new Date(+y, +mo - 1, +d, +h, +mi, +s)
  return isNaN(date.getTime()) ? null : date.toISOString()
}
