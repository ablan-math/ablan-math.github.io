/* v2 — مجموعات التعلم التعاوني — تُحمَّل من teacher-grades.html وتستعمل جلسة المعلم نفسها عبر initGroups(TG).
   التخزين: ورقة «Groups» عبر getGroups/saveGroups، ونسخة احتياطية في localStorage. */
window.initGroups = function (TG) {
  'use strict';
  var COLORS = [['#dbeafe', '#1e40af'], ['#dcfce7', '#166534'], ['#ffedd5', '#9a3412'], ['#ede9fe', '#5b21b6'],
                ['#fce7f3', '#9d174d'], ['#cffafe', '#155e75'], ['#fef9c3', '#854d0e']];
  var COLOR_NAMES = ['أزرق', 'أخضر', 'برتقالي', 'بنفسجي', 'وردي', 'سماوي', 'أصفر'];
  var NAMES = ['الخوارزمي', 'ابن الهيثم', 'الكندي', 'البيروني', 'الطوسي', 'الخيام', 'ابن سينا', 'الفارابي', 'البتاني', 'ابن النفيس'];
  var LEVELS = ['متميز', 'جيد', 'يحتاج دعمًا', 'يحتاج دعمًا كبيرًا'];
  var ROLE_ICON = { 'قائد': '👑', 'متحدث': '🎤', 'مقرر': '✍️', 'ضابط الوقت': '⏱️', 'مدقق': '🔍' };
  var DEF_ROLES = ['قائد', 'متحدث', 'مقرر', 'ضابط الوقت', 'مدقق'];

  var S = null, CLS = '', roster = [], saveTimer = null, edOk = null, tool = null, sel = null;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(v) { return String(Math.round(v * 100) / 100); }
  function dn(n) { return TG.displayName ? TG.displayName(n) : n; }
  function LK() { return 'tg_groups_' + CLS; }

  function blank() {
    return { n: 6, view: 'cards', showCoef: true, cfg: { cut: [50, 35, 20], coef: [1, 2, 3, 5], roles: DEF_ROLES.slice() }, groups: [], free: [], log: [] };
  }
  // قائمة أعضاء المجموعة، أو قائمة «المتبقون» حين gi = -1
  function L(gi) { return gi < 0 ? S.free : S.groups[gi].m; }
  function level(m) {
    if (m.ov) return m.ov;
    if (m.sc === null || m.sc === undefined) return 2;
    var c = S.cfg.cut;
    return m.sc >= c[0] ? 1 : m.sc >= c[1] ? 2 : m.sc >= c[2] ? 3 : 4;
  }
  function coef(m) { return S.cfg.coef[level(m) - 1] || 1; }
  function roleIcon(r) { return r ? (ROLE_ICON[r] || '▪') : ''; }

  // درجة الطالب من 60 قبل التحسين وإضافة المنصة وفائض الاختبار (كما في عمود «الأصلي» بسجل النصفي)
  function origScore(s, W) {
    var W2 = { part: W.participation, hw: W.homework, beh: W.behavior, plat: W.platform }, earned = 0, poss = 0;
    ['part', 'hw', 'beh', 'plat'].forEach(function (k) {
      var v = k === 'plat' ? ((s.pin && s.pin.platGrade != null) ? s.pin.platGrade : (s.live ? s.live.platGrade : null))
                           : ((s.pin && s.pin[k] != null) ? s.pin[k] : (s.live ? s.live[k] : null));
      if (v === null || v === undefined) return;
      poss += W2[k];
      earned += (k !== 'plat' && s.add && s.add[k] > 0) ? Math.max(0, v - s.add[k]) : v;
    });
    if (s.exam !== null && s.exam !== undefined) { poss += W.exam; earned += s.examInfo ? s.examInfo.raw : s.exam; }
    return poss > 0 ? Math.round(earned / poss * 600) / 10 : null;
  }

  // ===== واجهة النافذة =====
  var css = document.createElement('style');
  css.textContent =
    '#gpModal{z-index:930}#gpEd{z-index:945}' +
    '.gp-box{background:var(--card);border-radius:18px;width:100%;max-width:1180px;max-height:94vh;overflow:auto;padding:16px 18px;box-sizing:border-box}' +
    '.gp-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}.gp-head h3{margin:0;flex:1;font-size:18px}' +
    '.gp-x{border:none;background:var(--bg);color:var(--muted);width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:700}' +
    '.gp-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:12px}' +
    '.gp-tools label{display:flex;flex-direction:column;font-size:11px;font-weight:700;color:var(--muted);gap:3px}' +
    '.gp-tools select,.gp-tools input,.gp-fm select,.gp-fm input,.gp-fm textarea{font-family:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink)}' +
    '.gp-btn{font-family:inherit;font-size:12.5px;font-weight:700;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);cursor:pointer}' +
    '.gp-btn.pri{background:#0d9488;border-color:#0d9488;color:#fff}.gp-btn.dng{color:#b3263e;border-color:#e5484d}.gp-btn.on{background:#f59e0b;border-color:#f59e0b;color:#fff}' +
    '.gp-hint{background:#fef3c7;color:#92400e;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:700;margin-bottom:10px}' +
    '.gp-m.gp-sel,.gp-seat.gp-sel{background:#fde68a;outline:2px solid #f59e0b;transform:scale(1.07);font-weight:800;z-index:2;border-radius:10px}.gp-seat.gp-sel{border-radius:99px}' +
    '.gp-tabs{display:flex;border:1px solid var(--line);border-radius:10px;overflow:hidden}.gp-tabs button{border:0;background:var(--card);color:var(--ink);font-family:inherit;font-size:12.5px;font-weight:700;padding:8px 12px;cursor:pointer}' +
    '.gp-tabs button.on{background:#0d9488;color:#fff}' +
    '.gp-st{font-size:11.5px;color:var(--muted);font-weight:700;margin-inline-start:auto}' +
    '.gp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}' +
    '.gp-card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}' +
    '.gp-ch{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;cursor:pointer;font-weight:800}' +
    '.gp-gn{font-size:15px}.gp-pts{font-size:20px;font-weight:800;line-height:1}.gp-pts small{font-size:10px;margin-inline-start:3px;font-weight:700}' +
    '.gp-cb{padding:6px 10px}.gp-m{display:flex;align-items:center;gap:6px;padding:5px 2px;font-size:13px;cursor:pointer;border-bottom:1px dashed var(--line)}.gp-m:last-child{border:0}' +
    '.gp-m.ld .gp-mn{font-weight:800}.gp-ri{width:18px;text-align:center}.gp-mn{flex:1}.gp-rl{font-size:10.5px;color:var(--muted);font-weight:700}' +
    '.gp-cf{font-size:11px;font-weight:800;border-radius:8px;padding:0 6px;background:var(--bg);color:var(--muted)}.gp-cf.l3{background:#fef3c7;color:#b45309}.gp-cf.l4{background:#fee2e2;color:#b91c1c}.gp-cf.l2{background:#e0f2fe;color:#0369a1}' +
    '.gp-pin{border:0;background:transparent;cursor:pointer;font-size:14px;opacity:.3;padding:0 3px;filter:grayscale(1)}.gp-pin.on{opacity:1;filter:none}' +
    '.gp-card.pinned{border:2px solid #f59e0b}.gp-free{border:2px dashed #9ca3af}' +
    '.gp-none{font-size:12px;color:var(--muted);padding:8px 0}' +
    '.gp-tbls{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;justify-items:center}.gp-tb{position:relative;width:250px;height:250px}' +
    '.gp-ctr{position:absolute;left:75px;top:75px;width:100px;height:100px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-weight:800;font-size:13px;padding:6px;cursor:pointer;box-sizing:border-box}' +
    '.gp-ctr b{font-size:20px}.gp-seat{position:absolute;width:84px;text-align:center;font-size:11.5px;font-weight:700;padding:4px 2px;border-radius:99px;background:var(--card);border:1px solid var(--line);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box}' +
    '.gp-seat.ld{border-width:2px}' +
    '.gp-pg{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:10px}' +
    '.gp-ph{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-weight:800}.gp-ph .gp-gn{flex:1}' +
    '.gp-pb{font-family:inherit;font-size:13px;font-weight:700;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:12px;padding:7px 12px;margin:0 0 6px 6px;cursor:pointer}' +
    '.gp-pb b{margin-inline-start:6px;color:#0d9488}.gp-pb:active{transform:scale(.96)}' +
    '.gp-empty{text-align:center;color:var(--muted);padding:40px 10px;font-weight:700;line-height:2}' +
    '.gp-fm{display:flex;flex-direction:column;gap:10px}.gp-fm label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;color:var(--muted)}' +
    '.gp-row{display:flex;gap:8px}.gp-row>*{flex:1}' +
    '.gp-wb .gp-tools{display:none}.gp-wb .gp-gn{font-size:24px}.gp-wb .gp-m{font-size:20px;padding:9px 2px}.gp-wb .gp-pts{font-size:32px}.gp-wb .gp-grid{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}.gp-wb .gp-cf{display:none}' +
    '.gp-wbx{display:none}.gp-wb .gp-wbx{display:inline-block}';
  document.head.appendChild(css);

  var modal = document.createElement('div');
  modal.id = 'gpModal'; modal.className = 'modal';
  modal.innerHTML =
    '<div class="gp-box" id="gpBox">' +
    '<div class="gp-head"><h3>👥 مجموعات التعلم</h3><button class="gp-btn gp-wbx" id="gpWbOff" type="button">خروج من وضع السبورة</button><button class="gp-x" id="gpClose" type="button">✕</button></div>' +
    '<div class="gp-tools" id="gpTools">' +
    '<label>الفصل<select id="gpClass"></select></label>' +
    '<label>درجات الفترة<select id="gpPer"><option value="1">الأولى (النصفي)</option><option value="2">الثانية (النهائي)</option></select></label>' +
    '<label>عدد المجموعات<select id="gpN"></select></label>' +
    '<button class="gp-btn pri" id="gpDist" type="button">🎲 توزيع تلقائي</button>' +
    '<button class="gp-btn" id="gpLeadM" type="button">👑 قائد يدوي</button>' +
    '<button class="gp-btn" id="gpLead" type="button">👑 قائد تلقائي</button>' +
    '<button class="gp-btn" id="gpSwap" type="button">🔄 تعديل الأفراد</button>' +
    '<button class="gp-btn" id="gpAdd" type="button">+ مجموعة</button>' +
    '<button class="gp-btn" id="gpCfg" type="button">⚙ المعاملات والأدوار</button>' +
    '<div class="gp-tabs" id="gpTabs"><button data-v="cards" type="button">بطاقات</button><button data-v="tables" type="button">طاولات</button><button data-v="points" type="button">النقاط</button></div>' +
    '<label style="flex-direction:row;align-items:center;gap:5px"><input type="checkbox" id="gpShowCf"> إظهار المعامل</label>' +
    '<button class="gp-btn" id="gpWb" type="button">🖥 وضع السبورة</button>' +
    '<span class="gp-st" id="gpSt"></span></div>' +
    '<div id="gpBody"></div></div>';
  document.body.appendChild(modal);

  var ed = document.createElement('div');
  ed.id = 'gpEd'; ed.className = 'modal';
  ed.innerHTML = '<div class="gp-box" style="max-width:440px"><div class="gp-head"><h3 id="gpEdT"></h3><button class="gp-x" id="gpEdX" type="button">✕</button></div>' +
    '<div class="gp-fm" id="gpEdB"></div><div class="gp-row" style="margin-top:14px" id="gpEdBtns"></div></div>';
  document.body.appendChild(ed);

  var clsSel = $('gpClass');
  clsSel.innerHTML = TG.classSel.innerHTML;
  var nSel = $('gpN');
  for (var i = 2; i <= 10; i++) nSel.insertAdjacentHTML('beforeend', '<option value="' + i + '">' + i + ' مجموعات</option>');

  function setSt(t) { $('gpSt').textContent = t || ''; }

  // ===== الحفظ =====
  function save() {
    if (!S) return;
    if (S.log.length > 30) S.log = S.log.slice(-30);
    try { localStorage.setItem(LK(), JSON.stringify(S)); } catch (e) {}
    clearTimeout(saveTimer); setSt('جارٍ الحفظ…');
    saveTimer = setTimeout(doSave, 700);
  }
  function doSave() {
    var cid = CLS, payload = JSON.stringify(S);
    TG.fetch(TG.URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveGroups', classId: cid, data: payload }) })
      .then(TG.parse).then(function (r) {
        if (r && r.status === 'error') throw new Error(r.message);
        if (cid === CLS) setSt('تم الحفظ ✓');
      }).catch(function (e) { if (cid === CLS) setSt('محفوظ على هذا الجهاز فقط (' + (e.message || 'تعذّر الاتصال') + ')'); });
  }

  // ===== التحميل =====
  function load() {
    CLS = clsSel.value; S = null; roster = []; tool = null; sel = null;
    $('gpLeadM').classList.remove('on'); $('gpSwap').classList.remove('on');
    $('gpBody').innerHTML = '<div class="gp-empty">جارٍ التحميل…</div>'; setSt('');
    var enc = encodeURIComponent;
    var pBoard = TG.fetch(TG.URL + '?action=getPeriodBoard&classId=' + enc(CLS) + '&period=' + $('gpPer').value).then(TG.parse)
      .then(function (r) { if (!r || r.status === 'error') throw new Error('x'); return r.data; }).catch(function () { return null; });
    var pGr = TG.fetch(TG.URL + '?action=getGroups&classId=' + enc(CLS)).then(TG.parse)
      .then(function (r) { return (r && r.status === 'success' && r.data && r.data.data) ? r.data.data : null; }).catch(function () { return null; });
    var cid = CLS;
    Promise.all([pBoard, pGr]).then(function (a) {
      if (cid !== CLS) return;
      var board = a[0], raw = a[1];
      if (!raw) { try { raw = localStorage.getItem(LK()); } catch (e) {} }
      try { S = raw ? JSON.parse(raw) : null; } catch (e) { S = null; }
      if (!S || !S.groups) S = blank();
      if (board && board.students && board.weights) roster = board.students.map(function (s) { return { id: String(s.id), name: s.name, sc: origScore(s, board.weights) }; });
      var by = {}; roster.forEach(function (r) { by[r.id] = r; });
      if (!S.free) S.free = [];
      var inUse = {};
      S.groups.forEach(function (g) { g.m.forEach(function (m) { if (!m.cu) inUse[m.id] = 1; if (!m.cu && by[m.id]) { m.sc = by[m.id].sc; m.name = by[m.id].name; } }); });
      S.free.forEach(function (m) { inUse[m.id] = 1; if (by[m.id]) { m.sc = by[m.id].sc; m.name = by[m.id].name; } });
      // كل طالب في الفصل ليس في أي مجموعة يظهر في «المتبقون»
      roster.forEach(function (r) { if (!inUse[r.id]) S.free.push({ id: r.id, name: r.name, sc: r.sc, ov: null, role: '' }); });
      syncUi(); render();
      setSt(board ? '' : 'تعذّر تحميل الدرجات: لن تُحسب المستويات');
    });
  }
  function syncUi() {
    nSel.value = String(S.n); $('gpShowCf').checked = !!S.showCoef;
    [].forEach.call($('gpTabs').children, function (b) { b.classList.toggle('on', b.getAttribute('data-v') === S.view); });
  }

  // ===== العرض =====
  function memberRow(gi, mi, m) {
    var lv = level(m), ld = m.role && m.role === S.cfg.roles[0];
    return '<div class="gp-m' + (ld ? ' ld' : '') + (isSel(gi, mi) ? ' gp-sel' : '') + '" data-a="em" data-g="' + gi + '" data-i="' + mi + '"><span class="gp-ri">' + roleIcon(m.role) + '</span><span class="gp-mn">' + esc(dn(m.name)) + '</span>' +
      (m.role ? '<span class="gp-rl">' + esc(m.role) + '</span>' : '') +
      (S.showCoef ? '<span class="gp-cf l' + lv + '" title="' + LEVELS[lv - 1] + '">×' + coef(m) + '</span>' : '') + '</div>';
  }
  function pinBtn(gi, g, extra) {
    return '<button type="button" class="gp-pin' + (g.pin ? ' on' : '') + '" data-a="pin" data-g="' + gi + '" title="' + (g.pin ? 'مثبّتة: لا يشملها التوزيع التلقائي (اضغط لإلغاء التثبيت)' : 'تثبيت المجموعة حتى لا يشملها التوزيع التلقائي') + '"' + (extra ? ' style="' + extra + '"' : '') + '>📌</button>';
  }
  // «المتبقون»: الطلاب الذين لا مجموعة لهم بعد
  function freeCard() {
    if (!S.free.length) return '';
    return '<div class="gp-card gp-free"><div class="gp-ch" style="background:#e5e7eb;color:#374151" data-a="eg" data-g="-1"><span class="gp-gn">الطلاب المتبقون</span><span class="gp-pts">' + S.free.length + '<small>طالب</small></span></div>' +
      '<div class="gp-cb">' + S.free.map(function (m, mi) { return memberRow(-1, mi, m); }).join('') + '</div></div>';
  }
  function vCards() {
    return '<div class="gp-grid">' + freeCard() + S.groups.map(function (g, gi) {
      var c = COLORS[g.c % 7];
      return '<div class="gp-card' + (g.pin ? ' pinned' : '') + '"><div class="gp-ch" style="background:' + c[0] + ';color:' + c[1] + '" data-a="eg" data-g="' + gi + '"><span class="gp-gn">' + esc(g.name) + ' ' + pinBtn(gi, g) + '</span><span class="gp-pts">' + fmt(g.pts) + '<small>نقطة</small></span></div>' +
        '<div class="gp-cb">' + (g.m.length ? g.m.map(function (m, mi) { return memberRow(gi, mi, m); }).join('') : '<div class="gp-none">لا يوجد أعضاء</div>') + '</div></div>';
    }).join('') + '</div>';
  }
  function vTables() {
    return '<div class="gp-tbls">' + (S.free.length ? '<div class="gp-tb" style="width:250px;height:auto">' + freeCard() + '</div>' : '') + S.groups.map(function (g, gi) {
      var c = COLORS[g.c % 7], n = g.m.length, R = n > 6 ? 104 : 98;
      var h = '<div class="gp-tb">' + pinBtn(gi, g, 'position:absolute;left:4px;top:4px;z-index:3') + '<div class="gp-ctr" data-a="eg" data-g="' + gi + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(g.name) + '<b>' + fmt(g.pts) + '</b></div>';
      g.m.forEach(function (m, mi) {
        var a = -Math.PI / 2 + mi * 2 * Math.PI / Math.max(n, 1), x = 125 + R * Math.cos(a) - 42, y = 125 + R * Math.sin(a) - 12, ld = m.role && m.role === S.cfg.roles[0];
        h += '<span class="gp-seat' + (ld ? ' ld' : '') + (isSel(gi, mi) ? ' gp-sel' : '') + '" data-a="em" data-g="' + gi + '" data-i="' + mi + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px;' + (ld ? 'border-color:' + c[1] : '') + '" title="' + esc(m.name + (m.role ? ' — ' + m.role : '')) + '">' + (m.role ? roleIcon(m.role) + ' ' : '') + esc(dn(m.name)) + '</span>';
      });
      return h + '</div>';
    }).join('') + '</div>';
  }
  function vPoints() {
    var h = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><span style="font-size:12px;color:var(--muted);font-weight:700;flex:1">اضغط اسم الطالب بعد إجابته: تُضاف نقاطه × معامله إلى مجموعته</span>' +
      '<button class="gp-btn" data-a="undo" type="button">↶ تراجع' + (S.log.length ? ' (' + S.log.length + ')' : '') + '</button></div>';
    return h + S.groups.map(function (g, gi) {
      var c = COLORS[g.c % 7];
      return '<div class="gp-pg"><div class="gp-ph"><span class="gp-gn" style="color:' + c[1] + '">' + esc(g.name) + '</span>' +
        '<button class="gp-btn" data-a="gm" data-g="' + gi + '" type="button">−1</button><span class="gp-pts" style="color:' + c[1] + '">' + fmt(g.pts) + '</span><button class="gp-btn" data-a="gp" data-g="' + gi + '" type="button">+1</button></div>' +
        g.m.map(function (m, mi) { return '<button class="gp-pb" data-a="pt" data-g="' + gi + '" data-i="' + mi + '" type="button">' + esc(dn(m.name)) + '<b>+' + coef(m) + '</b></button>'; }).join('') + '</div>';
    }).join('');
  }
  function render() {
    var b = $('gpBody');
    if (!S.groups.length && !S.free.length) {
      b.innerHTML = '<div class="gp-empty">لا توجد مجموعات لهذا الفصل بعد.<br>اختر عدد المجموعات ثم اضغط «توزيع تلقائي» (يوزّع الطلاب بالتوازن من درجات الفترة)، أو أضف مجموعات وأعضاء يدويًا.</div>';
      return;
    }
    var hint = '';
    if (!S.groups.length) hint = '<div class="gp-hint">لا توجد مجموعات بعد: الطلاب كلهم في «المتبقون». اختر عدد المجموعات ثم اضغط «توزيع تلقائي».</div>';
    if (S.view === 'points' && !S.groups.length) hint = '';
    if (S.view !== 'points') {
      if (tool === 'lead') hint = '<div class="gp-hint">👑 وضع القائد اليدوي: اضغط على الطالب الذي تريده قائدًا لمجموعته (وبضغطة ثانية عليه يُلغى). اضغط «قائد يدوي» مرة أخرى للخروج.</div>';
      else if (tool === 'swap') hint = '<div class="gp-hint">🔄 وضع تعديل الأفراد: اضغط على طالب ثم على طالب آخر ليتبدّلا (حتى بين مجموعتين). واضغط اسم مجموعة بعد اختيار طالب لنقله إليها.</div>';
    }
    b.innerHTML = hint + (S.view === 'tables' ? vTables() : S.view === 'points' ? vPoints() : vCards());
  }
  function isSel(gi, mi) { return tool === 'swap' && sel && sel.g === gi && sel.i === mi; }
  function setTool(t) {
    tool = (tool === t) ? null : t; sel = null;
    $('gpLeadM').classList.toggle('on', tool === 'lead'); $('gpSwap').classList.toggle('on', tool === 'swap');
    if (S) render();
  }
  function pickLeader(gi, mi) {
    var r0 = S.cfg.roles[0];
    if (!r0) { alert('لا يوجد دور قائد في قائمة الأدوار.'); return; }
    if (gi < 0) { alert('القائد يُعيَّن لمن هو داخل مجموعة. انقل الطالب إلى مجموعة أولًا.'); return; }
    var g = S.groups[gi], m = g.m[mi], was = m.role === r0;
    g.m.forEach(function (x) { if (x.role === r0) x.role = ''; });
    if (!was) m.role = r0;
    save(); render();
  }
  function swapPick(gi, mi) {
    if (!sel) { sel = { g: gi, i: mi }; render(); return; }
    if (sel.g === gi && sel.i === mi) { sel = null; render(); return; }
    var a = L(sel.g), b = L(gi), t = a[sel.i];
    a[sel.i] = b[mi]; b[mi] = t;
    if (sel.g !== gi) { oneLeader(sel.g, a[sel.i]); oneLeader(gi, b[mi]); }
    sel = null; save(); render();
  }
  function moveSel(gi) {
    if (!sel || sel.g === gi) return;
    var m = L(sel.g).splice(sel.i, 1)[0];
    L(gi).push(m); oneLeader(gi, m); sel = null; save(); render();
  }
  // إن صار في المجموعة قائدان بعد النقل، يفقد القادم دوره (القائد يبقى واحدًا). و«المتبقون» بلا أدوار.
  function oneLeader(gi, incoming) {
    var r0 = S.cfg.roles[0];
    if (!incoming) return;
    if (gi < 0) { incoming.role = ''; return; }
    if (r0 && incoming.role === r0 && L(gi).filter(function (x) { return x.role === r0; }).length > 1) incoming.role = '';
  }

  // ===== التوزيع =====
  function distribute() {
    var n = parseInt(nSel.value, 10) || 6;
    while (S.groups.length < n) {
      var i = S.groups.length, used = S.groups.map(function (g) { return g.name; }), nm = NAMES.filter(function (x) { return used.indexOf(x) < 0; })[0] || ('مجموعة ' + (i + 1));
      S.groups.push({ id: 'g' + Date.now() + i, name: nm, c: i % 7, pts: 0, m: [] });
    }
    var targets = S.groups.filter(function (g) { return !g.pin; });
    if (!targets.length) { alert('كل المجموعات مثبّتة. ألغِ تثبيت مجموعة واحدة على الأقل ليشملها التوزيع.'); return; }
    // المثبّتة لا تُمسّ: يُوزَّع فقط «المتبقون» وأعضاء المجموعات غير المثبّتة
    var pool = S.free.slice(), k = targets.length;
    targets.forEach(function (g) { pool = pool.concat(g.m.filter(function (m) { return !m.cu; })); });
    if (!pool.length) { alert('لا يوجد طلاب ليُوزَّعوا (كلهم في مجموعات مثبّتة).'); return; }
    if (targets.some(function (g) { return g.m.length; }) && !confirm('سيُعاد توزيع المتبقين وأعضاء المجموعات غير المثبّتة فقط (' + k + ' مجموعات)، وتبقى المثبّتة كما هي. متابعة؟')) return;
    targets.forEach(function (g) { g.m = g.m.filter(function (m) { return m.cu; }); }); // الأعضاء المضافون يدويًا يبقون
    S.free = [];
    pool.forEach(function (m) { m.role = ''; m.rnd = Math.random(); });
    function key(m) { return (m.ov ? [0, 55, 40, 15][m.ov - 1] : (m.sc === null || m.sc === undefined ? 30 : m.sc)) + m.rnd * 0.01; }
    pool.sort(function (a, b) { return key(b) - key(a); });
    pool.forEach(function (m, idx) {
      var round = Math.floor(idx / k), pos = idx % k, g = (round % 2) ? k - 1 - pos : pos;
      delete m.rnd; targets[g].m.push(m);
    });
    S.n = Math.max(n, S.groups.length); S.log = [];
    syncUi(); save(); render();
  }
  function assignLeaders() {
    var r0 = S.cfg.roles[0];
    if (!r0) { alert('لا يوجد دور قائد في قائمة الأدوار.'); return; }
    S.groups.forEach(function (g) {
      if (g.pin) return; // المثبّتة تبقى بقائدها
      var best = null;
      g.m.forEach(function (m) { if (m.role === r0) m.role = ''; });
      g.m.forEach(function (m) { if (!best || (m.sc || 0) > (best.sc || 0)) best = m; });
      if (best) best.role = r0;
    });
    save(); render();
  }

  // ===== المحرر =====
  function openEd(title, body, buttons) {
    $('gpEdT').textContent = title; $('gpEdB').innerHTML = body;
    var bh = '';
    buttons.forEach(function (b, i) { bh += '<button type="button" class="gp-btn ' + (b.cls || '') + '" data-b="' + i + '">' + b.t + '</button>'; });
    $('gpEdBtns').innerHTML = bh;
    edOk = buttons;
    ed.classList.add('open');
  }
  function closeEd() { ed.classList.remove('open'); edOk = null; }
  function val(id) { return $(id).value; }
  function groupOptions(sel) { return '<option value="-1"' + (sel < 0 ? ' selected' : '') + '>الطلاب المتبقون (بلا مجموعة)</option>' + S.groups.map(function (g, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join(''); }

  function editMember(gi, mi) {
    var m = L(gi)[mi];
    var roles = '<option value="">بدون دور</option>' + S.cfg.roles.map(function (r) { return '<option' + (m.role === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('');
    var lv = '<option value="">تلقائي (' + LEVELS[level({ sc: m.sc, ov: null }) - 1] + ')</option>' + LEVELS.map(function (t, i) { return '<option value="' + (i + 1) + '"' + (m.ov === i + 1 ? ' selected' : '') + '>' + t + ' ×' + S.cfg.coef[i] + '</option>'; }).join('');
    var info = m.sc !== null && m.sc !== undefined ? 'درجته الأصلية ' + fmt(m.sc) + ' من 60' : 'لا توجد درجة له';
    openEd(m.name, (m.cu ? '<label>الاسم<input id="gpf-name" value="' + esc(m.name) + '"></label>' : '<div style="font-size:12px;color:var(--muted);font-weight:700">' + info + '</div>') +
      '<label>الدور<select id="gpf-role">' + roles + '</select></label>' +
      '<label>المستوى (يحدد المعامل)<select id="gpf-lv">' + lv + '</select></label>' +
      '<label>المجموعة<select id="gpf-g">' + groupOptions(gi) + '</select></label>',
      [{ t: 'حفظ', cls: 'pri', f: function () {
        if (m.cu && val('gpf-name').trim()) m.name = val('gpf-name').trim();
        m.role = val('gpf-role'); m.ov = val('gpf-lv') ? parseInt(val('gpf-lv'), 10) : null;
        var ng = parseInt(val('gpf-g'), 10);
        if (ng !== gi) { L(gi).splice(mi, 1); L(ng).push(m); oneLeader(ng, m); }
        closeEd(); save(); render();
      } }].concat(m.cu ? [{ t: 'حذف العضو', cls: 'dng', f: function () { L(gi).splice(mi, 1); closeEd(); save(); render(); } }]
        : (gi >= 0 ? [{ t: 'إلى المتبقين', cls: '', f: function () { L(gi).splice(mi, 1); m.role = ''; S.free.push(m); closeEd(); save(); render(); } }] : [])));
  }
  function editGroup(gi) {
    var g = S.groups[gi];
    var colors = COLOR_NAMES.map(function (t, i) { return '<option value="' + i + '"' + (g.c % 7 === i ? ' selected' : '') + '>' + t + '</option>'; }).join('');
    openEd('المجموعة', '<label>الاسم<input id="gpf-name" value="' + esc(g.name) + '"></label>' +
      '<div class="gp-row"><label>اللون<select id="gpf-c">' + colors + '</select></label><label>النقاط<input id="gpf-p" type="number" step="0.5" value="' + g.pts + '"></label></div>' +
      '<label>إضافة عضو بالاسم (من خارج الفصل أو يدويًا)<input id="gpf-new" placeholder="اتركه فارغًا إن لم ترد الإضافة"></label>',
      [{ t: 'حفظ', cls: 'pri', f: function () {
        g.name = val('gpf-name').trim() || g.name; g.c = parseInt(val('gpf-c'), 10) || 0; g.pts = parseFloat(val('gpf-p')) || 0;
        var nn = val('gpf-new').trim();
        if (nn) g.m.push({ id: 'c' + Date.now(), name: nn, sc: null, ov: null, role: '', cu: true });
        closeEd(); save(); render();
      } }, { t: 'حذف المجموعة', cls: 'dng', f: function () {
        if (!confirm('حذف المجموعة؟ ينتقل طلابها إلى «المتبقون» (ويُحذف من أضفتهم يدويًا).')) return;
        g.m.forEach(function (m) { if (!m.cu) { m.role = ''; S.free.push(m); } });
        S.groups.splice(gi, 1); S.n = Math.max(S.groups.length, 1); closeEd(); save(); syncUi(); render();
      } }]);
  }
  function editCfg() {
    var c = S.cfg;
    openEd('المعاملات والأدوار',
      '<div style="font-size:12px;color:var(--muted);font-weight:700;line-height:1.8">حدود المستويات من 60: يكون الطالب «متميزًا» عند الحد الأول فأكثر، و«جيدًا» عند الثاني، و«يحتاج دعمًا» عند الثالث، وما دونه «دعم كبير».</div>' +
      '<div class="gp-row"><label>متميز من<input id="gpf-c0" type="number" value="' + c.cut[0] + '"></label><label>جيد من<input id="gpf-c1" type="number" value="' + c.cut[1] + '"></label><label>دعم من<input id="gpf-c2" type="number" value="' + c.cut[2] + '"></label></div>' +
      '<div class="gp-row"><label>معامل متميز<input id="gpf-k0" type="number" step="0.5" value="' + c.coef[0] + '"></label><label>جيد<input id="gpf-k1" type="number" step="0.5" value="' + c.coef[1] + '"></label><label>دعم<input id="gpf-k2" type="number" step="0.5" value="' + c.coef[2] + '"></label><label>دعم كبير<input id="gpf-k3" type="number" step="0.5" value="' + c.coef[3] + '"></label></div>' +
      '<label>الأدوار (كل دور في سطر؛ الأول هو القائد، احذفه إن لم تردّ قائدًا)<textarea id="gpf-roles" rows="6">' + esc(c.roles.join('\n')) + '</textarea></label>',
      [{ t: 'حفظ', cls: 'pri', f: function () {
        var cut = [0, 1, 2].map(function (i) { return parseFloat(val('gpf-c' + i)); }), cf = [0, 1, 2, 3].map(function (i) { return parseFloat(val('gpf-k' + i)); });
        if (cut.concat(cf).some(function (x) { return !isFinite(x); }) || !(cut[0] > cut[1] && cut[1] > cut[2])) { alert('تأكد أن الحدود مرتبة تنازليًا وأن كل الخانات أرقام.'); return; }
        c.cut = cut; c.coef = cf;
        c.roles = val('gpf-roles').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        S.groups.forEach(function (g) { g.m.forEach(function (m) { if (m.role && c.roles.indexOf(m.role) < 0) m.role = ''; }); });
        closeEd(); save(); render();
      } }]);
  }

  // ===== الأحداث =====
  $('gpBody').addEventListener('click', function (e) {
    var t = e.target.closest('[data-a]'); if (!t || !S) return;
    var a = t.getAttribute('data-a'), gi = parseInt(t.getAttribute('data-g'), 10), mi = parseInt(t.getAttribute('data-i'), 10);
    var inPts = S.view === 'points';
    if (a === 'em') { if (tool === 'lead') pickLeader(gi, mi); else if (tool === 'swap') swapPick(gi, mi); else editMember(gi, mi); }
    else if (a === 'pin') { var pg = S.groups[gi]; pg.pin = !pg.pin; save(); render(); }
    else if (a === 'eg') { if (tool === 'swap' && !inPts) moveSel(gi); else if (tool !== 'lead' && gi >= 0) editGroup(gi); }
    else if (a === 'pt') {
      var m = S.groups[gi].m[mi], p = coef(m);
      S.groups[gi].pts += p; S.log.push({ g: gi, p: p }); save(); render();
    } else if (a === 'gp') { S.groups[gi].pts += 1; S.log.push({ g: gi, p: 1 }); save(); render(); }
    else if (a === 'gm') { S.groups[gi].pts -= 1; S.log.push({ g: gi, p: -1 }); save(); render(); }
    else if (a === 'undo') {
      var l = S.log.pop(); if (l && S.groups[l.g]) S.groups[l.g].pts -= l.p;
      save(); render();
    }
  });
  $('gpEdBtns').addEventListener('click', function (e) {
    var b = e.target.closest('[data-b]'); if (!b || !edOk) return;
    var f = edOk[parseInt(b.getAttribute('data-b'), 10)]; if (f && f.f) f.f();
  });
  $('gpEdX').addEventListener('click', closeEd);
  ed.addEventListener('click', function (e) { if (e.target === ed) closeEd(); });
  $('gpTabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]'); if (!b || !S) return;
    S.view = b.getAttribute('data-v'); syncUi(); render(); save();
  });
  $('gpShowCf').addEventListener('change', function () { if (!S) return; S.showCoef = this.checked; render(); save(); });
  $('gpDist').addEventListener('click', function () { if (S) distribute(); });
  $('gpLead').addEventListener('click', function () { if (S) assignLeaders(); });
  $('gpLeadM').addEventListener('click', function () { if (S) setTool('lead'); });
  $('gpSwap').addEventListener('click', function () { if (S) setTool('swap'); });
  $('gpAdd').addEventListener('click', function () {
    if (!S) return;
    var i = S.groups.length;
    S.groups.push({ id: 'g' + Date.now(), name: NAMES[i % NAMES.length], c: i % 7, pts: 0, m: [] });
    S.n = S.groups.length; syncUi(); save(); render();
  });
  $('gpCfg').addEventListener('click', function () { if (S) editCfg(); });
  $('gpWb').addEventListener('click', function () { $('gpBox').classList.add('gp-wb'); });
  $('gpWbOff').addEventListener('click', function () { $('gpBox').classList.remove('gp-wb'); });
  clsSel.addEventListener('change', load);
  $('gpPer').addEventListener('change', load);
  nSel.addEventListener('change', function () { if (S) S.n = parseInt(nSel.value, 10); });
  function close() { modal.classList.remove('open'); $('gpBox').classList.remove('gp-wb'); }
  $('gpClose').addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

  $('groupsBtn').addEventListener('click', function () {
    clsSel.value = TG.classSel.value;
    $('gpPer').value = TG.getMode() === 'fin' ? '2' : '1';
    modal.classList.add('open');
    load();
  });
};
