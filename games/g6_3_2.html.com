<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>تحدي كثيرات الحدود V19.9 - النسخة الذهبية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family: 'Cairo', sans-serif; overflow: hidden; touch-action: manipulation; direction: rtl; transition: background-color 0.3s; }
        .compact-card {
            width: 100%; max-width: 420px; background: white; border-radius: 2.2rem;
            box-shadow: 0 20px 50px -12px rgba(0,0,0,0.15); border: 1px solid #f1f5f9;
            display: flex; flex-direction: column; height: 98vh; overflow: hidden; position: relative;
        }
        .top-info-bar {
            background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 16px;
            display: flex; justify-content: space-between; align-items: center;
            font-size: 11px; font-weight: 800; color: #64748b;
        }
        .btn-touch { min-height: 44px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 1rem; font-weight: 800; cursor: pointer; }
        .btn-touch:active { transform: scale(0.96); }
        
        /* محرك الرياضيات المطور V19.9 - إصلاح الجذر والأسس */
        .math-container { display: inline-flex; align-items: center; direction: rtl; overflow: visible; padding: 10px 5px; }
        .term { display: inline-flex; align-items: center; position: relative; overflow: visible; }
        .exponent { font-size: 1.1rem; font-weight: 900; color: #4f46e5; position: absolute; top: -14px; left: -10px; line-height: 1; }
        .fraction-container { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 10px; }
        .fraction-line { width: 115%; height: 3px; background-color: #1e293b; border-radius: 99px; margin: 2px 0; }
        
        /* إصلاح الجذر ليكون يميناً */
        .root-container { display: inline-flex; align-items: start; position: relative; overflow: visible; direction: rtl; margin: 0 4px; }
        .root-bar { border-top: 3.5px solid #1e293b; padding: 6px 8px 0 8px; margin-top: 10px; margin-left: -2px; }
        .root-head { flex-shrink: 0; margin-top: 1px; width: 22px; height: 38px; transform: scaleX(-1); }

        /* التغذية الراجعة المركزية المطلقة */
        .overlay-center {
            position: absolute; inset: 0; background: rgba(255, 255, 255, 0.98);
            z-index: 500; display: flex; flex-direction: column; padding: 1.25rem;
            animation: fadeIn 0.3s ease-out;
        }
        .message-popup {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 85%; background: #1e293b; color: white; padding: 1.5rem;
            border-radius: 1.5rem; text-align: center; z-index: 600;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popIn { from { opacity:0; transform: translate(-50%, -40%) scale(0.9); } to { opacity:1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Keypad */
        .key-btn { background: #f1f5f9; color: #1e293b; height: 38px; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; transition: 0.1s; cursor: pointer; }
        .key-btn:active { background: #cbd5e1; }

        #stage-content::-webkit-scrollbar { width: 4px; }
        #stage-content::-webkit-scrollbar-thumb { background: #dbeafe; border-radius: 10px; }

        .leaderboard-modal { position: absolute; inset: 0; background: #ffffff; z-index: 700; display: flex; flex-direction: column; padding: 1rem; transition: all 0.3s; }
        .hidden-modal { opacity: 0; pointer-events: none; transform: scale(0.95); display: none; }
        .visible-modal { opacity: 1; pointer-events: auto; transform: scale(1); display: flex; }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 h-screen w-screen flex items-center justify-center p-2 text-right">

    <div class="compact-card" id="main-card">
        <!-- الشريط العلوي -->
        <div class="top-info-bar">
            <div class="flex items-center gap-2 overflow-hidden">
                <i class="fas fa-user-graduate text-blue-500"></i>
                <span id="top-student-name" class="truncate font-black">بطل التحدي</span>
            </div>
            <div class="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-sm font-bold">
                <span id="sync-icon" class="hidden"><i class="fas fa-sync sync-loader text-blue-400"></i></span>
                <i class="fas fa-star text-yellow-500 text-[10px]"></i>
                <span id="top-prev-score">٠ / ٥</span>
            </div>
        </div>

        <!-- شاشة البداية -->
        <div id="start-screen" class="p-8 text-center flex flex-col gap-4 h-full justify-center">
            <div class="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl rotate-3">
                <i class="fas fa-shapes text-white text-4xl"></i>
            </div>
            <h1 class="text-2xl font-black text-slate-800">رحلة كثيرات الحدود</h1>
            <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-xs font-bold text-blue-700 leading-relaxed text-center">
                مرحباً بك يا بطل! هل تستطيع اجتياز تحديات التصنيف والترتيب والمعامل الرئيسي؟
            </div>
            
            <div class="flex gap-2 mt-2">
                <button onclick="startGame()" class="btn-touch flex-[2] bg-blue-600 text-white shadow-lg text-lg">
                    بدء المغامرة <i class="fas fa-play-circle mr-2"></i>
                </button>
                <button onclick="fetchAndShowLeaderboard(true)" class="btn-touch flex-1 bg-white text-slate-600 border border-slate-200 text-[10px] flex-col py-1">
                    <i class="fas fa-trophy text-yellow-500 text-lg mb-1"></i>
                    <span>سجل الأبطال</span>
                </button>
            </div>
            <p class="text-[9px] text-slate-400 font-bold mt-2 tracking-widest uppercase">أ. عبد العزيز خالد العبلان</p>
        </div>

        <!-- شاشة اللعبة -->
        <div id="game-screen" class="hidden p-4 flex flex-col h-full overflow-hidden">
            <div id="stage-info" class="mb-2 text-center">
                <div class="flex justify-center gap-1.5 mb-1.5">
                    <div id="dot-1" class="w-7 h-1.5 rounded-full bg-blue-600"></div>
                    <div id="dot-2" class="w-7 h-1.5 rounded-full bg-slate-200"></div>
                    <div id="dot-3" class="w-7 h-1.5 rounded-full bg-slate-200"></div>
                </div>
                <h2 id="stage-title" class="font-black text-slate-700 text-[11px] uppercase tracking-wider text-center">المرحلة ١</h2>
            </div>

            <div id="stage-content" class="flex-1 overflow-y-auto overflow-x-hidden relative pr-1 pb-2"></div>

            <button id="next-stage-btn" onclick="processCurrentStage()" class="btn-touch w-full bg-blue-600 text-white text-md shadow-lg mt-2 hidden">
                التحقق والاستمرار <i class="fas fa-arrow-left mr-2"></i>
            </button>
        </div>

        <!-- شاشة التغذية الراجعة -->
        <div id="feedback-screen" class="hidden overlay-center">
            <h3 id="feedback-header" class="text-lg font-black text-slate-800 mb-4 border-b pb-2 text-right"><i class="fas fa-chart-line text-blue-500 ml-2"></i>تحليل الأداء</h3>
            <div id="feedback-list" class="flex-1 overflow-y-auto space-y-2 pr-1 text-right"></div>
            <div class="mt-4 p-4 bg-indigo-50 rounded-2xl flex justify-between items-center border border-indigo-100">
                <span class="font-bold text-indigo-700">نقاط المرحلة:</span>
                <span id="stage-points" class="font-black text-2xl text-indigo-900">٠ / ٦</span>
            </div>
            <button onclick="closeFeedback()" class="btn-touch w-full bg-slate-900 text-white mt-4 font-bold">استمرار</button>
        </div>

        <!-- شاشة النتائج النهائية -->
        <div id="result-screen" class="hidden p-6 flex flex-col h-full overflow-hidden text-center justify-center">
            <div id="final-stats" class="grid grid-cols-3 gap-2 mb-6"></div>
            <div class="bg-green-50 p-5 rounded-[2rem] border border-green-100 mb-6">
                <i class="fas fa-crown text-yellow-500 text-3xl mb-1"></i>
                <p id="save-msg" class="font-black text-green-800 text-xs text-center">تم اعتماد نتيجتك النهائية!</p>
            </div>
            <button onclick="fetchAndShowLeaderboard(true)" class="btn-touch w-full bg-blue-600 text-white mb-4 shadow-lg">سجل المتصدرين</button>
            <div class="mt-auto flex gap-2">
                <button onclick="location.reload()" class="btn-touch flex-1 bg-slate-100 text-slate-600 font-bold text-sm">إعادة</button>
                <button id="finish-btn" class="btn-touch flex-[2] bg-slate-900 text-white font-bold text-sm">إنهاء</button>
            </div>
        </div>

        <!-- سجل الأبطال -->
        <div id="leaderboard-modal" class="leaderboard-modal hidden-modal">
            <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 class="font-black text-slate-800 text-lg">سجل المتصدرين</h3>
                <button onclick="closeLeaderboardModal()" class="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i class="fas fa-times"></i></button>
            </div>
            <div class="flex gap-2 mb-4">
                <button onclick="switchTab('class')" id="tab-class" class="tab-btn tab-inactive">أبطال فصلي</button>
                <button onclick="switchTab('global')" id="tab-global" class="tab-btn tab-active">أبطال اللعبة (الكل)</button>
            </div>
            <div id="modal-body" class="flex-1 overflow-y-auto bg-slate-50 rounded-2xl border border-slate-100 p-1 relative">
                <div id="modal-loader" class="absolute inset-0 flex items-center justify-center hidden bg-white/80 z-10"><div class="sync-loader text-blue-500 text-3xl"><i class="fas fa-sync"></i></div></div>
                <div id="leaderboard-content" class="space-y-1"></div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqAQlGhNs8k5RwHs6jrWxDiDwaMABSx8a9Fl81O5oVVa5fHRWTwIEvsGy2cSDP4zGLWQ/exec";
        const urlParams = new URLSearchParams(window.location.search);
        const GAME_ID = urlParams.get('gameId') || 'g6_3_2';
        const studentId = urlParams.get('studentId') || urlParams.get('userId');
        const classId = urlParams.get('classId');
        
        let studentName = "بطل التحدي";
        let currentLeaderboardMode = classId ? 'class' : 'global';
        let localVisitorResult = null;
        const toAr = (n) => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

        let stage = 1;
        let startTime = 0;
        let totalScore = 0;
        let s1ActiveItems = [];
        let s1Selection = [];
        let s2ActiveItems = [];
        let s2Order = [];
        let s3ActiveQuestions = [];
        let s3Idx = 0;
        let s3Input = "";

        // بنك الأسئلة الشامل
        const POOL_S1 = [
            { type: 'poly', isPoly: true, data: [{coeff:"٥", var:"س", pow:"٢"}, {sign:"+", coeff:"٣", var:"س"}, {sign:"+", coeff:"٧"}], reason: "كثيرة حدود صحيحة بأسس موجبة." },
            { type: 'frac', isPoly: false, data: {num:"٤", den:"س", extra: "+ ٢"}, reason: "ليست كثيرة حدود: المتغير في المقام مرفوض." },
            { type: 'poly', isPoly: false, data: [{coeff:"٩", var:"س", pow:"-٢"}, {sign:"+", coeff:"٥"}], reason: "ليست كثيرة حدود: الأس السالب مرفوض." },
            { type: 'poly', isPoly: true, data: [{coeff:"٧"}], reason: "كثيرة حدود ثابتة (درجة صفر)." },
            { type: 'root', isPoly: false, data: {val: "س", extra: "+ ٤"}, reason: "ليست كثيرة حدود: المتغير تحت الجذر مرفوض." },
            { type: 'frac', isPoly: true, data: {num:"١", den:"٢", isEx: true, exVar:"ص", exPow:"٣", exSign:"-", exConst:"٦"}, reason: "كثيرة حدود: الكسر عددي مسموح به." },
            { type: 'poly', isPoly: true, data: [{coeff:"٣", var:"س"}, {sign:"+", coeff:"٨"}], reason: "كثيرة حدود: ثنائية حد خطية." },
            { type: 'root', isPoly: true, data: {val: "٥", extra: "س"}, isEx: true, exCoeff: "√٥", exVar: "س", reason: "كثيرة حدود: الجذر للرقم وليس للمتغير." }
        ];

        const POOL_S2 = [
            { deg: 5, data: [{coeff:"س", pow:"٥"}, {sign:"-", coeff:"١"}], label: "الدرجة ٥" },
            { deg: 4, data: [{coeff:"٨", var:"س", pow:"٤"}], label: "الدرجة ٤" },
            { deg: 3, data: [{coeff:"٢", var:"س", pow:"٣"}, {sign:"-", coeff:"٧"}], label: "الدرجة ٣" },
            { deg: 2, data: [{coeff:"٥", var:"س", pow:"٢"}, {sign:"+", var:"س"}], label: "الدرجة ٢" },
            { deg: 1, data: [{coeff:"٩", var:"س"}], label: "الدرجة ١" },
            { deg: 0, data: [{coeff:"١٥"}], label: "الدرجة ٠" }
        ];

        const POOL_S3 = [
            { a: "-٩", data: [{coeff:"-٩", var:"س", pow:"٣"}, {sign:"+", coeff:"٥", var:"س"}, {sign:"-", coeff:"١"}] },
            { a: "١", data: [{var:"ص", pow:"٢"}, {sign:"+", coeff:"٧", var:"ص"}, {sign:"-", coeff:"٣"}] },
            { a: "-٦", data: [{coeff:"٤"}, {sign:"-", coeff:"٦", var:"س", pow:"٥"}] },
            { a: "٧", data: [{coeff:"٧", var:"ع", pow:"٤"}, {sign:"+", coeff:"٢"}] },
            { a: "-١", data: [{coeff:"١٠"}, {sign:"-", var:"س", pow:"٢"}] }
        ];

        document.addEventListener('DOMContentLoaded', () => {
            const raw = urlParams.get('name') || urlParams.get('studentName') || urlParams.get('username') || urlParams.get('user');
            if (raw) studentName = decodeURIComponent(raw);
            document.getElementById('top-student-name').textContent = studentName;
            if (!classId) document.getElementById('tab-class').style.display = 'none';
            if (studentId && classId) fetchInitialCloudData();
            document.getElementById('finish-btn').onclick = () => window.parent.postMessage({ event: 'gameFinished', gameId: GAME_ID }, '*');
        });

        function shuffle(array) {
            return array.sort(() => Math.random() - 0.5);
        }

        function renderMath(item, isLarge = false) {
            const size = isLarge ? "text-2xl" : "text-xl";
            const expSize = isLarge ? "1.1rem" : "0.95rem";
            if (item.type === 'poly') {
                return `<div class="math-container">${item.data.map(p => `
                    <div class="term">
                        ${p.sign ? `<span class="mx-1.5 font-bold ${size}">${p.sign}</span>` : ''}
                        ${p.coeff ? `<span class="font-black ${size}">${p.coeff}</span>` : ''}
                        ${p.var ? `<span class="inline-flex items-center mr-0.5 relative px-1">
                            <span class="font-serif italic font-black leading-none ${size}">${p.var}</span>
                            ${p.pow ? `<span class="exponent" style="font-size:${expSize}">${p.pow}</span>` : ''}
                        </span>` : ''}
                    </div>
                `).join('')}</div>`;
            }
            if (item.type === 'frac') {
                return `<div class="math-container">
                    <div class="fraction-container">
                        <span class="font-black leading-none pb-1 ${size}">${item.data.num}</span>
                        <div class="fraction-line"></div>
                        <span class="font-black leading-none pt-1 ${size}">${item.data.den}</span>
                    </div>
                    ${item.data.isEx ? `<div class="mr-2 inline-flex items-center">
                        <span class="inline-flex items-start relative px-1">
                            <span class="font-serif italic font-black leading-none ${size}">${item.data.exVar}</span>
                            <span class="exponent" style="font-size:${expSize}">${item.data.exPow}</span>
                        </span>
                        <span class="mx-1.5 font-black ${size}">${item.data.exSign}</span>
                        <span class="font-black ${size}">${item.data.exConst}</span>
                    </div>` : `<span class="font-black mr-2 ${size}">${item.data.extra}</span>`}
                </div>`;
            }
            if (item.type === 'root') {
                return `<div class="math-container">
                    <div class="root-container">
                        <svg viewBox="0 0 24 42" class="root-head"><path d="M2,20 L8,36 L20,8" fill="none" stroke="#1e293b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        <div class="root-bar"><span class="font-serif italic font-black leading-none ${size}">${item.data.val}</span></div>
                    </div>
                    ${item.isEx ? `<span class="font-black mr-1 ${size}">${item.exVar}</span>` : `<span class="font-black mr-4 self-center ${size}">${item.data.extra}</span>`}
                </div>`;
            }
            return "";
        }

        window.startGame = () => {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            startTime = Date.now();
            
            // اختيار أسئلة عشوائية من البنك
            s1ActiveItems = shuffle([...POOL_S1]).slice(0, 6);
            s2ActiveItems = shuffle([...POOL_S2]).slice(0, 4);
            s2Order = shuffle([0, 1, 2, 3]); // مبعثرة للترتيب
            s3ActiveQuestions = shuffle([...POOL_S3]).slice(0, 3);
            
            loadStage();
        };

        function loadStage() {
            const content = document.getElementById('stage-content');
            content.innerHTML = "";
            document.getElementById('next-stage-btn').classList.add('hidden');

            if (stage === 1) {
                document.getElementById('dot-1').className = "w-7 h-1.5 rounded-full bg-blue-600";
                document.getElementById('stage-title').innerHTML = `اختر كثيرات الحدود فقط<br><span class="text-[8px] text-blue-500 font-bold">(يمكن اختيار أكثر من إجابة)</span>`;
                let h = `<div class="grid grid-cols-1 gap-2.5 overflow-visible">`;
                s1ActiveItems.forEach((it, i) => {
                    const sel = s1Selection.includes(i);
                    h += `<button onclick="toggleS1(${i})" class="p-3.5 rounded-2xl border-2 transition-all flex justify-between items-center bg-slate-50 ${sel ? 'border-blue-600 bg-blue-50' : 'border-slate-100 shadow-sm'}">
                        <div class="flex-1 text-right overflow-visible scale-95">${renderMath(it)}</div>
                        <div class="w-6 h-6 rounded-full border-2 ${sel ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}"></div>
                    </button>`;
                });
                content.innerHTML = h + `</div>`;
                document.getElementById('next-stage-btn').classList.remove('hidden');
            } else if (stage === 2) {
                document.getElementById('dot-2').className = "w-7 h-1.5 rounded-full bg-blue-600";
                document.getElementById('stage-title').textContent = "رتب تنازلياً (أكبر درجة ← أصغر)";
                let h = `<div class="space-y-2">`;
                s2Order.forEach((idxInActive, currentPos) => {
                    h += `<div class="flex items-center gap-3 bg-white p-3 rounded-[1.5rem] border-2 border-slate-50 shadow-sm overflow-visible">
                        <div class="flex flex-col gap-1.5">
                            <button onclick="moveS2(${currentPos}, -1)" class="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 text-xs">▲</button>
                            <button onclick="moveS2(${currentPos}, 1)" class="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 text-xs">▼</button>
                        </div>
                        <div class="flex-1 flex justify-center scale-90">${renderMath({type:'poly', data:s2ActiveItems[idxInActive].data})}</div>
                    </div>`;
                });
                content.innerHTML = h + `</div>`;
                document.getElementById('next-stage-btn').classList.remove('hidden');
            } else if (stage === 3) {
                document.getElementById('dot-3').className = "w-7 h-1.5 rounded-full bg-blue-600";
                document.getElementById('stage-title').textContent = "حدد المعامل الرئيسي";
                const q = s3ActiveQuestions[s3Idx];
                content.innerHTML = `
                    <div class="text-center space-y-3 overflow-visible pb-1">
                        <div class="bg-slate-900 py-6 px-3 rounded-[2.2rem] text-white shadow-xl overflow-visible border-4 border-indigo-100 relative">
                            ${renderMath({type:'poly', data:q.data}, true)}
                        </div>
                        <div class="bg-indigo-50 p-2.5 rounded-2xl border-2 border-indigo-100 flex items-center justify-center">
                            <div class="text-4xl font-black text-indigo-600 h-10 flex items-center tracking-widest">${s3Input || '؟'}</div>
                        </div>
                        <div class="grid grid-cols-3 gap-1 max-w-[240px] mx-auto">
                            ${['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '-', '٠', 'del'].map(k => `
                                <button onclick="handleKeypad('${k}')" class="key-btn ${k==='del'?'bg-red-50 text-red-500':k==='-'?'bg-amber-100 text-amber-700':''}">
                                    ${k==='del'?'<i class="fas fa-backspace"></i>':k}
                                </button>
                            `).join('')}
                        </div>
                        <button onclick="checkS3()" class="btn-touch w-full bg-green-500 text-white font-bold shadow-lg">تحقق</button>
                    </div>
                `;
            }
        }

        window.toggleS1 = (i) => {
            if (s1Selection.includes(i)) s1Selection = s1Selection.filter(x => x !== i);
            else s1Selection.push(i); loadStage();
        };

        window.moveS2 = (idx, dir) => {
            const target = idx + dir;
            if (target >= 0 && target < s2Order.length) {
                [s2Order[idx], s2Order[target]] = [s2Order[target], s2Order[idx]]; loadStage();
            }
        };

        window.handleKeypad = (v) => {
            if (v === 'del') s3Input = s3Input.slice(0, -1);
            else if (v === '-') {
                if (s3Input.includes('-')) s3Input = s3Input.replace('-', '');
                else s3Input = '-' + s3Input;
            } else if (s3Input.length < 5) s3Input += v;
            loadStage();
        };

        window.processCurrentStage = () => {
            if (stage === 1) {
                let pts = 6; let html = "";
                s1ActiveItems.forEach((it, i) => {
                    const sel = s1Selection.includes(i); const isCorrect = it.isPoly;
                    let cls = "bg-white border-slate-100"; let ic = "";
                    if (sel && !isCorrect) { pts--; cls = "bg-red-50 border-red-200 text-red-700"; ic = "fa-times-circle"; }
                    else if (!sel && isCorrect) { pts--; cls = "bg-orange-50 border-orange-200 text-orange-700"; ic = "fa-exclamation-circle"; }
                    else if (sel && isCorrect) { cls = "bg-green-50 border-green-200 text-green-700"; ic = "fa-check-circle"; }
                    html += `<div class="p-3 rounded-xl border-2 ${cls} flex flex-col gap-1 text-right">
                        <div class="flex justify-between items-center"><span class="scale-75 origin-right">${renderMath(it)}</span><i class="fas ${ic} text-lg"></i></div>
                        <p class="text-[10px] font-bold mt-1 opacity-80">${it.reason}</p>
                    </div>`;
                });
                totalScore += Math.max(0, pts);
                showFeedback("تحليل التمييز", html, Math.max(0, pts), 6);
            } else if (stage === 2) {
                let pts = 4; let html = "";
                // الترتيب الصحيح التنازلي بناءً على الدرجة
                const correctOrder = [...s2ActiveItems].sort((a,b) => b.deg - a.deg);
                s2Order.forEach((idxInActive, currentPos) => {
                    const item = s2ActiveItems[idxInActive];
                    const ok = (item.deg === correctOrder[currentPos].deg);
                    if (!ok) pts--;
                    html += `<div class="p-3 rounded-xl border-2 ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} flex flex-col gap-1 text-right">
                        <div class="flex justify-between items-center"><span class="scale-75 origin-right">${renderMath({type:'poly', data:item.data})}</span><span class="text-[9px] font-black">${item.label}</span></div>
                        <p class="text-[9px] font-bold ${ok ? 'text-green-700' : 'text-red-700'}">${ok ? 'موضع صحيح' : 'يجب أن تكون في المركز ' + toAr(s2ActiveItems.findIndex(x => x.deg === item.deg) + 1)}</p>
                    </div>`;
                });
                totalScore += Math.max(0, pts);
                showFeedback("تحليل الترتيب", html, Math.max(0, pts), 4);
            }
        };

        function showFeedback(title, html, pts, max) {
            document.getElementById('feedback-header').innerHTML = `<i class="fas fa-microchip text-blue-500 ml-2"></i>` + title;
            document.getElementById('feedback-list').innerHTML = html;
            document.getElementById('stage-points').textContent = `${toAr(pts)} / ${toAr(max)}`;
            document.getElementById('feedback-screen').classList.remove('hidden');
        }

        window.closeFeedback = () => {
            document.getElementById('feedback-screen').classList.add('hidden');
            if (stage === 1) { stage = 2; loadStage(); }
            else if (stage === 2) { stage = 3; loadStage(); }
        };

        window.checkS3 = () => {
            const q = s3ActiveQuestions[s3Idx];
            const area = document.getElementById('main-card');
            const normalize = (s) => s.toString().replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[0-9]/g, d => d).replace(/[−–—]/g, '-');
            const isCorrect = normalize(s3Input) === normalize(q.a);

            if (isCorrect) {
                totalScore += 2;
                showFlashPopup("رائع! إجابة صحيحة (+" + toAr(2) + ")", "green");
            } else {
                area.classList.add('flash-red-bg');
                showFlashPopup("خطأ! الإجابة الصحيحة هي: " + q.a, "red");
                setTimeout(() => area.classList.remove('flash-red-bg'), 1000);
            }

            setTimeout(() => {
                if (s3Idx < s3ActiveQuestions.length - 1) { s3Idx++; s3Input = ""; loadStage(); }
                else finishGame();
            }, 2500);
        };

        function showFlashPopup(msg, type) {
            const m = document.createElement('div');
            m.className = "message-popup " + (type === 'red' ? 'bg-red-600' : 'bg-green-600');
            m.innerHTML = `<i class="fas ${type==='red'?'fa-times-circle':'fa-check-circle'} mb-2 block text-3xl"></i><p class="text-sm font-bold">${msg}</p>`;
            document.getElementById('main-card').appendChild(m);
            setTimeout(() => m.remove(), 2400);
        }

        function finishGame() {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const grade = ((totalScore / 16) * 5).toFixed(1);
            document.getElementById('game-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.remove('hidden');
            document.getElementById('final-stats').innerHTML = `
                <div class="bg-blue-50 p-2 rounded-xl border border-blue-100 flex flex-col justify-center">
                    <p class="text-[7px] font-bold text-blue-400 uppercase">النقاط</p>
                    <p class="text-xs font-black text-blue-900">${toAr(totalScore)} / ١٦</p>
                </div>
                <div class="bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex flex-col justify-center shadow-md scale-110 z-10">
                    <p class="text-[8px] font-bold text-emerald-600">الدرجة</p>
                    <p class="text-xl font-black text-emerald-900 leading-tight">${toAr(grade)}</p>
                </div>
                <div class="bg-purple-50 p-2 rounded-xl border border-purple-100 flex flex-col justify-center">
                    <p class="text-[7px] font-bold text-purple-400">الوقت</p>
                    <p class="text-xs font-black text-purple-900">${toAr(duration)} ث</p>
                </div>`;
            if (studentId && classId) saveScore(grade, duration);
            else { localVisitorResult = { name: studentName, grade: grade, metric: duration, isLocal: true }; fetchAndShowLeaderboard(false); }
        }

        async function saveScore(g, met) {
            const p = new URLSearchParams({ action: 'saveScore', studentId, classId, itemId: GAME_ID, score: g, metricValue: met, type: 'game' });
            try { await fetch(`${SCRIPT_URL}?${p.toString()}`); } finally { fetchAndShowLeaderboard(false); }
        }

        async function fetchInitialCloudData() {
            try {
                const url = `${SCRIPT_URL}?action=getStudentData&studentId=${studentId}&classId=${encodeURIComponent(classId)}&itemId=${GAME_ID}&t=${Date.now()}`;
                const res = await (await fetch(url)).json();
                if (res.status === 'success' && res.data) {
                    if (res.data.name) { studentName = res.data.name; document.getElementById('top-student-name').textContent = studentName; }
                    if (res.data.games && res.data.games[GAME_ID]) document.getElementById('top-prev-score').textContent = toAr(parseFloat(res.data.games[GAME_ID].grade).toFixed(1)) + " / ٥";
                }
            } catch (e) { } finally { document.getElementById('sync-icon').classList.add('hidden'); }
        }

        window.fetchAndShowLeaderboard = function(isManual = false) {
            const modal = document.getElementById('leaderboard-modal');
            if (isManual) { modal.classList.remove('hidden-modal'); modal.classList.add('visible-modal'); }
            const content = document.getElementById('leaderboard-content');
            document.getElementById('modal-loader').classList.remove('hidden');
            let reqClassId = (currentLeaderboardMode === 'class') ? classId : 'all';
            const url = `${SCRIPT_URL}?action=getLeaderboard&gameId=${GAME_ID}&classId=${encodeURIComponent(reqClassId || 'all')}&t=${Date.now()}`;
            fetch(url).then(r => r.json()).then(res => {
                let data = (res.status === 'success' && res.data) ? res.data : [];
                if (localVisitorResult && (currentLeaderboardMode === 'global' || !classId)) {
                    if (!data.find(p => p.name === localVisitorResult.name)) data.push(localVisitorResult);
                    data.sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade) || parseFloat(a.metric) - parseFloat(b.metric));
                }
                if (data.length > 0) {
                    let h = `<table class="w-full text-right text-[10px]"><thead class="text-slate-400 bg-slate-50/50"><tr><th class="p-2 text-center">#</th><th class="p-2 text-right">البطل</th><th class="p-2 text-center text-emerald-600">الدرجة</th></tr></thead><tbody class="divide-y">`;
                    data.forEach((p, i) => {
                        const isMe = (p.isLocal || (studentId && String(p.name).trim() === String(studentName).trim()));
                        h += `<tr class="${isMe ? 'bg-blue-50/50' : ''}">
                            <td class="p-2 text-center font-black ${i<3 ? 'text-yellow-500 text-sm' : ''}">${i < 3 ? ['🥇','🥈','🥉'][i] : toAr(i+1)}</td>
                            <td class="p-2 leaderboard-name ${isMe ? 'text-blue-700 font-extrabold' : ''}">${p.name} ${isMe ? '<span class="bg-blue-600 text-white text-[7px] px-1 rounded-full mx-1 font-bold italic">أنت</span>' : ''}</td>
                            <td class="p-2 text-center"><span class="text-emerald-600 font-black">${toAr(parseFloat(p.grade).toFixed(1))}</span><span class="text-[8px] text-slate-400 block font-bold">(${toAr(p.metric || p.metricValue || 0)} ث)</span></td>
                        </tr>`;
                    });
                    content.innerHTML = h + `</tbody></table>`;
                } else content.innerHTML = `<div class="py-10 text-center text-slate-400 text-xs italic font-bold">بانتظار تسجيل الأبطال..</div>`;
            }).finally(() => document.getElementById('modal-loader').classList.add('hidden'));
        };

        window.switchTab = (mode) => {
            currentLeaderboardMode = mode;
            document.getElementById('tab-class').className = mode === 'class' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
            document.getElementById('tab-global').className = mode === 'global' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
            fetchAndShowLeaderboard(false);
        };
        window.closeLeaderboardModal = () => document.getElementById('leaderboard-modal').classList.replace('visible-modal', 'hidden-modal');
    })();
    </script>
</body>
</html>
