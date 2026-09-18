import { PDFParse } from "pdf-parse";
import type { DocumentParsingPort, ObjectStoragePort, ParsedTextChunk, ProviderResult } from "@/lib/providers";

const PARSER_VERSION = "pdf-parse@2.4.5";

/**
 * Local text-PDF adapter. It deliberately does not attempt OCR: image-only
 * documents are handed to the separate OcrPort and remain honest when that
 * port is unavailable.
 */
export class LocalTextPdfParser implements DocumentParsingPort {
  readonly id = "local-pdf-parse";
  readonly environment = "local" as const;

  constructor(private readonly storage: ObjectStoragePort) {}

  async parse(input: { storageKey: string; mimeType: string; pageLimit: number }): Promise<ProviderResult<{ text: string; chunks: ParsedTextChunk[]; pageCount?: number; parserVersion: string }>> {
    if (input.mimeType !== "application/pdf") return { outcome: "unavailable", reason: "This local parser handles text PDFs only; OCR is a separate unavailable capability." };
    const stored = await this.storage.get(input.storageKey);
    if (stored.outcome === "unavailable") return stored;
    const pageLimit = Math.max(1, Math.min(50, Math.floor(input.pageLimit)));
    const parser = new PDFParse({ data: stored.value.bytes });
    try {
      const info = await parser.getInfo();
      if (info.total > pageLimit) return { outcome: "unavailable", reason: `The PDF has ${info.total} pages; the local parser limit is ${pageLimit}.` };
      const result = await parser.getText({ first: pageLimit });
      const chunks = result.pages.map((page) => ({ page: page.num, text: page.text.trim() })).filter((chunk) => chunk.text.length > 0);
      const text = chunks.map((chunk) => chunk.text).join("\n").trim();
      return { outcome: "available", value: { text, chunks, pageCount: result.total, parserVersion: PARSER_VERSION } };
    } finally {
      await parser.destroy();
    }
  }
}

export function unavailableOcrReason() {
  return "OCR is unavailable because no local OCR binary or approved external provider is configured.";
}
