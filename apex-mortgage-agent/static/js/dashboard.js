/* ── Dashboard ───────────────────────────────────────────────────────────────
   Renders the home dashboard view: KPIs, urgent actions, upcoming dates,
   remortgage radar, recent activity, pipeline stage overview.
─────────────────────────────────────────────────────────────────────────── */

function loadDashboard() {
  fetch('/api/dashboard')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(d) {
      renderDashKPIs(d.kpis || {});
      renderDashUrgent(d.urgent_actions || []);
      renderDashUpcoming(d.upcoming_dates || []);
      renderDashRemortgage(d.remortgage_radar || []);
      renderDashActivity(d.recent_activity || []);
      renderDashPipeline(d.kpis || {});
    })
    .catch(function(err) {
      var kpiEl = document.getElementById('dash-kpis');
      if (kpiEl) kpiEl.innerHTML =
        '<div style="color:var(--text-muted);font-size:13px;grid-column:1/-1;padding:12px 0">' +
        'Dashboard data unavailable — add clients to get started.</div>';
      ['dash-urgent','dash-upcoming','dash-remortgage','dash-activity','dash-pipeline'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="dash-empty">No data yet</div>';
      });
    });
}

// ── KPI strip ─────────────────────────────────────────────────────────────────

function renderDashKPIs(kpis) {
  var el = document.getElementById('dash-kpis');
  if (!el) return;

  var stageCounts = kpis.stage_counts || {};
  var stages = [
    { k: 'research', l: 'Research' },
    { k: 'dip', l: 'DIP' },
    { k: 'full_application', l: 'Full App' },
    { k: 'offer', l: 'Offer' },
    { k: 'completion', l: 'Complete' },
  ];
  var stageHtml = stages.map(function(s) {
    var n = stageCounts[s.k] || 0;
    return '<span style="display:inline-flex;align-items:center;gap:4px">' +
      '<strong style="color:var(--navy)">' + n + '</strong>' +
      '<span style="color:var(--text-muted)">' + s.l + '</span>' +
      '</span>';
  }).join('<span style="color:#d1dce8;margin:0 4px">·</span>');

  var urgentCount = kpis.urgent_count || 0;
  var urgentColour = urgentCount > 0 ? 'var(--danger)' : 'var(--success)';

  el.innerHTML =
    '<div class="dash-kpi kpi-active">' +
      '<div class="dash-kpi-label">Total Clients</div>' +
      '<div class="dash-kpi-value">' + (kpis.total_clients || 0) + '</div>' +
      '<div class="dash-kpi-sub">' + (kpis.active_cases || 0) + ' active</div>' +
    '</div>' +
    '<div class="dash-kpi kpi-pipeline">' +
      '<div class="dash-kpi-label">Pipeline Value</div>' +
      '<div class="dash-kpi-value" style="font-size:22px;margin-top:8px">' + gbp(kpis.pipeline_value || 0) + '</div>' +
      '<div class="dash-kpi-sub">Estimated proc fees</div>' +
    '</div>' +
    '<div class="dash-kpi">' +
      '<div class="dash-kpi-label">By Stage</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:12px">' + stageHtml + '</div>' +
    '</div>' +
    '<div class="dash-kpi kpi-urgent">' +
      '<div class="dash-kpi-label">Needs Attention</div>' +
      '<div class="dash-kpi-value" style="color:' + urgentColour + '">' + urgentCount + '</div>' +
      '<div class="dash-kpi-sub">' + (urgentCount === 0 ? 'All cases on track' : 'High-priority actions') + '</div>' +
    '</div>';
}

// ── Urgent actions ────────────────────────────────────────────────────────────

var _ACTION_ICONS = {
  aip_expiry: '⏰',
  offer_expiry: '⌛',
  missing_doc: '📄',
  missing_suitability: '⚖️',
  stale: '💤',
};

function renderDashUrgent(actions) {
  var el = document.getElementById('dash-urgent');
  if (!el) return;

  if (!actions.length) {
    el.innerHTML =
      '<div class="dash-empty" style="color:var(--success)">' +
      '&#10003; No urgent actions — all cases on track' +
      '</div>';
    return;
  }

  el.innerHTML = actions.map(function(a) {
    var icon = _ACTION_ICONS[a.type] || '⚠️';
    return '<div class="dash-action-item">' +
      '<div class="dash-action-dot ' + (a.severity || 'medium') + '"></div>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="dash-action-name">' + esc(a.client_name) + ' <span style="font-weight:400;font-size:12px">' + icon + '</span></div>' +
        '<div class="dash-action-msg">' + esc(a.message) + '</div>' +
        '<span class="dash-action-link" onclick="selectClient(\'' + esc(a.client_id) + '\')">Open case &rarr;</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── Upcoming dates ────────────────────────────────────────────────────────────

function renderDashUpcoming(dates) {
  var el = document.getElementById('dash-upcoming');
  if (!el) return;

  if (!dates.length) {
    el.innerHTML = '<div class="dash-empty">&#128197; No key dates in the next 30 days</div>';
    return;
  }

  el.innerHTML = dates.map(function(d) {
    var pillCls = d.days === 0 ? 'pill-today' : d.days <= 7 ? 'pill-soon' : 'pill-ok';
    var dayLabel = d.days === 0 ? 'Today' : d.days === 1 ? '1 day' : d.days + ' days';
    return '<div class="dash-date-item">' +
      '<div class="dash-date-pill ' + pillCls + '">' + dayLabel + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="dash-date-client">' + esc(d.client_name) + '</div>' +
        '<div class="dash-date-label">' + esc(d.label) + ' &mdash; ' + _fmtDate(d.date) + '</div>' +
      '</div>' +
      '<div class="dash-date-arrow" onclick="selectClient(\'' + esc(d.client_id) + '\')" title="Open case">&rarr;</div>' +
    '</div>';
  }).join('');
}

// ── Remortgage radar ──────────────────────────────────────────────────────────

function renderDashRemortgage(radar) {
  var el = document.getElementById('dash-remortgage');
  if (!el) return;

  if (!radar.length) {
    el.innerHTML = '<div class="dash-empty">&#128225; No remortgage opportunities in the next 12 months</div>';
    return;
  }

  el.innerHTML = radar.map(function(r) {
    var urgencyPct = Math.max(5, Math.min(100, Math.round((1 - r.days_to_end / 365) * 100)));
    var col = r.days_to_end <= 90
      ? 'var(--danger)'
      : r.days_to_end <= 180
      ? '#d69e2e'
      : 'var(--grade-b)';
    var badgeBg = r.days_to_end <= 90
      ? '#fed7d7'
      : r.days_to_end <= 180
      ? '#fef3c7'
      : '#ebf8ff';
    var badgeCol = r.days_to_end <= 90
      ? 'var(--danger)'
      : r.days_to_end <= 180
      ? '#92400e'
      : '#2b6cb0';

    return '<div class="dash-radar-item">' +
      '<div class="dash-radar-row">' +
        '<div class="dash-radar-name" onclick="selectClient(\'' + esc(r.client_id) + '\')">' + esc(r.client_name) + '</div>' +
        '<span class="dash-radar-badge" style="background:' + badgeBg + ';color:' + badgeCol + '">' +
          r.months_to_end + ' mo' +
        '</span>' +
      '</div>' +
      '<div class="dash-radar-track"><div class="dash-radar-fill" style="width:' + urgencyPct + '%;background:' + col + '"></div></div>' +
    '</div>';
  }).join('');
}

// ── Recent activity ───────────────────────────────────────────────────────────

var _ACT_ICONS = { note: '📝', update: '🔄', document: '📄', grade: '⭐', analysis: '🔬' };

function renderDashActivity(activity) {
  var el = document.getElementById('dash-activity');
  if (!el) return;

  if (!activity.length) {
    el.innerHTML = '<div class="dash-empty">&#128336; No recent activity</div>';
    return;
  }

  el.innerHTML = activity.map(function(a) {
    return '<div class="dash-act-item">' +
      '<div class="dash-act-icon">' + (_ACT_ICONS[a.type] || '📋') + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="dash-act-name" onclick="selectClient(\'' + esc(a.client_id) + '\')">' + esc(a.client_name) + '</div>' +
        '<div class="dash-act-desc">' + esc((a.description || '').substring(0, 60)) + '</div>' +
      '</div>' +
      '<div class="dash-act-time">' + _timeAgo(a.timestamp) + '</div>' +
    '</div>';
  }).join('');
}

// ── Pipeline stages ───────────────────────────────────────────────────────────

function renderDashPipeline(kpis) {
  var el = document.getElementById('dash-pipeline');
  if (!el) return;

  var stageCounts = kpis.stage_counts || {};
  var stages = [
    { k: 'research',         l: 'Research',     col: '#64748b' },
    { k: 'dip',              l: 'DIP',           col: 'var(--grade-b)' },
    { k: 'full_application', l: 'Full App',      col: 'var(--grade-c)' },
    { k: 'offer',            l: 'Offer',         col: 'var(--grade-a)' },
    { k: 'completion',       l: 'Completion',    col: 'var(--success)' },
  ];
  var max = Math.max(1, Math.max.apply(null, stages.map(function(s) { return stageCounts[s.k] || 0; })));

  el.innerHTML = '<div class="dash-stages">' +
    stages.map(function(s) {
      var count = stageCounts[s.k] || 0;
      var pct = Math.round((count / max) * 100);
      return '<div class="dash-stage-box">' +
        '<div class="dash-stage-num" style="color:' + s.col + '">' + count + '</div>' +
        '<div class="dash-stage-lbl">' + s.l + '</div>' +
        '<div class="dash-stage-track"><div class="dash-stage-fill" style="width:' + pct + '%;background:' + s.col + '"></div></div>' +
      '</div>';
    }).join('') +
  '</div>';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _timeAgo(isoStr) {
  if (!isoStr) return '';
  var diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return _fmtDate(isoStr);
}

function _fmtDate(isoStr) {
  if (!isoStr) return '';
  var d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
