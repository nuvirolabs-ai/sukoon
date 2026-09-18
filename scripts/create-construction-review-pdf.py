"""Harmless, explicitly synthetic file for the normal Vault acceptance walkthrough."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

target = Path("output/pdf/construction-review-synthetic.pdf")
target.parent.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(target), pagesize=A4)
pdf.setTitle("Sukoon Construction - Synthetic Upload Boundary")
pdf.setFont("Helvetica-Bold", 18)
pdf.drawString(48, 785, "SYNTHETIC CONSTRUCTION RECORD")
pdf.setFont("Helvetica", 12)
for index, line in enumerate([
    "Local browser acceptance only - generated 12 September 2026.",
    "This is not a sanctioned plan, approval, invoice or engineering report.",
    "No real owner, address, signature or private document is included.",
    "Upload through the normal Vault UI. Do not bypass quarantine.",
    "Expected without a scanner: pending/unavailable, not clean.",
    "A successful upload is not a successful malware scan.",
]):
    pdf.drawString(48, 735 - 27 * index, line)
pdf.setFont("Helvetica", 10)
pdf.drawString(48, 45, "Synthetic browser fixture | Page 1 of 1")
pdf.save()
print(target)
