/* calculators.js — UK Mortgage Broker Financial Calculators
 * Loaded via <script src="/static/js/calculators.js"></script>
 * No ES modules, no build step. All functions are global.
 * Depends on globally-available helpers: esc(str), gbp(val)
 * Rates: UK 2024/25
 */

'use strict';

// ── Date helpers ──────────────────────────────────────────────────────────────

function getCurrentDate() {
  return new Date();
}

function monthsBetween(date1, date2) {
  var d1 = (date1 instanceof Date) ? date1 : new Date(date1);
  var d2 = (date2 instanceof Date) ? date2 : new Date(date2);
  var months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  // account for partial month by day-of-month comparison
  if (d2.getDate() < d1.getDate()) { months -= 1; }
  return months;
}

// ── Internal render helpers ───────────────────────────────────────────────────

function _verdictBadge(passes, passLabel, failLabel) {
  if (passes) {
    return '<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;background:#d4edda;color:#1a7a3e;">' + esc(passLabel || 'PASS') + '</span>';
  }
  return '<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;background:#f8d7da;color:#a01c1c;">' + esc(failLabel || 'FAIL') + '</span>';
}

function _amberBadge(label) {
  return '<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;background:#fff3cd;color:#856404;">' + esc(label) + '</span>';
}

function _sectionTitle(text) {
  return '<div style="font-size:12px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;">' + esc(text) + '</div>';
}

function _table(headers, rows) {
  var html = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
  html += '<thead><tr>';
  headers.forEach(function(h) {
    html += '<th style="text-align:left;padding:6px 10px;background:var(--navy);color:#fff;font-weight:600;">' + esc(h) + '</th>';
  });
  html += '</tr></thead><tbody>';
  rows.forEach(function(row, i) {
    var bg = i % 2 === 0 ? '#f8fafc' : '#fff';
    html += '<tr style="background:' + bg + ';">';
    row.forEach(function(cell, ci) {
      var align = (ci > 0) ? 'right' : 'left';
      html += '<td style="padding:6px 10px;border-bottom:1px solid var(--border);text-align:' + align + ';">' + cell + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function _statBox(label, value, note) {
  var noteHtml = note ? '<div style="font-size:11px;color:#888;margin-top:2px;">' + note + '</div>' : '';
  return '<div class="stat-box"><div class="stat-label">' + esc(label) + '</div><div class="stat-value">' + value + '</div>' + noteHtml + '</div>';
}

function _errorHtml(msg) {
  return '<div style="padding:14px;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;color:#664d03;font-size:13px;">' +
    '<strong>Input error:</strong> ' + esc(msg) + '</div>';
}

function _setContainer(containerId, html) {
  var el = document.getElementById(containerId);
  if (el) { el.innerHTML = html; }
}

function _pct(val, dp) {
  dp = (dp == null) ? 2 : dp;
  return parseFloat(val).toFixed(dp) + '%';
}

// ── 1. STAMP DUTY ─────────────────────────────────────────────────────────────

function calcStampDuty(price, isFirstTimeBuyer, isAdditional, jurisdiction) {
  price = parseFloat(price);
  if (!price || price <= 0) { return { error: 'Please enter a valid property price.' }; }

  jurisdiction = (jurisdiction || 'england').toLowerCase();
  isFirstTimeBuyer = !!isFirstTimeBuyer;
  isAdditional = !!isAdditional;

  var tax = 0;
  var breakdown = [];
  var relief_applied = false;

  if (jurisdiction === 'england') {
    // England & Wales SDLT 2024
    var bands;
    var ftbRelief = isFirstTimeBuyer && !isAdditional && price <= 625000;

    if (ftbRelief) {
      relief_applied = true;
      if (price <= 425000) {
        bands = [
          { band: '£0 – £425,000', rate: 0, from: 0, to: 425000 }
        ];
      } else {
        bands = [
          { band: '£0 – £425,000', rate: 0, from: 0, to: 425000 },
          { band: '£425,001 – £625,000', rate: 5, from: 425000, to: 625000 }
        ];
      }
    } else {
      bands = [
        { band: '£0 – £250,000', rate: 0, from: 0, to: 250000 },
        { band: '£250,001 – £925,000', rate: 5, from: 250000, to: 925000 },
        { band: '£925,001 – £1,500,000', rate: 10, from: 925000, to: 1500000 },
        { band: 'Above £1,500,000', rate: 12, from: 1500000, to: Infinity }
      ];
    }

    var surcharge = isAdditional ? 3 : 0;

    bands.forEach(function(b) {
      if (price <= b.from) { return; }
      var taxable = Math.min(price, b.to) - b.from;
      var effectiveRate = b.rate + surcharge;
      var amount = taxable * effectiveRate / 100;
      tax += amount;
      breakdown.push({ band: b.band, rate: effectiveRate, amount: amount });
    });

    // Additional property: surcharge applies on entire purchase price via the band structure above
    // (surcharge is already folded into effectiveRate per band)

  } else if (jurisdiction === 'scotland') {
    // Scotland LBTT 2024
    var lbttBands = [
      { band: '£0 – £145,000', rate: 0, from: 0, to: 145000 },
      { band: '£145,001 – £250,000', rate: 2, from: 145000, to: 250000 },
      { band: '£250,001 – £325,000', rate: 5, from: 250000, to: 325000 },
      { band: '£325,001 – £750,000', rate: 10, from: 325000, to: 750000 },
      { band: 'Above £750,000', rate: 12, from: 750000, to: Infinity }
    ];

    // FTB relief: 0% on first £175k (effectively raises nil-rate threshold)
    var ftbRelief = isFirstTimeBuyer && !isAdditional;
    if (ftbRelief) {
      relief_applied = true;
      lbttBands = [
        { band: '£0 – £175,000 (FTB relief)', rate: 0, from: 0, to: 175000 },
        { band: '£175,001 – £250,000', rate: 2, from: 175000, to: 250000 },
        { band: '£250,001 – £325,000', rate: 5, from: 250000, to: 325000 },
        { band: '£325,001 – £750,000', rate: 10, from: 325000, to: 750000 },
        { band: 'Above £750,000', rate: 12, from: 750000, to: Infinity }
      ];
    }

    lbttBands.forEach(function(b) {
      if (price <= b.from) { return; }
      var taxable = Math.min(price, b.to) - b.from;
      var amount = taxable * b.rate / 100;
      tax += amount;
      breakdown.push({ band: b.band, rate: b.rate, amount: amount });
    });

    // ADS (Additional Dwelling Supplement): 6% on full price
    if (isAdditional) {
      var ads = price * 0.06;
      tax += ads;
      breakdown.push({ band: 'ADS — full purchase price', rate: 6, amount: ads });
    }

  } else if (jurisdiction === 'wales') {
    // Wales LTT 2024
    var lttBands = [
      { band: '£0 – £225,000', rate: 0, from: 0, to: 225000 },
      { band: '£225,001 – £400,000', rate: 6, from: 225000, to: 400000 },
      { band: '£400,001 – £750,000', rate: 7.5, from: 400000, to: 750000 },
      { band: '£750,001 – £1,500,000', rate: 10, from: 750000, to: 1500000 },
      { band: 'Above £1,500,000', rate: 12, from: 1500000, to: Infinity }
    ];

    var addlSurcharge = isAdditional ? 4 : 0;

    lttBands.forEach(function(b) {
      if (price <= b.from) { return; }
      var taxable = Math.min(price, b.to) - b.from;
      var effectiveRate = b.rate + addlSurcharge;
      var amount = taxable * effectiveRate / 100;
      tax += amount;
      breakdown.push({ band: b.band, rate: effectiveRate, amount: amount });
    });

  } else {
    return { error: 'Unknown jurisdiction. Use "england", "scotland", or "wales".' };
  }

  var effectiveRate = price > 0 ? (tax / price) * 100 : 0;

  return {
    tax: tax,
    effectiveRate: effectiveRate,
    breakdown: breakdown,
    jurisdiction: jurisdiction,
    relief_applied: relief_applied
  };
}

function renderStampDuty(result, containerId) {
  containerId = containerId || 'calc-stamp-duty-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var jurLabel = { england: 'England (SDLT)', scotland: 'Scotland (LBTT)', wales: 'Wales (LTT)' };
  var label = jurLabel[result.jurisdiction] || result.jurisdiction;

  var html = '';

  html += '<div class="stat-row">';
  html += _statBox('Total Tax', gbp(result.tax), label);
  html += _statBox('Effective Rate', _pct(result.effectiveRate), 'of purchase price');
  if (result.relief_applied) {
    html += _statBox('Relief Applied', '<span style="color:#1a7a3e;font-weight:700;">Yes</span>', 'First-time buyer');
  }
  html += '</div>';

  html += _sectionTitle('Tax Breakdown');
  var tableRows = result.breakdown.map(function(b) {
    return [esc(b.band), _pct(b.rate), '<strong>' + gbp(b.amount) + '</strong>'];
  });
  html += _table(['Band', 'Rate', 'Tax'], tableRows);

  // Savings vs no relief
  if (result.relief_applied) {
    html += _sectionTitle('First-Time Buyer Saving');
    var noRelief = calcStampDuty(
      // Re-calc with same price but no relief to get comparison
      // We need a raw price — we get it from breakdown totals indirectly; pass a flag
      null, false, false, result.jurisdiction
    );
    // Use a simpler approach: standard calc without ftb
    // We cannot recover price here, so we just show a note
    html += '<div style="font-size:13px;color:#555;padding:8px 0;">First-time buyer relief has been applied. Without this relief, a higher rate would apply across the standard residential bands.</div>';
  }

  html += '<div style="font-size:11px;color:#888;margin-top:12px;">Rates: 2024/25. Always verify with HMRC/Revenue Scotland/Welsh Revenue Authority.</div>';

  _setContainer(containerId, html);
}

// ── 2. LTV CALCULATOR WITH RATE BAND ALERTS ───────────────────────────────────

function calcLTV(loanAmount, propertyValue) {
  loanAmount = parseFloat(loanAmount);
  propertyValue = parseFloat(propertyValue);
  if (!loanAmount || loanAmount <= 0) { return { error: 'Please enter a valid loan amount.' }; }
  if (!propertyValue || propertyValue <= 0) { return { error: 'Please enter a valid property value.' }; }

  var ltv_pct = (loanAmount / propertyValue) * 100;

  var bandThresholds = [60, 65, 70, 75, 80, 85, 90, 95];
  var rateAdds = { 60: 0, 65: 0.1, 70: 0.2, 75: 0.3, 80: 0.5, 85: 0.8, 90: 1.2, 95: 1.8 };

  var currentBand = null;
  var nextBand = null;

  for (var i = 0; i < bandThresholds.length; i++) {
    if (ltv_pct <= bandThresholds[i]) {
      currentBand = String(bandThresholds[i]);
      nextBand = (i > 0) ? String(bandThresholds[i - 1]) : null;
      break;
    }
  }
  if (!currentBand) {
    currentBand = '95+';
    nextBand = '95';
  }

  var amount_to_next_band = null;
  var nextBandNum = null;
  if (currentBand !== '60' && nextBand !== null) {
    // Amount needed to reduce into next lower band
    nextBandNum = parseInt(currentBand, 10) - 5;
    if (nextBandNum >= 60) {
      var targetLoan = propertyValue * (nextBandNum / 100);
      amount_to_next_band = loanAmount - targetLoan;
    }
  } else if (currentBand === '60') {
    amount_to_next_band = 0;
  }

  var bands = bandThresholds.map(function(t) {
    return {
      threshold: t,
      label: t + '%',
      typical_rate_add: rateAdds[t]
    };
  });

  return {
    ltv_pct: ltv_pct,
    band: currentBand,
    next_band: nextBand ? String(parseInt(currentBand, 10) - 5) : null,
    amount_to_next_band: amount_to_next_band,
    bands: bands
  };
}

function renderLTV(result, containerId) {
  containerId = containerId || 'calc-ltv-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var ltvNum = result.ltv_pct;
  var ltvColour = ltvNum <= 60 ? '#1a7a3e' : ltvNum <= 75 ? '#1a4e8a' : ltvNum <= 85 ? '#b8760a' : '#a01c1c';

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('LTV', '<span style="color:' + ltvColour + ';">' + _pct(ltvNum, 1) + '</span>', 'Loan-to-value');
  html += _statBox('LTV Band', result.band + '%', 'Rate pricing tier');
  if (result.amount_to_next_band && result.amount_to_next_band > 0) {
    html += _statBox('To Next Lower Band', gbp(result.amount_to_next_band), 'Reduces to ' + result.next_band + '% band');
  }
  html += '</div>';

  html += _sectionTitle('LTV Band Rate Guide');

  var tableRows = result.bands.map(function(b) {
    var isActive = String(b.threshold) === result.band;
    var style = isActive ? 'font-weight:700;background:rgba(139,28,42,.08);' : '';
    var badge = isActive ? ' ← current' : '';
    var addStr = b.typical_rate_add === 0 ? 'Base' : '+' + _pct(b.typical_rate_add) + ' vs 60%';
    return [
      '<span style="' + style + '">' + b.label + badge + '</span>',
      '<span style="' + style + '">' + addStr + '</span>'
    ];
  });
  html += _table(['LTV Band', 'Typical Rate Premium (vs 60% LTV)'], tableRows);

  html += '<div style="font-size:11px;color:#888;margin-top:10px;">Rate premiums are indicative averages. Actual lender pricing varies by product and borrower profile.</div>';

  _setContainer(containerId, html);
}

// ── 3. BTL RENTAL YIELD & ICR CALCULATOR ─────────────────────────────────────

function calcBTLICR(monthlyRent, loanAmount, testRate, taxBracket) {
  monthlyRent = parseFloat(monthlyRent);
  loanAmount = parseFloat(loanAmount);
  testRate = parseFloat(testRate);
  if (!monthlyRent || monthlyRent <= 0) { return { error: 'Please enter a valid monthly rent.' }; }
  if (!loanAmount || loanAmount <= 0) { return { error: 'Please enter a valid loan amount.' }; }
  if (!testRate || testRate <= 0) { return { error: 'Please enter a valid stress test rate.' }; }

  var annual_rent = monthlyRent * 12;
  var testRateDec = testRate / 100;

  // Annual interest at test rate
  var annual_interest = loanAmount * testRateDec;

  var icrThresholds = { basic: 125, higher: 145, portfolio: 140 };

  var icr_basic = (annual_rent / annual_interest) * 100;
  var icr_higher = icr_basic; // same formula; threshold differs
  var icr_portfolio = icr_basic;

  var passes_basic = icr_basic >= icrThresholds.basic;
  var passes_higher = icr_higher >= icrThresholds.higher;
  var passes_portfolio = icr_portfolio >= icrThresholds.portfolio;

  // Minimum rent required to pass each threshold at the stress rate
  var min_rent_basic = (loanAmount * testRateDec * icrThresholds.basic / 100) / 12;
  var min_rent_higher = (loanAmount * testRateDec * icrThresholds.higher / 100) / 12;
  var min_rent_portfolio = (loanAmount * testRateDec * icrThresholds.portfolio / 100) / 12;

  // Maximum loan given rent at each threshold
  var max_loan_basic = (annual_rent / (icrThresholds.basic / 100)) / testRateDec;
  var max_loan_higher = (annual_rent / (icrThresholds.higher / 100)) / testRateDec;
  var max_loan_portfolio = (annual_rent / (icrThresholds.portfolio / 100)) / testRateDec;

  // Gross yield — we can only compute if property value isn't passed,
  // so we return annual rent for reference
  var gross_yield_pct = null; // requires property value

  return {
    annual_rent: annual_rent,
    gross_yield_pct: gross_yield_pct,
    icr_basic: icr_basic,
    icr_higher: icr_higher,
    icr_portfolio: icr_portfolio,
    passes_basic: passes_basic,
    passes_higher: passes_higher,
    passes_portfolio: passes_portfolio,
    min_rent_basic: min_rent_basic,
    min_rent_higher: min_rent_higher,
    min_rent_portfolio: min_rent_portfolio,
    max_loan_basic: max_loan_basic,
    max_loan_higher: max_loan_higher,
    max_loan_portfolio: max_loan_portfolio,
    annual_interest: annual_interest,
    test_rate: testRate,
    tax_bracket: taxBracket || 'basic'
  };
}

function renderBTLICR(result, containerId) {
  containerId = containerId || 'calc-btl-icr-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('Annual Rent', gbp(result.annual_rent), 'Gross');
  html += _statBox('Annual Interest', gbp(result.annual_interest), 'at ' + _pct(result.test_rate) + ' stress rate');
  html += '</div>';

  html += _sectionTitle('ICR Results by Tax Bracket');

  var thresholds = [
    { label: 'Basic Rate', icr: result.icr_basic, passes: result.passes_basic, threshold: 125, minRent: result.min_rent_basic, maxLoan: result.max_loan_basic },
    { label: 'Portfolio', icr: result.icr_portfolio, passes: result.passes_portfolio, threshold: 140, minRent: result.min_rent_portfolio, maxLoan: result.max_loan_portfolio },
    { label: 'Higher Rate', icr: result.icr_higher, passes: result.passes_higher, threshold: 145, minRent: result.min_rent_higher, maxLoan: result.max_loan_higher }
  ];

  var tableRows = thresholds.map(function(t) {
    var badge = t.passes ? _verdictBadge(true, 'PASS') : _verdictBadge(false, 'FAIL');
    return [
      esc(t.label),
      t.threshold + '%',
      '<strong>' + _pct(t.icr, 0) + '</strong>',
      badge,
      gbp(t.minRent) + '/mo',
      gbp(t.maxLoan)
    ];
  });
  html += _table(['Bracket', 'ICR Req.', 'ICR Calc.', 'Status', 'Min Rent', 'Max Loan'], tableRows);

  html += '<div style="font-size:11px;color:#888;margin-top:10px;">ICR = Annual Rent ÷ Annual Interest at stress rate. Stress rate: ' + _pct(result.test_rate) + '. Lenders may apply additional criteria.</div>';

  _setContainer(containerId, html);
}

// ── 4. CONTRACTOR INCOME CALCULATOR ──────────────────────────────────────────

function calcContractorIncome(dayRate, daysPerWeek, weeksWorked) {
  dayRate = parseFloat(dayRate);
  daysPerWeek = parseFloat(daysPerWeek) || 5;
  weeksWorked = parseFloat(weeksWorked) || 48;

  if (!dayRate || dayRate <= 0) { return { error: 'Please enter a valid day rate.' }; }
  if (daysPerWeek <= 0 || daysPerWeek > 7) { return { error: 'Days per week must be between 1 and 7.' }; }
  if (weeksWorked <= 0 || weeksWorked > 52) { return { error: 'Weeks worked must be between 1 and 52.' }; }

  var weeklyRate = dayRate * daysPerWeek;
  var gross_annual = weeklyRate * weeksWorked;
  var net_daily = dayRate * 0.7; // rough net after tax estimate

  var methods = [
    {
      method: 'Day Rate × 48 weeks',
      annualised: dayRate * daysPerWeek * 48,
      lender_examples: 'Halifax, Barclays, HSBC',
      notes: '48 weeks = standard contract year (52 less 4 wks holiday). Most common method.'
    },
    {
      method: 'Day Rate × 46 weeks',
      annualised: dayRate * daysPerWeek * 46,
      lender_examples: 'Nationwide, Santander',
      notes: '46 weeks used by some lenders as a more conservative annualisation.'
    },
    {
      method: 'Day Rate × 52 weeks',
      annualised: dayRate * daysPerWeek * 52,
      lender_examples: 'Some specialist lenders',
      notes: 'Full year annualisation. Less common; requires strong contract evidence.'
    },
    {
      method: 'Actual (' + weeksWorked + ' weeks worked)',
      annualised: gross_annual,
      lender_examples: 'Accountant / self-declared',
      notes: 'Based on ' + weeksWorked + ' weeks at ' + daysPerWeek + ' days/week. Use for SA302-based applications.'
    },
    {
      method: 'Ltd Company — Salary + Divs',
      annualised: dayRate * daysPerWeek * 48 * 0.85,
      lender_examples: 'Kensington, Pepper Money, Together',
      notes: 'Approx 85% of annualised rate as net after corp tax + extraction costs. Specialist lenders may use net profit.'
    }
  ];

  return {
    gross_annual: gross_annual,
    net_daily: net_daily,
    day_rate: dayRate,
    days_per_week: daysPerWeek,
    weeks_worked: weeksWorked,
    weekly_rate: weeklyRate,
    methods: methods
  };
}

function renderContractorIncome(result, containerId) {
  containerId = containerId || 'calc-contractor-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('Day Rate', gbp(result.day_rate), 'Input');
  html += _statBox('Weekly Rate', gbp(result.weekly_rate), result.days_per_week + ' days/week');
  html += _statBox('Gross Annual', gbp(result.gross_annual), result.weeks_worked + ' weeks worked');
  html += '</div>';

  html += _sectionTitle('Lender Annualisation Methods');
  var tableRows = result.methods.map(function(m) {
    return [
      esc(m.method),
      '<strong>' + gbp(m.annualised) + '</strong>',
      esc(m.lender_examples),
      '<span style="font-size:11px;color:#555;">' + esc(m.notes) + '</span>'
    ];
  });
  html += _table(['Method', 'Annualised Income', 'Lender Examples', 'Notes'], tableRows);

  html += '<div style="font-size:11px;color:#888;margin-top:10px;">Figures are for illustration. Lenders will require current contract, last 2 contracts or 2 years\' trading history for Ltd Co applications.</div>';

  _setContainer(containerId, html);
}

// ── 5. ERC (EARLY REPAYMENT CHARGE) PLANNER ──────────────────────────────────

function calcERC(loanBalance, ercPct, ercEndDate) {
  loanBalance = parseFloat(loanBalance);
  ercPct = parseFloat(ercPct);
  if (!loanBalance || loanBalance <= 0) { return { error: 'Please enter a valid loan balance.' }; }
  if (ercPct == null || isNaN(ercPct) || ercPct < 0) { return { error: 'Please enter a valid ERC percentage.' }; }
  if (!ercEndDate) { return { error: 'Please enter an ERC end date.' }; }

  var endDate = new Date(ercEndDate);
  if (isNaN(endDate.getTime())) { return { error: 'Invalid ERC end date format. Use YYYY-MM-DD.' }; }

  var today = getCurrentDate();
  today.setHours(0, 0, 0, 0);

  var months_remaining = monthsBetween(today, endDate);
  if (months_remaining < 0) {
    return { error: 'ERC end date is in the past.' };
  }

  var monthly_repayment_rate = 0.005; // 0.5% per month balance reduction assumption

  // Build schedule at 6 intervals: today, 3m, 6m, 9m, 12m, end date
  var intervals = [0, 3, 6, 9, 12];
  var schedule = [];

  intervals.forEach(function(mo) {
    if (mo > months_remaining) { return; }
    var balanceAtPoint = loanBalance * Math.pow(1 - monthly_repayment_rate, mo);
    var monthsLeft = months_remaining - mo;
    // ERC steps down linearly per remaining months fraction, floored to 0 at end
    var ercAtPoint = monthsLeft > 0 ? ercPct : 0;
    var ercAmount = balanceAtPoint * (ercAtPoint / 100);
    var pointDate = new Date(today);
    pointDate.setMonth(pointDate.getMonth() + mo);
    schedule.push({
      months_from_now: mo,
      date: pointDate.toISOString().slice(0, 10),
      balance_estimate: balanceAtPoint,
      erc_amount: ercAmount,
      erc_pct_at_date: ercAtPoint
    });
  });

  // Always add end date point
  var balanceAtEnd = loanBalance * Math.pow(1 - monthly_repayment_rate, months_remaining);
  schedule.push({
    months_from_now: months_remaining,
    date: endDate.toISOString().slice(0, 10),
    balance_estimate: balanceAtEnd,
    erc_amount: 0,
    erc_pct_at_date: 0
  });

  var erc_today = loanBalance * (ercPct / 100);

  return {
    erc_today: erc_today,
    erc_end_date: ercEndDate,
    months_remaining: months_remaining,
    erc_pct: ercPct,
    loan_balance: loanBalance,
    schedule: schedule
  };
}

function renderERC(result, containerId) {
  containerId = containerId || 'calc-erc-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('ERC Today', gbp(result.erc_today), _pct(result.erc_pct) + ' of balance');
  html += _statBox('Loan Balance', gbp(result.loan_balance), 'Current');
  html += _statBox('Months Remaining', result.months_remaining + ' months', 'ERC expires ' + esc(result.erc_end_date));
  html += '</div>';

  html += _sectionTitle('ERC Cost Over Time');

  // Find lowest cost point
  var lowestERC = Infinity;
  var lowestIdx = 0;
  result.schedule.forEach(function(s, i) {
    if (s.erc_amount < lowestERC) { lowestERC = s.erc_amount; lowestIdx = i; }
  });

  var tableRows = result.schedule.map(function(s, i) {
    var isEnd = s.erc_pct_at_date === 0;
    var isToday = s.months_from_now === 0;
    var style = isEnd ? 'color:#1a7a3e;font-weight:700;' : (isToday ? 'font-weight:700;' : '');
    var note = isEnd ? ' ✓ ERC-free' : (isToday ? ' (today)' : '');
    return [
      '<span style="' + style + '">' + esc(s.date) + note + '</span>',
      esc(String(s.months_from_now)),
      gbp(s.balance_estimate),
      '<span style="' + style + '">' + gbp(s.erc_amount) + '</span>',
      '<span style="' + style + '">' + _pct(s.erc_pct_at_date) + '</span>'
    ];
  });

  html += _table(['Date', 'Months From Now', 'Est. Balance', 'ERC Amount', 'ERC Rate'], tableRows);

  html += _sectionTitle('Guidance');
  html += '<div style="font-size:13px;color:#555;line-height:1.6;">';
  html += 'ERC disappears on <strong>' + esc(result.erc_end_date) + '</strong>. ';
  html += 'Balance estimates assume 0.5% monthly capital reduction. ';
  html += 'Compare ERC cost vs. potential saving from remortgaging or overpaying early.';
  html += '</div>';

  _setContainer(containerId, html);
}

// ── 6. SECOND CHARGE AFFORDABILITY ───────────────────────────────────────────

function calcSecondCharge(firstChargePmt, secondLoanAmt, secondRate, secondTermYrs, monthlyIncome) {
  firstChargePmt = parseFloat(firstChargePmt);
  secondLoanAmt = parseFloat(secondLoanAmt);
  secondRate = parseFloat(secondRate);
  secondTermYrs = parseFloat(secondTermYrs);
  monthlyIncome = parseFloat(monthlyIncome);

  if (!firstChargePmt || firstChargePmt < 0) { return { error: 'Please enter a valid first charge payment.' }; }
  if (!secondLoanAmt || secondLoanAmt <= 0) { return { error: 'Please enter a valid second charge loan amount.' }; }
  if (!secondRate || secondRate <= 0) { return { error: 'Please enter a valid second charge interest rate.' }; }
  if (!secondTermYrs || secondTermYrs <= 0) { return { error: 'Please enter a valid term.' }; }
  if (!monthlyIncome || monthlyIncome <= 0) { return { error: 'Please enter a valid monthly income.' }; }

  var monthlyRate = secondRate / 100 / 12;
  var n = secondTermYrs * 12;
  var second_charge_pmt = (monthlyRate === 0) ? secondLoanAmt / n :
    (secondLoanAmt * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);

  var total_pmt = firstChargePmt + second_charge_pmt;
  var combined_pti_pct = (total_pmt / monthlyIncome) * 100;
  var passes_fca_35pct = combined_pti_pct <= 35;
  var disposable_after = monthlyIncome - total_pmt;

  // Max second loan that keeps total PTI at 35%
  var max_total_pmt = monthlyIncome * 0.35;
  var max_second_pmt = max_total_pmt - firstChargePmt;
  var max_second_loan = 0;
  if (max_second_pmt > 0 && monthlyRate > 0) {
    max_second_loan = (max_second_pmt * (Math.pow(1 + monthlyRate, n) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, n));
  } else if (max_second_pmt > 0) {
    max_second_loan = max_second_pmt * n;
  }

  return {
    second_charge_pmt: second_charge_pmt,
    total_pmt: total_pmt,
    combined_pti_pct: combined_pti_pct,
    passes_fca_35pct: passes_fca_35pct,
    disposable_after: disposable_after,
    max_second_loan_at_35pct: max_second_loan > 0 ? max_second_loan : 0,
    first_charge_pmt: firstChargePmt,
    second_rate: secondRate,
    second_term_yrs: secondTermYrs
  };
}

function renderSecondCharge(result, containerId) {
  containerId = containerId || 'calc-second-charge-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var ptiColour = result.passes_fca_35pct ? '#1a7a3e' : '#a01c1c';

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('2nd Charge Payment', gbp(result.second_charge_pmt), '/month');
  html += _statBox('Total Monthly PMT', gbp(result.total_pmt), '1st + 2nd charge');
  html += _statBox('Combined PTI', '<span style="color:' + ptiColour + ';">' + _pct(result.combined_pti_pct, 1) + '</span>', 'Payment-to-income');
  html += _statBox('Disposable Income', gbp(result.disposable_after), 'After both charges');
  html += '</div>';

  html += _sectionTitle('FCA 35% PTI Test');
  html += '<div style="padding:12px;background:' + (result.passes_fca_35pct ? '#d4edda' : '#f8d7da') + ';border-radius:6px;margin-bottom:16px;">';
  html += _verdictBadge(result.passes_fca_35pct, 'PASS — within 35% PTI threshold', 'FAIL — exceeds 35% PTI threshold');
  html += '<div style="margin-top:8px;font-size:13px;color:#333;">';
  if (result.passes_fca_35pct) {
    html += 'Combined debt service (' + _pct(result.combined_pti_pct, 1) + ') is within FCA-aligned 35% payment-to-income guideline.';
  } else {
    html += 'Combined debt service (' + _pct(result.combined_pti_pct, 1) + ') exceeds 35% of monthly income. ';
    html += 'Maximum second charge at 35% PTI: <strong>' + gbp(result.max_second_loan_at_35pct) + '</strong> ';
    html += '(' + result.second_term_yrs + ' yrs at ' + _pct(result.second_rate) + ').';
  }
  html += '</div></div>';

  html += _sectionTitle('Summary');
  html += _table(
    ['Item', 'Amount'],
    [
      ['First charge payment', gbp(result.first_charge_pmt) + '/mo'],
      ['Second charge payment', gbp(result.second_charge_pmt) + '/mo'],
      ['Total debt service', gbp(result.total_pmt) + '/mo'],
      ['Max 2nd loan (35% PTI)', gbp(result.max_second_loan_at_35pct)]
    ]
  );

  _setContainer(containerId, html);
}

// ── 7. SHARED OWNERSHIP CALCULATOR ───────────────────────────────────────────

function calcSharedOwnership(fullPrice, sharePercent, mortgageRate, mortgageTerm, rentPct) {
  fullPrice = parseFloat(fullPrice);
  sharePercent = parseFloat(sharePercent);
  mortgageRate = parseFloat(mortgageRate);
  mortgageTerm = parseFloat(mortgageTerm);
  rentPct = parseFloat(rentPct) || 2.75;

  if (!fullPrice || fullPrice <= 0) { return { error: 'Please enter a valid full property price.' }; }
  if (!sharePercent || sharePercent <= 0 || sharePercent > 100) { return { error: 'Share percent must be between 1 and 100.' }; }
  if (!mortgageRate || mortgageRate <= 0) { return { error: 'Please enter a valid mortgage rate.' }; }
  if (!mortgageTerm || mortgageTerm <= 0) { return { error: 'Please enter a valid mortgage term.' }; }

  var share_value = fullPrice * (sharePercent / 100);
  var unsold_equity = fullPrice - share_value;
  var mortgage_needed = share_value; // assume 100% of share funded by mortgage (simplistic)

  var monthlyRate = mortgageRate / 100 / 12;
  var n = mortgageTerm * 12;
  var monthly_mortgage = (monthlyRate === 0) ? mortgage_needed / n :
    (mortgage_needed * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);

  var monthly_rent_on_unsold = (unsold_equity * (rentPct / 100)) / 12;
  var total_monthly_cost = monthly_mortgage + monthly_rent_on_unsold;

  // Staircasing to next 25% tranche
  var nextSharePct = Math.min(sharePercent + 25, 100);
  var additional_cost = fullPrice * (nextSharePct - sharePercent) / 100;
  var new_mortgage_amount = share_value + additional_cost;
  var new_unsold = fullPrice - new_mortgage_amount;
  var new_monthly_mortgage = (monthlyRate === 0) ? new_mortgage_amount / n :
    (new_mortgage_amount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  var new_monthly_rent = (new_unsold * (rentPct / 100)) / 12;
  var new_monthly_total = new_monthly_mortgage + new_monthly_rent;

  return {
    share_value: share_value,
    mortgage_needed: mortgage_needed,
    monthly_mortgage: monthly_mortgage,
    monthly_rent_on_unsold: monthly_rent_on_unsold,
    total_monthly_cost: total_monthly_cost,
    unsold_equity: unsold_equity,
    share_percent: sharePercent,
    full_price: fullPrice,
    rent_pct: rentPct,
    mortgage_rate: mortgageRate,
    mortgage_term: mortgageTerm,
    staircase_to_next_25: {
      new_share_pct: nextSharePct,
      additional_cost: additional_cost,
      new_mortgage: new_mortgage_amount,
      new_monthly_total: new_monthly_total,
      new_monthly_mortgage: new_monthly_mortgage,
      new_monthly_rent: new_monthly_rent
    }
  };
}

function renderSharedOwnership(result, containerId) {
  containerId = containerId || 'calc-shared-ownership-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('Your Share', gbp(result.share_value), _pct(result.share_percent, 0) + ' of full price');
  html += _statBox('Mortgage', gbp(result.monthly_mortgage) + '/mo', gbp(result.mortgage_needed) + ' @ ' + _pct(result.mortgage_rate) + ', ' + result.mortgage_term + ' yrs');
  html += _statBox('Rent on Unsold', gbp(result.monthly_rent_on_unsold) + '/mo', _pct(result.rent_pct) + ' pa on ' + gbp(result.unsold_equity));
  html += _statBox('Total Monthly', gbp(result.total_monthly_cost) + '/mo', 'Mortgage + rent');
  html += '</div>';

  html += _sectionTitle('Cost Breakdown');
  html += _table(
    ['Item', 'Amount'],
    [
      ['Full property value', gbp(result.full_price)],
      ['Your share (' + _pct(result.share_percent, 0) + ')', gbp(result.share_value)],
      ['Unsold equity (' + _pct(100 - result.share_percent, 0) + ')', gbp(result.unsold_equity)],
      ['Monthly mortgage', gbp(result.monthly_mortgage)],
      ['Monthly rent (' + _pct(result.rent_pct) + ' pa on unsold)', gbp(result.monthly_rent_on_unsold)],
      ['Total monthly cost', '<strong>' + gbp(result.total_monthly_cost) + '</strong>']
    ]
  );

  var sc = result.staircase_to_next_25;
  if (sc && sc.additional_cost > 0) {
    html += _sectionTitle('Staircase to ' + _pct(sc.new_share_pct, 0) + ' Share');
    html += _table(
      ['Item', 'Amount'],
      [
        ['Cost to buy next 25% tranche', gbp(sc.additional_cost)],
        ['New mortgage amount', gbp(sc.new_mortgage)],
        ['New monthly mortgage', gbp(sc.new_monthly_mortgage)],
        ['New monthly rent', gbp(sc.new_monthly_rent)],
        ['New total monthly', '<strong>' + gbp(sc.new_monthly_total) + '</strong>']
      ]
    );
  }

  html += '<div style="font-size:11px;color:#888;margin-top:10px;">Assumes 100% mortgage on purchased share. Rent % on unsold equity: ' + _pct(result.rent_pct) + ' pa (provider may apply RPI/CPI increases annually).</div>';

  _setContainer(containerId, html);
}

// ── 8. BRIDGING FINANCE CALCULATOR ───────────────────────────────────────────

function calcBridging(grossLoan, monthlyRatePct, termMonths, arrangementFeePct, exitFeePct) {
  grossLoan = parseFloat(grossLoan);
  monthlyRatePct = parseFloat(monthlyRatePct);
  termMonths = parseFloat(termMonths);
  arrangementFeePct = parseFloat(arrangementFeePct) || 0;
  exitFeePct = parseFloat(exitFeePct) || 0;

  if (!grossLoan || grossLoan <= 0) { return { error: 'Please enter a valid gross loan amount.' }; }
  if (!monthlyRatePct || monthlyRatePct <= 0) { return { error: 'Please enter a valid monthly interest rate.' }; }
  if (!termMonths || termMonths <= 0) { return { error: 'Please enter a valid term in months.' }; }

  var monthlyRate = monthlyRatePct / 100;
  var arrangement_fee = grossLoan * (arrangementFeePct / 100);
  var exit_fee = grossLoan * (exitFeePct / 100);
  var net_loan_after_fees = grossLoan - arrangement_fee;

  // Rolled-up interest: balance compounds monthly
  var balance = grossLoan;
  var monthly_schedule = [];
  for (var m = 1; m <= Math.min(termMonths, 6); m++) {
    balance = balance * (1 + monthlyRate);
    monthly_schedule.push({ month: m, balance: balance });
  }

  // Final balance after full term
  var final_balance = grossLoan * Math.pow(1 + monthlyRate, termMonths);
  var total_interest_rolled = final_balance - grossLoan;
  var total_cost = total_interest_rolled + arrangement_fee + exit_fee;
  var total_cost_pct_of_loan = (total_cost / grossLoan) * 100;

  return {
    net_loan_after_fees: net_loan_after_fees,
    gross_loan: grossLoan,
    total_interest_rolled: total_interest_rolled,
    arrangement_fee: arrangement_fee,
    exit_fee: exit_fee,
    total_cost: total_cost,
    total_cost_pct_of_loan: total_cost_pct_of_loan,
    final_balance: final_balance,
    monthly_rate_pct: monthlyRatePct,
    term_months: termMonths,
    monthly_schedule: monthly_schedule
  };
}

function renderBridging(result, containerId) {
  containerId = containerId || 'calc-bridging-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('Net Loan (after fees)', gbp(result.net_loan_after_fees), 'Proceeds received');
  html += _statBox('Total Interest Rolled', gbp(result.total_interest_rolled), result.term_months + ' months @ ' + _pct(result.monthly_rate_pct) + '/mo');
  html += _statBox('Total Cost', gbp(result.total_cost), _pct(result.total_cost_pct_of_loan, 1) + ' of gross loan');
  html += _statBox('Gross Redemption', gbp(result.final_balance + result.exit_fee), 'At end of term');
  html += '</div>';

  html += _sectionTitle('Fee Summary');
  html += _table(
    ['Item', 'Amount'],
    [
      ['Gross loan', gbp(result.gross_loan)],
      ['Arrangement fee', gbp(result.arrangement_fee)],
      ['Net loan proceeds', gbp(result.net_loan_after_fees)],
      ['Rolled-up interest (' + result.term_months + ' months)', gbp(result.total_interest_rolled)],
      ['Exit fee', gbp(result.exit_fee)],
      ['Total cost', '<strong>' + gbp(result.total_cost) + '</strong>'],
      ['Gross redemption figure', '<strong>' + gbp(result.final_balance + result.exit_fee) + '</strong>']
    ]
  );

  if (result.monthly_schedule.length > 0) {
    html += _sectionTitle('Rolled Balance — First ' + result.monthly_schedule.length + ' Months');
    var schedRows = result.monthly_schedule.map(function(s) {
      return ['Month ' + s.month, gbp(s.balance)];
    });
    html += _table(['Period', 'Balance (Interest Rolled Up)'], schedRows);
  }

  html += '<div style="font-size:11px;color:#888;margin-top:10px;">Interest compounds monthly. Exit fee calculated on gross loan. Rates are indicative only.</div>';

  _setContainer(containerId, html);
}

// ── 9. HELP TO BUY EQUITY LOAN ────────────────────────────────────────────────

function calcHTB(propertyPrice, depositPct, htbSharePct, mortgageRate, mortgageTerm) {
  propertyPrice = parseFloat(propertyPrice);
  depositPct = parseFloat(depositPct);
  htbSharePct = parseFloat(htbSharePct);
  mortgageRate = parseFloat(mortgageRate);
  mortgageTerm = parseFloat(mortgageTerm);

  if (!propertyPrice || propertyPrice <= 0) { return { error: 'Please enter a valid property price.' }; }
  if (!depositPct || depositPct <= 0 || depositPct >= 100) { return { error: 'Deposit must be between 1% and 99%.' }; }
  if (!htbSharePct || htbSharePct <= 0 || htbSharePct > 40) { return { error: 'HTB equity share must be between 1% and 40%.' }; }
  if (!mortgageRate || mortgageRate <= 0) { return { error: 'Please enter a valid mortgage rate.' }; }
  if (!mortgageTerm || mortgageTerm <= 0) { return { error: 'Please enter a valid mortgage term.' }; }

  var deposit_amount = propertyPrice * (depositPct / 100);
  var htb_loan = propertyPrice * (htbSharePct / 100);
  var mortgage_amount = propertyPrice - deposit_amount - htb_loan;
  if (mortgage_amount <= 0) { return { error: 'Deposit and HTB loan together cover the full price — no mortgage needed.' }; }

  var combined_ltv = ((mortgage_amount + htb_loan) / propertyPrice) * 100;

  var monthlyRate = mortgageRate / 100 / 12;
  var n = mortgageTerm * 12;
  var monthly_mortgage = (monthlyRate === 0) ? mortgage_amount / n :
    (mortgage_amount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);

  // HTB admin fee kicks in from year 6 at 1.75% of the equity loan value, rising by CPI+2% pa
  // Year 6 monthly fee (at face-value of HTB loan, not current market value)
  var htb_fee_year6_annual = htb_loan * 0.0175;
  var htb_fee_year6_monthly = htb_fee_year6_annual / 12;
  var total_monthly_year6 = monthly_mortgage + htb_fee_year6_monthly;

  // Repayment of HTB loan now (at current property value, i.e. at original price as proxy)
  var htb_repayment_at_current_value = htb_loan; // face value before any appreciation

  return {
    deposit_amount: deposit_amount,
    htb_loan: htb_loan,
    mortgage_amount: mortgage_amount,
    combined_ltv: combined_ltv,
    monthly_mortgage: monthly_mortgage,
    htb_fee_year6_monthly: htb_fee_year6_monthly,
    total_monthly_year6: total_monthly_year6,
    deposit_pct: depositPct,
    htb_share_pct: htbSharePct,
    mortgage_rate: mortgageRate,
    mortgage_term: mortgageTerm,
    property_price: propertyPrice,
    repayment_now: {
      htb_repayment_at_current_value: htb_repayment_at_current_value
    }
  };
}

function renderHTB(result, containerId) {
  containerId = containerId || 'calc-htb-result';
  if (!result || result.error) {
    _setContainer(containerId, _errorHtml(result ? result.error : 'No result.'));
    return;
  }

  var html = '';
  html += '<div class="stat-row">';
  html += _statBox('Deposit', gbp(result.deposit_amount), _pct(result.deposit_pct, 0) + ' of price');
  html += _statBox('HTB Equity Loan', gbp(result.htb_loan), _pct(result.htb_share_pct, 0) + ' of price');
  html += _statBox('Mortgage', gbp(result.mortgage_amount), 'Required');
  html += _statBox('Combined LTV', _pct(result.combined_ltv, 1), 'Mortgage + HTB');
  html += '</div>';

  html += '<div class="stat-row">';
  html += _statBox('Monthly Mortgage', gbp(result.monthly_mortgage) + '/mo', result.mortgage_term + ' yrs @ ' + _pct(result.mortgage_rate));
  html += _statBox('HTB Fee (Yr 6+)', gbp(result.htb_fee_year6_monthly) + '/mo', '1.75% pa of HTB loan');
  html += _statBox('Total in Year 6', gbp(result.total_monthly_year6) + '/mo', 'Mortgage + HTB fee');
  html += '</div>';

  html += _sectionTitle('Equity Loan Breakdown');
  html += _table(
    ['Item', 'Detail'],
    [
      ['Property price', gbp(result.property_price)],
      ['Deposit (' + _pct(result.deposit_pct, 0) + ')', gbp(result.deposit_amount)],
      ['HTB equity loan (' + _pct(result.htb_share_pct, 0) + ')', gbp(result.htb_loan)],
      ['Mortgage required', gbp(result.mortgage_amount)],
      ['Monthly mortgage (yrs 1–' + result.mortgage_term + ')', gbp(result.monthly_mortgage) + '/mo'],
      ['HTB admin fee from yr 6 (1.75% pa, rising CPI+2%)', gbp(result.htb_fee_year6_monthly) + '/mo'],
      ['Total monthly from yr 6', '<strong>' + gbp(result.total_monthly_year6) + '</strong>/mo'],
      ['HTB repayment (at current value)', gbp(result.repayment_now.htb_repayment_at_current_value)]
    ]
  );

  html += _sectionTitle('Key Points');
  html += '<ul style="font-size:13px;color:#555;padding-left:18px;line-height:1.8;">';
  html += '<li>HTB equity loan is interest-free for years 1–5.</li>';
  html += '<li>From year 6, an annual fee of 1.75% of the loan is charged, rising by CPI+2% each year.</li>';
  html += '<li>When you sell or repay, you repay the same <em>percentage</em> of the market value (not the original loan sum).</li>';
  html += '<li>Combined LTV of ' + _pct(result.combined_ltv, 1) + ' includes the HTB loan as debt.</li>';
  html += '</ul>';

  html += '<div style="font-size:11px;color:#888;margin-top:10px;">Help to Buy (England) scheme closed March 2023 for new applications. These figures apply to existing loan holders.</div>';

  _setContainer(containerId, html);
}
