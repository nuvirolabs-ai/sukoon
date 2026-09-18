"""Harmless local browser fixture, never seeded into first-run accounts."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

target = Path("output/pdf/t01-purchase-evidence-synthetic.pdf")
target.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(target), pagesize=A4, invariant=1)
c.setTitle("Synthetic T01 purchase evidence - no real property")
c.setFont("Helvetica-Bold", 20)
c.drawString(54, 775, "Synthetic purchase evidence")
c.setFont("Helvetica", 12)
for index, line in enumerate([
    "Sukoon T01 local acceptance only",
    "No real property, identity, seller or financial information.",
    "Prospect reference: SYNTHETIC-T01-EVIDENCE-01",
    "This harmless PDF tests upload, quarantine, scan and manual review.",
    "It is not title evidence, a building approval or a legal opinion.",
    "Receiving or reviewing it does not establish ownership.",
    "Question: does this synthetic page identify any real property?",
    "Synthetic answer: no.",
]):
    c.drawString(54, 735 - index * 26, line)
c.setFont("Helvetica-Oblique", 10)
c.drawString(54, 60, "LOCAL TEST ONLY - no external delivery or verification")
c.showPage()
c.save()
print(target)
