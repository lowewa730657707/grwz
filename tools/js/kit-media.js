/* ============================================================
   工具实现：音视频 / 字幕 / 二维码 / 条形码
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const X = (key, label, def, extra) => Object.assign({ key, label, type: 'textarea', def, rows: 7 }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file' }, extra || {});
  const FS = (key, label, extra) => Object.assign({ key, label, type: 'files' }, extra || {});
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const shortName = (f, ext) => (f && f.name || 'file').replace(/\.[^.]+$/, '') + '.' + ext;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const srtTime = s => { const m = Math.floor(s / 60), sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${pad(m)}:${pad(sec)},${pad(ms, 3)}`; };
  const parseTime = s => { const m = String(s).match(/(\d+):(\d+)[,.](\d+)/); return m ? (+m[1]) * 60 + (+m[2]) + (+m[3]) / 1000 : 0; };

  /* ==========================================================
     音频工作台：Web Audio 解码 → 处理 → WAV / MP3 导出
     ========================================================== */
  function wavBlob(ab) {
    const ch = ab.numberOfChannels, len = ab.length, sr = ab.sampleRate;
    const data = new ArrayBuffer(44 + len * ch * 2), dv = new DataView(data);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); dv.setUint32(4, 36 + len * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * ch * 2, true); dv.setUint16(32, ch * 2, true);
    dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, len * ch * 2, true);
    const chan = Array.from({ length: ch }, (_, c) => ab.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chan[c][i])); dv.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2;
    }
    return new Blob([data], { type: 'audio/wav' });
  }
  function mp3Blob(ab, kbps) {
    const L = window.lamejs;
    if (!L) throw new Error('MP3 编码组件未加载');
    const Enc = L.Mp3Encoder || (typeof L === 'function' ? L().Mp3Encoder : null);
    if (!Enc) throw new Error('MP3 编码器不可用');
    const ch = Math.min(2, ab.numberOfChannels), sr = ab.sampleRate;
    const enc = new Enc(ch, sr, Number(kbps) || 128);
    const left = ab.getChannelData(0), right = ch > 1 ? ab.getChannelData(1) : left;
    const toInt = f => Math.max(-32768, Math.min(32767, Math.round(f * 32767)));
    const parts = [], block = 1152;
    for (let i = 0; i < left.length; i += block) {
      const l = new Int16Array(block), r = new Int16Array(block);
      for (let j = 0; j < block; j++) { l[j] = toInt(left[i + j] || 0); r[j] = toInt(right[i + j] || 0); }
      const buf = enc.encodeBuffer(l, r);
      if (buf.length) parts.push(new Uint8Array(buf));
    }
    const tail = enc.flush(); if (tail.length) parts.push(new Uint8Array(tail));
    return new Blob(parts, { type: 'audio/mpeg' });
  }
  function floatBuffer(ctx, ch, len, sr, fill) {
    const b = ctx.createBuffer(ch, Math.max(1, len), sr);
    for (let c = 0; c < ch; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = fill(c, i); }
    return b;
  }

  /* 无法直接解码时，用播放 + ScriptProcessor 实时捕获音轨 */
  async function captureAudioBuffer(file, start, end) {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url; video.preload = 'auto'; video.playsInline = true;
    video.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0';
    document.body.appendChild(video);
    let ctx = null;
    const cleanup = () => { try { video.pause(); } catch (e) {} video.remove(); URL.revokeObjectURL(url); if (ctx && ctx.state !== 'closed') ctx.close(); };
    try {
      await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = () => rej(new Error('浏览器无法读取该视频文件')); });
      const dur = isFinite(video.duration) ? video.duration : 0;
      const startT = Math.max(0, Number(start) || 0);
      const endT = Number(end) > 0 ? (dur ? Math.min(Number(end), dur) : Number(end)) : dur;
      if (!endT) throw new Error('无法获取视频时长，请手动填写结束时间');
      if (endT <= startT) throw new Error('结束时间必须大于开始时间');
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      await ctx.resume().catch(() => {});
      const src = ctx.createMediaElementSource(video);
      const proc = ctx.createScriptProcessor(4096, 2, 2);
      const sink = ctx.createGain(); sink.gain.value = 0;
      const chunks = [];
      proc.onaudioprocess = e => {
        const l = new Float32Array(e.inputBuffer.getChannelData(0));
        const r = e.inputBuffer.numberOfChannels > 1 ? new Float32Array(e.inputBuffer.getChannelData(1)) : new Float32Array(l);
        chunks.push([l, r]);
      };
      src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
      if (startT > 0) {
        video.currentTime = startT;
        await new Promise(r => { video.onseeked = r; setTimeout(r, 800); });
      }
      await video.play();
      await new Promise(res => {
        const tick = () => { if (video.ended || video.currentTime >= endT - .02) { res(); return; } requestAnimationFrame(tick); };
        tick(); setTimeout(res, Math.max(1500, (endT - startT) * 1000 + 2000));
      });
      video.pause();
      const sr = ctx.sampleRate;
      const len = chunks.reduce((s, c) => s + c[0].length, 0);
      const ab = ctx.createBuffer(2, Math.max(1, len), sr);
      const L = ab.getChannelData(0), R = ab.getChannelData(1);
      let off = 0;
      for (const [l, r] of chunks) { L.set(l, off); R.set(r, off); off += l.length; }
      await ctx.close(); ctx = null;
      return ab;
    } finally { cleanup(); }
  }
  function audioTool(name, cfg) {
    R(name, { render(host, api) {
      host.innerHTML = `<div class="custom-pane"><div class="tool-form"><div class="form-grid">${[F('file', '选择音频文件', { accept: 'audio/*' })].concat(cfg.fields || []).map(f => Object.assign({}, f, { wide: true })).map(T.fieldHTML).join('')}</div></div>
        <div class="cp-row"><button class="btn btn-primary" id="auRun">开始处理</button><button class="btn btn-ghost" id="auWav">下载 WAV</button><button class="btn btn-ghost" id="auMp3">下载 MP3</button><button class="btn btn-ghost" id="auPlay">试听</button><span class="cp-note" id="auInfo">选择音频文件后开始处理</span></div>
        <div class="cp-canvas-wrap" style="padding:14px"><canvas id="auWave" width="760" height="150"></canvas></div>
        ${cfg.tip ? `<div class="note">${cfg.tip}</div>` : ''}</div>`;
      const form = host.querySelector('#imForm') || host.querySelector('.tool-form');
      const fields = [F('file', '选择音频文件')].concat(cfg.fields || []);
      const inp = host.querySelector('input[type=file]'), info = host.querySelector('#auInfo'), cv = host.querySelector('#auWave');
      const names = host.querySelector('[data-names="file"]');
      let src = null, out = null, audioCtx = null, currentAudio = null;
      const vals = () => T.collect(form, fields);
      const ensureCtx = () => audioCtx || (audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      function drawWave(ab) {
        const cx = cv.getContext('2d'), W = cv.width, H = cv.height;
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
        cx.strokeStyle = '#e6ebf3'; cx.beginPath(); cx.moveTo(0, H / 2); cx.lineTo(W, H / 2); cx.stroke();
        const d = ab.getChannelData(0), step = Math.max(1, Math.floor(d.length / W));
        cx.strokeStyle = '#7c6cff'; cx.lineWidth = 1; cx.beginPath();
        for (let x = 0; x < W; x++) { let peak = 0; for (let i = 0; i < step; i++) peak = Math.max(peak, Math.abs(d[x * step + i] || 0)); const y = H / 2 - peak * H / 2 * .92; x ? cx.lineTo(x, y) : cx.moveTo(x, y); }
        cx.stroke();
      }
      inp.addEventListener('change', () => { const f = inp.files[0]; if (f && names) names.textContent = f.name; });
      host.querySelectorAll('[data-key]').forEach(el => { if (el !== inp) el.addEventListener('input', () => { if (src) run(); }); });
      async function load() {
        const f = inp.files[0]; if (!f) throw new Error('请先选择音频文件');
        const ctx = ensureCtx(), buf = await f.arrayBuffer();
        return await new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej));
      }
      async function run() {
        try {
          info.textContent = '正在解码…';
          src = await load();
          info.textContent = '正在处理…';
          out = await cfg.process(src, vals(), ensureCtx(), { floatBuffer, wavBlob });
          drawWave(out);
          info.textContent = `时长 ${T.fmt(out.duration, 2)} s · ${out.numberOfChannels} 声道 · ${out.sampleRate} Hz`;
        } catch (e) { info.textContent = '处理失败：' + e.message; T.toast(e.message, 'err'); }
      }
      host.querySelector('#auRun').onclick = run;
      host.querySelector('#auWav').onclick = () => { if (!out) return T.toast('请先处理音频', 'err'); T.save(wavBlob(out), 'audio.wav'); };
      host.querySelector('#auMp3').onclick = () => { if (!out) return T.toast('请先处理音频', 'err'); try { T.save(mp3Blob(out, 128), 'audio.mp3'); } catch (e) { T.toast(e.message, 'err'); } };
      host.querySelector('#auPlay').onclick = () => {
        if (!out) return T.toast('请先处理音频', 'err');
        if (currentAudio) currentAudio.pause();
        const ctx = ensureCtx(), s = ctx.createBufferSource(); s.buffer = out; s.connect(ctx.destination); s.start();
        currentAudio = { pause: () => { try { s.stop(); } catch (_) {} } };
      };
      api.onCleanup(() => { if (audioCtx) audioCtx.close(); });
    }});
  }

  const A_NOTES = { type: 'note', value: '音频解码依赖浏览器 Web Audio（支持 MP3 / WAV / OGG / 部分 M4A）；输出 WAV 为无损 PCM，MP3 由本地 lame.js 编码。' };
  audioTool('音频格式转换', { fields: [N('rate','输出采样率（0 保持原值）',0), C('mono','转为单声道',false,'单声道')],
    process: (src, v, ctx, h) => {
      const sr = Number(v.rate) || src.sampleRate, ch = v.mono ? 1 : src.numberOfChannels;
      const len = Math.round(src.duration * sr);
      return h.floatBuffer(ctx, ch, len, sr, (c, i) => src.getChannelData(Math.min(c, src.numberOfChannels - 1))[Math.floor(i / sr * src.sampleRate)] || 0);
    }, tip: '浏览器可解码常见音频格式，导出为 WAV 或 MP3；FLAC / M4A 的解码支持取决于浏览器。' });
  audioTool('音频裁剪', { fields: [N('start','开始时间（秒）',0), N('end','结束时间（秒，0 为结尾）',10), C('fade','首尾淡入淡出 0.1s',true,'淡入淡出')],
    process: (src, v, ctx, h) => {
      const sr = src.sampleRate, a = Math.max(0, Number(v.start) || 0), b = Math.min(src.duration, Number(v.end) || src.duration);
      if (b <= a) throw new Error('结束时间需大于开始时间');
      const len = Math.round((b - a) * sr), fade = v.fade ? Math.min(sr * .1, len / 4) : 0;
      return h.floatBuffer(ctx, src.numberOfChannels, len, sr, (c, i) => {
        const d = src.getChannelData(c)[Math.floor((a + i / sr) * sr)] || 0;
        const f = fade ? Math.min(1, i / fade, (len - i) / fade) : 1;
        return d * f;
      });
    }, tip: '按秒精确截取音频片段，可叠加淡入淡出避免爆音。' });
  audioTool('音频合并', { fields: [F('file2','第二个音频文件',{accept:'audio/*'}), N('gap','两段间隔（秒）',0), C('crossfade','交叉淡化 0.3s',false,'交叉淡化')],
    process: async (src, v, ctx, h) => {
      if (!v.file2) throw new Error('请选择第二个音频文件');
      const ab2 = await v.file2.arrayBuffer();
      const buf2 = await new Promise((res, rej) => ctx.decodeAudioData(ab2, res, rej));
      const sr = src.sampleRate, gap = Math.max(0, Number(v.gap) || 0), n1 = src.length, n2 = Math.round(buf2.length / buf2.sampleRate * sr), total = n1 + Math.round(gap * sr) + n2;
      const ch = Math.max(src.numberOfChannels, buf2.numberOfChannels);
      return h.floatBuffer(ctx, ch, total, sr, (c, i) => {
        if (i < n1) return src.getChannelData(Math.min(c, src.numberOfChannels - 1))[i] || 0;
        const j = i - n1 - Math.round(gap * sr);
        if (j < 0 || j >= n2) return 0;
        return buf2.getChannelData(Math.min(c, buf2.numberOfChannels - 1))[Math.floor(j / sr * buf2.sampleRate)] || 0;
      });
    }, tip: '把两段音频按顺序拼接；采样率不同会自动按第一段重采样。' });
  audioTool('音频音量调整', { fields: [N('gain','增益倍数（1 = 原音量）',1.5), C('normalize','峰值归一化到 0 dB',false,'自动归一化'), C('limit','硬限幅防削波',true,'限幅')],
    process: (src, v, ctx, h) => {
      let peak = 0;
      for (let c = 0; c < src.numberOfChannels; c++) { const d = src.getChannelData(c); for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i])); }
      const g = v.normalize ? (peak ? .99 / peak : 1) : (Number(v.gain) || 1);
      return h.floatBuffer(ctx, src.numberOfChannels, src.length, src.sampleRate, (c, i) => {
        let x = src.getChannelData(c)[i] * g;
        if (v.limit) x = Math.max(-1, Math.min(1, x));
        return x;
      });
    }, tip: '统一放大 / 降低音量；峰值归一化可把最大电平调整到接近 0 dB 而不削波。' });
  audioTool('音频降噪', { fields: [N('threshold','噪声门限（0 ~ 1）',.02), N('smooth','平滑窗口（采样点）',5), C('highpass','简易高通（去低频嗡声）',true,'开启高通')],
    process: (src, v, ctx, h) => {
      const th = Number(v.threshold) || 0, win = Math.max(1, Math.round(Number(v.smooth) || 5));
      return h.floatBuffer(ctx, src.numberOfChannels, src.length, src.sampleRate, (c, i) => {
        const d = src.getChannelData(c);
        let sum = 0, n = 0;
        for (let k = -win; k <= win; k++) { const x = d[i + k]; if (x !== undefined) { sum += x; n++; } }
        const avg = sum / n, x = d[i];
        const gated = Math.abs(avg) < th ? x * (Math.abs(avg) / th) * .4 : x;
        return v.highpass && i > 0 ? gated - d[i - 1] * .92 + gated * .92 : gated;
      });
    }, tip: '基于噪声门 + 移动平均 + 简易高通的轻量降噪，适合底噪、电流声；人声降噪请用专业算法。' });
  audioTool('音频混音', { fields: [F('file2','叠加的第二个音频',{accept:'audio/*'}), N('mix','第二段音量比例（0 ~ 1）',.5), N('offset','第二段起始偏移（秒）',0)],
    process: async (src, v, ctx, h) => {
      if (!v.file2) throw new Error('请选择第二个音频文件');
      const ab2 = await v.file2.arrayBuffer();
      const buf2 = await new Promise((res, rej) => ctx.decodeAudioData(ab2, res, rej));
      const sr = src.sampleRate, off = Math.round((Number(v.offset) || 0) * sr), ch = Math.max(src.numberOfChannels, buf2.numberOfChannels), g = Number(v.mix) || 0;
      const len = Math.max(src.length, off + Math.round(buf2.length / buf2.sampleRate * sr));
      return h.floatBuffer(ctx, ch, len, sr, (c, i) => {
        const a = src.getChannelData(Math.min(c, src.numberOfChannels - 1))[i] || 0;
        const j = i - off, b = j >= 0 ? (buf2.getChannelData(Math.min(c, buf2.numberOfChannels - 1))[Math.floor(j / sr * buf2.sampleRate)] || 0) : 0;
        return Math.max(-1, Math.min(1, a * (1 - g * .5) + b * g));
      });
    }, tip: '两段音频叠加混合，可调整第二段的音量比例与起始偏移。' });
  audioTool('音频波形查看', { fields: [S('color','波形颜色',[['#7c6cff','紫'],['#4ea8ff','蓝'],['#34d399','绿']],'#7c6cff')],
    process: src => src, tip: '可视化音频波形与峰值；右侧可试听或导出处理后的音频。' });

  /* 视频工作台：Canvas 逐帧绘制 + MediaRecorder 录制为 WebM */
  function videoTool(name, cfg) {
    R(name, { render(host, api) {
      host.innerHTML = `<div class="custom-pane"><div class="tool-form"><div class="form-grid">${[F('file','选择视频文件',{accept:'video/*'})].concat(cfg.fields || []).map(f => Object.assign({}, f, { wide: true })).map(T.fieldHTML).join('')}</div></div>
        <div class="cp-row"><button class="btn btn-primary" id="vdRec">开始录制并导出 WebM</button><button class="btn btn-ghost" id="vdPreview">仅预览效果</button><button class="btn btn-ghost" id="vdShot">截取当前帧</button><span class="cp-note" id="vdInfo">选择视频文件后操作</span></div>
        <div class="cp-canvas-wrap"><canvas id="vdCanvas" width="640" height="360"></canvas><video id="vdVideo" style="display:none" playsinline></video></div>
        ${cfg.tip ? `<div class="note">${cfg.tip}</div>` : ''}</div>`;
      const form = host.querySelector('.tool-form'), fields = [F('file','选择视频文件')].concat(cfg.fields || []);
      const inp = host.querySelector('input[type=file]'), video = host.querySelector('#vdVideo'), cv = host.querySelector('#vdCanvas'), ctx = cv.getContext('2d');
      const info = host.querySelector('#vdInfo'), names = host.querySelector('[data-names="file"]');
      let url = null, raf = null, recording = false;
      let audioCtx = null, audioDest = null;
      async function ensureAudio() {
        if (audioCtx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
          audioCtx = new AC();
          const src = audioCtx.createMediaElementSource(video);
          audioDest = audioCtx.createMediaStreamDestination();
          src.connect(audioDest);
          src.connect(audioCtx.destination);
        } catch (e) { audioCtx = null; audioDest = null; }
      }
      const vals = () => T.collect(form, fields);
      const size = () => cfg.size ? cfg.size(video, vals()) : [video.videoWidth || 640, video.videoHeight || 360];
      const frame = () => { const [w, h] = size(); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } ctx.save(); (cfg.draw || ((c, vid) => c.drawImage(vid, 0, 0, w, h)))(ctx, video, vals(), video.currentTime, w, h); ctx.restore(); };
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return;
        if (names) names.textContent = f.name;
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(f); video.src = url;
        video.onloadedmetadata = () => { const [w, h] = size(); cv.width = w; cv.height = h; frame(); info.textContent = `${T.fmt(video.duration, 1)} s · ${video.videoWidth}×${video.videoHeight} · ${T.fmt(f.size / 1024 / 1024, 1)} MB`; };
      };
      function loop() { if (!video.paused && !video.ended) frame(); raf = requestAnimationFrame(loop); }
      function startLoop() { cancelAnimationFrame(raf); loop(); }
      async function record() {
        if (!video.src) return T.toast('请先选择视频文件', 'err');
        if (recording) return;
        if (!window.MediaRecorder || !cv.captureStream) return T.toast('当前浏览器不支持 Canvas 录制，请用 Chrome / Edge', 'err');
        const v = vals(), range = cfg.range ? cfg.range(v, video.duration) : [0, video.duration];
        const [w, h] = size(); cv.width = w; cv.height = h;
        await ensureAudio();
        if (audioCtx && audioCtx.state === 'suspended') { try { await audioCtx.resume(); } catch (e) {} }
        const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(x => MediaRecorder.isTypeSupported(x)) || '';
        const stream = cv.captureStream(30);
        if (audioDest) audioDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
        else T.toast('当前浏览器无法捕获音频，导出的视频将没有声音', 'err');
        let rec;
        try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined); }
        catch (e) { return T.toast('录制初始化失败：' + e.message, 'err'); }
        const chunks = [];
        rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        rec.onstop = () => { const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' }); T.save(blob, shortName(inp.files[0], 'webm')); info.textContent = `录制完成 · ${T.fmt(blob.size / 1024 / 1024, 2)} MB`; T.toast('录制完成'); };
        video.currentTime = range[0];
        await new Promise(res => { video.onseeked = res; setTimeout(res, 1500); });
        if (cfg.rate) video.playbackRate = cfg.rate(v);
        frame(); startLoop(); rec.start(200); recording = true;
        info.textContent = '录制中…（需按视频时长实时等待，请保持此页面在前台）';
        const stop = () => { if (!recording) return; recording = false; video.pause(); cancelAnimationFrame(raf); if (rec.state !== 'inactive') rec.stop(); stream.getTracks().forEach(t => t.stop()); };
        video.ontimeupdate = () => { if (video.currentTime >= range[1]) stop(); };
        video.onended = stop;
        await video.play().catch(() => T.toast('播放失败，请检查视频编码是否被浏览器支持', 'err'));
      }
      host.querySelector('#vdRec').onclick = record;
      host.querySelector('#vdPreview').onclick = async () => { if (!video.src) return T.toast('请先选择视频', 'err'); const v = vals(); if (cfg.rate) video.playbackRate = cfg.rate(v); const range = cfg.range ? cfg.range(v, video.duration) : [0, video.duration]; video.currentTime = range[0]; startLoop(); await video.play().catch(() => {}); };
      host.querySelector('#vdShot').onclick = () => { if (!video.src) return T.toast('请先选择视频', 'err'); frame(); T.save(cv.toDataURL('image/png'), 'frame.png'); };
      api.onCleanup(() => { cancelAnimationFrame(raf); if (url) URL.revokeObjectURL(url); video.pause(); if (audioCtx && audioCtx.state !== 'closed') audioCtx.close(); });
      ctx.fillStyle = '#eef2f9'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = '#8893a9'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('选择视频文件后在此预览', cv.width / 2, cv.height / 2); ctx.textAlign = 'left';
    }});
  }
  const V_TIP = '浏览器端通过 Canvas 逐帧绘制 + MediaRecorder 实时录制，输出为 WebM（VP8/VP9）。MP4 / H.264 编码需要服务端 FFmpeg，本站不上传文件，故提供 WebM 导出。录制按视频时长实时进行。';
  videoTool('视频格式转换', { fields: [N('width','输出宽度（0 为原宽）',0)], size: (vid, v) => { const w = Number(v.width) || vid.videoWidth || 640; return [w, Math.round(w * (vid.videoHeight || 360) / (vid.videoWidth || 640))]; }, tip: V_TIP });
  videoTool('视频倍速调整', { fields: [N('rate','倍速（0.25 ~ 4）',1.5,{min:.25,max:4,step:.25})], rate: v => T.clamp(Number(v.rate) || 1, .25, 4), tip: '调整播放速率后重新录制，音频轨不会变速处理；' + V_TIP });
  videoTool('视频翻转旋转', { fields: [N('rotate','旋转角度（0/90/180/270）',90), C('flipH','水平镜像',false,'水平镜像'), C('flipV','垂直镜像',false,'垂直镜像')],
    size: (vid, v) => (+v.rotate % 180 === 90) ? [vid.videoHeight || 360, vid.videoWidth || 640] : [vid.videoWidth || 640, vid.videoHeight || 360],
    draw: (c, vid, v, t, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); c.rotate((Number(v.rotate) || 0) * Math.PI / 180); c.scale(v.flipH ? -1 : 1, v.flipV ? -1 : 1); const s = Math.min(w / (vid.videoHeight || 360), h / (vid.videoWidth || 640)); const dw = (vid.videoWidth || 640) * (+v.rotate % 180 === 90 ? Math.min(w / (vid.videoHeight || 360), h / (vid.videoWidth || 640)) : Math.min(w / (vid.videoWidth || 640), h / (vid.videoHeight || 360))); const dh = (vid.videoHeight || 360) * (dw / (vid.videoWidth || 640)); c.drawImage(vid, -dw / 2, -dh / 2, dw, dh); c.restore(); }, tip: V_TIP });
  videoTool('视频加水印', { fields: [I('text','水印文字','© 拾器 ToolBox'), N('fontSize','字号',26), S('pos','位置',[['tl','左上'],['br','右下'],['center','居中']],'br'), N('opacity','不透明度',.7,{min:0,max:1,step:.1})],
    draw: (c, vid, v, t, w, h) => { c.drawImage(vid, 0, 0, w, h); c.save(); c.globalAlpha = Number(v.opacity) || .7; c.font = `bold ${v.fontSize}px "Microsoft YaHei",sans-serif`; c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 5; const tw = c.measureText(v.text || '').width; const pos = { tl: [16, v.fontSize + 12], br: [w - tw - 16, h - 16], center: [(w - tw) / 2, h / 2] }[v.pos] || [16, 30]; c.fillText(v.text || '', pos[0], pos[1]); c.restore(); }, tip: V_TIP });
  videoTool('视频裁剪', { fields: [N('start','开始时间（秒）',0), N('end','结束时间（秒，0 为结尾）',10)],
    range: (v, dur) => [Math.max(0, Number(v.start) || 0), Math.min(dur, Number(v.end) || dur)], tip: '按时间片段录制导出；' + V_TIP });
  videoTool('视频合并', { fields: [], tip: '当前版本支持单文件录制导出。多段合并可依次导出 WebM 片段后用桌面工具拼接；浏览器端顺序录制多文件需要更复杂的轨道同步，后续版本会补上。' + V_TIP });

  /* 视频提取音频：直接解码音轨，导出 WAV / MP3 */
  R('视频提取音频', { fields: [F('file','选择视频文件',{accept:'video/*'}), N('start','开始时间（秒）',0,{min:0,step:.1}), N('end','结束时间（秒，0 为片尾）',0,{min:0,step:.1}), S('format','输出格式',[['wav','WAV（无损）'],['mp3','MP3（128 kbps）']],'wav')],
    run: async v => {
      if (!v.file) throw new Error('请选择视频文件');
      const ab = await T.readFile(v.file, 'buffer');
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('当前浏览器不支持 Web Audio，无法解码音频');
      let buf, method = 'decode', sourceCtx = null;
      try {
        sourceCtx = new AC();
        buf = await sourceCtx.decodeAudioData(ab.slice(0));
      } catch (e) {
        try {
          buf = await captureAudioBuffer(v.file, v.start, v.end);
          method = 'realtime';
        } catch (e2) {
          if (sourceCtx) { await sourceCtx.close(); sourceCtx = null; }
          throw new Error('无法解码该文件的音轨。部分视频封装或编码浏览器不支持：' + e2.message);
        }
      }
      const sr = buf.sampleRate, chs = buf.numberOfChannels, dur = buf.duration;
      const start = method === 'decode' ? Math.max(0, Number(v.start) || 0) : 0;
      const end = method === 'decode' ? (Number(v.end) > 0 ? Math.min(dur, Number(v.end)) : dur) : dur;
      if (method === 'decode' && end <= start) { if (sourceCtx) await sourceCtx.close(); throw new Error('结束时间必须大于开始时间'); }
      const off = Math.floor(start * sr), len = Math.max(1, Math.floor((end - start) * sr));
      const makerCtx = sourceCtx || new AC();
      const out = makerCtx.createBuffer(chs, len, sr);
      for (let c = 0; c < chs; c++) {
        const src = buf.getChannelData(c), dst = out.getChannelData(c);
        dst.set(src.subarray(off, Math.min(src.length, off + len)));
      }
      if (makerCtx.state !== 'closed') await makerCtx.close();
      const fmt = v.format === 'mp3' ? 'mp3' : 'wav';
      const blob = fmt === 'mp3' ? mp3Blob(out, 128) : wavBlob(out);
      const base = (v.file.name || 'video').replace(/\.[^.]+$/, '');
      return [{ type: 'file', blob, name: `${base}.${fmt}`, title: `提取的音频（${fmt.toUpperCase()}）` },
        KV([['截取时长', T.fmt(end - start, 2) + ' 秒'], ['采样率', sr + ' Hz'], ['声道', chs === 1 ? '单声道' : chs === 2 ? '立体声' : chs + ' 声道'], ['文件大小', T.fmt(blob.size / 1024, 1) + ' KB'], ['提取方式', method === 'decode' ? '直接解码' : '实时捕获']], '音频信息'),
        { type: 'note', value: method === 'decode' ? '音轨直接从视频容器中解码，不经过上传；如需继续剪辑或降噪，可使用「音频裁剪」「音频降噪」。' : '该视频无法直接解码，已通过实时播放捕获音频（耗时约等于片段时长）。捕获期间请保持页面在前台。' }];
    } });

  /* 视频截图：批量抽帧 */
  R('视频截图', { fields: [F('file','选择视频文件',{accept:'video/*'}), N('count','截取张数',6), N('start','起始时间（秒）',0), N('end','结束时间（秒，0 为片尾）',0), C('zip','打包下载',true,'生成 ZIP')],
    run: async v => {
      if (!v.file) throw new Error('请选择视频文件');
      const url = URL.createObjectURL(v.file), video = document.createElement('video');
      video.src = url; video.muted = true; video.playsInline = true;
      await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = () => rej(new Error('视频无法解码，浏览器可能不支持该编码')); setTimeout(res, 4000); });
      const n = T.clamp(Math.round(Number(v.count) || 6), 1, 30), a = Math.max(0, Number(v.start) || 0), b = Math.min(video.duration || 10, Number(v.end) || video.duration || 10);
      const items = [];
      for (let i = 0; i < n; i++) {
        const t = a + (b - a) * (n === 1 ? 0 : i / (n - 1));
        video.currentTime = t;
        await new Promise(res => { video.onseeked = res; setTimeout(res, 1200); });
        const cv = document.createElement('canvas'); cv.width = video.videoWidth || 640; cv.height = video.videoHeight || 360;
        cv.getContext('2d').drawImage(video, 0, 0, cv.width, cv.height);
        items.push({ src: cv.toDataURL('image/jpeg', .9), name: `frame_${pad(i + 1, 2)}_${T.fmt(t, 1)}s.jpg` });
      }
      URL.revokeObjectURL(url);
      return [{ type: 'images', items, title: `截取 ${n} 帧`, zip: v.zip ? async () => { const z = new JSZip(); items.forEach(it => z.file(it.name, it.src.split(',')[1], { base64: true })); T.save(await z.generateAsync({ type: 'blob' }), 'video_frames.zip'); } : null }];
    }});

  R('视频码率查看', { fields: [F('file','选择视频文件',{accept:'video/*'})],
    run: async v => {
      if (!v.file) throw new Error('请选择视频文件');
      const url = URL.createObjectURL(v.file), video = document.createElement('video'); video.preload = 'metadata'; video.src = url;
      const meta = await new Promise(res => { video.onloadedmetadata = () => res({ w: video.videoWidth, h: video.videoHeight, d: video.duration }); video.onerror = () => res({ w: 0, h: 0, d: 0 }); setTimeout(() => res({ w: 0, h: 0, d: 0 }), 4000); });
      URL.revokeObjectURL(url);
      const d = meta.d || 0, size = v.file.size;
      return [KV([['文件名', v.file.name],['容器 / MIME', v.file.type || '未知'],['分辨率', meta.w ? `${meta.w} × ${meta.h}` : '浏览器无法解析'],['时长', d ? `${T.fmt(d, 2)} 秒（${T.fmt(d / 60, 2)} 分钟）` : '—'],['文件大小', T.fmt(size / 1024 / 1024, 2) + ' MB'],['整体平均码率', d ? T.fmt(size * 8 / d / 1000, 0) + ' kbps' : '—'],['视频估算码率', d ? T.fmt(size * 8 / d / 1000 * .9, 0) + ' kbps（按 90% 占比估算）' : '—'],['帧率', '浏览器 JS 无法直接读取，建议使用 ffprobe'],['编码格式', '浏览器 JS 无法读取 codec 字符串；可用 <code>video.canPlayType()</code> 粗略判断']], '视频信息'),
        { type: 'note', value: '码率由文件大小与时长推算。精确的编码格式（H.264 / VP9 / AAC）、帧率、GOP 等信息需要在本地运行 <code>ffprobe -v quiet -print_format json -show_streams file.mp4</code> 查看。' }];
    }});

  /* 字幕工具 */
  function parseSRT(text) {
    return String(text || '').trim().split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').filter(Boolean);
      const ti = lines.findIndex(l => l.includes('-->'));
      if (ti < 0) return null;
      const [a, b] = lines[ti].split(/\s*-->\s*/);
      return { start: a.trim(), end: b.trim(), text: lines.slice(ti + 1).join('\n') };
    }).filter(Boolean);
  }
  const toVTT = cues => 'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${c.start.replace(',', '.')} --> ${c.end.replace(',', '.')}\n${c.text}`).join('\n\n');
  const toASS = cues => `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[VTT Style]\nStyle: Default,Microsoft YaHei,36,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n` + cues.map(c => `Dialogue: 0,${c.start.replace(',', '.').slice(0, -1)}0,${c.end.replace(',', '.').slice(0, -1)}0,Default,,0,0,0,,${c.text.replace(/\n/g, '\\N')}`).join('\n');
  const SUB_SAMPLE = '1\n00:00:01,000 --> 00:00:03,500\n欢迎使用拾器工具箱\n\n2\n00:00:04,000 --> 00:00:07,200\n所有文件都在本地处理\n\n3\n00:00:08,000 --> 00:00:11,000\n无需上传，隐私零风险';
  R('SRT 字幕编辑', { fields: [X('srt','SRT 字幕内容',SUB_SAMPLE,{rows:9}), N('offset','整体时间轴偏移（秒，正数延后）',0), N('scale','播放速度比例（如 1.1 表示整体加快）',1), I('find','批量查找',''), I('replace','批量替换为','')],
    run: v => {
      let cues = parseSRT(v.srt);
      if (!cues.length) throw new Error('未解析到字幕条目，请检查 SRT 格式');
      const off = Number(v.offset) || 0, scale = Number(v.scale) || 1;
      cues = cues.map(c => ({
        start: srtTime(Math.max(0, (parseTime(c.start) + off) / scale)),
        end: srtTime(Math.max(0, (parseTime(c.end) + off) / scale)),
        text: v.find ? c.text.split(v.find).join(v.replace || '') : c.text
      }));
      const out = cues.map((c, i) => `${i + 1}\n${c.start} --> ${c.end}\n${c.text}`).join('\n\n');
      return [{ type: 'text', value: out, title: '编辑后的 SRT', download: 'subtitle.srt' },
        { type: 'table', title: `共 ${cues.length} 条字幕`, head: ['#','开始','结束','文本'], rows: cues.map((c, i) => [i + 1, c.start, c.end, c.text.replace(/\n/g, ' / ')]) },
        KV([['总时长', T.fmt(parseTime(cues[cues.length - 1].end), 2) + ' 秒'], ['偏移', off + ' s'], ['速度比例', scale]], '编辑信息')];
    }});
  R('字幕格式转换', { fields: [X('text','字幕内容（SRT / VTT / ASS）',SUB_SAMPLE,{rows:9}), S('from','输入格式',[['srt','SRT'],['vtt','WebVTT'],['ass','ASS']],'srt'), S('to','输出格式',[['vtt','WebVTT'],['ass','ASS'],['srt','SRT']],'vtt'), C('strip','去除样式标签',true,'清除 <i> / {\\...} 等标记')],
    run: v => {
      let cues = [];
      if (v.from === 'srt') cues = parseSRT(v.text);
      else if (v.from === 'vtt') cues = parseSRT(String(v.text).replace(/^WEBVTT[^\n]*\n+/, '').replace(/(\d\d:\d\d:\d\d)\.(\d{3})/g, '$1,$2'));
      else {
        String(v.text).split('\n').filter(l => l.startsWith('Dialogue:')).forEach(l => {
          const p = l.split(','); if (p.length < 10) return;
          cues.push({ start: p[1].trim().replace('.', ',').slice(0, -1), end: p[2].trim().replace('.', ',').slice(0, -1), text: p.slice(9).join(',').replace(/\\N/g, '\n') });
        });
      }
      if (!cues.length) throw new Error('未解析到字幕条目');
      if (v.strip) cues = cues.map(c => Object.assign({}, c, { text: c.text.replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '') }));
      const out = v.to === 'vtt' ? toVTT(cues) : v.to === 'ass' ? toASS(cues) : cues.map((c, i) => `${i + 1}\n${c.start} --> ${c.end}\n${c.text}`).join('\n\n');
      return [{ type: 'text', value: out, title: `转换结果 · ${v.to.toUpperCase()}`, download: 'subtitle.' + v.to }, KV([['条目数', cues.length], ['输入格式', v.from.toUpperCase()], ['输出格式', v.to.toUpperCase()]], '转换信息')];
    }});
  R('字幕生成（本地）', { fields: [X('text','每行一句台词','欢迎使用拾器工具箱\n所有文件都在浏览器本地处理\n无需上传，隐私零风险\n282 个工具，打开即用'), N('start','起始时间（秒）',0), N('duration','每句时长（秒）',3), N('gap','句子间隔（秒）',.3), S('format','输出格式',[['srt','SRT'],['vtt','WebVTT'],['ass','ASS']],'srt')],
    run: v => {
      const lines = String(v.text || '').split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) throw new Error('请输入台词');
      const start = Number(v.start) || 0, dur = Math.max(.3, Number(v.duration) || 3), gap = Math.max(0, Number(v.gap) || 0);
      const cues = lines.map((text, i) => ({ start: srtTime(start + i * (dur + gap)), end: srtTime(start + i * (dur + gap) + dur), text }));
      const out = v.format === 'vtt' ? toVTT(cues) : v.format === 'ass' ? toASS(cues) : cues.map((c, i) => `${i + 1}\n${c.start} --> ${c.end}\n${c.text}`).join('\n\n');
      return [{ type: 'text', value: out, title: '生成的字幕文件', download: 'subtitle.' + v.format },
        { type: 'table', title: '时间轴预览', head: ['#','开始','结束','台词'], rows: cues.map((c, i) => [i + 1, c.start, c.end, c.text]) },
        { type: 'note', value: '这是「文本 → 时间轴字幕」生成器。浏览器端语音识别（ASR）依赖系统/云端服务，本站不上传音频，故不提供录音转写；如需自动听写，请用系统自带字幕功能后再导入本工具编辑。' }];
    }});

  /* ==========================================================
     二维码 / 条形码
     ========================================================== */
  function makeQR(text, opt) {
    const qf = typeof window.qrcode === 'function' ? window.qrcode : (window.qrcode && window.qrcode.qrcode);
    if (!qf) throw new Error('二维码组件未加载');
    opt = opt || {};
    const ec = opt.ec || 'M';
    const qr = qf(0, ec);
    qr.addData(String(text)); qr.make();
    const n = qr.getModuleCount(), quiet = opt.quiet == null ? 4 : Number(opt.quiet), cell = opt.cell || 8;
    const S = (n + quiet * 2) * cell, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const cx = cv.getContext('2d');
    cx.fillStyle = opt.bg || '#ffffff'; cx.fillRect(0, 0, S, S);
    cx.fillStyle = opt.fg || '#111827';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      const x = (c + quiet) * cell, y = (r + quiet) * cell;
      if (opt.round) { cx.beginPath(); cx.arc(x + cell / 2, y + cell / 2, cell * .46, 0, Math.PI * 2); cx.fill(); }
      else cx.fillRect(x, y, cell, cell);
    }
    if (opt.logo) {
      const img = opt.logo, size = S * (opt.logoScale || .2), lx = (S - size) / 2, ly = (S - size) / 2;
      cx.fillStyle = '#fff'; cx.fillRect(lx - 4, ly - 4, size + 8, size + 8);
      cx.drawImage(img, lx, ly, size, size);
    }
    return { canvas: cv, src: cv.toDataURL('image/png'), modules: n, size: S };
  }
  const qrColorFields = [I('fg','前景色','#111827',{type:'color'}), I('bg','背景色','#ffffff',{type:'color'}), N('cell','模块像素大小',8), N('quiet','静区宽度（模块数）',4), S('ec','容错等级',[['L','L · 7%'],['M','M · 15%'],['Q','Q · 25%'],['H','H · 30%']],'M')];
  function qrRun(extra) {
    return v => {
      const text = extra ? extra(v) : String(v.text || '');
      if (!text.trim()) throw new Error('请输入二维码内容');
      const opt = { fg: v.fg, bg: v.bg, cell: Number(v.cell) || 8, quiet: Number(v.quiet) || 4, ec: v.ec || 'M', round: !!v.round };
      const qr = makeQR(text, opt);
      return [{ type: 'image', src: qr.src, name: 'qrcode.png', title: '二维码 · 点击下载或复制' },
        KV([['内容长度', text.length + ' 字符'], ['模块数', `${qr.modules} × ${qr.modules}`], ['图片尺寸', `${qr.size} × ${qr.size} px`], ['容错等级', v.ec || 'M'], ['编码内容', text.length > 120 ? text.slice(0, 120) + '…' : text]], '二维码信息')];
    };
  }
  R('二维码生成', { fields: [X('text','二维码内容（文本 / 网址 / 名片 / WiFi）','https://example.com',{rows:3})].concat(qrColorFields), live: true, run: qrRun() });
  R('二维码美化', { fields: [X('text','二维码内容','https://example.com',{rows:3})].concat(qrColorFields, [C('round','圆点样式',true,'圆角模块'), S('preset','配色预设',[['custom','自定义'],['purple','紫蓝'],['dark','暗夜'],['green','清新绿'],['red','中国红']],'custom')]), live: true,
    run: v => {
      const presets = { purple: ['#6c4cf1', '#f4f1ff'], dark: ['#e8ecf5', '#141b2b'], green: ['#137a5b', '#eefbf5'], red: ['#c62828', '#fff5f5'] };
      if (v.preset !== 'custom' && presets[v.preset]) { v.fg = presets[v.preset][0]; v.bg = presets[v.preset][1]; }
      return qrRun()(v);
    }});
  R('WiFi 二维码生成', { fields: [I('ssid','WiFi 名称 SSID','MyWiFi'), I('pwd','WiFi 密码','12345678'), S('auth','加密方式',[['WPA','WPA / WPA2 / WPA3'],['WEP','WEP'],['nopass','无密码']],'WPA'), C('hidden','隐藏网络',false,'隐藏 SSID')].concat(qrColorFields), live: true,
    run: qrRun(v => `WIFI:T:${v.auth};S:${v.ssid};P:${v.auth === 'nopass' ? '' : v.pwd};H:${v.hidden ? 'true' : 'false'};;`) });
  R('电子名片二维码', { fields: [I('name','姓名','张三'), I('org','公司 / 组织','拾器科技'), I('title','职位','产品经理'), I('phone','电话','13800138000'), I('email','邮箱','zhangsan@example.com'), I('url','网站','https://example.com'), I('addr','地址','深圳市南山区')].concat(qrColorFields), live: true,
    run: qrRun(v => `BEGIN:VCARD\nVERSION:3.0\nN:${v.name};;;;\nFN:${v.name}\nORG:${v.org}\nTITLE:${v.title}\nTEL;TYPE=CELL:${v.phone}\nEMAIL:${v.email}\nURL:${v.url}\nADR:;;${v.addr};;;;\nEND:VCARD`) });
  R('批量生成二维码', { fields: [X('list','内容列表（每行一个）','https://example.com/1\nhttps://example.com/2\nhttps://example.com/3\n欢迎使用拾器工具箱'), I('fg','前景色','#111827',{type:'color'}), I('bg','背景色','#ffffff',{type:'color'}), N('cell','模块像素大小',8)],
    run: async v => {
      const lines = String(v.list || '').split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) throw new Error('请输入内容列表');
      const items = lines.map((line, i) => { const q = makeQR(line, { fg: v.fg, bg: v.bg, cell: Number(v.cell) || 8 }); return { src: q.src, name: `qrcode_${pad(i + 1, 3)}.png` }; });
      const z = new JSZip(); items.forEach(it => z.file(it.name, it.src.split(',')[1], { base64: true }));
      const blob = await z.generateAsync({ type: 'blob' });
      return [{ type: 'images', items, title: `已生成 ${items.length} 个二维码` },
        { type: 'file', blob, name: 'qrcodes.zip', title: '打包下载全部二维码' }];
    }});
  async function decodeQR(file) {
    const { img, url } = await (async () => { const u = URL.createObjectURL(file); try { return { img: await T.loadImage(u), url: u }; } catch (e) { URL.revokeObjectURL(u); throw e; } })();
    try {
      const cv = document.createElement('canvas');
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      cv.width = Math.round(img.naturalWidth * scale); cv.height = Math.round(img.naturalHeight * scale);
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, cv.width, cv.height);
      const data = cx.getImageData(0, 0, cv.width, cv.height);
      const res = window.jsQR(data.data, cv.width, cv.height, { inversionAttempts: 'attemptBoth' });
      return { text: res ? res.data : null, img: cv.toDataURL('image/png'), size: `${img.naturalWidth} × ${img.naturalHeight}` };
    } finally { URL.revokeObjectURL(url); }
  }
  R('二维码解码', { fields: [F('file','选择含二维码的图片',{accept:'image/*'})],
    run: async v => {
      if (!v.file) throw new Error('请选择图片');
      const r = await decodeQR(v.file);
      if (!r.text) return { type: 'note', kind: 'warn', value: '未在图片中识别到二维码。请尝试更清晰、正对镜头、无严重反光或裁切的二维码图片。' };
      const isVCard = r.text.startsWith('BEGIN:VCARD'), isWifi = r.text.startsWith('WIFI:'), isUrl = /^https?:\/\//i.test(r.text);
      return [{ type: 'text', value: r.text, title: '识别结果', download: 'qr_content.txt' },
        KV([['内容类型', isVCard ? '电子名片 vCard' : isWifi ? 'WiFi 连接信息' : isUrl ? '网址 URL' : '纯文本'], ['字符数', r.text.length], ['图片尺寸', r.size], ['可打开链接', isUrl ? '是' : '—']], '解析信息'),
        { type: 'html', title: '操作', value: isUrl ? `<a href="${T.esc(r.text)}" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-block">在新标签页打开链接</a>` : '<span class="cp-note">内容已可复制</span>' }];
    }});
  R('二维码批量解码', { fields: [FS('files','选择多张含二维码的图片',{accept:'image/*'})],
    run: async v => {
      const files = v.files || []; if (!files.length) throw new Error('请选择图片');
      const rows = [], texts = [];
      for (const f of files) { let text; try { text = (await decodeQR(f)).text; } catch (e) { text = null; } rows.push([f.name, text ? '成功' : '未识别', text ? (text.length > 80 ? text.slice(0, 80) + '…' : text) : '—']); if (text) texts.push(text); }
      return [{ type: 'table', title: `识别 ${files.length} 张图片`, head: ['文件名','状态','内容'], rows },
        ...(texts.length ? [{ type: 'text', value: texts.join('\n'), title: '全部识别内容', download: 'qr_contents.txt' }] : [])];
    }});
  R('二维码 JS 调试工具', { fields: [X('text','二维码内容','https://example.com',{rows:3}), S('ec','容错等级',[['L','L · 7%'],['M','M · 15%'],['Q','Q · 25%'],['H','H · 30%']],'M'), N('cell','模块像素',8), N('quiet','静区',4), C('round','圆点样式',false,'圆点')], live: true,
    run: v => {
      const levels = ['L', 'M', 'Q', 'H'].map(ec => { try { const q = makeQR(v.text || 'test', { ec, cell: Number(v.cell) || 8, quiet: Number(v.quiet) || 4 }); return [ec, q.modules + ' × ' + q.modules, q.size + ' px']; } catch (e) { return [ec, '—', e.message]; } });
      const qr = makeQR(v.text || 'test', { ec: v.ec, cell: Number(v.cell) || 8, quiet: Number(v.quiet) || 4, round: v.round });
      return [{ type: 'image', src: qr.src, name: 'qr_debug.png', title: '调试预览' },
        { type: 'table', title: '容错等级对比（同一内容）', head: ['等级','模块数','图片尺寸'], rows: levels },
        { type: 'text', value: `// qrcode-generator 调用示例\nconst qr = qrcode(0, '${v.ec}');\nqr.addData(${JSON.stringify(String(v.text || ''))});\nqr.make();\nconst modules = qr.getModuleCount(); // ${qr.modules}\n\n// Canvas 绘制参数\nconst cell = ${Number(v.cell) || 8}, quiet = ${Number(v.quiet) || 4};\nconst size = (modules + quiet * 2) * cell; // ${qr.size}`, title: '等效 JS 代码', download: 'qrcode_snippet.js' }];
    }});
  R('条形码生成', { fields: [I('value','条码内容','6901234567892'), S('format','条码格式',[['CODE128','CODE128'],['EAN13','EAN-13'],['EAN8','EAN-8'],['UPC','UPC-A'],['CODE39','CODE39'],['ITF14','ITF-14'],['MSI','MSI'],['pharmacode','Pharmacode']],'CODE128'), I('fg','线条颜色','#111827',{type:'color'}), I('bg','背景色','#ffffff',{type:'color'}), N('width','单条宽度',2), N('height','高度',100), C('text','显示文字',true,'显示可读文字')],
    run: v => {
      if (!window.JsBarcode) throw new Error('条码组件未加载');
      const cv = document.createElement('canvas');
      try { window.JsBarcode(cv, String(v.value || ''), { format: v.format, lineColor: v.fg, background: v.bg, width: Number(v.width) || 2, height: Number(v.height) || 100, displayValue: !!v.text, font: 'monospace', fontSize: 14, margin: 12 }); }
      catch (e) { throw new Error('生成失败：' + e.message + '（EAN13 需要 12 或 13 位数字，UPC 需要 11 或 12 位）'); }
      return [{ type: 'image', src: cv.toDataURL('image/png'), name: 'barcode.png', title: '条形码' },
        KV([['内容', v.value], ['格式', v.format], ['建议用途', v.format === 'EAN13' ? '零售商品（中国以 69 开头）' : '物流 / 内部编码']], '条码信息')];
    }});
  R('条形码识别', { fields: [F('file','选择含条形码的图片',{accept:'image/*'})],
    run: async v => {
      if (!v.file) throw new Error('请选择图片');
      if (!('BarcodeDetector' in window)) return { type: 'note', kind: 'warn', value: '当前浏览器不支持原生 BarcodeDetector API（Chrome / Edge 安卓版支持）。可改用「二维码解码」识别 QR 码，或在本地用 ZXing / pyzbar 处理一维条码。' };
      const { img, url } = await (async () => { const u = URL.createObjectURL(v.file); return { img: await T.loadImage(u), url: u }; })();
      try {
        const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'] });
        const res = await det.detect(img);
        if (!res.length) return { type: 'note', kind: 'warn', value: '未识别到条形码，请确保条码清晰、完整且水平放置。' };
        return [{ type: 'table', title: `识别到 ${res.length} 个条码`, head: ['#','格式','内容','边界框'], rows: res.map((r, i) => [i + 1, r.format, r.rawValue, `${Math.round(r.boundingBox.width)} × ${Math.round(r.boundingBox.height)}`]) },
          { type: 'text', value: res.map(r => r.rawValue).join('\n'), title: '识别内容', download: 'barcodes.txt' }];
      } finally { URL.revokeObjectURL(url); }
    }});
  R('条码校验码计算', { fields: [I('value','主体数字（不含校验位）','690123456789'), S('type','条码类型',[['EAN13','EAN-13（12 位主体）'],['EAN8','EAN-8（7 位主体）'],['UPC','UPC-A（11 位主体）'],['GTIN14','GTIN-14（13 位主体）']],'EAN13')], live: true,
    run: v => {
      const s = String(v.value || '').replace(/\D/g, ''), need = { EAN13: 12, EAN8: 7, UPC: 11, GTIN14: 13 }[v.type];
      if (s.length !== need) throw new Error(`${v.type} 需要 ${need} 位数字主体，当前 ${s.length} 位`);
      let sum = 0;
      for (let i = 0; i < s.length; i++) { const d = +s[i], fromRight = s.length - i; sum += d * (v.type === 'EAN8' || v.type === 'UPC' ? (fromRight % 2 ? 3 : 1) : (fromRight % 2 ? 3 : 1)); }
      // EAN13: 从左起奇数位×1、偶数位×3；EAN8/UPC: 从左起奇数位×3
      if (v.type === 'EAN13' || v.type === 'GTIN14') sum = Array.from(s).reduce((a, d, i) => a + (+d) * (i % 2 === 0 ? 1 : 3), 0);
      else sum = Array.from(s).reduce((a, d, i) => a + (+d) * (i % 2 === 0 ? 3 : 1), 0);
      const check = (10 - sum % 10) % 10, full = s + check;
      return [KV([['主体数字', s], ['校验位', check], ['完整条码', full], ['类型', v.type], ['计算说明', '按 GS1 标准加权求和，校验位 = (10 - 加权和 mod 10) mod 10']], '校验码结果'),
        { type: 'html', title: '可视化', value: `<div style="font-family:ui-monospace,monospace;font-size:26px;letter-spacing:5px;text-align:center;padding:16px;color:var(--accent)">${s}<span style="color:var(--err)">${check}</span></div>` }];
    }});
})();
