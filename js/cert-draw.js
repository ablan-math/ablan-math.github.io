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
    var T = o.style === 'bw' ? CT_MONO : (CT_THEMES[o.theme] || CT_THEMES.navy);
    ctFrame(c, T, o);
    ctWrite(c, o, T);
  }
  function ctFrame(c, T, o){
    var m = !!T.mono;
    c.fillStyle = T.paper; c.fillRect(0, 0, 297, 210);
    if (!m){
      var g = c.createRadialGradient(148.5, 105, 40, 148.5, 105, 175);
      g.addColorStop(0, ctRgba(T.a2, 0)); g.addColorStop(1, ctRgba(T.a2, .45));
      c.fillStyle = g; c.fillRect(0, 0, 297, 210);
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
    if (o.seal) ctSeal(c, T, 48, 44, o.seal);
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
      c.textAlign = 'right'; c.fillStyle = T.p;
      o.header.forEach(function(l, i){ ctFit(c, l, '700', 4.6, F_BODY, 80); c.fillText(l, 270, 29 + i * 6.6); });
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
        c.fillStyle = T.mono ? T.p : '#ffffff';
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

  window.CertDraw = { draw: ctDraw, fonts: ctFonts, themes: CT_THEMES };
})();
