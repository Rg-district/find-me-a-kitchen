// ── Revenue Dashboard, Proc Fee Tracker, Clawback Calculator ─────────────────
'use strict';

var PROC_FEE_STATUSES = {
  pending:   { label: 'Pending',   colour: '#7d5a00', bg: '#fffbeb' },
  confirmed: { label: 'Confirmed', colour: '#1a4e8a', bg: '#eff6ff' },
  paid:      { label: 'Paid',      colour: '#1a7a3e', bg: '#f0fdf4' },
  clawback:  { label: 'Clawback',  colour: '#c0392b', bg: '#fef2f2' },
};

// ── Main dashboard load ────────────────────────────────────────────────────────
function loadRevenueDashboard() {
  fetch('/api/revenue-dashboard')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      renderRevenueSummary(d);
      renderProcFeeTable(d.proc_fees || []);
      renderClawbackPanel(d.clawback_risk || []);
      renderConversionFunnel(d.funnel || {});
      renderReferralSources(d.referral_sources || []);
    })
    .catch(function() {
      var el = document.getElementById('revenue-summary');
      if (el) el.innerHTML = '<div style="color:var(--danger);font-size:13px">Failed to load revenue data</div>';
    });
}

// ── Revenue summary KPIs ───────────────────────────────────────────────────────
function renderRevenueSummary(d) {
  var el = document.getElementById('revenue-summary');
  if (!el) return;

  var monthlyTarget = d.monthly_target || 0;
  var mtdActual = d.mtd_actual || 0;
  var pipelineValue = d.pipeline_value || 0;
  var paidYTD = d.paid_ytd || 0;
  var clawbackRisk = d.clawback_risk_total || 0;
  var targetPct = monthlyTarget > 0 ? Math.min(100, Math.round(mtdActual / monthlyTarget * 100)) : 0;

  el.innerHTML =
    '<div class="stat-row">' +
      '<div class="stat-box"><div class="stat-label">Pipeline Value</div><div class="stat-value">' + gbp(pipelineValue) + '</div><div style="font-size:11px;color:#888">expected proc fees</div></div>' +
      '<div class="stat-box"><div class="stat-label">MTD Actual</div><div class="stat-value" style="color:#1a7a3e">' + gbp(mtdActual) + '</div><div style="font-size:11px;color:#888">confirmed this month</div></div>' +
      '<div class="stat-box"><div class="stat-label">Paid YTD</div><div class="stat-value">' + gbp(paidYTD) + '</div><div style="font-size:11px;color:#888">received year to date</div></div>' +
      '<div class="stat-box"><div class="stat-label">Clawback Risk</div><div class="stat-value" style="color:#c0392b">' + gbp(clawbackRisk) + '</div><div style="font-size:11px;color:#888">within 2yr window</div></div>' +
    '</div>' +
    (monthlyTarget > 0 ?
      '<div style="margin-top:12px">' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">' +
          '<span>Monthly target progress</span><span>' + gbp(mtdActual) + ' / ' + gbp(monthlyTarget) + ' (' + targetPct + '%)</span>' +
        '</div>' +
        '<div class="revenue-progress-bar"><div class="revenue-progress-fill" style="width:' + targetPct + '%;background:' + (targetPct >= 100 ? '#1a7a3e' : targetPct >= 70 ? '#1a4e8a' : '#b8760a') + '"></div></div>' +
      '</div>' : '');
}

// ── Proc fee table ─────────────────────────────────────────────────────────────
function renderProcFeeTable(fees) {
  var body = document.getElementById('proc-fee-table-body');
  if (!body) return;

  if (!fees || fees.length === 0) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9aaab8;padding:20px;font-size:13px">No proc fee records yet. Add expected fees to client cases.</td></tr>';
    return;
  }

  var html = '';
  fees.forEach(function(f) {
    var statusInfo = PROC_FEE_STATUSES[f.proc_fee_status] || PROC_FEE_STATUSES.pending;
    var clawbackFlag = f.clawback_risk ? '<span title="Within clawback window" style="color:var(--danger)">⚠</span>' : '';
    html += '<tr>' +
      '<td style="padding:8px;border-bottom:1px solid #eee"><a href="#" onclick="selectClientAndSwitch(\'' + f.client_id + '\',\'overview\');return false;" style="color:var(--brand);font-weight:600">' + esc(f.name) + '</a></td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' + esc(f.lender_name || '–') + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' + esc(PIPELINE_LABELS ? (PIPELINE_LABELS[f.case_stage] || f.case_stage) : f.case_stage) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">' + (f.proc_fee_expected ? gbp(f.proc_fee_expected) : '–') + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' + (f.proc_fee_actual ? gbp(f.proc_fee_actual) : '–') + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' +
        '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;color:' + statusInfo.colour + ';background:' + statusInfo.bg + '">' + statusInfo.label + '</span>' +
        ' ' + clawbackFlag +
      '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' +
        '<button class="btn btn-outline" style="font-size:11px;padding:3px 8px" onclick="openProcFeeEditor(\'' + f.client_id + '\')">Edit</button>' +
      '</td>' +
    '</tr>';
  });
  body.innerHTML = html;
}

// ── Proc fee editor (in-page modal) ───────────────────────────────────────────
function openProcFeeEditor(clientId) {
  document.getElementById('pfe-client-id').value = clientId;
  fetch('/api/clients/' + clientId)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var c = d.client || d;
      document.getElementById('pfe-client-name').textContent = c.name || 'Client';
      document.getElementById('pfe-expected').value = c.proc_fee_expected || '';
      document.getElementById('pfe-actual').value = c.proc_fee_actual || '';
      document.getElementById('pfe-status').value = c.proc_fee_status || 'pending';
      document.getElementById('pfe-lender').value = c.lender_name || '';
      document.getElementById('pfe-referral').value = c.referral_source || '';
      document.getElementById('proc-fee-modal').style.display = 'flex';
    })
    .catch(function() { toast('Failed to load client', 'error'); });
}

function closeProcFeeModal() {
  document.getElementById('proc-fee-modal').style.display = 'none';
}

function saveProcFee() {
  var clientId = document.getElementById('pfe-client-id').value;
  var payload = {
    proc_fee_expected: parseFloat(document.getElementById('pfe-expected').value) || null,
    proc_fee_actual: parseFloat(document.getElementById('pfe-actual').value) || null,
    proc_fee_status: document.getElementById('pfe-status').value,
    lender_name: document.getElementById('pfe-lender').value.trim() || null,
    referral_source: document.getElementById('pfe-referral').value.trim() || null,
  };
  fetch('/api/clients/' + clientId + '/proc-fee', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(function(r) { return r.json(); })
  .then(function() {
    closeProcFeeModal();
    loadRevenueDashboard();
    toast('Proc fee updated', 'success');
  })
  .catch(function() { toast('Failed to save', 'error'); });
}

// ── Clawback panel ─────────────────────────────────────────────────────────────
function renderClawbackPanel(items) {
  var body = document.getElementById('clawback-body');
  if (!body) return;
  if (!items || items.length === 0) {
    body.innerHTML = '<div style="color:#1a7a3e;font-size:13px">&#10003; No active clawback risk</div>';
    return;
  }
  var html = '<div style="display:flex;flex-direction:column;gap:8px">';
  items.forEach(function(item) {
    var monthsRemaining = item.clawback_months_remaining || 0;
    var riskAmt = item.proc_fee_actual || item.proc_fee_expected || 0;
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#fef2f2;border-radius:7px;gap:12px;flex-wrap:wrap">' +
      '<div>' +
        '<div style="font-weight:700;color:var(--navy);font-size:13px">' + esc(item.name) + '</div>' +
        '<div style="font-size:12px;color:#777">Completion: ' + formatDate(item.completion_date) + ' &middot; ' + esc(item.lender_name || '–') + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-weight:700;color:var(--danger)">' + gbp(riskAmt) + ' at risk</div>' +
        '<div style="font-size:12px;color:#777">' + monthsRemaining + ' months remaining</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// ── Conversion funnel ──────────────────────────────────────────────────────────
function renderConversionFunnel(funnel) {
  var body = document.getElementById('conversion-funnel-body');
  if (!body) return;
  var stages = [
    { key: 'research', label: 'Enquiries', icon: '📋' },
    { key: 'dip', label: 'DIP', icon: '📄' },
    { key: 'full_application', label: 'Application', icon: '📝' },
    { key: 'offer', label: 'Offer', icon: '🏠' },
    { key: 'completion', label: 'Completion', icon: '🔑' },
  ];
  var max = Math.max.apply(null, stages.map(function(s) { return funnel[s.key] || 0; })) || 1;
  var html = '<div style="display:flex;flex-direction:column;gap:6px">';
  stages.forEach(function(s, i) {
    var count = funnel[s.key] || 0;
    var pct = Math.round(count / max * 100);
    var convRate = i > 0 ? (funnel[stages[i-1].key] > 0 ? Math.round(count / funnel[stages[i-1].key] * 100) : 0) : 100;
    html += '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="width:90px;font-size:12px;color:#555">' + s.icon + ' ' + s.label + '</span>' +
      '<div style="flex:1;background:#f0f4f8;border-radius:4px;height:22px;overflow:hidden">' +
        '<div style="width:' + pct + '%;height:100%;background:var(--brand);border-radius:4px;display:flex;align-items:center;padding-left:8px">' +
          '<span style="font-size:11px;font-weight:700;color:#fff;white-space:nowrap">' + count + '</span>' +
        '</div>' +
      '</div>' +
      (i > 0 ? '<span style="width:42px;font-size:11px;color:#888;text-align:right">' + convRate + '%</span>' : '<span style="width:42px"></span>') +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// ── Referral sources ───────────────────────────────────────────────────────────
function renderReferralSources(sources) {
  var body = document.getElementById('referral-sources-body');
  if (!body) return;
  if (!sources || sources.length === 0) {
    body.innerHTML = '<div style="color:#9aaab8;font-size:13px">No referral data yet. Add referral sources to client records.</div>';
    return;
  }
  var total = sources.reduce(function(s, r) { return s + r.count; }, 0);
  var html = '<div style="display:flex;flex-direction:column;gap:8px">';
  sources.sort(function(a, b) { return b.count - a.count; }).forEach(function(r) {
    var pct = total > 0 ? Math.round(r.count / total * 100) : 0;
    html += '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="width:120px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(r.source) + '">' + esc(r.source || 'Direct') + '</span>' +
      '<div style="flex:1;background:#f0f4f8;border-radius:4px;height:18px;overflow:hidden">' +
        '<div style="width:' + pct + '%;height:100%;background:#1a4e8a;border-radius:4px"></div>' +
      '</div>' +
      '<span style="width:60px;font-size:12px;color:#555;text-align:right">' + r.count + ' (' + pct + '%)</span>' +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// ── Monthly target setting ─────────────────────────────────────────────────────
function saveMonthlyTarget() {
  var val = parseFloat(document.getElementById('monthly-target-input').value);
  if (!val || val <= 0) { toast('Enter a valid target', 'error'); return; }
  localStorage.setItem('mau_monthly_target', val);
  loadRevenueDashboard();
  toast('Monthly target set to ' + gbp(val), 'success');
}

function getMonthlyTarget() {
  return parseFloat(localStorage.getItem('mau_monthly_target')) || 0;
}
