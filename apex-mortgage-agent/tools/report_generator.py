"""
Report Generator — produces professional HTML mortgage assessment reports
for consultant use. Reports are suitable for printing or sharing with clients.
"""
from __future__ import annotations

from datetime import datetime


GRADE_COLOURS = {
    "A": {"bg": "#1a7a3e", "text": "#ffffff", "light": "#d4edda", "border": "#1a7a3e"},
    "B": {"bg": "#1a4e8a", "text": "#ffffff", "light": "#d0e4f7", "border": "#1a4e8a"},
    "C": {"bg": "#b8760a", "text": "#ffffff", "light": "#fff3cd", "border": "#b8760a"},
    "D": {"bg": "#c05c0a", "text": "#ffffff", "light": "#fde5d1", "border": "#c05c0a"},
    "E": {"bg": "#a01c1c", "text": "#ffffff", "light": "#f8d7da", "border": "#a01c1c"},
    "F": {"bg": "#5c0a0a", "text": "#ffffff", "light": "#f5c6cb", "border": "#5c0a0a"},
}


def generate_report(
    client: dict,
    analysis: dict,
    grade_result: dict,
    matched_lenders: list[dict],
) -> str:
    """
    Generate a complete HTML report for a client.

    Args:
        client: Client profile dict from client_store.
        analysis: Bank statement analysis dict from bank_statement_analyser.
        grade_result: Grading result dict from grading_engine.
        matched_lenders: List of matched lenders from adverse_lender_matcher.

    Returns:
        Complete HTML string suitable for rendering or printing.
    """
    grade = grade_result.get("grade", "F")
    score = grade_result.get("score", 0)
    colours = GRADE_COLOURS.get(grade, GRADE_COLOURS["F"])
    generated_at = datetime.utcnow().strftime("%d %B %Y at %H:%M UTC")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mortgage Assessment Report — {_esc(client.get('name', 'Client'))}</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #1a1a2e; background: #f5f5f7; line-height: 1.5; }}
  .page {{ max-width: 960px; margin: 0 auto; background: #fff; box-shadow: 0 0 24px rgba(0,0,0,.12); }}
  /* Header */
  .report-header {{ background: #0F1B2D; color: #fff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }}
  .report-header h1 {{ font-size: 22px; font-weight: 700; color: #C9A84C; letter-spacing: 1px; }}
  .report-header .subtitle {{ font-size: 13px; color: #a0aec0; margin-top: 4px; }}
  .report-header .meta {{ text-align: right; font-size: 12px; color: #a0aec0; }}
  .report-header .meta strong {{ color: #e2e8f0; display: block; font-size: 16px; margin-bottom: 4px; }}
  /* Sections */
  .section {{ padding: 28px 40px; border-bottom: 1px solid #e8ecf0; }}
  .section:last-child {{ border-bottom: none; }}
  .section-title {{ font-size: 16px; font-weight: 700; color: #0F1B2D; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #C9A84C; display: flex; align-items: center; gap: 8px; }}
  /* Grade badge */
  .grade-hero {{ display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }}
  .grade-badge {{ width: 100px; height: 100px; border-radius: 50%; background: {colours["bg"]}; color: {colours["text"]}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; font-size: 40px; box-shadow: 0 4px 16px rgba(0,0,0,.18); flex-shrink: 0; }}
  .grade-badge .grade-label {{ font-size: 11px; font-weight: 600; letter-spacing: 1px; margin-top: -4px; }}
  .grade-detail {{ flex: 1; min-width: 200px; }}
  .grade-detail h2 {{ font-size: 20px; font-weight: 700; color: {colours["bg"]}; }}
  .grade-detail .grade-desc {{ color: #555; margin: 6px 0 12px; }}
  .score-bar-outer {{ background: #e8ecf0; border-radius: 8px; height: 14px; overflow: hidden; }}
  .score-bar-inner {{ height: 14px; border-radius: 8px; background: {colours["bg"]}; transition: width .3s; }}
  .score-label {{ font-size: 12px; color: #666; margin-top: 4px; text-align: right; }}
  /* Breakdown bars */
  .breakdown-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }}
  @media(max-width: 640px) {{ .breakdown-grid {{ grid-template-columns: 1fr; }} }}
  .breakdown-item {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }}
  .breakdown-item .bi-label {{ font-size: 12px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: .5px; }}
  .breakdown-item .bi-score {{ font-size: 18px; font-weight: 700; color: #0F1B2D; }}
  .breakdown-item .bi-note {{ font-size: 12px; color: #777; margin-top: 4px; }}
  .breakdown-item .bi-bar {{ background: #e8ecf0; border-radius: 4px; height: 6px; margin-top: 8px; overflow: hidden; }}
  .breakdown-item .bi-bar-fill {{ height: 6px; border-radius: 4px; }}
  /* Profile table */
  table.info-table {{ width: 100%; border-collapse: collapse; }}
  table.info-table th {{ text-align: left; font-weight: 600; color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; padding: 8px 10px; background: #f0f4f8; width: 40%; }}
  table.info-table td {{ padding: 8px 10px; border-bottom: 1px solid #eee; }}
  table.info-table tr:last-child td {{ border-bottom: none; }}
  /* Income table */
  table.data-table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  table.data-table thead th {{ background: #0F1B2D; color: #C9A84C; font-weight: 600; padding: 10px 12px; text-align: left; }}
  table.data-table tbody tr:nth-child(even) {{ background: #f8fafc; }}
  table.data-table tbody td {{ padding: 9px 12px; border-bottom: 1px solid #eee; }}
  table.data-table tfoot td {{ font-weight: 700; background: #eef3f8; padding: 9px 12px; }}
  /* Red flags */
  .flag-card {{ background: #fff5f5; border: 1.5px solid #f56565; border-radius: 8px; padding: 14px 18px; margin-bottom: 12px; }}
  .flag-card .flag-title {{ font-weight: 700; color: #c53030; font-size: 14px; display: flex; align-items: center; gap: 6px; }}
  .flag-card .flag-body {{ color: #555; font-size: 13px; margin-top: 6px; }}
  .flag-card .flag-merchant {{ display: inline-block; background: #fed7d7; color: #c53030; border-radius: 4px; padding: 2px 8px; font-size: 12px; font-weight: 600; margin: 2px; }}
  .no-flags {{ background: #f0fff4; border: 1.5px solid #68d391; border-radius: 8px; padding: 14px 18px; color: #276749; font-weight: 600; }}
  /* Lender cards */
  .lender-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }}
  .lender-card {{ border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }}
  .lender-card-header {{ padding: 14px 16px; color: #fff; display: flex; align-items: center; gap: 12px; }}
  .lender-initial {{ width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }}
  .lender-card-body {{ padding: 14px 16px; }}
  .lender-card-body ul {{ padding-left: 16px; font-size: 13px; color: #555; }}
  .lender-card-body ul li {{ margin-bottom: 4px; }}
  .lender-contact {{ font-size: 12px; color: #888; margin-top: 10px; }}
  /* Next steps */
  .checklist {{ list-style: none; }}
  .checklist li {{ padding: 8px 0; border-bottom: 1px solid #eee; display: flex; gap: 10px; align-items: flex-start; font-size: 13px; }}
  .checklist li:last-child {{ border-bottom: none; }}
  .checklist li::before {{ content: '□'; color: #C9A84C; font-size: 16px; flex-shrink: 0; margin-top: -1px; }}
  /* Footer */
  .report-footer {{ background: #0F1B2D; color: #a0aec0; font-size: 11px; padding: 18px 40px; text-align: center; line-height: 1.6; }}
  .report-footer strong {{ color: #C9A84C; }}
  /* Print */
  @media print {{
    body {{ background: #fff; }}
    .page {{ box-shadow: none; }}
    .section {{ break-inside: avoid; }}
  }}
</style>
</head>
<body>
<div class="page">

<!-- HEADER -->
<div class="report-header">
  <div>
    <h1>APEX MORTGAGE GROUP</h1>
    <div class="subtitle">&#127468;&#127463; Adverse Credit Specialist — Consultant Assessment Report</div>
  </div>
  <div class="meta">
    <strong>{_esc(client.get('name', 'Unknown Client'))}</strong>
    Client Reference: {_esc(client.get('client_id', 'N/A')[:8].upper())}<br>
    Generated: {generated_at}<br>
    CONFIDENTIAL — Consultant Use Only
  </div>
</div>

<!-- EXECUTIVE SUMMARY / GRADE -->
<div class="section">
  <div class="section-title">&#128203; Executive Summary</div>
  <div class="grade-hero">
    <div class="grade-badge">
      {grade}
      <span class="grade-label">{grade_result.get('grade_label', '')}</span>
    </div>
    <div class="grade-detail">
      <h2>Grade {grade} — {grade_result.get('grade_label', '')}</h2>
      <p class="grade-desc">{grade_result.get('grade_description', '')}</p>
      <div class="score-bar-outer">
        <div class="score-bar-inner" style="width:{score}%"></div>
      </div>
      <div class="score-label">Composite Score: <strong>{score}/100</strong></div>
    </div>
  </div>
  <p style="margin-top:16px;color:#444;font-size:13px;">{_esc(grade_result.get('summary', ''))}</p>
  <p style="margin-top:8px;font-weight:600;color:#0F1B2D;font-size:13px;">
    Lender Tier: {_esc(grade_result.get('lender_recommendation_tier', 'N/A'))}
  </p>
</div>

<!-- CLIENT PROFILE -->
<div class="section">
  <div class="section-title">&#128100; Client Profile</div>
  {_render_client_profile(client)}
</div>

<!-- GRADE BREAKDOWN -->
<div class="section">
  <div class="section-title">&#128200; Scoring Breakdown</div>
  {_render_breakdown(grade_result)}
</div>

<!-- INCOME ANALYSIS -->
<div class="section">
  <div class="section-title">&#163; Income Analysis</div>
  {_render_income_analysis(analysis, client)}
</div>

<!-- RED FLAGS -->
<div class="section">
  <div class="section-title">&#9888;&#65039; Red Flags &amp; Adverse Markers</div>
  {_render_red_flags(analysis)}
</div>

<!-- EXPENDITURE -->
<div class="section">
  <div class="section-title">&#128184; Expenditure Summary</div>
  {_render_expenditure(analysis)}
</div>

<!-- LENDER RECOMMENDATIONS -->
<div class="section">
  <div class="section-title">&#127970; Lender Recommendations</div>
  {_render_lenders(matched_lenders)}
</div>

<!-- NEXT STEPS -->
<div class="section">
  <div class="section-title">&#9989; Next Steps &amp; Outstanding Requirements</div>
  {_render_next_steps(client, analysis, grade_result)}
</div>

<!-- FOOTER -->
<div class="report-footer">
  <strong>Apex Mortgage Group — Consultant Use Only</strong><br>
  This report is produced by an AI-assisted analysis system and is for internal consultant use only. It does not constitute regulated financial advice under FSMA 2000 or MCOB. All recommendations must be reviewed by an FCA-authorised adviser before client communication. Lender criteria are indicative and subject to change — always verify with the lender's current product guide or BDM.<br><br>
  Report generated {generated_at}. Apex Mortgage Group is an appointed representative of [FCA Firm Name], FCA Reg No. XXXXXX.
</div>

</div>
</body>
</html>"""


def _esc(text: str) -> str:
    """HTML-escape a string."""
    if not isinstance(text, str):
        text = str(text) if text is not None else ""
    return (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
    )


def _fmt_gbp(value) -> str:
    """Format a number as GBP."""
    try:
        return f"£{float(value):,.2f}"
    except (TypeError, ValueError):
        return "N/A"


def _render_client_profile(client: dict) -> str:
    adverse = client.get("adverse_history", {})
    adverse_items = []
    adverse_map = {
        "ccj": "CCJ", "default": "Default", "iva": "IVA",
        "bankruptcy": "Bankruptcy", "dmp": "DMP", "payday_loans": "Payday Loans",
    }
    for key, label in adverse_map.items():
        if adverse.get(key):
            adverse_items.append(label)

    adverse_str = ", ".join(adverse_items) if adverse_items else "None declared"
    months_since = adverse.get("months_since_most_recent")
    months_str = f"{months_since} months" if months_since else "N/A"

    purpose_map = {"purchase": "Purchase", "remortgage": "Remortgage", "btl": "Buy to Let"}
    purpose = purpose_map.get(client.get("mortgage_purpose", ""), client.get("mortgage_purpose", "N/A"))

    ltv = None
    if client.get("loan_amount") and client.get("property_value"):
        try:
            ltv = (float(client["loan_amount"]) / float(client["property_value"])) * 100
        except (TypeError, ZeroDivisionError):
            pass

    return f"""
    <table class="info-table">
      <tr><th>Full Name</th><td>{_esc(client.get('name', 'N/A'))}</td></tr>
      <tr><th>Mortgage Purpose</th><td>{_esc(purpose)}</td></tr>
      <tr><th>Employment Type</th><td>{_esc(client.get('employment_type', 'N/A').replace('_', ' ').title())}</td></tr>
      <tr><th>Declared Monthly Income</th><td><strong>{_fmt_gbp(client.get('declared_income'))}</strong></td></tr>
      <tr><th>Loan Amount Required</th><td>{_fmt_gbp(client.get('loan_amount'))}</td></tr>
      <tr><th>Property Value</th><td>{_fmt_gbp(client.get('property_value'))}</td></tr>
      <tr><th>LTV</th><td>{f'{ltv:.1f}%' if ltv else 'N/A'}</td></tr>
      <tr><th>Adverse History</th><td><strong style="color:{'#c53030' if adverse_items else '#276749'}">{_esc(adverse_str)}</strong></td></tr>
      <tr><th>Months Since Most Recent Adverse</th><td>{_esc(months_str)}</td></tr>
    </table>"""


def _render_breakdown(grade_result: dict) -> str:
    breakdown = grade_result.get("breakdown", {})
    label_map = {
        "income_consistency": "Income Consistency",
        "income_vs_declaration": "Income vs Declaration",
        "gambling": "Gambling Activity",
        "payday_loans": "Payday Loan History",
        "returned_dds": "Returned Direct Debits",
        "overdraft_usage": "Overdraft Usage",
    }
    colour_map = {
        100: "#1a7a3e", 80: "#1a4e8a", 70: "#1a4e8a", 65: "#b8760a",
        55: "#b8760a", 50: "#b8760a", 35: "#c05c0a", 25: "#a01c1c",
        20: "#a01c1c", 0: "#5c0a0a",
    }

    def get_colour(score: int) -> str:
        for threshold, colour in sorted(colour_map.items(), reverse=True):
            if score >= threshold:
                return colour
        return "#5c0a0a"

    items_html = ""
    for key, data in breakdown.items():
        raw = data.get("raw_score", 0)
        weighted = data.get("weighted_score", 0)
        weight_pct = data.get("weight_pct", 0)
        note = data.get("note", "")
        colour = get_colour(raw)
        label = label_map.get(key, key.replace("_", " ").title())

        items_html += f"""
        <div class="breakdown-item">
          <div class="bi-label">{_esc(label)} <span style="color:#888">({weight_pct}% weight)</span></div>
          <div class="bi-score" style="color:{colour}">{raw}/100 <span style="font-size:13px;font-weight:400;color:#666">→ {weighted:.1f} pts</span></div>
          <div class="bi-bar"><div class="bi-bar-fill" style="width:{raw}%;background:{colour}"></div></div>
          <div class="bi-note">{_esc(note)}</div>
        </div>"""

    return f'<div class="breakdown-grid">{items_html}</div>'


def _render_income_analysis(analysis: dict, client: dict) -> str:
    income = analysis.get("income_analysis", {})
    avg_monthly = income.get("total_average_monthly_income", 0)
    declared = client.get("declared_income", 0)
    cv = income.get("income_coefficient_of_variation", 0)
    discrepancy = income.get("declared_income_discrepancy_pct", 0)
    credits = income.get("credits_identified", [])

    try:
        declared_f = float(declared)
        avg_f = float(avg_monthly)
    except (TypeError, ValueError):
        declared_f = avg_f = 0

    disc_colour = "#276749" if abs(discrepancy or 0) <= 10 else "#c53030"

    rows_html = ""
    for credit in credits[:10]:
        amounts = credit.get("amounts", [credit.get("average_monthly", 0)])
        avg = credit.get("average_monthly", 0)
        rows_html += f"""
        <tr>
          <td>{_esc(credit.get('description', 'N/A'))}</td>
          <td>{_esc(credit.get('category', 'N/A').replace('_', ' ').title())}</td>
          <td>{_esc(credit.get('frequency', 'N/A').title())}</td>
          <td style="text-align:right">{_fmt_gbp(avg)}</td>
          <td style="text-align:center">{credit.get('consistency_score', 'N/A')}</td>
        </tr>"""

    if not rows_html:
        rows_html = '<tr><td colspan="5" style="color:#888;text-align:center;padding:16px">No individual credits identified in analysis</td></tr>'

    period = analysis.get("statement_period", {})
    period_str = ""
    if period.get("from_date") and period.get("to_date"):
        period_str = f"{period['from_date']} to {period['to_date']}"

    return f"""
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:20px">
      <div style="background:#f0f4f8;border-radius:8px;padding:14px">
        <div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600">Avg Monthly Income</div>
        <div style="font-size:22px;font-weight:700;color:#0F1B2D;margin-top:4px">{_fmt_gbp(avg_monthly)}</div>
      </div>
      <div style="background:#f0f4f8;border-radius:8px;padding:14px">
        <div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600">Declared Monthly</div>
        <div style="font-size:22px;font-weight:700;color:#0F1B2D;margin-top:4px">{_fmt_gbp(declared)}</div>
      </div>
      <div style="background:#f0f4f8;border-radius:8px;padding:14px">
        <div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600">Income CV</div>
        <div style="font-size:22px;font-weight:700;color:#0F1B2D;margin-top:4px">{cv:.1f}%</div>
      </div>
      <div style="background:#f0f4f8;border-radius:8px;padding:14px">
        <div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600">vs Declaration</div>
        <div style="font-size:22px;font-weight:700;color:{disc_colour};margin-top:4px">{discrepancy:+.1f}%</div>
      </div>
    </div>
    {f'<p style="font-size:12px;color:#888;margin-bottom:12px">Statement period: {_esc(period_str)}</p>' if period_str else ''}
    <table class="data-table">
      <thead>
        <tr>
          <th>Description</th><th>Category</th><th>Frequency</th><th style="text-align:right">Avg Monthly</th><th style="text-align:center">Consistency</th>
        </tr>
      </thead>
      <tbody>{rows_html}</tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>Total Average Monthly Income</strong></td>
          <td style="text-align:right;font-size:16px;color:#0F1B2D"><strong>{_fmt_gbp(avg_monthly)}</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    {f'<p style="margin-top:12px;font-style:italic;color:#555;font-size:13px">{_esc(income.get("income_notes", ""))}</p>' if income.get("income_notes") else ''}"""


def _render_red_flags(analysis: dict) -> str:
    flags = analysis.get("red_flags", {})
    flag_html = ""
    has_any = False

    # Gambling
    gambling = flags.get("gambling", {})
    if gambling.get("detected"):
        has_any = True
        merchants = gambling.get("merchants", [])
        merchant_tags = "".join(f'<span class="flag-merchant">{_esc(m)}</span>' for m in merchants)
        pct = gambling.get("percentage_of_income", 0)
        monthly = gambling.get("total_amount_per_month_avg", 0)
        severity = gambling.get("severity", "unknown").upper()
        flag_html += f"""
        <div class="flag-card">
          <div class="flag-title">&#9888;&#65039; Gambling Activity — Severity: {severity}</div>
          <div class="flag-body">
            Average monthly gambling spend: <strong>{_fmt_gbp(monthly)}</strong> ({pct:.1f}% of income)<br>
            Merchants identified: {merchant_tags if merchant_tags else '<em>unspecified</em>'}
          </div>
        </div>"""

    # Payday loans
    payday = flags.get("payday_loans", {})
    if payday.get("detected"):
        has_any = True
        lenders = payday.get("lenders_identified", [])
        lender_tags = "".join(f'<span class="flag-merchant">{_esc(l)}</span>' for l in lenders)
        severity = payday.get("severity", "unknown").upper()
        months_ago = payday.get("months_ago")
        months_str = f"{months_ago} months ago" if months_ago else "unknown"
        flag_html += f"""
        <div class="flag-card">
          <div class="flag-title">&#9888;&#65039; Payday Loan Activity — {severity}</div>
          <div class="flag-body">
            Most recent: <strong>{months_str}</strong><br>
            Lenders: {lender_tags if lender_tags else '<em>unspecified</em>'}
          </div>
        </div>"""

    # Returned DDs
    rdd = flags.get("returned_direct_debits", {})
    count = rdd.get("count", 0)
    if count > 0:
        has_any = True
        descs = ", ".join(rdd.get("descriptions", [])[:5]) or "unspecified"
        severity = rdd.get("severity", "medium").upper()
        flag_html += f"""
        <div class="flag-card">
          <div class="flag-title">&#9888;&#65039; Returned Direct Debits — {count} instances ({severity})</div>
          <div class="flag-body">DDs affected: <em>{_esc(descs)}</em></div>
        </div>"""

    # Overdraft
    od = flags.get("overdraft_usage", {})
    if od.get("severity") not in ("none", None) and od.get("times_in_overdraft", 0) > 0:
        has_any = True
        depth = od.get("maximum_overdraft_depth", 0)
        times = od.get("times_in_overdraft", 0)
        severity = od.get("severity", "unknown").upper()
        flag_html += f"""
        <div class="flag-card">
          <div class="flag-title">&#9888;&#65039; Overdraft Usage — {severity}</div>
          <div class="flag-body">
            In overdraft {times} times during statement period.<br>
            Maximum depth: <strong>{_fmt_gbp(depth)}</strong>
          </div>
        </div>"""

    # Large cash withdrawals
    cash = flags.get("large_unexplained_cash_withdrawals", {})
    if cash.get("detected"):
        has_any = True
        instances = cash.get("instances", [])
        total = cash.get("total_amount", 0)
        rows = "".join(
            f'<tr><td>{_esc(i.get("date","N/A"))}</td><td>{_fmt_gbp(i.get("amount"))}</td><td>{_esc(i.get("description","N/A"))}</td></tr>'
            for i in instances[:8]
        )
        flag_html += f"""
        <div class="flag-card">
          <div class="flag-title">&#9888;&#65039; Large Cash Withdrawals — Total: {_fmt_gbp(total)}</div>
          <div class="flag-body">
            <table class="data-table" style="margin-top:8px">
              <thead><tr><th>Date</th><th>Amount</th><th>Description</th></tr></thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </div>"""

    if not has_any:
        flag_html = '<div class="no-flags">&#10003; No adverse markers detected in statement analysis</div>'

    # Underwriter notes
    notes = analysis.get("underwriter_notes", "")
    if notes:
        flag_html += f'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-top:14px"><strong>Underwriter Notes:</strong><p style="margin-top:6px;font-size:13px;color:#444">{_esc(notes)}</p></div>'

    return flag_html


def _render_expenditure(analysis: dict) -> str:
    exp = analysis.get("expenditure_analysis", {})
    variable = exp.get("variable_spending", {})
    fixed = exp.get("fixed_commitments", [])

    fixed_rows = ""
    for item in fixed:
        fixed_rows += f"""
        <tr>
          <td>{_esc(item.get('description', 'N/A'))}</td>
          <td>{_esc(item.get('category', 'N/A').replace('_', ' ').title())}</td>
          <td style="text-align:right">{_fmt_gbp(item.get('monthly_amount'))}</td>
        </tr>"""

    if not fixed_rows:
        fixed_rows = '<tr><td colspan="3" style="color:#888;text-align:center;padding:12px">No fixed commitments identified</td></tr>'

    var_rows = ""
    cat_labels = {
        "groceries_monthly_avg": "Groceries/Supermarket",
        "utilities_monthly_avg": "Utilities (gas/electric/water)",
        "transport_monthly_avg": "Transport",
        "dining_entertainment_monthly_avg": "Dining & Entertainment",
        "online_shopping_monthly_avg": "Online Shopping",
        "other_monthly_avg": "Other",
    }
    for key, label in cat_labels.items():
        val = variable.get(key, 0)
        if val:
            var_rows += f'<tr><td>{_esc(label)}</td><td style="text-align:right">{_fmt_gbp(val)}</td></tr>'

    return f"""
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex-wrap:wrap">
      <div>
        <h4 style="font-size:13px;font-weight:700;color:#0F1B2D;margin-bottom:10px">Fixed Commitments</h4>
        <table class="data-table">
          <thead><tr><th>Description</th><th>Category</th><th style="text-align:right">Monthly</th></tr></thead>
          <tbody>{fixed_rows}</tbody>
          <tfoot><tr><td colspan="2"><strong>Total Fixed</strong></td><td style="text-align:right"><strong>{_fmt_gbp(exp.get('total_fixed_monthly', 0))}</strong></td></tr></tfoot>
        </table>
      </div>
      <div>
        <h4 style="font-size:13px;font-weight:700;color:#0F1B2D;margin-bottom:10px">Variable Spending (Averages)</h4>
        <table class="data-table">
          <thead><tr><th>Category</th><th style="text-align:right">Est. Monthly</th></tr></thead>
          <tbody>{var_rows if var_rows else '<tr><td colspan="2" style="color:#888;text-align:center;padding:12px">No variable spending data</td></tr>'}</tbody>
          <tfoot><tr><td><strong>Total Variable</strong></td><td style="text-align:right"><strong>{_fmt_gbp(exp.get('total_variable_monthly_avg', 0))}</strong></td></tr></tfoot>
        </table>
      </div>
    </div>
    <div style="margin-top:16px;background:#f0f4f8;border-radius:8px;padding:14px;display:flex;gap:24px;flex-wrap:wrap">
      <div><span style="font-size:12px;color:#666">Total Monthly Outgoings</span><br><strong style="font-size:18px">{_fmt_gbp(exp.get('total_monthly_outgoings_avg', 0))}</strong></div>
      <div><span style="font-size:12px;color:#666">Est. Disposable Income</span><br><strong style="font-size:18px">{_fmt_gbp(analysis.get('affordability_indicators', {}).get('net_disposable_income_monthly', 0))}</strong></div>
      <div><span style="font-size:12px;color:#666">Debt-to-Income Ratio</span><br><strong style="font-size:18px">{analysis.get('affordability_indicators', {}).get('debt_to_income_ratio', 0):.1f}%</strong></div>
    </div>"""


def _render_lenders(matched_lenders: list[dict]) -> str:
    if not matched_lenders:
        return '<p style="color:#888">No lender matches found for this profile. Review client grade and adverse history.</p>'

    cards_html = ""
    has_affordability = False
    for lender in matched_lenders[:6]:
        colour = lender.get("colour", "#333")
        criteria_items = "".join(f"<li>{_esc(c)}</li>" for c in lender.get("headline_criteria", [])[:5])
        reasons = ", ".join(lender.get("match_reasons", []))
        score = lender.get("suitability_score", 0)

        afford = lender.get("affordability_estimate") or {}
        afford_html = ""
        if afford.get("max_loan_estimate") is not None:
            has_affordability = True
            afford_html = f"""
            <div style="background:#f0f7ff;border:1px solid #c7ddf5;border-radius:8px;padding:8px 10px;margin-bottom:8px">
              <div style="font-size:11px;color:#666">Est. max loan @ {afford.get('indicative_rate', 0):.2f}%</div>
              <div style="font-size:18px;font-weight:700;color:{colour}">£{afford.get('max_loan_estimate', 0):,.0f}</div>
              <div style="font-size:11px;color:#666">~£{afford.get('monthly_payment_estimate', 0):,.0f}/mo &middot; capped by {_esc(afford.get('capped_by', ''))}</div>
            </div>"""

        cards_html += f"""
        <div class="lender-card">
          <div class="lender-card-header" style="background:{colour}">
            <div class="lender-initial">{_esc(lender.get('logo_initial', '??'))}</div>
            <div>
              <div style="font-weight:700;font-size:14px">{_esc(lender.get('name', 'N/A'))}</div>
              <div style="font-size:11px;opacity:.8">Suitability: {score}/100 | Max LTV: {lender.get('max_ltv', 'N/A')}%</div>
            </div>
          </div>
          <div class="lender-card-body">
            {afford_html}
            <ul>{criteria_items}</ul>
            {f'<p style="font-size:12px;color:#555;margin-top:8px;font-style:italic">{_esc(lender.get("notes",""))}</p>' if lender.get("notes") else ''}
            {f'<div class="lender-contact">Match: {_esc(reasons)}</div>' if reasons else ''}
            <div class="lender-contact" style="margin-top:6px">Tel: {_esc(lender.get('contact', 'N/A'))}</div>
          </div>
        </div>"""

    disclaimer_html = ""
    if has_affordability:
        disclaimer_html = (
            '<p style="font-size:11px;color:#7d5a00;background:#fffbeb;border:1px solid #f6d860;'
            'border-radius:6px;padding:8px 10px;margin-bottom:12px">'
            "<strong>Indicative estimates only.</strong> \"Est. max loan\" figures are calculated from each "
            "lender's typical published income multiple and a stress-tested affordability ceiling &mdash; "
            "they are not live lender calculator results. Always confirm the real figure with the lender's "
            "own calculator or BDM before submission.</p>"
        )

    return f'{disclaimer_html}<div class="lender-grid">{cards_html}</div>'


def _render_next_steps(client: dict, analysis: dict, grade_result: dict) -> str:
    steps = []
    grade = grade_result.get("grade", "F")
    critical = grade_result.get("critical_flags", [])

    steps.append("Obtain 3 months most recent bank statements (if not already provided)")
    steps.append("Request SA302 tax calculations and tax year overviews if self-employed")

    if "income_vs_declaration" in critical:
        steps.append("URGENT: Clarify income discrepancy with client — potential misrepresentation risk")

    if "gambling" in critical:
        steps.append("URGENT: Discuss gambling activity with client — lender will require explanation")

    if "payday_loans" in critical:
        steps.append("URGENT: Payday loan history — advise client of 12-24 month clean period required by most lenders")

    if "returned_dds" in critical:
        steps.append("Obtain client explanation for returned DDs — request bank letter if available")

    adverse = client.get("adverse_history", {})
    if adverse.get("ccj"):
        steps.append("Obtain CCJ details: date, amount, creditor, satisfied/unsatisfied status")
        steps.append("Request copy of CCJ satisfaction letter if applicable")

    if adverse.get("default"):
        steps.append("Obtain default details: date, amount, creditor, current status")

    if adverse.get("iva"):
        steps.append("Obtain IVA certificate of completion or current IVA agreement")

    if adverse.get("bankruptcy"):
        steps.append("Obtain Certificate of Discharge — confirm exact discharge date")

    if adverse.get("dmp"):
        steps.append("Obtain DMP conduct history from debt management company")

    steps.append("Obtain proof of deposit funds (3 months bank statements showing accumulation or gift letter)")
    steps.append("Run full credit report (Experian/Equifax/TransUnion) and review with client")

    if grade in ("C", "D", "E"):
        steps.append("Contact specialist lender BDM for pre-submission discussion before full DIP")

    if grade == "F":
        steps.append("DECLINE: Advise client on credit rehabilitation plan — minimum 6-12 months before reapplication")
        steps.append("Refer client to free debt advice service if appropriate (StepChange, National Debtline)")

    steps.append("Complete Decision in Principle (DIP) with preferred lender once documentation is in order")

    items_html = "".join(f"<li>{_esc(step)}</li>" for step in steps)
    return f'<ul class="checklist">{items_html}</ul>'
