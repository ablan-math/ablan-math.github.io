// رسم شهادات الشكر والتقدير على canvas بوحدة المليمتر (A4 بالعرض 297×210).
// مشترك بين صفحة المعلم (teacher-grades.html) وصفحة الطالب (term1.html) لتتطابق الشهادة في الموضعين.
// يتطلب خطَّي Amiri و Aref Ruqaa من Google Fonts.
(function(){
  "use strict";
  var CT_THEMES = {
    navy:   { p: '#1d3461', a: '#b8912e', a2: '#ecd896', paper: '#fffdf7', ink: '#2a2f3a' },
    green:  { p: '#0e5e46', a: '#b8912e', a2: '#ecd896', paper: '#fdfdf6', ink: '#24302b' },
    maroon: { p: '#6e1a33', a: '#b8912e', a2: '#ecd896', paper: '#fffaf6', ink: '#33262a' },
    purple: { p: '#43287a', a: '#b8912e', a2: '#ecd896', paper: '#fdfbff', ink: '#2c2838' },
    teal:   { p: '#0f5f6b', a: '#b8912e', a2: '#ecd896', paper: '#fbfefd', ink: '#22302f' }
  };
  var CT_MONO = { p: '#111111', a: '#111111', a2: '#111111', paper: '#ffffff', ink: '#111111', mono: true };
  var F_TITLE = '"Aref Ruqaa", Amiri, serif', F_BODY = 'Amiri, Cairo, serif', F_UI = 'Cairo, sans-serif';
  var ctFontsP = null;
  // NF: بلا إطار (للورق المؤطَّر مسبقًا) — NB: بلا لون خلفية (للورق الملوّن)
  var NF = false, NB = false;
  // موضع الشعار/الختم: يُرسم كل شعار حول (48، 46) ثم يُنقل ويُكبَّر من هنا
  var EM = { dx: 0, dy: 0, s: 1, hide: false, moved: false };
  function withEm(c, fn){
    if (EM.hide) return;
    c.save(); c.translate(48 + EM.dx, 46 + EM.dy); c.scale(EM.s, EM.s); c.translate(-48, -46);
    fn();
    c.restore();
  }
  function ctFonts(){
    if (!ctFontsP){
      ctFontsP = Promise.all(['700 20px "Aref Ruqaa"', '400 20px Amiri', '700 20px Amiri', '700 20px Cairo'].map(function(f){
        return document.fonts && document.fonts.load ? document.fonts.load(f, 'شهادة') : null;
      })).catch(function(){});
    }
    return ctFontsP;
  }
  function ctRgba(hex, al){ var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + al + ')'; }
  function ctStar(c, x, y, r, n, ir){
    c.beginPath();
    for (var i = 0; i < n * 2; i++){ var a = Math.PI * i / n - Math.PI / 2, q = i % 2 ? ir : r; c.lineTo(x + q * Math.cos(a), y + q * Math.sin(a)); }
    c.closePath();
  }
  function ctDiamond(c, x, y, r){ c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * .7, y); c.lineTo(x, y + r); c.lineTo(x - r * .7, y); c.closePath(); }
  function ctCircle(c, x, y, r){ c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  function ctFont(c, w, size, fam){ c.font = w + ' ' + size + 'px ' + fam; }
  function ctFit(c, text, w, size, fam, maxW){
    ctFont(c, w, size, fam);
    while (size > 2 && c.measureText(text).width > maxW){ size *= .95; ctFont(c, w, size, fam); }
    return size;
  }
  function ctWrap(c, text, maxW){
    var out = [];
    String(text).split('\n').forEach(function(par){
      var cur = '';
      par.split(/\s+/).filter(Boolean).forEach(function(w){
        var t = cur ? cur + ' ' + w : w;
        if (cur && c.measureText(t).width > maxW){ out.push(cur); cur = w; } else cur = t;
      });
      if (cur) out.push(cur);
    });
    return out;
  }
  function ctDraw(cv, o, purpose){
    var c = cv.getContext('2d'), k = cv.width / 297;
    o.header = o.header || [];
    c.setTransform(k, 0, 0, k, 0, 0);
    try { c.direction = 'rtl'; } catch(e){}
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, 297, 210);
    if (o.style === 'pre'){
      // ورق جاهز: الخلفية للمعاينة فقط (أو للصورة المرسلة إن اختير)، والنص يُزاح ويُكبَّر حسب المعايرة
      if (o.bg && (purpose === 'preview' || (purpose === 'image' && o.bgInImage))) c.drawImage(o.bg, 0, 0, 297, 210);
      if ((o.grid && purpose === 'preview') || o.forceGrid) ctGrid(c);
      c.save();
      c.translate(148.5 + o.dx, 105 + o.dy); c.scale(o.scale, o.scale); c.translate(-148.5, -105);
      ctWrite(c, o, { p: o.color, a: o.color, ink: o.color, plain: true });
      c.restore();
      return;
    }
    var D = DESIGNS[o.design] || DESIGNS.classic;
    var T = o.style === 'bw' ? CT_MONO : (CT_THEMES[o.theme] || CT_THEMES.navy);
    if (D.pal && !T.mono) T = D.pal(T);
    NF = !!o.noFrame; NB = !!o.noBg;
    var pos = o.emPos || 'tl';
    EM.hide = pos === 'none';
    EM.dx = (pos === 'tr' ? 201 : 0) + (+o.emDx || 0); EM.dy = +o.emDy || 0;
    EM.s = (+o.emScale || 100) / 100; EM.mirror = pos === 'tr'; EM.moved = (+o.emDx || 0) !== 0 || EM.dy !== 0;
    D.draw(c, T, o);
    ctWrite(c, o, T);
  }
  function ctFrame(c, T, o){
    var m = !!T.mono;
    if (!NB){ c.fillStyle = T.paper; c.fillRect(0, 0, 297, 210); }
    if (!m){
      if (!NB){
        var g = c.createRadialGradient(148.5, 105, 40, 148.5, 105, 175);
        g.addColorStop(0, ctRgba(T.a2, 0)); g.addColorStop(1, ctRgba(T.a2, .45));
        c.fillStyle = g; c.fillRect(0, 0, 297, 210);
      }
      // نقش هندسي خفيف (نجمة ثمانية) + وردة كبيرة خلف النص
      c.save(); c.beginPath(); c.rect(17, 17, 263, 176); c.clip();
      c.strokeStyle = ctRgba(T.p, .055); c.lineWidth = .3;
      for (var y = 17, row = 0; y <= 195; y += 18, row++){
        for (var x = 17 + (row % 2) * 9; x <= 282; x += 18){ ctStar(c, x, y, 5, 8, 3.83); c.stroke(); }
      }
      c.strokeStyle = ctRgba(T.a, .14); c.lineWidth = .5;
      [64, 58].forEach(function(r){ ctStar(c, 148.5, 122, r, 8, r * .765); c.stroke(); });
      ctCircle(c, 148.5, 122, 44); c.stroke();
      c.restore();
    }
    if (!NF){
    c.strokeStyle = T.p; c.lineWidth = m ? 1 : 3.6; c.strokeRect(10, 10, 277, 190);
    if (!m){ c.strokeStyle = T.a; c.lineWidth = .5; c.strokeRect(12.6, 12.6, 271.8, 184.8); }
    c.strokeStyle = T.a; c.lineWidth = m ? .35 : .8; c.strokeRect(15, 15, 267, 180);
    c.lineWidth = .25; c.strokeRect(17, 17, 263, 176);
    [[15, 15], [282, 15], [15, 195], [282, 195]].forEach(function(q){
      ctStar(c, q[0], q[1], 6.5, 8, 4.97);
      c.fillStyle = m ? '#ffffff' : T.a; c.fill(); c.strokeStyle = T.p; c.lineWidth = m ? .35 : .5; c.stroke();
      ctCircle(c, q[0], q[1], 2.1); c.fillStyle = m ? '#ffffff' : T.p; c.fill(); if (m) c.stroke();
    });
    [[148.5, 15], [148.5, 195], [15, 105], [282, 105]].forEach(function(q){
      ctDiamond(c, q[0], q[1], 3.2); c.fillStyle = m ? '#ffffff' : T.a; c.fill(); c.strokeStyle = T.p; c.lineWidth = .35; c.stroke();
    });
    }
    if (o.seal) withEm(c, function(){ ctSeal(c, T, 48, 44, o.seal); });
  }
  function ctSeal(c, T, x, y, txt){
    var m = !!T.mono;
    [-1, 1].forEach(function(s){
      c.beginPath();
      c.moveTo(x + s * 2, y + 8); c.lineTo(x + s * 11, y + 6); c.lineTo(x + s * 15, y + 33);
      c.lineTo(x + s * 10.5, y + 29.5); c.lineTo(x + s * 7, y + 35); c.closePath();
      c.fillStyle = m ? '#ffffff' : T.p; c.fill(); c.strokeStyle = m ? T.p : T.a; c.lineWidth = .4; c.stroke();
    });
    ctStar(c, x, y, 17, 24, 15.2);
    if (m) c.fillStyle = '#ffffff';
    else { var g = c.createLinearGradient(x - 17, y - 17, x + 17, y + 17); g.addColorStop(0, T.a2); g.addColorStop(.5, T.a); g.addColorStop(1, T.a2); c.fillStyle = g; }
    c.fill(); c.strokeStyle = m ? T.p : T.a; c.lineWidth = .3; c.stroke();
    ctCircle(c, x, y, 12.8); c.fillStyle = m ? '#ffffff' : T.p; c.fill(); c.strokeStyle = m ? T.p : T.a2; c.lineWidth = .5; c.stroke();
    ctCircle(c, x, y, 11.2); c.lineWidth = .25; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    ctFit(c, txt, '700', 8, F_TITLE, 19);
    c.fillStyle = m ? T.p : T.a2; c.fillText(txt, x, y + .4);
    c.textBaseline = 'alphabetic';
  }
  function ctWrite(c, o, T){
    var pl = !!T.plain, cx = 148.5;
    c.textBaseline = 'alphabetic';
    var head = !pl || o.pHeader;
    if (head && o.header.length){
      var hl = o.emPos === 'tr';
      c.textAlign = hl ? 'left' : 'right'; c.fillStyle = T.p;
      o.header.forEach(function(l, i){ ctFit(c, l, '700', 4.6, F_BODY, 80); c.fillText(l, hl ? 27 : 270, 29 + i * 6.6); });
    }
    if (head && o.logo){
      var h = 22, w = h * o.logo.width / o.logo.height;
      if (w > 46){ w = 46; h = w * o.logo.height / o.logo.width; }
      c.drawImage(o.logo, cx - w / 2, 20 + (22 - h) / 2, w, h);
    }
    c.textAlign = 'center';
    if (o.title && (!pl || o.pTitle)){
      ctFit(c, o.title, '700', 17, F_TITLE, 150);
      c.fillStyle = T.p; c.fillText(o.title, cx, 63);
      if (!pl){
        c.strokeStyle = T.a; c.lineWidth = .45;
        c.beginPath(); c.moveTo(108, 69.5); c.lineTo(143, 69.5); c.moveTo(154, 69.5); c.lineTo(189, 69.5); c.stroke();
        ctDiamond(c, cx, 69.5, 2.4); c.fillStyle = T.a; c.fill();
      }
    }
    if (o.cert){
      ctFit(c, o.cert, '700', 7, F_BODY, 150);
      if (!pl){
        var tw = c.measureText(o.cert).width, x0 = cx - tw / 2 - 15, x1 = cx + tw / 2 + 15, y0 = 75, y1 = 87.5, ym = 81.25, n = 3.4;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1 - n, ym); c.lineTo(x1, y1); c.lineTo(x0, y1); c.lineTo(x0 + n, ym); c.closePath();
        c.fillStyle = T.mono ? '#ffffff' : T.p; c.fill();
        c.strokeStyle = T.mono ? T.p : T.a; c.lineWidth = T.mono ? .4 : .7; c.stroke();
        [x0 - 3.5, x1 + 3.5].forEach(function(dx){ ctDiamond(c, dx, ym, 2); c.fillStyle = T.a; c.fill(); });
        c.fillStyle = T.mono ? T.p : (T.onP || '#ffffff');
        c.fillText(o.cert, cx, 84.2);
      } else { c.fillStyle = T.p; c.fillText(o.cert, cx, 84); }
    }
    if (o.intro){ ctFit(c, o.intro, '400', 6.2, F_BODY, 230); c.fillStyle = T.ink; c.fillText(o.intro, cx, 101); }
    ctFit(c, o.student, '700', 12.5, F_BODY, 215);
    c.fillStyle = T.p; c.fillText(o.student, cx, 119.5);
    if (!pl){
      var nw = Math.min(240, c.measureText(o.student).width + 24) / 2;
      c.strokeStyle = T.a; c.lineWidth = .35;
      c.beginPath(); c.moveTo(cx - nw, 125); c.lineTo(cx - 4, 125); c.moveTo(cx + 4, 125); c.lineTo(cx + nw, 125); c.stroke();
      ctDiamond(c, cx, 125, 1.7); c.fillStyle = T.a; c.fill();
    }
    if (o.body){
      var size = 6, lines;
      for (;;){ ctFont(c, '400', size, F_BODY); lines = ctWrap(c, o.body, 215); if (lines.length <= 3 || size < 4) break; size -= .3; }
      c.fillStyle = T.ink;
      lines.forEach(function(l, i){ c.fillText(l, cx, 137 + i * size * 1.55); });
    }
    if (!pl || o.pSign){
      [[238, o.tLbl, o.teacher], [cx, o.date ? 'التاريخ' : '', o.date], [59, o.pLbl, o.prin]].forEach(function(q){
        if (!q[1] && !q[2]) return;
        ctFont(c, '700', 4.4, F_UI); c.fillStyle = T.p; c.fillText(q[1], q[0], 175);
        if (q[2]){ ctFit(c, q[2], '700', 5.4, F_BODY, 70); c.fillStyle = T.ink; c.fillText(q[2], q[0], 184); }
        else if (!pl){ c.strokeStyle = T.a; c.lineWidth = .3; c.setLineDash([.6, .9]); c.beginPath(); c.moveTo(q[0] - 22, 184); c.lineTo(q[0] + 22, 184); c.stroke(); c.setLineDash([]); }
      });
    }
  }
  function ctGrid(c){
    c.save();
    c.strokeStyle = 'rgba(37,99,235,.4)'; c.fillStyle = 'rgba(37,99,235,.9)';
    for (var x = 0; x <= 297; x += 10){ c.lineWidth = x % 50 ? .12 : .3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 210); c.stroke(); }
    for (var y = 0; y <= 210; y += 10){ c.lineWidth = y % 50 ? .12 : .3; c.beginPath(); c.moveTo(0, y); c.lineTo(297, y); c.stroke(); }
    c.textAlign = 'center'; ctFont(c, '700', 2.6, F_UI);
    for (x = 20; x < 297; x += 20) c.fillText(String(x), x, 4.5);
    for (y = 20; y < 210; y += 20) c.fillText(String(y), 5, y + 1);
    c.strokeStyle = 'rgba(220,38,38,.8)'; c.lineWidth = .3;
    c.beginPath(); c.moveTo(142.5, 105); c.lineTo(154.5, 105); c.moveTo(148.5, 99); c.lineTo(148.5, 111); c.stroke();
    c.restore();
  }

  // ===================== تصاميم الرياضيات =====================
  // كل تصميم يرسم الخلفية والإطار والشعار في مساحة الختم (أعلى اليسار ≈ 30–66 × 26–78 مم)،
  // ثم يُكتب النص بـ ctWrite. مساحة النص الوسطى (≈ 28–270 أفقياً) تبقى خالية من الزخارف الكثيفة.
  function rnd(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function ln(c, x0, y0, x1, y1){ c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  function poly(c, pts){ c.beginPath(); pts.forEach(function(p, i){ if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); }
  function paper(c, T){
    if (NB) return;
    c.fillStyle = T.paper; c.fillRect(0, 0, 297, 210);
    if (T.mono) return;
    var g = c.createRadialGradient(148.5, 105, 40, 148.5, 105, 175);
    g.addColorStop(0, ctRgba(T.a2, 0)); g.addColorStop(1, ctRgba(T.a2, .35));
    c.fillStyle = g; c.fillRect(0, 0, 297, 210);
  }
  // إطار بسيط: شريط خارجي + خط داخلي
  function frame(c, T, band){
    if (NF) return;
    c.strokeStyle = T.p; c.lineWidth = T.mono ? 1 : (band || 3); c.strokeRect(10, 10, 277, 190);
    c.strokeStyle = T.a; c.lineWidth = T.mono ? .35 : .6; c.strokeRect(14.5, 14.5, 268, 181);
  }
  function fillOr(c, T, color){ c.fillStyle = T.mono ? '#ffffff' : color; c.fill(); }
  function mathText(c, t, x, y, size, color, rot){
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    c.direction = 'ltr'; c.textAlign = 'center'; c.textBaseline = 'middle';
    ctFont(c, '700', size, F_UI); c.fillStyle = color; c.fillText(t, 0, 0);
    c.restore();
  }

  // 2) ورق المربعات + رسم بياني متصاعد
  function emGraph(c, T, x, y){
    c.beginPath(); c.rect(x - 18, y - 16, 36, 32); fillOr(c, T, T.paper); c.strokeStyle = T.p; c.lineWidth = .5; c.stroke();
    c.strokeStyle = ctRgba(T.mono ? '#111111' : T.p, .15); c.lineWidth = .15;
    for (var i = -15; i <= 15; i += 3){ ln(c, x + i, y - 14, x + i, y + 14); }
    for (i = -13; i <= 13; i += 3){ ln(c, x - 16, y + i, x + 16, y + i); }
    c.strokeStyle = T.p; c.lineWidth = .5;
    ln(c, x - 15, y + 11, x + 15, y + 11); ln(c, x - 12, y + 14, x - 12, y - 14);
    c.strokeStyle = T.a; c.lineWidth = .9; c.beginPath();
    for (var t = 0; t <= 1.0001; t += .05){ var px = x - 12 + t * 25, py = y + 11 - t * t * 21; if (t) c.lineTo(px, py); else c.moveTo(px, py); }
    c.stroke();
    [[.35], [.65], [1]].forEach(function(q){ ctCircle(c, x - 12 + q[0] * 25, y + 11 - q[0] * q[0] * 21, .9); c.fillStyle = T.p; c.fill(); });
    ctStar(c, x + 13, y - 12, 3, 5, 1.3); fillOr(c, T, T.a); c.strokeStyle = T.p; c.lineWidth = .3; c.stroke();
  }
  function dGraph(c, T, o){
    if (!NB){ c.fillStyle = T.mono ? '#ffffff' : '#f7fbff'; c.fillRect(0, 0, 297, 210); }
    if (!T.mono){
      c.save(); c.beginPath(); c.rect(14.5, 14.5, 268, 181); c.clip();
      for (var k = 0; k * 2.5 <= 268; k++){ c.strokeStyle = ctRgba(T.p, k % 4 ? .07 : .17); c.lineWidth = k % 4 ? .12 : .25; ln(c, 14.5 + k * 2.5, 14.5, 14.5 + k * 2.5, 195.5); }
      for (k = 0; k * 2.5 <= 181; k++){ c.strokeStyle = ctRgba(T.p, k % 4 ? .07 : .17); c.lineWidth = k % 4 ? .12 : .25; ln(c, 14.5, 14.5 + k * 2.5, 282.5, 14.5 + k * 2.5); }
      // منحنى صاعد خلف النص
      c.strokeStyle = ctRgba(T.a, .3); c.lineWidth = 1.2; c.beginPath();
      for (var t = 0; t <= 1.0001; t += .02){ var px = 24 + t * 250, py = 186 - Math.pow(t, 2.2) * 150; if (t) c.lineTo(px, py); else c.moveTo(px, py); }
      c.stroke();
      c.strokeStyle = ctRgba(T.p, .35); c.lineWidth = .5; ln(c, 20, 188, 278, 188); ln(c, 24, 192, 24, 24);
      c.restore();
    }
    frame(c, T, 3);
    c.strokeStyle = T.a; c.lineWidth = .25;
    if (!NF) for (k = 0; k * 2.5 <= 268; k++){ var L = k % 10 === 0 ? 4 : (k % 2 ? 1.3 : 2.4), x = 14.5 + k * 2.5; ln(c, x, 14.5, x, 14.5 + L); ln(c, x, 195.5, x, 195.5 - L); }
    withEm(c, function(){
    emGraph(c, T, 48, 46);
    });
  }

  // 3) السبورة
  function dChalk(c, T, o){
    if (T.mono){ c.fillStyle = '#ffffff'; c.fillRect(0, 0, 297, 210); frame(c, T); if (o.seal) withEm(c, function(){ ctSeal(c, T, 48, 44, o.seal); }); return; }
    var w = c.createLinearGradient(0, 0, 297, 210); w.addColorStop(0, '#9a6a3a'); w.addColorStop(.5, '#7a4f28'); w.addColorStop(1, '#94643a');
    c.fillStyle = w; if (!NF) c.fillRect(0, 0, 297, 210);
    var g = c.createRadialGradient(148.5, 100, 20, 148.5, 105, 170); g.addColorStop(0, '#2f5d4f'); g.addColorStop(1, '#1d3a31');
    c.fillStyle = g; if (NF) c.fillRect(0, 0, 297, 210); else c.fillRect(9, 9, 279, 192);
    var r = rnd(7);
    for (var i = 0; i < 420; i++){ c.fillStyle = 'rgba(255,255,255,' + (.02 + r() * .05) + ')'; c.fillRect(9 + r() * 279, 9 + r() * 192, .4 + r() * 1.2, .3); }
    [['a² + b² = c²', 72, 98, -.12, 6], ['π ≈ 3.14', 244, 64, .1, 7], ['∑', 30, 150, 0, 11], ['√2', 266, 120, -.1, 8], ['y = mx + b', 232, 104, .06, 5.5],
     ['x²', 40, 120, .2, 8], ['∞', 268, 160, 0, 10], ['½ + ¼ = ¾', 76, 160, -.06, 5.5], ['Δ', 200, 40, 0, 7], ['%', 112, 44, .2, 8]].forEach(function(q){
      mathText(c, q[0], q[1], q[2], q[4], 'rgba(255,255,255,.12)', q[3]);
    });
    if (!NF){
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = .35; c.setLineDash([2.2, 1.4]); c.strokeRect(14.5, 14.5, 268, 181); c.setLineDash([]);
    c.fillStyle = '#6b4423'; c.fillRect(60, 201, 177, 4.5);
    [[100, '#fdfdf2'], [112, '#f4d35e'], [180, '#f28b82']].forEach(function(q){ c.fillStyle = q[1]; c.fillRect(q[0], 201.6, 9, 1.8); });
    }
    withEm(c, function(){
    ctCircle(c, 48, 44, 15); c.strokeStyle = '#f4d35e'; c.lineWidth = .9; c.stroke();
    ctStar(c, 48, 44, 12, 5, 5); c.strokeStyle = 'rgba(253,253,242,.85)'; c.lineWidth = .6; c.stroke();
    if (o.seal){ c.textAlign = 'center'; c.textBaseline = 'middle'; ctFit(c, o.seal, '700', 6, F_TITLE, 18); c.fillStyle = '#f4d35e'; c.fillText(o.seal, 48, 45); c.textBaseline = 'alphabetic'; }
    });
  }

  // 4) رموز رياضية
  function dSymbols(c, T, o){
    paper(c, T);
    if (!T.mono){
      c.save(); c.beginPath(); c.rect(15, 15, 267, 180); c.clip();
      var S = ['+', '−', '×', '÷', '=', 'π', '√', '∑', '∞', '%', '<', '>', '≠', '∫', 'Δ', 'θ'], r = rnd(11);
      for (var y = 20, row = 0; y < 195; y += 17, row++){
        for (var x = 20 + (row % 2) * 10; x < 282; x += 20){ var q = r() < .35; mathText(c, S[Math.floor(r() * S.length)], x, y, 7 + r() * 4, q ? ctRgba(T.a, .22) : ctRgba(T.p, .11), (r() - .5) * .8); }
      }
      c.restore();
    }
    frame(c, T, 3.4);
    if (!NF) [[15, 15, '+'], [282, 15, '−'], [15, 195, '×'], [282, 195, '÷']].forEach(function(q){
      ctCircle(c, q[0], q[1], 6.2); fillOr(c, T, T.p); c.strokeStyle = T.a; c.lineWidth = .7; c.stroke();
      mathText(c, q[2], q[0], q[1] + .2, 7, T.mono ? '#111111' : '#ffffff');
    });
    if (o.seal) withEm(c, function(){ ctSeal(c, T, 48, 44, o.seal); });
  }

  // 5) فيثاغورس
  function dPyth(c, T, o){
    paper(c, T);
    if (!T.mono){
      // مثلث قائم كبير خلف النص بأضلاعه a و b و c
      c.save(); c.globalAlpha = .1;
      poly(c, [[70, 172], [232, 172], [70, 70]]); c.fillStyle = T.a2; c.fill(); c.strokeStyle = T.p; c.lineWidth = 1.4; c.stroke();
      c.lineWidth = .8; c.strokeRect(70, 164, 8, 8);
      c.restore();
      [['a', 151, 180], ['b', 61, 121], ['c', 158, 115]].forEach(function(q){ mathText(c, q[0], q[1], q[2], 9, ctRgba(T.p, .16)); });
      // شريطان جانبيان بمربعات a² و b² و c²
      if (!NF) [[18, 1], [279, -1]].forEach(function(s){
        [[T.a2, 6], [ctRgba(T.p, .3), 4.5], [T.a, 7.5]].forEach(function(q, i){
          var y = 120 + i * 20; c.fillStyle = q[0]; c.fillRect(s[0] - q[1] / 2, y, q[1], q[1]);
        });
      });
    }
    frame(c, T, 2.6);
    c.strokeStyle = T.p; c.lineWidth = .35;
    if (!NF) [[14.5, 14.5, 1, 1], [282.5, 14.5, -1, 1], [14.5, 195.5, 1, -1], [282.5, 195.5, -1, -1]].forEach(function(q){
      c.strokeRect(Math.min(q[0], q[0] + q[2] * 5), Math.min(q[1], q[1] + q[3] * 5), 5, 5);
    });
    withEm(c, function(){
    var A = [40, 54], B = [54, 54], C = [40, 43.5], n = [10.5, -14];
    poly(c, [A, B, [54, 68], [40, 68]]); fillOr(c, T, T.a2); c.strokeStyle = T.p; c.lineWidth = .45; c.stroke();
    poly(c, [A, C, [29.5, 43.5], [29.5, 54]]); fillOr(c, T, ctRgba(T.p, .25)); c.stroke();
    poly(c, [B, C, [C[0] + n[0], C[1] + n[1]], [B[0] + n[0], B[1] + n[1]]]); fillOr(c, T, T.a); c.stroke();
    poly(c, [A, B, C]); fillOr(c, T, T.paper); c.lineWidth = .7; c.stroke();
    c.lineWidth = .3; c.strokeRect(40, 51.5, 2.5, 2.5);
    mathText(c, 'a²', 47, 61.5, 3.4, T.p); mathText(c, 'b²', 34.7, 48.8, 3.4, T.mono ? '#111111' : '#ffffff');
    mathText(c, 'c²', 52.2, 36.8, 3.6, T.mono ? '#111111' : '#ffffff');
    mathText(c, 'a² + b² = c²', 46, 74, 3.4, T.p);
    });
  }

  // 6) باي π: أرقام π تدور حول الإطار
  var PI_DIGITS = '3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912';
  function dPi(c, T, o){
    if (T.mono){ c.fillStyle = '#ffffff'; c.fillRect(0, 0, 297, 210); }
    else {
      // شريط داكن تدور فيه أرقام π بالذهبي
      if (!NF){ c.fillStyle = T.p; c.fillRect(0, 0, 297, 210); }
      var bx = NF ? 0 : 17.6, bw = NF ? 297 : 261.8, bh = NF ? 210 : 174.8;
      if (!NB){
        c.fillStyle = T.paper; c.fillRect(bx, bx, bw, bh);
        var g = c.createRadialGradient(148.5, 105, 40, 148.5, 105, 170); g.addColorStop(0, ctRgba(T.a2, 0)); g.addColorStop(1, ctRgba(T.a2, .35));
        c.fillStyle = g; c.fillRect(bx, bx, bw, bh);
      }
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; ctFont(c, '700', 150, F_BODY); c.fillStyle = ctRgba(T.p, .045); c.fillText('π', 148.5, 112); c.restore();
    }
    if (!NF){
    c.strokeStyle = T.p; c.lineWidth = T.mono ? .8 : .6; c.strokeRect(9, 9, 279, 192);
    c.strokeStyle = T.a; c.lineWidth = .7; c.strokeRect(17.6, 17.6, 261.8, 174.8);
    var i = 0, step = 2.15, col = T.mono ? '#111111' : T.a2;
    function side(x0, y0, dx, dy, len, rot){ for (var d = 0; d < len; d += step){ mathText(c, PI_DIGITS.charAt(i++ % PI_DIGITS.length), x0 + dx * d, y0 + dy * d, 2.9, col, rot); } }
    side(14, 13.3, 1, 0, 270, 0); side(283.7, 14, 0, 1, 183, Math.PI / 2); side(283, 196.7, -1, 0, 270, Math.PI); side(13.3, 196, 0, -1, 183, -Math.PI / 2);
    }
    withEm(c, function(){
    ctCircle(c, 48, 44, 16); fillOr(c, T, T.p); c.strokeStyle = T.a; c.lineWidth = .8; c.stroke();
    ctCircle(c, 48, 44, 13.8); c.strokeStyle = T.mono ? '#111111' : T.a2; c.lineWidth = .3; c.stroke();
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; ctFont(c, '700', 22, F_BODY); c.fillStyle = T.mono ? '#111111' : T.a2; c.fillText('π', 48, 43); c.restore();
    });
  }

  // 7) الفرجار والمسطرة: دوائر متداخلة في الزوايا + منقلة
  function dCompass(c, T, o){
    paper(c, T);
    c.save(); c.beginPath(); c.rect(14.5, 14.5, 268, 181); c.clip();
    c.strokeStyle = T.mono ? 'rgba(0,0,0,.35)' : ctRgba(T.a, .8); c.lineWidth = .45;
    if (!NF) [[14.5, 14.5], [282.5, 14.5], [14.5, 195.5], [282.5, 195.5]].forEach(function(q){
      ctCircle(c, q[0], q[1], 13); c.stroke();
      for (var k = 0; k < 6; k++){ ctCircle(c, q[0] + 13 * Math.cos(k * Math.PI / 3), q[1] + 13 * Math.sin(k * Math.PI / 3), 13); c.stroke(); }
      ctCircle(c, q[0], q[1], 26); c.stroke();
    });
    if (!T.mono){
      // «زهرة» إنشاءات الفرجار خلف النص
      c.strokeStyle = ctRgba(T.p, .07); c.lineWidth = .5;
      ctCircle(c, 148.5, 118, 38); c.stroke();
      for (var j = 0; j < 6; j++){ ctCircle(c, 148.5 + 38 * Math.cos(j * Math.PI / 3), 118 + 38 * Math.sin(j * Math.PI / 3), 38); c.stroke(); }
      ctCircle(c, 148.5, 118, 76); c.stroke();
    }
    c.restore();
    frame(c, T, 2.6);
    c.strokeStyle = T.p; c.lineWidth = .22;
    if (!NF) for (var k = 0; k * 2.5 <= 120; k++){ var L = k % 10 === 0 ? 4 : (k % 2 ? 1.3 : 2.4); ln(c, 14.5, 45 + k * 2.5, 14.5 + L, 45 + k * 2.5); ln(c, 282.5, 45 + k * 2.5, 282.5 - L, 45 + k * 2.5); }
    withEm(c, function(){
    var x = 48, y = 56, R = 18;
    c.beginPath(); c.arc(x, y, R, Math.PI, 2 * Math.PI); c.closePath(); fillOr(c, T, ctRgba(T.a2, .7)); c.strokeStyle = T.p; c.lineWidth = .5; c.stroke();
    c.beginPath(); c.arc(x, y, R - 6, Math.PI, 2 * Math.PI); c.lineWidth = .25; c.stroke();
    for (var d = 0; d <= 180; d += 10){ var a = Math.PI + d * Math.PI / 180, l = d % 30 ? 2 : 3.6; ln(c, x + R * Math.cos(a), y + R * Math.sin(a), x + (R - l) * Math.cos(a), y + (R - l) * Math.sin(a)); }
    c.strokeStyle = T.mono ? '#111111' : T.a; c.lineWidth = .7; ln(c, x, y, x + (R - 2) * Math.cos(Math.PI * 4 / 3), y + (R - 2) * Math.sin(Math.PI * 4 / 3));
    ctCircle(c, x, y, 1.1); c.fillStyle = T.p; c.fill();
    mathText(c, '60°', x - 1, y - 6, 3, T.p);
    });
  }

  // 8) مثلث سيربنسكي في الزوايا
  function sier(c, x, y, s, up, depth){
    if (depth === 0){ var h = s * .866; poly(c, up ? [[x, y - h], [x + s / 2, y], [x - s / 2, y]] : [[x, y + h], [x + s / 2, y], [x - s / 2, y]]); c.fill(); return; }
    var h2 = s * .866 / 2, sg = up ? -1 : 1;
    sier(c, x, y + sg * h2, s / 2, up, depth - 1); sier(c, x - s / 4, y, s / 2, up, depth - 1); sier(c, x + s / 4, y, s / 2, up, depth - 1);
  }
  function dSier(c, T, o){
    paper(c, T);
    if (!T.mono){ c.fillStyle = ctRgba(T.p, .05); sier(c, 148.5, 178, 130, true, 5); }
    frame(c, T, 3);
    // على الجانبين (بعيدًا عن الترويسة والتوقيعات)
    if (!NF){
    c.fillStyle = T.mono ? '#111111' : T.a;
    sier(c, 24, 124, 17, true, 4); sier(c, 273, 124, 17, true, 4);
    c.fillStyle = T.mono ? '#111111' : T.p;
    sier(c, 24, 128, 17, false, 4); sier(c, 273, 128, 17, false, 4);
    }
    if (o.seal) withEm(c, function(){ ctSeal(c, T, 48, 44, o.seal); });
  }

  // 9) الأرقام الملوّنة
  var KIDS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  function dNumbers(c, T, o){
    if (!NB){ c.fillStyle = T.mono ? '#ffffff' : '#fffef7'; c.fillRect(0, 0, 297, 210); }
    var r = rnd(5), n = 0;
    function put(x, y){ mathText(c, String(n % 10), x, y, 7, T.mono ? '#111111' : KIDS[n % KIDS.length], (r() - .5) * .7); n++; }
    if (!NF){
    for (var x = 16; x <= 282; x += 9){ put(x, 15.5); put(x, 194.5); }
    for (var y = 26; y <= 184; y += 9.5){ put(15.5, y); put(281.5, y); }
    c.strokeStyle = T.p; c.lineWidth = .5; c.setLineDash([1.6, 1]); c.strokeRect(22, 22, 253, 166); c.setLineDash([]);
    }
    withEm(c, function(){
    ctStar(c, 48, 45, 16, 5, 7.5); fillOr(c, T, '#f59e0b'); c.strokeStyle = T.mono ? '#111111' : '#d97706'; c.lineWidth = .6; c.stroke();
    if (o.seal){ c.textAlign = 'center'; c.textBaseline = 'middle'; ctFit(c, o.seal, '700', 5.2, F_TITLE, 12); c.fillStyle = T.mono ? '#111111' : '#ffffff'; c.fillText(o.seal, 48, 46.5); c.textBaseline = 'alphabetic'; }
    });
  }

  // 10) خلايا سداسية
  function hex(c, x, y, r){ var p = []; for (var k = 0; k < 6; k++){ var a = Math.PI / 3 * k; p.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } poly(c, p); }
  function dHex(c, T, o){
    paper(c, T);
    var r = rnd(3), R = 4.2, dy = R * 1.732;
    if (!NF) [[14, 1], [283, -1]].forEach(function(q){
      for (var col = 0; col < 2; col++){
        var x = q[0] + q[1] * col * R * 1.5;
        for (var y = 12 + col * dy / 2; y < 200; y += dy){
          hex(c, x, y, R - .35);
          if (T.mono){ c.strokeStyle = '#111111'; c.lineWidth = .3; c.stroke(); }
          else { c.fillStyle = r() < .25 ? ctRgba(T.a, .55 + r() * .4) : ctRgba(T.p, (col ? .12 : .35) + r() * .45); c.fill(); }
        }
      }
    });
    if (!NF){
    c.strokeStyle = T.p; c.lineWidth = T.mono ? .8 : 2.4; ln(c, 26, 10, 271, 10); ln(c, 26, 200, 271, 200);
    c.strokeStyle = T.a; c.lineWidth = .5; ln(c, 26, 14, 271, 14); ln(c, 26, 196, 271, 196);
    }
    withEm(c, function(){
    hex(c, 48, 45, 17); fillOr(c, T, T.p); c.strokeStyle = T.a; c.lineWidth = .8; c.stroke();
    hex(c, 48, 45, 14.3); c.strokeStyle = T.mono ? '#111111' : T.a2; c.lineWidth = .3; c.stroke();
    if (o.seal){ c.textAlign = 'center'; c.textBaseline = 'middle'; ctFit(c, o.seal, '700', 8, F_TITLE, 19); c.fillStyle = T.mono ? '#111111' : T.a2; c.fillText(o.seal, 48, 45.5); c.textBaseline = 'alphabetic'; }
    });
  }

  // 11) الرسم البياني: أعمدة متصاعدة وسهم نمو
  function dChart(c, T, o){
    if (!T.mono && !NB){ c.fillStyle = ctRgba(T.p, .04); c.fillRect(0, 0, 297, 210); }
    if (!T.mono && !NF){
      var g = c.createLinearGradient(0, 0, 297, 0); g.addColorStop(0, T.p); g.addColorStop(1, T.a);
      c.fillStyle = g; c.fillRect(0, 0, 297, 7); c.fillRect(0, 203, 297, 7);
    }
    if (!NF){ c.strokeStyle = T.p; c.lineWidth = T.mono ? .8 : .5; c.strokeRect(12, 12, 273, 186); }
    withEm(c, function(){
    var base = 62, xs = [33, 40.5, 48, 55.5], hs = [9, 15, 22, 30];
    xs.forEach(function(x, i){
      c.beginPath(); c.rect(x, base - hs[i], 5.5, hs[i]);
      if (T.mono){ c.strokeStyle = '#111111'; c.lineWidth = .4; c.stroke(); }
      else { var bg = c.createLinearGradient(0, base - hs[i], 0, base); bg.addColorStop(0, T.a); bg.addColorStop(1, T.p); c.fillStyle = bg; c.fill(); }
    });
    c.strokeStyle = T.p; c.lineWidth = .5; ln(c, 30, base, 65, base);
    c.strokeStyle = T.mono ? '#111111' : T.a; c.lineWidth = 1;
    c.beginPath(); c.moveTo(31, base - 12); c.lineTo(41, base - 19); c.lineTo(48, base - 24); c.lineTo(60, base - 36); c.stroke();
    poly(c, [[62.5, base - 38.5], [56.2, base - 37], [60.8, base - 32.5]]); c.fillStyle = T.mono ? '#111111' : T.a; c.fill();
    mathText(c, '↑ 100%', 47, base + 5, 3.6, T.p);
    });
  }

  // 12) النسبة الذهبية
  function dGolden(c, T, o){
    paper(c, T);
    var x = 148.5 - 85, y = 120 - 52.5, w = 170, h = 105, sq = [], arcs = [];
    c.save();
    for (var i = 0; i < 10; i++){
      var s, d = i % 4;
      if (d === 0){ s = h; sq.push([x, y, s, s]); arcs.push([x + s, y + s, s, Math.PI, 1.5 * Math.PI]); x += s; w -= s; }
      else if (d === 1){ s = w; sq.push([x, y, s, s]); arcs.push([x, y + s, s, 1.5 * Math.PI, 2 * Math.PI]); y += s; h -= s; }
      else if (d === 2){ s = h; sq.push([x + w - s, y, s, s]); arcs.push([x + w - s, y, s, 0, .5 * Math.PI]); w -= s; }
      else { s = w; sq.push([x, y + h - s, s, s]); arcs.push([x + s, y + h - s, s, .5 * Math.PI, Math.PI]); h -= s; }
    }
    c.strokeStyle = T.mono ? 'rgba(0,0,0,.12)' : ctRgba(T.a, .22); c.lineWidth = .3;
    sq.forEach(function(q){ c.strokeRect(q[0], q[1], q[2], q[3]); });
    c.strokeStyle = T.mono ? 'rgba(0,0,0,.25)' : ctRgba(T.a, .45); c.lineWidth = .6;
    arcs.forEach(function(a){ c.beginPath(); c.arc(a[0], a[1], a[2], a[3], a[4]); c.stroke(); });
    c.restore();
    if (!NF){
    c.strokeStyle = T.p; c.lineWidth = T.mono ? .8 : 1.6; c.strokeRect(10, 10, 277, 190);
    c.strokeStyle = T.a; c.lineWidth = .4; c.strokeRect(13.5, 13.5, 270, 183);
    c.strokeStyle = T.a; c.lineWidth = 1.2;
    [[17, 17, 1, 1], [280, 17, -1, 1], [17, 193, 1, -1], [280, 193, -1, -1]].forEach(function(q){
      c.beginPath(); c.moveTo(q[0], q[1] + q[3] * 14); c.lineTo(q[0], q[1]); c.lineTo(q[0] + q[2] * 14, q[1]); c.stroke();
    });
    }
    withEm(c, function(){
    ctCircle(c, 48, 44, 15.5); fillOr(c, T, T.p); c.strokeStyle = T.a; c.lineWidth = 1; c.stroke();
    ctCircle(c, 48, 44, 13); c.strokeStyle = T.mono ? '#111111' : T.a2; c.lineWidth = .3; c.stroke();
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; ctFont(c, '700', 17, F_BODY); c.fillStyle = T.mono ? '#111111' : T.a2; c.fillText('φ', 48, 43.5); c.restore();
    mathText(c, '1.618', 48, 64, 3.4, T.a);
    });
  }

  // 13) مكعبات ثلاثية الأبعاد
  function cube(c, T, x, y, s, shades){
    var h = s * .866;
    poly(c, [[x, y - s], [x + h, y - s / 2], [x, y], [x - h, y - s / 2]]); c.fillStyle = shades[0]; c.fill();
    poly(c, [[x - h, y - s / 2], [x, y], [x, y + s], [x - h, y + s / 2]]); c.fillStyle = shades[1]; c.fill();
    poly(c, [[x + h, y - s / 2], [x, y], [x, y + s], [x + h, y + s / 2]]); c.fillStyle = shades[2]; c.fill();
    if (T.mono){ c.strokeStyle = '#111111'; c.lineWidth = .25;
      poly(c, [[x, y - s], [x + h, y - s / 2], [x + h, y + s / 2], [x, y + s], [x - h, y + s / 2], [x - h, y - s / 2]]); c.stroke();
      ln(c, x, y, x, y + s); ln(c, x, y, x - h, y - s / 2); ln(c, x, y, x + h, y - s / 2); }
  }
  function dCubes(c, T, o){
    paper(c, T);
    var sh = T.mono ? ['#ffffff', '#ffffff', '#ffffff'] : [T.a2, T.p, ctRgba(T.p, .7)], s = 4.2, h = s * .866;
    if (!NF) [[9, 25], [185, 201]].forEach(function(b){
      c.save(); c.beginPath(); c.rect(9, b[0], 279, b[1] - b[0]); c.clip();
      for (var row = 0, y = b[0] + s * .5; y < b[1] + s; y += s * 1.5, row++){
        for (var x = 9 + (row % 2) * h; x < 290; x += 2 * h) cube(c, T, x, y, s, sh);
      }
      c.restore();
    });
    if (!NF){
    c.strokeStyle = T.p; c.lineWidth = T.mono ? .8 : 1.2; c.strokeRect(9, 9, 279, 192);
    c.strokeStyle = T.a; c.lineWidth = .5; ln(c, 9, 27, 288, 27); ln(c, 9, 183, 288, 183);
    }
    withEm(c, function(){
    cube(c, T, 48, 48, 15, T.mono ? sh : [T.a2, T.p, ctRgba(T.p, .75)]);
    ctStar(c, 48, 40.5, 4.2, 5, 1.8); fillOr(c, T, T.a); c.strokeStyle = T.p; c.lineWidth = .3; c.stroke();
    });
  }

  // 14) اللانهاية: مثلثات لونية في زاويتين + ∞
  function dInf(c, T, o){
    if (!NB){ c.fillStyle = T.mono ? '#ffffff' : T.paper; c.fillRect(0, 0, 297, 210); }
    if (!T.mono && !NF){
      // المثلثان يتبعان الختم: أعلى اليسار عادةً، وينعكسان إن نُقل الختم لليمين
      c.save(); if (EM.mirror){ c.translate(297, 0); c.scale(-1, 1); }
      poly(c, [[0, 0], [82, 0], [0, 58]]); c.fillStyle = T.p; c.fill();
      poly(c, [[82, 0], [90, 0], [0, 63.5], [0, 58]]); c.fillStyle = T.a; c.fill();
      poly(c, [[297, 210], [245, 210], [297, 172]]); c.fillStyle = T.p; c.fill();
      poly(c, [[245, 210], [238, 210], [297, 167], [297, 172]]); c.fillStyle = T.a; c.fill();
      c.restore();
    }
    if (!NF){ c.strokeStyle = T.p; c.lineWidth = T.mono ? .8 : .4; c.strokeRect(10, 10, 277, 190); }
    withEm(c, function(){
    if (EM.mirror) c.translate(36, 0); // يبقى ∞ فوق المثلث المنعكس (297 − 30)
    c.strokeStyle = T.mono ? '#111111' : ((NF || EM.moved) ? T.p : '#ffffff'); c.lineWidth = 1.6; c.beginPath();
    for (var t = 0; t <= 2 * Math.PI + .01; t += .05){ var d = 1 + Math.sin(t) * Math.sin(t), px = 30 + 13 * Math.cos(t) / d, py = 24 + 13 * Math.sin(t) * Math.cos(t) / d; if (t) c.lineTo(px, py); else c.moveTo(px, py); }
    c.stroke();
    });
  }

  // 15) التانجرام
  var TANGRAM = [[[0, 0], [4, 0], [2, 2]], [[0, 0], [2, 2], [0, 4]], [[4, 0], [4, 2], [3, 1]], [[3, 1], [4, 2], [3, 3], [2, 2]],
                 [[2, 2], [3, 3], [1, 3]], [[0, 4], [1, 3], [3, 3], [2, 4]], [[4, 2], [4, 4], [2, 4]]];
  function tangram(c, T, x, y, size, rot){
    var u = size / 4;
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.translate(-size / 2, -size / 2);
    TANGRAM.forEach(function(p, i){
      poly(c, p.map(function(q){ return [q[0] * u, q[1] * u]; }));
      c.fillStyle = T.mono ? '#ffffff' : KIDS[i % KIDS.length]; c.fill();
      c.strokeStyle = T.mono ? '#111111' : '#ffffff'; c.lineWidth = .5; c.stroke();
    });
    c.restore();
  }
  function dTangram(c, T, o){
    paper(c, T);
    frame(c, T, 2.6);
    if (!NF) [[15, 15], [282, 15], [15, 195], [282, 195]].forEach(function(q, i){ tangram(c, T, q[0], q[1], 11, Math.PI / 4 + i * Math.PI / 2); });
    withEm(c, function(){
    tangram(c, T, 48, 45, 28, Math.PI / 4);
    });
  }

  var DESIGNS = {
    classic:  { name: 'كلاسيكي بزخرفة هندسية', draw: ctFrame },
    graph:    { name: 'ورق المربعات', draw: dGraph },
    chalk:    { name: 'السبورة', draw: dChalk, fixed: true,
                pal: function(){ return { p: '#fbfbf2', a: '#f4d35e', a2: '#f4d35e', paper: '#23443a', ink: '#e6eee3', onP: '#1d3a31' }; } },
    symbols:  { name: 'رموز رياضية', draw: dSymbols },
    pyth:     { name: 'فيثاغورس', draw: dPyth },
    pi:       { name: 'باي π', draw: dPi },
    compass:  { name: 'المنقلة والفرجار', draw: dCompass },
    sier:     { name: 'مثلث سيربنسكي', draw: dSier },
    numbers:  { name: 'الأرقام الملوّنة', draw: dNumbers },
    hex:      { name: 'خلايا سداسية', draw: dHex },
    chart:    { name: 'الرسم البياني', draw: dChart },
    golden:   { name: 'النسبة الذهبية', draw: dGolden, fixed: true,
                pal: function(){ return { p: '#1c1c1c', a: '#b08a2e', a2: '#e9d18f', paper: '#fffcf3', ink: '#2b2b2b' }; } },
    cubes:    { name: 'مكعبات ثلاثية الأبعاد', draw: dCubes },
    inf:      { name: 'اللانهاية ∞', draw: dInf },
    tangram:  { name: 'التانجرام', draw: dTangram }
  };
  var DESIGN_LIST = Object.keys(DESIGNS).map(function(k){ return { id: k, name: DESIGNS[k].name, fixed: !!DESIGNS[k].fixed }; });

  window.CertDraw = { draw: ctDraw, fonts: ctFonts, themes: CT_THEMES, designs: DESIGN_LIST };
})();
