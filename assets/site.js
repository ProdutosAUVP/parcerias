/* ============================================================
   AUVP | Parcerias Estratégicas — comportamento do site
   Revelação por rolagem, navegação, seletor do ecossistema,
   contadores, marcações e painel de preenchimento.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------ estado compartilhado */
  var FIELD_KEYS = ['empresa', 'diferencial', 'produto', 'membros'];

  // pré-preenchimento por link: ?empresa=Marca&produto=Linha
  (function fromUrl() {
    var q = new URLSearchParams(location.search);
    var touched = false;
    FIELD_KEYS.forEach(function (k) {
      var v = q.get(k);
      if (v) { AUVP.set(k, v); touched = true; }
    });
    if (touched) AUVP.toast('Proposta carregada pelo link.');
  })();

  AUVP.init(document);

  /* ------------------------------------------------- revelação */
  $$('.reveal').forEach(function (el) {
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
  });

  if (reduced || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-count]').forEach(function (el) { el.dataset.counted = '1'; });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        var counter = e.target.matches('[data-count]') ? e.target : $('[data-count]', e.target);
        if (counter) countUp(counter);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* contagem animada de “+19 mil” */
  function countUp(el) {
    if (el.dataset.counted) return;
    var m = /(-?\d[\d.]*)/.exec(el.textContent);
    if (!m) { el.dataset.counted = '1'; return; }
    el.dataset.counted = '1';
    var target = parseInt(m[1].replace(/\./g, ''), 10);
    var before = el.textContent.slice(0, m.index);
    var after = el.textContent.slice(m.index + m[1].length);
    var t0 = performance.now();
    var dur = 1100;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = before + Math.round(target * eased).toLocaleString('pt-BR') + after;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ------------------------------------------------ topo / nav */
  var topbar = $('#topbar');
  var scrollBar = $('#scrollBar');
  var navLinks = $$('.nav a');
  var darkSections = $$('.hero, .statement, .closing');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  var darkRects = [];

  function measure() {
    darkRects = darkSections.map(function (s) {
      var r = s.getBoundingClientRect();
      return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
    });
  }

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    topbar.classList.toggle('is-stuck', y > 12);

    var probe = y + topbar.offsetHeight * 0.55;
    var overDark = darkRects.some(function (r) { return probe > r.top && probe < r.bottom; });
    topbar.classList.toggle('on-dark', overDark);

    // seção ativa no menu
    var active = null;
    var line = y + window.innerHeight * 0.35;
    sections.forEach(function (s) { if (s.offsetTop <= line) active = s.id; });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + active);
    });

    parallax();
  }

  /* --------------------------------------------------- parallax */
  var paraEls = $$('[data-parallax]');
  function parallax() {
    if (reduced) return;
    var vh = window.innerHeight;
    paraEls.forEach(function (el) {
      var host = el.parentElement;
      var r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var progress = (r.top + r.height / 2 - vh / 2) / vh;
      var shift = progress * (parseFloat(el.dataset.parallax) || 0.15) * r.height;
      el.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', function () { measure(); onScroll(); });
  measure(); onScroll();

  /* menu no celular */
  var nav = $('#nav');
  var btnMenu = $('#btnMenu');
  btnMenu.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    btnMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      btnMenu.setAttribute('aria-expanded', 'false');
    });
  });

  /* ------------------------------------------ seletor do ecossistema */
  var tabs = $$('.eco-tab');
  var panels = $$('.eco-panel');

  function selectTab(i, focus) {
    tabs.forEach(function (t, n) {
      var on = n === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[n].hidden = !on;
      panels[n].classList.toggle('is-on', on);
    });
    if (focus) tabs[i].focus();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(i); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
            : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectTab((i + d + tabs.length) % tabs.length, true);
    });
  });

  /* -------------------------------------------- medidores de progresso */
  function renderMeters() {
    $$('[data-meter]').forEach(function (el) {
      var s = AUVP.checkStats(el.dataset.meter);
      el.textContent = s.done + '/' + s.total + (el.classList.contains('meter-lg') ? ' concluídos' : '');
      el.classList.toggle('is-full', s.total > 0 && s.done === s.total);
    });
  }

  /* ------------------------------------------------------ painel */
  var panel = $('#panel');
  var veil = $('#veil');
  var btnPanel = $('#btnPanel');
  var lastFocus = null;

  function openPanel(open) {
    var show = typeof open === 'boolean' ? open : panel.hidden;
    if (show) lastFocus = document.activeElement;
    panel.hidden = !show;
    veil.hidden = !show;
    btnPanel.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (show) {
      var f = $('[data-input]', panel);
      if (f) f.focus();
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }

  btnPanel.addEventListener('click', function () { openPanel(); });
  veil.addEventListener('click', function () { openPanel(false); });
  $$('[data-close-panel]').forEach(function (b) {
    b.addEventListener('click', function () { openPanel(false); });
  });
  $$('[data-open-panel]').forEach(function (b) {
    b.addEventListener('click', function () { openPanel(true); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) openPanel(false);
  });

  /* lista de imagens do painel */
  var imglist = $('#imglist');
  function renderImgList() {
    imglist.innerHTML = '';
    AUVP.imageSlots().forEach(function (slot) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'imgitem' + (slot.filled ? ' done' : '');
      b.innerHTML = '<span class="dot"></span><span class="nm"></span>' +
                    '<span class="st">' + (slot.filled ? 'ok' : 'pendente') + '</span>';
      $('.nm', b).textContent = slot.label;
      b.addEventListener('click', function () {
        slot.el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        AUVP.pickImage(slot.key);
      });
      imglist.appendChild(b);
    });
  }

  /* contador de campos preenchidos */
  var fillCount = $('#fillCount');
  function renderFill() {
    fillCount.textContent = FIELD_KEYS.filter(function (k) { return AUVP.get(k); }).length;
  }

  AUVP.on(function (what) {
    if (what === 'images' || what === 'all') renderImgList();
    if (what === 'fields' || what === 'all') renderFill();
    if (what === 'checks' || what === 'all') renderMeters();
  });
  renderImgList(); renderFill(); renderMeters();

  /* ---------------------------------- compartilhar / exportar / imprimir */
  function shareLink() {
    var q = new URLSearchParams();
    FIELD_KEYS.forEach(function (k) { if (AUVP.get(k)) q.set(k, AUVP.get(k)); });
    var url = location.origin + location.pathname + (q.toString() ? '?' + q : '');

    function fallback() {
      var t = document.createElement('textarea');
      t.value = url;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); AUVP.toast('Link copiado.'); }
      catch (e) { AUVP.toast('Copie o link: ' + url); }
      document.body.removeChild(t);
    }

    if (navigator.clipboard && location.protocol !== 'file:') {
      navigator.clipboard.writeText(url).then(function () { AUVP.toast('Link copiado.'); }, fallback);
    } else {
      fallback();
    }
  }

  $$('#btnShare, #btnShare2').forEach(function (b) { b.addEventListener('click', shareLink); });

  $('#btnExport').addEventListener('click', AUVP.exportData);

  var jsonPicker = $('#jsonPicker');
  $('#btnImport').addEventListener('click', function () { jsonPicker.value = ''; jsonPicker.click(); });
  jsonPicker.addEventListener('change', function () {
    if (jsonPicker.files[0]) AUVP.importData(jsonPicker.files[0]);
  });

  function print() {
    openPanel(false);
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    setTimeout(function () { window.print(); }, 120);
  }
  $$('#btnPrint, #btnPrintTop').forEach(function (b) { b.addEventListener('click', print); });

  $('#btnReset').addEventListener('click', function () {
    if (confirm('Limpar todos os campos, imagens e marcações?')) AUVP.reset();
  });
})();
