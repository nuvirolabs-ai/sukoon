"""New harmless synthetic PDF, independent of the preserved completed review project."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

target = Path("output/pdf/local-scanner-acceptance-synthetic.pdf")
target.parent.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(target), pagesize=A4)
pdf.setTitle("Sukoon - Synthetic Local Scanner Acceptance")
pdf.setFont("Helvetica-Bold", 18)
pdf.drawString(48, 785, "SYNTHETIC SCANNER ACCEPTANCE")
pdf.setFont("Helvetica", 11)
for index, line in enumerate([
    "New local acceptance document - 12 September 2026.",
    "No real property, owner, identity, signature or financial record is included.",
    "This is a harmless text-only PDF, not a building plan or approval.",
    "Upload through Vault and keep the original privately quarantined.",
    "The configured real scanner must record its own version-bound verdict.",
    "Manual classification does not imply authenticity or legal verification.",
    "No OCR output, extracted fields or scan verdict are supplied by this file.",
]):
    pdf.drawString(48, 730 - index * 27, line)
pdf.setFont("Helvetica", 10)
pdf.drawString(48, 45, "Synthetic local fixture | Page 1 of 1")
pdf.save()
print(target)
