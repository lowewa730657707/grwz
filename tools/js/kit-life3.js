/* ============================================================
   工具实现：分组、专注计时等生活小工具
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const esc = T.esc;

  /* ---------------- 随机分组器 ---------------- */
  R('随机分组器', {
    steps: [
      '把名单粘进左侧文本框，一行一个名字，空行会自动忽略。',
      '选择「分成几组」或「每组几人」，点「生成分组」；同样的名单可以反复生成不同结果。',
      '结果按组列出人数与成员，支持复制文本或导出 CSV。',
      '需要公平抽签时建议开启「显示随机种子」，便于事后复核。'
    ],
    render(host, api) {
      host.innerHTML = `<div class="ws ws-split">
        <div class="ws-tabs" role="tablist"><button type="button" class="ws-tab is-on" data-tab="ctl" role="tab">参数设置</button><button type="button" class="ws-tab" data-tab="out" role="tab">分组结果</button></div>
        <div class="ws-col ws-ctl is-on" data-col="ctl">
          <div class="ws-bar"><span class="ws-bar-title">参数设置</span><span class="ws-bar-meta">名单与分组方式</span></div>
          <div class="ws-body">
            <div class="field wide"><label for="rgNames">名单（一行一个）</label><textarea id="rgNames" rows="9" spellcheck="false" placeholder="张三&#10;李四&#10;王五"></textarea></div>
            <div class="field"><label for="rgMode">分组方式</label><select id="rgMode"><option value="count">按组数分</option><option value="size">按每组人数分</option></select></div>
            <div class="field"><label for="rgVal">组数 / 每组人数</label><input id="rgVal" type="number" min="1" max="50" value="4"></div>
            <label class="switch" style="margin:6px 0 2px"><input type="checkbox" id="rgBalanced" checked><span class="switch-track"></span><span class="switch-label">各组人数尽量均衡</span></label>
            <label class="switch"><input type="checkbox" id="rgSeed"><span class="switch-track"></span><span class="switch-label">显示随机种子</span></label>
            <div class="cp-row" style="margin-top:12px">
              <button type="button" class="btn btn-primary" id="rgGo">生成分组</button>
              <button type="button" class="btn btn-ghost" id="rgClear">清空名单</button>
            </div>
          </div>
        </div>
        <div class="ws-col ws-out" data-col="out">
          <div class="ws-bar"><span class="ws-bar-title">分组结果</span><span class="ws-out-stat" id="rgStat">等待生成</span></div>
          <div class="ws-body"><div id="rgOut"><div class="hint-empty">填好名单后点「生成分组」。</div></div></div>
        </div>
      </div>`;
      const namesEl = host.querySelector('#rgNames');
      const modeEl = host.querySelector('#rgMode');
      const valEl = host.querySelector('#rgVal');
      const balEl = host.querySelector('#rgBalanced');
      const seedEl = host.querySelector('#rgSeed');
      const out = host.querySelector('#rgOut');
      const stat = host.querySelector('#rgStat');
      let groups = [], seed = 0;

      const hashSeed = s => {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
      };
      const rng = seedValue => {
        let s = seedValue || 1;
        return () => {
          s ^= s << 13; s >>>= 0;
          s ^= s >> 17;
          s ^= s << 5; s >>>= 0;
          return s / 4294967296;
        };
      };

      function generate() {
        const names = String(namesEl.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        if (!names.length) return T.toast('请先填写名单', 'err');
        const n = Math.max(1, Math.min(50, Math.round(Number(valEl.value) || 1)));
        seed = (Date.now() ^ hashSeed(names.join('|'))) >>> 0;
        const rand = rng(seed);
        const arr = names.slice();
        for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }

        groups = [];
        if (modeEl.value === 'count') {
          const gcount = Math.min(n, arr.length);
          for (let i = 0; i < gcount; i++) groups.push([]);
          const base = Math.floor(arr.length / gcount), extra = arr.length % gcount;
          let k = 0;
          for (let i = 0; i < gcount; i++) {
            const size = base + (balEl.checked ? (i < extra ? 1 : 0) : 0);
            for (let j = 0; j < size && k < arr.length; j++) groups[i].push(arr[k++]);
          }
        } else {
          const per = Math.max(1, n);
          for (let i = 0; i < arr.length; i += per) groups.push(arr.slice(i, i + per));
        }
        render();
        stat.textContent = '已生成 · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
        T.toast('已分成 ' + groups.length + ' 组');
      }

      function render() {
        if (!groups.length) { out.innerHTML = '<div class="hint-empty">还没有分组结果。</div>'; return; }
        const rows = groups.map((g, i) => `<div class="rg-group">
          <div class="rg-head"><span>第 ${i + 1} 组</span><b>${g.length} 人</b></div>
          <div class="rg-members">${g.map(n => `<span>${esc(n)}</span>`).join('') || '<i class="cp-note">（空组）</i>'}</div>
        </div>`).join('');
        out.innerHTML = `<div class="rg-groups">${rows}</div>
          ${seedEl.checked ? `<div class="cp-note" style="margin-top:10px">随机种子：<code>${seed}</code>（仅用于本次结果复核）</div>` : ''}
          <div class="cp-row" style="margin-top:12px">
            <button type="button" class="btn btn-ghost btn-sm" id="rgCopy">复制分组</button>
            <button type="button" class="btn btn-ghost btn-sm" id="rgCsv">导出 CSV</button>
            <button type="button" class="btn btn-ghost btn-sm" id="rgAgain">再随机一次</button>
          </div>`;
        out.querySelector('#rgCopy').onclick = () => T.copy(groups.map((g, i) => '第 ' + (i + 1) + ' 组（' + g.length + ' 人）：' + g.join('、')).join('\n'));
        out.querySelector('#rgAgain').onclick = generate;
        out.querySelector('#rgCsv').onclick = () => {
          const escCsv = x => '"' + String(x).replace(/"/g, '""') + '"';
          const max = Math.max(...groups.map(g => g.length));
          const head = groups.map((g, i) => '第 ' + (i + 1) + ' 组');
          const lines = [head.map(escCsv).join(',')];
          for (let r = 0; r < max; r++) lines.push(groups.map(g => escCsv(g[r] || '')).join(','));
          T.save(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), '分组结果.csv');
        };
      }

      host.querySelector('#rgGo').onclick = generate;
      host.querySelector('#rgClear').onclick = () => { namesEl.value = ''; groups = []; stat.textContent = '等待生成'; render(); namesEl.focus(); };
      modeEl.onchange = () => { valEl.value = modeEl.value === 'count' ? 4 : 5; };
      namesEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); generate(); }
      });
      render();
      api.onCleanup(() => { groups = []; });
    }
  });

  /* ---------------- 番茄专注计时 ---------------- */
  R('番茄专注计时', {
    steps: [
      '选择时长（默认专注 25 分钟、短休 5 分钟、长休 15 分钟），点「开始」。',
      '圆环显示剩余进度，暂停后按钮变成「继续」；「跳过」直接进入下一阶段。',
      '完成一个专注段会自动记入本机统计，可切换「自动进入下一阶段」。',
      '所有计时在本机进行，切换页面或关闭浏览器不会上传任何数据。'
    ],
    render(host, api) {
      const LS = 'toolbox_pomodoro_v1';
      const read = () => {
        try { const v = JSON.parse(localStorage.getItem(LS) || '{}'); return { count: v.count || 0, focusMin: v.focusMin || 0, day: v.day || '' }; }
        catch (e) { return { count: 0, focusMin: 0, day: '' }; }
      };
      const today = () => new Date().toISOString().slice(0, 10);
      let stat = read();
      if (stat.day !== today()) { stat.day = today(); stat.count = 0; stat.focusMin = 0; }
      const save = () => { try { localStorage.setItem(LS, JSON.stringify(stat)); } catch (e) { /* noop */ } };

      const MODES = [
        { key: 'focus', name: '专注', min: 25 },
        { key: 'short', name: '短休息', min: 5 },
        { key: 'long', name: '长休息', min: 15 }
      ];
      let mode = MODES[0], total = mode.min * 60, left = total;
      let running = false, timer = null, auto = false;

      host.innerHTML = `<div class="custom-pane">
        <div class="cp-row" id="pdModes">
          ${MODES.map((m, i) => `<button type="button" class="pd-mode${i === 0 ? ' is-on' : ''}" data-mode="${m.key}">${m.name} ${m.min} 分</button>`).join('')}
          <span class="cp-note">可自定义时长：</span>
          <input id="pdCustom" type="number" min="1" max="120" value="25" style="width:72px">
          <button type="button" class="btn btn-ghost btn-sm" id="pdApply">应用到当前模式</button>
        </div>
        <div class="pd-stage">
          <svg class="pd-ring" viewBox="0 0 220 220" aria-hidden="true">
            <circle class="pd-ring-bg" cx="110" cy="110" r="96"></circle>
            <circle class="pd-ring-fg" id="pdRing" cx="110" cy="110" r="96"></circle>
          </svg>
          <div class="pd-center">
            <div class="pd-time" id="pdTime">25:00</div>
            <div class="pd-state" id="pdState">准备开始</div>
            <div class="pd-sub" id="pdSub">今天完成 0 个专注段 · 0 分钟</div>
          </div>
        </div>
        <div class="cp-row" style="justify-content:center">
          <button type="button" class="btn btn-primary" id="pdStart">开始</button>
          <button type="button" class="btn btn-ghost" id="pdSkip">跳过</button>
          <button type="button" class="btn btn-ghost" id="pdReset">重置</button>
          <label class="switch" style="margin-left:8px"><input type="checkbox" id="pdAuto"><span class="switch-track"></span><span class="switch-label">自动进入下一阶段</span></label>
        </div>
        <div id="pdLog"></div>
        <div class="note">番茄工作法建议：专注 25 分钟 + 短休 5 分钟，每完成 4 段做一次 15 分钟长休。本工具只做计时与本地统计，不带任何提醒推送。</div>
      </div>`;

      const timeEl = host.querySelector('#pdTime');
      const stateEl = host.querySelector('#pdState');
      const subEl = host.querySelector('#pdSub');
      const ring = host.querySelector('#pdRing');
      const startBtn = host.querySelector('#pdStart');
      const logEl = host.querySelector('#pdLog');
      const CIRC = 2 * Math.PI * 96;
      ring.style.strokeDasharray = String(CIRC);
      ring.style.strokeDashoffset = '0';

      const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      const paintStat = () => { subEl.textContent = '今天完成 ' + stat.count + ' 个专注段 · ' + stat.focusMin + ' 分钟'; };
      const paint = () => {
        timeEl.textContent = fmt(Math.max(0, left));
        ring.style.strokeDashoffset = String(CIRC * (1 - left / total));
        stateEl.textContent = running ? (mode.key === 'focus' ? '专注中…' : '休息中…') : (left === total ? '准备开始' : left === 0 ? '本段完成' : '已暂停');
        startBtn.textContent = running ? '暂停' : (left === total || left === 0 ? '开始' : '继续');
        document.title = running ? fmt(left) + ' · ' + mode.name : '拾器 ToolBox';
      };

      function chime() {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          const ctx = new Ctx(); const t0 = ctx.currentTime;
          [660, 880, 1046].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t0 + i * 0.16);
            g.gain.exponentialRampToValueAtTime(0.09, t0 + i * 0.16 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.16 + 0.2);
            o.connect(g); g.connect(ctx.destination);
            o.start(t0 + i * 0.16); o.stop(t0 + i * 0.16 + 0.22);
          });
          setTimeout(() => { try { ctx.close(); } catch (e) { /* noop */ } }, 1400);
        } catch (e) { /* noop */ }
      }

      function finishPhase() {
        stop();
        left = 0;
        paint();
        if (mode.key === 'focus') {
          stat.count++; stat.focusMin += mode.min; save(); paintStat();
          pushLog('完成一个 ' + mode.min + ' 分钟专注段');
          T.toast('专注完成 · 休息一下');
        } else {
          pushLog('完成一次' + mode.name);
          T.toast(mode.name + '结束，可以继续专注了');
        }
        chime();
        if (auto) {
          const next = mode.key === 'focus' ? (stat.count % 4 === 0 ? MODES[2] : MODES[1]) : MODES[0];
          setMode(next.key);
          setTimeout(() => start(), 800);
        }
      }
      function pushLog(text) {
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        logEl.insertAdjacentHTML('afterbegin', `<div class="pd-log-row"><span>${time}</span>${esc(text)}</div>`);
        while (logEl.children.length > 6) logEl.removeChild(logEl.lastChild);
      }
      function tick() {
        if (!running) return;
        left--;
        if (left <= 0) { finishPhase(); return; }
        paint();
      }
      function start() {
        if (running) return;
        if (left <= 0) left = total;
        running = true;
        timer = setInterval(tick, 1000);
        paint();
      }
      function stop() {
        running = false;
        clearInterval(timer); timer = null;
        paint();
      }
      function setMode(key) {
        stop();
        mode = MODES.find(m => m.key === key) || MODES[0];
        total = mode.min * 60; left = total;
        host.querySelectorAll('.pd-mode').forEach(b => b.classList.toggle('is-on', b.dataset.mode === mode.key));
        host.querySelector('#pdCustom').value = mode.min;
        paint();
      }

      host.querySelectorAll('.pd-mode').forEach(b => b.onclick = () => setMode(b.dataset.mode));
      startBtn.onclick = () => { if (running) stop(); else start(); };
      host.querySelector('#pdSkip').onclick = () => { stop(); left = 0; paint(); finishPhase(); };
      host.querySelector('#pdReset').onclick = () => { stop(); left = total; paint(); };
      host.querySelector('#pdApply').onclick = () => {
        const v = Math.max(1, Math.min(120, Math.round(Number(host.querySelector('#pdCustom').value) || mode.min)));
        mode.min = v; total = v * 60; left = total;
        const btn = host.querySelector('.pd-mode[data-mode="' + mode.key + '"]');
        if (btn) btn.textContent = mode.name + ' ' + v + ' 分';
        stop(); paint();
        T.toast('当前模式已设为 ' + v + ' 分钟');
      };
      host.querySelector('#pdAuto').onchange = e => { auto = e.target.checked; };

      paintStat(); paint();
      api.onCleanup(() => { stop(); document.title = '拾器 ToolBox · 本地运行的在线工具集'; });
    }
  });
})();
