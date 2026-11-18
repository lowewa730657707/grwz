/* ============================================================
   棋类游戏（覆盖式注册）
   ------------------------------------------------------------
   象棋 / 国际象棋 / 五子棋 / 黑白棋 / 井字棋
   纯手写规则 + 纯色界面，不使用任何渐变、不使用 emoji 图标。
   战绩写入 localStorage['toolbox_game_records_v1']。
   ============================================================ */
(function () {
  'use strict';

  var T = window.TOOLKIT;
  if (!T || typeof T.register !== 'function') return;
  var R = T.register;

  var REC_KEY = 'toolbox_game_records_v1';
  var SND_KEY = 'toolbox_game_sound_v1';
  var MATE = 1000000;

  /* ============================================================
     一、通用工具
     ============================================================ */
  function qs(root, sel) { return root ? root.querySelector(sel) : null; }
  function qsa(root, sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }
  function setText(root, sel, v) {
    var el = qs(root, sel);
    if (el) el.textContent = String(v == null ? '' : v);
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtMs(ms) {
    var s = Math.max(0, Math.floor((ms || 0) / 1000));
    return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
  }
  function other(s) { return s === 'r' ? 'b' : s === 'b' ? 'r' : (s === 'w' ? 'b' : 'w'); }
  function sideNameCN(s) { return s === 'r' || s === 'w' ? (s === 'r' ? '红方' : '白方') : (s === 'b' ? '黑方' : ''); }
  function num(v) { return Math.round((v || 0) * 10) / 10; }

  function readRecords() {
    try {
      var v = JSON.parse(localStorage.getItem(REC_KEY) || '{}');
      return v && typeof v === 'object' ? v : {};
    } catch (e) { return {}; }
  }
  function writeRecords(v) {
    try { localStorage.setItem(REC_KEY, JSON.stringify(v)); } catch (e) { /* 隐私模式忽略 */ }
  }
  function saveRecord(name, opt) {
    opt = opt || {};
    var all = readRecords();
    var r = all[name] || {};
    if (r.wins == null) r.wins = 0;
    if (r.losses == null) r.losses = 0;
    if (r.draws == null) r.draws = 0;
    if (!Object.prototype.hasOwnProperty.call(r, 'bestScore')) r.bestScore = null;
    if (!Object.prototype.hasOwnProperty.call(r, 'bestTime')) r.bestTime = null;
    r.plays = (r.plays || 0) + 1;
    var result = opt.result || 'win';
    if (result === 'win') r.wins++;
    else if (result === 'lose') r.losses++;
    else r.draws++;

    var improved = false;
    var sc = opt.scoreWins ? (result === 'win' ? r.wins : null) : opt.score;
    if (sc != null && isFinite(sc)) {
      if (r.bestScore == null || sc > r.bestScore) { r.bestScore = sc; improved = true; }
    }
    var ms = Math.max(0, Math.round(opt.timeMs || 0));
    if (ms > 0 && result === 'win') {
      if (r.bestTime == null || ms < r.bestTime) { r.bestTime = ms; improved = true; }
    }
    r.lastTime = ms;
    r.updated = Date.now();
    all[name] = r;
    writeRecords(all);
    if (improved) T.toast('刷新最佳记录');
    return r;
  }
  function updateRecordCard(host, name, unit) {
    var r = readRecords()[name] || {};
    setText(host, '[data-gb-plays]', r.plays || 0);
    setText(host, '[data-gb-wins]', r.wins || 0);
    setText(host, '[data-gb-losses]', r.losses || 0);
    setText(host, '[data-gb-draws]', r.draws || 0);
    setText(host, '[data-gb-besttime]', r.bestTime != null ? fmtMs(r.bestTime) : '—');
    var bs = '—';
    if (r.bestScore != null) bs = num(r.bestScore) + (unit ? ' ' + unit : '');
    setText(host, '[data-gb-bestscore]', bs);
  }
  function markThis(host, label, timeText) {
    setText(host, '[data-gb-this]', label || '未开始');
    if (timeText != null) setText(host, '[data-gb-thisms]', timeText);
  }

  /* ============================================================
     二、界面骨架
     ============================================================ */
  function recordCardHTML() {
    return '<div class="sys-card gb-score">' +
      '<div class="sys-title">成绩记录</div>' +
      '<div class="gb-score-now"><span>本次</span><b data-gb-this>未开始</b><i data-gb-thisms>00:00</i></div>' +
      '<div class="gb-score-grid">' +
        '<div class="gb-score-cell"><span>场次</span><b data-gb-plays>0</b></div>' +
        '<div class="gb-score-cell"><span>胜</span><b data-gb-wins>0</b></div>' +
        '<div class="gb-score-cell"><span>负</span><b data-gb-losses>0</b></div>' +
        '<div class="gb-score-cell"><span>平</span><b data-gb-draws>0</b></div>' +
        '<div class="gb-score-cell"><span>最高记录</span><b data-gb-bestscore>—</b></div>' +
        '<div class="gb-score-cell"><span>最快胜局</span><b data-gb-besttime>—</b></div>' +
      '</div>' +
      '<div class="gb-score-foot">记录保存在本机浏览器</div>' +
    '</div>';
  }
  function infoCardHTML(title, rows) {
    var h = '<div class="sys-card"><div class="sys-title">' + title + '</div><div class="gb-kv">';
    for (var i = 0; i < rows.length; i++) {
      h += '<div class="gb-kv-row"><span>' + rows[i][0] + '</span><b' +
        (rows[i][1] ? ' data-gb-info="' + rows[i][1] + '"' : '') + '>' + rows[i][2] + '</b></div>';
    }
    return h + '</div></div>';
  }
  function helpCardHTML(rows) {
    var h = '<div class="sys-card gb-help"><div class="sys-title">操作说明</div><ul class="gb-help-list">';
    for (var i = 0; i < rows.length; i++) {
      h += '<li><span class="k">' + rows[i][0] + '</span><span>' + rows[i][1] + '</span></li>';
    }
    return h + '</ul></div>';
  }
  function layoutHTML(o) {
    return '<div class="gb-layout">' +
      '<div class="gb-main">' +
        '<div class="gb-result" data-gb-result role="status" aria-live="polite" hidden>' +
          '<div class="gb-result-text"><span class="gb-result-kicker">对局结束</span>' +
          '<b data-gb-result-title>—</b><span data-gb-result-detail></span></div>' +
          '<button type="button" class="btn btn-primary btn-sm" data-gb-again>再来一局</button>' +
        '</div>' +
        '<div class="gb-hud">' +
          '<div class="gb-hud-cell"><span>用时</span><b data-gb-time>00:00</b></div>' +
          (o.hud || '') +
          '<div class="gb-hud-actions"><button type="button" class="btn btn-ghost btn-sm" data-gb-sound>音效 开</button></div>' +
        '</div>' +
        '<div class="gb-board-wrap">' + o.board + '</div>' +
        '<div class="gb-toolbar">' + o.toolbar + '</div>' +
        '<div class="gb-status" data-gb-status aria-live="polite">' + (o.status || '') + '</div>' +
      '</div>' +
      '<aside class="gb-side">' + recordCardHTML() + (o.side || '') + helpCardHTML(o.help || []) + '</aside>' +
    '</div>';
  }
  function setStatus(host, text, kind) {
    var el = qs(host, '[data-gb-status]');
    if (!el) return;
    el.textContent = text;
    el.className = 'gb-status' + (kind ? ' is-' + kind : '');
  }
  function showResult(host, kind, title, detail) {
    var el = qs(host, '[data-gb-result]');
    if (!el) return;
    setText(el, '[data-gb-result-title]', title);
    setText(el, '[data-gb-result-detail]', detail || '');
    el.hidden = false;
    el.className = 'gb-result is-' + kind;
    void el.offsetWidth;
    el.classList.add('is-on');
  }
  function hideResult(host) {
    var el = qs(host, '[data-gb-result]');
    if (!el) return;
    el.hidden = true;
    el.className = 'gb-result';
    setText(el, '[data-gb-result-title]', '—');
    setText(el, '[data-gb-result-detail]', '');
  }
  function settle(host, name, opt) {
    var ms = Math.max(0, Math.round(opt.timeMs || 0));
    var detail = opt.detail || '';
    if (ms > 0) detail += (detail ? ' · ' : '') + '用时 ' + fmtMs(ms);
    markThis(host, opt.title, fmtMs(ms));
    showResult(host, opt.result, opt.title, detail);
    setStatus(host, '对局结束，点击「再来一局」继续。', '');
    if (opt.result === 'win') SFX.win();
    else if (opt.result === 'lose') SFX.lose();
    else SFX.draw();
    T.toast(opt.title, opt.result === 'lose' ? 'err' : '');
    saveRecord(name, {
      result: opt.result,
      timeMs: ms,
      score: opt.score,
      scoreWins: opt.scoreWins
    });
    updateRecordCard(host, name, opt.unit);
  }

  /* ============================================================
     三、计时器（首次落子才启动）
     ============================================================ */
  function makeClock(host) {
    var started = false, running = false, acc = 0, t0 = 0, timer = null;
    var el = qs(host, '[data-gb-time]');
    function paint() { if (el) el.textContent = fmtMs(elapsed()); }
    function elapsed() { return acc + (running ? Date.now() - t0 : 0); }
    function start() {
      if (running) return;
      if (!started) { started = true; acc = 0; }
      t0 = Date.now();
      running = true;
      if (!timer) timer = setInterval(function () {
        if (!host.isConnected) { stop(); return; }
        paint();
      }, 250);
      paint();
    }
    function stop() {
      if (running) { acc += Date.now() - t0; running = false; }
      if (timer) { clearInterval(timer); timer = null; }
      paint();
    }
    function reset() {
      stop();
      started = false;
      acc = 0;
      paint();
    }
    paint();
    return {
      start: start, stop: stop, reset: reset, elapsed: elapsed,
      hasStarted: function () { return started; }
    };
  }

  /* ============================================================
     四、WebAudio 合成音效（全局静音）
     ============================================================ */
  var soundOn = true;
  try { soundOn = localStorage.getItem(SND_KEY) !== 'off'; } catch (e) { /* noop */ }
  var actx = null;
  function saveSound() {
    try { localStorage.setItem(SND_KEY, soundOn ? 'on' : 'off'); } catch (e) { /* noop */ }
  }
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
  var SFX = {
    tick: function () { tone(540, 0.04, 'square', 0.045); },
    select: function () { tone(620, 0.045, 'sine', 0.06); },
    move: function () { tone(360, 0.06, 'triangle', 0.07); },
    capture: function () { tone(250, 0.06, 'square', 0.07); tone(170, 0.09, 'square', 0.06, 0.045); },
    castle: function () { tone(390, 0.05, 'triangle', 0.06); tone(500, 0.06, 'triangle', 0.06, 0.05); },
    check: function () { tone(760, 0.08, 'square', 0.06); tone(920, 0.09, 'square', 0.055, 0.09); },
    flip: function () { tone(420, 0.05, 'sine', 0.06); tone(660, 0.06, 'sine', 0.055, 0.05); },
    place: function () { tone(500, 0.045, 'triangle', 0.06); },
    invalid: function () { tone(190, 0.06, 'sawtooth', 0.045); },
    win: function () { tone(523, 0.1, 'triangle', 0.09); tone(659, 0.1, 'triangle', 0.085, 0.1); tone(784, 0.12, 'triangle', 0.085, 0.2); tone(1046, 0.2, 'triangle', 0.08, 0.32); },
    lose: function () { tone(320, 0.1, 'sawtooth', 0.075); tone(240, 0.13, 'sawtooth', 0.075, 0.1); tone(155, 0.22, 'sawtooth', 0.07, 0.23); },
    draw: function () { tone(440, 0.1, 'sine', 0.07); tone(440, 0.14, 'sine', 0.06, 0.14); }
  };
  function bindCommon(host, api, onAgain, onEsc) {
    var again = qs(host, '[data-gb-again]');
    if (again) again.onclick = function () { hideResult(host); onAgain(); };
    var snd = qs(host, '[data-gb-sound]');
    function sync() { if (snd) snd.textContent = soundOn ? '音效 开' : '音效 关'; }
    if (snd) snd.onclick = function () {
      soundOn = !soundOn;
      saveSound();
      sync();
      if (soundOn) SFX.tick();
    };
    sync();
    function key(e) {
      if (!host.isConnected) { document.removeEventListener('keydown', key); return; }
      var t = e.target;
      var tag = t && t.tagName ? String(t.tagName).toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      if (e.key === 'Escape' || e.key === 'Esc') {
        var handled = onEsc ? onEsc() : false;
        if (handled !== false) e.preventDefault();
      }
    }
    document.addEventListener('keydown', key);
    function off() { document.removeEventListener('keydown', key); }
    if (api && typeof api.onCleanup === 'function') api.onCleanup(off);
    else if (T.cleanups) T.cleanups.push(off);
  }

  /* ============================================================
     五、象棋
     ============================================================ */
  R('象棋', { render: function (host, api) {
    host.classList.add('gb-pane');

    var DIFFS = { normal: '普通', hard: '困难' };
    var PIECE_CN = { K: '帅', A: '仕', B: '相', N: '马', R: '车', C: '炮', P: '兵' };
    var PIECE_CN_B = { K: '将', A: '士', B: '象', N: '马', R: '车', C: '炮', P: '卒' };
    var VALUES = { K: 10000, R: 900, C: 450, N: 400, B: 200, A: 200, P: 100 };

    var boardEl, gridEl, cv, ctx;
    var board, turn, playerSide, diff, over, thinking;
    var selected = -1, targets = [], selMoves = [];
    var lastMove = null, hint = null, history = [], noCapture = 0;
    var aiTimer = null, aiToken = 0, clock;
    var statusOverride = null;
    var painting = false, raf = 0, ro = null, mo = null;

    host.innerHTML = layoutHTML({
      board: '<div class="gb-xq" data-gb-board><canvas class="gb-xq-canvas" data-gb-canvas aria-hidden="true"></canvas>' +
        '<div class="gb-xq-grid" data-gb-grid></div></div>',
      hud: '<div class="gb-hud-cell"><span>轮到</span><b data-gb-turn>红方</b></div>',
      toolbar: '<button type="button" class="btn btn-primary" data-gb-new>重新开始</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-undo>悔棋</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-switch>执红</button>' +
        '<select class="gb-select" data-gb-diff aria-label="难度"><option value="normal">普通</option><option value="hard">困难</option></select>' +
        '<button type="button" class="btn btn-ghost" data-gb-hint>提示</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-forfeit>认输</button>',
      side: infoCardHTML('对局信息', [
        ['执子', 'side', '红方（你）'],
        ['难度', 'diff', '普通'],
        ['行棋', 'turn', '红方'],
        ['最近一手', 'last', '—']
      ]) +
        '<div class="sys-card gb-legend"><div class="sys-title">棋子</div>' +
        '<div class="gb-legend-row"><span class="gb-legend-key">红</span><span>帅 仕 相 马 车 炮 兵</span></div>' +
        '<div class="gb-legend-row"><span class="gb-legend-key">黑</span><span>将 士 象 马 车 炮 卒</span></div>' +
        '<div class="gb-legend-note">马蹩腿、象塞眼、炮翻山；将帅不可照面。</div></div>',
      help: [
        ['选子', '点击棋子，所有合法落点会高亮'],
        ['走子', '点击高亮落点完成走子'],
        ['悔棋', '撤回你与电脑的上一回合'],
        ['认输', '直接结束本局并记录'],
        ['计时', '从你第一次落子才开始'],
        ['Esc', '取消当前选中']
      ],
      status: '轮到你走棋（红方）。点击棋子查看合法落点。'
    });

    boardEl = qs(host, '[data-gb-board]');
    gridEl = qs(host, '[data-gb-grid]');
    cv = qs(host, '[data-gb-canvas]');
    ctx = cv ? cv.getContext('2d') : null;
    clock = makeClock(host);
    if (api && typeof api.onCleanup === 'function') api.onCleanup(function () { clock.stop(); });

    /* ---------- 规则 ---------- */
    function initialBoard() {
      var b = new Array(90);
      var back = ['R', 'N', 'B', 'A', 'K', 'A', 'B', 'N', 'R'];
      var x, y;
      for (x = 0; x < 9; x++) {
        b[x] = { s: 'b', t: back[x] };
        b[81 + x] = { s: 'r', t: back[x] };
      }
      b[2 * 9 + 1] = { s: 'b', t: 'C' };
      b[2 * 9 + 7] = { s: 'b', t: 'C' };
      b[7 * 9 + 1] = { s: 'r', t: 'C' };
      b[7 * 9 + 7] = { s: 'r', t: 'C' };
      for (x = 0; x < 9; x += 2) {
        b[3 * 9 + x] = { s: 'b', t: 'P' };
        b[6 * 9 + x] = { s: 'r', t: 'P' };
      }
      return b;
    }
    function inB(x, y) { return x >= 0 && x < 9 && y >= 0 && y < 10; }
    function inPalace(s, x, y) {
      if (x < 3 || x > 5) return false;
      return s === 'r' ? (y >= 7 && y <= 9) : (y >= 0 && y <= 2);
    }
    function findKing(b, side) {
      for (var i = 0; i < 90; i++) {
        var p = b[i];
        if (p && p.s === side && p.t === 'K') return i;
      }
      return -1;
    }
    function isAttacked(b, idx, by) {
      var x = idx % 9, y = (idx / 9) | 0;
      var k = findKing(b, by);
      if (k >= 0) {
        var kx = k % 9, ky = (k / 9) | 0;
        if (Math.abs(kx - x) + Math.abs(ky - y) === 1) return true;
        if (kx === x) {
          var lo = Math.min(ky, y) + 1, hi = Math.max(ky, y), clear = true;
          for (var yy = lo; yy < hi; yy++) if (b[yy * 9 + x]) { clear = false; break; }
          if (clear) return true;
        }
      }
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var d = 0; d < 4; d++) {
        var dx = dirs[d][0], dy = dirs[d][1];
        var nx = x + dx, ny = y + dy, screen = false;
        while (inB(nx, ny)) {
          var p = b[ny * 9 + nx];
          if (p) {
            if (!screen) {
              if (p.s === by && p.t === 'R') return true;
              screen = true;
            } else {
              if (p.s === by && p.t === 'C') return true;
              break;
            }
          }
          nx += dx; ny += dy;
        }
      }
      var hOffs = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
      for (var h = 0; h < 8; h++) {
        var hx = x - hOffs[h][0], hy = y - hOffs[h][1];
        if (!inB(hx, hy)) continue;
        var hp = b[hy * 9 + hx];
        if (!hp || hp.s !== by || hp.t !== 'N') continue;
        var lx = Math.abs(hOffs[h][0]) === 2 ? hx + hOffs[h][0] / 2 : hx;
        var ly = Math.abs(hOffs[h][1]) === 2 ? hy + hOffs[h][1] / 2 : hy;
        if (!b[ly * 9 + lx]) return true;
      }
      if (by === 'r') {
        if (y + 1 < 10) {
          var p1 = b[(y + 1) * 9 + x];
          if (p1 && p1.s === 'r' && p1.t === 'P') return true;
        }
        if (y <= 4) {
          if (x > 0) { var p2 = b[y * 9 + x - 1]; if (p2 && p2.s === 'r' && p2.t === 'P') return true; }
          if (x < 8) { var p3 = b[y * 9 + x + 1]; if (p3 && p3.s === 'r' && p3.t === 'P') return true; }
        }
      } else {
        if (y - 1 >= 0) {
          var p4 = b[(y - 1) * 9 + x];
          if (p4 && p4.s === 'b' && p4.t === 'P') return true;
        }
        if (y >= 5) {
          if (x > 0) { var p5 = b[y * 9 + x - 1]; if (p5 && p5.s === 'b' && p5.t === 'P') return true; }
          if (x < 8) { var p6 = b[y * 9 + x + 1]; if (p6 && p6.s === 'b' && p6.t === 'P') return true; }
        }
      }
      return false;
    }
    function inCheck(b, side) {
      var k = findKing(b, side);
      if (k < 0) return true;
      return isAttacked(b, k, other(side));
    }
    function pushMove(b, side, list, f, t) {
      var p = b[f];
      if (!p || p.s !== side) return;
      if (!inB(t % 9, (t / 9) | 0)) return;
      var q = b[t];
      if (q && (q.s === side || q.t === 'K')) return;
      list.push({ f: f, t: t, cap: q || null });
    }
    function genPseudo(b, side) {
      var list = [];
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      var diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      var horse = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]];
      for (var i = 0; i < 90; i++) {
        var p = b[i];
        if (!p || p.s !== side) continue;
        var x = i % 9, y = (i / 9) | 0, k, nx, ny, d;
        if (p.t === 'K') {
          for (d = 0; d < 4; d++) {
            nx = x + dirs[d][0]; ny = y + dirs[d][1];
            if (inB(nx, ny) && inPalace(side, nx, ny)) pushMove(b, side, list, i, ny * 9 + nx);
          }
        } else if (p.t === 'A') {
          for (d = 0; d < 4; d++) {
            nx = x + diag[d][0]; ny = y + diag[d][1];
            if (inB(nx, ny) && inPalace(side, nx, ny)) pushMove(b, side, list, i, ny * 9 + nx);
          }
        } else if (p.t === 'B') {
          for (d = 0; d < 4; d++) {
            nx = x + diag[d][0] * 2; ny = y + diag[d][1] * 2;
            if (!inB(nx, ny)) continue;
            if (side === 'r' ? ny < 5 : ny > 4) continue;
            var eye = (y + diag[d][1]) * 9 + (x + diag[d][0]);
            if (!b[eye]) pushMove(b, side, list, i, ny * 9 + nx);
          }
        } else if (p.t === 'N') {
          for (d = 0; d < 8; d++) {
            nx = x + horse[d][0]; ny = y + horse[d][1];
            if (!inB(nx, ny)) continue;
            var legX = Math.abs(horse[d][0]) === 2 ? x + horse[d][0] / 2 : x;
            var legY = Math.abs(horse[d][1]) === 2 ? y + horse[d][1] / 2 : y;
            if (!b[legY * 9 + legX]) pushMove(b, side, list, i, ny * 9 + nx);
          }
        } else if (p.t === 'R') {
          for (d = 0; d < 4; d++) {
            nx = x + dirs[d][0]; ny = y + dirs[d][1];
            while (inB(nx, ny)) {
              var rq = b[ny * 9 + nx];
              if (!rq) pushMove(b, side, list, i, ny * 9 + nx);
              else { pushMove(b, side, list, i, ny * 9 + nx); break; }
              nx += dirs[d][0]; ny += dirs[d][1];
            }
          }
        } else if (p.t === 'C') {
          for (d = 0; d < 4; d++) {
            nx = x + dirs[d][0]; ny = y + dirs[d][1];
            var screen = false;
            while (inB(nx, ny)) {
              var cq = b[ny * 9 + nx];
              if (!screen) {
                if (!cq) pushMove(b, side, list, i, ny * 9 + nx);
                else screen = true;
              } else {
                if (cq) { pushMove(b, side, list, i, ny * 9 + nx); break; }
              }
              nx += dirs[d][0]; ny += dirs[d][1];
            }
          }
        } else if (p.t === 'P') {
          var pdir = side === 'r' ? -1 : 1;
          ny = y + pdir;
          if (inB(x, ny)) pushMove(b, side, list, i, ny * 9 + x);
          var crossed = side === 'r' ? y <= 4 : y >= 5;
          if (crossed) {
            if (x > 0) pushMove(b, side, list, i, y * 9 + x - 1);
            if (x < 8) pushMove(b, side, list, i, y * 9 + x + 1);
          }
        }
      }
      return list;
    }
    function legalMoves(b, side) {
      var ps = genPseudo(b, side), out = [];
      for (var i = 0; i < ps.length; i++) {
        var m = ps[i], cap = b[m.t], moving = b[m.f];
        b[m.t] = moving; b[m.f] = null;
        var ok = !inCheck(b, side);
        b[m.f] = b[m.t]; b[m.t] = cap;
        if (ok) out.push(m);
      }
      return out;
    }
    function checkGameOver() {
      var check = inCheck(board, turn);
      var moves = legalMoves(board, turn);
      if (!moves.length) {
        finishGame(other(turn), check ? '将死' : '无子可走，困毙');
        return true;
      }
      if (noCapture >= 120) {
        finishGame(0, '60 回合无吃子');
        return true;
      }
      return false;
    }

    /* ---------- AI ---------- */
    function evaluate(b, side) {
      var score = 0;
      for (var i = 0; i < 90; i++) {
        var p = b[i];
        if (!p) continue;
        var x = i % 9, y = (i / 9) | 0;
        var v = VALUES[p.t] || 0;
        if (p.t === 'P') {
          var crossed = p.s === 'r' ? y <= 4 : y >= 5;
          if (crossed) v += 100;
          var adv = p.s === 'r' ? (9 - y) : y;
          v += adv * 10;
        }
        if (p.t === 'N') v += (4 - Math.abs(x - 4)) * 8;
        if (p.t === 'C') v += (4 - Math.abs(x - 4)) * 6;
        score += p.s === side ? v : -v;
      }
      return score;
    }
    function orderMoves(b, moves) {
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i], s = 0;
        if (m.cap) {
          var att = b[m.f];
          s += (VALUES[m.cap.t] || 0) * 10 - (att ? (VALUES[att.t] || 0) : 0);
        }
        s += Math.random() * 4;
        m._s = s;
      }
      moves.sort(function (a, c) { return c._s - a._s; });
      return moves;
    }
    var nodes = 0, aborted = false;
    function negamax(b, side, depth, alpha, beta, deadline, ply) {
      nodes++;
      if ((nodes & 255) === 0 && Date.now() > deadline) { aborted = true; return evaluate(b, side); }
      if (depth <= 0) return evaluate(b, side);
      var moves = legalMoves(b, side);
      if (!moves.length) return -MATE + ply;
      orderMoves(b, moves);
      var best = -Infinity;
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i], cap = b[m.t], moving = b[m.f];
        b[m.t] = moving; b[m.f] = null;
        var v = -negamax(b, other(side), depth - 1, -beta, -alpha, deadline, ply + 1);
        b[m.f] = b[m.t]; b[m.t] = cap;
        if (aborted) return v;
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }
    function chooseMove(b, side, maxDepth, timeMs) {
      var root = legalMoves(b, side);
      if (!root.length) return null;
      orderMoves(b, root);
      var best = root[0];
      var deadline = Date.now() + timeMs;
      for (var d = 1; d <= maxDepth; d++) {
        nodes = 0;
        aborted = false;
        var alpha = -Infinity, bestThis = null;
        for (var i = 0; i < root.length; i++) {
          var m = root[i], cap = b[m.t], moving = b[m.f];
          b[m.t] = moving; b[m.f] = null;
          var v = -negamax(b, other(side), d - 1, -Infinity, -alpha, deadline, 1);
          b[m.f] = b[m.t]; b[m.t] = cap;
          if (aborted) break;
          if (bestThis === null || v > alpha) { alpha = v; bestThis = m; }
        }
        if (aborted) break;
        if (bestThis) {
          best = bestThis;
          var bi = root.indexOf(bestThis);
          if (bi > 0) { root.splice(bi, 1); root.unshift(bestThis); }
        }
        if (Math.abs(alpha) > MATE / 2) break;
      }
      return best;
    }

    /* ---------- 绘制 ---------- */
    function cssv(name, fb) {
      var v = '';
      try { v = getComputedStyle(document.documentElement).getPropertyValue(name); } catch (e) { /* noop */ }
      v = (v || '').trim();
      return v || fb || '#888888';
    }
    function paintBoard() {
      if (!cv || !ctx || !boardEl || !host.isConnected) return;
      var w = boardEl.clientWidth, h = boardEl.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var cell = w / 10;
      var x0 = cell, y0 = cell;
      var lineC = cssv('--line-strong', '#cfccc0');
      var textC = cssv('--text-3', '#707066');
      var accentC = cssv('--accent-2', '#4c7f6d');
      ctx.lineWidth = 1;
      ctx.strokeStyle = lineC;
      ctx.beginPath();
      for (var r = 0; r < 10; r++) {
        var yy = y0 + r * cell;
        ctx.moveTo(x0, yy);
        ctx.lineTo(x0 + 8 * cell, yy);
      }
      for (var c = 0; c < 9; c++) {
        var xx = x0 + c * cell;
        if (c === 0 || c === 8) {
          ctx.moveTo(xx, y0);
          ctx.lineTo(xx, y0 + 9 * cell);
        } else {
          ctx.moveTo(xx, y0);
          ctx.lineTo(xx, y0 + 4 * cell);
          ctx.moveTo(xx, y0 + 5 * cell);
          ctx.lineTo(xx, y0 + 9 * cell);
        }
      }
      ctx.stroke();
      ctx.strokeStyle = lineC;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 + 3 * cell, y0);
      ctx.lineTo(x0 + 5 * cell, y0 + 2 * cell);
      ctx.moveTo(x0 + 5 * cell, y0);
      ctx.lineTo(x0 + 3 * cell, y0 + 2 * cell);
      ctx.moveTo(x0 + 3 * cell, y0 + 7 * cell);
      ctx.lineTo(x0 + 5 * cell, y0 + 9 * cell);
      ctx.moveTo(x0 + 5 * cell, y0 + 7 * cell);
      ctx.lineTo(x0 + 3 * cell, y0 + 9 * cell);
      ctx.stroke();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = accentC;
      ctx.strokeRect(x0 - 4, y0 - 4, 8 * cell + 8, 9 * cell + 8);
      ctx.globalAlpha = 1;
      ctx.fillStyle = textC;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = Math.max(9, cell * 0.44) + 'px "Songti SC", "SimSun", "Noto Serif SC", serif';
      ctx.fillText('楚 河', x0 + 2.5 * cell, y0 + 4.5 * cell);
      ctx.fillText('漢 界', x0 + 6.5 * cell, y0 + 4.5 * cell);
    }
    function setupCanvas() {
      if (!boardEl || !cv) return;
      raf = requestAnimationFrame(paintBoard);
      if (window.ResizeObserver) {
        ro = new ResizeObserver(function () { paintBoard(); });
        ro.observe(boardEl);
      } else {
        window.addEventListener('resize', paintBoard);
      }
      if (window.MutationObserver) {
        mo = new MutationObserver(function () { paintBoard(); });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      }
      if (api && typeof api.onCleanup === 'function') {
        api.onCleanup(function () {
          if (raf) cancelAnimationFrame(raf);
          if (ro) ro.disconnect();
          else window.removeEventListener('resize', paintBoard);
          if (mo) mo.disconnect();
        });
      }
    }

    /* ---------- 渲染 ---------- */
    function pieceChar(p) {
      if (!p) return '';
      return (p.s === 'r' ? PIECE_CN : PIECE_CN_B)[p.t] || '';
    }
    function coordText(i) {
      var x = i % 9, y = (i / 9) | 0;
      return (9 - x) + '-' + (10 - y);
    }
    function sidePlayerText() { return sideNameCN(playerSide) + '（你）'; }
    function render() {
      if (!gridEl) return;
      var map = {};
      for (var t = 0; t < targets.length; t++) map[targets[t]] = 1;
      var checkIdx = !over ? findKing(board, turn) : -1;
      if (checkIdx >= 0 && !inCheck(board, turn)) checkIdx = -1;
      var html = '';
      for (var y = 0; y < 10; y++) {
        for (var x = 0; x < 9; x++) {
          var i = y * 9 + x;
          var p = board[i];
          var cls = 'gb-xq-pt';
          if (i === selected) cls += ' is-sel';
          if (map[i]) cls += ' is-target';
          if (lastMove && lastMove.f === i) cls += ' is-last-from';
          if (lastMove && lastMove.t === i) cls += ' is-last-to';
          if (hint && hint.f === i) cls += ' is-hint-from';
          if (hint && hint.t === i) cls += ' is-hint-to';
          if (i === checkIdx) cls += ' is-check';
          var label = (p ? (p.s === 'r' ? '红方' : '黑方') + pieceChar(p) : '空位') +
            '，第' + (y + 1) + '行第' + (x + 1) + '列';
          html += '<button type="button" class="' + cls + '" data-x="' + x + '" data-y="' + y +
            '" aria-label="' + label + '">';
          if (p) {
            html += '<span class="gb-xq-pc ' + (p.s === 'r' ? 'is-red' : 'is-black') + '">' +
              pieceChar(p) + '</span>';
          }
          html += '</button>';
        }
      }
      gridEl.innerHTML = html;
      refreshHud();
    }
    function refreshHud() {
      setText(host, '[data-gb-turn]', over ? '已结束' : (thinking ? '思考中' : sideNameCN(turn)));
      setText(host, '[data-gb-info="side"]', sidePlayerText());
      setText(host, '[data-gb-info="diff"]', DIFFS[diff]);
      setText(host, '[data-gb-info="turn"]', over ? '已结束' : (thinking ? '电脑思考中' : sideNameCN(turn)));
      setText(host, '[data-gb-info="last"]', lastMove ? coordText(lastMove.f) + ' → ' + coordText(lastMove.t) : '—');
      setText(host, '[data-gb-time]', fmtMs(clock.elapsed()));
    }
    function refreshStatus() {
      if (statusOverride) { setStatus(host, statusOverride.text, statusOverride.kind); return; }
      if (over) return;
      if (thinking) { setStatus(host, '电脑思考中，请稍候…', 'warn'); return; }
      if (turn === playerSide) {
        if (inCheck(board, turn)) setStatus(host, '你正被将军，必须应将。', 'err');
        else setStatus(host, '轮到你走棋（' + sideNameCN(playerSide) + '）。点击棋子查看合法落点。', '');
      } else {
        setStatus(host, '电脑走棋。', '');
      }
    }

    /* ---------- 对局流程 ---------- */
    function cancelAI() {
      aiToken++;
      if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
      thinking = false;
    }
    function finishGame(winner, reason) {
      if (over) return;
      over = true;
      thinking = false;
      cancelAI();
      clock.stop();
      var result = winner === 0 ? 'draw' : (winner === playerSide ? 'win' : 'lose');
      var title = winner === 0 ? '和棋' : sideNameCN(winner) + '胜';
      settle(host, '象棋', {
        result: result, title: title, detail: reason,
        timeMs: clock.elapsed(), unit: ''
      });
      selected = -1; targets = []; selMoves = []; hint = null; statusOverride = null;
      render();
      refreshStatus();
    }
    function afterMove() {
      if (checkGameOver()) return;
      var check = inCheck(board, turn);
      if (check) {
        SFX.check();
        T.toast(sideNameCN(turn) + '被将军');
      }
      if (turn === playerSide) refreshStatus();
      else scheduleAI();
    }
    function doMove(m, byAI) {
      if (over) return;
      var pie = board[m.f], cap = board[m.t];
      if (!pie) return;
      board[m.t] = pie;
      board[m.f] = null;
      history.push({ f: m.f, t: m.t, s: pie.s, cap: cap || null, nc: noCapture });
      noCapture = cap ? 0 : noCapture + 1;
      turn = other(turn);
      lastMove = { f: m.f, t: m.t };
      selected = -1; targets = []; selMoves = []; hint = null; statusOverride = null;
      if (!byAI) clock.start();
      if (cap) SFX.capture(); else SFX.move();
      render();
      afterMove();
    }
    function scheduleAI() {
      if (over || turn === playerSide) return;
      thinking = true;
      selected = -1; targets = []; selMoves = [];
      refreshHud();
      refreshStatus();
      var token = ++aiToken;
      var started = Date.now();
      aiTimer = setTimeout(function () {
        if (!host.isConnected || token !== aiToken || over || turn === playerSide) return;
        var depth = diff === 'hard' ? 3 : 2;
        var budget = diff === 'hard' ? 340 : 170;
        var mv = chooseMove(board, turn, depth, budget);
        var wait = Math.max(0, 260 - (Date.now() - started));
        aiTimer = setTimeout(function () {
          if (!host.isConnected || token !== aiToken || over) return;
          thinking = false;
          if (!mv) { finishGame(other(turn), inCheck(board, turn) ? '将死' : '困毙'); return; }
          doMove(mv, true);
        }, wait);
      }, 30);
    }
    function newGame() {
      cancelAI();
      over = false;
      thinking = false;
      board = initialBoard();
      turn = 'r';
      selected = -1; targets = []; selMoves = [];
      lastMove = null; hint = null; statusOverride = null;
      history = []; noCapture = 0;
      clock.reset();
      hideResult(host);
      markThis(host, '进行中', '00:00');
      updateRecordCard(host, '象棋', '');
      render();
      refreshStatus();
      if (turn !== playerSide) scheduleAI();
    }
    function undo() {
      if (over) { T.toast('本局已结束，点击「重新开始」再开一局'); return; }
      var hasPlayer = false;
      for (var i = 0; i < history.length; i++) if (history[i].s === playerSide) hasPlayer = true;
      if (!hasPlayer) { T.toast('还没有可以撤回的落子'); return; }
      cancelAI();
      var removed = 0;
      while (history.length && removed < 2) {
        var h = history.pop();
        board[h.f] = board[h.t];
        board[h.t] = h.cap;
        turn = h.s;
        noCapture = h.nc;
        removed++;
        if (turn === playerSide) break;
      }
      over = false;
      thinking = false;
      selected = -1; targets = []; selMoves = []; hint = null; statusOverride = null;
      lastMove = history.length ? { f: history[history.length - 1].f, t: history[history.length - 1].t } : null;
      hideResult(host);
      markThis(host, '进行中', fmtMs(clock.elapsed()));
      render();
      refreshStatus();
      if (turn !== playerSide) scheduleAI();
      T.toast('已悔棋');
    }
    function hintMove() {
      if (over || thinking || turn !== playerSide) { T.toast('现在不能提示'); return; }
      var mv = chooseMove(board, playerSide, 2, 160);
      if (!mv) { T.toast('没有可走的棋'); return; }
      hint = { f: mv.f, t: mv.t };
      selected = -1; targets = []; selMoves = [];
      statusOverride = { text: '推荐走法：' + coordText(mv.f) + ' → ' + coordText(mv.t), kind: 'good' };
      render();
      refreshStatus();
      T.toast('已高亮推荐的一步');
    }
    function forfeit() {
      if (over) return;
      cancelAI();
      finishGame(other(playerSide), '你选择了认输');
    }

    /* ---------- 交互 ---------- */
    function onPoint(x, y) {
      if (over || thinking || turn !== playerSide) return;
      var i = y * 9 + x;
      if (selected >= 0) {
        for (var k = 0; k < selMoves.length; k++) {
          if (selMoves[k].t === i) { doMove(selMoves[k], false); return; }
        }
      }
      var p = board[i];
      if (p && p.s === playerSide) {
        if (selected === i) {
          selected = -1; selMoves = []; targets = [];
        } else {
          selected = i;
          selMoves = [];
          var all = legalMoves(board, playerSide);
          for (var j = 0; j < all.length; j++) if (all[j].f === i) selMoves.push(all[j]);
          targets = [];
          for (var z = 0; z < selMoves.length; z++) targets.push(selMoves[z].t);
          hint = null;
          statusOverride = null;
          SFX.select();
        }
        render();
        refreshStatus();
      } else if (selected >= 0) {
        selected = -1; selMoves = []; targets = [];
        render();
        refreshStatus();
      }
    }
    gridEl.addEventListener('click', function (e) {
      var node = e.target;
      while (node && node !== gridEl && !(node.getAttribute && node.getAttribute('data-x') != null)) node = node.parentNode;
      if (!node || node === gridEl) return;
      onPoint(parseInt(node.getAttribute('data-x'), 10), parseInt(node.getAttribute('data-y'), 10));
    });

    qs(host, '[data-gb-new]').onclick = newGame;
    qs(host, '[data-gb-undo]').onclick = undo;
    qs(host, '[data-gb-hint]').onclick = hintMove;
    qs(host, '[data-gb-forfeit]').onclick = forfeit;
    qs(host, '[data-gb-switch]').onclick = function () {
      playerSide = other(playerSide);
      this.textContent = playerSide === 'r' ? '执红' : '执黑';
      newGame();
      T.toast('你执' + sideNameCN(playerSide) + '，红方先行');
    };
    var diffSel = qs(host, '[data-gb-diff]');
    diffSel.onchange = function () {
      diff = this.value;
      refreshHud();
      refreshStatus();
      T.toast('难度：' + DIFFS[diff]);
    };

    playerSide = 'r';
    diff = 'normal';
    diffSel.value = 'normal';
    setupCanvas();
    bindCommon(host, api, newGame, function () {
      if (selected < 0 && !hint) return false;
      selected = -1; selMoves = []; targets = []; hint = null; statusOverride = null;
      render(); refreshStatus();
      T.toast('已取消选中');
      return true;
    });
    newGame();
    if (api && typeof api.onCleanup === 'function') {
      api.onCleanup(function () { cancelAI(); clock.stop(); });
    }
  } });

  /* ============================================================
     六、国际象棋
     ============================================================ */
  R('国际象棋', { render: function (host, api) {
    host.classList.add('gb-pane');

    var DIFFS = { normal: '普通', hard: '困难' };
    var UNI = {
      w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
      b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }
    };
    var NAME = { K: '王', Q: '后', R: '车', B: '象', N: '马', P: '兵' };
    var VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

    var gridEl, promoEl;
    var pos, playerSide, diff, over, thinking;
    var selected = -1, selMoves = [], targets = [];
    var lastMove = null, hint = null, pendingPromo = null, history = [];
    var aiTimer = null, aiToken = 0, clock;
    var statusOverride = null;

    host.innerHTML = layoutHTML({
      board: '<div class="gb-chess" data-gb-board><div class="gb-chess-grid" data-gb-grid></div>' +
        '<div class="gb-promo" data-gb-promo hidden><div class="gb-promo-box" data-gb-promo-box></div></div></div>',
      hud: '<div class="gb-hud-cell"><span>轮到</span><b data-gb-turn>白方</b></div>',
      toolbar: '<button type="button" class="btn btn-primary" data-gb-new>重新开始</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-undo>悔棋</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-switch>执白</button>' +
        '<select class="gb-select" data-gb-diff aria-label="难度"><option value="normal">普通</option><option value="hard">困难</option></select>' +
        '<button type="button" class="btn btn-ghost" data-gb-hint>提示</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-forfeit>认输</button>',
      side: infoCardHTML('对局信息', [
        ['执子', 'side', '白方（你）'],
        ['难度', 'diff', '普通'],
        ['行棋', 'turn', '白方'],
        ['最近一手', 'last', '—']
      ]) +
        '<div class="sys-card gb-legend"><div class="sys-title">棋子</div>' +
        '<div class="gb-legend-row"><span class="gb-uni">♔♕♖♗♘♙</span><span>白方</span></div>' +
        '<div class="gb-legend-row"><span class="gb-uni">♚♛♜♝♞♟</span><span>黑方</span></div>' +
        '<div class="gb-legend-note">支持王车易位、吃过路兵、底线升变。</div></div>',
      help: [
        ['走子', '点击棋子，高亮合法落点后点击落点'],
        ['易位', '王未移动且车在角上时可易位'],
        ['吃过路兵', '对方兵首次走两格后可立即吃过路兵'],
        ['升变', '兵到底线后可选择后 / 车 / 象 / 马'],
        ['计时', '从你第一次走子才开始'],
        ['Esc', '取消选中或升变选择']
      ],
      status: '轮到你走棋（白方）。点击棋子查看合法落点。'
    });

    gridEl = qs(host, '[data-gb-grid]');
    promoEl = qs(host, '[data-gb-promo]');
    clock = makeClock(host);
    if (api && typeof api.onCleanup === 'function') api.onCleanup(function () { clock.stop(); });

    /* ---------- 基础规则 ---------- */
    function inside(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    function opp(s) { return s === 'w' ? 'b' : 'w'; }
    function idx(r, c) { return r * 8 + c; }
    function initialPos() {
      var b = new Array(64);
      var back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
      var c;
      for (c = 0; c < 8; c++) {
        b[c] = { s: 'b', t: back[c] };
        b[8 + c] = { s: 'b', t: 'P' };
        b[48 + c] = { s: 'w', t: 'P' };
        b[56 + c] = { s: 'w', t: back[c] };
      }
      return {
        b: b, turn: 'w',
        castling: { wK: true, wQ: true, bK: true, bQ: true },
        ep: -1, halfmove: 0
      };
    }
    function findKing(p, side) {
      for (var i = 0; i < 64; i++) {
        var q = p.b[i];
        if (q && q.s === side && q.t === 'K') return i;
      }
      return -1;
    }
    function isAttacked(p, sq, by) {
      var b = p.b, r = (sq / 8) | 0, c = sq % 8;
      var dir = by === 'w' ? 1 : -1;
      if (inside(r + dir, c - 1)) {
        var pp = b[idx(r + dir, c - 1)];
        if (pp && pp.s === by && pp.t === 'P') return true;
      }
      if (inside(r + dir, c + 1)) {
        var pp2 = b[idx(r + dir, c + 1)];
        if (pp2 && pp2.s === by && pp2.t === 'P') return true;
      }
      var kn = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
      for (var k = 0; k < 8; k++) {
        var kr = r + kn[k][0], kc = c + kn[k][1];
        if (!inside(kr, kc)) continue;
        var kp = b[idx(kr, kc)];
        if (kp && kp.s === by && kp.t === 'N') return true;
      }
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          var ar = r + dr, ac = c + dc;
          if (!inside(ar, ac)) continue;
          var ap = b[idx(ar, ac)];
          if (ap && ap.s === by && ap.t === 'K') return true;
        }
      }
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (var d = 0; d < 8; d++) {
        var rr = r + dirs[d][0], cc = c + dirs[d][1];
        var orth = dirs[d][0] === 0 || dirs[d][1] === 0;
        while (inside(rr, cc)) {
          var q = b[idx(rr, cc)];
          if (q) {
            if (q.s === by) {
              if (orth && (q.t === 'R' || q.t === 'Q')) return true;
              if (!orth && (q.t === 'B' || q.t === 'Q')) return true;
            }
            break;
          }
          rr += dirs[d][0]; cc += dirs[d][1];
        }
      }
      return false;
    }
    function inCheck(p, side) {
      var k = findKing(p, side);
      return k < 0 ? true : isAttacked(p, k, opp(side));
    }
    function push(list, f, t, cap, extra) {
      var m = { f: f, t: t, cap: cap || null, capSq: t };
      if (extra) {
        for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) m[k] = extra[k];
      }
      list.push(m);
    }
    function genPseudo(p, side) {
      var b = p.b, moves = [];
      for (var i = 0; i < 64; i++) {
        var pc = b[i];
        if (!pc || pc.s !== side) continue;
        var r = (i / 8) | 0, c = i % 8, d, nr, nc, j;
        if (pc.t === 'P') {
          var dir = side === 'w' ? -1 : 1;
          var startRow = side === 'w' ? 6 : 1;
          var lastRow = side === 'w' ? 0 : 7;
          nr = r + dir;
          if (inside(nr, c) && !b[idx(nr, c)]) {
            var promoOne = nr === lastRow;
            push(moves, i, idx(nr, c), null, promoOne ? { promoNeeded: true } : null);
            if (r === startRow) {
              var nr2 = r + dir * 2;
              if (inside(nr2, c) && !b[idx(nr2, c)]) push(moves, i, idx(nr2, c), null, { double: true });
            }
          }
          for (d = -1; d <= 1; d += 2) {
            nr = r + dir; nc = c + d;
            if (!inside(nr, nc)) continue;
            var t = idx(nr, nc);
            var q = b[t];
            if (q && q.s !== side) {
              push(moves, i, t, q, nr === lastRow ? { promoNeeded: true } : null);
            } else if (!q && t === p.ep) {
              var capSq = t + (side === 'w' ? 8 : -8);
              push(moves, i, t, b[capSq] || null, { ep: true, capSq: capSq });
            }
          }
        } else if (pc.t === 'N') {
          var offs = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
          for (j = 0; j < 8; j++) {
            nr = r + offs[j][0]; nc = c + offs[j][1];
            if (!inside(nr, nc)) continue;
            var qn = b[idx(nr, nc)];
            if (qn && qn.s === side) continue;
            push(moves, i, idx(nr, nc), qn || null);
          }
        } else if (pc.t === 'B' || pc.t === 'R' || pc.t === 'Q') {
          var rays = [];
          if (pc.t === 'B' || pc.t === 'Q') rays = rays.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
          if (pc.t === 'R' || pc.t === 'Q') rays = rays.concat([[1, 0], [-1, 0], [0, 1], [0, -1]]);
          for (j = 0; j < rays.length; j++) {
            nr = r + rays[j][0]; nc = c + rays[j][1];
            while (inside(nr, nc)) {
              var qr = b[idx(nr, nc)];
              if (!qr) push(moves, i, idx(nr, nc), null);
              else {
                if (qr.s !== side) push(moves, i, idx(nr, nc), qr);
                break;
              }
              nr += rays[j][0]; nc += rays[j][1];
            }
          }
        } else if (pc.t === 'K') {
          for (var ddr = -1; ddr <= 1; ddr++) {
            for (var ddc = -1; ddc <= 1; ddc++) {
              if (!ddr && !ddc) continue;
              nr = r + ddr; nc = c + ddc;
              if (!inside(nr, nc)) continue;
              var qk = b[idx(nr, nc)];
              if (qk && qk.s === side) continue;
              push(moves, i, idx(nr, nc), qk || null);
            }
          }
          var home = side === 'w' ? 60 : 4;
          if (i === home && !isAttacked(p, home, opp(side))) {
            var rookK = side === 'w' ? 63 : 7;
            var rookQ = side === 'w' ? 56 : 0;
            var rightK = side === 'w' ? p.castling.wK : p.castling.bK;
            var rightQ = side === 'w' ? p.castling.wQ : p.castling.bQ;
            var k1 = home + 1, k2 = home + 2;
            var q1 = home - 1, q2 = home - 2, q3 = home - 3;
            var rk = b[rookK], rq = b[rookQ];
            if (rightK && rk && rk.s === side && rk.t === 'R' &&
              !b[k1] && !b[k2] && !isAttacked(p, k1, opp(side)) && !isAttacked(p, k2, opp(side))) {
              push(moves, home, k2, null, { castle: 'K' });
            }
            if (rightQ && rq && rq.s === side && rq.t === 'R' &&
              !b[q1] && !b[q2] && !b[q3] && !isAttacked(p, q1, opp(side)) && !isAttacked(p, q2, opp(side))) {
              push(moves, home, q2, null, { castle: 'Q' });
            }
          }
        }
      }
      return moves;
    }
    function applyMove(p, m, side) {
      var b = p.b;
      var moving = b[m.f];
      var u = {
        moving: moving,
        cap: null,
        capSq: m.t,
        castling: { wK: p.castling.wK, wQ: p.castling.wQ, bK: p.castling.bK, bQ: p.castling.bQ },
        ep: p.ep,
        halfmove: p.halfmove,
        turn: p.turn,
        rookFrom: -1,
        rookTo: -1
      };
      if (m.ep) {
        u.capSq = m.t + (side === 'w' ? 8 : -8);
        u.cap = b[u.capSq] || null;
        b[u.capSq] = null;
      } else {
        u.cap = b[m.t] || null;
      }
      b[m.f] = null;
      b[m.t] = m.promoNeeded ? { s: side, t: m.promo || 'Q' } : moving;
      if (m.castle) {
        var rf = m.castle === 'K' ? (side === 'w' ? 63 : 7) : (side === 'w' ? 56 : 0);
        var rt = m.castle === 'K' ? (side === 'w' ? 61 : 5) : (side === 'w' ? 59 : 3);
        var rook = b[rf];
        b[rf] = null;
        b[rt] = rook;
        u.rookFrom = rf;
        u.rookTo = rt;
      }
      if (moving && moving.t === 'K') {
        if (side === 'w') { p.castling.wK = false; p.castling.wQ = false; }
        else { p.castling.bK = false; p.castling.bQ = false; }
      }
      if (moving && moving.t === 'R') {
        if (m.f === 56) p.castling.wQ = false;
        if (m.f === 63) p.castling.wK = false;
        if (m.f === 0) p.castling.bQ = false;
        if (m.f === 7) p.castling.bK = false;
      }
      if (u.cap && u.cap.t === 'R') {
        if (u.capSq === 56) p.castling.wQ = false;
        if (u.capSq === 63) p.castling.wK = false;
        if (u.capSq === 0) p.castling.bQ = false;
        if (u.capSq === 7) p.castling.bK = false;
      }
      if (moving && moving.t === 'P' && Math.abs(m.t - m.f) === 16) p.ep = (m.f + m.t) / 2;
      else p.ep = -1;
      if ((moving && moving.t === 'P') || u.cap) p.halfmove = 0;
      else p.halfmove++;
      p.turn = opp(side);
      return u;
    }
    function undoMove(p, m, u) {
      var b = p.b;
      b[m.f] = u.moving;
      b[m.t] = null;
      if (m.ep) b[u.capSq] = u.cap;
      else b[m.t] = u.cap;
      if (m.castle) {
        b[u.rookTo] = null;
        b[u.rookFrom] = { s: u.moving.s, t: 'R' };
      }
      p.castling = u.castling;
      p.ep = u.ep;
      p.halfmove = u.halfmove;
      p.turn = u.turn;
    }
    function legalMoves(p, side) {
      var ps = genPseudo(p, side), out = [];
      for (var i = 0; i < ps.length; i++) {
        var m = ps[i];
        var u = applyMove(p, m, side);
        var ok = !inCheck(p, side);
        undoMove(p, m, u);
        if (ok) out.push(m);
      }
      return out;
    }
    function insufficient() {
      var minors = 0;
      for (var i = 0; i < 64; i++) {
        var q = pos.b[i];
        if (!q || q.t === 'K') continue;
        if (q.t === 'P' || q.t === 'R' || q.t === 'Q') return false;
        minors++;
      }
      return minors <= 1;
    }

    /* ---------- AI ---------- */
    function evaluate(p, side) {
      var score = 0;
      for (var i = 0; i < 64; i++) {
        var q = p.b[i];
        if (!q) continue;
        var r = (i / 8) | 0, c = i % 8;
        var v = VAL[q.t] || 0;
        if (q.t === 'P') {
          var adv = q.s === 'w' ? (6 - r) : (r - 1);
          if (adv > 0) v += adv * 10;
          if (c === 3 || c === 4) v += 8;
        } else if (q.t === 'N' || q.t === 'B') {
          v += (3.5 - Math.abs(c - 3.5)) * 6;
          v += (3.5 - Math.abs(r - 3.5)) * 6;
        } else if (q.t === 'Q') {
          v += (3.5 - Math.abs(c - 3.5)) * 2;
        }
        score += q.s === side ? v : -v;
      }
      return score;
    }
    function orderMoves(p, moves) {
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i], s = 0;
        if (m.cap) {
          var att = p.b[m.f];
          s += (VAL[m.cap.t] || 0) * 10 - (att ? (VAL[att.t] || 0) : 0);
        }
        if (m.promoNeeded) s += 800;
        if (m.castle) s += 30;
        s += Math.random() * 4;
        m._s = s;
      }
      moves.sort(function (a, b) { return b._s - a._s; });
      return moves;
    }
    var nodes = 0, aborted = false;
    function negamax(p, side, depth, alpha, beta, deadline, ply) {
      nodes++;
      if ((nodes & 255) === 0 && Date.now() > deadline) { aborted = true; return evaluate(p, side); }
      if (depth <= 0) return evaluate(p, side);
      var moves = legalMoves(p, side);
      if (!moves.length) return inCheck(p, side) ? (-MATE + ply) : 0;
      orderMoves(p, moves);
      var best = -Infinity;
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        var u = applyMove(p, m, side);
        var v = -negamax(p, opp(side), depth - 1, -beta, -alpha, deadline, ply + 1);
        undoMove(p, m, u);
        if (aborted) return v;
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }
    function chooseMove(p, side, maxDepth, timeMs) {
      var root = legalMoves(p, side);
      if (!root.length) return null;
      orderMoves(p, root);
      var best = root[0];
      var deadline = Date.now() + timeMs;
      for (var d = 1; d <= maxDepth; d++) {
        nodes = 0;
        aborted = false;
        var alpha = -Infinity, bestThis = null;
        for (var i = 0; i < root.length; i++) {
          var m = root[i];
          var u = applyMove(p, m, side);
          var v = -negamax(p, opp(side), d - 1, -Infinity, -alpha, deadline, 1);
          undoMove(p, m, u);
          if (aborted) break;
          if (bestThis === null || v > alpha) { alpha = v; bestThis = m; }
        }
        if (aborted) break;
        if (bestThis) {
          best = bestThis;
          var bi = root.indexOf(bestThis);
          if (bi > 0) { root.splice(bi, 1); root.unshift(bestThis); }
        }
        if (Math.abs(alpha) > MATE / 2) break;
      }
      if (best.promoNeeded && !best.promo) best.promo = 'Q';
      return best;
    }

    /* ---------- 渲染 ---------- */
    function coordOf(i) {
      var r = (i / 8) | 0, c = i % 8;
      return 'abcdefgh'.charAt(c) + (8 - r);
    }
    function sideCN(s) { return s === 'w' ? '白方' : '黑方'; }
    function render() {
      if (!gridEl) return;
      var map = {};
      for (var t = 0; t < targets.length; t++) map[targets[t]] = 1;
      var checkIdx = !over ? findKing(pos, pos.turn) : -1;
      if (checkIdx >= 0 && !inCheck(pos, pos.turn)) checkIdx = -1;
      var html = '';
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var i = r * 8 + c;
          var q = pos.b[i];
          var cls = 'gb-chess-sq ' + (((r + c) % 2 === 0) ? 'is-light' : 'is-dark');
          if (i === selected) cls += ' is-sel';
          if (map[i]) cls += q ? ' is-capture' : ' is-move';
          if (lastMove && lastMove.f === i) cls += ' is-last';
          if (lastMove && lastMove.t === i) cls += ' is-last';
          if (hint && hint.f === i) cls += ' is-hint';
          if (hint && hint.t === i) cls += ' is-hint';
          if (i === checkIdx) cls += ' is-check';
          var label = (q ? sideCN(q.s) + NAME[q.t] : '空位') + ' ' + coordOf(i);
          html += '<button type="button" class="' + cls + '" data-sq="' + i + '" aria-label="' + label + '">';
          if (r === 7) html += '<span class="gb-coord gb-coord-file">' + 'abcdefgh'.charAt(c) + '</span>';
          if (c === 0) html += '<span class="gb-coord gb-coord-rank">' + (8 - r) + '</span>';
          if (q) html += '<span class="gb-chess-pc is-' + q.s + '">' + UNI[q.s][q.t] + '</span>';
          html += '</button>';
        }
      }
      gridEl.innerHTML = html;
      refreshHud();
    }
    function refreshHud() {
      setText(host, '[data-gb-turn]', over ? '已结束' : (thinking ? '思考中' : sideCN(pos.turn)));
      setText(host, '[data-gb-info="side"]', sideCN(playerSide) + '（你）');
      setText(host, '[data-gb-info="diff"]', DIFFS[diff]);
      setText(host, '[data-gb-info="turn"]', over ? '已结束' : (thinking ? '电脑思考中' : sideCN(pos.turn)));
      setText(host, '[data-gb-info="last"]', lastMove ? coordOf(lastMove.f) + ' → ' + coordOf(lastMove.t) : '—');
      setText(host, '[data-gb-time]', fmtMs(clock.elapsed()));
    }
    function refreshStatus() {
      if (statusOverride) { setStatus(host, statusOverride.text, statusOverride.kind); return; }
      if (over) return;
      if (thinking) { setStatus(host, '电脑思考中，请稍候…', 'warn'); return; }
      if (pos.turn === playerSide) {
        if (inCheck(pos, pos.turn)) setStatus(host, '你正被将军，必须应将。', 'err');
        else setStatus(host, '轮到你走棋（' + sideCN(playerSide) + '）。点击棋子查看合法落点。', '');
      } else {
        setStatus(host, '电脑走棋。', '');
      }
    }

    /* ---------- 升变选择 ---------- */
    function hidePromo() {
      if (!promoEl) return;
      promoEl.hidden = true;
      var box = qs(promoEl, '[data-gb-promo-box]');
      if (box) box.innerHTML = '';
    }
    function showPromo(m) {
      pendingPromo = m;
      selected = -1; selMoves = []; targets = [];
      var uni = UNI[playerSide];
      var opts = [['Q', '后'], ['R', '车'], ['B', '象'], ['N', '马']];
      var html = '<div class="sys-title">兵的升变</div><div class="gb-promo-opts">';
      for (var i = 0; i < opts.length; i++) {
        html += '<button type="button" class="gb-promo-btn" data-promo="' + opts[i][0] + '">' +
          '<span class="gb-uni">' + uni[opts[i][0]] + '</span><span>' + opts[i][1] + '</span></button>';
      }
      html += '</div>';
      var box = qs(promoEl, '[data-gb-promo-box]');
      if (box) box.innerHTML = html;
      promoEl.hidden = false;
      statusOverride = { text: '请选择升变的棋子。', kind: 'warn' };
      render();
      refreshStatus();
    }
    function onPromoClick(e) {
      var node = e.target;
      while (node && node !== promoEl && !(node.getAttribute && node.getAttribute('data-promo'))) node = node.parentNode;
      if (!node || node === promoEl) return;
      var choice = node.getAttribute('data-promo');
      if (!pendingPromo) return;
      var m = pendingPromo;
      pendingPromo = null;
      m.promo = choice;
      hidePromo();
      statusOverride = null;
      commit(m, false);
    }

    /* ---------- 对局流程 ---------- */
    function cancelAI() {
      aiToken++;
      if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
      thinking = false;
    }
    function snapshot() {
      history.push({
        b: pos.b.slice(),
        turn: pos.turn,
        castling: {
          wK: pos.castling.wK, wQ: pos.castling.wQ,
          bK: pos.castling.bK, bQ: pos.castling.bQ
        },
        ep: pos.ep,
        halfmove: pos.halfmove,
        lastMove: lastMove
      });
    }
    function restore(snap) {
      pos.b = snap.b.slice();
      pos.turn = snap.turn;
      pos.castling = {
        wK: snap.castling.wK, wQ: snap.castling.wQ,
        bK: snap.castling.bK, bQ: snap.castling.bQ
      };
      pos.ep = snap.ep;
      pos.halfmove = snap.halfmove;
      lastMove = snap.lastMove;
    }
    function finishGame(winner, reason) {
      if (over) return;
      over = true;
      thinking = false;
      cancelAI();
      clock.stop();
      var result = winner === 0 ? 'draw' : (winner === playerSide ? 'win' : 'lose');
      var title = winner === 0 ? '和棋' : sideCN(winner) + '胜';
      settle(host, '国际象棋', {
        result: result, title: title, detail: reason,
        timeMs: clock.elapsed(), unit: ''
      });
      selected = -1; selMoves = []; targets = []; hint = null;
      pendingPromo = null; hidePromo();
      render();
      refreshStatus();
    }
    function checkEnd() {
      var moves = legalMoves(pos, pos.turn);
      if (!moves.length) {
        if (inCheck(pos, pos.turn)) finishGame(opp(pos.turn), '将死');
        else finishGame(0, '逼和：无子可走');
        return true;
      }
      if (pos.halfmove >= 100) { finishGame(0, '50 回合未吃子或未动兵'); return true; }
      if (insufficient()) { finishGame(0, '子力不足'); return true; }
      return false;
    }
    function afterMove() {
      if (checkEnd()) return;
      if (inCheck(pos, pos.turn)) {
        SFX.check();
        T.toast(sideCN(pos.turn) + '被将军');
      }
      if (pos.turn === playerSide) refreshStatus();
      else scheduleAI();
    }
    function commit(m, byAI) {
      if (over) return;
      var side = pos.turn;
      if (m.promoNeeded && !m.promo) m.promo = 'Q';
      var capSq = m.ep ? (m.t + (side === 'w' ? 8 : -8)) : m.t;
      var cap = pos.b[capSq];
      snapshot();
      applyMove(pos, m, side);
      lastMove = { f: m.f, t: m.t };
      selected = -1; selMoves = []; targets = []; hint = null; statusOverride = null;
      pendingPromo = null;
      hidePromo();
      if (!byAI) clock.start();
      if (m.castle) SFX.castle(); else if (cap) SFX.capture(); else SFX.move();
      render();
      afterMove();
    }
    function scheduleAI() {
      if (over || pos.turn === playerSide) return;
      thinking = true;
      selected = -1; selMoves = []; targets = [];
      refreshHud();
      refreshStatus();
      var token = ++aiToken;
      var started = Date.now();
      aiTimer = setTimeout(function () {
        if (!host.isConnected || token !== aiToken || over || pos.turn === playerSide) return;
        var depth = diff === 'hard' ? 3 : 2;
        var budget = diff === 'hard' ? 360 : 180;
        var mv = chooseMove(pos, pos.turn, depth, budget);
        var wait = Math.max(0, 270 - (Date.now() - started));
        aiTimer = setTimeout(function () {
          if (!host.isConnected || token !== aiToken || over) return;
          thinking = false;
          if (!mv) { finishGame(opp(pos.turn), inCheck(pos, pos.turn) ? '将死' : '逼和'); return; }
          commit(mv, true);
        }, wait);
      }, 30);
    }
    function newGame() {
      cancelAI();
      over = false;
      thinking = false;
      pos = initialPos();
      selected = -1; selMoves = []; targets = [];
      lastMove = null; hint = null; pendingPromo = null;
      history = []; statusOverride = null;
      clock.reset();
      hidePromo();
      hideResult(host);
      markThis(host, '进行中', '00:00');
      updateRecordCard(host, '国际象棋', '');
      render();
      refreshStatus();
      if (pos.turn !== playerSide) scheduleAI();
    }
    function undo() {
      if (over) { T.toast('本局已结束，点击「重新开始」再开一局'); return; }
      var hasPlayer = false;
      for (var i = 0; i < history.length; i++) if (history[i].turn === playerSide) hasPlayer = true;
      if (!hasPlayer) { T.toast('还没有可以撤回的走子'); return; }
      cancelAI();
      var snap = null;
      do {
        snap = history.pop();
        restore(snap);
      } while (snap && snap.turn !== playerSide && history.length);
      over = false;
      thinking = false;
      selected = -1; selMoves = []; targets = []; hint = null;
      pendingPromo = null; hidePromo();
      statusOverride = null;
      hideResult(host);
      markThis(host, '进行中', fmtMs(clock.elapsed()));
      render();
      refreshStatus();
      if (pos.turn !== playerSide) scheduleAI();
      T.toast('已悔棋');
    }
    function hintMove() {
      if (over || thinking || pos.turn !== playerSide) { T.toast('现在不能提示'); return; }
      var mv = chooseMove(pos, playerSide, 2, 170);
      if (!mv) { T.toast('没有可走的棋'); return; }
      hint = { f: mv.f, t: mv.t };
      selected = -1; selMoves = []; targets = [];
      statusOverride = { text: '推荐走法：' + coordOf(mv.f) + ' → ' + coordOf(mv.t), kind: 'good' };
      render();
      refreshStatus();
      T.toast('已高亮推荐的一步');
    }
    function forfeit() {
      if (over) return;
      cancelAI();
      finishGame(opp(playerSide), '你选择了认输');
    }

    /* ---------- 交互 ---------- */
    function onSquare(i) {
      if (over || thinking || pendingPromo || pos.turn !== playerSide) return;
      if (selected >= 0) {
        for (var k = 0; k < selMoves.length; k++) {
          if (selMoves[k].t === i) {
            var mv = selMoves[k];
            if (mv.promoNeeded) { showPromo(mv); return; }
            commit(mv, false);
            return;
          }
        }
      }
      var q = pos.b[i];
      if (q && q.s === playerSide) {
        if (selected === i) {
          selected = -1; selMoves = []; targets = [];
        } else {
          selected = i;
          selMoves = [];
          var all = legalMoves(pos, playerSide);
          for (var j = 0; j < all.length; j++) if (all[j].f === i) selMoves.push(all[j]);
          targets = [];
          for (var z = 0; z < selMoves.length; z++) targets.push(selMoves[z].t);
          hint = null;
          statusOverride = null;
          SFX.select();
        }
        render();
        refreshStatus();
      } else if (selected >= 0) {
        selected = -1; selMoves = []; targets = [];
        render();
        refreshStatus();
      }
    }
    gridEl.addEventListener('click', function (e) {
      var node = e.target;
      while (node && node !== gridEl && !(node.getAttribute && node.getAttribute('data-sq') != null)) node = node.parentNode;
      if (!node || node === gridEl) return;
      onSquare(parseInt(node.getAttribute('data-sq'), 10));
    });
    if (promoEl) promoEl.addEventListener('click', onPromoClick);

    qs(host, '[data-gb-new]').onclick = newGame;
    qs(host, '[data-gb-undo]').onclick = undo;
    qs(host, '[data-gb-hint]').onclick = hintMove;
    qs(host, '[data-gb-forfeit]').onclick = forfeit;
    qs(host, '[data-gb-switch]').onclick = function () {
      playerSide = opp(playerSide);
      this.textContent = playerSide === 'w' ? '执白' : '执黑';
      newGame();
      T.toast('你执' + sideCN(playerSide) + '，白方先行');
    };
    var diffSel = qs(host, '[data-gb-diff]');
    diffSel.onchange = function () {
      diff = this.value;
      refreshHud();
      refreshStatus();
      T.toast('难度：' + DIFFS[diff]);
    };

    playerSide = 'w';
    diff = 'normal';
    diffSel.value = 'normal';
    bindCommon(host, api, newGame, function () {
      if (pendingPromo) {
        pendingPromo = null;
        hidePromo();
        statusOverride = null;
        render(); refreshStatus();
        T.toast('已取消升变');
        return true;
      }
      if (selected < 0 && !hint) return false;
      selected = -1; selMoves = []; targets = []; hint = null; statusOverride = null;
      render(); refreshStatus();
      T.toast('已取消选中');
      return true;
    });
    newGame();
    if (api && typeof api.onCleanup === 'function') {
      api.onCleanup(function () { cancelAI(); clock.stop(); });
    }
  } });

  /* ============================================================
     七、五子棋
     ============================================================ */
  R('五子棋', { render: function (host, api) {
    host.classList.add('gb-pane');

    var N = 15, WINSCORE = 100000000;
    var DIFFS = { easy: '简单', normal: '普通', hard: '困难' };
    var gridEl, cv, ctx;
    var board, playerColor, playerFirst, turn, diff, over, thinking;
    var banHint = true, banNotice = '';
    var lastMove = null, winLine = [], history = [], newIdx = -1;
    var aiTimer = null, aiToken = 0, clock;
    var raf = 0, ro = null, mo = null;

    host.innerHTML = layoutHTML({
      board: '<div class="gb-gomoku" data-gb-board><canvas class="gb-gomoku-canvas" data-gb-canvas aria-hidden="true"></canvas>' +
        '<div class="gb-gomoku-grid" data-gb-grid></div></div>',
      hud: '<div class="gb-hud-cell"><span>轮到</span><b data-gb-turn>黑方</b></div>' +
        '<div class="gb-hud-cell"><span>手数</span><b data-gb-moves>0</b></div>',
      toolbar: '<button type="button" class="btn btn-primary" data-gb-new>重新开始</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-undo>悔棋</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-switch>先手 玩家</button>' +
        '<select class="gb-select" data-gb-diff aria-label="难度"><option value="easy">简单</option><option value="normal" selected>普通</option><option value="hard">困难</option></select>' +
        '<button type="button" class="btn btn-ghost" data-gb-ban>禁手提示 开</button>',
      side: infoCardHTML('对局信息', [
        ['执子', 'side', '黑棋（你）'],
        ['先手', 'first', '玩家'],
        ['难度', 'diff', '普通'],
        ['禁手提示', 'ban', '开']
      ]) +
        '<div class="sys-card gb-legend"><div class="sys-title">棋子</div>' +
        '<div class="gb-legend-row"><span class="gb-stone gb-stone--black gb-mini-stone"></span><span>黑棋先行</span></div>' +
        '<div class="gb-legend-row"><span class="gb-stone gb-stone--white gb-mini-stone"></span><span>白棋后行</span></div>' +
        '<div class="gb-legend-note">横、竖、斜任意方向连成五子即胜。</div></div>',
      help: [
        ['落子', '点击棋盘交叉点落子，最后一手有标记'],
        ['连五', '任意方向连续五子获胜，连子会高亮'],
        ['难度', '简单随机、普通评分、困难带搜索'],
        ['禁手', '黑棋长连 / 双三只提示，不严格判负'],
        ['计时', '从第一次落子才开始'],
        ['悔棋', '撤回你与电脑的上一回合']
      ],
      status: '轮到你落子（黑棋）。'
    });

    gridEl = qs(host, '[data-gb-grid]');
    cv = qs(host, '[data-gb-canvas]');
    ctx = cv ? cv.getContext('2d') : null;
    clock = makeClock(host);
    if (api && typeof api.onCleanup === 'function') api.onCleanup(function () { clock.stop(); });

    function at(r, c) { return r * N + c; }
    function inside(r, c) { return r >= 0 && r < N && c >= 0 && c < N; }
    function newBoard() { return new Array(N * N).fill(0); }
    function otherColor(s) { return s === 1 ? 2 : 1; }
    function colorName(s) { return s === 1 ? '黑棋' : '白棋'; }

    /* ---------- 规则 ---------- */
    function findWinAt(r, c, side) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (var d = 0; d < 4; d++) {
        var dr = dirs[d][0], dc = dirs[d][1];
        var line = [at(r, c)];
        var k = 1;
        while (inside(r - dr * k, c - dc * k) && board[at(r - dr * k, c - dc * k)] === side) {
          line.unshift(at(r - dr * k, c - dc * k)); k++;
        }
        k = 1;
        while (inside(r + dr * k, c + dc * k) && board[at(r + dr * k, c + dc * k)] === side) {
          line.push(at(r + dr * k, c + dc * k)); k++;
        }
        if (line.length >= 5) return line;
      }
      return null;
    }
    function openThreeCount(r, c) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      var total = 0;
      for (var d = 0; d < 4; d++) {
        var dr = dirs[d][0], dc = dirs[d][1];
        var back = 0, fwd = 0, k = 1;
        while (inside(r - dr * k, c - dc * k) && board[at(r - dr * k, c - dc * k)] === 1) { back++; k++; }
        k = 1;
        while (inside(r + dr * k, c + dc * k) && board[at(r + dr * k, c + dc * k)] === 1) { fwd++; k++; }
        var count = back + fwd + 1;
        if (count !== 3) continue;
        var br = r - (back + 1) * dr, bc = c - (back + 1) * dc;
        var fr = r + (fwd + 1) * dr, fc = c + (fwd + 1) * dc;
        var beforeOpen = inside(br, bc) && board[at(br, bc)] === 0;
        var afterOpen = inside(fr, fc) && board[at(fr, fc)] === 0;
        if (beforeOpen && afterOpen) total++;
      }
      return total;
    }
    function blackNotice(r, c) {
      var n = openThreeCount(r, c);
      if (n >= 2) return '黑棋双三（休闲规则不判负）';
      return '';
    }

    /* ---------- AI 评分 ---------- */
    function lineScore(bd, r, c, side) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      var score = 0;
      for (var d = 0; d < 4; d++) {
        var dr = dirs[d][0], dc = dirs[d][1];
        var count = 1, open = 0, k = 1;
        while (inside(r + dr * k, c + dc * k) && bd[at(r + dr * k, c + dc * k)] === side) { count++; k++; }
        if (inside(r + dr * k, c + dc * k) && bd[at(r + dr * k, c + dc * k)] === 0) open++;
        k = 1;
        while (inside(r - dr * k, c - dc * k) && bd[at(r - dr * k, c - dc * k)] === side) { count++; k++; }
        if (inside(r - dr * k, c - dc * k) && bd[at(r - dr * k, c - dc * k)] === 0) open++;
        if (count >= 5) return WINSCORE;
        if (count === 4) score += open === 2 ? 1000000 : (open === 1 ? 120000 : 0);
        else if (count === 3) score += open === 2 ? 12000 : (open === 1 ? 1500 : 0);
        else if (count === 2) score += open === 2 ? 600 : (open === 1 ? 90 : 0);
        else score += open === 2 ? 25 : 5;
      }
      return score;
    }
    function hasNearby(bd, r, c, dist) {
      for (var dr = -dist; dr <= dist; dr++) {
        for (var dc = -dist; dc <= dist; dc++) {
          if (!dr && !dc) continue;
          var rr = r + dr, cc = c + dc;
          if (inside(rr, cc) && bd[at(rr, cc)] !== 0) return true;
        }
      }
      return false;
    }
    function candidateList(bd) {
      var list = [], any = false;
      for (var i = 0; i < bd.length; i++) if (bd[i]) any = true;
      if (!any) return [{ r: 7, c: 7 }];
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (bd[at(r, c)] === 0 && hasNearby(bd, r, c, 2)) list.push({ r: r, c: c });
        }
      }
      if (!list.length) {
        for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (bd[at(r, c)] === 0) list.push({ r: r, c: c });
      }
      return list;
    }
    function boardScore(bd, side) {
      var W = [0, 1, 12, 150, 2500, 100000];
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      var self = 0, opp = 0;
      for (var d = 0; d < 4; d++) {
        var dr = dirs[d][0], dc = dirs[d][1];
        for (var r = 0; r < N; r++) {
          for (var c = 0; c < N; c++) {
            var er = r + dr * 4, ec = c + dc * 4;
            if (!inside(er, ec)) continue;
            var sc = 0, oc = 0;
            for (var k = 0; k < 5; k++) {
              var v = bd[at(r + dr * k, c + dc * k)];
              if (v === side) sc++;
              else if (v) oc++;
            }
            if (sc && oc) continue;
            if (sc) self += W[sc];
            else if (oc) opp += W[oc];
          }
        }
      }
      return self - opp * 1.15;
    }
    function rankCell(bd, r, c, ai, hu) {
      var attack = lineScore(bd, r, c, ai);
      var defend = lineScore(bd, r, c, hu);
      return { r: r, c: c, attack: attack, defend: defend, rank: attack + defend * 0.9 };
    }
    function chooseAIMove() {
      var ai = otherColor(playerColor), hu = playerColor;
      var list = candidateList(board), i, j;
      if (!list.length) return null;
      var scored = [];
      for (i = 0; i < list.length; i++) {
        var cell = rankCell(board, list[i].r, list[i].c, ai, hu);
        if (cell.attack >= WINSCORE) return { r: cell.r, c: cell.c };
        scored.push(cell);
      }
      if (diff !== 'easy') {
        for (i = 0; i < scored.length; i++) {
          if (scored[i].defend >= WINSCORE) return { r: scored[i].r, c: scored[i].c };
        }
      }
      scored.sort(function (a, b) { return b.rank - a.rank; });
      if (diff === 'easy') {
        if (Math.random() < 0.7) {
          for (i = 0; i < scored.length; i++) if (scored[i].defend >= WINSCORE) return { r: scored[i].r, c: scored[i].c };
        }
        var top = Math.min(6, scored.length);
        var pickIdx = Math.floor(Math.random() * top);
        return { r: scored[pickIdx].r, c: scored[pickIdx].c };
      }
      if (diff === 'normal') {
        var pool = [];
        for (i = 0; i < Math.min(4, scored.length); i++) {
          if (scored[i].rank >= scored[0].rank * 0.97) pool.push(scored[i]);
        }
        var pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : scored[0];
        return { r: pick.r, c: pick.c };
      }
      var topN = Math.min(10, scored.length);
      var bestVal = -Infinity, best = null;
      for (i = 0; i < topN; i++) {
        var aiCell = scored[i];
        var aiIdx = at(aiCell.r, aiCell.c);
        board[aiIdx] = ai;
        if (findWinAt(aiCell.r, aiCell.c, ai)) { board[aiIdx] = 0; return { r: aiCell.r, c: aiCell.c }; }
        var replies = [];
        var plist = candidateList(board);
        for (j = 0; j < plist.length; j++) {
          var rc = rankCell(board, plist[j].r, plist[j].c, hu, ai);
          replies.push(rc);
        }
        replies.sort(function (a, b) { return b.rank - a.rank; });
        var worst = -Infinity;
        var lim = Math.min(8, replies.length);
        for (j = 0; j < lim; j++) {
          var pIdx = at(replies[j].r, replies[j].c);
          board[pIdx] = hu;
          var val;
          if (findWinAt(replies[j].r, replies[j].c, hu)) val = 1000000000;
          else val = boardScore(board, ai);
          board[pIdx] = 0;
          if (val > worst) worst = val;
          if (worst >= 1000000000) break;
        }
        if (worst === -Infinity) worst = boardScore(board, ai);
        worst += aiCell.rank * 0.001;
        board[aiIdx] = 0;
        if (worst > bestVal) { bestVal = worst; best = { r: aiCell.r, c: aiCell.c }; }
      }
      return best || { r: scored[0].r, c: scored[0].c };
    }

    /* ---------- 绘制 ---------- */
    function cssv(name, fb) {
      var v = '';
      try { v = getComputedStyle(document.documentElement).getPropertyValue(name); } catch (e) { /* noop */ }
      v = (v || '').trim();
      return v || fb || '#888888';
    }
    function paintBoard() {
      if (!cv || !ctx || !host.isConnected) return;
      var w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var cell = w / N;
      var lineC = cssv('--line-strong', '#cfccc0');
      var dotC = cssv('--text-3', '#707066');
      ctx.strokeStyle = lineC;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i < N; i++) {
        var p = (i + 0.5) * cell;
        ctx.moveTo(0.5 * cell, p);
        ctx.lineTo((N - 0.5) * cell, p);
        ctx.moveTo(p, 0.5 * cell);
        ctx.lineTo(p, (N - 0.5) * cell);
      }
      ctx.stroke();
      ctx.fillStyle = dotC;
      var stars = [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]];
      for (var s = 0; s < stars.length; s++) {
        var sx = (stars[s][0] + 0.5) * cell, sy = (stars[s][1] + 0.5) * cell;
        var rad = Math.max(1.8, cell * 0.075);
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function setupCanvas() {
      if (!cv) return;
      raf = requestAnimationFrame(paintBoard);
      if (window.ResizeObserver) {
        ro = new ResizeObserver(function () { paintBoard(); });
        ro.observe(cv);
      } else {
        window.addEventListener('resize', paintBoard);
      }
      if (window.MutationObserver) {
        mo = new MutationObserver(function () { paintBoard(); });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      }
      if (api && typeof api.onCleanup === 'function') {
        api.onCleanup(function () {
          if (raf) cancelAnimationFrame(raf);
          if (ro) ro.disconnect();
          else window.removeEventListener('resize', paintBoard);
          if (mo) mo.disconnect();
        });
      }
    }

    /* ---------- 渲染 ---------- */
    function render() {
      if (!gridEl) return;
      var winMap = {};
      for (var w = 0; w < winLine.length; w++) winMap[winLine[w]] = 1;
      var html = '';
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          var i = at(r, c);
          var v = board[i];
          var cls = 'gb-gomoku-pt';
          if (v) cls += ' has-stone';
          if (i === newIdx) cls += ' is-new';
          if (winMap[i]) cls += ' is-win';
          if (lastMove && lastMove.r === r && lastMove.c === c) cls += ' is-last';
          var label = (v ? colorName(v) : '空位') + '，第' + (r + 1) + '行第' + (c + 1) + '列';
          html += '<button type="button" class="' + cls + '" data-r="' + r + '" data-c="' + c +
            '" aria-label="' + label + '">';
          if (v) html += '<span class="gb-stone ' + (v === 1 ? 'gb-stone--black' : 'gb-stone--white') + '"></span>';
          html += '</button>';
        }
      }
      gridEl.innerHTML = html;
      refreshHud();
    }
    function refreshHud() {
      setText(host, '[data-gb-turn]', over ? '已结束' : (thinking ? '思考中' : colorName(turn)));
      setText(host, '[data-gb-moves]', history.length);
      setText(host, '[data-gb-info="side"]', colorName(playerColor) + '（你）');
      setText(host, '[data-gb-info="first"]', playerFirst ? '玩家' : '电脑');
      setText(host, '[data-gb-info="diff"]', DIFFS[diff]);
      setText(host, '[data-gb-info="ban"]', banHint ? '开' : '关');
      setText(host, '[data-gb-time]', fmtMs(clock.elapsed()));
    }
    function refreshStatus() {
      if (over) return;
      if (thinking) { setStatus(host, '电脑思考中，请稍候…', 'warn'); return; }
      if (turn === playerColor) {
        var t = '轮到你落子（' + colorName(playerColor) + '）。';
        if (banHint && banNotice) { setStatus(host, t + ' ' + banNotice, 'warn'); return; }
        setStatus(host, t, '');
      } else {
        setStatus(host, '电脑走棋。', '');
      }
    }

    /* ---------- 对局 ---------- */
    function cancelAI() {
      aiToken++;
      if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
      thinking = false;
    }
    function finishWin(line, side) {
      if (over) return;
      over = true;
      thinking = false;
      cancelAI();
      clock.stop();
      winLine = line;
      var title = side === 1 ? '黑方胜' : '白方胜';
      var result = side === playerColor ? 'win' : 'lose';
      var detail = '五子连线';
      if (banHint && side === 1) {
        if (line.length > 5) detail += ' · 黑棋长连（休闲规则判胜）';
        else {
          var n = lastMove ? blackNotice(lastMove.r, lastMove.c) : '';
          if (n) detail += ' · ' + n;
        }
      }
      settle(host, '五子棋', {
        result: result, title: title, detail: detail,
        timeMs: clock.elapsed(), scoreWins: true, unit: '胜'
      });
      render();
      refreshStatus();
    }
    function finishDraw() {
      if (over) return;
      over = true;
      thinking = false;
      cancelAI();
      clock.stop();
      settle(host, '五子棋', {
        result: 'draw', title: '和棋', detail: '棋盘已满',
        timeMs: clock.elapsed(), scoreWins: true, unit: '胜'
      });
      render();
      refreshStatus();
    }
    function place(r, c, side, byAI) {
      if (over || !inside(r, c) || board[at(r, c)] !== 0) return false;
      var idx = at(r, c);
      board[idx] = side;
      history.push({ r: r, c: c, s: side });
      lastMove = { r: r, c: c };
      newIdx = idx;
      if (!byAI) clock.start();
      SFX.place();
      var line = findWinAt(r, c, side);
      if (line) { render(); finishWin(line, side); return true; }
      if (history.length >= N * N) { render(); finishDraw(); return true; }
      turn = otherColor(side);
      banNotice = '';
      if (banHint && side === 1) banNotice = blackNotice(r, c);
      render();
      if (banNotice) T.toast(banNotice);
      if (turn !== playerColor) scheduleAI();
      else refreshStatus();
      return true;
    }
    function scheduleAI() {
      if (over || turn === playerColor) return;
      thinking = true;
      refreshHud();
      refreshStatus();
      var token = ++aiToken;
      var started = Date.now();
      aiTimer = setTimeout(function () {
        if (!host.isConnected || token !== aiToken || over || turn === playerColor) return;
        var mv = chooseAIMove();
        var wait = Math.max(0, 260 - (Date.now() - started));
        aiTimer = setTimeout(function () {
          if (!host.isConnected || token !== aiToken || over) return;
          thinking = false;
          if (!mv) { finishDraw(); return; }
          place(mv.r, mv.c, otherColor(playerColor), true);
        }, wait);
      }, 30);
    }
    function newGame() {
      cancelAI();
      over = false;
      thinking = false;
      board = newBoard();
      playerColor = playerFirst ? 1 : 2;
      turn = 1;
      lastMove = null; winLine = []; newIdx = -1; banNotice = '';
      history = [];
      clock.reset();
      hideResult(host);
      markThis(host, '进行中', '00:00');
      updateRecordCard(host, '五子棋', '胜');
      render();
      refreshStatus();
      if (turn !== playerColor) scheduleAI();
    }
    function undo() {
      if (over) { T.toast('本局已结束，点击「重新开始」再开一局'); return; }
      var hasPlayer = false;
      for (var i = 0; i < history.length; i++) if (history[i].s === playerColor) hasPlayer = true;
      if (!hasPlayer) { T.toast('还没有可以撤回的落子'); return; }
      cancelAI();
      while (history.length) {
        var h = history.pop();
        board[at(h.r, h.c)] = 0;
        if (h.s === playerColor) break;
      }
      turn = playerColor;
      over = false;
      thinking = false;
      winLine = []; newIdx = -1; banNotice = '';
      lastMove = history.length ? { r: history[history.length - 1].r, c: history[history.length - 1].c } : null;
      hideResult(host);
      markThis(host, '进行中', fmtMs(clock.elapsed()));
      render();
      refreshStatus();
      T.toast('已悔棋');
    }

    /* ---------- 交互 ---------- */
    gridEl.addEventListener('click', function (e) {
      var node = e.target;
      while (node && node !== gridEl && !(node.getAttribute && node.getAttribute('data-r') != null)) node = node.parentNode;
      if (!node || node === gridEl) return;
      if (over || thinking || turn !== playerColor) return;
      var r = parseInt(node.getAttribute('data-r'), 10);
      var c = parseInt(node.getAttribute('data-c'), 10);
      if (board[at(r, c)] !== 0) { SFX.invalid(); return; }
      place(r, c, playerColor, false);
    });

    qs(host, '[data-gb-new]').onclick = newGame;
    qs(host, '[data-gb-undo]').onclick = undo;
    qs(host, '[data-gb-switch]').onclick = function () {
      playerFirst = !playerFirst;
      this.textContent = '先手 ' + (playerFirst ? '玩家' : '电脑');
      newGame();
      T.toast(playerFirst ? '你执黑先行' : '电脑执黑先行，你执白');
    };
    var diffSel = qs(host, '[data-gb-diff]');
    diffSel.onchange = function () {
      diff = this.value;
      refreshHud();
      refreshStatus();
      T.toast('难度：' + DIFFS[diff]);
    };
    var banBtn = qs(host, '[data-gb-ban]');
    banBtn.onclick = function () {
      banHint = !banHint;
      this.textContent = '禁手提示 ' + (banHint ? '开' : '关');
      if (!banHint) banNotice = '';
      refreshHud();
      refreshStatus();
      T.toast(banHint ? '已开启禁手提示' : '已关闭禁手提示');
    };

    playerFirst = true;
    playerColor = 1;
    diff = 'normal';
    diffSel.value = 'normal';
    setupCanvas();
    bindCommon(host, api, newGame, function () { return false; });
    newGame();
    if (api && typeof api.onCleanup === 'function') {
      api.onCleanup(function () { cancelAI(); clock.stop(); });
    }
  } });

  /* ============================================================
     八、黑白棋（奥赛罗）
     ============================================================ */
  R('黑白棋', { render: function (host, api) {
    host.classList.add('gb-pane');

    var DIFFS = { easy: '简单', normal: '普通', hard: '困难' };
    var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    var CORNERS = [0, 7, 56, 63];
    var WEAK = [1, 6, 8, 9, 14, 15, 18, 21, 42, 45, 48, 49, 54, 55, 57, 62];

    var gridEl;
    var board, playerColor, playerFirst, turn, diff, over, thinking;
    var showLegal = true, lastMove = -1, flipCells = [], history = [];
    var aiTimer = null, aiToken = 0, clock;
    var passNotice = '', statusOverride = null;

    host.innerHTML = layoutHTML({
      board: '<div class="gb-othello" data-gb-board><div class="gb-othello-grid" data-gb-grid></div></div>',
      hud: '<div class="gb-hud-cell"><span>比分</span><b data-gb-score>2 : 2</b></div>' +
        '<div class="gb-hud-cell"><span>空格</span><b data-gb-empty>60</b></div>' +
        '<div class="gb-hud-cell"><span>轮到</span><b data-gb-turn>黑方</b></div>',
      toolbar: '<button type="button" class="btn btn-primary" data-gb-new>重新开始</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-undo>悔棋</button>' +
        '<button type="button" class="btn btn-ghost" data-gb-switch>先手 玩家</button>' +
        '<select class="gb-select" data-gb-diff aria-label="难度"><option value="easy">简单</option><option value="normal" selected>普通</option><option value="hard">困难</option></select>' +
        '<button type="button" class="btn btn-ghost" data-gb-legal>合法点 开</button>',
      side: infoCardHTML('对局信息', [
        ['执子', 'side', '黑棋（你）'],
        ['先手', 'first', '玩家'],
        ['难度', 'diff', '普通'],
        ['合法点', 'legal', '显示']
      ]) +
        '<div class="sys-card gb-legend"><div class="sys-title">比分</div>' +
        '<div class="gb-legend-row"><span class="gb-stone gb-stone--black gb-mini-stone"></span><span>黑棋 <b data-gb-black>2</b></span></div>' +
        '<div class="gb-legend-row"><span class="gb-stone gb-stone--white gb-mini-stone"></span><span>白棋 <b data-gb-white>2</b></span></div>' +
        '<div class="gb-legend-note">夹住对方棋子即可翻转，终局棋子多者胜。</div></div>',
      help: [
        ['落子', '点击小圆点提示的合法位置'],
        ['翻转', '横、竖、斜夹住的对方棋子会翻面'],
        ['跳过', '无子可下时自动跳过，双方都无子可下即终局'],
        ['计分', '终局按棋子数判定胜负'],
        ['计时', '从第一次落子才开始'],
        ['悔棋', '撤回你与电脑的上一回合']
      ],
      status: '轮到你落子（黑棋）。点击小圆点位置落子。'
    });

    gridEl = qs(host, '[data-gb-grid]');
    clock = makeClock(host);
    if (api && typeof api.onCleanup === 'function') api.onCleanup(function () { clock.stop(); });

    function at(r, c) { return r * 8 + c; }
    function inside(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    function otherColor(s) { return s === 1 ? 2 : 1; }
    function colorName(s) { return s === 1 ? '黑棋' : '白棋'; }
    function sideName(s) { return s === 1 ? '黑方' : '白方'; }
    function newBoard() {
      var b = new Array(64).fill(0);
      b[27] = 1; b[36] = 1;
      b[28] = 2; b[35] = 2;
      return b;
    }
    function countColor(bd, side) {
      var n = 0;
      for (var i = 0; i < 64; i++) if (bd[i] === side) n++;
      return n;
    }
    function legalMovesFor(bd, side) {
      var opp = otherColor(side), out = [];
      for (var i = 0; i < 64; i++) {
        if (bd[i] !== 0) continue;
        var r = (i / 8) | 0, c = i % 8;
        var flips = [];
        for (var d = 0; d < 8; d++) {
          var rr = r + DIRS[d][0], cc = c + DIRS[d][1];
          var line = [];
          while (inside(rr, cc) && bd[at(rr, cc)] === opp) {
            line.push(at(rr, cc));
            rr += DIRS[d][0]; cc += DIRS[d][1];
          }
          if (line.length && inside(rr, cc) && bd[at(rr, cc)] === side) {
            flips = flips.concat(line);
          }
        }
        if (flips.length) out.push({ idx: i, r: r, c: c, flips: flips, n: flips.length });
      }
      return out;
    }
    function applyOthello(bd, move, side) {
      bd[move.idx] = side;
      for (var i = 0; i < move.flips.length; i++) bd[move.flips[i]] = side;
    }
    function undoOthello(bd, move, side) {
      bd[move.idx] = 0;
      var opp = otherColor(side);
      for (var i = 0; i < move.flips.length; i++) bd[move.flips[i]] = opp;
    }

    /* ---------- AI ---------- */
    function isCorner(i) { return i === 0 || i === 7 || i === 56 || i === 63; }
    function evalOthello(bd, side) {
      var opp = otherColor(side);
      var my = 0, op = 0, i;
      for (i = 0; i < 64; i++) {
        if (bd[i] === side) my++;
        else if (bd[i] === opp) op++;
      }
      var score = my - op;
      for (i = 0; i < CORNERS.length; i++) {
        if (bd[CORNERS[i]] === side) score += 32;
        else if (bd[CORNERS[i]] === opp) score -= 32;
      }
      for (i = 0; i < WEAK.length; i++) {
        if (bd[WEAK[i]] === side) score -= 9;
        else if (bd[WEAK[i]] === opp) score += 9;
      }
      var myMob = legalMovesFor(bd, side).length;
      var opMob = legalMovesFor(bd, opp).length;
      score += (myMob - opMob) * 8;
      return score;
    }
    function finalScore(bd, side) {
      var diff = countColor(bd, side) - countColor(bd, otherColor(side));
      return diff * 10000;
    }
    var nodes = 0, aborted = false;
    function negamaxOth(bd, side, depth, alpha, beta, deadline, ply) {
      nodes++;
      if ((nodes & 127) === 0 && Date.now() > deadline) { aborted = true; return evalOthello(bd, side); }
      if (depth <= 0) return evalOthello(bd, side);
      var moves = legalMovesFor(bd, side);
      if (!moves.length) {
        var oppMoves = legalMovesFor(bd, otherColor(side));
        if (oppMoves.length && !aborted) {
          return -negamaxOth(bd, otherColor(side), depth - 1, -beta, -alpha, deadline, ply + 1);
        }
        return finalScore(bd, side);
      }
      moves.sort(function (a, b) { return b.n - a.n; });
      var best = -Infinity;
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        applyOthello(bd, m, side);
        var v = -negamaxOth(bd, otherColor(side), depth - 1, -beta, -alpha, deadline, ply + 1);
        undoOthello(bd, m, side);
        if (aborted) return v;
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }
    function chooseHard(bd, moves, side) {
      var best = moves[0], bestVal = -Infinity;
      var deadline = Date.now() + 360;
      moves.sort(function (a, b) { return b.n - a.n; });
      nodes = 0; aborted = false;
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        applyOthello(bd, m, side);
        var v = -negamaxOth(bd, otherColor(side), 2, -Infinity, -bestVal, deadline, 1);
        undoOthello(bd, m, side);
        if (aborted) break;
        if (v > bestVal) { bestVal = v; best = m; }
      }
      return best;
    }
    function chooseMove(bd, side) {
      var moves = legalMovesFor(bd, side);
      if (!moves.length) return null;
      if (diff === 'easy') return moves[Math.floor(Math.random() * moves.length)];
      if (diff === 'normal') {
        var best = moves[0], bestVal = -Infinity, i;
        for (i = 0; i < moves.length; i++) {
          var m = moves[i], v = m.n * 2;
          if (isCorner(m.idx)) v += 40;
          if (WEAK.indexOf(m.idx) >= 0) v -= 10;
          if (v > bestVal) { bestVal = v; best = m; }
        }
        return best;
      }
      return chooseHard(bd, moves, side);
    }

    /* ---------- 渲染 ---------- */
    function render() {
      if (!gridEl) return;
      var legal = [];
      if (!over && !thinking && turn === playerColor && showLegal) legal = legalMovesFor(board, playerColor);
      var legalMap = {};
      for (var l = 0; l < legal.length; l++) legalMap[legal[l].idx] = 1;
      var flipMap = {};
      for (var f = 0; f < flipCells.length; f++) flipMap[flipCells[f]] = 1;
      var html = '';
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var i = at(r, c);
          var cls = 'gb-ot-sq ' + (((r + c) % 2 === 0) ? 'is-light' : 'is-dark');
          if (legalMap[i]) cls += ' is-legal';
          if (i === lastMove) cls += ' is-last';
          if (flipMap[i]) cls += ' is-flipped';
          var label = (board[i] ? colorName(board[i]) : '空位') + ' ' + 'abcdefgh'.charAt(c) + (8 - r);
          html += '<button type="button" class="' + cls + '" data-sq="' + i + '" aria-label="' + label + '">';
          if (legalMap[i]) html += '<span class="gb-legal-dot"></span>';
          if (board[i]) html += '<span class="gb-stone ' + (board[i] === 1 ? 'gb-stone--black' : 'gb-stone--white') + '"></span>';
          html += '</button>';
        }
      }
      gridEl.innerHTML = html;
      refreshHud();
    }
    function refreshHud() {
      var black = countColor(board, 1), white = countColor(board, 2);
      setText(host, '[data-gb-score]', black + ' : ' + white);
      setText(host, '[data-gb-empty]', 64 - black - white);
      setText(host, '[data-gb-black]', black);
      setText(host, '[data-gb-white]', white);
      setText(host, '[data-gb-turn]', over ? '已结束' : (thinking ? '思考中' : sideName(turn)));
      setText(host, '[data-gb-info="side"]', sideName(playerColor) + '（你）');
      setText(host, '[data-gb-info="first"]', playerFirst ? '玩家' : '电脑');
      setText(host, '[data-gb-info="diff"]', DIFFS[diff]);
      setText(host, '[data-gb-info="legal"]', showLegal ? '显示' : '隐藏');
      setText(host, '[data-gb-time]', fmtMs(clock.elapsed()));
    }
    function refreshStatus() {
      if (statusOverride) { setStatus(host, statusOverride.text, statusOverride.kind); return; }
      if (over) return;
      if (thinking) { setStatus(host, '电脑思考中，请稍候…', 'warn'); return; }
      if (turn === playerColor) {
        setStatus(host, '轮到你落子（' + sideName(playerColor) + '）。点击小圆点位置落子。', '');
      } else {
        setStatus(host, '电脑走棋。', '');
      }
    }

    /* ---------- 对局 ---------- */
    function cancelAI() {
      aiToken++;
      if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
      thinking = false;
    }
    function snapshot() {
      history.push({ b: board.slice(), turn: turn, lastMove: lastMove });
    }
    function restore(snap) {
      board = snap.b.slice();
      turn = snap.turn;
      lastMove = snap.lastMove;
    }
    function finishByCount() {
      if (over) return;
      over = true;
      thinking = false;
      cancelAI();
      clock.stop();
      var black = countColor(board, 1), white = countColor(board, 2);
      var result = black === white ? 'draw' : ((black > white ? 1 : 2) === playerColor ? 'win' : 'lose');
      var title = black === white ? '和棋' : ((black > white ? '黑方胜' : '白方胜'));
      var score = result === 'win' ? countColor(board, playerColor) : null;
      settle(host, '黑白棋', {
        result: result, title: title,
        detail: '黑 ' + black + ' : 白 ' + white,
        timeMs: clock.elapsed(), score: score, unit: '子'
      });
      flipCells = [];
      render();
      refreshStatus();
    }
    function afterMove() {
      if (!legalMovesFor(board, turn).length && !legalMovesFor(board, otherColor(turn)).length) {
        finishByCount();
        return;
      }
      if (!legalMovesFor(board, turn).length) {
        passNotice = sideName(turn) + '无子可下，跳过。';
        T.toast(passNotice);
        turn = otherColor(turn);
        render();
      }
      if (turn !== playerColor) {
        scheduleAI();
      } else {
        if (passNotice) {
          statusOverride = { text: passNotice + ' 轮到你落子。', kind: 'warn' };
        } else {
          statusOverride = null;
        }
        refreshStatus();
      }
    }
    function commit(move, byAI) {
      if (over || !move) return;
      var side = turn;
      snapshot();
      lastMove = move.idx;
      flipCells = move.flips.slice();
      applyOthello(board, move, side);
      if (!byAI) clock.start();
      SFX.flip();
      turn = otherColor(side);
      passNotice = '';
      statusOverride = null;
      render();
      afterMove();
    }
    function scheduleAI() {
      if (over || turn === playerColor) return;
      thinking = true;
      statusOverride = null;
      refreshHud();
      refreshStatus();
      var token = ++aiToken;
      var started = Date.now();
      aiTimer = setTimeout(function () {
        if (!host.isConnected || token !== aiToken || over || turn === playerColor) return;
        var mv = chooseMove(board, turn);
        var wait = Math.max(0, 270 - (Date.now() - started));
        aiTimer = setTimeout(function () {
          if (!host.isConnected || token !== aiToken || over) return;
          thinking = false;
          if (!mv) { afterMove(); return; }
          commit(mv, true);
        }, wait);
      }, 30);
    }
    function newGame() {
      cancelAI();
      over = false;
      thinking = false;
      board = newBoard();
      playerColor = playerFirst ? 1 : 2;
      turn = 1;
      lastMove = -1; flipCells = []; history = [];
      passNotice = ''; statusOverride = null;
      clock.reset();
      hideResult(host);
      markThis(host, '进行中', '00:00');
      updateRecordCard(host, '黑白棋', '子');
      render();
      refreshStatus();
      if (turn !== playerColor) scheduleAI();
    }
    function undo() {
      if (over) { T.toast('本局已结束，点击「重新开始」再开一局'); return; }
      var hasPlayer = false;
      for (var i = 0; i < history.length; i++) if (history[i].turn === playerColor) hasPlayer = true;
      if (!hasPlayer) { T.toast('还没有可以撤回的落子'); return; }
      cancelAI();
      var snap = null;
      do {
        snap = history.pop();
        restore(snap);
      } while (snap && snap.turn !== playerColor && history.length);
      over = false;
      thinking = false;
      flipCells = [];
      passNotice = ''; statusOverride = null;
      hideResult(host);
      markThis(host, '进行中', fmtMs(clock.elapsed()));
      render();
      refreshStatus();
      if (turn !== playerColor) scheduleAI();
      T.toast('已悔棋');
    }

    /* ---------- 交互 ---------- */
    gridEl.addEventListener('click', function (e) {
      var node = e.target;
      while (node && node !== gridEl && !(node.getAttribute && node.getAttribute('data-sq') != null)) node = node.parentNode;
      if (!node || node === gridEl) return;
      if (over || thinking || turn !== playerColor) return;
      var i = parseInt(node.getAttribute('data-sq'), 10);
      var moves = legalMovesFor(board, playerColor), mv = null;
      for (var k = 0; k < moves.length; k++) if (moves[k].idx === i) { mv = moves[k]; break; }
      if (!mv) { SFX.invalid(); T.toast('这里不能落子'); return; }
      commit(mv, false);
    });

    qs(host, '[data-gb-new]').onclick = newGame;
    qs(host, '[data-gb-undo]').onclick = undo;
    qs(host, '[data-gb-switch]').onclick = function () {
      playerFirst = !playerFirst;
      this.textContent = '先手 ' + (playerFirst ? '玩家' : '电脑');
      newGame();
      T.toast(playerFirst ? '你执黑先行' : '电脑执黑先行，你执白');
    };
    var diffSel = qs(host, '[data-gb-diff]');
    diffSel.onchange = function () {
      diff = this.value;
      refreshHud();
      refreshStatus();
      T.toast('难度：' + DIFFS[diff]);
    };
    var legalBtn = qs(host, '[data-gb-legal]');
    legalBtn.onclick = function () {
      showLegal = !showLegal;
      this.textContent = '合法点 ' + (showLegal ? '开' : '关');
      refreshHud();
      render();
      T.toast(showLegal ? '已显示合法落点' : '已隐藏合法落点');
    };

    playerFirst = true;
    playerColor = 1;
    diff = 'normal';
    diffSel.value = 'normal';
    bindCommon(host, api, newGame, function () { return false; });
    newGame();
    if (api && typeof api.onCleanup === 'function') {
      api.onCleanup(function () { cancelAI(); clock.stop(); });
    }
  } });

  /* ============================================================
     九、井字棋
     ============================================================ */
  R('井字棋', { render: function (host, api) {
    host.classList.add('gb-pane');

    var DIFFS = { perfect: '完美', easy: '简单随机' };
    var LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    var gridEl;
    var board, turn, diff, over, thinking;
    var winLine = [], lastMove = -1, session = { win: 0, lose: 0, draw: 0 };
    var aiTimer = null, aiToken = 0, clock;

    host.innerHTML = layoutHTML({
      board: '<div class="gb-ttt" data-gb-board><div class="gb-ttt-grid" data-gb-grid></div></div>',
      hud: '<div class="gb-hud-cell"><span>轮到</span><b data-gb-turn>你（×）</b></div>',
      toolbar: '<button type="button" class="btn btn-primary" data-gb-new>重新开始</button>' +
        '<select class="gb-select" data-gb-diff aria-label="难度"><option value="perfect">完美</option><option value="easy">简单随机</option></select>' +
        '<button type="button" class="btn btn-ghost" data-gb-reset-score>清零比分</button>',
      side: infoCardHTML('对局信息', [
        ['你先手', 'side', '×'],
        ['电脑', 'ai', '○'],
        ['难度', 'diff', '完美']
      ]) +
        '<div class="sys-card"><div class="sys-title">本次比分</div>' +
        '<div class="gb-ttt-score">' +
          '<div><span>胜</span><b data-gb-sw>0</b></div>' +
          '<div><span>负</span><b data-gb-sl>0</b></div>' +
          '<div><span>平</span><b data-gb-sd>0</b></div>' +
        '</div></div>',
      help: [
        ['落子', '点击空格放下 ×，电脑随后落 ○'],
        ['胜负', '横、竖、斜三子连线即获胜'],
        ['难度', '完美电脑不会失误，简单电脑随机落子'],
        ['计分', '本次胜 / 负 / 平保存在右侧卡片'],
        ['计时', '从你第一次落子才开始'],
        ['记录', '场次与最快胜局写入本机记录']
      ],
      status: '你先手（×），点击空格落子。'
    });

    gridEl = qs(host, '[data-gb-grid]');
    clock = makeClock(host);
    if (api && typeof api.onCleanup === 'function') api.onCleanup(function () { clock.stop(); });

    function newBoard() { return new Array(9).fill(0); }
    function full(bd) {
      for (var i = 0; i < 9; i++) if (!bd[i]) return false;
      return true;
    }
    function findWinner(bd) {
      for (var i = 0; i < LINES.length; i++) {
        var a = LINES[i][0], b = LINES[i][1], c = LINES[i][2];
        if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) {
          return { side: bd[a], line: [a, b, c] };
        }
      }
      return null;
    }
    function minimax(bd, side, depth) {
      var w = findWinner(bd);
      if (w) return w.side === 2 ? (10 - depth) : (depth - 10);
      if (full(bd)) return 0;
      var best = side === 2 ? -Infinity : Infinity;
      for (var i = 0; i < 9; i++) {
        if (bd[i]) continue;
        bd[i] = side;
        var v = minimax(bd, side === 2 ? 1 : 2, depth + 1);
        bd[i] = 0;
        if (side === 2) { if (v > best) best = v; }
        else { if (v < best) best = v; }
      }
      return best;
    }
    function chooseAI() {
      var empties = [];
      for (var i = 0; i < 9; i++) if (!board[i]) empties.push(i);
      if (!empties.length) return -1;
      if (diff === 'easy') return empties[Math.floor(Math.random() * empties.length)];
      var best = -Infinity, pool = [];
      for (var k = 0; k < empties.length; k++) {
        var idx = empties[k];
        board[idx] = 2;
        var v = minimax(board, 1, 1);
        board[idx] = 0;
        if (v > best) { best = v; pool = [idx]; }
        else if (v === best) pool.push(idx);
      }
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function render() {
      if (!gridEl) return;
      var winMap = {};
      for (var w = 0; w < winLine.length; w++) winMap[winLine[w]] = 1;
      var html = '';
      for (var i = 0; i < 9; i++) {
        var v = board[i];
        var cls = 'gb-ttt-sq';
        if (v === 1) cls += ' is-x';
        else if (v === 2) cls += ' is-o';
        if (i === lastMove) cls += ' is-last';
        if (winMap[i]) cls += ' is-win';
        var label = v === 1 ? '×' : v === 2 ? '○' : '空位';
        html += '<button type="button" class="' + cls + '" data-i="' + i + '" aria-label="' + label + '">';
        if (v) html += '<span class="gb-ttt-mark">' + (v === 1 ? '×' : '○') + '</span>';
        html += '</button>';
      }
      gridEl.innerHTML = html;
      refreshHud();
    }
    function refreshHud() {
      setText(host, '[data-gb-turn]', over ? '已结束' : (thinking ? '思考中' : (turn === 1 ? '你（×）' : '电脑（○）')));
      setText(host, '[data-gb-info="diff"]', DIFFS[diff]);
      setText(host, '[data-gb-sw]', session.win);
      setText(host, '[data-gb-sl]', session.lose);
      setText(host, '[data-gb-sd]', session.draw);
      setText(host, '[data-gb-time]', fmtMs(clock.elapsed()));
    }
    function refreshStatus() {
      if (over) return;
      if (thinking) { setStatus(host, '电脑思考中，请稍候…', 'warn'); return; }
      if (turn === 1) setStatus(host, '轮到你落子（×）。', '');
      else setStatus(host, '电脑走棋。', '');
    }
    function cancelAI() {
      aiToken++;
      if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
      thinking = false;
    }
    function finishGame(result, title, detail, line) {
      if (over) return;
      over = true;
      thinking = false;
      cancelAI();
      clock.stop();
      winLine = line || [];
      if (result === 'win') session.win++;
      else if (result === 'lose') session.lose++;
      else session.draw++;
      settle(host, '井字棋', {
        result: result, title: title, detail: detail,
        timeMs: clock.elapsed(), scoreWins: true, unit: '胜'
      });
      render();
      refreshStatus();
    }
    function afterPlace(side) {
      var w = findWinner(board);
      if (w) {
        if (w.side === 1) {
          winLine = w.line;
          finishGame('win', '你赢了', '三子连线', w.line);
        } else {
          winLine = w.line;
          finishGame('lose', '电脑赢了', '三子连线', w.line);
        }
        return true;
      }
      if (full(board)) {
        finishGame('draw', '平局', '棋盘已满');
        return true;
      }
      turn = side === 1 ? 2 : 1;
      render();
      if (turn === 2) scheduleAI();
      else refreshStatus();
      return false;
    }
    function place(i, side, byAI) {
      if (over || board[i]) return;
      board[i] = side;
      lastMove = i;
      if (!byAI) clock.start();
      SFX.place();
      render();
      if (afterPlace(side)) return;
    }
    function scheduleAI() {
      if (over || turn !== 2) return;
      thinking = true;
      refreshHud();
      refreshStatus();
      var token = ++aiToken;
      var started = Date.now();
      aiTimer = setTimeout(function () {
        if (!host.isConnected || token !== aiToken || over || turn !== 2) return;
        var idx = chooseAI();
        var wait = Math.max(0, 250 - (Date.now() - started));
        aiTimer = setTimeout(function () {
          if (!host.isConnected || token !== aiToken || over) return;
          thinking = false;
          if (idx < 0) { finishGame('draw', '平局', '棋盘已满'); return; }
          place(idx, 2, true);
        }, wait);
      }, 30);
    }
    function newGame() {
      cancelAI();
      over = false;
      thinking = false;
      board = newBoard();
      turn = 1;
      winLine = []; lastMove = -1;
      clock.reset();
      hideResult(host);
      markThis(host, '进行中', '00:00');
      updateRecordCard(host, '井字棋', '胜');
      render();
      refreshStatus();
    }

    gridEl.addEventListener('click', function (e) {
      var node = e.target;
      while (node && node !== gridEl && !(node.getAttribute && node.getAttribute('data-i') != null)) node = node.parentNode;
      if (!node || node === gridEl) return;
      if (over || thinking || turn !== 1) return;
      var i = parseInt(node.getAttribute('data-i'), 10);
      if (board[i]) { SFX.invalid(); return; }
      place(i, 1, false);
    });

    qs(host, '[data-gb-new]').onclick = newGame;
    var diffSel = qs(host, '[data-gb-diff]');
    diffSel.onchange = function () {
      diff = this.value;
      refreshHud();
      refreshStatus();
      T.toast('难度：' + DIFFS[diff]);
    };
    qs(host, '[data-gb-reset-score]').onclick = function () {
      session = { win: 0, lose: 0, draw: 0 };
      refreshHud();
      T.toast('本次比分已清零');
    };

    board = newBoard();
    turn = 1;
    diff = 'perfect';
    diffSel.value = 'perfect';
    bindCommon(host, api, newGame, function () { return false; });
    newGame();
    if (api && typeof api.onCleanup === 'function') {
      api.onCleanup(function () { cancelAI(); clock.stop(); });
    }
  } });

})();
