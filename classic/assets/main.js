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

// ---- lightbox: click a project picture to view it full screen, with arrows ----
(function () {
  var SEL = '.case-hero img, .case-gallery img, .gallery img, .post-cover img, .lb img';
  var imgs = [].slice.call(document.querySelectorAll(SEL));
  if (!imgs.length) return;
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var T = { en: ['Close', 'Previous', 'Next', 'Image'], de: ['Schließen', 'Zurück', 'Weiter', 'Bild'], pl: ['Zamknij', 'Poprzedni', 'Następny', 'Obraz'] }[lang] || ['Close', 'Previous', 'Next', 'Image'];
  var box = document.createElement('div');
  box.className = 'lightbox'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', T[3]);
  box.innerHTML = '<button type="button" class="lb-close" aria-label="' + T[0] + '">×</button>' +
    '<button type="button" class="lb-prev" aria-label="' + T[1] + '">‹</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="lb-next" aria-label="' + T[2] + '">›</button>';
  document.body.appendChild(box);
  var big = box.querySelector('img'), cap = box.querySelector('figcaption'), i = 0, last = null;
  function show(n) { i = (n + imgs.length) % imgs.length; big.src = imgs[i].currentSrc || imgs[i].src; big.alt = imgs[i].alt || ''; cap.textContent = (i + 1) + ' / ' + imgs.length; box.querySelector('.lb-prev').hidden = box.querySelector('.lb-next').hidden = imgs.length < 2; }
  function open(n) { last = document.activeElement; show(n); box.hidden = false; document.documentElement.style.overflow = 'hidden'; box.querySelector('.lb-close').focus(); }
  function close() { box.hidden = true; document.documentElement.style.overflow = ''; if (last) last.focus(); }
  imgs.forEach(function (im, n) {
    im.classList.add('zoomable'); im.setAttribute('tabindex', '0'); im.setAttribute('role', 'button');
    im.addEventListener('click', function (e) { e.preventDefault(); open(n); });
    im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
  });
  box.addEventListener('click', function (e) {
    if (e.target.closest('.lb-prev')) show(i - 1);
    else if (e.target.closest('.lb-next')) show(i + 1);
    else if (e.target.closest('.lb-close') || e.target === box) close();
  });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1);
  });
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
})();
