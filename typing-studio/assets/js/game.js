/* =========================================================
   键艺 KeyCraft — 打字游戏（V2）
   单词雨 / 键位冲刺 / 词组冲刺
   - 每局设置内嵌在游戏面板，三款游戏各自可调
   - HUD / 设置页 / 结算页全部为中英双语
   - 本地偏好：localStorage key = keycraft.game.prefs.v1
   ========================================================= */
(function () {
  "use strict";

  var GAME_NAMES = { rain: "单词雨", rush: "键位冲刺", sprint: "词组冲刺" };
  var GAME_EN = { rain: "WORD RAIN", rush: "KEY RUSH", sprint: "WORD SPRINT" };
  var PREF_KEY = "keycraft.game.prefs.v1";

  var EN_WORDS = [
    "type", "keyboard", "finger", "screen", "focus", "speed", "steady", "calm",
    "practice", "lesson", "home", "row", "space", "shift", "letter", "word",
    "sentence", "rhythm", "accuracy", "target", "quick", "brown", "fox", "jump",
    "lazy", "dog", "light", "water", "window", "paper", "pencil", "music",
    "garden", "planet", "rocket", "silver", "orange", "yellow", "purple", "bright",
    "adventure", "challenge", "discipline", "excellent", "happiness", "important",
    "wonderful", "beautiful", "chocolate", "structure", "technique", "confident"
  ];
  var EN_POOL = EN_WORDS.map(function (w) {
    return { kind: "en", word: w, key: w };
  });

  var CN_PAIRS = [
    ["你好", "ni hao"], ["打字", "da zi"], ["键盘", "jian pan"], ["练习", "lian xi"],
    ["速度", "su du"], ["准确", "zhun que"], ["专注", "zhuan zhu"], ["节奏", "jie zou"],
    ["手指", "shou zhi"], ["屏幕", "ping mu"], ["输入", "shu ru"], ["空格", "kong ge"],
    ["单词", "dan ci"], ["词语", "ci yu"], ["游戏", "you xi"], ["反应", "fan ying"],
    ["盲打", "mang da"], ["连击", "lian ji"], ["生命", "sheng ming"], ["时间", "shi jian"],
    ["目标", "mu biao"], ["成绩", "cheng ji"], ["挑战", "tiao zhan"], ["高手", "gao shou"]
  ];
  var CN_POOL = CN_PAIRS.map(function (p) {
    return { kind: "cn", cn: p[0], py: p[1], key: p[1].replace(/\s+/g, "") };
  });

  var RUSH_POOLS = {
    letters: "abcdefghijklmnopqrstuvwxyz".split(""),
    home: "asdfjkl;".split(""),
    numbers: "0123456789".split(""),
    all: "abcdefghijklmnopqrstuvwxyz0123456789".split("")
  };

  var RAIN_SPEEDS = {
    slow: { fall: 30, spawn: 1500, label: "慢速" },
    standard: { fall: 46, spawn: 1050, label: "标准" },
    fast: { fall: 64, spawn: 800, label: "快速" },
    insane: { fall: 88, spawn: 560, label: "极快" }
  };

  var RUSH_WINDOWS = {
    "0": { sec: 0, base: 8, label: "不限" },
    "2": { sec: 2, base: 10, label: "2.0 秒" },
    "1.5": { sec: 1.5, base: 12, label: "1.5 秒" },
    "1": { sec: 1, base: 14, label: "1.0 秒" },
    "0.6": { sec: 0.6, base: 16, label: "0.6 秒" }
  };
  var RUSH_WINDOW_KEYS = [0, 2, 1.5, 1, 0.6];

  var RAIN_DENSITY = {
    sparse: { spawn: 1.7, label: "稀疏" },
    standard: { spawn: 1, label: "标准" },
    dense: { spawn: 0.62, label: "密集" }
  };

  var WORD_LENS = ["short", "medium", "long", "mixed"];
  var WORD_LEN_LABEL = { short: "短词", medium: "中词", long: "长词", mixed: "混合词长" };

  var MODE_LABEL = { en: "英文词库", zh: "中文词语", custom: "自定义词库" };
  var RUSH_KEY_LABEL = { letters: "字母", home: "基准键", numbers: "数字", all: "字母 + 数字" };

  var page = null;
  var overlay = null;
  var active = null;
  var phase = "";
  var draft = null;
  var run = null;
  var audio = null;
  var keyHandler = null;
  var countdownTimer = 0;
  var prefCache = null;

  /* ---------------- 基础工具 ---------------- */
  function A() { return window.APP; }
  function esc(value) { return A().esc(value); }
  function $(id) { return document.getElementById(id); }
  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = value;
  }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function tone(freq, dur, type) {
    var app = A();
    if (!app || !app.state.settings.sound) return;
    var vol = app.state.settings.volume == null ? 0.6 : app.state.settings.volume;
    if (vol <= 0) return;
    try {
      if (!audio) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audio = new Ctx();
      }
      if (audio.state === "suspended") audio.resume();
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04 * vol, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur);
    } catch (err) { /* 音频不可用时静默 */ }
  }

  function shake(id) {
    var el = $(id);
    if (!el) return;
    el.classList.remove("is-shaking");
    void el.offsetWidth;
    el.classList.add("is-shaking");
    window.setTimeout(function () {
      var now = $(id);
      if (now) now.classList.remove("is-shaking");
    }, 220);
  }

  function best(kind) {
    var games = A().state.progress.games;
    return games[kind] || 0;
  }

  function updateBest(kind, score, detail) {
    var games = A().state.progress.games;
    if (score > (games[kind] || 0)) games[kind] = score;
    games.plays = (games.plays || 0) + 1;
    if (!Array.isArray(A().state.progress.gameSessions)) A().state.progress.gameSessions = [];
    A().state.progress.gameSessions.unshift({
      game: kind,
      score: score,
      date: Date.now(),
      detail: detail || ""
    });
    A().state.progress.gameSessions = A().state.progress.gameSessions.slice(0, 60);
    A().saveState();
    return games[kind] || 0;
  }

  /* ---------------- 本地偏好 ---------------- */
  var RAIN_DEFAULT_DURATION = 60;
  var RUSH_DEFAULT_DURATION = 30;
  var SPRINT_DEFAULT_DURATION = 30;

  function defaultsFor(kind) {
    if (kind === "rain") {
      return {
        mode: "en", wordLen: "mixed", speed: "standard", density: "standard",
        lives: 5, duration: RAIN_DEFAULT_DURATION, custom: ""
      };
    }
    if (kind === "rush") {
      return {
        keys: "letters", duration: RUSH_DEFAULT_DURATION, window: 2, lives: 3,
        finger: true, penalty: true
      };
    }
    return {
      mode: "en", wordLen: "mixed", duration: SPRINT_DEFAULT_DURATION,
      goal: 25, strict: false, custom: ""
    };
  }

  function boolValue(value) {
    return !(value === false || value === "false" || value === 0 || value === "0");
  }

  function clampInt(value, min, max, fallback) {
    var n = Number(value);
    if (!isFinite(n)) return fallback;
    n = Math.round(n);
    return Math.min(max, Math.max(min, n));
  }

  function rushWindowFor(value) {
    return RUSH_WINDOWS[String(value)] || RUSH_WINDOWS[String(defaultsFor("rush").window)];
  }

  function loadPrefs() {
    if (prefCache) return prefCache;
    var data = {};
    try {
      data = JSON.parse(localStorage.getItem(PREF_KEY) || "{}") || {};
    } catch (err) {
      data = {};
    }
    prefCache = data;
    return prefCache;
  }

  function prefsFor(kind) {
    var saved = loadPrefs()[kind];
    var out = defaultsFor(kind);
    if (saved) {
      // 旧版本只有 difficulty，没有 window：迁移到新的命中窗口字段。
      if (kind === "rush" && saved.window == null && saved.difficulty != null) {
        var legacy = { easy: 0, normal: 2, hard: 1.5 };
        saved = clone(saved);
        saved.window = legacy[saved.difficulty] != null ? legacy[saved.difficulty] : out.window;
      }
      Object.keys(out).forEach(function (key) {
        if (saved[key] != null) out[key] = saved[key];
      });
    }
    return normalizeDraft(kind, out);
  }

  function savePrefsFor(kind, value) {
    var prefs = loadPrefs();
    prefs[kind] = clone(value);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (err) { /* 隐私模式下忽略 */ }
    prefCache = prefs;
  }

  function normalizeDraft(kind, src) {
    var def = defaultsFor(kind);
    var out = clone(def);
    if (!src) return out;
    Object.keys(def).forEach(function (key) {
      if (src[key] == null) return;
      var value = src[key];
      if (key === "duration") {
        value = clampInt(value, 10, 300, def.duration);
      } else if (key === "lives") {
        value = value === "inf" ? "inf" : clampInt(value, 1, 20, def.lives);
      } else if (key === "goal") {
        value = clampInt(value, 10, 100, def.goal);
      } else if (key === "window") {
        var win = Number(value);
        value = RUSH_WINDOW_KEYS.indexOf(win) >= 0 ? win : def.window;
      } else if (key === "wordLen") {
        value = WORD_LENS.indexOf(value) >= 0 ? value : def.wordLen;
      } else if (key === "density") {
        value = RAIN_DENSITY[value] ? value : def.density;
      } else if (key === "finger" || key === "penalty" || key === "strict") {
        value = boolValue(value);
      } else if (key === "mode") {
        value = ["en", "zh", "custom"].indexOf(value) >= 0 ? value : def.mode;
      } else if (key === "speed") {
        value = RAIN_SPEEDS[value] ? value : def.speed;
      } else if (key === "keys") {
        value = RUSH_POOLS[value] ? value : def.keys;
      } else if (key === "custom") {
        value = String(value);
      }
      out[key] = value;
    });
    return out;
  }

  function livesLabel(value) {
    return value === "inf" ? "生命无限" : value + " 生命";
  }

  /* ---------------- 自定义词库解析 ---------------- */
  function parseCustomWords(text) {
    var out = [];
    String(text || "").split(/[\n,，、;；]+/).forEach(function (chunk) {
      chunk = chunk.trim();
      if (!chunk) return;
      var cnMatch = chunk.match(/^([\u4e00-\u9fa5]+)\s*[:\：|/]?\s*([a-z][a-z\s']*)$/i);
      if (cnMatch) {
        var cn = cnMatch[1];
        var py = cnMatch[2].toLowerCase().replace(/'/g, " ").replace(/\s+/g, " ").trim();
        var flat = py.replace(/\s+/g, "");
        if (cn && flat) out.push({ kind: "cn", cn: cn, py: py, key: flat });
        return;
      }
      if (/[\u4e00-\u9fa5]/.test(chunk)) {
        for (var i = 0; i < CN_POOL.length; i++) {
          if (CN_POOL[i].cn === chunk) {
            out.push(CN_POOL[i]);
            return;
          }
        }
        return;
      }
      chunk.split(/\s+/).forEach(function (token) {
        var word = token.toLowerCase().replace(/[^a-z]/g, "");
        if (word) out.push({ kind: "en", word: word, key: word });
      });
    });
    return out;
  }

  function poolFor(itemDraft) {
    if (itemDraft.mode === "zh") return CN_POOL.slice();
    if (itemDraft.mode === "custom") {
      var list = parseCustomWords(itemDraft.custom);
      if (list.length) return list;
    }
    return EN_POOL.slice();
  }

  function filterPoolByLen(pool, lenMode) {
    if (!lenMode || lenMode === "mixed") return pool;
    var filtered = pool.filter(function (item) {
      if (item.kind !== "en") return true; // 中文词不分长度，保留
      var len = item.word.length;
      if (lenMode === "short") return len <= 4;
      if (lenMode === "medium") return len >= 5 && len <= 7;
      if (lenMode === "long") return len >= 8;
      return true;
    });
    return filtered.length ? filtered : pool;
  }

  function poolForDraft(itemDraft) {
    return filterPoolByLen(poolFor(itemDraft), itemDraft.wordLen);
  }

  /* ---------------- 游戏页 ---------------- */
  var CARD_META = {
    rain: {
      no: "01",
      desc: "词块从上方落下，输入英文单词或中文拼音消除；漏词扣命，连击加分。",
      tags: ["中文词语 + 拼音", "短 / 中 / 长词", "稀疏 / 标准 / 密集", "生命 1–20 / ∞"],
      meta: "3 种词库 · 15–300 秒"
    },
    rush: {
      no: "02",
      desc: "看清高亮目标键并按下，命中窗口越紧分数越高；按错可设为只清连击。",
      tags: ["4 种按键范围", "5 档命中窗口", "键盘可隐藏", "按错扣命可关"],
      meta: "15–300 秒 · 生命 1–20"
    },
    sprint: {
      no: "03",
      desc: "连续输入单词或中文拼音，打完一个立刻接下一个，冲击目标词数。",
      tags: ["短 / 中 / 长词", "目标 10–100 词", "严格 / 宽松", "自定义词库"],
      meta: "3 种词库 · 目标 10–100 词"
    }
  };

  function cardHtml(kind) {
    var meta = CARD_META[kind];
    return '<article class="gcard gcard--' + kind + '">' +
      '<div class="gcard-top"><span class="gcard-no">' + meta.no + '</span>' +
      '<span class="gcard-en">' + GAME_EN[kind] + '</span>' +
      '<span class="gcard-best"><em>BEST 最高</em><strong>' + best(kind) + '</strong></span></div>' +
      '<h2>' + GAME_NAMES[kind] + '<em>' + GAME_EN[kind] + '</em></h2>' +
      '<p>' + meta.desc + '</p>' +
      '<div class="gcard-tags">' + meta.tags.map(function (tag) { return "<span>" + tag + "</span>"; }).join("") + '</div>' +
      '<div class="gcard-foot"><span class="gcard-meta">' + meta.meta + '</span>' +
      '<div class="gcard-actions">' +
      '<button class="btn btn-accent btn-sm gcard-start" type="button" data-game-start="' + kind + '" title="用上次设置直接开始 QUICK START">' +
      '开始 <em>START</em>' + A().icon("arrow") + '</button>' +
      '<button class="btn btn-sm gcard-custom" type="button" data-game-custom="' + kind + '" title="先调整本局规则 CUSTOMIZE">' +
      '自定义 <em>SETUP</em>' + A().icon("settings") + '</button>' +
      '</div></div>' +
      '</article>';
  }

  function recordsHtml(records) {
    if (!records.length) {
      return '<section class="grecords"><div class="grecords-head"><div><span class="eyebrow">RECORDS</span>' +
        '<h2>游戏记录 <em>RECORDS</em></h2></div><span>还没有记录</span></div>' +
        '<p class="grecords-empty">玩一局，成绩会保存在本机浏览器里。</p></section>';
    }
    var rows = records.slice(0, 6).map(function (item) {
      return "<tr><td>" + esc(GAME_NAMES[item.game] || item.game) + '</td><td class="num">' + item.score +
        '</td><td class="num">' + esc(item.detail || "标准") + '</td><td class="num">' + A().formatDate(item.date) + "</td></tr>";
    }).join("");
    return '<section class="grecords"><div class="grecords-head"><div><span class="eyebrow">RECORDS</span>' +
      '<h2>游戏记录 <em>RECORDS</em></h2></div><span>最近 ' + Math.min(6, records.length) + ' 局</span></div>' +
      '<div class="table-wrap"><table class="history-table"><thead><tr><th>GAME 游戏</th><th>SCORE 分数</th><th>MODE 模式</th><th>DATE 时间</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></section>";
  }

  function renderPage() {
    destroy();
    var games = A().state.progress.games || {};
    var records = A().state.progress.gameSessions || [];
    var maxBest = Math.max(best("rain"), best("rush"), best("sprint"));
    var main =
      '<section class="page-hero games-hero"><div class="container">' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>游戏</span></div>' +
      '<div class="games-hero-row"><div>' +
      '<span class="eyebrow"><span class="dot"></span> ARCADE</span>' +
      '<h1>三个小游戏，练反应也练准确。</h1>' +
      '<p class="lead">规则都在每局开始前自定义：词库、速度、生命、时长。中文词语用拼音输入，不需要中文输入法。</p>' +
      '</div><div class="games-record"><span class="glabel">PLAYS<em>游戏局数</em></span>' +
      '<strong>' + (games.plays || 0) + '</strong>' +
      '<p>本地最高 ' + maxBest + ' 分 · 每局几十秒</p></div></div>' +
      '</div></section>' +
      '<section class="games-page"><div class="container">' +
      '<div class="gdeck">' + cardHtml("rain") + cardHtml("rush") + cardHtml("sprint") + '</div>' +
      recordsHtml(records) +
      '</div></section>';

    A().renderSite({ name: "games" }, main);
    page = document.querySelector(".games-page");
    if (page) {
      page.addEventListener("click", function (e) {
        var quick = e.target.closest("[data-game-start]");
        if (quick) {
          openGame(quick.dataset.gameStart, { quick: true });
          return;
        }
        var custom = e.target.closest("[data-game-custom]");
        if (custom) {
          openGame(custom.dataset.gameCustom, {});
          return;
        }
        var btn = e.target.closest("[data-game]");
        if (btn) openGame(btn.dataset.game, {});
      });
    }
  }

  /* ---------------- 游戏面板 ---------------- */
  function openGame(kind, options) {
    if (!GAME_NAMES[kind]) return;
    closeModal();
    active = kind;
    draft = prefsFor(kind);
    if (options) {
      Object.keys(defaultsFor(kind)).forEach(function (key) {
        if (options[key] == null) return;
        if (key === "custom") {
          if (typeof options[key] === "string") draft.custom = options[key];
          return;
        }
        draft[key] = options[key];
      });
      // 兼容旧调用：{ duration, words: [], keys, custom }
      if (options.words && options.words.length && !options.mode) {
        draft.mode = "custom";
        draft.custom = options.words.join(" ");
      }
      if (options.duration) draft.duration = Number(options.duration) || draft.duration;
    }
    draft = normalizeDraft(kind, draft);
    phase = "setup";

    overlay = document.createElement("div");
    overlay.className = "game-overlay";
    overlay.id = "game-overlay";
    overlay.innerHTML =
      '<div class="game-panel" id="game-panel" data-kind="' + kind + '" data-phase="setup">' +
      '<header class="game-panel-head"><div class="game-panel-title">' +
      '<span class="eyebrow">ARCADE / ' + GAME_EN[kind] + '</span>' +
      '<h2>' + GAME_NAMES[kind] + '<em>' + GAME_EN[kind] + '</em></h2>' +
      '</div><div class="game-panel-tools">' +
      '<button class="icon-btn" type="button" data-act="restart" aria-label="重开游戏" title="重开 RESTART">' + A().icon("refresh") + '</button>' +
      '<button class="icon-btn" type="button" data-act="close" aria-label="关闭游戏" title="关闭 CLOSE">' + A().icon("close") + '</button>' +
      '</div></header><div class="game-panel-body" id="game-body"></div></div>';
    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");
    overlay.addEventListener("click", onOverlayClick);
    overlay.addEventListener("input", onOverlayInput);
    overlay.addEventListener("change", onOverlayChange);
    keyHandler = onKeyDown;
    document.addEventListener("keydown", keyHandler);
    // 快速开始：直接用上次保存的偏好进入倒计时，不经过设置页。
    if (options && options.quick) {
      startRound();
    } else {
      renderSetup();
    }
  }

  function startGame(kind) {
    openGame(kind, { quick: true });
  }

  function closeModal() {
    stopRuntime();
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
    if (overlay) {
      overlay.removeEventListener("click", onOverlayClick);
      overlay.removeEventListener("input", onOverlayInput);
      overlay.removeEventListener("change", onOverlayChange);
      overlay.remove();
      overlay = null;
    }
    document.body.classList.remove("no-scroll");
    active = null;
    draft = null;
    phase = "";
  }

  function destroy() {
    closeModal();
    page = null;
  }

  function setPanelPhase(value) {
    var panel = $("game-panel");
    if (panel) panel.dataset.phase = value;
  }

  function coerceChoice(field, value) {
    if (field === "lives") return value === "inf" ? "inf" : Number(value);
    if (field === "finger" || field === "penalty" || field === "strict") return value === "true";
    if (field === "duration" || field === "goal" || field === "window") return Number(value);
    return value;
  }

  function isFieldValue(field, value) {
    return String(draft[field]) === String(value);
  }

  function fieldMin(field) {
    if (field === "duration") return 10;
    if (field === "goal") return 10;
    if (field === "lives") return 1;
    return 1;
  }

  function fieldMax(field) {
    if (field === "duration") return 300;
    if (field === "goal") return 100;
    if (field === "lives") return 20;
    return 20;
  }

  function valueText(field) {
    if (field === "duration") return draft.duration + " 秒";
    if (field === "goal") return draft.goal + " 词";
    return "";
  }

  function onOverlayInput(e) {
    var target = e.target;
    if (!draft || !target) return;
    if (target.matches("[data-field-text='custom']")) {
      draft.custom = target.value;
      refreshSetup(true);
      return;
    }
    if (target.matches("[data-range]")) {
      var rangeField = target.dataset.range;
      var rangeValue = Number(target.value);
      if (!isFinite(rangeValue)) return;
      draft[rangeField] = rangeValue;
      var numPair = overlay.querySelector('[data-num="' + rangeField + '"]');
      if (numPair && document.activeElement !== numPair) numPair.value = String(rangeValue);
      updateCurrentLabel(rangeField);
      refreshSetup(true);
      savePrefsFor(active, draft);
      return;
    }
    if (target.matches("[data-num]")) {
      var numField = target.dataset.num;
      if (target.value === "") return; // 允许清空后重新输入
      var numValue = Number(target.value);
      if (!isFinite(numValue)) return;
      if (numValue < fieldMin(numField) || numValue > fieldMax(numField)) return;
      draft[numField] = Math.round(numValue);
      var rangePair = overlay.querySelector('[data-range="' + numField + '"]');
      if (rangePair && document.activeElement !== rangePair) rangePair.value = String(draft[numField]);
      updateCurrentLabel(numField);
      refreshSetup(true);
      savePrefsFor(active, draft);
    }
  }

  function onOverlayChange(e) {
    var target = e.target;
    if (!draft || !target) return;
    if (target.matches("[data-num]")) {
      var field = target.dataset.num;
      var current = draft[field] === "inf" ? fieldMin(field) : Number(draft[field]);
      if (target.value !== "") {
        var raw = Number(target.value);
        if (isFinite(raw)) current = raw;
      }
      draft[field] = Math.min(fieldMax(field), Math.max(fieldMin(field), Math.round(current)));
      if (field === "duration") draft[field] = Math.round(draft[field] / 5) * 5;
      savePrefsFor(active, draft);
      refreshSetup();
      return;
    }
    if (target.matches("[data-range]")) {
      savePrefsFor(active, draft);
      refreshSetup();
      return;
    }
    if (target.matches("[data-field-text='custom']")) {
      savePrefsFor(active, draft);
    }
  }

  function onOverlayClick(e) {
    var actEl = e.target.closest("[data-act]");
    if (actEl) {
      var act = actEl.dataset.act;
      if (act === "close") { closeModal(); return; }
      if (act === "begin" || act === "restart" || act === "again") {
        if (phase === "setup" || phase === "over" || phase === "playing" || phase === "paused" || phase === "countdown") {
          startRound();
        }
        return;
      }
      if (act === "pause") { if (phase === "playing") pauseGame(); return; }
      if (act === "resume") { resumeGame(); return; }
      if (act === "skip") { skipCountdown(); return; }
      if (act === "setup") { stopRuntime(); renderSetup(); return; }
      return;
    }
    var choice = e.target.closest("[data-field]");
    if (choice && draft && choice.dataset.field) {
      draft[choice.dataset.field] = coerceChoice(choice.dataset.field, choice.dataset.value);
      savePrefsFor(active, draft);
      refreshSetup();
    }
  }

  /* ---------------- 设置页 ---------------- */
  function choiceRow(en, cn, field, options, hint) {
    var buttons = options.map(function (option) {
      var on = isFieldValue(field, option.v) ? " is-on" : "";
      return '<button class="gchoice' + on + '" type="button" data-field="' + field + '" data-value="' + option.v + '">' +
        '<span>' + option.l + '</span>' + (option.s ? '<em>' + option.s + '</em>' : "") + '</button>';
    }).join("");
    return '<div class="grow"><div class="grow-head"><span class="glabel">' + en + '<em>' + cn + '</em></span>' +
      (hint ? '<small class="grow-hint">' + hint + '</small>' : "") + '</div>' +
      '<div class="gchoices">' + buttons + '</div></div>';
  }

  function presetButtons(field, options) {
    return '<div class="gchoices">' + options.map(function (option) {
      var on = isFieldValue(field, option.v) ? " is-on" : "";
      return '<button class="gchoice' + on + '" type="button" data-field="' + field + '" data-value="' + option.v + '">' +
        '<span>' + option.l + '</span>' + (option.s ? '<em>' + option.s + '</em>' : "") + '</button>';
    }).join("") + '</div>';
  }

  // 预设 + 滑杆 + 数字输入（时长 / 目标词数）
  function rangeRow(en, cn, field, cfg) {
    var unit = cfg.unit || "";
    return '<div class="grow grow--control">' +
      '<div class="grow-head"><span class="glabel">' + en + '<em>' + cn + '</em></span>' +
      (cfg.hint ? '<small class="grow-hint">' + cfg.hint + '</small>' : "") + '</div>' +
      '<div class="grow-control">' +
      presetButtons(field, cfg.presets) +
      '<div class="gnum">' +
      '<span class="gnum-label">自定义<em>CUSTOM</em></span>' +
      '<input class="gslider" type="range" min="' + cfg.min + '" max="' + cfg.max + '" step="' + cfg.step + '"' +
      ' value="' + draft[field] + '" data-range="' + field + '" aria-label="' + en + ' ' + cn + ' 自定义">' +
      '<input class="gnum-input" type="number" inputmode="numeric" min="' + cfg.min + '" max="' + cfg.max + '" step="' + cfg.step + '"' +
      ' value="' + draft[field] + '" data-num="' + field + '" aria-label="' + en + ' ' + cn + ' 数值">' +
      (unit ? '<span class="gsuffix">' + unit + '</span>' : "") +
      '<span class="gcur" data-cur="' + field + '">' + valueText(field) + '</span>' +
      '</div></div></div>';
  }

  // 预设 + 数字输入（生命 / 目标词数这类整数）
  function numberRow(en, cn, field, cfg) {
    var current = draft[field];
    var numValue = current === "inf" ? "" : current;
    return '<div class="grow grow--control">' +
      '<div class="grow-head"><span class="glabel">' + en + '<em>' + cn + '</em></span>' +
      (cfg.hint ? '<small class="grow-hint">' + cfg.hint + '</small>' : "") + '</div>' +
      '<div class="grow-control">' +
      presetButtons(field, cfg.presets) +
      '<div class="gnum">' +
      '<span class="gnum-label">' + (cfg.customLabel || "自定义") + '<em>CUSTOM</em></span>' +
      '<input class="gnum-input" type="number" inputmode="numeric" min="' + cfg.min + '" max="' + cfg.max + '" step="1"' +
      ' value="' + numValue + '" placeholder="' + cfg.min + '–' + cfg.max + '" data-num="' + field + '" aria-label="' + en + ' ' + cn + ' 自定义">' +
      (cfg.unit ? '<span class="gsuffix">' + cfg.unit + '</span>' : "") +
      '</div></div></div>';
  }

  function customRow() {
    return '<div class="grow grow--stack" data-custom-row' + (draft.mode === "custom" ? "" : " hidden") + '>' +
      '<div class="grow-head"><span class="glabel">CUSTOM<em>自定义词库</em></span>' +
      '<small class="grow-hint">英文单词用空格 / 逗号 / 换行分隔；中文写成「汉字 拼音」，建议每行一条，例如：你好 ni hao。</small></div>' +
      '<textarea data-field-text="custom" rows="3" spellcheck="false" placeholder="type keyboard 你好 ni hao 打字 da zi">' + esc(draft.custom || "") + '</textarea>' +
      '</div>';
  }

  var DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180].map(function (value) {
    return { v: value, l: value + " 秒" };
  });

  function setupHtml(kind) {
    var rows = "";
    var timeRow = rangeRow("TIME", "时长", "duration", {
      min: 10, max: 300, step: 5, unit: "秒", presets: DURATION_PRESETS,
      hint: "预设之外可用滑杆 / 数字调整 10–300 秒"
    });
    if (kind === "rain") {
      rows += choiceRow("WORDS", "词库", "mode", [
        { v: "en", l: "英文", s: "EN" },
        { v: "zh", l: "中文词语", s: "ZH" },
        { v: "custom", l: "自定义", s: "CUSTOM" }
      ], "中文词语显示汉字 + 拼音，输入拼音即可消除");
      rows += choiceRow("LENGTH", "词长", "wordLen", [
        { v: "short", l: "短词", s: "≤4" },
        { v: "medium", l: "中词", s: "5–7" },
        { v: "long", l: "长词", s: "≥8" },
        { v: "mixed", l: "混合" }
      ], "按英文单词长度过滤；中文词不受影响");
      rows += choiceRow("SPEED", "下落速度", "speed", [
        { v: "slow", l: "慢" }, { v: "standard", l: "标准" },
        { v: "fast", l: "快" }, { v: "insane", l: "极快" }
      ], "同时影响下落速度与生成间隔");
      rows += choiceRow("DENSITY", "生成密度", "density", [
        { v: "sparse", l: "稀疏", s: "×1.7" },
        { v: "standard", l: "标准", s: "×1.0" },
        { v: "dense", l: "密集", s: "×0.62" }
      ], "与速度档叠加：密度越高，词块出现越频繁");
      rows += numberRow("LIVES", "生命", "lives", {
        presets: [{ v: 3, l: "3" }, { v: 5, l: "5" }, { v: 10, l: "10" }, { v: "inf", l: "∞ 无限" }],
        min: 1, max: 20, customLabel: "生命", hint: "漏掉一个词扣 1 条命；也可自定义 1–20"
      });
      rows += timeRow;
      rows += customRow();
    } else if (kind === "rush") {
      rows += choiceRow("KEYS", "按键范围", "keys", [
        { v: "letters", l: "字母", s: "A–Z" },
        { v: "home", l: "基准键", s: "ASDF" },
        { v: "numbers", l: "数字", s: "0–9" },
        { v: "all", l: "字母 + 数字" }
      ], "决定目标键从哪些键里出现");
      rows += numberRow("LIVES", "容错生命", "lives", {
        presets: [{ v: 3, l: "3" }, { v: 5, l: "5" }, { v: 10, l: "10" }, { v: "inf", l: "∞ 无限" }],
        min: 1, max: 20, customLabel: "生命", hint: "按错或超时扣命；也可自定义 1–20"
      });
      rows += choiceRow("WINDOW", "命中窗口", "window", [
        { v: 0, l: "不限", s: "∞" },
        { v: 2, l: "2.0 秒", s: "×10" },
        { v: 1.5, l: "1.5 秒", s: "×12" },
        { v: 1, l: "1.0 秒", s: "×14" },
        { v: 0.6, l: "0.6 秒", s: "×16" }
      ], "超时未按算失误；窗口越紧单次得分越高");
      rows += choiceRow("KEYBOARD", "显示键盘", "finger", [
        { v: "true", l: "显示", s: "ON" },
        { v: "false", l: "隐藏", s: "OFF" }
      ], "关闭后只显示大号目标键，指法提示一并隐藏");
      rows += choiceRow("MISS", "按错扣命", "penalty", [
        { v: "true", l: "扣命", s: "ON" },
        { v: "false", l: "只清连击", s: "OFF" }
      ], "关闭后按错不扣生命，但仍会清空连击");
      rows += timeRow;
    } else {
      rows += choiceRow("WORDS", "词库", "mode", [
        { v: "en", l: "英文", s: "EN" },
        { v: "zh", l: "中文词语", s: "ZH" },
        { v: "custom", l: "自定义", s: "CUSTOM" }
      ], "中文词语显示汉字 + 拼音，输入拼音");
      rows += choiceRow("LENGTH", "词长", "wordLen", [
        { v: "short", l: "短词", s: "≤4" },
        { v: "medium", l: "中词", s: "5–7" },
        { v: "long", l: "长词", s: "≥8" },
        { v: "mixed", l: "混合" }
      ], "按英文单词长度过滤；中文词不受影响");
      rows += timeRow;
      rows += numberRow("GOAL", "目标词数", "goal", {
        presets: [{ v: 10, l: "10 词" }, { v: 25, l: "25 词" }, { v: 50, l: "50 词" }, { v: 100, l: "100 词" }],
        min: 10, max: 100, unit: "词", customLabel: "目标", hint: "达到目标提前结束，并加 25 分奖励"
      });
      rows += choiceRow("ERRORS", "错误处理", "strict", [
        { v: "false", l: "宽松", s: "不前进" },
        { v: "true", l: "严格", s: "重置+扣分" }
      ], "严格模式打错会重置当前词并扣 5 分");
      rows += customRow();
    }

    return '<div class="gsetup">' +
      '<div class="gsetup-head"><span class="eyebrow">ROUND SETUP</span>' +
      '<h3>本局设置 <em>SETUP</em></h3>' +
      '<p>每局开始前都能改规则，选择会记住；游戏卡上的「开始」会直接用这一套规则。</p></div>' +
      '<div class="gsetup-grid">' + rows + '</div>' +
      '<div class="gsetup-foot">' +
      '<div class="gsetup-best"><span class="glabel">BEST<em>最高分</em></span><strong>' + best(kind) + '</strong></div>' +
      '<div class="gsetup-go"><p class="gsetup-note" data-setup-note>' + esc(setupSummary(kind, draft)) + '</p>' +
      '<button class="btn btn-accent" type="button" data-act="begin">开始 ' + draft.duration + ' 秒 <em>START</em></button></div>' +
      '</div></div>';
  }

  function setupSummary(kind, value) {
    if (kind === "rain") {
      return MODE_LABEL[value.mode] + " · " + WORD_LEN_LABEL[value.wordLen] + " · " + RAIN_SPEEDS[value.speed].label +
        " · " + RAIN_DENSITY[value.density].label + "密度 · " + livesLabel(value.lives) + " · " + value.duration + " 秒";
    }
    if (kind === "rush") {
      return RUSH_KEY_LABEL[value.keys] + " · 窗口" + rushWindowFor(value.window).label + " · " + livesLabel(value.lives) +
        " · " + value.duration + " 秒 · 键盘" + (value.finger ? "开" : "关") + " · 按错" + (value.penalty ? "扣命" : "只清连击");
    }
    return MODE_LABEL[value.mode] + " · " + WORD_LEN_LABEL[value.wordLen] + " · " + value.goal + " 词目标 · " +
      (value.strict ? "严格" : "宽松") + " · " + value.duration + " 秒";
  }

  function updateCurrentLabel(field) {
    if (!overlay) return;
    var el = overlay.querySelector('[data-cur="' + field + '"]');
    if (!el) return;
    if (field === "duration") el.textContent = draft.duration + " 秒";
    else if (field === "goal") el.textContent = draft.goal + " 词";
    else el.textContent = "";
  }

  function syncInputs() {
    if (!overlay || !draft) return;
    overlay.querySelectorAll("[data-range]").forEach(function (el) {
      var value = draft[el.dataset.range];
      if (value != null) el.value = String(value);
    });
    overlay.querySelectorAll("[data-num]").forEach(function (el) {
      var value = draft[el.dataset.num];
      el.value = value === "inf" || value == null ? "" : String(value);
    });
    overlay.querySelectorAll("[data-cur]").forEach(function (el) {
      updateCurrentLabel(el.dataset.cur);
    });
  }

  function refreshSetup(keepInputs) {
    if (!overlay || !draft) return;
    overlay.querySelectorAll("[data-field]").forEach(function (btn) {
      btn.classList.toggle("is-on", isFieldValue(btn.dataset.field, btn.dataset.value));
    });
    var note = overlay.querySelector("[data-setup-note]");
    if (note) note.textContent = setupSummary(active, draft);
    var custom = overlay.querySelector("[data-custom-row]");
    if (custom) custom.hidden = draft.mode !== "custom";
    var begin = overlay.querySelector("[data-act='begin']");
    if (begin) begin.innerHTML = "开始 " + draft.duration + " 秒 <em>START</em>";
    var area = overlay.querySelector("[data-field-text='custom']");
    if (area && document.activeElement !== area && area.value !== draft.custom) area.value = draft.custom || "";
    if (!keepInputs) syncInputs();
  }

  function renderSetup() {
    if (!active) return;
    phase = "setup";
    setPanelPhase("setup");
    var box = $("game-body");
    if (!box) return;
    box.innerHTML = setupHtml(active);
    refreshSetup();
  }

  /* ---------------- 游戏通用壳 ---------------- */
  function hudCell(en, cn, id, value) {
    return '<div class="hud-cell"><span class="glabel">' + en + '<em>' + cn + '</em></span>' +
      '<strong id="' + id + '">' + value + '</strong></div>';
  }

  function hudHtml(cells) {
    return '<div class="game-hud game-hud--5">' + cells.join("") + '</div>';
  }

  function lifebarHtml() {
    return '<div class="lifebar" id="lifebar"><span class="glabel">LIVES<em>生命</em></span>' +
      '<div class="life-seg" id="life-seg"></div><strong id="life-text"></strong></div>';
  }

  function actionBarHtml() {
    return '<div class="ggame-actions">' +
      '<button class="gbtn" type="button" data-act="pause" title="暂停 PAUSE"><span>PAUSE<em>暂停</em></span><kbd>Esc</kbd></button>' +
      '<button class="gbtn" type="button" data-act="restart" title="重开 RESTART"><span>RESTART<em>重开</em></span></button>' +
      '</div>';
  }

  function rainShell() {
    return hudHtml([
      hudCell("SCORE", "得分", "game-score", "0"),
      hudCell("COMBO", "连击", "game-combo", "0"),
      hudCell("TIME", "时间", "game-time", String(run.duration)),
      hudCell("HITS", "命中", "game-hits", "0"),
      hudCell("LIVES", "生命", "game-lives", run.infiniteLives ? "∞" : run.livesLeft + "/" + run.livesMax)
    ]) +
      '<div class="ggame-bar">' + lifebarHtml() + actionBarHtml() + '</div>' +
      '<div class="rain-stage" id="rain-stage">' +
      '<div class="rain-lanes" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<div class="rain-words" id="rain-words"></div>' +
      '<div class="rain-buffer" id="rain-buffer"><span class="glabel">INPUT<em>输入</em></span>' +
      '<strong id="rain-typed" class="is-empty">输入落下的单词或拼音</strong></div>' +
      '<div class="game-countdown" id="game-countdown"></div>' +
      '<div class="game-pause" id="game-pause" hidden></div>' +
      '</div>' +
      '<div class="game-help"><span>直接输入即可 · 不需要按回车</span><span>中文词输入拼音 · 漏词扣命 · 连击加分</span></div>';
  }

  function rushShell() {
    var hasWindow = run.windowCfg && run.windowCfg.sec > 0;
    return hudHtml([
      hudCell("SCORE", "得分", "game-score", "0"),
      hudCell("COMBO", "连击", "game-combo", "0"),
      hudCell("TIME", "时间", "game-time", String(run.duration)),
      hudCell("HITS", "命中", "game-hits", "0"),
      hudCell("ACC", "准确率", "game-acc", "100%")
    ]) +
      '<div class="ggame-bar">' + lifebarHtml() + actionBarHtml() + '</div>' +
      '<div class="rush-stage' + (run.draft.finger ? "" : " rush-stage--nokb") + '" id="rush-stage">' +
      '<div class="rush-target"><span class="glabel">PRESS<em>按下</em></span>' +
      '<strong id="rush-key">F</strong><em id="rush-finger" class="rush-finger"></em>' +
      '<div class="rush-window" id="rush-window"' + (hasWindow ? "" : " hidden") + '><i></i></div></div>' +
      '<div class="rush-keyboard" id="rush-keyboard"></div>' +
      '<div class="game-countdown" id="game-countdown"></div>' +
      '<div class="game-pause" id="game-pause" hidden></div>' +
      '</div>' +
      '<div class="game-help"><span>看目标键与手指名 · 按错' + (run.draft.penalty ? "扣命" : "只清连击") + '</span>' +
      '<span>' + (hasWindow ? "命中窗口 " + run.windowCfg.label + " · 超时切换也算失误" : "命中窗口不限时 · 超时不计失误") + '</span></div>';
  }

  function sprintShell() {
    return hudHtml([
      hudCell("SCORE", "得分", "game-score", "0"),
      hudCell("COMBO", "连击", "game-combo", "0"),
      hudCell("TIME", "时间", "game-time", String(run.duration)),
      hudCell("WORDS", "词数", "game-words", "0/" + (run.goal ? run.goal : "∞")),
      hudCell("ACC", "准确率", "game-acc", "100%")
    ]) +
      '<div class="ggame-bar"><div class="sprint-goal"><span class="glabel">GOAL<em>目标</em></span>' +
      '<div class="sprint-goal-bar"><i id="sprint-goal-fill"></i></div>' +
      '<strong id="sprint-goal-text">' + (run.goal ? "0 / " + run.goal : "不限") + '</strong></div>' +
      actionBarHtml() + '</div>' +
      '<div class="sprint-stage" id="sprint-stage">' +
      '<span class="glabel sprint-label">TYPE<em>输入</em></span>' +
      '<div class="sprint-target" id="sprint-target"></div>' +
      '<div class="sprint-typed" id="sprint-typed"></div>' +
      '<div class="game-countdown" id="game-countdown"></div>' +
      '<div class="game-pause" id="game-pause" hidden></div>' +
      '</div>' +
      '<div class="game-help"><span>打完一个自动接下一个 · 不需要回车</span><span>中文词输入拼音，逐字高亮</span></div>';
  }

  function renderGame() {
    var box = $("game-body");
    if (!box || !run) return;
    if (active === "rain") box.innerHTML = rainShell();
    else if (active === "rush") box.innerHTML = rushShell();
    else box.innerHTML = sprintShell();
    if (active === "rush" && window.KEYBOARD && run.draft.finger) {
      var wrap = $("rush-keyboard");
      if (wrap) {
        run.kb = window.KEYBOARD.render({ colored: false, mini: false });
        wrap.appendChild(run.kb);
      }
    }
    updateHud();
    updateLifebar();
    applyFingerMode();
  }

  function applyFingerMode() {
    if (active !== "rush" || !run) return;
    if (!run.draft.finger) {
      var fingerEl = $("rush-finger");
      if (fingerEl) fingerEl.textContent = "";
      if (run.kb && window.KEYBOARD) window.KEYBOARD.clearStates(run.kb);
    }
  }

  function updateLifebar() {
    if (!run) return;
    var seg = $("life-seg");
    if (!seg) return;
    var text = $("life-text");
    if (run.infiniteLives) {
      seg.classList.remove("is-many");
      seg.innerHTML = '<span class="life-inf">∞</span>';
      if (text) text.textContent = "无限";
      return;
    }
    seg.classList.toggle("is-many", run.livesMax > 10);
    var html = "";
    for (var i = 0; i < run.livesMax; i++) {
      html += '<i class="' + (i < run.livesLeft ? "is-on" : "") + '"></i>';
    }
    seg.innerHTML = html;
    if (text) text.textContent = run.livesLeft + "/" + run.livesMax;
  }

  function accuracy() {
    if (!run) return 100;
    var total = run.ok + run.bad;
    return total ? Math.round((run.ok / total) * 100) : 100;
  }

  function updateHud() {
    if (!run) return;
    setText("game-score", run.score);
    setText("game-combo", run.combo);
    setText("game-time", Math.ceil(run.timeLeft));
    setText("game-hits", run.hits);
    setText("game-acc", accuracy() + "%");
    if (active === "rain") {
      setText("game-lives", run.infiniteLives ? "∞" : run.livesLeft + "/" + run.livesMax);
    }
    if (active === "sprint") {
      setText("game-words", run.wordsDone + "/" + (run.goal ? run.goal : "∞"));
      var fill = $("sprint-goal-fill");
      if (fill) {
        var pct = run.goal ? Math.min(100, (run.wordsDone / run.goal) * 100) : Math.min(100, run.wordsDone * 4);
        fill.style.width = pct + "%";
      }
      var label = $("sprint-goal-text");
      if (label) label.textContent = run.goal ? run.wordsDone + " / " + run.goal : String(run.wordsDone) + " 词";
    }
  }

  function startTimer() {
    if (!run) return;
    if (run.timer) window.clearInterval(run.timer);
    run.deadline = performance.now() + Math.max(0.1, run.timeLeft) * 1000;
    run.timer = window.setInterval(function () {
      if (!run || phase !== "playing" || run.ended) return;
      var left = (run.deadline - performance.now()) / 1000;
      run.timeLeft = Math.max(0, left);
      setText("game-time", Math.ceil(run.timeLeft));
      if (left <= 0) endGame("time");
    }, 100);
  }

  /* ---------------- 倒计时 / 暂停 ---------------- */
  function countdownHtml() {
    return '<span class="eyebrow">READY</span><strong id="countdown-num">3</strong>' +
      '<p>准备开始，点击可跳过</p>' +
      '<button class="btn btn-sm" type="button" data-act="skip">跳过 <em>SKIP</em></button>';
  }

  function startCountdown() {
    var box = $("game-countdown");
    if (!box || !run) {
      beginPlay();
      return;
    }
    box.hidden = false;
    box.innerHTML = countdownHtml();
    var step = 3;
    countdownTimer = window.setInterval(function () {
      step -= 1;
      if (step > 0) {
        setText("countdown-num", String(step));
        tone(480 + step * 70, 0.05);
      } else if (step === 0) {
        setText("countdown-num", "GO");
        tone(880, 0.08);
      } else {
        skipCountdown();
      }
    }, 720);
  }

  function skipCountdown() {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = 0;
    }
    if (phase !== "countdown" || !run || run.countdownDone) return;
    var box = $("game-countdown");
    if (box) box.hidden = true;
    run.countdownDone = true;
    beginPlay();
  }

  function pauseGame() {
    if (phase !== "playing" || !run) return;
    phase = "paused";
    setPanelPhase("paused");
    run.timeLeft = Math.max(0, (run.deadline - performance.now()) / 1000);
    if (run.timer) { window.clearInterval(run.timer); run.timer = 0; }
    if (run.spawnTimer) { window.clearInterval(run.spawnTimer); run.spawnTimer = 0; }
    if (run.raf) { window.cancelAnimationFrame(run.raf); run.raf = 0; }
    if (active === "rush" && run.windowCfg && run.windowCfg.sec) {
      run.windowLeft = Math.max(0, run.targetAt + run.windowCfg.sec * 1000 - performance.now());
    }
    var box = $("game-pause");
    if (box) {
      box.hidden = false;
      box.innerHTML = '<span class="eyebrow">PAUSED</span><strong>已暂停</strong>' +
        '<p>按 Esc 继续 · 计时、下落与切换窗口都已停住</p>' +
        '<div><button class="btn btn-accent btn-sm" type="button" data-act="resume">继续 <em>RESUME</em></button>' +
        '<button class="btn btn-sm" type="button" data-act="restart">重开 <em>RESTART</em></button>' +
        '<button class="btn btn-sm" type="button" data-act="setup">调整设置 <em>SETUP</em></button>' +
        '<button class="btn btn-sm" type="button" data-act="close">关闭 <em>CLOSE</em></button></div>';
    }
  }

  function resumeGame() {
    if (phase !== "paused" || !run) return;
    phase = "playing";
    setPanelPhase("playing");
    var box = $("game-pause");
    if (box) { box.hidden = true; box.innerHTML = ""; }
    run.deadline = performance.now() + Math.max(0.1, run.timeLeft) * 1000;
    startTimer();
    if (active === "rain") {
      run.last = 0;
      if (run.spawnTimer) window.clearInterval(run.spawnTimer);
      run.spawnTimer = window.setInterval(function () {
        if (phase === "playing") spawnRainWord();
      }, run.spawnMs || (run.speedCfg ? run.speedCfg.spawn : 1050));
      run.raf = window.requestAnimationFrame(rainTick);
    } else if (active === "rush") {
      if (run.windowCfg && run.windowCfg.sec) {
        run.targetAt = performance.now() - (run.windowCfg.sec * 1000 - (run.windowLeft || 0));
      }
      run.raf = window.requestAnimationFrame(rushTick);
    }
  }

  /* ---------------- 一局开始 / 结束 ---------------- */
  function startRound() {
    if (!active || !draft) return;
    stopRuntime();
    draft = normalizeDraft(active, draft);
    savePrefsFor(active, draft);
    phase = "countdown";
    run = {
      kind: active,
      draft: clone(draft),
      duration: draft.duration,
      score: 0,
      combo: 0,
      bestCombo: 0,
      hits: 0,
      misses: 0,
      ok: 0,
      bad: 0,
      timeLeft: draft.duration,
      infiniteLives: draft.lives === "inf",
      livesLeft: draft.lives === "inf" ? Infinity : Number(draft.lives),
      livesMax: draft.lives === "inf" ? Infinity : Number(draft.lives),
      ended: false,
      timer: 0,
      spawnTimer: 0,
      raf: 0,
      countdownDone: false,
      buffer: "",
      typedText: "",
      words: [],
      last: 0,
      wordsDone: 0,
      goal: draft.goal || 0
    };
    if (active === "rain") {
      run.pool = poolForDraft(draft);
      run.speedCfg = RAIN_SPEEDS[draft.speed] || RAIN_SPEEDS.standard;
      var density = RAIN_DENSITY[draft.density] || RAIN_DENSITY.standard;
      run.spawnMs = Math.max(280, Math.round(run.speedCfg.spawn * density.spawn));
    } else if (active === "rush") {
      run.windowCfg = rushWindowFor(draft.window);
      run.pool = RUSH_POOLS[draft.keys] || RUSH_POOLS.letters;
    } else {
      run.pool = poolForDraft(draft);
    }
    renderGame();
    setPanelPhase("countdown");
    startCountdown();
  }

  function stopRuntime() {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = 0;
    }
    if (!run) return;
    run.ended = true;
    if (run.timer) window.clearInterval(run.timer);
    if (run.spawnTimer) window.clearInterval(run.spawnTimer);
    if (run.raf) window.cancelAnimationFrame(run.raf);
    run = null;
  }

  function endGame(reason) {
    if (!run || run.ended) return;
    run.ended = true;
    var data = {
      score: run.score,
      hits: run.hits,
      misses: run.misses,
      combo: run.bestCombo,
      acc: accuracy(),
      duration: run.duration,
      reason: reason,
      goal: run.goal || 0,
      wordsDone: run.wordsDone || 0,
      livesLeft: run.livesLeft,
      timeLeft: run.timeLeft
    };
    var detail = detailFor(active, data);
    stopRuntime();
    phase = "over";
    setPanelPhase("over");
    var prevBest = best(active);
    var newBest = updateBest(active, data.score, detail);
    data.best = newBest;
    data.isBest = data.score > prevBest;
    renderResult(data);
  }

  function detailFor(kind, data) {
    if (kind === "rain") {
      return MODE_LABEL[draft.mode] + " · " + WORD_LEN_LABEL[draft.wordLen] + " · " + RAIN_SPEEDS[draft.speed].label +
        " · " + RAIN_DENSITY[draft.density].label + " · " + livesLabel(draft.lives) + " · " + draft.duration + " 秒";
    }
    if (kind === "rush") {
      return RUSH_KEY_LABEL[draft.keys] + " · 窗口" + rushWindowFor(draft.window).label + " · " + livesLabel(draft.lives) +
        " · " + draft.duration + " 秒";
    }
    return MODE_LABEL[draft.mode] + " · " + WORD_LEN_LABEL[draft.wordLen] + " · " + draft.goal + " 词目标 · " +
      (draft.strict ? "严格" : "宽松") + " · " + draft.duration + " 秒";
  }

  function statCell(en, cn, value) {
    return '<div><span class="glabel">' + en + '<em>' + cn + '</em></span><strong>' + value + '</strong></div>';
  }

  function resultStats(data) {
    var cells = [
      statCell("HITS", "命中", data.hits),
      statCell("ACC", "准确率", data.acc + "%"),
      statCell("COMBO", "最高连击", data.combo),
      statCell("MISS", "失误", data.misses)
    ];
    if (active === "sprint") {
      cells[3] = statCell("WORDS", "完成词数", data.wordsDone);
      cells.push(statCell("TIME", "用时", Math.round(data.duration - (data.timeLeft || 0)) + "s"));
    } else {
      cells.push(statCell("TIME", "时长", data.duration + "s"));
    }
    return cells.join("");
  }

  function resultNote(data) {
    if (data.reason === "goal") return "目标达成：完成 " + data.wordsDone + " 个词，额外 +25 分。";
    if (data.reason === "lives") return "生命用完，本局结束。";
    if (data.reason === "time") return "时间到，本局 " + data.duration + " 秒。";
    return "";
  }

  function renderResult(data) {
    var box = $("game-body");
    if (!box) return;
    var bestLine = data.isBest
      ? '<span class="gresult-tag">NEW BEST 新纪录</span>'
      : "";
    box.innerHTML = '<section class="gresult">' +
      '<div class="gresult-head"><span class="eyebrow">ROUND OVER / ' + GAME_EN[active] + '</span>' +
      '<h3>本局结束 <em>' + GAME_EN[active] + '</em></h3>' +
      '<div class="gresult-score"><strong>' + data.score + '</strong><span class="glabel">SCORE<em>得分</em></span></div>' +
      '<p class="gresult-note">' + esc(resultNote(data)) + '</p>' + bestLine + '</div>' +
      '<div class="gresult-stats">' + resultStats(data) + '</div>' +
      '<div class="gresult-best"><span class="glabel">BEST<em>最高分</em></span><strong>' + data.best + '</strong></div>' +
      '<div class="gresult-actions">' +
      '<button class="btn btn-accent" type="button" data-act="again">再来一局 <em>AGAIN</em></button>' +
      '<button class="btn" type="button" data-act="setup">调整设置 <em>SETUP</em></button>' +
      '<button class="btn" type="button" data-act="close">关闭 <em>CLOSE</em></button>' +
      '</div></section>';
    var panel = $("game-panel");
    if (panel) panel.scrollTop = 0;
  }

  /* ---------------- 单词雨 ---------------- */
  function rainWordHtml(item, typed) {
    if (item.kind === "cn") {
      return '<b class="rw-cn">' + esc(item.cn) + '</b><span class="rw-py">' + pyHtml(item.py, typed, typed > 0) + '</span>';
    }
    return '<span class="rw-word">' + lettersHtml(item.word, typed, typed > 0) + '</span>';
  }

  function lettersHtml(word, typed, showCursor) {
    var out = "";
    for (var i = 0; i < word.length; i++) {
      var cls = i < typed ? "done" : showCursor !== false && i === typed ? "cur" : "";
      out += cls ? '<i class="' + cls + '">' + esc(word.charAt(i)) + '</i>' : esc(word.charAt(i));
    }
    return out;
  }

  function pyHtml(display, typed, showCursor) {
    var index = 0;
    var out = "";
    for (var i = 0; i < display.length; i++) {
      var ch = display.charAt(i);
      if (ch === " ") { out += " "; continue; }
      var cls = index < typed ? "done" : showCursor !== false && index === typed ? "cur" : "";
      out += cls ? '<i class="' + cls + '">' + esc(ch) + '</i>' : esc(ch);
      index += 1;
    }
    return out;
  }

  function hasRainKey(key) {
    if (!run) return true;
    for (var i = 0; i < run.words.length; i++) {
      if (run.words[i].item.key === key) return true;
    }
    return false;
  }

  function spawnRainWord(startY) {
    if (!run || phase !== "playing" || run.ended) return;
    var stage = $("rain-stage");
    var layer = $("rain-words");
    if (!stage || !layer) return;
    run.width = stage.clientWidth;
    run.height = stage.clientHeight;
    var pool = run.pool && run.pool.length ? run.pool : EN_POOL;
    var item = pool[Math.floor(Math.random() * pool.length)];
    for (var tries = 0; tries < 8 && hasRainKey(item.key); tries++) {
      item = pool[Math.floor(Math.random() * pool.length)];
    }
    var y = typeof startY === "number" ? startY : 4;
    var el = document.createElement("div");
    el.className = "rain-word" + (item.kind === "cn" ? " rain-word--cn" : "");
    el.dataset.key = item.key;
    el.innerHTML = rainWordHtml(item, 0);
    el.style.transform = "translate3d(0," + y + "px,0)";
    layer.appendChild(el);
    var width = el.offsetWidth || 76;
    var x = 10 + Math.random() * Math.max(10, run.width - width - 20);
    el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    run.words.push({
      item: item,
      el: el,
      x: x,
      y: y,
      speed: run.speedCfg.fall * (0.82 + Math.random() * 0.36) + Math.min(28, run.score / 140)
    });
  }

  function rainTick(ts) {
    if (!run || phase !== "playing" || run.ended) return;
    if (!run.last) run.last = ts;
    var dt = Math.min(0.06, Math.max(0, (ts - run.last) / 1000));
    run.last = ts;
    var bottom = (run.height || 420) - 84;
    for (var i = run.words.length - 1; i >= 0; i--) {
      var word = run.words[i];
      if (!word.el.parentNode) { run.words.splice(i, 1); continue; }
      word.y += word.speed * dt;
      word.el.style.transform = "translate3d(" + word.x + "px," + word.y + "px,0)";
      if (word.y >= bottom) {
        word.el.remove();
        run.words.splice(i, 1);
        missRainWord(word);
        if (!run || run.ended) return;
      }
    }
    if (!run) return;
    run.raf = window.requestAnimationFrame(rainTick);
  }

  function missRainWord(word) {
    if (!run) return;
    run.combo = 0;
    run.bad += Math.min(10, Math.max(2, word.item.key.length));
    if (!run.infiniteLives) {
      run.livesLeft = Math.max(0, run.livesLeft - 1);
      updateLifebar();
    }
    updateHud();
    shake("rain-stage");
    tone(140, 0.09, "sawtooth");
    if (!run.infiniteLives && run.livesLeft <= 0) endGame("lives");
  }

  function renderRainBuffer() {
    if (!run) return;
    var typedEl = $("rain-typed");
    if (typedEl) {
      typedEl.textContent = run.buffer || "输入落下的单词或拼音";
      typedEl.classList.toggle("is-empty", !run.buffer);
    }
    run.words.forEach(function (word) {
      if (!word.el.parentNode) return;
      var activeWord = run.buffer && word.item.key.indexOf(run.buffer) === 0;
      word.el.classList.toggle("is-active", !!activeWord);
      word.el.innerHTML = rainWordHtml(word.item, activeWord ? run.buffer.length : 0);
    });
  }

  function rainKey(e) {
    if (!run || phase !== "playing" || run.ended) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      run.buffer = run.buffer.slice(0, -1);
      renderRainBuffer();
      return;
    }
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
    e.preventDefault();
    var next = run.buffer + e.key.toLowerCase();
    var candidates = run.words.filter(function (word) {
      return word.item.key.indexOf(next) === 0;
    });
    if (!candidates.length) {
      run.buffer = "";
      run.bad += 1;
      run.combo = 0;
      shake("rain-stage");
      tone(150, 0.06, "sawtooth");
      updateHud();
      renderRainBuffer();
      return;
    }
    run.buffer = next;
    run.ok += 1;
    var exact = null;
    run.words.forEach(function (word) {
      if (word.item.key === next && (!exact || word.y > exact.y)) exact = word;
    });
    if (exact) {
      run.score += next.length * 7 + run.combo * 4;
      run.combo += 1;
      if (run.combo > run.bestCombo) run.bestCombo = run.combo;
      run.hits += 1;
      run.buffer = "";
      exact.el.remove();
      var index = run.words.indexOf(exact);
      if (index >= 0) run.words.splice(index, 1);
      tone(760 + Math.min(300, run.combo * 8), 0.045);
      updateHud();
    }
    renderRainBuffer();
  }

  /* ---------------- 键位冲刺 ---------------- */
  function pickRushTarget() {
    if (!run) return;
    var pool = run.pool && run.pool.length ? run.pool : RUSH_POOLS.letters;
    var next = run.last;
    for (var i = 0; i < 12 && next === run.last; i++) {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
    run.last = next;
    run.target = next;
    run.targetAt = performance.now();
    setText("rush-key", next.toUpperCase());
    var info = window.KEYBOARD ? window.KEYBOARD.keyForChar(next) : null;
    var fingerEl = $("rush-finger");
    if (fingerEl) {
      if (!run.draft.finger) {
        fingerEl.textContent = "";
      } else if (info && info.key && window.KEYBOARD) {
        var finger = window.KEYBOARD.fingers[info.key.finger];
        fingerEl.textContent = finger ? finger.hand + " · " + finger.name : "";
      } else {
        fingerEl.textContent = "";
      }
    }
    if (run.kb && window.KEYBOARD) {
      if (run.draft.finger) window.KEYBOARD.showNext(run.kb, next);
      else window.KEYBOARD.clearStates(run.kb);
    }
    var stage = $("rush-stage");
    if (stage) stage.dataset.key = next;
    var bar = $("rush-window");
    if (bar) {
      bar.style.setProperty("--p", "1");
      bar.classList.remove("is-low");
    }
  }

  function rushTick(ts) {
    if (!run || phase !== "playing" || run.ended) return;
    var win = run.windowCfg && run.windowCfg.sec ? run.windowCfg.sec * 1000 : 0;
    if (win) {
      var left = run.targetAt + win - ts;
      var bar = $("rush-window");
      if (bar) {
        bar.style.setProperty("--p", String(Math.max(0, Math.min(1, left / win))));
        bar.classList.toggle("is-low", left < win * 0.28);
      }
      if (left <= 0) {
        rushTimeout();
        if (!run || run.ended) return;
      }
    }
    run.raf = window.requestAnimationFrame(rushTick);
  }

  function rushTimeout() {
    if (!run) return;
    run.misses += 1;
    run.bad += 1;
    run.combo = 0;
    shake("rush-stage");
    tone(150, 0.07, "sawtooth");
    if (window.KEYBOARD && run.kb) {
      var info = window.KEYBOARD.keyForChar(run.target);
      if (info && info.key) window.KEYBOARD.flash(run.kb, info.key.code, "error");
    }
    if (!run.infiniteLives) {
      run.livesLeft = Math.max(0, run.livesLeft - 1);
      updateLifebar();
    }
    updateHud();
    if (!run.infiniteLives && run.livesLeft <= 0) {
      endGame("lives");
      return;
    }
    pickRushTarget();
  }

  function rushKey(e) {
    if (!run || phase !== "playing" || run.ended) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1 || !/[a-zA-Z0-9;]/.test(e.key)) return;
    e.preventDefault();
    var ch = e.key.toLowerCase();
    if (ch === run.target) {
      run.score += (run.windowCfg ? run.windowCfg.base : 10) + run.combo * 2;
      run.combo += 1;
      if (run.combo > run.bestCombo) run.bestCombo = run.combo;
      run.hits += 1;
      run.ok += 1;
      tone(660 + Math.min(380, run.combo * 12), 0.035);
      if (window.KEYBOARD && run.kb) {
        var info = window.KEYBOARD.keyForChar(ch);
        if (info && info.key) window.KEYBOARD.flash(run.kb, info.key.code, "pressed");
      }
      pickRushTarget();
      updateHud();
    } else {
      run.bad += 1;
      if (run.draft.penalty) run.misses += 1;
      run.combo = 0;
      shake("rush-stage");
      tone(150, 0.06, "sawtooth");
      if (window.KEYBOARD && run.kb) {
        var badInfo = window.KEYBOARD.keyForChar(ch);
        if (badInfo && badInfo.key) window.KEYBOARD.flash(run.kb, badInfo.key.code, "error");
      }
      // 关闭「按错扣命」后，按错只清连击，不扣生命。
      if (run.draft.penalty && !run.infiniteLives) {
        run.livesLeft = Math.max(0, run.livesLeft - 1);
        updateLifebar();
      }
      updateHud();
      if (run.draft.penalty && !run.infiniteLives && run.livesLeft <= 0) endGame("lives");
    }
  }

  /* ---------------- 词组冲刺 ---------------- */
  function nextSprintWord() {
    if (!run) return;
    var pool = run.pool && run.pool.length ? run.pool : EN_POOL;
    var item = pool[Math.floor(Math.random() * pool.length)];
    for (var i = 0; i < 6 && run.item && item.key === run.item.key; i++) {
      item = pool[Math.floor(Math.random() * pool.length)];
    }
    run.item = item;
    run.typedText = "";
    var stage = $("sprint-stage");
    if (stage) stage.dataset.key = item.key;
    renderSprintWord();
  }

  function cnCharsHtml(cn, py, typed) {
    var syllables = py.split(/\s+/);
    var bounds = [];
    var total = 0;
    syllables.forEach(function (syllable) {
      total += syllable.length;
      bounds.push(total);
    });
    var current = -1;
    for (var i = 0; i < bounds.length; i++) {
      if (typed < bounds[i]) { current = i; break; }
    }
    var out = "";
    for (var c = 0; c < cn.length; c++) {
      var cls = current === -1 ? "is-done" : c < current ? "is-done" : c === current ? "is-current" : "";
      out += '<span class="' + cls + '">' + esc(cn.charAt(c)) + '</span>';
    }
    return out;
  }

  function renderSprintWord() {
    if (!run || !run.item) return;
    var item = run.item;
    var typed = run.typedText.length;
    var target = $("sprint-target");
    var typedEl = $("sprint-typed");
    if (target) {
      if (item.kind === "cn") {
        target.innerHTML = '<div class="sprint-cn"><div class="sprint-cn-chars">' +
          cnCharsHtml(item.cn, item.py, typed) + '</div><div class="sprint-py">' +
          pyHtml(item.py, typed) + '</div></div>';
      } else {
        target.innerHTML = '<div class="sprint-en">' + lettersHtml(item.word, typed) + '</div>';
      }
    }
    if (typedEl) {
      typedEl.innerHTML = run.typedText
        ? '<span class="sprint-input">' + esc(run.typedText) + '</span><i class="sprint-caret"></i>'
        : '<span class="is-empty">输入拼音或单词开始 · 不需要回车</span>';
    }
  }

  function sprintKey(e) {
    if (!run || phase !== "playing" || run.ended) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      run.typedText = run.typedText.slice(0, -1);
      renderSprintWord();
      return;
    }
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
    e.preventDefault();
    var ch = e.key.toLowerCase();
    var expected = run.item.key.charAt(run.typedText.length);
    if (ch === expected) {
      run.typedText += ch;
      run.ok += 1;
      tone(680, 0.02);
      if (run.typedText.length >= run.item.key.length) {
        completeSprintWord();
        return;
      }
      renderSprintWord();
    } else {
      run.bad += 1;
      run.combo = 0;
      shake("sprint-stage");
      tone(150, 0.05, "sawtooth");
      if (run.draft.strict) {
        // 严格模式：打错重置当前词，并扣 5 分（最低 0 分）。
        run.typedText = "";
        run.score = Math.max(0, run.score - 5);
        renderSprintWord();
      }
      updateHud();
    }
  }

  function completeSprintWord() {
    if (!run) return;
    run.score += run.item.key.length * 7 + run.combo * 4;
    run.combo += 1;
    if (run.combo > run.bestCombo) run.bestCombo = run.combo;
    run.hits += 1;
    run.wordsDone += 1;
    tone(840, 0.04);
    updateHud();
    if (run.goal && run.wordsDone >= run.goal) {
      run.score += 25;
      updateHud();
      endGame("goal");
      return;
    }
    nextSprintWord();
  }

  /* ---------------- 启动游戏 ---------------- */
  function beginPlay() {
    if (!run || run.ended) return;
    phase = "playing";
    setPanelPhase("playing");
    run.last = 0;
    startTimer();
    if (active === "rain") {
      run.pool = poolForDraft(run.draft);
      run.speedCfg = RAIN_SPEEDS[run.draft.speed] || RAIN_SPEEDS.standard;
      var density = RAIN_DENSITY[run.draft.density] || RAIN_DENSITY.standard;
      run.spawnMs = Math.max(280, Math.round(run.speedCfg.spawn * density.spawn));
      var stage = $("rain-stage");
      run.width = stage ? stage.clientWidth : 600;
      run.height = stage ? stage.clientHeight : 420;
      spawnRainWord(4);
      spawnRainWord(30);
      run.spawnTimer = window.setInterval(function () {
        if (phase === "playing") spawnRainWord();
      }, run.spawnMs);
      run.raf = window.requestAnimationFrame(rainTick);
    } else if (active === "rush") {
      run.windowCfg = rushWindowFor(run.draft.window);
      run.pool = RUSH_POOLS[run.draft.keys] || RUSH_POOLS.letters;
      run.kb = document.querySelector("#rush-keyboard .kb");
      if (run.kb && window.KEYBOARD && !run.draft.finger) window.KEYBOARD.clearStates(run.kb);
      pickRushTarget();
      run.raf = window.requestAnimationFrame(rushTick);
    } else {
      run.pool = poolForDraft(run.draft);
      run.goal = run.draft.goal || 0;
      nextSprintWord();
    }
    updateHud();
    updateLifebar();
  }

  /* ---------------- 键盘事件 ---------------- */
  function onKeyDown(e) {
    if (!active) return;
    if (e.key === "Escape") {
      if (e.repeat) return;
      if (phase === "playing") { e.preventDefault(); pauseGame(); }
      else if (phase === "paused") { e.preventDefault(); resumeGame(); }
      else if (phase === "countdown") { e.preventDefault(); skipCountdown(); }
      else if (phase === "setup" || phase === "over") { e.preventDefault(); closeModal(); }
      return;
    }
    if (phase === "countdown") {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); skipCountdown(); }
      return;
    }
    if (phase !== "playing") return;
    if (active === "rain") rainKey(e);
    else if (active === "rush") rushKey(e);
    else sprintKey(e);
  }

  window.GAME = {
    renderPage: renderPage,
    destroy: destroy,
    openGame: openGame,
    startGame: startGame
  };
})();
