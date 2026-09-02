import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet


def build_analysis_report(upload, analysis):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()

    story = [
        Paragraph("InsightMart — Sales Analysis Report", styles["Title"]),
        Paragraph(f"Source file: {upload.filename}", styles["Normal"]),
        Paragraph(f"Generated on {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}", styles["Normal"]),
        Spacer(1, 0.6 * cm),
    ]

    kpis = analysis.get("kpis", {})
    rows = [
        ["Metric", "Value"],
        ["Total revenue", f"Rs {kpis.get('revenue', 0):,.0f}"],
        ["Total profit", f"Rs {kpis.get('profit', 0):,.0f}"],
        ["Orders", f"{kpis.get('orders', 0):,}"],
        ["Average order value", f"Rs {kpis.get('aov', 0):,.0f}"],
        ["Margin", f"{kpis.get('margin', 0):.1f}%"],
    ]
    table = Table(rows, colWidths=[8 * cm, 6 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(table)

    doc.build(story)
    return buffer.getvalue()
