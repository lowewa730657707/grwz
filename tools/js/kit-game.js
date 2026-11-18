/* ============================================================
   工具实现：益智小游戏（纯前端可玩）
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  /* 表单字段助手：用 NF/SF/XF 命名，避免与游戏内部的 N/S 常量遮蔽冲突 */
  const NF = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const SF = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const XF = (key, label, def, extra) => Object.assign({ key, label, type: 'textarea', def, rows: 6 }, extra || {});
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rnd(0, a.length - 1)];
  const cellStyle = 'width:42px;height:42px;display:grid;place-items:center;border-radius:6px;background:var(--surface);border:1px solid var(--line);font-weight:700;font-size:17px';
  const center = html => `<div class="game-center">${html}</div>`;
  const REC_KEY = 'toolbox_game_records_v1';
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => T.esc(s);
  function fmtMs(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
  }
  function readGameRecords() {
    try { const v = JSON.parse(localStorage.getItem(REC_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
  }
  function writeGameRecords(v) { try { localStorage.setItem(REC_KEY, JSON.stringify(v)); } catch (e) {} }
  /* 游戏计时 + 本地记录条
   * 计时从「第一次操作」开始（不是打开工具就开始）；结束时统一给出结果反馈。 */
  function readSoundOn() {
    try { return localStorage.getItem('toolbox_game_sound') !== 'off'; } catch (e) { return true; }
  }
  function writeSoundOn(on) {
    try { localStorage.setItem('toolbox_game_sound', on ? 'on' : 'off'); } catch (e) { /* noop */ }
  }
  function gameTone(kind, on) {
    if (!on) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const t0 = ctx.currentTime + 0.02;
      const seq = kind === 'win' ? [[523, 0], [659, .12], [784, .24]]
        : kind === 'lose' ? [[392, 0], [311, .14], [233, .28]]
          : [[440, 0], [523, .14]];
      seq.forEach(([f, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + d);
        g.gain.exponentialRampToValueAtTime(0.08, t0 + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.16);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0 + d); o.stop(t0 + d + 0.18);
      });
      setTimeout(() => { try { ctx.close(); } catch (e) { /* noop */ } }, 1400);
    } catch (e) { /* noop */ }
  }

  function gameHud(host, name, opts) {
    opts = opts || {};
    const mode = opts.mode || 'time';
    let rec = readGameRecords()[name] || {};

    const hud = document.createElement('div');
    hud.className = 'game-hud';
    const bestLabel = mode === 'score' ? '最高分' : mode === 'win' ? '战绩' : '最佳用时';
    const bestText = () => {
      if (mode === 'score') return rec.bestScore != null ? rec.bestScore : '—';
      if (mode === 'win') return (rec.wins || 0) + ' 胜 / ' + (rec.losses || 0) + ' 负';
      return rec.bestTime != null ? fmtMs(rec.bestTime) : '—';
    };
    hud.innerHTML = `<div class="hud-cell"><span>用时</span><b data-hud-time>00:00</b></div>
      <div class="hud-cell"><span>${bestLabel}</span><b data-hud-best>${bestText()}</b></div>
      <div class="hud-actions"><button type="button" class="btn btn-ghost btn-sm" data-hud-sound>音效</button><button type="button" class="btn btn-ghost btn-sm" data-hud-reset>重置计时</button></div>`;
    host.prepend(hud);

    let startTs = 0, acc = 0, running = false, done = false, timer = null;
    let soundOn = readSoundOn();
    let armed = false, bannerEl = null;
    const timeEl = hud.querySelector('[data-hud-time]'), bestEl = hud.querySelector('[data-hud-best]');
    const soundBtn = hud.querySelector('[data-hud-sound]');
    const paintSound = () => { soundBtn.textContent = '音效 ' + (soundOn ? '开' : '关'); soundBtn.setAttribute('aria-pressed', String(soundOn)); };
    paintSound();
    soundBtn.onclick = () => {
      soundOn = !soundOn; writeSoundOn(soundOn); paintSound();
      if (soundOn) gameTone('click', true);
    };

    const elapsed = () => acc + (running ? Date.now() - startTs : 0);
    const render = () => {
      if (timeEl) timeEl.textContent = fmtMs(elapsed());
      if (bestEl) bestEl.textContent = bestText();
    };

    function disarm() {
      if (!armed) return;
      armed = false;
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('touchstart', onPointer, true);
    }
    function onPointer(e) {
      if (!host.isConnected) { disarm(); return; }
      if (e.target && host.contains(e.target) && !(e.target.closest && e.target.closest('.game-hud'))) begin();
    }
    function onHostClick(e) {
      if (!host.isConnected) { disarm(); return; }
      if (!e.target || !host.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.game-hud')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      begin();
    }
    function onKey(e) {
      if (!host.isConnected) { disarm(); return; }
      const t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      begin();
    }
    function arm() {
      if (armed || done) return;
      armed = true;
      document.addEventListener('pointerdown', onPointer, true);
      document.addEventListener('touchstart', onPointer, true);
      document.addEventListener('click', onHostClick, true);
      document.addEventListener('keydown', onKey, true);
    }
    function begin() {
      disarm();
      if (done || running) return;
      running = true; startTs = Date.now();
      if (!timer) timer = setInterval(render, 250);
      render();
    }
    function stop() {
      if (!running) return;
      acc = elapsed(); running = false;
      clearInterval(timer); timer = null; render();
    }
    function reset() {
      disarm();
      acc = 0; running = false; done = false;
      clearInterval(timer); timer = null;
      dismissBanner();
      render();
      arm();
    }

    function dismissBanner() {
      if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
      bannerEl = null;
    }
    function restartCandidate() {
      return Array.prototype.slice.call(host.querySelectorAll('button')).filter(b => {
        if (b.closest('.game-result')) return false;
        if (b.hasAttribute('data-hud-reset') || b.hasAttribute('data-hud-sound')) return false;
        return /重新开始|新游戏|换一局|再来一局|再来|重新生成|清空题目|开始游戏/.test(b.textContent);
      })[0] || null;
    }
    function showResultCard(res, ms) {
      dismissBanner();
      const isWin = !!(res && res.win === true);
      const isDraw = !!(res && res.draw);
      const kind = isDraw ? 'draw' : isWin ? 'win' : 'lose';
      const title = isDraw ? '平局' : isWin ? '完成' : '本局结束';
      const stats = [];
      stats.push('用时 ' + fmtMs(ms));
      if (res && res.score != null) stats.push('得分 ' + res.score);
      if (mode === 'score' && rec.bestScore != null) stats.push('最高分 ' + rec.bestScore);
      if (mode === 'time' && rec.bestTime != null) stats.push('最佳 ' + fmtMs(rec.bestTime));
      const again = restartCandidate();

      bannerEl = document.createElement('div');
      bannerEl.className = 'game-result is-' + kind;
      bannerEl.setAttribute('role', 'status');
      bannerEl.innerHTML = `<div class="game-result-card">
        <span class="gr-badge">${kind === 'draw' ? 'DRAW' : kind === 'win' ? 'CLEAR' : 'OVER'}</span>
        <h4>${title}</h4>
        <div class="gr-stats">${stats.map(s => `<span>${esc(s)}</span>`).join('')}</div>
        <div class="gr-actions">
          ${again ? '<button type="button" class="btn btn-primary btn-sm" data-gr-again>再来一局</button>' : ''}
          <button type="button" class="btn btn-ghost btn-sm" data-gr-close>关闭</button>
        </div>
      </div>`;
      host.appendChild(bannerEl);
      const againBtn = bannerEl.querySelector('[data-gr-again]');
      if (againBtn) againBtn.onclick = () => { dismissBanner(); reset(); again.click(); };
      bannerEl.querySelector('[data-gr-close]').onclick = dismissBanner;
      setTimeout(() => { if (bannerEl) bannerEl.classList.add('is-shown'); }, 20);
    }

    const finish = res => {
      if (done) return null;
      done = true;
      stop();
      disarm();
      const ms = elapsed();
      rec = readGameRecords()[name] || rec;
      rec.plays = (rec.plays || 0) + 1;
      if (res && res.draw) rec.draws = (rec.draws || 0) + 1;
      else if (res && res.win === false) rec.losses = (rec.losses || 0) + 1;
      else rec.wins = (rec.wins || 0) + 1;
      let improved = false;
      if (res && res.score != null && (rec.bestScore == null || res.score > rec.bestScore)) { rec.bestScore = res.score; improved = true; }
      if (ms > 0 && (!res || res.win !== false) && (rec.bestTime == null || ms < rec.bestTime)) { rec.bestTime = ms; improved = true; }
      rec.lastTime = ms; rec.updated = Date.now();
      const all = readGameRecords(); all[name] = rec; writeGameRecords(all);
      render();
      hud.classList.remove('is-done');
      void hud.offsetWidth;
      hud.classList.add('is-done');
      gameTone(res && res.draw ? 'draw' : res && res.win === false ? 'lose' : 'win', soundOn);
      showResultCard(res, ms);
      T.toast((res && res.draw ? '本局平局' : res && res.win === false ? '本局结束' : '完成本局') + ' · 用时 ' + fmtMs(ms));
      if (improved) setTimeout(() => T.toast('刷新最佳记录'), 900);
      return { ms, rec };
    };

    hud.querySelector('[data-hud-reset]').onclick = () => reset();
    if (T.cleanups) T.cleanups.push(() => { disarm(); clearInterval(timer); dismissBanner(); });
    reset();
    return { start: begin, stop, reset, finish, elapsed, hud };
  }

  /* ---------------- 数独：生成器 + 解题器 ---------------- */
  function sudokuSolve(grid) {
    const ok = (g, r, c, n) => {
      for (let i = 0; i < 9; i++) if (g[r][i] === n || g[i][c] === n) return false;
      const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[br + i][bc + j] === n) return false;
      return true;
    };
    const go = g => {
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!g[r][c]) {
        for (let n = 1; n <= 9; n++) if (ok(g, r, c, n)) { g[r][c] = n; if (go(g)) return true; g[r][c] = 0; }
        return false;
      }
      return true;
    };
    const g = grid.map(row => row.slice());
    return go(g) ? g : null;
  }
  function sudokuGame(name, isSolver) {
    R(name, { render(host, api) {
      host.innerHTML = `<div class="custom-pane"><div class="cp-row"><span class="cp-label">${isSolver ? '点击格子后用数字键 1-9 输入题目，0 / Delete 清空' : '点击格子后用数字键 1-9 填数，0 清空'}</span>
        <button class="btn btn-primary" id="skNew">${isSolver ? '清空题目' : '新游戏'}</button>
        ${isSolver ? '<button class="btn btn-ghost" id="skSolve">求解</button>' : '<select id="skLevel" class="btn btn-ghost"><option value="35">简单</option><option value="45" selected>中等</option><option value="55">困难</option></select><button class="btn btn-ghost" id="skHint">提示一格</button>'}
        <button class="btn btn-ghost" id="skCheck">检查</button><span class="cp-note" id="skMsg">用鼠标选中格子后输入数字</span></div>
        ${center('<div id="skBoard" style="display:inline-grid;grid-template-columns:repeat(9,42px);gap:2px;background:var(--surface-3);padding:5px;border-radius:10px"></div>')}
        <div class="cp-row" style="justify-content:center">${Array.from({length:9},(_,i)=>`<button class="btn btn-ghost sk-num" data-n="${i+1}">${i+1}</button>`).join('')}<button class="btn btn-ghost sk-num" data-n="0">清空</button></div></div>`;
      const board = host.querySelector('#skBoard'), msg = host.querySelector('#skMsg');
      const hud = isSolver ? null : gameHud(host, name, { mode: 'time' });
      let puzzle = Array.from({length:9},()=>Array(9).fill(0)), solution = null, fixed = Array.from({length:9},()=>Array(9).fill(false)), sel = null;
      const draw = () => {
        board.innerHTML = '';
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
          const d = document.createElement('div'); d.className = 'game-cell clickable';
          d.style.cssText = cellStyle + (c === 2 || c === 5 ? ';border-right:2px solid var(--accent)' : '') + (r === 2 || r === 5 ? ';border-bottom:2px solid var(--accent)' : '') + (sel && sel[0] === r && sel[1] === c ? ';background:var(--accent-soft);border-color:var(--accent)' : '');
          const val = puzzle[r][c];
          d.textContent = val || '';
          d.style.color = fixed[r][c] ? 'var(--text-2)' : 'var(--accent)';
          d.onclick = () => { sel = [r, c]; draw(); };
          board.appendChild(d);
        }
      };
      const put = n => {
        if (!sel) return msg.textContent = '请先点击选中一个格子';
        const [r, c] = sel;
        if (fixed[r][c]) return msg.textContent = '这是题目给定的数字，不能修改';
        puzzle[r][c] = n; draw(); msg.textContent = '';
      };
      host.querySelectorAll('.sk-num').forEach(b => b.onclick = () => put(+b.dataset.n));
      document.addEventListener('keydown', function keyHandler(e) {
        if (!host.isConnected) { document.removeEventListener('keydown', keyHandler); return; }
        if (/^[0-9]$/.test(e.key)) put(+e.key);
        else if (e.key === 'Backspace' || e.key === 'Delete') put(0);
        else if (sel && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const [r, c] = sel;
          sel = [T.clamp(r + (e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0), 0, 8), T.clamp(c + (e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0), 0, 8)];
          draw();
        }
      });
      function check() {
        const s = solution || sudokuSolve(puzzle.map(row => row.map(x => x || 0)));
        let wrong = 0, empty = 0;
        puzzle.forEach((row, r) => row.forEach((v, c) => { if (!v) empty++; else if (s && v !== s[r][c]) wrong++; }));
        msg.textContent = empty ? `还有 ${empty} 格未填` : wrong ? `有 ${wrong} 处不符合解` : '全部正确，完成！';
        msg.style.color = !empty && !wrong ? 'var(--good)' : '';
        if (!empty && !wrong && hud) hud.finish({ win: true });
      }
      host.querySelector('#skCheck').onclick = check;
      function newGame() {
        const base = Array.from({length:9},()=>Array(9).fill(0));
        for (let i = 0; i < 9; i++) { const n = i + 1; let placed = false; for (let k = 0; k < 30 && !placed; k++) { const r = rnd(0,8), c = rnd(0,8); if (!base[r][c] && sudokuSolve(base.map((row,ri)=>row.map((x,ci)=>ri===r&&ci===c?n:x)))) { base[r][c] = n; placed = true; } } }
        solution = sudokuSolve(base);
        if (isSolver) { puzzle = Array.from({length:9},()=>Array(9).fill(0)); fixed = Array.from({length:9},()=>Array(9).fill(false)); }
        else {
          const holes = +host.querySelector('#skLevel').value;
          puzzle = solution.map(row => row.slice()); fixed = Array.from({length:9},()=>Array(9).fill(true));
          let removed = 0, guard = 0;
          while (removed < holes && guard++ < 500) { const r = rnd(0,8), c = rnd(0,8); if (puzzle[r][c]) { puzzle[r][c] = 0; fixed[r][c] = false; removed++; } }
        }
        sel = null; msg.textContent = isSolver ? '输入题目后点击「求解」' : '新游戏开始！'; msg.style.color = ''; draw();
        if (hud) hud.reset();
      }
      host.querySelector('#skNew').onclick = newGame;
      if (isSolver) host.querySelector('#skSolve').onclick = () => {
        const s = sudokuSolve(puzzle.map(row => row.map(x => x || 0)));
        if (!s) return msg.textContent = '× 题目无解，请检查输入的数字';
        solution = s; puzzle = s.map(r => r.slice()); fixed = Array.from({length:9},()=>Array(9).fill(true)); draw(); msg.textContent = '求解完成';
      };
      else { host.querySelector('#skLevel').onchange = newGame; host.querySelector('#skHint').onclick = () => { if (!solution) return; for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!puzzle[r][c]) { puzzle[r][c] = solution[r][c]; fixed[r][c] = true; draw(); return; } }; }
      newGame();
      api.onCleanup(() => { ; /* pane detached */ });
    }});
  }
  sudokuGame('数独生成器', false);
  sudokuGame('数独解题器', true);

  /* ---------------- 扫雷 ---------------- */
  R('扫雷小游戏', { render(host, api) {
    const W = 9, H = 9, MINES = 10;
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="msNew">重新开始</button><span class="cp-label">左键翻开 · 右键标记旗帜</span><span class="cp-note" id="msMsg">找到所有非雷格子即获胜</span></div>
      ${center('<div id="msBoard" class="game-board" style="grid-template-columns:repeat(9,34px)"></div>')}</div>`;
    const board = host.querySelector('#msBoard'), msg = host.querySelector('#msMsg');
    const hud = gameHud(host, '扫雷小游戏', { mode: 'time' });
    let mine = [], open = [], flag = [], over = false, started = false, t0 = 0, timer = null;
    const cells = () => Array.from(board.children);
    function build() {
      mine = Array.from({length:H},()=>Array(W).fill(false));
      let n = 0; while (n < MINES) { const r = rnd(0,H-1), c = rnd(0,W-1); if (!mine[r][c]) { mine[r][c] = true; n++; } }
      open = Array.from({length:H},()=>Array(W).fill(false)); flag = Array.from({length:H},()=>Array(W).fill(false));
      over = false; started = false; clearInterval(timer); msg.textContent = '找到所有非雷格子即获胜';
      hud.reset();
      draw();
    }
    const near = (r,c) => { let n=0; for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<H&&cc>=0&&cc<W&&mine[rr][cc])n++;}return n; };
    function draw() {
      board.innerHTML = '';
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
        const d = document.createElement('div'); d.className = 'game-cell clickable';
        d.style.cssText = 'width:34px;height:34px;font-size:14px';
        if (open[r][c]) { d.style.background = 'var(--surface-2)'; if (mine[r][c]) { d.textContent = '×'; d.style.background = 'color-mix(in srgb,var(--err) 25%,transparent)'; } else { const n = near(r,c); d.textContent = n || ''; d.style.color = ['','#4ea8ff','#34d399','#fb7185','#a78bfa','#fbbf24','#22d3ee','#fff','#fff'][n]; } }
        else if (flag[r][c]) d.textContent = '⚑';
        d.onclick = () => reveal(r,c);
        d.oncontextmenu = e => { e.preventDefault(); if (!over && !open[r][c]) { flag[r][c] = !flag[r][c]; draw(); } };
        board.appendChild(d);
      }
    }
    function reveal(r,c) {
      if (over || open[r][c] || flag[r][c]) return;
      if (!started) { started = true; t0 = Date.now(); timer = setInterval(() => { if (over) return clearInterval(timer); msg.textContent = `用时 ${Math.floor((Date.now()-t0)/1000)} 秒 · ⚑ ${flag.flat().filter(Boolean).length}/${MINES}`; }, 500); }
      if (mine[r][c]) { open[r][c] = true; over = true; clearInterval(timer); mine.forEach((row,rr)=>row.forEach((m,cc)=>{if(m)open[rr][cc]=true;})); msg.textContent = '踩到雷了，点击重新开始'; hud.finish({ win: false }); draw(); return; }
      const flood = (rr,cc) => { if(rr<0||rr>=H||cc<0||cc>=W||open[rr][cc]||mine[rr][cc])return; open[rr][cc]=true; if(near(rr,cc)===0)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)flood(rr+dr,cc+dc); };
      flood(r,c);
      if (open.flat().filter(Boolean).length === W*H - MINES) { over = true; clearInterval(timer); msg.textContent = `扫雷成功！用时 ${Math.floor((Date.now()-t0)/1000)} 秒`; hud.finish({ win: true }); }
      draw();
    }
    host.querySelector('#msNew').onclick = build; build();
    api.onCleanup(() => clearInterval(timer));
  }});

  /* ---------------- 2048 ---------------- */
  R('2048 小游戏', { render(host, api) {
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="g2New">重新开始</button><span class="cp-label">方向键 / WASD 移动，相同数字合并</span></div>
      <div class="game-score"><div><b id="g2Score">0</b><span>当前得分</span></div><div><b id="g2Best">0</b><span>最高分</span></div></div>
      ${center('<div id="g2Board" class="game-board" style="grid-template-columns:repeat(4,72px)"></div>')}
      <div class="cp-row" style="justify-content:center"><button class="btn btn-ghost" data-d="ArrowUp">↑</button><button class="btn btn-ghost" data-d="ArrowLeft">←</button><button class="btn btn-ghost" data-d="ArrowDown">↓</button><button class="btn btn-ghost" data-d="ArrowRight">→</button></div></div>`;
    const board = host.querySelector('#g2Board');
    const hud = gameHud(host, '2048 小游戏', { mode: 'score' });
    let g = [], score = 0, best = 0, over = false;
    const colors = { 2:'#eef2f9',4:'#e0e7ff',8:'#a5b4fc',16:'#818cf8',32:'#6366f1',64:'#4f46e5',128:'#4ea8ff',256:'#22d3ee',512:'#34d399',1024:'#fbbf24',2048:'#fb7185' };
    const add = () => { const empty=[]; g.forEach((row,r)=>row.forEach((v,c)=>{if(!v)empty.push([r,c]);})); if(!empty.length)return false; const [r,c]=pick(empty); g[r][c]=Math.random()<.9?2:4; return true; };
    function draw() {
      board.innerHTML='';
      g.forEach(row=>row.forEach(v=>{const d=document.createElement('div');d.className='game-cell';d.style.cssText='width:72px;height:72px;font-size:22px;color:'+(v>4?'#fff':'#243044')+';background:'+(colors[v]||'var(--surface)');d.textContent=v||'';board.appendChild(d);}));
      host.querySelector('#g2Score').textContent=score;
      host.querySelector('#g2Best').textContent=best;
      if(over){const tip=document.createElement('div');tip.className='note err';tip.textContent='游戏结束，点击「重新开始」再来一局';host.querySelector('.custom-pane').appendChild(tip);}
    }
    function newGame(){g=Array.from({length:4},()=>Array(4).fill(0));score=0;over=false;add();add();host.querySelectorAll('.note.err').forEach(e=>e.remove());hud.reset();draw();}
    const rotCW = m => Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>m[3-c][r]));
    function move(dir){
      if(over)return;
      const before=JSON.stringify(g);
      const turns={ArrowLeft:0,ArrowDown:1,ArrowRight:2,ArrowUp:3}[dir];
      let m=g.map(r=>r.slice());
      for(let k=0;k<turns;k++)m=rotCW(m);
      let gained=0;
      m=m.map(row=>{
        const a=row.filter(Boolean),o=[];
        for(let i=0;i<a.length;i++){if(a[i]===a[i+1]){o.push(a[i]*2);gained+=a[i]*2;i++;}else o.push(a[i]);}
        while(o.length<4)o.push(0);
        return o;
      });
      for(let k=0;k<(4-turns)%4;k++)m=rotCW(m);
      g=m;score+=gained;
      if(JSON.stringify(g)!==before){add();best=Math.max(best,score);if(!canMove()){over=true;hud.finish({win:true,score});}}
      draw();
    }
    function canMove(){for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(!g[r][c]||(c<3&&g[r][c]===g[r][c+1])||(r<3&&g[r][c]===g[r+1][c]))return true;return false;}
    document.addEventListener('keydown',function kh(e){if(!host.isConnected){document.removeEventListener('keydown',kh);return;}
      const map={w:'ArrowUp',a:'ArrowLeft',s:'ArrowDown',d:'ArrowRight'};const k=map[e.key.toLowerCase()]||e.key;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)){e.preventDefault();move(k);}});
    host.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>move(b.dataset.d));
    host.querySelector('#g2New').onclick=newGame;newGame();
    api.onCleanup(()=>{; /* pane detached */});
  }});

  /* ---------------- 井字棋 ---------------- */
  R('井字棋', { render(host, api) {
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="ttNew">重新开始</button><span class="cp-note" id="ttMsg">你是 ×，点击格子落子</span></div>
      ${center('<div id="ttBoard" class="game-board" style="grid-template-columns:repeat(3,80px)"></div>')}</div>`;
    const board=host.querySelector('#ttBoard'),msg=host.querySelector('#ttMsg');
    const hud=gameHud(host,'井字棋',{mode:'win'});
    let b=Array(9).fill(''),over=false;
    const win=x=>[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(l=>l.every(i=>x[i]===x[l[0]]&&x[i]));
    function draw(){board.innerHTML='';b.forEach((v,i)=>{const d=document.createElement('div');d.className='game-cell clickable';d.style.cssText='width:80px;height:80px;font-size:34px;color:'+(v==='X'?'var(--accent)':'var(--err)');d.textContent=v==='X'?'×':v==='O'?'○':'';d.onclick=()=>play(i);board.appendChild(d);});}
    function play(i){if(over||b[i])return;b[i]='X';if(win(b)){msg.textContent='你赢了！';over=true;hud.finish({win:true});draw();return;}
      if(b.every(Boolean)){msg.textContent='平局';over=true;hud.finish({draw:true});draw();return;}
      const empty=b.map((v,k)=>v?null:k).filter(x=>x!==null);
      let ai=pick(empty);
      for(const t of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]){
        const line=t.map(k=>b[k]);if(line.filter(x=>x==='O').length===2&&line.includes('')){ai=t[line.indexOf('')];break;}
        if(line.filter(x=>x==='X').length===2&&line.includes(''))ai=t[line.indexOf('')];
      }
      if(!b[ai])b[ai]='O';
      if(win(b)){msg.textContent='电脑赢了';over=true;hud.finish({win:false});}
      else if(b.every(Boolean)){msg.textContent='平局';over=true;hud.finish({draw:true});}
      draw();}
    host.querySelector('#ttNew').onclick=()=>{b=Array(9).fill('');over=false;msg.textContent='你是 ×，点击格子落子';hud.reset();draw();};
    draw();
  }});

  /* ---------------- 猜数字 ---------------- */
  R('猜数字', { render(host, api) {
    host.innerHTML=`<div class="custom-pane">${center(`<div style="font-size:15px;line-height:2">我心里想了一个 <b>1 ~ 100</b> 的整数，猜猜看？</div>
      <div class="cp-row" style="justify-content:center;margin-top:14px"><input type="number" id="gnInput" min="1" max="100" style="width:110px;text-align:center;background:var(--bg-soft);border:1px solid var(--line);border-radius:8px;padding:9px;font-size:18px"><button class="btn btn-primary" id="gnGo">猜！</button><button class="btn btn-ghost" id="gnNew">换一局</button></div>
      <div id="gnMsg" style="margin-top:16px;font-size:16px;font-weight:700;color:var(--accent)">等待你的第一次猜测</div><div id="gnLog" style="margin-top:12px;text-align:left;max-width:340px;margin-left:auto;margin-right:auto;font-size:12px;color:var(--text-3)"></div>`)}</div>`;
    let n=0,tries=0,log=[];
    const hud=gameHud(host,'猜数字',{mode:'time'});
    const msg=host.querySelector('#gnMsg'),inp=host.querySelector('#gnInput'),logEl=host.querySelector('#gnLog');
    const fresh=()=>{n=rnd(1,100);tries=0;log=[];msg.textContent='等待你的第一次猜测';msg.style.color='var(--accent)';logEl.innerHTML='';inp.value='';inp.focus();hud.reset();};
    const go=()=>{const v=Math.round(+inp.value);if(!v||v<1||v>100)return msg.textContent='请输入 1 ~ 100 之间的整数';
      tries++;let text;
      if(v===n){text=`猜对了！答案就是 ${n}，用了 ${tries} 次`;msg.style.color='var(--good)';hud.finish({win:true});}
      else{const diff=Math.abs(v-n);text=v<n?'太小了，再大一点':'太大了，再小一点';text+=diff<=5?' · 已经很接近了！':diff<=15?' · 有点接近':'';msg.style.color='var(--accent)';}
      msg.textContent=text;log.unshift(`第 ${tries} 次：${v} → ${v===n?'正确':v<n?'偏小':'偏大'}`);logEl.innerHTML=log.map(T.esc).join('<br>');inp.value='';inp.select();};
    host.querySelector('#gnGo').onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});host.querySelector('#gnNew').onclick=fresh;fresh();
  }});

  /* ---------------- 记忆翻牌 ---------------- */
  R('记忆翻牌', { render(host, api) {
    const MARKS=['◆','●','▲','■','★','✦','✚','◈'];
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="mmNew">重新开始</button><span class="cp-note" id="mmMsg">翻开两张相同的卡片即可配对</span></div>
      ${center('<div id="mmBoard" class="game-board" style="grid-template-columns:repeat(4,72px)"></div>')}</div>`;
    const board=host.querySelector('#mmBoard'),msg=host.querySelector('#mmMsg');
    const hud=gameHud(host,'记忆翻牌',{mode:'time'});
    let cards=[],flipped=[],matched=[],moves=0,lock=false;
    function fresh(){const deck=[...MARKS,...MARKS].sort(()=>Math.random()-.5);cards=deck;flipped=[];matched=[];moves=0;lock=false;msg.textContent='翻开两张相同的卡片即可配对';hud.reset();draw();}
    function draw(){board.innerHTML='';cards.forEach((e,i)=>{const d=document.createElement('div');d.className='game-cell clickable';d.style.cssText='width:72px;height:72px;font-size:30px';
      const show=flipped.includes(i)||matched.includes(i);d.textContent=show?e:'?';d.style.background=show?'var(--accent-soft)':'var(--surface)';
      d.onclick=()=>flip(i);board.appendChild(d);});}
    function flip(i){if(lock||flipped.includes(i)||matched.includes(i))return;flipped.push(i);draw();
      if(flipped.length===2){moves++;lock=true;const[a,b]=flipped;
        if(cards[a]===cards[b]){matched.push(a,b);flipped=[];lock=false;msg.textContent=`已配对 ${matched.length/2}/8 · 共 ${moves} 次翻牌`;
          if(matched.length===16){msg.textContent=`全部配对完成！共 ${moves} 次翻牌`;hud.finish({win:true,score:moves});}}
        else setTimeout(()=>{flipped=[];lock=false;draw();msg.textContent=`继续加油 · 共 ${moves} 次翻牌`;},700);}}
    host.querySelector('#mmNew').onclick=fresh;fresh();
  }});

  /* ---------------- 贪吃蛇 ---------------- */
  R('贪吃蛇', { render(host, api) {
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="snNew">重新开始</button><span class="cp-label">方向键 / WASD 控制 · 空格暂停</span><span class="cp-note" id="snScore">得分 0</span></div>
      ${center('<canvas id="snCv" width="400" height="400" style="border-radius:10px;background:#0e121c;border:1px solid var(--line)"></canvas>')}</div>`;
    const cv=host.querySelector('#snCv'),cx=cv.getContext('2d'),N=20,S=cv.width/N;
    const hud=gameHud(host,'贪吃蛇',{mode:'score'});
    let snake,food,dir,next,score,timer,paused,over;
    function fresh(){snake=[[10,10],[9,10],[8,10]];dir=[1,0];next=[1,0];score=0;paused=false;over=false;placeFood();hud.reset();draw();clearInterval(timer);timer=setInterval(tick,120);host.querySelector('#snScore').textContent='得分 0';}
    function placeFood(){do{food=[rnd(0,N-1),rnd(0,N-1)];}while(snake.some(s=>s[0]===food[0]&&s[1]===food[1]));}
    function draw(){cx.fillStyle='#0e121c';cx.fillRect(0,0,cv.width,cv.height);
      cx.strokeStyle='rgba(255,255,255,.035)';for(let i=0;i<N;i++){cx.beginPath();cx.moveTo(i*S,0);cx.lineTo(i*S,cv.height);cx.stroke();cx.beginPath();cx.moveTo(0,i*S);cx.lineTo(cv.width,i*S);cx.stroke();}
      cx.fillStyle='#fb7185';cx.beginPath();cx.arc(food[0]*S+S/2,food[1]*S+S/2,S*.35,0,7);cx.fill();
      snake.forEach((s,i)=>{cx.fillStyle=i===0?'#7c6cff':`hsl(${265+i*3} 80% ${65-i*1.2}%)`;cx.fillRect(s[0]*S+1,s[1]*S+1,S-2,S-2);});
      if(over){cx.fillStyle='rgba(10,13,20,.8)';cx.fillRect(0,0,cv.width,cv.height);cx.fillStyle='#fff';cx.font='bold 26px sans-serif';cx.textAlign='center';cx.fillText('游戏结束',200,190);cx.font='14px sans-serif';cx.fillText('得分 '+score+' · 点击重新开始',200,220);cx.textAlign='left';}}
    function tick(){if(paused||over)return;dir=next;const h=[snake[0][0]+dir[0],snake[0][1]+dir[1]];
      if(h[0]<0||h[0]>=N||h[1]<0||h[1]>=N||snake.some(s=>s[0]===h[0]&&s[1]===h[1])){over=true;hud.finish({win:false,score});draw();return;}
      snake.unshift(h);if(h[0]===food[0]&&h[1]===food[1]){score+=10;host.querySelector('#snScore').textContent='得分 '+score;placeFood();}else snake.pop();draw();}
    document.addEventListener('keydown',function kh(e){if(!host.isConnected){document.removeEventListener('keydown',kh);return;}
      const k=e.key.toLowerCase(),map={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
      if(map[k]){e.preventDefault();const nd=map[k];if(nd[0]!==-dir[0]||nd[1]!==-dir[1])next=nd;}
      else if(e.key===' '){e.preventDefault();paused=!paused;}});
    host.querySelector('#snNew').onclick=fresh;fresh();
    api.onCleanup(()=>{clearInterval(timer);; /* pane detached */});
  }});

  /* ---------------- 迷宫生成 ---------------- */
  R('迷宫生成', { render(host, api) {
    const W=25,H=25;
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="mzNew">生成新迷宫</button><button class="btn btn-ghost" id="mzPath">显示解法</button><span class="cp-label">方向键移动，从左上到右下</span><span class="cp-note" id="mzMsg">祝你好运</span></div>
      ${center('<canvas id="mzCv" width="500" height="500" style="border-radius:10px;background:#fff;border:1px solid var(--line)"></canvas>')}</div>`;
    const cv=host.querySelector('#mzCv'),cx=cv.getContext('2d'),S=cv.width/W;
    const hud=gameHud(host,'迷宫生成',{mode:'time'});
    let grid=[],pos=[0,0],showPath=false;
    function gen(){grid=Array.from({length:H},()=>Array.from({length:W},()=>({n:true,e:true,s:true,w:true,vis:false})));
      const stack=[[0,0]];grid[0][0].vis=true;
      while(stack.length){const[r,c]=stack[stack.length-1],dirs=[];
        if(r>0&&!grid[r-1][c].vis)dirs.push([-1,0,'n']);if(c<W-1&&!grid[r][c+1].vis)dirs.push([0,1,'e']);
        if(r<H-1&&!grid[r+1][c].vis)dirs.push([1,0,'s']);if(c>0&&!grid[r][c-1].vis)dirs.push([0,-1,'w']);
        if(!dirs.length){stack.pop();continue;}
        const[dr,dc,side]=pick(dirs),nr=r+dr,nc=c+dc;
        grid[r][c][side]=false;grid[nr][nc][{n:'s',s:'n',e:'w',w:'e'}[side]]=false;
        grid[nr][nc].vis=true;stack.push([nr,nc]);}
      grid.forEach(row=>row.forEach(x=>x.vis=false));pos=[0,0];showPath=false;host.querySelector('#mzMsg').textContent='祝你好运';hud.reset();draw();}
    function solve(){const q=[[0,0]],prev=new Map(),seen=new Set(['0,0']);
      while(q.length){const[r,c]=q.shift();if(r===H-1&&c===W-1)break;
        const a=grid[r][c],moves=[[-1,0,!a.n],[0,1,!a.e],[1,0,!a.s],[0,-1,!a.w]];
        for(const[dr,dc,ok]of moves){if(!ok)continue;const nr=r+dr,nc=c+dc,k=nr+','+nc;if(nr<0||nr>=H||nc<0||nc>=W||seen.has(k))continue;seen.add(k);prev.set(k,[r,c]);q.push([nr,nc]);}}
      const path=[];let k=(H-1)+','+(W-1);while(k&&k!=='0,0'){path.push(k.split(',').map(Number));const p=prev.get(k);k=p?p.join(','):null;}return path;}
    function draw(){cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
      if(showPath){cx.strokeStyle='rgba(124,108,255,.35)';cx.lineWidth=S*.5;cx.lineCap='round';cx.beginPath();solve().forEach(([r,c])=>cx.lineTo(c*S+S/2,r*S+S/2));cx.stroke();}
      cx.strokeStyle='#2c3a55';cx.lineWidth=1.5;cx.beginPath();
      grid.forEach((row,r)=>row.forEach((g,c)=>{const x=c*S,y=r*S;if(g.n){cx.moveTo(x,y);cx.lineTo(x+S,y);}if(g.w){cx.moveTo(x,y);cx.lineTo(x,y+S);}if(r===H-1&&g.s){cx.moveTo(x,y+S);cx.lineTo(x+S,y+S);}if(c===W-1&&g.e){cx.moveTo(x+S,y);cx.lineTo(x+S,y+S);}}));cx.stroke();
      cx.fillStyle='#fb7185';cx.fillRect((W-1)*S+3,(H-1)*S+3,S-6,S-6);
      cx.fillStyle='#22c55e';cx.beginPath();cx.arc(pos[1]*S+S/2,pos[0]*S+S/2,S*.32,0,7);cx.fill();}
    document.addEventListener('keydown',function kh(e){if(!host.isConnected){document.removeEventListener('keydown',kh);return;}
      const map={ArrowUp:[-1,0,'n'],w:[-1,0,'n'],ArrowDown:[1,0,'s'],s:[1,0,'s'],ArrowLeft:[0,-1,'w'],a:[0,-1,'w'],ArrowRight:[0,1,'e'],d:[0,1,'e']};
      const m=map[e.key]||map[e.key.toLowerCase()];if(!m)return;e.preventDefault();
      const[r,c]=pos;if(grid[r][c][m[2]])return;pos=[r+m[0],c+m[1]];draw();
      if(pos[0]===H-1&&pos[1]===W-1){host.querySelector('#mzMsg').textContent='到达终点！';hud.finish({win:true});}});
    host.querySelector('#mzNew').onclick=gen;host.querySelector('#mzPath').onclick=()=>{showPath=!showPath;draw();};gen();
    api.onCleanup(()=>{; /* pane detached */});
  }});

  /* ---------------- 五子棋 ---------------- */
  R('五子棋', { render(host, api) {
    const N=15,S=32;
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="gbNew">重新开始</button><span class="cp-label">你是黑棋，先手；电脑执白棋</span><span class="cp-note" id="gbMsg">点击交叉点落子</span></div>
      ${center(`<canvas id="gbCv" width="${N*S}" height="${N*S}" style="border-radius:10px;background:#e3b980;cursor:pointer"></canvas>`)}</div>`;
    const cv=host.querySelector('#gbCv'),cx=cv.getContext('2d'),msg=host.querySelector('#gbMsg');
    const hud=gameHud(host,'五子棋',{mode:'win'});
    let b=[],over=false;
    const win=(r,c,p)=>{const dirs=[[1,0],[0,1],[1,1],[1,-1]];return dirs.some(([dr,dc])=>{let n=1;for(let k=1;k<5;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=N||cc<0||cc>=N||b[rr][cc]!==p)break;n++;}for(let k=1;k<5;k++){const rr=r-dr*k,cc=c-dc*k;if(rr<0||rr>=N||cc<0||cc>=N||b[rr][cc]!==p)break;n++;}return n>=5;});};
    function score(r,c,p){let s=0;const dirs=[[1,0],[0,1],[1,1],[1,-1]];
      dirs.forEach(([dr,dc])=>{let n=1,block=0;for(let k=1;k<5;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=N||cc<0||cc>=N||b[rr][cc]===3-p){block++;break;}if(b[rr][cc]!==p)break;n++;}
        for(let k=1;k<5;k++){const rr=r-dr*k,cc=c-dc*k;if(rr<0||rr>=N||cc<0||cc>=N||b[rr][cc]===3-p){block++;break;}if(b[rr][cc]!==p)break;n++;}
        s+=Math.pow(n,3)*(block===0?2:1);});return s;}
    function draw(){cx.fillStyle='#e3b980';cx.fillRect(0,0,cv.width,cv.height);cx.strokeStyle='rgba(60,40,20,.55)';cx.lineWidth=1;
      for(let i=0;i<N;i++){cx.beginPath();cx.moveTo(S/2+i*S,S/2);cx.lineTo(S/2+i*S,cv.height-S/2);cx.stroke();cx.beginPath();cx.moveTo(S/2,S/2+i*S);cx.lineTo(cv.width-S/2,S/2+i*S);cx.stroke();}
      [[3,3],[11,3],[3,11],[11,11],[7,7]].forEach(([r,c])=>{cx.fillStyle='#5b3a1a';cx.beginPath();cx.arc(S/2+c*S,S/2+r*S,3,0,7);cx.fill();});
      b.forEach((row,r)=>row.forEach((p,c)=>{if(!p)return;cx.beginPath();cx.arc(S/2+c*S,S/2+r*S,S*.42,0,7);cx.fillStyle=p===1?'#1c2433':'#fafafa';cx.fill();cx.strokeStyle='rgba(0,0,0,.3)';cx.stroke();}));}
    function aiMove(){let best=-1,pos=null;
      for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(b[r][c])continue;let hasNeighbor=false;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<N&&cc>=0&&cc<N&&b[rr][cc])hasNeighbor=true;}
        if(!hasNeighbor)continue;const s=score(r,c,2)*1.05+score(r,c,1)+rnd(0,3);if(s>best){best=s;pos=[r,c];}}
      if(!pos)pos=[7,7];return pos;}
    cv.onclick=e=>{if(over)return;const rect=cv.getBoundingClientRect(),c=Math.round(((e.clientX-rect.left)*cv.width/rect.width-S/2)/S),r=Math.round(((e.clientY-rect.top)*cv.height/rect.height-S/2)/S);
      if(r<0||r>=N||c<0||c>=N||b[r][c])return;b[r][c]=1;draw();
      if(win(r,c,1)){msg.textContent='你赢了！';over=true;hud.finish({win:true});return;}
      const[ar,ac]=aiMove();b[ar][ac]=2;draw();if(win(ar,ac,2)){msg.textContent='电脑五子连珠';over=true;hud.finish({win:false});return;}msg.textContent='轮到你了';};
    host.querySelector('#gbNew').onclick=()=>{b=Array.from({length:N},()=>Array(N).fill(0));over=false;msg.textContent='点击交叉点落子';hud.reset();draw();};
    b=Array.from({length:N},()=>Array(N).fill(0));draw();
  }});

  /* ---------------- 数字华容道 / 拼图 ---------------- */
  function sliding(name,size,label){
    R(name,{render(host,api){
      const N=size,total=N*N;
      host.innerHTML=`<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="slNew">打乱 / 重新开始</button><span class="cp-note" id="slMsg">${label} · 点击空格相邻的数字移动</span></div>
        ${center(`<div id="slBoard" class="game-board" style="grid-template-columns:repeat(${N},64px)"></div>`)}</div>`;
      const board=host.querySelector('#slBoard'),msg=host.querySelector('#slMsg');
      const hud=gameHud(host,name,{mode:'time'});
      let a=[];
      function fresh(){a=Array.from({length:total-1},(_,i)=>i+1).concat(0);
        for(let k=0;k<total*40;k++){const z=a.indexOf(0),r=Math.floor(z/N),c=z%N,opts=[];
          if(r>0)opts.push(z-N);if(r<N-1)opts.push(z+N);if(c>0)opts.push(z-1);if(c<N-1)opts.push(z+1);
          const j=pick(opts);[a[z],a[j]]=[a[j],a[z]];}
        msg.textContent=`${label} · 点击空格相邻的数字移动`;hud.reset();draw();}
      function draw(){board.innerHTML='';a.forEach((v,i)=>{const d=document.createElement('div');d.className='game-cell clickable';d.style.cssText='width:64px;height:64px;font-size:20px';
        if(v){d.textContent=v;d.style.background='var(--accent-soft)';d.style.color='var(--accent)';}else d.style.background='var(--surface-2)';
        d.onclick=()=>move(i);board.appendChild(d);});}
      function move(i){const z=a.indexOf(0),r=Math.floor(i/N),c=i%N,zr=Math.floor(z/N),zc=z%N;
        if(Math.abs(r-zr)+Math.abs(c-zc)!==1)return;[a[i],a[z]]=[a[z],a[i]];draw();
        if(a.every((v,k)=>k===total-1?v===0:v===k+1)){msg.textContent='拼好了！';hud.finish({win:true});}}
      host.querySelector('#slNew').onclick=fresh;fresh();
    }});
  }
  sliding('拼图游戏',3,'3 × 3 数字滑块');
  sliding('华容道',4,'4 × 4 数字滑块（经典十五数码）');

  /* ---------------- 找不同 ---------------- */
  R('找不同', { render(host, api) {
    const MARKS = ['◆', '●', '▲', '■', '★', '✦', '✚', '◈', '◐', '▼', '◇', '○'];
    const N = 36, DIFFS = 3;
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row">
        <button type="button" class="btn btn-primary" id="dfNew">换一局</button>
        <button type="button" class="btn btn-ghost" id="dfHint">提示一处</button>
        <span class="cp-label" id="dfCount">已找到 0 / 3</span>
        <span class="cp-note" id="dfMsg">点击右图中与原图不同的格子</span>
      </div>
      <div style="display:flex;gap:22px;justify-content:center;flex-wrap:wrap">
        <div><div class="cp-label" style="text-align:center;margin-bottom:6px">原图</div><div id="dfA" class="game-board" style="grid-template-columns:repeat(6,46px)"></div></div>
        <div><div class="cp-label" style="text-align:center;margin-bottom:6px">找出不同</div><div id="dfB" class="game-board" style="grid-template-columns:repeat(6,46px)"></div></div>
      </div>
    </div>`;
    const A = host.querySelector('#dfA'), B = host.querySelector('#dfB'), msg = host.querySelector('#dfMsg');
    const countEl = host.querySelector('#dfCount'), hintBtn = host.querySelector('#dfHint');
    const hud = gameHud(host, '找不同', { mode: 'time' });
    let base = [], alt = [], diffs = [], found = new Set(), done = false, hints = 0;

    function fresh() {
      base = Array.from({ length: N }, () => pick(MARKS));
      diffs = [];
      while (diffs.length < DIFFS) {
        const i = rnd(0, N - 1);
        if (diffs.indexOf(i) < 0) diffs.push(i);
      }
      alt = base.slice();
      diffs.forEach(i => { alt[i] = pick(MARKS.filter(m => m !== base[i])); });
      found = new Set(); done = false; hints = 0;
      msg.textContent = '点击右图中与原图不同的格子';
      hud.reset();
      paint(); updateCount();
    }
    function updateCount() {
      countEl.textContent = '已找到 ' + found.size + ' / ' + DIFFS;
      hintBtn.disabled = done || found.size >= DIFFS;
    }
    function markFound(i) {
      found.add(i);
      const el = B.children[i];
      if (el) {
        el.style.background = 'color-mix(in srgb, var(--good) 22%, transparent)';
        el.style.borderColor = 'var(--good)';
      }
    }
    function finishIfDone() {
      updateCount();
      if (found.size < DIFFS || done) return;
      done = true;
      msg.textContent = '全部找到了！' + (hints ? '（使用了 ' + hints + ' 次提示）' : '');
      hud.finish({ win: true, score: Math.max(10, 100 - hints * 20) });
    }
    function paint() {
      const paintOne = (el, arr, click) => {
        el.innerHTML = '';
        arr.forEach((m, i) => {
          const d = document.createElement('div');
          d.className = 'game-cell' + (click ? ' clickable' : '');
          d.style.cssText = 'width:46px;height:46px;font-size:22px';
          d.textContent = m;
          if (click) {
            if (found.has(i)) { d.style.background = 'color-mix(in srgb, var(--good) 22%, transparent)'; d.style.borderColor = 'var(--good)'; }
            d.onclick = () => {
              if (done) return;
              if (diffs.indexOf(i) >= 0) {
                if (found.has(i)) return;
                markFound(i);
                msg.textContent = '找到了 ' + found.size + ' 处' + (found.size < DIFFS ? '，还有 ' + (DIFFS - found.size) + ' 处' : '');
                finishIfDone();
              } else {
                d.style.background = 'color-mix(in srgb, var(--err) 26%, transparent)';
                d.style.borderColor = 'var(--err)';
                msg.textContent = '不是这一格，再仔细看看';
                setTimeout(() => { d.style.background = ''; d.style.borderColor = ''; }, 620);
              }
            };
          }
          el.appendChild(d);
        });
      };
      paintOne(A, base, false);
      paintOne(B, alt, true);
    }

    host.querySelector('#dfNew').onclick = fresh;
    hintBtn.onclick = () => {
      if (done) return;
      const rest = diffs.filter(i => !found.has(i));
      if (!rest.length) return;
      hints++;
      markFound(rest[0]);
      msg.textContent = '提示：已标出一处，还剩 ' + (DIFFS - found.size) + ' 处';
      finishIfDone();
    };
    fresh();
  }});

  /* ---------------- 消消乐 ---------------- */
  R('消消乐小游戏', { render(host, api) {
    const N = 8, COLORS = ['#7c6cff', '#4ea8ff', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
    const MOVES = 30, GOAL = 400;
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row">
        <button type="button" class="btn btn-primary" id="m3New">重新开始</button>
        <span class="cp-label">点击相邻两块交换，三个及以上同色连成一线即可消除</span>
        <span class="cp-note" id="m3Score">得分 0</span>
        <span class="cp-note" id="m3Moves">剩余 30 步</span>
      </div>
      ${center('<div id="m3Board" class="game-board" style="grid-template-columns:repeat(8,46px)"></div>')}
      <div class="cp-row" style="justify-content:center"><span class="cp-note">目标：30 步内拿到 ' + GOAL + ' 分</span></div>
    </div>`;
    const board = host.querySelector('#m3Board'), scoreEl = host.querySelector('#m3Score'), movesEl = host.querySelector('#m3Moves');
    const hud = gameHud(host, '消消乐小游戏', { mode: 'score' });
    let g = [], sel = null, score = 0, moves = MOVES, over = false, busy = false;

    function fresh() {
      g = Array.from({ length: N }, () => Array.from({ length: N }, () => rnd(0, COLORS.length - 1)));
      score = 0; moves = MOVES; sel = null; over = false; busy = false;
      hud.reset(); draws();
      // 开局先消掉已有的三连，避免白送分
      let guard = 0;
      while (matches().size && guard++ < 30) {
        matches().forEach(k => { const [r, c] = k.split(',').map(Number); g[r][c] = rnd(0, COLORS.length - 1); });
      }
      draws();
    }
    function draws() {
      board.innerHTML = '';
      g.forEach((row, r) => row.forEach((v, c) => {
        const d = document.createElement('div');
        d.className = 'game-cell clickable';
        d.style.cssText = 'width:46px;height:46px;background:' + COLORS[v] + ';border-radius:9px;transition:transform .12s';
        if (sel && sel[0] === r && sel[1] === c) d.style.boxShadow = '0 0 0 3px #fff inset';
        d.onclick = () => click(r, c);
        board.appendChild(d);
      }));
      scoreEl.textContent = '得分 ' + score;
      movesEl.textContent = '剩余 ' + moves + ' 步';
    }
    function matches() {
      const hit = new Set();
      for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) {
        if (g[r][c] === g[r][c + 1] && g[r][c] === g[r][c + 2]) { hit.add(r + ',' + c); hit.add(r + ',' + (c + 1)); hit.add(r + ',' + (c + 2)); }
      }
      for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) {
        if (g[r][c] === g[r + 1][c] && g[r][c] === g[r + 2][c]) { hit.add(r + ',' + c); hit.add((r + 1) + ',' + c); hit.add((r + 2) + ',' + c); }
      }
      return hit;
    }
    function settle(combo) {
      const hit = matches();
      if (!hit.size) {
        busy = false;
        draws();
        if (moves <= 0 && !over) endGame();
        return;
      }
      score += hit.size * 10 * (combo || 1);
      hit.forEach(k => { const [r, c] = k.split(',').map(Number); g[r][c] = -1; });
      for (let c = 0; c < N; c++) {
        const col = g.map(row => row[c]).filter(v => v >= 0);
        const miss = N - col.length;
        g.forEach((row, r) => { row[c] = r < miss ? rnd(0, COLORS.length - 1) : col[r - miss]; });
      }
      draws();
      setTimeout(() => settle((combo || 1) + 1), 130);
    }
    function endGame() {
      over = true;
      busy = true;
      hud.finish({ win: score >= GOAL, score });
    }
    function click(r, c) {
      if (over || busy) return;
      if (!sel) { sel = [r, c]; draws(); return; }
      const [sr, sc] = sel; sel = null;
      if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) { draws(); return; }
      [g[sr][sc], g[r][c]] = [g[r][c], g[sr][sc]];
      if (!matches().size) {
        [g[sr][sc], g[r][c]] = [g[r][c], g[sr][sc]];
        draws();
        T.toast('这一步换不出三连，换个位置试试', 'err');
        return;
      }
      moves--;
      busy = true;
      draws();
      settle(1);
    }
    host.querySelector('#m3New').onclick = fresh;
    api.onCleanup(() => { busy = true; });
    fresh();
  }});

  /* ---------------- 黑白棋（简化人机） ---------------- */
  R('黑白棋', { render(host,api){
    const N=8;
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="rvNew">重新开始</button><span class="cp-label">你是黑棋，点击合法位置落子；夹住对方棋子即可翻面</span><span class="cp-note" id="rvMsg">黑棋 2 : 2 白棋</span></div>
      ${center('<div id="rvBoard" class="game-board" style="grid-template-columns:repeat(8,48px)"></div>')}</div>`;
    const board=host.querySelector('#rvBoard'),msg=host.querySelector('#rvMsg');
    const hud=gameHud(host,'黑白棋',{mode:'win'});
    let b=[],turn=1,over=false;
    const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    function flips(r,c,p){if(b[r][c])return[];const all=[];
      dirs.forEach(([dr,dc])=>{const path=[];let rr=r+dr,cc=c+dc;
        while(rr>=0&&rr<N&&cc>=0&&cc<N&&b[rr][cc]===3-p){path.push([rr,cc]);rr+=dr;cc+=dc;}
        if(path.length&&rr>=0&&rr<N&&cc>=0&&cc<N&&b[rr][cc]===p)all.push(...path);});return all;}
    function legal(p){const out=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(flips(r,c,p).length)out.push([r,c,flips(r,c,p)]);return out;}
    function fresh(){b=Array.from({length:N},()=>Array(N).fill(0));b[3][3]=2;b[3][4]=1;b[4][3]=1;b[4][4]=2;turn=1;over=false;hud.reset();draw();}
    function draw(){board.innerHTML='';const legalSet=new Set(legal(turn).map(x=>x[0]+','+x[1]));
      b.forEach((row,r)=>row.forEach((v,c)=>{const d=document.createElement('div');d.className='game-cell clickable';d.style.cssText='width:48px;height:48px;background:#137a5b';
        if(v){const disk=document.createElement('div');disk.style.cssText=`width:36px;height:36px;border-radius:50%;background:${v===1?'#1c2433':'#fafafa'};box-shadow:0 2px 5px rgba(0,0,0,.3)`;d.appendChild(disk);}
        else if(legalSet.has(r+','+c)){d.innerHTML='<span style="color:rgba(255,255,255,.55);font-size:18px">·</span>';}
        d.onclick=()=>play(r,c);board.appendChild(d);}));
      const black=b.flat().filter(v=>v===1).length,white=b.flat().filter(v=>v===2).length;
      msg.textContent=`黑棋 ${black} : ${white} 白棋`+(over?` · ${black>white?'你赢了':black<white?'电脑获胜':'平局'}`:` · ${turn===1?'你的回合':'电脑回合'}`);}
    function play(r,c){if(over||turn!==1)return;const f=flips(r,c,1);if(!f.length)return;
      b[r][c]=1;f.forEach(([rr,cc])=>b[rr][cc]=1);turn=2;draw();
      setTimeout(()=>{const opts=legal(2);if(opts.length){const best=opts.sort((a,y)=>y[2].length-a[2].length)[0];b[best[0]][best[1]]=2;best[2].forEach(([rr,cc])=>b[rr][cc]=2);}
        turn=1;if(!legal(1).length&&!legal(2).length){over=true;const black=b.flat().filter(v=>v===1).length,white=b.flat().filter(v=>v===2).length;hud.finish({win:black>white,draw:black===white});}draw();},350);}
    host.querySelector('#rvNew').onclick=fresh;fresh();
  }});

  /* ---------------- 逻辑谜题 / 填字 ---------------- */
  R('逻辑谜题生成', { fields:[NF('count','题目数量',8),SF('type','题型',[['math','数字规律'],['sequence','数列推理'],['logic','文字逻辑']],'math')],runLabel:'换一批',
    run:v=>{
      const n=T.clamp(Math.round(Number(v.count)||8),1,20),rows=[];
      for(let i=0;i<n;i++){
        if(v.type==='sequence'){const a=rnd(1,9),d=rnd(2,9),seq=Array.from({length:5},(_,k)=>a+d*k);rows.push([i+1,`${seq.slice(0,4).join(', ')}, ?`,String(seq[4]),'等差数列，公差 '+d]);}
        else if(v.type==='logic'){const qs=[['所有的猫都是动物，有些动物会游泳。那么「所有的猫都会游泳」是否正确？','不正确（前提不足）','三段论：中项不周延'],['如果下雨，地面会湿。现在地面湿了，能推出下雨了吗？','不能（肯定后件谬误）','充分条件假言推理'],['A 比 B 高，B 比 C 高，那么 A 和 C 谁更高？','A 更高','传递关系'],['盒子里不是红球就是蓝球。已知不是红球，那么是什么？','蓝球','排中律 + 排除法']];const q=pick(qs);rows.push([i+1,q[0],q[1],q[2]]);}
        else{const a=rnd(2,20),b=rnd(2,20),op=pick(['+','-','×']);const ans=op==='+'?a+b:op==='-'?a-b:a*b;rows.push([i+1,`${a} ${op} ${b} = ?`,String(ans),'四则运算']);}
      }
      return [{type:'table',title:`生成 ${n} 道${v.type==='math'?'计算':v.type==='sequence'?'数列':'逻辑'}题（答案在最后一列，可先遮住）`,head:['#','题目','答案','提示'],rows},
        {type:'text',value:rows.map(r=>`${r[0]}. ${r[1]}\n   答案：${r[2]}`).join('\n\n'),title:'题目纯文本（含答案）',download:'puzzles.txt'}];} });
  R('填字游戏生成', { fields:[XF('words','词语列表（每行一个，中文或英文）','工具\n图片\n文件\n二维码\n计算器\n浏览器\n代码\n学习')],runLabel:'重新生成',
    run:v=>{
      const words=String(v.words||'').split('\n').map(s=>s.trim()).filter(Boolean);
      if(words.length<2)throw new Error('请至少输入 2 个词语');
      const maxLen=Math.max(...words.map(w=>Array.from(w).length)),S=Math.max(8,maxLen+2),grid=Array.from({length:S},()=>Array(S).fill(''));
      const placed=[];let row=1;
      words.forEach((w,i)=>{const chars=Array.from(w);if(row>=S-1)row=1;const col=Math.max(0,Math.floor((S-chars.length)/2)+(i%3-1));
        chars.forEach((ch,j)=>{if(grid[row][col+j]!==undefined)grid[row][col+j]=ch;});placed.push([i+1,w,'第 '+(row+1)+' 行，第 '+(col+1)+' 列起，横向']);row+=2;});
      let html='<div style="display:grid;grid-template-columns:repeat('+S+',30px);gap:2px;justify-content:center">';
      grid.forEach(r=>r.forEach(c=>{html+=`<div style="width:30px;height:30px;display:grid;place-items:center;border-radius:4px;${c?'background:var(--accent-soft);color:var(--accent);font-weight:700':'background:var(--surface-2)'}">${T.esc(c)}</div>`;}));
      html+='</div>';
      return [{type:'html',title:'填字网格',value:html},
        {type:'table',title:'词条与位置（答案表）',head:['#','词语','位置'],rows:placed},
        {type:'note',value:'当前生成的是横向排列的单词网格（答案版）。真正交叉填字需要词典与回溯布局算法，可作为课堂练习的简易版使用。'}];} });
  /* ---------------- 俄罗斯方块 ---------------- */
  R('俄罗斯方块', { render(host, api) {
    const COLS = 10, ROWS = 20, CELL = 26;
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="tsNew">重新开始</button><span class="cp-label">← → 移动 · ↑ / W 旋转 · ↓ 加速 · 空格直落 · P 暂停</span><span class="cp-note" id="tsScore">得分 0 · 消除 0 行</span></div>
      ${center(`<canvas id="tsCv" width="${COLS * CELL}" height="${ROWS * CELL}" style="border-radius:10px;background:var(--surface-2);border:1px solid var(--line);max-width:100%"></canvas>`)}
      <div class="cp-row" style="justify-content:center"><button class="btn btn-ghost" data-t="left">←</button><button class="btn btn-ghost" data-t="rotate">旋转</button><button class="btn btn-ghost" data-t="right">→</button><button class="btn btn-ghost" data-t="down">↓</button><button class="btn btn-ghost" data-t="drop">直落</button></div></div>`;
    const cv = host.querySelector('#tsCv'), cx = cv.getContext('2d'), scoreEl = host.querySelector('#tsScore');
    const hud = gameHud(host, '俄罗斯方块', { mode: 'score' });
    const SHAPES = [
      [[1, 1, 1, 1]],
      [[1, 1], [1, 1]],
      [[0, 1, 0], [1, 1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1, 1], [1, 1, 0]]
    ];
    const COLORS = ['#7c6cff', '#d9a441', '#b65c3f', '#2d5c4d', '#4ea8ff', '#34d399', '#fb7185'];
    let board, piece, timer, over, paused, score, lines, dropMs;
    const empty = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const spawn = () => {
      const i = rnd(0, SHAPES.length - 1);
      const m = SHAPES[i].map(r => r.slice());
      piece = { m, color: i + 1, x: Math.floor((COLS - m[0].length) / 2), y: 0 };
      if (collide(piece.x, piece.y, m)) { over = true; stop(); hud.finish({ win: false, score }); draw(); }
    };
    const collide = (x, y, m) => m.some((row, r) => row.some((v, c) => v && (x + c < 0 || x + c >= COLS || y + r >= ROWS || (y + r >= 0 && board[y + r][x + c]))));
    const merge = () => { piece.m.forEach((row, r) => row.forEach((v, c) => { if (v && piece.y + r >= 0) board[piece.y + r][piece.x + c] = piece.color; })); };
    const rotate = m => m[0].map((_, i) => m.map(row => row[i]).reverse());
    function clearLines() {
      let n = 0;
      for (let r = ROWS - 1; r >= 0; r--) if (board[r].every(Boolean)) { board.splice(r, 1); board.unshift(Array(COLS).fill(0)); n++; r++; }
      if (n) {
        lines += n; score += [0, 100, 300, 500, 800][n] || n * 200;
        dropMs = Math.max(120, 480 - Math.floor(lines / 5) * 45);
        restartTimer();
        scoreEl.textContent = `得分 ${score} · 消除 ${lines} 行`;
      }
    }
    function step() {
      if (paused || over) return;
      if (!collide(piece.x, piece.y + 1, piece.m)) piece.y++;
      else { merge(); clearLines(); spawn(); }
      draw();
    }
    function restartTimer() { clearInterval(timer); if (!over) timer = setInterval(step, dropMs); }
    function stop() { clearInterval(timer); timer = null; }
    function reset() {
      over = false; paused = false; score = 0; lines = 0; dropMs = 480;
      board = empty(); spawn(); scoreEl.textContent = '得分 0 · 消除 0 行'; hud.reset(); restartTimer(); draw();
    }
    function draw() {
      cx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-2').trim() || '#f9f8f3';
      cx.fillRect(0, 0, cv.width, cv.height);
      cx.strokeStyle = 'rgba(120,120,110,.12)'; cx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) { cx.beginPath(); cx.moveTo(c * CELL, 0); cx.lineTo(c * CELL, ROWS * CELL); cx.stroke(); }
      for (let r = 0; r <= ROWS; r++) { cx.beginPath(); cx.moveTo(0, r * CELL); cx.lineTo(COLS * CELL, r * CELL); cx.stroke(); }
      const block = (x, y, color) => {
        const c = ['', '#7c6cff', '#d9a441', '#b65c3f', '#2d5c4d', '#4ea8ff', '#34d399', '#fb7185'][color] || '#888';
        cx.fillStyle = c; cx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.strokeRect(x * CELL + 1.5, y * CELL + 1.5, CELL - 3, CELL - 3);
      };
      board.forEach((row, r) => row.forEach((v, c) => { if (v) block(c, r, v); }));
      if (piece && !over) piece.m.forEach((row, r) => row.forEach((v, c) => { if (v && piece.y + r >= 0) block(piece.x + c, piece.y + r, piece.color); }));
      if (over) {
        cx.fillStyle = 'rgba(10,13,20,.72)'; cx.fillRect(0, 0, cv.width, cv.height);
        cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.font = 'bold 26px sans-serif';
        cx.fillText('游戏结束', cv.width / 2, cv.height / 2 - 10);
        cx.font = '14px sans-serif'; cx.fillText('得分 ' + score + ' · 点击重新开始', cv.width / 2, cv.height / 2 + 22); cx.textAlign = 'left';
      }
    }
    function act(t) {
      if (over || paused) return;
      if (t === 'left' && !collide(piece.x - 1, piece.y, piece.m)) piece.x--;
      if (t === 'right' && !collide(piece.x + 1, piece.y, piece.m)) piece.x++;
      if (t === 'down' && !collide(piece.x, piece.y + 1, piece.m)) piece.y++;
      if (t === 'rotate') { const m = rotate(piece.m); if (!collide(piece.x, piece.y, m)) piece.m = m; }
      if (t === 'drop') { while (!collide(piece.x, piece.y + 1, piece.m)) piece.y++; step(); }
      draw();
    }
    document.addEventListener('keydown', function kh(e) {
      if (!host.isConnected) { document.removeEventListener('keydown', kh); return; }
      const k = e.key.toLowerCase();
      if (['arrowleft', 'a'].includes(k)) { e.preventDefault(); act('left'); }
      else if (['arrowright', 'd'].includes(k)) { e.preventDefault(); act('right'); }
      else if (['arrowdown', 's'].includes(k)) { e.preventDefault(); act('down'); }
      else if (['arrowup', 'w'].includes(k)) { e.preventDefault(); act('rotate'); }
      else if (e.key === ' ') { e.preventDefault(); act('drop'); }
      else if (k === 'p') { paused = !paused; draw(); }
    });
    host.querySelectorAll('[data-t]').forEach(b => b.onclick = () => act(b.dataset.t));
    host.querySelector('#tsNew').onclick = reset;
    api.onCleanup(stop);
    reset();
  }});

  window.GAME_KIT = { gameHud, readGameRecords };

  R('游戏记录', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="grRefresh">刷新记录</button><button class="btn btn-ghost" id="grExport">导出 JSON</button><button class="btn btn-ghost" id="grClear">清空记录</button><span class="cp-note">记录保存在本机 localStorage，不会上传</span></div>
      <div id="grBody"></div></div>`;
    const body = host.querySelector('#grBody');
    function render() {
      const rec = readGameRecords();
      const names = Object.keys(rec);
      const agg = names.reduce((a, n) => {
        const r = rec[n];
        a.plays += r.plays || 0;
        a.wins += r.wins || 0; a.losses += r.losses || 0; a.draws += r.draws || 0;
        if (r.bestScore != null) a.scored++;
        return a;
      }, { plays: 0, wins: 0, losses: 0, draws: 0, scored: 0 });
      const rows = Object.entries(rec).sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0)).map(([name, r]) => [
        name, r.plays || 0, `${r.wins || 0} / ${r.losses || 0} / ${r.draws || 0}`,
        r.bestTime != null ? fmtMs(r.bestTime) : '—',
        r.bestScore != null ? r.bestScore : '—',
        r.lastTime != null ? fmtMs(r.lastTime) : '—'
      ]);
      const summary = `<div class="gr-summary">
        <div><b>${names.length}</b><span>玩过的游戏</span></div>
        <div><b>${agg.plays}</b><span>总对局数</span></div>
        <div><b>${agg.wins}</b><span>胜局</span></div>
        <div><b>${agg.losses}</b><span>负局</span></div>
        <div><b>${agg.draws}</b><span>平局</span></div>
      </div>`;
      body.innerHTML = rows.length
        ? summary + `<div class="table-scroll"><table class="data-table"><thead><tr><th>游戏</th><th>局数</th><th>胜 / 负 / 平</th><th>最佳用时</th><th>最高分</th><th>最近用时</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td${i === 0 ? ' style="font-weight:600"' : ''}>${T.esc(String(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : '<div class="hint-empty">还没有游戏记录。玩一局数独、扫雷、2048 或贪吃蛇后，这里会自动记录成绩。</div>';
    }
    host.querySelector('#grRefresh').onclick = render;
    host.querySelector('#grExport').onclick = () => T.save(T.textBlob(JSON.stringify(readGameRecords(), null, 2)), 'game-records.json');
    host.querySelector('#grClear').onclick = () => { if (!confirm('确定清空所有游戏记录？')) return; writeGameRecords({}); render(); T.toast('游戏记录已清空'); };
    render();
  }});
})();
