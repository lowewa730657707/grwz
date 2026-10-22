/* 课程扩展：单键 / 单指 / 声韵母 / 字根逐键课程 */
(function () {
  "use strict";

  /* =========================================================
     英文：31 节单键课
     ========================================================= */
  var EN_KEYS = [
    { k: "A", finger: "左小指", anchor: "A", row: "基准排", words: ["a", "an", "and", "are", "as", "at", "have", "make", "take", "calm"], sentence: "a calm hand types accurate words" },
    { k: "S", finger: "左无名指", anchor: "S", row: "基准排", words: ["is", "as", "so", "us", "see", "set", "sun", "slow", "small", "steps"], sentence: "small steps build steady speed" },
    { k: "D", finger: "左中指", anchor: "D", row: "基准排", words: ["do", "day", "did", "add", "hand", "good", "need", "word", "mind", "steady"], sentence: "a good day starts with a steady hand" },
    { k: "F", finger: "左食指", anchor: "F", row: "基准排", words: ["if", "of", "for", "off", "find", "first", "after", "life", "focus", "flow"], sentence: "focus on the feel of each key" },
    { k: "J", finger: "右食指", anchor: "J", row: "基准排", words: ["just", "job", "join", "jump", "major", "enjoy", "judge", "jazz", "object", "project"], sentence: "just join the keys in a calm flow" },
    { k: "K", finger: "右中指", anchor: "K", row: "基准排", words: ["key", "kind", "keep", "work", "take", "look", "like", "ask", "make", "keyboard"], sentence: "keep your hands close to the keyboard" },
    { k: "L", finger: "右无名指", anchor: "L", row: "基准排", words: ["all", "will", "well", "like", "look", "line", "place", "slow", "level", "little"], sentence: "a little practice every day will help" },
    { k: ";", finger: "右小指", anchor: ";", row: "基准排", words: ["first; second; third", "ready; set; go", "yes; no; maybe", "one; two; three", "wait; listen; learn"], sentence: "slow; steady; accurate; repeat" },
    { k: "G", finger: "左食指", anchor: "F", row: "基准排", words: ["go", "get", "big", "give", "again", "game", "good", "grow", "great", "gently"], sentence: "go gently and give each key time" },
    { k: "H", finger: "右食指", anchor: "J", row: "基准排", words: ["he", "the", "she", "his", "her", "have", "home", "help", "hand", "here"], sentence: "he keeps his hands at home" },
    { k: "Q", finger: "左小指", anchor: "A", row: "上排", words: ["quick", "quiet", "quite", "question", "quality", "quote", "queen", "square", "equal", "quilt"], sentence: "a quiet hand makes a quick key" },
    { k: "W", finger: "左无名指", anchor: "S", row: "上排", words: ["we", "was", "with", "what", "when", "will", "work", "word", "write", "window"], sentence: "we write words with a steady will" },
    { k: "E", finger: "左中指", anchor: "D", row: "上排", words: ["be", "he", "we", "see", "the", "her", "get", "every", "even", "energy"], sentence: "every key needs a little energy" },
    { k: "R", finger: "左食指", anchor: "F", row: "上排", words: ["are", "for", "or", "read", "right", "work", "try", "first", "ready", "rhythm"], sentence: "read the line and keep the rhythm" },
    { k: "T", finger: "左食指", anchor: "F", row: "上排", words: ["to", "it", "at", "the", "that", "this", "time", "not", "take", "type"], sentence: "take time to type the right key" },
    { k: "Y", finger: "右食指", anchor: "J", row: "上排", words: ["you", "your", "yes", "day", "way", "why", "type", "easy", "slowly", "rhythm"], sentence: "you can type with an easy rhythm" },
    { k: "U", finger: "右食指", anchor: "J", row: "上排", words: ["you", "use", "up", "us", "but", "run", "full", "true", "study", "focus"], sentence: "use a full and steady motion" },
    { k: "I", finger: "右中指", anchor: "K", row: "上排", words: ["is", "in", "it", "if", "this", "with", "time", "will", "find", "mind"], sentence: "keep your mind in the present line" },
    { k: "O", finger: "右无名指", anchor: "L", row: "上排", words: ["to", "of", "on", "or", "do", "go", "for", "you", "only", "open"], sentence: "open the page and go slowly" },
    { k: "P", finger: "右小指", anchor: ";", row: "上排", words: ["up", "put", "play", "people", "help", "open", "type", "pace", "space", "practice"], sentence: "practice with purpose and pace" },
    { k: "Z", finger: "左小指", anchor: "A", row: "下排", words: ["zero", "zone", "size", "lazy", "puzzle", "zebra", "amaze", "frozen", "dozen", "zipper"], sentence: "zero in on the zone of the key" },
    { k: "X", finger: "左无名指", anchor: "S", row: "下排", words: ["box", "next", "text", "extra", "exit", "relax", "exact", "index", "expand", "mix"], sentence: "the next text can relax your mind" },
    { k: "C", finger: "左中指", anchor: "D", row: "下排", words: ["can", "come", "call", "back", "check", "click", "clear", "calm", "cover", "focus"], sentence: "check each key and keep it clear" },
    { k: "V", finger: "左食指", anchor: "F", row: "下排", words: ["very", "have", "give", "live", "over", "view", "save", "move", "value", "level"], sentence: "move with care and save the value" },
    { k: "B", finger: "左食指", anchor: "F", row: "下排", words: ["be", "by", "but", "back", "big", "book", "build", "best", "about", "number"], sentence: "build the best habit you can" },
    { k: "N", finger: "右食指", anchor: "J", row: "下排", words: ["in", "on", "and", "no", "not", "new", "next", "name", "never", "number"], sentence: "never rush the next new key" },
    { k: "M", finger: "右食指", anchor: "J", row: "下排", words: ["am", "me", "my", "make", "time", "more", "small", "mind", "make", "calm"], sentence: "make more time for a calm mind" },
    { k: ",", finger: "右中指", anchor: "K", row: "下排", words: ["one, two, three", "ready, set, go", "slow, calm, steady", "read, type, check", "first, second, third"], sentence: "slow, steady, accurate, repeat" },
    { k: ".", finger: "右无名指", anchor: "L", row: "下排", words: ["This is a test.", "Keep it steady.", "Type with care.", "Take a breath.", "Stay with the line."], sentence: "Type with care. Keep the rhythm. Stay calm." },
    { k: "/", finger: "右小指", anchor: ";", row: "下排", words: ["and/or", "a/b", "1/2", "yes/no", "read/write", "input/output", "on/off", "up/down"], sentence: "read/write and/or input/output" }
  ];

  var EN_META = {
    A: { home: true, path: "A 是左小指的基准键，手指不需要离开它就能完成击键。" },
    S: { home: true, path: "S 是左无名指的基准键，指尖落在键帽中央，不压到 A 或 D。" },
    D: { home: true, path: "D 是左中指的基准键，击键时只让中指抬起，手腕保持不动。" },
    F: { home: true, path: "F 是左食指的基准键，键帽上的凸起就是定位点。" },
    J: { home: true, path: "J 是右食指的基准键，先摸到凸起，再开始任何练习。" },
    K: { home: true, path: "K 是右中指的基准键，与 J 之间保持一个自然指距。" },
    L: { home: true, path: "L 是右无名指的基准键，小指留在分号上，不要跟着抬起。" },
    ";": { home: true, path: "分号是右小指的基准键。它常被忽视，却决定右手能否稳定回位。" },
    G: { path: "G 在 F 的右侧。左食指从 F 横向伸出，其他手指尽量留在基准位。" },
    H: { path: "H 在 J 的左侧。右食指从 J 横向伸出，击键后凭凸起回到 J。" },
    Q: { path: "Q 在 A 的左上方。左小指向上、向左伸展，手腕不要跟着抬起。" },
    W: { path: "W 在 S 的左上方。左无名指向上伸展，指尖保持弯曲。" },
    E: { path: "E 在 D 的左上方。左中指向上伸展，手掌保持稳定。" },
    R: { path: "R 在 F 的左上方。左食指向左上够键，回位时找回 F 的凸起。" },
    T: { path: "T 在 F 的右上方。左食指向右上够键，与 R 形成两条斜线。" },
    Y: { path: "Y 在 J 的左上方。右食指向左上够键，不要带动整只手。" },
    U: { path: "U 在 J 的右上方。右食指向右上够键，动作幅度尽量小。" },
    I: { path: "I 在 K 的左上方。右中指向上伸展，其他手指留在基准位。" },
    O: { path: "O 在 L 的左上方。右无名指向上够键，小指不要翘起。" },
    P: { path: "P 在分号的左上方。右小指向上伸展，这是右手最远的上排键之一。" },
    Z: { path: "Z 在 A 的下方。左小指向下弯，掌根保持稳定。" },
    X: { path: "X 在 S 的下方。左无名指向下弯，注意不要用中指代按。" },
    C: { path: "C 在 D 的下方。左中指向下弯，击键后立即回位。" },
    V: { path: "V 在 F 的下方。左食指向下够键，手腕不要向右扭。" },
    B: { path: "B 在 F 的右下方，也靠近 G。左食指斜向下伸展，是下排最需要控制的一键。" },
    N: { path: "N 在 J 的左下方。右食指向左下够键，与 M 形成两条斜线。" },
    M: { path: "M 在 J 的右下方。右食指向右下够键，击键后回到 J。" },
    ",": { path: "逗号在 K 的下方。右中指向下弯，不要用食指横扫。" },
    ".": { path: "句号在 L 的下方。右无名指向下弯，小指保持放松。" },
    "/": { path: "斜杠在分号的下方。右小指向下弯，这是右手最远的下排键。" },
    Space: { path: "空格由拇指负责。手掌不动，只让拇指轻轻下压。" }
  };

  var EN_SLUG = { ";": "semicolon", ",": "comma", ".": "period", "/": "slash", "Space": "space" };

  function enLesson(meta) {
    var key = meta.k;
    var display = key === " " ? "Space" : key;
    var titleKey = display;
    var isSpace = key === "Space";
    var k = isSpace ? " " : key;
    var finger = isSpace ? "拇指" : meta.finger;
    var detail = EN_META[isSpace ? "Space" : key] || {};
    var path = detail.path || "";
    var words = meta.words || [];
    var drills;
    if (isSpace) {
      titleKey = "Space";
      drills = [
        "the cat sat on the mat",
        "a calm hand types with space",
        "keep one steady rhythm today",
        "tap the space with your thumb"
      ];
    } else {
      var anchor = (meta.anchor || key).toLowerCase();
      var lk = key.toLowerCase();
      drills = [
        lk + " " + lk + " " + lk + " " + lk + lk + lk + " " + lk + lk,
        anchor + lk + " " + lk + anchor + " " + anchor + lk + anchor,
        words.join(" ")
      ];
      if (/^[a-z]$/.test(key)) {
        drills.push(words.slice(0, 5).join(" "));
        drills.push(words.slice(5).join(" "));
        drills.push("keep " + anchor + " and " + lk + " in a steady rhythm");
      }
      drills.push(meta.sentence);
    }
    var slug = EN_SLUG[key] || key.toLowerCase();
    var id = "en-k-" + slug;
    var common = isSpace
      ? "用食指或整只手压空格；按得太重；手掌跟着下沉。"
      : "用相邻手指代按；击键时手腕抬起；按完不回基准位；连续击键时整只手跟着移动。";
    return {
      id: id,
      title: isSpace ? "空格键 · 拇指与节奏" : "单键 " + titleKey + " · " + finger,
      en: isSpace ? "The Space Key" : "Single Key " + titleKey,
      summary: isSpace ? "用拇指轻敲空格，建立词与词之间的呼吸。" : "只练 " + titleKey + " 一个键：位置、负责手指、动作路线和常见错误。",
      minutes: 9,
      difficulty: key === "G" || key === "H" || key === "B" ? 2 : 1,
      focus: [display],
      goals: [
        "不低头找到 " + titleKey + " 并击键",
        "击键后回到正确的基准位",
        "把 " + titleKey + " 放进单词和句子中保持稳定"
      ],
      sections: [
        {
          title: titleKey + " 在哪里",
          html: "<p><code>" + (isSpace ? "Space" : display) + "</code> 位于" + (isSpace ? "底排中央，占据四个键位宽度" : meta.row) + "，由<strong>" + finger + "</strong>负责。" + (isSpace ? "空格是英文词与词之间的呼吸，也是最容易被忽略的节奏点。" : "基准位是 <code>" + (meta.anchor || key) + "</code>，每次击键都从那里出发，再回到那里。") + "</p>"
        },
        {
          title: "动作路线",
          html: "<p>" + path + "</p><ul><li>只让负责的手指移动，其他手指尽量贴着基准位。</li><li>手指自然弯曲，用指腹前部触键，不用指甲敲。</li><li>触底即回，不在键帽上停留；回位比击键本身更重要。</li></ul>"
        },
        {
          title: "常见错误",
          html: "<p>" + common + "</p><p>如果连续三次按错，先停下来，空手做一次从基准位到目标键再返回的动作，然后重新开始。不要用更快的重复掩盖错误。</p>"
        },
        {
          title: "放进单词里",
          html: "<p>单个键练熟后，要回到真实语境。下面的词都包含 <code>" + (isSpace ? "空格" : display) + "</code>，先慢速读一遍，再一组一组输入。</p><p class=\"mono\">" + words.join(" · ") + "</p>"
        }
      ],
      type: "latin",
      drills: drills
    };
  }

  var enHome = ["A", "S", "D", "F", "J", "K", "L", ";"];
  var enExtend = ["G", "H"];
  var enTop = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  var enBottom = ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"];

  function pickKeys(keys) {
    return keys.map(function (k) {
      var found = EN_KEYS.filter(function (m) { return m.k === k; })[0];
      return enLesson(found);
    });
  }

  addChapters("english", [
    { title: "基准键单键", lead: "一次只学一个键，先把回家路线练成条件反射。", lessons: pickKeys(enHome) },
    { title: "食指横向延伸", lead: "G 与 H 是基准排里最容易让整只手移动的两个键。", lessons: pickKeys(enExtend) },
    { title: "上排单键", lead: "向上够键，手腕保持低位；一次只增加一个键。", lessons: pickKeys(enTop) },
    { title: "下排单键", lead: "向下弯指，掌根稳定；把每个下排键单独练熟。", lessons: pickKeys(enBottom) },
    { title: "空格与节奏", lead: "空格不是附属动作，它决定整句话的呼吸。", lessons: [enLesson({ k: "Space", finger: "拇指", words: [], sentence: "" })] }
  ], 1);

  /* ---- 双键 / 三键 / 四键组合 ---- */
  function comboLesson(id, title, groups, typeLabel) {
    var clean = groups.map(function (g) { return g.toLowerCase(); });
    var keys = [];
    clean.join("").split("").forEach(function (ch) {
      if (keys.indexOf(ch) < 0) keys.push(ch);
    });
    var drills = [
      clean.join(" ") + " " + clean.join(" "),
      clean.map(function (g) { return g + g; }).join(" "),
      clean.join(" ") + " " + clean.slice().reverse().join(" "),
      clean.slice(0, 5).join(" ") + " " + clean.slice(5).join(" "),
      "keep the " + typeLabel + " groups smooth and even"
    ];
    return {
      id: id,
      title: title,
      en: "Key Groups",
      summary: "练 " + typeLabel + "：把 " + clean.slice(0, 4).join(" / ") + " 连成一个动作。",
      minutes: 9,
      difficulty: typeLabel === "四键组合" ? 4 : typeLabel === "三键组合" ? 3 : 2,
      focus: keys.slice(0, 8),
      goals: [
        "把一组键当成一个节奏单元",
        "组内不漏键、不抢键",
        "每组结束后回到基准位"
      ],
      sections: [
        { title: "为什么要练组合", html: "<p>单键练的是落点，" + typeLabel + "练的是连接。真实输入里，字母很少孤立出现；把常见的两键、三键、四键连成一个动作，能明显减少犹豫。</p>" },
        { title: "本课组合", html: "<p>本课的组是：<code>" + clean.join(" / ") + "</code>。先把每一组拆开读清楚，再连起来。每组只占一个节拍，组与组之间允许一个很短的停顿。</p>" },
        { title: "击键路线", html: "<p>第一键落下后不要急着抬整只手，让后面的手指按顺序完成。需要换手时，另一只手提前准备好。每组结束后，所有手指回到基准位，再进入下一组。</p><ul><li>慢速：每组单独打三遍。</li><li>中速：组与组连起来。</li><li>快速：保持准确率，不追求爆发。</li></ul>" },
        { title: "常见错误", html: "<p>组内抢拍、漏掉最后一键、为了连贯而用错手指，是最常见的三个问题。发现错误时，回到对应的单键，再把组合重新连一次。</p>" }
      ],
      type: "latin",
      drills: drills
    };
  }

  addChapters("english", [
    {
      title: "双键组合",
      lead: "相邻键、跨手键、上下排键。先把两个键连成一个动作。",
      lessons: [
        comboLesson("en-c-2-home", "双键组合 · 基准排相邻", ["as", "sd", "df", "jk", "kl", "l;", "sa", "ds", "fd", "kj", "lk", ";l"], "双键组合"),
        comboLesson("en-c-2-cross", "双键组合 · 左右手交替", ["aj", "sk", "dl", "f;", "ja", "ks", "ld", ";f", "af", "js", "dk", "l;"], "双键组合"),
        comboLesson("en-c-2-top", "双键组合 · 上排", ["qw", "we", "er", "rt", "ty", "yu", "ui", "io", "op", "po", "iu", "uy"], "双键组合"),
        comboLesson("en-c-2-bottom", "双键组合 · 下排", ["zx", "xc", "cv", "vb", "bn", "nm", "m,", ".,", "/;", "az", "sx", "dc"], "双键组合"),
        comboLesson("en-c-2-mix", "双键组合 · 上下混排", ["fr", "gt", "hy", "ju", "ki", "lo", "p;", "az", "sx", "dc", "fv", "gb"], "双键组合"),
        comboLesson("en-c-2-punct", "双键组合 · 标点", ["a,", "s.", "d/", "f;", "j,", "k.", "l/", ";a"], "双键组合")
      ]
    },
    {
      title: "三键组合",
      lead: "三键是一口气的最小单位，练习横向、纵向和跨手连接。",
      lessons: [
        comboLesson("en-c-3-home", "三键组合 · 基准排", ["asd", "sdf", "dfg", "jkl", "kl;", ";lk", "fgh", "hjk"], "三键组合"),
        comboLesson("en-c-3-top", "三键组合 · 上排", ["qwe", "wer", "ert", "rty", "tyu", "yui", "uio", "iop"], "三键组合"),
        comboLesson("en-c-3-bottom", "三键组合 · 下排", ["zxc", "xcv", "cvb", "vbn", "bnm", "nm,", "m,.", ".,/"], "三键组合"),
        comboLesson("en-c-3-vertical", "三键组合 · 纵向列", ["qaz", "wsx", "edc", "rfv", "tgb", "yhn", "ujm", "ik,", "ol.", ";p/"], "三键组合"),
        comboLesson("en-c-3-cross", "三键组合 · 跨手", ["ask", "dfl", "f;j", "ghj", "jaf", "ksk", "dlf", "f;j"], "三键组合")
      ]
    },
    {
      title: "四键组合",
      lead: "四个键连成一个词块，训练稳定的连续击键。",
      lessons: [
        comboLesson("en-c-4-home", "四键组合 · 基准排", ["asdf", "jkl;", "fdsa", ";lkj", "sdfg", "hjkl"], "四键组合"),
        comboLesson("en-c-4-top", "四键组合 · 上排", ["qwer", "tyui", "rewq", "iuyt", "wert", "yuio"], "四键组合"),
        comboLesson("en-c-4-bottom", "四键组合 · 下排", ["zxcv", "bnm,", "vcxz", ",mnb", "xcvb", "nm,."], "四键组合"),
        comboLesson("en-c-4-cross", "四键组合 · 左右手", ["asjk", "sdfk", "dfjl", "fgh;", "qazw", "wsxe"], "四键组合"),
        comboLesson("en-c-4-mix", "四键组合 · 全键混合", ["qazwsx", "edcrfv", "tgbyhn", "ujmik,", "plok", "mnbv"], "四键组合")
      ]
    }
  ], 6);

  var english = getCourse("english");
  english.duration = "约 12 小时";
  english.level = "零基础 → 单键 → 组合 → 段落";

  /* =========================================================
     盲打：10 节单指专项
     ========================================================= */
  var TOUCH_GROUPS = [
    { id: "lp", finger: "左小指", keys: ["A", "Q", "Z"], comp: "用无名指或中指代按", detail: "小指力量最弱，最容易在够 Q / Z 时带动整只手。练习时把无名指轻轻按在 S 上，确认它没有跟着动。" },
    { id: "lr", finger: "左无名指", keys: ["S", "W", "X"], comp: "用中指或小指代按", detail: "无名指独立性差，向上到 W、向下到 X 时容易整只手倾斜。保持 A、D 贴键，只让无名指走。" },
    { id: "lm", finger: "左中指", keys: ["D", "E", "C"], comp: "用食指或无名指代按", detail: "中指力量足，容易按得太重。用轻触键，击键后立刻放松，不要让手腕上下跳。" },
    { id: "li", finger: "左食指", keys: ["F", "G", "R", "T", "V", "B"], comp: "用手掌平移代替手指伸展", detail: "左食指负责六列，是左手最忙的手指。G/R/T 向上、V/B 向下，每条路线都要能回到 F 的凸起。" },
    { id: "ri", finger: "右食指", keys: ["J", "H", "Y", "U", "N", "M"], comp: "用手腕带动整只手", detail: "右食指同样覆盖六列。H 与 J 的横移、Y/U 的上伸、N/M 的下伸，都要在手掌不移动的前提下完成。" },
    { id: "rm", finger: "右中指", keys: ["K", "I", ","], comp: "用食指代按逗号", detail: "右中指守在 K 上，I 在上、逗号在下。击键时只动中指，不要让整只手向中间挤。" },
    { id: "rr", finger: "右无名指", keys: ["L", "O", "."], comp: "用小指代按句号", detail: "右无名指要独立完成 O 与句号。小指留在分号上，不要翘起，也不要帮忙。" },
    { id: "rp", finger: "右小指", keys: [";", "P", "/"], comp: "用无名指代按 P 或斜杠", detail: "右小指负责的键跨度最大。把它单独练到能上到 P、下到 /，再回到分号，不要用整只手去带。" },
    { id: "th", finger: "拇指", keys: ["Space"], comp: "用食指按空格或整只手压下去", detail: "拇指只负责空格。手掌保持稳定，拇指轻压即可。连续空格也要一下一下地敲，不要按住不放。" },
    { id: "shift", finger: "双手小指", keys: ["Shift"], comp: "用同一只手按 Shift 和字母", detail: "左手区的大写用右 Shift，右手区的大写用左 Shift。Shift 是临时动作，敲完就松开，不要一直压住。" }
  ];

  var fingers = { lp: "左小指", lr: "左无名指", lm: "左中指", li: "左食指", ri: "右食指", rm: "右中指", rr: "右无名指", rp: "右小指", th: "拇指" };

  var touchLessons = TOUCH_GROUPS.map(function (g) {
    var keys = g.keys;
    var isShift = g.id === "shift";
    var drills;
    if (g.id === "th") {
      drills = ["the cat sat on the mat", "one two three four five", "type with a steady rhythm", "keep the space light and calm"];
    } else if (isShift) {
      drills = ["Hello World", "Type Shift A", "Accurate First", "Keep Calm", "Right Hand Left Shift"];
    } else {
      drills = [
        keys.join(" ").toLowerCase() + " " + keys.join("").toLowerCase(),
        keys.join("").toLowerCase() + " " + keys.slice().reverse().join("").toLowerCase(),
        "asdf jkl; " + keys.join("").toLowerCase(),
        "keep the " + g.finger + " independent"
      ];
    }
    return {
      id: "tt-f-" + g.id,
      title: "单指专项 · " + g.finger,
      en: "Finger Focus " + g.id.toUpperCase(),
      summary: "只练" + g.finger + "负责的键，建立独立发力和稳定回位。",
      minutes: 10,
      difficulty: g.id === "shift" ? 3 : 2,
      focus: isShift ? ["Shift"] : keys,
      goals: [
        "只用" + g.finger + "完成击键",
        "击键后回到基准位",
        "识别并停止相邻手指的代偿"
      ],
      sections: [
        { title: "负责区域", html: "<p>" + g.finger + "负责 <code>" + keys.join(" / ") + "</code>。练习时把其他手指放在基准位，像五个小锚点，只让这一根手指移动。</p>" },
        { title: "发力与回位", html: "<p>指尖立起，用指腹前部触键。动作幅度保持在一到两厘米，触底即回。每敲完一次，都确认手指回到了基准位，再进入下一次。</p>" },
        { title: "常见代偿", html: "<p>" + g.detail + "</p><p>常见错误是" + g.comp + "。如果总是出现，先降低速度，把另一只手轻轻按在桌面或相邻手指上，确认目标手指能独立完成动作。</p>" },
        { title: "专项练习", html: "<p>先做纵向与横向的组合，再进入词和短句。每个组合都慢速重复，直到动作不再需要思考。</p>" }
      ],
      type: "latin",
      drills: drills
    };
  });

  addChapters("touch", [
    { title: "单指专项", lead: "把十根手指拆开练：一根手指、一组键、一条回位路线。", lessons: touchLessons }
  ], 1);

  addChapters("touch", [
    {
      title: "组合连击",
      lead: "从两键交替到四键词块，练习连续击键和回位。",
      lessons: [
        comboLesson("tt-c-2", "双键组合 · 左右交替", ["as", "df", "jk", "l;", "aj", "sk", "dl", "f;"], "双键组合"),
        comboLesson("tt-c-3", "三键组合 · 横向连击", ["asd", "jkl", "qwe", "uio", "zxc", "bnm"], "三键组合"),
        comboLesson("tt-c-4", "四键组合 · 基准词块", ["asdf", "jkl;", "qwer", "tyui", "zxcv", "bnm,"], "四键组合"),
        comboLesson("tt-c-cross", "组合连击 · 跨手节奏", ["qa", "ws", "ed", "rf", "tg", "yh", "uj", "ik"], "双键组合")
      ]
    }
  ], 2);
  getCourse("touch").duration = "约 7 小时";

  /* =========================================================
     中文：7 节声母 + 7 节韵母
     ========================================================= */
  var INITIAL_GROUPS = [
    { id: "bpmf", title: "声母 b p m f", keys: "B P M F", note: "双唇音与唇齿音。b/p 送气与否，m 是鼻音，f 用上齿轻触下唇。", items: [
      { hanzi: "爸", pinyin: "ba" }, { hanzi: "妈", pinyin: "ma" }, { hanzi: "怕", pinyin: "pa" }, { hanzi: "发", pinyin: "fa" },
      { hanzi: "白", pinyin: "bai" }, { hanzi: "跑", pinyin: "pao" }, { hanzi: "门", pinyin: "men" }, { hanzi: "飞", pinyin: "fei" },
      { hanzi: "朋友", pinyin: "peng you" }, { hanzi: "办法", pinyin: "ban fa" }, { hanzi: "帮忙", pinyin: "bang mang" }, { hanzi: "批评", pinyin: "pi ping" }
    ] },
    { id: "dtnl", title: "声母 d t n l", keys: "D T N L", note: "舌尖中音。d/t 是爆破音，n 是鼻音，l 是边音；n/l 不分是常见难点。", items: [
      { hanzi: "大", pinyin: "da" }, { hanzi: "他", pinyin: "ta" }, { hanzi: "你", pinyin: "ni" }, { hanzi: "来", pinyin: "lai" },
      { hanzi: "地", pinyin: "di" }, { hanzi: "天", pinyin: "tian" }, { hanzi: "年", pinyin: "nian" }, { hanzi: "老", pinyin: "lao" },
      { hanzi: "电话", pinyin: "dian hua" }, { hanzi: "努力", pinyin: "nu li" }, { hanzi: "老师", pinyin: "lao shi" }, { hanzi: "电脑", pinyin: "dian nao" }
    ] },
    { id: "gkh", title: "声母 g k h", keys: "G K H", note: "舌根音。g/k 送气对立，h 是摩擦音。输入时注意 h 不要漏掉。", items: [
      { hanzi: "歌", pinyin: "ge" }, { hanzi: "看", pinyin: "kan" }, { hanzi: "好", pinyin: "hao" }, { hanzi: "国", pinyin: "guo" },
      { hanzi: "开", pinyin: "kai" }, { hanzi: "和", pinyin: "he" }, { hanzi: "高", pinyin: "gao" }, { hanzi: "会", pinyin: "hui" },
      { hanzi: "工作", pinyin: "gong zuo" }, { hanzi: "快乐", pinyin: "kuai le" }, { hanzi: "汉字", pinyin: "han zi" }, { hanzi: "回家", pinyin: "hui jia" }
    ] },
    { id: "jqx", title: "声母 j q x", keys: "J Q X", note: "舌面音，后面跟 i 或 ü。输入法里 ü 仍写作 u，例如 ju/qu/xu。", items: [
      { hanzi: "家", pinyin: "jia" }, { hanzi: "去", pinyin: "qu" }, { hanzi: "学", pinyin: "xue" }, { hanzi: "机", pinyin: "ji" },
      { hanzi: "请", pinyin: "qing" }, { hanzi: "小", pinyin: "xiao" }, { hanzi: "见", pinyin: "jian" }, { hanzi: "新", pinyin: "xin" },
      { hanzi: "今天", pinyin: "jin tian" }, { hanzi: "起来", pinyin: "qi lai" }, { hanzi: "学习", pinyin: "xue xi" }, { hanzi: "心情", pinyin: "xin qing" }
    ] },
    { id: "zhchshr", title: "声母 zh ch sh r", keys: "Z H C H S H R", note: "翘舌音。zh/ch/sh 比平舌音多一个 h，r 是浊擦音。", items: [
      { hanzi: "中", pinyin: "zhong" }, { hanzi: "吃", pinyin: "chi" }, { hanzi: "是", pinyin: "shi" }, { hanzi: "人", pinyin: "ren" },
      { hanzi: "这", pinyin: "zhe" }, { hanzi: "车", pinyin: "che" }, { hanzi: "上", pinyin: "shang" }, { hanzi: "日", pinyin: "ri" },
      { hanzi: "知道", pinyin: "zhi dao" }, { hanzi: "时间", pinyin: "shi jian" }, { hanzi: "认识", pinyin: "ren shi" }, { hanzi: "中国", pinyin: "zhong guo" }
    ] },
    { id: "zcs", title: "声母 z c s", keys: "Z C S", note: "平舌音。与 zh/ch/sh 只差一个 h，先确认声母完整再打韵母。", items: [
      { hanzi: "字", pinyin: "zi" }, { hanzi: "从", pinyin: "cong" }, { hanzi: "四", pinyin: "si" }, { hanzi: "在", pinyin: "zai" },
      { hanzi: "才", pinyin: "cai" }, { hanzi: "三", pinyin: "san" }, { hanzi: "早", pinyin: "zao" }, { hanzi: "送", pinyin: "song" },
      { hanzi: "自己", pinyin: "zi ji" }, { hanzi: "参加", pinyin: "can jia" }, { hanzi: "速度", pinyin: "su du" }, { hanzi: "早上", pinyin: "zao shang" }
    ] },
    { id: "yw", title: "声母 y w", keys: "Y W", note: "零声母的书写形式。yi/you/wo/wu 都要完整敲出字母，不要只打韵母。", items: [
      { hanzi: "一", pinyin: "yi" }, { hanzi: "我", pinyin: "wo" }, { hanzi: "有", pinyin: "you" }, { hanzi: "为", pinyin: "wei" },
      { hanzi: "也", pinyin: "ye" }, { hanzi: "五", pinyin: "wu" }, { hanzi: "要", pinyin: "yao" }, { hanzi: "文", pinyin: "wen" },
      { hanzi: "因为", pinyin: "yin wei" }, { hanzi: "问题", pinyin: "wen ti" }, { hanzi: "未来", pinyin: "wei lai" }, { hanzi: "一起", pinyin: "yi qi" }
    ] }
  ];

  var FINAL_GROUPS = [
    { id: "aoe", title: "韵母 a o e", keys: "A O E", note: "单韵母。a 张口最大，o 圆唇，e 扁唇。注意 e 与 er 的区别。", items: [
      { hanzi: "阿", pinyin: "a" }, { hanzi: "哦", pinyin: "o" }, { hanzi: "鹅", pinyin: "e" }, { hanzi: "爱", pinyin: "ai" },
      { hanzi: "奥", pinyin: "ao" }, { hanzi: "饿", pinyin: "e" }, { hanzi: "安", pinyin: "an" }, { hanzi: "恩", pinyin: "en" },
      { hanzi: "儿", pinyin: "er" }, { hanzi: "啊", pinyin: "a" }, { hanzi: "额", pinyin: "e" }, { hanzi: "欧", pinyin: "ou" }
    ] },
    { id: "iuü", title: "韵母 i u ü", keys: "I U V", note: "ü 在键盘上写作 v：女 nv、绿 lv；j/q/x/y 后的 ü 写作 u。", items: [
      { hanzi: "一", pinyin: "yi" }, { hanzi: "五", pinyin: "wu" }, { hanzi: "女", pinyin: "nv" }, { hanzi: "你", pinyin: "ni" },
      { hanzi: "不", pinyin: "bu" }, { hanzi: "绿", pinyin: "lv" }, { hanzi: "去", pinyin: "qu" }, { hanzi: "学", pinyin: "xue" },
      { hanzi: "鱼", pinyin: "yu" }, { hanzi: "月", pinyin: "yue" }, { hanzi: "云", pinyin: "yun" }, { hanzi: "军", pinyin: "jun" }
    ] },
    { id: "aieiui", title: "韵母 ai ei ui", keys: "A I E I U I", note: "复韵母，口形从前一个元音滑向后一个。不要吞掉末尾的 i。", items: [
      { hanzi: "爱", pinyin: "ai" }, { hanzi: "白", pinyin: "bai" }, { hanzi: "北", pinyin: "bei" }, { hanzi: "飞", pinyin: "fei" },
      { hanzi: "水", pinyin: "shui" }, { hanzi: "对", pinyin: "dui" }, { hanzi: "来", pinyin: "lai" }, { hanzi: "谁", pinyin: "shui" },
      { hanzi: "累", pinyin: "lei" }, { hanzi: "回", pinyin: "hui" }, { hanzi: "快", pinyin: "kuai" }, { hanzi: "贵", pinyin: "gui" }
    ] },
    { id: "aoouiu", title: "韵母 ao ou iu", keys: "A O O U I U", note: "复韵母。ao 张口大，ou 圆唇，iu 实际是 iou 的缩写。", items: [
      { hanzi: "好", pinyin: "hao" }, { hanzi: "高", pinyin: "gao" }, { hanzi: "口", pinyin: "kou" }, { hanzi: "手", pinyin: "shou" },
      { hanzi: "九", pinyin: "jiu" }, { hanzi: "六", pinyin: "liu" }, { hanzi: "牛", pinyin: "niu" }, { hanzi: "老", pinyin: "lao" },
      { hanzi: "走", pinyin: "zou" }, { hanzi: "有", pinyin: "you" }, { hanzi: "秋", pinyin: "qiu" }, { hanzi: "小", pinyin: "xiao" }
    ] },
    { id: "ieüeer", title: "韵母 ie üe er", keys: "I E V E E R", note: "ie/üe 以 e 收尾，er 是卷舌韵母。üe 在输入法里写作 ve。", items: [
      { hanzi: "写", pinyin: "xie" }, { hanzi: "姐", pinyin: "jie" }, { hanzi: "学", pinyin: "xue" }, { hanzi: "月", pinyin: "yue" },
      { hanzi: "略", pinyin: "lve" }, { hanzi: "儿", pinyin: "er" }, { hanzi: "二", pinyin: "er" }, { hanzi: "别", pinyin: "bie" },
      { hanzi: "雪", pinyin: "xue" }, { hanzi: "约", pinyin: "yue" }, { hanzi: "铁", pinyin: "tie" }, { hanzi: "且", pinyin: "qie" }
    ] },
    { id: "aneninunün", title: "韵母 an en in un ün", keys: "A N E N I N U N V N", note: "前鼻音，以 n 收尾。ün 在输入法里写作 vn，例如军 jun、群 qun。", items: [
      { hanzi: "安", pinyin: "an" }, { hanzi: "本", pinyin: "ben" }, { hanzi: "心", pinyin: "xin" }, { hanzi: "云", pinyin: "yun" },
      { hanzi: "军", pinyin: "jun" }, { hanzi: "门", pinyin: "men" }, { hanzi: "金", pinyin: "jin" }, { hanzi: "春", pinyin: "chun" },
      { hanzi: "群", pinyin: "qun" }, { hanzi: "山", pinyin: "shan" }, { hanzi: "分", pinyin: "fen" }, { hanzi: "林", pinyin: "lin" }
    ] },
    { id: "angengingong", title: "韵母 ang eng ing ong", keys: "A N G E N G I N G O N G", note: "后鼻音，以 ng 收尾。与前鼻音只差一个 g，必须完整敲出。", items: [
      { hanzi: "方", pinyin: "fang" }, { hanzi: "风", pinyin: "feng" }, { hanzi: "星", pinyin: "xing" }, { hanzi: "中", pinyin: "zhong" },
      { hanzi: "上", pinyin: "shang" }, { hanzi: "灯", pinyin: "deng" }, { hanzi: "听", pinyin: "ting" }, { hanzi: "红", pinyin: "hong" },
      { hanzi: "长", pinyin: "chang" }, { hanzi: "能", pinyin: "neng" }, { hanzi: "明", pinyin: "ming" }, { hanzi: "东", pinyin: "dong" }
    ] }
  ];

  function zhLesson(group, kind) {
    var typeLabel = kind === "initial" ? "声母" : "韵母";
    return {
      id: "zh-" + (kind === "initial" ? "i-" : "f-") + group.id,
      title: group.title,
      en: (kind === "initial" ? "Initials " : "Finals ") + group.keys,
      summary: "单独练习" + typeLabel + " " + group.keys + "，把每一个音节打完整。",
      minutes: 10,
      difficulty: kind === "initial" ? 2 : 3,
      focus: group.keys.split(" "),
      goals: [
        "准确区分本组" + typeLabel,
        "完整输入每个音节，不漏掉尾字母",
        "在词语中保持稳定"
      ],
      sections: [
        { title: "发音与拼写", html: "<p>" + group.note + "</p><p>本组涉及按键：<code>" + group.keys + "</code>。先读准，再敲准；读音和手指动作要一致。</p>" },
        { title: "键盘路线", html: "<p>拼音输入不需要声调，但每个字母都要完整。遇到复韵母或鼻韵母，按“声母—介音—韵腹—韵尾”的顺序分组输入，不要一口气乱冲。</p><ul><li>看到汉字，先在心里读出完整拼音。</li><li>按音节分组敲字母，尾音 <code>n</code> / <code>ng</code> 单独确认。</li><li>打完一个词后，再检查候选是否为目标词。</li></ul>" },
        { title: "常见错误", html: "<p>最常见的问题是吞掉尾音、平翘舌混淆、<code>ü</code> 写成 <code>u</code>。练习时宁可慢一点，也要把每个音节打完整。</p>" },
        { title: "本组练习", html: "<p>练习页会显示汉字和拼音。你可以使用拼音模式，也可以切换到输入法实战，用系统中文输入法真正上屏。</p>" }
      ],
      type: "pinyin",
      items: group.items
    };
  }

  addChapters("chinese", [
    { title: "声母逐组", lead: "七组声母，一组一课；先把每个声母打完整。", lessons: INITIAL_GROUPS.map(function (g) { return zhLesson(g, "initial"); }) },
    { title: "韵母逐组", lead: "七组韵母，覆盖单韵母、复韵母和鼻韵母。", lessons: FINAL_GROUPS.map(function (g) { return zhLesson(g, "final"); }) }
  ], 1);
  getCourse("chinese").duration = "约 7 小时";

  /* =========================================================
     五笔：25 节字根单键
     ========================================================= */
  var WUBI_KEYS = [
    { key: "g", zone: "横区", pos: "一位", name: "王", roots: ["王", "一", "五", "戋", "丰"], rhyme: "王旁青头戋（兼）五一", simple: "一" },
    { key: "f", zone: "横区", pos: "二位", name: "土", roots: ["土", "士", "二", "干", "十", "寸", "雨"], rhyme: "土士二干十寸雨", simple: "地" },
    { key: "d", zone: "横区", pos: "三位", name: "大", roots: ["大", "犬", "三", "羊", "古", "石", "厂"], rhyme: "大犬三羊古石厂", simple: "在" },
    { key: "s", zone: "横区", pos: "四位", name: "木", roots: ["木", "丁", "西"], rhyme: "木丁西", simple: "要" },
    { key: "a", zone: "横区", pos: "五位", name: "工", roots: ["工", "戈", "艹", "匚", "七"], rhyme: "工戈草头右框七", simple: "工" },
    { key: "h", zone: "竖区", pos: "一位", name: "目", roots: ["目", "具", "上", "止", "卜", "虎", "皮"], rhyme: "目具上止卜虎皮", simple: "上" },
    { key: "j", zone: "竖区", pos: "二位", name: "日", roots: ["日", "早", "虫", "刂"], rhyme: "日早两竖与虫依", simple: "是" },
    { key: "k", zone: "竖区", pos: "三位", name: "口", roots: ["口", "川"], rhyme: "口与川，字根稀", simple: "中" },
    { key: "l", zone: "竖区", pos: "四位", name: "田", roots: ["田", "甲", "囗", "四", "车", "力"], rhyme: "田甲方框四车力", simple: "国" },
    { key: "m", zone: "竖区", pos: "五位", name: "山", roots: ["山", "由", "贝", "冂", "几"], rhyme: "山由贝，下框几", simple: "同" },
    { key: "t", zone: "撇区", pos: "一位", name: "禾", roots: ["禾", "竹", "丿", "彳", "攵", "夂"], rhyme: "禾竹一撇双人立，反文条头共三一", simple: "和" },
    { key: "r", zone: "撇区", pos: "二位", name: "白", roots: ["白", "手", "扌", "斤", "看"], rhyme: "白手看头三二斤", simple: "的" },
    { key: "e", zone: "撇区", pos: "三位", name: "月", roots: ["月", "彡", "乃", "用", "豕", "衣"], rhyme: "月彡（衫）乃用家衣底", simple: "有" },
    { key: "w", zone: "撇区", pos: "四位", name: "人", roots: ["人", "亻", "八"], rhyme: "人和八，三四里", simple: "人" },
    { key: "q", zone: "撇区", pos: "五位", name: "金", roots: ["金", "钅", "勺", "鱼", "儿", "夕", "氏"], rhyme: "金勺缺点无尾鱼，犬旁留叉儿一点夕，氏无七", simple: "我" },
    { key: "y", zone: "捺区", pos: "一位", name: "言", roots: ["言", "讠", "文", "方", "广", "亠"], rhyme: "言文方广在四一，高头一捺谁人去", simple: "主" },
    { key: "u", zone: "捺区", pos: "二位", name: "立", roots: ["立", "辛", "冫", "六", "门", "疒"], rhyme: "立辛两点六门疒", simple: "产" },
    { key: "i", zone: "捺区", pos: "三位", name: "水", roots: ["水", "氵", "小", "兴头"], rhyme: "水旁兴头小倒立", simple: "不" },
    { key: "o", zone: "捺区", pos: "四位", name: "火", roots: ["火", "灬", "米", "业头"], rhyme: "火业头，四点米", simple: "为" },
    { key: "p", zone: "捺区", pos: "五位", name: "之", roots: ["之", "辶", "宀", "礻", "衤"], rhyme: "之宝盖，摘礻（示）衤（衣）", simple: "这" },
    { key: "n", zone: "折区", pos: "一位", name: "已", roots: ["已", "巳", "己", "尸", "心", "羽", "左框"], rhyme: "已半巳满不出己，左框折尸心和羽", simple: "民" },
    { key: "b", zone: "折区", pos: "二位", name: "子", roots: ["子", "耳", "了", "也", "凵"], rhyme: "子耳了也框向上", simple: "了" },
    { key: "v", zone: "折区", pos: "三位", name: "女", roots: ["女", "刀", "九", "臼", "彐"], rhyme: "女刀九臼山朝西", simple: "发" },
    { key: "c", zone: "折区", pos: "四位", name: "又", roots: ["又", "巴", "马", "厶"], rhyme: "又巴马，丢矢矣", simple: "以" },
    { key: "x", zone: "折区", pos: "五位", name: "纟", roots: ["纟", "母", "弓", "匕", "幺"], rhyme: "慈母无心弓和匕，幼无力", simple: "经" }
  ];

  var WUBI_CHAPTERS = [
    { zone: "横区", title: "横区字根单键", lead: "G F D S A：从横区开始，一节课只认识一个键的字根。" },
    { zone: "竖区", title: "竖区字根单键", lead: "H J K L M：竖区的五个键，每个键都有自己的字根家族。" },
    { zone: "撇区", title: "撇区字根单键", lead: "T R E W Q：撇区的口诀最长，拆成单键就更容易记。" },
    { zone: "捺区", title: "捺区字根单键", lead: "Y U I O P：捺区包含言、立、水、火、之五个键名。" },
    { zone: "折区", title: "折区字根单键", lead: "N B V C X：折区是五笔的最后一区，也是很多难拆字的入口。" }
  ];

  function wubiLesson(meta, index) {
    var key = meta.key;
    var upper = key.toUpperCase();
    var items = [
      { hanzi: meta.name, code: key + key + key + key, parts: upper + " 键名 · 连敲四次" },
      { hanzi: meta.simple, code: key, parts: "一级简码 · 单键上屏" }
    ];
    meta.roots.forEach(function (root) {
      items.push({ hanzi: root, code: key, parts: upper + " 键字根" });
    });
    return {
      id: "wb-k-" + key,
      title: "字根单键 " + upper + " · " + meta.name,
      en: "Root Key " + upper,
      summary: "只学 " + upper + " 键：" + meta.zone + meta.pos + "，从键名字根到一级简码。",
      minutes: 9,
      difficulty: 2,
      focus: [upper],
      goals: [
        "记住 " + upper + " 键的代表字根",
        "输入键名 " + meta.name + " 和一级简码 " + meta.simple,
        "能区分本键字根与相邻键"
      ],
      sections: [
        { title: upper + " 键的位置", html: "<p><code>" + upper + "</code> 位于" + meta.zone + meta.pos + "，键名是“" + meta.name + "”。先找到键，再记住它负责的一整组字根。</p><p>五笔的 25 个字母键分成五区，每区五位。这个键的坐标是<strong>" + meta.zone + " · " + meta.pos + "</strong>。</p>" },
        { title: "本键字根", html: "<p>代表字根：<code>" + meta.roots.join(" / ") + "</code>。它们不一定都是常用字，但看到这些部件时，要能第一时间想到 " + upper + " 键。</p><p>不要孤立地背字根。把字根放回汉字里，例如“" + meta.name + "”是键名，“" + meta.simple + "”是一级简码。</p>" },
        { title: "口诀", html: "<p><strong>" + meta.rhyme + "</strong></p><p>先读顺口诀，再在键盘上找到 " + upper + "。读的时候把生僻字义放在一边，先让声音和手指建立联系。</p>" },
        { title: "键名与一级简码", html: "<p>键名“" + meta.name + "”连敲四次：<code>" + (key + key + key + key).toUpperCase() + "</code>。一级简码“" + meta.simple + "”只需一个键：<code>" + upper + "</code>，再按空格上屏。</p><p>练习时先打键名，再打一级简码，最后逐字根定位。三种编码长度不同，注意不要多敲或漏敲。</p>" },
        { title: "常见错误", html: "<p>最常见的问题是把它和相邻键的字根混淆，或者把一级简码当成完整编码。看到“" + meta.simple + "”时，先想一级简码 " + upper + "，不要急着拆字。</p>" }
      ],
      type: "wubi",
      items: items
    };
  }

  var wubiChapters = WUBI_CHAPTERS.map(function (chapter) {
    var lessons = WUBI_KEYS.filter(function (k) { return k.zone === chapter.zone; }).map(wubiLesson);
    return { title: chapter.title, lead: chapter.lead, lessons: lessons };
  });
  addChapters("wubi", wubiChapters, 1);
  getCourse("wubi").duration = "约 10 小时";

  /* 课程统计信息刷新 */
  ["english", "touch", "chinese", "wubi"].forEach(function (id) {
    var c = getCourse(id);
    if (c) {
      c.lessonCount = c.lessons.length;
      c.chapterCount = c.chapters.length;
    }
  });
})();
