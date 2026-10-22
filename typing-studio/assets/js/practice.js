/* 键艺 KeyCraft — 独立练习页与打字引擎
   内容规则：练习文本只由本课 focus 键位组成；一次只显示一行；打完一行切换下一行。 */
(function () {
  "use strict";

  var root = null;
  var lesson = null;
  var course = null;
  var cfg = null;
  var refs = {};
  var audioCtx = null;
  var hintTimer = null;
  var countdownTimer = null;

  /* 常见英文标点（Shift 符号与普通标点） */
  var PUNCT_CHARS = [",", ".", ";", "'", "/", "?", "!", ":", '"', "<", ">"];

  /* ---------------- 快捷键绑定 ---------------- */
  var DEFAULT_SHORTCUTS = {
    pause: "Escape",
    restart: "Ctrl+Enter",
    back: "Shift+Escape",
    skip: "Tab"
  };

  /* 绑定冲突/失效时的兜底链：第一个就是默认值 */
  var SHORTCUT_FALLBACKS = {
    pause: ["Escape", "P", "F8"],
    back: ["Shift+Escape", "Alt+ArrowLeft", "F9"],
    restart: ["Ctrl+Enter", "Ctrl+R", "F10"],
    skip: ["Tab", "F6", "F7"]
  };

  var SHORTCUT_ORDER = ["pause", "back", "restart", "skip"];

  var NAMED_KEYS = {
    Escape: 1, Tab: 1, Enter: 1, Backspace: 1, Delete: 1, Insert: 1, Space: 1,
    ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1,
    Home: 1, End: 1, PageUp: 1, PageDown: 1, CapsLock: 1, ContextMenu: 1
  };

  for (var fk = 1; fk <= 12; fk++) NAMED_KEYS["F" + fk] = 1;

  var KEY_ALIASES = {
    esc: "Escape",
    escape: "Escape",
    space: "Space",
    spacebar: "Space",
    enter: "Enter",
    return: "Enter",
    tab: "Tab",
    backspace: "Backspace",
    delete: "Delete",
    insert: "Insert",
    arrowup: "ArrowUp",
    up: "ArrowUp",
    arrowdown: "ArrowDown",
    down: "ArrowDown",
    arrowleft: "ArrowLeft",
    left: "ArrowLeft",
    arrowright: "ArrowRight",
    right: "ArrowRight",
    home: "Home",
    end: "End",
    pageup: "PageUp",
    pagedown: "PageDown",
    capslock: "CapsLock",
    contextmenu: "ContextMenu",
    comma: ",",
    period: ".",
    slash: "/",
    semicolon: ";",
    quote: "'",
    bracketleft: "[",
    bracketright: "]",
    backslash: "\\",
    minus: "-",
    equal: "=",
    backquote: "`"
  };

  /* e.code → 主键名，与设置页生成绑定字符串的规则保持一致 */
  var SHORTCUT_CODE_KEYS = {
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

  var SHORTCUT_KEY_LABELS = {
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→"
  };

  var shortcutCacheRaw = "";
  var shortcutCacheMap = null;

  function normalizeKeyName(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (!s) return "";
    if (s === " ") return "Space";
    if (s.length === 1) return /[a-z]/i.test(s) ? s.toUpperCase() : s;
    var fMatch = /^f([1-9]|1[0-2])$/i.exec(s);
    if (fMatch) return "F" + fMatch[1];
    var numpad = /^numpad([0-9])$/i.exec(s);
    if (numpad) return "Numpad" + numpad[1];
    var alias = KEY_ALIASES[s.toLowerCase()];
    if (alias) return alias;
    return NAMED_KEYS[s] ? s : "";
  }

  function parseShortcut(spec) {
    if (typeof spec !== "string") return null;
    var parts = spec.split("+");
    var cleaned = [];
    parts.forEach(function (part) {
      var p = part.trim();
      if (p) cleaned.push(p);
    });
    if (!cleaned.length) return null;
    var rawKey = cleaned.pop();
    var binding = { ctrl: false, alt: false, shift: false, meta: false, key: "", sig: "" };
    for (var i = 0; i < cleaned.length; i++) {
      var mod = cleaned[i].toLowerCase();
      if (mod === "ctrl" || mod === "control") binding.ctrl = true;
      else if (mod === "alt" || mod === "option") binding.alt = true;
      else if (mod === "shift") binding.shift = true;
      else if (mod === "meta" || mod === "win" || mod === "cmd" || mod === "command") binding.meta = true;
      else return null;
    }
    var keyName = normalizeKeyName(rawKey);
    if (!keyName) return null;
    if (keyName === "Shift" || keyName === "Control" || keyName === "Alt" || keyName === "Meta") return null;
    binding.key = keyName;
    binding.sig = (binding.ctrl ? "1" : "0") + (binding.alt ? "1" : "0") +
      (binding.shift ? "1" : "0") + (binding.meta ? "1" : "0") + "|" + keyName;
    return binding;
  }

  function resolveShortcuts(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    var used = {};
    var map = {};
    SHORTCUT_ORDER.forEach(function (action) {
      var candidate = parseShortcut(source[action]);
      if (!candidate || used[candidate.sig]) {
        candidate = null;
        var chain = SHORTCUT_FALLBACKS[action] || [DEFAULT_SHORTCUTS[action]];
        for (var i = 0; i < chain.length; i++) {
          var fb = parseShortcut(chain[i]);
          if (fb && !used[fb.sig]) {
            candidate = fb;
            break;
          }
        }
        if (!candidate) candidate = parseShortcut(DEFAULT_SHORTCUTS[action]);
      }
      if (!candidate) return;
      used[candidate.sig] = true;
      map[action] = candidate;
    });
    return map;
  }

  function activeShortcuts() {
    var raw = setting("shortcuts", null);
    var str = "";
    try {
      str = JSON.stringify(raw || {});
    } catch (err) {
      str = "";
    }
    if (shortcutCacheMap && str === shortcutCacheRaw) return shortcutCacheMap;
    shortcutCacheRaw = str;
    shortcutCacheMap = resolveShortcuts(raw);
    return shortcutCacheMap;
  }

  function eventKeyName(e) {
    var code = e && e.code ? String(e.code) : "";
    var letter = /^Key([A-Z])$/.exec(code);
    if (letter) return letter[1];
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Numpad[0-9]$/.test(code)) return "Numpad" + code.slice(6);
    if (SHORTCUT_CODE_KEYS[code]) return SHORTCUT_CODE_KEYS[code];
    var raw = e && e.key;
    if (raw == null) return "";
    var s = String(raw);
    if (s === " " || s === "Spacebar") return "Space";
    if (s.length === 1) return /[a-z]/i.test(s) ? s.toUpperCase() : s;
    var alias = KEY_ALIASES[s.toLowerCase()];
    if (alias) return alias;
    return s;
  }

  function shortcutMatches(binding, e) {
    if (!binding) return false;
    if (eventKeyName(e) !== binding.key) return false;
    return !!e.ctrlKey === binding.ctrl &&
      !!e.altKey === binding.alt &&
      !!e.shiftKey === binding.shift &&
      !!e.metaKey === binding.meta;
  }

  function shortcutLabel(binding) {
    if (!binding) return "";
    var parts = [];
    if (binding.ctrl) parts.push("Ctrl");
    if (binding.alt) parts.push("Alt");
    if (binding.shift) parts.push("Shift");
    if (binding.meta) parts.push("Meta");
    parts.push(SHORTCUT_KEY_LABELS[binding.key] || binding.key);
    return parts.join("+");
  }

  function updatePauseHint() {
    if (!refs.pauseKeys) return;
    var sc = activeShortcuts();
    refs.pauseKeys.innerHTML =
      "<kbd>" + escapeHtml(shortcutLabel(sc.pause)) + "</kbd> 继续 · " +
      "<kbd>" + escapeHtml(shortcutLabel(sc.back)) + "</kbd> 返回";
  }

  function baseState() {
    return {
      mode: "latin",
      focus: null,
      sentence: false,
      lines: [],
      lineIndex: 0,
      charIndex: 0,
      totalChars: 0,
      totalUnits: 0,
      widthKey: "",
      lengthKey: "",
      started: false,
      finished: false,
      startAt: 0,
      finalDuration: 0,
      timer: null,
      errors: 0,
      keystrokes: 0,
      correctKeystrokes: 0,
      errorMap: {},
      composing: false,
      compositionText: "",
      hideCodes: false,
      combo: 0,
      maxCombo: 0,
      speedSamples: [],
      sampleSlot: -1,
      paused: false,
      pausedAt: 0,
      pausedMs: 0,
      counting: false,
      countdownDone: false
    };
  }

  var S = baseState();

  /* ---------------- small utils ---------------- */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pad2(n) {
    n = Math.max(0, Number(n) || 0);
    return n < 10 ? "0" + n : String(n);
  }

  function setting(name, fallback) {
    var s = cfg && cfg.settings ? cfg.settings : null;
    if (!s) return fallback;
    return s[name] == null ? fallback : s[name];
  }

  function countKeys(obj) {
    return Object.keys(obj || {}).length;
  }

  function speedUnit() {
    if (S.mode === "latin") return "WPM";
    if (S.mode === "pinyin") return "字母/分";
    return "字/分";
  }

  function modeLabel() {
    if (S.mode === "latin") return "英文";
    if (S.mode === "pinyin") return "拼音";
    if (S.mode === "ime") return "输入法";
    return "五笔";
  }

  function icon(name) {
    return window.APP ? window.APP.icon(name) : "";
  }

  function isPinyinLesson() {
    return lesson && lesson.type === "pinyin";
  }

  function isIme() {
    return S.mode === "ime";
  }

  /* ---------------- focus parsing ---------------- */
  function newFocus() {
    return {
      letters: {},
      digits: {},
      punct: {},
      allowed: {},
      hasShift: false,
      hasSpace: false,
      hasPunct: false,
      hasPinyin: false,
      hasIme: false,
      allAlpha: false
    };
  }

  function parseFocus(list) {
    var f = newFocus();

    function add(ch) {
      var c = String(ch);
      if (!c) return;
      f.allowed[c.toLowerCase()] = true;
    }

    (Array.isArray(list) ? list : []).forEach(function (item) {
      var raw = String(item == null ? "" : item).trim();
      if (!raw) return;
      var low = raw.toLowerCase();
      if (low === "space") { f.hasSpace = true; return; }
      if (low === "shift") { f.hasShift = true; return; }
      if (low === "punctuation") {
        f.hasPunct = true;
        PUNCT_CHARS.forEach(function (c) { f.punct[c] = true; add(c); });
        return;
      }
      if (low === "pinyin") { f.hasPinyin = true; return; }
      if (low === "ime") { f.hasIme = true; return; }

      var range = /^([a-z0-9])\s*[–—\-]\s*([a-z0-9])$/i.exec(raw);
      if (range) {
        var a = range[1].toLowerCase();
        var b = range[2].toLowerCase();
        var ca = a.charCodeAt(0);
        var cb = b.charCodeAt(0);
        if (cb < ca) { var tmp = ca; ca = cb; cb = tmp; }
        for (var code = ca; code <= cb; code++) {
          var ch = String.fromCharCode(code);
          if (/[a-z]/.test(ch)) f.letters[ch] = true;
          else if (/[0-9]/.test(ch)) f.digits[ch] = true;
          add(ch);
        }
        if (a === "a" && b === "z") f.allAlpha = true;
        return;
      }

      if (raw.length === 1) {
        if (/[A-Za-z]/.test(raw)) f.letters[low] = true;
        else if (/[0-9]/.test(raw)) f.digits[raw] = true;
        else f.punct[raw] = true;
        add(raw);
      }
    });

    return f;
  }

  function everyAllowed(word, f) {
    var chars = Array.from(String(word));
    for (var i = 0; i < chars.length; i++) {
      if (!f.allowed[chars[i].toLowerCase()]) return false;
    }
    return true;
  }

  /* 句子课：整句/段落/综合测试。这类课保留课程自带的句子。 */
  function isSentenceLesson(type, f) {
    if (type === "pinyin") return !countKeys(f.letters);
    if (type !== "latin") return false;
    if (f.allAlpha || f.hasPunct || f.hasPinyin || f.hasIme) return true;
    if (!countKeys(f.letters) && !countKeys(f.digits) && !countKeys(f.punct)) return true;
    if (f.hasShift && !countKeys(f.letters) && !countKeys(f.digits) && countKeys(f.punct)) return true;
    return false;
  }

  /* ---------------- token helpers ---------------- */
  function token(text, meta) {
    return { text: String(text), meta: meta || null };
  }

  function joinTokens(tokens, joiner) {
    return tokens.map(function (t) { return t.text; }).join(joiner);
  }

  function tokenChars(tokens) {
    var n = 0;
    tokens.forEach(function (t) { n += t.text.length + 1; });
    return n;
  }

  function syllables(pinyin) {
    return String(pinyin == null ? "" : pinyin).trim().split(/\s+/).filter(Boolean);
  }

  function seedRandom(seedStr) {
    var h = 2166136261;
    var str = String(seedStr || "keycraft");
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h += 0x6D2B79F5;
      var t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mixCase(text, rnd) {
    var r = rnd();
    if (r < 0.24) return text.toUpperCase();
    if (r < 0.52) return text.charAt(0).toUpperCase() + text.slice(1);
    return text;
  }

  /* 行宽：英文 22 / 30 / 40，拼音与五笔约一半 */
  function lineWidthFor(mode, key) {
    var base = key === "narrow" ? 22 : key === "wide" ? 40 : 30;
    if (mode !== "latin") base = Math.max(10, Math.round(base / 2));
    return base;
  }

  function practiceLineCount() {
    var length = setting("practiceLength", "standard");
    if (length === "short") return 6;
    if (length === "long") return 10;
    return 8;
  }

  /* ---------------- token generation ---------------- */
  function generatedGroups(f, target, kind) {
    var pool = [];
    Object.keys(f.letters).forEach(function (c) { pool.push(c); });
    if (kind === "latin") {
      Object.keys(f.digits).forEach(function (c) { pool.push(c); });
      Object.keys(f.punct).forEach(function (c) { pool.push(c); });
    }
    if (!pool.length) return [];

    var out = [];
    var seed = (lesson && lesson.id ? lesson.id : "kc") + "|" + kind + "|" + pool.join("");
    var rnd = seedRandom(seed);

    if (pool.length === 1 && !f.hasShift) {
      var p = pool[0];
      var pattern = [p, p, p, p + p, p + p + p, p, p + p, p + p + p, p + p + p + p];
      pattern.forEach(function (text) { out.push(token(text)); });
      return out;
    }

    var sizes = kind === "wubi" ? [2, 3, 4] : [3, 4, 5];
    var guard = 0;
    while (tokenChars(out) < Math.max(target, 36) && guard < 240) {
      guard += 1;
      var size = sizes[Math.floor(rnd() * sizes.length)];
      var text = "";
      for (var i = 0; i < size; i++) text += pool[Math.floor(rnd() * pool.length)];
      if (pool.length > 1) {
        var same = true;
        for (var j = 1; j < text.length; j++) if (text[j] !== text[0]) { same = false; break; }
        if (same) continue;
      }
      if (f.hasShift && kind === "latin") text = mixCase(text, rnd);
      out.push(token(text));
    }
    return out;
  }

  function cycleTokens(source, target) {
    if (!source.length) return [];
    var out = [];
    var sum = 0;
    var round = 0;
    while (sum < target && round < 90) {
      var batch = source.slice();
      var rot = round % source.length;
      if (rot > 0) batch = batch.slice(rot).concat(batch.slice(0, rot));
      if (round % 3 === 2) batch.reverse();
      for (var i = 0; i < batch.length; i++) {
        out.push(batch[i]);
        sum += batch[i].text.length + 1;
        if (sum >= target) break;
      }
      round += 1;
    }
    return out;
  }

  function latinTokens(target) {
    var f = S.focus;
    var drills = Array.isArray(lesson.drills) ? lesson.drills : [];

    if (S.sentence) {
      var words = [];
      drills.forEach(function (line) {
        String(line).replace(/\s+/g, " ").trim().split(" ").forEach(function (w) {
          if (w) words.push(token(w));
        });
      });
      if (!words.length) words = generatedGroups(f, target, "latin");
      return cycleTokens(words, target);
    }

    var qualified = [];
    drills.forEach(function (line) {
      String(line).replace(/\s+/g, " ").trim().split(" ").forEach(function (w) {
        if (w && everyAllowed(w, f)) qualified.push(token(w));
      });
    });

    var tokens = qualified.slice();
    var groups = generatedGroups(f, target, "latin");
    if (!tokens.length) tokens = groups;
    else if (tokenChars(tokens) < target * 0.7) tokens = tokens.concat(groups);
    return cycleTokens(tokens, target);
  }

  function pinyinTokens(target) {
    var f = S.focus;
    var items = Array.isArray(lesson.items) ? lesson.items : [];
    var qualifying = [];

    if (S.sentence) {
      qualifying = items.slice();
    } else {
      items.forEach(function (it) {
        var syls = syllables(it.pinyin);
        if (!syls.length) return;
        var ok = syls.every(function (s) {
          var c = s.charAt(0).toLowerCase();
          return /[a-z]/.test(c) && f.allowed[c];
        });
        if (ok) qualifying.push(it);
      });
    }

    var tokens = [];
    qualifying.forEach(function (it) {
      var syls = syllables(it.pinyin);
      var hs = Array.from(String(it.hanzi == null ? "" : it.hanzi));
      var perChar = hs.length === syls.length ? hs : null;
      if (S.mode === "ime") {
        if (perChar) {
          perChar.forEach(function (h, i) {
            tokens.push(token(h, { hanzi: h, pinyin: syls[i], word: it.hanzi }));
          });
        } else if (it.hanzi) {
          tokens.push(token(it.hanzi, { hanzi: it.hanzi, pinyin: it.pinyin, word: it.hanzi }));
        }
      } else {
        syls.forEach(function (s, i) {
          tokens.push(token(s, { hanzi: perChar ? perChar[i] : "", pinyin: s, word: it.hanzi }));
        });
      }
    });

    if (!tokens.length) {
      tokens = generatedGroups(f, target, "pinyin");
    } else if (tokenChars(tokens) < target * 0.65) {
      tokens = tokens.concat(generatedGroups(f, target, "pinyin"));
    }
    return cycleTokens(tokens, target);
  }

  function wubiTokens(target) {
    var f = S.focus;
    var items = Array.isArray(lesson.items) ? lesson.items : [];
    var tokens = [];
    items.forEach(function (it) {
      var code = String(it.code == null ? "" : it.code).toLowerCase();
      if (!code) return;
      var ok = Array.from(code).every(function (c) { return f.allowed[c]; });
      if (ok) tokens.push(token(code, { hanzi: it.hanzi || "", code: code, parts: it.parts || "" }));
    });
    if (!tokens.length) tokens = generatedGroups(f, target, "wubi");
    return cycleTokens(tokens, target);
  }

  /* ---------------- line building ---------------- */
  function makeLineEntry(tokens, joiner) {
    return { tokens: tokens, text: joinTokens(tokens, joiner) };
  }

  function refreshLine(line, joiner) {
    line.text = joinTokens(line.tokens, joiner);
  }

  function wrapTokens(tokens, width, joiner) {
    var lines = [];
    var cur = [];
    var curLen = 0;
    tokens.forEach(function (t) {
      var add = (cur.length ? joiner.length : 0) + t.text.length;
      if (cur.length && curLen + add > width) {
        lines.push(makeLineEntry(cur, joiner));
        cur = [t];
        curLen = t.text.length;
      } else {
        cur.push(t);
        curLen += add;
      }
    });
    if (cur.length) lines.push(makeLineEntry(cur, joiner));
    return lines;
  }

  function dedupeLines(lines, joiner) {
    for (var pass = 0; pass < 3; pass++) {
      for (var i = 1; i < lines.length; i++) {
        if (lines[i].text !== lines[i - 1].text) continue;
        var toks = lines[i].tokens;
        if (toks.length > 1) {
          var moved = toks.pop();
          if (i + 1 < lines.length) {
            lines[i + 1].tokens.unshift(moved);
            refreshLine(lines[i + 1], joiner);
          } else {
            lines[i - 1].tokens.push(moved);
            refreshLine(lines[i - 1], joiner);
          }
          refreshLine(lines[i], joiner);
        } else if (i + 1 < lines.length && lines[i + 1].tokens.length > 1) {
          var mv = lines[i + 1].tokens.shift();
          toks.push(mv);
          refreshLine(lines[i], joiner);
          refreshLine(lines[i + 1], joiner);
        } else {
          lines.splice(i, 1);
          i -= 1;
        }
      }
    }
    return lines;
  }

  function fitLines(tokens, width, joiner) {
    var lines = wrapTokens(tokens, width, joiner);
    var guard = 0;
    while (lines.length < 6 && tokens.length && guard < 10) {
      var batch = tokens.slice();
      var rot = (guard + 1) % Math.max(1, batch.length);
      batch = batch.slice(rot).concat(batch.slice(0, rot));
      if (rot % 2) batch.reverse();
      tokens = tokens.concat(batch);
      lines = wrapTokens(tokens, width, joiner);
      guard += 1;
    }
    if (lines.length > 10) lines = lines.slice(0, 10);
    lines = dedupeLines(lines, joiner);
    return lines;
  }

  function makeLine(entry, joiner) {
    var text = entry.text;
    var units = [];
    var cursor = 0;
    entry.tokens.forEach(function (t) {
      units.push({ start: cursor, end: cursor + t.text.length, meta: t.meta, text: t.text });
      cursor += t.text.length + joiner.length;
    });
    return { text: text, chars: Array.from(text), units: units, typed: [], done: false };
  }

  function buildData(mode) {
    S.mode = mode || S.mode;
    if (!S.focus) S.focus = parseFocus(lesson.focus);
    S.sentence = isSentenceLesson(lesson.type, S.focus);

    var widthKey = setting("lineWidth", "medium");
    var width = lineWidthFor(S.mode, widthKey);
    var lineCount = practiceLineCount();
    var target = Math.round(lineCount * width * 0.86);
    var tokens = [];
    var joiner = " ";

    if (lesson.type === "pinyin") {
      tokens = pinyinTokens(target);
      joiner = isIme() ? "" : " ";
    } else if (lesson.type === "wubi") {
      tokens = wubiTokens(target);
    } else {
      tokens = latinTokens(target);
    }

    var entries = fitLines(tokens, width, joiner);
    S.lines = entries.map(function (entry) { return makeLine(entry, joiner); });
    S.lineIndex = 0;
    S.charIndex = 0;
    S.widthKey = widthKey;
    S.lengthKey = setting("practiceLength", "standard");
    recomputeTotals();
  }

  function recomputeTotals() {
    var chars = 0;
    var units = 0;
    S.lines.forEach(function (line) {
      chars += line.text.length;
      units += line.units.length;
    });
    S.totalChars = chars;
    S.totalUnits = units;
  }

  /* ---------------- current position helpers ---------------- */
  function currentLine() {
    return S.lines[S.lineIndex] || null;
  }

  function currentExpected() {
    var line = currentLine();
    if (!line) return null;
    return line.chars[S.charIndex] == null ? null : line.chars[S.charIndex];
  }

  function completedChars() {
    var n = 0;
    for (var i = 0; i < S.lineIndex; i++) n += S.lines[i].text.length;
    return n + S.charIndex;
  }

  function completedUnits() {
    var n = 0;
    for (var i = 0; i < S.lineIndex; i++) n += S.lines[i].units.length;
    var line = currentLine();
    if (line) {
      line.units.forEach(function (u) {
        if (S.charIndex >= u.end) n += 1;
      });
    }
    return n;
  }

  function unitAt(index) {
    var line = currentLine();
    if (!line || !line.units.length) return null;
    for (var i = 0; i < line.units.length; i++) {
      if (index < line.units[i].end) return line.units[i];
    }
    return line.units[line.units.length - 1];
  }

  /* ---------------- page ---------------- */
  function mount(nextLesson, options) {
    destroy();
    lesson = nextLesson;
    course = window.getCourse(lesson.courseId);
    cfg = options || {};
    S = baseState();
    shortcutCacheRaw = "";
    shortcutCacheMap = null;
    S.mode = lesson.type === "pinyin" ? "pinyin" : lesson.type === "wubi" ? "wubi" : "latin";
    S.focus = parseFocus(lesson.focus);
    S.hideCodes = setting("wubiCodes", true) === false;

    buildData(S.mode);

    document.title = "练习 · " + lesson.title + " — 键艺 KeyCraft";
    document.body.classList.add("route-practice");

    var color = "var(--accent)";
    if (course && window.APP && window.APP.colorVar) color = window.APP.colorVar(course.color);
    else if (course && cfg.colorVar) color = cfg.colorVar(course.color);

    root = document.createElement("div");
    root.className = "practice-page";
    root.style.setProperty("--course", color);
    root.innerHTML = practiceMarkup();
    var app = document.getElementById("app");
    app.innerHTML = "";
    app.appendChild(root);

    cacheRefs();
    bind();
    resetSession();
    applySettings();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function focusChips() {
    var f = S.focus || parseFocus(lesson.focus);
    var chips = [];
    if (f.allAlpha) chips.push("A–Z");
    if (f.hasShift) chips.push("Shift");
    if (f.hasSpace) chips.push("Space");
    if (!f.allAlpha) {
      Object.keys(f.letters).forEach(function (c) { chips.push(c.toUpperCase()); });
    }
    Object.keys(f.digits).forEach(function (c) { chips.push(c); });
    Object.keys(f.punct).forEach(function (c) { chips.push(c); });
    if (f.hasPinyin) chips.push("拼音");
    if (f.hasIme) chips.push("IME");
    if (!chips.length) chips.push("综合");
    var shown = chips.slice(0, 10);
    var html = shown.map(function (c) {
      return '<span class="focus-key">' + escapeHtml(c) + "</span>";
    }).join("");
    if (chips.length > shown.length) {
      html += '<span class="focus-more">+' + (chips.length - shown.length) + "</span>";
    }
    return html;
  }

  function lessonNoLabel() {
    if (lesson.index > 0) return "第 " + pad2(lesson.index) + " 课";
    if (lesson.courseId && lesson.courseId.indexOf("daily") === 0) return "每日挑战";
    return "自由练习";
  }

  function practiceMarkup() {
    var tabs = isPinyinLesson()
      ? '<div class="practice-mode-tabs" role="group" aria-label="练习模式"><button class="practice-mode-tab" type="button" data-practice-mode="pinyin">拼音</button><button class="practice-mode-tab" type="button" data-practice-mode="ime">输入法</button></div>'
      : "";
    var keyboardHidden = setting("keyboardVisible", true) === false ? " hidden" : "";
    var backHref = lesson.backHref || "#/lesson/" + lesson.id;
    var sizeClass = "typing-size-" + (setting("typingSize", "m") || "m");

    return (
      '<header class="practice-topbar"><h1 class="visually-hidden">' + escapeHtml(lesson.title) + ' 打字练习</h1><div class="practice-topbar-inner">' +
      '<a class="practice-back" href="' + backHref + '"><span class="arrow">←</span><span class="back-label">返回</span></a>' +
      '<div class="practice-title"><span class="badge">' + escapeHtml(lesson.courseCode || "KC") + '</span>' +
      '<div class="practice-title-copy"><strong>' + escapeHtml(lesson.title) + '</strong>' +
      '<span class="practice-title-meta"><i id="practice-status">READY</i><i id="practice-mode-label">' + modeLabel() + "</i><i>" + lessonNoLabel() + "</i></span></div></div>" +
      '<div class="practice-top-actions' + (tabs ? " has-tabs" : "") + '">' + tabs +
      '<div class="practice-controls">' +
      '<button class="icon-btn" id="practice-pause-btn" type="button" data-practice-action="pause" aria-label="暂停">' + icon("pause") + "</button>" +
      '<button class="icon-btn" type="button" data-practice-action="restart" aria-label="重新开始">' + icon("refresh") + "</button>" +
      '<button class="icon-btn" type="button" data-practice-action="settings" aria-label="设置">' + icon("settings") + "</button>" +
      "</div></div></div></header>" +
      '<div class="practice-progress"><i id="practice-progress-bar"></i></div>' +
      '<main class="practice-wrap practice-wrap--v2 ' + sizeClass + '" id="main">' +
      '<section class="typing-sheet" id="typing-sheet">' +
      '<div class="typing-sheet-head">' +
      '<span class="typing-line-label" id="practice-line-label">LINE 01 / ' + pad2(S.lines.length) + "</span>" +
      '<span class="typing-focus"><span>FOCUS</span>' + focusChips() + "</span>" +
      '<span class="typing-char-count"><i id="practice-count">0 / ' + S.totalChars + "</i><span>CHAR</span></span>" +
      "</div>" +
      '<div class="typing-stage" id="typing-stage">' +
      '<div class="typing-prev is-empty" id="typing-prev" aria-hidden="true"></div>' +
      '<div class="typing-text' + (isIme() ? " is-cn" : "") + (S.mode === "wubi" ? " is-wubi" : "") + '" id="typing-text"></div>' +
      '<input class="typing-hidden-input" id="typing-input" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="打字输入"' + (isIme() ? " hidden disabled" : "") + ">" +
      '<textarea class="typing-ime-input" id="typing-ime" lang="zh-CN" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="中文输入法输入"' + (isIme() ? "" : " hidden disabled") + "></textarea>" +
      "</div>" +
      '<div class="typing-line-hint">' +
      '<div id="typing-hint" class="hint-inline"></div>' +
      '<button class="typing-start typing-start--inline" id="typing-start" type="button"><span class="start-icon">' + icon("play") + "</span><strong>开始</strong></button>" +
      "</div>" +
      '<div class="practice-pause" id="practice-pause" hidden><span class="eyebrow">PAUSED</span><strong>已暂停</strong><p>休息一下，继续时从当前字符接着打。</p><p class="practice-pause-keys" id="practice-pause-keys"></p><div><button class="btn btn-accent" type="button" data-practice-action="resume">继续</button><button class="btn" type="button" data-practice-action="restart">重新开始</button></div></div>' +
      "</section>" +
      '<div class="stats-rail" id="stats-rail" aria-label="实时数据">' +
      '<div class="rail-stat rail-stat--speed"><span>速度</span><strong id="stat-speed">0</strong><small id="stat-speed-unit">' + speedUnit() + '</small><svg class="rail-sparkline" id="stat-sparkline" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true"><polyline points="" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></polyline></svg></div>' +
      '<div class="rail-stat"><span>准确率</span><strong id="stat-accuracy">100.0</strong><small>%</small><div class="rail-bar"><i id="stat-accuracy-bar"></i></div></div>' +
      '<div class="rail-stat"><span>连击</span><strong id="stat-combo">0</strong><small>COMBO</small></div>' +
      '<div class="rail-stat"><span>错误</span><strong id="stat-errors">0</strong><small>ERRORS</small></div>' +
      '<div class="rail-stat"><span>用时</span><strong id="stat-time">0:00</strong><small>TIME</small></div>' +
      "</div>" +
      '<section class="practice-keyboard" id="practice-keyboard"' + keyboardHidden + '>' +
      '<div class="practice-keyboard-head"><span class="kb-head-label">键盘 · 指法提示</span><button class="practice-kb-toggle" id="practice-kb-toggle" type="button" data-practice-action="toggle-keyboard" aria-expanded="true">收起</button></div>' +
      '<div class="kb-wrap" id="practice-kb-wrap"></div>' +
      "</section>" +
      "</main>"
    );
  }

  function cacheRefs() {
    refs = {
      stage: document.getElementById("typing-stage"),
      text: document.getElementById("typing-text"),
      prev: document.getElementById("typing-prev"),
      input: document.getElementById("typing-input"),
      ime: document.getElementById("typing-ime"),
      start: document.getElementById("typing-start"),
      hint: document.getElementById("typing-hint"),
      progress: document.getElementById("practice-progress-bar"),
      status: document.getElementById("practice-status"),
      count: document.getElementById("practice-count"),
      lineLabel: document.getElementById("practice-line-label"),
      speed: document.getElementById("stat-speed"),
      speedUnit: document.getElementById("stat-speed-unit"),
      accuracy: document.getElementById("stat-accuracy"),
      accuracyBar: document.getElementById("stat-accuracy-bar"),
      combo: document.getElementById("stat-combo"),
      time: document.getElementById("stat-time"),
      errors: document.getElementById("stat-errors"),
      sparkline: document.getElementById("stat-sparkline"),
      sheet: document.getElementById("typing-sheet"),
      kbWrap: document.getElementById("practice-kb-wrap"),
      keyboard: document.getElementById("practice-keyboard"),
      kbToggle: document.getElementById("practice-kb-toggle"),
      modeLabel: document.getElementById("practice-mode-label"),
      pause: document.getElementById("practice-pause"),
      pauseKeys: document.getElementById("practice-pause-keys"),
      pauseBtn: document.getElementById("practice-pause-btn"),
      wrap: document.getElementById("main")
    };
    refs.spans = null;
    if (window.KEYBOARD) {
      refs.kb = window.KEYBOARD.render({
        colored: setting("keyboardColors", true) !== false,
        mini: false,
        interactive: false
      });
      refs.kbWrap.appendChild(refs.kb);
    }
  }

  function bind() {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    refs.input.addEventListener("input", onLatinInput);
    refs.input.addEventListener("paste", blockPaste);
    if (refs.ime) {
      refs.ime.addEventListener("input", onImeInput);
      refs.ime.addEventListener("compositionstart", onCompositionStart);
      refs.ime.addEventListener("compositionend", onCompositionEnd);
      refs.ime.addEventListener("compositionupdate", onCompositionUpdate);
      refs.ime.addEventListener("paste", blockPaste);
    }
    refs.start.addEventListener("click", beginFromOverlay);
    refs.stage.addEventListener("click", function (e) {
      if (e.target.closest(".typing-start")) return;
      if (S.finished || S.counting) return;
      if (!refs.start.hidden) hideStart();
      focusInput();
    });
    root.addEventListener("click", onPracticeClick);
  }

  function destroy() {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (S.timer) window.clearInterval(S.timer);
    S.timer = null;
    if (hintTimer) window.clearTimeout(hintTimer);
    hintTimer = null;
    if (countdownTimer) window.clearTimeout(countdownTimer);
    countdownTimer = null;
    var overlay = document.getElementById("practice-result-overlay");
    if (overlay) overlay.remove();
    var cd = document.getElementById("practice-countdown");
    if (cd) cd.remove();
    root = null;
    lesson = null;
    course = null;
    cfg = null;
    refs = {};
    shortcutCacheRaw = "";
    shortcutCacheMap = null;
    S = baseState();
  }

  /* ---------------- session ---------------- */
  function resetSession() {
    if (S.timer) window.clearInterval(S.timer);
    S.timer = null;
    if (hintTimer) window.clearTimeout(hintTimer);
    hintTimer = null;
    if (countdownTimer) window.clearTimeout(countdownTimer);
    countdownTimer = null;
    var oldCd = document.getElementById("practice-countdown");
    if (oldCd) oldCd.remove();

    buildData(S.mode);
    S.lineIndex = 0;
    S.charIndex = 0;
    S.lines.forEach(function (line) { line.typed = []; line.done = false; });
    S.started = false;
    S.finished = false;
    S.startAt = 0;
    S.finalDuration = 0;
    S.errors = 0;
    S.keystrokes = 0;
    S.correctKeystrokes = 0;
    S.errorMap = {};
    S.composing = false;
    S.compositionText = "";
    S.combo = 0;
    S.maxCombo = 0;
    S.speedSamples = [];
    S.sampleSlot = -1;
    S.paused = false;
    S.pausedAt = 0;
    S.pausedMs = 0;
    S.counting = false;
    S.countdownDone = false;

    if (refs.sparkline) {
      var spark = refs.sparkline.querySelector("polyline");
      if (spark) spark.setAttribute("points", "");
    }
    if (refs.pause) refs.pause.hidden = true;
    if (refs.pauseBtn) {
      refs.pauseBtn.innerHTML = icon("pause");
      refs.pauseBtn.setAttribute("aria-label", "暂停");
    }
    if (refs.modeLabel) refs.modeLabel.textContent = modeLabel();
    if (refs.status) refs.status.textContent = "READY";
    if (refs.progress) refs.progress.style.width = "0%";
    if (refs.start) refs.start.hidden = false;
    if (refs.count) refs.count.textContent = "0 / " + S.totalChars;
    if (refs.input) {
      refs.input.value = "";
      refs.input.hidden = isIme();
      refs.input.disabled = isIme();
    }
    if (refs.ime) {
      refs.ime.value = "";
      refs.ime.hidden = !isIme();
      refs.ime.disabled = !isIme();
    }
    if (refs.speedUnit) refs.speedUnit.textContent = speedUnit();
    if (refs.keyboard) refs.keyboard.hidden = setting("keyboardVisible", true) === false;

    setModeUI();
    renderText();
    paint();
    updateStats();
    updateHint();
    updateNextKey();
    window.setTimeout(focusInput, 60);
  }

  function setModeUI() {
    if (!root) return;
    root.querySelectorAll("[data-practice-mode]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.practiceMode === S.mode);
    });
    if (refs.text) {
      refs.text.classList.toggle("is-cn", isIme());
      refs.text.classList.toggle("is-wubi", S.mode === "wubi");
    }
    if (refs.modeLabel) refs.modeLabel.textContent = modeLabel();
    if (refs.keyboard) refs.keyboard.hidden = setting("keyboardVisible", true) === false;
  }

  /* ---------------- render ---------------- */
  function renderText() {
    if (!refs.text) return;
    var line = currentLine();
    var prev = S.lines[S.lineIndex - 1] || null;
    if (refs.prev) {
      refs.prev.textContent = prev ? prev.text : "";
      refs.prev.classList.toggle("is-empty", !prev);
    }
    refs.text.innerHTML = "";
    if (!line) {
      refs.spans = null;
      return;
    }
    var fragment = document.createDocumentFragment();
    line.chars.forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "ch" + (ch === " " ? " is-space" : "");
      span.textContent = ch;
      span.dataset.i = i;
      fragment.appendChild(span);
    });
    refs.text.appendChild(fragment);
    refs.spans = refs.text.querySelectorAll(".ch");
    refs.text.scrollTop = 0;
    updateLineLabel();
  }

  function paint() {
    var line = currentLine();
    if (!line || !refs.spans) return;
    for (var i = 0; i < refs.spans.length; i++) {
      var span = refs.spans[i];
      var cls = "ch" + (line.chars[i] === " " ? " is-space" : "");
      if (i < S.charIndex) {
        cls += line.typed[i] === line.chars[i] ? " is-done" : " is-wrong";
      } else if (i === S.charIndex && !S.finished) {
        cls += " is-current";
      }
      span.className = cls;
    }
    updateLineLabel();
  }

  function updateLineLabel() {
    if (refs.lineLabel) {
      refs.lineLabel.textContent = "LINE " + pad2(S.lineIndex + 1) + " / " + pad2(S.lines.length);
    }
  }

  function animateLine() {
    if (!refs.text) return;
    refs.text.classList.remove("is-entering");
    void refs.text.offsetWidth;
    refs.text.classList.add("is-entering");
    window.setTimeout(function () {
      if (refs.text) refs.text.classList.remove("is-entering");
    }, 190);
  }

  function beginFromOverlay(e) {
    e.preventDefault();
    e.stopPropagation();
    if (S.finished || S.counting) return;
    runCountdown(function () {
      hideStart();
      focusInput();
    });
  }

  function runCountdown(next) {
    if (setting("countdown", false) !== true || S.countdownDone) {
      next();
      return;
    }
    S.countdownDone = true;
    S.counting = true;
    if (refs.status) refs.status.textContent = "READY";
    var layer = document.createElement("div");
    layer.className = "practice-countdown";
    layer.id = "practice-countdown";
    layer.innerHTML = "<strong>3</strong>";
    if (refs.stage) refs.stage.appendChild(layer);
    var n = 3;
    function tick() {
      n -= 1;
      if (n > 0) {
        layer.querySelector("strong").textContent = String(n);
        countdownTimer = window.setTimeout(tick, 700);
        return;
      }
      S.counting = false;
      countdownTimer = null;
      layer.remove();
      next();
    }
    countdownTimer = window.setTimeout(tick, 700);
  }

  function hideStart() {
    if (refs.start) refs.start.hidden = true;
  }

  function focusInput() {
    if (!refs) return;
    if (isIme() && refs.ime) {
      try { refs.ime.focus({ preventScroll: true }); } catch (err) { refs.ime.focus(); }
    } else if (refs.input) {
      try { refs.input.focus({ preventScroll: true }); } catch (err) { refs.input.focus(); }
    }
  }

  function startClock() {
    if (S.started) return;
    S.started = true;
    S.startAt = Date.now();
    if (refs.status) refs.status.textContent = "LIVE";
    if (S.timer) window.clearInterval(S.timer);
    S.timer = window.setInterval(updateStats, 200);
  }

  function pauseSession() {
    if (!S.started || S.finished || S.paused) return;
    S.paused = true;
    S.pausedAt = Date.now();
    if (S.timer) window.clearInterval(S.timer);
    S.timer = null;
    if (refs.pause) refs.pause.hidden = false;
    if (refs.pauseBtn) {
      refs.pauseBtn.innerHTML = icon("play");
      refs.pauseBtn.setAttribute("aria-label", "继续");
    }
    if (refs.status) refs.status.textContent = "PAUSED";
    if (refs.input) refs.input.blur();
    if (refs.ime) refs.ime.blur();
    updateStats();
  }

  function resumeSession() {
    if (!S.paused) return;
    S.pausedMs += Date.now() - S.pausedAt;
    S.pausedAt = 0;
    S.paused = false;
    if (refs.pause) refs.pause.hidden = true;
    if (refs.pauseBtn) {
      refs.pauseBtn.innerHTML = icon("pause");
      refs.pauseBtn.setAttribute("aria-label", "暂停");
    }
    if (refs.status) refs.status.textContent = "LIVE";
    if (S.timer) window.clearInterval(S.timer);
    S.timer = window.setInterval(updateStats, 200);
    focusInput();
  }

  /* 快捷键动作：暂停按钮与 pause 绑定共用同一套逻辑 */
  function togglePause() {
    if (!S.started) {
      if (cfg && cfg.onToast) cfg.onToast("开始输入后即可暂停");
      return;
    }
    if (S.finished) return;
    if (S.paused) resumeSession();
    else pauseSession();
  }

  function restartSession() {
    resetSession();
    hideStart();
    focusInput();
    if (cfg && cfg.onToast) cfg.onToast("已重新开始");
  }

  function goBack() {
    if (!lesson) return;
    window.location.hash = lesson.backHref || ("#/lesson/" + lesson.id);
  }

  function onVisibilityChange() {
    if (!document.hidden) return;
    if (setting("autoPause", true) !== false && S.started && !S.finished && !S.paused) {
      pauseSession();
    }
  }

  function elapsed() {
    if (!S.started) return 0;
    if (S.finished) return S.finalDuration;
    if (S.paused) return Math.max(0, (S.pausedAt - S.startAt - S.pausedMs) / 1000);
    return Math.max(0, (Date.now() - S.startAt - S.pausedMs) / 1000);
  }

  function calcSpeed() {
    var seconds = elapsed();
    if (seconds < 0.2) return 0;
    var minutes = seconds / 60;
    if (S.mode === "latin") return (S.correctKeystrokes / 5) / minutes;
    if (S.mode === "pinyin") return S.correctKeystrokes / minutes;
    return completedUnits() / minutes;
  }

  function accuracy() {
    if (!S.keystrokes) return 100;
    return (S.correctKeystrokes / S.keystrokes) * 100;
  }

  function updateStats() {
    if (!refs.speed) return;
    var sec = elapsed();
    var speed = calcSpeed();
    var acc = accuracy();
    var done = completedChars();
    var pct = S.totalChars ? (done / S.totalChars) * 100 : 0;
    refs.speed.textContent = S.started ? String(Math.round(speed)) : "0";
    refs.accuracy.textContent = acc.toFixed(1);
    refs.time.textContent = window.APP ? window.APP.formatTime(sec) : String(Math.round(sec)) + "s";
    refs.errors.textContent = String(S.errors);
    if (refs.combo) refs.combo.textContent = String(S.combo);
    if (refs.accuracyBar) refs.accuracyBar.style.width = Math.max(0, Math.min(100, acc)) + "%";
    if (refs.progress) refs.progress.style.width = pct + "%";
    if (refs.count) refs.count.textContent = done + " / " + S.totalChars;
    if (refs.speedUnit) refs.speedUnit.textContent = speedUnit();
    updateLineLabel();
    if (S.started) {
      var slot = Math.floor(sec * 2.5);
      if (slot !== S.sampleSlot) {
        S.sampleSlot = slot;
        S.speedSamples.push(speed);
        if (S.speedSamples.length > 48) S.speedSamples.shift();
        drawSparkline();
      }
    }
  }

  function drawSparkline() {
    if (!refs.sparkline) return;
    var line = refs.sparkline.querySelector("polyline");
    if (!line) return;
    if (S.speedSamples.length < 2) {
      line.setAttribute("points", "");
      return;
    }
    var w = 120;
    var h = 34;
    var pad = 4;
    var max = Math.max.apply(null, S.speedSamples.concat([1]));
    var pts = S.speedSamples.map(function (v, i) {
      var x = pad + (i / (S.speedSamples.length - 1)) * (w - pad * 2);
      var y = h - pad - (v / max) * (h - pad * 2);
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    line.setAttribute("points", pts.join(" "));
  }

  function shakeSheet() {
    if (!refs.sheet) return;
    refs.sheet.classList.remove("is-shaking");
    void refs.sheet.offsetWidth;
    refs.sheet.classList.add("is-shaking");
    window.setTimeout(function () {
      if (refs.sheet) refs.sheet.classList.remove("is-shaking");
    }, 220);
  }

  function popCombo() {
    if (!refs.combo) return;
    refs.combo.classList.remove("is-pop");
    void refs.combo.offsetWidth;
    refs.combo.classList.add("is-pop");
  }

  /* ---------------- input ---------------- */
  function onKeyDown(e) {
    if (!refs) return;
    if (document.getElementById("settings-overlay")) return;
    if (S.counting) return;
    if (document.getElementById("practice-result-overlay")) return;
    if (e.isComposing || e.key === "Process" || e.key === "Unidentified") return;

    var sc = activeShortcuts();

    /* 优先级：返回 > 暂停/继续 > 重新开始 > 跳过开始层 */
    if (shortcutMatches(sc.back, e)) {
      e.preventDefault();
      goBack();
      return;
    }
    if (shortcutMatches(sc.pause, e)) {
      e.preventDefault();
      togglePause();
      return;
    }
    if (shortcutMatches(sc.restart, e)) {
      e.preventDefault();
      restartSession();
      return;
    }
    if (S.paused) return;
    if (S.finished) return;
    if (shortcutMatches(sc.skip, e)) {
      e.preventDefault();
      hideStart();
      focusInput();
      return;
    }

    if (isIme()) return;
    if (e.key === "Tab") {
      /* skip 被改绑后，Tab 仍然不把焦点移出练习区 */
      e.preventDefault();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
      return;
    }
    if (e.key.length !== 1) return;
    e.preventDefault();
    var ch = e.key;
    if (S.mode === "pinyin" || S.mode === "wubi") ch = ch.toLowerCase();
    if (refs.kb && window.KEYBOARD) window.KEYBOARD.flash(refs.kb, e.code, "down");
    hideStart();
    if (!S.started && !S.countdownDone && setting("countdown", false) === true) {
      runCountdown(function () { typeChar(ch, e.code); });
      return;
    }
    typeChar(ch, e.code);
  }

  function onLatinInput() {
    if (!refs || S.finished || S.paused || S.counting || isIme()) return;
    var value = refs.input.value;
    refs.input.value = "";
    if (!value) return;
    Array.from(value).forEach(function (ch) {
      if (S.mode === "pinyin" || S.mode === "wubi") ch = ch.toLowerCase();
      hideStart();
      typeChar(ch, null);
    });
  }

  function blockPaste(e) {
    e.preventDefault();
    if (cfg && cfg.onToast) cfg.onToast("练习模式不支持粘贴，请逐字输入");
  }

  function typeChar(ch, code, options) {
    var opts = options || {};
    if (!refs || S.finished || S.paused || S.counting) return;
    var line = currentLine();
    if (!line) return;
    var expected = line.chars[S.charIndex];
    if (expected == null) return;
    if (!S.started) startClock();
    hideStart();

    var ok = ch === expected;
    S.keystrokes += 1;

    if (!ok && !opts.ime && setting("strict", false) === true) {
      S.errors += 1;
      S.errorMap[expected] = (S.errorMap[expected] || 0) + 1;
      S.combo = 0;
      playErrorTone();
      if (refs.kb && code && window.KEYBOARD) window.KEYBOARD.flash(refs.kb, code, "error");
      shakeSheet();
      updateStats();
      flashHintError(expected);
      updateNextKey();
      return;
    }

    line.typed[S.charIndex] = ch;
    if (ok) {
      S.correctKeystrokes += 1;
      S.combo += 1;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      playTone(720 + Math.min(260, S.combo * 6), 0.018);
      popCombo();
      if (S.combo > 0 && S.combo % 25 === 0 && setting("comboHint", true) !== false && cfg.onToast) {
        cfg.onToast("连击 " + S.combo + " · 保持节奏");
      }
    } else {
      S.errors += 1;
      S.errorMap[expected] = (S.errorMap[expected] || 0) + 1;
      S.combo = 0;
      playErrorTone();
      if (refs.kb && code && window.KEYBOARD) window.KEYBOARD.flash(refs.kb, code, "error");
      shakeSheet();
    }

    S.charIndex += 1;
    if (S.charIndex >= line.text.length) {
      advanceLine();
      return;
    }
    paint();
    updateStats();
    if (ok) updateHint();
    else flashHintError(expected);
    updateNextKey();
  }

  function advanceLine() {
    var line = currentLine();
    if (line) line.done = true;
    if (S.lineIndex >= S.lines.length - 1) {
      finish();
      return;
    }
    S.lineIndex += 1;
    S.charIndex = 0;
    renderText();
    paint();
    updateStats();
    updateHint();
    updateNextKey();
    animateLine();
  }

  function backspace() {
    if (S.finished) return;
    if (S.charIndex > 0) {
      S.charIndex -= 1;
      var line = currentLine();
      if (line) line.typed.length = S.charIndex;
      paint();
      updateStats();
      updateHint();
      updateNextKey();
      return;
    }
    if (S.lineIndex > 0) {
      S.lineIndex -= 1;
      var prev = currentLine();
      S.charIndex = prev ? Math.max(0, prev.text.length - 1) : 0;
      if (prev) prev.typed.length = S.charIndex;
      renderText();
      paint();
      updateStats();
      updateHint();
      updateNextKey();
    }
  }

  function onCompositionStart() {
    S.composing = true;
    S.compositionText = "";
  }

  function onCompositionUpdate(e) {
    S.compositionText = e.data || "";
  }

  function onCompositionEnd() {
    S.composing = false;
    window.setTimeout(function () {
      processImeValue();
    }, 0);
  }

  function onImeInput() {
    if (S.composing) return;
    processImeValue();
  }

  function processImeValue() {
    if (!refs.ime || S.finished || S.paused || S.counting) return;
    var value = refs.ime.value;
    refs.ime.value = "";
    S.compositionText = "";
    if (!value) {
      updateHint();
      return;
    }
    value = value.replace(/\r/g, "");
    var chars = Array.from(value);
    var lastWrong = null;
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch === "\n") continue;
      if (S.finished) break;
      if (!S.started) startClock();
      hideStart();
      var line = currentLine();
      if (!line) break;
      var expected = line.chars[S.charIndex];
      if (expected == null) break;
      var ok = ch === expected;
      line.typed[S.charIndex] = ch;
      S.keystrokes += 1;
      if (ok) {
        S.correctKeystrokes += 1;
        S.combo += 1;
        S.maxCombo = Math.max(S.maxCombo, S.combo);
        playTone(760 + Math.min(240, S.combo * 6), 0.018);
        popCombo();
      } else {
        S.errors += 1;
        S.errorMap[expected] = (S.errorMap[expected] || 0) + 1;
        S.combo = 0;
        lastWrong = expected;
        playErrorTone();
        shakeSheet();
      }
      S.charIndex += 1;
      if (S.charIndex >= line.text.length) {
        advanceLine();
      } else {
        paint();
        updateStats();
      }
    }
    if (!S.finished) {
      if (lastWrong && !S.paused) flashHintError(lastWrong);
      else updateHint();
    }
  }

  function playTone(freq, dur) {
    if (setting("sound", false) !== true) return;
    var vol = setting("volume", 0.6);
    if (vol == null || vol <= 0) return;
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.045 * vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (err) {
      /* 音频不可用时静默 */
    }
  }

  function playErrorTone() {
    if (setting("errorSound", true) === false) return;
    playTone(160, 0.055);
  }

  /* ---------------- next key / hint ---------------- */
  function updateNextKey() {
    if (!refs.kb || !window.KEYBOARD) return;
    if (isIme() || setting("showNextKey", true) === false) {
      window.KEYBOARD.clearStates(refs.kb);
      return;
    }
    var expected = currentExpected();
    if (expected == null) {
      window.KEYBOARD.clearStates(refs.kb);
      return;
    }
    window.KEYBOARD.showNext(refs.kb, expected);
  }

  function renderHintHtml(isWrong) {
    var expected = currentExpected();
    var html = "";
    if (S.finished) {
      return '<span class="hint-finished">完成 · 查看成绩</span>';
    }
    if (isIme()) {
      var iu = unitAt(S.charIndex);
      html = iu && iu.meta
        ? '<b>' + escapeHtml(iu.meta.hanzi || "") + '</b><span>' + escapeHtml(iu.meta.pinyin || "") + "</span>"
        : '<span>输入法</span>';
      html += "<em>输入法</em>";
      if (isWrong) html += "<em>按错了</em>";
      return html;
    }
    if (S.mode === "pinyin") {
      var pu = unitAt(S.charIndex);
      if (pu && pu.meta) {
        html = (pu.meta.hanzi ? '<b>' + escapeHtml(pu.meta.hanzi) + "</b>" : "") +
          '<span>' + escapeHtml(pu.meta.pinyin || pu.text) + "</span>";
      } else {
        html = "<kbd>" + escapeHtml(expected == null ? "—" : expected) + "</kbd>";
      }
      html += "<em>" + (isWrong ? "按错了" : "拼音") + "</em>";
      return html;
    }
    if (S.mode === "wubi") {
      var wu = unitAt(S.charIndex);
      if (wu && wu.meta) {
        html = '<b>' + escapeHtml(wu.meta.hanzi || "—") + "</b>" +
          (S.hideCodes ? "<em>编码已隐藏</em>" : '<span>' + escapeHtml(wu.meta.code.toUpperCase()) + '</span><span>空格</span>');
      } else {
        html = "<kbd>" + escapeHtml(expected == null ? "—" : expected) + "</kbd>";
      }
      if (isWrong) html += "<em>按错了</em>";
      html += '<button class="hint-toggle" type="button" data-practice-action="toggle-code">' + (S.hideCodes ? "显示编码" : "隐藏编码") + "</button>";
      return html;
    }
    var info = expected ? window.KEYBOARD.keyForChar(expected) : null;
    var finger = info && info.key ? window.KEYBOARD.fingers[info.key.finger] : null;
    var label = expected === " " ? "Space" : (expected || "—");
    html = "<kbd>" + escapeHtml(label) + "</kbd>" +
      (finger ? "<span>" + escapeHtml(finger.name) + "</span>" : "") +
      (info && info.shift ? "<em>Shift</em>" : "") +
      (isWrong ? "<em>按错了</em>" : "");
    return html;
  }

  function updateHint() {
    if (!refs.hint) return;
    if (hintTimer) {
      window.clearTimeout(hintTimer);
      hintTimer = null;
    }
    refs.hint.classList.remove("is-error");
    refs.hint.innerHTML = renderHintHtml(false);
  }

  function flashHintError() {
    if (!refs.hint) return;
    if (hintTimer) window.clearTimeout(hintTimer);
    refs.hint.classList.add("is-error");
    refs.hint.innerHTML = renderHintHtml(true);
    hintTimer = window.setTimeout(function () {
      hintTimer = null;
      updateHint();
    }, 1200);
  }

  /* ---------------- finish ---------------- */
  function finish() {
    if (S.finished) return;
    S.finished = true;
    S.finalDuration = Math.max(1, elapsed());
    if (S.timer) window.clearInterval(S.timer);
    S.timer = null;
    if (refs.status) refs.status.textContent = "DONE";
    if (refs.start) refs.start.hidden = true;
    paint();
    updateStats();
    updateHint();
    if (refs.kb && window.KEYBOARD) window.KEYBOARD.clearStates(refs.kb);
    if (refs.input) refs.input.blur();
    if (refs.ime) refs.ime.blur();

    var speed = Math.round(calcSpeed());
    var acc = accuracy();
    var result = {
      speedValue: speed,
      speedLabel: speedUnit(),
      accuracy: acc,
      duration: S.finalDuration,
      errors: S.errors,
      keystrokes: S.keystrokes,
      correctKeystrokes: S.correctKeystrokes,
      modeLabel: modeLabel(),
      errorMap: S.errorMap,
      maxCombo: S.maxCombo,
      weakKeys: Object.keys(S.errorMap)
        .sort(function (a, b) { return S.errorMap[b] - S.errorMap[a]; })
        .slice(0, 4)
    };
    var rec = cfg.onComplete ? cfg.onComplete(result) : null;
    showResult(result, rec);
  }

  function showResult(result, rec) {
    var grade = "C";
    if (result.accuracy >= 99) grade = "A+";
    else if (result.accuracy >= 97) grade = "A";
    else if (result.accuracy >= 93) grade = "B";
    else if (result.accuracy >= 85) grade = "C";
    else grade = "D";

    var message;
    if (result.accuracy >= 98) {
      message = "非常稳。准确率和节奏都在线，可以保持这个速度继续下一课。";
    } else if (result.accuracy >= 95) {
      message = "准确率已经达标。再放慢一点点，把偶尔的错键固定成正确动作。";
    } else if (result.accuracy >= 90) {
      message = "基础不错，但错误仍然分散。先回到本课的重点键，做几组慢速往返。";
    } else {
      message = "先不要追求速度。回到基准位，把每个键的落点重新确认一遍，再开始计时。";
    }
    var isBest = rec && rec.bestAt && Date.now() - rec.bestAt < 3000;
    if (isBest) message += " 这次刷新了本课的最佳成绩。";
    if (result.maxCombo) message += " 本局最高连击 " + result.maxCombo + "。";

    var weak = "";
    if (result.weakKeys.length) {
      weak = '<div class="result-weak"><span>弱键：</span>' +
        result.weakKeys.map(function (ch) {
          var label = ch === " " ? "Space" : ch;
          return '<span class="keycap">' + escapeHtml(label) + "</span>";
        }).join("") + "</div>";
    }

    var next = cfg.getNextLesson ? cfg.getNextLesson() : null;
    var backHref = lesson.backHref || ("#/lesson/" + lesson.id);
    var courseHref = lesson.courseId && lesson.courseId.indexOf("daily") === 0 ? "#/daily" : "#/course/" + lesson.courseId;
    var isDaily = lesson.courseId && lesson.courseId.indexOf("daily") === 0;
    var returnLabel = isDaily ? "返回每日" : "返回课程";
    var secondaryHref = isDaily ? "#/data/typing" : backHref;
    var secondaryLabel = isDaily ? "查看数据" : "返回";
    var overlay = document.createElement("div");
    overlay.className = "result-overlay";
    overlay.id = "practice-result-overlay";
    overlay.dataset.locked = "true";
    overlay.innerHTML =
      '<div class="result-card"><div class="result-head"><div><span class="eyebrow">SESSION COMPLETE</span><h2>' +
      (result.accuracy >= 95 ? "这一课，稳。" : "完成，比完美更重要。") +
      '</h2><p>' + escapeHtml(lesson.title) + " · " + result.modeLabel + "</p></div>" +
      '<div class="result-badge">' + grade + "<small>GRADE</small></div></div>" +
      '<div class="result-stats">' +
      '<div class="result-stat"><span>' + result.speedLabel + "</span><strong>" + result.speedValue + "</strong></div>" +
      '<div class="result-stat"><span>ACCURACY</span><strong>' + result.accuracy.toFixed(1) + "%</strong></div>" +
      '<div class="result-stat"><span>TIME</span><strong>' + (window.APP ? window.APP.formatTime(result.duration) : result.duration + "s") + "</strong></div>" +
      '<div class="result-stat"><span>ERRORS</span><strong>' + result.errors + "</strong></div>" +
      "</div>" +
      '<div class="result-message">' + message + "</div>" + weak +
      '<div class="result-actions"><button class="btn" type="button" data-result="retry">再练一次</button>' +
      (next ? '<a class="btn btn-primary" href="#/lesson/' + next.id + '">下一课 ' + icon("arrow") + "</a>" : '<a class="btn btn-primary" href="' + courseHref + '">' + returnLabel + "</a>") +
      '<a class="btn" href="' + secondaryHref + '">' + secondaryLabel + "</a></div></div>";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) {
      if (e.target.closest('[data-result="retry"]')) {
        overlay.remove();
        resetSession();
        hideStart();
        focusInput();
        return;
      }
      var link = e.target.closest("a");
      if (link) overlay.remove();
    });
    var retry = overlay.querySelector('[data-result="retry"]');
    if (retry) retry.focus();
  }

  /* ---------------- settings live apply ---------------- */
  function flattenTyped() {
    var out = [];
    S.lines.forEach(function (line) {
      for (var i = 0; i < line.chars.length; i++) {
        if (line.typed[i] == null) break;
        out.push(line.typed[i]);
      }
    });
    return out;
  }

  function restorePosition(done) {
    var acc = 0;
    for (var i = 0; i < S.lines.length; i++) {
      var len = S.lines[i].text.length;
      if (done < acc + len) {
        S.lineIndex = i;
        S.charIndex = done - acc;
        return;
      }
      if (done === acc + len) {
        if (i < S.lines.length - 1) {
          S.lineIndex = i + 1;
          S.charIndex = 0;
        } else {
          S.lineIndex = i;
          S.charIndex = len;
        }
        return;
      }
      acc += len;
    }
    S.lineIndex = S.lines.length - 1;
    S.charIndex = S.lines[S.lineIndex] ? S.lines[S.lineIndex].text.length : 0;
  }

  function rebuildPreservingProgress() {
    var done = completedChars();
    var flat = flattenTyped();
    var wasFinished = S.finished;
    buildData(S.mode);
    var target = wasFinished ? Math.min(done, S.totalChars) : Math.min(done, Math.max(0, S.totalChars - 1));
    var pos = 0;
    var remaining = target;
    S.lines.forEach(function (line) {
      for (var i = 0; i < line.chars.length && remaining > 0; i++) {
        line.typed[i] = flat[pos] == null ? line.chars[i] : flat[pos];
        pos += 1;
        remaining -= 1;
      }
    });
    restorePosition(target);
    renderText();
    paint();
    updateStats();
    updateHint();
    updateNextKey();
  }

  function applySettings() {
    if (!root || !cfg) return;
    var s = cfg.settings || {};

    /* 键盘尺寸：宽度/键高交给 CSS，这里只保证 html 属性与设置同步 */
    var keyboardSize = s.keyboardSize || "m";
    if (keyboardSize !== "s" && keyboardSize !== "m" && keyboardSize !== "l") keyboardSize = "m";
    if (document.documentElement.getAttribute("data-keyboard-size") !== keyboardSize) {
      document.documentElement.setAttribute("data-keyboard-size", keyboardSize);
    }

    updatePauseHint();

    if (refs.wrap) {
      refs.wrap.classList.remove("typing-size-s", "typing-size-m", "typing-size-l");
      refs.wrap.classList.add("typing-size-" + (s.typingSize || "m"));
    }
    root.classList.toggle("reduce-motion", s.reduceMotion === true);
    if (refs.keyboard) refs.keyboard.hidden = s.keyboardVisible === false;
    if (refs.kb) refs.kb.classList.toggle("is-colored", s.keyboardColors !== false);
    if (refs.sheet) refs.sheet.classList.toggle("hide-hint", s.showHint === false);

    var hideCodes = s.wubiCodes === false;
    if (hideCodes !== S.hideCodes) {
      S.hideCodes = hideCodes;
    }

    if (S.lines.length && (S.widthKey !== (s.lineWidth || "medium") || S.lengthKey !== (s.practiceLength || "standard"))) {
      rebuildPreservingProgress();
    } else {
      if (s.showNextKey === false) {
        if (refs.kb && window.KEYBOARD) window.KEYBOARD.clearStates(refs.kb);
      } else {
        updateNextKey();
      }
      updateHint();
    }
  }

  /* ---------------- controls ---------------- */
  function onPracticeClick(e) {
    var modeBtn = e.target.closest("[data-practice-mode]");
    if (modeBtn) {
      var mode = modeBtn.dataset.practiceMode;
      if (mode === S.mode) return;
      S.mode = mode;
      setModeUI();
      resetSession();
      return;
    }
    var action = e.target.closest("[data-practice-action]");
    if (!action) return;
    var kind = action.dataset.practiceAction;
    if (kind === "pause") {
      togglePause();
      return;
    }
    if (kind === "resume") {
      resumeSession();
      return;
    }
    if (kind === "settings") {
      pauseSession();
      if (cfg.onOpenSettings) cfg.onOpenSettings();
      else if (window.APP) window.APP.openSettings();
      return;
    }
    if (kind === "restart") {
      restartSession();
      return;
    }
    if (kind === "toggle-code") {
      S.hideCodes = !S.hideCodes;
      updateHint();
      return;
    }
    if (kind === "toggle-keyboard") {
      if (!refs.keyboard) return;
      var collapsed = refs.keyboard.classList.toggle("is-collapsed");
      if (refs.kbToggle) {
        refs.kbToggle.textContent = collapsed ? "展开" : "收起";
        refs.kbToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      }
      return;
    }
  }

  window.PRACTICE = {
    mount: mount,
    destroy: destroy,
    applySettings: applySettings
  };
})();
