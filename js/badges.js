/* أوسمة الاجتهاد — محرك عرض فقط. لا يغيّر أي درجة.
   يقرأ student.activity (من Apps Script) و student.certificates، ويحسب الأوسمة في المتصفح.
   إضافة وسام جديد = سطر واحد في DEFS. أي خطأ هنا لا يوقف الصفحة. */
(function () {
  'use strict';

  var TIER_NAMES = ['برونزي', 'فضي', 'ذهبي', 'ماسي', 'أسطوري'];
  var TIER_COLORS = ['#b7791f', '#64748b', '#d69e2e', '#0ea5e9', '#a855f7'];

  // value(s): الرقم الذي يُقارَن بالعتبات (يُكتسب الوسام نهائيًا ولا يضيع إذا انقطع التتابع).
  // cur(s): الرقم الحالي للعرض فقط. unit(n): نص الشرط.
  var DEFS = [
    {
      id: 'present', icon: '🌱', name: 'الحاضر', th: [3, 5, 10, 20, 30],
      value: function (s) { return n(s.activity && s.activity.open && s.activity.open.best); },
      cur: function (s) { return n(s.activity && s.activity.open && s.activity.open.cur); },
      need: function (t) { return 'افتح المنصة ' + AR(t) + ' أيام دراسية متتالية'; },
      now: function (c) { return c > 0 ? 'تتابعك الآن ' + AR(c) + ' ' + (c === 1 ? 'يوم' : c === 2 ? 'يومان' : 'أيام') : ''; }
    },
    {
      id: 'diligent', icon: '🔥', name: 'المجتهد', th: [3, 5, 10, 20, 30],
      value: function (s) { return n(s.activity && s.activity.act && s.activity.act.best); },
      cur: function (s) { return n(s.activity && s.activity.act && s.activity.act.cur); },
      need: function (t) { return 'أنهِ درسًا أو لعبة ' + AR(t) + ' أيام دراسية متتالية'; },
      now: function (c) { return c > 0 ? 'تتابعك الآن ' + AR(c) + ' ' + (c === 1 ? 'يوم' : c === 2 ? 'يومان' : 'أيام') : ''; }
    },
    {
      id: 'sniperL', icon: '🎯', name: 'قنّاص الدروس', th: [5, 10, 25],
      value: function (s) { return n(s.activity && s.activity.perfectLessons); },
      need: function (t) { return 'الدرجة الكاملة من أول محاولة في ' + AR(t) + (t <= 10 ? ' دروس' : ' درسًا'); }
    },
    {
      id: 'sniperG', icon: '🏹', name: 'قنّاص الألعاب', th: [5, 10, 25],
      value: function (s) { return n(s.activity && s.activity.perfectGames); },
      need: function (t) { return 'الدرجة الكاملة من أول محاولة في ' + AR(t) + (t <= 10 ? ' ألعاب' : ' لعبة'); }
    },
    {
      id: 'cert', icon: '🏅', name: 'حاصل على شهادة', th: [1, 3],
      value: function (s) { return Array.isArray(s.certificates) ? s.certificates.length : 0; },
      need: function (t) { return t === 1 ? 'احصل على شهادة شكر' : 'اجمع ' + AR(t) + ' شهادات'; }
    }
  ];

  function n(v) { v = +v; return isNaN(v) || v < 0 ? 0 : v; }
  function AR(x) {
    if (typeof window.AR === 'function') { try { return window.AR(x); } catch (e) {} }
    return String(x).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // يرجع قائمة: { id, icon, name, tier(-1 = لم يُكتسب), tierName, next, need, pct, nowText }
  function compute(student) {
    var out = [];
    if (!student) return out;
    DEFS.forEach(function (d) {
      try {
        var v = d.value(student), tier = -1;
        for (var i = 0; i < d.th.length; i++) if (v >= d.th[i]) tier = i;
        var nextT = tier + 1 < d.th.length ? d.th[tier + 1] : null;
        var c = d.cur ? d.cur(student) : null;
        out.push({
          id: d.id, icon: d.icon, name: d.name, tier: tier,
          tierName: tier >= 0 ? TIER_NAMES[tier] : '',
          need: nextT !== null ? d.need(nextT) : '',
          pct: nextT !== null ? Math.min(100, Math.round(v / nextT * 100)) : 100,
          progress: nextT !== null ? AR(Math.min(v, nextT)) + ' / ' + AR(nextT) : '',
          nowText: d.now && c !== null ? d.now(c) : '',
          maxed: nextT === null
        });
      } catch (e) {}
    });
    return out;
  }

  var CSS = '.bdg-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}' +
    '.bdg{display:flex;flex-direction:column;align-items:center;gap:3px;padding:14px 8px;border-radius:16px;background:var(--bg);text-align:center;min-width:0;border:1px dashed var(--line)}' +
    '.bdg .bi{font-size:34px;line-height:1.1;filter:grayscale(1);opacity:.45}' +
    '.bdg b{font-size:14px;font-weight:800}' +
    '.bdg small{font-size:12px;font-weight:700;color:var(--muted);line-height:1.5}' +
    '.bdg .bt{font-size:12px;font-weight:800;padding:1px 10px;border-radius:10px;color:#fff}' +
    '.bdg .bp{width:80%;height:6px;border-radius:6px;background:var(--line);overflow:hidden;margin-top:4px}' +
    '.bdg .bp i{display:block;height:100%;background:var(--ac);border-radius:6px}' +
    '.bdg.on{background:var(--card);border:1px solid var(--line);box-shadow:0 1px 6px rgba(0,0,0,.06)}' +
    '.bdg.on .bi{filter:none;opacity:1}';
  var cssDone = false;
  function ensureCss() {
    if (cssDone) return; cssDone = true;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  }

  function tile(b) {
    var on = b.tier >= 0, h = '<div class="bdg' + (on ? ' on' : '') + '"><div class="bi">' + b.icon + '</div><b>' + esc(b.name) + '</b>';
    if (on) h += '<span class="bt" style="background:' + TIER_COLORS[b.tier] + '">' + esc(b.tierName) + '</span>';
    else h += '<small>لم يُكتسب بعد</small>';
    if (b.need) h += '<small>' + esc(on ? 'التالي: ' + b.need : b.need) + '</small>' +
      '<div class="bp"><i style="width:' + b.pct + '%"></i></div><small>' + b.progress + '</small>';
    else if (b.maxed) h += '<small>أعلى درجة 🎉</small>';
    if (b.nowText) h += '<small>' + esc(b.nowText) + '</small>';
    return h + '</div>';
  }

  // HTML البطاقة؛ نص فارغ إذا لم تتوفر بيانات النشاط (الخلفية لم تُحدَّث بعد)
  function html(student) {
    try {
      if (!student || !student.activity) return '';
      ensureCss();
      return '<div class="bdg-grid">' + compute(student).map(tile).join('') + '</div>';
    } catch (e) { return ''; }
  }

  // أوسمة جديدة منذ آخر مرة (أول مرة تُسجَّل بصمت حتى لا يُغمر الطالب بالتنبيهات)
  function fresh(student) {
    try {
      if (!student || !student.activity) return [];
      var key = 'seenBadges_' + student.id, seen = null;
      try { seen = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      var cur = {}, list = compute(student), added = [];
      list.forEach(function (b) {
        if (b.tier >= 0) { cur[b.id] = b.tier; if (seen && (seen[b.id] === undefined || seen[b.id] < b.tier)) added.push(b); }
      });
      try { localStorage.setItem(key, JSON.stringify(cur)); } catch (e) {}
      return added;
    } catch (e) { return []; }
  }

  // «فتح المنصة»: طلب واحد في اليوم لكل جهاز. لا يؤثر على الصفحة إن فشل.
  function ping(student, scriptUrl) {
    try {
      if (!student || !student.id || student.role === 'teacher' || !scriptUrl) return;
      var d = new Date(), day = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), k = 'actPing', mark = day + '|' + student.id;
      var last = ''; try { last = localStorage.getItem(k) || ''; } catch (e) {}
      if (last === mark) return;
      fetch(scriptUrl + '?action=pingOpen&studentId=' + encodeURIComponent(student.id) + '&classId=' + encodeURIComponent(student.classIdentifier || '') + '&t=' + Date.now(), { redirect: 'follow' })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.status === 'success') { try { localStorage.setItem(k, mark); } catch (e) {} } })
        .catch(function () {});
    } catch (e) {}
  }

  window.Badges = { compute: compute, html: html, fresh: fresh, ping: ping };
})();
