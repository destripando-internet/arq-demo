/* theme.js — Guía de estilo v1.0
   Cargar en el <head> mediante una etiqueta script con src="theme.js",
   SIN defer ni async, antes de las hojas de estilo propias.
   Aplica el tema antes del primer pintado (sin destello) y expone window.ui.

   Marcado esperado:
     <select id="theme-select" class="select">  (valores: system | light | dark)
     <select id="lang-select" class="select">   (valores: es | en | …)
   Textos traducibles: elementos con data-i18n="clave".
*/
(function () {
  var THEME_KEY = 'ui.theme';
  var LANG_KEY = 'ui.lang';
  var root = document.documentElement;

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* modo privado */ } }

  /* ---- Tema ---- */
  function applyTheme(value) {
    if (value === 'light' || value === 'dark') root.setAttribute('data-theme', value);
    else root.removeAttribute('data-theme');
  }
  applyTheme(read(THEME_KEY) || 'system');

  /* ---- Idioma ---- */
  var SUPPORTED = ['es', 'en'];
  function initialLang() {
    var saved = read(LANG_KEY);
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var prefs = navigator.languages || [navigator.language || 'es'];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).slice(0, 2).toLowerCase();
      if (SUPPORTED.indexOf(code) !== -1) return code;
    }
    return 'es';
  }
  var lang = initialLang();
  root.setAttribute('lang', lang);

  var dictionaries = {}; // se rellena con ui.registerStrings(lang, {...}) o cargando i18n/<lang>.json

  function t(key) {
    var d = dictionaries[lang] || {};
    return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : key;
  }

  function translateDom() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var attr = nodes[i].getAttribute('data-i18n-attr');
      if (attr) nodes[i].setAttribute(attr, t(key));
      else nodes[i].textContent = t(key);
    }
    document.dispatchEvent(new CustomEvent('ui:langchange', { detail: { lang: lang } }));
  }

  function setLang(code) {
    if (SUPPORTED.indexOf(code) === -1) return;
    lang = code;
    root.setAttribute('lang', code);
    write(LANG_KEY, code);
    translateDom();
  }

  /* ---- Formatos dependientes del idioma ---- */
  function formatDate(date, opts) {
    return new Intl.DateTimeFormat(lang, opts || { dateStyle: 'medium' }).format(date);
  }
  function formatNumber(n, opts) {
    return new Intl.NumberFormat(lang, opts).format(n);
  }

  /* ---- Enlace con los controles cuando el DOM está listo ---- */
  document.addEventListener('DOMContentLoaded', function () {
    var themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = read(THEME_KEY) || 'system';
      themeSelect.addEventListener('change', function () {
        write(THEME_KEY, themeSelect.value);
        applyTheme(themeSelect.value);
      });
    }
    var langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = lang;
      langSelect.addEventListener('change', function () { setLang(langSelect.value); });
    }
    translateDom();
  });

  window.ui = {
    t: t,
    setLang: setLang,
    getLang: function () { return lang; },
    registerStrings: function (code, strings) { dictionaries[code] = Object.assign(dictionaries[code] || {}, strings); },
    formatDate: formatDate,
    formatNumber: formatNumber,
    translateDom: translateDom
  };
})();
