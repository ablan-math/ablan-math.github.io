/* game-save.js — حماية حفظ درجات الألعاب
 * المشكلة: الألعاب ترسل الدرجة بطلب واحد ولا تتحقق من نجاحه؛ فإذا فشل الطلب
 * (ازدحام، انقطاع، انتهاء مهلة القفل في الخادم) تظهر للطالب الدرجة الكاملة
 * ولا تُحفظ شيئاً، وقد تُحفظ لاحقاً محاولة أقل منها.
 * الحل: اعتراض أي طلب action=saveGrade ثم
 *   1) التأكد من أن رد الخادم status === 'success'
 *   2) إعادة المحاولة تلقائياً
 *   3) عند الفشل تُحفظ الدرجة في المتصفح (أعلى درجة لكل طالب/لعبة) وتُرسل لاحقاً
 *      عند فتح أي لعبة أو المنصة أو عودة الاتصال.
 * الخادم يحتفظ بأفضل درجة أصلاً (KEEP_BEST_GAME_GRADE) فإعادة الإرسال آمنة.
 */
(function () {
  if (window.__gameSaveGuard) return;
  window.__gameSaveGuard = true;

  var origFetch = window.fetch && window.fetch.bind(window);
  if (!origFetch) return;

  var QKEY = 'ablan_pending_saves_v1';
  var SERVER_PREFIX = 'https://script.google.com/macros/s/';
  var FOREGROUND_TRIES = 3;
  var RETRY_DELAYS = [2000, 4000];
  var ATTEMPT_TIMEOUT = 40000;
  var BG_INTERVAL = 15000;

  function isSaveUrl(u) {
    return typeof u === 'string' && u.indexOf('action=saveGrade') > -1;
  }
  function paramsOf(u) {
    try { return new URL(u).searchParams; } catch (e) { return new URLSearchParams(''); }
  }
  function keyOf(u) {
    var p = paramsOf(u);
    return [p.get('classId'), p.get('studentId'), p.get('itemId') || p.get('lessonId')].join('|');
  }
  function gradeOf(u) {
    var g = parseFloat(paramsOf(u).get('grade'));
    return isNaN(g) ? -1 : g;
  }

  // ---------- الطابور المحفوظ ----------
  function readQ() {
    try { return JSON.parse(localStorage.getItem(QKEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeQ(q) {
    try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) { /* التخزين غير متاح */ }
  }
  function enqueue(url) {
    var q = readQ(), k = keyOf(url);
    if (q[k] && gradeOf(q[k]) >= gradeOf(url)) return;   // نحتفظ بالأعلى
    q[k] = url;
    writeQ(q);
  }
  function dequeue(url) {
    var q = readQ(), k = keyOf(url);
    if (q[k] && gradeOf(q[k]) <= gradeOf(url)) { delete q[k]; writeQ(q); }
  }

  // ---------- رسالة صغيرة للطالب ----------
  var toastEl = null, toastTimer = null;
  function toast(msg, color, autoHide) {
    try {
      if (!document.body) return;
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.setAttribute('dir', 'rtl');
        toastEl.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483647;' +
          'padding:8px 14px;border-radius:10px;font:600 13px/1.4 Tahoma,Arial,sans-serif;color:#fff;' +
          'box-shadow:0 2px 10px rgba(0,0,0,.3);pointer-events:none;max-width:92vw;text-align:center';
        document.body.appendChild(toastEl);
      }
      clearTimeout(toastTimer);
      toastEl.style.background = color;
      toastEl.textContent = msg;
      toastEl.style.display = 'block';
      if (autoHide) toastTimer = setTimeout(function () { toastEl.style.display = 'none'; }, autoHide);
    } catch (e) { /* لا شيء */ }
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms + Math.random() * 800); }); }

  // محاولة واحدة: تنجح فقط إذا أعاد الخادم status === 'success'
  function attemptOnce(url, init) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ATTEMPT_TIMEOUT) : null;
    var opts = Object.assign({}, init || {});
    if (ctrl && !opts.signal) opts.signal = ctrl.signal;
    return origFetch(url, opts).then(function (res) {
      return res.clone().json().then(function (j) {
        if (j && j.status === 'success') return res;
        throw new Error((j && j.message) || 'save rejected');
      });
    }).then(function (res) { clearTimeout(timer); return res; },
            function (err) { clearTimeout(timer); throw err; });
  }

  function saveWithRetry(url, init) {
    var i = 0;
    function run() {
      return attemptOnce(url, init).catch(function (err) {
        i++;
        if (i >= FOREGROUND_TRIES) throw err;
        toast('⏳ إعادة محاولة حفظ الدرجة (' + (i + 1) + '/' + FOREGROUND_TRIES + ')…', '#d97706');
        return sleep(RETRY_DELAYS[i - 1] || 4000).then(run);
      });
    }
    return run();
  }

  // ---------- اعتراض fetch ----------
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url);
    if (!isSaveUrl(url)) return origFetch(input, init);
    toast('⏳ جارٍ حفظ الدرجة…', '#2563eb');
    return saveWithRetry(url, init).then(function (res) {
      dequeue(url);
      toast('✅ تم حفظ الدرجة', '#16a34a', 3000);
      return res;
    }, function (err) {
      enqueue(url);
      toast('⚠️ تعذّر الحفظ الآن، ستُرسل درجتك تلقائياً عند توفر الاتصال. لا تُغلق الصفحة إن أمكن.', '#dc2626', 12000);
      scheduleBg();
      throw err;
    });
  };

  // ---------- إرسال الطابور في الخلفية ----------
  var flushing = false, bgTimer = null;
  function flush() {
    if (flushing) return;
    var q = readQ(), keys = Object.keys(q);
    if (!keys.length) { clearInterval(bgTimer); bgTimer = null; return; }
    flushing = true;
    var chain = Promise.resolve();
    keys.forEach(function (k) {
      var url = q[k];
      if (typeof url !== 'string' || url.indexOf(SERVER_PREFIX) !== 0 || !isSaveUrl(url)) {
        var qq = readQ(); delete qq[k]; writeQ(qq); return;   // تجاهل أي مدخل غير موثوق
      }
      chain = chain.then(function () {
        return attemptOnce(url).then(function () {
          dequeue(url);
          toast('✅ تم إرسال درجة محفوظة سابقاً', '#16a34a', 3000);
        }, function () { /* نُبقيه للمحاولة التالية */ });
      });
    });
    chain.then(function () { flushing = false; }, function () { flushing = false; });
  }
  function scheduleBg() {
    if (!bgTimer) bgTimer = setInterval(flush, BG_INTERVAL);
  }

  window.addEventListener('online', flush);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(flush, 1500); scheduleBg(); });
  } else {
    setTimeout(flush, 1500); scheduleBg();
  }
})();
