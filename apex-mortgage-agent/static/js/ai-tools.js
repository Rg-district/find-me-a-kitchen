// ── AI Power Tools: Suitability Letter, Decline Analyser, Email Drafter,
//    Criteria Search, Case Summariser, Market Commentary ──────────────────────
'use strict';

// ── Suitability Letter Generator ───────────────────────────────────────────────
function generateSuitabilityLetter() {
  if (!selectedClientId) { toast('Select a client first', 'error'); return; }
  var btn = document.getElementById('btn-gen-suitability');
  var body = document.getElementById('suitability-letter-body');

  // Collect product details from form
  var product = {
    lender_name:    getVal('sl-lender'),
    product_name:   getVal('sl-product'),
    initial_rate:   getVal('sl-rate'),
    revert_rate:    getVal('sl-revert-rate'),
    term_years:     getVal('sl-term'),
    ltv:            getVal('sl-ltv'),
    proc_fee:       getVal('sl-proc-fee'),
    arrangement_fee: getVal('sl-arrangement-fee'),
    erc_period:     getVal('sl-erc-period'),
  };

  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  if (body) body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:20px">Generating suitability letter with AI…</div>';

  fetch('/api/clients/' + selectedClientId + '/suitability-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_details: product }),
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Suitability Letter'; }
    if (!res.ok) { toast(res.data.detail || 'Generation failed', 'error'); return; }
    if (body) {
      body.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
          '<span style="font-size:13px;color:#1a7a3e;font-weight:600">&#10003; Suitability letter generated</span>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-outline" onclick="openInTab(\'suitability-html\')">View / Print</button>' +
            '<button class="btn btn-primary" onclick="downloadSuitabilityLetter()">Download HTML</button>' +
          '</div>' +
        '</div>' +
        '<div id="suitability-html-preview" style="border:1px solid var(--border);border-radius:8px;padding:20px;max-height:400px;overflow-y:auto;font-size:12px;background:#fff">' +
          res.data.html +
        '</div>';
      window._suitabilityHtml = res.data.html;
    }
    toast('Suitability letter ready', 'success');
  })
  .catch(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Suitability Letter'; }
    toast('Network error', 'error');
  });
}

function downloadSuitabilityLetter() {
  if (!window._suitabilityHtml) return;
  var blob = new Blob([window._suitabilityHtml], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'suitability-letter.html';
  a.click();
  URL.revokeObjectURL(url);
}

function openInTab(htmlVar) {
  var html = window['_' + htmlVar];
  if (!html) return;
  var win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Decline Reason Analyser ────────────────────────────────────────────────────
function analyseDecline() {
  if (!selectedClientId) { toast('Select a client first', 'error'); return; }
  var reason = getVal('decline-reason-input');
  var lender = getVal('decline-lender-input');
  if (!reason) { toast('Enter the decline reason', 'error'); return; }

  var btn = document.getElementById('btn-analyse-decline');
  var body = document.getElementById('decline-analysis-body');
  if (btn) { btn.disabled = true; btn.textContent = 'Analysing…'; }
  if (body) body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px">Analysing decline with AI…</div>';

  fetch('/api/clients/' + selectedClientId + '/decline-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decline_reason: reason, declined_lender: lender || 'Unknown' }),
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Analyse Decline'; }
    if (!res.ok) { if (body) body.innerHTML = '<div style="color:var(--danger)">Failed: ' + esc(res.data.detail || 'Error') + '</div>'; return; }
    renderDeclineAnalysis(res.data.analysis);
  })
  .catch(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Analyse Decline'; }
    if (body) body.innerHTML = '<div style="color:var(--danger)">Network error</div>';
  });
}

function renderDeclineAnalysis(a) {
  var body = document.getElementById('decline-analysis-body');
  if (!body || !a) return;

  var html = '<div style="padding:12px;background:#fef2f2;border-radius:8px;margin-bottom:14px">' +
    '<div style="font-weight:700;color:var(--danger);margin-bottom:4px">Likely Reason</div>' +
    '<div style="font-size:13px">' + esc(a.likely_reason) + '</div>' +
    '<div style="font-size:12px;color:#555;margin-top:6px">' + esc(a.technical_explanation) + '</div>' +
  '</div>';

  if (a.alternative_lenders && a.alternative_lenders.length > 0) {
    html += '<div style="font-weight:700;font-size:13px;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Alternative Lenders</div>';
    a.alternative_lenders.forEach(function(l) {
      var conf = l.confidence_pct || 0;
      var confColour = conf >= 70 ? '#1a7a3e' : conf >= 50 ? '#b8760a' : '#c0392b';
      html += '<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;background:#f8fafc;border-radius:7px;margin-bottom:6px">' +
        '<div style="flex:1">' +
          '<div style="font-weight:700;font-size:13px">' + esc(l.lender) + '</div>' +
          '<div style="font-size:12px;color:#555">' + esc(l.reason) + '</div>' +
          (l.max_ltv ? '<div style="font-size:11px;color:#888;margin-top:2px">Max LTV: ' + l.max_ltv + '%</div>' : '') +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0"><span style="font-size:16px;font-weight:800;color:' + confColour + '">' + conf + '%</span><div style="font-size:10px;color:#888">fit</div></div>' +
      '</div>';
    });
  }

  if (a.remediation_steps && a.remediation_steps.length > 0) {
    html += '<div style="font-weight:700;font-size:13px;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em;margin:12px 0 8px">Remediation Steps</div>';
    a.remediation_steps.forEach(function(step, i) {
      html += '<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid #f0f4f8">' +
        '<span style="width:20px;height:20px;background:var(--brand);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">' + (i+1) + '</span>' +
        '<span style="font-size:13px">' + esc(step) + '</span>' +
      '</div>';
    });
  }

  if (a.estimated_wait_months) {
    html += '<div style="margin-top:12px;padding:10px 12px;background:#eff6ff;border-radius:7px;font-size:13px">' +
      '&#128337; Estimated wait: <strong>' + a.estimated_wait_months + ' months</strong>' +
      (a.can_reapply_immediately ? ' — or can reapply now via alternative lenders' : ' before reapplication') +
    '</div>';
  }

  if (a.consultant_note) {
    html += '<div style="margin-top:10px;font-size:12px;color:#6b7c93;background:#f8fafc;padding:8px 12px;border-radius:6px">&#128203; ' + esc(a.consultant_note) + '</div>';
  }

  body.innerHTML = html;
}

// ── AI Email Drafter ───────────────────────────────────────────────────────────
var EMAIL_TYPES = [
  { value: 'client_update', label: 'Client Update' },
  { value: 'lender_chase', label: 'Chase Lender' },
  { value: 'solicitor_instruction', label: 'Solicitor Instruction' },
  { value: 'referral_request', label: 'Referral Request' },
  { value: 'completion_congratulations', label: 'Completion Congratulations' },
  { value: 'remortgage_reminder', label: 'Remortgage Reminder' },
];

function draftEmail() {
  if (!selectedClientId) { toast('Select a client first', 'error'); return; }
  var emailType = getVal('email-type-select');
  var context = getVal('email-context-input');
  if (!emailType) { toast('Select an email type', 'error'); return; }

  var btn = document.getElementById('btn-draft-email');
  var body = document.getElementById('email-draft-body');
  if (btn) { btn.disabled = true; btn.textContent = 'Drafting…'; }
  if (body) body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px">Drafting email with AI…</div>';

  fetch('/api/clients/' + selectedClientId + '/draft-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_type: emailType, context: { notes: context } }),
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Draft Email'; }
    if (!res.ok) { if (body) body.innerHTML = '<div style="color:var(--danger)">Failed: ' + esc(res.data.detail || '') + '</div>'; return; }
    renderEmailDraft(res.data.email);
  })
  .catch(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Draft Email'; }
    if (body) body.innerHTML = '<div style="color:var(--danger)">Network error</div>';
  });
}

function renderEmailDraft(email) {
  var body = document.getElementById('email-draft-body');
  if (!body || !email) return;

  var subjectHtml = '<div style="margin-bottom:12px">' +
    '<label style="font-size:11px;font-weight:700;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em">Subject</label>' +
    '<div style="border:1.5px solid var(--border);border-radius:6px;padding:8px 12px;margin-top:4px;font-size:13px;display:flex;align-items:center;gap:8px">' +
      '<span id="email-subject-text">' + esc(email.subject) + '</span>' +
      '<button style="margin-left:auto;background:none;border:none;cursor:pointer;color:#9aaab8;font-size:12px" onclick="copyToClipboard(\'email-subject-text\')" title="Copy">&#128203;</button>' +
    '</div>' +
  '</div>';

  var bodyHtml = '<div>' +
    '<label style="font-size:11px;font-weight:700;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em">Body</label>' +
    '<div style="margin-top:4px;position:relative">' +
      '<textarea id="email-body-text" style="width:100%;box-sizing:border-box;min-height:200px;resize:vertical;padding:12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;white-space:pre-wrap">' + esc(email.body) + '</textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button class="btn btn-primary" onclick="copyEmailToClipboard()">&#128203; Copy to Clipboard</button>' +
        '<button class="btn btn-outline" onclick="emailToMailClient()">&#9993; Open in Mail</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  body.innerHTML = subjectHtml + bodyHtml;
}

function copyEmailToClipboard() {
  var el = document.getElementById('email-body-text');
  if (!el) return;
  el.select();
  document.execCommand('copy');
  toast('Email body copied to clipboard', 'success');
}

function copyToClipboard(elementId) {
  var el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard ? navigator.clipboard.writeText(el.textContent).then(function() { toast('Copied', 'success'); }) : toast('Copy manually', 'info');
}

function emailToMailClient() {
  var subject = document.getElementById('email-subject-text');
  var body = document.getElementById('email-body-text');
  if (!subject || !body) return;
  window.location.href = 'mailto:?subject=' + encodeURIComponent(subject.textContent) + '&body=' + encodeURIComponent(body.value);
}

// ── Criteria Search ────────────────────────────────────────────────────────────
function searchCriteria() {
  var query = getVal('criteria-search-input');
  if (!query || query.length < 5) { toast('Enter a criteria question', 'error'); return; }

  var btn = document.getElementById('btn-criteria-search');
  var body = document.getElementById('criteria-search-results');
  if (btn) { btn.disabled = true; btn.textContent = 'Searching…'; }
  if (body) body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px">Searching lender criteria…</div>';

  fetch('/api/criteria-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query, client_id: selectedClientId || null }),
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Search Criteria'; }
    if (!res.ok) { if (body) body.innerHTML = '<div style="color:var(--danger)">Failed</div>'; return; }
    renderCriteriaResults(res.data);
  })
  .catch(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Search Criteria'; }
    if (body) body.innerHTML = '<div style="color:var(--danger)">Network error</div>';
  });
}

function renderCriteriaResults(d) {
  var body = document.getElementById('criteria-search-results');
  if (!body) return;

  var html = '<div style="padding:12px 16px;background:#f0fdf4;border-radius:8px;font-size:13px;line-height:1.6;margin-bottom:14px">' +
    (d.answer || d.result || '') + '</div>';

  if (d.matching_lenders && d.matching_lenders.length > 0) {
    html += '<div style="font-weight:700;font-size:12px;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Matching Lenders</div>';
    d.matching_lenders.forEach(function(l) {
      var fit = l.fit_score_pct || 0;
      var fitColour = fit >= 70 ? '#1a7a3e' : fit >= 50 ? '#b8760a' : '#c0392b';
      html += '<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 12px;background:#f8fafc;border-radius:7px;margin-bottom:6px">' +
        '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + esc(l.lender) + '</div>' +
          '<div style="font-size:12px;color:#555">' + esc(l.reason) + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0"><span style="font-size:16px;font-weight:800;color:' + fitColour + '">' + fit + '%</span></div>' +
      '</div>';
    });
  }

  if (d.caveats && d.caveats.length > 0) {
    html += '<div style="margin-top:10px;padding:8px 12px;background:#fffbeb;border-radius:7px;font-size:12px;color:#7d5a00">' +
      '<strong>Always verify:</strong> ' + d.caveats.join(' &middot; ') + '</div>';
  }

  if (d.always_verify) {
    html += '<div style="margin-top:8px;font-size:11px;color:#9aaab8">&#9432; ' + esc(d.always_verify) + '</div>';
  }

  body.innerHTML = html;
}

// ── Case Summariser ────────────────────────────────────────────────────────────
function generateCaseSummary() {
  if (!selectedClientId) { toast('Select a client first', 'error'); return; }
  var btn = document.getElementById('btn-case-summary');
  var body = document.getElementById('case-summary-body');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  if (body) body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px">Generating case summary…</div>';

  fetch('/api/clients/' + selectedClientId + '/case-summary', { method: 'POST' })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Generate Case Summary'; }
      if (!res.ok) { if (body) body.innerHTML = '<div style="color:var(--danger)">Failed: ' + esc(res.data.detail || '') + '</div>'; return; }
      renderCaseSummary(res.data.summary);
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Generate Case Summary'; }
      if (body) body.innerHTML = '<div style="color:var(--danger)">Network error</div>';
    });
}

function renderCaseSummary(s) {
  var body = document.getElementById('case-summary-body');
  if (!body || !s) return;

  var healthColour = { green: '#1a7a3e', amber: '#b8760a', red: '#c0392b' }[s.case_health] || '#6b7c93';
  var html = '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:200px"><div style="font-size:13px;line-height:1.6">' + esc(s.executive_summary) + '</div></div>' +
    '<div style="padding:10px 16px;border:2px solid ' + healthColour + ';border-radius:8px;text-align:center;flex-shrink:0">' +
      '<div style="font-size:11px;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em">Case Health</div>' +
      '<div style="font-size:20px;font-weight:800;color:' + healthColour + '">' + (s.case_health || 'N/A').toUpperCase() + '</div>' +
      '<div style="font-size:11px;color:#555">' + esc(s.case_health_reason || '') + '</div>' +
    '</div>' +
  '</div>';

  if (s.key_risks && s.key_risks.length > 0) {
    html += '<div style="font-weight:700;font-size:12px;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Key Risks</div>';
    s.key_risks.forEach(function(r) {
      var rColour = r.severity === 'high' ? '#c0392b' : r.severity === 'medium' ? '#b8760a' : '#6b7c93';
      html += '<div style="display:flex;gap:10px;padding:8px 12px;border-radius:7px;background:#f8fafc;margin-bottom:6px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + rColour + ';flex-shrink:0;margin-top:5px"></span>' +
        '<div><div style="font-size:13px;font-weight:600">' + esc(r.risk) + '</div>' +
          '<div style="font-size:12px;color:#555">' + esc(r.mitigation) + '</div>' +
        '</div>' +
      '</div>';
    });
  }

  if (s.action_items && s.action_items.length > 0) {
    html += '<div style="font-weight:700;font-size:12px;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em;margin:12px 0 8px">Action Items</div>';
    s.action_items.forEach(function(a) {
      html += '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #f0f4f8">' +
        '<span style="color:var(--brand);font-weight:700">→</span>' +
        '<span style="font-size:13px">' + esc(a) + '</span>' +
      '</div>';
    });
  }

  if (s.lender_recommendation) {
    html += '<div style="margin-top:12px;padding:10px 14px;background:#eff6ff;border-radius:7px;font-size:13px">' +
      '<strong>Lender Recommendation:</strong> ' + esc(s.lender_recommendation) + '</div>';
  }

  if (s.next_steps && s.next_steps.length > 0) {
    html += '<div style="font-weight:700;font-size:12px;color:#9aaab8;text-transform:uppercase;letter-spacing:.05em;margin:12px 0 8px">Next Steps</div>';
    s.next_steps.forEach(function(step, i) {
      html += '<div style="display:flex;gap:8px;padding:6px 0">' +
        '<span style="width:18px;height:18px;background:#1a4e8a;color:#fff;border-radius:50%;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + (i+1) + '</span>' +
        '<span style="font-size:13px">' + esc(step) + '</span>' +
      '</div>';
    });
  }

  body.innerHTML = html;
}

// ── Market Commentary Generator ────────────────────────────────────────────────
function generateMarketCommentary() {
  var topic = getVal('market-topic-input') || 'UK mortgage market update';
  var btn = document.getElementById('btn-market-commentary');
  var body = document.getElementById('market-commentary-body');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  if (body) body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px">Generating market commentary…</div>';

  fetch('/api/market-commentary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: topic }),
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Commentary'; }
    if (!res.ok) { if (body) body.innerHTML = '<div style="color:var(--danger)">Failed</div>'; return; }
    if (body) {
      body.innerHTML =
        '<div style="display:flex;justify-content:flex-end;margin-bottom:8px">' +
          '<button class="btn btn-outline" style="font-size:12px" onclick="copyToClipboard(\'market-commentary-text\')">&#128203; Copy</button>' +
        '</div>' +
        '<div id="market-commentary-text" style="font-size:13px;line-height:1.7;white-space:pre-wrap;border:1.5px solid var(--border);border-radius:8px;padding:16px">' +
          esc(res.data.commentary) +
        '</div>';
    }
  })
  .catch(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Commentary'; }
    if (body) body.innerHTML = '<div style="color:var(--danger)">Network error</div>';
  });
}

// ── Objection Handler ─────────────────────────────────────────────────────────
var COMMON_OBJECTIONS = [
  "I'll just go direct to the bank",
  "Your fee is too high",
  "I have good credit, I don't need a broker",
  "I can see the same rates online",
  "The process takes too long",
  "I had a bad experience with a broker before",
];

function handleObjection(objection) {
  var body = document.getElementById('objection-response-body');
  if (body) body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px">Generating response…</div>';

  fetch('/api/objection-handler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objection: objection }),
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (body) {
      body.innerHTML = '<div style="padding:14px 16px;background:#f0fdf4;border-radius:8px;font-size:13px;line-height:1.6">' +
        esc(d.response || d.message || '') +
        '</div>' +
        '<div style="margin-top:8px;font-size:11px;color:#9aaab8">Edit as needed before using</div>';
    }
  })
  .catch(function() { if (body) body.innerHTML = '<div style="color:var(--danger)">Network error</div>'; });
}

function loadObjectionExamples() {
  var wrap = document.getElementById('objection-examples');
  if (!wrap) return;
  wrap.innerHTML = COMMON_OBJECTIONS.map(function(o) {
    return '<button class="btn btn-outline" style="font-size:12px;margin:3px" onclick="handleObjection(' + JSON.stringify(o) + ')">' + esc(o) + '</button>';
  }).join('');
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
