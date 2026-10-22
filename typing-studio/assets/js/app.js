/* 键艺 KeyCraft — 应用外壳、路由与页面 */
(function () {
  "use strict";

  var APP_EL = document.getElementById("app");
  var STORAGE_KEY = "keycraft.state.v1";
  var DEFAULT_STATE = {
    settings: {
      theme: "dark",
      followSystem: false,
      reduceMotion: false,
      sound: false,
      volume: 0.6,
      errorSound: true,
      comboHint: true,
      fingerColors: true,
      keyboardColors: true,
      keyboardVisible: true,
      practiceLength: "standard",
      typingSize: "m",
      lineWidth: "medium",
      strict: false,
      countdown: false,
      autoPause: true,
      showHint: true,
      showNextKey: true,
      wubiCodes: true,
      dailyGoal: 10,
      keyboardStyle: "flat",
      keyboardSize: "m",
      uiScale: "normal",
      shortcuts: {
        pause: "Escape",
        restart: "Ctrl+Enter",
        back: "Shift+Escape",
        skip: "Tab"
      }
    },
    progress: {
      lessons: {},
      sessions: [],
      games: { rain: 0, rush: 0, sprint: 0, plays: 0 },
      gameSessions: []
    }
  };

  var state = loadState();

  /* ---------------- storage ---------------- */
  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefault();
      var parsed = JSON.parse(raw);
      var merged = cloneDefault();
      if (parsed && parsed.settings) Object.assign(merged.settings, parsed.settings);
      if (parsed && parsed.progress) {
        merged.progress.lessons = parsed.progress.lessons || {};
        merged.progress.sessions = Array.isArray(parsed.progress.sessions)
          ? parsed.progress.sessions
          : [];
        merged.progress.games = Object.assign(
          { rain: 0, rush: 0, sprint: 0, plays: 0 },
          parsed.progress.games || {}
        );
        merged.progress.gameSessions = Array.isArray(parsed.progress.gameSessions)
          ? parsed.progress.gameSessions
          : [];
      }
      return merged;
    } catch (err) {
      return cloneDefault();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* 本地存储不可用时，页面仍可正常练习 */
    }
  }

  function systemTheme() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    } catch (err) {
      return "dark";
    }
  }

  function effectiveTheme() {
    if (state.settings.followSystem) return systemTheme();
    return state.settings.theme === "light" ? "light" : "dark";
  }

  function syncThemeButtons(theme) {
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.innerHTML = theme === "dark" ? icon("sun") : icon("moon");
    });
    document.querySelectorAll("[data-theme-choice]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.themeChoice === theme);
    });
  }

  function applyTheme() {
    var theme = effectiveTheme();
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    document.documentElement.setAttribute(
      "data-reduce-motion",
      state.settings.reduceMotion ? "true" : "false"
    );
    document.documentElement.setAttribute(
      "data-density",
      state.settings.density === "compact" ? "compact" : "comfortable"
    );
    document.documentElement.setAttribute(
      "data-keyboard-style",
      state.settings.keyboardStyle || "flat"
    );
    document.documentElement.setAttribute(
      "data-keyboard-size",
      state.settings.keyboardSize || "m"
    );
    document.documentElement.setAttribute(
      "data-ui-scale",
      state.settings.uiScale || "normal"
    );
    syncThemeButtons(theme);
    return theme;
  }

  applyTheme();

  /* ---------------- utils ---------------- */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function colorVar(color) {
    var map = {
      blue: "var(--blue)",
      green: "var(--green)",
      red: "var(--red)",
      amber: "var(--amber)",
      violet: "var(--violet)"
    };
    return map[color] || "var(--accent)";
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.round(seconds || 0));
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + pad2(s);
  }

  function formatDate(ts) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(ts));
    } catch (err) {
      return new Date(ts).toLocaleString();
    }
  }

  function plural(n, unit) {
    return n + " " + unit;
  }

  function getRecord(id) {
    return state.progress.lessons[id] || null;
  }

  function getCourseProgress(course) {
    var done = 0;
    var attempted = 0;
    course.lessons.forEach(function (lesson) {
      var rec = getRecord(lesson.id);
      if (rec && rec.completed) done += 1;
      if (rec && rec.attempts) attempted += 1;
    });
    var total = course.lessons.length;
    return {
      done: done,
      attempted: attempted,
      total: total,
      percent: total ? Math.round((done / total) * 100) : 0,
      next: course.lessons.filter(function (l) {
        var r = getRecord(l.id);
        return !r || !r.completed;
      })[0] || null
    };
  }

  function getGlobalStats() {
    var completed = 0;
    var courseLessonIds = {};
    getAllLessons().forEach(function (lesson) { courseLessonIds[lesson.id] = true; });
    Object.keys(state.progress.lessons).forEach(function (id) {
      if (courseLessonIds[id] && state.progress.lessons[id].completed) completed += 1;
    });
    var sessions = state.progress.sessions;
    var totalSeconds = sessions.reduce(function (sum, s) {
      return sum + (s.duration || 0);
    }, 0);
    var accSum = sessions.reduce(function (sum, s) {
      return sum + (s.accuracy || 0);
    }, 0);
    var bestSpeed = sessions.reduce(function (best, s) {
      return Math.max(best, s.speedValue || 0);
    }, 0);
    var errorMap = {};
    var modeCounts = {};
    sessions.forEach(function (s) {
      modeCounts[s.modeLabel || "练习"] = (modeCounts[s.modeLabel || "练习"] || 0) + 1;
      if (s.errorMap) {
        Object.keys(s.errorMap).forEach(function (k) {
          errorMap[k] = (errorMap[k] || 0) + s.errorMap[k];
        });
      }
    });
    return {
      completed: completed,
      sessions: sessions.length,
      totalMinutes: Math.round(totalSeconds / 60),
      totalSeconds: totalSeconds,
      avgAccuracy: sessions.length ? accSum / sessions.length : 0,
      bestSpeed: bestSpeed,
      errorMap: errorMap,
      modeCounts: modeCounts
    };
  }

  function formatDateKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function dayKey(offset) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + (offset || 0));
    return formatDateKey(d);
  }

  function getDailyStreak() {
    var days = {};
    state.progress.sessions.forEach(function (s) {
      days[formatDateKey(s.date)] = true;
    });
    var cursor = dayKey(0);
    if (!days[cursor]) cursor = dayKey(-1);
    var streak = 0;
    while (days[cursor] && streak < 9999) {
      streak += 1;
      var d = new Date(cursor + "T12:00:00");
      d.setDate(d.getDate() - 1);
      cursor = formatDateKey(d);
    }
    return streak;
  }

  function sessionsToday() {
    var today = dayKey(0);
    return state.progress.sessions.filter(function (s) {
      return formatDateKey(s.date) === today;
    });
  }

  function getAllLessons() {
    return COURSES.reduce(function (list, c) {
      return list.concat(c.lessons);
    }, []);
  }

  function getRecommendedLesson() {
    var all = getAllLessons();
    for (var i = 0; i < all.length; i++) {
      var rec = getRecord(all[i].id);
      if (!rec || !rec.completed) return all[i];
    }
    return all[0] || null;
  }

  function nextInCourse(lesson) {
    var c = getCourse(lesson.courseId);
    if (!c || !c.lessons) return null;
    var idx = c.lessons.indexOf(lesson);
    return idx >= 0 ? c.lessons[idx + 1] || null : null;
  }

  function courseOf(lesson) {
    return getCourse(lesson.courseId);
  }

  function lessonNumber(lesson) {
    var c = courseOf(lesson);
    var idx = c ? c.lessons.indexOf(lesson) : 0;
    return idx + 1;
  }

  function totalLessons() {
    return getAllLessons().length;
  }

  /* ---------------- icons ---------------- */
  var ICONS = {
    sun:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>',
    moon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"/></svg>',
    menu:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    play:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M7 4.5 19 12 7 19.5Z"/></svg>',
    keyboard:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>',
    chart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    sound:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    mute:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4Z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
    clock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>',
    refresh:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.6-2.4L20 9M4 15l2.3 2.4A7 7 0 0 0 17.9 15"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5v14M15 5v14"/></svg>',
    back:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    target:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>',
    book:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v18H5.5A2.5 2.5 0 0 1 3 18.5Z"/><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v18h5.5a2.5 2.5 0 0 0 2.5-2.5Z"/></svg>',
    flag:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-1.5 4L16 12H5"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    game:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M7 8h10a5 5 0 0 1 4.5 7.2l-1 2.1a2 2 0 0 1-3.3.6L15 15H9l-2.2 2.9a2 2 0 0 1-3.3-.6l-1-2.1A5 5 0 0 1 7 8Z"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1A1.7 1.7 0 0 0 9 19.3a1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    trophy:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
    upload:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
    flame:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3.5-7C14 6 13 4 13 2c-2 2-3 4-3 6 0 1.5 1 2.5 1 4-1-.5-2-1.5-2.5-3C6.7 11 5 13 5 15c0 4 3 7 7 7Z"/></svg>'
  };

  function icon(name) {
    return ICONS[name] || "";
  }

  /* ---------------- header / footer ---------------- */
  function navActive(route) {
    if (route.name === "home") return "home";
    if (route.name === "courses" || route.name === "course") return "courses";
    if (route.name === "lesson") return "courses";
    if (route.name === "daily") return "daily";
    if (route.name === "games") return "games";
    if (route.name === "keyboard") return "keyboard";
    return "";
  }

  function themeButton() {
    return (
      '<button class="icon-btn theme-toggle" type="button" data-action="theme" aria-label="切换深色 / 浅色主题">' +
      (state.settings.theme === "dark" ? icon("sun") : icon("moon")) +
      "</button>"
    );
  }

  function siteHeader(route) {
    var active = navActive(route);
    return (
      '<header class="site-header"><div class="header-inner">' +
      '<a class="brand" href="#/" aria-label="键艺首页"><span class="brand-mark">K</span><span class="brand-name">键艺<em>KEYCRAFT</em></span></a>' +
      '<nav class="site-nav" id="site-nav" aria-label="主导航">' +
      '<a class="nav-link ' + (active === "home" ? "is-active" : "") + '" href="#/">首页</a>' +
      '<a class="nav-link ' + (active === "courses" ? "is-active" : "") + '" href="#/courses">课程</a>' +
      '<a class="nav-link ' + (active === "daily" ? "is-active" : "") + '" href="#/daily">练习</a>' +
      '<a class="nav-link ' + (active === "games" ? "is-active" : "") + '" href="#/games">游戏</a>' +
      '<a class="nav-link ' + (active === "keyboard" ? "is-active" : "") + '" href="#/keyboard">指法</a>' +
      "</nav>" +
      '<div class="header-actions">' +
      '<a class="icon-btn header-tool' + (route.name === "data" ? " is-active" : "") + '" href="#/data" aria-label="学习数据" title="学习数据">' + icon("chart") + '<span class="header-tool-label">数据</span></a>' +
      '<button class="icon-btn header-tool" type="button" data-action="settings" aria-label="设置" title="设置">' + icon("settings") + '<span class="header-tool-label">设置</span></button>' +
      '<button class="icon-btn menu-toggle" type="button" data-action="menu" aria-label="打开导航" aria-expanded="false">' + icon("menu") + "</button>" +
      "</div></div></header>"
    );
  }

  function siteFooter() {
    return (
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-main">' +
      '<div class="footer-brand"><a class="brand" href="#/"><span class="brand-mark">K</span><span class="brand-name">键艺<em>KEYCRAFT</em></span></a><p>一个以课程为核心的中文打字练习室。四条学习路径，逐键反馈，纯色界面。</p></div>' +
      '<div class="footer-links">' +
      '<div class="footer-col"><h4>学习</h4><a href="#/courses">全部课程</a><a href="#/daily">练习</a><a href="#/lesson/en-k-a">单键 A</a><a href="#/lesson/zh-i-bpmf">声母 b p m f</a><a href="#/lesson/wb-k-g">字根单键 G</a></div>' +
      '<div class="footer-col"><h4>工具</h4><a href="#/keyboard">68 键指法图</a><a href="#/games">游戏</a><a href="#/data">学习数据</a><a href="#/settings">练习设置</a><a href="#/records">学习记录</a></div>' +
      '<div class="footer-col"><h4>说明</h4><span>深色 / 浅色主题</span><span>无渐变设计</span><span>进度保存在本地</span><span>无需登录</span></div>' +
      "</div></div>" +
      '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + " 键艺 KEYCRAFT</span><span>" + totalLessons() + " LESSONS · 68 KEYS · NO GRADIENTS</span></div>" +
      "</div></footer>"
    );
  }

  function renderSite(route, mainHtml) {
    APP_EL.innerHTML =
      '<div class="site-shell">' + siteHeader(route) + '<main class="site-main" id="main">' + mainHtml + "</main>" + siteFooter() + "</div>";
    initReveal();
  }

  /* ---------------- shared components ---------------- */
  function progressBar(percent, courseColor) {
    return (
      '<div class="progress" style="--course:' + courseColor + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '">' +
      '<i style="width:' + percent + '%"></i></div>'
    );
  }

  function keycap(label) {
    return '<span class="keycap">' + esc(label) + "</span>";
  }

  function courseCard(course, reveal) {
    var p = getCourseProgress(course);
    return (
      '<a class="course-card' + (reveal ? " reveal" : "") + '" data-color="' + course.color + '" href="#/course/' + course.id + '">' +
      '<div class="course-card-top"><span class="course-code">' + course.code + '</span><span class="course-card-arrow">↗</span></div>' +
      "<h3>" + esc(course.name) + "</h3>" +
      '<div class="course-en">' + esc(course.en) + "</div>" +
      "<p>" + esc(course.tagline) + "</p>" +
      '<div class="course-card-bottom">' +
      '<div class="course-card-meta"><span><strong>' + course.chapterCount + "</strong> 章</span><span><strong>" + course.lessonCount + "</strong> 课</span><span>" + esc(course.level) + "</span></div>" +
      '<div class="progress-meta"><span>学习进度</span><span>' + p.done + " / " + p.total + "</span></div>" +
      progressBar(p.percent, colorVar(course.color)) +
      "</div>" +
      '<span class="course-watermark" aria-hidden="true">' + course.code + "</span></a>"
    );
  }

  function heroKeyboard() {
    var kb = KEYBOARD.render({ mini: true, colored: false });
    return kb.outerHTML;
  }

  function keyboardSectionBlock() {
    var kb = KEYBOARD.render({ mini: true, colored: true });
    return (
      '<div class="keyboard-feature-visual">' +
      '<div class="kb-toolbar"><span>68 KEYS · 5 ROWS · 16 COLS</span><span>指法着色</span></div>' +
      kb.outerHTML +
      "</div>"
    );
  }

  function courseMap() {
    return COURSES.map(function (course) {
      var p = getCourseProgress(course);
      var visible = course.chapters.slice(0, 6);
      return (
        '<div class="map-col" style="--course:' + colorVar(course.color) + '">' +
        '<div class="map-col-head"><strong>' + esc(course.name) + "</strong><span>" + course.code + "</span></div>" +
        "<ul>" +
        visible
          .map(function (ch) {
            return "<li><span>" + esc(ch.title.replace(/^第[一二三四五六七八九十]+章 · /, "")) + "</span><em>" + ch.lessons.length + " 课</em></li>";
          })
          .join("") +
        (course.chapters.length > visible.length ? '<li><span class="dim">还有 ' + (course.chapters.length - visible.length) + " 个章节</span><em>→</em></li>" : "") +
        "</ul>" +
        '<div class="map-foot">' + p.done + "/" + p.total + " 已完成 <span>→</span></div>" +
        "</div>"
      );
    }).join("");
  }

  /* ---------------- home ---------------- */
  function renderHome() {
    var hero = heroKeyboard();
    var main =
      '<section class="hero"><div class="container hero-grid">' +
      '<div class="hero-copy">' +
      '<div class="hero-kicker"><span class="eyebrow"><span class="dot"></span> TYPE CRAFT <span class="slash">/</span> 打字练习室</span><span class="no-grad">NO GRADIENTS</span></div>' +
      '<h1><span class="line">把每一次敲击，</span><span class="line accent-line">练成本能。</span></h1>' +
      '<p class="hero-desc">以课程为主线的打字练习网站。英文、盲打、中文、五笔四条路径，从单键到段落，把准确变成习惯，再让速度自然发生。</p>' +
      '<div class="hero-actions"><a class="btn btn-primary" href="#/courses">开始学习 ' + icon("arrow") + '</a><a class="btn" href="#/daily">开始练习</a></div>' +
      '<dl class="hero-meta"><div><dt>COURSES</dt><dd>04<small>条路径</small></dd></div><div><dt>LESSONS</dt><dd>' + pad2(totalLessons()) + '<small>节精讲</small></dd></div><div><dt>KEYS</dt><dd>68<small>键位</small></dd></div><div><dt>LOCAL</dt><dd>100<small>% 本地</small></dd></div></dl>' +
      "</div>" +
      '<div class="hero-visual">' +
      '<div class="hero-card">' +
      '<div class="hero-card-bar"><span class="hero-card-label"><span class="live"></span> LIVE SESSION</span><span class="hero-card-code">LESSON 01 / ' + totalLessons() + '</span></div>' +
      '<div class="hero-typing-line"><span class="done">the quick brown fox </span><span class="current">j</span><span class="rest">umps over the lazy dog</span><span class="caret-block"></span></div>' +
      hero +
      '<div class="hero-card-foot"><span><strong>F</strong> / <strong>J</strong> 基准位已就绪</span><span>WPM <strong>68</strong> · ACC <strong>98.4%</strong></span></div>' +
      "</div>" +
      "</div></div></section>" +
      '<div class="signal-strip"><div class="container signal-strip-inner"><span>逐键反馈</span><span>指法着色</span><span>深浅主题</span><span>课程进度本地保存</span><span>无登录 · 无广告</span><span>PURE COLOR UI</span></div></div>' +
      '<section class="section" id="courses"><div class="container">' +
      '<div class="section-head"><div><span class="eyebrow"><span class="dot"></span> CURRICULUM</span><h2 class="section-title">四条路径，<br>从第一键开始。</h2></div><p class="section-sub">每条路径都拆成小章节和单节课程。先学动作，再练准确，最后用测试检验。你可以按顺序走，也可以从最需要的部分开始。</p></div>' +
      '<div class="course-grid">' + COURSES.map(function (c) { return courseCard(c, true); }).join("") + "</div>" +
      "</div></section>" +
      '<section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow"><span class="dot"></span> METHOD</span><h2 class="section-title">不是重复敲击，<br>而是刻意练习。</h2></div><p class="section-sub">每一课都遵循同一套闭环：先理解动作，再逐键练习，最后用数据复盘。准确率优先，速度是结果。</p></div>' +
      '<div class="method-grid">' +
      '<div class="method-item reveal"><span class="method-num">01 / 学</span><h3>读懂动作</h3><p>每课先讲清楚手指分工、动作路线和常见错误。知道为什么这样做，比盲目重复更重要。</p></div>' +
      '<div class="method-item reveal"><span class="method-num">02 / 练</span><h3>逐键反馈</h3><p>练习页实时标记对错，键盘高亮下一键，并显示该键由哪根手指负责。错了就停一下，重新做对。</p></div>' +
      '<div class="method-item reveal"><span class="method-num">03 / 测</span><h3>记录进步</h3><p>每次练习保存速度、准确率和用时。回看弱键和错点，下一次只练真正需要练的部分。</p></div>' +
      "</div></div></section>" +
      '<section class="section"><div class="container keyboard-feature">' + keyboardSectionBlock() +
      '<div class="keyboard-feature-copy"><span class="eyebrow"><span class="dot"></span> FINGER MAP</span><h2>68 个键，<br>整整齐齐。</h2><p>五条行、十六列，所有键都是规整的长方形。没有异形键，没有视觉噪音。用颜色标出每根手指的领地，让双手在键盘上找到自己的家。</p>' +
      '<div class="finger-legend">' +
      KEYBOARD.fingerOrder.map(function (id) {
        var f = KEYBOARD.fingers[id];
        return '<span><i style="--fc:' + f.color + '"></i>' + f.name + "</span>";
      }).join("") +
      '</div><a class="btn" href="#/keyboard">查看完整指法图 ' + icon("arrow") + "</a></div></div></section>" +
      '<section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow"><span class="dot"></span> COURSE MAP</span><h2 class="section-title">每一课，<br>都有清晰的落点。</h2></div><p class="section-sub">从单键、单指、单组声韵母到字根单键，每一课只增加少量新内容。你可以清楚看到自己走到哪里，下一步去哪里。</p></div><div class="map-grid">' + courseMap() + "</div></div></section>" +
      '<section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow"><span class="dot"></span> TOOLKIT</span><h2 class="section-title">练习之外，<br>还有一整套工具。</h2></div><p class="section-sub">每日挑战、打字游戏、课程数据、打字数据和练习设置。让练习有节奏，也让进步看得见。</p></div>' +
      '<div class="feature-grid">' +
      '<a class="feature-card" href="#/daily"><span class="feature-icon">' + icon("calendar") + '</span><span class="feature-index">01 / DAILY</span><h3>练习</h3><p>每天一组短挑战，连续打卡，保持手感。</p><div class="feature-stat"><strong>' + getDailyStreak() + '</strong><span>天连续练习</span></div></a>' +
      '<a class="feature-card" href="#/games"><span class="feature-icon">' + icon("game") + '</span><span class="feature-index">02 / GAMES</span><h3>游戏</h3><p>单词雨与键位冲刺，用游戏练反应和准确。</p><div class="feature-stat"><strong>' + Math.max(state.progress.games.rain || 0, state.progress.games.rush || 0) + '</strong><span>游戏最高分</span></div></a>' +
      '<a class="feature-card" href="#/data"><span class="feature-icon">' + icon("chart") + '</span><span class="feature-index">03 / DATA</span><h3>学习数据</h3><p>章节进度、速度曲线、准确率与易错键。</p><div class="feature-stat"><strong>' + getGlobalStats().sessions + '</strong><span>次练习记录</span></div></a>' +
      '<a class="feature-card" href="#/settings"><span class="feature-icon">' + icon("settings") + '</span><span class="feature-index">04 / SETTINGS</span><h3>练习设置</h3><p>主题、字号、音量、严格模式与键盘提示。</p><div class="feature-stat"><strong>' + (state.settings.theme === "dark" ? "DARK" : "LIGHT") + '</strong><span>当前主题</span></div></a>' +
      "</div></div></section>" +
      '<section class="section-tight"><div class="container"><div class="cta-band"><div><span class="eyebrow"><span class="dot"></span> START SMALL</span><h2>今天只练 10 分钟。</h2><p>从一个单键开始，把第一课走完。剩下的，交给每天的一点重复。</p></div><a class="btn btn-accent" href="#/daily">开始今日练习 ' + icon("arrow") + "</a></div></div></section>";
    renderSite({ name: "home" }, main);
  }

  /* ---------------- courses ---------------- */
  function renderCourses() {
    var stats = getGlobalStats();
    var main =
      '<section class="page-hero"><div class="container">' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>课程</span></div>' +
      "<h1>四条路径，<br>按自己的节奏走。</h1>" +
      '<p class="lead">英文键位、盲打技术、中文拼音、五笔拆字。每条路径都从零开始，拆成可以一次学完的小课。建议先选一条主线，学完基础再横向扩展。</p>' +
      '<div class="page-hero-stats">' +
      '<div class="page-hero-stat"><span>COURSES</span><strong>' + pad2(COURSES.length) + "</strong></div>" +
      '<div class="page-hero-stat"><span>LESSONS</span><strong>' + pad2(totalLessons()) + "</strong></div>" +
      '<div class="page-hero-stat"><span>CHAPTERS</span><strong>' + pad2(COURSES.reduce(function (n, c) { return n + c.chapterCount; }, 0)) + "</strong></div>" +
      '<div class="page-hero-stat"><span>COMPLETED</span><strong>' + pad2(stats.completed) + "</strong></div>" +
      "</div></div></section>" +
      '<section class="container"><div class="filter-bar" role="group" aria-label="筛选课程"><button class="filter-btn is-active" type="button" data-filter="all">全部课程</button>' +
      COURSES.map(function (c) {
        return '<button class="filter-btn" type="button" data-filter="' + c.id + '">' + esc(c.name) + "</button>";
      }).join("") +
      "</div>" +
      '<div class="catalog" id="catalog">' +
      COURSES.map(function (course) {
        var p = getCourseProgress(course);
        var href = "#/course/" + course.id;
        return (
          '<article class="catalog-item" data-course="' + course.id + '" data-color="' + course.color + '">' +
          '<div class="catalog-code"><strong>' + course.code + '</strong><span>' + course.chapterCount + " CHAPTERS</span></div>" +
          '<div class="catalog-main"><h2>' + esc(course.name) + '</h2><div class="en">' + esc(course.en) + "</div><p>" + esc(course.description) + "</p>" +
          '<div class="catalog-chapters">' + course.chapters.slice(0, 6).map(function (ch) { return "<span>" + esc(ch.title.replace(/^第[一二三四五六七八九十]+章 · /, "")) + "</span>"; }).join("") + (course.chapters.length > 6 ? "<span>+" + (course.chapters.length - 6) + " 章</span>" : "") + "</div></div>" +
          '<div class="catalog-side"><div class="catalog-stats"><div><span>LESSONS</span><strong>' + course.lessonCount + "</strong></div><div><span>PROGRESS</span><strong>" + p.percent + "%</strong></div><div><span>LEVEL</span><strong style=\"font-size:11px\">" + esc(course.level) + "</strong></div><div><span>DURATION</span><strong style=\"font-size:11px\">" + esc(course.duration) + "</strong></div></div>" +
          progressBar(p.percent, colorVar(course.color)) +
          '<a class="btn ' + (p.done ? "" : "btn-primary") + '" href="' + href + '">' + (p.done ? "继续学习" : p.attempted ? "继续学习" : "开始课程") + " " + icon("arrow") + "</a></div></article>"
        );
      }).join("") +
      "</div></section>" +
      '<section class="section-tight"><div class="container"><div class="note-band"><span class="eyebrow"><span class="dot"></span> HOW TO CHOOSE</span><p><strong>想快速提升日常输入：</strong>先学英文键位，再学中文拼音。<strong>想彻底摆脱看键盘：</strong>从盲打训练开始。<strong>需要大量输入、不想选词：</strong>直接进入五笔。四条课程并不互斥，先完成一条主线，再补其他。</p></div></div></section>';
    renderSite({ name: "courses" }, main);

    var bar = document.querySelector(".filter-bar");
    if (bar) {
      bar.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-filter]");
        if (!btn) return;
        var filter = btn.dataset.filter;
        bar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        document.querySelectorAll("#catalog .catalog-item").forEach(function (item) {
          item.style.display = filter === "all" || item.dataset.course === filter ? "" : "none";
        });
      });
    }
  }

  /* ---------------- course detail ---------------- */
  function renderCourse(courseId) {
    var course = getCourse(courseId);
    if (!course) return renderNotFound();
    var p = getCourseProgress(course);
    var color = colorVar(course.color);
    var startLesson = p.next || course.lessons[0];
    var main =
      '<section class="course-hero" data-color="' + course.color + '" style="--course:' + color + '"><div class="container">' +
      '<div class="course-hero-grid"><div>' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/courses">课程</a><span class="sep">/</span><span>' + esc(course.name) + "</span></div>" +
      '<div class="course-title-row"><div class="course-badge">' + course.code + '</div><div><h1>' + esc(course.name) + '</h1><div class="en">' + esc(course.en) + " · " + esc(course.level) + "</div></div></div>" +
      '<p class="course-hero-desc">' + esc(course.description) + "</p>" +
      '<div class="course-hero-tags"><span class="tag">' + course.chapterCount + " 章</span><span class=\"tag\">" + course.lessonCount + " 节课</span><span class=\"tag\">" + esc(course.duration) + "</span><span class=\"tag tag-solid\">逐键反馈</span></div>" +
      "</div>" +
      '<aside class="course-progress-card"><div class="course-progress-top"><span>YOUR PROGRESS</span><strong>' + p.percent + '%</strong></div>' +
      progressBar(p.percent, color) +
      '<a class="btn btn-primary" href="' + (startLesson ? "#/lesson/" + startLesson.id : "#/courses") + '">' + (p.done ? "继续下一课" : "从第一课开始") + " " + icon("arrow") + "</a>" +
      '<p class="course-progress-note">已完成 ' + p.done + " / " + p.total + " 节。进度保存在本机浏览器，不需要登录。</p></aside>" +
      "</div>" +
      '<div class="course-hero-bottom"><span><i class="dot"></i> ' + esc(course.tagline) + "</span><span>" + course.lessons.length + " LESSONS · " + course.chapterCount + " CHAPTERS</span></div>" +
      "</div></section>" +
      '<section class="curriculum" style="--course:' + color + '"><div class="container">' +
      course.chapters.map(function (ch) {
        return (
          '<div class="chapter"><div class="chapter-head"><span class="chapter-num">CH. ' + pad2(ch.index) + '</span><div><h2>' + esc(ch.title) + "</h2><p>" + esc(ch.lead) + '</p></div><span class="chapter-count">' + ch.lessons.length + " LESSONS</span></div>" +
          '<div class="lesson-list">' + ch.lessons.map(function (lesson) {
            var rec = getRecord(lesson.id);
            var done = rec && rec.completed;
            return '<a class="lesson-row' + (done ? " is-done" : "") + '" href="#/lesson/' + lesson.id + '">' +
              '<span class="lesson-index">' + pad2(lesson.index) + "</span>" +
              '<div class="lesson-row-main"><h3>' + esc(lesson.title) + "</h3><p>" + esc(lesson.summary) + "</p></div>" +
              '<span class="lesson-row-meta">' + (done ? '<span class="done">' + icon("check") + " 已完成</span>" : "") + "<span>" + lesson.minutes + " MIN</span><span>" + "Lv." + lesson.difficulty + "</span></span>" +
              '<span class="lesson-row-arrow">→</span></a>';
          }).join("") + "</div></div>"
        );
      }).join("") +
      "</div></section>";
    renderSite({ name: "course" }, main);
  }

  /* ---------------- lesson ---------------- */
  function focusChips(focus) {
    return focus.map(function (f) {
      if (f === "Space") return keycap("Space");
      return keycap(f);
    }).join("");
  }

  function drillPreview(lesson) {
    var rows = [];
    var total = 0;
    if (lesson.type === "latin") {
      total = lesson.drills.length;
      rows = lesson.drills.slice(0, 4).map(function (d) { return { text: d }; });
    } else if (lesson.type === "pinyin") {
      total = lesson.items.length;
      rows = lesson.items.slice(0, 4).map(function (i) { return { text: i.hanzi + "  ·  " + i.pinyin }; });
    } else if (lesson.type === "wubi") {
      total = lesson.items.length;
      rows = lesson.items.slice(0, 4).map(function (i) { return { text: i.hanzi + "  ·  " + i.code.toUpperCase() + "  ·  " + i.parts }; });
    }
    return {
      total: total,
      html: rows.map(function (r, idx) {
        return '<div class="drill-line"><span>' + pad2(idx + 1) + "</span><code>" + esc(r.text) + "</code></div>";
      }).join("")
    };
  }

  function renderLesson(lessonId) {
    var lesson = getLesson(lessonId);
    if (!lesson) return renderNotFound();
    var course = courseOf(lesson);
    var color = colorVar(course.color);
    var neighbors = getLessonNeighbors(lesson);
    var rec = getRecord(lesson.id);
    var preview = drillPreview(lesson);
    var practiceHref = "#/practice/" + lesson.id;
    var main =
      '<div class="lesson-page" style="--course:' + color + '"><div class="container">' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/courses">课程</a><span class="sep">/</span><a href="#/course/' + course.id + '">' + esc(course.name) + '</a><span class="sep">/</span><span>第 ' + pad2(lesson.index) + " 课</span></div>" +
      '<div class="lesson-layout"><div>' +
      '<header class="lesson-head">' +
      '<div class="lesson-head-meta"><span class="tag" style="color:' + color + ';border-color:' + color + '">' + esc(lesson.chapterTitle) + '</span><span class="tag">' + lesson.minutes + ' MIN</span><span class="tag">难度 Lv.' + lesson.difficulty + "</span>" + (rec && rec.completed ? '<span class="tag" style="color:var(--green);border-color:var(--green)">已完成</span>' : "") + "</div>" +
      "<h1>" + esc(lesson.title) + '</h1><div class="en">' + esc(lesson.en) + "</div>" +
      '<p class="summary">' + esc(lesson.summary) + "</p>" +
      '<div class="lesson-focus"><span class="lesson-focus-label">FOCUS KEYS</span>' + focusChips(lesson.focus) + "</div>" +
      '<a class="btn btn-accent lesson-head-cta" href="' + practiceHref + '">' + icon("play") + " 开始本课练习</a>" +
      "</header>" +
      '<div class="goals">' + lesson.goals.map(function (g, i) {
        return '<div class="goal"><span>GOAL ' + pad2(i + 1) + "</span><p>" + esc(g) + "</p></div>";
      }).join("") + "</div>" +
      '<article class="prose">' + lesson.sections.map(function (s, i) {
        return '<section class="prose-section"><h2><span class="num">' + pad2(i + 1) + "</span>" + esc(s.title) + "</h2>" + s.html + "</section>";
      }).join("") + "</article>" +
      '<div class="drill-preview"><div class="drill-preview-head"><h3>本课练习内容</h3><span>' + preview.total + " 组 · " + (lesson.type === "latin" ? "英文" : lesson.type === "pinyin" ? "拼音 / 输入法" : "五笔编码") + "</span></div><div class=\"drill-lines\">" + preview.html + '</div><div class="lesson-cta"><span class="note">练习页会逐键反馈，并保存本次成绩。</span><a class="btn btn-accent" href="' + practiceHref + '">开始练习 ' + icon("arrow") + "</a></div></div>" +
      '<div class="lesson-bottom-nav">' +
      (neighbors.prev ? '<a class="lesson-nav-card prev" href="#/lesson/' + neighbors.prev.id + '"><span>← PREVIOUS</span><strong>' + esc(neighbors.prev.title) + "</strong></a>" : "<span></span>") +
      (neighbors.next ? '<a class="lesson-nav-card next" href="#/lesson/' + neighbors.next.id + '"><span>NEXT →</span><strong>' + esc(neighbors.next.title) + "</strong></a>" : "<span></span>") +
      "</div></div>" +
      '<aside class="lesson-aside"><div class="aside-card"><span class="aside-eyebrow">PRACTICE</span><h3>准备好就开始，<br>不用追求一次完美。</h3><a class="btn btn-accent" href="' + practiceHref + '">' + icon("play") + " 开始本课练习</a>" +
      '<div class="aside-info"><div><span>所属课程</span><strong>' + esc(course.name) + "</strong></div><div><span>章节</span><strong>" + esc(lesson.chapterTitle.replace(/^第[一二三四五六七八九十]+章 · /, "")) + "</strong></div><div><span>预计用时</span><strong>" + lesson.minutes + " 分钟</strong></div><div><span>练习组数</span><strong>" + preview.total + " 组</strong></div></div></div>" +
      '<nav class="aside-nav" aria-label="课时导航">' +
      (neighbors.prev ? '<a href="#/lesson/' + neighbors.prev.id + '"><span>PREVIOUS</span><strong>' + esc(neighbors.prev.title) + "</strong></a>" : "") +
      (neighbors.next ? '<a href="#/lesson/' + neighbors.next.id + '"><span>NEXT</span><strong>' + esc(neighbors.next.title) + '</strong><em>→</em></a>' : "") +
      '<a href="#/course/' + course.id + '"><span>COURSE</span><strong>返回课程目录</strong><em>→</em></a>' +
      "</nav></aside></div></div></div>";
    renderSite({ name: "lesson" }, main);
  }

  /* ---------------- keyboard page ---------------- */
  function keysForFinger(finger) {
    var labels = [];
    KEYBOARD.rows.forEach(function (row) {
      row.forEach(function (k) {
        if (k.finger === finger) labels.push(k.label);
      });
    });
    return labels;
  }

  function selectKey(code) {
    var card = document.getElementById("key-detail");
    if (!card) return;
    var key = KEYBOARD.byCode(code) || KEYBOARD.byCode("KeyF");
    var f = KEYBOARD.fingers[key.finger];
    var sub = key.sub ? '<span class="tag">Shift + 此键 = ' + esc(key.sub) + "</span>" : "";
    card.innerHTML =
      '<span class="key-detail-label">SELECTED KEY</span>' +
      '<div class="key-detail-value"><strong>' + esc(key.label) + '</strong><span class="finger-chip" style="--fc:' + f.color + '"><i></i>' + esc(f.name) + "</span></div>" +
      '<p style="margin-top:12px;color:var(--muted);font-size:12px;line-height:1.7">' + esc(key.title) + "。由" + esc(f.name) + "负责，位于第 " + key.row + " 行，从左数第 " + (key.col + 1) + " 个键" + (key.w > 1 ? "（宽 " + key.w + "u）" : "") + "。" + "</p>" +
      sub +
      '<div class="key-detail-grid"><div><span>FINGER</span><strong>' + f.short + " · " + esc(f.name) + "</strong></div><div><span>HAND</span><strong>" + esc(f.hand) + "</strong></div><div><span>ROW</span><strong>" + key.row + " / 5</strong></div><div><span>KEY CODE</span><strong>" + esc(key.code) + "</strong></div></div>" +
      '<p style="margin-top:16px;color:var(--dim);font-size:10px;line-height:1.6">击键后回到基准位。' + (key.finger === "th" ? "拇指只负责空格，不要参与字母区。" : "不要用相邻手指代按，固定分工才会形成肌肉记忆。") + "</p>";
  }

  function handGuideVisual() {
    var spots = [
      { id: "lp", x: 4.8, y: 20, side: "左手" },
      { id: "lr", x: 11.3, y: 4, side: "左手" },
      { id: "lm", x: 17.0, y: 4, side: "左手" },
      { id: "li", x: 24.0, y: 7.5, side: "左手" },
      { id: "th", x: 34.7, y: 41, side: "左拇指" },
      { id: "th", x: 65.1, y: 41, side: "右拇指" },
      { id: "ri", x: 75.6, y: 7.5, side: "右手" },
      { id: "rm", x: 83.2, y: 4, side: "右手" },
      { id: "rr", x: 89.5, y: 5, side: "右手" },
      { id: "rp", x: 95.8, y: 13, side: "右手" }
    ];
    var spotHtml = spots
      .map(function (spot) {
        var f = KEYBOARD.fingers[spot.id];
        var keys = keysForFinger(spot.id).join(" ");
        return (
          '<span class="hand-spot" style="left:' + spot.x + "%;top:" + spot.y + "%;--fc:" + f.color + '" title="' + esc(spot.side + " · " + f.name + " · " + keys) + '">' +
          "<i></i><b>" + f.short + "</b></span>"
        );
      })
      .join("");
    var legend = KEYBOARD.fingerOrder
      .map(function (id) {
        var f = KEYBOARD.fingers[id];
        var keys = keysForFinger(id);
        return (
          '<span style="--fc:' + f.color + '" title="' + esc(f.name + "：" + keys.join(" ")) + '">' +
          "<i></i>" + esc(f.name) + "<em>" + f.short + "</em><small>" + esc(keys.slice(0, 4).join(" ")) + "</small></span>"
        );
      })
      .join("");
    return (
      '<div class="hand-visual">' +
      '<img src="assets/img/hands.png" alt="左右手自然弯曲、放在基准键上的线稿示意图，每个指尖标注负责手指的颜色与编号">' +
      '<div class="hand-spots" aria-hidden="true">' + spotHtml + "</div>" +
      "</div>" +
      '<div class="hand-color-legend" aria-label="手指颜色对照">' + legend + "</div>"
    );
  }

  function renderKeyboardPage() {
    var kb = KEYBOARD.render({ colored: true, interactive: true });
    var main =
      '<section class="page-hero"><div class="container">' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>68 键指法</span></div>' +
      '<h1>五条行，十六列，<br>每根手指都有自己的家。</h1>' +
      '<p class="lead">这是一块 68 键紧凑键盘。所有按键都是规整的长方形，按网格对齐；右侧一列是 Insert / Delete / PgUp / PgDn，方向键收在右下角。颜色只用来标记负责的手指，不制造视觉噪音。点击任意键，查看它的指法信息。</p>' +
      '<div class="page-hero-stats">' +
      '<div class="page-hero-stat"><span>KEYS</span><strong>68</strong></div><div class="page-hero-stat"><span>ROWS</span><strong>05</strong></div><div class="page-hero-stat"><span>COLS</span><strong>16</strong></div><div class="page-hero-stat"><span>FINGERS</span><strong>09</strong></div></div>' +
      "</div></section>" +
      '<section class="keyboard-page"><div class="container"><div class="keyboard-layout">' +
      '<div><div class="keyboard-stage"><div class="kb-toolbar"><span>CLICK A KEY TO INSPECT</span><label class="kb-switch"><input type="checkbox" id="kb-color-toggle" checked> 指法着色</label></div><div id="keyboard-stage">' + kb.outerHTML + "</div>" + KEYBOARD.makeLegend("kb-legend").outerHTML + "</div>" +
      '<div class="keyboard-rules"><div class="keyboard-rule-card"><span>01 / HOME</span><h3>F 与 J 是锚点</h3><p>每次开始打字前，先用手感找到 F / J 的凸起。每一次离键，都回到这里。</p></div><div class="keyboard-rule-card"><span>02 / DIVISION</span><h3>一键一指，不借指</h3><p>每个键只由一根手指负责。食指覆盖两列，其余手指各守一键。</p></div><div class="keyboard-rule-card"><span>03 / LIGHT</span><h3>轻触，不砸键</h3><p>用刚好触发按键的力度。手腕悬空、平直，指节自然弯曲。</p></div></div></div>' +
      '<aside class="keyboard-detail"><div class="key-detail-card" id="key-detail" aria-live="polite"></div>' +
      '<div class="aside-card" style="margin-top:14px"><span class="aside-eyebrow">HAND GUIDE</span><p class="aside-note">手指分工、回位和常见代偿都整理在下方的手型讲解里。点击左侧任意键，可以查看单键的负责手指和击键路线。</p></div></aside></div></div></section>' +
      '<section class="hand-guide-section"><div class="container"><div class="hand-guide-grid">' +
      '<figure class="hand-guide-figure">' + handGuideVisual() + '<figcaption>颜色相同的指尖由同一根手指负责：左手 <strong>L5→L2</strong>，右手 <strong>R2→R5</strong>，拇指 <strong>T</strong> 只负责空格。图上标注的编号与下方卡片一致。</figcaption></figure>' +
      '<div class="hand-guide-copy"><span class="eyebrow"><span class="dot"></span> HAND GUIDE</span><h2>手型比速度更重要。</h2>' +
      '<p>手腕保持平直、轻微悬空；手指自然弯曲，用指腹前部触键。左手负责键盘左半区，右手负责右半区，F / J 是两个锚点。每次离键后回到基准位，动作越短，错误越少。</p>' +
      '<div class="hand-tip-list"><div><strong>01</strong><p>手腕不要压在桌面上，前臂与键盘大致平行。</p></div><div><strong>02</strong><p>只让负责的手指动，其他手指贴着基准键。</p></div><div><strong>03</strong><p>轻触即回，不要用整只手去“砸”键。</p></div><div><strong>04</strong><p>眼睛看屏幕；用 F / J 的凸起确认位置。</p></div></div></div>' +
      "</div>" +
      '<div class="hand-finger-grid">' +
      KEYBOARD.fingerOrder.map(function (id) {
        var f = KEYBOARD.fingers[id];
        var tips = {
          lp: "小指最弱，先练独立，不要带动无名指。",
          lr: "无名指容易借力，保持 A / D 贴键。",
          lm: "中指力量足，注意轻触，不要抬腕。",
          li: "负责两列，伸展后回到 F 的凸起。",
          th: "只负责空格，手掌保持稳定。",
          ri: "负责两列，H / N / M 后回到 J。",
          rm: "守在 K 上，不要用食指代按。",
          rr: "小指不要翘起，句号由无名指完成。",
          rp: "跨度最大，慢练 P / 分号 / 斜杠。"
        };
        return '<div class="hand-finger-card" style="--fc:' + f.color + '"><span class="hand-finger-keys">' + keysForFinger(id).slice(0, 6).join(" ") + '</span><strong>' + f.name + '</strong><p>' + tips[id] + "</p></div>";
      }).join("") +
      "</div></div></section>";
    renderSite({ name: "keyboard" }, main);
    selectKey("KeyF");

    var stage = document.getElementById("keyboard-stage");
    if (stage) {
      stage.addEventListener("click", function (e) {
        var key = e.target.closest(".kb-key");
        if (key) selectKey(key.dataset.code);
      });
      stage.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          var key = e.target.closest(".kb-key");
          if (key) {
            e.preventDefault();
            selectKey(key.dataset.code);
          }
        }
      });
    }
    var toggle = document.getElementById("kb-color-toggle");
    if (toggle) {
      toggle.addEventListener("change", function () {
        var kbEl = stage ? stage.querySelector(".kb") : null;
        if (kbEl) kbEl.classList.toggle("is-colored", toggle.checked);
      });
    }
  }

  /* ---------------- records ---------------- */
  function renderRecords() {
    var stats = getGlobalStats();
    var sessions = state.progress.sessions.slice(0, 20);
    var main =
      '<section class="page-hero"><div class="container">' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>学习记录</span></div>' +
      "<h1>所有进步，<br>都留在这里。</h1>" +
      '<p class="lead">练习记录保存在当前浏览器。没有账号，也没有云端同步；清除浏览器数据前，请记得这里的数据也会一起清除。</p>' +
      "</div></section>" +
      '<section class="records-page"><div class="container">' +
      '<div class="record-overview">' +
      '<div class="record-stat"><span>LESSONS DONE</span><strong>' + stats.completed + "</strong><small>共 " + totalLessons() + " 节课</small></div>" +
      '<div class="record-stat"><span>SESSIONS</span><strong>' + stats.sessions + "</strong><small>累计练习次数</small></div>" +
      '<div class="record-stat"><span>TIME</span><strong>' + stats.totalMinutes + "</strong><small>累计分钟</small></div>" +
      '<div class="record-stat"><span>AVG ACC</span><strong>' + (stats.sessions ? stats.avgAccuracy.toFixed(1) : "0.0") + "</strong><small>平均准确率 %</small></div>" +
      "</div>" +
      '<div class="record-section"><div class="record-section-head"><h2>课程进度</h2><span>4 TRACKS</span></div><div class="record-courses">' +
      COURSES.map(function (course) {
        var p = getCourseProgress(course);
        return '<a class="record-course" data-color="' + course.color + '" href="#/course/' + course.id + '"><strong>' + course.code + '</strong><div><h3>' + esc(course.name) + "</h3><p>" + p.done + " / " + p.total + " 节 · " + p.percent + '%</p></div><div class="progress-wrap">' + progressBar(p.percent, colorVar(course.color)) + "</div></a>";
      }).join("") +
      "</div></div>" +
      '<div class="record-section"><div class="record-section-head"><h2>最近练习</h2><span>' + sessions.length + " RECORDS</span></div>" +
      (sessions.length
        ? '<table class="history-table"><thead><tr><th>课程 / 课时</th><th>模式</th><th>速度</th><th>准确率</th><th>用时</th><th>时间</th></tr></thead><tbody>' +
          sessions.map(function (s) {
            var course = getCourse(s.courseId);
            var lesson = getLesson(s.lessonId);
            return "<tr><td>" + esc(course ? course.name : "") + " · " + esc(lesson ? lesson.title : s.lessonId) + '</td><td class="num">' + esc(s.modeLabel || "练习") + '</td><td class="num">' + esc(s.speedLabel || "") + " " + (s.speedValue != null ? s.speedValue.toFixed(0) : "") + '</td><td class="num">' + (s.accuracy != null ? s.accuracy.toFixed(1) : "0") + '%</td><td class="num">' + formatTime(s.duration) + '</td><td class="num">' + formatDate(s.date) + "</td></tr>";
          }).join("") + "</tbody></table>"
        : '<div class="history-empty">还没有练习记录。完成任意一节课的练习后，成绩会出现在这里。</div>') +
      "</div>" +
      '<div class="record-actions"><p>所有数据仅保存在本机浏览器。换设备或清除站点数据后无法恢复。</p><button class="danger-link" type="button" data-action="reset-data">清空全部学习记录</button></div>' +
      "</div></section>";
    renderSite({ name: "records" }, main);
  }

  function renderNotFound() {
    var main =
      '<section class="page-hero"><div class="container"><div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>404</span></div><h1>这一页没有键位。</h1><p class="lead">链接可能写错了，或者课程已经移动。回到课程目录，重新选择一条路径。</p><div class="hero-actions"><a class="btn btn-primary" href="#/courses">浏览课程 ' + icon("arrow") + '</a><a class="btn" href="#/">回到首页</a></div></div></section>';
    renderSite({ name: "404" }, main);
  }

  /* ---------------- theme / toast / menu ---------------- */
  function setTheme(theme) {
    state.settings.theme = theme === "light" ? "light" : "dark";
    state.settings.followSystem = false;
    saveState();
    applyTheme();
    return state.settings.theme;
  }

  function toggleTheme() {
    return setTheme(effectiveTheme() === "dark" ? "light" : "dark");
  }

  function updateSetting(key, value) {
    state.settings[key] = value;
    saveState();
    if (key === "followSystem" || key === "reduceMotion" || key === "density" || key === "theme" ||
      key === "keyboardStyle" || key === "keyboardSize" || key === "uiScale") {
      applyTheme();
    }
    return value;
  }

  function importState(next) {
    if (!next || typeof next !== "object") return false;
    var merged = cloneDefault();
    if (next.settings) Object.assign(merged.settings, next.settings);
    if (next.progress) {
      merged.progress.lessons = next.progress.lessons || {};
      merged.progress.sessions = Array.isArray(next.progress.sessions) ? next.progress.sessions : [];
      merged.progress.games = Object.assign({ rain: 0, rush: 0, sprint: 0, plays: 0 }, next.progress.games || {});
      merged.progress.gameSessions = Array.isArray(next.progress.gameSessions) ? next.progress.gameSessions : [];
    }
    state = merged;
    applyTheme();
    saveState();
    route();
    return true;
  }

  var toastTimer = null;
  function toast(message) {
    var el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove("is-visible");
    }, 2200);
  }

  function closeMenu() {
    var nav = document.getElementById("site-nav");
    var btn = document.querySelector(".menu-toggle");
    if (nav) nav.classList.remove("is-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  /* ---------------- data mutations ---------------- */
  function completeLesson(lesson, result) {
    var rec = state.progress.lessons[lesson.id] || {
      attempts: 0,
      completed: false,
      bestSpeed: 0,
      bestAccuracy: 0,
      bestAt: null,
      bestLabel: result.speedLabel,
      bestMode: result.modeLabel
    };
    rec.attempts += 1;
    rec.completed = true;
    rec.lastAt = Date.now();
    rec.lastSpeed = result.speedValue;
    rec.lastAccuracy = result.accuracy;
    if (!rec.bestAt || result.speedValue > rec.bestSpeed || (result.speedValue === rec.bestSpeed && result.accuracy > rec.bestAccuracy)) {
      rec.bestSpeed = result.speedValue;
      rec.bestAccuracy = result.accuracy;
      rec.bestAt = Date.now();
      rec.bestLabel = result.speedLabel;
      rec.bestMode = result.modeLabel;
    }
    state.progress.lessons[lesson.id] = rec;
    state.progress.sessions.unshift({
      lessonId: lesson.id,
      courseId: lesson.courseId,
      date: Date.now(),
      duration: Math.round(result.duration),
      accuracy: result.accuracy,
      speedValue: result.speedValue,
      speedLabel: result.speedLabel,
      modeLabel: result.modeLabel,
      errors: result.errors,
      errorMap: result.errorMap || {},
      maxCombo: result.maxCombo || 0,
      keystrokes: result.keystrokes || 0
    });
    state.progress.sessions = state.progress.sessions.slice(0, 80);
    saveState();
    return rec;
  }

  function resetData() {
    state = cloneDefault();
    applyTheme();
    saveState();
    closeMenu();
    route();
  }

  /* ---------------- reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- confirm dialog ---------------- */
  function showConfirm(title, text, onConfirm) {
    var overlay = document.createElement("div");
    overlay.className = "result-overlay";
    overlay.innerHTML =
      '<div class="result-card" style="width:min(100%,430px)"><div class="result-head"><div><span class="eyebrow">CONFIRM</span><h2 style="font-size:24px">' + esc(title) + "</h2><p style=\"max-width:none\">" + esc(text) + '</p></div></div><div class="result-actions"><button class="btn" type="button" data-confirm="cancel">取消</button><button class="btn btn-accent" type="button" data-confirm="yes">确认清空</button></div></div>';
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) return close();
      var b = e.target.closest("[data-confirm]");
      if (!b) return;
      if (b.dataset.confirm === "yes") {
        close();
        onConfirm();
      } else {
        close();
      }
    });
    var yes = overlay.querySelector('[data-confirm="yes"]');
    if (yes) yes.focus();
  }

  /* ---------------- routing ---------------- */
  function parseRoute() {
    var rawHash = window.location.hash.replace(/^#\/?/, "");
    var hash = rawHash;
    try {
      hash = decodeURIComponent(rawHash);
    } catch (err) {
      hash = rawHash;
    }
    var parts = hash.split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "courses") return { name: "courses" };
    if (parts[0] === "course" && parts[1]) return { name: "course", id: parts[1] };
    if (parts[0] === "lesson" && parts[1]) return { name: "lesson", id: parts[1] };
    if (parts[0] === "practice" && parts[1]) return { name: "practice", id: parts[1] };
    if (parts[0] === "daily") return { name: "daily" };
    if (parts[0] === "games") return { name: "games" };
    if (parts[0] === "data") return { name: "data", tab: parts[1] || "course" };
    if (parts[0] === "settings") return { name: "settings" };
    if (parts[0] === "keyboard") return { name: "keyboard" };
    if (parts[0] === "records") return { name: "data", tab: "typing" };
    return { name: "notfound" };
  }

  var lastRoute = null;

  function route() {
    closeMenu();
    var settingsOverlay = document.getElementById("settings-overlay");
    if (settingsOverlay) {
      settingsOverlay.remove();
      document.body.classList.remove("no-scroll");
    }
    var r = parseRoute();
    if (lastRoute && lastRoute.name === "practice" && r.name !== "practice") {
      if (window.PRACTICE) window.PRACTICE.destroy();
    }
    if (lastRoute && lastRoute.name === "games" && r.name !== "games") {
      if (window.GAME) window.GAME.destroy();
    }
    lastRoute = r;
    document.documentElement.classList.toggle("home-snap", r.name === "home");
    if (r.name !== "home" && slowWheel.raf) {
      window.cancelAnimationFrame(slowWheel.raf);
      slowWheel.raf = 0;
      document.documentElement.style.scrollSnapType = "";
      document.documentElement.style.scrollBehavior = "";
    }
    document.body.classList.toggle("route-practice", r.name === "practice");
    if (r.name === "home") {
      renderHome();
    } else if (r.name === "courses") {
      renderCourses();
    } else if (r.name === "course") {
      renderCourse(r.id);
    } else if (r.name === "lesson") {
      renderLesson(r.id);
    } else if (r.name === "practice") {
      var lesson = getLesson(r.id);
      if (!lesson) return renderNotFound();
      if (!window.PRACTICE) return renderNotFound();
      window.PRACTICE.mount(lesson, {
        settings: state.settings,
        onComplete: function (result) { return completeLesson(lesson, result); },
        onSettingsChange: function (patch) {
          Object.assign(state.settings, patch);
          saveState();
        },
        onToggleTheme: toggleTheme,
        onToast: toast,
        onOpenSettings: function () { if (window.FEATURES) window.FEATURES.openSettings(); },
        getNextLesson: function () { return nextInCourse(lesson); },
        getProgress: function () { return getRecord(lesson.id); }
      });
    } else if (r.name === "keyboard") {
      renderKeyboardPage();
    } else if (r.name === "daily") {
      if (window.FEATURES) window.FEATURES.renderDaily();
      else renderNotFound();
    } else if (r.name === "games") {
      if (window.GAME) window.GAME.renderPage();
      else renderNotFound();
    } else if (r.name === "data") {
      if (window.FEATURES) window.FEATURES.renderData(r.tab);
      else renderNotFound();
    } else if (r.name === "settings") {
      renderHome();
      window.setTimeout(function () {
        if (window.FEATURES) window.FEATURES.openSettings();
      }, 0);
    } else {
      renderNotFound();
    }
    document.title = getTitle(r);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function getTitle(r) {
    if (r.name === "home") return "键艺 KeyCraft — 打字练习室";
    if (r.name === "courses") return "全部课程 — 键艺 KeyCraft";
    if (r.name === "keyboard") return "68 键指法图 — 键艺 KeyCraft";
    if (r.name === "daily") return "练习 — 键艺 KeyCraft";
    if (r.name === "games") return "游戏 — 键艺 KeyCraft";
    if (r.name === "data") return "学习数据 — 键艺 KeyCraft";
    if (r.name === "settings") return "设置 — 键艺 KeyCraft";
    if (r.name === "records") return "学习记录 — 键艺 KeyCraft";
    if (r.name === "course") {
      var c = getCourse(r.id);
      return c ? c.name + " — 键艺 KeyCraft" : "课程 — 键艺 KeyCraft";
    }
    if (r.name === "lesson") {
      var l = getLesson(r.id);
      return l ? l.title + " — 键艺 KeyCraft" : "课程 — 键艺 KeyCraft";
    }
    if (r.name === "practice") {
      var pl = getLesson(r.id);
      return pl ? "练习 · " + pl.title + " — 键艺 KeyCraft" : "练习 — 键艺 KeyCraft";
    }
    return "键艺 KeyCraft";
  }

  /* ---------------- 首页整屏滚动 ---------------- */
  var slowWheel = { raf: 0, lastWheelAt: 0 };

  function homeSnapNodes() {
    var nodes = document.querySelectorAll(".home-snap .hero, .home-snap .section, .home-snap .section-tight, .home-snap .site-footer");
    return Array.prototype.slice.call(nodes);
  }

  function snapTargets() {
    var header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 66;
    return homeSnapNodes().map(function (node) {
      return Math.max(0, Math.round(node.getBoundingClientRect().top + window.scrollY - header));
    });
  }

  function animateToSection(target) {
    var from = window.scrollY;
    var dist = target - from;
    if (Math.abs(dist) < 2) return;
    var duration = Math.min(480, Math.max(300, 320 + Math.abs(dist) * 0.14));
    var started = performance.now();
    document.documentElement.style.scrollSnapType = "none";
    document.documentElement.style.scrollBehavior = "auto";
    var frame = function (now) {
      var p = Math.min(1, (now - started) / duration);
      var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.scrollTo(0, from + dist * eased);
      if (p < 1) {
        slowWheel.raf = window.requestAnimationFrame(frame);
      } else {
        slowWheel.raf = 0;
        window.scrollTo(0, target);
        document.documentElement.style.scrollSnapType = "";
        document.documentElement.style.scrollBehavior = "";
        slowWheel.lastWheelAt = performance.now();
      }
    };
    slowWheel.raf = window.requestAnimationFrame(frame);
  }

  function onSlowWheel(e) {
    if (!document.documentElement.classList.contains("home-snap")) return;
    if (window.innerWidth < 1200) return;
    if (state.settings.reduceMotion) return;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch (err) {
      /* 忽略不支持媒体查询的环境 */
    }
    if (document.getElementById("settings-overlay") || document.getElementById("game-overlay")) return;
    if (e.ctrlKey || e.metaKey) return;
    if (e.target && e.target.closest && e.target.closest("textarea, input, select, .kb-wrap, .table-wrap, .game-panel, [data-no-slow-scroll]")) return;
    e.preventDefault();

    var now = performance.now();
    var since = now - slowWheel.lastWheelAt;
    slowWheel.lastWheelAt = now;
    if (slowWheel.raf) return;
    if (since < 200) return;

    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 16;
    else if (e.deltaMode === 2) delta *= window.innerHeight;
    if (Math.abs(delta) < 1) return;

    var targets = snapTargets();
    if (!targets.length) return;
    var y = window.scrollY;
    var current = 0;
    for (var i = 0; i < targets.length; i++) {
      if (y >= targets[i] - 8) current = i;
    }
    var dir = delta > 0 ? 1 : -1;
    var next = current + dir;
    if (next < 0) next = 0;
    if (next >= targets.length) next = targets.length - 1;
    if (next === current) return;
    animateToSection(targets[next]);
  }

  window.addEventListener("wheel", onSlowWheel, { passive: false });

  /* ---------------- global events ---------------- */
  document.addEventListener("click", function (e) {
    var actionEl = e.target.closest("[data-action]");
    if (actionEl) {
      var action = actionEl.dataset.action;
      if (action === "theme") {
        toggleTheme();
        return;
      }
      if (action === "menu") {
        var nav = document.getElementById("site-nav");
        var open = nav.classList.toggle("is-open");
        actionEl.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      if (action === "reset-data") {
        showConfirm("清空学习记录？", "所有课程进度、练习成绩和历史记录都会被删除，且无法恢复。", resetData);
        return;
      }
      if (action === "settings") {
        if (window.FEATURES) window.FEATURES.openSettings();
        return;
      }
    }
    var navLink = e.target.closest(".site-nav a");
    if (navLink) closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMenu();
      var overlay = document.querySelector(".result-overlay");
      if (overlay && !overlay.dataset.locked) overlay.remove();
    }
  });

  window.addEventListener("hashchange", route);
  try {
    var themeQuery = window.matchMedia("(prefers-color-scheme: light)");
    var onSystemThemeChange = function () {
      if (state.settings.followSystem) applyTheme();
    };
    if (themeQuery.addEventListener) themeQuery.addEventListener("change", onSystemThemeChange);
    else if (themeQuery.addListener) themeQuery.addListener(onSystemThemeChange);
  } catch (err) {
    /* 不支持媒体查询时保持当前主题 */
  }
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) {
      state = loadState();
      applyTheme(state.settings.theme);
      route();
    }
  });

  /* ---------------- public API ---------------- */
  window.APP = {
    get state() { return state; },
    saveState: saveState,
    applyTheme: applyTheme,
    systemTheme: systemTheme,
    effectiveTheme: effectiveTheme,
    toggleTheme: toggleTheme,
    setTheme: setTheme,
    updateSetting: updateSetting,
    importState: importState,
    resetData: resetData,
    toast: toast,
    completeLesson: completeLesson,
    getRecommendedLesson: getRecommendedLesson,
    getNextLesson: nextInCourse,
    getCourse: getCourse,
    getLesson: getLesson,
    getRecord: getRecord,
    getCourseProgress: getCourseProgress,
    getGlobalStats: getGlobalStats,
    openSettings: function () { if (window.FEATURES) window.FEATURES.openSettings(); },
    getAllLessons: getAllLessons,
    totalLessons: totalLessons,
    getDailyStreak: getDailyStreak,
    sessionsToday: sessionsToday,
    dayKey: dayKey,
    formatDateKey: formatDateKey,
    colorVar: colorVar,
    icon: icon,
    formatTime: formatTime,
    formatDate: formatDate,
    pad2: pad2,
    esc: esc,
    progressBar: progressBar,
    renderSite: renderSite,
    showConfirm: showConfirm,
    themeButton: themeButton,
    ICONS: ICONS
  };

  route();
})();
