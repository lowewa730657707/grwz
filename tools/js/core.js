/* ============================================================
 * TOOLKIT 核心：工具注册表 / 表单渲染 / 结果渲染 / 公共能力
 * ------------------------------------------------------------
 * 每个工具通过 TOOLKIT.register(工具名, {fields, run}) 注册。
 * 未注册的工具会自动显示「即将上线」状态。
 * ============================================================ */
(function () {
  'use strict';

  const T = {
    impl: Object.create(null),      // 名称 -> 配置
    cleanups: [],
    toastTimer: null
  };
  window.TOOLKIT = T;

  T.register = function (name, cfg) { T.impl[name] = cfg; };
  T.registerMany = function (obj) { Object.keys(obj).forEach(k => T.register(k, obj[k])); };
  T.has = function (name) { return !!T.impl[name]; };
  T.count = function () { return Object.keys(T.impl).length; };
  T.get = function (name) { return T.impl[name]; };
  T.resetCleanups = function () {
    T.cleanups.forEach(fn => { try { fn(); } catch (e) { /* noop */ } });
    T.cleanups = [];
  };

  /* ---------------- 通用小工具 ---------------- */
  T.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.pad = (n, w = 2) => String(n).padStart(w, '0');
  T.fmt = (n, d = 2) => {
    if (!isFinite(n)) return '—';
    return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  };
  T.money = n => '¥' + T.fmt(n, 2);
  T.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  T.toast = function (msg, kind) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'toast';
      el.className = 'toast'; document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(T.toastTimer);
    T.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  };

  T.copy = async function (text) {
    try {
      await navigator.clipboard.writeText(String(text));
      T.toast('已复制到剪贴板');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = String(text); document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); T.toast('已复制到剪贴板'); }
      catch (_) { T.toast('复制失败，请手动选择', 'err'); }
      ta.remove();
    }
  };

  T.save = function (data, name) {
    let url, revoke = false;
    if (data instanceof Blob) { url = URL.createObjectURL(data); revoke = true; }
    else if (typeof data === 'string' && /^data:/.test(data)) url = data;
    else { url = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' })); revoke = true; }
    const a = document.createElement('a');
    a.href = url; a.download = name || 'download';
    document.body.appendChild(a); a.click(); a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(url), 30000);
    T.toast('已下载：' + a.download);
  };

  T.textBlob = (s, mime = 'text/plain;charset=utf-8') => new Blob([s], { type: mime });

  T.readFile = function (file, mode) {
    mode = mode || 'text';
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error || new Error('读取失败'));
      if (mode === 'buffer') r.readAsArrayBuffer(file);
      else if (mode === 'dataURL') r.readAsDataURL(file);
      else r.readAsText(file, 'utf-8');
    });
  };

  T.loadImage = function (src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败（浏览器可能不支持该格式）'));
      img.crossOrigin = 'anonymous';
      img.src = src;
    });
  };
  T.fileToImage = async function (file) {
    const url = URL.createObjectURL(file);
    try { return { img: await T.loadImage(url), url }; }
    catch (e) { URL.revokeObjectURL(url); throw e; }
  };

  T.imageCanvas = function (img, w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w || img.naturalWidth || img.width));
    c.height = Math.max(1, Math.round(h || img.naturalHeight || img.height));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  };

  T.canvasBlob = function (canvas, mime = 'image/png', quality = 0.92) {
    return new Promise(res => canvas.toBlob(b => res(b), mime, quality));
  };
  T.canvasResult = (canvas, name, mime) => ({
    type: 'image', src: canvas.toDataURL(mime || 'image/png', 0.92), name: name || 'image.png', mime: mime || 'image/png'
  });

  T.downloadDataURL = function (dataURL, name) { T.save(dataURL, name); };

  /* 像素处理通用函数 */
  T.pixelMap = function (canvas, fn) {
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const out = fn(px[i], px[i + 1], px[i + 2], px[i + 3], i / 4, canvas.width);
      if (out) { px[i] = out[0]; px[i + 1] = out[1]; px[i + 2] = out[2]; if (out[3] != null) px[i + 3] = out[3]; }
    }
    ctx.putImageData(d, 0, 0);
    return canvas;
  };

  /* ---------------- 哈希：MD5 / SHA1 / WebCrypto ---------------- */
  function md5(str) {
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    const withPad = (((len + 8) >> 6) + 1) * 64;
    const buf = new Uint8Array(withPad);
    buf.set(bytes); buf[len] = 0x80;
    const bitLen = len * 8;
    const dv = new DataView(buf.buffer);
    dv.setUint32(withPad - 8, bitLen >>> 0, true);
    dv.setUint32(withPad - 4, Math.floor(bitLen / 0x100000000), true);
    const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    const K = new Uint32Array(64);
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
    for (let off = 0; off < withPad; off += 64) {
      const M = new Uint32Array(16);
      for (let j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        const tmp = D;
        D = C; C = B;
        B = (B + rotl((A + F + K[i] + M[g]) >>> 0, S[i])) >>> 0;
        A = tmp;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    const hex = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255].map(b => b.toString(16).padStart(2, '0')).join('');
    return hex(a0) + hex(b0) + hex(c0) + hex(d0);
  }
  function sha1(str) {
    const bytes = new TextEncoder().encode(str);
    const bitLen = bytes.length * 8;
    const total = (((bytes.length + 8) >> 6) + 1) * 64;
    const buf = new Uint8Array(total); buf.set(bytes); buf[bytes.length] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);
    dv.setUint32(total - 4, bitLen >>> 0, false);
    let h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    const w = new Uint32Array(80);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
      for (let i = 16; i < 80; i++) w[i] = (((w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16]) << 1) | ((w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16]) >>> 31)) >>> 0;
      let [a, b, c, d, e] = h;
      for (let i = 0; i < 80; i++) {
        let f, k;
        if (i < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
        else if (i < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        const t = (((a << 5) | (a >>> 27)) + (f >>> 0) + (e >>> 0) + (k >>> 0) + (w[i] >>> 0)) >>> 0;
        e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = t;
      }
      h = [(h[0]+a)>>>0, (h[1]+b)>>>0, (h[2]+c)>>>0, (h[3]+d)>>>0, (h[4]+e)>>>0];
    }
    return h.map(x => x.toString(16).padStart(8, '0')).join('');
  }
  const hexOf = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  T.md5 = md5; T.sha1 = sha1;
  T.sha = async function (algo, data) {
    const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return hexOf(await crypto.subtle.digest(algo, buf));
  };
  T.hashAll = async function (data) {
    const isStr = typeof data === 'string';
    const buf = isStr ? new TextEncoder().encode(data) : data;
    const out = {};
    if (isStr) { out.MD5 = md5(data); out['SHA-1'] = sha1(data); }
    else { const s = Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join(''); out.MD5 = md5(s); out['SHA-1'] = sha1(s); }
    for (const a of ['SHA-256', 'SHA-384', 'SHA-512']) {
      try { out[a.replace('SHA-', 'SHA')] = hexOf(await crypto.subtle.digest(a, buf)); } catch (e) { /* noop */ }
    }
    return out;
  };

  /* ---------------- 简易代码格式化 ---------------- */
  T.beautifyCSS = function (css) {
    return css.replace(/\s*\}\s*/g, '}\n\n').replace(/\s*\{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ').replace(/\/\*/g, '\n/*').replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\{\n\s*\}/g, '{}').trim();
  };
  T.minifyCSS = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').replace(/\s+/g, ' ').trim();
  T.formatSQL = function (sql, upper) {
    const kw = ['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','JOIN','ON','AS','UNION ALL','UNION','CREATE TABLE','ALTER TABLE','DROP TABLE','DISTINCT','CASE','WHEN','THEN','ELSE','END','WITH','BY','DESC','ASC','IN','IS','NULL','NOT','BETWEEN','LIKE','COUNT','SUM','AVG'];
    let out = sql.replace(/\s+/g, ' ').trim();
    kw.sort((a,b) => b.length - a.length).forEach(k => {
      const re = new RegExp('\\b' + k.replace(/ /g, '\\s+') + '\\b', 'gi');
      out = out.replace(re, m => '\n' + (upper ? m.toUpperCase() : k));
    });
    out = out.replace(/,\s*/g, ',\n  ').replace(/\n+/g, '\n');
    return out.trim().split('\n').map(l => l.trim()).join('\n');
  };
  T.formatXML = function (xml) {
    const tokens = xml.replace(/>\s*</g, '><').replace(/</g, '\n<').split('\n').filter(s => s.trim());
    let depth = 0, out = [];
    tokens.forEach(t => {
      if (/^<\//.test(t)) depth = Math.max(0, depth - 1);
      out.push('  '.repeat(depth) + t.trim());
      if (/^<[^!?/][^>]*[^/]>$/.test(t) && !/^<[^>]*>.*<\//.test(t)) depth++;
    });
    return out.join('\n');
  };
  T.beautifyJS = function (src) {
    let out = '', depth = 0, inStr = null, esc = false;
    const nl = () => { out += '\n' + '  '.repeat(Math.max(0, depth)); };
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inStr) {
        out += c;
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; continue; }
      if (c === '{') { out += ' {'; depth++; nl(); }
      else if (c === '}') { depth--; out = out.replace(/\s+$/, ''); nl(); out += '}'; }
      else if (c === ';') { out += ';'; nl(); }
      else if (c === ',' && !/[([]/.test(src.slice(Math.max(0, i - 12), i))) { out += ', '; }
      else if (/\s/.test(c)) { if (!/\s$/.test(out)) out += ' '; }
      else out += c;
    }
    return out.replace(/\n\s*\n+/g, '\n').trim();
  };

  /* ---------------- 表单渲染 ---------------- */
  T.fieldHTML = function (f) {
    const id = 'f_' + f.key;
    const val = f.value == null ? (f.def == null ? '' : f.def) : f.value;
    let ctrl = '';
    switch (f.type) {
      case 'textarea':
        ctrl = `<textarea id="${id}" data-key="${f.key}" rows="${f.rows || 6}" placeholder="${T.esc(f.placeholder || '')}" spellcheck="false">${T.esc(val)}</textarea>`;
        break;
      case 'select':
        ctrl = `<select id="${id}" data-key="${f.key}">${(f.options || []).map(o => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return `<option value="${T.esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${T.esc(l)}</option>`;
        }).join('')}</select>`;
        break;
      case 'checkbox':
        ctrl = `<label class="switch"><input type="checkbox" id="${id}" data-key="${f.key}" ${val ? 'checked' : ''}><span class="switch-track"></span><span class="switch-label">${T.esc(f.checkLabel || '启用')}</span></label>`;
        break;
      case 'file':
      case 'files':
        ctrl = `<div class="file-drop" data-drop="${f.key}">
          <input type="file" id="${id}" data-key="${f.key}" ${(f.type === 'files' || f.multiple) ? 'multiple' : ''} ${f.accept ? `accept="${T.esc(f.accept)}"` : ''}>
          <label for="${id}" class="file-btn">选择文件${(f.type === 'files' || f.multiple) ? '（可多选）' : ''}</label>
          <span class="file-names" data-names="${f.key}">${T.esc(f.placeholder || '尚未选择文件 · 所有处理均在本地浏览器完成')}</span>
          <button type="button" class="file-clear" data-clear="${f.key}" hidden>清除</button>
        </div>`;
        break;
      case 'color':
        ctrl = `<div class="color-field"><input type="color" id="${id}" data-key="${f.key}" value="${T.esc(val || '#6366f1')}"><input type="text" class="color-hex" data-hex="${f.key}" value="${T.esc(val || '#6366f1')}" spellcheck="false"></div>`;
        break;
      case 'range':
        ctrl = `<div class="range-field"><input type="range" id="${id}" data-key="${f.key}" min="${f.min ?? 0}" max="${f.max ?? 100}" step="${f.step ?? 1}" value="${T.esc(val)}"><output data-out="${f.key}">${T.esc(val)}</output><input type="number" class="range-num" data-num="${f.key}" min="${f.min ?? 0}" max="${f.max ?? 100}" step="${f.step ?? 1}" value="${T.esc(val)}" aria-label="${T.esc(f.label || f.key)} 数值"></div>`;
        break;
      default:
        ctrl = `<input type="${f.type || 'text'}" id="${id}" data-key="${f.key}" value="${T.esc(val)}" placeholder="${T.esc(f.placeholder || '')}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} ${f.step != null ? `step="${f.step}"` : ''} spellcheck="false">`;
    }
    if (f.type === 'text' || f.type === 'number' || f.type === 'textarea') {
      ctrl = `<div class="ctrl-wrap${f.type === 'textarea' ? ' ctrl-wrap-area' : ''}">${ctrl}${f.clear !== false && f.type !== 'number' ? `<button type="button" class="ctrl-clear" data-clr="${f.key}" title="清空" aria-label="清空${T.esc(f.label || f.key)}">×</button>` : ''}</div>`;
    }
    if (Array.isArray(f.presets) && f.presets.length) {
      ctrl += `<div class="field-presets">${f.presets.map(p => {
        const pv = Array.isArray(p) ? p[0] : p, pl = Array.isArray(p) ? p[1] : p;
        return `<button type="button" class="preset-chip" data-preset="${f.key}" data-value="${T.esc(pv)}">${T.esc(pl)}</button>`;
      }).join('')}</div>`;
    }
    return `<div class="field ${f.wide ? 'wide' : ''}" data-field="${f.key}"><label for="${id}">${T.esc(f.label || f.key)}${f.hint ? `<em>${T.esc(f.hint)}</em>` : ''}</label>${ctrl}</div>`;
  };

  T.collect = function (root, fields) {
    const v = Object.create(null);
    (fields || []).forEach(f => {
      const el = root.querySelector(`[data-key="${f.key}"]`);
      if (!el) return;
      if (f.type === 'file' || f.type === 'files') {
        const files = Array.from(el.files || []);
        v[f.key] = (f.type === 'files' || f.multiple) ? files : (files[0] || null);
      } else if (f.type === 'checkbox') v[f.key] = el.checked;
      else if (f.type === 'number' || f.type === 'range') v[f.key] = Number(el.value);
      else v[f.key] = el.value;
    });
    return v;
  };

  /* ---------------- 结果渲染 ---------------- */
  function btn(label, cls, onclick) {
    const b = document.createElement('button');
    b.className = 'btn ' + (cls || 'btn-ghost'); b.textContent = label;
    b.onclick = onclick; return b;
  }

  function card(title, body, actions) {
    const box = document.createElement('div'); box.className = 'result-card';
    const head = document.createElement('div'); head.className = 'result-head';
    head.innerHTML = `<span>${T.esc(title)}</span>`;
    if (actions && actions.length) { const as = document.createElement('div'); as.className = 'result-actions'; actions.forEach(a => as.appendChild(a)); head.appendChild(as); }
    box.appendChild(head);
    const b = document.createElement('div'); b.className = 'result-body';
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
    box.appendChild(b);
    return box;
  }

  function textBlock(value, ext) {
    const pre = document.createElement('pre'); pre.className = 'code-out'; pre.textContent = String(value);
    return card(ext || '输出结果', pre, [btn('复制', 'btn-ghost', () => T.copy(value)), btn('下载', 'btn-ghost', () => T.save(T.textBlob(value), (ext || 'result').replace(/[^\w\u4e00-\u9fa5.-]/g, '_') + '.txt'))]);
  }

  function renderOne(container, r) {
    if (!r) return;
    if (Array.isArray(r)) { r.forEach(x => renderOne(container, x)); return; }
    switch (r.type) {
      case 'text': case 'code': {
        const el = document.createElement('pre'); el.className = 'code-out'; el.textContent = String(r.value);
        const acts = [btn('复制', 'btn-ghost', () => T.copy(r.value))];
        if (r.download) acts.push(btn('下载', 'btn-ghost', () => T.save(T.textBlob(r.value, r.mime), r.download)));
        container.appendChild(card(r.title || '输出结果', el, acts));
        break;
      }
      case 'html': {
        const d = document.createElement('div'); d.className = 'html-out'; d.innerHTML = r.value;
        container.appendChild(card(r.title || '预览', d, r.copy ? [btn('复制代码', 'btn-ghost', () => T.copy(r.copy))] : null));
        break;
      }
      case 'kv': {
        const tbl = document.createElement('div'); tbl.className = 'kv-grid';
        (r.rows || []).forEach(([k, v]) => { tbl.insertAdjacentHTML('beforeend', `<div class="kv-k">${T.esc(k)}</div><div class="kv-v">${T.esc(v)}</div>`); });
        container.appendChild(card(r.title || '计算结果', tbl));
        break;
      }
      case 'table': {
        let h = '<div class="table-scroll"><table class="data-table"><thead><tr>' + (r.head || []).map(x => `<th>${T.esc(x)}</th>`).join('') + '</tr></thead><tbody>';
        (r.rows || []).forEach(row => { h += '<tr>' + row.map(x => `<td>${T.esc(x)}</td>`).join('') + '</tr>'; });
        h += '</tbody></table></div>';
        container.appendChild(card(r.title || '数据表格', h, [btn('导出 CSV', 'btn-ghost', () => {
          const esc = x => '"' + String(x).replace(/"/g, '""') + '"';
          const csv = [r.head, ...r.rows].map(row => row.map(esc).join(',')).join('\r\n');
          T.save(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), 'table.csv');
        })]));
        break;
      }
      case 'image': {
        const wrap = document.createElement('div'); wrap.className = 'image-out';
        wrap.innerHTML = `<img src="${r.src}" alt="输出图片">`;
        const acts = [btn('下载图片', 'btn-primary', () => T.save(r.src, r.name || 'image.png'))];
        if (r.copy !== false) acts.push(btn('复制图片', 'btn-ghost', async () => {
          try {
            const blob = await (await fetch(r.src)).blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            T.toast('图片已复制');
          } catch (e) { T.toast('当前浏览器不支持复制图片，请下载', 'err'); }
        }));
        if (r.extra) r.extra.forEach(e => acts.push(btn(e.label, 'btn-ghost', e.fn)));
        container.appendChild(card(r.title || '图片结果', wrap, acts));
        break;
      }
      case 'images': {
        const wrap = document.createElement('div'); wrap.className = 'thumbs';
        (r.items || []).forEach((it, i) => {
          const d = document.createElement('div'); d.className = 'thumb';
          d.innerHTML = `<img src="${it.src}" alt="${T.esc(it.name || i)}"><span>${T.esc(it.name || ('图片 ' + (i + 1)))}</span>`;
          const b = btn('下载', 'btn-ghost', () => T.save(it.src, it.name || `image_${i + 1}.png`));
          d.appendChild(b); wrap.appendChild(d);
        });
        const acts = [];
        if (r.zip) acts.push(btn('打包下载 ZIP', 'btn-primary', r.zip));
        container.appendChild(card(r.title || `共 ${(r.items || []).length} 张图片`, wrap, acts));
        break;
      }
      case 'file': case 'files': {
        const items = r.type === 'files' ? r.items : [r];
        const wrap = document.createElement('div'); wrap.className = 'file-list';
        items.forEach(it => {
          const d = document.createElement('div'); d.className = 'file-row';
          d.innerHTML = `<span class="file-ico" aria-hidden="true"></span><span class="file-nm">${T.esc(it.name)}</span><span class="file-sz">${it.blob ? T.fmt(it.blob.size / 1024, 1) + ' KB' : ''}</span>`;
          d.appendChild(btn('下载', 'btn-primary', () => T.save(it.blob, it.name)));
          wrap.appendChild(d);
        });
        container.appendChild(card(r.title || '生成文件', wrap));
        break;
      }
      case 'note': {
        const d = document.createElement('div'); d.className = 'note ' + (r.kind || '');
        d.innerHTML = r.value; container.appendChild(d); break;
      }
      case 'raw': container.appendChild(r.node); break;
      default:
        if (typeof r === 'string') container.appendChild(textBlock(r));
    }
  }
  T.renderResults = function (container, results) {
    container.innerHTML = '';
    renderOne(container, results);
  };
  T.resultCard = card;
  T.resultBtn = btn;

  /* ---------------- 工作区标签切换（参数 / 结果） ----------------
   * 全局委托：任何自定义面板只要用 .ws / .ws-tab / .ws-col[data-col] 的
   * 结构，就能在窄屏下获得「参数设置 / 结果预览」切换，无需各自实现。 */
  document.addEventListener('click', function (e) {
    const tab = e.target && e.target.closest ? e.target.closest('.ws-tab') : null;
    if (!tab) return;
    const ws = tab.closest('.ws');
    if (!ws) return;
    ws.querySelectorAll('.ws-tab').forEach(b => {
      const on = b === tab;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });
    ws.querySelectorAll('.ws-col').forEach(c => c.classList.toggle('is-on', c.dataset.col === tab.dataset.tab));
    const dot = ws.querySelector('.ws-dot');
    if (dot) dot.hidden = true;
  });

  /* ---------------- 滑块与数字输入双向同步 ----------------
   * 站点里所有滑块字段都可以「拖动调」或「输入精确值」，自定义面板也自动生效。 */
  document.addEventListener('input', function (e) {
    const t = e.target;
    if (!t || !t.closest) return;
    const wrap = t.closest('.range-field');
    if (!wrap) return;
    const range = wrap.querySelector('input[type=range]');
    const num = wrap.querySelector('.range-num');
    const out = wrap.querySelector('output');
    if (!range) return;
    if (t === num) {
      if (num.value === '') return;
      let v = Number(num.value);
      if (!isFinite(v)) return;
      const min = range.min === '' ? -Infinity : Number(range.min);
      const max = range.max === '' ? Infinity : Number(range.max);
      if (v < min) v = min;
      if (v > max) v = max;
      range.value = v;
      if (out) out.textContent = String(v);
      range.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (t === range) {
      if (out) out.textContent = range.value;
      if (num) num.value = range.value;
    }
  });

  /* ---------------- 打开一个工具（构建面板） ---------------- */
  T.mount = function (host, toolName) {
    const cfg = T.get(toolName);
    T.resetCleanups();
    host.innerHTML = '';
    if (!cfg) {
      host.innerHTML = `<div class="coming"><span class="coming-label">COMING SOON</span><h2>${T.esc(toolName)}</h2><p>这个工具还在开发中。当前版本已提供 <b>${T.count()}</b> 个可直接使用的工具，<br>可以先从下方「同类工具」里找替代方案，或稍后再来看。</p><button class="btn btn-primary" id="comingBack">返回工具列表</button></div>`;
      host.querySelector('#comingBack').onclick = () => window.APP.showHome();
      return;
    }

    const api = {
      toast: T.toast, copy: T.copy, save: T.save, readFile: T.readFile,
      loadImage: T.loadImage, fileToImage: T.fileToImage, canvasBlob: T.canvasBlob,
      onCleanup: fn => T.cleanups.push(fn), host
    };

    if (cfg.render) {
      const pane = document.createElement('div'); pane.className = 'custom-pane';
      host.appendChild(pane);
      const applyPlain = () => host.classList.toggle('panel-plain', !!pane.querySelector('.ws-split'));
      try {
        Promise.resolve(cfg.render(pane, api)).then(applyPlain).catch(e => {
          pane.insertAdjacentHTML('beforeend', `<div class="note warn">运行出错：${T.esc(e && e.message || e)}</div>`);
        });
      } catch (e) {
        pane.insertAdjacentHTML('beforeend', `<div class="note warn">运行出错：${T.esc(e && e.message || e)}</div>`);
      }
      applyPlain();
      return;
    }

    const fields = cfg.fields || [];
    const needsFile = fields.some(f => f.type === 'file' || f.type === 'files');
    const runLabel = cfg.runLabel || (cfg.live ? '重新计算' : '开始处理');
    const hintHTML = `<div class="hint-empty">选择文件后点击「${T.esc(runLabel)}」— 所有文件只在本地浏览器中读取，不会上传到任何服务器。</div>`;
    const idleHTML = cfg.emptyHint ? `<div class="hint-empty">${T.esc(cfg.emptyHint)}</div>` : (needsFile ? hintHTML : `<div class="hint-empty">点击「${T.esc(runLabel)}」开始；处理在当前浏览器内完成。</div>`);

    /* ---- 工作区骨架：左参数 / 右预览（窄屏切换为两个标签） ---- */
    const split = !!(fields.length || cfg.extraActions);
    host.classList.toggle('panel-plain', split);
    const ws = document.createElement('div');
    ws.className = 'ws' + (split ? ' ws-split' : '');

    const tabs = document.createElement('div');
    tabs.className = 'ws-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = `<button type="button" class="ws-tab is-on" data-tab="ctl" role="tab" aria-selected="true">参数设置</button>
      <button type="button" class="ws-tab" data-tab="out" role="tab" aria-selected="false">结果预览<i class="ws-dot" hidden></i></button>`;

    const ctl = document.createElement('div');
    ctl.className = 'ws-col ws-ctl';
    ctl.dataset.col = 'ctl';
    const ctlBar = document.createElement('div');
    ctlBar.className = 'ws-bar';
    ctlBar.innerHTML = `<span class="ws-bar-title">参数设置</span><span class="ws-bar-meta">${fields.length ? fields.length + ' 项参数' : '操作面板'}</span>`;
    const ctlReset = document.createElement('button');
    ctlReset.type = 'button'; ctlReset.className = 'ws-bar-btn'; ctlReset.textContent = '重置';
    ctlReset.title = '恢复默认参数并重新计算';
    ctlReset.onclick = () => resetFields();
    if (fields.length) ctlBar.appendChild(ctlReset);
    const ctlBody = document.createElement('div');
    ctlBody.className = 'ws-body';

    const side = document.createElement('div');
    side.className = 'ws-col ws-out';
    side.dataset.col = 'out';

    const form = document.createElement('div'); form.className = 'tool-form';
    form.innerHTML = `<div class="form-grid">${fields.map(T.fieldHTML).join('')}</div>`;
    const actions = document.createElement('div'); actions.className = 'form-actions';
    const runBtn = document.createElement('button'); runBtn.className = 'btn btn-primary btn-run';
    runBtn.innerHTML = `<span>${T.esc(runLabel)}</span>`;
    actions.appendChild(runBtn);
    if (fields.length && !split) actions.appendChild(btn('重置', 'btn-ghost', () => resetFields()));
    if (cfg.extraActions) cfg.extraActions.forEach(a => actions.appendChild(btn(a.label, 'btn-ghost', () => a.fn(T.collect(form, fields), api))));
    form.appendChild(actions);
    ctlBody.appendChild(form);
    ctl.appendChild(ctlBar);
    ctl.appendChild(ctlBody);

    /* 结果列：状态条 + 结果容器 */
    const outBar = document.createElement('div');
    outBar.className = 'ws-bar ws-bar-out';
    outBar.innerHTML = `<span class="ws-bar-title">结果预览</span><span class="ws-out-stat" data-out-stat>${needsFile ? '等待选择文件' : '就绪'}</span>`;
    const out = document.createElement('div'); out.className = 'tool-results';
    const outBody = document.createElement('div');
    outBody.className = 'ws-body';
    outBody.appendChild(out);
    side.appendChild(outBar);
    side.appendChild(outBody);

    if (split) {
      ws.appendChild(tabs); ws.appendChild(ctl); ws.appendChild(side);
      host.appendChild(ws);
    } else {
      host.appendChild(ctl); host.appendChild(side);
    }

    /* 窄屏标签切换：由 core 顶部的全局委托处理，这里只设初始状态 */
    if (split) ctl.classList.add('is-on');
    const markDone = (ok) => {
      const stat = outBar.querySelector('[data-out-stat]');
      if (stat) {
        stat.textContent = ok
          ? '已更新 · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false })
          : '未完成';
        stat.classList.toggle('is-err', !ok);
      }
      const dot = tabs.querySelector('.ws-dot');
      if (dot && split && window.matchMedia('(max-width: 940px)').matches && !side.classList.contains('is-on')) dot.hidden = false;
      side.classList.remove('is-fresh');
      if (ok) { void side.offsetWidth; side.classList.add('is-fresh'); }
    };

    function resetFields() {
      fields.forEach(f => {
        const input = form.querySelector(`[data-key="${f.key}"]`);
        if (!input) return;
        if (f.type === 'file' || f.type === 'files') {
          input.value = '';
          const slot = form.querySelector(`[data-names="${f.key}"]`);
          if (slot) slot.textContent = f.placeholder || '尚未选择文件 · 所有处理均在本地浏览器完成';
          const clear = form.querySelector(`[data-clear="${f.key}"]`);
          if (clear) clear.hidden = true;
        } else if (f.type === 'checkbox') {
          input.checked = !!f.def;
        } else if (f.type === 'range') {
          const val = f.def == null ? (f.min == null ? 0 : f.min) : f.def;
          input.value = val;
          const o = form.querySelector(`[data-out="${f.key}"]`);
          if (o) o.textContent = val;
          const nEl = form.querySelector(`[data-num="${f.key}"]`);
          if (nEl) nEl.value = val;
        } else if (f.type === 'color') {
          const val = f.def || '#6366f1';
          input.value = val;
          const hex = form.querySelector(`[data-hex="${f.key}"]`);
          if (hex) hex.value = val;
        } else {
          input.value = f.def == null ? '' : f.def;
        }
      });
      out.innerHTML = idleHTML;
      if (!needsFile && cfg.autoRun !== false) doRun();
    }

    /* 绑定交互 */
    form.querySelectorAll('input[type=file]').forEach(inp => {
      const slot = form.querySelector(`[data-names="${inp.dataset.key}"]`);
      const clearBtn = form.querySelector(`[data-clear="${inp.dataset.key}"]`);
      const baseLabel = slot ? slot.textContent : '尚未选择文件 · 所有处理均在本地浏览器完成';
      const update = () => {
        const names = Array.from(inp.files || []).map(f => f.name);
        if (slot) slot.textContent = names.length ? names.slice(0, 3).join('、') + (names.length > 3 ? ` 等 ${names.length} 个文件` : '') : baseLabel;
        if (clearBtn) clearBtn.hidden = !names.length;
        if (names.length) out.innerHTML = hintHTML;
      };
      inp.addEventListener('change', update);
      if (clearBtn) clearBtn.onclick = () => {
        inp.value = '';
        update();
        out.innerHTML = hintHTML;
      };
      const drop = form.querySelector(`[data-drop="${inp.dataset.key}"]`);
      if (drop) {
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
        drop.addEventListener('drop', e => {
          e.preventDefault(); drop.classList.remove('drag');
          if (e.dataTransfer.files.length) { inp.files = e.dataTransfer.files; update(); }
        });
      }
    });
    form.querySelectorAll('input[type=color]').forEach(inp => {
      const hex = form.querySelector(`[data-hex="${inp.dataset.key}"]`);
      inp.addEventListener('input', () => { if (hex) hex.value = inp.value; });
      if (hex) hex.addEventListener('input', () => {
        let val = hex.value.trim();
        if (/^[0-9a-f]{6}$/i.test(val)) { val = '#' + val; hex.value = val; }
        if (/^#[0-9a-f]{6}$/i.test(val)) {
          inp.value = val;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
    form.querySelectorAll('input[type=range]').forEach(inp => {
      const o = form.querySelector(`[data-out="${inp.dataset.key}"]`);
      inp.addEventListener('input', () => { if (o) o.textContent = inp.value; });
    });
    /* 单字段清空按钮 */
    form.querySelectorAll('[data-clr]').forEach(b => {
      b.onclick = () => {
        const el = form.querySelector(`[data-key="${b.dataset.clr}"]`);
        if (!el) return;
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus();
      };
    });
    /* 快捷值 */
    form.querySelectorAll('[data-preset]').forEach(b => {
      b.onclick = () => {
        const el = form.querySelector(`[data-key="${b.dataset.preset}"]`);
        if (!el) return;
        el.value = b.dataset.value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
      };
    });
    form.querySelectorAll('[data-key]').forEach(el => {
      if (cfg.live && (el.tagName !== 'INPUT' || el.type !== 'file')) el.addEventListener('input', () => doRun());
      if (el.tagName === 'SELECT') el.addEventListener('change', () => { if (cfg.live) doRun(); });
    });

    let busy = false;
    async function doRun() {
      if (busy) return;
      busy = true; runBtn.disabled = true; runBtn.classList.add('loading');
      const stat = outBar.querySelector('[data-out-stat]');
      if (stat && out.innerHTML) stat.textContent = '计算中…';
      try {
        const v = T.collect(form, fields);
        const res = await cfg.run(v, api);
        T.renderResults(out, res);
        markDone(true);
      } catch (e) {
        console.error(e);
        T.renderResults(out, { type: 'note', kind: 'err', value: `<b>处理失败：</b>${T.esc(e && e.message || e)}` });
        markDone(false);
      } finally {
        busy = false; runBtn.disabled = false; runBtn.classList.remove('loading');
      }
    }
    runBtn.onclick = doRun;
    /* 表单内回车运行；Ctrl / ⌘ + Enter 在任何输入框都能运行 */
    form.addEventListener('keydown', e => {
      if (e.isComposing) return;
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doRun(); return; }
      if (e.key !== 'Enter') return;
      const t = e.target;
      if (t.tagName !== 'INPUT' || t.type === 'file' || t.type === 'checkbox' || t.type === 'color') return;
      if (cfg.live) return;
      e.preventDefault();
      doRun();
    });
    api.run = doRun;
    api.refresh = doRun;
    if (cfg.autoRun === true || (!needsFile && cfg.autoRun !== false)) doRun();
    else out.innerHTML = idleHTML;
  };
})();
