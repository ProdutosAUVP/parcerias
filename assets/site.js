/* ============================================================
   AUVP | Parcerias Estratégicas — comportamento do site
   Revelação por rolagem, animação de textos e da linha do tempo,
   navegação, seletor do ecossistema e contadores.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var FIELD_KEYS = ['empresa', 'diferencial', 'produto'];

  /* pré-preenchimento por link: ?empresa=Marca&produto=Linha */
  (function fromUrl() {
    var q = new URLSearchParams(location.search);
    var touched = false;
    FIELD_KEYS.forEach(function (k) {
      var v = q.get(k);
      if (v) { AUVP.set(k, v); touched = true; }
    });
    if (touched) AUVP.toast('Proposta carregada pelo link.');
  })();

  AUVP.init(document, { images: { interactive: false } });   // fotos são só conteúdo aqui

  /* ---------------------------------- animação de texto por palavra */
  var WORDY = '.hero-title, .statement-text, .closing-text, .gains li, .h2';

  var wordEls = [];

  function splitWords(el) {
    if (el.dataset.split || $('.field', el)) return;   // não fatiar campos editáveis
    el.dataset.split = '1';
    if (!el.dataset.text) el.dataset.text = el.textContent;
    if (wordEls.indexOf(el) < 0) wordEls.push(el);
    var parts = el.textContent.split(/(\s+)/);
    el.textContent = '';
    var i = 0;
    parts.forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(part)); return; }
      var w = document.createElement('span');
      w.className = 'w';
      w.textContent = part;
      w.style.setProperty('--i', i++);
      el.appendChild(w);
    });
    el.classList.add('anim-words');
  }

  if (!reduced) $$(WORDY).forEach(splitWords);

  /* Na impressão o texto volta inteiro: o navegador exporta cada span como
     um bloco próprio e o PDF sairia sem os espaços entre as palavras. */
  function unsplitWords(el) {
    if (!el.dataset.split) return;
    el.textContent = el.dataset.text;
    delete el.dataset.split;
    el.classList.remove('anim-words');
  }
  function resplitWords() {
    if (reduced) return;
    wordEls.forEach(function (el) { splitWords(el); el.classList.add('is-in'); });
  }
  window.addEventListener('beforeprint', function () { wordEls.forEach(unsplitWords); });
  window.addEventListener('afterprint', resplitWords);

  /* ------------------------------------------------- revelação */
  $$('.reveal').forEach(function (el) {
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
  });
  /* itens que entram um a um: cada filho recebe a própria posição na fila */
  $$('.ticks-seq, .vsteps').forEach(function (list) {
    $$('li', list).forEach(function (li, i) { li.style.setProperty('--i', i); });
  });

  function reveal(el) {
    el.classList.add('is-in');
    var counter = el.matches('[data-count]') ? el : $('[data-count]', el);
    if (counter) countUp(counter, el.dataset.delay);
  }

  if (reduced || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-count]').forEach(function (el) { el.dataset.counted = '1'; });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        reveal(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* contagem animada — começa junto com a entrada do bloco */
  function countUp(el, delayStep) {
    if (el.dataset.counted) return;
    var m = /(-?\d[\d.]*)/.exec(el.textContent);
    if (!m) { el.dataset.counted = '1'; return; }
    el.dataset.counted = '1';

    var target = parseInt(m[1].replace(/\./g, ''), 10);
    var before = el.textContent.slice(0, m.index);
    var after = el.textContent.slice(m.index + m[1].length);
    var wait = (parseFloat(delayStep) || 0) * 150 + 140;

    setTimeout(function () {
      var t0 = performance.now();
      var dur = 1200;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = before + Math.round(target * eased).toLocaleString('pt-BR') + after;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, wait);
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
    topbar.classList.toggle('on-dark', darkRects.some(function (r) {
      return probe > r.top && probe < r.bottom;
    }));

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
      var r = el.parentElement.getBoundingClientRect();
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

  /* ------------------- navegação por seções, como um slide -------------- */
  var slides = $$('main > section');

  function slideTop(el) {
    var top = el.offsetTop;
    return el === slides[0] ? 0 : Math.max(0, top - topbar.offsetHeight + 1);
  }

  function currentSlide() {
    var y = window.scrollY + topbar.offsetHeight + 4;
    var idx = 0;
    slides.forEach(function (s, i) { if (s.offsetTop <= y) idx = i; });
    return idx;
  }

  function goSlide(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    window.scrollTo({ top: slideTop(slides[i]), behavior: reduced ? 'auto' : 'smooth' });
  }

  function isTyping(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }

  /* Dobras com etapas internas: a seta percorre as verticais e abre os
     cartões da proposta antes de passar para a dobra seguinte, como os
     fragmentos de um slide. */
  var steppers = {
    ecossistema: {
      total: function () { return tabs.length; },
      at: function () {
        var i = 0;
        tabs.forEach(function (t, n) { if (t.getAttribute('aria-selected') === 'true') i = n; });
        return i;
      },
      go: function (i) { selectTab(i); }
    },
    proposta: {
      total: function () { return accItems.length; },
      at: function () {
        var open = accItems.filter(function (it) { return it.classList.contains('is-open'); }).length;
        return open - 1;                        // -1 quando todos estão fechados
      },
      /* os cartões abrem em cadeia: 1, depois 1+2, depois os três */
      go: function (i) {
        accItems.forEach(function (it, n) { setAcc(it, n <= i); });
      }
    }
  };

  function stepperOf(section) {
    return section && steppers[section.id];
  }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;   // as abas usam as setas
    if (isTyping(e.target)) return;
    if (nav.classList.contains('is-open')) return;              // menu aberto no celular

    var step = 0;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': step = 1; break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': step = -1; break;
      case 'Home': e.preventDefault(); goSlide(0); return;
      case 'End': e.preventDefault(); goSlide(slides.length - 1); return;
      default: return;
    }
    e.preventDefault();

    var cur = currentSlide();
    var here = stepperOf(slides[cur]);
    if (here) {
      var next = here.at() + step;
      if (next >= 0 && next < here.total()) { here.go(next); return; }
    }

    var target = Math.max(0, Math.min(slides.length - 1, cur + step));
    goSlide(target);

    /* chegando numa dobra com etapas: entrando pela frente ela começa do
       primeiro passo; voltando de baixo, já vem com tudo aberto */
    var there = stepperOf(slides[target]);
    if (there && target !== cur) there.go(step > 0 ? 0 : there.total() - 1);
  });

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

  /* Painéis escondidos não baixam a imagem de fundo: o navegador só busca
     quando o painel aparece, e a foto piscava vazia ao trocar de aba.
     Aqui elas são carregadas em segundo plano assim que a página abre. */
  (function preloadHidden() {
    $$('.eco-panel[hidden] .ph[data-src]').forEach(function (el) {
      var img = new Image();
      img.src = el.dataset.src;
    });
  })();

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

  /* --------------------------------------- acordeão da proposta */
  var accItems = $$('.acc-item');

  function setAcc(item, open) {
    item.classList.toggle('is-open', open);
    var toggle = $('.acc-toggle', item);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  accItems.forEach(function (item) {
    var head = $('.acc-head', item);
    var toggle = $('.acc-toggle', item);

    function flip() { setAcc(item, !item.classList.contains('is-open')); }

    toggle.addEventListener('click', function (e) { e.stopPropagation(); flip(); });

    /* a linha inteira abre e fecha, menos o trecho editável do título */
    head.addEventListener('click', function (e) {
      if (e.target.closest('.field, .acc-toggle')) return;
      flip();
    });
  });

  /* ------------------------------------------------------- PDF */
  $('#btnPrint').addEventListener('click', function () {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    wordEls.forEach(unsplitWords);
    setTimeout(function () { window.print(); }, 120);
  });
})();
