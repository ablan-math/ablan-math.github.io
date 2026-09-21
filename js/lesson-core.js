/* =====================================================================
   lesson-core.js  —  الكود المشترك لجميع صفحات الدروس
   تعديل هذا الملف يغيّر كل الدروس دفعة واحدة.
   كل صفحة درس تعرّف فقط: LESSON_ID و generateQuiz().
   ===================================================================== */
(function () {
  'use strict';
 
  // الفصل الدراسي الأول. صفحات الفصل الثاني تعرّف window.PLATFORM_SCRIPT_URL قبل تحميل هذا الملف.
  var SCRIPT_URL = window.PLATFORM_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzrf1-At3Pq7i39bGV3F1iD3-b0G-WWyRi5cgpKeQjyn_N5fh2EmGhoyRKUsbLd-F_UJQ/exec";
 
  var currentQuestions = [];
  var activeAttemptId = null;   // رمز المحاولة الجارية (يأتي من الخادم عند بدء الاختبار)
  var serverOffsetMs = 0;       // فرق ساعة الخادم عن ساعة الجهاز، حتى لا يتلاعب الطالب بساعة جهازه
  var countdownTimer = null;
 
  function $(id) { return document.getElementById(id); }
  function toAr(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[+d]; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
 
  // ---------------------------------------------------------------- عام
  function getStudentFromStorage() {
    var s = localStorage.getItem('currentStudent');
    if (s) { try { return JSON.parse(s); } catch (e) { return null; } }
    return null;
  }
 
  function buildHeader(studentData, lessonTitle) {
    var headerContainer = $('main-header');
    if (!headerContainer) return;
    var titleHtml;
    if (lessonTitle) {
      titleHtml = '<div><h2 class="text-sm text-gray-500 leading-tight">منصة الرياضيات التفاعلية</h2><h1 class="text-xl font-bold text-indigo-700 leading-tight">' + lessonTitle + '</h1></div>';
    } else {
      titleHtml = '<a href="../index.html" target="_top"><h1 class="text-2xl font-bold text-blue-800">منصة الرياضيات التفاعلية</h1></a>';
    }
    var backLink = '<a href="../index.html" target="_top" class="text-xs text-blue-600 hover:underline">&larr; العودة إلى الفهرس</a>';
    var userInfoHtml;
    if (studentData) {
      userInfoHtml = '<div class="flex items-center gap-4"><div class="text-right"><span class="font-semibold block">أهلاً، ' + esc(studentData.name) + '</span>' + backLink + '</div><a href="../index.html" target="_top" id="logout-link" class="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600 self-start">خروج</a></div>';
    } else {
      userInfoHtml = '<div class="text-right"><p class="text-lg text-gray-600">زائر</p>' + backLink + '</div>';
    }
    headerContainer.innerHTML = '<div class="container mx-auto px-6 py-4 flex justify-between items-center">' + titleHtml + userInfoHtml + '</div>';
    var logoutLink = headerContainer.querySelector('#logout-link');
    if (logoutLink) logoutLink.addEventListener('click', function () { localStorage.removeItem('currentStudent'); });
  }
 
  function buildFooter() {
    var footerContainer = $('main-footer');
    if (!footerContainer) return;
    footerContainer.innerHTML = '<div class="container mx-auto px-6"><p class="text-center text-gray-600 text-sm">© 2024 جميع الحقوق محفوظة | تصميم وتطوير: أ. عبدالعزيز خالد العبلان</p></div>';
  }
 
  function showExplanation(questionIndex, isSmart) {
    var modal = $('explanationModal'), explanationText = $('explanationText'), modalTitle = $('modal-title');
    var question = currentQuestions[questionIndex];
    if (modal && explanationText && modalTitle && question) {
      if (isSmart && question.smartExplanation) {
        modalTitle.innerHTML = '💡 الحل الذكي';
        explanationText.innerHTML = '<p class="text-lg">' + question.smartExplanation + '</p>';
      } else {
        modalTitle.innerHTML = '💡 شرح الإجابة';
        explanationText.innerHTML = question.explanation;
      }
      modal.classList.remove('hidden');
    }
  }
  function closeModal() { var m = $('explanationModal'); if (m) m.classList.add('hidden'); }
 
  // ---------------------------------------------------------------- الخادم
  // طلب واحد. أخطاء الاتصال أو الرد غير JSON تُعلَّم transport=true لتُعاد، وأخطاء الخادم المفهومة server=true فلا تُعاد.
  function apiOnce(action, params) {
    var q = new URLSearchParams(Object.assign({ action: action }, params, { t: Date.now() }));
    return fetch(SCRIPT_URL + '?' + q.toString()).then(function (r) { return r.text(); }, function (e) { e.transport = true; throw e; })
      .then(function (text) {
        var j;
        try { j = JSON.parse(text); }
        catch (e) {
          console.warn('lesson-core: ردّ غير JSON من الخادم:', String(text).slice(0, 300));
          var err = new Error('استجابة غير متوقعة من الخادم'); err.transport = true; throw err;
        }
        if (j.status !== 'success') { var se = new Error(j.message || 'خطأ غير معروف'); se.server = true; throw se; }
        return j.data;
      });
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  // إعادة تلقائية عند انقطاع الاتصال. آمنة لأن الخادم يتعرف على الطلب المكرر (nonce عند البدء، ورمز المحاولة عند الحفظ).
  function api(action, params) {
    var delays = [1200, 2500];
    function run(i) {
      return apiOnce(action, params).catch(function (err) {
        if (err.transport && i < delays.length) return sleep(delays[i]).then(function () { return run(i + 1); });
        throw err;
      });
    }
    return run(0);
  }
 
  function saveGrade(lessonId, grade, studentId, classId, attemptId) {
    var saveStatus = $('save-status');
    saveStatus.textContent = 'جارٍ حفظ نتيجتك...';
    api('saveGrade', { studentId: studentId, classId: classId, itemId: lessonId, grade: grade, attemptId: attemptId || '' })
      .then(function () {
        saveStatus.textContent = '✔ تم حفظ نتيجتك بنجاح! ستظهر في لوحة التحكم عند العودة.';
        var s = getStudentFromStorage();
        if (s && String(s.id) === String(studentId)) {
          if (!s.lessons) s.lessons = {};
          var old = s.lessons[lessonId];
          if (!old || old.grade < grade) s.lessons[lessonId] = { grade: grade, attempts: ((old && old.attempts) || 0) + 1 };
          else old.attempts = (old.attempts || 0) + 1;
          localStorage.setItem('currentStudent', JSON.stringify(s));
        }
      })
      .catch(function (err) {
        console.error('Save Grade Error:', err);
        if (err && err.transport) {
          saveStatus.innerHTML = '❌ تعذّر الاتصال أثناء حفظ الدرجة. <button type="button" id="retry-save-btn" class="mr-2 underline text-blue-700">إعادة محاولة الحفظ</button>';
          var b = $('retry-save-btn');
          if (b) b.addEventListener('click', function () { saveGrade(lessonId, grade, studentId, classId, attemptId); });
        } else {
          saveStatus.textContent = '❌ ' + (err && err.message ? err.message : 'تعذّر حفظ الدرجة');
        }
      });
  }
 
  // ---------------------------------------------------------------- الاختبار والمحاولات
  function setCounter(html) { var c = $('attempts-counter'); if (c) c.innerHTML = html; }
  function badge(text) { return '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">' + text + '</span>'; }
 
  function counterFor(d) {
    if (d.remainingInitial > 0) return 'المحاولات المتبقية: ' + badge(toAr(d.remainingInitial));
    if (d.canStart) return 'محاولة إضافية متاحة: ' + badge('١');
    return 'المحاولات المتبقية: ' + badge('٠');
  }
 
  function formatCountdown(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return toAr(p(h) + ':' + p(m) + ':' + p(sec));
  }
 
  function renderQuiz(questions, isVisitor, studentId, classId, lessonId) {
    currentQuestions = questions;
    var quizForm = $('quizForm');
    if (!questions.length) { quizForm.innerHTML = '<p class="text-center text-gray-600">لا توجد أسئلة متاحة لهذا الدرس حالياً.</p>'; quizForm.style.display = ''; return; }
    var quizHtml = questions.map(function (q, index) {
      var optionsHTML = q.options.map(function (opt, optIndex) {
        return '<div><input type="radio" name="q' + index + '" value="' + opt.value + '" id="q' + index + '_opt' + optIndex + '" class="hidden"><label for="q' + index + '_opt' + optIndex + '" class="option-label">' + opt.display + '</label></div>';
      }).join('');
      var smartButton = q.smartExplanation ? '<button type="button" id="smart-explain-btn-' + index + '" class="hidden mt-2 ml-4 text-xs text-purple-600 hover:underline">💡 حل ذكي</button>' : '';
      return '<div class="p-4 border-2 border-gray-200 rounded-lg"><p class="font-bold">' + (index + 1) + '. <span class="text-yellow-500">' + q.level + '</span> ' + q.text + '</p><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">' + optionsHTML + '</div><div id="feedback-q' + index + '" class="mt-2 text-sm font-bold"></div><div class="flex items-center"><button type="button" id="explain-btn-' + index + '" class="hidden mt-2 text-xs text-blue-600 hover:underline">اعرف لماذا؟</button>' + smartButton + '</div></div>';
    }).join('');
    quizForm.innerHTML = quizHtml + '<button type="submit" id="submit-quiz-btn" class="w-full text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-5 py-3 mt-8">تحقق من إجاباتي</button>';
    quizForm.style.display = '';
    questions.forEach(function (q, index) {
      var eb = $('explain-btn-' + index); if (eb) eb.addEventListener('click', function () { showExplanation(index, false); });
      var sb = $('smart-explain-btn-' + index); if (sb) sb.addEventListener('click', function () { showExplanation(index, true); });
    });
 
    quizForm.onsubmit = function (e) {
      e.preventDefault();
      var score = 0;
      questions.forEach(function (q, index) {
        var el = e.target.elements['q' + index];
        var userAnswer = el ? el.value : undefined;
        var fb = $('feedback-q' + index);
        if (userAnswer === q.correct) { score++; fb.textContent = '✔ إجابة صحيحة!'; fb.className = 'mt-2 text-sm font-bold text-green-600'; }
        else { fb.textContent = '❌ إجابة خاطئة.'; fb.className = 'mt-2 text-sm font-bold text-red-600'; }
        $('explain-btn-' + index).classList.remove('hidden');
        var sm = $('smart-explain-btn-' + index); if (sm) sm.classList.remove('hidden');
      });
      var finalGrade = Math.round((score / questions.length) * 10);
      $('quiz-results').classList.remove('hidden');
      $('quiz-score').textContent = finalGrade + ' / 10';
      e.target.querySelector('#submit-quiz-btn').disabled = true;
      if (isVisitor) {
        $('save-status').textContent = 'تم عرض نتيجتك. سجل الدخول لحفظ تقدمك.';
      } else {
        saveGrade(lessonId, finalGrade, studentId, classId, activeAttemptId);
        activeAttemptId = null;
        var rb = $('retake-quiz-btn');
        if (rb) { rb.textContent = 'محاولة أخرى'; rb.classList.remove('hidden'); }
      }
    };
  }
 
  function initQuizFlow(lessonId, makeQuestions, studentId, classId) {
    var quizForm = $('quizForm');
    if (!quizForm) return;
    var isVisitor = !(studentId && classId);
 
    // الزائر: كما كان سابقاً (محاولة واحدة بلا حفظ)
    if (isVisitor) {
      setCounter('المحاولات المتبقية: ' + badge('١'));
      renderQuiz(makeQuestions(), true, null, null, lessonId);
      return;
    }
 
    // الطالب: لوحة المحاولات تُنشأ فوق الاختبار
    var panel = $('attempts-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'attempts-panel';
      panel.className = 'mb-4';
      quizForm.parentNode.insertBefore(panel, quizForm);
    }
    quizForm.style.display = 'none';
 
    function stopTimer() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }
 
    function showError(msg) {
      stopTimer();
      panel.style.display = '';
      panel.innerHTML = '<div class="p-5 rounded-lg bg-red-50 border border-red-200 text-center"><p class="font-bold text-red-800 mb-2">' + esc(msg) + '</p><button type="button" id="attempts-retry-btn" class="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700">إعادة المحاولة</button></div>';
      $('attempts-retry-btn').addEventListener('click', loadStatus);
    }
 
    function showStatus(d) {
      stopTimer();
      serverOffsetMs = Date.parse(d.serverNow) - Date.now();
      setCounter(counterFor(d));
      panel.style.display = '';
      if (d.canStart) {
        var what = d.remainingInitial > 0
          ? 'لديك <b>' + toAr(d.remainingInitial) + '</b> من <b>' + toAr(d.initialMax) + '</b> محاولات.'
          : 'لديك <b>محاولة إضافية</b> واحدة.';
        panel.innerHTML = '<div class="p-5 rounded-lg bg-blue-50 border border-blue-200 text-center">' +
          '<p class="font-bold text-blue-900 mb-1">جاهز للاختبار؟</p>' +
          '<p class="text-sm text-gray-700 mb-1">' + what + '</p>' +
          '<p class="text-xs text-gray-500 mb-3">تُحتسب المحاولة بمجرد الضغط على «ابدأ الاختبار». بعد استنفاد المحاولات تحصل على محاولة إضافية كل ' + toAr(d.refillHours) + ' ساعة.</p>' +
          '<button type="button" id="start-quiz-btn" class="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 text-lg">ابدأ الاختبار</button>' +
          '<div id="start-error" class="text-sm text-red-600 mt-2"></div></div>';
        $('start-quiz-btn').addEventListener('click', startQuiz);
      } else {
        var nextMs = Date.parse(d.nextAt);
        panel.innerHTML = '<div class="p-5 rounded-lg bg-amber-50 border border-amber-200 text-center">' +
          '<p class="font-bold text-amber-900 mb-1">استنفدت محاولاتك الحالية</p>' +
          '<p class="text-sm text-gray-700 mb-2">تحصل على محاولة إضافية كل ' + toAr(d.refillHours) + ' ساعة. المحاولة القادمة بعد:</p>' +
          '<div id="attempts-countdown" class="text-3xl font-bold text-amber-700 tracking-widest" dir="ltr"></div>' +
          '<p class="text-xs text-gray-500 mt-2">راجع شرح الدرس والأمثلة أعلاه في هذه الأثناء.</p></div>';
        var cd = $('attempts-countdown');
        var tick = function () {
          var left = nextMs - (Date.now() + serverOffsetMs);
          if (left <= 0) { stopTimer(); loadStatus(); return; }
          cd.textContent = formatCountdown(left);
        };
        tick();
        countdownTimer = setInterval(tick, 1000);
      }
    }
 
    function loadStatus() {
      stopTimer();
      panel.style.display = '';
      panel.innerHTML = '<p class="text-center text-gray-500 py-4">جارٍ التحقق من محاولاتك...</p>';
      api('getAttemptStatus', { studentId: studentId, classId: classId, itemId: lessonId })
        .then(showStatus)
        .catch(function (err) { showError('تعذّر التحقق من محاولاتك: ' + (err && err.message ? err.message : 'تحقق من الاتصال')); });
    }
 
    var pendingNonce = null;   // يبقى نفسه عند إعادة المحاولة بعد انقطاع، فلا تُستهلك محاولة ثانية
 
    function startQuiz() {
      var btn = $('start-quiz-btn');
      btn.disabled = true; btn.textContent = 'جارٍ البدء...';
      if (!pendingNonce) pendingNonce = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      api('startAttempt', { studentId: studentId, classId: classId, itemId: lessonId, nonce: pendingNonce })
        .then(function (d) {
          pendingNonce = null;
          if (!d.started) { showStatus(d); return; }   // استُنفدت في تبويب آخر مثلاً
          activeAttemptId = d.attemptId;
          serverOffsetMs = Date.parse(d.serverNow) - Date.now();
          setCounter(counterFor(d));
          panel.style.display = 'none';
          $('quiz-results').classList.add('hidden');
          renderQuiz(makeQuestions(), false, studentId, classId, lessonId);
          quizForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(function (err) {
          if (!err.transport) pendingNonce = null;   // رفض واضح من الخادم: ضغطة جديدة تبدأ من الصفر
          btn.disabled = false; btn.textContent = 'ابدأ الاختبار';
          var e = $('start-error');
          if (e) e.textContent = err.transport
            ? 'تعذّر الاتصال بالخادم. اضغط «ابدأ الاختبار» مرة أخرى، ولن تُحتسب عليك محاولة إضافية.'
            : 'تعذّر بدء الاختبار: ' + (err && err.message ? err.message : 'تحقق من الاتصال');
        });
    }
 
    var retake = $('retake-quiz-btn');
    if (retake) retake.addEventListener('click', function () {
      activeAttemptId = null;
      $('quiz-results').classList.add('hidden');
      retake.classList.add('hidden');
      quizForm.innerHTML = ''; quizForm.style.display = 'none';
      loadStatus();
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
 
    loadStatus();
  }
 
  // ---------------------------------------------------------------- الأمثلة التفاعلية (خطوة بخطوة)
  function initInteractiveExamples() {
    var exampleContainers = document.querySelectorAll('[id^="interactive-container-"]');
    var state = {};
    exampleContainers.forEach(function (container) {
      var exampleId = container.id.split('-')[2];
      state[exampleId] = {
        currentIndex: -1,
        steps: container.querySelectorAll('.step-interactive'),
        placeholder: container.querySelector('.interactive-placeholder'),
        prevBtn: container.querySelector('.prev-btn'),
        nextBtn: container.querySelector('.next-btn'),
        resetBtn: container.querySelector('.reset-btn')
      };
      var st = state[exampleId], steps = st.steps, totalSteps = steps.length;
 
      function updateButtons() {
        var isFirst = st.currentIndex <= -1, isLast = st.currentIndex >= totalSteps - 1;
        st.prevBtn.disabled = isFirst;
        if (isLast) { st.nextBtn.classList.add('hidden'); st.resetBtn.classList.remove('hidden'); }
        else { st.nextBtn.classList.remove('hidden'); st.resetBtn.classList.add('hidden'); }
      }
      function showState() {
        var index = st.currentIndex;
        if (index === -1) {
          if (st.placeholder) st.placeholder.classList.remove('hidden');
          steps.forEach(function (s) { s.classList.remove('active'); });
          return;
        }
        if (st.placeholder) st.placeholder.classList.add('hidden');
        var visible = new Set(), lastInGroup = {};
        for (var i = 0; i <= index; i++) {
          var step = steps[i], group = step.dataset.stepGroup;
          if (group) lastInGroup[group] = step; else visible.add(step);
        }
        Object.values(lastInGroup).forEach(function (s) { visible.add(s); });
        steps.forEach(function (s) { if (visible.has(s)) s.classList.add('active'); else s.classList.remove('active'); });
      }
      st.nextBtn.addEventListener('click', function () { if (st.currentIndex < totalSteps - 1) { st.currentIndex++; showState(); updateButtons(); } });
      st.prevBtn.addEventListener('click', function () { if (st.currentIndex > -1) { st.currentIndex--; showState(); updateButtons(); } });
      if (st.resetBtn) st.resetBtn.addEventListener('click', function () { st.currentIndex = -1; showState(); updateButtons(); });
      updateButtons();
    });
  }
 
  // ---------------------------------------------------------------- التشغيل
  document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var studentId = urlParams.get('studentId');
    var classId = urlParams.get('classId');
 
    initInteractiveExamples();
 
    var student = getStudentFromStorage();
    var titleEl = $('lesson-title');
    buildHeader(student, titleEl ? titleEl.textContent : null);
    buildFooter();
 
    if (typeof LESSON_ID === 'undefined' || typeof generateQuiz !== 'function') {
      console.error('lesson-core: الصفحة لا تعرّف LESSON_ID أو generateQuiz');
    } else {
      initQuizFlow(LESSON_ID, generateQuiz, studentId, classId);
    }
    var closeBtn = $('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  });
})();
 
