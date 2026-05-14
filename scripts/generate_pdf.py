"""
Generates AI_Agent_Strategy_Guide.pdf on the Desktop
using the matplotlib chart images already in /tmp/guide_charts/
and weasyprint for HTML→PDF rendering.
"""

import os, base64
import weasyprint

CHART_DIR = "/tmp/guide_charts"
OUT_DIR   = os.path.expanduser("~/Desktop")
PDF_PATH  = os.path.join(OUT_DIR, "AI_Agent_Strategy_Guide.pdf")

def img64(name):
    path = os.path.join(CHART_DIR, name)
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return f"data:image/png;base64,{data}"

# ── Inline images ──────────────────────────────────────────────────────────
I = {k: img64(k + ".png") for k in [
    "online_categories", "online_impact",
    "instore_categories", "instore_top3",
    "weekly_sales", "payment_split", "cost_breakdown",
    "revenue_target", "revenue_strategy", "priority_matrix", "roadmap",
]}

NAVY  = "#0f3460"
RED   = "#e94560"
GOLD  = "#f59e0b"
GREEN = "#10b981"
TEAL  = "#0ea5e9"
GREY  = "#94a3b8"

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @page {{
    size: A4;
    margin: 18mm 18mm 18mm 18mm;
  }}
  *, *::before, *::after {{ box-sizing: border-box; margin:0; padding:0; }}
  body {{ font-family: Arial, sans-serif; font-size: 9.5pt; color: #1a1a2e; line-height: 1.55; }}

  /* ── Cover ── */
  .cover {{ text-align: center; padding: 28px 0 20px; border-bottom: 3px solid {RED}; margin-bottom: 18px; }}
  .cover h1 {{ font-size: 26pt; color: {NAVY}; font-weight: 900; margin-bottom: 6px; }}
  .cover p  {{ font-size: 12pt; color: {RED}; }}

  /* ── Stat boxes ── */
  .stat-row {{ display: flex; gap: 6px; margin: 14px 0; }}
  .stat-box {{ flex:1; padding: 10px 8px; border-radius: 6px; color: #fff; text-align: center; }}
  .stat-box .v {{ font-size: 13pt; font-weight: 800; display: block; }}
  .stat-box .l {{ font-size: 7.5pt; opacity: 0.88; margin-top: 2px; }}

  /* ── Section headings ── */
  .h1 {{
    font-size: 14pt; font-weight: 800; color: {NAVY};
    border-left: 5px solid {RED}; padding-left: 10px;
    margin: 22px 0 10px;
    page-break-before: always;
  }}
  .h1.no-break {{ page-break-before: avoid; }}
  .h2 {{
    font-size: 11pt; font-weight: 700; color: {NAVY};
    border-bottom: 1.5px solid #dde5f0; padding-bottom: 4px;
    margin: 16px 0 8px;
  }}

  /* ── Tables ── */
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8.5pt; }}
  th {{ background: {NAVY}; color: #fff; padding: 7px 8px; text-align: left; font-size: 8.5pt; }}
  td {{ padding: 6px 8px; border-bottom: 1px solid #e4eaf4; vertical-align: top; }}
  tr:nth-child(even) td {{ background: #f5f8fc; }}
  td.pri {{ background: #fff0f3 !important; }}
  td.pri-name {{ background: #fff0f3 !important; color: {RED}; font-weight: 700; }}

  /* ── Charts ── */
  .chart-row {{ display: flex; gap: 10px; margin: 12px 0; }}
  .chart-row img {{ flex: 1; width: 0; border-radius: 6px; border: 1px solid #e4eaf4; }}
  .chart-solo {{ text-align: center; margin: 12px 0; }}
  .chart-solo img {{ max-width: 88%; border-radius: 6px; border: 1px solid #e4eaf4; }}
  .chart-3 {{ display: flex; gap: 8px; margin: 12px 0; }}
  .chart-3 img {{ flex:1; width:0; border-radius:6px; border:1px solid #e4eaf4; }}

  /* ── Callout ── */
  .callout {{
    border-left: 5px solid {GOLD};
    background: #fffbee;
    padding: 8px 12px;
    margin: 10px 0;
    font-size: 8.5pt;
    border-radius: 0 6px 6px 0;
  }}
  .callout strong {{ color: #92640a; }}

  /* ── Concern ── */
  .concern {{
    border-left: 5px solid {GOLD};
    background: #fff8e1;
    padding: 8px 12px;
    margin: 6px 0;
    font-size: 8.5pt;
    border-radius: 0 6px 6px 0;
  }}
  .concern strong {{ color: #7c5e00; }}

  /* ── Strategy table ── */
  .s-num {{ width: 20px; text-align:center; font-weight:800; color:{RED}; }}

  img {{ max-width: 100%; }}
</style>
</head>
<body>

<!-- ══ COVER ══ -->
<div class="cover">
  <h1>AI Agent Strategy Guide</h1>
  <p>Mobile Repair Business &mdash; Growth &amp; Automation Playbook</p>
</div>

<div class="stat-row">
  <div class="stat-box" style="background:{NAVY}"><span class="v">40</span><span class="l">AI Agent Ideas<br/>(20 Online + 20 In-Store)</span></div>
  <div class="stat-box" style="background:{RED}"><span class="v">£2,314</span><span class="l">Average Weekly Sales</span></div>
  <div class="stat-box" style="background:{GREEN}"><span class="v">£3,500</span><span class="l">Weekly Revenue Target<br/>for Expansion</span></div>
  <div class="stat-box" style="background:{GOLD}"><span class="v">£1,818–£2,834</span><span class="l">Weekly Sales Range<br/>(Worst – Best Week)</span></div>
  <div class="stat-box" style="background:{TEAL}"><span class="v">59% / 41%</span><span class="l">Cash vs Card Split</span></div>
  <div class="stat-box" style="background:#8b5cf6"><span class="v">15</span><span class="l">Scaling Best<br/>Practices</span></div>
</div>

<!-- ══ PART 1 ══ -->
<div class="h1 no-break">PART 1 — 20 AI Agent Ideas: Online / Digital</div>

<div class="chart-row">
  <img src="{I['online_categories']}" alt="Online Categories"/>
  <img src="{I['online_impact']}" alt="Online Impact"/>
</div>

<div class="h2">Lead Generation &amp; Traffic (Agents 1–5)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td class="pri">1 ★</td><td class="pri-name">Repair Cost Estimator Bot</td><td class="pri">Widget where customers describe their problem and get an instant price estimate, capturing their contact info in exchange.</td></tr>
  <tr><td>2</td><td><b>Is It Worth Repairing? Advisor</b></td><td>Compares repair cost vs. replacement cost for any device, building trust and driving decisions toward booking.</td></tr>
  <tr><td>3</td><td><b>Social Media Comment Responder</b></td><td>Auto-replies to comments and DMs on Instagram/Facebook with helpful info and a booking link.</td></tr>
  <tr><td>4</td><td><b>Local SEO Content Generator</b></td><td>Produces weekly blog posts such as "iPhone screen repair in [City]" to rank on Google searches.</td></tr>
  <tr><td>5</td><td><b>Google Review Responder</b></td><td>Drafts personalised responses to every review, improving local ranking signals.</td></tr>
</table>

<div class="h2">Booking &amp; Conversion (Agents 6–10)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td class="pri">6 ★</td><td class="pri-name">24/7 Booking Chatbot</td><td class="pri">Handles enquiries and books appointments outside business hours, capturing leads that would otherwise be lost.</td></tr>
  <tr><td>7</td><td><b>Abandoned Quote Follow-Up Agent</b></td><td>If someone gets a quote but doesn't book, sends a timed follow-up via SMS or email.</td></tr>
  <tr><td>8</td><td><b>Device Triage Agent</b></td><td>Asks diagnostic questions to qualify jobs before they arrive, saving technician time.</td></tr>
  <tr><td>9</td><td><b>Waitlist &amp; Cancellation Filler</b></td><td>Automatically fills cancelled slots by texting customers on a waitlist.</td></tr>
  <tr><td>10</td><td><b>Warranty Upsell Bot</b></td><td>After booking, pitches protection plans or screen protectors with a one-click add-on.</td></tr>
</table>

<div class="h2">Customer Retention (Agents 11–15)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td class="pri">11 ★</td><td class="pri-name">Repair Status Updater</td><td class="pri">Sends automated SMS/WhatsApp updates at each stage: received, in repair, ready for collection. Reduces inbound support calls significantly.</td></tr>
  <tr><td>12</td><td><b>Post-Repair Check-In Agent</b></td><td>Messages customers 7 days after collection to ask how the device is working and request a Google review.</td></tr>
  <tr><td>13</td><td><b>Annual Device Health Reminder</b></td><td>Reaches out to past customers yearly — "Your repair was 12 months ago — time for a checkup?"</td></tr>
  <tr><td>14</td><td><b>Loyalty Points Tracker</b></td><td>Tracks repeat customers and automatically applies discounts or sends referral codes.</td></tr>
  <tr><td>15</td><td><b>Recall &amp; Parts Update Notifier</b></td><td>Alerts past customers if a known fault is discovered for their device model.</td></tr>
</table>

<div class="h2">Operations &amp; Upselling (Agents 16–20)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td>16</td><td><b>Parts Inventory Assistant</b></td><td>Monitors stock levels and flags when common parts are running low, and can auto-order from suppliers.</td></tr>
  <tr><td>17</td><td><b>Job Profitability Analyser</b></td><td>Logs each repair type, calculates margins, and suggests which jobs to promote or deprioritise.</td></tr>
  <tr><td>18</td><td><b>Competitor Price Monitor</b></td><td>Scrapes competitor websites weekly and alerts if pricing needs adjusting to stay competitive.</td></tr>
  <tr><td>19</td><td><b>Referral Campaign Manager</b></td><td>Automatically sends referral links to happy customers and tracks conversions with small rewards.</td></tr>
  <tr><td>20</td><td><b>Insurance Claim Helper</b></td><td>Guides customers through claiming phone repairs on their home insurance, removing a common barrier to booking.</td></tr>
</table>

<div class="callout"><strong>Where to start online:</strong> Agents 1, 6, and 11 — the Estimator Bot drives traffic, the 24/7 Booking Chatbot converts it, and the Repair Status Updater reduces support call volume.</div>

<!-- ══ PART 2 ══ -->
<div class="h1">PART 2 — 20 AI Agent Ideas: Physical Shop Floor</div>

<div class="chart-row">
  <img src="{I['instore_categories']}" alt="In-Store Categories"/>
  <img src="{I['instore_top3']}" alt="Top 3 In-Store"/>
</div>

<div class="h2">Customer Check-In &amp; Reception (Agents 1–5)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td class="pri">1 ★</td><td class="pri-name">Smart Check-In Kiosk</td><td class="pri">Tablet at the front desk where customers tap their device model, describe the fault, and receive a repair ticket — no staff needed for intake.</td></tr>
  <tr><td>2</td><td><b>Queue Management Agent</b></td><td>Displays estimated wait times and texts customers when their repair is next, so they can step out instead of waiting.</td></tr>
  <tr><td>3</td><td><b>Walk-In Triage Assistant</b></td><td>Runs a quick diagnostic questionnaire and tells the customer their likely repair time and cost before speaking to a technician.</td></tr>
  <tr><td>4</td><td><b>Multilingual Reception Bot</b></td><td>Greets walk-in customers in their preferred language — especially valuable in diverse urban areas like London.</td></tr>
  <tr><td>5</td><td><b>Appointment Check-In Agent</b></td><td>Recognises returning customers by phone number, pulls up their history, and alerts the technician they have arrived.</td></tr>
</table>

<div class="h2">In-Store Sales &amp; Upselling (Agents 6–10)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td>6</td><td><b>Accessories Recommender Screen</b></td><td>A display showing "Customers with your phone also bought…" — cases, chargers, screen protectors — while they wait.</td></tr>
  <tr><td>7</td><td><b>Trade-In Value Agent</b></td><td>Customers enter old device details into a kiosk and instantly receive a trade-in quote, encouraging a refurbished handset upsell.</td></tr>
  <tr><td>8</td><td><b>Insurance Add-On Pitcher</b></td><td>After the repair is logged, automatically presents a 30-second pitch for a protection plan on a tablet.</td></tr>
  <tr><td>9</td><td><b>Bundle Deal Suggester</b></td><td>If a customer books a screen repair, the agent flags that a simultaneous battery replacement saves labour cost.</td></tr>
  <tr><td>10</td><td><b>Refurbished Phone Browser</b></td><td>An in-store touchscreen kiosk showing current refurbished stock with specs, prices, and a reserve button.</td></tr>
</table>

<div class="h2">Technician Support (Agents 11–15)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td class="pri">11 ★</td><td class="pri-name">AI Repair Guide Assistant</td><td class="pri">Technicians type a fault description and the agent instantly pulls up the best repair walkthrough, known issues, and part numbers.</td></tr>
  <tr><td>12</td><td><b>Fault Diagnosis Agent</b></td><td>Technician inputs symptoms and the agent cross-references known faults to suggest the most likely cause.</td></tr>
  <tr><td>13</td><td><b>Parts Lookup &amp; Ordering Agent</b></td><td>Scans a device model and tells the technician which parts are in stock and which need ordering, with one-tap ordering.</td></tr>
  <tr><td>14</td><td><b>Repair Time Estimator for Techs</b></td><td>Based on job complexity and current workload, tells the technician how long to quote — keeping promises realistic.</td></tr>
  <tr><td>15</td><td><b>Quality Control Checklist Agent</b></td><td>After a repair, walks the technician through a pass/fail checklist before handing the device back to the customer.</td></tr>
</table>

<div class="h2">Customer Handoff &amp; After-Service (Agents 16–20)</div>
<table>
  <tr><th style="width:22px">#</th><th style="width:130px">Agent Name</th><th>Description</th></tr>
  <tr><td>16</td><td><b>Repair Summary Explainer</b></td><td>When handing back the device, a screen or printout explains in plain English what was fixed and provides aftercare tips.</td></tr>
  <tr><td class="pri">17 ★</td><td class="pri-name">On-the-Spot Review Requester</td><td class="pri">As the customer pays, a tablet prompts them to leave a Google review while they're still feeling positive about getting their phone back.</td></tr>
  <tr><td>18</td><td><b>Payment Plan Agent</b></td><td>For larger repairs, calculates and presents a simple "pay in 3" instalment option and sends the agreement to their phone.</td></tr>
  <tr><td>19</td><td><b>Data Backup Reminder Kiosk</b></td><td>Before repairs begin, alerts the customer if their device has no recent backup and offers a paid backup service on the spot.</td></tr>
  <tr><td>20</td><td><b>Uncollected Device Manager</b></td><td>Tracks devices not collected after repair and sends escalating reminders (day 3, 7, 14) via SMS, flagging when to apply storage fees.</td></tr>
</table>

<div class="callout"><strong>Top 3 in-store:</strong> Agent #1 Smart Check-In Kiosk (frees up staff), Agent #11 AI Repair Guide (faster technicians), Agent #17 On-the-Spot Review Requester (Google reviews drive local foot traffic).</div>

<!-- ══ PART 3 ══ -->
<div class="h1">PART 3 — Financial Analysis: Key Findings</div>

<div class="stat-row">
  <div class="stat-box" style="background:{RED}"><span class="v">£2,314</span><span class="l">Avg Weekly Sales</span></div>
  <div class="stat-box" style="background:{NAVY}"><span class="v">£1,818</span><span class="l">Worst Week</span></div>
  <div class="stat-box" style="background:{GREEN}"><span class="v">£2,834</span><span class="l">Best Week</span></div>
  <div class="stat-box" style="background:{GOLD}"><span class="v">£800/wk</span><span class="l">Salary Cost</span></div>
  <div class="stat-box" style="background:{TEAL}"><span class="v">~35%</span><span class="l">Revenue → Salaries</span></div>
</div>

<div class="chart-3">
  <img src="{I['weekly_sales']}"   alt="Weekly Sales"/>
  <img src="{I['payment_split']}"  alt="Payment Split"/>
  <img src="{I['cost_breakdown']}" alt="Cost Breakdown"/>
</div>

<div class="h2">Income Summary</div>
<table>
  <tr><th>Metric</th><th>Value</th><th>Notes</th></tr>
  <tr><td>Average weekly total sales</td><td><b>£2,314</b></td><td>Range: £1,818 – £2,834</td></tr>
  <tr><td>Cash vs card split</td><td><b>59% / 41%</b></td><td>Cash-heavy — track carefully</td></tr>
  <tr><td>Best week</td><td><b>£2,834</b></td><td>Mar 2–8</td></tr>
  <tr><td>Worst week</td><td><b>£1,818</b></td><td>Mar 30–Apr 5</td></tr>
  <tr><td>Highest-earning days</td><td><b>Saturday &amp; Sunday</b></td><td>Consistently highest cash takings</td></tr>
</table>

<div class="h2">Most Common Expenses</div>
<table>
  <tr><th>Expense</th><th>Amount / Frequency</th><th>Priority Action</th></tr>
  <tr><td>Salaries</td><td>£800/week (fixed)</td><td>Dominant cost ~35% of revenue — review full vs part-time mix</td></tr>
  <tr><td>Bangla Tech</td><td>Almost every week</td><td>Most frequent supplier — negotiate bulk/30-day terms</td></tr>
  <tr><td>Revive</td><td>Regular</td><td>Second most frequent — bundle orders with Bangla Tech negotiations</td></tr>
  <tr><td>eBay</td><td>Regular</td><td>Phones, screens, batteries — consider a dedicated seller account</td></tr>
  <tr><td>HMRC Tax</td><td>Periodic — £255</td><td>Set aside weekly; prevent cash shock at payment date</td></tr>
  <tr><td>Council Rates</td><td>Periodic — £80–£178</td><td>Fixed overhead — budget monthly</td></tr>
  <tr><td>Insurance / Ria</td><td>Periodic</td><td>Track separately to understand true operational cost</td></tr>
</table>

<div class="h2">Financial Concerns</div>
<div class="concern"><strong>Cash Flow Risk:</strong> End-of-week cash is often dangerously thin — several weeks show negative cash balances before personal top-ups. A minimum cash reserve of £1,600 (2 weeks of salary) is essential.</div>
<div class="concern"><strong>External Cash Dependency:</strong> The business is heavily reliant on personal cash injections to cover high-expense salary weeks. Separating business and personal finances is a critical first step.</div>
<div class="concern"><strong>Side Venture Not Separated:</strong> Perfume stock appears within the same books. Track it separately to accurately measure core repair business profitability.</div>

<div class="chart-solo">
  <img src="{I['revenue_target']}" style="max-width:60%" alt="Revenue vs Target"/>
  <div style="font-size:8pt;color:{GREY};margin-top:4px;">Current £2,314/week → £3,500/week needed to open a second location</div>
</div>

<!-- ══ PART 4 ══ -->
<div class="h1">PART 4 — Scaling Strategy: 15 Best Practices</div>

<div class="chart-row">
  <img src="{I['revenue_strategy']}" alt="Revenue Strategy"/>
  <img src="{I['priority_matrix']}"  alt="Priority Matrix"/>
</div>

<table>
  <tr><th class="s-num">#</th><th style="width:150px">Strategy</th><th>Detail</th></tr>
  <tr><td class="s-num">1</td><td><b>Fix the Cash Flow Crisis First</b></td><td>Separate business and personal finances. Build a cash reserve equal to 2 weeks of salary (£1,600). Rule: if end-of-week cash is below £200, no discretionary spending.</td></tr>
  <tr><td class="s-num">2</td><td><b>Negotiate Bulk Supplier Pricing</b></td><td>Approach Bangla Tech and Revive for monthly accounts with 30-day payment terms and volume discounts. One bulk order per month for the top 10 most-used parts.</td></tr>
  <tr><td class="s-num">3</td><td><b>Increase Average Order Value</b></td><td>Train staff to offer battery + screen repairs together. Target an average transaction value of £80+ versus the current estimated £40–60.</td></tr>
  <tr><td class="s-num">4</td><td><b>Launch a WhatsApp Broadcast List</b></td><td>Message 200+ past customers instantly at zero cost. One broadcast per week keeps the shop top of mind and drives repeat visits.</td></tr>
  <tr><td class="s-num">5</td><td><b>Formalise the eBay Sales Operation</b></td><td>Set up a proper eBay store for refurbished phones, spare parts, and accessories. Even 5–10 sales per week at £20–50 margin = £400–1,000/month.</td></tr>
  <tr><td class="s-num">6</td><td><b>Introduce a Monthly Repair Membership</b></td><td>£6–8/month: priority service, one free screen protector fitting, 10% off all repairs. 50 members = £300/month guaranteed recurring income.</td></tr>
  <tr><td class="s-num">7</td><td><b>Launch a Refurbished Phone Retail Line</b></td><td>Formalise phone-flipping with a £500–1,000 float. Buy at £40–80, sell at £100–150. Potential: £400–800/month additional margin.</td></tr>
  <tr><td class="s-num">8</td><td><b>Extend Trading Hours on Weekends</b></td><td>Saturdays and Sundays show highest takings. Extending to 7pm could capture £50–100 extra per day — £400–800/month additional revenue.</td></tr>
  <tr><td class="s-num">9</td><td><b>Target the Bengali/South Asian Community</b></td><td>Market in Bengali via WhatsApp, local Facebook groups, and leaflets. Community trust = referrals at near-zero cost.</td></tr>
  <tr><td class="s-num">10</td><td><b>Hire Part-Time Instead of Full-Time</b></td><td>One full-time + one weekend-only drops salary from £800 to £550–600/week — freeing £800–1,000/month for reinvestment.</td></tr>
  <tr><td class="s-num">11</td><td><b>Register on eBay as a Seller</b></td><td>Extend reach nationally with a dedicated eBay store for refurbished phones, spare parts, and accessories.</td></tr>
  <tr><td class="s-num">12</td><td><b>Introduce a Simple Loyalty Card</b></td><td>Stamp card (10 repairs = one free screen protector fitting) costs almost nothing to print but significantly increases return visit rates.</td></tr>
  <tr><td class="s-num">13</td><td><b>Build a Google Business Profile</b></td><td>Fully optimised profile with 20–30 reviews is the single highest-ROI marketing action. Each 5-star review drives 1–3 additional customers per month.</td></tr>
  <tr><td class="s-num">14</td><td><b>Separate Business Finances Completely</b></td><td>Dedicated business account + bookkeeping app (QuickBooks Self-Employed £8/month or free Wave). Enables proper P&amp;L and faster tax returns.</td></tr>
  <tr><td class="s-num">15</td><td><b>Plan for a Second Location After £3,500/week</b></td><td>Current average of £2,314/week needs to reach £3,500 consistently before a second location is viable. Achievable through the combined strategies above.</td></tr>
</table>

<div class="chart-solo" style="margin-top:16px;">
  <img src="{I['roadmap']}" style="max-width:100%" alt="Implementation Roadmap"/>
  <div style="font-size:8pt;color:{GREY};margin-top:4px;">Implementation Roadmap — Four-phase plan from Month 1 through Month 6+</div>
</div>

</body>
</html>"""

print("Rendering PDF with weasyprint...")
wp = weasyprint.HTML(string=html)
wp.write_pdf(PDF_PATH)

size = os.path.getsize(PDF_PATH) / 1024
print(f"PDF saved: {PDF_PATH}  ({size:.0f} KB)")
