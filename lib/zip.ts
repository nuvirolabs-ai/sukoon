import { deflateRawSync, inflateRawSync } from "node:zlib";

type ZipEntry = { name: string; bytes: Uint8Array };

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) { const out = Buffer.alloc(2); out.writeUInt16LE(value, 0); return out; }
function u32(value: number) { const out = Buffer.alloc(4); out.writeUInt32LE(value >>> 0, 0); return out; }

function safeName(name: string) {
  if (!name || name.length > 180 || name.startsWith("/") || name.includes("\\") || name.split("/").some((part) => part === ".." || part === ".")) throw new Error("ZIP_ENTRY_NAME_INVALID");
  return name;
}

/** Minimal deterministic ZIP writer for selected local export artifacts. */
export function createZip(entries: ZipEntry[]) {
  if (!entries.length || entries.length > 101) throw new Error("ZIP_ENTRY_COUNT_INVALID");
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(safeName(entry.name), "utf8");
    const raw = Buffer.from(entry.bytes);
    const compressed = deflateRawSync(raw, { level: 6 });
    const checksum = crc32(raw);
    const local = Buffer.concat([Buffer.from("PK\x03\x04", "binary"), u16(20), u16(0), u16(8), u16(0), u16(0), u32(checksum), u32(compressed.length), u32(raw.length), u16(name.length), u16(0), name, compressed]);
    locals.push(local);
    const central = Buffer.concat([Buffer.from("PK\x01\x02", "binary"), u16(20), u16(20), u16(0), u16(8), u16(0), u16(0), u32(checksum), u32(compressed.length), u32(raw.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]);
    centrals.push(central);
    offset += local.length;
  }
  const central = Buffer.concat(centrals);
  const end = Buffer.concat([Buffer.from("PK\x05\x06", "binary"), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(offset), u16(0)]);
  return Buffer.concat([...locals, central, end]);
}

/** Small parser used by integration tests to verify artifact contents and hashes. */
export function readZipEntries(bytes: Uint8Array) {
  const input = Buffer.from(bytes);
  const output: Array<{ name: string; bytes: Buffer }> = [];
  let offset = 0;
  while (offset + 30 <= input.length && input.readUInt32LE(offset) === 0x04034b50) {
    const method = input.readUInt16LE(offset + 8);
    const compressedSize = input.readUInt32LE(offset + 18);
    const nameLength = input.readUInt16LE(offset + 26);
    const extraLength = input.readUInt16LE(offset + 28);
    const name = input.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const start = offset + 30 + nameLength + extraLength;
    const compressed = input.subarray(start, start + compressedSize);
    const value = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : (() => { throw new Error("ZIP_METHOD_UNSUPPORTED"); })();
    output.push({ name, bytes: value });
    offset = start + compressedSize;
  }
  return output;
}
