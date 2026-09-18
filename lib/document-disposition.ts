/** HTTP header presentation only. Does not change stored names or document access. */
export function documentDisposition(mode: "inline" | "attachment", name: string) {
  const safe = name.toWellFormed().replace(/[\u0000-\u001f\u007f/\\"]/g, "_");
  const ascii = safe.replace(/[^\x20-\x7e]/g, "_") || "document";
  const encoded = encodeURIComponent(safe || "document").replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
