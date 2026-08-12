/* ============================================================
   AUVP | Parcerias — estado compartilhado
   Campos editáveis, imagens, marcações de progresso e
   persistência local. Usado pelo site e pela apresentação.
   ============================================================ */
(function (global) {
  'use strict';

  var LS = {
    fields: 'auvp.parcerias.fields.v1',
    images: 'auvp.parcerias.images.v1',
    checks: 'auvp.parcerias.checks.v1'
  };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function persist(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }

  var fields = load(LS.fields);
  var images = load(LS.images);
  var checks = load(LS.checks);

  var listeners = [];
  function emit(what) { listeners.forEach(function (fn) { fn(what); }); }
  function on(fn) { listeners.push(fn); }

  /* ---------------------------------------------------- toast */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'auvp-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }

  /* ------------------------------------------ campos editáveis */
  var fieldEls = [];
  var inputEls = [];

  var supportsPlaintext = (function () {
    var d = document.createElement('div');
    d.setAttribute('contenteditable', 'plaintext-only');
    return d.contentEditable === 'plaintext-only';
  })();

  function paint(el) {
    var v = fields[el.dataset.field];
    if (v) { el.textContent = v; el.classList.remove('is-empty'); }
    else { el.textContent = el.dataset.ph || ''; el.classList.add('is-empty'); }
  }

  function repaint(key, except) {
    fieldEls.forEach(function (el) {
      if (el.dataset.field === key && el !== except && document.activeElement !== el) paint(el);
    });
    inputEls.forEach(function (i) {
      if (i.dataset.input === key && document.activeElement !== i) i.value = fields[key] || '';
    });
  }

  function setField(key, value) {
    fields[key] = (value || '').trim();
    persist(LS.fields, fields);
    repaint(key);
    emit('fields');
  }

  function initFields(root) {
    var scope = root || document;

    Array.prototype.forEach.call(scope.querySelectorAll('.field'), function (el) {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      fieldEls.push(el);

      el.setAttribute('contenteditable', supportsPlaintext ? 'plaintext-only' : 'true');
      el.setAttribute('spellcheck', 'false');
      el.setAttribute('role', 'textbox');
      el.setAttribute('tabindex', '0');
      el.setAttribute('title', 'Clique para editar: ' + (el.dataset.ph || ''));
      if (el.dataset.raw) el.classList.add('raw');
      paint(el);

      el.addEventListener('focus', function () {
        if (el.classList.contains('is-empty')) {
          el.textContent = '';
          el.classList.remove('is-empty');
        }
      });

      el.addEventListener('input', function () {
        fields[el.dataset.field] = el.textContent.replace(/\s+/g, ' ').trim();
        persist(LS.fields, fields);
        repaint(el.dataset.field, el);
        emit('fields');
      });

      el.addEventListener('blur', function () { paint(el); });

      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });

      if (!supportsPlaintext) {
        el.addEventListener('paste', function (e) {
          e.preventDefault();
          var t = (e.clipboardData || global.clipboardData).getData('text/plain');
          document.execCommand('insertText', false, t.replace(/\s+/g, ' '));
        });
      }
    });

    Array.prototype.forEach.call(scope.querySelectorAll('[data-input]'), function (i) {
      if (i.dataset.wired) return;
      i.dataset.wired = '1';
      inputEls.push(i);
      i.value = fields[i.dataset.input] || '';
      i.addEventListener('input', function () {
        fields[i.dataset.input] = i.value.trim();
        persist(LS.fields, fields);
        repaint(i.dataset.input, null);
        emit('fields');
      });
    });
  }

  /* --------------------------------------- imagens (placeholders) */
  var phEls = [];
  var picker;

  function defaultSrc(el) { return el.dataset.src || null; }
  function currentSrc(el) { return images[el.dataset.img] || defaultSrc(el); }

  function applyImage(el, src) {
    if (src) {
      el.style.backgroundImage = 'url("' + src + '")';
      el.classList.add('has-image');
    } else {
      el.style.backgroundImage = '';
      el.classList.remove('has-image');
    }
  }

  function refreshImages() {
    phEls.forEach(function (el) { applyImage(el, currentSrc(el)); });
    emit('images');
  }

  /* reduz imagens grandes para caberem no armazenamento do navegador */
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
      try { cb(c.toDataURL('image/jpeg', 0.86)); } catch (e) { cb(dataUrl); }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  function readFile(file, cb) {
    if (!file || !/^image\//.test(file.type)) { toast('Envie um arquivo de imagem.'); return; }
    var fr = new FileReader();
    fr.onload = function () { shrink(fr.result, file, cb); };
    fr.readAsDataURL(file);
  }

  function storeImage(key, src) {
    images[key] = src;
    refreshImages();
    toast(persist(LS.images, images)
      ? 'Imagem atualizada.'
      : 'Imagem aplicada, mas grande demais para salvar neste navegador.');
  }

  function pick(key) {
    if (!picker) {
      picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.hidden = true;
      picker.addEventListener('change', function () {
        var k = picker.dataset.key;
        readFile(picker.files[0], function (url) { storeImage(k, url); });
      });
      document.body.appendChild(picker);
    }
    picker.dataset.key = key;
    picker.value = '';
    picker.click();
  }

  function initImages(root) {
    var scope = root || document;

    Array.prototype.forEach.call(scope.querySelectorAll('.ph'), function (el) {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      phEls.push(el);

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
          persist(LS.images, images);
          refreshImages();
          toast(defaultSrc(el) ? 'Imagem restaurada para a do repositório.' : 'Imagem removida.');
        } else {
          pick(key);
        }
      });

      el.addEventListener('click', function () {
        if (document.body.classList.contains('presenting')) return;
        pick(key);
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
        readFile(e.dataTransfer.files[0], function (url) { storeImage(key, url); });
      });

      applyImage(el, currentSrc(el));
    });
  }

  function imageSlots() {
    return phEls.map(function (el) {
      return { key: el.dataset.img, label: el.dataset.label, filled: !!currentSrc(el), el: el };
    });
  }

  /* ------------------------------------------------- marcações */
  var checkEls = [];

  function paintCheck(el) {
    var on = !!checks[el.dataset.check];
    el.classList.toggle('is-done', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function initChecks(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-check]'), function (el) {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      checkEls.push(el);
      paintCheck(el);
      el.addEventListener('click', function () {
        checks[el.dataset.check] = !checks[el.dataset.check];
        if (!checks[el.dataset.check]) delete checks[el.dataset.check];
        persist(LS.checks, checks);
        paintCheck(el);
        emit('checks');
      });
    });
  }

  function checkStats(prefix) {
    var els = checkEls.filter(function (el) {
      return !prefix || el.dataset.check.indexOf(prefix) === 0;
    });
    var done = els.filter(function (el) { return !!checks[el.dataset.check]; });
    return { total: els.length, done: done.length };
  }

  /* --------------------------------------- exportar / importar */
  function exportData() {
    var blob = new Blob([JSON.stringify({ fields: fields, images: images, checks: checks }, null, 2)],
                        { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'auvp-parceria-' +
      ((fields.empresa || 'proposta').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proposta') +
      '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Dados exportados.');
  }

  function importData(file, done) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var data = JSON.parse(fr.result);
        fields = data.fields || {};
        images = data.images || {};
        checks = data.checks || {};
        persist(LS.fields, fields); persist(LS.images, images); persist(LS.checks, checks);
        fieldEls.forEach(paint);
        inputEls.forEach(function (i) { i.value = fields[i.dataset.input] || ''; });
        checkEls.forEach(paintCheck);
        refreshImages();
        emit('all');
        toast('Dados importados.');
        if (done) done(true);
      } catch (e) {
        toast('Arquivo inválido.');
        if (done) done(false);
      }
    };
    fr.readAsText(file);
  }

  function reset() {
    fields = {}; images = {}; checks = {};
    localStorage.removeItem(LS.fields);
    localStorage.removeItem(LS.images);
    localStorage.removeItem(LS.checks);
    fieldEls.forEach(paint);
    inputEls.forEach(function (i) { i.value = ''; });
    checkEls.forEach(paintCheck);
    refreshImages();
    emit('all');
    toast('Proposta restaurada ao original.');
  }

  function init(root) {
    initFields(root);
    initImages(root);
    initChecks(root);
  }

  global.AUVP = {
    init: init,
    initFields: initFields,
    initImages: initImages,
    initChecks: initChecks,
    get: function (k) { return fields[k] || ''; },
    set: setField,
    all: function () { return fields; },
    imageSlots: imageSlots,
    pickImage: pick,
    checkStats: checkStats,
    exportData: exportData,
    importData: importData,
    reset: reset,
    toast: toast,
    on: on
  };
})(window);
