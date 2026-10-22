/* 键艺 KeyCraft — 每日练习、数据面板与设置 */
(function () {
  "use strict";

  function E(value) {
    return window.APP ? window.APP.esc(value) : String(value == null ? "" : value);
  }

  function A() {
    return window.APP;
  }

  function dateLabel(d) {
    return (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  function weekdayLabel(d) {
    return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  }

  function dateKeyOf(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function todayDate() {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }

  /* =========================================================
     每日挑战：虚拟课程与虚拟课时
     ========================================================= */
  var DAILY_EN = typeof window.registerVirtualCourse === "function"
    ? window.registerVirtualCourse({
        id: "daily-en",
        code: "DE",
        name: "每日英文",
        en: "Daily English",
        color: "violet",
        level: "每日",
        duration: "约 3 分钟",
        tagline: "一天一段英文，保持手感。",
        description: "每天一段不同主题的英文练习，覆盖字母、标点、大小写和句子节奏。",
        chapters: [],
        lessons: []
      })
    : null;

  var DAILY_ZH = typeof window.registerVirtualCourse === "function"
    ? window.registerVirtualCourse({
        id: "daily-zh",
        code: "DZ",
        name: "每日中文",
        en: "Daily Chinese",
        color: "green",
        level: "每日",
        duration: "约 3 分钟",
        tagline: "一天一组中文，拼音与输入法都能练。",
        description: "每天一组常用词和短句，可在拼音模式与输入法实战之间切换。",
        chapters: [],
        lessons: []
      })
    : null;

  var DAILY_EN_TEXTS = [
    "A calm hand is a fast hand. Keep your fingers on the home row and let your eyes stay on the screen. When you feel tension, slow down and take one breath. Accuracy first, speed second.",
    "Small steps every day build a strong habit. Practice for ten minutes, then stop. A short session with full attention is better than a long session full of mistakes. Return tomorrow and do it again.",
    "The keyboard is a tool, not a test. Find the home row, keep your wrists relaxed, and let each finger do its own job. If you make a mistake, correct it calmly. There is no need to rush.",
    "Good typing is quiet typing. Use just enough force to press the key, then let it go. Keep a steady rhythm and let the words flow. When your hands are relaxed, your speed will follow.",
    "Read one word ahead of your fingers. This small habit gives your hands time to prepare and makes long sentences feel shorter. Keep your eyes on the screen, not on the keyboard.",
    "A short break can protect your best work. Stretch your hands, roll your shoulders, and look far away for a moment. Then come back to the home row with a clear mind and begin again.",
    "Accuracy is a skill you can practice. Slow down for the keys that feel difficult, and repeat the correct movement until it feels natural. Do not practice the mistake; practice the correction.",
    "Every lesson is a small experiment. Notice which keys feel easy and which ones need more attention. Write down one thing to improve, then focus on it in the next session.",
    "Type with your fingertips, not with your wrists. Keep the hands light and the shoulders low. A relaxed body is more accurate than a tense one, and it can keep working for much longer.",
    "The best speed is the speed you can control. A steady pace with a high accuracy rate will beat a fast burst with many mistakes. Build the habit first, then let the numbers grow.",
    "When a word feels hard, break it into smaller parts. Type one part, check it, then continue. This is not slower in the long run, because you spend less time correcting the same error again.",
    "Finish each session with a calm breath. Look at your accuracy, notice one weak key, and leave the keyboard with a clear next step. Consistency is built one small session at a time."
  ];

  var DAILY_ZH_SETS = [
    [
      { hanzi: "今天", pinyin: "jin tian" }, { hanzi: "练习", pinyin: "lian xi" }, { hanzi: "打字", pinyin: "da zi" }, { hanzi: "键盘", pinyin: "jian pan" },
      { hanzi: "准确", pinyin: "zhun que" }, { hanzi: "速度", pinyin: "su du" }, { hanzi: "节奏", pinyin: "jie zou" }, { hanzi: "专注", pinyin: "zhuan zhu" },
      { hanzi: "保持专注", pinyin: "bao chi zhuan zhu" }, { hanzi: "先准确再速度", pinyin: "xian zhun que zai su du" }
    ],
    [
      { hanzi: "学习", pinyin: "xue xi" }, { hanzi: "工作", pinyin: "gong zuo" }, { hanzi: "生活", pinyin: "sheng huo" }, { hanzi: "时间", pinyin: "shi jian" },
      { hanzi: "中国", pinyin: "zhong guo" }, { hanzi: "汉字", pinyin: "han zi" }, { hanzi: "输入法", pinyin: "shu ru fa" }, { hanzi: "图书馆", pinyin: "tu shu guan" },
      { hanzi: "每天进步一点", pinyin: "mei tian jin bu yi dian" }, { hanzi: "熟能生巧", pinyin: "shu neng sheng qiao" }
    ],
    [
      { hanzi: "阳光", pinyin: "yang guang" }, { hanzi: "春天", pinyin: "chun tian" }, { hanzi: "城市", pinyin: "cheng shi" }, { hanzi: "世界", pinyin: "shi jie" },
      { hanzi: "朋友", pinyin: "peng you" }, { hanzi: "生活", pinyin: "sheng huo" }, { hanzi: "慢慢来", pinyin: "man man lai" }, { hanzi: "休息一下", pinyin: "xiu xi yi xia" },
      { hanzi: "保持好心情", pinyin: "bao chi hao xin qing" }, { hanzi: "循序渐进", pinyin: "xun xu jian jin" }
    ],
    [
      { hanzi: "思考", pinyin: "si kao" }, { hanzi: "阅读", pinyin: "yue du" }, { hanzi: "专注", pinyin: "zhuan zhu" }, { hanzi: "习惯", pinyin: "xi guan" },
      { hanzi: "未来", pinyin: "wei lai" }, { hanzi: "努力", pinyin: "nu li" }, { hanzi: "每天", pinyin: "mei tian" }, { hanzi: "一起", pinyin: "yi qi" },
      { hanzi: "全神贯注", pinyin: "quan shen guan zhu" }, { hanzi: "日积月累", pinyin: "ri ji yue lei" }
    ],
    [
      { hanzi: "你好", pinyin: "ni hao" }, { hanzi: "谢谢", pinyin: "xie xie" }, { hanzi: "再见", pinyin: "zai jian" }, { hanzi: "请进", pinyin: "qing jin" },
      { hanzi: "没关系", pinyin: "mei guan xi" }, { hanzi: "不客气", pinyin: "bu ke qi" }, { hanzi: "早上好", pinyin: "zao shang hao" }, { hanzi: "晚上好", pinyin: "wan shang hao" },
      { hanzi: "明天见", pinyin: "ming tian jian" }, { hanzi: "很高兴认识你", pinyin: "hen gao xing ren shi ni" }
    ],
    [
      { hanzi: "目标", pinyin: "mu biao" }, { hanzi: "计划", pinyin: "ji hua" }, { hanzi: "行动", pinyin: "xing dong" }, { hanzi: "坚持", pinyin: "jian chi" },
      { hanzi: "进步", pinyin: "jin bu" }, { hanzi: "自信", pinyin: "zi xin" }, { hanzi: "耐心", pinyin: "nai xin" }, { hanzi: "复盘", pinyin: "fu pan" },
      { hanzi: "得心应手", pinyin: "de xin ying shou" }, { hanzi: "持之以恒", pinyin: "chi zhi yi heng" }
    ],
    [
      { hanzi: "眼睛看屏幕", pinyin: "yan jing kan ping mu" }, { hanzi: "手指找键位", pinyin: "shou zhi zhao jian wei" }, { hanzi: "保持手型", pinyin: "bao chi shou xing" },
      { hanzi: "轻触键盘", pinyin: "qing chu jian pan" }, { hanzi: "击键回位", pinyin: "ji jian hui wei" }, { hanzi: "均匀呼吸", pinyin: "jun yun hu xi" },
      { hanzi: "今天也要认真练习", pinyin: "jin tian ye yao ren zhen lian xi" }, { hanzi: "每一键都算数", pinyin: "mei yi jian dou suan shu" }
    ]
  ];

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function dailyIndex(kind) {
    var d = todayDate();
    return hashString(dateKeyOf(d) + kind) % (kind === "en" ? DAILY_EN_TEXTS.length : DAILY_ZH_SETS.length);
  }

  function getDailyLesson(kind) {
    var d = todayDate();
    var key = dateKeyOf(d);
    var id = "daily-" + kind + "-" + key.replace(/-/g, "");
    var existing = window.getLesson(id);
    if (existing) return existing;
    var isEn = kind === "en";
    var idx = dailyIndex(kind);
    var course = isEn ? DAILY_EN : DAILY_ZH;
    var title = (isEn ? "每日英文" : "每日中文") + " · " + dateLabel(d);
    var lesson = {
      id: id,
      title: title,
      en: isEn ? "Daily English" : "Daily Chinese",
      summary: isEn ? "今天的一段英文，保持眼睛前瞻和稳定节奏。" : "今天的一组中文词句，拼音与输入法都能练。",
      minutes: 3,
      difficulty: 2,
      focus: isEn ? ["A–Z", "Shift", "Punctuation"] : ["Pinyin", "IME"],
      goals: isEn ? ["完成一段英文", "保持准确率", "记录今日成绩"] : ["读准每个音节", "完成拼音练习", "尝试输入法实战"],
      sections: [],
      type: isEn ? "latin" : "pinyin",
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      color: course.color,
      chapterTitle: "每日挑战",
      chapterIndex: 1,
      index: 0,
      localIndex: 1,
      virtual: true,
      dailyKind: kind,
      backHref: "#/daily",
      drills: isEn ? [DAILY_EN_TEXTS[idx]] : undefined,
      items: isEn ? undefined : DAILY_ZH_SETS[idx]
    };
    if (!isEn) delete lesson.drills;
    else delete lesson.items;
    window.registerVirtualLesson(lesson);
    return lesson;
  }

  /* 页面加载时先注册今天的两个挑战，保证直接访问练习路由也能找到 */
  var TODAY_EN = getDailyLesson("en");
  var TODAY_ZH = getDailyLesson("zh");

  function dailyRecord(lesson) {
    return A().getRecord(lesson.id);
  }

  function completedToday(lesson) {
    var today = dateKeyOf(todayDate());
    return A().state.progress.sessions.some(function (s) {
      return s.lessonId === lesson.id && A().formatDateKey(s.date) === today;
    });
  }

  function weekStrip() {
    var sessions = A().state.progress.sessions;
    var done = {};
    sessions.forEach(function (s) { done[A().formatDateKey(s.date)] = true; });
    var out = [];
    for (var i = -6; i <= 0; i++) {
      var d = todayDate();
      d.setDate(d.getDate() + i);
      var key = dateKeyOf(d);
      var isToday = i === 0;
      out.push(
        '<div class="week-day' + (done[key] ? " is-done" : "") + (isToday ? " is-today" : "") + '">' +
        '<span>' + weekdayLabel(d) + '</span><strong>' + d.getDate() + '</strong><i></i></div>'
      );
    }
    return out.join("");
  }

  function renderDaily() {
    TODAY_EN = getDailyLesson("en");
    TODAY_ZH = getDailyLesson("zh");
    var en = TODAY_EN;
    var zh = TODAY_ZH;
    var enRec = dailyRecord(en);
    var zhRec = dailyRecord(zh);
    var enDone = completedToday(en);
    var zhDone = completedToday(zh);
    var todaySessions = A().sessionsToday();
    var todaySeconds = todaySessions.reduce(function (n, s) { return n + (s.duration || 0); }, 0);
    var goalMinutes = Number(settingValue("dailyGoal")) || 10;
    var todayMinutes = todaySessions.length ? Math.max(1, Math.round(todaySeconds / 60)) : 0;
    var goalPct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
    var streak = A().getDailyStreak();
    var enPreview = en.drills[0];
    var zhPreview = zh.items.slice(0, 4).map(function (i) { return i.hanzi + " " + i.pinyin; }).join(" · ");
    var main =
      '<section class="page-hero daily-hero"><div class="container">' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>练习</span></div>' +
      '<div class="daily-hero-grid"><div><span class="eyebrow"><span class="dot"></span> DAILY PRACTICE</span><h1>每天十分钟，<br>手感不会丢。</h1><p class="lead">今天的两组挑战已经准备好。先完成一组英文，再试一组中文；连续练习会让速度和准确率一起稳定下来。</p></div>' +
      '<div class="daily-streak-card"><span>当前连续</span><strong>' + streak + '</strong><small>天</small><p>' + (streak ? "保持住，今天再练一次。" : "从今天开始，先完成一组。") + '</p></div></div>' +
      '<div class="week-strip" aria-label="最近七天练习">' + weekStrip() + '</div>' +
      "</div></section>" +
      '<section class="daily-page"><div class="container">' +
      '<div class="daily-grid">' +
      '<article class="daily-card daily-card--en">' +
      '<div class="daily-card-top"><span class="tag" style="border-color:var(--violet);color:var(--violet)">英文 · 每日</span><span class="daily-status">' + (enDone ? "今日已完成" : "约 3 分钟") + "</span></div>" +
      '<h2>' + E(en.title) + '</h2>' +
      '<p class="daily-preview mono">' + E(enPreview.slice(0, 120)) + "…</p>" +
      '<div class="daily-card-meta"><span>最佳 ' + (enRec ? Math.round(enRec.bestSpeed) + " " + E(enRec.bestLabel) : "—") + '</span><span>准确率 ' + (enRec ? Math.round(enRec.bestAccuracy) + "%" : "—") + "</span></div>" +
      '<a class="btn ' + (enDone ? "" : "btn-accent") + '" href="#/practice/' + en.id + '">' + (enDone ? "再练一次" : "开始今日英文") + " " + A().icon("arrow") + "</a></article>" +
      '<article class="daily-card daily-card--zh">' +
      '<div class="daily-card-top"><span class="tag" style="border-color:var(--green);color:var(--green)">中文 · 每日</span><span class="daily-status">' + (zhDone ? "今日已完成" : "约 3 分钟") + "</span></div>" +
      '<h2>' + E(zh.title) + '</h2>' +
      '<p class="daily-preview">' + E(zhPreview) + "</p>" +
      '<div class="daily-card-meta"><span>最佳 ' + (zhRec ? Math.round(zhRec.bestSpeed) + " " + E(zhRec.bestLabel) : "—") + '</span><span>准确率 ' + (zhRec ? Math.round(zhRec.bestAccuracy) + "%" : "—") + "</span></div>" +
      '<a class="btn ' + (zhDone ? "" : "btn-accent") + '" href="#/practice/' + zh.id + '">' + (zhDone ? "再练一次" : "开始今日中文") + " " + A().icon("arrow") + "</a></article>" +
      "</div>" +
      '<div class="daily-goal"><div class="daily-goal-head"><div><span class="eyebrow">TODAY&#39;S GOAL</span><h3>今天的 ' + goalMinutes + ' 分钟</h3></div><strong>' + Math.min(goalMinutes, todayMinutes) + ' / ' + goalMinutes + ' 分钟</strong></div>' +
      '<div class="daily-goal-bar"><i style="width:' + goalPct + '%"></i></div>' +
      '<div class="daily-goal-foot"><span>' + todaySessions.length + " 次练习 · " + (enDone ? "英文完成" : "英文待练") + " · " + (zhDone ? "中文完成" : "中文待练") + '</span><a href="#/data">查看今日数据 →</a></div></div>' +
      '<div class="daily-tip"><span class="eyebrow"><span class="dot"></span> DAILY NOTE</span><p>今天不需要追求最快。把准确率保持在 95% 以上，让眼睛比手指快半个词，练习就会变得更轻松。</p></div>' +
      "</div></section>";
    A().renderSite({ name: "daily" }, main);
  }

  /* =========================================================
     数据面板
     ========================================================= */
  function statCard(label, value, note, accent) {
    return '<div class="data-stat"' + (accent ? ' style="--stat-color:' + accent + '"' : "") + '><span>' + E(label) + '</span><strong>' + E(value) + '</strong><small>' + E(note || "") + "</small></div>";
  }

  function lessonMatrix(course) {
    var next = A().getCourseProgress(course).next;
    return '<div class="lesson-matrix" style="--course:' + A().colorVar(course.color) + '">' +
      course.lessons.map(function (lesson, index) {
        var rec = A().getRecord(lesson.id);
        var cls = "matrix-cell";
        if (rec && rec.completed) cls += " is-done";
        if (next && next.id === lesson.id) cls += " is-next";
        return '<a class="' + cls + '" href="#/lesson/' + lesson.id + '" title="' + E(lesson.title) + '">' + String(index + 1).padStart(2, "0") + "</a>";
      }).join("") + "</div>";
  }

  function chapterProgress(course) {
    return '<div class="chapter-progress">' + course.chapters.map(function (ch) {
      var done = ch.lessons.filter(function (l) {
        var r = A().getRecord(l.id);
        return r && r.completed;
      }).length;
      var pct = ch.lessons.length ? Math.round((done / ch.lessons.length) * 100) : 0;
      return '<div class="chapter-progress-row"><div><strong>' + E(ch.title.replace(/^第[一二三四五六七八九十]+章 · /, "")) + "</strong><span>" + done + " / " + ch.lessons.length + '</span></div><div class="mini-bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join("") + "</div>";
  }

  function trendChart(values, color, label) {
    if (!values.length) return '<div class="chart-empty">完成练习后，这里会出现趋势曲线。</div>';
    var w = 680, h = 170, padX = 18, padY = 22;
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    if (max === min) { max += 1; min -= 1; }
    var pts = values.map(function (v, i) {
      var x = padX + (values.length === 1 ? (w - padX * 2) / 2 : (i / (values.length - 1)) * (w - padX * 2));
      var y = h - padY - ((v - min) / (max - min)) * (h - padY * 2);
      return { x: x, y: y, v: v };
    });
    var line = pts.map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ");
    var dots = pts.map(function (p, i) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (i === pts.length - 1 ? "4" : "2.6") + '" style="fill:' + color + '"></circle>';
    }).join("");
    return '<div class="trend-chart-wrap"><div class="trend-chart-head"><span>' + E(label) + '</span><strong>' + Math.round(values[values.length - 1]) + '</strong></div>' +
      '<svg class="trend-chart" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" role="img" aria-label="' + E(label) + '">' +
      '<line x1="' + padX + '" y1="' + (h - padY) + '" x2="' + (w - padX) + '" y2="' + (h - padY) + '" style="stroke:var(--line)" stroke-width="1"></line>' +
      '<line x1="' + padX + '" y1="' + padY + '" x2="' + (w - padX) + '" y2="' + padY + '" style="stroke:var(--line)" stroke-width="1"></line>' +
      '<polyline points="' + line + '" fill="none" style="stroke:' + color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></polyline>' + dots + "</svg>" +
      '<div class="trend-chart-foot"><span>' + Math.round(min) + '</span><span>' + Math.round(max) + "</span></div></div>";
  }

  function errorHeatmap(errorMap) {
    var byCode = {};
    Object.keys(errorMap || {}).forEach(function (ch) {
      var info = window.KEYBOARD.keyForChar(ch);
      if (info && info.key) byCode[info.key.code] = (byCode[info.key.code] || 0) + errorMap[ch];
    });
    var entries = Object.keys(byCode).map(function (code) { return { code: code, count: byCode[code] }; });
    if (!entries.length) return '<div class="chart-empty">还没有足够的按键错误数据。</div>';
    var max = Math.max.apply(null, entries.map(function (e) { return e.count; }));
    var kb = window.KEYBOARD.render({ mini: true, colored: false });
    var wrap = document.createElement("div");
    wrap.innerHTML = kb.outerHTML;
    entries.forEach(function (entry) {
      var key = wrap.querySelector('[data-code="' + entry.code + '"]');
      if (!key) return;
      var level = Math.max(1, Math.ceil((entry.count / max) * 4));
      key.classList.add("heat-" + level);
      key.setAttribute("title", key.dataset.label + " · " + entry.count + " 次错误");
    });
    var top = entries.sort(function (a, b) { return b.count - a.count; }).slice(0, 6);
    var topHtml = top.map(function (e) {
      var key = wrap.querySelector('[data-code="' + e.code + '"]');
      return '<span class="error-key"><span class="keycap">' + E(key ? key.dataset.label : e.code) + "</span><em>" + e.count + "</em></span>";
    }).join("");
    return '<div class="error-heatmap">' + wrap.innerHTML + '</div><div class="error-top">' + topHtml + "</div>";
  }

  function sessionTable(sessions) {
    if (!sessions.length) return '<div class="history-empty">还没有练习记录。完成任意一节课后，成绩会出现在这里。</div>';
    return '<div class="table-wrap"><table class="history-table"><thead><tr><th>课程 / 课时</th><th>模式</th><th>速度</th><th>准确率</th><th>连击</th><th>用时</th><th>时间</th></tr></thead><tbody>' +
      sessions.map(function (s) {
        var course = A().getCourse(s.courseId);
        var lesson = A().getLesson(s.lessonId);
        return "<tr><td>" + E(course ? course.name : "") + " · " + E(lesson ? lesson.title : s.lessonId) + '</td><td class="num">' + E(s.modeLabel || "练习") + '</td><td class="num">' + E(s.speedLabel || "") + " " + (s.speedValue != null ? Math.round(s.speedValue) : "") + '</td><td class="num">' + (s.accuracy != null ? s.accuracy.toFixed(1) : "0") + '%</td><td class="num">' + (s.maxCombo || 0) + '</td><td class="num">' + A().formatTime(s.duration) + '</td><td class="num">' + A().formatDate(s.date) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function miniChart(values, color, label, suffix) {
    if (!values.length) {
      return '<div class="mini-chart"><div class="mini-chart-head"><span>' + E(label) + '</span><em>—</em></div><div class="chart-empty chart-empty--small">还没有数据</div></div>';
    }
    var w = 320, h = 82, pad = 6;
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    if (max === min) { max += 1; min -= 1; }
    var pts = values.map(function (v, i) {
      var x = pad + (values.length === 1 ? (w - pad * 2) / 2 : (i / (values.length - 1)) * (w - pad * 2));
      var y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    var dots = values.map(function (v, i) {
      var x = pad + (values.length === 1 ? (w - pad * 2) / 2 : (i / (values.length - 1)) * (w - pad * 2));
      var y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i === values.length - 1 ? "3.4" : "2") + '" style="fill:' + color + '"></circle>';
    }).join("");
    return '<div class="mini-chart"><div class="mini-chart-head"><span>' + E(label) + '</span><em>' + Math.round(values[values.length - 1]) + (suffix || "") + '</em></div>' +
      '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-label="' + E(label) + '">' +
      '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + (w - pad) + '" y2="' + (h - pad) + '" style="stroke:var(--line)" stroke-width="1"></line>' +
      '<polyline points="' + pts.join(" ") + '" fill="none" style="stroke:' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>' + dots + "</svg></div>";
  }

  function courseDashRow(course) {
    var p = A().getCourseProgress(course);
    return '<a class="dash-course" style="--course:' + A().colorVar(course.color) + '" href="#/course/' + course.id + '">' +
      '<span class="dash-course-code">' + course.code + "</span>" +
      '<div class="dash-course-main"><div><strong>' + E(course.name) + "</strong><em>" + p.done + " / " + p.total + "</em></div>" +
      '<div class="mini-bar"><i style="width:' + p.percent + '%"></i></div></div>' +
      '<span class="dash-course-pct">' + p.percent + "%</span></a>";
  }

  function recentList(sessions) {
    if (!sessions.length) return '<div class="chart-empty chart-empty--small">完成练习后，这里会出现记录。</div>';
    return '<div class="dash-recent-list">' + sessions.map(function (s) {
      var lesson = A().getLesson(s.lessonId);
      return '<a class="dash-recent-row" href="' + (lesson ? "#/lesson/" + lesson.id : "#/data") + '">' +
        '<span class="dash-recent-date">' + A().formatDate(s.date) + "</span>" +
        '<strong>' + E(lesson ? lesson.title : s.lessonId) + "</strong>" +
        '<em>' + Math.round(s.speedValue || 0) + " " + E(s.speedLabel || "") + "</em>" +
        '<span class="dash-recent-acc">' + (s.accuracy != null ? s.accuracy.toFixed(0) : "0") + "%</span></a>";
    }).join("") + "</div>";
  }

  function renderData() {
    var stats = A().getGlobalStats();
    var sessions = A().state.progress.sessions;
    var speedValues = sessions.slice(0, 12).map(function (s) { return s.speedValue || 0; }).reverse();
    var accValues = sessions.slice(0, 12).map(function (s) { return s.accuracy || 0; }).reverse();
    var maxCombo = sessions.reduce(function (n, s) { return Math.max(n, s.maxCombo || 0); }, 0);
    var main =
      '<section class="dash-page"><div class="container">' +
      '<header class="dash-head"><div><span class="eyebrow"><span class="dot"></span> DATA</span><h1>学习数据</h1><p>课程进度、打字趋势和易错键，都在这一页。</p></div>' +
      '<span class="dash-updated">更新于 ' + A().formatDate(Date.now()) + "</span></header>" +
      '<div class="dash-kpis">' +
      '<div class="dash-kpi"><span>课程完成</span><strong>' + stats.completed + ' <em>/ ' + A().totalLessons() + "</em></strong></div>" +
      '<div class="dash-kpi"><span>练习次数</span><strong>' + stats.sessions + "</strong></div>" +
      '<div class="dash-kpi"><span>累计时间</span><strong>' + stats.totalMinutes + ' <em>分钟</em></strong></div>' +
      '<div class="dash-kpi"><span>平均准确率</span><strong>' + (stats.sessions ? stats.avgAccuracy.toFixed(1) : "0.0") + ' <em>%</em></strong></div>' +
      "</div>" +
      '<div class="dash-grid">' +
      '<section class="dash-card dash-card--courses"><div class="dash-card-head"><div><span class="eyebrow">COURSE</span><h2>课程进度</h2></div><a href="#/courses">全部课程 →</a></div>' +
      COURSES.map(courseDashRow).join("") + "</section>" +
      '<section class="dash-card"><div class="dash-card-head"><div><span class="eyebrow">SPEED</span><h2>速度与准确率</h2></div><span>最近 ' + sessions.length + " 次</span></div>" +
      '<div class="mini-chart-stack">' + miniChart(speedValues, "var(--accent)", "速度", "") + miniChart(accValues, "var(--green)", "准确率", "%") + "</div></section>" +
      '<section class="dash-card"><div class="dash-card-head"><div><span class="eyebrow">KEYS</span><h2>易错键</h2></div><span>最高连击 ' + maxCombo + "</span></div>" + errorHeatmap(stats.errorMap) + "</section>" +
      '<section class="dash-card"><div class="dash-card-head"><div><span class="eyebrow">LOG</span><h2>最近练习</h2></div><a href="#/daily">再来一组 →</a></div>' + recentList(sessions.slice(0, 6)) + "</section>" +
      "</div></div></section>";
    A().renderSite({ name: "data" }, main);
  }

  /* =========================================================
     设置
     ========================================================= */
  var SETTINGS_TAB_STORE = "keycraft.settings.tab";
  var SETTINGS_BACKUP_STORE = "keycraft.backup.at";

  var SETTINGS_DEFAULTS = {
    theme: "dark",
    followSystem: false,
    reduceMotion: false,
    density: "comfortable",
    typingSize: "m",
    lineWidth: "medium",
    practiceLength: "standard",
    strict: false,
    countdown: false,
    autoPause: true,
    showHint: true,
    showNextKey: true,
    wubiCodes: true,
    sound: false,
    volume: 0.6,
    errorSound: true,
    comboHint: true,
    keyboardVisible: true,
    keyboardColors: true,
    keyboardStyle: "flat",
    keyboardSize: "m",
    uiScale: "normal",
    dailyGoal: 10,
    shortcuts: {
      pause: "Escape",
      restart: "Ctrl+Enter",
      back: "Shift+Escape",
      skip: "Tab"
    }
  };

  var SETTINGS_TABS = [
    { id: "appearance", label: "外观" },
    { id: "practice", label: "练习" },
    { id: "sound", label: "声音" },
    { id: "keyboard", label: "键盘" },
    { id: "shortcuts", label: "快捷键" },
    { id: "data", label: "数据" },
    { id: "about", label: "关于" }
  ];

  /* 练习页可更换的快捷键动作（settings.shortcuts 的四项） */
  var SHORTCUT_ACTIONS = [
    { id: "pause", label: "暂停 / 继续", desc: "暂停或恢复当前练习计时。", def: "Escape" },
    { id: "restart", label: "重新开始", desc: "重新生成文本并回到开头。", def: "Ctrl+Enter" },
    { id: "back", label: "返回课时", desc: "退出练习，回到课时详情页。", def: "Shift+Escape" },
    { id: "skip", label: "跳过提示", desc: "跳过当前提示，直接看下一个键。", def: "Tab" }
  ];

  /* 键盘样式 / 大小 / 整体大小的中文标签 */
  var KB_STYLE_LABELS = { flat: "平直", soft: "柔和", raised: "立体", outline: "线框" };
  var KB_SIZE_LABELS = { s: "小", m: "标准", l: "大" };
  var UI_SCALE_LABELS = { compact: "紧凑", normal: "标准", large: "大" };

  function settingValue(key) {
    var settings = (A() && A().state && A().state.settings) || {};
    if (key === "keyboardColors") {
      if (settings.keyboardColors != null) return !!settings.keyboardColors;
      if (settings.fingerColors != null) return !!settings.fingerColors;
      return SETTINGS_DEFAULTS.keyboardColors;
    }
    var value = settings[key];
    return value == null ? SETTINGS_DEFAULTS[key] : value;
  }

  function themeChoice() {
    if (settingValue("followSystem")) return "system";
    return settingValue("theme") === "light" ? "light" : "dark";
  }

  /* ---------- 快捷键：取值 / 展示 ---------- */
  function defaultShortcuts() {
    var out = {};
    SHORTCUT_ACTIONS.forEach(function (a) { out[a.id] = a.def; });
    return out;
  }

  function shortcutAction(id) {
    return SHORTCUT_ACTIONS.filter(function (a) { return a.id === id; })[0] || null;
  }

  /* 当前生效的绑定：以默认值为底，合并 settings.shortcuts 中合法的字符串 */
  function currentShortcuts() {
    var out = defaultShortcuts();
    var stored = settingValue("shortcuts");
    if (stored && typeof stored === "object") {
      SHORTCUT_ACTIONS.forEach(function (a) {
        if (typeof stored[a.id] === "string" && stored[a.id]) out[a.id] = stored[a.id];
      });
    }
    return out;
  }

  /* 绑定字符串拆成若干 kbd：Ctrl+Enter → <kbd>Ctrl</kbd> + <kbd>Enter</kbd> */
  function shortcutKbdHtml(binding) {
    var text = String(binding || "");
    if (!text) return '<kbd class="settings-kbd-empty">未设置</kbd>';
    return text.split("+").filter(Boolean).map(function (part, index) {
      return (index ? '<span class="settings-shortcut-plus" aria-hidden="true">+</span>' : "") +
        "<kbd>" + E(part) + "</kbd>";
    }).join("");
  }

  function shortcutHintDefault() {
    return "快捷键在练习页生效；组合键按 Ctrl + Alt + Shift + 主键的顺序生成，Esc 取消监听。";
  }

  function storedValue(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw == null ? fallback : raw;
    } catch (err) {
      return fallback;
    }
  }

  function hashParts() {
    return String(window.location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
  }

  /* #/settings/<tab> 深链：离开设置路由后重新生效，避免覆盖上一次选择的标签 */
  var deepLinkTab = null;
  window.addEventListener("hashchange", function () {
    if (hashParts()[0] !== "settings") deepLinkTab = null;
  });

  function storeValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* 本地存储不可用时忽略 */
    }
  }

  function notifyPractice() {
    try {
      if (window.PRACTICE && typeof window.PRACTICE.applySettings === "function") {
        window.PRACTICE.applySettings();
      }
    } catch (err) {
      /* 练习页未挂载时忽略 */
    }
  }

  function todayMinutes() {
    try {
      var sessions = A().sessionsToday ? A().sessionsToday() : [];
      var seconds = sessions.reduce(function (n, s) { return n + (s.duration || 0); }, 0);
      return sessions.length ? Math.max(1, Math.round(seconds / 60)) : 0;
    } catch (err) {
      return 0;
    }
  }

  function refreshCurrentRoute() {
    var parts = hashParts();
    if (parts[0] === "settings") return; /* 避免路由重新打开设置弹窗 */
    try {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } catch (err) {
      try {
        var ev = document.createEvent("Event");
        ev.initEvent("hashchange", false, false);
        window.dispatchEvent(ev);
      } catch (err2) {
        /* 忽略 */
      }
    }
  }

  var previewAudioCtx = null;

  function previewSound() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        A().toast("当前浏览器不支持试听");
        return;
      }
      if (!previewAudioCtx) previewAudioCtx = new Ctx();
      if (previewAudioCtx.state === "suspended") previewAudioCtx.resume();
      var now = previewAudioCtx.currentTime;
      var vol = Math.max(0, Math.min(1, Number(settingValue("volume")) || 0));
      var gain = previewAudioCtx.createGain();
      gain.gain.setValueAtTime(Math.max(0.0001, vol * 0.16), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      gain.connect(previewAudioCtx.destination);
      var osc = previewAudioCtx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (err) {
      /* 无音频环境时静默 */
    }
  }

  function settingsSeg(key, label, options, current) {
    return '<div class="segmented settings-seg" role="group" aria-label="' + E(label) + '" data-seg="' + key + '">' +
      options.map(function (o) {
        var active = String(o.value) === String(current);
        return '<button type="button" class="' + (active ? "is-active" : "") + '" data-value="' + E(o.value) + '" aria-pressed="' + (active ? "true" : "false") + '">' + E(o.label) + "</button>";
      }).join("") + "</div>";
  }

  function settingsToggle(key, title, desc) {
    var checked = !!settingValue(key);
    return '<label class="setting-row"><span><strong>' + E(title) + "</strong><small>" + E(desc) + '</small></span><input type="checkbox" data-setting-toggle="' + key + '"' + (checked ? " checked" : "") + '><i class="switch" aria-hidden="true"></i></label>';
  }

  function settingsRow(title, desc, control) {
    return '<div class="setting-row setting-row--control"><span><strong>' + E(title) + "</strong><small>" + E(desc) + '</small></span><div class="setting-control">' + control + "</div></div>";
  }

  function settingsPanelHead(title, desc) {
    return '<header class="settings-panel-head"><h3>' + E(title) + "</h3><p>" + E(desc) + "</p></header>";
  }

  function settingsGroupTitle(title) {
    return '<div class="settings-group-title">' + E(title) + "</div>";
  }

  function panelWrap(id, inner) {
    return '<section class="settings-panel" id="st-panel-' + id + '" role="tabpanel" aria-labelledby="st-tab-' + id + '" data-settings-panel="' + id + '" hidden>' + inner + "</section>";
  }

  function previewMetrics() {
    var size = settingValue("typingSize");
    var width = settingValue("lineWidth");
    return {
      fontSize: size === "s" ? "13px" : size === "l" ? "19px" : "15.5px",
      width: width === "narrow" ? "58%" : width === "wide" ? "100%" : "80%",
      sizeLabel: size === "s" ? "小" : size === "l" ? "大" : "标准",
      widthLabel: width === "narrow" ? "窄行" : width === "wide" ? "宽行" : "标准行宽"
    };
  }

  function keyboardPreviewHtml() {
    try {
      if (!window.KEYBOARD || typeof window.KEYBOARD.render !== "function") return "";
      var kb = window.KEYBOARD.render({ mini: true, colored: !!settingValue("keyboardColors") });
      var styleKey = settingValue("keyboardStyle");
      var sizeKey = settingValue("keyboardSize");
      return '<div class="settings-kb-preview"><div class="settings-preview-head"><span>键盘预览</span><em data-kb-meta>' +
        E((KB_STYLE_LABELS[styleKey] || KB_STYLE_LABELS.flat) + "键帽 · " + (KB_SIZE_LABELS[sizeKey] || KB_SIZE_LABELS.m) + "号") +
        '</em></div><div class="settings-kb-stage" data-kb-stage data-kb-style="' + E(styleKey) + '" data-kb-size="' + E(sizeKey) + '">' + kb.outerHTML + "</div>" +
        '<p class="settings-note">指法着色按手指区分颜色，关闭后使用统一键帽颜色。样式与大小会同步到练习页键盘。</p></div>';
    } catch (err) {
      return "";
    }
  }

  /* 关于页的快捷键表：读取 settings.shortcuts，不再写死 */
  function aboutShortcutRowsHtml() {
    var cur = currentShortcuts();
    return SHORTCUT_ACTIONS.map(function (a) {
      return '<div class="settings-key-row" data-about-shortcut="' + a.id + '"><kbd>' + E(cur[a.id]) + "</kbd><span>" +
        E(a.label) + "（默认 " + E(a.def) + "）</span></div>";
    }).join("") +
      '<div class="settings-key-row"><kbd>Backspace</kbd><span>退格，修正上一个字符</span></div>' +
      '<div class="settings-key-row"><kbd>Enter</kbd><span>输入法回车上屏，不触发提交</span></div>' +
      '<div class="settings-key-row"><kbd>Ctrl / ⌘</kbd><span>组合键保留给自定义快捷键</span></div>';
  }

  function settingsStatsHtml() {
    var stats = A().getGlobalStats();
    var goal = Number(settingValue("dailyGoal")) || 10;
    var minutes = todayMinutes();
    var pct = goal ? Math.min(100, Math.round((minutes / goal) * 100)) : 0;
    return '<div class="settings-mini-stats">' +
      '<div><span>课时</span><strong>' + stats.completed + "</strong></div>" +
      '<div><span>练习</span><strong>' + stats.sessions + "</strong></div>" +
      '<div><span>分钟</span><strong>' + stats.totalMinutes + "</strong></div>" +
      "</div>" +
      '<div class="settings-goal"><div class="settings-goal-head"><span>今日进度</span><em data-goal-minutes>' + minutes + " / " + goal + ' 分钟</em></div>' +
      '<div class="settings-bar"><i data-goal-bar style="width:' + pct + '%"></i></div></div>';
  }

  function settingsDataPanelInner() {
    var goal = Number(settingValue("dailyGoal")) || 10;
    var backupRaw = storedValue(SETTINGS_BACKUP_STORE, "");
    var backupTs = backupRaw ? Number(backupRaw) : 0;
    return settingsPanelHead("数据", "累计统计、每日目标、备份与清理。所有数据都保存在本机浏览器。") +
      '<div class="settings-group">' + settingsGroupTitle("统计") + settingsStatsHtml() + "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("每日目标") +
      settingsRow("每天练习目标", "每日练习页与进度条会按这个目标计算，单位：分钟。", settingsSeg("dailyGoal", "每日目标", [
        { value: 5, label: "5" }, { value: 10, label: "10" }, { value: 15, label: "15" }, { value: 20, label: "20" }, { value: 30, label: "30"
      }], settingValue("dailyGoal"))) +
      "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("备份") +
      '<div class="settings-actions"><button class="btn btn-sm" type="button" data-export>' + A().icon("download") + ' 导出备份</button>' +
      '<button class="btn btn-sm" type="button" data-import-trigger>' + A().icon("upload") + ' 导入备份</button>' +
      '<input type="file" id="import-file" accept="application/json,.json" hidden></div>' +
      '<p class="settings-note" data-backup-note>' + (backupTs ? "最近备份：" + E(A().formatDate(backupTs)) : "最近备份：还没有导出过备份") + "</p>" +
      "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("清理") +
      '<div class="settings-danger-row"><div><strong>清空练习记录</strong><small>删除练习历史、易错键与游戏分数，保留课程完成进度。</small></div><button class="btn btn-sm danger-btn" type="button" data-clear-sessions>清空记录</button></div>' +
      '<div class="settings-danger-row"><div><strong>清空全部数据</strong><small>课程进度、练习记录与设置全部恢复默认，无法撤销。</small></div><button class="btn btn-sm danger-btn" type="button" data-settings-reset>全部清空</button></div>' +
      "</div>" +
      '<p class="settings-note">当前每日目标：' + goal + " 分钟。清理后建议导出一份备份留档。</p>";
  }

  function settingsShortcutsPanelInner() {
    var cur = currentShortcuts();
    var rows = SHORTCUT_ACTIONS.map(function (a) {
      var isDefault = cur[a.id] === a.def;
      return '<div class="settings-shortcut-row" data-shortcut-row="' + a.id + '">' +
        '<span class="settings-shortcut-copy"><strong>' + E(a.label) + "</strong><small>" + E(a.desc) +
        " 默认 " + E(a.def) + "</small></span>" +
        '<span class="settings-shortcut-keys" data-shortcut-keys="' + a.id + '">' + shortcutKbdHtml(cur[a.id]) + "</span>" +
        '<span class="settings-shortcut-actions">' +
        '<button class="settings-mini-btn settings-shortcut-change" type="button" data-shortcut-change="' + a.id + '" aria-pressed="false" aria-label="更换「' + E(a.label) + '」快捷键">更换</button>' +
        '<button class="settings-mini-btn settings-shortcut-reset" type="button" data-shortcut-reset="' + a.id + '" aria-label="恢复「' + E(a.label) + '」默认快捷键"' + (isDefault ? " disabled" : "") + ">恢复默认</button>" +
        "</span></div>";
    }).join("");

    return settingsPanelHead("快捷键", "练习页的键盘操作。点击「更换」后直接按下新的组合键；只按修饰键不会提交，Esc 取消。") +
      '<div class="settings-group">' + settingsGroupTitle("练习页") +
      '<div class="settings-shortcut-list">' + rows + "</div>" +
      '<p class="settings-note settings-shortcut-hint" data-shortcut-hint role="status" aria-live="polite">' + E(shortcutHintDefault()) + "</p>" +
      "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("规则") +
      '<div class="settings-key-row"><kbd>Esc</kbd><span>监听状态下按 Esc 取消更换，不会写入绑定。</span></div>' +
      '<div class="settings-key-row"><kbd>Ctrl + Alt + Shift</kbd><span>组合键按 Ctrl、Alt、Shift 的顺序生成，例如 Ctrl + Alt + Enter。</span></div>' +
      '<div class="settings-key-row"><kbd>冲突</kbd><span>和已有动作重复时会提示并拒绝，需要换一个组合键。</span></div>' +
      "</div>" +
      '<div class="settings-tip"><span class="eyebrow">TIP</span><p>把常用动作放在左手附近，练习时手不用离开主键区。快捷键的接管逻辑由练习页处理。</p></div>';
  }

  function settingsPanelsHtml() {
    var pv = previewMetrics();
    var appearance =
      settingsPanelHead("外观", "主题、打字字号、每行字数、整体大小与界面密度，改动会立即生效。") +
      '<div class="settings-preview"><div class="settings-preview-head"><span>实时预览</span><em data-preview-meta>' + E(pv.sizeLabel + "字号 · " + pv.widthLabel) + "</em></div>" +
      '<div class="settings-preview-text" data-preview-text style="font-size:' + pv.fontSize + ";width:" + pv.width + '">保持手型，眼睛看屏幕，每一键都算数。</div></div>' +
      '<div class="settings-group">' + settingsGroupTitle("主题") +
      settingsRow("主题", "深色、浅色，或跟随系统外观自动切换。", settingsSeg("theme", "主题", [
        { value: "dark", label: "深色" }, { value: "light", label: "浅色" }, { value: "system", label: "跟随系统" }
      ], themeChoice())) +
      settingsToggle("reduceMotion", "减少动效", "关闭渐入与位移动画，长时间练习更省眼。") +
      "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("排版") +
      settingsRow("打字字号", "练习区文字大小。", settingsSeg("typingSize", "打字字号", [
        { value: "s", label: "小" }, { value: "m", label: "标准" }, { value: "l", label: "大" }
      ], settingValue("typingSize"))) +
      settingsRow("每行字数", "练习文本的行宽，窄行更容易控制回行。", settingsSeg("lineWidth", "每行字数", [
        { value: "narrow", label: "窄" }, { value: "medium", label: "标准" }, { value: "wide", label: "宽" }
      ], settingValue("lineWidth"))) +
      settingsRow("整体大小", "缩放整页内容，影响字号与一屏可见的信息量。", settingsSeg("uiScale", "整体大小", [
        { value: "compact", label: "紧凑" }, { value: "normal", label: "标准" }, { value: "large", label: "大" }
      ], settingValue("uiScale"))) +
      settingsRow("界面密度", "紧凑模式压缩页面留白，一屏看到更多内容。", settingsSeg("density", "界面密度", [
        { value: "compact", label: "紧凑" }, { value: "comfortable", label: "舒适" }
      ], settingValue("density"))) +
      "</div>";

    var practice =
      settingsPanelHead("练习", "控制每次练习的长度、判定方式和屏幕提示。") +
      '<div class="settings-group">' + settingsGroupTitle("节奏") +
      settingsRow("练习长度", "同一节课生成的目标文本长度。", settingsSeg("practiceLength", "练习长度", [
        { value: "short", label: "短" }, { value: "standard", label: "标准" }, { value: "long", label: "长" }
      ], settingValue("practiceLength"))) +
      settingsToggle("strict", "严格模式", "按错键时不前进，必须按对当前键才能继续。") +
      settingsToggle("countdown", "开始前倒计时", "进入练习后先倒计时，手放好再开始。") +
      settingsToggle("autoPause", "切到后台自动暂停", "离开当前标签页时自动暂停计时，回来继续。") +
      "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("提示") +
      settingsToggle("showHint", "显示提示条", "练习页顶部显示当前模式与操作提示。") +
      settingsToggle("showNextKey", "显示下一键", "在虚拟键盘上高亮下一个要按的键。") +
      settingsToggle("wubiCodes", "五笔显示编码", "五笔课程在键帽上显示字根与编码。") +
      "</div>" +
      '<div class="settings-tip"><span class="eyebrow">TIP</span><p>先求准，再求快。准确率稳定在 95% 以上后再提速，进步会更稳。</p></div>';

    var volumePct = Math.round(Number(settingValue("volume")) * 100);
    var sound =
      settingsPanelHead("声音", "按键反馈与音量，拖动音量时会实时显示百分比。") +
      '<div class="settings-group">' + settingsGroupTitle("反馈") +
      settingsToggle("sound", "按键音", "按键时播放短促的敲击声。") +
      settingsRow("音量", "按键音与提示音的音量。", '<div class="volume-control"><input type="range" min="0" max="100" step="1" value="' + volumePct + '" data-volume aria-label="音量"><span data-volume-value>' + volumePct + '%</span><button type="button" class="settings-mini-btn" data-sound-preview>试听</button></div>') +
      settingsToggle("errorSound", "错误提示音", "按错键时使用不同的低音提示。") +
      settingsToggle("comboHint", "连击提示", "连击达到 10 / 25 / 50 时显示短提示。") +
      "</div>" +
      '<p class="settings-note">音量只在开启按键音或提示音后生效。浏览器通常要求先点击页面一次才允许播放声音。</p>';

    var keyboard =
      settingsPanelHead("键盘", "虚拟键盘的显示方式、键帽样式与大小。") +
      '<div class="settings-group">' + settingsGroupTitle("显示") +
      settingsToggle("keyboardVisible", "显示虚拟键盘", "练习页底部显示 68 键提示键盘。") +
      settingsToggle("keyboardColors", "指法着色", "按手指给键帽着色，方便建立手型记忆。") +
      "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("外观") +
      settingsRow("键帽样式", "平直、柔和、立体或线框，改变键帽的圆角与描边。", settingsSeg("keyboardStyle", "键帽样式", [
        { value: "flat", label: "平直" }, { value: "soft", label: "柔和" }, { value: "raised", label: "立体" }, { value: "outline", label: "线框" }
      ], settingValue("keyboardStyle"))) +
      settingsRow("键盘大小", "调整练习页键盘的宽度与字号。", settingsSeg("keyboardSize", "键盘大小", [
        { value: "s", label: "小" }, { value: "m", label: "标准" }, { value: "l", label: "大" }
      ], settingValue("keyboardSize"))) +
      "</div>" +
      '<div class="settings-group">' + settingsGroupTitle("下一键") +
      '<div class="setting-row setting-row--control"><span><strong>高亮下一个键</strong><small>在虚拟键盘上标出下一个要按的键。</small></span><div class="setting-control"><button type="button" class="settings-mini-btn settings-jump" data-jump-tab="practice">在「练习」中设置 →</button></div></div>' +
      "</div>" +
      keyboardPreviewHtml();

    var lessonCount = A().totalLessons();
    var about =
      settingsPanelHead("关于", "版本信息、键盘快捷键与本地数据说明。") +
      '<div class="settings-about-card"><span class="eyebrow">KEYCRAFT</span><h4>键艺 KeyCraft</h4>' +
      "<p>以课程为主线的打字练习站。四条课程线 · " + lessonCount + " 节课 · 68 键固定布局；纯静态页面，无账号、无后端。</p>" +
      '<div class="settings-about-meta"><span>版本</span><em>v1.0 · static</em></div>' +
      '<div class="settings-about-meta"><span>课程</span><em>EN / TOUCH / ZH / WUBI</em></div>' +
      '<div class="settings-about-meta"><span>存储</span><em>localStorage · 本机</em></div></div>' +
      '<div class="settings-group">' + settingsGroupTitle("快捷键") +
      '<div class="settings-key-list" data-about-keys>' + aboutShortcutRowsHtml() + "</div>" +
      '<p class="settings-note">以上为练习页快捷键，可在「快捷键」标签页更换并恢复默认。</p></div>' +
      '<div class="settings-group">' + settingsGroupTitle("隐私") +
      '<p class="settings-note">所有设置、课程进度与练习记录都保存在本机浏览器的 localStorage 中，不会上传到任何服务器。清除站点数据或更换设备后无法恢复，建议定期导出备份。</p></div>' +
      '<div class="settings-tip"><span class="eyebrow">TIP</span><p>10 分钟一轮，中间休息 1 分钟，比一次练很久更容易保持手感。</p></div>';

    return panelWrap("appearance", appearance) +
      panelWrap("practice", practice) +
      panelWrap("sound", sound) +
      panelWrap("keyboard", keyboard) +
      panelWrap("shortcuts", settingsShortcutsPanelInner()) +
      panelWrap("data", settingsDataPanelInner()) +
      panelWrap("about", about);
  }

  function openSettings(tab) {
    var existing = document.getElementById("settings-overlay");
    if (existing) {
      if (typeof tab === "string" && typeof existing.__kcSwitchTab === "function") {
        existing.__kcSwitchTab(tab, false);
      }
      return;
    }
    if (typeof tab !== "string") {
      /* 支持 #/settings/data 这样的深链，直接打开对应标签 */
      var parts = hashParts();
      if (parts[0] === "settings" && parts[1] && parts[1] !== deepLinkTab) tab = parts[1];
      deepLinkTab = parts[0] === "settings" ? (parts[1] || null) : null;
    }
    var initialTab = typeof tab === "string" ? tab : storedValue(SETTINGS_TAB_STORE, "appearance");
    if (!SETTINGS_TABS.some(function (t) { return t.id === initialTab; })) initialTab = "appearance";
    var activeTab = initialTab;
    var needsRefresh = false;
    var listening = null; /* 正在监听新按键的快捷键动作 id */

    var overlay = document.createElement("div");
    overlay.className = "settings-overlay";
    overlay.id = "settings-overlay";

    var tabsHtml = '<div class="settings-tabs" role="tablist" aria-label="设置分类" aria-orientation="vertical" data-settings-tabs>' +
      SETTINGS_TABS.map(function (t, index) {
        var active = t.id === initialTab;
        return '<button class="settings-tab' + (active ? " is-active" : "") + '" type="button" role="tab" id="st-tab-' + t.id + '" aria-controls="st-panel-' + t.id + '" aria-selected="' + (active ? "true" : "false") + '" tabindex="' + (active ? "0" : "-1") + '" data-settings-tab="' + t.id + '">' +
          '<span class="settings-tab-index">' + String(index + 1).padStart(2, "0") + "</span>" +
          '<span class="settings-tab-label">' + E(t.label) + "</span></button>";
      }).join("") + "</div>";
    var initialLabel = SETTINGS_TABS.filter(function (t) { return t.id === initialTab; })[0].label;

    overlay.innerHTML =
      '<div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1">' +
      '<header class="settings-dialog-head"><div><span class="eyebrow">SETTINGS</span><h2 id="settings-title">设置</h2></div><button class="icon-btn" type="button" data-settings-close aria-label="关闭设置">' + A().icon("close") + "</button></header>" +
      '<div class="settings-tabs-layout">' + tabsHtml +
      '<div class="settings-panels" data-settings-panels>' + settingsPanelsHtml() + "</div></div>" +
      '<footer class="settings-dialog-foot"><span>设置会立即生效</span><span class="settings-foot-tab"><i aria-hidden="true"></i><em data-foot-tab>' + E(initialLabel) + "</em></span></footer>" +
      "</div>";
    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");

    function switchTab(id, focus) {
      var target = SETTINGS_TABS.filter(function (t) { return t.id === id; })[0];
      if (!target) return;
      if (listening) {
        listening = null;
        refreshShortcutButtons();
        setShortcutHint(shortcutHintDefault());
      }
      activeTab = id;
      overlay.querySelectorAll("[data-settings-tab]").forEach(function (btn) {
        var on = btn.dataset.settingsTab === id;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.setAttribute("tabindex", on ? "0" : "-1");
        if (on && focus) {
          try { btn.focus({ preventScroll: true }); } catch (err) { btn.focus(); }
        }
      });
      overlay.querySelectorAll("[data-settings-panel]").forEach(function (panel) {
        var on = panel.dataset.settingsPanel === id;
        panel.classList.toggle("is-active", on);
        if (on) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
      });
      var foot = overlay.querySelector("[data-foot-tab]");
      if (foot) foot.textContent = target.label;
      storeValue(SETTINGS_TAB_STORE, id);
      /* 手机端标签横向滚动：把当前标签滚到可见区域 */
      var tabsEl = overlay.querySelector("[data-settings-tabs]");
      if (tabsEl && tabsEl.scrollWidth > tabsEl.clientWidth + 1) {
        var activeBtn = overlay.querySelector('[data-settings-tab="' + id + '"]');
        if (activeBtn) {
          try { activeBtn.scrollIntoView({ block: "nearest", inline: "center" }); } catch (err) { /* 忽略 */ }
        }
      }
    }
    overlay.__kcSwitchTab = switchTab;

    function syncSegs() {
      overlay.querySelectorAll("[data-seg]").forEach(function (group) {
        var key = group.dataset.seg;
        var current = key === "theme" ? themeChoice() : String(settingValue(key));
        group.querySelectorAll("[data-value]").forEach(function (btn) {
          var on = btn.dataset.value === current;
          btn.classList.toggle("is-active", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
      });
    }

    function syncToggles() {
      overlay.querySelectorAll("[data-setting-toggle]").forEach(function (input) {
        input.checked = !!settingValue(input.dataset.settingToggle);
      });
    }

    function syncVolume() {
      var pct = Math.round((Number(settingValue("volume")) || 0) * 100);
      var range = overlay.querySelector("[data-volume]");
      if (range) range.value = String(pct);
      var out = overlay.querySelector("[data-volume-value]");
      if (out) out.textContent = pct + "%";
    }

    function syncPreview() {
      var text = overlay.querySelector("[data-preview-text]");
      if (!text) return;
      var pv = previewMetrics();
      text.style.fontSize = pv.fontSize;
      text.style.width = pv.width;
      var meta = overlay.querySelector("[data-preview-meta]");
      if (meta) meta.textContent = pv.sizeLabel + "字号 · " + pv.widthLabel;
    }

    function syncGoal() {
      var goal = Number(settingValue("dailyGoal")) || 10;
      var minutes = todayMinutes();
      var pct = goal ? Math.min(100, Math.round((minutes / goal) * 100)) : 0;
      var label = overlay.querySelector("[data-goal-minutes]");
      if (label) label.textContent = minutes + " / " + goal + " 分钟";
      var bar = overlay.querySelector("[data-goal-bar]");
      if (bar) bar.style.width = pct + "%";
    }

    function syncBackup() {
      var note = overlay.querySelector("[data-backup-note]");
      if (!note) return;
      var raw = storedValue(SETTINGS_BACKUP_STORE, "");
      var ts = raw ? Number(raw) : 0;
      note.textContent = ts ? "最近备份：" + A().formatDate(ts) : "最近备份：还没有导出过备份";
    }

    function syncKeyboardPreview() {
      var stage = overlay.querySelector("[data-kb-stage]");
      if (stage) {
        stage.dataset.kbStyle = String(settingValue("keyboardStyle"));
        stage.dataset.kbSize = String(settingValue("keyboardSize"));
      }
      var kb = stage ? stage.querySelector(".kb") : null;
      if (kb) kb.classList.toggle("is-colored", !!settingValue("keyboardColors"));
      var meta = overlay.querySelector("[data-kb-meta]");
      if (meta) {
        var styleKey = String(settingValue("keyboardStyle"));
        var sizeKey = String(settingValue("keyboardSize"));
        meta.textContent = (KB_STYLE_LABELS[styleKey] || KB_STYLE_LABELS.flat) + "键帽 · " +
          (KB_SIZE_LABELS[sizeKey] || KB_SIZE_LABELS.m) + "号";
      }
    }

    function setShortcutHint(message) {
      var hint = overlay.querySelector("[data-shortcut-hint]");
      if (hint) hint.textContent = message;
    }

    /* 重新渲染快捷键行的键位标签与「恢复默认」可用状态 */
    function syncShortcuts() {
      var cur = currentShortcuts();
      SHORTCUT_ACTIONS.forEach(function (a) {
        var keys = overlay.querySelector('[data-shortcut-keys="' + a.id + '"]');
        if (keys) keys.innerHTML = shortcutKbdHtml(cur[a.id]);
        var reset = overlay.querySelector('[data-shortcut-reset="' + a.id + '"]');
        if (reset) reset.disabled = cur[a.id] === a.def;
      });
      var aboutKeys = overlay.querySelector("[data-about-keys]");
      if (aboutKeys) aboutKeys.innerHTML = aboutShortcutRowsHtml();
    }

    function refreshShortcutButtons() {
      overlay.querySelectorAll("[data-shortcut-change]").forEach(function (btn) {
        var on = listening === btn.dataset.shortcutChange;
        btn.textContent = on ? "请按键…" : "更换";
        btn.classList.toggle("is-listening", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      overlay.querySelectorAll("[data-shortcut-row]").forEach(function (row) {
        row.classList.toggle("is-listening", row.dataset.shortcutRow === listening);
      });
    }

    function startListening(id) {
      var action = shortcutAction(id);
      if (!action) return;
      if (listening === id) {
        listening = null;
        refreshShortcutButtons();
        setShortcutHint(shortcutHintDefault());
        return;
      }
      listening = id;
      refreshShortcutButtons();
      setShortcutHint("正在监听「" + action.label + "」：请按下新的快捷键，只按修饰键不会提交，Esc 取消。");
      var btn = overlay.querySelector('[data-shortcut-change="' + id + '"]');
      if (btn) {
        try { btn.focus({ preventScroll: true }); } catch (err) { btn.focus(); }
      }
    }

    function cancelListening() {
      listening = null;
      refreshShortcutButtons();
      setShortcutHint(shortcutHintDefault());
    }

    function isModifierKey(key) {
      return key === "Control" || key === "Shift" || key === "Alt" || key === "Meta" ||
        key === "AltGraph" || key === "CapsLock" || key === "OS" || key === "Super" || key === "Hyper";
    }

    var KEY_NAMES = {
      Esc: "Escape",
      Escape: "Escape",
      Spacebar: "Space",
      Enter: "Enter",
      Tab: "Tab",
      Backspace: "Backspace",
      Delete: "Delete",
      Del: "Delete",
      Insert: "Insert",
      Home: "Home",
      End: "End",
      PageUp: "PageUp",
      PageDown: "PageDown",
      Left: "ArrowLeft",
      Right: "ArrowRight",
      Up: "ArrowUp",
      Down: "ArrowDown"
    };

    var CODE_PUNCT = {
      Semicolon: ";",
      Quote: "'",
      Comma: ",",
      Period: ".",
      Slash: "/",
      Backslash: "\\",
      BracketLeft: "[",
      BracketRight: "]",
      Minus: "-",
      Equal: "=",
      Backquote: "`"
    };

    /* 把 keydown 事件规范成绑定字符串中的主键名 */
    function mainKeyName(e) {
      var code = e.code || "";
      var key = e.key || "";
      var letter = /^Key([A-Z])$/.exec(code);
      if (letter) return letter[1];
      if (/^Digit[0-9]$/.test(code)) return code.slice(5);
      if (/^Numpad[0-9]$/.test(code)) return "Numpad" + code.slice(6);
      if (CODE_PUNCT[code]) return CODE_PUNCT[code];
      if (key === " " || key === "Spacebar") return "Space";
      if (KEY_NAMES[key]) return KEY_NAMES[key];
      if (key.length === 1) {
        return /[a-z]/i.test(key) ? key.toUpperCase() : key;
      }
      if (/^Arrow(Up|Down|Left|Right)$/.test(key)) return key;
      if (/^F([1-9]|1[0-2])$/.test(key)) return key;
      return null;
    }

    /* Ctrl+Alt+Shift+主键（macOS 的 ⌘ 作为 Meta 追加在最后） */
    function bindingFromEvent(e) {
      var main = mainKeyName(e);
      if (!main) return "";
      var parts = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      if (e.metaKey) parts.push("Meta");
      parts.push(main);
      return parts.join("+");
    }

    function findShortcutConflict(id, binding) {
      var cur = currentShortcuts();
      var norm = String(binding).toLowerCase();
      var hit = null;
      SHORTCUT_ACTIONS.some(function (a) {
        if (a.id !== id && String(cur[a.id] || "").toLowerCase() === norm) {
          hit = a;
          return true;
        }
        return false;
      });
      return hit;
    }

    function commitShortcut(binding) {
      if (!listening) return;
      var action = shortcutAction(listening);
      if (!action) { cancelListening(); return; }
      var conflict = findShortcutConflict(action.id, binding);
      if (conflict) {
        var conflictMsg = "「" + binding + "」已用于「" + conflict.label + "」，请换一个组合键。";
        setShortcutHint(conflictMsg);
        A().toast(conflictMsg);
        return; /* 保持监听，方便直接再按一次 */
      }
      var next = currentShortcuts();
      next[action.id] = binding;
      A().updateSetting("shortcuts", next);
      if (A().applyTheme) A().applyTheme();
      listening = null;
      refreshShortcutButtons();
      syncShortcuts();
      notifyPractice();
      setShortcutHint("「" + action.label + "」已绑定为 " + binding + "，可在练习页使用。");
      A().toast("快捷键已更新：" + binding);
    }

    function resetShortcut(id) {
      var action = shortcutAction(id);
      if (!action) return;
      if (listening === id) {
        listening = null;
        refreshShortcutButtons();
      }
      var next = currentShortcuts();
      if (next[action.id] === action.def) {
        A().toast("「" + action.label + "」已经是默认快捷键");
        return;
      }
      next[action.id] = action.def;
      A().updateSetting("shortcuts", next);
      if (A().applyTheme) A().applyTheme();
      syncShortcuts();
      notifyPractice();
      setShortcutHint("「" + action.label + "」已恢复默认：" + action.def);
      A().toast("已恢复默认：" + action.def);
    }

    function afterChange() {
      syncSegs();
      syncToggles();
      syncVolume();
      syncPreview();
      syncGoal();
      syncKeyboardPreview();
      syncShortcuts();
      notifyPractice();
    }

    function refreshDataPanel() {
      var panel = overlay.querySelector('[data-settings-panel="data"]');
      if (!panel) return;
      panel.innerHTML = settingsDataPanelInner();
      syncSegs();
      syncGoal();
      syncBackup();
    }

    function clearPracticeRecords() {
      var progress = A().state.progress;
      progress.sessions = [];
      progress.gameSessions = [];
      progress.games = { rain: 0, rush: 0, sprint: 0, plays: 0 };
      Object.keys(progress.lessons || {}).forEach(function (id) {
        var rec = progress.lessons[id];
        if (!rec || typeof rec !== "object") return;
        rec.attempts = 0;
        rec.bestSpeed = 0;
        rec.bestAccuracy = 0;
        rec.bestAt = null;
        rec.bestLabel = "";
        rec.bestMode = "";
        rec.lastAt = null;
        rec.lastSpeed = 0;
        rec.lastAccuracy = 0;
      });
      A().saveState();
      needsRefresh = true;
      refreshDataPanel();
      A().toast("练习记录已清空，课程进度保留");
    }

    function close() {
      listening = null;
      overlay.remove();
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey, true);
      if (needsRefresh) refreshCurrentRoute();
    }

    function onKey(e) {
      if (!overlay.isConnected) {
        document.removeEventListener("keydown", onKey, true);
        return;
      }
      if (listening) {
        /* 监听状态下接管全部按键：阻止设置内其他快捷键与页面滚动 */
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
          cancelListening();
          A().toast("已取消更换快捷键");
          return;
        }
        if (e.repeat) return;
        if (isModifierKey(e.key) || e.key === "Dead" || e.key === "Unidentified") return;
        var binding = bindingFromEvent(e);
        if (!binding) return;
        commitShortcut(binding);
        return;
      }
      if (e.key !== "Escape") return;
      /* 确认框打开时先关确认框（app.js 的 Esc 处理在冒泡阶段），不要连带关闭设置 */
      if (document.querySelector(".result-overlay")) return;
      e.preventDefault();
      close();
    }

    function applySegChange(key, value) {
      if (key === "theme") {
        if (value === "system") {
          A().updateSetting("followSystem", true);
          if (A().applyTheme) A().applyTheme();
        } else {
          A().setTheme(value);
        }
      } else if (key === "dailyGoal") {
        A().updateSetting("dailyGoal", Number(value) || 10);
        if (A().applyTheme) A().applyTheme();
      } else {
        A().updateSetting(key, value);
        if (A().applyTheme) A().applyTheme();
      }
      afterChange();
    }

    function setToggle(key, checked) {
      A().updateSetting(key, checked);
      if (key === "keyboardColors") A().updateSetting("fingerColors", checked);
      if (A().applyTheme) A().applyTheme();
      afterChange();
    }

    document.addEventListener("keydown", onKey, true);

    var tablist = overlay.querySelector("[data-settings-tabs]");
    if (tablist) {
      tablist.addEventListener("keydown", function (e) {
        var index = SETTINGS_TABS.map(function (t) { return t.id; }).indexOf(activeTab);
        var next = -1;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); next = (index + 1) % SETTINGS_TABS.length; }
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); next = (index - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length; }
        else if (e.key === "Home") { e.preventDefault(); next = 0; }
        else if (e.key === "End") { e.preventDefault(); next = SETTINGS_TABS.length - 1; }
        if (next >= 0) switchTab(SETTINGS_TABS[next].id, true);
      });
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) { close(); return; }
      if (e.target.closest("[data-settings-close]")) { close(); return; }
      var tabBtn = e.target.closest("[data-settings-tab]");
      if (tabBtn) { switchTab(tabBtn.dataset.settingsTab, false); return; }
      var jumpBtn = e.target.closest("[data-jump-tab]");
      if (jumpBtn) { switchTab(jumpBtn.dataset.jumpTab, false); return; }
      var changeBtn = e.target.closest("[data-shortcut-change]");
      if (changeBtn) { startListening(changeBtn.dataset.shortcutChange); return; }
      var resetBtn = e.target.closest("[data-shortcut-reset]");
      if (resetBtn) { resetShortcut(resetBtn.dataset.shortcutReset); return; }
      var segBtn = e.target.closest("[data-seg] [data-value]");
      if (segBtn) {
        var group = segBtn.closest("[data-seg]");
        applySegChange(group.dataset.seg, segBtn.dataset.value);
        return;
      }
      if (e.target.closest("[data-sound-preview]")) { previewSound(); return; }
      if (e.target.closest("[data-export]")) { exportData(); syncBackup(); return; }
      if (e.target.closest("[data-import-trigger]")) {
        var input = overlay.querySelector("#import-file");
        if (input) input.click();
        return;
      }
      if (e.target.closest("[data-clear-sessions]")) {
        A().showConfirm("清空练习记录？", "练习历史、易错键与游戏分数会被删除，课程完成进度会保留。此操作无法撤销。", function () {
          clearPracticeRecords();
        });
        return;
      }
      if (e.target.closest("[data-settings-reset]")) {
        A().showConfirm("清空全部数据？", "课程进度、练习记录、每日挑战与游戏最高分都会被删除，且无法恢复。", function () {
          close();
          A().resetData();
        });
      }
    });

    overlay.addEventListener("change", function (e) {
      var toggle = e.target.closest("[data-setting-toggle]");
      if (toggle) { setToggle(toggle.dataset.settingToggle, toggle.checked); return; }
      if (e.target.id === "import-file" && e.target.files && e.target.files[0]) {
        importFile(e.target.files[0], close);
      }
    });

    overlay.addEventListener("input", function (e) {
      if (e.target.matches("[data-volume]")) {
        var v = Math.max(0, Math.min(1, Number(e.target.value) / 100));
        A().updateSetting("volume", v);
        var label = overlay.querySelector("[data-volume-value]");
        if (label) label.textContent = Math.round(v * 100) + "%";
        notifyPractice();
      }
    });

    switchTab(initialTab, false);
    syncSegs();
    syncToggles();
    syncVolume();
    syncPreview();
    syncGoal();
    syncBackup();
    syncKeyboardPreview();
    syncShortcuts();
    refreshShortcutButtons();

    var dialogEl = overlay.querySelector(".settings-dialog");
    if (dialogEl) {
      try { dialogEl.focus({ preventScroll: true }); } catch (err) { dialogEl.focus(); }
    }
  }

  function exportData() {
    var payload = {
      app: "keycraft",
      version: 2,
      exportedAt: new Date().toISOString(),
      settings: A().state.settings,
      progress: A().state.progress
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "keycraft-backup-" + dateKeyOf(todayDate()) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    storeValue(SETTINGS_BACKUP_STORE, String(Date.now()));
    A().toast("备份已导出");
  }

  function importFile(file, onDone) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(reader.result);
        if (!parsed || (!parsed.settings && !parsed.progress)) throw new Error("invalid");
      } catch (err) {
        A().toast("无法读取备份文件");
        return;
      }
      A().showConfirm("导入备份？", "当前课程进度、练习历史和游戏最高分会被覆盖。", function () {
        storeValue(SETTINGS_BACKUP_STORE, String(Date.now()));
        if (typeof onDone === "function") onDone();
        A().importState(parsed);
        A().toast("备份已导入");
      });
    };
    reader.readAsText(file);
  }

  window.FEATURES = {
    renderDaily: renderDaily,
    renderData: renderData,
    openSettings: openSettings,
    getDailyLesson: getDailyLesson,
    getTodayEnglish: function () { return TODAY_EN; },
    getTodayChinese: function () { return TODAY_ZH; }
  };
})();
