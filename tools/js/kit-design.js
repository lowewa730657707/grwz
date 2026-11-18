/* ============================================================
   工具实现：设计工具
   配色 / 规范 / CSS 生成 / 素材导出
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const X = (key, label, def, extra) => Object.assign({ key, label, type: 'textarea', def, rows: 5 }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file' }, extra || {});
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const TXT = (value, title, download) => ({ type: 'text', value, title, download });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r2 = n => Math.round(n * 100) / 100;
  const esc = T.esc;

  /* ---------------- 颜色工具 ---------------- */
  function hexToRgb(hex) {
    let h = String(hex || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) h = '000000';
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function rgbToHex(r, g, b) {
    const f = n => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return '#' + f(r) + f(g) + f(b);
  }
  function normHex(v) { return rgbToHex(hexToRgb(v).r, hexToRgb(v).g, hexToRgb(v).b); }
  function lum(hex) {
    const { r, g, b } = hexToRgb(hex);
    const c = [r, g, b].map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  function contrast(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
  }
  function rgbToHsl(hex) {
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (d) {
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6] || [0, 0, 0];
    return rgbToHex((seg[0] + m) * 255, (seg[1] + m) * 255, (seg[2] + m) * 255);
  }
  function mix(hex, target, t) {
    const a = hexToRgb(hex), b = hexToRgb(target);
    return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }
  const lighten = (hex, t) => mix(hex, '#ffffff', t);
  const darken = (hex, t) => mix(hex, '#000000', t);
  function rgba(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${r2(a)})`;
  }
  function swatchGrid(items) {
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px">${items.map(x => `
      <div style="border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--surface)">
        <div style="height:64px;background:${x.hex}"></div>
        <div style="padding:6px 8px">
          <div style="font-size:11px;color:var(--text-2)">${esc(x.label || '')}</div>
          <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-3)">${x.hex}</div>
        </div>
      </div>`).join('')}</div>`;
  }

  /* ---------------- 1. 对比度检查器 ---------------- */
  R('对比度检查器', {
    fields: [
      I('fg', '文字颜色', '#1b1c18', { type: 'color' }),
      I('bg', '背景颜色', '#f4f3ee', { type: 'color' }),
      S('size', '文本规格', [['normal', '正文（小于 24px）'], ['large', '大字（≥ 24px 或 ≥ 18.66px 加粗）']], 'normal')
    ], live: true,
    run: v => {
      const fg = normHex(v.fg), bg = normHex(v.bg);
      const ratio = contrast(fg, bg);
      const aa = v.size === 'large' ? 3 : 4.5;
      const aaa = v.size === 'large' ? 4.5 : 7;
      const preview = `<div style="background:${bg};color:${fg};padding:30px 24px;border-radius:10px;border:1px solid var(--line);font-size:${v.size === 'large' ? '26px' : '15px'};line-height:1.65">
        对比度示例文字 Aa 123<br><span style="font-size:14px;opacity:.85">正文与背景的实际显示效果</span></div>`;
      return [
        { type: 'html', title: '实际预览', value: preview },
        KV([
          ['对比度', ratio.toFixed(2) + ' : 1'],
          ['WCAG AA', ratio >= aa ? '通过（需 ≥ ' + aa + ':1）' : '未通过（需 ≥ ' + aa + ':1）'],
          ['WCAG AAA', ratio >= aaa ? '通过（需 ≥ ' + aaa + ':1）' : '未通过（需 ≥ ' + aaa + ':1）'],
          ['建议', ratio >= 7 ? '可用于正文与大字' : ratio >= 4.5 ? '可用于正文' : ratio >= 3 ? '仅适合大字或非文本元素' : '对比不足，建议调整色值']
        ], '检测结果'),
        TXT(`前景色 ${fg}\n背景色 ${bg}\n对比度 ${ratio.toFixed(2)}:1`, '色值与对比度', 'contrast.txt'),
        { type: 'note', value: 'WCAG 2.2 对正文的要求是 4.5:1，对大字（≥ 24px 或 ≥ 18.66px 加粗）的要求是 3:1；图标等非文本元素建议至少 3:1。' }
      ];
    }
  });

  /* ---------------- 2. 颜色关系生成器 ---------------- */
  R('颜色关系生成器', {
    fields: [
      I('base', '主色', '#2d5c4d', { type: 'color' }),
      S('scheme', '配色规则', [
        ['complementary', '互补色（2 色）'],
        ['analogous', '类似色（5 色）'],
        ['triadic', '三角配色（3 色）'],
        ['split', '分裂互补（3 色）'],
        ['tetradic', '四色配色（4 色）'],
        ['monochrome', '单色明度阶梯（5 色）']
      ], 'analogous')
    ], live: true,
    run: v => {
      const base = normHex(v.base);
      const [h, s, l] = rgbToHsl(base);
      let items = [];
      if (v.scheme === 'complementary') {
        items = [[base, '主色'], [hslToHex(h + 180, s, l), '互补色']];
      } else if (v.scheme === 'analogous') {
        items = [-30, -15, 0, 15, 30].map(x => [hslToHex(h + x, s, l), x === 0 ? '主色' : (x > 0 ? '+' : '') + x + '°']);
      } else if (v.scheme === 'triadic') {
        items = [0, 120, 240].map((x, i) => [hslToHex(h + x, s, l), ['主色', '三角 2', '三角 3'][i]]);
      } else if (v.scheme === 'split') {
        items = [0, 150, 210].map((x, i) => [hslToHex(h + x, s, l), ['主色', '分裂 2', '分裂 3'][i]]);
      } else if (v.scheme === 'tetradic') {
        items = [0, 90, 180, 270].map((x, i) => [hslToHex(h + x, s, l), ['主色', '四色 2', '四色 3', '四色 4'][i]]);
      } else {
        items = [85, 68, 50, 32, 18].map((x, i) => [hslToHex(h, s, x), ['最浅', '浅色', '主色', '深色', '最深'][i]]);
      }
      const list = items.map(([hex, label]) => ({ hex, label }));
      return [
        { type: 'html', title: '配色预览', value: swatchGrid(list) },
        TXT(list.map(x => `${x.hex}  ${x.label}`).join('\n'), '色值列表', 'palette.txt'),
        { type: 'note', value: '关系配色用于起稿和找方向，最终落地前请结合品牌色与对比度检查器确认可读性。' }
      ];
    }
  });

  /* ---------------- 3. CSS 阴影生成器 ---------------- */
  R('CSS 阴影生成器', {
    fields: [
      N('x', '水平偏移（px）', 0), N('y', '垂直偏移（px）', 8), N('blur', '模糊半径（px）', 24), N('spread', '扩散半径（px）', -8),
      I('color', '阴影颜色', '#1b1c18', { type: 'color' }), N('opacity', '不透明度（0 ~ 1）', .18, { min: 0, max: 1, step: .01 }),
      C('inset', '内阴影', false, '内阴影')
    ], live: true,
    run: v => {
      const css = `${Number(v.x) || 0}px ${Number(v.y) || 0}px ${Math.max(0, Number(v.blur) || 0)}px ${Number(v.spread) || 0}px ${rgba(normHex(v.color), Number(v.opacity) || 0)}${v.inset ? ' inset' : ''}`;
      const preview = `<div style="padding:34px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;display:grid;place-items:center">
        <div style="width:220px;height:130px;border-radius:12px;background:var(--surface);border:1px solid var(--line);box-shadow:${css};display:grid;place-items:center;color:var(--text-3);font-size:12px">shadow preview</div>
      </div>`;
      return [
        { type: 'html', title: '阴影预览', value: preview },
        TXT(`box-shadow: ${css};`, 'CSS 代码', 'shadow.css'),
        { type: 'note', value: '阴影的层数不宜过多；页面中同类元素的阴影建议复用同一组数值，避免视觉层级混乱。' }
      ];
    }
  });

  /* ---------------- 4. 圆角生成器 ---------------- */
  R('圆角生成器', {
    fields: [N('tl', '左上（px）', 14), N('tr', '右上（px）', 14), N('br', '右下（px）', 14), N('bl', '左下（px）', 14)],
    live: true,
    run: v => {
      const vals = [v.tl, v.tr, v.br, v.bl].map(x => Math.max(0, Number(x) || 0));
      const css = `border-radius: ${vals[0]}px ${vals[1]}px ${vals[2]}px ${vals[3]}px;`;
      const preview = `<div style="padding:30px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;display:grid;place-items:center">
        <div style="width:230px;height:140px;background:var(--accent-soft);border:1px solid var(--accent-line);${css}display:grid;place-items:center;color:var(--accent);font-size:12px">圆角预览</div>
      </div>`;
      return [
        { type: 'html', title: '圆角预览', value: preview },
        TXT(css, 'CSS 代码', 'radius.css'),
        { type: 'note', value: '大圆角适合卡片与弹层，小圆角适合按钮和输入框；同一页面建议控制在 2 到 3 种圆角规格。' }
      ];
    }
  });

  /* ---------------- 5. 字阶生成器 ---------------- */
  R('字阶生成器', {
    fields: [
      N('base', '基准字号（px）', 16, { min: 8, step: 1 }),
      S('ratio', '比例', [['1.125', '1.125 大二度'], ['1.2', '1.2 小三度'], ['1.25', '1.25 大三度'], ['1.333', '1.333 纯四度'], ['1.414', '1.414 增四度'], ['1.5', '1.5 纯五度'], ['1.618', '1.618 黄金比']], '1.25'),
      N('up', '向上级数', 5, { min: 1, max: 8, step: 1 }), N('down', '向下级数', 2, { min: 0, max: 4, step: 1 })
    ], live: true,
    run: v => {
      const base = Math.max(8, Number(v.base) || 16), ratio = Number(v.ratio) || 1.25;
      const up = Math.round(clamp(Number(v.up) || 0, 0, 8)), down = Math.round(clamp(Number(v.down) || 0, 0, 4));
      const rows = [], css = [], preview = [];
      for (let i = -down; i <= up; i++) {
        const size = r2(base * Math.pow(ratio, i));
        const name = i < 0 ? `down-${-i}` : i === 0 ? 'base' : `up-${i}`;
        rows.push([`--text-${name}`, size + 'px']);
        css.push(`  --text-${name}: ${size}px;`);
        preview.push(`<div style="display:flex;align-items:baseline;gap:14px;padding:7px 0;border-bottom:1px solid var(--line)">
          <span style="width:76px;flex:0 0 76px;font-family:var(--font-mono);font-size:10px;color:var(--text-3)">${name}</span>
          <span style="font-family:var(--font-serif);font-size:${size}px;line-height:1.25;color:var(--text)">设计系统 Aa</span>
          <span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;color:var(--text-3)">${size}px</span>
        </div>`);
      }
      return [
        { type: 'html', title: '字号预览', value: `<div style="padding:4px 0;overflow-x:auto">${preview.join('')}</div>` },
        KV(rows, '字号阶梯'),
        TXT(`:root {\n${css.join('\n')}\n}`, 'CSS 变量', 'type-scale.css'),
        { type: 'note', value: '正文建议不小于 14px；同一页面中字号层级保持 3 到 5 级足够。' }
      ];
    }
  });

  /* ---------------- 6. 间距阶梯生成器 ---------------- */
  R('间距阶梯生成器', {
    fields: [N('base', '基准间距（px）', 4, { min: 1, step: 1 }), N('steps', '级数', 8, { min: 3, max: 10, step: 1 })],
    live: true,
    run: v => {
      const base = Math.max(1, Number(v.base) || 4), steps = Math.round(clamp(Number(v.steps) || 8, 3, 10));
      const mult = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
      const rows = [], css = [], preview = [];
      for (let i = 0; i < steps; i++) {
        const px = base * mult[i];
        rows.push([`--space-${i + 1}`, px + 'px']);
        css.push(`  --space-${i + 1}: ${px}px;`);
        const width = clamp((px / (base * 32)) * 100, 2, 100);
        preview.push(`<div style="display:flex;align-items:center;gap:12px">
          <span style="width:72px;flex:0 0 72px;font-family:var(--font-mono);font-size:10px;color:var(--text-3)">space-${i + 1}</span>
          <div style="height:8px;border-radius:4px;background:var(--accent);width:${width}%"></div>
          <span style="width:46px;text-align:right;font-family:var(--font-mono);font-size:10px;color:var(--text-3)">${px}px</span>
        </div>`);
      }
      return [
        { type: 'html', title: '间距预览', value: `<div style="display:flex;flex-direction:column;gap:9px;padding:8px 0">${preview.join('')}</div>` },
        KV(rows, '间距 Token'),
        TXT(`:root {\n${css.join('\n')}\n}`, 'CSS 变量', 'spacing.css'),
        { type: 'note', value: '以 4px 或 8px 为基准建立阶梯，比逐个页面写任意间距更容易保持一致。' }
      ];
    }
  });

  /* ---------------- 7. px / rem 换算 ---------------- */
  R('px / rem 换算', {
    fields: [
      N('value', '数值', 16),
      S('mode', '换算方向', [['px2rem', 'px → rem'], ['rem2px', 'rem → px'], ['px2pt', 'px → pt'], ['pt2px', 'pt → px']], 'px2rem'),
      N('base', '根字号（px）', 16, { min: 8, step: 1 })
    ], live: true,
    run: v => {
      const base = Math.max(8, Number(v.base) || 16), val = Number(v.value) || 0;
      let px = val, rem = val / base, pt = val * .75;
      if (v.mode === 'rem2px') { px = val * base; rem = val; pt = px * .75; }
      if (v.mode === 'px2pt') { px = val; rem = px / base; pt = val * .75; }
      if (v.mode === 'pt2px') { px = val / .75; rem = px / base; pt = val; }
      const ref = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64].map(p => [p + 'px', r2(p / base) + 'rem', r2(p * .75) + 'pt']);
      return [
        KV([['px', r2(px) + 'px'], ['rem', r2(rem) + 'rem'], ['pt', r2(pt) + 'pt'], ['em（相对根字号）', r2(px / base) + 'em']], '换算结果'),
        { type: 'table', title: '常用尺寸对照', head: ['px', 'rem（根字号 ' + base + 'px）', 'pt'], rows: ref },
        { type: 'note', value: 'rem 取决于根字号；浏览器默认 16px，但用户可能修改默认字号，设计稿标注建议同时保留 px 与 rem。' }
      ];
    }
  });

  /* ---------------- 8. 栅格布局生成器 ---------------- */
  R('栅格布局生成器', {
    fields: [
      N('width', '容器最大宽度（px）', 1200, { min: 320, step: 1 }),
      N('columns', '列数', 12, { min: 2, max: 24, step: 1 }),
      N('gutter', '列间距（px）', 24, { min: 0, step: 1 }),
      N('margin', '两侧留白（px）', 24, { min: 0, step: 1 })
    ], live: true,
    run: v => {
      const width = Math.max(320, Number(v.width) || 1200), cols = Math.round(clamp(Number(v.columns) || 12, 2, 24));
      const gutter = Math.max(0, Number(v.gutter) || 0), margin = Math.max(0, Number(v.margin) || 0);
      const content = width - margin * 2;
      const colW = (content - gutter * (cols - 1)) / cols;
      const cells = Array.from({ length: cols }, (_, i) => `<div style="height:54px;border-radius:4px;background:var(--accent-soft);border:1px solid var(--accent-line);display:grid;place-items:center;font-family:var(--font-mono);font-size:10px;color:var(--accent)">${i + 1}</div>`).join('');
      const css = `.container {\n  width: 100%;\n  max-width: ${width}px;\n  margin: 0 auto;\n  padding: 0 ${margin}px;\n  display: grid;\n  grid-template-columns: repeat(${cols}, minmax(0, 1fr));\n  gap: ${gutter}px;\n}`;
      return [
        { type: 'html', title: '栅格预览', value: `<div style="overflow:auto;padding:10px 0"><div style="min-width:520px;padding:0 ${margin}px"><div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gutter}px">${cells}</div></div></div>` },
        KV([['容器宽度', width + 'px'], ['内容宽度', content + 'px'], ['单列宽度', r2(colW) + 'px'], ['列数 / 间距', cols + ' 列 / ' + gutter + 'px']], '计算参数'),
        TXT(css, 'CSS Grid 代码', 'grid.css'),
        { type: 'note', value: '单列宽度按“内容宽度减去全部列间距后均分”计算；如果内容宽度小于列间距总和，需要减少列数或调整间距。' }
      ];
    }
  });

  /* ---------------- 9. CSS 按钮生成器 ---------------- */
  R('CSS 按钮生成器', {
    fields: [
      I('label', '按钮文字', '开始使用'),
      I('bg', '背景色', '#2d5c4d', { type: 'color' }),
      I('fg', '文字颜色', '#fdfdf8', { type: 'color' }),
      N('radius', '圆角（px）', 8, { min: 0, step: 1 }),
      N('px', '左右内边距（px）', 18, { min: 0, step: 1 }),
      N('py', '上下内边距（px）', 10, { min: 0, step: 1 }),
      N('fs', '字号（px）', 14, { min: 10, step: 1 }),
      S('shadow', '阴影', [['none', '无'], ['soft', '轻阴影'], ['strong', '悬浮阴影']], 'soft')
    ], live: true,
    run: v => {
      const bg = normHex(v.bg), fg = normHex(v.fg), radius = Math.max(0, Number(v.radius) || 0);
      const px = Math.max(0, Number(v.px) || 0), py = Math.max(0, Number(v.py) || 0), fs = Math.max(10, Number(v.fs) || 14);
      const hover = darken(bg, .1);
      const shadow = v.shadow === 'strong' ? '0 10px 26px rgba(0,0,0,.22)' : v.shadow === 'soft' ? '0 4px 12px rgba(0,0,0,.12)' : 'none';
      const cls = 'ds-btn-demo';
      const css = `.${cls} {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: ${py}px ${px}px;\n  border: 0;\n  border-radius: ${radius}px;\n  background: ${bg};\n  color: ${fg};\n  font-size: ${fs}px;\n  font-weight: 600;\n  line-height: 1.4;\n  cursor: pointer;\n  box-shadow: ${shadow};\n  transition: background .16s, transform .16s;\n}\n.${cls}:hover {\n  background: ${hover};\n  transform: translateY(-1px);\n}`;
      const html = `<button class="${cls}">${esc(v.label || '按钮')}</button>`;
      return [
        { type: 'html', title: '按钮预览', value: `<style>${css}</style><div style="padding:28px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;text-align:center">${html}</div>` },
        TXT(css, 'CSS 代码', 'button.css'),
        TXT(html, 'HTML 代码', 'button.html'),
        { type: 'note', value: '按钮文字建议控制在 2 到 6 个字；同一页面主按钮只保留一个，其余使用次要按钮样式。' }
      ];
    }
  });

  /* ---------------- 10. 文本阴影生成器 ---------------- */
  R('文本阴影生成器', {
    fields: [
      N('x', '水平偏移（px）', 0), N('y', '垂直偏移（px）', 3), N('blur', '模糊（px）', 10),
      I('color', '阴影颜色', '#1b1c18', { type: 'color' }), N('opacity', '不透明度（0 ~ 1）', .18, { min: 0, max: 1, step: .01 })
    ], live: true,
    run: v => {
      const css = `${Number(v.x) || 0}px ${Number(v.y) || 0}px ${Math.max(0, Number(v.blur) || 0)}px ${rgba(normHex(v.color), Number(v.opacity) || 0)}`;
      const preview = `<div style="padding:34px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;text-align:center">
        <div style="font-family:var(--font-serif);font-size:40px;line-height:1.4;color:var(--text);text-shadow:${css}">文字阴影 Text</div>
      </div>`;
      return [
        { type: 'html', title: '预览', value: preview },
        TXT(`text-shadow: ${css};`, 'CSS 代码', 'text-shadow.css'),
        { type: 'note', value: '文字阴影主要用于提升复杂背景上的可读性，避免在正文大面积使用。' }
      ];
    }
  });

  /* ---------------- 11. CSS 滤镜生成器 ---------------- */
  R('CSS 滤镜生成器', {
    fields: [
      N('brightness', '亮度（%）', 100, { min: 0, max: 200 }),
      N('contrast', '对比度（%）', 100, { min: 0, max: 200 }),
      N('saturate', '饱和度（%）', 100, { min: 0, max: 200 }),
      N('blur', '模糊（px）', 0, { min: 0, max: 20, step: .5 }),
      N('hue', '色相旋转（度）', 0, { min: 0, max: 360 }),
      N('grayscale', '灰度（%）', 0, { min: 0, max: 100 }),
      N('sepia', '褐色（%）', 0, { min: 0, max: 100 })
    ], live: true,
    run: v => {
      const f = `brightness(${Number(v.brightness) || 0}%) contrast(${Number(v.contrast) || 0}%) saturate(${Number(v.saturate) || 0}%) blur(${Number(v.blur) || 0}px) hue-rotate(${Number(v.hue) || 0}deg) grayscale(${Number(v.grayscale) || 0}%) sepia(${Number(v.sepia) || 0}%)`;
      const scene = `<svg viewBox="0 0 320 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="滤镜预览图">
        <rect width="320" height="200" fill="#e7efea"/>
        <circle cx="78" cy="66" r="38" fill="#d9a441"/>
        <path d="M0 200 L92 104 L168 168 L236 112 L320 200Z" fill="#4c7f6d"/>
        <rect x="196" y="36" width="76" height="76" rx="14" fill="#b65c3f"/>
        <text x="20" y="188" font-size="15" fill="#1b1c18" font-family="sans-serif">Aa 设计预览</text>
      </svg>`;
      return [
        { type: 'html', title: '滤镜预览', value: `<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden"><div style="filter:${f}">${scene}</div></div>` },
        TXT(`filter: ${f};`, 'CSS 代码', 'filter.css'),
        { type: 'note', value: '滤镜会作用于整个元素及其子元素；模糊值过大时边缘可能出现透明裁切，可给容器留出 padding。' }
      ];
    }
  });

  /* ---------------- 12. 缓动曲线生成器 ---------------- */
  R('缓动曲线生成器', {
    fields: [
      N('x1', '控制点 1 X', .4, { min: 0, max: 1, step: .01 }), N('y1', '控制点 1 Y', 0, { min: -1, max: 2, step: .01 }),
      N('x2', '控制点 2 X', .2, { min: 0, max: 1, step: .01 }), N('y2', '控制点 2 Y', 1, { min: -1, max: 2, step: .01 }),
      N('duration', '演示时长（ms）', 700, { min: 100, max: 5000, step: 100 })
    ], live: true,
    run: v => {
      const x1 = clamp(Number(v.x1) || 0, 0, 1), y1 = Number(v.y1) || 0;
      const x2 = clamp(Number(v.x2) || 0, 0, 1), y2 = Number(v.y2) || 0;
      const dur = clamp(Number(v.duration) || 700, 100, 5000);
      const cb = `cubic-bezier(${r2(x1)}, ${r2(y1)}, ${r2(x2)}, ${r2(y2)})`;
      const W = 280, H = 280, pad = 20;
      const sx = W - pad * 2, sy = H - pad * 2;
      const px = n => pad + n * sx;
      const py = n => H - pad - n * sy;
      const clampY = n => clamp(n, -.15, 1.15);
      const curve = `M ${px(0)} ${py(0)} C ${px(x1)} ${py(clampY(y1))}, ${px(x2)} ${py(clampY(y2))}, ${px(1)} ${py(1)}`;
      const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:300px" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="var(--surface-2)" rx="8"/>
        <g stroke="var(--line)" stroke-width="1">${[.25, .5, .75].map(t => `<line x1="${px(t)}" y1="${pad}" x2="${px(t)}" y2="${H - pad}"/><line x1="${pad}" y1="${py(t)}" x2="${W - pad}" y2="${py(t)}"/>`).join('')}</g>
        <rect x="${pad}" y="${pad}" width="${sx}" height="${sy}" fill="none" stroke="var(--line-strong)"/>
        <path d="${curve}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="${px(0)}" y1="${py(0)}" x2="${px(x1)}" y2="${py(clampY(y1))}" stroke="var(--text-3)" stroke-width="1"/>
        <line x1="${px(1)}" y1="${py(1)}" x2="${px(x2)}" y2="${py(clampY(y2))}" stroke="var(--text-3)" stroke-width="1"/>
        <circle cx="${px(x1)}" cy="${py(clampY(y1))}" r="4" fill="var(--accent)"/>
        <circle cx="${px(x2)}" cy="${py(clampY(y2))}" r="4" fill="var(--accent)"/>
      </svg>`;
      const demo = `<div style="display:flex;align-items:center;gap:14px;padding:18px 10px">
        <div style="flex:1;height:6px;background:var(--surface-3);border-radius:4px;position:relative;overflow:hidden">
          <div style="position:absolute;top:0;left:0;width:22px;height:6px;border-radius:4px;background:var(--accent);animation:ds-cb-move ${dur}ms ${cb} infinite alternate"></div>
        </div>
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-3)">${dur}ms</span>
      </div><style>@keyframes ds-cb-move{from{transform:translateX(0)}to{transform:translateX(min(240px, 60vw))}}</style>`;
      return [
        { type: 'html', title: '曲线与演示', value: `<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center;padding:6px 0">${svg}<div style="flex:1;min-width:200px">${demo}<div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-3);text-align:center;margin-top:8px">${cb}</div></div></div>` },
        TXT(`transition-timing-function: ${cb};\ntransition-duration: ${dur}ms;`, 'CSS 代码', 'easing.css'),
        { type: 'note', value: 'X 值必须在 0 到 1 之间；Y 值超出 0 到 1 会产生回弹或预判效果，适合强调型动效。' }
      ];
    }
  });

  /* ---------------- 13. SVG 图案生成器 ---------------- */
  R('SVG 图案生成器', {
    fields: [
      S('type', '图案类型', [['dots', '圆点'], ['grid', '网格'], ['h', '横线'], ['v', '竖线'], ['cross', '十字'], ['checker', '棋盘'], ['waves', '波浪']], 'dots'),
      N('size', '单元尺寸（px）', 24, { min: 6, max: 120, step: 1 }),
      I('fg', '图案颜色', '#2d5c4d', { type: 'color' }),
      I('bg', '背景颜色', '#f4f3ee', { type: 'color' }),
      N('stroke', '线宽 / 点径（px）', 1.6, { min: .5, max: 10, step: .1 })
    ], live: true,
    run: v => {
      const s = Math.max(6, Number(v.size) || 24), fg = normHex(v.fg), bg = normHex(v.bg), sw = Math.max(.5, Number(v.stroke) || 1.6);
      let content = '';
      if (v.type === 'dots') content = `<circle cx="${s / 2}" cy="${s / 2}" r="${sw}" fill="${fg}"/>`;
      else if (v.type === 'grid') content = `<path d="M ${s} 0 L 0 0 L 0 ${s}" fill="none" stroke="${fg}" stroke-width="${sw}"/>`;
      else if (v.type === 'h') content = `<path d="M0 ${s / 2} H${s}" fill="none" stroke="${fg}" stroke-width="${sw}"/>`;
      else if (v.type === 'v') content = `<path d="M${s / 2} 0 V${s}" fill="none" stroke="${fg}" stroke-width="${sw}"/>`;
      else if (v.type === 'cross') content = `<path d="M0 ${s / 2} H${s} M${s / 2} 0 V${s}" fill="none" stroke="${fg}" stroke-width="${sw}"/>`;
      else if (v.type === 'checker') content = `<rect width="${s / 2}" height="${s / 2}" fill="${fg}"/><rect x="${s / 2}" y="${s / 2}" width="${s / 2}" height="${s / 2}" fill="${fg}"/>`;
      else content = `<path d="M0 ${s * .7} Q ${s * .25} ${s * .2} ${s * .5} ${s * .7} T ${s} ${s * .7}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round"/>`;
      const defs = `<pattern id="ds-pat" width="${s}" height="${s}" patternUnits="userSpaceOnUse">${content}</pattern>`;
      const tile = s;
      const preview = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="100%" style="display:block;height:auto" role="img" aria-label="图案预览"><defs>${defs}</defs><rect width="480" height="200" fill="${bg}"/><rect width="480" height="200" fill="url(#ds-pat)"/></svg>`;
      const file = `<svg xmlns="http://www.w3.org/2000/svg" width="${s * 8}" height="${s * 8}" viewBox="0 0 ${s * 8} ${s * 8}"><defs>${defs}</defs><rect width="100%" height="100%" fill="${bg}"/><rect width="100%" height="100%" fill="url(#ds-pat)"/></svg>`;
      return [
        { type: 'html', title: '图案预览', value: `<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden">${preview}</div>` },
        { type: 'file', blob: new Blob([file], { type: 'image/svg+xml' }), name: 'pattern.svg', title: '下载 SVG 图案' },
        KV([['单元尺寸', s + 'px'], ['图案颜色', fg], ['背景颜色', bg]], '图案参数'),
        { type: 'note', value: '下载的 SVG 为 8×8 个单元的平铺片段，可直接作为 CSS background-image 或导入设计软件继续编辑。' }
      ];
    }
  });

  /* ---------------- 14. 占位图生成器 ---------------- */
  R('占位图生成器', {
    fields: [
      N('w', '宽度（px）', 800, { min: 16, max: 4096, step: 1 }), N('h', '高度（px）', 600, { min: 16, max: 4096, step: 1 }),
      I('bg', '背景色', '#e7efea', { type: 'color' }), I('fg', '文字颜色', '#2d5c4d', { type: 'color' }),
      I('text', '文字（留空显示尺寸）', ''), C('sizeText', '显示尺寸', true, '显示尺寸')
    ], live: true,
    run: v => {
      const w = Math.round(clamp(Number(v.w) || 800, 16, 4096)), h = Math.round(clamp(Number(v.h) || 600, 16, 4096));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = normHex(v.bg); ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) / 300)); ctx.strokeRect(0, 0, w, h);
      const label = (String(v.text || '').trim() || (v.sizeText ? `${w} × ${h}` : ''));
      if (label) {
        ctx.fillStyle = normHex(v.fg);
        let fs = Math.min(w, h) * .13;
        ctx.font = `600 ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;
        while (ctx.measureText(label).width > w * .82 && fs > 8) { fs -= 1; ctx.font = `600 ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`; }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, w / 2, h / 2);
      }
      return [
        { type: 'image', src: cv.toDataURL('image/png'), name: `placeholder-${w}x${h}.png`, title: '占位图预览' },
        KV([['尺寸', `${w} × ${h}`], ['比例', r2(w / h) + ' : 1']], '图片参数'),
        { type: 'note', value: '占位图用于排版预览；需要无限放大时请改用 SVG 占位或直接在设计中画框。' }
      ];
    }
  });

  /* ---------------- 15. Favicon 生成器 ---------------- */
  R('Favicon 生成器', {
    fields: [
      I('text', '图标文字（1 到 2 字）', '拾'), I('site', '站点名称', '我的站点'), I('bg', '背景色', '#2d5c4d', { type: 'color' }), I('fg', '文字色', '#fdfdf8', { type: 'color' }),
      S('shape', '形状', [['rounded', '圆角方形'], ['circle', '圆形'], ['square', '方形']], 'rounded')
    ], live: true,
    run: v => {
      const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
      const bg = normHex(v.bg), fg = normHex(v.fg), text = String(v.text || '').trim().slice(0, 2);
      const items = [];
      const draw = size => {
        const cv = document.createElement('canvas'); cv.width = cv.height = size;
        const c = cv.getContext('2d');
        c.clearRect(0, 0, size, size);
        c.fillStyle = bg;
        if (v.shape === 'circle') { c.beginPath(); c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); c.fill(); }
        else if (v.shape === 'rounded') { const r = size * .22; c.beginPath(); c.roundRect ? c.roundRect(0, 0, size, size, r) : c.rect(0, 0, size, size); c.fill(); }
        else c.fillRect(0, 0, size, size);
        c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
        let fs = size * (text.length > 1 ? .5 : .62);
        c.font = `700 ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;
        while (c.measureText(text).width > size * .74 && fs > 4) { fs -= 1; c.font = `700 ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`; }
        c.fillText(text, size / 2, size / 2 + size * .03);
        return cv.toDataURL('image/png');
      };
      sizes.forEach(size => items.push({ src: draw(size), name: `favicon-${size}.png` }));
      const zip = async () => {
        if (!window.JSZip) return T.toast('ZIP 组件未加载', 'err');
        const z = new window.JSZip();
        sizes.forEach(size => z.file(`favicon-${size}.png`, items.find(x => x.name === `favicon-${size}.png`).src.split(',')[1], { base64: true }));
        const blob = await z.generateAsync({ type: 'blob' });
        T.save(blob, 'favicons.zip');
      };
      const snippet = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">\n<link rel="manifest" href="/site.webmanifest">`;
      const manifest = JSON.stringify({
        name: String(v.site || '').trim() || '站内工具',
        short_name: (String(v.site || '').trim() || '站内工具').slice(0, 12),
        icons: [
          { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/favicon-512.png', sizes: '512x512', type: 'image/png' }
        ],
        theme_color: bg,
        background_color: '#ffffff',
        display: 'standalone'
      }, null, 2);
      return [
        { type: 'images', title: '图标预览 · 可单张下载或打包', items, zip },
        TXT(snippet, 'HTML 引用代码', 'favicon.html'),
        TXT(manifest, 'site.webmanifest', 'site.webmanifest'),
        { type: 'note', value: '16px 下文字容易糊，建议用单字或极简图形；把 PNG 与 manifest 放到站点根目录后再引用。' }
      ];
    }
  });

  /* ---------------- 16. OG 分享卡片生成器 ---------------- */
  R('OG 分享卡片生成器', {
    fields: [
      I('title', '标题', '拾器 ToolBox'), I('subtitle', '副标题', '十三类本地小工具，打开即用'), I('site', '站点名', '拾器 ToolBox'),
      I('bg', '背景色', '#f4f3ee', { type: 'color' }), I('fg', '文字色', '#1b1c18', { type: 'color' }), I('accent', '强调色', '#2d5c4d', { type: 'color' })
    ], live: true,
    run: v => {
      const W = 1200, H = 630;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      const bg = normHex(v.bg), fg = normHex(v.fg), accent = normHex(v.accent);
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.fillStyle = accent; c.fillRect(0, 0, W, 12);
      c.fillStyle = accent; c.fillRect(80, 78, 54, 54);
      c.fillStyle = fg; c.font = '600 24px "PingFang SC","Microsoft YaHei",sans-serif'; c.textBaseline = 'middle';
      c.fillText(String(v.site || '').slice(0, 30), 152, 106);
      const wrap = (text, maxWidth) => {
        const lines = []; let line = '';
        for (const ch of String(text || '')) {
          if (line && c.measureText(line + ch).width > maxWidth) { lines.push(line); line = ch; }
          else line += ch;
        }
        if (line) lines.push(line);
        return lines.slice(0, 3);
      };
      c.textBaseline = 'alphabetic';
      c.fillStyle = fg; c.font = '700 64px "PingFang SC","Microsoft YaHei",sans-serif';
      const lines = wrap(v.title, 1000);
      lines.forEach((line, i) => c.fillText(line, 80, 240 + i * 76));
      c.fillStyle = mix(fg, bg, .35); c.font = '400 30px "PingFang SC","Microsoft YaHei",sans-serif';
      wrap(v.subtitle, 1000).slice(0, 2).forEach((line, i) => c.fillText(line, 80, 240 + lines.length * 76 + 26 + i * 44));
      c.fillStyle = accent; c.fillRect(80, 590, 56, 3);
      c.fillStyle = mix(fg, bg, .3); c.font = '400 20px "PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText('LOCAL FIRST · NO UPLOAD', 154, 600);
      return [
        { type: 'image', src: cv.toDataURL('image/png'), name: 'og-card.png', title: '分享卡片预览（1200 × 630）' },
        TXT(`<meta property="og:title" content="${esc(v.title)}">\n<meta property="og:description" content="${esc(v.subtitle)}">\n<meta property="og:image" content="https://example.com/og-card.png">\n<meta property="og:type" content="website">\n<meta name="twitter:card" content="summary_large_image">`, 'Meta 标签', 'og-meta.html'),
        { type: 'note', value: '生成的是 PNG 图片，需要自行上传到可公开访问的地址后，再把 og:image 换为真实链接。' }
      ];
    }
  });

  /* ---------------- 17. 色盲模拟器 ---------------- */
  R('色盲模拟器', {
    fields: [
      I('color', '待检查颜色', '#b65c3f', { type: 'color' }),
      S('mode', '色觉类型', [['protanopia', '红色盲（Protanopia）'], ['deuteranopia', '绿色盲（Deuteranopia）'], ['tritanopia', '蓝色盲（Tritanopia）'], ['achromatopsia', '全色盲（Achromatopsia）']], 'deuteranopia')
    ], live: true,
    run: v => {
      const hex = normHex(v.color), { r, g, b } = hexToRgb(hex);
      const mat = {
        protanopia: [[.567, .433, 0], [.558, .442, 0], [0, .242, .758]],
        deuteranopia: [[.625, .375, 0], [.7, .3, 0], [0, .3, .7]],
        tritanopia: [[.95, .05, 0], [0, .433, .567], [0, .475, .525]],
        achromatopsia: [[.299, .587, .114], [.299, .587, .114], [.299, .587, .114]]
      }[v.mode] || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      const sim = rgbToHex(
        mat[0][0] * r + mat[0][1] * g + mat[0][2] * b,
        mat[1][0] * r + mat[1][1] * g + mat[1][2] * b,
        mat[2][0] * r + mat[2][1] * g + mat[2][2] * b
      );
      const items = [{ hex, label: '原始颜色' }, { hex: sim, label: '模拟结果' }];
      return [
        { type: 'html', title: '模拟对比', value: swatchGrid(items) },
        KV([['原始色值', hex], ['模拟色值', sim], ['与白色对比度', contrast(sim, '#ffffff').toFixed(2) + ':1'], ['与黑色对比度', contrast(sim, '#000000').toFixed(2) + ':1']], '检查结果'),
        { type: 'note', value: '色觉模拟为近似算法，用于发现仅靠颜色区分的信息；重要状态请同时使用文字、图标或明度差。' }
      ];
    }
  });

  /* ---------------- 18. 设计 Token 导出器 ---------------- */
  R('设计 Token 导出器', {
    fields: [
      X('colors', '颜色 Token（每行：名称 色值）', 'primary #2d5c4d\naccent #b65c3f\nsurface #fffefb\ntext #1b1c18', { rows: 5 }),
      N('spaceBase', '间距基准（px）', 4, { min: 1, step: 1 }),
      X('fontSizes', '字号列表（逗号分隔）', '12, 14, 16, 20, 24, 32, 40', { rows: 2 })
    ], live: true,
    run: v => {
      const colors = String(v.colors || '').split('\n').map(line => line.trim()).filter(Boolean).map((line, i) => {
        const m = line.match(/^(\S+)\s+(?:#)?([0-9a-fA-F]{3,8})$/);
        if (!m) return null;
        const raw = m[2].length === 3 ? m[2].split('').map(c => c + c).join('') : m[2];
        const hex = '#' + raw.slice(0, 6);
        let name = m[1].toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        if (!name) name = 'color-' + (i + 1);
        return { name, hex };
      }).filter(Boolean);
      if (!colors.length) colors.push({ name: 'primary', hex: '#2d5c4d' });
      const base = Math.max(1, Number(v.spaceBase) || 4);
      const spaces = [1, 2, 3, 4, 6, 8, 12, 16].map((m, i) => ({ name: 'space-' + (i + 1), value: base * m }));
      const sizes = String(v.fontSizes || '').split(/[,，\s]+/).map(Number).filter(n => n > 0);
      const css = [':root {'];
      colors.forEach(c => css.push(`  --color-${c.name}: ${c.hex};`));
      spaces.forEach(s => css.push(`  --${s.name}: ${s.value}px;`));
      sizes.forEach((s, i) => css.push(`  --text-${i + 1}: ${s}px;`));
      css.push('}');
      const json = {
        color: Object.fromEntries(colors.map(c => [c.name, c.hex])),
        spacing: Object.fromEntries(spaces.map(s => [s.name, s.value + 'px'])),
        fontSize: Object.fromEntries(sizes.map((s, i) => ['text-' + (i + 1), s + 'px']))
      };
      const rows = colors.map(c => ['color-' + c.name, c.hex]).concat(spaces.map(s => [s.name, s.value + 'px'])).concat(sizes.map((s, i) => ['text-' + (i + 1), s + 'px']));
      return [
        TXT(css.join('\n'), 'CSS 变量', 'design-tokens.css'),
        TXT(JSON.stringify(json, null, 2), 'JSON', 'design-tokens.json'),
        { type: 'table', title: 'Token 列表', head: ['名称', '值'], rows },
        { type: 'note', value: '名称会转换为小写 ASCII 与连字符；中文名称会自动回退为 color-N、text-N，建议直接使用英文命名。' }
      ];
    }
  });

  /* ---------------- 19. 图片主色提取 ---------------- */
  R('图片主色提取', {
    fields: [F('file', '选择图片', { accept: 'image/*' }), N('count', '提取数量', 6, { min: 3, max: 10, step: 1 })],
    run: async v => {
      if (!v.file) throw new Error('请选择图片');
      const { img, url } = await T.fileToImage(v.file);
      try {
        const maxSide = 100;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.naturalWidth * scale));
        cv.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = cv.getContext('2d'); c.drawImage(img, 0, 0, cv.width, cv.height);
        const data = c.getImageData(0, 0, cv.width, cv.height).data;
        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          const key = (data[i] >> 4) + ',' + (data[i + 1] >> 4) + ',' + (data[i + 2] >> 4);
          const b = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
          b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; b.n++;
          buckets.set(key, b);
        }
        const sorted = [...buckets.values()].map(b => ({ hex: rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n), n: b.n })).sort((a, b) => b.n - a.n);
        if (!sorted.length) throw new Error('图片没有可读取的像素，请换一张不透明的图片');
        const count = Math.round(clamp(Number(v.count) || 6, 3, 10));
        const picked = [];
        for (const c of sorted) {
          if (picked.length >= count) break;
          if (picked.every(p => {
            const a = hexToRgb(p.hex), b = hexToRgb(c.hex);
            return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) > 38;
          })) picked.push(c);
        }
        for (const c of sorted) { if (picked.length >= count) break; if (!picked.includes(c)) picked.push(c); }
        const total = sorted.reduce((s, x) => s + x.n, 0);
        const items = picked.map((x, i) => ({ hex: x.hex, label: `主色 ${i + 1} · ${(x.n / total * 100).toFixed(1)}%` }));
        return [
          { type: 'html', title: '主色板', value: swatchGrid(items) },
          TXT(picked.map(x => x.hex).join('\n'), 'HEX 列表', 'palette.txt'),
          { type: 'note', value: '颜色按出现频率与视觉差异筛选，适合找方向；需要精确品牌色时请用拾色器手动取色。' }
        ];
      } finally { URL.revokeObjectURL(url); }
    }
  });

  /* ---------------- 20. 图片比例计算器 ---------------- */
  R('图片比例计算器', {
    fields: [N('w', '宽度（px）', 1200, { min: 1, step: 1 }), N('h', '高度（px）', 800, { min: 1, step: 1 })],
    live: true,
    run: v => {
      const w = Math.max(1, Number(v.w) || 1200), h = Math.max(1, Number(v.h) || 800);
      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      const g = gcd(Math.round(w), Math.round(h)) || 1;
      const rw = Math.round(w / g), rh = Math.round(h / g);
      const widths = [320, 480, 640, 768, 960, 1024, 1280, 1440, 1920];
      return [
        KV([['宽高比', `${rw} : ${rh}`], ['小数比例', r2(w / h)], ['CSS', `aspect-ratio: ${rw} / ${rh};`], ['方向', w === h ? '正方形' : w > h ? '横向' : '纵向']], '比例结果'),
        { type: 'table', title: '按比例适配常用宽度', head: ['宽度', '高度', 'CSS'], rows: widths.map(x => [x + 'px', r2(x * h / w) + 'px', `aspect-ratio: ${rw} / ${rh}`]) },
        { type: 'note', value: '宽高比通常用互质的整数表示；图片容器使用 aspect-ratio 可以在响应式布局中提前占位，避免布局抖动。' }
      ];
    }
  });

  /* ---------------- 21. 玻璃卡片生成器 ---------------- */
  R('玻璃卡片生成器', {
    fields: [
      N('blur', '模糊半径（px）', 16, { min: 0, max: 40, step: 1 }),
      I('color', '底色', '#ffffff', { type: 'color' }),
      I('fg', '文字色', '#1b1c18', { type: 'color' }),
      N('opacity', '底色不透明度（0 ~ 1）', .2, { min: 0, max: 1, step: .01 }),
      N('border', '描边不透明度（0 ~ 1）', .3, { min: 0, max: 1, step: .01 }),
      N('radius', '圆角（px）', 16, { min: 0, step: 1 }),
      S('shadow', '阴影', [['none', '无'], ['soft', '轻阴影'], ['strong', '悬浮阴影']], 'soft')
    ], live: true,
    run: v => {
      const blur = clamp(Number(v.blur) || 0, 0, 40), radius = Math.max(0, Number(v.radius) || 0);
      const bg = rgba(normHex(v.color), Number(v.opacity) || 0);
      const border = rgba(normHex(v.color), Number(v.border) || 0);
      const fg = normHex(v.fg);
      const shadow = v.shadow === 'strong' ? '0 22px 50px rgba(0,0,0,.3)' : v.shadow === 'soft' ? '0 10px 28px rgba(0,0,0,.16)' : 'none';
      const shapes = `<div style="position:absolute;inset:0;overflow:hidden;background:var(--surface-3)">
        <div style="position:absolute;width:160px;height:160px;border-radius:50%;background:#b65c3f;left:8%;top:12%"></div>
        <div style="position:absolute;width:190px;height:190px;border-radius:50%;background:#2d5c4d;right:6%;bottom:8%"></div>
        <div style="position:absolute;width:110px;height:110px;border-radius:22px;background:#d9a441;left:48%;top:8%;transform:rotate(18deg)"></div>
      </div>`;
      const card = `<div style="position:relative;padding:26px;border-radius:${radius}px;background:${bg};border:1px solid ${border};backdrop-filter:blur(${blur}px);-webkit-backdrop-filter:blur(${blur}px);box-shadow:${shadow}">
        <div style="font-family:var(--font-serif);font-size:22px;color:${fg}">玻璃卡片</div>
        <div style="font-size:12px;color:${fg};opacity:.72;margin-top:6px">backdrop-filter 预览</div>
      </div>`;
      const css = `.glass-card {\n  padding: 26px;\n  border-radius: ${radius}px;\n  background: ${bg};\n  border: 1px solid ${border};\n  color: ${fg};\n  backdrop-filter: blur(${blur}px);\n  -webkit-backdrop-filter: blur(${blur}px);\n  box-shadow: ${shadow};\n}`;
      return [
        { type: 'html', title: '效果预览', value: `<div style="position:relative;border:1px solid var(--line);border-radius:10px;overflow:hidden;padding:34px;min-height:260px;display:grid;place-items:center">${shapes}<div style="position:relative;width:min(320px,100%)">${card}</div></div>` },
        TXT(css, 'CSS 代码', 'glass.css'),
        { type: 'note', value: 'backdrop-filter 需要元素背后有内容才能看出模糊效果；低版本浏览器不支持时会退化为半透明底色，建议提供纯色回退。' }
      ];
    }
  });

  /* ---------------- 22. 响应式断点生成器 ---------------- */
  R('响应式断点生成器', {
    fields: [
      S('preset', '断点方案', [['bootstrap', 'Bootstrap'], ['tailwind', 'Tailwind CSS'], ['custom', '自定义']], 'bootstrap'),
      X('custom', '自定义断点（px，逗号分隔）', '480, 768, 1024, 1280, 1440', { rows: 2 })
    ], live: true,
    run: v => {
      let list;
      if (v.preset === 'tailwind') {
        list = [['sm', 640], ['md', 768], ['lg', 1024], ['xl', 1280], ['2xl', 1536]];
      } else if (v.preset === 'custom') {
        list = String(v.custom || '').split(/[,，\s]+/).map(Number).filter(n => n > 0).sort((a, b) => a - b).map((n, i) => ['bp-' + (i + 1), n]);
      } else {
        list = [['sm', 576], ['md', 768], ['lg', 992], ['xl', 1200], ['xxl', 1400]];
      }
      const css = list.map(([name, px]) => `@media (min-width: ${px}px) {\n  /* ${name} */\n}`).join('\n\n');
      return [
        { type: 'table', title: '断点列表', head: ['名称', '最小宽度', '媒体查询'], rows: list.map(([name, px]) => [name, px + 'px', `@media (min-width: ${px}px)`]) },
        TXT(css, '媒体查询代码', 'breakpoints.css'),
        { type: 'note', value: '断点应按内容布局的“撑不住”的位置来定，而不是照搬设备宽度；优先使用 min-width 从小到大覆盖。' }
      ];
    }
  });
})();
