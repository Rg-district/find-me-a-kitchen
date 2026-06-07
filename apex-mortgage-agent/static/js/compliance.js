// ── Consumer Duty, Vulnerable Customer, File Review, TCF ─────────────────────
'use strict';

// ── Consumer Duty Scorecard ────────────────────────────────────────────────────
var CONSUMER_DUTY_OUTCOMES = [
  { id: 'products_services', label: 'Products & Services', description: 'Product is appropriate for client needs and circumstances' },
  { id: 'price_value', label: 'Price & Value', description: 'Client receives fair value; fees proportionate to service' },
  { id: 'consumer_understanding', label: 'Consumer Understanding', description: 'Information is clear, fair and not misleading; risks explained' },
  { id: 'consumer_support', label: 'Consumer Support', description: 'Adequate support provided; client can make informed decision' },
];

var DUTY_RATINGS = {
  good:     { label: 'Good Outcome', colour: '#1a7a3e', bg: '#f0fdf4' },
  neutral:  { label: 'Neutral',      colour: '#1a4e8a', bg: '#eff6ff' },
  concern:  { label: 'Concern',      colour: '#b8760a', bg: '#fffbeb' },
  poor:     { label: 'Poor Outcome', colour: '#c0392b', bg: '#fef2f2' },
};

function loadConsumerDuty(clientId) {
  fetch('/api/clients/' + clientId + '/consumer-duty')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) { renderConsumerDutyForm(d); })
    .catch(function() { renderConsumerDutyForm(null); });
}

function renderConsumerDutyForm(existing) {
  var body = document.getElementById('consumer-duty-body');
  if (!body) return;

  var html = '<p style="font-size:13px;color:#555;margin-bottom:16px">FCA Consumer Duty PS22/9 — record evidence of good outcomes for each of the four outcome areas.</p>';

  CONSUMER_DUTY_OUTCOMES.forEach(function(outcome) {
    var saved = existing && existing[outcome.id] ? existing[outcome.id] : {};
    var rating = saved.rating || 'neutral';
    var notes = saved.notes || '';

    html += '<div class="duty-outcome-block" id="duty-block-' + outcome.id + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">' +
        '<div><div class="duty-outcome-title">' + esc(outcome.label) + '</div>' +
        '<div style="font-size:12px;color:#6b7c93">' + esc(outcome.description) + '</div></div>' +
        '<div style="display:flex;gap:6px">' +
          Object.keys(DUTY_RATINGS).map(function(r) {
            var ri = DUTY_RATINGS[r];
            return '<button class="duty-rating-btn ' + (rating === r ? 'selected' : '') + '" data-outcome="' + outcome.id + '" data-rating="' + r + '" ' +
              'style="' + (rating === r ? 'background:' + ri.bg + ';border-color:' + ri.colour + ';color:' + ri.colour + ';font-weight:700' : '') + '" ' +
              'onclick="selectDutyRating(\'' + outcome.id + '\',\'' + r + '\')">' + ri.label + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<textarea id="duty-notes-' + outcome.id + '" placeholder="Evidence / notes for this outcome…" style="width:100%;box-sizing:border-box;min-height:60px;resize:vertical;padding:8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit">' + esc(notes) + '</textarea>' +
    '</div>';
  });

  html += '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-primary" onclick="saveConsumerDuty()">Save Consumer Duty Record</button>' +
    '<button class="btn btn-outline" onclick="exportConsumerDutyPDF()">Export for File Review</button>' +
  '</div>';

  body.innerHTML = html;
}

function selectDutyRating(outcomeId, rating) {
  var ri = DUTY_RATINGS[rating];
  document.querySelectorAll('[data-outcome="' + outcomeId + '"]').forEach(function(btn) {
    btn.classList.remove('selected');
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.style.fontWeight = '';
  });
  var selected = document.querySelector('[data-outcome="' + outcomeId + '"][data-rating="' + rating + '"]');
  if (selected && ri) {
    selected.classList.add('selected');
    selected.style.background = ri.bg;
    selected.style.borderColor = ri.colour;
    selected.style.color = ri.colour;
    selected.style.fontWeight = '700';
  }
}

function saveConsumerDuty() {
  if (!selectedClientId) { toast('Select a client first', 'error'); return; }
  var payload = {};
  CONSUMER_DUTY_OUTCOMES.forEach(function(outcome) {
    var selectedBtn = document.querySelector('[data-outcome="' + outcome.id + '"].selected');
    var notes = document.getElementById('duty-notes-' + outcome.id);
    payload[outcome.id] = {
      rating: selectedBtn ? selectedBtn.getAttribute('data-rating') : 'neutral',
      notes: notes ? notes.value.trim() : '',
    };
  });

  fetch('/api/clients/' + selectedClientId + '/consumer-duty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(function(r) { return r.json(); })
  .then(function() { toast('Consumer Duty record saved', 'success'); })
  .catch(function() { toast('Failed to save', 'error'); });
}

function exportConsumerDutyPDF() {
  toast('Consumer Duty record — use browser Print (Ctrl+P) to save as PDF', 'info');
}

// ── Vulnerable Customer Assessment ────────────────────────────────────────────
var VULNERABILITY_DRIVERS = [
  { id: 'health', label: 'Health', examples: 'Physical or mental health condition affecting ability to engage' },
  { id: 'life_events', label: 'Life Events', examples: 'Bereavement, job loss, relationship breakdown, caring responsibilities' },
  { id: 'resilience', label: 'Resilience', examples: 'Low financial resilience, over-indebtedness, no savings buffer' },
  { id: 'capability', label: 'Capability', examples: 'Low financial literacy, language barriers, limited digital access' },
];

function loadVulnerableCustomer(clientId) {
  fetch('/api/clients/' + clientId)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var c = d.client || d;
      renderVulnerabilityForm(c);
    })
    .catch(function() { renderVulnerabilityForm({}); });
}

function renderVulnerabilityForm(client) {
  var body = document.getElementById('vulnerable-customer-body');
  if (!body) return;

  var isVuln = client.vulnerable_customer || false;
  var vuln = client.vulnerability_data || {};

  var html = '<div style="margin-bottom:16px">' +
    '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600">' +
      '<input type="checkbox" id="vc-flag" ' + (isVuln ? 'checked' : '') + ' style="width:18px;height:18px" onchange="toggleVulnerabilityFlag()">' +
      'This client has been identified as potentially vulnerable' +
    '</label>' +
    '<div style="font-size:12px;color:#6b7c93;margin-top:4px;margin-left:28px">FCA Consumer Duty requires identifying and supporting vulnerable customers (FG21/1)</div>' +
  '</div>';

  html += '<div id="vc-details" style="display:' + (isVuln ? 'block' : 'none') + '">';

  VULNERABILITY_DRIVERS.forEach(function(driver) {
    var driverData = vuln[driver.id] || {};
    html += '<div style="padding:12px;background:#fff8f0;border-radius:8px;margin-bottom:10px;border-left:3px solid #d97706">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600;font-size:13px;margin-bottom:4px">' +
        '<input type="checkbox" id="vd-' + driver.id + '" ' + (driverData.present ? 'checked' : '') + '> ' +
        esc(driver.label) +
      '</label>' +
      '<div style="font-size:11px;color:#777;margin-bottom:6px;margin-left:24px">' + esc(driver.examples) + '</div>' +
      '<div id="vd-detail-' + driver.id + '" style="margin-left:24px;' + (driverData.present ? '' : 'display:none') + '">' +
        '<textarea id="vd-notes-' + driver.id + '" placeholder="Describe the specific circumstance and how you adapted your approach…" ' +
          'style="width:100%;box-sizing:border-box;min-height:55px;resize:vertical;padding:7px;border:1.5px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit">' +
          esc(driverData.notes || '') + '</textarea>' +
      '</div>' +
    '</div>';
  });

  html += '<div style="margin-top:6px">' +
    '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Adaptations Made</label>' +
    '<textarea id="vc-adaptations" placeholder="Describe any adjustments made to communication, pace, or process…" ' +
      'style="width:100%;box-sizing:border-box;min-height:70px;resize:vertical;padding:8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit">' +
      esc(vuln.adaptations || '') + '</textarea>' +
  '</div>' +
  '<div style="margin-top:10px">' +
    '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Outcome Impact Assessment</label>' +
    '<select id="vc-impact" style="padding:8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px">' +
      '<option value="">Select…</option>' +
      '<option value="no_impact" ' + (vuln.impact === 'no_impact' ? 'selected' : '') + '>No adverse impact on outcome</option>' +
      '<option value="minor" ' + (vuln.impact === 'minor' ? 'selected' : '') + '>Minor adjustments made</option>' +
      '<option value="significant" ' + (vuln.impact === 'significant' ? 'selected' : '') + '>Significant accommodations required</option>' +
      '<option value="referral" ' + (vuln.impact === 'referral' ? 'selected' : '') + '>Referred to specialist support</option>' +
    '</select>' +
  '</div>' +
  '</div>';

  html += '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-primary" onclick="saveVulnerabilityAssessment()">Save Assessment</button>' +
  '</div>';

  body.innerHTML = html;

  // Wire up driver checkboxes
  VULNERABILITY_DRIVERS.forEach(function(d) {
    var cb = document.getElementById('vd-' + d.id);
    if (cb) {
      cb.addEventListener('change', function() {
        var detail = document.getElementById('vd-detail-' + d.id);
        if (detail) detail.style.display = cb.checked ? 'block' : 'none';
      });
    }
  });
}

function toggleVulnerabilityFlag() {
  var details = document.getElementById('vc-details');
  if (details) details.style.display = document.getElementById('vc-flag').checked ? 'block' : 'none';
}

function saveVulnerabilityAssessment() {
  if (!selectedClientId) { toast('Select a client first', 'error'); return; }
  var isVuln = document.getElementById('vc-flag').checked;
  var vuln = { adaptations: '', impact: '' };

  VULNERABILITY_DRIVERS.forEach(function(d) {
    var cb = document.getElementById('vd-' + d.id);
    var notes = document.getElementById('vd-notes-' + d.id);
    vuln[d.id] = { present: cb ? cb.checked : false, notes: notes ? notes.value.trim() : '' };
  });

  var adaptEl = document.getElementById('vc-adaptations');
  var impactEl = document.getElementById('vc-impact');
  if (adaptEl) vuln.adaptations = adaptEl.value.trim();
  if (impactEl) vuln.impact = impactEl.value;

  fetch('/api/clients/' + selectedClientId + '/vulnerable-customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vulnerable_customer: isVuln, vulnerability_data: vuln }),
  })
  .then(function(r) { return r.json(); })
  .then(function() { toast('Vulnerability assessment saved', 'success'); })
  .catch(function() { toast('Failed to save', 'error'); });
}

// ── File Review Checklist ──────────────────────────────────────────────────────
var FILE_REVIEW_ITEMS = [
  { id: 'gdpr_consent', label: 'GDPR consent recorded', category: 'compliance', required: true },
  { id: 'idd_generated', label: 'Initial Disclosure Document (IDD) provided', category: 'compliance', required: true },
  { id: 'privacy_notice', label: 'Privacy Notice / Terms of Business signed', category: 'compliance', required: true },
  { id: 'consumer_duty', label: 'Consumer Duty outcomes recorded', category: 'compliance', required: true },
  { id: 'vulnerable_assessed', label: 'Vulnerability assessment completed', category: 'compliance', required: true },
  { id: 'fact_find', label: 'Full fact-find completed (income, expenditure, adverse)', category: 'fact_find', required: true },
  { id: 'income_verified', label: 'Income verified against bank statement', category: 'fact_find', required: true },
  { id: 'bank_statement', label: 'Bank statement(s) uploaded and analysed', category: 'evidence', required: true },
  { id: 'credit_report', label: 'Credit report uploaded and cross-validated', category: 'evidence', required: false },
  { id: 'stress_test', label: 'Affordability stress test (FCA MCOB 11.6) run', category: 'affordability', required: true },
  { id: 'grade_assigned', label: 'Client graded and lender tier identified', category: 'recommendation', required: true },
  { id: 'esis_provided', label: 'ESIS / KFI provided before application', category: 'recommendation', required: true },
  { id: 'suitability_letter', label: 'Suitability letter generated and reviewed', category: 'recommendation', required: true },
  { id: 'risks_explained', label: 'Product risks explained (rate changes, ERC, repossession)', category: 'recommendation', required: true },
  { id: 'alternatives_considered', label: 'Alternative products considered and documented', category: 'recommendation', required: true },
  { id: 'aip_obtained', label: 'Agreement in Principle obtained', category: 'progression', required: false },
];

var FILE_CATEGORIES = {
  compliance: { label: 'Regulatory Compliance', icon: '⚖️' },
  fact_find: { label: 'Fact Find', icon: '📋' },
  evidence: { label: 'Supporting Evidence', icon: '📄' },
  affordability: { label: 'Affordability', icon: '📊' },
  recommendation: { label: 'Suitability & Recommendation', icon: '✅' },
  progression: { label: 'Case Progression', icon: '🏠' },
};

function loadFileReview(clientId) {
  fetch('/api/clients/' + clientId + '/file-review')
    .then(function(r) { return r.json(); })
    .then(function(d) { renderFileReview(d); })
    .catch(function() { renderFileReview({}); });
}

function renderFileReview(checks) {
  var body = document.getElementById('file-review-body');
  if (!body) return;

  var passed = 0, required_total = 0, required_passed = 0;
  FILE_REVIEW_ITEMS.forEach(function(item) {
    if (checks[item.id]) passed++;
    if (item.required) {
      required_total++;
      if (checks[item.id]) required_passed++;
    }
  });

  var overallPct = required_total > 0 ? Math.round(required_passed / required_total * 100) : 0;
  var overallClass = overallPct === 100 ? 'green' : overallPct >= 80 ? 'amber' : 'red';
  var overallColour = { green: '#1a7a3e', amber: '#b8760a', red: '#c0392b' }[overallClass];

  var html = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:#f8fafc;border-radius:8px;flex-wrap:wrap">' +
    '<div style="font-size:40px;font-weight:800;color:' + overallColour + '">' + overallPct + '%</div>' +
    '<div><div style="font-weight:700;font-size:15px;color:var(--navy)">File Completeness — Required Items</div>' +
      '<div style="font-size:13px;color:#555">' + required_passed + ' of ' + required_total + ' required items complete</div>' +
      (overallPct < 100 ? '<div style="font-size:12px;color:var(--danger);margin-top:2px">⚠ File not ready for submission</div>' :
        '<div style="font-size:12px;color:#1a7a3e;margin-top:2px">✓ All required items complete</div>') +
    '</div>' +
  '</div>';

  var byCategory = {};
  FILE_REVIEW_ITEMS.forEach(function(item) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  Object.keys(byCategory).forEach(function(cat) {
    var catInfo = FILE_CATEGORIES[cat] || { label: cat, icon: '📌' };
    var items = byCategory[cat];
    html += '<div style="margin-bottom:16px">' +
      '<div style="font-size:13px;font-weight:700;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">' +
        catInfo.icon + ' ' + catInfo.label +
      '</div>';

    items.forEach(function(item) {
      var done = !!checks[item.id];
      var icon = done ? '&#10003;' : (item.required ? '&#9651;' : '&#9675;');
      var colour = done ? '#1a7a3e' : (item.required ? '#c0392b' : '#9aaab8');
      html += '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f0f4f8">' +
        '<span style="font-size:16px;color:' + colour + ';width:20px;text-align:center">' + icon + '</span>' +
        '<span style="font-size:13px;color:' + (done ? '#374151' : '#555') + '">' + esc(item.label) + '</span>' +
        (item.required ? '' : '<span style="font-size:10px;color:#9aaab8;margin-left:auto">Optional</span>') +
      '</div>';
    });
    html += '</div>';
  });

  html += '<div style="margin-top:12px;font-size:11px;color:#9aaab8">File review checklist — FCA MCOB compliance reference. Items automatically detected where possible from case data.</div>';
  body.innerHTML = html;
}

// ── TCF (Treating Customers Fairly) Log ───────────────────────────────────────
var TCF_OUTCOMES = [
  { id: '1', label: 'Outcome 1', detail: 'Consumers can be confident they are dealing with firms where fair treatment is central to the culture.' },
  { id: '2', label: 'Outcome 2', detail: 'Products and services marketed and sold in the retail market are designed to meet the needs of identified consumer groups.' },
  { id: '3', label: 'Outcome 3', detail: 'Consumers are provided with clear information and kept informed before, during and after the point of sale.' },
  { id: '4', label: 'Outcome 4', detail: 'Where consumers receive advice, the advice is suitable and takes account of their circumstances.' },
  { id: '5', label: 'Outcome 5', detail: 'Consumers are provided with products that perform as firms have led them to expect.' },
  { id: '6', label: 'Outcome 6', detail: 'Consumers do not face unreasonable post-sale barriers imposed by firms.' },
];

function renderTCFLog(clientId) {
  var body = document.getElementById('tcf-log-body');
  if (!body) return;

  var html = '<p style="font-size:13px;color:#555;margin-bottom:16px">Record evidence against FCA Treating Customers Fairly outcomes for this case file.</p>';
  html += '<div style="display:flex;flex-direction:column;gap:10px">';

  TCF_OUTCOMES.forEach(function(o) {
    html += '<div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px">' +
      '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">' +
        '<span style="background:var(--navy);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;flex-shrink:0">' + o.id + '</span>' +
        '<div><div style="font-weight:600;font-size:13px">' + esc(o.label) + '</div>' +
          '<div style="font-size:12px;color:#6b7c93">' + esc(o.detail) + '</div>' +
        '</div>' +
      '</div>' +
      '<textarea id="tcf-' + o.id + '" placeholder="Evidence for this case…" ' +
        'style="width:100%;box-sizing:border-box;min-height:50px;resize:vertical;padding:7px;border:1.5px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit"></textarea>' +
    '</div>';
  });

  html += '</div>';
  html += '<button class="btn btn-primary" style="margin-top:14px" onclick="saveTCFLog(\'' + clientId + '\')">Save TCF Record</button>';

  body.innerHTML = html;

  // Load existing
  fetch('/api/clients/' + clientId + '/tcf-log')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) {
      if (!d) return;
      TCF_OUTCOMES.forEach(function(o) {
        var el = document.getElementById('tcf-' + o.id);
        if (el && d[o.id]) el.value = d[o.id];
      });
    })
    .catch(function() {});
}

function saveTCFLog(clientId) {
  var payload = {};
  TCF_OUTCOMES.forEach(function(o) {
    var el = document.getElementById('tcf-' + o.id);
    if (el) payload[o.id] = el.value.trim();
  });
  fetch('/api/clients/' + clientId + '/tcf-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(function() { toast('TCF log saved', 'success'); })
  .catch(function() { toast('Failed to save', 'error'); });
}
