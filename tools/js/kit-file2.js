/* ============================================================
   工具实现：PDF 水印与文件加密
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file' }, extra || {});
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const esc = T.esc;

  const bytes = f => T.readFile(f, 'buffer');
  const baseName = f => (f.name || 'file').replace(/\.[^.]+$/, '');

  /* ---------------- PDF 加水印 ---------------- */
  R('PDF 加水印', { fields: [
    F('file', '选择 PDF 文件', { accept: '.pdf,application/pdf' }),
    I('text', '水印文字', '仅供内部使用'),
    N('size', '水印字号', 54, { min: 12, max: 160, step: 1 }),
    N('opacity', '不透明度（0 ~ 1）', .16, { min: .02, max: .8, step: .01 }),
    N('angle', '旋转角度', 35, { min: -90, max: 90, step: 5 }),
    I('color', '水印颜色', '#7a1f1f', { type: 'color' })
  ], runLabel: '添加水印',
    run: async v => {
      if (!v.file) throw new Error('请选择 PDF 文件');
      if (!window.PDFLib) throw new Error('PDF 组件未加载');
      const { PDFDocument, degrees, rgb } = window.PDFLib;
      const doc = await PDFDocument.load(await bytes(v.file), { ignoreEncryption: true });
      const pages = doc.getPages();
      const text = String(v.text || '');
      if (!text.trim()) throw new Error('请输入水印文字');
      // 用 Canvas 生成透明水印图，避免 PDF 标准字体不支持中文
      const c = document.createElement('canvas');
      const font = `${Math.max(12, Number(v.size) || 54)}px "PingFang SC","Microsoft YaHei",sans-serif`;
      const measure = document.createElement('canvas').getContext('2d');
      measure.font = font;
      const tw = Math.ceil(measure.measureText(text).width) + 40;
      const th = Math.ceil((Number(v.size) || 54) * 1.8);
      c.width = tw; c.height = th;
      const cx = c.getContext('2d');
      cx.font = font; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      const hx = String(v.color || '#7a1f1f').replace('#', '');
      cx.fillStyle = '#' + (hx.length === 3 ? hx.split('').map(x => x + x).join('') : hx);
      cx.fillText(text, tw / 2, th / 2);
      const png = await doc.embedPng(c.toDataURL('image/png'));
      pages.forEach(page => {
        const { width, height } = page.getSize();
        const scale = Math.min(1, (width * .8) / tw);
        page.drawImage(png, {
          x: width / 2 - tw * scale / 2,
          y: height / 2 - th * scale / 2,
          width: tw * scale,
          height: th * scale,
          opacity: Math.max(.02, Math.min(.8, Number(v.opacity) || .16)),
          rotate: degrees(Number(v.angle) || 0)
        });
      });
      const out = await doc.save();
      return [{ type: 'file', blob: new Blob([out], { type: 'application/pdf' }), name: baseName(v.file) + '_watermark.pdf', title: '加水印后的 PDF' },
        KV([['页数', pages.length], ['水印文字', text], ['不透明度', v.opacity], ['说明', '水印以图片形式嵌入']], '处理结果'),
        { type: 'note', value: '水印以透明 PNG 嵌入，视觉上覆盖页面，但文字不可选中/复制；需要可编辑水印请用专业 PDF 工具。' }];
    } });

  /* ---------------- 文件加密 ---------------- */
  R('文件加密', { fields: [
    F('file', '选择文件', {}),
    I('pwd', '密码', 'my-password'),
    S('mode', '操作', [['enc', '加密文件'], ['dec', '解密 .pickenc 文件']], 'enc')
  ], runLabel: '开始处理',
    run: async v => {
      if (!v.file) throw new Error('请选择文件');
      if (!v.pwd) throw new Error('请输入密码');
      const data = new Uint8Array(await bytes(v.file));
      if (v.mode === 'dec') {
        const MAGIC = new TextEncoder().encode('PICKENC1');
        if (data.length < 10 || !MAGIC.every((b, i) => data[i] === b)) throw new Error('这不是本站生成的文件加密格式');
        const nameLen = (data[8] << 8) | data[9];
        if (data.length < 10 + nameLen + 28) throw new Error('文件已损坏');
        const nameBytes = data.slice(10, 10 + nameLen);
        const name = new TextDecoder().decode(nameBytes);
        const salt = data.slice(10 + nameLen, 10 + nameLen + 16), iv = data.slice(10 + nameLen + 16, 10 + nameLen + 28), enc = data.slice(10 + nameLen + 28);
        const key = await derive(v.pwd, salt);
        let dec;
        try { dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, enc); } catch (e) { throw new Error('密码错误或文件已损坏'); }
        return [{ type: 'file', blob: new Blob([dec]), name: name || 'decrypted.bin', title: '解密后的文件' },
          { type: 'note', value: '文件已恢复。请确认来源可信后再打开。' }];
      }
      const nameBytes = new TextEncoder().encode(v.file.name || 'file');
      const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await derive(v.pwd, salt);
      const enc = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
      const magic = new TextEncoder().encode('PICKENC1');
      const out = new Uint8Array(10 + nameBytes.length + 28 + enc.length);
      out.set(magic, 0); out[8] = nameBytes.length >> 8; out[9] = nameBytes.length & 255;
      out.set(nameBytes, 10); out.set(salt, 10 + nameBytes.length); out.set(iv, 10 + nameBytes.length + 16); out.set(enc, 10 + nameBytes.length + 28);
      return [{ type: 'file', blob: new Blob([out], { type: 'application/octet-stream' }), name: v.file.name + '.pickenc', title: '加密后的文件' },
        KV([['算法', 'AES-256-GCM + PBKDF2-SHA256'], ['原始大小', T.fmt(v.file.size / 1024, 1) + ' KB'], ['加密后大小', T.fmt(out.length / 1024, 1) + ' KB']], '加密信息'),
        { type: 'note', value: '密码不会保存，遗失后无法恢复；请把密码与文件分开保管。' }];
    } });

  async function derive(pwd, salt) {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(pwd)), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
})();
