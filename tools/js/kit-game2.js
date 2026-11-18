/* ============================================================
   工具实现：新游戏（象棋 / 打砖块 / 心算 / 反应 / 色彩辨识）
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const gameHud = window.GAME_KIT && window.GAME_KIT.gameHud;
  const esc = T.esc;
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  /* ---------------- 象棋（本地双人，简化规则） ---------------- */
  R('象棋', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="xqNew">重新开始</button><button class="btn btn-ghost" id="xqUndo">悔棋</button><span class="cp-note" id="xqMsg">红方走棋</span></div>
      ${'<div class="game-center"><canvas id="xqCv" width="460" height="510" style="max-width:100%;border-radius:10px;background:#e8c88f;border:1px solid var(--line-strong)"></canvas></div>'}
      <div class="note">本地双人对弈，点击棋子后再点目标格。为简化实现：吃掉对方将/帅即获胜；未实现将军提示、长将判负与和棋规则。</div></div>`;
    const cv = host.querySelector('#xqCv'), cx = cv.getContext('2d'), msg = host.querySelector('#xqMsg');
    const hud = gameHud ? gameHud(host, '象棋', { mode: 'time' }) : null;
    const CELL = 50, M = 30, COLS = 9, ROWS = 10;
    let board, turn, sel, over, history;
    const char = p => p.c === 'r' ? ({ 将: '帥', 士: '仕', 象: '相' }[p.t] || p.t) : p.t;
    function fresh() {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      const back = ['车', '马', '象', '士', '将', '士', '象', '马', '车'];
      back.forEach((t, c) => { board[0][c] = { t, c: 'b' }; board[9][c] = { t: t === '将' ? '将' : t, c: 'r' }; });
      [1, 7].forEach(c => { board[2][c] = { t: '炮', c: 'b' }; board[7][c] = { t: '炮', c: 'r' }; });
      [0, 2, 4, 6, 8].forEach(c => { board[3][c] = { t: '卒', c: 'b' }; board[6][c] = { t: '兵', c: 'r' }; });
      turn = 'r'; sel = null; over = false; history = [];
      msg.textContent = '红方走棋';
      if (hud) hud.reset();
      draw();
    }
    const inBoard = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
    const palace = (r, c, col) => c >= 3 && c <= 5 && (col === 'b' ? r >= 0 && r <= 2 : r >= 7 && r <= 9);
    const clearLine = (r1, c1, r2, c2) => {
      if (r1 === r2) { const a = Math.min(c1, c2), b = Math.max(c1, c2); for (let c = a + 1; c < b; c++) if (board[r1][c]) return false; return true; }
      if (c1 === c2) { const a = Math.min(r1, r2), b = Math.max(r1, r2); for (let r = a + 1; r < b; r++) if (board[r][c1]) return false; return true; }
      return false;
    };
    function legal(r, c) {
      const p = board[r][c]; if (!p) return [];
      const out = [];
      const add = (rr, cc) => { if (!inBoard(rr, cc)) return; if (board[rr][cc] && board[rr][cc].c === p.c) return; out.push([rr, cc]); };
      if (p.t === '车') {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { let rr = r + dr, cc = c + dc; while (inBoard(rr, cc)) { if (!board[rr][cc]) out.push([rr, cc]); else { if (board[rr][cc].c !== p.c) out.push([rr, cc]); break; } rr += dr; cc += dc; } });
      } else if (p.t === '马') {
        [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
          const lr = r + (Math.abs(dr) === 2 ? dr / 2 : 0), lc = c + (Math.abs(dc) === 2 ? dc / 2 : 0);
          if (inBoard(r + dr, c + dc) && !board[lr][lc]) add(r + dr, c + dc);
        });
      } else if (p.t === '象' || p.t === '相') {
        [[-2, -2], [-2, 2], [2, -2], [2, 2]].forEach(([dr, dc]) => {
          const rr = r + dr, cc = c + dc;
          if (!inBoard(rr, cc) || (p.c === 'b' ? rr > 4 : rr < 5)) return;
          if (!board[r + dr / 2][c + dc / 2]) add(rr, cc);
        });
      } else if (p.t === '士') {
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (palace(rr, cc, p.c)) add(rr, cc); });
      } else if (p.t === '将') {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (palace(rr, cc, p.c)) add(rr, cc); });
        const dir = p.c === 'b' ? 1 : -1;
        for (let rr = r + dir; rr >= 0 && rr < ROWS; rr += dir) { const q = board[rr][c]; if (q) { if (q.t === '将' && q.c !== p.c) out.push([rr, c]); break; } }
      } else if (p.t === '炮') {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
          let rr = r + dr, cc = c + dc, jumped = false;
          while (inBoard(rr, cc)) {
            const q = board[rr][cc];
            if (!jumped) { if (!q) out.push([rr, cc]); else jumped = true; }
            else if (q) { if (q.c !== p.c) out.push([rr, cc]); break; }
            rr += dr; cc += dc;
          }
        });
      } else if (p.t === '兵' || p.t === '卒') {
        const dir = p.c === 'b' ? 1 : -1;
        add(r + dir, c);
        if (p.c === 'b' ? r >= 5 : r <= 4) { add(r, c - 1); add(r, c + 1); }
      }
      return out;
    }
    function snapshot() { history.push({ b: board.map(r => r.map(p => p ? { ...p } : null)), t: turn, s: sel }); if (history.length > 40) history.shift(); }
    function undo() {
      if (!history.length) return T.toast('没有可悔的棋', 'err');
      const h = history.pop(); board = h.b; turn = h.t; sel = h.s; over = false; msg.textContent = turn === 'r' ? '红方走棋' : '黑方走棋'; draw();
    }
    function click(ev) {
      if (over) return;
      const rect = cv.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * cv.width / rect.width, y = (ev.clientY - rect.top) * cv.height / rect.height;
      const c = Math.round((x - M) / CELL), r = Math.round((y - M) / CELL);
      if (!inBoard(r, c)) return;
      const p = board[r][c];
      if (sel) {
        if (p && p.c === turn) { sel = [r, c]; draw(); return; }
        if (legal(sel[0], sel[1]).some(([rr, cc]) => rr === r && cc === c)) {
          snapshot();
          const captured = board[r][c]; board[r][c] = board[sel[0]][sel[1]]; board[sel[0]][sel[1]] = null;
          const isGeneral = captured && captured.t === '将';
          sel = null;
          if (isGeneral) { over = true; msg.textContent = (turn === 'r' ? '红方胜' : '黑方胜') + ' · 点击重新开始'; if (hud) hud.finish({ win: true }); }
          else { turn = turn === 'r' ? 'b' : 'r'; msg.textContent = turn === 'r' ? '红方走棋' : '黑方走棋'; }
          draw(); return;
        }
        sel = null; draw(); return;
      }
      if (p && p.c === turn) { sel = [r, c]; draw(); }
    }
    function draw() {
      cx.fillStyle = '#e8c88f'; cx.fillRect(0, 0, cv.width, cv.height);
      cx.strokeStyle = '#6b4a21'; cx.lineWidth = 1.2;
      for (let c = 0; c < COLS; c++) { const x = M + c * CELL; cx.beginPath(); cx.moveTo(x, M); cx.lineTo(x, M + 4 * CELL); cx.moveTo(x, M + 5 * CELL); cx.lineTo(x, M + 9 * CELL); cx.stroke(); }
      for (let r = 0; r < ROWS; r++) { const y = M + r * CELL; cx.beginPath(); cx.moveTo(M, y); cx.lineTo(M + 8 * CELL, y); cx.stroke(); }
      cx.beginPath(); cx.moveTo(M, M + 4 * CELL); cx.lineTo(M, M + 5 * CELL); cx.moveTo(M + 8 * CELL, M + 4 * CELL); cx.lineTo(M + 8 * CELL, M + 5 * CELL); cx.stroke();
      cx.strokeStyle = 'rgba(107,74,33,.6)';
      [[0, 3], [0, 5], [7, 3], [7, 5], [9, 3], [9, 5]].forEach(([r, c], i) => {
        const x = M + c * CELL, y = M + r * CELL;
        cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + (c < 3 ? 2 : -2) * CELL, y + (r < 4 ? 2 : -2) * CELL); cx.stroke();
      });
      cx.fillStyle = 'rgba(107,74,33,.72)'; cx.font = '15px "Songti SC","SimSun",serif'; cx.textAlign = 'center';
      cx.fillText('楚 河', M + 2.5 * CELL, M + 4.55 * CELL); cx.fillText('汉 界', M + 6.5 * CELL, M + 4.55 * CELL);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const p = board[r][c]; if (!p) continue;
        const x = M + c * CELL, y = M + r * CELL;
        cx.beginPath(); cx.arc(x, y, 20, 0, 7);
        cx.fillStyle = p.c === 'r' ? '#f6d7a7' : '#f0e2c4'; cx.fill();
        cx.strokeStyle = p.c === 'r' ? '#b63a2e' : '#1f2937'; cx.lineWidth = 2; cx.stroke();
        cx.fillStyle = p.c === 'r' ? '#b63a2e' : '#1f2937'; cx.font = 'bold 20px "Songti SC","SimSun",serif'; cx.textBaseline = 'middle';
        cx.fillText(char(p), x, y + 1);
      }
      if (sel) { cx.strokeStyle = '#2d5c4d'; cx.lineWidth = 3; cx.strokeRect(M + sel[1] * CELL - 23, M + sel[0] * CELL - 23, 46, 46); legal(sel[0], sel[1]).forEach(([r, c]) => { cx.beginPath(); cx.arc(M + c * CELL, M + r * CELL, 5, 0, 7); cx.fillStyle = 'rgba(45,92,77,.6)'; cx.fill(); }); }
      cx.textBaseline = 'alphabetic';
    }
    cv.addEventListener('click', click);
    host.querySelector('#xqNew').onclick = fresh;
    host.querySelector('#xqUndo').onclick = undo;
    api.onCleanup(() => {});
    fresh();
  }});

  /* ---------------- 打砖块 ---------------- */
  R('打砖块', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="bkNew">重新开始</button><span class="cp-label">← → / A D 移动挡板，或直接在画面上移动鼠标</span><span class="cp-note" id="bkScore">得分 0 · 生命 3</span></div>
      ${'<div class="game-center"><canvas id="bkCv" width="420" height="320" style="max-width:100%;border-radius:10px;background:var(--surface-2);border:1px solid var(--line)"></canvas></div>'}</div>`;
    const cv = host.querySelector('#bkCv'), cx = cv.getContext('2d'), scoreEl = host.querySelector('#bkScore');
    const hud = gameHud ? gameHud(host, '打砖块', { mode: 'score' }) : null;
    const W = 420, H = 320, COLS = 7, ROWS = 4, BW = 52, BH = 14;
    let paddle, ball, bricks, score, lives, over, raf, left, right;
    function fresh() {
      paddle = { x: W / 2 - 36, y: H - 24, w: 72, h: 8 };
      ball = { x: W / 2, y: H - 40, dx: 3.2, dy: -3.2, r: 5 };
      bricks = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => ({ x: 18 + c * (BW + 6), y: 34 + r * (BH + 8), alive: true, color: ['#2d5c4d', '#b65c3f', '#d9a441', '#4c7f6d'][r] })));
      score = 0; lives = 3; over = false; left = false; right = false;
      scoreEl.textContent = '得分 0 · 生命 3'; if (hud) hud.reset(); draw(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function draw() {
      cx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-2').trim() || '#f9f8f3';
      cx.fillRect(0, 0, W, H);
      bricks.forEach(row => row.forEach(b => { if (!b.alive) return; cx.fillStyle = b.color; cx.fillRect(b.x, b.y, BW, BH); }));
      cx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2d5c4d';
      cx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      cx.beginPath(); cx.arc(ball.x, ball.y, ball.r, 0, 7); cx.fill();
      if (over) { cx.fillStyle = 'rgba(10,13,20,.7)'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.font = 'bold 24px sans-serif'; cx.fillText('游戏结束', W / 2, H / 2 - 8); cx.font = '13px sans-serif'; cx.fillText('得分 ' + score + ' · 点击重新开始', W / 2, H / 2 + 22); cx.textAlign = 'left'; }
    }
    function loop() {
      if (over) return;
      if (left) paddle.x -= 7; if (right) paddle.x += 7;
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
      ball.x += ball.dx; ball.y += ball.dy;
      if (ball.x < ball.r || ball.x > W - ball.r) { ball.dx *= -1; ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x)); }
      if (ball.y < ball.r) { ball.dy *= -1; ball.y = ball.r; }
      if (ball.y > H - ball.r) { lives--; if (lives <= 0) { over = true; if (hud) hud.finish({ win: false, score }); } else { ball.x = W / 2; ball.y = H - 40; ball.dx = 3.2; ball.dy = -3.2; } }
      if (ball.y + ball.r >= paddle.y && ball.y < paddle.y + paddle.h && ball.x > paddle.x && ball.x < paddle.x + paddle.w && ball.dy > 0) {
        ball.dy *= -1; ball.y = paddle.y - ball.r;
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.dx = hit * 4.2;
      }
      bricks.forEach(row => row.forEach(b => {
        if (!b.alive) return;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + BW && ball.y + ball.r > b.y && ball.y - ball.r < b.y + BH) {
          b.alive = false; ball.dy *= -1; score += 10; scoreEl.textContent = `得分 ${score} · 生命 ${lives}`;
        }
      }));
      if (bricks.every(row => row.every(b => !b.alive))) { over = true; if (hud) hud.finish({ win: true, score }); }
      draw(); raf = requestAnimationFrame(loop);
    }
    document.addEventListener('keydown', function kh(e) { if (!host.isConnected) { document.removeEventListener('keydown', kh); return; } const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') { e.preventDefault(); left = true; } if (k === 'arrowright' || k === 'd') { e.preventDefault(); right = true; } });
    document.addEventListener('keyup', function ku(e) { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') left = false; if (k === 'arrowright' || k === 'd') right = false; });
    cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); paddle.x = Math.max(0, Math.min(W - paddle.w, (e.clientX - r.left) * W / r.width - paddle.w / 2)); });
    cv.addEventListener('touchmove', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), t = e.touches[0]; paddle.x = Math.max(0, Math.min(W - paddle.w, (t.clientX - r.left) * W / r.width - paddle.w / 2)); }, { passive: false });
    host.querySelector('#bkNew').onclick = fresh;
    api.onCleanup(() => { cancelAnimationFrame(raf); });
    fresh();
  }});

  /* ---------------- 心算挑战 ---------------- */
  R('心算挑战', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><select id="mmLevel" class="btn btn-ghost"><option value="1">简单（两位数加减）</option><option value="2" selected>中等（两位乘一位）</option><option value="3">困难（三位加减乘）</option></select><button class="btn btn-primary" id="mmStart">开始挑战</button><span class="cp-note" id="mmState">60 秒内尽可能多答对</span></div>
      <div class="game-center" style="padding:18px"><div id="mmQ" style="font-size:clamp(28px,5vw,46px);font-weight:800;letter-spacing:2px;color:var(--accent);font-variant-numeric:tabular-nums">点击开始挑战</div>
        <div class="cp-row" style="justify-content:center;margin-top:14px"><input id="mmA" type="number" inputmode="numeric" style="width:130px;text-align:center;font-size:22px;padding:8px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px" disabled><button class="btn btn-primary" id="mmOk" disabled>提交</button></div>
        <div id="mmScore" style="margin-top:12px;font-family:var(--font-mono);font-size:12px;color:var(--text-3)">得分 0 · 连对 0 · 剩余 60 秒</div></div>
      <div class="note">答错会扣 5 分并重置连对；中途可随时重新开始。</div></div>`;
    const hud = gameHud ? gameHud(host, '心算挑战', { mode: 'score' }) : null;
    const qEl = host.querySelector('#mmQ'), aEl = host.querySelector('#mmA'), scoreEl = host.querySelector('#mmScore'), state = host.querySelector('#mmState');
    let q = null, score = 0, streak = 0, bestStreak = 0, left = 60, timer = null, playing = false;
    const gen = () => {
      const lv = +host.querySelector('#mmLevel').value;
      let a, b, op, ans;
      if (lv === 1) { a = rnd(10, 99); b = rnd(10, 99); op = Math.random() < .5 ? '+' : '-'; if (op === '-' && a < b) [a, b] = [b, a]; ans = op === '+' ? a + b : a - b; }
      else if (lv === 2) { a = rnd(11, 99); b = rnd(2, 9); op = '×'; ans = a * b; }
      else { a = rnd(100, 999); b = rnd(10, 99); op = Math.random() < .5 ? '+' : '-'; if (op === '-' && a < b) [a, b] = [b, a]; ans = op === '+' ? a + b : a - b; }
      return { text: `${a} ${op} ${b} = ?`, ans };
    };
    const paint = () => { scoreEl.textContent = `得分 ${score} · 连对 ${streak} · 剩余 ${left} 秒`; };
    function start() {
      clearInterval(timer); playing = true; score = 0; streak = 0; bestStreak = 0; left = 60; q = gen(); qEl.textContent = q.text; aEl.disabled = false; aEl.value = ''; aEl.focus(); host.querySelector('#mmOk').disabled = false; state.textContent = '答题中…'; paint(); if (hud) hud.reset();
      timer = setInterval(() => { left--; paint(); if (left <= 0) end(); }, 1000);
    }
    function end() {
      clearInterval(timer); playing = false; aEl.disabled = true; host.querySelector('#mmOk').disabled = true; qEl.textContent = `时间到 · 得分 ${score}`; state.textContent = `完成 · 最高连对 ${bestStreak}`; if (hud) hud.finish({ win: true, score });
    }
    function submit() {
      if (!playing || q == null) return;
      const v = Number(aEl.value); if (aEl.value === '') return;
      if (v === q.ans) { score += 10; streak++; bestStreak = Math.max(bestStreak, streak); } else { score = Math.max(0, score - 5); streak = 0; }
      q = gen(); qEl.textContent = q.text; aEl.value = ''; aEl.focus(); paint();
    }
    host.querySelector('#mmStart').onclick = start;
    host.querySelector('#mmOk').onclick = submit;
    aEl.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    api.onCleanup(() => clearInterval(timer));
  }});

  /* ---------------- 反应测试 ---------------- */
  R('反应测试', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="rxStart">开始测试</button><span class="cp-note" id="rxMsg">看到绿色后立即点击，共 5 轮</span></div>
      <div id="rxZone" style="height:260px;border-radius:12px;border:1px solid var(--line);display:grid;place-items:center;background:var(--surface-2);cursor:pointer;user-select:none"><span id="rxBig" style="font-size:22px;font-weight:700;color:var(--text-3)">点击开始测试</span></div>
      <div id="rxStats" class="sys-grid" style="margin-top:12px"></div></div>`;
    const zone = host.querySelector('#rxZone'), big = host.querySelector('#rxBig'), msg = host.querySelector('#rxMsg'), stats = host.querySelector('#rxStats');
    const hud = gameHud ? gameHud(host, '反应测试', { mode: 'time' }) : null;
    let state = 'idle', t0 = 0, round = 0, times = [], waitTimer = null;
    const paint = () => {
      stats.innerHTML = `<div class="sys-card"><div class="sys-title">本轮结果</div><div class="kv-grid"><div class="kv-k">轮次</div><div class="kv-v">${round} / 5</div><div class="kv-k">最近反应</div><div class="kv-v">${times.length ? times[times.length - 1] + ' ms' : '—'}</div><div class="kv-k">平均反应</div><div class="kv-v">${times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) + ' ms' : '—'}</div></div></div>`;
    };
    function next() {
      if (round >= 5) {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        state = 'done'; big.textContent = `平均 ${avg} ms`; msg.textContent = '完成 · 点击重新开始'; zone.style.background = 'var(--surface-2)';
        if (hud) hud.finish({ win: true, score: Math.max(0, 1000 - avg) }); paint(); return;
      }
      state = 'wait'; zone.style.background = 'var(--surface-2)'; big.textContent = '等待绿色…'; big.style.color = 'var(--text-3)'; msg.textContent = `第 ${round + 1} / 5 轮`;
      waitTimer = setTimeout(() => { if (state !== 'wait') return; state = 'go'; zone.style.background = 'var(--good)'; big.textContent = '点击！'; big.style.color = '#fff'; t0 = performance.now(); }, rnd(900, 2600));
    }
    function start() {
      clearTimeout(waitTimer); times = []; round = 0; state = 'wait'; big.style.color = 'var(--text-3)'; if (hud) hud.reset(); paint(); next();
    }
    zone.onclick = () => {
      if (state === 'idle' || state === 'done') return start();
      if (state === 'wait') { clearTimeout(waitTimer); state = 'idle'; big.textContent = '太早了，重新开始'; big.style.color = 'var(--err)'; msg.textContent = '点击重新开始'; return; }
      if (state === 'go') { const ms = Math.round(performance.now() - t0); times.push(ms); round++; big.style.color = 'var(--text-3)'; state = 'wait'; paint(); next(); }
    };
    host.querySelector('#rxStart').onclick = start;
    api.onCleanup(() => clearTimeout(waitTimer));
    paint();
  }});

  /* ---------------- 色彩辨识度测试 ---------------- */
  R('色彩辨识度测试', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="cdStart">开始测试</button><span class="cp-note" id="cdMsg">找出颜色略有不同的一格</span><span class="cp-note" id="cdScore">得分 0 · 关卡 1</span></div>
      <div class="game-center"><div id="cdGrid" style="display:inline-grid;grid-template-columns:repeat(3,70px);gap:8px;padding:10px;background:var(--surface-2);border:1px solid var(--line);border-radius:12px"></div></div>
      <div class="note">难度会逐关提高；点击错误格子扣 5 分。测试结果仅用于娱乐与粗略参考，不构成医学诊断。</div></div>`;
    const grid = host.querySelector('#cdGrid'), msg = host.querySelector('#cdMsg'), scoreEl = host.querySelector('#cdScore');
    const hud = gameHud ? gameHud(host, '色彩辨识度测试', { mode: 'score' }) : null;
    let level = 1, score = 0, playing = false, diff = 18, timer = null, left = 30;
    const hsl = (h, s, l) => {
      s /= 100; l /= 100; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
      const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6];
      return '#' + seg.map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
    };
    function paint() {
      const h = rnd(0, 359), s = rnd(42, 68), baseL = 52, target = rnd(0, 8);
      const base = hsl(h, s, baseL), diffColor = hsl(h, s, baseL + diff);
      grid.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const d = document.createElement('div'); d.style.cssText = `width:70px;height:70px;border-radius:8px;cursor:pointer;background:${i === target ? diffColor : base}`;
        d.onclick = () => {
          if (!playing) return;
          if (i === target) { score += 10 + level * 2; level++; diff = Math.max(2, diff - 1.1); msg.textContent = '正确！继续'; paint(); }
          else { score = Math.max(0, score - 5); msg.textContent = '不是这一格'; }
          scoreEl.textContent = `得分 ${score} · 关卡 ${level}`;
        };
        grid.appendChild(d);
      }
    }
    function start() {
      clearInterval(timer); level = 1; score = 0; diff = 18; playing = true; left = 30; msg.textContent = '找出颜色略有不同的一格'; if (hud) hud.reset(); paint(); scoreEl.textContent = '得分 0 · 关卡 1';
      timer = setInterval(() => { left--; if (left <= 0) { playing = false; clearInterval(timer); msg.textContent = '时间到'; if (hud) hud.finish({ win: true, score }); } }, 1000);
    }
    host.querySelector('#cdStart').onclick = start;
    api.onCleanup(() => clearInterval(timer));
  }});
})();
