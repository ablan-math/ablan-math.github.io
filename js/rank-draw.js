// ===== لوحة ترتيب الفصل: صفحة A4 واحدة بالطول (210×297 مم) =====
// منصة تتويج لأول ثلاثة، ثم فئات يُعاد الترقيم داخل كل منها، ثم مقارنة الفصول (اختيارية).
// إن كثر الطلاب تُوزَّع الصفوف على عمودين ويصغر ارتفاع الصف حتى تتّسع الصفحة الواحدة.
(function(){
  "use strict";
  var PW = 210, PH = 297, M = 9;
  var PAL = {
    color: {
      ink: '#1f2937', mute: '#6b7280', line: '#e5e7eb', track: '#eef0f3', avg: '#4b5563', title: '#0c447c',
      pod: [{ f: '#FAC775', s: '#BA7517', t: '#412402' }, { f: '#D3D1C7', s: '#888780', t: '#2C2C2A' }, { f: '#F5C4B3', s: '#D85A30', t: '#4A1B0C' }],
      tiers: [{ f: '#185FA5', l: '#E6F1FB', t: '#0C447C' }, { f: '#0F6E56', l: '#E1F5EE', t: '#085041' }, { f: '#534AB7', l: '#EEEDFE', t: '#3C3489' }],
      me: '#185FA5', other: '#B4B2A9'
    },
    bw: {
      ink: '#111111', mute: '#555555', line: '#d4d4d4', track: '#efefef', avg: '#222222', title: '#111111',
      pod: [{ f: '#d6d6d6', s: '#222222', t: '#111111' }, { f: '#e6e6e6', s: '#555555', t: '#111111' }, { f: '#f1f1f1', s: '#888888', t: '#111111' }],
      tiers: [{ f: '#333333', l: '#ececec', t: '#111111' }, { f: '#666666', l: '#f3f3f3', t: '#111111' }, { f: '#999999', l: '#f8f8f8', t: '#111111' }],
      me: '#222222', other: '#bdbdbd'
    }
  };
  var ORD = ['الأول', 'الثاني', 'الثالث'];
  var fontsP = null;
  function fonts(){
    if (!fontsP){
      fontsP = Promise.all(['400 20px Cairo', '700 20px Cairo', '800 20px Cairo'].map(function(f){
        return document.fonts && document.fonts.load ? document.fonts.load(f, 'ترتيب') : null;
      })).catch(function(){});
    }
    return fontsP;
  }
  function font(c, w, s){ c.font = w + ' ' + s + 'px Cairo'; }
  // يصغّر الخط حتى يتّسع النص للعرض المتاح
  function fit(c, t, maxW, s, w){
    font(c, w, s);
    while (s > 1.4 && c.measureText(t).width > maxW){ s *= 0.93; font(c, w, s); }
    return s;
  }
  function rr(c, x, y, w, h, r){
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function txt(c, t, x, y, al, col){ c.textAlign = al; c.fillStyle = col; c.fillText(t, x, y); }
  // الأرقام تُكتب من اليسار لليمين حتى تبقى علامة % بعد الرقم
  function num(c, t, x, y, al, col){ try { c.direction = 'ltr'; } catch(e){} txt(c, t, x, y, al, col); try { c.direction = 'rtl'; } catch(e){} }
  function clamp01(v){ return Math.max(0, Math.min(1, v || 0)); }

  // توزيع الفئات على الأعمدة بارتفاع صف ثابت؛ الفئة المقسومة يتكرّر رأسها في العمود التالي «تابع»
  function place(tiers, avail, cols, rh){
    var hd = Math.max(5, rh * 0.9), col = 0, y = 0, cuts = [];
    for (var t = 0; t < tiers.length; t++){
      if (y > 0 && y + hd + rh > avail){ col++; y = 0; }
      if (col >= cols) return null;
      cuts.push({ t: t, i: -1, col: col, y: y }); y += hd;
      for (var i = 0; i < tiers[t].rows.length; i++){
        if (y + rh > avail){
          col++; y = 0;
          if (col >= cols) return null;
          cuts.push({ t: t, i: -2, col: col, y: y }); y += hd;
        }
        cuts.push({ t: t, i: i, col: col, y: y }); y += rh;
      }
    }
    return { rh: rh, hd: hd, items: cuts, cols: cols };
  }
  // أكبر ارتفاع صف يتّسع، ثم في العمودين أقل سعة تكفي حتى يتوازن طولهما
  function plan(tiers, avail, cols, hiH, loH){
    for (var rh = hiH; rh >= loH - 1e-9; rh -= 0.1){
      var L = place(tiers, avail, cols, rh);
      if (!L) continue;
      if (cols > 1){
        var lo = avail / cols, hi = avail;
        for (var n = 0; n < 14; n++){ var mid = (lo + hi) / 2; if (place(tiers, mid, cols, rh)) hi = mid; else lo = mid; }
        L = place(tiers, hi, cols, rh) || L;
      }
      return L;
    }
    return null;
  }

  function draw(cv, o){
    var c = cv.getContext('2d'), k = cv.width / PW, P = PAL[o.bw ? 'bw' : 'color'];
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#ffffff'; c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(k, 0, 0, k, 0, 0);
    try { c.direction = 'rtl'; } catch(e){}
    c.textBaseline = 'middle';
    var nE = (o.cols || []).length, hide = !!o.hideNums;

    // ----- الترويسة -----
    var hy = M + 2;
    (o.header || []).slice(0, 4).forEach(function(l, i){ font(c, 700, 3); txt(c, l, PW - M, hy + i * 4.2, 'right', P.mute); });
    if (o.logo && o.logo.width){
      var lw = 24, lh = 17, sc = Math.min(lw / o.logo.width, lh / o.logo.height);
      c.drawImage(o.logo, M, M - 1, o.logo.width * sc, o.logo.height * sc);
    }
    fit(c, o.title || '', 120, 6.6, 800); txt(c, o.title || '', PW / 2, M + 6, 'center', P.title);
    fit(c, o.sub || '', 120, 3.2, 700); txt(c, o.sub || '', PW / 2, M + 13.5, 'center', P.mute);
    var y0 = M + 21;
    c.strokeStyle = P.line; c.lineWidth = 0.35; c.beginPath(); c.moveTo(M, y0); c.lineTo(PW - M, y0); c.stroke();
    y0 += 2.5;

    // ----- منصة التتويج -----
    var pod = o.podium && o.podium.rows && o.podium.rows.length ? o.podium : null;
    if (pod){
      var ph = 58, yb = y0 + ph - 2, cw = 54, gap = 6, slots = [1, 0, 2]; // من اليمين: الثاني، الأول، الثالث
      font(c, 800, 3.8); txt(c, pod.name || '', PW - M, y0 + 3, 'right', P.title);
      var x0 = PW / 2 + (cw * 1.5 + gap);
      slots.forEach(function(si, pos){
        var s = pod.rows[si]; if (!s) return;
        var col = P.pod[Math.min(2, (s.rank || si + 1) - 1)], cx = x0 - cw / 2 - pos * (cw + gap);
        var bh = [22, 16, 11][si], bt = yb - bh, r = si === 0 ? 8.5 : 7.2;
        rr(c, cx - cw / 2 + 4, bt, cw - 8, bh, 2.2); c.fillStyle = col.f; c.fill();
        font(c, 800, si === 0 ? 8 : 6.5); txt(c, String(s.rank || si + 1), cx, bt + bh / 2 + 0.4, 'center', col.t);
        var ny = bt - 8.5;
        fit(c, s.name, cw - 2, si === 0 ? 4.4 : 4, 800); txt(c, s.name, cx, ny, 'center', P.ink);
        if (s.extra && !hide){ fit(c, s.extra, cw - 2, 2.7, 700); txt(c, s.extra, cx, ny + 4.6, 'center', P.mute); }
        var cy = ny - 4 - r - 2.2;
        c.lineWidth = 2.1; c.strokeStyle = col.f; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = col.s; c.lineCap = 'round'; c.beginPath();
        c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (hide ? 1 : clamp01(s.pct))); c.stroke(); c.lineCap = 'butt';
        if (hide){ font(c, 800, 3); txt(c, ORD[si], cx, cy + 0.3, 'center', col.t); }
        else { fit(c, s.val, r * 1.6, si === 0 ? 4.4 : 3.8, 800); num(c, s.val, cx, cy + 0.3, 'center', col.t); }
      });
      y0 += ph;
    }

    // ----- المساحة السفلية: مقارنة الفصول والتوقيع -----
    var cls = o.classes && o.classes.length > 1 ? o.classes : null;
    var foot = (cls ? 8 + cls.length * 5 : 0) + (o.teacher ? 6 : 0);
    var y2 = PH - M - foot, avail = y2 - y0 - 5; // 5 = سطر عناوين الأعمدة
    var tiers = (o.tiers || []).filter(function(t){ return t.rows && t.rows.length; });
    var L = tiers.length ? (plan(tiers, avail, 1, 8.6, 6.6) || plan(tiers, avail, 2, 8.6, 4.4) || plan(tiers, avail, 2, 4.4, 2.6)) : null;
    if (L){
      var colGap = 7, colW = L.cols === 1 ? PW - 2 * M : (PW - 2 * M - colGap) / 2;
      var cwv = hide ? 0 : (L.cols === 1 ? 15 : 11), valsW = cwv * nE;
      var nameW = L.cols === 1 ? 50 : 31;
      var colX = function(ci){ return PW - M - ci * (colW + colGap); }; // الحافة اليمنى للعمود
      // عناوين الأعمدة
      for (var ci = 0; ci < L.cols; ci++){
        var xr = colX(ci), xl = xr - colW, hy2 = y0 + 2;
        font(c, 700, 2.6);
        txt(c, 'الاسم', xr - 7, hy2, 'right', P.mute);
        if (!hide) (o.cols || []).forEach(function(lb, j){
          fit(c, lb, cwv - 0.6, 2.6, j ? 700 : 800);
          txt(c, lb, xl + valsW - j * cwv - cwv / 2, hy2, 'center', j ? P.mute : P.ink);
        });
        if (o.avg !== null && o.avg !== undefined){
          var bl = xl + valsW + 2.5;
          c.strokeStyle = P.avg; c.lineWidth = 0.35; c.setLineDash([0.8, 0.7]);
          c.beginPath(); c.moveTo(bl, hy2 - 1.6); c.lineTo(bl, hy2 + 1.6); c.stroke(); c.setLineDash([]);
          font(c, 700, 2.4); txt(c, 'متوسط الفصل', bl + 1.4, hy2, 'left', P.mute);
        }
      }
      var top = y0 + 5;
      L.items.forEach(function(it){
        var t = tiers[it.t], tc = P.tiers[Math.min(2, it.t)], xr = colX(it.col), xl = xr - colW, y = top + it.y;
        if (it.i < 0){
          rr(c, xl, y + L.hd * 0.1, colW, L.hd * 0.8, 1.4); c.fillStyle = tc.l; c.fill();
          c.fillStyle = tc.f; c.fillRect(xr - 1.2, y + L.hd * 0.1, 1.2, L.hd * 0.8);
          var hs = Math.min(3.8, L.hd * 0.55);
          font(c, 800, hs); txt(c, t.name + (it.i === -2 ? ' (تابع)' : ''), xr - 3, y + L.hd / 2, 'right', tc.t);
          font(c, 700, hs * 0.8); txt(c, t.rows.length + ' طالبًا', xl + 2, y + L.hd / 2, 'left', tc.t);
          return;
        }
        var s = t.rows[it.i], rh = L.rh, my = y + rh / 2, fs = Math.min(3.7, rh * 0.47);
        // رقم المركز داخل الفئة
        var br = Math.min(2.9, rh * 0.36), bx = xr - br - 0.6;
        c.beginPath(); c.arc(bx, my, br, 0, Math.PI * 2); c.fillStyle = tc.l; c.fill();
        c.lineWidth = 0.3; c.strokeStyle = tc.f; c.stroke();
        font(c, 800, br * 1.15); txt(c, String(s.rank), bx, my + 0.2, 'center', tc.t);
        var nx = xr - br * 2 - 2.2;
        fit(c, s.name, nameW, fs, 700); txt(c, s.name, nx, my + 0.2, 'right', P.ink);
        // الشريط من اليمين إلى اليسار
        var bR = nx - nameW - 1.5, bL = xl + valsW + 2.5, bw = Math.max(4, bR - bL), th = Math.max(1.2, rh * 0.36);
        rr(c, bR - bw, my - th / 2, bw, th, th / 2); c.fillStyle = P.track; c.fill();
        var fl = bw * clamp01(s.pct);
        if (fl > 0.3){ rr(c, bR - fl, my - th / 2, fl, th, th / 2); c.fillStyle = tc.f; c.fill(); }
        if (o.avg !== null && o.avg !== undefined){
          var ax = bR - bw * clamp01(o.avg);
          c.strokeStyle = P.avg; c.lineWidth = 0.3; c.setLineDash([0.8, 0.7]);
          c.beginPath(); c.moveTo(ax, my - th / 2 - 1); c.lineTo(ax, my + th / 2 + 1); c.stroke(); c.setLineDash([]);
        }
        if (!hide) (s.vals || []).forEach(function(v, j){
          fit(c, v, cwv - 0.6, j ? fs * 0.85 : fs, j ? 700 : 800);
          num(c, v, xl + valsW - j * cwv - cwv / 2, my + 0.2, 'center', j ? P.mute : P.ink);
        });
        c.strokeStyle = P.line; c.lineWidth = 0.2; c.beginPath(); c.moveTo(xl, y + rh); c.lineTo(xr, y + rh); c.stroke();
      });
    }

    // ----- مقارنة الفصول -----
    // مقارنة الفصول تلي آخر صف مباشرة فيبقى الفراغ (إن وُجد) أسفل الصفحة
    var fy = L ? Math.min(y2, y0 + 5 + L.items.reduce(function(a, it){ return Math.max(a, it.y + (it.i < 0 ? L.hd : L.rh)); }, 0) + 4) : y2;
    if (cls){
      c.strokeStyle = P.line; c.lineWidth = 0.35; c.beginPath(); c.moveTo(M, fy); c.lineTo(PW - M, fy); c.stroke();
      font(c, 800, 3.4); txt(c, o.classTitle || 'متوسط الفصول', PW - M, fy + 4, 'right', P.title);
      cls.forEach(function(q, i){
        var yy = fy + 9 + i * 5, xr = PW - M, xl = M + 16, w = xr - 26 - xl;
        font(c, q.me ? 800 : 700, 3); txt(c, q.label, xr, yy, 'right', q.me ? P.ink : P.mute);
        rr(c, xr - 26 - w, yy - 1.5, w, 3, 1.5); c.fillStyle = P.track; c.fill();
        var fl = w * clamp01(q.pct);
        if (fl > 0.3){ rr(c, xr - 26 - fl, yy - 1.5, fl, 3, 1.5); c.fillStyle = q.me ? P.me : P.other; c.fill(); }
        font(c, 800, 3); num(c, q.txt, M + 8, yy, 'center', q.me ? P.ink : P.mute);
      });
      fy += 8 + cls.length * 5;
    }
    if (o.teacher){ font(c, 700, 3); txt(c, o.teacher, PW / 2, fy + 3.5, 'center', P.mute); }
  }

  window.RankDraw = { draw: draw, fonts: fonts };
})();
