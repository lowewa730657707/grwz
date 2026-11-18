/* ============================================================
   工具实现：系统检测（屏幕 / 键鼠 / 性能 / 浏览器能力）
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const esc = T.esc;
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const TXT = (value, title, download) => ({ type: 'text', value, title, download });

  function gpuInfo() {
    try {
      const cv = document.createElement('canvas');
      const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
      if (!gl) return '不支持 WebGL';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    } catch (e) { return '无法读取'; }
  }
  function card(title, rows) {
    return `<div class="sys-card"><div class="sys-title">${esc(title)}</div><div class="kv-grid">${rows.map(([k, v]) => `<div class="kv-k">${esc(k)}</div><div class="kv-v">${esc(v)}</div>`).join('')}</div></div>`;
  }

  /* ---------------- 电脑综合检测 ---------------- */
  R('电脑综合检测', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="sysRun">重新检测</button><button class="btn btn-ghost" id="sysCopy">复制报告</button><span class="cp-note">检测在当前浏览器内完成，不联网</span></div>
      <div id="sysBody" class="sys-grid"></div></div>`;
    const body = host.querySelector('#sysBody');
    let report = '';
    async function run() {
      body.innerHTML = '<div class="hint-empty">正在读取设备信息…</div>';
      const nav = navigator, scr = screen;
      let battery = null, storage = null, media = [];
      try { if (nav.getBattery) battery = await nav.getBattery(); } catch (e) {}
      try { if (nav.storage && nav.storage.estimate) storage = await nav.storage.estimate(); } catch (e) {}
      try { if (nav.mediaDevices && nav.mediaDevices.enumerateDevices) media = await nav.mediaDevices.enumerateDevices(); } catch (e) {}
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
      const info = [
        ['浏览器', nav.userAgent],
        ['平台', nav.platform || '—'],
        ['CPU 线程', (nav.hardwareConcurrency || '—') + ' 线程'],
        ['设备内存', (nav.deviceMemory ? nav.deviceMemory + ' GB' : '—')],
        ['屏幕', `${scr.width} × ${scr.height} · 可用 ${scr.availWidth} × ${scr.availHeight}`],
        ['像素比 / 色深', `${window.devicePixelRatio || 1} × / ${scr.colorDepth} bit`],
        ['显卡（WebGL）', gpuInfo()],
        ['WebGPU', 'gpu' in nav ? '支持' : '不支持'],
        ['在线状态', nav.onLine ? '在线' : '离线'],
        ['语言 / 时区', (nav.language || '—') + ' / ' + Intl.DateTimeFormat().resolvedOptions().timeZone]
      ];
      const net = conn ? [
        ['网络类型', conn.effectiveType || '—'],
        ['下行速度', conn.downlink ? conn.downlink + ' Mb/s' : '—'],
        ['往返延迟', conn.rtt ? conn.rtt + ' ms' : '—'],
        ['省流模式', conn.saveData ? '开启' : '关闭']
      ] : [['网络信息', '当前浏览器未提供 Network Information API']];
      const bat = battery ? [
        ['电量', Math.round(battery.level * 100) + '%'],
        ['充电状态', battery.charging ? '充电中' : '未充电'],
        ['剩余时间', battery.dischargingTime && isFinite(battery.dischargingTime) ? Math.round(battery.dischargingTime / 60) + ' 分钟' : '—']
      ] : [['电池', '当前浏览器未提供 Battery API']];
      const store = storage ? [
        ['配额', storage.quota ? (storage.quota / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '—'],
        ['已用', storage.usage ? (storage.usage / 1024 / 1024).toFixed(1) + ' MB' : '—']
      ] : [['存储', '无法读取存储配额']];
      const mediaInfo = [
        ['摄像头', media.filter(d => d.kind === 'videoinput').length + ' 个'],
        ['麦克风', media.filter(d => d.kind === 'audioinput').length + ' 个'],
        ['扬声器', media.filter(d => d.kind === 'audiooutput').length + ' 个']
      ];
      report = [info, net, bat, store, mediaInfo].map(group => group.map(([k, v]) => `${k}：${v}`).join('\n')).join('\n\n');
      body.innerHTML = [card('设备与浏览器', info), card('网络', net), card('电池', bat), card('存储', store), card('媒体设备', mediaInfo)].join('');
    }
    host.querySelector('#sysRun').onclick = run;
    host.querySelector('#sysCopy').onclick = () => report ? T.copy(report) : T.toast('请先检测', 'err');
    run();
  }});

  /* ---------------- 屏幕坏点检测 ---------------- */
  R('屏幕坏点检测', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="bpStart">开始全屏检测</button><span class="cp-label">依次显示纯色，点击 / 空格切换，Esc 退出</span></div>
      <div class="note">在全屏纯色下观察屏幕是否存在亮点、暗点或色块。检测前请调高屏幕亮度，并关闭自动亮度与环境光自适应。</div></div>`;
    const COLORS = [
      ['白', '#ffffff'], ['黑', '#000000'], ['红', '#ff0000'], ['绿', '#00ff00'], ['蓝', '#0000ff'],
      ['青', '#00ffff'], ['洋红', '#ff00ff'], ['黄', '#ffff00'], ['灰', '#808080']
    ];
    let overlay = null, index = 0, onKey = null;
    const close = () => {
      if (onKey) { document.removeEventListener('keydown', onKey); onKey = null; }
      if (overlay) { overlay.remove(); overlay = null; }
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    };
    const paint = () => {
      if (!overlay) return;
      overlay.style.background = COLORS[index][1];
      overlay.querySelector('#bpLabel').textContent = `${COLORS[index][0]} · ${index + 1} / ${COLORS.length}`;
    };
    const open = () => {
      close();
      overlay = document.createElement('div');
      overlay.id = 'bpOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;cursor:pointer;background:#fff';
      overlay.innerHTML = `<div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:7px 12px;border-radius:100px;background:rgba(0,0,0,.55);color:#fff;font:12px/1.4 sans-serif;white-space:nowrap"><span id="bpLabel">白 · 1 / 9</span><button id="bpNext" style="border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:6px;padding:3px 9px;cursor:pointer">下一个</button><button id="bpExit" style="border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:6px;padding:3px 9px;cursor:pointer">退出</button></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#bpNext').onclick = e => { e.stopPropagation(); index = (index + 1) % COLORS.length; paint(); };
      overlay.querySelector('#bpExit').onclick = e => { e.stopPropagation(); close(); };
      overlay.addEventListener('click', () => { index = (index + 1) % COLORS.length; paint(); });
      onKey = e => {
        if (e.key === 'Escape') close();
        else if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); index = (index + 1) % COLORS.length; paint(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); index = (index + COLORS.length - 1) % COLORS.length; paint(); }
      };
      document.addEventListener('keydown', onKey);
      paint();
      if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
    };
    host.querySelector('#bpStart').onclick = open;
    api.onCleanup(close);
  }});

  /* ---------------- 键盘按键测试 ---------------- */
  R('键盘按键测试', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="kbReset">清空</button><span class="cp-note">按下任意键查看 key / code / 修饰键；部分系统快捷键会被浏览器拦截</span></div>
      <div class="kb-display" id="kbDisplay"><span style="color:var(--text-3);font-size:13px">按下键盘任意键开始</span></div>
      <div class="kb-meta" id="kbMeta"></div>
      <div class="kb-pressed" id="kbPressed"></div></div>`;
    const display = host.querySelector('#kbDisplay'), meta = host.querySelector('#kbMeta'), pressed = host.querySelector('#kbPressed');
    const keys = new Map();
    const paint = () => {
      display.innerHTML = [...keys.entries()].slice(-6).reverse().map(([code, k]) => `<kbd class="kb-key">${esc(k)}</kbd><span class="kb-code">${esc(code)}</span>`).join('') || '<span style="color:var(--text-3);font-size:13px">按下键盘任意键开始</span>';
      pressed.innerHTML = [...keys.keys()].map(k => `<span class="kb-chip">${esc(k)}</span>`).join('');
      meta.textContent = keys.size ? `已测试 ${keys.size} 个按键` : '';
    };
    const down = e => {
      if (e.key === 'Tab') return;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) e.preventDefault();
      const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Meta'].filter(Boolean).join(' + ');
      keys.set(e.code, `${e.key}${mods ? ' · ' + mods : ''}`);
      paint();
    };
    const up = () => {};
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    host.querySelector('#kbReset').onclick = () => { keys.clear(); paint(); };
    paint();
    api.onCleanup(() => { document.removeEventListener('keydown', down); document.removeEventListener('keyup', up); });
  }});

  /* ---------------- 鼠标按键测试 ---------------- */
  R('鼠标按键测试', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="msReset">清空计数</button><span class="cp-note">在下方区域点击、右击、双击、滚动滚轮</span></div>
      <div id="mouseZone" class="mouse-zone"><span style="color:var(--text-3);font-size:12px">把鼠标移到这里开始测试</span></div>
      <div id="mouseStats" class="sys-grid" style="margin-top:12px"></div></div>`;
    const zone = host.querySelector('#mouseZone'), stats = host.querySelector('#mouseStats');
    const counts = { left: 0, middle: 0, right: 0, dbl: 0, wheel: 0 };
    let last = '—';
    const paint = () => {
      stats.innerHTML = card('鼠标事件', [
        ['左键', counts.left + ' 次'], ['中键', counts.middle + ' 次'], ['右键', counts.right + ' 次'],
        ['双击', counts.dbl + ' 次'], ['滚轮', counts.wheel + ' 格'], ['最后位置', last]
      ]);
    };
    zone.addEventListener('mousedown', e => {
      e.preventDefault();
      if (e.button === 0) counts.left++;
      if (e.button === 1) counts.middle++;
      if (e.button === 2) counts.right++;
      zone.style.background = 'var(--accent-soft)';
      setTimeout(() => { zone.style.background = ''; }, 120);
      paint();
    });
    zone.addEventListener('mouseup', () => {});
    zone.addEventListener('contextmenu', e => e.preventDefault());
    zone.addEventListener('dblclick', () => { counts.dbl++; paint(); });
    zone.addEventListener('wheel', e => { e.preventDefault(); counts.wheel += Math.sign(e.deltaY); paint(); }, { passive: false });
    zone.addEventListener('mousemove', e => { const r = zone.getBoundingClientRect(); last = `${Math.round(e.clientX - r.left)}, ${Math.round(e.clientY - r.top)}`; });
    host.querySelector('#msReset').onclick = () => { counts.left = counts.middle = counts.right = counts.dbl = counts.wheel = 0; last = '—'; paint(); };
    paint();
  }});

  /* ---------------- 屏幕刷新率测试 ---------------- */
  R('屏幕刷新率测试', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="fpsRun">开始测试</button><button class="btn btn-ghost" id="fpsStop">停止</button><span class="cp-note" id="fpsMsg">点击开始，观察移动方块是否卡顿</span></div>
      <div class="cp-canvas-wrap"><canvas id="fpsCv" width="760" height="180" style="max-width:100%"></canvas></div>
      <div id="fpsStats" class="sys-grid"></div></div>`;
    const cv = host.querySelector('#fpsCv'), cx = cv.getContext('2d'), msg = host.querySelector('#fpsMsg'), stats = host.querySelector('#fpsStats');
    const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#f9f8f3';
    let raf = null, running = false, t0 = 0, frames = 0, samples = [], x = 0, last = 0;
    const draw = now => {
      if (!running) return;
      if (!t0) { t0 = now; last = now; }
      const dt = now - last; last = now;
      if (dt > 0) samples.push(dt);
      frames++;
      x = (x + 6) % (cv.width - 30);
      cx.fillStyle = cssVar('--surface-2'); cx.fillRect(0, 0, cv.width, cv.height);
      cx.fillStyle = cssVar('--accent'); cx.fillRect(x, 66, 30, 30);
      cx.fillStyle = 'rgba(120,120,110,.25)'; cx.fillRect(0, 88, cv.width, 1);
      if (frames % 12 === 0) {
        const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
        const fps = avg ? 1000 / avg : 0;
        msg.textContent = `${fps.toFixed(1)} FPS · 平均帧间隔 ${avg.toFixed(1)} ms`;
        stats.innerHTML = card('刷新率估算', [
          ['实时帧率', fps.toFixed(1) + ' FPS'],
          ['平均帧间隔', avg.toFixed(1) + ' ms'],
          ['采样帧数', String(samples.length)],
          ['显示尺寸', `${screen.width} × ${screen.height} @ ${window.devicePixelRatio || 1}x`],
          ['说明', '浏览器与系统节能模式会限制刷新率']
        ]);
      }
      raf = requestAnimationFrame(draw);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); raf = null; };
    host.querySelector('#fpsRun').onclick = () => {
      stop(); running = true; t0 = 0; frames = 0; samples = []; x = 0;
      cx.fillStyle = cssVar('--surface-2'); cx.fillRect(0, 0, cv.width, cv.height);
      raf = requestAnimationFrame(draw);
    };
    host.querySelector('#fpsStop').onclick = () => { stop(); msg.textContent = '已停止'; };
    api.onCleanup(stop);
  }});

  /* ---------------- 浏览器能力检测 ---------------- */
  R('浏览器能力检测', { render(host, api) {
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="capRun">重新检测</button><button class="btn btn-ghost" id="capCopy">复制 JSON</button><span class="cp-note">检测结果仅代表当前浏览器环境</span></div><div id="capBody" class="sys-grid"></div></div>`;
    const body = host.querySelector('#capBody');
    let data = {};
    function run() {
      const video = document.createElement('video');
      const can = t => !!video.canPlayType(t);
      const supports = [
        ['WebGL 2', !!document.createElement('canvas').getContext('webgl2')],
        ['WebGPU', 'gpu' in navigator],
        ['WebAssembly', typeof WebAssembly !== 'undefined'],
        ['OffscreenCanvas', typeof OffscreenCanvas !== 'undefined'],
        ['AudioWorklet', !!(window.AudioContext && 'audioWorklet' in AudioContext.prototype)],
        ['MediaRecorder', typeof MediaRecorder !== 'undefined'],
        ['getUserMedia', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)],
        ['Clipboard', !!(navigator.clipboard && navigator.clipboard.writeText)],
        ['File System Access', 'showOpenFilePicker' in window],
        ['Service Worker', 'serviceWorker' in navigator],
        ['SharedArrayBuffer', typeof SharedArrayBuffer !== 'undefined'],
        ['WebSocket', typeof WebSocket !== 'undefined']
      ];
      const codecs = [
        ['H.264 MP4', can('video/mp4; codecs="avc1.42E01E"')],
        ['VP9 WebM', can('video/webm; codecs="vp9"')],
        ['AV1', can('video/mp4; codecs="av01.0.05M.08"')],
        ['HEVC', can('video/mp4; codecs="hvc1.1.6.L93.B0"')],
        ['AAC', can('audio/mp4; codecs="mp4a.40.2"')],
        ['Opus', can('audio/webm; codecs="opus"')]
      ];
      data = { supports: Object.fromEntries(supports.map(([k, v]) => [k, v])), codecs: Object.fromEntries(codecs.map(([k, v]) => [k, !!v])) };
      body.innerHTML = `<div class="sys-card"><div class="sys-title">API 支持</div><div class="kv-grid">${supports.map(([k, v]) => `<div class="kv-k">${esc(k)}</div><div class="kv-v" style="color:${v ? 'var(--good)' : 'var(--err)'}">${v ? '支持' : '不支持'}</div>`).join('')}</div></div>
        <div class="sys-card"><div class="sys-title">媒体编码</div><div class="kv-grid">${codecs.map(([k, v]) => `<div class="kv-k">${esc(k)}</div><div class="kv-v" style="color:${v ? 'var(--good)' : 'var(--err)'}">${v ? '支持' : '不支持'}</div>`).join('')}</div></div>`;
    }
    host.querySelector('#capRun').onclick = run;
    host.querySelector('#capCopy').onclick = () => T.copy(JSON.stringify(data, null, 2));
    run();
  }});

  /* ---------------- 摄像头与麦克风测试 ---------------- */
  R('摄像头与麦克风测试', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="avStart">开启摄像头与麦克风</button><button class="btn btn-ghost" id="avStop">停止</button><span class="cp-note" id="avMsg">需要浏览器授权，视频与音频不会上传</span></div>
      <div class="cp-canvas-wrap"><video id="avVideo" autoplay playsinline muted style="max-width:100%;max-height:360px;border-radius:8px;background:#000"></video></div>
      <div class="av-meter"><div id="avLevel"></div></div></div>`;
    const video = host.querySelector('#avVideo'), msg = host.querySelector('#avMsg'), level = host.querySelector('#avLevel');
    let stream = null, ctx = null, analyser = null, src = null, raf = null, buf = null;
    const stop = () => {
      if (raf) cancelAnimationFrame(raf); raf = null;
      if (stream) stream.getTracks().forEach(t => t.stop()); stream = null;
      if (src) try { src.disconnect(); } catch (e) {}
      if (ctx && ctx.state !== 'closed') ctx.close(); ctx = null; analyser = null; src = null;
      video.srcObject = null; level.style.width = '0%'; msg.textContent = '已停止';
    };
    const start = async () => {
      stop();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return msg.textContent = '当前浏览器不支持 getUserMedia';
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;
        msg.textContent = `已开启 · ${stream.getVideoTracks().length} 路视频 / ${stream.getAudioTracks().length} 路音频`;
        ctx = new (window.AudioContext || window.webkitAudioContext)(); await ctx.resume().catch(() => {});
        src = ctx.createMediaStreamSource(stream); analyser = ctx.createAnalyser(); analyser.fftSize = 256;
        src.connect(analyser); buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(buf);
          let sum = 0; for (const v of buf) sum += v;
          level.style.width = Math.min(100, sum / buf.length * 2.2) + '%';
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) { msg.textContent = '无法开启：' + (e.message || e); }
    };
    host.querySelector('#avStart').onclick = start;
    host.querySelector('#avStop').onclick = stop;
    api.onCleanup(stop);
  }});

  /* ---------------- 扬声器声道测试 ---------------- */
  R('扬声器声道测试', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" data-ch="left">左声道</button><button class="btn btn-primary" data-ch="right">右声道</button><button class="btn btn-ghost" data-ch="both">双声道</button><span class="cp-note" id="spMsg">建议佩戴耳机</span></div>
      <div class="note">点击按钮会播放 1 秒测试音。左、右声道应分别从对应耳机单元发出；如果两侧都响或都不响，检查系统声道设置与耳机接口。</div></div>`;
    let ctx = null;
    const beep = ch => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return T.toast('当前浏览器不支持 Web Audio', 'err');
      if (!ctx || ctx.state === 'closed') ctx = new AC();
      ctx.resume().catch(() => {});
      const osc = ctx.createOscillator(), gain = ctx.createGain(), pan = ctx.createStereoPanner();
      osc.type = 'sine'; osc.frequency.value = 660;
      pan.pan.value = ch === 'left' ? -1 : ch === 'right' ? 1 : 0;
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.25, ctx.currentTime + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .9);
      osc.connect(gain); gain.connect(pan); pan.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + .95);
      host.querySelector('#spMsg').textContent = ch === 'left' ? '左声道播放中…' : ch === 'right' ? '右声道播放中…' : '双声道播放中…';
      setTimeout(() => { host.querySelector('#spMsg').textContent = '播放完成'; }, 1000);
    };
    host.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => beep(b.dataset.ch));
    api.onCleanup(() => { if (ctx && ctx.state !== 'closed') ctx.close(); });
  }});

  /* ---------------- 电池与网络信息 ---------------- */
  R('电池与网络信息', { render(host, api) {
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><button class="btn btn-primary" id="bnRun">刷新信息</button><span class="cp-note">部分信息需要浏览器支持相应 API</span></div><div id="bnBody" class="sys-grid"></div></div>`;
    const body = host.querySelector('#bnBody');
    async function run() {
      let battery = null;
      try { if (navigator.getBattery) battery = await navigator.getBattery(); } catch (e) {}
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const rows = [
        ['在线状态', navigator.onLine ? '在线' : '离线'],
        ['网络类型', conn ? (conn.effectiveType || '—') : '不支持 Network Information API'],
        ['估算下行', conn && conn.downlink ? conn.downlink + ' Mb/s' : '—'],
        ['往返延迟', conn && conn.rtt ? conn.rtt + ' ms' : '—'],
        ['省流模式', conn && conn.saveData ? '开启' : '关闭'],
        ['电池', battery ? Math.round(battery.level * 100) + '%' : '不支持 Battery API'],
        ['充电状态', battery ? (battery.charging ? '充电中' : '未充电') : '—'],
        ['剩余时间', battery && isFinite(battery.dischargingTime) && battery.dischargingTime > 0 ? Math.round(battery.dischargingTime / 60) + ' 分钟' : '—'],
        ['页面可见性', document.visibilityState],
        ['时区', Intl.DateTimeFormat().resolvedOptions().timeZone]
      ];
      body.innerHTML = card('电池与网络', rows);
    }
    host.querySelector('#bnRun').onclick = run;
    run();
  }});

  /* ---------------- 打字速度测试 ---------------- */
  R('打字速度测试', { render(host, api) {
    const SAMPLE = '把常用的工具收进同一个页面，打开就能用。文件、文本与计算结果只在浏览器本地处理，不上传服务器。设计、图片、文件、开发与学习工具都可以直接使用。';
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="tyReset">重新开始</button><span class="cp-note" id="tyMsg">开始输入后自动计时</span></div>
      <div class="typing-sample" id="tySample">${esc(SAMPLE)}</div>
      <textarea id="tyInput" class="typing-input" placeholder="在这里输入上面的文字…" spellcheck="false"></textarea>
      <div id="tyStats" class="sys-grid"></div></div>`;
    const sample = host.querySelector('#tySample'), input = host.querySelector('#tyInput'), msg = host.querySelector('#tyMsg'), stats = host.querySelector('#tyStats');
    let startTs = 0, timer = null, done = false, best = 0;
    try { best = Number(localStorage.getItem('toolbox_typing_best') || 0) || 0; } catch (e) {}
    const paintSample = () => {
      const v = input.value;
      sample.innerHTML = [...SAMPLE].map((ch, i) => {
        const ok = v[i] === ch;
        const cls = i < v.length ? (ok ? 'ok' : 'bad') : i === v.length ? 'cur' : '';
        return `<span class="${cls}">${esc(ch)}</span>`;
      }).join('');
    };
    const finish = () => {
      if (done) return;
      const v = input.value, elapsed = (Date.now() - startTs) / 1000;
      if (!v.length || elapsed <= 0) return;
      const correct = [...v].filter((ch, i) => ch === SAMPLE[i]).length;
      const cpm = Math.round(correct / elapsed * 60), wpm = Math.round(correct / 5 / (elapsed / 60));
      const acc = Math.round(correct / Math.max(1, v.length) * 100);
      if (cpm > best) { best = cpm; try { localStorage.setItem('toolbox_typing_best', String(best)); } catch (e) {} T.toast('刷新最佳记录'); }
      done = true; clearInterval(timer); timer = null;
      msg.textContent = `完成 · 用时 ${elapsed.toFixed(1)} 秒`;
      stats.innerHTML = card('打字结果', [
        ['速度', cpm + ' 字/分钟'], ['英文词速', wpm + ' WPM'], ['正确率', acc + '%'],
        ['正确字符', correct + ' / ' + [...SAMPLE].length], ['本机最佳', best + ' 字/分钟']
      ]);
    };
    const tick = () => {
      if (!startTs) return;
      const elapsed = (Date.now() - startTs) / 1000, v = input.value;
      const correct = [...v].filter((ch, i) => ch === SAMPLE[i]).length;
      const cpm = Math.round(correct / Math.max(.01, elapsed) * 60);
      const acc = Math.round(correct / Math.max(1, v.length) * 100);
      msg.textContent = `${elapsed.toFixed(1)} 秒 · ${cpm} 字/分钟`;
      stats.innerHTML = card('实时数据', [
        ['速度', cpm + ' 字/分钟'], ['正确率', acc + '%'], ['已输入', v.length + ' 字'], ['本机最佳', best + ' 字/分钟']
      ]);
      if (v.length >= [...SAMPLE].length) finish();
    };
    input.addEventListener('input', () => {
      if (done) return;
      if (!startTs) { startTs = Date.now(); timer = setInterval(tick, 200); }
      paintSample();
      tick();
    });
    const reset = () => {
      done = false; startTs = 0; clearInterval(timer); timer = null;
      input.value = ''; paintSample(); msg.textContent = '开始输入后自动计时';
      stats.innerHTML = card('本机最佳', [['最佳速度', best ? best + ' 字/分钟' : '—']]);
      input.focus();
    };
    host.querySelector('#tyReset').onclick = reset;
    api.onCleanup(() => clearInterval(timer));
    reset();
  }});
})();
