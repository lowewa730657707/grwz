/* ============================================================
   工具实现：设计工具（进阶）
   规范、动效、素材导出与内容辅助
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const X = (key, label, def, extra) => Object.assign({ key, label, type: 'textarea', def, rows: 5 }, extra || {});
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file' }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const TXT = (value, title, download) => ({ type: 'text', value, title, download });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r2 = n => Math.round(n * 100) / 100;
  const esc = T.esc;

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
  const normHex = v => { const { r, g, b } = hexToRgb(v); return rgbToHex(r, g, b); };
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
  function lum(hex) {
    const { r, g, b } = hexToRgb(hex);
    const c = [r, g, b].map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  function contrast(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
  }
  function rgba(hex, a) { const { r, g, b } = hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${r2(a)})`; }
  function swatchGrid(items) {
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px">${items.map(x => `
      <div style="border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--surface)">
        <div style="height:64px;background:${x.hex}"></div>
        <div style="padding:6px 8px"><div style="font-size:11px;color:var(--text-2)">${esc(x.label || '')}</div><div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-3)">${x.hex}</div></div>
      </div>`).join('')}</div>`;
  }
  function parseColors(text) {
    return String(text || '').split(/\n+/).map(line => {
      const m = line.match(/#?([0-9a-f]{6}|[0-9a-f]{3})\b/i);
      return m ? normHex(m[1]) : null;
    }).filter(Boolean);
  }

  /* ---------------- 1. 色板明度阶梯 ---------------- */
  R('色板明度阶梯', {
    fields: [I('base', '基准色', '#2d5c4d', { type: 'color' }), N('steps', '阶梯数量', 9, { min: 3, max: 13, step: 1 })],
    live: true,
    run: v => {
      const base = normHex(v.base), n = Math.round(clamp(Number(v.steps) || 9, 3, 13));
      const items = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const hex = t < .5 ? mix('#ffffff', base, t * 2) : mix(base, '#000000', (t - .5) * 2);
        items.push({ hex, label: `阶梯 ${i + 1}` });
      }
      return [
        { type: 'html', title: '明度阶梯', value: swatchGrid(items) },
        TXT(items.map((x, i) => `--brand-${i + 1}: ${x.hex};`).join('\n'), 'CSS 变量', 'brand-scale.css'),
        { type: 'note', value: '从白到黑沿同一色相过渡，适合做品牌色的浅色底、主色与深色文字；正式使用前请用对比度检查器验证文字层级。' }
      ];
    }
  });

  /* ---------------- 2. 暗色模式配色转换 ---------------- */
  R('暗色模式配色转换', {
    fields: [
      I('bg', '浅色背景', '#f4f3ee', { type: 'color' }),
      I('text', '浅色文字', '#1b1c18', { type: 'color' }),
      I('accent', '主色', '#2d5c4d', { type: 'color' })
    ], live: true,
    run: v => {
      const bg = normHex(v.bg), text = normHex(v.text), accent = normHex(v.accent);
      const [hb, sb] = rgbToHsl(bg), [ht, st] = rgbToHsl(text), [ha, sa] = rgbToHsl(accent);
      const tokens = {
        bg: hslToHex(hb, Math.min(sb, 16), 8),
        surface: hslToHex(hb, Math.min(sb, 18), 12),
        line: hslToHex(hb, Math.min(sb, 20), 22),
        text: hslToHex(ht, Math.min(st, 12), 90),
        muted: hslToHex(ht, Math.min(st, 10), 62),
        accent: hslToHex(ha, clamp(sa, 30, 82), 62)
      };
      const preview = `<div style="background:${tokens.bg};padding:22px;border-radius:10px;border:1px solid ${tokens.line}">
        <div style="background:${tokens.surface};border:1px solid ${tokens.line};border-radius:8px;padding:16px">
          <div style="font-family:var(--font-serif);font-size:20px;color:${tokens.text}">暗色模式预览</div>
          <div style="font-size:12px;color:${tokens.muted};margin-top:5px">正文与次要信息使用不同明度</div>
          <span style="display:inline-block;margin-top:12px;padding:5px 12px;border-radius:6px;background:${tokens.accent};color:${tokens.bg};font-size:12px">主色操作</span>
        </div>
      </div>`;
      const css = `:root {\n  --bg: ${tokens.bg};\n  --surface: ${tokens.surface};\n  --line: ${tokens.line};\n  --text: ${tokens.text};\n  --text-muted: ${tokens.muted};\n  --accent: ${tokens.accent};\n}`;
      return [
        { type: 'html', title: '暗色预览', value: preview },
        { type: 'html', title: '色板', value: swatchGrid(Object.entries(tokens).map(([k, hex]) => ({ hex, label: k }))) },
        TXT(css, 'CSS 变量', 'dark-tokens.css'),
        KV([['正文 / 背景', contrast(tokens.text, tokens.bg).toFixed(2) + ':1'], ['主色 / 背景', contrast(tokens.accent, tokens.bg).toFixed(2) + ':1'], ['次要文字 / 背景', contrast(tokens.muted, tokens.bg).toFixed(2) + ':1']], '对比度检查'),
        { type: 'note', value: '按色相与明度做启发式转换，结果用于起稿；原设计中的品牌色、插画与图片需要单独调整。' }
      ];
    }
  });

  /* ---------------- 3. 配色批量对比度检查 ---------------- */
  R('配色批量对比度检查', {
    fields: [
      I('bg', '背景色', '#f4f3ee', { type: 'color' }),
      X('colors', '待检查色值（每行一个）', '#1b1c18\n#2d5c4d\n#b65c3f\n#8a8a7e', { rows: 6 }),
      S('size', '文本规格', [['normal', '正文'], ['large', '大字']], 'normal')
    ], live: true,
    run: v => {
      const bg = normHex(v.bg), list = parseColors(v.colors);
      if (!list.length) throw new Error('请输入至少一个十六进制色值');
      const aa = v.size === 'large' ? 3 : 4.5, aaa = v.size === 'large' ? 4.5 : 7;
      const rows = list.map(hex => {
        const r = contrast(hex, bg);
        return [hex, r.toFixed(2) + ':1', r >= aa ? '通过' : '未通过', r >= aaa ? '通过' : '未通过'];
      });
      const chips = `<div style="display:flex;flex-wrap:wrap;gap:8px">${list.map(hex => `<span style="display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:7px;padding:5px 9px;background:var(--surface)"><i style="width:14px;height:14px;border-radius:4px;background:${hex};display:inline-block"></i><span style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-2)">${hex}</span></span>`).join('')}</div>`;
      return [
        { type: 'html', title: '待检查颜色', value: chips },
        { type: 'table', title: '对比度结果', head: ['色值', '对比度', 'AA', 'AAA'], rows },
        { type: 'note', value: `当前按${v.size === 'large' ? '大字（≥ 24px）' : '正文'}标准检查：AA 需 ≥ ${aa}:1，AAA 需 ≥ ${aaa}:1。` }
      ];
    }
  });

  /* ---------------- 4. 字体配对预览 ---------------- */
  R('字体配对预览', {
    fields: [
      S('pair', '配对方案', [['serifSans', '衬线标题 + 无衬线正文'], ['sansSerif', '无衬线标题 + 衬线正文'], ['sansMono', '无衬线标题 + 等宽正文'], ['monoSerif', '等宽标题 + 衬线正文'], ['weight', '同字体字重对比']], 'serifSans'),
      I('title', '标题文字', '把复杂的工作拆成清晰的步骤'),
      I('body', '正文文字', '在同一个页面里完成查找、处理与导出，减少在多个工具之间切换的时间。')
    ], live: true,
    run: v => {
      const pairs = {
        serifSans: { title: '"Songti SC","SimSun","Noto Serif SC",serif', body: 'var(--font-sans)', name: '衬线标题 + 无衬线正文' },
        sansSerif: { title: 'var(--font-sans)', body: '"Songti SC","SimSun",serif', name: '无衬线标题 + 衬线正文' },
        sansMono: { title: 'var(--font-sans)', body: 'var(--font-mono)', name: '无衬线标题 + 等宽正文' },
        monoSerif: { title: 'var(--font-mono)', body: '"Songti SC","SimSun",serif', name: '等宽标题 + 衬线正文' },
        weight: { title: 'var(--font-sans)', body: 'var(--font-sans)', name: '同字体字重对比' }
      };
      const p = pairs[v.pair] || pairs.serifSans;
      const preview = `<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:26px">
        <div style="font-family:${p.title};font-size:28px;line-height:1.35;font-weight:${v.pair === 'weight' ? 800 : 600};color:var(--text)">${esc(v.title)}</div>
        <div style="font-family:${p.body};font-size:13px;line-height:1.95;color:var(--text-2);margin-top:12px;max-width:62ch">${esc(v.body)}</div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);margin-top:16px">Aa 0123 · ${esc(p.name)}</div>
      </div>`;
      const css = `/* 标题 */\nfont-family: ${p.title};\n\n/* 正文 */\nfont-family: ${p.body};`;
      return [
        { type: 'html', title: '配对预览', value: preview },
        TXT(css, '字体栈', 'font-pair.css'),
        { type: 'note', value: '预览使用系统可用字体；正式项目建议只引入 1 到 2 套字族，并通过 font-display 与子集化控制加载成本。' }
      ];
    }
  });

  /* ---------------- 5. 行高与字距生成器 ---------------- */
  R('行高与字距生成器', {
    fields: [
      N('size', '字号（px）', 16, { min: 10, max: 48, step: 1 }),
      N('line', '行高倍数', 1.7, { min: 1, max: 2.4, step: .05 }),
      N('ls', '字距（em）', 0, { min: -.1, max: .3, step: .01 }),
      N('measure', '正文行宽（ch）', 62, { min: 30, max: 100, step: 1 })
    ], live: true,
    run: v => {
      const size = Number(v.size) || 16, line = Number(v.line) || 1.7, ls = Number(v.ls) || 0, measure = Math.round(Number(v.measure) || 62);
      const text = '这是一段用于检查行高、字距与阅读宽度的中文正文。合适的行高能让长段落更易读，合适的行宽能减少视线回扫。设计系统里建议把正文字号、行高与行宽固定为少数几组组合。';
      const preview = `<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:24px">
        <div style="font-size:${size}px;line-height:${line};letter-spacing:${ls}em;max-width:${measure}ch;color:var(--text-2)">${text}</div>
      </div>`;
      const css = `.prose {\n  font-size: ${size}px;\n  line-height: ${r2(size * line)}px; /* ${line} */\n  letter-spacing: ${ls}em;\n  max-width: ${measure}ch;\n}`;
      return [
        { type: 'html', title: '正文预览', value: preview },
        KV([['字号', size + 'px'], ['行高', r2(size * line) + 'px（' + line + '）'], ['字距', ls + 'em'], ['行宽', measure + 'ch']], '排版参数'),
        TXT(css, 'CSS 代码', 'typography.css'),
        { type: 'note', value: '中文正文常用行高 1.6 到 1.8，行宽 45 到 75 个字符；字距只建议在标题或英文全大写时微调。' }
      ];
    }
  });

  /* ---------------- 6. 触控目标检查器 ---------------- */
  R('触控目标检查器', {
    fields: [N('w', '目标宽度（px）', 32, { min: 8, max: 120, step: 1 }), N('h', '目标高度（px）', 32, { min: 8, max: 120, step: 1 }), N('gap', '相邻间距（px）', 8, { min: 0, max: 40, step: 1 })],
    live: true,
    run: v => {
      const w = Math.max(8, Number(v.w) || 32), h = Math.max(8, Number(v.h) || 32), gap = Math.max(0, Number(v.gap) || 0);
      const boxScale = Math.min(1, 110 / Math.max(w, h));
      const preview = `<div style="display:flex;gap:${Math.round(gap * boxScale)}px;align-items:center;justify-content:center;padding:24px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px">
        <div style="width:${Math.round(w * boxScale)}px;height:${Math.round(h * boxScale)}px;border-radius:8px;background:var(--accent-soft);border:1px solid var(--accent);display:grid;place-items:center;font-family:var(--font-mono);font-size:9px;color:var(--accent)">${Math.round(w)}×${Math.round(h)}</div>
        <div style="width:${Math.round(w * boxScale)}px;height:${Math.round(h * boxScale)}px;border-radius:8px;background:var(--surface-3);border:1px dashed var(--line-strong)"></div>
      </div>`;
      const check = (label, min) => [label, `${min}×${min}px`, w >= min && h >= min ? '通过' : '未通过'];
      return [
        { type: 'html', title: '尺寸预览（等比缩放）', value: preview },
        { type: 'table', title: '标准检查', head: ['标准', '最小尺寸', '结果'], rows: [check('WCAG 2.2 AA', 24), check('Apple HIG 推荐', 44), check('Material 推荐', 48)] },
        KV([['目标尺寸', `${w} × ${h} px`], ['相邻间距', gap + 'px'], ['可点击面积', (w * h) + ' px²']], '参数'),
        { type: 'note', value: 'WCAG 2.2 的 24px 是最低要求，移动端更建议 44 到 48px；间距不足时，相邻目标应额外留出至少 8px。' }
      ];
    }
  });

  /* ---------------- 7. CSS 过渡生成器 ---------------- */
  R('CSS 过渡生成器', {
    fields: [
      S('prop', '过渡属性', [['all', 'all（全部）'], ['background-color', 'background-color'], ['transform', 'transform'], ['opacity', 'opacity'], ['box-shadow', 'box-shadow'], ['color', 'color']], 'all'),
      N('dur', '时长（ms）', 220, { min: 50, max: 2000, step: 10 }),
      N('delay', '延迟（ms）', 0, { min: 0, max: 1000, step: 10 }),
      S('ease', '缓动', [['ease', 'ease'], ['linear', 'linear'], ['ease-in', 'ease-in'], ['ease-out', 'ease-out'], ['ease-in-out', 'ease-in-out'], ['cubic-bezier(.4,0,.2,1)', '标准缓动（Material）'], ['cubic-bezier(.34,1.56,.64,1)', '回弹缓动']], 'cubic-bezier(.4,0,.2,1)')
    ], live: true,
    run: v => {
      const css = `.ds-transition-demo {\n  transition: ${v.prop} ${Number(v.dur) || 0}ms ${v.ease} ${Number(v.delay) || 0}ms;\n}\n.ds-transition-demo:hover {\n  background: var(--accent);\n  color: var(--on-accent);\n  transform: translateY(-4px);\n  box-shadow: 0 12px 26px rgba(0,0,0,.18);\n  opacity: .9;\n}`;
      const preview = `<style>${css}</style><div style="padding:34px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;text-align:center">
        <div class="ds-transition-demo" style="display:inline-flex;align-items:center;justify-content:center;min-width:150px;padding:14px 22px;border-radius:8px;background:var(--surface);border:1px solid var(--line-strong);color:var(--text-2);font-size:13px;cursor:pointer">悬停查看过渡</div>
      </div>`;
      return [
        { type: 'html', title: '悬停预览', value: preview },
        TXT(css, 'CSS 代码', 'transition.css'),
        { type: 'note', value: '界面反馈建议 150 到 300ms；只对 transform、opacity 等合成属性做动画更高性能，避免对所有属性使用 all。' }
      ];
    }
  });

  /* ---------------- 8. CSS 关键帧动画生成器 ---------------- */
  R('CSS 关键帧动画生成器', {
    fields: [
      S('type', '动画类型', [['fade', '淡入'], ['slideUp', '上滑淡入'], ['slideLeft', '左滑淡入'], ['scale', '缩放淡入'], ['rotate', '旋转淡入'], ['pulse', '脉冲']], 'slideUp'),
      N('dur', '时长（ms）', 700, { min: 100, max: 4000, step: 50 }),
      N('delay', '延迟（ms）', 0, { min: 0, max: 2000, step: 50 }),
      S('ease', '缓动', [['ease-out', 'ease-out'], ['ease', 'ease'], ['linear', 'linear'], ['cubic-bezier(.2,.7,.25,1)', '平滑缓动'], ['cubic-bezier(.34,1.56,.64,1)', '回弹']], 'cubic-bezier(.2,.7,.25,1)'),
      S('iter', '播放次数', [['1', '1 次'], ['infinite', '循环']], '1')
    ], live: true,
    run: v => {
      const defs = {
        fade: '@keyframes ds-kf-demo {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}',
        slideUp: '@keyframes ds-kf-demo {\n  from { opacity: 0; transform: translateY(18px); }\n  to { opacity: 1; transform: translateY(0); }\n}',
        slideLeft: '@keyframes ds-kf-demo {\n  from { opacity: 0; transform: translateX(-22px); }\n  to { opacity: 1; transform: translateX(0); }\n}',
        scale: '@keyframes ds-kf-demo {\n  from { opacity: 0; transform: scale(.86); }\n  to { opacity: 1; transform: scale(1); }\n}',
        rotate: '@keyframes ds-kf-demo {\n  from { opacity: 0; transform: rotate(-8deg) scale(.92); }\n  to { opacity: 1; transform: rotate(0) scale(1); }\n}',
        pulse: '@keyframes ds-kf-demo {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.06); }\n}'
      };
      const css = `${defs[v.type] || defs.fade}\n\n.ds-animation-demo {\n  animation: ds-kf-demo ${Number(v.dur) || 700}ms ${v.ease} ${Number(v.delay) || 0}ms ${v.iter} both;\n}`;
      const preview = `<style>${css}</style><div style="padding:34px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;text-align:center">
        <div class="ds-animation-demo" style="display:inline-flex;align-items:center;justify-content:center;min-width:160px;padding:18px 22px;border-radius:10px;background:var(--accent);color:var(--on-accent);font-size:13px;font-weight:600">动画预览</div>
      </div>`;
      return [
        { type: 'html', title: '动画预览', value: preview },
        TXT(css, 'CSS 代码', 'keyframes.css'),
        { type: 'note', value: '入场动画建议控制在 200 到 600ms；循环动画只用于强调状态，避免在长列表中同时播放大量动画。' }
      ];
    }
  });

  /* ---------------- 9. 输入框样式生成器 ---------------- */
  R('输入框样式生成器', {
    fields: [
      I('bg', '背景色', '#f9f8f3', { type: 'color' }), I('fg', '文字色', '#1b1c18', { type: 'color' }),
      I('border', '边框色', '#cfccc0', { type: 'color' }), N('bw', '边框宽度（px）', 1, { min: 0, max: 4, step: 1 }),
      N('radius', '圆角（px）', 8, { min: 0, max: 30, step: 1 }), N('px', '左右内边距（px）', 12, { min: 4, step: 1 }),
      N('py', '上下内边距（px）', 9, { min: 3, step: 1 }), N('fs', '字号（px）', 13, { min: 10, step: 1 }),
      I('focus', '聚焦强调色', '#2d5c4d', { type: 'color' })
    ], live: true,
    run: v => {
      const bg = normHex(v.bg), fg = normHex(v.fg), border = normHex(v.border), focus = normHex(v.focus);
      const radius = Math.max(0, Number(v.radius) || 0), px = Math.max(4, Number(v.px) || 12), py = Math.max(3, Number(v.py) || 9), fs = Math.max(10, Number(v.fs) || 13), bw = clamp(Number(v.bw) || 0, 0, 4);
      const css = `.ds-input {\n  width: 100%;\n  padding: ${py}px ${px}px;\n  border: ${bw}px solid ${border};\n  border-radius: ${radius}px;\n  background: ${bg};\n  color: ${fg};\n  font-size: ${fs}px;\n  outline: none;\n  transition: border-color .16s, box-shadow .16s;\n}\n.ds-input:focus {\n  border-color: ${focus};\n  box-shadow: 0 0 0 3px ${rgba(focus, .16)};\n}`;
      const preview = `<style>${css}</style><div style="padding:30px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px">
        <input class="ds-input" placeholder="请输入内容" value="内容只在本地处理">
      </div>`;
      return [
        { type: 'html', title: '输入框预览', value: preview },
        TXT(css, 'CSS 代码', 'input.css'),
        { type: 'note', value: '输入框要有清晰的聚焦态与占位符；错误态建议同时使用边框颜色与文字提示，不要只依赖颜色。' }
      ];
    }
  });

  /* ---------------- 10. 多倍图尺寸换算 ---------------- */
  R('多倍图尺寸换算', {
    fields: [N('w', '1x 宽度（px）', 320, { min: 1, step: 1 }), N('h', '1x 高度（px）', 240, { min: 1, step: 1 })],
    live: true,
    run: v => {
      const w = Math.max(1, Number(v.w) || 320), h = Math.max(1, Number(v.h) || 240);
      const rows = [1, 2, 3].map(n => [`${n}x`, `${w * n} × ${h * n}`, `image@${n}x.png`]);
      return [
        { type: 'table', title: '多倍图尺寸', head: ['倍率', '像素尺寸', '建议文件名'], rows },
        KV([['1x 尺寸', `${w} × ${h}`], ['2x 尺寸', `${w * 2} × ${h * 2}`], ['3x 尺寸', `${w * 3} × ${h * 3}`], ['CSS 显示尺寸', `width: ${w}px; height: ${h}px;`]], '换算结果'),
        TXT(`<img src="image@1x.png"\n     srcset="image@2x.png 2x, image@3x.png 3x"\n     width="${w}" height="${h}" alt="">`, 'HTML 引用', 'responsive-image.html'),
        { type: 'note', value: '设计稿按 1x 标注时，导出 2x / 3x 只放大像素，不会增加细节；图标优先使用 SVG。' }
      ];
    }
  });

  /* ---------------- 11. 调色板卡片导出 ---------------- */
  R('调色板卡片导出', {
    fields: [
      X('colors', '颜色列表（每行一个 HEX）', '#2d5c4d\n#b65c3f\n#d9a441\n#e7efea\n#1b1c18', { rows: 6 }),
      I('title', '标题', 'Brand Palette'),
      I('bg', '背景色', '#f4f3ee', { type: 'color' }),
      S('layout', '排版', [['row', '横向色条'], ['grid', '网格色卡']], 'grid')
    ], live: true,
    run: v => {
      const list = parseColors(v.colors);
      if (!list.length) throw new Error('请输入至少一个十六进制色值');
      const W = 1600, H = 900;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      const bg = normHex(v.bg), fg = lum(bg) > .45 ? '#1b1c18' : '#fdfdf8';
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.fillStyle = fg; c.font = '700 58px "PingFang SC","Microsoft YaHei",sans-serif';
      const cardTitle = String(v.title || '').trim();
      if (cardTitle) c.fillText(cardTitle.slice(0, 40), 80, 130);
      c.fillStyle = rgba(fg, .55); c.font = '400 22px "PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText(`${list.length} colors · generated locally`, 80, 172);
      const pad = 80, top = 230, bottom = H - 100;
      if (v.layout === 'row') {
        const bw = (W - pad * 2) / list.length;
        list.forEach((hex, i) => {
          c.fillStyle = hex; c.fillRect(pad + i * bw, top, bw, bottom - top);
          c.fillStyle = contrast(hex, '#ffffff') > contrast(hex, '#000000') ? '#ffffff' : '#1b1c18';
          c.font = '600 24px "PingFang SC","Microsoft YaHei",sans-serif';
          c.fillText(hex.toUpperCase(), pad + i * bw + 16, bottom - 24);
        });
      } else {
        const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(list.length))));
        const rows = Math.ceil(list.length / cols), cw = (W - pad * 2) / cols, ch = (bottom - top) / rows;
        list.forEach((hex, i) => {
          const x = pad + (i % cols) * cw, y = top + Math.floor(i / cols) * ch;
          c.fillStyle = hex; c.fillRect(x + 8, y + 8, cw - 16, ch - 16);
          c.fillStyle = contrast(hex, '#ffffff') > contrast(hex, '#000000') ? '#ffffff' : '#1b1c18';
          c.font = '600 22px "PingFang SC","Microsoft YaHei",sans-serif';
          c.fillText(hex.toUpperCase(), x + 24, y + ch - 26);
        });
      }
      c.fillStyle = rgba(fg, .4); c.font = '400 18px "PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText('拾器 ToolBox · 本地生成', pad, H - 38);
      return [
        { type: 'image', src: cv.toDataURL('image/png'), name: 'palette-card.png', title: '调色板卡片（1600 × 900）' },
        TXT(list.join('\n'), 'HEX 列表', 'palette.txt'),
        { type: 'note', value: '导出的图片适合分享或放入设计说明；颜色顺序按输入顺序保留。' }
      ];
    }
  });

  /* ---------------- 12. SVG 波浪分隔线 ---------------- */
  R('SVG 波浪分隔线', {
    fields: [
      N('w', '宽度（px）', 1440, { min: 200, max: 3000, step: 10 }),
      N('h', '高度（px）', 80, { min: 20, max: 240, step: 5 }),
      N('waves', '波浪数', 3, { min: 1, max: 12, step: 1 }),
      I('color', '填充色', '#e7efea', { type: 'color' }),
      S('dir', '方向', [['down', '向下填充'], ['up', '向上填充']], 'down')
    ], live: true,
    run: v => {
      const w = Math.max(200, Number(v.w) || 1440), h = Math.max(20, Number(v.h) || 80), waves = Math.max(1, Number(v.waves) || 3);
      const color = normHex(v.color), amp = h * .38, base = h / 2;
      let path = `M 0 ${h} L 0 ${base}`;
      for (let x = 0; x <= w; x += 4) {
        const y = base + Math.sin((x / w) * waves * Math.PI * 2) * amp;
        path += ` L ${x} ${r2(y)}`;
      }
      path += ` L ${w} ${h} Z`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${path}" fill="${color}"/></svg>`;
      const preview = `<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:10px;overflow:hidden;padding:0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="display:block;height:auto"><path d="${path}" fill="${color}"/></svg></div>`;
      return [
        { type: 'html', title: '波浪预览', value: preview },
        { type: 'file', blob: new Blob([svg], { type: 'image/svg+xml' }), name: 'wave-divider.svg', title: '下载 SVG 分隔线' },
        KV([['画布', `${w} × ${h}`], ['波浪数', waves], ['填充色', color]], '参数'),
        { type: 'note', value: 'SVG 使用 4px 采样绘制曲线，放大后仍然清晰；可把 path 复制到现有 SVG 中继续调整。' }
      ];
    }
  });

  /* ---------------- 13. SVG 纹理生成器 ---------------- */
  R('SVG 纹理生成器', {
    fields: [
      N('freq', '噪声频率', .8, { min: .05, max: 2, step: .05 }),
      N('oct', '八度数', 3, { min: 1, max: 6, step: 1 }),
      N('seed', '随机种子', 2, { min: 1, max: 99, step: 1 }),
      N('opacity', '纹理不透明度（0 ~ 1）', .18, { min: .02, max: 1, step: .01 }),
      I('bg', '背景色', '#f4f3ee', { type: 'color' })
    ], live: true,
    run: v => {
      const freq = clamp(Number(v.freq) || .8, .05, 2), oct = Math.round(clamp(Number(v.oct) || 3, 1, 6)), seed = Math.round(Number(v.seed) || 2), op = clamp(Number(v.opacity) || .18, .02, 1), bg = normHex(v.bg);
      const body = `<filter id="ds-noise"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}"/><feColorMatrix type="saturate" values="0"/></filter>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs>${body}</defs><rect width="800" height="500" fill="${bg}"/><rect width="800" height="500" filter="url(#ds-noise)" opacity="${op}"/></svg>`;
      return [
        { type: 'html', title: '纹理预览', value: `<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden">${svg.replace('width="800" height="500"', 'width="100%" height="240"')}</div>` },
        { type: 'file', blob: new Blob([svg], { type: 'image/svg+xml' }), name: 'noise-texture.svg', title: '下载 SVG 纹理' },
        { type: 'note', value: 'SVG 噪声由浏览器实时渲染，不同浏览器可能略有差异；作为背景时建议降低不透明度，避免干扰正文。' }
      ];
    }
  });

  /* ---------------- 14. SVG 转 PNG ---------------- */
  R('SVG 转 PNG', {
    fields: [
      F('file', '选择 SVG 文件（可选）', { accept: '.svg,image/svg+xml' }),
      X('text', '或直接粘贴 SVG 代码', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2d5c4d"/><circle cx="32" cy="32" r="14" fill="#f4f3ee"/></svg>', { rows: 6 }),
      S('bg', '背景', [['transparent', '透明'], ['white', '白色']], 'transparent')
    ],
    run: async v => {
      let svg = v.file ? await T.readFile(v.file, 'text') : String(v.text || '');
      if (!String(svg).trim()) throw new Error('请选择 SVG 文件或粘贴 SVG 代码');
      svg = String(svg).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
      if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      let img;
      try { img = await T.loadImage(url); } catch (e) { throw new Error('SVG 无法解析，可能包含外部资源或脚本'); }
      const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      const sizes = [32, 64, 128, 256, 512, 1024];
      const items = sizes.map(size => {
        const w = size, h = Math.max(1, Math.round(size / ratio));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const c = cv.getContext('2d');
        if (v.bg === 'white') { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); }
        c.drawImage(img, 0, 0, w, h);
        return { src: cv.toDataURL('image/png'), name: `svg-${size}.png` };
      });
      const zip = async () => {
        if (!window.JSZip) return T.toast('ZIP 组件未加载', 'err');
        const z = new window.JSZip();
        items.forEach(it => z.file(it.name, it.src.split(',')[1], { base64: true }));
        const blob = await z.generateAsync({ type: 'blob' });
        T.save(blob, 'svg-png.zip');
      };
      return [
        { type: 'images', title: 'PNG 预览与下载', items, zip },
        KV([['原始比例', ratio.toFixed(3) + ' : 1'], ['输出尺寸', sizes.join(' / ') + ' px'], ['背景', v.bg === 'white' ? '白色' : '透明']], '输出信息'),
        { type: 'note', value: 'SVG 内的字体依赖本机字体；包含外部图片或脚本的 SVG 可能无法导出。大尺寸图标建议直接使用 SVG。' }
      ];
    }
  });

  /* ---------------- 15. LQIP 图片占位符 ---------------- */
  R('LQIP 图片占位符', {
    fields: [F('file', '选择图片', { accept: 'image/*' }), N('blur', '预览模糊（px）', 12, { min: 0, max: 40, step: 1 })],
    run: async v => {
      if (!v.file) throw new Error('请选择图片');
      const { img, url } = await T.fileToImage(v.file);
      try {
        const maxSide = 32, scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        const data = cv.toDataURL('image/jpeg', .55);
        const ratio = (img.naturalWidth / img.naturalHeight).toFixed(4);
        const preview = `<div style="max-width:420px;margin:0 auto;aspect-ratio:${img.naturalWidth}/${img.naturalHeight};background:url('${data}') center/cover;filter:blur(${Number(v.blur) || 0}px);transform:scale(1.03);border-radius:8px;overflow:hidden"></div>`;
        const css = `.lqip {\n  background-image: url("${data}");\n  background-size: cover;\n  background-position: center;\n  filter: blur(${Number(v.blur) || 0}px);\n  transform: scale(1.03);\n}`;
        return [
          { type: 'html', title: '占位图效果', value: `<div style="overflow:hidden;border:1px solid var(--line);border-radius:10px;padding:18px;background:var(--surface-2)">${preview}</div>` },
          TXT(data, '低清占位 Data URL', 'lqip.txt'),
          TXT(css, 'CSS 背景写法', 'lqip.css'),
          KV([['原图尺寸', `${img.naturalWidth} × ${img.naturalHeight}`], ['占位尺寸', `${w} × ${h}`], ['宽高比', ratio], ['Data URL 长度', data.length + ' 字符']], '参数'),
          { type: 'note', value: '占位图先用低清图打底，再加载原图替换；背景值较长，适合内联进关键 CSS 或由后端下发。' }
        ];
      } finally { URL.revokeObjectURL(url); }
    }
  });

  /* ---------------- 16. 占位文案生成器 ---------------- */
  R('占位文案生成器', {
    fields: [
      S('lang', '语言', [['zh', '中文'], ['en', 'English'], ['mix', '中英混排']], 'zh'),
      N('paras', '段落数', 3, { min: 1, max: 8, step: 1 }),
      N('sentences', '每段句数', 3, { min: 1, max: 6, step: 1 })
    ], live: true,
    run: v => {
      const zh = [
        '把复杂的工作拆成清晰的步骤，先确认目标，再逐项完成。',
        '好的界面让信息有层次，也让操作有明确的结果。',
        '在同一个页面里完成查找、处理与导出，可以减少来回切换。',
        '设计系统不是限制，而是让团队把精力放在真正的问题上。',
        '留白让内容有呼吸，也让重点更容易被看见。',
        '先用简单的结构验证流程，再逐步补充细节。',
        '每一次交互都应该给出及时、清楚而不打扰的反馈。',
        '把常用的数值固定下来，页面之间就会自然形成一致的节奏。',
        '文字的长度、行高与对比度，决定了内容是否容易被读完。',
        '真正好用的工具，往往在你需要它的时候才出现。',
        '颜色负责引导，结构负责解释，动效负责确认。',
        '先保证可用，再考虑漂亮；两者并不冲突。'
      ];
      const en = [
        'Good tools stay out of the way until you need them.',
        'Clear structure makes complex work feel approachable.',
        'Whitespace gives content room to breathe and focus to land.',
        'Every interaction should leave a clear trace of what happened.',
        'Start with the simplest structure, then add detail where it matters.',
        'Consistent spacing creates a rhythm that people can feel.',
        'Readable text depends on length, line height and contrast.',
        'Design systems free teams to focus on the real problem.',
        'Feedback should be timely, clear and never noisy.',
        'The best interface is the one that answers the next question.'
      ];
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      const lang = v.lang || 'zh';
      const paras = Math.round(clamp(Number(v.paras) || 3, 1, 8)), sentences = Math.round(clamp(Number(v.sentences) || 3, 1, 6));
      const out = [];
      for (let p = 0; p < paras; p++) {
        const parts = [];
        for (let s = 0; s < sentences; s++) {
          if (lang === 'en') parts.push(pick(en));
          else if (lang === 'mix') parts.push(s % 2 ? pick(en) : pick(zh));
          else parts.push(pick(zh));
        }
        out.push(parts.join(lang === 'en' ? ' ' : ''));
      }
      const text = out.join('\n\n');
      return [
        TXT(text, '占位文案', 'placeholder-copy.txt'),
        { type: 'html', title: '排版预览', value: `<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:22px;max-width:64ch">${out.map(p => `<p style="margin:0 0 12px;font-size:13px;line-height:1.95;color:var(--text-2)">${esc(p)}</p>`).join('')}</div>` },
        { type: 'note', value: '占位文案只用于排版预览，正式上线前请替换为真实内容；重新计算会生成新的随机组合。' }
      ];
    }
  });

  /* ---------------- 17. 文案长度检查器 ---------------- */
  R('文案长度检查器', {
    fields: [
      X('text', '待检查文案', '把常用的工具收进一个页面，打开就能用。', { rows: 4 }),
      S('ctx', '使用位置', [['button', '按钮（建议 ≤ 8 字）'], ['card', '卡片标题（建议 ≤ 20 字）'], ['title', '页面标题（建议 ≤ 30 字）'], ['desc', '描述（建议 ≤ 80 字）'], ['seoTitle', 'SEO 标题（建议 ≤ 60 字）'], ['seoDesc', 'SEO 描述（建议 ≤ 155 字）']], 'card')
    ], live: true,
    run: v => {
      const limits = { button: 8, card: 20, title: 30, desc: 80, seoTitle: 60, seoDesc: 155 };
      const labels = { button: '按钮', card: '卡片标题', title: '页面标题', desc: '描述', seoTitle: 'SEO 标题', seoDesc: 'SEO 描述' };
      const text = String(v.text || '').trim();
      const count = [...text].length;
      const limit = limits[v.ctx] || 20;
      const over = count > limit;
      const pct = clamp(count / limit * 100, 0, 100);
      return [
        KV([['字符数', count + ' 字'], ['建议上限', limit + ' 字'], ['结论', over ? '超出 ' + (count - limit) + ' 字' : '在建议范围内'], ['使用位置', labels[v.ctx]]], '检查结果'),
        { type: 'html', title: '长度占用', value: `<div style="padding:16px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)"><div style="height:8px;background:var(--surface-3);border-radius:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${over ? 'var(--err)' : 'var(--accent)'}"></div></div><div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-3);margin-top:7px">${count} / ${limit}</div></div>` },
        { type: 'note', value: '中文按单个字符计算；英文与数字也按字符计。按钮文案越短越好，标题与描述以完整表达为先，不必为了凑字数而删信息。' }
      ];
    }
  });

  /* ---------------- 18. 色彩混合器 ---------------- */
  R('色彩混合器', {
    fields: [
      I('c1', '颜色 A', '#2d5c4d', { type: 'color' }),
      I('c2', '颜色 B', '#b65c3f', { type: 'color' }),
      N('steps', '色阶数量', 7, { min: 3, max: 11, step: 1 }),
      N('ratio', '混合比例（%）', 50, { min: 0, max: 100, step: 1 })
    ], live: true,
    run: v => {
      const a = normHex(v.c1), b = normHex(v.c2), n = Math.round(clamp(Number(v.steps) || 7, 3, 11)), ratio = clamp(Number(v.ratio) || 50, 0, 100) / 100;
      const mixed = mix(a, b, ratio);
      const list = Array.from({ length: n }, (_, i) => ({ hex: mix(a, b, i / (n - 1)), label: i === 0 ? 'A' : i === n - 1 ? 'B' : Math.round(i / (n - 1) * 100) + '%' }));
      return [
        { type: 'html', title: '混色结果', value: `<div style="display:flex;height:120px;border:1px solid var(--line);border-radius:10px;overflow:hidden">${list.map(x => `<div style="flex:1;background:${x.hex}" title="${x.hex}"></div>`).join('')}</div><div style="font-family:var(--font-mono);font-size:11px;color:var(--text-2);margin-top:8px">${mixed}</div>` },
        { type: 'html', title: '色阶', value: swatchGrid(list) },
        TXT(`${a} + ${b} @ ${Math.round(ratio * 100)}% = ${mixed}\n\n` + list.map(x => x.hex).join('\n'), '色值结果', 'mix.txt'),
        { type: 'note', value: '混色在 sRGB 空间线性插值，适合做过渡色与浅色底；需要精确品牌色时请直接使用色值。' }
      ];
    }
  });

  /* ---------------- 19. 响应式图片 srcset 生成器 ---------------- */
  R('响应式图片 srcset 生成器', {
    fields: [
      I('url', '图片基础地址', '/images/hero.jpg'),
      I('widths', '宽度列表（逗号分隔）', '480, 768, 1200, 1600'),
      I('sizes', 'sizes 属性', '(max-width: 768px) 100vw, 1200px'),
      I('alt', 'alt 文本', '页面主视觉')
    ], live: true,
    run: v => {
      const widths = String(v.widths || '').split(/[,，\s]+/).map(Number).filter(n => n > 0).sort((a, b) => a - b);
      if (!widths.length) throw new Error('请输入至少一个宽度');
      const url = String(v.url || 'image.jpg');
      const base = url.replace(/\.[^.]+$/, '');
      const ext = (url.match(/\.[^.]+$/) || ['.jpg'])[0];
      const srcset = widths.map(w => `${base}-${w}w${ext} ${w}w`).join(', ');
      const code = `<img\n  src="${url}"\n  srcset="${srcset}"\n  sizes="${v.sizes || '100vw'}"\n  loading="lazy"\n  decoding="async"\n  alt="${v.alt || ''}">`;
      return [
        TXT(code, 'HTML 代码', 'srcset.html'),
        { type: 'table', title: '图片候选', head: ['宽度', '文件名', 'srcset 描述符'], rows: widths.map(w => [w + 'w', `${base}-${w}w${ext}`, `${w}w`]) },
        { type: 'note', value: '实际使用时需要同时导出对应宽度的图片；只写 srcset 不生成图片文件不会生效。' }
      ];
    }
  });

  /* ---------------- 20. 多行文本截断生成器 ---------------- */
  R('多行文本截断生成器', {
    fields: [
      X('text', '文本内容', '把常用的工具收进同一个页面，打开就能用。文件与输入只在浏览器内处理，不上传服务器。设计工具、文件工具、文本工具都可以直接使用。', { rows: 4 }),
      N('lines', '显示行数', 2, { min: 1, max: 6, step: 1 }),
      N('width', '容器宽度（px）', 320, { min: 160, max: 720, step: 10 }),
      S('mode', '截断方式', [['clamp', '多行省略'], ['single', '单行省略']], 'clamp')
    ], live: true,
    run: v => {
      const lines = Math.round(clamp(Number(v.lines) || 2, 1, 6)), width = Math.max(160, Number(v.width) || 320);
      const style = v.mode === 'single'
        ? `width:${width}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`
        : `width:${width}px;display:-webkit-box;-webkit-line-clamp:${lines};-webkit-box-orient:vertical;overflow:hidden`;
      const css = v.mode === 'single'
        ? `.truncate {\n  width: ${width}px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}`
        : `.truncate {\n  width: ${width}px;\n  display: -webkit-box;\n  -webkit-line-clamp: ${lines};\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}`;
      return [
        { type: 'html', title: '截断预览', value: `<div style="padding:24px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px"><div style="${style};font-size:13px;line-height:1.85;color:var(--text-2)">${esc(v.text || '')}</div></div>` },
        TXT(css, 'CSS 代码', 'truncate.css'),
        { type: 'note', value: '多行省略使用 -webkit-line-clamp，现代浏览器均支持；截断会隐藏剩余内容，重要信息不要只放在被截断的部分。' }
      ];
    }
  });
  /* ---------------- 21. CSS 样式表生成器 ---------------- */
  R('CSS 样式表生成器', {
    fields: [
      I('accent', '主色', '#2d5c4d', { type: 'color' }),
      I('bg', '背景色', '#f4f3ee', { type: 'color' }),
      I('text', '正文色', '#1b1c18', { type: 'color' }),
      N('radius', '基础圆角（px）', 10, { min: 0, max: 30, step: 1 }),
      N('base', '基准字号（px）', 16, { min: 12, max: 24, step: 1 }),
      S('scale', '字号比例', [['1.2', '1.2'], ['1.25', '1.25'], ['1.333', '1.333'], ['1.5', '1.5']], '1.25'),
      C('dark', '生成深色变量', true, '附带深色模式')
    ], live: true,
    run: v => {
      const accent = normHex(v.accent), bg = normHex(v.bg), text = normHex(v.text);
      const radius = Math.max(0, Number(v.radius) || 0), base = Math.max(12, Number(v.base) || 16), ratio = Number(v.scale) || 1.25;
      const [ha, sa] = rgbToHsl(accent), [hb, sb] = rgbToHsl(bg), [ht, st] = rgbToHsl(text);
      const sizes = [-1, 0, 1, 2, 3, 4].map(i => r2(base * Math.pow(ratio, i)));
      const darkBg = hslToHex(hb, Math.min(sb, 16), 9), darkSurface = hslToHex(hb, Math.min(sb, 18), 13), darkText = hslToHex(ht, Math.min(st, 12), 90), darkAccent = hslToHex(ha, clamp(sa, 30, 82), 64);
      const rgbBg = hexToRgb(bg);
      const surface = rgbToHex(Math.min(255, rgbBg.r + 8), Math.min(255, rgbBg.g + 8), Math.min(255, rgbBg.b + 8));
      const css = `:root {
  --accent: ${accent};
  --bg: ${bg};
  --surface: ${surface};
  --text: ${text};
  --muted: ${mix(text, bg, .45)};
  --line: ${mix(text, bg, .82)};
  --radius: ${radius}px;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-serif: "Songti SC", "SimSun", serif;
  --font-mono: ui-monospace, SFMono-Regular, Consolas, monospace;
  --text-sm: ${sizes[0]}px;
  --text-base: ${sizes[1]}px;
  --text-lg: ${sizes[2]}px;
  --text-xl: ${sizes[3]}px;
  --text-2xl: ${sizes[4]}px;
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 { margin: 0 0 .5em; line-height: 1.25; font-weight: 650; }
h1 { font-size: var(--text-2xl); }
h2 { font-size: var(--text-xl); }
h3 { font-size: var(--text-lg); }
p { margin: 0 0 1em; color: var(--muted); }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.container { width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 16px; border: 1px solid transparent; border-radius: calc(var(--radius) * .8); background: var(--accent); color: #fff; font: inherit; font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: background .16s, transform .16s; }
.btn:hover { background: ${mix(accent, '#000000', .12)}; }
.btn:active { transform: translateY(1px); }
.btn-ghost { background: transparent; color: var(--text); border-color: var(--line); }
.input { width: 100%; padding: 9px 12px; border: 1px solid var(--line); border-radius: calc(var(--radius) * .8); background: var(--surface); color: var(--text); font: inherit; }
.input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px ${rgba(accent, .16)}; }
.muted { color: var(--muted); font-size: var(--text-sm); }${v.dark ? `

html[data-theme="dark"] {
  --bg: ${darkBg};
  --surface: ${darkSurface};
  --text: ${darkText};
  --muted: ${mix(darkText, darkBg, .42)};
  --line: ${mix(darkText, darkBg, .84)};
  --accent: ${darkAccent};
}` : ''}`;
      return [
        TXT(css, '完整样式表', 'style.css'),
        KV([['主色 / 背景对比', contrast(accent, bg).toFixed(2) + ':1'], ['正文 / 背景对比', contrast(text, bg).toFixed(2) + ':1'], ['字号阶梯', sizes.join(' / ') + ' px'], ['圆角', radius + 'px']], '生成参数'),
        { type: 'note', value: '样式表包含重置、变量、排版、按钮、卡片与输入框基础样式，可直接作为项目起点；深色变量为启发式转换结果。' }
      ];
    }
  });
})();
