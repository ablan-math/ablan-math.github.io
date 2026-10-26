/* access-guard.js — صلاحيات الصفحات المميّزة (طلاب/معلم = كامل، زائر = ناقص)
   الاستعمال في أي صفحة:  <script src="js/access-guard.js"></script>  داخل <head>
   ثم:
     AccessGuard.guest            true إذا كان الزائر غير مسجّل
     AccessGuard.role             'teacher' | 'student' | 'guest'
     AccessGuard.prompt(msg)      نافذة تدعو للتسجيل
     AccessGuard.lockCard(msg)    HTML لبطاقة قفل تُضاف مكان المحتوى المخفي
     data-ag="full"               عنصر يظهر للمسجّلين فقط
     data-ag="guest"              عنصر يظهر للزائر فقط
   للزائر: لا طباعة ولا نسخ ولا حفظ ولا عرض مصدر، وعلامة مائية على الشاشة.
   للمسجّل: طباعة كاملة بعلامة مائية باسم المعلم (واسم الطالب بخط خفيف لتتبّع التسريب).
   تنبيه: هذه حماية ردعية للمستخدم العادي فقط؛ من يفتح أدوات المطوّر يستطيع تجاوزها. */
(function () {
  'use strict';
  var TEACHER = 'أ. عبدالعزيز خالد العبلان';
  var LOGIN_URL = 'term1.html';

  var user = null;
  try { user = JSON.parse(localStorage.getItem('currentStudent') || 'null'); } catch (e) { /* التخزين غير متاح */ }
  var role = !user || !user.name ? 'guest' : (user.role === 'teacher' ? 'teacher' : 'student');
  var guest = role === 'guest';

  var AG = {
    role: role,
    guest: guest,
    userName: user && user.name ? String(user.name) : '',
    teacherName: TEACHER,
    loginUrl: LOGIN_URL
  };
  window.AccessGuard = AG;

  var root = document.documentElement;
  root.classList.add(guest ? 'ag-guest' : 'ag-full');

  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- الأنماط ---------- */
  var css =
    'html.ag-guest [data-ag="full"]{display:none!important}' +
    'html:not(.ag-guest) [data-ag="guest"]{display:none!important}' +
    'html.ag-guest body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    'html.ag-guest input,html.ag-guest textarea{-webkit-user-select:text;user-select:text}' +
    '.ag-wm{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;pointer-events:none;display:none;background-repeat:repeat;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'html.ag-guest .ag-wm{display:block}' +
    '.ag-lock{margin:14px 0;padding:18px 16px;border:2px dashed #b0bec5;border-radius:10px;background:#f5f7f8;text-align:center;font-family:inherit;color:#37474f;line-height:1.8}' +
    '.ag-lock b{display:block;font-size:17px;margin-bottom:4px}' +
    '.ag-lock a,.ag-dlg a{display:inline-block;margin-top:8px;background:#007bff;color:#fff!important;text-decoration:none;padding:8px 18px;border-radius:6px;font-weight:700}' +
    '.ag-ov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483600;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.ag-dlg{background:#fff;border-radius:12px;padding:22px 20px;max-width:360px;width:100%;text-align:center;font-family:inherit;direction:rtl;line-height:1.8;color:#222;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
    '.ag-dlg button{margin-inline-start:8px;border:0;background:#6c757d;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:14px}' +
    '@media print{' +
      '.ag-wm{display:block!important}' +
      'html.ag-guest body>*:not(.ag-wm){display:none!important}' +
      'html.ag-guest body{display:block!important;width:auto!important;background:#fff!important}' +
      'html.ag-guest body::before{content:"الطباعة متاحة للطلاب المسجّلين فقط — سجّل دخولك من المنصة ثم أعد المحاولة";display:block;padding:60px 20px;text-align:center;direction:rtl;font:700 22px Tahoma,Arial,sans-serif;color:#333}' +
    '}';
  var st = document.createElement('style');
  st.id = 'ag-css';
  st.textContent = css;
  (document.head || root).appendChild(st);

  /* ---------- العلامة المائية (بلاطة SVG مائلة) ---------- */
  function tile(lines, opacity) {
    var w = 380, h = 300, y0 = h / 2 - (lines.length - 1) * 14;
    var t = lines.map(function (l, i) {
      return '<text x="' + w / 2 + '" y="' + (y0 + i * 28) + '" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="' + (i === 0 ? 24 : 15) + '" font-weight="700" fill="#000" fill-opacity="' + (i === 0 ? opacity : opacity * .8) + '">' + esc(l) + '</text>';
    }).join('');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><g transform="rotate(-28 ' + w / 2 + ' ' + h / 2 + ')">' + t + '</g></svg>';
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
  }
  function addWatermark() {
    var el = document.createElement('div');
    el.className = 'ag-wm';
    el.setAttribute('aria-hidden', 'true');
    var lines = guest ? [TEACHER, 'نسخة تجريبية — سجّل دخولك للمحتوى الكامل'] : [TEACHER];
    if (!guest && role === 'student' && AG.userName) lines.push('طُبعت للطالب: ' + AG.userName);
    el.style.backgroundImage = tile(lines, guest ? .07 : .09);
    document.body.appendChild(el);
  }

  /* ---------- نافذة الدعوة للتسجيل + بطاقة القفل ---------- */
  AG.prompt = function (msg) {
    var old = document.getElementById('ag-ov');
    if (old) old.remove();
    var ov = document.createElement('div');
    ov.className = 'ag-ov';
    ov.id = 'ag-ov';
    ov.innerHTML = '<div class="ag-dlg"><div style="font-size:30px">🔒</div><div>' + esc(msg || 'هذه الميزة للطلاب المسجّلين فقط') + '</div><a href="' + LOGIN_URL + '">تسجيل الدخول</a><button type="button">إغلاق</button></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.tagName === 'BUTTON') ov.remove(); });
    document.body.appendChild(ov);
  };
  AG.lockCard = function (msg) {
    return '<div class="ag-lock"><b>🔒 المحتوى الكامل للطلاب المسجّلين</b>' + esc(msg || 'سجّل دخولك لعرض بقية الأسئلة والحلول والطباعة.') + '<br><a href="' + LOGIN_URL + '">تسجيل الدخول</a></div>';
  };

  /* ---------- قيود الزائر ---------- */
  if (guest) {
    var inField = function (e) { return e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName); };
    ['copy', 'cut', 'dragstart', 'contextmenu'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { if (!inField(e)) e.preventDefault(); }, true);
    });
    document.addEventListener('selectstart', function (e) { if (!inField(e)) e.preventDefault(); }, true);
    document.addEventListener('keydown', function (e) {
      var k = (e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey;
      var blocked = (c && /^[psuxa]$/.test(k)) || (c && k === 'c' && !inField(e)) || e.key === 'F12' || (c && e.shiftKey && /^[ijc]$/.test(k));
      if (!blocked) return;
      if (c && inField(e) && /^[xca]$/.test(k)) return;
      e.preventDefault();
      if (k === 'p' || k === 's') AG.prompt('الطباعة والحفظ للطلاب المسجّلين فقط');
    }, true);
  }

  if (document.body) addWatermark(); else document.addEventListener('DOMContentLoaded', addWatermark);
})();
