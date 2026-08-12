/* ============================================================
   AUVP | Parcerias Estratégicas — apresentação interativa
   Sem dependências. Estado (campos + imagens) no localStorage.
   ============================================================ */
(function () {
  'use strict';

  var LS_FIELDS = 'auvp.parcerias.fields.v1';
  var LS_IMAGES = 'auvp.parcerias.images.v1';

  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var index = 0;

  var store = load(LS_FIELDS);
  var images = load(LS_IMAGES);

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function save(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }

  /* ---------------------------------------------------- escala */
  function fit() {
    var pad = window.innerWidth < 720 ? 8 : 48;
    var w = window.innerWidth - pad;
    var h = window.innerHeight - (window.innerWidth < 720 ? 70 : 110);
    var s = Math.min(w / 1440, h / 810);
    stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  /* ------------------------------------------------ navegação */
  var elCur = document.getElementById('cur');
  var elTot = document.getElementById('tot');
  var bar = document.getElementById('progressBar');
  elTot.textContent = total;

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
    if (document.body.classList.contains('editing')) return;
    if (e.target.closest('.field, .ph, .bar')) return;
    var r = vp.getBoundingClientRect();
    (e.clientX - r.left) / r.width > .5 ? next() : prev();
  });

  /* ------------------------------------------- campos [editáveis] */
  var fields = Array.prototype.slice.call(document.querySelectorAll('.field'));
  var plaintext = (function () {
    var d = document.createElement('div');
    d.setAttribute('contenteditable', 'plaintext-only');
    return d.contentEditable === 'plaintext-only';
  })();

  function paint(el) {
    var v = store[el.dataset.field];
    if (v) { el.textContent = v; el.classList.remove('is-empty'); }
    else { el.textContent = el.dataset.ph || ''; el.classList.add('is-empty'); }
  }

  fields.forEach(function (el) {
    el.setAttribute('contenteditable', plaintext ? 'plaintext-only' : 'true');
    el.setAttribute('spellcheck', 'false');
    if (el.dataset.raw) el.classList.add('raw');
    el.setAttribute('title', 'Clique para editar: ' + (el.dataset.ph || ''));
    paint(el);

    el.addEventListener('focus', function () {
      if (el.classList.contains('is-empty')) {
        el.textContent = '';
        el.classList.remove('is-empty');
      }
    });

    el.addEventListener('input', function () {
      var v = el.textContent.replace(/\s+/g, ' ').replace(/^\s|\s$/g, ' ').trim();
      store[el.dataset.field] = v;
      save(LS_FIELDS, store);
      syncInputs(el.dataset.field);
      fields.forEach(function (o) { if (o !== el && o.dataset.field === el.dataset.field) paint(o); });
    });

    el.addEventListener('blur', function () { paint(el); });

    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });

    if (!plaintext) {
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var t = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, t.replace(/\s+/g, ' '));
      });
    }
  });

  /* inputs do painel <-> campos do slide */
  var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-input]'));
  function syncInputs(key) {
    inputs.forEach(function (i) {
      if (i.dataset.input === key && document.activeElement !== i) i.value = store[key] || '';
    });
  }
  inputs.forEach(function (i) {
    i.value = store[i.dataset.input] || '';
    i.addEventListener('input', function () {
      store[i.dataset.input] = i.value.trim();
      save(LS_FIELDS, store);
      fields.forEach(function (el) {
        if (el.dataset.field === i.dataset.input && document.activeElement !== el) paint(el);
      });
    });
  });

  /* --------------------------------------- placeholders de imagem */
  var phs = Array.prototype.slice.call(document.querySelectorAll('.ph'));
  var picker = document.getElementById('filePicker');
  var imglist = document.getElementById('imglist');
  var pickingFor = null;

  /* imagem padrão versionada no repositório: <div class="ph" data-src="assets/img/foto.jpg"> */
  function defaultSrc(el) { return el.dataset.src || null; }
  function currentSrc(el) { return images[el.dataset.img] || defaultSrc(el); }

  function applyImage(el, dataUrl) {
    if (dataUrl) {
      el.style.backgroundImage = 'url("' + dataUrl + '")';
      el.classList.add('has-image');
    } else {
      el.style.backgroundImage = '';
      el.classList.remove('has-image');
    }
    renderImgList();
  }

  function readFile(file, cb) {
    if (!file || !/^image\//.test(file.type)) { toast('Envie um arquivo de imagem.'); return; }
    var fr = new FileReader();
    fr.onload = function () { shrink(fr.result, file, cb); };
    fr.readAsDataURL(file);
  }

  /* reduz a imagem para caber no localStorage sem perder qualidade visível */
  function shrink(dataUrl, file, cb) {
    if (file.size < 400 * 1024) { cb(dataUrl); return; }
    var img = new Image();
    img.onload = function () {
      var max = 1800;
      var sc = Math.min(1, max / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * sc);
      c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      try { cb(c.toDataURL('image/jpeg', 0.86)); }
      catch (e) { cb(dataUrl); }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  phs.forEach(function (el) {
    var key = el.dataset.img;

    var tools = document.createElement('div');
    tools.className = 'ph-tools';
    tools.innerHTML = '<button type="button" data-act="swap">Trocar</button>' +
                      '<button type="button" data-act="del">Remover</button>';
    el.appendChild(tools);

    tools.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      e.stopPropagation();
      if (b.dataset.act === 'del') {
        delete images[key];
        save(LS_IMAGES, images);
        applyImage(el, defaultSrc(el));
        toast(defaultSrc(el) ? 'Imagem restaurada para a do repositório.' : 'Imagem removida.');
      } else {
        pickingFor = key; picker.value = ''; picker.click();
      }
    });

    el.addEventListener('click', function () {
      if (!document.body.classList.contains('editing')) return;
      pickingFor = key; picker.value = ''; picker.click();
    });

    ['dragenter', 'dragover'].forEach(function (ev) {
      el.addEventListener(ev, function (e) { e.preventDefault(); el.classList.add('is-over'); });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      el.addEventListener(ev, function () { el.classList.remove('is-over'); });
    });
    el.addEventListener('drop', function (e) {
      e.preventDefault();
      el.classList.remove('is-over');
      readFile(e.dataTransfer.files[0], function (url) { storeImage(key, el, url); });
    });

    if (currentSrc(el)) applyImage(el, currentSrc(el));
  });

  function storeImage(key, el, url) {
    images[key] = url;
    applyImage(el, url);
    if (!save(LS_IMAGES, images)) {
      toast('Imagem aplicada, mas grande demais para salvar no navegador.');
    } else {
      toast('Imagem atualizada.');
    }
  }

  picker.addEventListener('change', function () {
    var key = pickingFor;
    var el = document.querySelector('.ph[data-img="' + key + '"]');
    if (!key || !el) return;
    readFile(picker.files[0], function (url) { storeImage(key, el, url); });
  });

  /* lista de imagens no painel */
  function renderImgList() {
    imglist.innerHTML = '';
    phs.forEach(function (el) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'imgitem' + (currentSrc(el) ? ' done' : '');
      b.innerHTML = '<span class="dot"></span><span class="nm"></span>' +
                    '<span class="st">' + (currentSrc(el) ? 'ok' : 'pendente') + '</span>';
      b.querySelector('.nm').textContent = el.dataset.label;
      b.addEventListener('click', function () {
        var n = slides.indexOf(el.closest('.slide'));
        if (n > -1) go(n);
        pickingFor = el.dataset.img; picker.value = ''; picker.click();
      });
      imglist.appendChild(b);
    });
  }
  renderImgList();

  /* ------------------------------------------------ painel/modos */
  var panel = document.getElementById('panel');
  var gridEl = document.getElementById('grid');
  var btnEdit = document.getElementById('btnEdit');
  var btnMode = document.getElementById('btnMode');

  function togglePanel(force) {
    var open = typeof force === 'boolean' ? force : panel.hidden;
    panel.hidden = !open;
    btnEdit.classList.toggle('is-on', open);
    if (open) { document.body.classList.add('editing'); btnMode.classList.remove('is-on'); }
  }
  function toggleMode() {
    var pres = document.body.classList.toggle('editing') === false;
    btnMode.classList.toggle('is-on', pres);
    if (pres) togglePanel(false);
    toast(pres ? 'Modo apresentação' : 'Modo edição');
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
      var t = b.dataset.close;
      t === 'grid' ? toggleGrid(false) : togglePanel(false);
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
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
  }
  document.getElementById('btnFull').addEventListener('click', toggleFull);

  /* ------------------------------------- exportar / importar / etc */
  document.getElementById('btnPrint').addEventListener('click', function () {
    document.body.classList.remove('editing');
    btnMode.classList.add('is-on');
    setTimeout(function () { window.print(); }, 80);
  });

  document.getElementById('btnExport').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify({ fields: store, images: images }, null, 2)],
                        { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'auvp-parceria-' + (store.empresa || 'proposta').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  });

  var jsonPicker = document.getElementById('jsonPicker');
  document.getElementById('btnImport').addEventListener('click', function () {
    jsonPicker.value = ''; jsonPicker.click();
  });
  jsonPicker.addEventListener('change', function () {
    var f = jsonPicker.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var data = JSON.parse(fr.result);
        store = data.fields || {};
        images = data.images || {};
        save(LS_FIELDS, store); save(LS_IMAGES, images);
        fields.forEach(paint);
        inputs.forEach(function (i) { i.value = store[i.dataset.input] || ''; });
        phs.forEach(function (el) { applyImage(el, currentSrc(el)); });
        toast('Dados importados.');
      } catch (e) { toast('Arquivo inválido.'); }
    };
    fr.readAsText(f);
  });

  document.getElementById('btnReset').addEventListener('click', function () {
    if (!confirm('Limpar todos os campos preenchidos e imagens enviadas?')) return;
    store = {}; images = {};
    localStorage.removeItem(LS_FIELDS);
    localStorage.removeItem(LS_IMAGES);
    fields.forEach(paint);
    inputs.forEach(function (i) { i.value = ''; });
    phs.forEach(function (el) { applyImage(el, defaultSrc(el)); });
    toast('Apresentação restaurada.');
  });

  /* ---------------------------------------------------- toast */
  var toastEl = document.getElementById('toast');
  var toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }

  /* ---------------------------------------------------- start */
  var m = /#s=(\d+)/.exec(location.hash);
  fit();
  go(m ? parseInt(m[1], 10) - 1 : 0, true);
  window.addEventListener('hashchange', function () {
    var h = /#s=(\d+)/.exec(location.hash);
    if (h) go(parseInt(h[1], 10) - 1, true);
  });
})();
