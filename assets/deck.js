/* ============================================================
   AUVP | Parcerias — modo apresentação (réplica dos slides)
   Campos, imagens e persistência vêm de state.js (window.AUVP).
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var index = 0;

  /* ---------------------------------------------------- escala */
  function fit() {
    var pad = window.innerWidth < 720 ? 8 : 48;
    var w = window.innerWidth - pad;
    var h = window.innerHeight - (window.innerWidth < 720 ? 70 : 110);
    stage.style.transform = 'translate(-50%,-50%) scale(' + Math.min(w / 1440, h / 810) + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  /* ------------------------------------------------ navegação */
  var elCur = document.getElementById('cur');
  var bar = document.getElementById('progressBar');
  document.getElementById('tot').textContent = total;

  function go(i, silent) {
    index = Math.max(0, Math.min(total - 1, i));
    slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
    elCur.textContent = index + 1;
    bar.style.width = ((index + 1) / total * 100) + '%';
    if (!silent) {
      try { history.replaceState(null, '', '#s=' + (index + 1)); } catch (e) {}
    }
  }
  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  document.getElementById('btnNext').addEventListener('click', next);
  document.getElementById('btnPrev').addEventListener('click', prev);

  function isTyping(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTyping(e.target)) {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(total - 1); break;
      case 'f': case 'F': toggleFull(); break;
      case 'g': case 'G': toggleGrid(); break;
      case 'e': case 'E': togglePanel(); break;
      case 'p': case 'P': toggleMode(); break;
      case 'Escape': closeOverlays(); break;
    }
  });

  /* swipe */
  var tx = 0, ty = 0;
  var vp = document.getElementById('viewport');
  vp.addEventListener('touchstart', function (e) {
    tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
  }, { passive: true });
  vp.addEventListener('touchend', function (e) {
    if (isTyping(document.activeElement)) return;
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  /* clique nas laterais avança/volta (fora do modo edição) */
  vp.addEventListener('click', function (e) {
    if (!document.body.classList.contains('presenting')) return;
    if (e.target.closest('.field, .ph, .bar')) return;
    var r = vp.getBoundingClientRect();
    (e.clientX - r.left) / r.width > .5 ? next() : prev();
  });

  /* ----------------------------- estado compartilhado (state.js) */
  AUVP.init(document);

  var imglist = document.getElementById('imglist');
  function renderImgList() {
    imglist.innerHTML = '';
    AUVP.imageSlots().forEach(function (slot) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'imgitem' + (slot.filled ? ' done' : '');
      b.innerHTML = '<span class="dot"></span><span class="nm"></span>' +
                    '<span class="st">' + (slot.filled ? 'ok' : 'pendente') + '</span>';
      b.querySelector('.nm').textContent = slot.label;
      b.addEventListener('click', function () {
        var n = slides.indexOf(slot.el.closest('.slide'));
        if (n > -1) go(n);
        AUVP.pickImage(slot.key);
      });
      imglist.appendChild(b);
    });
  }
  renderImgList();
  AUVP.on(function (what) { if (what === 'images' || what === 'all') renderImgList(); });

  /* ------------------------------------------------ painel/modos */
  var panel = document.getElementById('panel');
  var gridEl = document.getElementById('grid');
  var btnEdit = document.getElementById('btnEdit');
  var btnMode = document.getElementById('btnMode');

  function togglePanel(force) {
    var open = typeof force === 'boolean' ? force : panel.hidden;
    panel.hidden = !open;
    btnEdit.classList.toggle('is-on', open);
    if (open) { document.body.classList.remove('presenting'); btnMode.classList.remove('is-on'); }
  }
  function toggleMode() {
    var pres = document.body.classList.toggle('presenting');
    btnMode.classList.toggle('is-on', pres);
    if (pres) togglePanel(false);
    AUVP.toast(pres ? 'Modo apresentação' : 'Modo edição');
  }
  function toggleGrid(force) {
    var open = typeof force === 'boolean' ? force : gridEl.hidden;
    if (open) buildThumbs();
    gridEl.hidden = !open;
  }
  function closeOverlays() {
    if (!gridEl.hidden) { toggleGrid(false); return; }
    if (!panel.hidden) togglePanel(false);
  }

  btnEdit.addEventListener('click', function () { togglePanel(); });
  btnMode.addEventListener('click', toggleMode);
  document.getElementById('btnGrid').addEventListener('click', function () { toggleGrid(); });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () {
      b.dataset.close === 'grid' ? toggleGrid(false) : togglePanel(false);
    });
  });

  /* miniaturas reais (clone dos slides) */
  var thumbs = document.getElementById('thumbs');
  function buildThumbs() {
    thumbs.innerHTML = '';
    slides.forEach(function (s, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'thumb' + (n === index ? ' is-active' : '') + (s.classList.contains('dark') ? ' is-dark' : '');

      var box = document.createElement('div');
      box.style.cssText = 'position:absolute;inset:0;overflow:hidden';
      var clone = s.cloneNode(true);
      clone.classList.add('is-active');
      clone.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:810px;' +
                            'transform-origin:0 0;opacity:1;visibility:visible;pointer-events:none';
      clone.querySelectorAll('[contenteditable]').forEach(function (c) { c.removeAttribute('contenteditable'); });
      clone.querySelectorAll('.ph-tools').forEach(function (c) { c.remove(); });
      box.appendChild(clone);
      b.appendChild(box);

      var tag = document.createElement('span');
      tag.className = 'tn'; tag.textContent = n + 1;
      var ttl = document.createElement('span');
      ttl.className = 'tt'; ttl.textContent = s.dataset.title || '';
      b.appendChild(tag); b.appendChild(ttl);

      b.addEventListener('click', function () { go(n); toggleGrid(false); });
      thumbs.appendChild(b);

      requestAnimationFrame(function () {
        clone.style.transform = 'scale(' + (b.clientWidth / 1440) + ')';
      });
    });
  }
  window.addEventListener('resize', function () { if (!gridEl.hidden) buildThumbs(); });

  /* ------------------------------------------------ tela cheia */
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
  document.getElementById('btnFull').addEventListener('click', toggleFull);

  /* ------------------------------------- exportar / importar / etc */
  document.getElementById('btnPrint').addEventListener('click', function () {
    document.body.classList.add('presenting');
    btnMode.classList.add('is-on');
    togglePanel(false);
    setTimeout(function () { window.print(); }, 80);
  });

  document.getElementById('btnExport').addEventListener('click', AUVP.exportData);

  var jsonPicker = document.getElementById('jsonPicker');
  document.getElementById('btnImport').addEventListener('click', function () {
    jsonPicker.value = ''; jsonPicker.click();
  });
  jsonPicker.addEventListener('change', function () {
    if (jsonPicker.files[0]) AUVP.importData(jsonPicker.files[0]);
  });

  document.getElementById('btnReset').addEventListener('click', function () {
    if (confirm('Limpar todos os campos preenchidos e imagens enviadas?')) AUVP.reset();
  });

  /* ---------------------------------------------------- start */
  var m = /#s=(\d+)/.exec(location.hash);
  fit();
  go(m ? parseInt(m[1], 10) - 1 : 0, true);
  window.addEventListener('hashchange', function () {
    var h = /#s=(\d+)/.exec(location.hash);
    if (h) go(parseInt(h[1], 10) - 1, true);
  });
})();
