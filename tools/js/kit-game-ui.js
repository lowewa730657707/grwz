/* ============================================================
   小游戏 UI 增强包（覆盖同名注册）
   ------------------------------------------------------------
   在 js/kit-game.js 之后加载：同名 R(name, cfg) 会覆盖旧实现。
   重做：贪吃蛇 / 2048 小游戏 / 打砖块 / 俄罗斯方块 / 记忆翻牌
   只使用站点 CSS 变量配色，不使用任何渐变、不使用 emoji 图标。
   战绩继续写入 localStorage['toolbox_game_records_v1']，供「游戏记录」读取。
   ============================================================ */
(function () {
  'use strict';

  var T = window.TOOLKIT;
  if (!T || typeof T.register !== 'function') return;
  var R = T.register;

  /* ---------- 样式表自举：index.html 未引入 assets/game.css 时补一个 ---------- */
  (function () {
    try {
      if (document.querySelector('link[href*="game.css"]')) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/game.css';
      link.setAttribute('data-gu-css', '');
      document.head.appendChild(link);
    } catch (e) { /* noop */ }
  })();

  /* ============================================================
     一、本机战绩（与旧实现共用同一结构）
     { 工具名: {plays,wins,losses,draws,bestScore,bestTime,lastTime,updated} }
     ============================================================ */
  var REC_KEY = 'toolbox_game_records_v1';

  function readRecords() {
    try {
      var v = JSON.parse(localStorage.getItem(REC_KEY) || '{}');
      return v && typeof v === 'object' ? v : {};
    } catch (e) { return {}; }
  }
  function writeRecords(v) {
    try { localStorage.setItem(REC_KEY, JSON.stringify(v)); } catch (e) { /* 隐私模式忽略 */ }
  }
  function bestOf(name, field) {
    var all = readRecords(), r = all[name];
    return r ? r[field] : undefined;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtMs(ms) {
    var s = Math.max(0, Math.floor((ms || 0) / 1000));
    return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
  }

  /* 统一结算：累加局数/胜负，bestScore 取大（lowerBetter 时取小），
     bestTime 仅在 result !== 'lose' 时取小；lastTime/updated 每次都写。 */
  function saveRecord(name, opt) {
    opt = opt || {};
    var all = readRecords();
    var r = all[name] || {};
    r.plays = (r.plays || 0) + 1;
    var result = opt.result || 'win';
    if (result === 'win') r.wins = (r.wins || 0) + 1;
    else if (result === 'lose') r.losses = (r.losses || 0) + 1;
    else r.draws = (r.draws || 0) + 1;

    var improved = false;
    var sc = opt.score;
    if (sc != null && isFinite(sc)) {
      if (r.bestScore == null || (opt.lowerBetter ? sc < r.bestScore : sc > r.bestScore)) {
        r.bestScore = sc;
        improved = true;
      }
    }
    var ms = Math.max(0, Math.round(opt.timeMs || 0));
    if (ms > 0 && result !== 'lose') {
      if (r.bestTime == null || ms < r.bestTime) { r.bestTime = ms; improved = true; }
    }
    r.lastTime = ms;
    r.updated = Date.now();
    all[name] = r;
    writeRecords(all);
    if (improved) T.toast('刷新最佳记录');
    return { improved: improved, rec: r };
  }

  /* ============================================================
     二、WebAudio 合成音效（无外部文件，可静音，记忆到 localStorage）
     ============================================================ */
  var SND_KEY = 'toolbox_game_sound_v1';
  var soundOn = true;
  try { soundOn = localStorage.getItem(SND_KEY) !== 'off'; } catch (e) { /* noop */ }
  var actx = null;

  function audioCtx() {
    if (actx) {
      if (actx.state === 'suspended') { try { actx.resume(); } catch (e) { /* noop */ } }
      return actx;
    }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { actx = new C(); } catch (e) { actx = null; }
    return actx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!soundOn) return;
    var a = audioCtx();
    if (!a) return;
    try {
      var t0 = a.currentTime + (delay || 0);
      var osc = a.createOscillator();
      var gain = a.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { /* noop */ }
  }

  var S = {
    tick: function () { tone(520, 0.04, 'square', 0.05); },
    count: function () { tone(560, 0.08, 'sine', 0.1); },
    go: function () { tone(820, 0.11, 'sine', 0.11); },
    eat: function () { tone(720, 0.06, 'triangle', 0.15); tone(1040, 0.07, 'triangle', 0.1, 0.055); },
    flip: function () { tone(620, 0.04, 'sine', 0.07); },
    match: function () { tone(760, 0.07, 'triangle', 0.1); tone(1080, 0.08, 'triangle', 0.08, 0.06); },
    merge: function () { tone(430, 0.07, 'triangle', 0.1); tone(560, 0.08, 'triangle', 0.07, 0.06); },
    hit: function () { tone(240, 0.04, 'square', 0.06); },
    paddle: function () { tone(330, 0.04, 'square', 0.07); },
    brick: function () { tone(190, 0.05, 'square', 0.07); },
    launch: function () { tone(460, 0.06, 'triangle', 0.08); },
    life: function () { tone(210, 0.13, 'sawtooth', 0.09); tone(150, 0.18, 'sawtooth', 0.08, 0.1); },
    line: function () { tone(660, 0.05, 'sine', 0.09); tone(880, 0.05, 'sine', 0.08, 0.05); tone(1180, 0.09, 'sine', 0.07, 0.1); },
    land: function () { tone(170, 0.05, 'square', 0.07); },
    clear: function () { tone(560, 0.05, 'sine', 0.09); tone(760, 0.05, 'sine', 0.08, 0.05); tone(980, 0.05, 'sine', 0.08, 0.1); tone(1240, 0.1, 'sine', 0.07, 0.15); },
    win: function () { tone(523, 0.1, 'triangle', 0.1); tone(659, 0.1, 'triangle', 0.09, 0.1); tone(784, 0.1, 'triangle', 0.09, 0.2); tone(1046, 0.2, 'triangle', 0.09, 0.3); },
    lose: function () { tone(330, 0.11, 'sawtooth', 0.09); tone(240, 0.13, 'sawtooth', 0.09, 0.1); tone(160, 0.22, 'sawtooth', 0.08, 0.22); },
    die: function () { tone(300, 0.1, 'sawtooth', 0.1); tone(200, 0.14, 'sawtooth', 0.09, 0.09); tone(130, 0.24, 'sawtooth', 0.08, 0.22); }
  };

  function toggleSound() {
    soundOn = !soundOn;
    try { localStorage.setItem(SND_KEY, soundOn ? 'on' : 'off'); } catch (e) { /* noop */ }
    return soundOn;
  }
  function syncSound(root) {
    var list = root.querySelectorAll('[data-gu="sound"]');
    for (var i = 0; i < list.length; i++) list[i].textContent = soundOn ? '音效 开' : '音效 关';
  }

  /* ============================================================
     三、通用小工具
     ============================================================ */
  function qs(root, sel) { return root ? root.querySelector(sel) : null; }
  function qsa(root, sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }
  function cssv(name, fb) {
    var v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue(name); } catch (e) { /* noop */ }
    v = (v || '').trim();
    return v || fb || '';
  }
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function palette() {
    return {
      dark: isDark(),
      bg: cssv('--bg', '#f4f3ee'),
      surface: cssv('--surface', '#fffefb'),
      surface2: cssv('--surface-2', '#f9f8f3'),
      surface3: cssv('--surface-3', '#f1f0e9'),
      line: cssv('--line', '#e3e1d8'),
      lineStrong: cssv('--line-strong', '#cfccc0'),
      text: cssv('--text', '#1b1c18'),
      text2: cssv('--text-2', '#55564d'),
      text3: cssv('--text-3', '#707066'),
      accent: cssv('--accent', '#2d5c4d'),
      accent2: cssv('--accent-2', '#4c7f6d'),
      soft: cssv('--accent-soft', '#e7efea'),
      on: cssv('--on-accent', '#fdfdf8'),
      good: cssv('--good', '#2f7a56'),
      warn: cssv('--warn', '#8a641f'),
      err: cssv('--err', '#a5452f')
    };
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function nowMs() {
    if (window.performance && typeof window.performance.now === 'function') return window.performance.now();
    return Date.now();
  }
  function statHTML(rows) {
    var h = '<div class="gu-stats">';
    for (var i = 0; i < rows.length; i++) {
      h += '<div class="gu-stat"><span>' + rows[i][0] + '</span><b>' + rows[i][1] + '</b></div>';
    }
    return h + '</div>';
  }
  /* 右侧说明卡片（≥1100px 时粘性跟随） */
  function infoCard(title, inner) {
    return '<div class="gu-info-card"><h4>' + title + '</h4>' + inner + '</div>';
  }
  function infoRows(rows) {
    var h = '';
    for (var i = 0; i < rows.length; i++) {
      var cls = rows[i][3] ? ' is-accent' : '';
      h += '<div class="gu-info-row' + cls + '"><span>' + rows[i][0] + '</span><b data-side="' + rows[i][1] + '">' + rows[i][2] + '</b></div>';
    }
    return h;
  }
  function infoOps(rows) {
    var h = '<ul class="gu-info-list">';
    for (var i = 0; i < rows.length; i++) {
      h += '<li><span class="k">' + rows[i][0] + '</span><span>' + rows[i][1] + '</span></li>';
    }
    return h + '</ul>';
  }
  function setSide(host, key, val) {
    var list = qsa(host, '[data-side="' + key + '"]');
    for (var i = 0; i < list.length; i++) list[i].textContent = String(val);
  }
  function showCard(ov, html, extra) {
    ov.className = 'gu-overlay' + (extra ? ' ' + extra : '');
    ov.innerHTML = html;
    ov.hidden = false;
  }
  function hideCard(ov) {
    ov.hidden = true;
    ov.innerHTML = '';
    ov.className = 'gu-overlay';
  }
  function banner(play, text) {
    var old = qs(play, '.gu-banner');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var b = document.createElement('div');
    b.className = 'gu-banner';
    b.textContent = text;
    play.appendChild(b);
    setTimeout(function () {
      if (b.parentNode) b.parentNode.removeChild(b);
    }, 1900);
  }
  function stopwatch() {
    var t0 = 0, acc = 0, on = false;
    function begin() { acc = 0; t0 = Date.now(); on = true; }
    function start() { if (!on) { t0 = Date.now(); on = true; } }
    function pause() { if (on) { acc += Date.now() - t0; on = false; } }
    function reset() { acc = 0; on = false; t0 = 0; }
    function elapsed() { return acc + (on ? Date.now() - t0 : 0); }
    return { begin: begin, start: start, pause: pause, reset: reset, elapsed: elapsed };
  }
  /* 只在 host 仍挂载、且焦点不在输入控件时响应键盘 */
  function bindKeys(host, onDown, onUp) {
    function editable(t) {
      if (!t) return false;
      var tag = (t.tagName || '').toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable === true;
    }
    function kd(e) {
      if (!host.isConnected) { document.removeEventListener('keydown', kd); return; }
      if (editable(e.target)) return;
      onDown(e);
    }
    function ku(e) {
      if (!host.isConnected) { document.removeEventListener('keyup', ku); return; }
      if (editable(e.target)) return;
      if (onUp) onUp(e);
    }
    document.addEventListener('keydown', kd);
    if (onUp) document.addEventListener('keyup', ku);
    return function () {
      document.removeEventListener('keydown', kd);
      if (onUp) document.removeEventListener('keyup', ku);
    };
  }
  function flashNow(play) {
    var f = qs(play, '.gu-flash');
    if (!f) return;
    f.classList.remove('is-on');
    void f.offsetWidth;
    f.classList.add('is-on');
  }
  function shakeNow(play) {
    play.classList.remove('is-shake');
    void play.offsetWidth;
    play.classList.add('is-shake');
  }

  /* ============================================================
     四、贪吃蛇
     ============================================================ */
  R('贪吃蛇', { render: function (host, api) {
    var N = 20, SIZE = 20, CV = N * SIZE;
    var DIFFS = [
      { key: 'slow', label: '慢速', ms: 160 },
      { key: 'normal', label: '普通', ms: 120 },
      { key: 'fast', label: '快速', ms: 90 },
      { key: 'ultra', label: '极速', ms: 65 }
    ];

    host.innerHTML =
      '<div class="gu-layout"><div class="gu-main">' +
      '<div class="gu-toolbar">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="pause">暂停</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重开</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="sound">音效 开</button>' +
        '<span class="cp-note">方向键 / WASD 转向 · 空格 暂停</span>' +
      '</div>' +
      '<div class="gu-score">' +
        '<div><b data-ui="score">0</b><span>得分</span></div>' +
        '<div><b data-ui="best">0</b><span>最高分</span></div>' +
        '<div><b data-ui="time">00:00</b><span>用时</span></div>' +
      '</div>' +
      '<div class="game-center"><div class="gu-play">' +
        '<div class="gu-stage"><canvas width="' + CV + '" height="' + CV + '" data-cv></canvas></div>' +
        '<div class="gu-flash"></div>' +
        '<div class="gu-overlay" hidden></div>' +
      '</div></div>' +
      '<div class="gu-pad">' +
        '<button type="button" class="gu-pad-btn gu-pad-up" data-dir="up" aria-label="向上">↑</button>' +
        '<button type="button" class="gu-pad-btn gu-pad-left" data-dir="left" aria-label="向左">←</button>' +
        '<button type="button" class="gu-pad-btn gu-pad-mid" data-gu="pause" aria-label="暂停">暂停</button>' +
        '<button type="button" class="gu-pad-btn gu-pad-right" data-dir="right" aria-label="向右">→</button>' +
        '<button type="button" class="gu-pad-btn gu-pad-down" data-dir="down" aria-label="向下">↓</button>' +
      '</div>' +
      '</div>' +
      '<aside class="gu-info">' +
        infoCard('玩法说明', '<p>吃到食物 +10 分，每吃 5 个提速一档；撞墙或撞到自己即结束。难度越高初始速度越快。</p>') +
        infoCard('操作', infoOps([
          ['转向', '↑ ↓ ← → 或 W A S D'],
          ['暂停', '空格 / 下方「暂停」'],
          ['手机', '画布下方十字方向键']
        ])) +
        infoCard('本次成绩', infoRows([
          ['得分', 'score', '0'],
          ['吃到食物', 'foods', '0'],
          ['用时', 'time', '00:00']
        ])) +
        infoCard('最高记录', infoRows([
          ['最高分', 'best', '—'],
          ['玩过局数', 'plays', '0']
        ])) +
      '</aside>' +
      '</div>';

    var play = qs(host, '.gu-play');
    var ov = qs(play, '.gu-overlay');
    var cv = qs(host, '[data-cv]');
    var cx = cv.getContext('2d');
    var ui = {
      score: qs(host, '[data-ui="score"]'),
      best: qs(host, '[data-ui="best"]'),
      time: qs(host, '[data-ui="time"]')
    };

    var diff = DIFFS[1];
    var pal = palette();
    var state = 'idle';
    var snake = [];
    var dir = [1, 0], queued = [1, 0];
    var food = null;
    var score = 0, foods = 0, stepMs = 120;
    var acc = 0, raf = 0, last = null, lastHud = 0;
    var parts = [], rings = [];
    var watch = stopwatch();
    var storedBest = bestOf('贪吃蛇', 'bestScore');
    var disposed = false, timers = [];

    function later(fn, ms) {
      var id = setTimeout(function () {
        if (!disposed && host.isConnected) fn();
      }, ms);
      timers.push(id);
      return id;
    }
    function clearTimers() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
    }
    function bestNow() { return Math.max(storedBest || 0, score); }
    function syncUi() {
      ui.score.textContent = String(score);
      ui.best.textContent = String(bestNow());
      ui.time.textContent = fmtMs(watch.elapsed());
      setSide(host, 'score', score);
      setSide(host, 'foods', foods);
      setSide(host, 'time', fmtMs(watch.elapsed()));
    }
    function syncBest() {
      var rec = readRecords()['贪吃蛇'] || {};
      setSide(host, 'best', rec.bestScore == null ? '—' : rec.bestScore);
      setSide(host, 'plays', rec.plays || 0);
    }
    function bodyColor(i) {
      var k = Math.min(i, 14);
      if (pal.dark) return 'hsl(' + (154 + k * 3) + ' 32% ' + (66 - k * 1.6) + '%)';
      return 'hsl(' + (154 + k * 3) + ' 34% ' + (42 - k * 1.4) + '%)';
    }
    function placeFood() {
      var free = [], r, c, i, used;
      for (r = 0; r < N; r++) {
        for (c = 0; c < N; c++) {
          used = false;
          for (i = 0; i < snake.length; i++) {
            if (snake[i][0] === c && snake[i][1] === r) { used = true; break; }
          }
          if (!used) free.push([c, r]);
        }
      }
      food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
    }
    function spawnBurst(x, y) {
      var cols = [pal.err, pal.warn, pal.accent2, pal.accent];
      var i;
      for (i = 0; i < 14; i++) {
        var a = Math.random() * Math.PI * 2;
        var sp = 0.6 + Math.random() * 2.2;
        parts.push({
          x: x, y: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6,
          s: 2 + Math.random() * 3,
          life: 380 + Math.random() * 320,
          max: 700,
          c: cols[i % cols.length]
        });
      }
      rings.push({ x: x, y: y, r: 6, a: 0.78, c: pal.err });
    }
    function updateFx(dt) {
      var i;
      for (i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx * dt / 16;
        p.y += p.vy * dt / 16;
        p.vy += 0.12 * dt / 16;
        p.life -= dt;
        if (p.life <= 0) parts.splice(i, 1);
      }
      for (i = rings.length - 1; i >= 0; i--) {
        var rg = rings[i];
        rg.r += dt * 0.12;
        rg.a -= dt / 430;
        if (rg.a <= 0) rings.splice(i, 1);
      }
    }
    function draw(ts) {
      var t = ts || 0;
      var i, s;
      cx.clearRect(0, 0, CV, CV);
      cx.fillStyle = pal.surface2;
      cx.fillRect(0, 0, CV, CV);

      cx.lineWidth = 1;
      cx.strokeStyle = pal.dark ? 'rgba(238,238,230,.055)' : 'rgba(27,28,24,.05)';
      for (i = 1; i < N; i++) {
        var g = i * SIZE + 0.5;
        cx.beginPath(); cx.moveTo(g, 0); cx.lineTo(g, CV); cx.stroke();
        cx.beginPath(); cx.moveTo(0, g); cx.lineTo(CV, g); cx.stroke();
      }
      cx.strokeStyle = pal.dark ? 'rgba(238,238,230,.14)' : 'rgba(27,28,24,.14)';
      cx.strokeRect(0.5, 0.5, CV - 1, CV - 1);

      if (food) {
        var pulse = 1 + 0.11 * Math.sin(t / 190);
        var fr = SIZE * 0.3 * pulse;
        var fx = food[0] * SIZE + SIZE / 2;
        var fy = food[1] * SIZE + SIZE / 2;
        cx.fillStyle = pal.err;
        cx.beginPath(); cx.arc(fx, fy, fr, 0, Math.PI * 2); cx.fill();
        cx.strokeStyle = 'rgba(255,255,255,.55)';
        cx.beginPath(); cx.arc(fx, fy, fr, 0, Math.PI * 2); cx.stroke();
      }

      for (s = snake.length - 1; s >= 0; s--) {
        var seg = snake[s];
        var x = seg[0] * SIZE, y = seg[1] * SIZE;
        cx.fillStyle = s === 0 ? pal.accent : bodyColor(s);
        cx.fillRect(x + 1, y + 1, SIZE - 2, SIZE - 2);
        if (s === 0) {
          cx.fillStyle = pal.dark ? pal.bg : pal.on;
          var e = SIZE * 0.17;
          cx.fillRect(x + SIZE * 0.27, y + SIZE * 0.3, e, e);
          cx.fillRect(x + SIZE * 0.73 - e, y + SIZE * 0.3, e, e);
        }
      }

      for (i = 0; i < rings.length; i++) {
        var rr = rings[i];
        cx.globalAlpha = Math.max(0, rr.a);
        cx.strokeStyle = rr.c;
        cx.lineWidth = 2;
        cx.beginPath(); cx.arc(rr.x, rr.y, rr.r, 0, Math.PI * 2); cx.stroke();
        cx.globalAlpha = 1;
      }
      for (i = 0; i < parts.length; i++) {
        var pt = parts[i];
        cx.globalAlpha = Math.max(0, pt.life / pt.max);
        cx.fillStyle = pt.c;
        cx.fillRect(pt.x - pt.s / 2, pt.y - pt.s / 2, pt.s, pt.s);
      }
      cx.globalAlpha = 1;
    }
    function eat() {
      score += 10;
      foods++;
      if (food) spawnBurst(food[0] * SIZE + SIZE / 2, food[1] * SIZE + SIZE / 2);
      S.eat();
      stepMs = Math.max(55, diff.ms - Math.floor(foods / 5) * 8);
      placeFood();
      syncUi();
    }
    function die() {
      if (state !== 'run') return;
      state = 'over';
      watch.pause();
      S.die();
      flashNow(play);
      shakeNow(play);
      var ms = watch.elapsed();
      var out = saveRecord('贪吃蛇', { score: score, timeMs: ms, result: 'lose' });
      storedBest = out.rec.bestScore;
      syncUi();
      syncBest();
      draw(nowMs());
      showEnd(ms, out.improved);
    }
    function step() {
      dir = queued;
      var head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
      if (head[0] < 0 || head[0] >= N || head[1] < 0 || head[1] >= N) { die(); return; }
      var willEat = !!(food && head[0] === food[0] && head[1] === food[1]);
      var body = willEat ? snake : snake.slice(0, snake.length - 1);
      for (var i = 0; i < body.length; i++) {
        if (body[i][0] === head[0] && body[i][1] === head[1]) { die(); return; }
      }
      snake.unshift(head);
      if (willEat) eat();
      else snake.pop();
    }
    function loop(ts) {
      if (disposed) return;
      if (!host.isConnected) { cancelAnimationFrame(raf); raf = 0; return; }
      raf = requestAnimationFrame(loop);
      if (last == null) last = ts;
      var dt = Math.min(80, ts - last);
      last = ts;
      if (state === 'run') {
        acc += dt;
        var guard = 0;
        while (acc >= stepMs && state === 'run' && guard < 4) { acc -= stepMs; step(); guard++; }
        if (state === 'run' && ts - lastHud > 240) {
          lastHud = ts;
          ui.time.textContent = fmtMs(watch.elapsed());
        }
      }
      updateFx(dt);
      draw(ts);
    }
    function showIdle() {
      var chips = '';
      for (var i = 0; i < DIFFS.length; i++) {
        var d = DIFFS[i];
        chips += '<button type="button" class="gu-chip' + (d.key === diff.key ? ' is-on' : '') + '" data-diff="' + d.key + '">' + d.label + '</button>';
      }
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>贪吃蛇</h3>' +
          '<div class="gu-sub">吃到食物 +10 分，每吃 5 个提速一档；撞墙或撞到自己即结束。</div>' +
          '<div class="gu-best"><span>最高分</span><b>' + (storedBest == null ? '—' : storedBest) + '</b></div>' +
          '<div class="gu-chips">' + chips + '</div>' +
          '<div class="gu-btn-row">' +
            '<button type="button" class="btn btn-primary" data-gu="start">开始游戏</button>' +
            '<button type="button" class="btn btn-ghost" data-gu="sound">音效 开</button>' +
          '</div>' +
          '<div class="gu-keys"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> 或 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 转向 · <kbd>空格</kbd> 暂停</div>' +
        '</div>');
      syncSound(host);
    }
    function toIdle() {
      clearTimers();
      state = 'idle';
      score = 0; foods = 0; stepMs = diff.ms; acc = 0;
      snake = [[9, 10], [8, 10], [7, 10]];
      dir = [1, 0]; queued = [1, 0];
      parts = []; rings = [];
      placeFood();
      watch.reset();
      syncUi();
      syncBest();
      draw(nowMs());
      showIdle();
    }
    function countdown() {
      state = 'count';
      var n = 3;
      function beat() {
        if (disposed || !host.isConnected) return;
        if (n > 0) {
          showCard(ov, '<div class="gu-count">' + n + '</div>', 'is-count');
          S.count();
          n--;
          later(beat, 620);
        } else {
          hideCard(ov);
          state = 'run';
          last = null;
          acc = 0;
          S.go();
        }
      }
      beat();
    }
    function startGame() {
      clearTimers();
      pal = palette();
      hideCard(ov);
      score = 0; foods = 0; stepMs = diff.ms; acc = 0;
      snake = [[9, 10], [8, 10], [7, 10]];
      dir = [1, 0]; queued = [1, 0];
      parts = []; rings = [];
      placeFood();
      watch.begin();
      syncUi();
      draw(nowMs());
      countdown();
    }
    function togglePause() {
      if (state === 'run') {
        state = 'pause';
        watch.pause();
        acc = 0;
        showCard(ov,
          '<div class="gu-card gu-card-slim">' +
            '<h3>已暂停</h3>' +
            '<div class="gu-sub">按空格或点击下方按钮继续</div>' +
            '<div class="gu-btn-row">' +
              '<button type="button" class="btn btn-primary btn-sm" data-gu="resume">继续游戏</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重新开始</button>' +
            '</div>' +
          '</div>');
      } else if (state === 'pause') {
        hideCard(ov);
        state = 'run';
        watch.start();
        last = null;
      }
    }
    function showEnd(ms, improved) {
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>游戏结束</h3>' +
          '<div class="gu-sub">' + (foods > 0 ? '这一局吃到 ' + foods + ' 个食物' : '下一局会更好') + '</div>' +
          statHTML([
            ['本局得分', score],
            ['最高分', bestNow()],
            ['存活用时', fmtMs(ms)],
            ['吃到食物', foods + ' 个']
          ]) +
          (improved ? '<div class="gu-badge">刷新最佳记录</div>' : '') +
          '<div class="gu-btn-row">' +
            '<button type="button" class="btn btn-primary" data-gu="again">再来一局</button>' +
            '<button type="button" class="btn btn-ghost" data-gu="example">返回示例</button>' +
          '</div>' +
        '</div>');
    }
    function turn(name) {
      if (state !== 'run' && state !== 'count' && state !== 'pause') return;
      var map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      var v = map[name];
      if (!v) return;
      if (v[0] === -dir[0] && v[1] === -dir[1]) return;
      if (v[0] === dir[0] && v[1] === dir[1]) return;
      queued = v;
    }
    function onClick(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var chip = t.closest('[data-diff]');
      if (chip) {
        var key = chip.getAttribute('data-diff');
        for (var i = 0; i < DIFFS.length; i++) if (DIFFS[i].key === key) diff = DIFFS[i];
        if (state === 'idle') showIdle();
        return;
      }
      var dirBtn = t.closest('[data-dir]');
      if (dirBtn) { turn(dirBtn.getAttribute('data-dir')); return; }
      var btn = t.closest('[data-gu]');
      if (!btn) return;
      var act = btn.getAttribute('data-gu');
      if (act === 'start' || act === 'again' || act === 'restart') startGame();
      else if (act === 'pause' || act === 'resume') togglePause();
      else if (act === 'example') toIdle();
      else if (act === 'sound') { toggleSound(); syncSound(host); if (soundOn) S.tick(); }
    }
    function onKey(e) {
      var raw = e.key || '';
      var k = raw.toLowerCase();
      var map = {
        arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
        arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right'
      };
      if (map[k]) {
        if (state === 'idle' || state === 'over') return;
        e.preventDefault();
        turn(map[k]);
        return;
      }
      if (raw === ' ' || k === ' ') {
        if (state === 'idle' || state === 'over') { e.preventDefault(); startGame(); return; }
        if (state === 'run' || state === 'pause') { e.preventDefault(); togglePause(); }
        return;
      }
      if (k === 'enter' && (state === 'idle' || state === 'over')) {
        e.preventDefault();
        startGame();
      }
    }

    host.addEventListener('click', onClick);
    var unbind = bindKeys(host, onKey, null);
    api.onCleanup(function () {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      clearTimers();
      unbind();
      host.removeEventListener('click', onClick);
    });

    toIdle();
    raf = requestAnimationFrame(loop);
  }});

  /* ============================================================
     五、2048 小游戏
     ============================================================ */
  R('2048 小游戏', { render: function (host, api) {
    var LIGHT = { 2: '#eef2ec', 4: '#dee9e1', 8: '#c6dbcf', 16: '#a9cbb7', 32: '#8bb89f', 64: '#6ba184', 128: '#4e8a70', 256: '#3a705c', 512: '#8a641f', 1024: '#9d5b35', 2048: '#a5452f' };
    var DARK = { 2: '#232821', 4: '#2c332b', 8: '#3b4b41', 16: '#4d6554', 32: '#5f7d68', 64: '#72957c', 128: '#86ab90', 256: '#93c4ab', 512: '#c6a767', 1024: '#d09367', 2048: '#e08c74' };

    host.innerHTML =
      '<div class="gu-layout"><div class="gu-main">' +
      '<div class="gu-toolbar">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重新开始</button>' +
        '<span class="cp-note">方向键 / WASD 移动 · 触屏滑动棋盘 · 相同数字相撞合并</span>' +
      '</div>' +
      '<div class="gu-score">' +
        '<div><b data-ui="score">0</b><span>得分</span></div>' +
        '<div><b data-ui="best">0</b><span>最高分</span></div>' +
        '<div><b data-ui="moves">0</b><span>步数</span></div>' +
        '<div><b data-ui="time">00:00</b><span>用时</span></div>' +
      '</div>' +
      '<div class="game-center"><div class="gu-play">' +
        '<div class="gu-stage"><div class="gu-2048" data-board></div></div>' +
        '<div class="gu-overlay" hidden></div>' +
      '</div></div>' +
      '<div class="gu-pad">' +
        '<button type="button" class="gu-pad-btn gu-pad-up" data-dir="up" aria-label="上移">↑</button>' +
        '<button type="button" class="gu-pad-btn gu-pad-left" data-dir="left" aria-label="左移">←</button>' +
        '<span class="gu-pad-mid">滑动</span>' +
        '<button type="button" class="gu-pad-btn gu-pad-right" data-dir="right" aria-label="右移">→</button>' +
        '<button type="button" class="gu-pad-btn gu-pad-down" data-dir="down" aria-label="下移">↓</button>' +
      '</div>' +
      '</div>' +
      '<aside class="gu-info">' +
        infoCard('玩法说明', '<p>方向键推动全部方块，相同数字相撞合并；合出 2048 后仍可继续，棋盘塞满且无法合并才结束。</p>') +
        infoCard('操作', infoOps([
          ['移动', '↑ ↓ ← → 或 W A S D'],
          ['触屏', '直接在棋盘上滑动'],
          ['手机', '画布下方四向按钮']
        ])) +
        infoCard('本次成绩', infoRows([
          ['得分', 'score', '0'],
          ['最大数字', 'max', '0'],
          ['步数', 'moves', '0'],
          ['用时', 'time', '00:00']
        ])) +
        infoCard('最高记录', infoRows([
          ['最高分', 'best', '—'],
          ['玩过局数', 'plays', '0']
        ])) +
      '</aside>' +
      '</div>';

    var play = qs(host, '.gu-play');
    var ov = qs(play, '.gu-overlay');
    var board = qs(host, '[data-board]');
    var ui = {
      score: qs(host, '[data-ui="score"]'),
      best: qs(host, '[data-ui="best"]'),
      moves: qs(host, '[data-ui="moves"]'),
      time: qs(host, '[data-ui="time"]')
    };

    var state = 'idle';
    var grid = [];
    var score = 0, moves = 0, reached2048 = false;
    var storedBest = bestOf('2048 小游戏', 'bestScore');
    var watch = stopwatch();
    var disposed = false, timers = [];

    function later(fn, ms) {
      var id = setTimeout(function () {
        if (!disposed && host.isConnected) fn();
      }, ms);
      timers.push(id);
      return id;
    }
    function clearTimers() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
    }
    function maxTile() {
      var m = 0, r, c;
      for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) if (grid[r][c] > m) m = grid[r][c];
      return m;
    }
    function tileColors(v) {
      var dark = isDark();
      var bg = (dark ? DARK : LIGHT)[v] || (dark ? '#2c332b' : '#c6dbcf');
      var fg = dark ? (v >= 512 ? '#12140f' : '#e9e9e1') : (v <= 64 ? '#1b1c18' : '#fdfdf8');
      return { bg: bg, fg: fg };
    }
    function render(newPos, merged) {
      var dark = isDark();
      board.innerHTML = '';
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          var v = grid[r][c];
          var d = document.createElement('div');
          d.className = 'gu-tile' + (v ? '' : ' is-empty');
          if (v) {
            var col = tileColors(v);
            d.style.background = col.bg;
            d.style.color = col.fg;
            d.style.borderColor = dark ? 'rgba(238,238,230,.08)' : 'rgba(27,28,24,.07)';
            d.textContent = String(v);
            if (v >= 1024) d.className += ' is-tiny';
            else if (v >= 128) d.className += ' is-small';
            if (newPos && newPos[0] === r && newPos[1] === c) d.className += ' is-new';
            if (merged && merged.indexOf(r + ',' + c) >= 0) d.className += ' is-merged';
          }
          board.appendChild(d);
        }
      }
    }
    function syncUi() {
      ui.score.textContent = String(score);
      ui.best.textContent = String(Math.max(storedBest || 0, score));
      ui.moves.textContent = String(moves);
      setSide(host, 'score', score);
      setSide(host, 'max', maxTile());
      setSide(host, 'moves', moves);
    }
    function syncBest() {
      var rec = readRecords()['2048 小游戏'] || {};
      setSide(host, 'best', rec.bestScore == null ? '—' : rec.bestScore);
      setSide(host, 'plays', rec.plays || 0);
    }
    function addRandom() {
      var free = [], r, c;
      for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) if (!grid[r][c]) free.push([r, c]);
      if (!free.length) return null;
      var p = free[Math.floor(Math.random() * free.length)];
      grid[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
      return p;
    }
    function canMove() {
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          if (!grid[r][c]) return true;
          if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
          if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
        }
      }
      return false;
    }
    function linesOf(dir) {
      var out = [], i, r, c;
      if (dir === 'left' || dir === 'right') {
        for (r = 0; r < 4; r++) {
          var row = [];
          for (i = 0; i < 4; i++) row.push(dir === 'left' ? [r, i] : [r, 3 - i]);
          out.push(row);
        }
      } else {
        for (c = 0; c < 4; c++) {
          var col = [];
          for (i = 0; i < 4; i++) col.push(dir === 'up' ? [i, c] : [3 - i, c]);
          out.push(col);
        }
      }
      return out;
    }
    function move(dir) {
      if (state !== 'run') return false;
      var ls = linesOf(dir);
      var changed = false, gained = 0, merged = [];
      for (var li = 0; li < ls.length; li++) {
        var line = ls[li], vals = [], i;
        for (i = 0; i < line.length; i++) {
          var v = grid[line[i][0]][line[i][1]];
          if (v) vals.push(v);
        }
        var outVals = [], merges = [];
        for (i = 0; i < vals.length; i++) {
          if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
            outVals.push(vals[i] * 2);
            merges.push(true);
            gained += vals[i] * 2;
            i++;
          } else {
            outVals.push(vals[i]);
            merges.push(false);
          }
        }
        for (i = 0; i < line.length; i++) {
          var nv = i < outVals.length ? outVals[i] : 0;
          if (grid[line[i][0]][line[i][1]] !== nv) changed = true;
          grid[line[i][0]][line[i][1]] = nv;
          if (i < merges.length && merges[i]) merged.push(line[i][0] + ',' + line[i][1]);
        }
      }
      if (!changed) { S.tick(); return false; }
      score += gained;
      moves++;
      var spawnPos = addRandom();
      render(spawnPos, merged);
      syncUi();
      if (gained) S.merge();
      if (maxTile() >= 2048 && !reached2048) {
        reached2048 = true;
        banner(play, '达成 2048');
        S.win();
        T.toast('达成 2048，还能继续冲高分');
      }
      if (!canMove()) endGame();
      return true;
    }
    function showIdle() {
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>2048</h3>' +
          '<div class="gu-sub">方向键 / WASD 推动所有方块，相同数字相撞合并；触屏可直接滑动棋盘。无路可走时结束。</div>' +
          '<div class="gu-best"><span>最高分</span><b>' + (storedBest == null ? '—' : storedBest) + '</b></div>' +
          '<div class="gu-btn-row"><button type="button" class="btn btn-primary" data-gu="start">开始</button></div>' +
          '<div class="gu-keys"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> 或 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 · 手机上直接滑动</div>' +
        '</div>');
    }
    function toIdle() {
      clearTimers();
      state = 'idle';
      grid = [];
      for (var r = 0; r < 4; r++) grid.push([0, 0, 0, 0]);
      score = 0; moves = 0; reached2048 = false;
      watch.reset();
      render();
      syncUi();
      syncBest();
      ui.time.textContent = '00:00';
      setSide(host, 'time', '00:00');
      showIdle();
    }
    function startGame() {
      clearTimers();
      hideCard(ov);
      grid = [];
      for (var r = 0; r < 4; r++) grid.push([0, 0, 0, 0]);
      score = 0; moves = 0; reached2048 = false;
      state = 'run';
      addRandom();
      addRandom();
      render();
      syncUi();
      watch.begin();
      ui.time.textContent = '00:00';
      setSide(host, 'time', '00:00');
      syncBest();
      S.go();
    }
    function endGame() {
      state = 'over';
      watch.pause();
      S.lose();
      flashNow(play);
      var ms = watch.elapsed();
      var out = saveRecord('2048 小游戏', { score: score, timeMs: ms, result: 'lose' });
      storedBest = out.rec.bestScore;
      syncUi();
      syncBest();
      ui.time.textContent = fmtMs(ms);
      setSide(host, 'time', fmtMs(ms));
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>无路可走</h3>' +
          '<div class="gu-sub">' + (maxTile() >= 2048 ? '已经合出 2048，成绩很漂亮。' : '棋盘已满且无法合并。') + '</div>' +
          statHTML([
            ['本局得分', score],
            ['最高分', Math.max(storedBest || 0, score)],
            ['最大数字', maxTile()],
            ['用时', fmtMs(ms)]
          ]) +
          (out.improved ? '<div class="gu-badge">刷新最佳记录</div>' : '') +
          '<div class="gu-btn-row">' +
            '<button type="button" class="btn btn-primary" data-gu="again">再来一局</button>' +
            '<button type="button" class="btn btn-ghost" data-gu="example">返回示例</button>' +
          '</div>' +
        '</div>');
    }
    function onClick(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var dirBtn = t.closest('[data-dir]');
      if (dirBtn) { move(dirBtn.getAttribute('data-dir')); return; }
      var btn = t.closest('[data-gu]');
      if (!btn) return;
      var act = btn.getAttribute('data-gu');
      if (act === 'start' || act === 'again' || act === 'restart') startGame();
      else if (act === 'example') toIdle();
    }
    function onKey(e) {
      var raw = e.key || '';
      var k = raw.toLowerCase();
      var map = {
        arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
        arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right'
      };
      if (map[k]) {
        if (state !== 'run') return;
        e.preventDefault();
        move(map[k]);
        return;
      }
      if ((k === 'enter' || raw === ' ' || k === ' ') && (state === 'idle' || state === 'over')) {
        e.preventDefault();
        startGame();
      }
    }
    /* 触屏滑动 */
    var touch = { x: 0, y: 0, on: false, moved: false };
    function onTouchStart(e) {
      if (e.touches.length !== 1) return;
      touch.x = e.touches[0].clientX;
      touch.y = e.touches[0].clientY;
      touch.on = true;
      touch.moved = false;
    }
    function onTouchMove(e) {
      if (!touch.on || e.touches.length !== 1) return;
      var t = e.touches[0];
      var dx = t.clientX - touch.x, dy = t.clientY - touch.y;
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
      if (touch.moved || Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      touch.moved = true;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
    }
    function onTouchEnd() { touch.on = false; }

    var hudTimer = setInterval(function () {
      if (!host.isConnected) { clearInterval(hudTimer); return; }
      if (state === 'run') {
        ui.time.textContent = fmtMs(watch.elapsed());
        setSide(host, 'time', fmtMs(watch.elapsed()));
      }
    }, 250);

    host.addEventListener('click', onClick);
    play.addEventListener('touchstart', onTouchStart, { passive: true });
    play.addEventListener('touchmove', onTouchMove, { passive: false });
    play.addEventListener('touchend', onTouchEnd, { passive: true });
    var unbind = bindKeys(host, onKey, null);
    api.onCleanup(function () {
      disposed = true;
      clearTimers();
      clearInterval(hudTimer);
      unbind();
      host.removeEventListener('click', onClick);
      play.removeEventListener('touchstart', onTouchStart);
      play.removeEventListener('touchmove', onTouchMove);
      play.removeEventListener('touchend', onTouchEnd);
    });

    toIdle();
  }});

  /* ============================================================
     六、打砖块
     ============================================================ */
  R('打砖块', { render: function (host, api) {
    var W = 420, H = 340;
    var LEVELS = [
      { rows: 3, cols: 7, speed: 250, paddle: 80, holes: null },
      { rows: 4, cols: 8, speed: 285, paddle: 74, holes: function (r, c) { return (r === 1 || r === 3) && c % 3 === 1; } },
      { rows: 5, cols: 8, speed: 320, paddle: 68, holes: function (r, c) { return r > 0 && (c + r) % 4 === 0; } }
    ];

    host.innerHTML =
      '<div class="gu-layout"><div class="gu-main">' +
      '<div class="gu-toolbar">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="pause">暂停</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重开</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="sound">音效 开</button>' +
        '<span class="cp-note">← → / A D 或鼠标移动挡板 · 空格 发射</span>' +
      '</div>' +
      '<div class="gu-score">' +
        '<div><b data-ui="score">0</b><span>得分</span></div>' +
        '<div><b class="gu-lives"><i class="gu-life"></i><i class="gu-life"></i><i class="gu-life"></i></b><span>生命</span></div>' +
        '<div><b data-ui="level">1</b><span>关卡</span></div>' +
        '<div><b data-ui="best">0</b><span>最高分</span></div>' +
        '<div><b data-ui="time">00:00</b><span>用时</span></div>' +
      '</div>' +
      '<div class="game-center"><div class="gu-play">' +
        '<div class="gu-stage is-touch"><canvas width="' + W + '" height="' + H + '" data-cv></canvas></div>' +
        '<div class="gu-flash"></div>' +
        '<div class="gu-overlay" hidden></div>' +
      '</div></div>' +
      '<div class="gu-pad-row">' +
        '<button type="button" class="gu-pad-btn" data-pad="left" aria-label="挡板左移">←</button>' +
        '<button type="button" class="gu-pad-btn" data-gu="launch">发射</button>' +
        '<button type="button" class="gu-pad-btn" data-pad="right" aria-label="挡板右移">→</button>' +
      '</div>' +
      '</div>' +
      '<aside class="gu-info">' +
        infoCard('玩法说明', '<p>清空全部砖块过关，共 3 关；砖块布局、球速与挡板宽度逐关变化。球落底扣 1 条命，3 条命用完结束。</p>') +
        infoCard('操作', infoOps([
          ['挡板', '← → 或 A D，也可用鼠标'],
          ['发射', '空格'],
          ['触屏', '拖动挡板 / 下方按钮']
        ])) +
        infoCard('本次成绩', infoRows([
          ['得分', 'score', '0'],
          ['生命', 'lives', '3'],
          ['关卡', 'level', '1'],
          ['用时', 'time', '00:00']
        ])) +
        infoCard('最高记录', infoRows([
          ['最高分', 'best', '—'],
          ['通关次数', 'wins', '0']
        ])) +
      '</aside>' +
      '</div>';

    var play = qs(host, '.gu-play');
    var ov = qs(play, '.gu-overlay');
    var cv = qs(host, '[data-cv]');
    var cx = cv.getContext('2d');
    var ui = {
      score: qs(host, '[data-ui="score"]'),
      level: qs(host, '[data-ui="level"]'),
      best: qs(host, '[data-ui="best"]'),
      time: qs(host, '[data-ui="time"]'),
      lives: qsa(host, '.gu-life')
    };

    var pal = palette();
    var state = 'idle';
    var score = 0, lives = 3, level = 1;
    var storedBest = bestOf('打砖块', 'bestScore');
    var paddle = { x: W / 2 - 40, y: H - 30, w: 80, h: 10, squash: 0 };
    var ball = { x: W / 2, y: 0, r: 7, vx: 0, vy: 0, stuck: true };
    var bricks = [], parts = [], trail = [];
    var keys = { left: false, right: false };
    var raf = 0, last = null, lastHud = 0;
    var watch = stopwatch();
    var disposed = false, timers = [];

    function later(fn, ms) {
      var id = setTimeout(function () {
        if (!disposed && host.isConnected) fn();
      }, ms);
      timers.push(id);
      return id;
    }
    function clearTimers() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
    }
    function rowColor(row) {
      var cols = [pal.accent, pal.warn, pal.accent2, pal.err, pal.good];
      return cols[row % cols.length];
    }
    function syncUi() {
      ui.score.textContent = String(score);
      ui.level.textContent = String(level);
      ui.best.textContent = String(Math.max(storedBest || 0, score));
      ui.time.textContent = fmtMs(watch.elapsed());
      for (var i = 0; i < ui.lives.length; i++) {
        ui.lives[i].className = 'gu-life' + (i < lives ? '' : ' off');
      }
      setSide(host, 'score', score);
      setSide(host, 'lives', lives);
      setSide(host, 'level', level);
      setSide(host, 'time', fmtMs(watch.elapsed()));
    }
    function syncBest() {
      var rec = readRecords()['打砖块'] || {};
      setSide(host, 'best', rec.bestScore == null ? '—' : rec.bestScore);
      setSide(host, 'wins', rec.wins || 0);
    }
    function buildLevel() {
      var cfg = LEVELS[level - 1];
      bricks = [];
      var padX = 14, gap = 5, bh = 15, top = 42;
      var bw = (W - padX * 2 - gap * (cfg.cols - 1)) / cfg.cols;
      for (var r = 0; r < cfg.rows; r++) {
        for (var c = 0; c < cfg.cols; c++) {
          if (cfg.holes && cfg.holes(r, c)) continue;
          bricks.push({ x: padX + c * (bw + gap), y: top + r * (bh + 6), w: bw, h: bh, row: r, alive: true });
        }
      }
      paddle.w = cfg.paddle;
      paddle.x = (W - paddle.w) / 2;
      paddle.y = H - 30;
      paddle.h = 10;
    }
    function resetBall() {
      ball.stuck = true;
      ball.vx = 0; ball.vy = 0;
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 2;
      trail = [];
    }
    function spawnDebris(x, y, col) {
      for (var i = 0; i < 9; i++) {
        var a = Math.random() * Math.PI * 2;
        var sp = 40 + Math.random() * 130;
        parts.push({
          x: x, y: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
          s: 2 + Math.random() * 3,
          life: 320 + Math.random() * 260,
          max: 580,
          c: col
        });
      }
    }
    function updateFx(dt) {
      var sec = dt / 1000, i;
      for (i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx * sec;
        p.y += p.vy * sec;
        p.vy += 620 * sec;
        p.life -= dt;
        if (p.life <= 0) parts.splice(i, 1);
      }
    }
    function launch() {
      if (state !== 'run' || !ball.stuck) return;
      var sp = LEVELS[level - 1].speed;
      var a = (Math.random() - 0.5) * 0.7;
      ball.vx = Math.sin(a) * sp;
      ball.vy = -Math.cos(a) * sp;
      ball.stuck = false;
      S.launch();
    }
    function draw() {
      var i, r;
      cx.clearRect(0, 0, W, H);
      cx.fillStyle = pal.surface2;
      cx.fillRect(0, 0, W, H);
      cx.strokeStyle = pal.dark ? 'rgba(238,238,230,.12)' : 'rgba(27,28,24,.12)';
      cx.lineWidth = 1;
      cx.strokeRect(0.5, 0.5, W - 1, H - 1);

      for (i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        if (!b.alive) continue;
        cx.fillStyle = rowColor(b.row);
        cx.fillRect(b.x, b.y, b.w, b.h);
        cx.strokeStyle = pal.dark ? 'rgba(16,19,16,.32)' : 'rgba(255,255,255,.34)';
        cx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      }

      for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        cx.globalAlpha = Math.max(0, p.life / p.max);
        cx.fillStyle = p.c;
        cx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      cx.globalAlpha = 1;

      var sq = paddle.squash;
      var pw = paddle.w * (1 + 0.07 * sq);
      var ph = paddle.h * (1 - 0.28 * sq);
      var px = paddle.x + (paddle.w - pw) / 2;
      var py = paddle.y + (paddle.h - ph);
      cx.fillStyle = pal.accent;
      cx.beginPath();
      var rad = 4;
      cx.moveTo(px + rad, py);
      cx.lineTo(px + pw - rad, py);
      cx.quadraticCurveTo(px + pw, py, px + pw, py + rad);
      cx.lineTo(px + pw, py + ph);
      cx.lineTo(px, py + ph);
      cx.lineTo(px, py + rad);
      cx.quadraticCurveTo(px, py, px + rad, py);
      cx.closePath();
      cx.fill();

      for (i = 0; i < trail.length; i++) {
        var tr = trail[i];
        cx.globalAlpha = 0.06 + (i / Math.max(1, trail.length)) * 0.26;
        cx.fillStyle = pal.accent2;
        cx.beginPath();
        cx.arc(tr.x, tr.y, ball.r * (0.5 + i / Math.max(1, trail.length) * 0.5), 0, Math.PI * 2);
        cx.fill();
      }
      cx.globalAlpha = 1;
      cx.fillStyle = pal.accent;
      cx.beginPath();
      cx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      cx.fill();
      cx.strokeStyle = pal.dark ? 'rgba(16,19,16,.3)' : 'rgba(255,255,255,.4)';
      cx.beginPath();
      cx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      cx.stroke();
      r = 0;
    }
    function aliveCount() {
      var n = 0;
      for (var i = 0; i < bricks.length; i++) if (bricks[i].alive) n++;
      return n;
    }
    function loseLife() {
      lives--;
      syncUi();
      S.life();
      flashNow(play);
      shakeNow(play);
      trail = [];
      if (lives <= 0) { endGame('lose'); return; }
      resetBall();
    }
    function levelClear() {
      score += 50 * level;
      syncUi();
      S.clear();
      if (level >= LEVELS.length) { endGame('win'); return; }
      level++;
      buildLevel();
      resetBall();
      banner(play, '第 ' + level + ' 关');
      S.go();
    }
    function endGame(result) {
      if (state === 'over') return;
      state = 'over';
      watch.pause();
      if (result === 'win') S.win();
      else S.lose();
      var ms = watch.elapsed();
      var out = saveRecord('打砖块', { score: score, timeMs: ms, result: result });
      storedBest = out.rec.bestScore;
      syncUi();
      syncBest();
      ui.time.textContent = fmtMs(ms);
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>' + (result === 'win' ? '三关通关' : '挑战失败') + '</h3>' +
          '<div class="gu-sub">' + (result === 'win' ? '三关全部清空，手感不错。' : '撑到第 ' + level + ' 关，球掉光了。') + '</div>' +
          statHTML([
            ['本局得分', score],
            ['剩余生命', lives + ' / 3'],
            ['到达关卡', '第 ' + level + ' 关'],
            ['用时', fmtMs(ms)],
            ['最高分', Math.max(storedBest || 0, score)]
          ]) +
          (out.improved ? '<div class="gu-badge">刷新最佳记录</div>' : '') +
          '<div class="gu-btn-row">' +
            '<button type="button" class="btn btn-primary" data-gu="again">再来一局</button>' +
            '<button type="button" class="btn btn-ghost" data-gu="example">返回示例</button>' +
          '</div>' +
        '</div>');
    }
    function update(dt) {
      var sec = Math.min(dt, 40) / 1000;
      var cfg = LEVELS[level - 1];
      if (keys.left) paddle.x -= 320 * sec;
      if (keys.right) paddle.x += 320 * sec;
      paddle.x = clamp(paddle.x, 6, W - paddle.w - 6);
      if (paddle.squash > 0) paddle.squash = Math.max(0, paddle.squash - sec * 4.5);

      if (ball.stuck) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 2;
        return;
      }

      ball.x += ball.vx * sec;
      ball.y += ball.vy * sec;

      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); S.hit(); }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); S.hit(); }
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); S.hit(); }

      if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h &&
          ball.x >= paddle.x - 4 && ball.x <= paddle.x + paddle.w + 4) {
        ball.y = paddle.y - ball.r - 0.5;
        var off = clamp((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1);
        var sp = cfg.speed;
        var ang = off * 1.05;
        ball.vx = Math.sin(ang) * sp;
        ball.vy = -Math.cos(ang) * sp;
        paddle.squash = 1;
        S.paddle();
      }

      trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 9) trail.shift();

      for (var i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.alive = false;
          var nx = clamp(ball.x, b.x, b.x + b.w);
          var ny = clamp(ball.y, b.y, b.y + b.h);
          if (Math.abs(ball.x - nx) > Math.abs(ball.y - ny)) ball.vx = -ball.vx;
          else ball.vy = -ball.vy;
          score += 10 * level;
          spawnDebris(b.x + b.w / 2, b.y + b.h / 2, rowColor(b.row));
          S.brick();
          syncUi();
          break;
        }
      }

      if (ball.y - ball.r > H) { loseLife(); return; }
      if (aliveCount() === 0) {
        levelClear();
        draw();
      }
    }
    function loop(ts) {
      if (disposed) return;
      if (!host.isConnected) { cancelAnimationFrame(raf); raf = 0; return; }
      raf = requestAnimationFrame(loop);
      if (last == null) last = ts;
      var dt = Math.min(80, ts - last);
      last = ts;
      if (state === 'run') {
        update(dt);
        if (ts - lastHud > 240) {
          lastHud = ts;
          ui.time.textContent = fmtMs(watch.elapsed());
          setSide(host, 'time', fmtMs(watch.elapsed()));
        }
      }
      updateFx(dt);
      draw();
    }
    function showIdle() {
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>打砖块</h3>' +
          '<div class="gu-sub">清空全部砖块过关，共 3 关；球落底扣 1 条命，3 条命用完结束。</div>' +
          '<div class="gu-best"><span>最高分</span><b>' + (storedBest == null ? '—' : storedBest) + '</b></div>' +
          '<div class="gu-btn-row"><button type="button" class="btn btn-primary" data-gu="start">开始游戏</button></div>' +
          '<div class="gu-keys"><kbd>←</kbd><kbd>→</kbd> 或 <kbd>A</kbd><kbd>D</kbd> 移动挡板 · <kbd>空格</kbd> 发射 · <kbd>P</kbd> 暂停</div>' +
        '</div>');
    }
    function startGame() {
      clearTimers();
      pal = palette();
      hideCard(ov);
      score = 0; lives = 3; level = 1;
      parts = []; trail = [];
      keys.left = false; keys.right = false;
      state = 'run';
      buildLevel();
      resetBall();
      watch.begin();
      syncUi();
      syncBest();
      draw();
      S.go();
    }
    function togglePause() {
      if (state === 'run') {
        state = 'pause';
        watch.pause();
        keys.left = false; keys.right = false;
        showCard(ov,
          '<div class="gu-card gu-card-slim">' +
            '<h3>已暂停</h3>' +
            '<div class="gu-sub">按 P 或点击下方按钮继续</div>' +
            '<div class="gu-btn-row">' +
              '<button type="button" class="btn btn-primary btn-sm" data-gu="resume">继续游戏</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重新开始</button>' +
            '</div>' +
          '</div>');
      } else if (state === 'pause') {
        hideCard(ov);
        state = 'run';
        watch.start();
        last = null;
      }
    }
    function onClick(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest('[data-gu]');
      if (!btn) return;
      var act = btn.getAttribute('data-gu');
      if (act === 'start' || act === 'again' || act === 'restart') startGame();
      else if (act === 'pause' || act === 'resume') togglePause();
      else if (act === 'launch') { if (state === 'idle') startGame(); launch(); }
      else if (act === 'example') toIdle();
      else if (act === 'sound') { toggleSound(); syncSound(host); if (soundOn) S.tick(); }
    }
    function toIdle() {
      clearTimers();
      state = 'idle';
      score = 0; lives = 3; level = 1;
      keys.left = false; keys.right = false;
      parts = []; trail = [];
      buildLevel();
      resetBall();
      watch.reset();
      syncUi();
      syncBest();
      ui.time.textContent = '00:00';
      draw();
      showIdle();
    }
    function onKey(e) {
      var raw = e.key || '';
      var k = raw.toLowerCase();
      if (raw === ' ' || k === ' ') {
        e.preventDefault();
        if (state === 'idle') { startGame(); launch(); return; }
        if (state === 'run') launch();
        return;
      }
      if (k === 'p') { e.preventDefault(); togglePause(); return; }
      if (k === 'enter' && (state === 'idle' || state === 'over')) { e.preventDefault(); startGame(); return; }
      if (k === 'arrowleft' || k === 'a') { if (state === 'run') { e.preventDefault(); keys.left = true; } return; }
      if (k === 'arrowright' || k === 'd') { if (state === 'run') { e.preventDefault(); keys.right = true; } return; }
    }
    function onKeyUp(e) {
      var raw = e.key || '';
      var k = raw.toLowerCase();
      if (k === 'arrowleft' || k === 'a') keys.left = false;
      if (k === 'arrowright' || k === 'd') keys.right = false;
    }
    function movePaddleTo(clientX) {
      var rect = cv.getBoundingClientRect();
      if (!rect.width) return;
      paddle.x = clamp((clientX - rect.left) * W / rect.width - paddle.w / 2, 6, W - paddle.w - 6);
    }
    function onMouseMove(e) { movePaddleTo(e.clientX); }
    function onTouchMovePaddle(e) {
      if (!e.touches.length) return;
      e.preventDefault();
      movePaddleTo(e.touches[0].clientX);
    }
    function onPadDown(side) {
      return function (e) {
        e.preventDefault();
        if (state !== 'run') return;
        if (side === 'left') keys.left = true; else keys.right = true;
      };
    }
    function onPadUp(side) {
      return function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (side === 'left') keys.left = false; else keys.right = false;
      };
    }
    var padLeft = qs(host, '[data-pad="left"]');
    var padRight = qs(host, '[data-pad="right"]');
    if (padLeft) {
      padLeft.addEventListener('pointerdown', onPadDown('left'));
      padLeft.addEventListener('pointerup', onPadUp('left'));
      padLeft.addEventListener('pointercancel', onPadUp('left'));
      padLeft.addEventListener('pointerleave', onPadUp('left'));
    }
    if (padRight) {
      padRight.addEventListener('pointerdown', onPadDown('right'));
      padRight.addEventListener('pointerup', onPadUp('right'));
      padRight.addEventListener('pointercancel', onPadUp('right'));
      padRight.addEventListener('pointerleave', onPadUp('right'));
    }

    host.addEventListener('click', onClick);
    cv.addEventListener('mousemove', onMouseMove);
    cv.addEventListener('touchmove', onTouchMovePaddle, { passive: false });
    var unbind = bindKeys(host, onKey, onKeyUp);
    api.onCleanup(function () {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      clearTimers();
      unbind();
      host.removeEventListener('click', onClick);
      cv.removeEventListener('mousemove', onMouseMove);
      cv.removeEventListener('touchmove', onTouchMovePaddle);
    });

    toIdle();
    raf = requestAnimationFrame(loop);
  }});

  /* ============================================================
     七、俄罗斯方块
     ============================================================ */
  R('俄罗斯方块', { render: function (host, api) {
    var COLS = 10, ROWS = 20, CELL = 26, W = COLS * CELL, H = ROWS * CELL;
    var LIGHT_COLORS = [null, '#2d5c4d', '#4c7f6d', '#8a641f', '#a5452f', '#3f6b5d', '#7a6438', '#466a72'];
    var DARK_COLORS = [null, '#93c4ab', '#b8dcc9', '#d9ac5f', '#e08c74', '#8fb8a4', '#c9b073', '#9db7bd'];
    var PIECES = [
      { m: [[1, 1, 1, 1]] },
      { m: [[1, 1], [1, 1]] },
      { m: [[0, 1, 0], [1, 1, 1]] },
      { m: [[1, 0, 0], [1, 1, 1]] },
      { m: [[0, 0, 1], [1, 1, 1]] },
      { m: [[1, 1, 0], [0, 1, 1]] },
      { m: [[0, 1, 1], [1, 1, 0]] }
    ];

    host.innerHTML =
      '<div class="gu-layout"><div class="gu-main">' +
      '<div class="gu-toolbar">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="pause">暂停（P）</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重开（R）</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="sound">音效 开</button>' +
        '<span class="cp-note">← → 移动 · ↑ 旋转 · ↓ 软降 · 空格 硬降 · P 暂停</span>' +
      '</div>' +
      '<div class="game-center"><div class="gu-play"><div class="gu-tetris">' +
        '<div class="gu-stage"><canvas width="' + W + '" height="' + H + '" data-cv></canvas></div>' +
        '<div class="gu-side">' +
          '<div class="gu-mini"><span>下一块</span><canvas width="88" height="88" data-next></canvas></div>' +
        '</div>' +
      '</div><div class="gu-flash"></div><div class="gu-overlay" hidden></div></div></div>' +
      '<div class="gu-pad-row">' +
        '<button type="button" class="gu-pad-btn" data-tet="left" aria-label="左移">←</button>' +
        '<button type="button" class="gu-pad-btn" data-tet="rotate" aria-label="旋转">旋转</button>' +
        '<button type="button" class="gu-pad-btn" data-tet="right" aria-label="右移">→</button>' +
        '<button type="button" class="gu-pad-btn" data-tet="down" aria-label="软降">↓</button>' +
        '<button type="button" class="gu-pad-btn" data-tet="drop" aria-label="硬降">直落</button>' +
      '</div>' +
      '</div>' +
      '<aside class="gu-info">' +
        infoCard('玩法说明', '<p>方块堆到顶部即结束；消除行数越多等级越高，下落也更快。下一块预览在棋盘右侧。</p>') +
        infoCard('操作', infoOps([
          ['移动', '← → 或 A D'],
          ['旋转', '↑ 或 W'],
          ['下落', '↓ 软降 · 空格 硬降'],
          ['其他', 'P 暂停 · R 重开']
        ])) +
        infoCard('本次成绩', infoRows([
          ['分数', 'score', '0'],
          ['消除行', 'lines', '0'],
          ['等级', 'level', '1'],
          ['用时', 'time', '00:00']
        ])) +
        infoCard('最高记录', infoRows([
          ['最高分', 'best', '—'],
          ['玩过局数', 'plays', '0']
        ])) +
      '</aside>' +
      '</div>';

    var play = qs(host, '.gu-play');
    var ov = qs(play, '.gu-overlay');
    var cv = qs(host, '[data-cv]');
    var cx = cv.getContext('2d');
    var nextCv = qs(host, '[data-next]');
    var ncx = nextCv.getContext('2d');

    var pal = palette();
    var board = [];
    var piece = null, nextIdx = -1, bag = [];
    var score = 0, lines = 0, level = 1, dropMs = 620;
    var state = 'idle';
    var acc = 0, raf = 0, last = null, lastHud = 0;
    var clearing = [], clearT = 0, lockCells = null, lockT = 0;
    var watch = stopwatch();
    var storedBest = bestOf('俄罗斯方块', 'bestScore');
    var disposed = false, timers = [];

    function later(fn, ms) {
      var id = setTimeout(function () {
        if (!disposed && host.isConnected) fn();
      }, ms);
      timers.push(id);
      return id;
    }
    function clearTimers() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
    }
    function newRow() {
      var row = [];
      for (var c = 0; c < COLS; c++) row.push(0);
      return row;
    }
    function emptyBoard() {
      var b = [];
      for (var r = 0; r < ROWS; r++) b.push(newRow());
      return b;
    }
    function colorOf(idx) {
      return (pal.dark ? DARK_COLORS : LIGHT_COLORS)[idx] || pal.accent;
    }
    function syncUi() {
      setSide(host, 'score', score);
      setSide(host, 'lines', lines);
      setSide(host, 'level', level);
      setSide(host, 'time', fmtMs(watch.elapsed()));
    }
    function syncBest() {
      var rec = readRecords()['俄罗斯方块'] || {};
      setSide(host, 'best', rec.bestScore == null ? '—' : rec.bestScore);
      setSide(host, 'plays', rec.plays || 0);
    }
    function refillBag() {
      var ids = [0, 1, 2, 3, 4, 5, 6];
      for (var i = ids.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = ids[i]; ids[i] = ids[j]; ids[j] = t;
      }
      bag = bag.concat(ids);
    }
    function takeIdx() {
      if (!bag.length) refillBag();
      return bag.shift();
    }
    function collide(m, x, y) {
      for (var r = 0; r < m.length; r++) {
        for (var c = 0; c < m[r].length; c++) {
          if (!m[r][c]) continue;
          var bx = x + c, by = y + r;
          if (bx < 0 || bx >= COLS || by >= ROWS) return true;
          if (by >= 0 && board[by][bx]) return true;
        }
      }
      return false;
    }
    function rotateM(m) {
      var out = [];
      for (var c = 0; c < m[0].length; c++) {
        var row = [];
        for (var r = m.length - 1; r >= 0; r--) row.push(m[r][c]);
        out.push(row);
      }
      return out;
    }
    function block(x, y, idx, scale) {
      var s = scale == null ? 1 : scale;
      var w = (CELL - 2) * s, h = (CELL - 2) * s;
      var bx = x * CELL + 1 + (CELL - 2 - w) / 2;
      var by = y * CELL + 1 + (CELL - 2 - h) / 2;
      cx.fillStyle = colorOf(idx);
      cx.fillRect(bx, by, w, h);
      cx.strokeStyle = 'rgba(255,255,255,.26)';
      cx.lineWidth = 1;
      cx.strokeRect(bx + 0.5, by + 0.5, Math.max(1, w - 1), Math.max(1, h - 1));
    }
    function drawNext() {
      ncx.clearRect(0, 0, 88, 88);
      if (nextIdx < 0) return;
      var m = PIECES[nextIdx].m;
      var size = 18;
      var ox = Math.floor((88 - m[0].length * size) / 2);
      var oy = Math.floor((88 - m.length * size) / 2);
      for (var r = 0; r < m.length; r++) {
        for (var c = 0; c < m[r].length; c++) {
          if (!m[r][c]) continue;
          var bx = ox + c * size, by = oy + r * size;
          ncx.fillStyle = colorOf(nextIdx + 1);
          ncx.fillRect(bx + 1, by + 1, size - 2, size - 2);
          ncx.strokeStyle = 'rgba(255,255,255,.26)';
          ncx.strokeRect(bx + 1.5, by + 1.5, size - 3, size - 3);
        }
      }
    }
    function draw(ts) {
      var t = ts || 0, r, c;
      cx.clearRect(0, 0, W, H);
      cx.fillStyle = pal.surface2;
      cx.fillRect(0, 0, W, H);

      cx.strokeStyle = pal.dark ? 'rgba(238,238,230,.05)' : 'rgba(27,28,24,.05)';
      cx.lineWidth = 1;
      for (c = 0; c <= COLS; c++) {
        cx.beginPath(); cx.moveTo(c * CELL + 0.5, 0); cx.lineTo(c * CELL + 0.5, H); cx.stroke();
      }
      for (r = 0; r <= ROWS; r++) {
        cx.beginPath(); cx.moveTo(0, r * CELL + 0.5); cx.lineTo(W, r * CELL + 0.5); cx.stroke();
      }

      var lockMap = null;
      if (lockT > 0 && lockCells) {
        lockMap = {};
        for (var i = 0; i < lockCells.length; i++) lockMap[lockCells[i][0] + ',' + lockCells[i][1]] = 1;
      }
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) {
          if (!board[r][c]) continue;
          var sc = 1;
          if (lockMap && lockMap[c + ',' + r]) sc = 0.84 + 0.16 * (1 - lockT / 150);
          block(c, r, board[r][c], sc);
        }
      }

      if (piece) {
        var gy = piece.y;
        while (!collide(piece.m, piece.x, gy + 1)) gy++;
        if (gy !== piece.y) {
          cx.globalAlpha = 0.2;
          for (r = 0; r < piece.m.length; r++) {
            for (c = 0; c < piece.m[r].length; c++) {
              if (!piece.m[r][c]) continue;
              block(piece.x + c, gy + r, piece.c, 1);
            }
          }
          cx.globalAlpha = 1;
        }
        for (r = 0; r < piece.m.length; r++) {
          for (c = 0; c < piece.m[r].length; c++) {
            if (!piece.m[r][c]) continue;
            block(piece.x + c, piece.y + r, piece.c, 1);
          }
        }
      }

      if (clearing.length) {
        var alpha = 0.3 + 0.6 * Math.abs(Math.sin(t / 55));
        cx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
        for (var k = 0; k < clearing.length; k++) {
          cx.fillRect(0, clearing[k] * CELL, W, CELL);
        }
      }
    }
    function spawn() {
      if (nextIdx < 0) nextIdx = takeIdx();
      var idx = nextIdx;
      nextIdx = takeIdx();
      var def = PIECES[idx];
      piece = {
        m: def.m.map(function (row) { return row.slice(); }),
        c: idx + 1,
        x: Math.floor((COLS - def.m[0].length) / 2),
        y: 0
      };
      acc = 0;
      drawNext();
      if (collide(piece.m, piece.x, piece.y)) {
        piece = null;
        gameOver();
      }
    }
    function lockPiece() {
      var cells = [];
      for (var r = 0; r < piece.m.length; r++) {
        for (var c = 0; c < piece.m[r].length; c++) {
          if (!piece.m[r][c]) continue;
          var by = piece.y + r, bx = piece.x + c;
          if (by >= 0) {
            board[by][bx] = piece.c;
            cells.push([bx, by]);
          }
        }
      }
      lockCells = cells;
      lockT = 150;
      S.land();
      piece = null;
      var full = [];
      for (var rr = 0; rr < ROWS; rr++) {
        var complete = true;
        for (var cc = 0; cc < COLS; cc++) if (!board[rr][cc]) { complete = false; break; }
        if (complete) full.push(rr);
      }
      if (full.length) {
        clearing = full;
        clearT = 240;
        S.line();
      } else {
        spawn();
      }
      syncUi();
    }
    function finishClear() {
      var n = clearing.length;
      var kept = [];
      for (var r = 0; r < board.length; r++) {
        var complete = true;
        for (var c = 0; c < COLS; c++) if (!board[r][c]) { complete = false; break; }
        if (!complete) kept.push(board[r]);
      }
      var add = ROWS - kept.length;
      for (var i = 0; i < add; i++) kept.unshift(newRow());
      board = kept;
      clearing = [];
      clearT = 0;

      if (n > 0) {
        var table = [0, 100, 300, 500, 800];
        score += (table[n] || n * 200) * level;
        lines += n;
        level = Math.floor(lines / 10) + 1;
        dropMs = Math.max(130, 620 - (level - 1) * 55);
        S.clear();
      }
      syncUi();
      spawn();
    }
    function gameOver() {
      state = 'over';
      watch.pause();
      S.lose();
      flashNow(play);
      shakeNow(play);
      var ms = watch.elapsed();
      var out = saveRecord('俄罗斯方块', { score: score, timeMs: ms, result: 'lose' });
      storedBest = out.rec.bestScore;
      syncUi();
      syncBest();
      draw(nowMs());
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>堆满了</h3>' +
          '<div class="gu-sub">方块顶到天花板，这一局结束。</div>' +
          statHTML([
            ['本局得分', score],
            ['消除行数', lines + ' 行'],
            ['达到等级', '等级 ' + level],
            ['用时', fmtMs(ms)],
            ['最高分', Math.max(storedBest || 0, score)]
          ]) +
          (out.improved ? '<div class="gu-badge">刷新最佳记录</div>' : '') +
          '<div class="gu-btn-row">' +
            '<button type="button" class="btn btn-primary" data-gu="again">再来一局</button>' +
            '<button type="button" class="btn btn-ghost" data-gu="example">返回示例</button>' +
          '</div>' +
        '</div>');
    }
    function gravity() {
      if (!piece) return;
      if (!collide(piece.m, piece.x, piece.y + 1)) {
        piece.y++;
      } else {
        lockPiece();
      }
    }
    function act(type) {
      if (state === 'run' && piece) {
        if (type === 'left') {
          if (!collide(piece.m, piece.x - 1, piece.y)) { piece.x--; S.tick(); }
          return;
        }
        if (type === 'right') {
          if (!collide(piece.m, piece.x + 1, piece.y)) { piece.x++; S.tick(); }
          return;
        }
        if (type === 'rotate') {
          var m = rotateM(piece.m);
          var kicks = [0, -1, 1, -2, 2];
          for (var i = 0; i < kicks.length; i++) {
            if (!collide(m, piece.x + kicks[i], piece.y)) {
              piece.m = m;
              piece.x += kicks[i];
              S.tick();
              break;
            }
          }
          return;
        }
        if (type === 'down') {
          if (!collide(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 1; syncUi(); }
          else lockPiece();
          acc = 0;
          return;
        }
        if (type === 'drop') {
          var d = 0;
          while (!collide(piece.m, piece.x, piece.y + 1)) { piece.y++; d++; }
          score += d * 2;
          syncUi();
          lockPiece();
        }
      }
    }
    function loop(ts) {
      if (disposed) return;
      if (!host.isConnected) { cancelAnimationFrame(raf); raf = 0; return; }
      raf = requestAnimationFrame(loop);
      if (last == null) last = ts;
      var dt = Math.min(80, ts - last);
      last = ts;
      if (state === 'run') {
        if (clearT > 0) {
          clearT -= dt;
          if (clearT <= 0) finishClear();
        } else {
          acc += dt;
          var guard = 0;
          while (acc >= dropMs && state === 'run' && !clearing.length && guard < 3) {
            acc -= dropMs;
            guard++;
            gravity();
          }
          if (lockT > 0) lockT = Math.max(0, lockT - dt);
        }
        if (ts - lastHud > 240) {
          lastHud = ts;
          setSide(host, 'time', fmtMs(watch.elapsed()));
        }
      }
      draw(ts);
    }
    function showIdle() {
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>俄罗斯方块</h3>' +
          '<div class="gu-sub">方块堆到顶部即结束；消除行数越多等级越高，下落也更快。</div>' +
          '<div class="gu-best"><span>最高分</span><b>' + (storedBest == null ? '—' : storedBest) + '</b></div>' +
          '<div class="gu-btn-row"><button type="button" class="btn btn-primary" data-gu="start">开始游戏</button></div>' +
          '<div class="gu-keys"><kbd>←</kbd><kbd>→</kbd> 移动 · <kbd>↑</kbd> 旋转 · <kbd>↓</kbd> 软降 · <kbd>空格</kbd> 硬降 · <kbd>P</kbd> 暂停 · <kbd>R</kbd> 重开</div>' +
        '</div>');
    }
    function startGame() {
      clearTimers();
      pal = palette();
      hideCard(ov);
      board = emptyBoard();
      score = 0; lines = 0; level = 1; dropMs = 620;
      acc = 0; clearing = []; clearT = 0; lockCells = null; lockT = 0;
      bag = []; nextIdx = -1; piece = null;
      state = 'run';
      watch.begin();
      syncUi();
      syncBest();
      spawn();
      S.go();
    }
    function togglePause() {
      if (state === 'run') {
        state = 'pause';
        watch.pause();
        showCard(ov,
          '<div class="gu-card gu-card-slim">' +
            '<h3>已暂停</h3>' +
            '<div class="gu-sub">按 P 或点击下方按钮继续</div>' +
            '<div class="gu-btn-row">' +
              '<button type="button" class="btn btn-primary btn-sm" data-gu="resume">继续游戏</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重新开始</button>' +
            '</div>' +
          '</div>');
      } else if (state === 'pause') {
        hideCard(ov);
        state = 'run';
        watch.start();
        last = null;
      }
    }
    function onClick(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var tet = t.closest('[data-tet]');
      if (tet) { act(tet.getAttribute('data-tet')); return; }
      var btn = t.closest('[data-gu]');
      if (!btn) return;
      var a = btn.getAttribute('data-gu');
      if (a === 'start' || a === 'again' || a === 'restart') startGame();
      else if (a === 'pause' || a === 'resume') togglePause();
      else if (a === 'example') toIdle();
      else if (a === 'sound') { toggleSound(); syncSound(host); if (soundOn) S.tick(); }
    }
    function toIdle() {
      clearTimers();
      state = 'idle';
      board = emptyBoard();
      score = 0; lines = 0; level = 1; dropMs = 620;
      acc = 0; clearing = []; clearT = 0; lockCells = null; lockT = 0;
      bag = []; nextIdx = -1; piece = null;
      watch.reset();
      syncUi();
      syncBest();
      draw(nowMs());
      showIdle();
    }
    function onKey(e) {
      var raw = e.key || '';
      var k = raw.toLowerCase();
      if (state === 'idle' || state === 'over') {
        if (k === 'enter' || raw === ' ' || k === ' ') { e.preventDefault(); startGame(); }
        return;
      }
      if (k === 'r') { e.preventDefault(); startGame(); return; }
      if (k === 'p') { e.preventDefault(); togglePause(); return; }
      if (state !== 'run') return;
      if (k === 'arrowleft' || k === 'a') { e.preventDefault(); act('left'); return; }
      if (k === 'arrowright' || k === 'd') { e.preventDefault(); act('right'); return; }
      if (k === 'arrowdown' || k === 's') { e.preventDefault(); act('down'); return; }
      if (k === 'arrowup' || k === 'w') { e.preventDefault(); act('rotate'); return; }
      if (raw === ' ' || k === ' ') { e.preventDefault(); act('drop'); }
    }

    host.addEventListener('click', onClick);
    var unbind = bindKeys(host, onKey, null);
    api.onCleanup(function () {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      clearTimers();
      unbind();
      host.removeEventListener('click', onClick);
    });

    toIdle();
    raf = requestAnimationFrame(loop);
  }});

  /* ============================================================
     八、记忆翻牌
     ============================================================ */
  R('记忆翻牌', { render: function (host, api) {
    var DIFFS = [
      { key: 'm4', label: '4 × 4', cols: 4, pairs: 8 },
      { key: 'm5', label: '5 × 4', cols: 5, pairs: 10 },
      { key: 'm6', label: '6 × 6', cols: 6, pairs: 18 }
    ];
    var SYMBOLS = ['◆', '●', '▲', '■', '★', '✦', '✚', '◈', '◇', '○', '△', '□', '✜', '✤', '⬢', '⟡', '✶', '⬟'];

    host.innerHTML =
      '<div class="gu-layout"><div class="gu-main">' +
      '<div class="gu-toolbar">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="restart">重新开始</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-gu="sound">音效 开</button>' +
        '<span class="cp-note">翻开两张相同的牌即可配对 · 翻牌次数越少越好</span>' +
      '</div>' +
      '<div class="gu-score">' +
        '<div><b data-ui="time">00:00</b><span>用时</span></div>' +
        '<div><b data-ui="moves">0</b><span>翻牌次数</span></div>' +
        '<div><b data-ui="left">0</b><span>剩余配对</span></div>' +
      '</div>' +
      '<div class="game-center"><div class="gu-play">' +
        '<div class="gu-stage"><div class="gu-flip-board" data-board style="--cols:4"></div></div>' +
        '<div class="gu-overlay" hidden></div>' +
      '</div></div>' +
      '</div>' +
      '<aside class="gu-info">' +
        infoCard('玩法说明', '<p>翻开两张牌，图案相同即配对成功；配对后卡片短暂高亮并上浮。翻牌次数越少、用时越短越好。</p>') +
        infoCard('操作', infoOps([
          ['翻牌', '点击 / 轻触卡片'],
          ['难度', '开始界面可选 4×4、5×4、6×6'],
          ['记录', '最少翻牌与最快用时']
        ])) +
        infoCard('本次成绩', infoRows([
          ['用时', 'time', '00:00'],
          ['翻牌次数', 'moves', '0'],
          ['剩余配对', 'left', '0']
        ])) +
        infoCard('最高记录', infoRows([
          ['最少翻牌', 'best', '—'],
          ['最快用时', 'besttime', '—']
        ])) +
      '</aside>' +
      '</div>';

    var play = qs(host, '.gu-play');
    var ov = qs(play, '.gu-overlay');
    var board = qs(host, '[data-board]');
    var ui = {
      time: qs(host, '[data-ui="time"]'),
      moves: qs(host, '[data-ui="moves"]'),
      left: qs(host, '[data-ui="left"]')
    };

    var diff = DIFFS[0];
    var deck = [], cards = [], open = [], matched = [];
    var moves = 0, state = 'idle', lock = false;
    var watch = stopwatch();
    var storedBest = bestOf('记忆翻牌', 'bestScore');
    var storedTime = bestOf('记忆翻牌', 'bestTime');
    var disposed = false, timers = [];

    function later(fn, ms) {
      var id = setTimeout(function () {
        if (!disposed && host.isConnected) fn();
      }, ms);
      timers.push(id);
      return id;
    }
    function clearTimers() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
    }
    function matchedCount() {
      var n = 0;
      for (var i = 0; i < matched.length; i++) if (matched[i]) n++;
      return n;
    }
    function syncUi() {
      ui.time.textContent = fmtMs(watch.elapsed());
      ui.moves.textContent = String(moves);
      ui.left.textContent = String(Math.max(0, deck.length / 2 - matchedCount() / 2));
      setSide(host, 'time', fmtMs(watch.elapsed()));
      setSide(host, 'moves', moves);
      setSide(host, 'left', Math.max(0, deck.length / 2 - matchedCount() / 2));
    }
    function syncBest() {
      var rec = readRecords()['记忆翻牌'] || {};
      setSide(host, 'best', rec.bestScore == null ? '—' : rec.bestScore);
      setSide(host, 'besttime', rec.bestTime == null ? '—' : fmtMs(rec.bestTime));
    }
    function buildBoard() {
      board.style.setProperty('--cols', String(diff.cols));
      board.innerHTML = '';
      cards = [];
      for (var i = 0; i < deck.length; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'gu-flip';
        b.setAttribute('data-i', String(i));
        b.setAttribute('aria-label', '第 ' + (i + 1) + ' 张牌');
        b.innerHTML = '<span class="gu-flip-inner">' +
          '<span class="gu-flip-face gu-flip-front"></span>' +
          '<span class="gu-flip-face gu-flip-back">' + deck[i] + '</span>' +
          '</span>';
        board.appendChild(b);
        cards.push(b);
      }
    }
    function flip(i) {
      if (state !== 'run' || lock) return;
      if (open.indexOf(i) >= 0 || matched[i]) return;
      if (open.length >= 2) return;
      open.push(i);
      cards[i].classList.add('is-open');
      S.flip();
      if (open.length < 2) return;
      moves++;
      syncUi();
      var a = open[0], b = open[1];
      if (deck[a] === deck[b]) {
        matched[a] = true;
        matched[b] = true;
        cards[a].classList.add('is-matched');
        cards[b].classList.add('is-matched');
        open = [];
        S.match();
        syncUi();
        if (matchedCount() === deck.length) win();
      } else {
        lock = true;
        later(function () {
          cards[a].classList.remove('is-open');
          cards[b].classList.remove('is-open');
          open = [];
          lock = false;
        }, 620);
      }
    }
    function showIdle() {
      var chips = '';
      for (var i = 0; i < DIFFS.length; i++) {
        var d = DIFFS[i];
        chips += '<button type="button" class="gu-chip' + (d.key === diff.key ? ' is-on' : '') + '" data-diff="' + d.key + '">' + d.label + '</button>';
      }
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>记忆翻牌</h3>' +
          '<div class="gu-sub">翻开两张相同的牌配对；翻牌次数越少、用时越短越好。</div>' +
          '<div class="gu-best"><span>最少翻牌</span><b>' + (storedBest == null ? '—' : storedBest) + '</b><span>最快</span><b>' + (storedTime == null ? '—' : fmtMs(storedTime)) + '</b></div>' +
          '<div class="gu-chips">' + chips + '</div>' +
          '<div class="gu-btn-row"><button type="button" class="btn btn-primary" data-gu="start">开始</button></div>' +
        '</div>');
      syncSound(host);
    }
    function toIdle() {
      clearTimers();
      state = 'idle';
      lock = false;
      deck = [];
      matched = [];
      open = [];
      moves = 0;
      watch.reset();
      buildBoard();
      syncUi();
      syncBest();
      showIdle();
    }
    function startGame() {
      clearTimers();
      hideCard(ov);
      var pool = SYMBOLS.slice(0, diff.pairs);
      deck = pool.concat(pool);
      for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
      open = [];
      matched = [];
      for (var k = 0; k < deck.length; k++) matched.push(false);
      moves = 0;
      lock = false;
      state = 'run';
      buildBoard();
      syncUi();
      syncBest();
      watch.begin();
      S.go();
    }
    function win() {
      state = 'over';
      watch.pause();
      S.win();
      var ms = Math.round(watch.elapsed());
      var out = saveRecord('记忆翻牌', { score: moves, timeMs: ms, result: 'win', lowerBetter: true });
      storedBest = out.rec.bestScore;
      storedTime = out.rec.bestTime;
      syncUi();
      syncBest();
      showCard(ov,
        '<div class="gu-card">' +
          '<h3>全部配对完成</h3>' +
          '<div class="gu-sub">规则：翻牌次数越少越好，用时越短越好。</div>' +
          statHTML([
            ['用时', fmtMs(ms)],
            ['翻牌次数', moves + ' 次'],
            ['卡片数量', deck.length + ' 张'],
            ['最少翻牌记录', storedBest == null ? '—' : storedBest + ' 次']
          ]) +
          (out.improved ? '<div class="gu-badge">刷新最佳记录</div>' : '') +
          '<div class="gu-btn-row">' +
            '<button type="button" class="btn btn-primary" data-gu="again">再来一局</button>' +
            '<button type="button" class="btn btn-ghost" data-gu="example">换难度</button>' +
          '</div>' +
        '</div>');
    }
    function onClick(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var card = t.closest('.gu-flip');
      if (card && board.contains(card)) {
        flip(Number(card.getAttribute('data-i')));
        return;
      }
      var chip = t.closest('[data-diff]');
      if (chip) {
        var key = chip.getAttribute('data-diff');
        for (var i = 0; i < DIFFS.length; i++) if (DIFFS[i].key === key) diff = DIFFS[i];
        if (state === 'idle') showIdle();
        return;
      }
      var btn = t.closest('[data-gu]');
      if (!btn) return;
      var act = btn.getAttribute('data-gu');
      if (act === 'start' || act === 'again' || act === 'restart') startGame();
      else if (act === 'example') toIdle();
      else if (act === 'sound') { toggleSound(); syncSound(host); if (soundOn) S.tick(); }
    }

    var hudTimer = setInterval(function () {
      if (!host.isConnected) { clearInterval(hudTimer); return; }
      if (state === 'run') {
        ui.time.textContent = fmtMs(watch.elapsed());
        setSide(host, 'time', fmtMs(watch.elapsed()));
      }
    }, 250);

    host.addEventListener('click', onClick);
    api.onCleanup(function () {
      disposed = true;
      clearTimers();
      clearInterval(hudTimer);
      host.removeEventListener('click', onClick);
    });

    toIdle();
  }});

})();
