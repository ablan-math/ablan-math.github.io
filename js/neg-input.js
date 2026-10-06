/* neg-input.js — زر ± عائم لكتابة الأعداد السالبة على الجوال
   يعمل مع أي لوحة مفاتيح، ويشمل الحقول التي تُنشأ ديناميكياً.
   لاستثناء حقل: أضف data-no-neg إلى الحقل. */
(function () {
  'use strict';
  var SKIP_IDS = { 'input-achieved': 1, 'input-max': 1, 'input-metric-value': 1 };
  var NUMERIC_TYPES = { number: 1, tel: 1 };
  var NUMERIC_MODES = { numeric: 1, decimal: 1 };

  function isTarget(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    if (el.hasAttribute('data-no-neg') || SKIP_IDS[el.id] || el.readOnly || el.disabled) return false;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    if (NUMERIC_TYPES[t]) return true;
    return t === 'text' && NUMERIC_MODES[(el.getAttribute('inputmode') || '').toLowerCase()];
  }

  // type=number لا يقبل "-" وحدها، و tel/numeric لا فيها سالب على الجوال → نص بلوحة decimal
  function prepare(el) {
    if (el._negReady || !isTarget(el)) return;
    el._negReady = true;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    if (NUMERIC_TYPES[t]) {
      el.setAttribute('type', 'text');
      el.setAttribute('data-neg-num', '1'); // علامة تدل أنه كان حقلاً رقمياً (للأنماط والاستعلامات)
      el._negFilter = true;
    }
    el.setAttribute('inputmode', 'decimal');
    el.setAttribute('autocomplete', 'off');
    el.style.direction = 'ltr';
    el.addEventListener('input', function () {
      var v = el.value;
      var n = v.replace(/[−‒–—‐‑]/g, '-');
      if (el._negFilter) n = n.replace(/[^0-9٠-٩.٫,\-\/]/g, '');
      if (n !== v) el.value = n;
    });
  }

  function scan(root) {
    if (root.tagName === 'INPUT') prepare(root);
    if (root.querySelectorAll) {
      var list = root.querySelectorAll('input');
      for (var i = 0; i < list.length; i++) prepare(list[i]);
    }
  }

  var btn = null, current = null;

  function build() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '±';
    btn.setAttribute('aria-label', 'تبديل الإشارة (موجب/سالب)');
    btn.style.cssText = 'position:absolute;z-index:2147483000;display:none;width:44px;height:36px;' +
      'border:2px solid #fff;border-radius:10px;background:#2563eb;color:#fff;font:700 22px/1 Arial,sans-serif;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;padding:0;touch-action:manipulation;direction:ltr;';
    // pointerdown/mousedown مع preventDefault يُبقي التركيز على الحقل ولا تُغلق اللوحة
    var keep = function (e) { e.preventDefault(); };
    btn.addEventListener('mousedown', keep);
    btn.addEventListener('pointerdown', keep);
    btn.addEventListener('touchstart', keep, { passive: false });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!current) return;
      var v = current.value.trim();
      current.value = v.charAt(0) === '-' ? v.slice(1) : '-' + v;
      current.dispatchEvent(new Event('input', { bubbles: true }));
      try { var n = current.value.length; current.setSelectionRange(n, n); } catch (_) {}
      current.focus();
    });
    document.body.appendChild(btn);
  }

  function place() {
    if (!btn || !current) return;
    var r = current.getBoundingClientRect();
    var sx = window.pageXOffset, sy = window.pageYOffset;
    var top = r.top - 40;
    if (top < 4) top = r.bottom + 4;
    var left = r.left + r.width / 2 - 22;
    left = Math.max(4, Math.min(left, document.documentElement.clientWidth - 48));
    btn.style.top = (top + sy) + 'px';
    btn.style.left = (left + sx) + 'px';
  }

  function show(el) {
    if (!btn) build();
    current = el;
    btn.style.display = 'block';
    place();
  }

  function hide() {
    current = null;
    if (btn) btn.style.display = 'none';
  }

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (isTarget(el)) { prepare(el); show(el); }
    else if (e.target !== btn) hide();
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (!a || !isTarget(a)) hide();
    }, 150);
  });
  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', place);

  function start() {
    scan(document.body);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) if (added[j].nodeType === 1) scan(added[j]);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
