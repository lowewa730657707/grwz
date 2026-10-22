/* 68 键键盘：布局、渲染与指法数据 */
(function () {
  var K = function (code, label, finger, w, sub, title) {
    return {
      code: code,
      label: label,
      finger: finger,
      w: w || 1,
      sub: sub || "",
      title: title || label
    };
  };

  /* 5 行 × 16 列网格，共 68 键。
     行内宽度单位为 1u 的倍数（支持 0.25 步进），每行合计 16u。 */
  var ROWS = [
    [
      K("Escape", "Esc", "lp", 1, "", "Escape"),
      K("Digit1", "1", "lp", 1, "!"),
      K("Digit2", "2", "lr", 1, "@"),
      K("Digit3", "3", "lm", 1, "#"),
      K("Digit4", "4", "li", 1, "$"),
      K("Digit5", "5", "li", 1, "%"),
      K("Digit6", "6", "ri", 1, "^"),
      K("Digit7", "7", "ri", 1, "&"),
      K("Digit8", "8", "rm", 1, "*"),
      K("Digit9", "9", "rr", 1, "("),
      K("Digit0", "0", "rp", 1, ")"),
      K("Minus", "-", "rp", 1, "_"),
      K("Equal", "=", "rp", 1, "+"),
      K("Backspace", "Backspace", "rp", 2, "", "Backspace"),
      K("Insert", "Insert", "rp", 1, "", "Insert")
    ],
    [
      K("Tab", "Tab", "lp", 1.5, "", "Tab"),
      K("KeyQ", "Q", "lp", 1),
      K("KeyW", "W", "lr", 1),
      K("KeyE", "E", "lm", 1),
      K("KeyR", "R", "li", 1),
      K("KeyT", "T", "li", 1),
      K("KeyY", "Y", "ri", 1),
      K("KeyU", "U", "ri", 1),
      K("KeyI", "I", "rm", 1),
      K("KeyO", "O", "rr", 1),
      K("KeyP", "P", "rp", 1),
      K("BracketLeft", "[", "rp", 1, "{"),
      K("BracketRight", "]", "rp", 1, "}"),
      K("Backslash", "\\", "rp", 1.5, "|"),
      K("Delete", "Delete", "rp", 1, "", "Delete")
    ],
    [
      K("CapsLock", "Caps", "lp", 1.75, "", "Caps Lock"),
      K("KeyA", "A", "lp", 1),
      K("KeyS", "S", "lr", 1),
      K("KeyD", "D", "lm", 1),
      K("KeyF", "F", "li", 1),
      K("KeyG", "G", "li", 1),
      K("KeyH", "H", "ri", 1),
      K("KeyJ", "J", "ri", 1),
      K("KeyK", "K", "rm", 1),
      K("KeyL", "L", "rr", 1),
      K("Semicolon", ";", "rp", 1, ":"),
      K("Quote", "'", "rp", 1, '"'),
      K("Enter", "Enter", "rp", 2.25, "", "Enter"),
      K("PageUp", "PgUp", "rp", 1, "", "Page Up")
    ],
    [
      K("ShiftLeft", "Shift", "lp", 2.25, "", "Left Shift"),
      K("KeyZ", "Z", "lp", 1),
      K("KeyX", "X", "lr", 1),
      K("KeyC", "C", "lm", 1),
      K("KeyV", "V", "li", 1),
      K("KeyB", "B", "li", 1),
      K("KeyN", "N", "ri", 1),
      K("KeyM", "M", "ri", 1),
      K("Comma", ",", "rm", 1, "<"),
      K("Period", ".", "rr", 1, ">"),
      K("Slash", "/", "rp", 1, "?"),
      K("ShiftRight", "Shift", "rp", 1.75, "", "Right Shift"),
      K("ArrowUp", "↑", "rp", 1, "", "Up Arrow"),
      K("PageDown", "PgDn", "rp", 1, "", "Page Down")
    ],
    [
      K("ControlLeft", "Ctrl", "lp", 1.25, "", "Left Control"),
      K("MetaLeft", "Win", "lp", 1.25, "", "Left Windows"),
      K("AltLeft", "Alt", "lp", 1.25, "", "Left Alt"),
      K("Space", "Space", "th", 6.25, "", "Space"),
      K("AltRight", "Alt", "rp", 1, "", "Right Alt"),
      K("ContextMenu", "⊞", "rp", 1, "", "菜单键"),
      K("ControlRight", "Ctrl", "rp", 1, "", "Right Control"),
      K("ArrowLeft", "←", "rp", 1, "", "Left Arrow"),
      K("ArrowDown", "↓", "rp", 1, "", "Down Arrow"),
      K("ArrowRight", "→", "rp", 1, "", "Right Arrow")
    ]
  ];

  var MODIFIER_CODES = {
    Escape: 1,
    Backspace: 1,
    Insert: 1,
    Delete: 1,
    Tab: 1,
    CapsLock: 1,
    Enter: 1,
    ShiftLeft: 1,
    ShiftRight: 1,
    PageUp: 1,
    PageDown: 1,
    ControlLeft: 1,
    ControlRight: 1,
    AltLeft: 1,
    AltRight: 1,
    MetaLeft: 1,
    Space: 1,
    ContextMenu: 1
  };

  var COLS = 16;

  var FINGERS = {
    lp: { name: "左小指", short: "L5", hand: "左手", color: "var(--f-lp)" },
    lr: { name: "左无名指", short: "L4", hand: "左手", color: "var(--f-lr)" },
    lm: { name: "左中指", short: "L3", hand: "左手", color: "var(--f-lm)" },
    li: { name: "左食指", short: "L2", hand: "左手", color: "var(--f-li)" },
    th: { name: "拇指", short: "T", hand: "双手", color: "var(--f-th)" },
    ri: { name: "右食指", short: "R2", hand: "右手", color: "var(--f-ri)" },
    rm: { name: "右中指", short: "R3", hand: "右手", color: "var(--f-rm)" },
    rr: { name: "右无名指", short: "R4", hand: "右手", color: "var(--f-rr)" },
    rp: { name: "右小指", short: "R5", hand: "右手", color: "var(--f-rp)" }
  };

  var CHAR_TO_CODE = {
    ";": "Semicolon",
    ":": "Semicolon",
    "'": "Quote",
    '"': "Quote",
    ",": "Comma",
    "<": "Comma",
    ".": "Period",
    ">": "Period",
    "/": "Slash",
    "?": "Slash",
    "-": "Minus",
    "_": "Minus",
    "=": "Equal",
    "+": "Equal",
    "[": "BracketLeft",
    "{": "BracketLeft",
    "]": "BracketRight",
    "}": "BracketRight",
    "\\": "Backslash",
    "|": "Backslash",
    "`": "Backquote",
    "~": "Backquote",
    " ": "Space"
  };

  var SHIFT_CHARS = "~!@#$%^&*()_+{}|:\"<>?";
  var LETTERS = {};

  ROWS.forEach(function (row, ri) {
    var start = 1;
    row.forEach(function (key, ki) {
      key.row = ri + 1;
      key.col = ki;
      key.start = start;
      start += key.w;
      if (/^Key[A-Z]$/.test(key.code)) {
        LETTERS[key.code.slice(3).toLowerCase()] = key;
      }
    });
  });

  var FINGER_ORDER = ["lp", "lr", "lm", "li", "th", "ri", "rm", "rr", "rp"];

  function keyForChar(ch) {
    if (ch == null || ch === "") return null;
    if (ch === "\n") return { key: null, shift: false };
    if (/[a-z]/i.test(ch)) {
      var letter = LETTERS[ch.toLowerCase()];
      if (!letter) return null;
      return {
        key: letter,
        shift: /[A-Z]/.test(ch),
        char: ch
      };
    }
    if (/[0-9]/.test(ch)) {
      return {
        key: byCode("Digit" + ch),
        shift: false,
        char: ch
      };
    }
    var shiftedDigits = {
      "!": "1", "@": "2", "#": "3", "$": "4", "%": "5",
      "^": "6", "&": "7", "*": "8", "(": "9", ")": "0"
    };
    if (shiftedDigits[ch]) {
      return {
        key: byCode("Digit" + shiftedDigits[ch]),
        shift: true,
        char: ch
      };
    }
    var code = CHAR_TO_CODE[ch];
    if (!code) return null;
    var k = byCode(code);
    if (!k) return { key: null, shift: false, char: ch };
    return {
      key: k,
      shift: SHIFT_CHARS.indexOf(ch) >= 0,
      char: ch
    };
  }

  function byCode(code) {
    for (var i = 0; i < ROWS.length; i++) {
      for (var j = 0; j < ROWS[i].length; j++) {
        if (ROWS[i][j].code === code) return ROWS[i][j];
      }
    }
    return null;
  }

  function shiftKeyFor(key) {
    if (!key) return null;
    if (key.finger.indexOf("l") === 0) return byCode("ShiftRight");
    if (key.finger.indexOf("r") === 0) return byCode("ShiftLeft");
    return byCode("ShiftLeft");
  }

  function render(opts) {
    opts = opts || {};
    var kb = document.createElement("div");
    kb.className = "kb";
    if (opts.mini) kb.classList.add("is-mini");
    if (opts.colored) kb.classList.add("is-colored");
    if (opts.id) kb.id = opts.id;
    kb.setAttribute("role", "group");
    kb.setAttribute("aria-label", "68 键键盘，5 行 16 列");
    kb.style.setProperty("--kb-cols", String(COLS));

    ROWS.forEach(function (row) {
      var rowEl = document.createElement("div");
      rowEl.className = "kb-row";

      row.forEach(function (key) {
        var el = document.createElement(opts.interactive ? "button" : "div");
        if (opts.interactive) {
          el.type = "button";
          el.setAttribute(
            "aria-label",
            key.title + "，" + FINGERS[key.finger].name + "负责"
          );
        }
        el.className = "kb-key";
        if (MODIFIER_CODES[key.code]) el.classList.add("kb-key--modifier");
        if (key.code === "KeyF" || key.code === "KeyJ") {
          el.classList.add("kb-key--home");
        }
        if (opts.interactive) el.classList.add("kb-key--interactive");
        el.dataset.code = key.code;
        el.dataset.finger = key.finger;
        el.dataset.w = String(key.w);
        el.dataset.label = key.label;
        el.dataset.sub = key.sub || "";
        el.style.setProperty("--w", String(key.w));
        el.style.setProperty("--key-finger", FINGERS[key.finger].color);

        var label = document.createElement("span");
        label.className = "label";
        label.textContent = key.label;
        el.appendChild(label);

        if (key.sub) {
          var sub = document.createElement("span");
          sub.className = "sub";
          sub.textContent = key.sub;
          el.appendChild(sub);
        }

        rowEl.appendChild(el);
      });

      kb.appendChild(rowEl);
    });

    return kb;
  }

  function keyElement(kb, code) {
    return kb ? kb.querySelector('[data-code="' + code + '"]') : null;
  }

  function clearStates(kb) {
    if (!kb) return;
    kb.querySelectorAll(".is-next, .is-next-shift, .is-finger").forEach(function (el) {
      el.classList.remove("is-next", "is-next-shift", "is-finger");
    });
  }

  function showNext(kb, ch) {
    clearStates(kb);
    var info = keyForChar(ch);
    if (!info || !info.key) return null;
    var el = keyElement(kb, info.key.code);
    if (el) el.classList.add("is-next");
    if (info.shift) {
      var sk = shiftKeyFor(info.key);
      var sel = sk ? keyElement(kb, sk.code) : null;
      if (sel) sel.classList.add("is-next-shift");
    }
    return info;
  }

  function flash(kb, code, type) {
    var el = keyElement(kb, code);
    if (!el) return;
    var cls = type === "error" ? "is-error" : type === "down" ? "is-down" : "is-pressed";
    el.classList.add(cls);
    setTimeout(function () {
      el.classList.remove(cls);
    }, type === "error" ? 260 : 110);
  }

  function makeLegend(className) {
    var wrap = document.createElement("div");
    wrap.className = className || "kb-legend";
    FINGER_ORDER.forEach(function (id) {
      var span = document.createElement("span");
      var i = document.createElement("i");
      i.style.setProperty("--fc", FINGERS[id].color);
      span.appendChild(i);
      span.appendChild(document.createTextNode(FINGERS[id].name));
      wrap.appendChild(span);
    });
    return wrap;
  }

  window.KEYBOARD = {
    rows: ROWS,
    cols: COLS,
    fingers: FINGERS,
    fingerOrder: FINGER_ORDER,
    render: render,
    keyForChar: keyForChar,
    shiftKeyFor: shiftKeyFor,
    keyElement: keyElement,
    showNext: showNext,
    clearStates: clearStates,
    flash: flash,
    byCode: byCode,
    makeLegend: makeLegend,
    count: ROWS.reduce(function (n, row) {
      return n + row.length;
    }, 0)
  };
})();
