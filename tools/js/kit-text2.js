/* ============================================================
   工具实现：文本、翻译、编码、开发辅助
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const X = (key, label, def, extra) => Object.assign({ key, label, type: 'textarea', def, rows: 6 }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const TXT = (value, title, download) => ({ type: 'text', value, title, download });
  const esc = T.esc;

  /* ---------------- 中文翻译（多语种 · 可朗读） ---------------- */
  const TR_LANGS = [['auto', '自动检测'], ['zh-CN', '中文'], ['en', '英文'], ['ja', '日文'], ['ko', '韩文'], ['fr', '法文'], ['de', '德文'], ['es', '西班牙文'], ['ru', '俄文'], ['pt', '葡萄牙文'], ['it', '意大利文'], ['th', '泰文'], ['vi', '越南文'], ['ar', '阿拉伯文']];
  const TR_VOICE = { 'zh-CN': 'zh-CN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', ru: 'ru-RU', pt: 'pt-PT', it: 'it-IT', th: 'th-TH', vi: 'vi-VN', ar: 'ar-SA' };
  async function trFetch(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms || 8000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  async function trTranslate(text, from, to) {
    const q = encodeURIComponent(text);
    const errors = [];
    /* 两个公共端点并行请求，谁先成功用谁：Google 支持长文本，MyMemory 限 500 字符 */
    const jobs = [];
    jobs.push((async () => {
      try {
        const d = await trFetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from === 'auto' ? 'auto' : from)}&tl=${encodeURIComponent(to)}&dt=t&q=${q}`);
        const out = Array.isArray(d && d[0]) ? d[0].map(x => (x && x[0]) || '').join('') : '';
        if (!out) throw new Error('Google 返回为空');
        return { text: out, provider: 'Google 翻译公共端点', detected: (d && d[2]) || '' };
      } catch (e) { throw new Error('Google：' + (e.name === 'AbortError' ? '请求超时' : e.message)); }
    })());
    if (text.length <= 500) {
      jobs.push((async () => {
        try {
          const pair = (from === 'auto' ? 'Autodetect' : from) + '|' + to;
          const d = await trFetch('https://api.mymemory.translated.net/get?q=' + q + '&langpair=' + encodeURIComponent(pair));
          const out = d && d.responseData && d.responseData.translatedText;
          if (out && /PLEASE SELECT TWO DISTINCT LANGUAGES|INVALID LANGUAGE PAIR|SAME LANGUAGE/i.test(out)) {
            return { text, provider: '已是目标语言，保留原文', detected: '', same: true };
          }
          if (out && !/MYMEMORY WARNING/i.test(out)) return { text: out, provider: 'MyMemory 公共接口', detected: '' };
          throw new Error((d && d.responseDetails) || '未返回结果');
        } catch (e) { throw new Error('MyMemory：' + (e.name === 'AbortError' ? '请求超时' : e.message)); }
      })());
    }
    return await new Promise((resolve, reject) => {
      let pending = jobs.length, done = false;
      if (!pending) return reject(new Error('没有可用的翻译接口'));
      jobs.forEach(job => job.then(res => { if (done) return; done = true; resolve(res); }).catch(e => {
        errors.push(e.message);
        if (--pending === 0 && !done) reject(new Error('翻译接口暂不可用（' + errors.join('；') + '）。请检查网络，或稍后再试。'));
      }));
    });
  }
  R('中文翻译', {
    fields: [
      X('text', '待翻译文本', '把常用的工具收进同一个页面，打开就能用。', { rows: 7 }),
      S('from', '源语言', TR_LANGS, 'auto'),
      S('to', '目标语言', TR_LANGS.filter(x => x[0] !== 'auto'), 'en')
    ],
    runLabel: '开始翻译', autoRun: false,
    emptyHint: '输入或粘贴文本，选好语言后点击「开始翻译」。翻译需要联网，文本会发送到第三方公共接口。',
    run: async v => {
      const text = String(v.text || '').trim();
      if (!text) throw new Error('请输入要翻译的文本');
      if (v.from === v.to) throw new Error('源语言与目标语言不能相同');
      if (text.length > 1800) throw new Error('单次翻译请控制在 1800 字符以内，过长内容请分段处理');
      const toName = (TR_LANGS.find(x => x[0] === v.to) || [v.to, v.to])[1];
      const fromName = (TR_LANGS.find(x => x[0] === v.from) || [v.from, v.from])[1];
      const t0 = performance.now();
      const res = await trTranslate(text, v.from, v.to);
      const ms = Math.round(performance.now() - t0);
      const out = res.text;
      const raw = document.createElement('div');
      raw.className = 'tr-actions';
      const speak = document.createElement('button');
      speak.type = 'button'; speak.className = 'btn btn-primary btn-sm'; speak.textContent = '朗读译文';
      speak.onclick = () => {
        if (!('speechSynthesis' in window)) return T.toast('当前浏览器不支持语音合成', 'err');
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(out);
        u.lang = TR_VOICE[v.to] || v.to;
        const vs = speechSynthesis.getVoices().filter(x => x.lang && x.lang.toLowerCase().indexOf(u.lang.slice(0, 2).toLowerCase()) === 0);
        if (vs.length) u.voice = vs[0];
        u.rate = 1;
        speechSynthesis.speak(u);
        T.toast('正在朗读：' + toName);
      };
      const copyAll = document.createElement('button');
      copyAll.type = 'button'; copyAll.className = 'btn btn-ghost btn-sm'; copyAll.textContent = '复制译文';
      copyAll.onclick = () => T.copy(out);
      raw.appendChild(speak); raw.appendChild(copyAll);
      return [
        TXT(out, '翻译结果 · ' + toName, 'translation.txt'),
        { type: 'raw', node: raw },
        KV([['源语言', fromName + (res.detected ? '（识别为 ' + res.detected + '）' : '')], ['目标语言', toName], ['字符数', text.length + ' → ' + out.length], ['耗时', ms + ' ms'], ['接口', res.provider]], '翻译信息'),
        { type: 'note', value: '译文由第三方公共翻译接口生成，需要联网，本站不保存原文与译文；专业文本、法律与医学术语请人工校对后再使用。' }
      ];
    }
  });

  /* ---------------- 火星文翻译 ---------------- */
  R('火星文翻译', { fields: [X('text', '输入文本', '今天也要好好生活呀'), S('mode', '方向', [['to', '普通 → 火星文'], ['back', '火星文 → 普通']], 'to')], live: true,
    run: v => {
      const TO = { '你': '伱', '我': '莪', '的': '旳', '是': 'sì', '在': '茬', '不': '罘', '了': 'ㄋ', '吗': '嚒', '这': '這', '个': '個', '会': '會', '说': '說', '爱': '愛', '时': '時', '后': '後', '没': '沒', '有': '洧', '很': '佷', '就': '僦', '都': '嘟', '一': '①', '二': '②', '三': '③', '四': '④', '五': '⑤', '开': '開', '心': '吢', '天': '兲', '气': '氣', '好': '恏', '生': '苼', '活': '活', '想': '想', '看': '睇', '到': '菿', '来': '唻', '去': '厾', '人': '亾', '事': '亊', '情': '情' };
      const BACK = Object.fromEntries(Object.entries(TO).map(([k, v]) => [v, k]));
      const s = String(v.text || '');
      let out = '';
      if (v.mode === 'back') { out = [...s].map(c => BACK[c] || c).join(''); }
      else {
        out = [...s].map((c, i) => {
          const base = TO[c] || c;
          if (i % 7 === 3) return base + 'ゞ';
          if (i % 9 === 5) return base + '≈';
          return base;
        }).join('');
        out = '﹏' + out + '﹏';
      }
      return [TXT(out, v.mode === 'back' ? '还原结果' : '火星文结果', 'huoxingwen.txt'),
        { type: 'note', value: '火星文使用常见字替换与装饰符号生成，只作娱乐；不是标准编码，无法覆盖全部汉字。' }];
    } });

  /* ---------------- 摩斯密码 ---------------- */
  const MORSE_MAP = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.' };
  const MORSE_REV = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, m]) => [m, k]));
  const MORSE_GROUPS = [
    ['字母', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')],
    ['数字', '0123456789'.split('')],
    ['标点与符号', ['.', ',', '?', "'", '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', '$', '@']]
  ];
  function morseNormalize(s) {
    return String(s || '')
      .replace(/[·•・．]/g, '.')
      .replace(/[−–—－]/g, '-')
      .replace(/[|｜]/g, '/')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }
  function morsePlay(code, opts) {
    opts = opts || {};
    const unit = opts.unit || 0.08;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime + 0.05;
    const norm = morseNormalize(code);
    for (const ch of norm) {
      if (ch === '.') { beep(unit); }
      else if (ch === '-') { beep(unit * 3); }
      else if (ch === ' ') { t += unit * 3; }
      else if (ch === '/') { t += unit * 7; }
      else continue;
    }
    function beep(dur) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = opts.freq || 620;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.005);
      g.gain.setValueAtTime(0.14, t + dur - 0.008);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.01);
      t += dur + unit;
    }
    const total = (t - ctx.currentTime + 0.3) * 1000;
    setTimeout(() => { try { ctx.close(); } catch (e) {} }, total);
    return total;
  }
  R('摩斯密码', {
    fields: [
      X('text', '文本 / 摩斯码', 'SOS hello 拾器', { presets: [['SOS', 'SOS 求救'], ['HELLO WORLD', 'HELLO WORLD'], ['... --- ...', '... --- ...（解码示例）'], ['拾器', '中文示例']] }),
      S('mode', '方向', [['enc', '文本 → 摩斯码'], ['dec', '摩斯码 → 文本']], 'enc'),
      C('beep', '转换后播放提示音', false, '播放提示音')
    ],
    runLabel: '开始转换',
    run: v => {
      const s = morseNormalize(v.text);
      if (!s) throw new Error('请输入要转换的内容');
      const out = [];
      if (v.mode === 'dec') {
        const words = s.split(/\s*\/\s*|\s{3,}/).filter(Boolean);
        const decoded = words.map(w => w.split(/\s+/).map(code => MORSE_REV[code] || (code === '' ? '' : '□')).join('')).join(' ');
        out.push(TXT(decoded, '解码结果', 'morse-decoded.txt'));
      } else {
        const chars = [...s.toUpperCase()];
        const words = s.toUpperCase().split(/\s+/);
        const encoded = words.map(w => [...w].map(ch => MORSE_MAP[ch] || (/[\u4e00-\u9fa5]/.test(ch) ? ch : '□')).join(' ')).join(' / ');
        out.push(TXT(encoded, '摩斯码', 'morse-code.txt'));
      }
      const codeText = out[0].value;
      const dots = (codeText.match(/\./g) || []).length, dashes = (codeText.match(/-/g) || []).length;
      const unitMs = 80, totalMs = (codeText.length + (codeText.match(/ /g) || []).length * 2) * unitMs;
      out.push(KV([
        ['原文长度', String(v.text || '').length + ' 字符'],
        ['码元数量', dots + ' 点 · ' + dashes + ' 划'],
        ['字符数', out[0].value.replace(/[\s/]/g, '').length + ' 个'],
        ['发送速率', '20 WPM（每分钟 20 词）'],
        ['预计播放', Math.max(1, Math.round(totalMs / 1000)) + ' 秒（按 80ms 单位时长）']
      ], '转换信息'));

      /* 完整对照表（可点击复制 / 插入） */
      const table = document.createElement('div');
      table.className = 'morse-panel';
      table.innerHTML = `<div class="morse-head"><span class="morse-title">国际摩斯码对照表</span><span class="morse-sub">点击任意格：复制该码并插入到上方输入框</span></div>` +
        MORSE_GROUPS.map(([name, chars]) => `<div class="morse-group"><span class="morse-gname">${name}</span><div class="morse-cells">${chars.map(ch => `<button type="button" class="morse-cell" data-ch="${T.esc(ch)}" data-code="${T.esc(MORSE_MAP[ch])}" title="点击复制 ${T.esc(MORSE_MAP[ch])}"><b>${T.esc(ch)}</b><i>${T.esc(MORSE_MAP[ch])}</i></button>`).join('')}</div></div>`).join('') +
        `<div class="morse-tips"><b>发送规则</b><p>点（·）1 个单位，划（—）3 个单位；同一字母内码元间隔 1 个单位，字母之间间隔 3 个单位，单词之间用 <code>/</code> 表示，间隔 7 个单位。解码时会自动兼容 · 、− 、｜ 等写法。</p></div>`;
      table.querySelectorAll('.morse-cell').forEach(b => b.onclick = () => {
        const el = api.host.querySelector('[data-key="text"]');
        if (el) {
          const code = b.dataset.code;
          const cur = el.value.trim();
          const needSpace = cur && !/\s$/.test(el.value);
          el.value = cur ? el.value + (needSpace ? ' ' : '') + code : code;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.focus();
        }
        T.copy(b.dataset.code);
      });
      const playBtn = document.createElement('button');
      playBtn.type = 'button'; playBtn.className = 'btn btn-ghost btn-sm';
      playBtn.textContent = '播放这段摩斯码';
      playBtn.onclick = () => {
        try { morsePlay(codeText); T.toast('正在播放摩斯提示音'); }
        catch (e) { T.toast('当前浏览器无法播放音频', 'err'); }
      };
      const actions = document.createElement('div');
      actions.className = 'morse-actions';
      actions.appendChild(playBtn);
      const holder = document.createElement('div');
      holder.className = 'morse-wrap';
      holder.appendChild(actions);
      holder.appendChild(table);
      out.push({ type: 'raw', node: holder });

      out.push({ type: 'note', value: '字母之间用空格分隔，单词之间用 / 分隔；中文没有国际通用摩斯码，编码时会原样保留，可先转成拼音或英文再编码。' });
      if (v.beep) { try { morsePlay(codeText); } catch (e) {} }
      return out;
    }
  });

  /* ---------------- 文本转语音 ---------------- */
  R('文本转语音', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><span class="cp-label">语音</span><select id="ttsVoice" style="min-width:200px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:8px"></select><select id="ttsRate" class="btn btn-ghost"><option value="0.8">0.8×</option><option value="1" selected>1×</option><option value="1.2">1.2×</option><option value="1.5">1.5×</option></select><span class="cp-label">音高</span><input id="ttsPitch" type="range" min="0.5" max="1.6" step="0.1" value="1" style="width:90px"></div>
      <textarea id="ttsText" style="width:100%;min-height:130px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:12px;font-size:13px;line-height:1.8" spellcheck="false">把常用的工具收进同一个页面，打开就能用。所有内容只在本地处理。</textarea>
      <div class="cp-row"><button class="btn btn-primary" id="ttsPlay">朗读</button><button class="btn btn-ghost" id="ttsPause">暂停</button><button class="btn btn-ghost" id="ttsStop">停止</button><span class="cp-note" id="ttsMsg">使用浏览器内置语音合成</span></div></div>`;
    if (!('speechSynthesis' in window)) { host.innerHTML = '<div class="hint-empty">当前浏览器不支持语音合成</div>'; return; }
    const voiceSel = host.querySelector('#ttsVoice'), text = host.querySelector('#ttsText'), msg = host.querySelector('#ttsMsg');
    let voices = [];
    const fill = () => { voices = speechSynthesis.getVoices(); voiceSel.innerHTML = voices.map((v, i) => `<option value="${i}">${esc(v.name)} · ${esc(v.lang)}</option>`).join('') || '<option>默认语音</option>'; };
    fill(); speechSynthesis.onvoiceschanged = fill;
    const utt = () => { const u = new SpeechSynthesisUtterance(text.value); const v = voices[+voiceSel.value]; if (v) u.voice = v; u.rate = +(host.querySelector('#ttsRate').value || 1); u.pitch = +(host.querySelector('#ttsPitch').value || 1); return u; };
    host.querySelector('#ttsPlay').onclick = () => { if (!text.value.trim()) return T.toast('请输入文本', 'err'); speechSynthesis.cancel(); speechSynthesis.speak(utt()); msg.textContent = '朗读中…'; };
    host.querySelector('#ttsPause').onclick = () => { if (speechSynthesis.speaking) { speechSynthesis.paused ? speechSynthesis.resume() : speechSynthesis.pause(); } };
    host.querySelector('#ttsStop').onclick = () => { speechSynthesis.cancel(); msg.textContent = '已停止'; };
    api.onCleanup(() => speechSynthesis.cancel());
  }});

  /* ---------------- 语音转文字 ---------------- */
  R('语音转文字', { render(host, api) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { host.innerHTML = '<div class="hint-empty">当前浏览器不支持 Web Speech 语音识别，建议使用 Chrome / Edge。</div>'; return; }
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><select id="sttLang" class="btn btn-ghost"><option value="zh-CN">普通话</option><option value="en-US">English</option><option value="yue-Hant-HK">粤语</option></select><button class="btn btn-primary" id="sttStart">开始识别</button><button class="btn btn-ghost" id="sttStop">停止</button><button class="btn btn-ghost" id="sttCopy">复制</button><span class="cp-note" id="sttMsg">需要麦克风授权</span></div>
      <div id="sttOut" style="min-height:180px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);padding:14px;font-size:14px;line-height:1.9;color:var(--text-2)">识别结果会显示在这里…</div>
      <div class="note">识别由浏览器内置语音服务完成，可能将音频发送到浏览器厂商的识别服务；对隐私敏感的内容请谨慎使用。</div></div>`;
    const out = host.querySelector('#sttOut'), msg = host.querySelector('#sttMsg');
    let rec = null, finalText = '', running = false;
    const start = () => {
      if (running) return;
      rec = new SR(); rec.lang = host.querySelector('#sttLang').value; rec.continuous = true; rec.interimResults = true;
      finalText = ''; out.textContent = ''; running = true; msg.textContent = '正在聆听…';
      rec.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) finalText += e.results[i][0].transcript; else interim += e.results[i][0].transcript; } out.innerHTML = esc(finalText) + `<span style="color:var(--text-3)">${esc(interim)}</span>`; };
      rec.onerror = e => { msg.textContent = '识别失败：' + e.error; running = false; };
      rec.onend = () => { running = false; msg.textContent = '已停止'; };
      try { rec.start(); } catch (e) { msg.textContent = '启动失败：' + e.message; }
    };
    const stop = () => { if (rec) try { rec.stop(); } catch (e) {} running = false; };
    host.querySelector('#sttStart').onclick = start;
    host.querySelector('#sttStop').onclick = stop;
    host.querySelector('#sttCopy').onclick = () => T.copy(out.innerText);
    api.onCleanup(stop);
  }});

  /* ---------------- 敏感信息批量脱敏 ---------------- */
  R('敏感信息批量脱敏', { fields: [X('text', '待处理文本', '联系电话 13812345678，邮箱 test@example.com，身份证 440301199001011234，银行卡 6222021234567890123，IP 192.168.1.10。', { rows: 7 }),
      C('phone', '手机号', true, '手机号'), C('email', '邮箱', true, '邮箱'), C('id', '身份证号', true, '身份证'), C('bank', '银行卡号', true, '银行卡'), C('ip', 'IP 地址', true, 'IP')], live: true,
    run: v => {
      let s = String(v.text || ''), count = 0;
      const mask = (re, fn) => { s = s.replace(re, m => { count++; return fn(m); }); };
      if (v.phone) mask(/\b(1[3-9]\d)\d{4}(\d{4})\b/g, (m, a, b) => a + '****' + b);
      if (v.email) mask(/\b([\w.+-]{1,2})[\w.+-]*@([\w-]+\.[\w.-]+)\b/g, (m, a, b) => a + '***@' + b);
      if (v.id) mask(/\b(\d{6})\d{8}(\d{3}[\dXx])\b/g, (m, a, b) => a + '********' + b);
      if (v.bank) mask(/\b(\d{4})\d{8,11}(\d{4})\b/g, (m, a, b) => a + ' **** **** ' + b);
      if (v.ip) mask(/\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b/g, (m, a) => a + '.***');
      return [TXT(s, '脱敏结果', 'redacted.txt'), KV([['脱敏数量', count + ' 处'], ['原文字符', String(v.text || '').length], ['输出字符', s.length]], '处理信息'),
        { type: 'note', value: '规则基于常见格式，不能保证覆盖所有敏感信息；正式使用前请人工复核，重要材料建议用专业脱敏工具。' }];
    } });

  /* ---------------- 快捷键查询 ---------------- */
  R('快捷键查询', { render(host, api) {
    const DATA = [
      ['Windows', [['复制', 'Ctrl + C'], ['粘贴', 'Ctrl + V'], ['剪切', 'Ctrl + X'], ['撤销', 'Ctrl + Z'], ['重做', 'Ctrl + Y'], ['全选', 'Ctrl + A'], ['查找', 'Ctrl + F'], ['保存', 'Ctrl + S'], ['锁定屏幕', 'Win + L'], ['任务管理器', 'Ctrl + Shift + Esc'], ['切换窗口', 'Alt + Tab'], ['截图', 'Win + Shift + S']]],
      ['macOS', [['复制', '⌘ + C'], ['粘贴', '⌘ + V'], ['撤销', '⌘ + Z'], ['重做', '⌘ + Shift + Z'], ['全选', '⌘ + A'], ['查找', '⌘ + F'], ['保存', '⌘ + S'], ['切换应用', '⌘ + Tab'], ['截图', '⌘ + Shift + 4'], ['聚焦搜索', '⌘ + 空格']]],
      ['浏览器', [['新标签页', 'Ctrl/⌘ + T'], ['关闭标签页', 'Ctrl/⌘ + W'], ['重新打开关闭的标签', 'Ctrl/⌘ + Shift + T'], ['刷新', 'Ctrl/⌘ + R'], ['强制刷新', 'Ctrl/⌘ + Shift + R'], ['开发者工具', 'F12 / Ctrl/⌘ + Shift + I'], ['地址栏', 'Ctrl/⌘ + L'], ['页面查找', 'Ctrl/⌘ + F'], ['放大 / 缩小', 'Ctrl/⌘ + +/-'], ['恢复 100%', 'Ctrl/⌘ + 0']]],
      ['VS Code', [['命令面板', 'Ctrl/⌘ + Shift + P'], ['快速打开文件', 'Ctrl/⌘ + P'], ['全局搜索', 'Ctrl/⌘ + Shift + F'], ['终端', 'Ctrl + `'], ['注释', 'Ctrl/⌘ + /'], ['格式化文档', 'Shift + Alt + F'], ['多光标', 'Alt + 点击'], ['移动行', 'Alt + ↑/↓'], ['复制行', 'Shift + Alt + ↑/↓'], ['跳转定义', 'F12']]]
    ];
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><input id="kbs" type="text" placeholder="搜索快捷键，例如 复制、终端…" style="flex:1;min-width:200px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:9px"><span class="cp-note" id="kbsCount"></span></div><div id="kbsBody"></div></div>`;
    const input = host.querySelector('#kbs'), body = host.querySelector('#kbsBody'), count = host.querySelector('#kbsCount');
    const paint = () => {
      const q = input.value.trim().toLowerCase();
      let total = 0, html = '';
      DATA.forEach(([group, items]) => {
        const hit = items.filter(([name, key]) => !q || (name + ' ' + key).toLowerCase().includes(q));
        if (!hit.length) return;
        total += hit.length;
        html += `<div class="sys-card" style="margin-bottom:10px"><div class="sys-title">${esc(group)}</div><div class="kv-grid">${hit.map(([n, k]) => `<div class="kv-k">${esc(n)}</div><div class="kv-v" style="font-family:var(--font-mono);font-size:11px">${esc(k)}</div>`).join('')}</div></div>`;
      });
      body.innerHTML = html || '<div class="hint-empty">没有匹配的快捷键</div>';
      count.textContent = `共 ${total} 条`;
    };
    input.addEventListener('input', paint); paint();
  }});

  /* ---------------- 邮箱地址检测 ---------------- */
  R('邮箱地址检测', { fields: [X('text', '邮箱列表（每行一个）', 'test@example.com\nhello@gmail.com\ninvalid@\nname@company.cn', { rows: 7 }), C('mx', '同时查询 MX 记录（需联网）', false, '查询 MX')],
    runLabel: '开始检测',
    run: async v => {
      const list = [...new Set(String(v.text || '').split(/\n+/).map(s => s.trim()).filter(Boolean))];
      if (!list.length) throw new Error('请输入至少一个邮箱');
      const rows = [];
      for (const email of list) {
        const m = email.match(/^([^\s@]+)@([^\s@]+\.[^\s@]{2,})$/);
        let mx = '—';
        if (m && v.mx) {
          try {
            const res = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(m[2]) + '&type=MX');
            const data = await res.json();
            mx = data.Answer && data.Answer.length ? '有记录' : '未找到';
          } catch (e) { mx = '查询失败'; }
        }
        rows.push([email, m ? '格式正确' : '格式错误', m ? m[2] : '—', mx]);
      }
      return [{ type: 'table', title: '检测结果', head: ['邮箱', '格式', '域名', 'MX 记录'], rows },
        { type: 'note', value: '语法与 MX 检测不能证明邮箱真实存在；部分域名会隐藏 MX 记录。请勿用于群发或骚扰。' }];
    } });

  /* ---------------- CSS 代码速查 ---------------- */
  R('CSS 代码速查', { render(host, api) {
    const SNIPPETS = [
      ['居中（flex）', '.center {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}'],
      ['单行省略', '.truncate {\n  overflow: hidden;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}'],
      ['多行省略', '.clamp {\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}'],
      ['响应式网格', '.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));\n  gap: 16px;\n}'],
      ['粘性页头', '.header {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  backdrop-filter: blur(12px);\n}'],
      ['隐藏滚动条', '.scroll {\n  scrollbar-width: none;\n  -ms-overflow-style: none;\n}\n.scroll::-webkit-scrollbar { display: none; }'],
      ['固定比例', '.ratio {\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n}'],
      ['聚焦描边', ':focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}'],
      ['平滑滚动', 'html {\n  scroll-behavior: smooth;\n}'],
      ['卡片阴影', '.card {\n  box-shadow: 0 10px 30px rgba(0,0,0,.12);\n}'],
      ['移除按钮样式', '.reset {\n  border: 0;\n  background: none;\n  padding: 0;\n  font: inherit;\n  cursor: pointer;\n}'],
      ['文字描边', '.stroke {\n  -webkit-text-stroke: 1px #1b1c18;\n  color: transparent;\n}']
    ];
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><input id="cssq" type="text" placeholder="搜索 CSS 片段，例如 省略、网格…" style="flex:1;min-width:200px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:9px"><span class="cp-note" id="cssqCount"></span></div><div id="cssqBody"></div></div>`;
    const input = host.querySelector('#cssq'), body = host.querySelector('#cssqBody'), count = host.querySelector('#cssqCount');
    const paint = () => {
      const q = input.value.trim().toLowerCase();
      const list = SNIPPETS.filter(([n, c]) => !q || (n + ' ' + c).toLowerCase().includes(q));
      count.textContent = `共 ${list.length} 条`;
      body.innerHTML = list.map(([n, c], i) => `<div class="sys-card" style="margin-bottom:9px"><div class="sys-title">${esc(n)}</div><pre class="code-out" style="margin:0">${esc(c)}</pre><div class="cp-row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-copy="${i}">复制代码</button></div></div>`).join('') || '<div class="hint-empty">没有匹配的片段</div>';
      body.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => T.copy(list[+b.dataset.copy][1]));
    };
    input.addEventListener('input', paint); paint();
  }});

  /* ---------------- 网站在线编程 ---------------- */
  R('网站在线编程', { render(host, api) {
    const KEY = 'toolbox_playground_v1';
    const DEFAULT = {
      html: '<h1>你好，拾器</h1>\n<p>在左侧修改代码，点击运行查看效果。</p>\n<button id="btn">点我</button>',
      css: 'body { font-family: system-ui, sans-serif; padding: 28px; background: #f4f3ee; color: #1b1c18; }\nh1 { font-size: 28px; }\nbutton { padding: 9px 16px; border: 0; border-radius: 8px; background: #2d5c4d; color: #fff; }',
      js: 'document.getElementById("btn").onclick = () => alert("运行成功");'
    };
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    const val = k => typeof saved[k] === 'string' ? saved[k] : DEFAULT[k];
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="pgRun">运行</button><button class="btn btn-ghost" id="pgSave">保存</button><button class="btn btn-ghost" id="pgDownload">下载 HTML</button><button class="btn btn-ghost" id="pgReset">恢复示例</button><span class="cp-note" id="pgMsg">代码在沙箱 iframe 中运行，不会上传</span></div>
      <div class="pg-grid"><div><div class="cp-label">HTML</div><textarea id="pgHtml" class="pg-code">${esc(val('html'))}</textarea><div class="cp-label">CSS</div><textarea id="pgCss" class="pg-code">${esc(val('css'))}</textarea><div class="cp-label">JavaScript</div><textarea id="pgJs" class="pg-code">${esc(val('js'))}</textarea></div>
      <div class="cp-canvas-wrap" style="padding:0;overflow:hidden"><iframe id="pgFrame" sandbox="allow-scripts allow-modals allow-forms allow-popups" style="width:100%;height:560px;border:0;background:#fff"></iframe></div></div></div>`;
    const h = host.querySelector('#pgHtml'), c = host.querySelector('#pgCss'), j = host.querySelector('#pgJs'), frame = host.querySelector('#pgFrame'), msg = host.querySelector('#pgMsg');
    const build = () => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${c.value}</style></head><body>${h.value}<script>try{${j.value}}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="color:#b63a2e">'+e.message+'</pre>')}<\/script></body></html>`;
    const run = () => { frame.srcdoc = build(); msg.textContent = '已运行 · ' + new Date().toLocaleTimeString('zh-CN'); };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ html: h.value, css: c.value, js: j.value })); msg.textContent = '已保存到本机'; } catch (e) { msg.textContent = '保存失败'; } };
    host.querySelector('#pgRun').onclick = run;
    host.querySelector('#pgSave').onclick = save;
    host.querySelector('#pgDownload').onclick = () => T.save(new Blob([build()], { type: 'text/html;charset=utf-8' }), 'playground.html');
    host.querySelector('#pgReset').onclick = () => { h.value = DEFAULT.html; c.value = DEFAULT.css; j.value = DEFAULT.js; run(); };
    run();
  }});

  /* ---------------- 当前 IP 查询 ---------------- */
  R('当前 IP 查询', {
    steps: [
      '点击「查询公网 IP」，页面会依次尝试多个公共接口，任一返回有效 IP 即立刻展示。',
      '查询失败时看底部的「接口尝试记录」：每个接口的超时或 HTTP 错误都会写清楚，便于判断是网络问题还是插件拦截。',
      '「本机信息」不需要联网，包含时区、界面语言、屏幕与 UA，可单独复制使用。',
      '结果里的「在地图查看大致位置」会打开 OpenStreetMap，仅供参考，不是精确定位。'
    ],
    render(host, api) {
    const PROVIDERS = [
      { name: 'ipapi.co', url: 'https://ipapi.co/json/', map: d => ({ ip: d.ip, country: d.country_name, region: d.region, city: d.city, org: d.org, timezone: d.timezone, ll: d.latitude && d.longitude ? [d.latitude, d.longitude] : null }) },
      { name: 'ipwho.is', url: 'https://ipwho.is/', map: d => ({ ip: d.ip, country: d.country, region: d.region, city: d.city, org: (d.connection && (d.connection.isp || d.connection.org)) || '', timezone: (d.timezone && d.timezone.id) || '', ll: d.latitude != null && d.longitude != null ? [d.latitude, d.longitude] : null }) },
      { name: 'ipinfo.io', url: 'https://ipinfo.io/json', map: d => ({ ip: d.ip, country: d.country, region: d.region, city: d.city, org: d.org, timezone: d.timezone, ll: (d.loc || '').includes(',') ? d.loc.split(',').map(Number) : null }) },
      { name: 'api.ip.sb', url: 'https://api.ip.sb/geoip', map: d => ({ ip: d.ip, country: d.country, region: d.region, city: d.city, org: d.organization || d.isp, timezone: d.timezone, ll: null }) },
      { name: 'api.ipify.org', url: 'https://api.ipify.org?format=json', map: d => ({ ip: d.ip }) }
    ];
    const isIP = s => /^(\d{1,3}\.){3}\d{1,3}$/.test(s || '') || (/^[0-9a-f:]+$/i.test(s || '') && (s || '').includes(':'));

    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row">
        <button type="button" class="btn btn-primary" id="ipRun">查询公网 IP</button>
        <button type="button" class="btn btn-ghost" id="ipCopyIp">复制 IP</button>
        <button type="button" class="btn btn-ghost" id="ipCopyAll">复制全部信息</button>
        <span class="cp-note" id="ipMsg">需要联网 · 依次尝试多个公共接口</span>
      </div>
      <div id="ipBody" class="sys-grid"></div>
      <div id="ipLocal"></div>
      <div class="cp-row"><span class="cp-note" id="ipLog">尚未发起查询</span></div>
      <div class="note">公网 IP 与地理位置由第三方公共接口提供，定位为网络出口的大致位置，不等于你的实际地址。若浏览器插件、公司网络或运营商代理会隐藏真实出口 IP，查询结果可能不是本机。所有接口都在浏览器直接访问，本站不做转发。</div>
    </div>`;

    const body = host.querySelector('#ipBody');
    const localBox = host.querySelector('#ipLocal');
    const msg = host.querySelector('#ipMsg');
    const logEl = host.querySelector('#ipLog');
    let info = null, cord = null;

    const fmtTz = () => {
      const off = -new Date().getTimezoneOffset();
      const sign = off >= 0 ? '+' : '-';
      return 'UTC' + sign + String(Math.floor(Math.abs(off) / 60)).padStart(2, '0') + ':' + String(Math.abs(off) % 60).padStart(2, '0');
    };
    function renderLocal() {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
      const rows = [
        ['浏览器时区', Intl.DateTimeFormat().resolvedOptions().timeZone || '—'],
        ['UTC 偏移', fmtTz()],
        ['当前时间', new Date().toLocaleString('zh-CN', { hour12: false })],
        ['界面语言', navigator.language || '—'],
        ['联网状态', navigator.onLine ? '在线' : '离线'],
        ['网络类型', c.effectiveType ? c.effectiveType + (c.downlink ? ' · 约 ' + c.downlink + ' Mbps' : '') : '浏览器未提供'],
        ['屏幕', screen.width + ' × ' + screen.height + ' · DPR ' + (window.devicePixelRatio || 1)],
        ['User-Agent', navigator.userAgent]
      ];
      localBox.innerHTML = `<div class="sys-card"><div class="sys-title">本机信息 · 不需要联网</div><div class="kv-grid">${rows.map(([k, v]) => `<div class="kv-k">${T.esc(k)}</div><div class="kv-v" style="${k === 'User-Agent' ? 'font-size:10.5px;line-height:1.6' : ''}">${T.esc(v)}</div>`).join('')}</div></div>`;
    }

    function renderResult() {
      const d = info;
      const loc = [d.country, d.region, d.city].filter(Boolean).join(' · ') || '—';
      const mapLink = d.ll && isFinite(d.ll[0]) && isFinite(d.ll[1])
        ? `<a class="btn btn-ghost btn-sm" href="https://www.openstreetmap.org/?mlat=${d.ll[0]}&mlon=${d.ll[1]}#map=10/${d.ll[0]}/${d.ll[1]}" target="_blank" rel="noopener noreferrer">在地图查看大致位置</a>`
        : '';
      body.innerHTML = `
        <div class="sys-card ip-card-main">
          <div class="sys-title">公网 IP</div>
          <div class="ip-big">${T.esc(d.ip || '—')}</div>
          <div class="ip-meta">${T.esc(loc)}${d.org ? ' · ' + T.esc(d.org) : ''}</div>
          ${mapLink}
        </div>
        <div class="sys-card"><div class="sys-title">位置与网络</div><div class="kv-grid">
          <div class="kv-k">国家 / 地区</div><div class="kv-v">${T.esc(d.country || '—')}</div>
          <div class="kv-k">省 / 州</div><div class="kv-v">${T.esc(d.region || '—')}</div>
          <div class="kv-k">城市</div><div class="kv-v">${T.esc(d.city || '—')}</div>
          <div class="kv-k">网络服务商</div><div class="kv-v">${T.esc(d.org || '—')}</div>
          <div class="kv-k">时区</div><div class="kv-v">${T.esc(d.timezone || '—')}</div>
          <div class="kv-k">经纬度</div><div class="kv-v">${d.ll ? T.esc(d.ll.join(', ')) : '—'}</div>
        </div></div>`;
    }

    async function run() {
      msg.textContent = '查询中…';
      body.innerHTML = '<div class="hint-empty">正在依次尝试公共 IP 接口…</div>';
      const tried = [];
      cord = null;
      for (const p of PROVIDERS) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        try {
          const r = await fetch(p.url, { signal: ctrl.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const raw = await r.json();
          const d = p.map(raw);
          if (!d || !isIP(d.ip)) throw new Error('未返回有效 IP');
          info = d;
          tried.push(p.name + '：成功');
          logEl.textContent = '接口尝试记录 · ' + tried.join(' · ');
          renderResult();
          const full = !!(d.country || d.city || d.org);
          msg.textContent = full ? '查询完成 · 数据来自 ' + p.name : '仅取到 IP · 数据来自 ' + p.name;
          T.toast('查询完成');
          return;
        } catch (e) {
          tried.push(p.name + '：' + (e.name === 'AbortError' ? '超时' : (e.message || '失败')));
          logEl.textContent = '接口尝试记录 · ' + tried.join(' · ');
        } finally { clearTimeout(timer); }
      }
      msg.textContent = '查询失败';
      body.innerHTML = `<div class="note err"><b>所有公共接口都没有返回结果。</b><br>常见原因：浏览器插件（广告拦截 / 隐私保护）拦截了请求、公司或校园网络限制外网接口、当前页面通过 file:// 打开、或接口临时不可用。<br>可以尝试：换一个网络、暂时关闭拦截插件、或稍后重试。本机信息仍然可用。</div>`;
    }

    host.querySelector('#ipRun').onclick = run;
    host.querySelector('#ipCopyIp').onclick = () => { if (info && info.ip) T.copy(info.ip); else T.toast('还没有查询结果', 'err'); };
    host.querySelector('#ipCopyAll').onclick = () => {
      if (!info) return T.toast('还没有查询结果', 'err');
      const text = ['公网 IP：' + (info.ip || '—'), '位置：' + [info.country, info.region, info.city].filter(Boolean).join(' · '), '网络：' + (info.org || '—'), '时区：' + (info.timezone || '—')].join('\n');
      T.copy(text);
    };
    renderLocal();
    body.innerHTML = '<div class="hint-empty">点击「查询公网 IP」获取出口 IP 与大致位置。</div>';
  }});
})();
