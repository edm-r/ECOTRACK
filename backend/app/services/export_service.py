"""
Export signalements en CSV ou PDF.

CSV : module csv standard, encodage UTF-8 BOM (compatible Excel).
PDF : fpdf2 — table simple sans dépendances système.
"""
import csv
import io
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def _fetch_reports(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID],
    status: Optional[str],
    from_date: Optional[date],
    to_date: Optional[date],
) -> list:
    where_parts = []
    params: dict = {}

    if zone_id is not None:
        where_parts.append("c.zone_id = :zone_id")
        params["zone_id"] = zone_id
    if status:
        where_parts.append("r.status = :status")
        params["status"] = status
    if from_date is not None:
        where_parts.append("r.created_at >= :from_date")
        params["from_date"] = datetime(from_date.year, from_date.month, from_date.day)
    if to_date is not None:
        where_parts.append("r.created_at < :to_date")
        params["to_date"] = datetime(
            to_date.year, to_date.month, to_date.day, 23, 59, 59
        )

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    sql = f"""
        SELECT r.id, c.qr_code, z.name AS zone_name, r.type,
               r.status, r.comment, u.email AS user_email, r.created_at
        FROM reports r
        JOIN containers c ON c.id = r.container_id
        LEFT JOIN zones z ON z.id = c.zone_id
        LEFT JOIN users u ON u.id = r.user_id
        {where_sql}
        ORDER BY r.created_at DESC
        LIMIT 10000
    """
    return (await db.execute(text(sql), params)).fetchall()


async def export_reports_csv(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> bytes:
    rows = await _fetch_reports(db, zone_id, status, from_date, to_date)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["ID", "Container QR", "Zone", "Type", "Statut", "Commentaire", "Signalé par", "Créé le"]
    )
    for r in rows:
        writer.writerow([
            str(r[0]),
            r[1] or "",
            r[2] or "",
            r[3] or "",
            r[4] or "",
            r[5] or "",
            r[6] or "",
            r[7].isoformat() if r[7] else "",
        ])

    return output.getvalue().encode("utf-8-sig")


async def export_reports_pdf(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> bytes:
    from fpdf import FPDF

    rows = await _fetch_reports(db, zone_id, status, from_date, to_date)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=10)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "ECOTRACK - Rapport des signalements", ln=True)
    pdf.set_font("Helvetica", size=8)
    pdf.cell(
        0, 6,
        f"Généré le {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} — {len(rows)} entrée(s)",
        ln=True,
    )
    pdf.ln(4)

    # Column definitions: (label, width)
    cols = [
        ("ID (abrégé)", 32),
        ("QR Code", 28),
        ("Zone", 30),
        ("Type", 22),
        ("Statut", 22),
        ("Créé le", 28),
    ]
    total_w = sum(w for _, w in cols)

    # Header row
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(41, 128, 185)
    pdf.set_text_color(255, 255, 255)
    for label, w in cols:
        pdf.cell(w, 7, label, border=0, fill=True)
    pdf.ln()

    # Data rows
    pdf.set_font("Helvetica", size=7)
    pdf.set_text_color(0, 0, 0)
    alt = False
    for row in rows:
        if alt:
            pdf.set_fill_color(240, 240, 240)
        else:
            pdf.set_fill_color(255, 255, 255)
        values = [
            str(row[0])[:8] + "…",
            (row[1] or "")[:14],
            (row[2] or "")[:16],
            (row[3] or "")[:12],
            (row[4] or "")[:12],
            row[7].strftime("%Y-%m-%d") if row[7] else "",
        ]
        for val, (_, w) in zip(values, cols):
            pdf.cell(w, 6, str(val), border=0, fill=True)
        pdf.ln()
        alt = not alt

    # Footer
    pdf.set_y(-15)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 10, f"ECOTRACK © {datetime.now(timezone.utc).year}", align="C")

    return bytes(pdf.output())
