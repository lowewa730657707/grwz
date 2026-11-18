/* ============================================================
   工具实现：生活、娱乐、健康与白板类工具
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const X = (key, label, def, extra) => Object.assign({ key, label, type: 'textarea', def, rows: 4 }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file' }, extra || {});
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const TXT = (value, title, download) => ({ type: 'text', value, title, download });
  const esc = T.esc;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad = T.pad;
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function hexToRgb(hex) {
    let h = String(hex || '').replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) h = '000000';
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const toHex = (r, g, b) => '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
  function rgbToHsl(hex) {
    let { r, g, b } = hexToRgb(hex); r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (d) { s = l > .5 ? d / (2 - max - min) : d / (max + min); if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
    return [h, s * 100, l * 100];
  }
  const normHex = h => { const { r, g, b } = hexToRgb(h); return toHex(r, g, b); };

  /* ---------------- 网站分享（平台可增删改） ---------------- */
  R('网站分享', {
    steps: [
      '上方填要分享的网址与标题，下方会实时生成各平台的官方分享入口。',
      '「分享平台」列表保存在本机：可以改名称与链接模板、开关、上下移动排序，也可以删除或新增。',
      '链接模板里用 {u} 代表网址、{t} 代表标题，例如 https://example.com/share?url={u}&text={t}。',
      '微信、QQ 不支持网页直接分享，请用「复制链接」后在应用内粘贴。'
    ],
    render(host, api) {
      const KEY = 'toolbox_share_platforms_v1';
      const DEFAULTS = [
        { id: 'weibo', name: '微博', tpl: 'https://service.weibo.com/share/share.php?url={u}&title={t}', color: '#e6162d', on: true },
        { id: 'qzone', name: 'QQ 空间', tpl: 'https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={u}&title={t}', color: '#2b7bd6', on: true },
        { id: 'douban', name: '豆瓣', tpl: 'https://www.douban.com/share/service?href={u}&name={t}', color: '#2f7a56', on: true },
        { id: 'x', name: 'X', tpl: 'https://twitter.com/intent/tweet?url={u}&text={t}', color: '#1b1c18', on: true },
        { id: 'facebook', name: 'Facebook', tpl: 'https://www.facebook.com/sharer/sharer.php?u={u}', color: '#1877f2', on: true },
        { id: 'telegram', name: 'Telegram', tpl: 'https://t.me/share/url?url={u}&text={t}', color: '#229ed9', on: true },
        { id: 'linkedin', name: 'LinkedIn', tpl: 'https://www.linkedin.com/sharing/share-offsite/?url={u}', color: '#0a66c2', on: true },
        { id: 'reddit', name: 'Reddit', tpl: 'https://www.reddit.com/submit?url={u}&title={t}', color: '#ff4500', on: true },
        { id: 'mail', name: '邮件', tpl: 'mailto:?subject={t}&body={u}', color: '#8a641f', on: true }
      ];
      const read = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
          if (Array.isArray(raw) && raw.length) return raw.filter(x => x && x.name && x.tpl);
        } catch (e) { /* noop */ }
        return DEFAULTS.slice();
      };
      const save = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* noop */ } };

      let list = read();
      let editing = null;

      host.innerHTML = `<div class="custom-pane">
        <div class="cp-row">
          <input id="shUrl" type="text" placeholder="要分享的网址" aria-label="要分享的网址" style="flex:2;min-width:200px">
          <input id="shTitle" type="text" placeholder="分享标题" aria-label="分享标题" style="flex:1;min-width:160px">
          <button type="button" class="btn btn-ghost" id="shCopy">复制链接</button>
        </div>
        <div id="shLinks" class="share-grid"></div>

        <div class="share-panel">
          <div class="share-panel-head">
            <b>分享平台</b>
            <span class="cp-note">共 <i id="shCount">0</i> 个 · 保存在本机</span>
            <div class="share-panel-actions">
              <button type="button" class="btn btn-ghost btn-sm" id="shRestore">恢复默认</button>
            </div>
          </div>
          <div id="shList" class="share-list"></div>
          <div class="share-form">
            <div class="share-form-title" id="shFormTitle">添加平台</div>
            <div class="cp-row">
              <input id="shName" type="text" placeholder="名称，如 小红书" style="flex:0 1 150px;min-width:120px">
              <input id="shTpl" type="text" placeholder="链接模板，用 {u} 表示网址、{t} 表示标题" style="flex:2;min-width:220px">
              <input id="shColor" type="color" value="#2d5c4d" title="标识色">
              <button type="button" class="btn btn-primary btn-sm" id="shSave">添加</button>
              <button type="button" class="btn btn-ghost btn-sm" id="shCancel" hidden>取消编辑</button>
            </div>
            <div class="cp-note" style="margin-top:6px">模板必须包含 <code>{u}</code>；标题可选。示例：<code>https://example.com/share?url={u}&amp;text={t}</code></div>
          </div>
        </div>

        <div class="note">分享入口会打开对应网站的官方页面；微信、QQ 不支持网页直接分享，复制链接后在应用内粘贴即可。平台配置只保存在你自己的浏览器。</div>
      </div>`;

      const urlIn = host.querySelector('#shUrl');
      const titleIn = host.querySelector('#shTitle');
      const grid = host.querySelector('#shLinks');
      const listBox = host.querySelector('#shList');
      const countEl = host.querySelector('#shCount');
      const formTitle = host.querySelector('#shFormTitle');
      const nameIn = host.querySelector('#shName');
      const tplIn = host.querySelector('#shTpl');
      const colorIn = host.querySelector('#shColor');
      const saveBtn = host.querySelector('#shSave');
      const cancelBtn = host.querySelector('#shCancel');
      urlIn.value = location.href;
      titleIn.value = document.title;

      const filled = (tpl, u, t) => String(tpl).replace(/\{u\}/g, u).replace(/\{t\}/g, t);

      function paintLinks() {
        const u = encodeURIComponent(urlIn.value || location.href);
        const t = encodeURIComponent(titleIn.value || document.title);
        const active = list.filter(p => p.on !== false);
        grid.innerHTML = active.map(p => {
          const href = filled(p.tpl, u, t);
          return `<a class="share-item" data-id="${esc(p.id)}" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><span class="share-dot" style="background:${esc(p.color || 'var(--accent)')}"></span><span>${esc(p.name)}</span></a>`;
        }).join('') + `<button type="button" class="share-item" id="shCopy2"><span class="share-dot" style="background:var(--accent)"></span><span>复制链接</span></button>`;
        grid.querySelector('#shCopy2').onclick = () => T.copy(urlIn.value || location.href);
        grid.querySelectorAll('.share-item[data-id]').forEach(a => {
          a.oncontextmenu = e => { e.preventDefault(); T.copy(filled(list.find(p => p.id === a.dataset.id).tpl, urlIn.value, titleIn.value)); };
        });
      }

      function paintList() {
        countEl.textContent = String(list.length);
        listBox.innerHTML = list.map((p, i) => `<div class="share-row${p.on === false ? ' is-off' : ''}">
          <span class="share-dot" style="background:${esc(p.color || 'var(--accent)')}"></span>
          <div class="share-row-main">
            <b>${esc(p.name)}</b>
            <span class="share-tpl">${esc(p.tpl)}</span>
          </div>
          <div class="share-row-ops">
            <button type="button" class="share-op" data-act="on" data-id="${esc(p.id)}" title="${p.on === false ? '启用' : '停用'}">${p.on === false ? '启用' : '停用'}</button>
            <button type="button" class="share-op" data-act="up" data-id="${esc(p.id)}" title="上移" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="share-op" data-act="down" data-id="${esc(p.id)}" title="下移" ${i === list.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="share-op" data-act="edit" data-id="${esc(p.id)}">编辑</button>
            <button type="button" class="share-op is-danger" data-act="del" data-id="${esc(p.id)}">删除</button>
          </div>
        </div>`).join('');
        listBox.querySelectorAll('[data-act]').forEach(b => {
          b.onclick = () => {
            const id = b.dataset.id;
            const idx = list.findIndex(x => x.id === id);
            if (idx < 0) return;
            const act = b.dataset.act;
            if (act === 'on') list[idx].on = list[idx].on === false;
            else if (act === 'up' && idx > 0) { const t = list[idx]; list[idx] = list[idx - 1]; list[idx - 1] = t; }
            else if (act === 'down' && idx < list.length - 1) { const t = list[idx]; list[idx] = list[idx + 1]; list[idx + 1] = t; }
            else if (act === 'del') { if (!confirm('删除「' + list[idx].name + '」？')) return; list.splice(idx, 1); }
            else if (act === 'edit') {
              editing = id;
              formTitle.textContent = '编辑平台';
              nameIn.value = list[idx].name;
              tplIn.value = list[idx].tpl;
              colorIn.value = /^#[0-9a-f]{6}$/i.test(list[idx].color || '') ? list[idx].color : '#2d5c4d';
              saveBtn.textContent = '保存修改';
              cancelBtn.hidden = false;
              nameIn.focus();
              return;
            }
            save(list); paintList(); paintLinks();
          };
        });
      }

      function resetForm() {
        editing = null;
        formTitle.textContent = '添加平台';
        nameIn.value = ''; tplIn.value = ''; colorIn.value = '#2d5c4d';
        saveBtn.textContent = '添加';
        cancelBtn.hidden = true;
      }

      saveBtn.onclick = () => {
        const name = nameIn.value.trim();
        const tpl = tplIn.value.trim();
        if (!name) return T.toast('请填写平台名称', 'err');
        if (!tpl || tpl.indexOf('{u}') < 0) return T.toast('链接模板必须包含 {u}', 'err');
        if (!/^https?:|^mailto:/i.test(tpl)) return T.toast('模板需要以 http(s):// 或 mailto: 开头', 'err');
        if (editing) {
          const p = list.find(x => x.id === editing);
          if (p) { p.name = name; p.tpl = tpl; p.color = colorIn.value; }
          T.toast('已保存修改');
        } else {
          const id = 'c' + Date.now().toString(36);
          list.push({ id, name, tpl, color: colorIn.value, on: true });
          T.toast('已添加「' + name + '」');
        }
        save(list); resetForm(); paintList(); paintLinks();
      };
      cancelBtn.onclick = resetForm;
      host.querySelector('#shRestore').onclick = () => {
        if (!confirm('恢复默认平台列表？自定义的平台会被移除。')) return;
        list = DEFAULTS.map(x => Object.assign({}, x));
        save(list); resetForm(); paintList(); paintLinks();
        T.toast('已恢复默认平台');
      };
      urlIn.addEventListener('input', paintLinks);
      titleIn.addEventListener('input', paintLinks);
      host.querySelector('#shCopy').onclick = () => T.copy(urlIn.value || location.href);

      paintList(); paintLinks();
    }
  });

  /* ---------------- 在线白板 ---------------- */
  R('在线白板', {
    steps: [
      '先用上方色板或取色器选颜色，拖动滑块调笔刷粗细；「橡皮」按笔刷三倍宽度擦除。',
      'Ctrl / ⌘ + Z 撤销，同时按 Shift 重做；「清空」前会自动存一次快照，仍然可以撤销回来。',
      '点「全屏画板」或按 F 进入全屏，Esc 退出；全屏下笔迹会按画布坐标换算，不会画偏。',
      '画完点「保存 PNG」导出白底图片，深色主题下导出的也是白底。'
    ],
    render(host, api) {
    const COLORS = ['#1b1c18', '#2d5c4d', '#3f76a8', '#b03a2e', '#c0863a', '#6f5bb5', '#2f9a8f'];
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row wb-tools">
        <div class="wb-swatches" id="wbColors">${COLORS.map((c, i) => `<button type="button" class="wb-swatch${i === 1 ? ' is-on' : ''}" data-c="${c}" style="background:${c}" title="${c}" aria-label="画笔颜色 ${c}"></button>`).join('')}<input type="color" id="wbColor" value="#2d5c4d" title="自定义颜色"></div>
        <input type="range" id="wbSize" min="1" max="40" value="3" style="width:110px" title="笔刷粗细">
        <span class="cp-label" id="wbSizeLabel">3 px</span>
        <button type="button" class="btn btn-primary btn-sm" id="wbPen">画笔</button>
        <button type="button" class="btn btn-ghost btn-sm" id="wbEraser">橡皮</button>
        <button type="button" class="btn btn-ghost btn-sm" id="wbUndo">撤销</button>
        <button type="button" class="btn btn-ghost btn-sm" id="wbRedo">重做</button>
        <button type="button" class="btn btn-ghost btn-sm" id="wbClear">清空</button>
        <button type="button" class="btn btn-ghost btn-sm" id="wbFull">全屏画板</button>
        <button type="button" class="btn btn-ghost btn-sm" id="wbSave">保存 PNG</button>
      </div>
      <div class="wb-stage" id="wbStage">
        <canvas id="wbCv" width="1400" height="800"></canvas>
        <div class="wb-hint" id="wbHint">按 F 或点「全屏画板」进入全屏 · Esc 退出全屏 · Ctrl / ⌘ + Z 撤销</div>
      </div>
      <div class="cp-row"><span class="cp-note">画布 1400 × 800，全屏后按窗口等比铺满，笔迹会按屏幕坐标换算，不会画偏。导出为白底 PNG。</span></div>
    </div>`;

    const cv = host.querySelector('#wbCv'), cx = cv.getContext('2d');
    const stage = host.querySelector('#wbStage'), hint = host.querySelector('#wbHint');
    const color = host.querySelector('#wbColor'), size = host.querySelector('#wbSize'), sizeLabel = host.querySelector('#wbSizeLabel');
    const penBtn = host.querySelector('#wbPen'), eraserBtn = host.querySelector('#wbEraser');
    const undoBtn = host.querySelector('#wbUndo'), redoBtn = host.querySelector('#wbRedo');

    cx.lineCap = 'round'; cx.lineJoin = 'round';
    let drawing = false, eraser = false, last = null;
    let stack = [], idx = -1;
    let lastDraw = null;

    const blank = () => { cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); };
    const snap = () => {
      stack = stack.slice(0, idx + 1);
      stack.push(cv.toDataURL('image/png'));
      if (stack.length > 40) stack.shift();
      idx = stack.length - 1;
      syncBtns();
    };
    const apply = i => {
      if (i < 0 || i >= stack.length) return;
      idx = i;
      const img = new Image();
      img.onload = () => { cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0); };
      img.src = stack[i];
      syncBtns();
    };
    const syncBtns = () => {
      undoBtn.disabled = idx <= 0;
      redoBtn.disabled = idx >= stack.length - 1;
    };
    const setTool = on => {
      eraser = !on;
      penBtn.className = 'btn btn-sm ' + (eraser ? 'btn-ghost' : 'btn-primary');
      eraserBtn.className = 'btn btn-sm ' + (eraser ? 'btn-primary' : 'btn-ghost');
      cv.style.cursor = eraser ? 'cell' : 'crosshair';
    };
    const pos = e => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height };
    };
    const begin = e => {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      drawing = true; last = pos(e);
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      lastDraw = null;
    };
    const move = e => {
      if (!drawing) return;
      const p = pos(e);
      cx.strokeStyle = eraser ? '#ffffff' : color.value;
      cx.lineWidth = eraser ? Math.max(12, +size.value * 3) : +size.value;
      cx.beginPath(); cx.moveTo(last.x, last.y); cx.lineTo(p.x, p.y); cx.stroke();
      last = p; lastDraw = p;
      if (stage.classList.contains('is-drawing') === false) stage.classList.add('is-drawing');
    };
    const end = () => {
      if (!drawing) return;
      drawing = false; last = null;
      stage.classList.remove('is-drawing');
      snap();
    };
    cv.addEventListener('pointerdown', begin);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', e => { if (drawing) end(); });

    host.querySelectorAll('.wb-swatch').forEach(b => b.onclick = () => {
      color.value = b.dataset.c;
      host.querySelectorAll('.wb-swatch').forEach(x => x.classList.toggle('is-on', x === b));
      setTool(true);
    });
    color.addEventListener('input', () => {
      host.querySelectorAll('.wb-swatch').forEach(x => x.classList.toggle('is-on', x.dataset.c === color.value));
      setTool(true);
    });
    size.addEventListener('input', () => sizeLabel.textContent = size.value + ' px');
    penBtn.onclick = () => setTool(true);
    eraserBtn.onclick = () => setTool(false);
    undoBtn.onclick = () => { if (idx > 0) apply(idx - 1); else T.toast('没有可撤销的操作', 'err'); };
    redoBtn.onclick = () => { if (idx < stack.length - 1) apply(idx + 1); else T.toast('没有可重做的操作', 'err'); };
    host.querySelector('#wbClear').onclick = () => { blank(); snap(); T.toast('已清空画板'); };
    host.querySelector('#wbSave').onclick = () => T.save(cv.toDataURL('image/png'), '白板_' + new Date().toISOString().slice(0, 10) + '.png');

    /* 全屏 */
    const fsBtn = host.querySelector('#wbFull');
    const syncFs = () => {
      const on = document.fullscreenElement === stage;
      fsBtn.textContent = on ? '退出全屏' : '全屏画板';
      fsBtn.classList.toggle('btn-primary', on);
      fsBtn.classList.toggle('btn-ghost', !on);
      hint.textContent = on ? 'Esc 退出全屏 · 笔迹按屏幕坐标换算' : '按 F 或点「全屏画板」进入全屏 · Esc 退出全屏 · Ctrl / ⌘ + Z 撤销';
      if (on) setTimeout(() => { try { cv.focus(); } catch (e) {} }, 60);
    };
    const toggleFs = () => {
      if (document.fullscreenElement === stage) { document.exitFullscreen().catch(() => {}); return; }
      if (stage.requestFullscreen) {
        stage.requestFullscreen().then(syncFs).catch(() => T.toast('浏览器拒绝了全屏请求，可直接使用页面内画板', 'err'));
      } else {
        stage.classList.toggle('is-expanded');
        syncFs();
        T.toast('当前浏览器不支持全屏 API，已切换为大画板');
      }
    };
    fsBtn.onclick = toggleFs;
    document.addEventListener('fullscreenchange', syncFs);

    /* 快捷键：Ctrl/⌘+Z 撤销、Shift 重做、F 全屏（输入框内不拦截） */
    const onKey = e => {
      if (!host.isConnected) { document.removeEventListener('keydown', onKey); return; }
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redoBtn.click(); else undoBtn.click(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redoBtn.click(); }
      else if (!mod && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); toggleFs(); }
    };
    document.addEventListener('keydown', onKey);

    blank(); snap(); setTool(true); syncFs();
    api.onCleanup(() => {
      document.removeEventListener('fullscreenchange', syncFs);
      document.removeEventListener('keydown', onKey);
      if (document.fullscreenElement === stage) { document.exitFullscreen().catch(() => {}); }
    });
  }});

  /* ---------------- 手持弹幕 LED ---------------- */
  R('手持弹幕LED', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><input id="ledText" type="text" value="内容只在本地处理 · 拾器 ToolBox" style="flex:1;min-width:200px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:9px"><input id="ledSpeed" type="range" min="3" max="20" value="9" style="width:100px"><span class="cp-label" id="ledSpeedLabel">9 秒/轮</span></div>
      <div class="cp-row"><input type="color" id="ledColor" value="#fdfdf8" style="width:42px;height:34px;padding:2px;border:1px solid var(--line);border-radius:7px;background:var(--surface-2)"><input type="color" id="ledBg" value="#1b1c18" style="width:42px;height:34px;padding:2px;border:1px solid var(--line);border-radius:7px;background:var(--surface-2)"><input type="range" id="ledSize" min="24" max="180" value="84" style="width:120px"><span class="cp-label" id="ledSizeLabel">84 px</span><button class="btn btn-primary" id="ledGo">全屏播放</button></div>
      <div class="note">进入全屏后文字会横向滚动；点击屏幕或按 Esc 退出。适合手机当作临时 LED 牌使用。</div></div>`;
    const text = host.querySelector('#ledText'), speed = host.querySelector('#ledSpeed'), color = host.querySelector('#ledColor'), bg = host.querySelector('#ledBg'), size = host.querySelector('#ledSize'), speedLabel = host.querySelector('#ledSpeedLabel'), sizeLabel = host.querySelector('#ledSizeLabel');
    let overlay = null, onKey = null;
    const close = () => { if (onKey) { document.removeEventListener('keydown', onKey); onKey = null; } if (overlay) { overlay.remove(); overlay = null; } try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} };
    speed.addEventListener('input', () => speedLabel.textContent = speed.value + ' 秒/轮');
    size.addEventListener('input', () => sizeLabel.textContent = size.value + ' px');
    host.querySelector('#ledGo').onclick = () => {
      close();
      overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;inset:0;z-index:99999;background:${bg.value};display:flex;align-items:center;overflow:hidden;cursor:pointer`;
      const inner = document.createElement('div');
      inner.textContent = text.value || '拾器 ToolBox';
      inner.style.cssText = `white-space:nowrap;color:${color.value};font-size:${size.value}px;font-weight:800;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;animation:ds-led ${speed.value}s linear infinite;padding-left:100vw`;
      overlay.appendChild(inner);
      overlay.addEventListener('click', close);
      onKey = e => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
    };
    api.onCleanup(close);
  }});

  /* ---------------- 今日运势 ---------------- */
  R('今日运势', { fields: [I('name', '昵称（可留空）', ''), S('focus', '关注方向', [['all', '综合'], ['work', '事业'], ['money', '财运'], ['love', '感情'], ['health', '健康']], 'all')], live: true,
    run: v => {
      const now = new Date();
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const seed = [...(date + (v.name || '匿名'))].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const pickN = (arr, n) => arr[n % arr.length];
      const scores = ['事业', '财运', '健康', '感情'].map((k, i) => [k, 55 + ((seed >> (i * 3)) % 40)]);
      const luckyColor = pickN(['松绿', '赭石', '琥珀', '雾蓝', '墨黑', '米白'], seed);
      const luckyNum = (seed % 9) + 1;
      const advice = pickN(['先做最重要的一件事，其余顺延。', '适合整理旧资料，把未完成的收尾。', '沟通前先确认对方的需求，少说多听。', '给计划留出缓冲时间，避免排得过满。', '今天适合小额尝试，不宜做重大决定。'], seed >> 2);
      return [
        { type: 'html', title: '今日运势参考', value: `<div style="padding:8px 0">${scores.map(([k, n]) => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px"><span style="width:44px;font-size:12px;color:var(--text-2)">${k}</span><div style="flex:1;height:7px;background:var(--surface-3);border-radius:5px;overflow:hidden"><div style="height:100%;width:${n}%;background:var(--accent)"></div></div><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-3)">${n}</span></div>`).join('')}</div>` },
        KV([['日期', date], ['幸运色', luckyColor], ['幸运数字', luckyNum], ['建议', advice]], '今日关键词'),
        { type: 'note', value: '运势内容由日期与昵称本地生成，仅供娱乐，不构成任何决策建议。' }
      ];
    } });

  /* ---------------- 十二星座查询 ---------------- */
  R('十二星座查询', { fields: [I('date', '出生日期', '1995-06-15', { type: 'date' })], live: true,
    run: v => {
      const d = new Date(String(v.date).replace(/-/g, '/'));
      if (isNaN(d.getTime())) throw new Error('请输入有效日期');
      const md = (d.getMonth() + 1) * 100 + d.getDate();
      const SIGNS = [
        ['摩羯座', 1222, 119, '土', '务实、耐心、责任感强'], ['水瓶座', 120, 218, '风', '独立、理性、想法多'], ['双鱼座', 219, 320, '水', '敏感、共情、想象力强'],
        ['白羊座', 321, 419, '火', '直接、行动力强、爱挑战'], ['金牛座', 420, 520, '土', '稳定、重视质感、慢热'], ['双子座', 521, 621, '风', '好奇、灵活、表达力强'],
        ['巨蟹座', 622, 722, '水', '重感情、保护欲强、念旧'], ['狮子座', 723, 822, '火', '自信、慷慨、需要舞台'], ['处女座', 823, 922, '土', '细致、严谨、追求秩序'],
        ['天秤座', 923, 1023, '风', '重视平衡、审美与关系'], ['天蝎座', 1024, 1122, '水', '专注、深刻、掌控力强'], ['射手座', 1123, 1221, '火', '乐观、自由、爱探索']
      ];
      let sign = SIGNS[0];
      for (const s of SIGNS) { const start = s[1], end = s[2]; const inRange = start < end ? md >= start && md <= end : md >= start || md <= end; if (inRange) { sign = s; break; } }
      const mdText = n => { const s = String(n).padStart(4, '0'); return s.slice(0, 2) + '.' + s.slice(2); };
      return [
        KV([['出生日期', String(v.date)], ['星座', sign[0]], ['元素', sign[3] + '象星座'], ['性格关键词', sign[4]], ['日期范围', `${mdText(sign[1])} - ${mdText(sign[2])}`]], '星座结果'),
        { type: 'table', title: '十二星座日期表', head: ['星座', '开始', '结束', '元素'], rows: SIGNS.map(s => [s[0], mdText(s[1]), mdText(s[2]), s[3]]) },
        { type: 'note', value: '星座按公历日期计算，边界日期以当年实际节气与占星体系为准；内容仅供娱乐。' }
      ];
    } });

  /* ---------------- 农历生日计算 ---------------- */
  R('农历生日计算', { fields: [I('birth', '公历出生日期', '1995-06-15', { type: 'date' }), C('next', '显示下次农历生日倒计时', true, '显示倒计时')], live: true,
    run: v => {
      if (!window.Solar || !window.Lunar) throw new Error('农历组件未加载');
      const d = new Date(String(v.birth).replace(/-/g, '/'));
      if (isNaN(d.getTime())) throw new Error('请输入有效日期');
      const solar = window.Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const lunar = solar.getLunar();
      const lm = lunar.getMonth(), ld = lunar.getDay();
      const now = new Date(); now.setHours(0, 0, 0, 0);
      let next = null, days = null;
      if (v.next) {
        for (let y = now.getFullYear(); y <= now.getFullYear() + 2; y++) {
          try { const s = window.Lunar.fromYmd(y, Math.abs(lm), ld).getSolar(); const dt = new Date(s.getYear(), s.getMonth() - 1, s.getDay()); dt.setHours(0, 0, 0, 0); if (dt >= now) { next = dt; days = Math.ceil((dt - now) / 86400000); break; } } catch (e) {}
        }
      }
      return [
        KV([['公历', `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`], ['农历', `${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`], ['生肖', lunar.getYearShengXiao()], ['干支', lunar.getYearInGanZhi() + '年'], ['下次农历生日', next ? next.toLocaleDateString('zh-CN') : '—'], ['还有', days != null ? days + ' 天' : '—']], '农历生日'),
        { type: 'note', value: '农历生日按非闰月换算；若出生在闰月，请以当年历法为准。倒计时按今天的公历日期计算。' }
      ];
    } });

  /* ---------------- 五行八卦计算 ---------------- */
  R('五行八卦计算', { fields: [I('date', '出生日期', '1995-06-15', { type: 'date' }), I('time', '出生时间', '08:30', { type: 'time' }), S('gender', '性别', [['m', '男'], ['f', '女']], 'm')], live: true,
    run: v => {
      if (!window.Lunar) throw new Error('农历组件未加载');
      const d = new Date(String(v.date).replace(/-/g, '/')), [hh, mm] = String(v.time || '08:00').split(':').map(Number);
      if (isNaN(d.getTime())) throw new Error('请输入有效日期');
      const lunar = window.Lunar.fromDate(new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh || 0, mm || 0, 0));
      const gz = [lunar.getYearInGanZhi(), lunar.getMonthInGanZhi(), lunar.getDayInGanZhi(), lunar.getTimeInGanZhi()];
      const wx = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水', 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
      const count = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
      gz.join('').split('').forEach(c => { if (wx[c]) count[wx[c]]++; });
      const year = d.getFullYear();
      const yy = ((year % 100) - 4 + 100) % 100;
      let guaNum = v.gender === 'm' ? (100 - yy) % 9 : (yy - 4 + 9) % 9;
      if (guaNum === 0) guaNum = 9;
      if (guaNum === 5) guaNum = v.gender === 'm' ? 2 : 8;
      const GUAS = { 1: ['坎', '水', '北'], 2: ['坤', '土', '西南'], 3: ['震', '木', '东'], 4: ['巽', '木', '东南'], 6: ['乾', '金', '西北'], 7: ['兑', '金', '西'], 8: ['艮', '土', '东北'], 9: ['离', '火', '南'] };
      const gua = GUAS[guaNum] || ['—', '—', '—'];
      return [
        KV([['公历', `${v.date} ${v.time}`], ['农历', lunar.toString()], ['四柱', gz.join(' ') ], ['生肖', lunar.getYearShengXiao()], ['命卦', gua[0] + '卦（' + gua[1] + '·' + gua[2] + '）'], ['五行分布', Object.keys(count).map(k => k + count[k]).join('　')]], '五行八卦参考'),
        { type: 'table', title: '五行计数', head: ['五行', '数量', '说明'], rows: Object.entries(count).map(([k, n]) => [k, n, n === 0 ? '偏缺' : n >= 3 ? '偏旺' : '适中']) },
        { type: 'note', value: '命卦按八宅法以出生年份与性别推算，五行按四柱天干地支粗算；内容属传统民俗，仅供娱乐参考。' }
      ];
    } });

  /* ---------------- 二十四节气查询 ---------------- */
  R('二十四节气查询', { fields: [N('year', '年份', new Date().getFullYear(), { min: 1900, max: 2100, step: 1 })], live: true,
    run: v => {
      if (!window.Solar) throw new Error('农历组件未加载');
      const y = Math.round(clamp(Number(v.year) || new Date().getFullYear(), 1900, 2100));
      const list = [];
      const seen = new Set();
      for (let m = 1; m <= 12; m++) {
        for (let d = 1; d <= 31; d++) {
          try {
            const solar = window.Solar.fromYmd(y, m, d), lunar = solar.getLunar(), jq = lunar.getJieQi();
            if (jq && !seen.has(jq)) { seen.add(jq); list.push([jq, `${y}-${pad(m)}-${pad(d)}`]); }
          } catch (e) {}
        }
      }
      return [
        { type: 'table', title: `${y} 年二十四节气`, head: ['节气', '日期'], rows: list },
        TXT(list.map(x => `${x[0]} ${x[1]}`).join('\n'), '节气列表', `jieqi-${y}.txt`),
        { type: 'note', value: '节气日期按北京时间计算，不同年份可能相差一天；以中国科学院紫金山天文台发布为准。' }
      ];
    } });

  /* ---------------- 血型遗传规律 ---------------- */
  R('血型遗传规律', { fields: [S('father', '父亲血型', [['A', 'A 型'], ['B', 'B 型'], ['AB', 'AB 型'], ['O', 'O 型']], 'A'), S('mother', '母亲血型', [['A', 'A 型'], ['B', 'B 型'], ['AB', 'AB 型'], ['O', 'O 型']], 'B')], live: true,
    run: v => {
      const alleles = { A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B'], O: ['O', 'O'] };
      const fa = alleles[v.father], mo = alleles[v.mother];
      const count = { A: 0, B: 0, AB: 0, O: 0 };
      fa.forEach(a => mo.forEach(b => { const set = [a, b].sort().join(''); if (set === 'AA' || set === 'AO') count.A++; else if (set === 'BB' || set === 'BO') count.B++; else if (set === 'AB') count.AB++; else count.O++; }));
      const total = 4;
      return [
        { type: 'table', title: '子女可能血型与概率', head: ['血型', '概率'], rows: Object.entries(count).filter(([, n]) => n).map(([k, n]) => [k + ' 型', Math.round(n / total * 100) + '%']) },
        KV([['父亲', v.father + ' 型'], ['母亲', v.mother + ' 型'], ['可能血型', Object.entries(count).filter(([, n]) => n).map(([k]) => k).join(' / ')]], '遗传结果'),
        { type: 'note', value: '这里只考虑 ABO 系统最常见的等位基因组合，不含 Rh 因子与罕见变异；结果不能用于亲子鉴定，具体请以医学检验为准。' }
      ];
    } });

  /* ---------------- BMI 与基础代谢 ---------------- */
  R('BMI与基础代谢', { fields: [S('gender', '性别', [['m', '男'], ['f', '女']], 'm'), N('age', '年龄', 28, { min: 10, max: 100, step: 1 }), N('height', '身高（cm）', 170, { min: 80, max: 250, step: 1 }), N('weight', '体重（kg）', 65, { min: 20, max: 300, step: .1 }), S('activity', '活动水平', [['1.2', '久坐少运动'], ['1.375', '轻度运动'], ['1.55', '中度运动'], ['1.725', '高强度运动'], ['1.9', '专业训练']], '1.375')], live: true,
    run: v => {
      const h = (Number(v.height) || 0) / 100, w = Number(v.weight) || 0;
      if (h <= 0 || w <= 0) throw new Error('请输入有效身高与体重');
      const bmi = w / (h * h), bmr = v.gender === 'm' ? 10 * w + 6.25 * (Number(v.height) || 0) - 5 * (Number(v.age) || 25) + 5 : 10 * w + 6.25 * (Number(v.height) || 0) - 5 * (Number(v.age) || 25) - 161;
      const tdee = bmr * (Number(v.activity) || 1.375);
      const level = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
      return [
        KV([['BMI', T.fmt(bmi, 2)], ['体重评价', level], ['基础代谢 BMR', T.fmt(bmr, 0) + ' kcal/天'], ['每日总消耗 TDEE', T.fmt(tdee, 0) + ' kcal/天'], ['健康体重范围', T.fmt(18.5 * h * h, 1) + ' ~ ' + T.fmt(23.9 * h * h, 1) + ' kg'], ['建议', bmi < 18.5 ? '适当增加能量与蛋白质摄入' : bmi > 23.9 ? '控制精制碳水与油脂，增加活动量' : '保持在当前范围，注意力量训练']], '计算结果'),
        { type: 'note', value: 'BMI 采用中国成人标准；BMR 使用 Mifflin-St Jeor 公式，TDEE 为估算值。孕妇、运动员、儿童不适用。' }
      ];
    } });

  /* ---------------- 视力在线检查（交互版） ---------------- */
  R('视力在线检查', {
    steps: [
      '端坐并保持约 3 米观看距离，把页面缩放到 100%，然后点「开始检查」。',
      '屏幕中央会出现开口方向随机的「E」，按你看到的方向点下方四个方向按钮；看不清就点「看不清」。',
      '每答一题字号会变小，共 10 题；右上角进度条与答对数会实时更新。',
      '结束后给出答对数与粗略视力参考值，可点「重新开始」再测一次。'
    ],
    render(host, api) {
      host.innerHTML = `<div class="custom-pane">
        <div class="cp-row">
          <button type="button" class="btn btn-primary" id="eyeStart">开始检查</button>
          <button type="button" class="btn btn-ghost" id="eyeAgain">重新开始</button>
          <span class="cp-label">进度 <b id="eyeRound">0</b> / 10</span>
          <span class="cp-note" id="eyeMsg">点击「开始检查」，按 E 的开口方向作答</span>
        </div>
        <div class="eye-stage">
          <div class="eye-target" id="eyeE">E</div>
          <div class="eye-progress"><i id="eyeBar"></i></div>
        </div>
        <div class="cp-row" style="justify-content:center">
          <button type="button" class="btn btn-ghost" data-eye="up">上</button>
          <button type="button" class="btn btn-ghost" data-eye="right">右</button>
          <button type="button" class="btn btn-ghost" data-eye="down">下</button>
          <button type="button" class="btn btn-ghost" data-eye="left">左</button>
          <button type="button" class="btn btn-ghost" data-eye="skip">看不清</button>
        </div>
        <div id="eyeResult"></div>
        <div class="note">屏幕尺寸、观看距离、环境亮度与页面缩放都会影响结果，本工具只做粗略自测，不能替代专业视力检查。若长期看不清，请到正规医疗机构验光。</div>
      </div>`;

      const E = host.querySelector('#eyeE');
      const msg = host.querySelector('#eyeMsg');
      const roundEl = host.querySelector('#eyeRound');
      const bar = host.querySelector('#eyeBar');
      const result = host.querySelector('#eyeResult');
      const startBtn = host.querySelector('#eyeStart');
      const againBtn = host.querySelector('#eyeAgain');
      const DIRS = ['up', 'right', 'down', 'left'];
      const ROT = { up: 0, right: 90, down: 180, left: 270 };
      const NAME = { up: '上', right: '右', down: '下', left: '左' };
      let round = 0, correct = 0, current = 'up', active = false, size = 160, log = [];

      const paint = () => {
        E.style.fontSize = Math.round(size) + 'px';
        E.style.transform = 'rotate(' + ROT[current] + 'deg)';
      };
      const setProgress = () => {
        roundEl.textContent = String(round);
        bar.style.width = (round / 10 * 100) + '%';
      };
      const next = () => {
        current = DIRS[Math.floor(Math.random() * 4)];
        size = Math.max(26, 168 * Math.pow(0.82, round));
        paint();
        setProgress();
      };
      const finish = () => {
        active = false;
        setProgress();
        const pct = Math.round(correct / 10 * 100);
        const acuity = (0.1 * Math.pow(2, correct / 2.5)).toFixed(1);
        let level = '粗略参考 ' + acuity;
        let advice = '';
        if (correct >= 9) advice = '在本次设置下辨识度很好，日常用眼注意每 40 分钟远眺一次。';
        else if (correct >= 7) advice = '接近正常范围，仍建议定期检查；若看远处经常模糊请验光。';
        else if (correct >= 4) advice = '可能是观看距离、屏幕或光线影响，也可能是屈光问题，建议到专业机构验光。';
        else advice = '辨识度偏低，请先确认距离与页面缩放；若多次结果一致，建议尽快做专业视力检查。';
        E.style.transform = 'none';
        E.style.fontSize = '64px';
        E.textContent = '✓';
        result.innerHTML = `<div class="sys-card" style="margin-top:4px">
          <div class="sys-title">本次结果</div>
          <div class="eye-result-grid">
            <div><span>答对</span><b>${correct} / 10</b></div>
            <div><span>正确率</span><b>${pct}%</b></div>
            <div><span>粗略视力</span><b>${acuity}</b></div>
          </div>
          <div class="cp-note" style="margin-top:8px;line-height:1.8">${esc(advice)}</div>
          <div class="cp-row" style="margin-top:10px"><button type="button" class="btn btn-primary btn-sm" id="eyeRetry">再测一次</button><button type="button" class="btn btn-ghost btn-sm" id="eyeCopy">复制结果</button></div>
        </div>`;
        result.querySelector('#eyeRetry').onclick = start;
        result.querySelector('#eyeCopy').onclick = () => T.copy('视力自测：答对 ' + correct + '/10，正确率 ' + pct + '%，粗略参考 ' + acuity + '（屏幕自测，仅供参考）');
        msg.textContent = '检查完成';
        T.toast('检查完成 · 答对 ' + correct + '/10');
      };
      function start() {
        round = 0; correct = 0; log = []; active = true;
        result.innerHTML = '';
        E.textContent = 'E';
        next();
        msg.textContent = '请按 E 的开口方向作答';
      }
      const answer = dir => {
        if (!active) return;
        const ok = dir === current;
        log.push({ dir, current, ok });
        if (ok) correct++;
        round++;
        if (round >= 10) { finish(); return; }
        next();
        msg.textContent = ok ? '答对了 · 继续' : '方向不对 · 已记录，继续下一题';
      };
      startBtn.onclick = start;
      againBtn.onclick = start;
      host.querySelectorAll('[data-eye]').forEach(b => {
        b.onclick = () => {
          if (!active) { T.toast('先点「开始检查」', 'err'); return; }
          answer(b.dataset.eye === 'skip' ? 'skip' : b.dataset.eye);
        };
      });
      E.style.transform = 'none';
      E.style.fontSize = '120px';
      E.style.opacity = '.25';
      setProgress();
    }
  });

  /* ---------------- 颜色色卡色号 ---------------- */
  R('颜色色卡色号', { fields: [I('color', '选择颜色', '#2d5c4d', { type: 'color' }), N('shades', '明度色阶数量', 7, { min: 3, max: 11, step: 1 })], live: true,
    run: v => {
      const hex = normHex(v.color), { r, g, b } = hexToRgb(hex), [h, s, l] = rgbToHsl(hex);
      const cmyk = (() => { const rr = r / 255, gg = g / 255, bb = b / 255; const k = 1 - Math.max(rr, gg, bb); const d = 1 - k || 1; return [Math.round((1 - rr - k) / d * 100), Math.round((1 - gg - k) / d * 100), Math.round((1 - bb - k) / d * 100), Math.round(k * 100)]; })();
      const hsv = (() => { const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; const vv = max / 255; return [Math.round(h), Math.round(max ? d / max * 100 : 0), Math.round(vv * 100)]; })();
      const n = Math.round(clamp(Number(v.shades) || 7, 3, 11));
      const shades = Array.from({ length: n }, (_, i) => { const x = i / (n - 1); return toHex(r + (255 - r) * (1 - x) * 0.9, g + (255 - g) * (1 - x) * 0.9, b + (255 - b) * (1 - x) * 0.9); });
      return [
        { type: 'html', title: '色卡', value: `<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden"><div style="height:150px;background:${hex}"></div><div style="display:flex;flex-wrap:wrap;gap:12px;padding:12px;background:var(--surface)"><span style="font-family:var(--font-mono);font-size:12px">${hex.toUpperCase()}</span><span style="font-family:var(--font-mono);font-size:12px;color:var(--text-3)">rgb(${r}, ${g}, ${b})</span><span style="font-family:var(--font-mono);font-size:12px;color:var(--text-3)">hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)</span></div></div>` },
        { type: 'html', title: '明度色阶', value: `<div style="display:flex;height:56px;border-radius:8px;overflow:hidden">${shades.map(x => `<div style="flex:1;background:${x}" title="${x}"></div>`).join('')}</div>` },
        KV([['HEX', hex.toUpperCase()], ['RGB', `rgb(${r}, ${g}, ${b})`], ['HSL', `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`], ['CMYK', `cmyk(${cmyk.join('%, ')}%)`], ['HSV', `hsv(${hsv.join(', ')})`]], '颜色表达式'),
        TXT(`${hex.toUpperCase()}\nrgb(${r}, ${g}, ${b})\nhsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)\ncmyk(${cmyk.join('%, ')}%)`, '色号文本', 'color.txt')
      ];
    } });

  /* ---------------- 九九乘法表 ---------------- */
  R('九九乘法表', { fields: [N('max', '最大乘数', 9, { min: 2, max: 12, step: 1 }), C('full', '显示完整矩形', false, '完整矩形'), C('answers', '显示答案', true, '显示答案')], live: true,
    run: v => {
      const n = Math.round(clamp(Number(v.max) || 9, 2, 12));
      let table = '<table class="data-table" style="width:auto;margin:0 auto"><tbody>';
      for (let i = 1; i <= n; i++) {
        table += '<tr>';
        for (let j = 1; j <= n; j++) {
          if (!v.full && j > i) { table += '<td style="border:0;background:transparent"></td>'; continue; }
          table += `<td style="text-align:center;padding:7px 9px;white-space:nowrap">${j} × ${i} = ${v.answers ? i * j : '?'}</td>`;
        }
        table += '</tr>';
      }
      table += '</tbody></table>';
      return [
        { type: 'html', title: '乘法表', value: `<div style="overflow:auto;padding:8px">${table}</div>` },
        TXT(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => `${j + 1}×${i + 1}=${(j + 1) * (i + 1)}`).join('  ')).join('\n'), '纯文本乘法表', 'multiplication.txt'),
        { type: 'note', value: '可直接用浏览器打印；儿童练习时建议隐藏答案，先用「口算题生成」练习，再用本表核对。' }
      ];
    } });

  /* ---------------- 屏幕滑动检查 ---------------- */
  R('屏幕滑动检查', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="scStart">开始检测</button><span class="cp-note" id="scMsg">在下方区域持续滚动或滑动</span></div>
      <div id="scArea" class="scroll-test">${Array.from({ length: 60 }, (_, i) => `<div class="scroll-row"><span>Row ${String(i + 1).padStart(2, '0')}</span><div style="height:7px;width:${20 + (i * 13) % 70}%;background:var(--accent-soft);border-radius:4px"></div></div>`).join('')}</div>
      <div id="scStats" class="sys-grid"></div></div>`;
    const area = host.querySelector('#scArea'), msg = host.querySelector('#scMsg'), stats = host.querySelector('#scStats');
    let running = false, last = 0, frames = 0, samples = [], scrollCount = 0, raf = null;
    const loop = now => {
      if (!running) return;
      if (last) samples.push(now - last); last = now;
      frames++;
      if (frames % 30 === 0) {
        const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
        stats.innerHTML = `<div class="sys-card"><div class="sys-title">滑动采样</div><div class="kv-grid"><div class="kv-k">平均帧间隔</div><div class="kv-v">${avg.toFixed(1)} ms</div><div class="kv-k">估算帧率</div><div class="kv-v">${avg ? (1000 / avg).toFixed(1) : '—'} FPS</div><div class="kv-k">滚动事件</div><div class="kv-v">${scrollCount}</div></div></div>`;
      }
      raf = requestAnimationFrame(loop);
    };
    area.addEventListener('scroll', () => { scrollCount++; });
    host.querySelector('#scStart').onclick = () => {
      running = true; last = 0; frames = 0; samples = []; scrollCount = 0; msg.textContent = '检测中，请持续滚动或滑动…'; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      setTimeout(() => { if (running) { running = false; cancelAnimationFrame(raf); msg.textContent = '检测结束 · 可重新开始'; } }, 4000);
    };
    api.onCleanup(() => { running = false; cancelAnimationFrame(raf); });
  }});

  /* ---------------- 手机按键与触控检测 ---------------- */
  R('手机按键与触控检测', { render(host, api) {
    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row"><button class="btn btn-primary" id="phVibrate">振动测试</button><button class="btn btn-ghost" id="phReset">清空</button><span class="cp-note" id="phMsg">在下方区域触摸，或按键盘按键</span></div>
      <div id="phArea" class="mouse-zone" style="height:200px">把手指或鼠标放在这里</div>
      <div id="phStats" class="sys-grid" style="margin-top:12px"></div></div>`;
    const area = host.querySelector('#phArea'), stats = host.querySelector('#phStats'), msg = host.querySelector('#phMsg');
    const data = { touches: 0, keys: [], maxTouches: 0 };
    const paint = () => { stats.innerHTML = `<div class="sys-card"><div class="sys-title">触控与按键</div><div class="kv-grid"><div class="kv-k">屏幕触点</div><div class="kv-v">${data.touches}</div><div class="kv-k">最多同时触点</div><div class="kv-v">${data.maxTouches}</div><div class="kv-k">已按键</div><div class="kv-v">${data.keys.join('、') || '—'}</div><div class="kv-k">屏幕方向</div><div class="kv-v">${screen.orientation ? screen.orientation.type : (innerWidth > innerHeight ? 'landscape' : 'portrait')}</div></div></div>`; };
    const touch = e => { data.touches++; data.maxTouches = Math.max(data.maxTouches, e.touches ? e.touches.length : 1); msg.textContent = `触点 ${data.touches}`; paint(); };
    area.addEventListener('touchstart', e => { e.preventDefault(); touch(e); }, { passive: false });
    area.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { touch(e); } });
    const key = e => { if (e.key === 'Tab') return; if (!data.keys.includes(e.key)) data.keys.push(e.key); paint(); };
    document.addEventListener('keydown', key);
    host.querySelector('#phReset').onclick = () => { data.touches = 0; data.maxTouches = 0; data.keys = []; paint(); };
    host.querySelector('#phVibrate').onclick = () => { if (navigator.vibrate) { navigator.vibrate([120, 80, 120]); T.toast('已请求振动'); } else T.toast('当前浏览器不支持振动 API', 'err'); };
    api.onCleanup(() => document.removeEventListener('keydown', key));
    paint();
  }});
})();
