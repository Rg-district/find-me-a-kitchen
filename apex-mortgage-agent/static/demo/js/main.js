/* =========================================================
   MORTGAGES ARE US — main.js
   Hamburger, scroll shadow, multi-step form, track form
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     1. NAVBAR — scroll shadow + hamburger
  ------------------------------------------------------- */
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('hamburger');
  const mobileNav  = document.getElementById('mobile-nav');

  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
    });

    // Close mobile nav when a link is clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* -------------------------------------------------------
     2. FADE-IN ANIMATION (Intersection Observer)
  ------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger sibling cards
          const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-in'));
          const delay = siblings.indexOf(entry.target) * 80;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach(el => io.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* -------------------------------------------------------
     3. MULTI-STEP FORM (get-started page)
  ------------------------------------------------------- */
  const enquiryForm = document.getElementById('enquiry-form');
  if (enquiryForm) {
    let currentStep = 1;
    const totalSteps = 3;

    function goToStep(n) {
      // Hide all steps
      document.querySelectorAll('.form-step').forEach(s => s.classList.add('form-step--hidden'));
      // Show target
      const target = document.getElementById('step-' + n);
      if (target) target.classList.remove('form-step--hidden');

      // Update progress bar
      const pct = (n / totalSteps) * 100;
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = pct + '%';

      // Update step dots
      for (let i = 1; i <= totalSteps; i++) {
        const ps = document.getElementById('ps-' + i);
        if (!ps) continue;
        ps.classList.remove('progress-step--active', 'progress-step--done');
        if (i < n)  ps.classList.add('progress-step--done');
        if (i === n) ps.classList.add('progress-step--active');
      }

      currentStep = n;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateStep(n) {
      let valid = true;

      if (n === 1) {
        const name  = document.getElementById('full-name');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');

        if (!name.value.trim()) {
          showError('err-full-name', name, 'Please enter your full name.');
          valid = false;
        } else clearError('err-full-name', name);

        if (!email.value.trim() || !email.validity.valid) {
          showError('err-email', email, 'Please enter a valid email address.');
          valid = false;
        } else clearError('err-email', email);

        if (!phone.value.trim()) {
          showError('err-phone', phone, 'Please enter a phone number.');
          valid = false;
        } else clearError('err-phone', phone);
      }

      if (n === 2) {
        const type = document.querySelector('input[name="mortgage_type"]:checked');
        const pv   = document.getElementById('property-value');
        const dep  = document.getElementById('deposit');

        if (!type) {
          showError('err-mortgage-type', null, 'Please select what you\'re looking for.');
          valid = false;
        } else clearError('err-mortgage-type', null);

        if (!pv.value || Number(pv.value) <= 0) {
          showError('err-property-value', pv, 'Please enter a property value.');
          valid = false;
        } else clearError('err-property-value', pv);

        if (!dep.value || Number(dep.value) < 0) {
          showError('err-deposit', dep, 'Please enter a deposit amount.');
          valid = false;
        } else clearError('err-deposit', dep);
      }

      return valid;
    }

    function showError(errId, input, msg) {
      const errEl = document.getElementById(errId);
      if (errEl) errEl.textContent = msg;
      if (input) input.classList.add('error');
    }

    function clearError(errId, input) {
      const errEl = document.getElementById(errId);
      if (errEl) errEl.textContent = '';
      if (input) input.classList.remove('error');
    }

    // Next buttons
    document.querySelectorAll('.step-next').forEach(btn => {
      btn.addEventListener('click', () => {
        if (validateStep(currentStep)) goToStep(Number(btn.dataset.target));
      });
    });

    // Back buttons
    document.querySelectorAll('.step-back').forEach(btn => {
      btn.addEventListener('click', () => goToStep(Number(btn.dataset.target)));
    });

    // Form submit
    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const gdpr = document.getElementById('gdpr-consent');
      const errGdpr = document.getElementById('err-gdpr');
      if (!gdpr.checked) {
        errGdpr.textContent = 'You must consent before submitting.';
        return;
      }
      errGdpr.textContent = '';

      const submitBtn  = document.getElementById('submit-btn');
      const btnText    = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      const formError  = document.getElementById('form-error');

      // Loading state
      submitBtn.disabled = true;
      btnText.hidden     = true;
      btnLoading.hidden  = false;
      formError.hidden   = true;

      // Collect form data
      const creditIssues = Array.from(document.querySelectorAll('input[name="credit_issues"]:checked')).map(i => i.value);
      const payload = {
        full_name:      document.getElementById('full-name').value.trim(),
        email:          document.getElementById('email').value.trim(),
        phone:          document.getElementById('phone').value.trim(),
        heard_about:    document.getElementById('heard-about').value,
        mortgage_type:  (document.querySelector('input[name="mortgage_type"]:checked') || {}).value || '',
        property_value: document.getElementById('property-value').value,
        deposit:        document.getElementById('deposit').value,
        timeline:       document.getElementById('timeline').value,
        credit_issues:  creditIssues,
        more_info:      document.getElementById('more-info').value,
        gdpr_consent:   true,
      };

      try {
        const res = await fetch('/api/public/lead', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
          // Show success screen
          enquiryForm.hidden = true;
          const successScreen = document.getElementById('success-screen');
          successScreen.hidden = false;

          const firstName = payload.full_name.split(' ')[0] || payload.full_name;
          document.getElementById('success-name').textContent = firstName;
          document.getElementById('success-ref').textContent  = data.reference || generateRef();

          document.querySelector('.progress-bar-wrap').hidden = true;
        } else {
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }
      } catch (err) {
        formError.textContent = err.message;
        formError.hidden = false;
      } finally {
        submitBtn.disabled = false;
        btnText.hidden     = false;
        btnLoading.hidden  = true;
      }
    });

    function generateRef() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
  }

  /* -------------------------------------------------------
     4. TRACK FORM (track page)
  ------------------------------------------------------- */
  const trackForm = document.getElementById('track-form');
  if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const refInput   = document.getElementById('ref-input');
      const trackError = document.getElementById('track-error');
      const trackBtn   = document.getElementById('track-btn');
      const btnText    = trackBtn.querySelector('.btn-text');
      const btnLoading = trackBtn.querySelector('.btn-loading');

      const ref = refInput.value.trim().toUpperCase();
      if (ref.length !== 8) {
        trackError.textContent = 'Reference numbers are 8 characters long.';
        return;
      }
      trackError.textContent = '';

      // Loading
      trackBtn.disabled  = true;
      btnText.hidden     = true;
      btnLoading.hidden  = false;

      try {
        const res  = await fetch('/api/public/track/' + encodeURIComponent(ref));
        const data = await res.json();

        if (res.ok && data.found) {
          renderTrackResult(data);
        } else {
          showNotFound();
        }
      } catch {
        showNotFound();
      } finally {
        trackBtn.disabled = false;
        btnText.hidden    = false;
        btnLoading.hidden = true;
      }
    });

    function renderTrackResult(data) {
      const stageMap = { 1: 'Research', 2: 'DIP', 3: 'Full Application', 4: 'Offer', 5: 'Completion' };

      document.getElementById('track-not-found').hidden = true;
      const resultEl = document.getElementById('track-result');
      resultEl.hidden = false;

      document.getElementById('track-client-name').textContent = data.client_name || '—';
      document.getElementById('track-stage-pill').textContent  = stageMap[data.stage] || '—';
      document.getElementById('track-updated').textContent     = data.updated_at    || '—';

      const currentStage = data.stage || 1;
      for (let i = 1; i <= 5; i++) {
        const stepEl = document.getElementById('ts-' + i);
        if (!stepEl) continue;
        stepEl.classList.remove('done', 'active', 'future');
        if (i < currentStage)  stepEl.classList.add('done');
        if (i === currentStage) stepEl.classList.add('active');
        if (i > currentStage)  stepEl.classList.add('future');
      }
    }

    function showNotFound() {
      document.getElementById('track-result').hidden    = true;
      document.getElementById('track-not-found').hidden = false;
    }
  }

})();
