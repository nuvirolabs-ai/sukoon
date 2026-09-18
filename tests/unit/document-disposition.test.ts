import { describe, expect, it } from "vitest";
import { documentDisposition } from "../../lib/document-disposition";
describe("document response filenames", () => {
  it("supports Unicode display names without invalid HTTP header characters", () => {
    const header = documentDisposition("inline", "Registry — विजय.pdf");
    expect(() => new Headers({ "Content-Disposition": header })).not.toThrow();
    expect(header).toContain("filename*=UTF-8''Registry%20%E2%80%94");
    expect(decodeURIComponent(header.split("UTF-8''")[1])).toBe("Registry — विजय.pdf");
  });
  it("retains attachment semantics and neutralizes control/path/quote characters", () => {
    const header = documentDisposition("attachment", 'receipt/2026\\draft"\r\n.pdf');
    expect(header.startsWith('attachment; filename="receipt_2026_draft___.pdf"')).toBe(true);
    expect(header).not.toMatch(/[\r\n]/);
    expect(() => new Headers({ "Content-Disposition": header })).not.toThrow();
  });
});
