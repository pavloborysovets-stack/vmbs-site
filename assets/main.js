/* VMBS.TECH — small vanilla JS: menu, case filter, form, cookie consent. */
(function () {
  'use strict';
  var cfg = window.VMBS || {};

  // ---- mobile menu ----
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('nav-toggle');
  if (btn && nav) {
    // the checkbox makes the menu work without JS; JS only keeps aria state and keyboard support
    var sync = function () { btn.setAttribute('aria-expanded', toggle && toggle.checked ? 'true' : 'false'); };
    if (toggle) toggle.addEventListener('change', sync);
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (toggle) { toggle.checked = !toggle.checked; sync(); } } });
    sync();
    // desktop: close other dropdowns when one opens; close on outside click
    nav.addEventListener('toggle', function (e) {
      if (e.target.tagName === 'DETAILS' && e.target.open) {
        nav.querySelectorAll('details[open]').forEach(function (d) { if (d !== e.target) d.open = false; });
      }
    }, true);
    document.addEventListener('click', function (e) {
      if (window.innerWidth < 1024) return;
      if (!nav.contains(e.target)) nav.querySelectorAll('details[open]').forEach(function (d) { d.open = false; });
    });
  }

  // ---- case studies filter ----
  var filter = document.querySelector('.filter');
  if (filter) {
    var cards = document.querySelectorAll('.cases [data-cat]');
    filter.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      var f = b.getAttribute('data-filter');
      filter.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var shown = 0;
      cards.forEach(function (c) {
        var show = f === 'all' || c.getAttribute('data-cat') === f;
        c.hidden = !show; if (show) shown++;
      });
      var live = document.getElementById('filter-live');
      if (live) live.textContent = shown;
    });
  }

  // ---- send-your-project form ----
  var form = document.getElementById('project-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form-msg');
      var submit = form.querySelector('button[type=submit]');
      if (form.querySelector('[name=botcheck]') && form.querySelector('[name=botcheck]').checked) return; // honeypot
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      submit.disabled = true; var label = submit.textContent; submit.textContent = form.getAttribute('data-sending');
      if (!cfg.formEndpoint || /REPLACE/.test(cfg.formKey || '')) {
        // backend not configured yet: fall back to mail client
        var body = ''; data.forEach(function (v, k) { if (k !== 'access_key' && k !== 'botcheck' && k !== 'redirect') body += k + ': ' + v + '\n'; });
        window.location.href = 'mailto:' + (cfg.email || 'contact@vmbs.tech') + '?subject=' + encodeURIComponent(form.getAttribute('data-subject') || 'Project') + '&body=' + encodeURIComponent(body);
        submit.disabled = false; submit.textContent = label; return;
      }
      fetch(cfg.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.success !== false, j: j }; }); })
        .then(function (res) {
          if (res.ok) { window.location.href = form.getAttribute('data-thanks'); }
          else { throw new Error(res.j && res.j.message); }
        })
        .catch(function () {
          msg.hidden = false; msg.className = 'form-msg error'; msg.textContent = form.getAttribute('data-error');
          submit.disabled = false; submit.textContent = label;
        });
    });
  }

  // ---- cookie consent (default: declined; GA only after accept and only in production) ----
  var banner = document.getElementById('cookie');
  var KEY = 'vmbs-consent';
  function consent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA() {
    if (!cfg.ga4 || !cfg.production) return;
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.ga4;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date()); gtag('config', cfg.ga4, { anonymize_ip: true });
  }
  if (banner) {
    var c = consent();
    if (c === 'yes') loadGA();
    else if (c !== 'no' && cfg.ga4 && cfg.production) banner.classList.add('show');
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-consent]'); if (!b) return;
      var v = b.getAttribute('data-consent'); setConsent(v); banner.classList.remove('show');
      if (v === 'yes') loadGA();
    });
  }
})();
