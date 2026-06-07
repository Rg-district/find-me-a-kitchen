// ── Pipeline Kanban, Remortgage Radar, Expiry Tracking, Lender SLA ─────────────
'use strict';

var PIPELINE_STAGES = ['research','dip','full_application','offer','completion'];
var PIPELINE_LABELS = {
  research: 'Research / Fact Find',
  dip: 'Decision in Principle',
  full_application: 'Full Application',
  offer: 'Mortgage Offer',
  completion: 'Completion',
};
var PIPELINE_COLOURS = {
  research: '#6b7c93',
  dip: '#1a4e8a',
  full_application: '#7d5a00',
  offer: '#1a7a3e',
  completion: '#0d1b2a',
};

var _pipelineClients = [];

// ── Main pipeline load ─────────────────────────────────────────────────────────
function loadPipeline() {
  var board = document.getElementById('pipeline-board');
  var radar = document.getElementById('remortgage-radar-body');
  if (board) board.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:20px">Loading pipeline…</div>';
  fetch('/api/pipeline')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      _pipelineClients = d.clients || [];
      renderPipelineBoard(_pipelineClients);
      renderRemortgageRadar(_pipelineClients);
      renderExpiryTracker(_pipelineClients);
      renderLenderSLA(d.sla_data || []);
      renderRevenueMetrics(d);
    })
    .catch(function() {
      if (board) board.innerHTML = '<div style="color:var(--danger);font-size:13px;padding:20px">Failed to load pipeline</div>';
    });
}

// ── Kanban Board ───────────────────────────────────────────────────────────────
function renderPipelineBoard(clients) {
  var board = document.getElementById('pipeline-board');
  if (!board) return;

  var byStage = {};
  PIPELINE_STAGES.forEach(function(s) { byStage[s] = []; });
  clients.forEach(function(c) {
    var stage = c.case_stage || 'research';
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(c);
  });

  var html = '<div class="pipeline-kanban">';
  PIPELINE_STAGES.forEach(function(stage) {
    var cards = byStage[stage] || [];
    var colour = PIPELINE_COLOURS[stage];
    html += '<div class="kanban-col">' +
      '<div class="kanban-col-header" style="border-top:3px solid ' + colour + '">' +
        '<span class="kanban-col-title">' + esc(PIPELINE_LABELS[stage]) + '</span>' +
        '<span class="kanban-col-count" style="background:' + colour + '">' + cards.length + '</span>' +
      '</div>' +
      '<div class="kanban-cards" id="kanban-' + stage + '">';

    if (cards.length === 0) {
      html += '<div class="kanban-empty">No cases</div>';
    } else {
      cards.forEach(function(c) {
        html += renderPipelineCard(c, stage);
      });
    }
    html += '</div></div>';
  });
  html += '</div>';
  board.innerHTML = html;
}

function renderPipelineCard(c, stage) {
  var grade = c.grade || '–';
  var gradeColour = { A:'#1a7a3e', B:'#1a4e8a', C:'#b8760a', D:'#c05c0a', E:'#a01c1c', F:'#5c0a0a' }[grade] || '#6b7c93';
  var loan = c.loan_amount ? gbp(c.loan_amount) : 'N/A';
  var procFee = c.proc_fee_expected ? gbp(c.proc_fee_expected) : '';
  var urgency = _getCardUrgency(c);
  var urgencyBadge = urgency ? '<span class="kanban-urgency ' + urgency.cls + '">' + urgency.label + '</span>' : '';
  var lender = c.lender_name ? '<div class="kanban-lender">&#127970; ' + esc(c.lender_name) + '</div>' : '';
  var vuln = c.vulnerable_customer ? '<span class="kanban-vuln-flag" title="Vulnerable Customer">&#9888;</span>' : '';

  return '<div class="kanban-card" onclick="selectClientAndSwitch(\'' + c.client_id + '\', \'overview\')">' +
    '<div class="kanban-card-header">' +
      '<span class="kanban-name">' + esc(c.name || 'Unknown') + '</span>' +
      vuln +
      '<span class="kanban-grade-dot" style="background:' + gradeColour + '" title="Grade ' + grade + '">' + grade + '</span>' +
    '</div>' +
    '<div class="kanban-card-meta">' + loan + (procFee ? ' &middot; ' + procFee + ' est. proc' : '') + '</div>' +
    lender +
    urgencyBadge +
  '</div>';
}

function _getCardUrgency(c) {
  var today = new Date();
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr);
    return Math.round((d - today) / 86400000);
  }
  var offerDays = daysUntil(c.offer_expiry);
  var aipDays = daysUntil(c.aip_expiry);
  var completionDays = daysUntil(c.completion_date);

  if (offerDays !== null && offerDays >= 0 && offerDays <= 14) return { cls: 'urgent', label: '⚠ Offer expires ' + offerDays + 'd' };
  if (offerDays !== null && offerDays < 0) return { cls: 'overdue', label: '✕ Offer LAPSED' };
  if (aipDays !== null && aipDays >= 0 && aipDays <= 7) return { cls: 'urgent', label: '⚠ AIP expires ' + aipDays + 'd' };
  if (completionDays !== null && completionDays >= 0 && completionDays <= 7) return { cls: 'due-soon', label: '✓ Completion ' + completionDays + 'd' };
  return null;
}

// ── Remortgage Radar ───────────────────────────────────────────────────────────
function renderRemortgageRadar(clients) {
  var body = document.getElementById('remortgage-radar-body');
  if (!body) return;

  var today = new Date();
  var upcoming = [];

  clients.forEach(function(c) {
    if (!c.product_end_date && !c.completion_date) return;
    var endDate = c.product_end_date || c.completion_date;
    var d = new Date(endDate);
    // Flag if deal ends within 12 months
    var monthsAway = Math.round((d - today) / (30.44 * 86400000));
    if (monthsAway >= 0 && monthsAway <= 12) {
      upcoming.push({ client: c, months_away: monthsAway, end_date: endDate });
    }
  });

  if (upcoming.length === 0) {
    body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px 0">No deals expiring in the next 12 months.</div>';
    return;
  }

  upcoming.sort(function(a, b) { return a.months_away - b.months_away; });

  var html = '<div class="radar-grid">';
  upcoming.forEach(function(item) {
    var c = item.client;
    var urgencyClass = item.months_away <= 3 ? 'radar-urgent' : item.months_away <= 6 ? 'radar-soon' : 'radar-ok';
    var loan = c.loan_amount ? gbp(c.loan_amount) : 'N/A';
    html += '<div class="radar-card ' + urgencyClass + '" onclick="selectClientAndSwitch(\'' + c.client_id + '\', \'overview\')">' +
      '<div class="radar-months">' + item.months_away + '<span class="radar-months-label">months</span></div>' +
      '<div class="radar-info">' +
        '<div class="radar-name">' + esc(c.name || 'Unknown') + '</div>' +
        '<div class="radar-meta">' + loan + (c.lender_name ? ' &middot; ' + esc(c.lender_name) : '') + '</div>' +
        '<div class="radar-date">Deal ends: ' + formatDate(item.end_date) + '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// ── Expiry Tracker ─────────────────────────────────────────────────────────────
function renderExpiryTracker(clients) {
  var body = document.getElementById('expiry-tracker-body');
  if (!body) return;

  var today = new Date();
  var items = [];

  clients.forEach(function(c) {
    function addItem(label, dateStr, icon) {
      if (!dateStr) return;
      var d = new Date(dateStr);
      var days = Math.round((d - today) / 86400000);
      if (days >= -30 && days <= 60) {
        items.push({ client: c, label: label, date: dateStr, days: days, icon: icon });
      }
    }
    addItem('AIP Expires', c.aip_expiry, '📋');
    addItem('Offer Expires', c.offer_expiry, '🏠');
    addItem('Exchange', c.exchange_date, '🤝');
    addItem('Completion', c.completion_date, '🔑');
    addItem('ERC Ends', c.erc_end_date, '📅');
  });

  if (items.length === 0) {
    body.innerHTML = '<div style="color:#9aaab8;font-size:13px;padding:12px 0">No upcoming dates in the next 60 days.</div>';
    return;
  }

  items.sort(function(a, b) { return a.days - b.days; });

  var html = '<div style="display:flex;flex-direction:column;gap:6px">';
  items.forEach(function(item) {
    var cls = item.days < 0 ? 'expiry-overdue' : item.days <= 7 ? 'expiry-urgent' : item.days <= 21 ? 'expiry-soon' : 'expiry-ok';
    var dayLabel = item.days < 0 ? Math.abs(item.days) + 'd ago' : item.days === 0 ? 'TODAY' : item.days + ' days';
    html += '<div class="expiry-item ' + cls + '" onclick="selectClientAndSwitch(\'' + item.client.client_id + '\', \'overview\')">' +
      '<span class="expiry-icon">' + item.icon + '</span>' +
      '<span class="expiry-label">' + esc(item.label) + '</span>' +
      '<span class="expiry-name">' + esc(item.client.name || '') + '</span>' +
      '<span class="expiry-date">' + formatDate(item.date) + '</span>' +
      '<span class="expiry-days">' + dayLabel + '</span>' +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// ── Lender SLA Tracker ─────────────────────────────────────────────────────────
function renderLenderSLA(slaData) {
  var body = document.getElementById('lender-sla-body');
  if (!body) return;

  if (!slaData || slaData.length === 0) {
    body.innerHTML = '<div style="color:#9aaab8;font-size:13px">No SLA data yet. Data builds as cases progress through DIP and offer stages.</div>';
    return;
  }

  var html = '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
    '<thead><tr><th style="text-align:left;padding:8px;background:var(--navy);color:#fff">Lender</th>' +
    '<th style="padding:8px;background:var(--navy);color:#fff;text-align:center">Cases</th>' +
    '<th style="padding:8px;background:var(--navy);color:#fff;text-align:center">Avg DIP→Offer</th>' +
    '<th style="padding:8px;background:var(--navy);color:#fff;text-align:center">Best</th>' +
    '<th style="padding:8px;background:var(--navy);color:#fff;text-align:center">Worst</th>' +
    '</tr></thead><tbody>';

  slaData.forEach(function(row) {
    html += '<tr><td style="padding:8px;border-bottom:1px solid #eee">' + esc(row.lender) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' + row.case_count + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' + row.avg_days + 'd</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#1a7a3e">' + row.best_days + 'd</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#c0392b">' + row.worst_days + 'd</td>' +
    '</tr>';
  });
  html += '</tbody></table>';
  body.innerHTML = html;
}

// ── Revenue metrics mini-panel ─────────────────────────────────────────────────
function renderRevenueMetrics(data) {
  var el = document.getElementById('pipeline-revenue-metrics');
  if (!el) return;
  var total = data.total_clients || 0;
  var active = data.active_cases || 0;
  var pipeline_value = data.pipeline_proc_value || 0;
  el.innerHTML =
    '<div class="stat-row">' +
      '<div class="stat-box"><div class="stat-label">Total Cases</div><div class="stat-value">' + total + '</div></div>' +
      '<div class="stat-box"><div class="stat-label">Active</div><div class="stat-value">' + active + '</div></div>' +
      '<div class="stat-box"><div class="stat-label">Pipeline Proc Value</div><div class="stat-value">' + gbp(pipeline_value) + '</div></div>' +
    '</div>';
}

// ── Update pipeline dates for a client ────────────────────────────────────────
function savePipelineDates(clientId) {
  var fields = ['lender-name','aip-expiry','offer-date','offer-expiry','exchange-date','completion-date','product-end-date','erc-end-date'];
  var payload = {};
  fields.forEach(function(f) {
    var el = document.getElementById('pd-' + f);
    if (el && el.value) {
      var key = f.replace(/-/g, '_');
      payload[key] = el.value;
    }
  });
  if (Object.keys(payload).length === 0) { toast('No dates entered', 'error'); return; }
  fetch('/api/clients/' + clientId + '/pipeline-dates', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    toast('Pipeline dates saved', 'success');
    if (typeof loadPipeline === 'function') loadPipeline();
  })
  .catch(function() { toast('Failed to save dates', 'error'); });
}

// ── Populate date editor from client data ──────────────────────────────────────
function populatePipelineDates(client) {
  var fields = {
    'lender-name': client.lender_name,
    'aip-expiry': client.aip_expiry,
    'offer-date': client.offer_date,
    'offer-expiry': client.offer_expiry,
    'exchange-date': client.exchange_date,
    'completion-date': client.completion_date,
    'product-end-date': client.product_end_date,
    'erc-end-date': client.erc_end_date,
  };
  Object.keys(fields).forEach(function(f) {
    var el = document.getElementById('pd-' + f);
    if (el && fields[f]) el.value = fields[f];
  });
}

// ── Helper: navigate to a client tab ──────────────────────────────────────────
function selectClientAndSwitch(clientId, tabId) {
  if (typeof selectClient === 'function') selectClient(clientId);
  setTimeout(function() {
    if (typeof switchTab === 'function') switchTab(tabId);
  }, 200);
}

// ── Helper: format date string to readable ────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch(e) { return dateStr; }
}
