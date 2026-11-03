/* VMBS.TECH: build Wix pages from site.json (GitHub version) — runs inside the Wix editor */
(function () {
  const ds = window.ds, W = window.W;
  const B = window.VB = {};
  const L = (c, o) => ds.components.layout.update(c, o);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const applied = () => ds.waitForChangesAppliedAsync();
  const clone = o => JSON.parse(JSON.stringify(o));
  const HELV = 'helvetica-w01-roman,helvetica-w02-roman,helvetica-lt-w10-roman,sans-serif';
  const GEO = 'georgia,palatino,book antiqua,palatino linotype,serif';
  const F = {
    h1: ['h1', 'font_0', '48px', '1.2em', 'center', '#141C26', GEO],
    lead: ['p', 'font_8', '18.4px', '1.6em', 'center', '#3F4854', HELV],
    h2: ['h2', 'font_2', '33.6px', '1.2em', 'center', '#141C26', GEO],
    h3: ['h3', 'font_4', '22px', '1.3em', 'left', '#141C26', GEO],
    p: ['p', 'font_8', '18px', '1.6em', 'left', '#1A2029', HELV],
    small: ['p', 'font_8', '15px', '1.6em', 'left', '#5F6873', HELV],
    crumbs: ['p', 'font_8', '15px', '1.6em', 'left', '#5F6873', HELV],
    chips: ['p', 'font_8', '16px', '1.6em', 'center', '#3F4854', HELV],
    nav: ['p', 'font_8', '16px', '1.8em', 'center', '#1A2029', HELV],
    meta: ['p', 'font_8', '16px', '1.6em', 'left', '#1A2029', HELV]
  };
  let uid = 0;
  const wrap = (kind, inner, align) => {
    const [tag, cls, fs, lh, al, col, fam] = F[kind];
    return `<${tag} class="${cls}" style="font-size:${fs}; line-height:${lh}; text-align:${align || al};"><span style="font-size:${fs};"><span style="font-weight:normal;"><span style="color:${col};"><span style="font-family:${fam};">${inner}</span></span></span></span></${tag}>`;
  };
  // path -> page id
  B.pathMap = () => {
    const pd = ds.pages.getPagesData(); const byId = {}; pd.forEach(p => byId[p.id] = p);
    const full = p => { let parts = [p.pageUriSEO]; let q = p; let n = 0; while (q.parentPageId && byId[q.parentPageId] && n++ < 5) { q = byId[q.parentPageId]; parts.unshift(q.pageUriSEO) } return '/' + parts.join('/') };
    const m = {}; pd.forEach(p => m[full(p)] = p.id); m['/'] = ds.homePage.get ? ds.homePage.get() : 'aymzb'; return m;
  };
  const linkObj = (lk, pm) => {
    if (!lk) return null;
    if (lk.kind === 'page') { const id = pm[lk.v]; return id ? { type: 'PageLink', pageId: '#' + id, target: '_self' } : { type: 'ExternalLink', url: 'https://www.vmbs.tech' + lk.v, target: '_self' }; }
    if (lk.kind === 'email') return { type: 'EmailLink', recipient: lk.v, subject: '' };
    if (lk.kind === 'tel') return { type: 'PhoneLink', phoneNumber: lk.v };
    return { type: 'ExternalLink', url: lk.v, target: '_blank' };
  };
  const inline = (h, links, pm, ll) => h.replace(/<a data-l="(\d+)">([\s\S]*?)<\/a>/g, (m, i, t) => {
    const o = linkObj(links[+i], pm); if (!o) return t; const id = 'textLink_v' + (++uid); o.id = id; ll.push(o);
    return `<span style="text-decoration:underline;"><a dataquery="#${id}">${t}</a></span>`;
  }).replace(/<b>([\s\S]*?)<\/b>/g, '<span style="font-weight:bold;">$1</span>');
  B.textHtml = (b, links, pm) => {
    const ll = [];
    let h;
    if (b.t === 'list') h = `<ul class="font_8" style="font-size:18px; line-height:1.6em;">` + b.items.map(it => `<li>${wrap('p', inline(it, links, pm, ll))}</li>`).join('') + '</ul>';
    else if (b.t === 'chips') h = wrap('chips', b.items.map(x => inline(x, links, pm, ll)).join(' · '));
    else if (b.t === 'meta') h = b.items.map(([k, v]) => wrap('meta', `<span style="font-weight:bold;">${k}:</span> ${v}`)).join('');
    else if (b.t === 'nav') h = wrap('nav', b.items.map(it => { const i = links.push(it.link) - 1; return `<a data-l="${i}">${it.label}${it.sub ? ': ' + it.sub : ''}</a>` }).map(x => inline(x, links, pm, ll)).join(' &nbsp;·&nbsp; '));
    else h = wrap(b.t, inline(b.html, links, pm, ll));
    return { text: h, linkList: ll };
  };
  // templates
  B.templates = () => {
    const pick = (pid, pred) => { let f = null; const walk = c => { for (const k of ds.components.getChildren(c)) { if (!f && pred(k)) f = k; walk(k) } }; walk({ id: pid, type: 'DESKTOP' }); return f };
    const ser = r => { const s = ds.components.serialize(r); delete s.id; return s };
    const T = {};
    const txt = pick('gjn3r', k => /WRichText/.test(ds.components.getType(k)));
    T.txt = ser(txt);
    T.acc = ser(pick('gjn3r', k => /Container/.test(ds.components.getType(k)) && ds.components.layout.get(k).width === 40 && ds.components.layout.get(k).height <= 4));
    T.btn = ser(pick('hkgik', k => /SiteButton/.test(ds.components.getType(k))));
    T.html = ser(pick('hkgik', k => /HtmlComponent/.test(ds.components.getType(k))));
    const secs = ds.components.getChildren({ id: 'gjn3r', type: 'DESKTOP' });
    const sw = ser(secs[0]); sw.components = []; T.secW = sw;
    const sa = ser(secs[1]); sa.components = []; T.secA = sa;
    T.cta = ser(secs[secs.length - 1]);
    B.T = T; return Object.keys(T);
  };
  // measure embed height offscreen
  B.measure = async (url, w) => {
    const html = await fetch(url, { cache: 'no-store' }).then(r => r.text());
    const fr = document.createElement('iframe');
    fr.style.cssText = `position:fixed;left:-6000px;top:0;width:${w}px;height:200px;border:0`;
    document.body.appendChild(fr); fr.srcdoc = html;
    await new Promise(r => fr.onload = r);
    const d = fr.contentDocument;
    const imgs = [...d.images]; const t0 = Date.now();
    while (imgs.some(i => !i.complete) && Date.now() - t0 < 8000) await wait(200);
    await wait(300);
    const h = Math.ceil(d.querySelector('.e').getBoundingClientRect().height); fr.remove(); return h;
  };
  const domH = id => { const e = W.document.getElementById(id); return e ? Math.ceil(e.getBoundingClientRect().height) : 0 };
  const textH = id => { const e = W.document.getElementById(id); if (!e) return 0; const ps = [...e.querySelectorAll('p,h1,h2,h3,li')].filter(p => p.textContent.replace(/​|\s/g, '').length); if (!ps.length) return domH(id); return Math.ceil(Math.max(...ps.map(p => p.getBoundingClientRect().bottom)) - Math.min(...ps.map(p => p.getBoundingClientRect().top))) };
  const add = (parent, tpl, layout, data) => { const s = clone(tpl); s.layout = Object.assign({}, s.layout, layout); if (data) { s.data = Object.assign({}, s.data, data); delete s.data.id } return ds.components.add(parent, s) };
  const GAP_BEFORE = { h2: 48, h3: 28, embed: 28, buttons: 28, nav: 32, p: 16, list: 16, lead: 16, meta: 12, small: 12, chips: 16, h1: 8, crumbs: 0 };
  B.buildPage = async (P, pid) => {
    const pm = B.pathMap(); const T = B.T;
    ds.viewMode.set('DESKTOP'); ds.pages.navigateTo(pid); await wait(3500); await applied();
    const page = { id: pid, type: 'DESKTOP' };
    for (const c of ds.components.getChildren(page)) ds.components.remove(c);
    await applied();
    const links = clone(P.links);
    const log = []; const embeds = [];
    let secY = 0;
    for (const S of P.secs) {
      if (S.cta) { const r = add(page, T.cta, { y: secY }); await applied(); secY += ds.components.layout.get(r).height; continue }
      const sec = add(page, S.alt ? T.secA : T.secW, { y: secY, height: 400 }); await applied();
      let cy = 64; let first = true;
      for (const b of S.blocks) {
        let g = first ? 0 : (GAP_BEFORE[b.t] ?? 16); first = false; cy += g;
        if (b.t === 'h2') { add(sec, T.acc, { x: 470, y: cy, width: 40, height: 3 }); cy += 16 }
        if (b.t === 'embed') {
          const w = b.wide ? 980 : 700, x = b.wide ? 0 : 140;
          const h = await B.measure(b.url, w); const hm = await B.measure(b.url, 280);
          const r = add(sec, T.html, { x, y: cy, width: w, height: h + 4 }, { type: 'HtmlComponent', url: b.url, sourceType: 'external' });
          embeds.push({ id: r.id, hm: hm + 4 }); cy += h + 4; continue;
        }
        if (b.t === 'buttons') {
          const n = b.items.length, bw = 240, gap = 16, tot = n * bw + (n - 1) * gap; let x = Math.round(490 - tot / 2);
          for (const it of b.items) { const lo = linkObj(it.link, pm); add(sec, T.btn, { x, y: cy, width: bw, height: 46 }, { type: 'LinkableButton', label: it.label, link: lo }); x += bw + gap }
          cy += 46; continue;
        }
        const th = B.textHtml(b, links, pm);
        const wide = b.t === 'h1' || b.t === 'h2';
        const r = add(sec, T.txt, { x: wide ? 40 : 140, y: cy, width: wide ? 900 : 700, height: 30 }, { type: 'StyledText', text: th.text, linkList: th.linkList, stylesMapId: 'CK_EDITOR_PARAGRAPH_STYLES' });
        await applied(); await wait(250);
        let h = textH(r.id) + 6; if (h < 20) h = 30; L(r, { height: h }); cy += h;
      }
      L(sec, { height: cy + 64 }); await applied();
      secY += cy + 64;
    }
    await applied();
    for (const s of ds.components.getChildren(page)) { if (ds.components.getChildren(s).length === 0) ds.components.remove(s) }
    await applied();
    // re-sequence sections
    let y = 0; for (const s of ds.components.getChildren(page).sort((a, b) => ds.components.layout.get(a).y - ds.components.layout.get(b).y)) { L(s, { y }); y += ds.components.layout.get(s).height }
    await applied();
    B._embeds = B._embeds || {}; B._embeds[pid] = embeds;
    return [pid, P.path, ds.components.getChildren(page).length, y];
  };
  // mobile pass for a built page
  B.mobile = async (pid) => {
    ds.viewMode.set('MOBILE'); ds.pages.navigateTo(pid); await wait(4000); await applied();
    for (const h of ds.mobile.hiddenComponents.get(pid).map(x => x.id || x)) { try { ds.mobile.hiddenComponents.show(h, pid) } catch (e) { } }
    await applied();
    const emb = {}; ((B._embeds || {})[pid] || []).forEach(e => emb[e.id] = e.hm);
    const secs = ds.components.getChildren({ id: pid, type: 'MOBILE' });
    for (const s of secs) {
      const kids = ds.components.getChildren(s);
      if (kids.length > 0 && kids.some(k => /StripColumns|Column/.test(ds.components.getType(k)))) continue;
      for (const k of kids) {
        const t = ds.components.getType(k), l = ds.components.layout.get(k);
        if (/HtmlComponent/.test(t)) L(k, { x: 20, width: 280, height: emb[k.id] || l.height });
        else if (/SiteButton/.test(t)) L(k, { x: 40, width: 240, height: 46 });
        else if (/Container/.test(t) && l.height <= 4) L(k, { x: 140, width: 40 });
        else if (/WRichText/.test(t)) L(k, { x: 20, width: 280 });
      }
    }
    await applied(); await wait(1500);
    for (const s of secs) {
      const kids = ds.components.getChildren(s).map(k => ({ k, l: ds.components.layout.get(k), t: ds.components.getType(k) })).sort((a, b) => a.l.y - b.l.y || a.l.x - b.l.x);
      if (!kids.length) continue;
      let y = kids[0].l.y, prev = null;
      for (const o of kids) {
        if (prev) y += (/Container/.test(o.t) && o.l.height <= 4) ? 32 : (/Container/.test(prev.t) && prev.l.height <= 4) ? 12 : 16;
        const h = /WRichText/.test(o.t) ? textH(o.k.id) + 6 : (/HtmlComponent/.test(o.t) ? (emb[o.k.id] || o.l.height) : domH(o.k.id) || o.l.height);
        L(o.k, /WRichText/.test(o.t) ? { y, height: h } : { y }); y += h; prev = o;
      }
      L(s, { height: y + 44 });
    }
    await applied();
    let y = 0; for (const s of ds.components.getChildren({ id: pid, type: 'MOBILE' }).sort((a, b) => ds.components.layout.get(a).y - ds.components.layout.get(b).y)) { L(s, { y }); y += ds.components.layout.get(s).height }
    await applied(); ds.viewMode.set('DESKTOP');
    return [pid, 'mobile', y];
  };
  B.seo = (P, pid, crumbs) => {
    const t = P.title, d = P.desc || '';
    const p = ds.pages.data.get(pid); let a = { tags: [] }; try { a = p.advancedSeoData ? JSON.parse(p.advancedSeoData) : a } catch (e) { }
    a.tags = (a.tags || []).filter(x => !(x.type === 'title' || x.type === 'script' || (x.props && (x.props.name === 'description' || x.props.name === 'keywords'))));
    a.tags.unshift({ type: 'title', children: t, custom: false, disabled: false });
    if (d) a.tags.push({ type: 'meta', props: { name: 'description', content: d }, children: '', custom: false, disabled: false });
    if (crumbs && crumbs.length > 1) a.tags.push({ type: 'script', props: { type: 'application/ld+json' }, children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: 'https://www.vmbs.tech' + c[1] })) }), custom: true, disabled: false });
    ds.pages.data.update(pid, { pageTitleSEO: t, descriptionSEO: d, advancedSeoData: JSON.stringify(a) });
  };
  B.ready = true;
})();
