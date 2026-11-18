/* ============================================================
   工具实现：函数图像 / 数据图表 / 分享链接
   仅使用站点已有 TOOLKIT 能力与本地 qrcode 组件。
   所有表达式在本地解析，不使用 eval / new Function。
   ============================================================ */
(function () {
  'use strict';

  const T = window.TOOLKIT;
  if (!T) return;
  const R = T.register;
  const esc = T.esc;

  /* ---------------- 通用工具 ---------------- */
  const FN_STYLES = [
    { css: 'var(--accent)', key: 'accent' },
    { css: 'var(--accent-2)', key: 'accent2' },
    { css: 'var(--warn)', key: 'warn' },
    { css: 'var(--err)', key: 'err' }
  ];

  const PALETTES = [
    { name: '松石', colors: ['#2d5c4d', '#4c7f6d', '#3f76a8', '#8a641f', '#a5452f', '#6f5bb5'] },
    { name: '海蓝', colors: ['#2f6f8f', '#3f76a8', '#2f9a8f', '#67a9a0', '#1f4e5f', '#7fb7c9'] },
    { name: '陶土', colors: ['#a5452f', '#c0863a', '#8a641f', '#b5654a', '#7a3e2c', '#d19a55'] },
    { name: '紫灰', colors: ['#6f5bb5', '#8578c4', '#3f76a8', '#5b6b8c', '#9a8fc7', '#45536b'] },
    { name: '墨色', colors: ['#1b1c18', '#55564d', '#2d5c4d', '#3f76a8', '#8a641f', '#a5452f'] }
  ];

  const PIE_COLORS = ['#2d5c4d', '#3f76a8', '#c0863a', '#b03a2e', '#6f5bb5', '#2f9a8f', '#8a641f', '#7f8c4f'];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function toNum(v) {
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    const s = String(v == null ? '' : v).trim();
    if (!s) return NaN;
    const n = Number(s.replace(/,/g, ''));
    return isFinite(n) ? n : NaN;
  }

  function numText(n) {
    if (!isFinite(n)) return '';
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e7 || abs < 1e-6)) return String(Number(n.toPrecision(8)));
    return String(Number(n.toPrecision(10)));
  }

  function fmtNum(n, digits) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    const d = digits == null ? 4 : digits;
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e7 || abs < 1e-5)) return n.toExponential(Math.min(d, 3)).replace('e+', 'e');
    return n.toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  }

  function fmtAxis(n) {
    if (!isFinite(n)) return '';
    if (Math.abs(n) < 1e-10) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e5 || abs < 1e-3) return n.toExponential(1).replace('e+', 'e');
    const d = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
    return String(Number(n.toFixed(d)));
  }

  function truncate(text, max) {
    const s = String(text == null ? '' : text);
    return s.length > max ? s.slice(0, Math.max(0, max - 1)) + '…' : s;
  }

  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    function v(name, fallback) {
      const value = cs.getPropertyValue(name).trim();
      return value || fallback;
    }
    return {
      bg: v('--bg', '#f4f3ee'),
      surface: v('--surface', '#fffefb'),
      surface2: v('--surface-2', '#f9f8f3'),
      surface3: v('--surface-3', '#f1f0e9'),
      line: v('--line', '#e3e1d8'),
      lineStrong: v('--line-strong', '#cfccc0'),
      text: v('--text', '#1b1c18'),
      text2: v('--text-2', '#55564d'),
      text3: v('--text-3', '#707066'),
      accent: v('--accent', '#2d5c4d'),
      accent2: v('--accent-2', '#4c7f6d'),
      warn: v('--warn', '#8a641f'),
      err: v('--err', '#a5452f'),
      good: v('--good', '#2f7a56'),
      onAccent: v('--on-accent', '#fdfdf8'),
      fontSans: v('--font-sans', 'sans-serif'),
      fontSerif: v('--font-serif', 'serif'),
      fontMono: v('--font-mono', 'monospace')
    };
  }

  function alphaColor(color, alpha) {
    const c = String(color || '').trim();
    let r = 45, g = 92, b = 77;
    let m = c.match(/^#([0-9a-f]{3})$/i);
    if (m) {
      r = parseInt(m[1].charAt(0) + m[1].charAt(0), 16);
      g = parseInt(m[1].charAt(1) + m[1].charAt(1), 16);
      b = parseInt(m[1].charAt(2) + m[1].charAt(2), 16);
    } else {
      m = c.match(/^#([0-9a-f]{6})$/i);
      if (m) {
        r = parseInt(m[1].slice(0, 2), 16);
        g = parseInt(m[1].slice(2, 4), 16);
        b = parseInt(m[1].slice(4, 6), 16);
      } else {
        m = c.match(/^rgba?\(([^)]+)\)$/i);
        if (m) {
          const parts = m[1].split(/[,\s/]+/).filter(Boolean);
          if (parts.length >= 3) {
            r = parseFloat(parts[0]);
            g = parseFloat(parts[1]);
            b = parseFloat(parts[2]);
          }
        }
      }
    }
    return 'rgba(' + Math.round(clamp(r, 0, 255)) + ',' + Math.round(clamp(g, 0, 255)) + ',' + Math.round(clamp(b, 0, 255)) + ',' + alpha + ')';
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const n = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + n, y);
    ctx.lineTo(x + w - n, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + n);
    ctx.lineTo(x + w, y + h - n);
    ctx.quadraticCurveTo(x + w, y + h, x + w - n, y + h);
    ctx.lineTo(x + n, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - n);
    ctx.lineTo(x, y + n);
    ctx.quadraticCurveTo(x, y, x + n, y);
    ctx.closePath();
  }

  function fillRoundRect(ctx, x, y, w, h, r, color) {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function wrapCanvasText(ctx, text, maxWidth, maxLines) {
    const chars = String(text == null ? '' : text).replace(/\s+/g, ' ').trim().split('');
    const lines = [];
    let line = '';
    let truncated = false;
    for (let i = 0; i < chars.length; i++) {
      const next = line + chars[i];
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = chars[i];
        if (lines.length >= maxLines) { truncated = true; break; }
      } else {
        line = next;
      }
    }
    if (!truncated && line) lines.push(line);
    if (truncated && lines.length) {
      let last = lines[lines.length - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = last + '…';
    }
    return lines;
  }

  function fitText(ctx, text, maxWidth) {
    let s = String(text == null ? '' : text);
    if (ctx.measureText(s).width <= maxWidth) return s;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s + '…';
  }

  function niceBounds(min, max, segments) {
    if (!isFinite(min) || !isFinite(max) || max <= min) return [min, max];
    const rough = (max - min) / Math.max(3, segments || 5);
    const mag = Math.pow(10, Math.floor(Math.log(rough) / Math.LN10));
    const norm = rough / mag;
    const step = mag * (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10);
    return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
  }

  function niceTicks(min, max, count) {
    if (!isFinite(min) || !isFinite(max) || min === max) return [min];
    const span = max - min;
    const rough = span / Math.max(2, count || 5);
    const mag = Math.pow(10, Math.floor(Math.log(rough) / Math.LN10));
    const norm = rough / mag;
    const step = mag * (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10);
    const start = Math.ceil(min / step) * step;
    const out = [];
    for (let v = start; v <= max + step * 1e-8; v += step) {
      out.push(Math.abs(v) < step * 1e-8 ? 0 : v);
      if (out.length > 80) break;
    }
    return out;
  }

  function watchTheme(api, fn) {
    if (typeof MutationObserver !== 'function') return;
    const mo = new MutationObserver(function () { fn(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    api.onCleanup(function () { mo.disconnect(); });
  }

  /* ============================================================
     表达式解析器（词法 -> 语法树 -> 求值）
     ============================================================ */
  const FUNCTIONS = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sqrt: Math.sqrt,
    abs: Math.abs,
    log: function (v) { return Math.log(v) / Math.LN10; },
    ln: Math.log,
    exp: Math.exp,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round
  };

  function exprError(message, index, source) {
    const e = new Error(message);
    e.vtExpr = true;
    e.col = index + 1;
    e.source = source;
    return e;
  }

  function tokenizeExpression(src) {
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src.charAt(i);
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        const m = src.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
        if (!m) throw exprError('数字格式不完整', i, src);
        tokens.push({ t: 'num', v: parseFloat(m[0]), s: m[0], i: i });
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_π]/.test(ch)) {
        let j = i + 1;
        while (j < src.length && /[A-Za-z0-9_π]/.test(src.charAt(j))) j++;
        const s = src.slice(i, j);
        tokens.push({ t: 'ident', v: s.toLowerCase(), s: s, i: i });
        i = j;
        continue;
      }
      if ('+-*/^()'.indexOf(ch) >= 0) {
        tokens.push({ t: 'op', v: ch, s: ch, i: i });
        i++;
        continue;
      }
      throw exprError('不支持的字符「' + ch + '」', i, src);
    }
    tokens.push({ t: 'eof', v: '', s: '', i: src.length });
    return tokens;
  }

  function parseExpression(src) {
    const tokens = tokenizeExpression(src);
    let pos = 0;

    function peek() { return tokens[pos]; }
    function startsPrimary(tok) {
      return tok.t === 'num' || tok.t === 'ident' || (tok.t === 'op' && tok.v === '(');
    }
    function parsePrimary() {
      const tok = peek();
      if (tok.t === 'num') {
        pos++;
        return { t: 'num', v: tok.v };
      }
      if (tok.t === 'ident') {
        pos++;
        const name = tok.v;
        if (name === 'x') return { t: 'x' };
        if (name === 'pi' || name === 'π') return { t: 'num', v: Math.PI };
        if (name === 'e') return { t: 'num', v: Math.E };
        if (Object.prototype.hasOwnProperty.call(FUNCTIONS, name)) {
          const nxt = peek();
          if (!(nxt.t === 'op' && nxt.v === '(')) {
            throw exprError('函数「' + tok.s + '」后需要括号', nxt.i, src);
          }
          pos++;
          if (peek().t === 'op' && peek().v === ')') throw exprError('函数「' + tok.s + '」的参数不能为空', peek().i, src);
          const arg = parseAdd();
          const close = peek();
          if (!(close.t === 'op' && close.v === ')')) throw exprError('缺少右括号「)」', close.i, src);
          pos++;
          return { t: 'call', name: name, arg: arg };
        }
        throw exprError('未知的变量或函数「' + tok.s + '」', tok.i, src);
      }
      if (tok.t === 'op' && tok.v === '(') {
        pos++;
        const node = parseAdd();
        const close = peek();
        if (!(close.t === 'op' && close.v === ')')) throw exprError('缺少右括号「)」', close.i, src);
        pos++;
        return node;
      }
      if (tok.t === 'eof') throw exprError('表达式不完整，缺少数值或括号', tok.i, src);
      throw exprError('这里不能出现「' + tok.s + '」', tok.i, src);
    }
    function parsePower() {
      const base = parsePrimary();
      if (peek().t === 'op' && peek().v === '^') {
        pos++;
        return { t: 'binary', op: '^', a: base, b: parseUnary() };
      }
      return base;
    }
    function parseUnary() {
      const tok = peek();
      if (tok.t === 'op' && (tok.v === '-' || tok.v === '+')) {
        pos++;
        return { t: 'unary', op: tok.v, a: parseUnary() };
      }
      return parsePower();
    }
    function parseMul() {
      let node = parseUnary();
      while (true) {
        const tok = peek();
        if (tok.t === 'op' && (tok.v === '*' || tok.v === '/')) {
          pos++;
          node = { t: 'binary', op: tok.v, a: node, b: parseUnary() };
        } else if (startsPrimary(tok)) {
          node = { t: 'binary', op: '*', a: node, b: parseUnary() };
        } else {
          break;
        }
      }
      return node;
    }
    function parseAdd() {
      let node = parseMul();
      while (true) {
        const tok = peek();
        if (tok.t === 'op' && (tok.v === '+' || tok.v === '-')) {
          pos++;
          node = { t: 'binary', op: tok.v, a: node, b: parseMul() };
        } else {
          break;
        }
      }
      return node;
    }

    if (!src || !src.trim()) throw exprError('表达式为空', 0, src || '');
    const ast = parseAdd();
    const tail = peek();
    if (tail.t !== 'eof') throw exprError('多余的内容「' + tail.s + '」', tail.i, src);
    return ast;
  }

  function evalAst(node, x) {
    if (node.t === 'num') return node.v;
    if (node.t === 'x') return x;
    if (node.t === 'unary') {
      const v = evalAst(node.a, x);
      return node.op === '-' ? -v : v;
    }
    if (node.t === 'binary') {
      const a = evalAst(node.a, x);
      const b = evalAst(node.b, x);
      if (node.op === '+') return a + b;
      if (node.op === '-') return a - b;
      if (node.op === '*') return a * b;
      if (node.op === '/') return a / b;
      return Math.pow(a, b);
    }
    if (node.t === 'call') return FUNCTIONS[node.name](evalAst(node.arg, x));
    return NaN;
  }

  function parseFunctionText(text) {
    const lines = String(text == null ? '' : text).split(/\r?\n/);
    const items = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim()) continue;
      if (items.length >= 4) {
        const e = new Error('最多支持 4 条函数表达式');
        e.vtExpr = true;
        e.line = i + 1;
        e.col = 1;
        throw e;
      }
      const prefixMatch = raw.match(/^\s*y\s*=\s*/i);
      const prefix = prefixMatch ? prefixMatch[0].length : 0;
      const body = raw.slice(prefix);
      try {
        if (!body.trim()) throw exprError('等号后缺少表达式', 0, body);
        if (body.length > 300) throw exprError('单行表达式过长（最多 300 个字符）', 299, body);
        const ast = parseExpression(body);
        items.push({ raw: raw.trim(), body: body.trim(), ast: ast, line: i + 1 });
      } catch (e) {
        if (e && e.vtExpr) {
          e.line = i + 1;
          e.col = prefix + (e.col || 1);
          throw e;
        }
        throw e;
      }
    }
    if (!items.length) {
      const e = new Error('请输入至少一条函数表达式');
      e.vtExpr = true;
      e.line = 1;
      e.col = 1;
      throw e;
    }
    return items;
  }

  function evalFinite(ast, x) {
    let y;
    try { y = evalAst(ast, x); } catch (e) { return NaN; }
    return isFinite(y) && Math.abs(y) < 1e12 ? y : NaN;
  }

  function formatExprError(e) {
    if (!e || !e.vtExpr) return e && e.message ? e.message : '表达式解析失败';
    return '第 ' + (e.line || 1) + ' 行第 ' + (e.col || 1) + ' 个字符：' + e.message;
  }

  /* ============================================================
     工具一：函数图像绘制
     ============================================================ */
  R('函数图像绘制', {
    render(host, api) {
      host.innerHTML = `
        <div class="vt-workspace vt-plot-ws">
          <section class="vt-panel" aria-label="函数参数">
            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">01</span><h3>函数表达式</h3></div>
              <label class="vt-field">
                <span>每行一条，最多 4 条；可写 y = … 或直接写表达式</span>
                <textarea id="vtFnInput" rows="5" spellcheck="false" autocomplete="off"></textarea>
              </label>
              <div class="vt-error" id="vtFnErr" hidden></div>
              <div class="cp-note">支持 + - * / ^、x、pi / π、e，以及 sin cos tan asin acos atan sqrt abs log ln exp floor ceil round。log 以 10 为底，ln 为自然对数；2x、3sin(x) 这类隐式乘法可直接写。</div>
            </div>

            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">02</span><h3>坐标范围</h3></div>
              <div class="vt-range-group">
                <div class="vt-range-head"><span>x 范围</span><b id="vtXSpan">20</b></div>
                <div class="vt-range-inputs">
                  <label>最小 <input type="number" id="vtXMin" step="0.1" inputmode="decimal"></label>
                  <label>最大 <input type="number" id="vtXMax" step="0.1" inputmode="decimal"></label>
                </div>
                <div class="vt-sliders">
                  <input type="range" id="vtXMinR" step="0.1" aria-label="x 范围最小值">
                  <input type="range" id="vtXMaxR" step="0.1" aria-label="x 范围最大值">
                </div>
              </div>
              <label class="vt-check"><input type="checkbox" id="vtYAuto" checked><span>y 范围自动</span></label>
              <div class="vt-range-group" id="vtYGroup">
                <div class="vt-range-head"><span>y 范围（手动）</span><b id="vtYSpan">4</b></div>
                <div class="vt-range-inputs">
                  <label>最小 <input type="number" id="vtYMin" step="0.1" inputmode="decimal"></label>
                  <label>最大 <input type="number" id="vtYMax" step="0.1" inputmode="decimal"></label>
                </div>
                <div class="vt-sliders">
                  <input type="range" id="vtYMinR" step="0.1" aria-label="y 范围最小值">
                  <input type="range" id="vtYMaxR" step="0.1" aria-label="y 范围最大值">
                </div>
              </div>
              <div class="vt-error" id="vtRangeErr" hidden></div>
            </div>

            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">03</span><h3>显示与采样</h3></div>
              <label class="vt-field">
                <span>采样点数 <b class="vt-val" id="vtSamplesOut">800</b></span>
                <input type="range" id="vtSamples" min="120" max="3000" step="20" value="800">
              </label>
              <label class="vt-field">
                <span>线宽 <b class="vt-val" id="vtWidthOut">2</b></span>
                <input type="range" id="vtLineWidth" min="1" max="6" step="0.5" value="2">
              </label>
              <div class="vt-checks">
                <label class="vt-check"><input type="checkbox" id="vtGrid" checked><span>网格</span></label>
                <label class="vt-check"><input type="checkbox" id="vtAxes" checked><span>坐标轴</span></label>
                <label class="vt-check"><input type="checkbox" id="vtLegend" checked><span>图例</span></label>
              </div>
              <div class="vt-actions">
                <button type="button" class="btn btn-primary" id="vtRedraw">重新绘制</button>
                <button type="button" class="btn btn-ghost" id="vtResetView">重置视图</button>
              </div>
              <div class="vt-actions">
                <button type="button" class="btn btn-ghost btn-sm" id="vtExport">导出 PNG</button>
                <button type="button" class="btn btn-ghost btn-sm" id="vtCopySummary">复制范围文本</button>
                <button type="button" class="btn btn-ghost btn-sm" id="vtClearPins">清除打点</button>
              </div>
            </div>
          </section>

          <section class="vt-stage" aria-label="函数图像">
            <div class="vt-stage-head">
              <span class="vt-stage-title">函数图像</span>
              <span class="vt-mono" id="vtViewInfo">—</span>
            </div>
            <div class="vt-canvas-shell" id="vtCanvasShell">
              <canvas id="vtPlot" class="vt-plot-canvas" aria-label="函数曲线画布"></canvas>
            </div>
            <div class="vt-hint">拖拽平移 · 滚轮缩放 · 悬停读数 · 点击曲线打点</div>
            <div class="vt-readout" id="vtReadout"></div>
            <div class="vt-legend" id="vtLegendBox"></div>
            <div class="vt-break-box" id="vtBreaks" hidden></div>
            <details class="vt-summary" id="vtSummaryBox">
              <summary>函数与取值范围</summary>
              <pre id="vtSummary"></pre>
            </details>
          </section>
        </div>`;

      const els = {
        fn: host.querySelector('#vtFnInput'),
        fnErr: host.querySelector('#vtFnErr'),
        rangeErr: host.querySelector('#vtRangeErr'),
        xMin: host.querySelector('#vtXMin'),
        xMax: host.querySelector('#vtXMax'),
        xMinR: host.querySelector('#vtXMinR'),
        xMaxR: host.querySelector('#vtXMaxR'),
        yMin: host.querySelector('#vtYMin'),
        yMax: host.querySelector('#vtYMax'),
        yMinR: host.querySelector('#vtYMinR'),
        yMaxR: host.querySelector('#vtYMaxR'),
        yAuto: host.querySelector('#vtYAuto'),
        yGroup: host.querySelector('#vtYGroup'),
        xSpan: host.querySelector('#vtXSpan'),
        ySpan: host.querySelector('#vtYSpan'),
        samples: host.querySelector('#vtSamples'),
        samplesOut: host.querySelector('#vtSamplesOut'),
        width: host.querySelector('#vtLineWidth'),
        widthOut: host.querySelector('#vtWidthOut'),
        grid: host.querySelector('#vtGrid'),
        axes: host.querySelector('#vtAxes'),
        legend: host.querySelector('#vtLegend'),
        canvasShell: host.querySelector('#vtCanvasShell'),
        cv: host.querySelector('#vtPlot'),
        viewInfo: host.querySelector('#vtViewInfo'),
        readout: host.querySelector('#vtReadout'),
        legendBox: host.querySelector('#vtLegendBox'),
        breaks: host.querySelector('#vtBreaks'),
        summaryBox: host.querySelector('#vtSummaryBox'),
        summary: host.querySelector('#vtSummary')
      };

      const state = {
        x0: -10,
        x1: 10,
        y0: -2,
        y1: 2,
        yAuto: true,
        samples: 800,
        lineWidth: 2,
        grid: true,
        axes: true,
        legend: true,
        pins: [],
        hover: null
      };

      let drawTimer = 0;
      let hoverRaf = 0;
      let drag = null;
      let dragMoved = false;
      let last = null;
      let resizeId = 0;
      let resizeHandler = null;

      function showError(el, message) {
        if (!message) { el.hidden = true; el.textContent = ''; return; }
        el.hidden = false;
        el.textContent = message;
      }

      function requestDraw(delay) {
        clearTimeout(drawTimer);
        drawTimer = setTimeout(draw, delay == null ? 80 : delay);
      }

      function requestHoverDraw() {
        if (hoverRaf) return;
        hoverRaf = requestAnimationFrame(function () {
          hoverRaf = 0;
          draw();
        });
      }

      function syncRangeBounds() {
        function setPair(minEl, maxEl, lo, hi) {
          const a = Math.min(Math.floor(lo), -100);
          const b = Math.max(Math.ceil(hi), 100);
          const step = Math.max((b - a) / 1200, 0.000001);
          [minEl, maxEl].forEach(function (input) {
            input.min = String(a);
            input.max = String(b);
            input.step = String(step);
          });
        }
        if (isFinite(state.x0) && isFinite(state.x1)) setPair(els.xMinR, els.xMaxR, Math.min(state.x0, state.x1), Math.max(state.x0, state.x1));
        if (isFinite(state.y0) && isFinite(state.y1)) setPair(els.yMinR, els.yMaxR, Math.min(state.y0, state.y1), Math.max(state.y0, state.y1));
      }

      function syncControls() {
        if (isFinite(state.x0)) {
          els.xMin.value = numText(state.x0);
          els.xMinR.value = String(clamp(state.x0, Number(els.xMinR.min), Number(els.xMinR.max)));
        }
        if (isFinite(state.x1)) {
          els.xMax.value = numText(state.x1);
          els.xMaxR.value = String(clamp(state.x1, Number(els.xMaxR.min), Number(els.xMaxR.max)));
        }
        if (isFinite(state.y0)) {
          els.yMin.value = numText(state.y0);
          els.yMinR.value = String(clamp(state.y0, Number(els.yMinR.min), Number(els.yMinR.max)));
        }
        if (isFinite(state.y1)) {
          els.yMax.value = numText(state.y1);
          els.yMaxR.value = String(clamp(state.y1, Number(els.yMaxR.min), Number(els.yMaxR.max)));
        }
        els.yMin.disabled = state.yAuto;
        els.yMax.disabled = state.yAuto;
        els.yMinR.disabled = state.yAuto;
        els.yMaxR.disabled = state.yAuto;
        els.yGroup.classList.toggle('is-disabled', state.yAuto);
        updateSpans();
      }

      function updateSpans() {
        const xSpan = isFinite(state.x0) && isFinite(state.x1) ? state.x1 - state.x0 : NaN;
        const ySpan = isFinite(state.y0) && isFinite(state.y1) ? state.y1 - state.y0 : NaN;
        els.xSpan.textContent = isFinite(xSpan) ? fmtNum(xSpan, 4) : '—';
        els.ySpan.textContent = isFinite(ySpan) ? fmtNum(ySpan, 4) : '—';
      }

      function syncOutputs() {
        syncRangeBounds();
        syncControls();
      }

      function rangeError() {
        if (!isFinite(state.x0) || !isFinite(state.x1)) return 'x 范围需要填写有效数字。';
        if (state.x1 <= state.x0) return 'x 最小值必须小于最大值。';
        const xSpan = state.x1 - state.x0;
        if (!isFinite(xSpan) || xSpan < 1e-9) return 'x 范围跨度过小或过大，请调整后重试。';
        if (!state.yAuto) {
          if (!isFinite(state.y0) || !isFinite(state.y1)) return 'y 范围需要填写有效数字，或勾选「y 范围自动」。';
          if (state.y1 <= state.y0) return 'y 最小值必须小于最大值，或勾选「y 范围自动」。';
          const ySpan = state.y1 - state.y0;
          if (!isFinite(ySpan) || ySpan < 1e-9) return 'y 范围跨度过小或过大，请调整后重试。';
        }
        return '';
      }

      function valuesAutoRange(seriesList) {
        const values = [];
        for (let s = 0; s < seriesList.length; s++) {
          for (let i = 0; i < seriesList[s].values.length; i++) {
            const y = seriesList[s].values[i];
            if (isFinite(y)) values.push(y);
          }
        }
        if (!values.length) return [-1, 1];
        values.sort(function (a, b) { return a - b; });
        const q = function (p) {
          const idx = clamp(Math.floor((values.length - 1) * p), 0, values.length - 1);
          return values[idx];
        };
        const q1 = q(0.25), q3 = q(0.75);
        const iqr = Math.max(q3 - q1, 1e-9);
        let lo = Math.max(values[0], q1 - 5 * iqr);
        let hi = Math.min(values[values.length - 1], q3 + 5 * iqr);
        if (!(hi > lo)) { lo = values[0]; hi = values[values.length - 1]; }
        if (!(hi > lo)) { lo -= 1; hi += 1; }
        const span = hi - lo;
        lo -= span * 0.08;
        hi += span * 0.08;
        return niceBounds(lo, hi, 6);
      }

      function fitPlot() {
        const shell = els.canvasShell;
        const w = Math.max(300, Math.floor((shell.clientWidth || 760) - 20));
        const h = Math.max(340, Math.min(560, Math.round(w * 0.62)));
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2.5);
        els.cv.width = Math.round(w * dpr);
        els.cv.height = Math.round(h * dpr);
        els.cv.style.width = '100%';
        els.cv.style.height = 'auto';
        const ctx = els.cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx: ctx, w: w, h: h };
      }

      function drawFail(message) {
        const fit = fitPlot();
        const ctx = fit.ctx, w = fit.w, h = fit.h, theme = readTheme();
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = theme.surface;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(10.5, 10.5, w - 21, h - 21);
        ctx.fillStyle = theme.text3;
        ctx.font = '12.5px ' + theme.fontSans;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = wrapCanvasText(ctx, message, Math.max(200, w - 70), 4);
        const start = h / 2 - (lines.length - 1) * 10;
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], w / 2, start + i * 20);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        last = null;
        els.legendBox.innerHTML = '';
        els.breaks.hidden = true;
        els.breaks.innerHTML = '';
        els.summary.textContent = '';
        els.readout.innerHTML = '<span class="vt-muted">修正参数后会重新绘制。</span>';
        els.viewInfo.textContent = '—';
      }

      function pickNearest(mx, my, maxDist) {
        if (!last) return null;
        let best = null;
        const limit = maxDist == null ? 90 : maxDist;
        for (let s = 0; s < last.series.length; s++) {
          const points = last.series[s].points;
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (!p || !p.ok) continue;
            const dx = p.px - mx;
            const dy = p.py - my;
            const d2 = dx * dx + dy * dy;
            if (d2 > limit * limit) continue;
            if (!best || d2 < best.d2) best = { d2: d2, series: s, point: p };
          }
        }
        return best;
      }

      function updateReadout() {
        const items = [];
        if (last && state.hover && state.hover.point) {
          const h = state.hover;
          items.push('<span class="vt-readout-item"><i class="vt-swatch-line" style="background:' + last.series[h.series].css + '"></i>最近点 f' + (h.series + 1) + '<b>x = ' + fmtNum(h.point.x, 6) + '</b><b>y = ' + fmtNum(h.point.y, 6) + '</b></span>');
        } else if (last && state.hover) {
          const p = last.plot;
          const cx = last.x0 + (state.hover.mx - p.x) / p.w * (last.x1 - last.x0);
          const cy = last.y1 - (state.hover.my - p.y) / p.h * (last.y1 - last.y0);
          items.push('<span class="vt-readout-item">光标 <b>x = ' + fmtNum(cx, 4) + '</b><b>y = ' + fmtNum(cy, 4) + '</b><span class="vt-muted">靠近曲线可显示最近采样点</span></span>');
        } else {
          items.push('<span class="vt-muted">把鼠标移到曲线上查看最近的 (x, y) 数值。</span>');
        }
        if (state.pins.length) {
          items.push('<span class="vt-pin-title">已打点</span>');
          state.pins.forEach(function (p, i) {
            items.push('<span class="vt-pin"><i class="vt-swatch-line" style="background:' + p.css + '"></i>P' + (i + 1) + ' · f' + (p.series + 1) + ' · x=' + fmtNum(p.x, 6) + ' · y=' + fmtNum(p.y, 6) + '</span>');
          });
        }
        els.readout.innerHTML = items.join('');
      }

      function updateLegend(series) {
        if (!state.legend) {
          els.legendBox.innerHTML = '';
          return;
        }
        els.legendBox.innerHTML = series.map(function (s, i) {
          return '<span class="vt-legend-item"><i class="vt-swatch-line" style="background:' + s.css + '"></i><code>f' + (i + 1) + '(x) = ' + esc(s.body) + '</code></span>';
        }).join('');
      }

      function updateBreaks(series) {
        const rows = [];
        series.forEach(function (s, i) {
          if (!s.breaks.length) return;
          rows.push('<span class="vt-break"><i class="vt-swatch-line" style="background:' + s.css + '"></i><b>f' + (i + 1) + '</b> 疑似断点 / 不连续：x ≈ ' + s.breaks.map(function (x) { return fmtNum(x, 6); }).join('、') + '</span>');
        });
        if (!rows.length) {
          els.breaks.hidden = true;
          els.breaks.innerHTML = '';
          return;
        }
        els.breaks.hidden = false;
        els.breaks.innerHTML = '<div class="vt-break-title">定义域断点</div>' + rows.join('');
      }

      function buildSummary(series) {
        const auto = state.yAuto;
        const lines = ['函数图像绘制', 'x 范围：[' + fmtNum(state.x0, 8) + ', ' + fmtNum(state.x1, 8) + ']', 'y 范围：' + (auto ? '自动 ' : '手动 ') + '[' + fmtNum(state.y0, 8) + ', ' + fmtNum(state.y1, 8) + ']', '采样点数：' + state.samples, ''];
        series.forEach(function (s, i) {
          lines.push('f' + (i + 1) + '(x) = ' + s.body);
          lines.push('  定义域断点：' + (s.breaks.length ? s.breaks.map(function (x) { return 'x ≈ ' + fmtNum(x, 6); }).join('、') : '当前 x 范围内未检测到'));
        });
        if (state.pins.length) {
          lines.push('', '打点读数：');
          state.pins.forEach(function (p, i) {
            lines.push('  P' + (i + 1) + '  f' + (p.series + 1) + '  x = ' + fmtNum(p.x, 8) + '  y = ' + fmtNum(p.y, 8));
          });
        }
        return lines.join('\n');
      }

      function drawLegendOnCanvas(ctx, series, theme, x, y, maxWidth) {
        if (!state.legend) return;
        ctx.font = '10.5px ' + theme.fontSans;
        ctx.textBaseline = 'middle';
        let cx = x;
        for (let i = 0; i < series.length; i++) {
          const long = fitText(ctx, 'f' + (i + 1) + ' ' + series[i].body, 170);
          const label = maxWidth > 540 ? long : 'f' + (i + 1);
          const tw = ctx.measureText(label).width;
          if (cx + tw + 20 > x + maxWidth) break;
          ctx.fillStyle = series[i].color;
          ctx.fillRect(cx, y - 1.5, 11, 3);
          ctx.fillStyle = theme.text2;
          ctx.fillText(label, cx + 16, y);
          cx += tw + 28;
        }
        ctx.textBaseline = 'alphabetic';
      }

      function draw() {
        const fit = fitPlot();
        const ctx = fit.ctx, W = fit.w, H = fit.h, theme = readTheme();
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = theme.surface;
        ctx.fillRect(0, 0, W, H);

        showError(els.rangeErr, rangeError());
        if (rangeError()) {
          drawFail(rangeError());
          return;
        }

        let items;
        try {
          items = parseFunctionText(els.fn.value);
          showError(els.fnErr, '');
        } catch (e) {
          const msg = formatExprError(e);
          showError(els.fnErr, msg);
          drawFail(msg);
          return;
        }

        const series = items.map(function (item, idx) {
          const style = FN_STYLES[idx % FN_STYLES.length];
          return {
            body: item.body,
            ast: item.ast,
            css: style.css,
            color: theme[style.key],
            values: [],
            points: [],
            breaks: []
          };
        });

        const n = clamp(Math.round(state.samples), 120, 3000);
        const x0 = state.x0, x1 = state.x1;
        for (let s = 0; s < series.length; s++) {
          const values = new Array(n + 1);
          for (let i = 0; i <= n; i++) {
            const x = x0 + (x1 - x0) * (i / n);
            values[i] = evalFinite(series[s].ast, x);
          }
          series[s].values = values;
        }

        if (state.yAuto) {
          const auto = valuesAutoRange(series);
          state.y0 = auto[0];
          state.y1 = auto[1];
        }
        const y0 = state.y0, y1 = state.y1;

        const legendTop = state.legend ? 24 : 8;
        const left = W < 420 ? 46 : 56;
        const right = 16;
        const bottom = 34;
        const plot = { x: left, y: legendTop + 10, w: Math.max(40, W - left - right), h: Math.max(40, H - legendTop - 10 - bottom) };
        const mapX = function (x) { return plot.x + (x - x0) / (x1 - x0) * plot.w; };
        const mapY = function (y) { return plot.y + (y1 - y) / (y1 - y0) * plot.h; };
        const sx = mapX, sy = mapY;
        const ySpan = y1 - y0;
        const jumpLimit = Math.max(ySpan * 0.72, 1e-9);

        drawLegendOnCanvas(ctx, series, theme, plot.x, 14, plot.w);

        const xTicks = niceTicks(x0, x1, W > 560 ? 8 : 5);
        const yTicks = niceTicks(y0, y1, H > 420 ? 7 : 5);

        ctx.save();
        ctx.beginPath();
        ctx.rect(plot.x, plot.y, plot.w, plot.h);
        ctx.clip();

        if (state.grid) {
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = 1;
          ctx.beginPath();
          xTicks.forEach(function (t) {
            const px = Math.round(sx(t)) + 0.5;
            ctx.moveTo(px, plot.y);
            ctx.lineTo(px, plot.y + plot.h);
          });
          yTicks.forEach(function (t) {
            const py = Math.round(sy(t)) + 0.5;
            ctx.moveTo(plot.x, py);
            ctx.lineTo(plot.x + plot.w, py);
          });
          ctx.stroke();
        }

        if (state.axes) {
          ctx.strokeStyle = theme.lineStrong;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (y0 < 0 && y1 > 0) {
            const py = Math.round(sy(0)) + 0.5;
            ctx.moveTo(plot.x, py);
            ctx.lineTo(plot.x + plot.w, py);
          }
          if (x0 < 0 && x1 > 0) {
            const px = Math.round(sx(0)) + 0.5;
            ctx.moveTo(px, plot.y);
            ctx.lineTo(px, plot.y + plot.h);
          }
          ctx.stroke();
        }

        series.forEach(function (s) {
          let current = [];
          let prev = null;
          let invalidSince = false;
          function addBreak(bx) {
            if (!s.breaks.length || Math.abs(s.breaks[s.breaks.length - 1] - bx) > (x1 - x0) * 0.006) s.breaks.push(bx);
          }
          function flush() {
            if (current.length > 1) {
              ctx.beginPath();
              for (let k = 0; k < current.length; k++) {
                if (k === 0) ctx.moveTo(current[k].px, current[k].py);
                else ctx.lineTo(current[k].px, current[k].py);
              }
              ctx.strokeStyle = s.color;
              ctx.lineWidth = state.lineWidth;
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
              ctx.stroke();
            }
            current = [];
          }
          for (let i = 0; i < s.values.length; i++) {
            const y = s.values[i];
            const x = x0 + (x1 - x0) * (i / n);
            if (!isFinite(y)) {
              flush();
              if (prev) addBreak((prev.x + x) / 2);
              prev = null;
              invalidSince = true;
              continue;
            }
            if (invalidSince) {
              addBreak(x);
              invalidSince = false;
            }
            if (prev && Math.abs(y - prev.y) > jumpLimit) {
              flush();
              addBreak((prev.x + x) / 2);
            }
            const px = sx(x);
            const py = clamp(sy(y), plot.y - 2000, plot.y + plot.h + 2000);
            const point = { x: x, y: y, px: px, py: py, ok: true };
            s.points.push(point);
            current.push(point);
            prev = point;
          }
          flush();
          if (s.breaks.length > 12) s.breaks = s.breaks.slice(0, 12);
        });

        series.forEach(function (s) {
          if (!s.breaks.length) return;
          ctx.save();
          ctx.strokeStyle = alphaColor(s.color, 0.58);
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          s.breaks.forEach(function (bx) {
            const px = sx(bx);
            ctx.beginPath();
            ctx.moveTo(px, plot.y);
            ctx.lineTo(px, plot.y + plot.h);
            ctx.stroke();
          });
          ctx.restore();
        });

        state.pins.forEach(function (p) {
          if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) return;
          const px = sx(p.x), py = sy(p.y);
          ctx.beginPath();
          ctx.arc(px, py, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = theme.surface;
          ctx.fill();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        if (state.hover && state.hover.point) {
          const p = state.hover.point;
          const px = p.px, py = p.py;
          ctx.save();
          ctx.strokeStyle = alphaColor(theme.text3, 0.45);
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(px, plot.y);
          ctx.lineTo(px, plot.y + plot.h);
          ctx.moveTo(plot.x, py);
          ctx.lineTo(plot.x + plot.w, py);
          ctx.stroke();
          ctx.restore();
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = theme.surface;
          ctx.fill();
          ctx.strokeStyle = series[state.hover.series].color;
          ctx.lineWidth = 2;
          ctx.stroke();

          const label = 'f' + (state.hover.series + 1) + '  (' + fmtNum(p.x, 4) + ', ' + fmtNum(p.y, 4) + ')';
          ctx.font = '11px ' + theme.fontMono;
          const tw = ctx.measureText(label).width;
          let bx = px + 12;
          let by = py - 34;
          if (bx + tw + 16 > W - 8) bx = px - tw - 24;
          if (by < plot.y + 6) by = py + 14;
          fillRoundRect(ctx, bx, by, tw + 16, 24, 5, theme.surface);
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = 1;
          roundRectPath(ctx, bx + 0.5, by + 0.5, tw + 15, 23, 5);
          ctx.stroke();
          ctx.fillStyle = theme.text;
          ctx.textBaseline = 'middle';
          ctx.fillText(label, bx + 8, by + 12.5);
          ctx.textBaseline = 'alphabetic';
        }

        ctx.restore();

        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(plot.x + 0.5, plot.y + 0.5, plot.w - 1, plot.h - 1);

        ctx.font = '10px ' + theme.fontMono;
        ctx.fillStyle = theme.text3;
        ctx.textAlign = 'center';
        xTicks.forEach(function (t) {
          const px = sx(t);
          ctx.fillText(fmtAxis(t), px, plot.y + plot.h + 16);
        });
        ctx.textAlign = 'right';
        yTicks.forEach(function (t) {
          const py = sy(t);
          ctx.fillText(fmtAxis(t), plot.x - 8, py + 3);
        });
        ctx.textAlign = 'left';

        last = {
          w: W,
          h: H,
          plot: plot,
          x0: x0,
          x1: x1,
          y0: y0,
          y1: y1,
          series: series
        };

        if (state.hover) {
          const best = pickNearest(state.hover.mx, state.hover.my, 95);
          state.hover = best
            ? { series: best.series, point: best.point, mx: state.hover.mx, my: state.hover.my }
            : { series: 0, point: null, mx: state.hover.mx, my: state.hover.my };
        }

        updateLegend(series);
        updateBreaks(series);
        updateReadout();
        if (state.yAuto) {
          syncRangeBounds();
          els.yMin.value = numText(state.y0);
          els.yMax.value = numText(state.y1);
          els.yMinR.value = String(clamp(state.y0, Number(els.yMinR.min), Number(els.yMinR.max)));
          els.yMaxR.value = String(clamp(state.y1, Number(els.yMinR.min), Number(els.yMinR.max)));
        }
        els.viewInfo.textContent = 'x ' + fmtNum(state.x0, 5) + ' ~ ' + fmtNum(state.x1, 5) + ' · y ' + fmtNum(state.y0, 5) + ' ~ ' + fmtNum(state.y1, 5);
        els.summary.textContent = buildSummary(series);
        updateSpans();
      }

      function eventPoint(e) {
        const rect = els.cv.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (last.w / Math.max(1, rect.width));
        const my = (e.clientY - rect.top) * (last.h / Math.max(1, rect.height));
        return { mx: mx, my: my };
      }

      function insidePlot(mx, my) {
        if (!last) return false;
        const p = last.plot;
        return mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h;
      }

      function dataX(mx) {
        const p = last.plot;
        return last.x0 + (mx - p.x) / p.w * (last.x1 - last.x0);
      }

      function onPointerMove(e) {
        if (!last) return;
        const pos = eventPoint(e);
        if (drag) {
          const dx = pos.mx - drag.mx;
          const dy = pos.my - drag.my;
          if (!dragMoved && Math.abs(dx) + Math.abs(dy) < 3) return;
          dragMoved = true;
          els.cv.classList.add('is-drag');
          if (state.yAuto) {
            state.yAuto = false;
            els.yAuto.checked = false;
            syncOutputs();
          }
          const xPer = (drag.x1 - drag.x0) / last.plot.w;
          const yPer = (drag.y1 - drag.y0) / last.plot.h;
          state.x0 = drag.x0 - dx * xPer;
          state.x1 = drag.x1 - dx * xPer;
          state.y0 = drag.y0 + dy * yPer;
          state.y1 = drag.y1 + dy * yPer;
          syncOutputs();
          requestDraw(30);
          return;
        }
        if (!insidePlot(pos.mx, pos.my)) {
          if (state.hover) { state.hover = null; requestHoverDraw(); }
          return;
        }
        const best = pickNearest(pos.mx, pos.my, 95);
        state.hover = best ? { series: best.series, point: best.point, mx: pos.mx, my: pos.my } : { series: 0, point: null, mx: pos.mx, my: pos.my };
        requestHoverDraw();
      }

      function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (!last) return;
        const pos = eventPoint(e);
        if (!insidePlot(pos.mx, pos.my)) return;
        dragMoved = false;
        state.hover = null;
        drag = { mx: pos.mx, my: pos.my, x0: state.x0, x1: state.x1, y0: state.y0, y1: state.y1 };
        try { els.cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }

      function onPointerUp() {
        drag = null;
        els.cv.classList.remove('is-drag');
      }

      function onPointerLeave() {
        if (drag) return;
        if (state.hover) {
          state.hover = null;
          requestHoverDraw();
        }
      }

      function onClick(e) {
        if (dragMoved || !last) return;
        const pos = eventPoint(e);
        if (!insidePlot(pos.mx, pos.my)) return;
        const x = clamp(dataX(pos.mx), last.x0, last.x1);
        let seriesIdx = -1;
        const nearest = pickNearest(pos.mx, pos.my, 130);
        if (nearest) seriesIdx = nearest.series;
        else {
          let bestY = null;
          last.series.forEach(function (s, i) {
            const y = evalFinite(s.ast, x);
            if (!isFinite(y)) return;
            const py = last.plot.y + (last.y1 - y) / (last.y1 - last.y0) * last.plot.h;
            const d = Math.abs(py - pos.my);
            if (!bestY || d < bestY.d) bestY = { series: i, d: d };
          });
          if (!bestY) { api.toast('这里没有可读的函数值', 'err'); return; }
          seriesIdx = bestY.series;
        }
        if (seriesIdx < 0) return;
        const y = evalFinite(last.series[seriesIdx].ast, x);
        if (!isFinite(y)) { api.toast('该点不在定义域内', 'err'); return; }
        if (state.pins.length >= 8) state.pins.shift();
        state.pins.push({ series: seriesIdx, x: x, y: y, css: last.series[seriesIdx].css, color: last.series[seriesIdx].color });
        draw();
      }

      function onWheel(e) {
        if (!last) return;
        e.preventDefault();
        const pos = eventPoint(e);
        if (!insidePlot(pos.mx, pos.my)) return;
        const factor = e.deltaY > 0 ? 1.16 : 1 / 1.16;
        if (state.yAuto) {
          state.yAuto = false;
          els.yAuto.checked = false;
          syncOutputs();
        }
        const x = dataX(pos.mx);
        const y = last.y1 - (pos.my - last.plot.y) / last.plot.h * (last.y1 - last.y0);
        let nx0 = x - (x - state.x0) * factor;
        let nx1 = x + (state.x1 - x) * factor;
        let ny0 = y - (y - state.y0) * factor;
        let ny1 = y + (state.y1 - y) * factor;
        if (!(nx1 > nx0) || !(ny1 > ny0)) return;
        if (nx1 - nx0 < 1e-7 || ny1 - ny0 < 1e-7) return;
        if (nx1 - nx0 > 1e9 || ny1 - ny0 > 1e9) return;
        state.x0 = nx0; state.x1 = nx1; state.y0 = ny0; state.y1 = ny1;
        state.hover = null;
        syncOutputs();
        requestDraw(20);
      }

      function resetView() {
        state.x0 = -10; state.x1 = 10;
        state.yAuto = true;
        els.yAuto.checked = true;
        state.hover = null;
        state.pins = [];
        syncOutputs();
        draw();
      }

      function bindNumber(input, key) {
        input.addEventListener('input', function () {
          const v = parseFloat(input.value);
          if (isFinite(v)) state[key] = v;
          else state[key] = NaN;
          syncRangeBounds();
          updateSpans();
          requestDraw(120);
        });
      }

      bindNumber(els.xMin, 'x0');
      bindNumber(els.xMax, 'x1');
      bindNumber(els.yMin, 'y0');
      bindNumber(els.yMax, 'y1');

      function bindRange(input, key, otherKey, isMin) {
        input.addEventListener('input', function () {
          let v = parseFloat(input.value);
          if (!isFinite(v)) return;
          if (isFinite(state[otherKey])) {
            if (isMin && v >= state[otherKey]) v = state[otherKey] - Math.max(0.001, Math.abs(state[otherKey]) * 0.002);
            if (!isMin && v <= state[otherKey]) v = state[otherKey] + Math.max(0.001, Math.abs(state[otherKey]) * 0.002);
          }
          state[key] = v;
          state.hover = null;
          syncControls();
          requestDraw(30);
        });
      }

      bindRange(els.xMinR, 'x0', 'x1', true);
      bindRange(els.xMaxR, 'x1', 'x0', false);
      bindRange(els.yMinR, 'y0', 'y1', true);
      bindRange(els.yMaxR, 'y1', 'y0', false);

      els.yAuto.addEventListener('change', function () {
        state.yAuto = els.yAuto.checked;
        syncControls();
        draw();
      });
      els.samples.addEventListener('input', function () {
        state.samples = parseInt(els.samples.value, 10) || 800;
        els.samplesOut.textContent = String(state.samples);
        requestDraw(100);
      });
      els.width.addEventListener('input', function () {
        state.lineWidth = parseFloat(els.width.value) || 2;
        els.widthOut.textContent = String(state.lineWidth);
        requestDraw(50);
      });
      els.grid.addEventListener('change', function () { state.grid = els.grid.checked; draw(); });
      els.axes.addEventListener('change', function () { state.axes = els.axes.checked; draw(); });
      els.legend.addEventListener('change', function () { state.legend = els.legend.checked; draw(); });
      els.fn.addEventListener('input', function () {
        state.pins = [];
        state.hover = null;
        requestDraw(180);
      });
      host.querySelector('#vtRedraw').addEventListener('click', draw);
      host.querySelector('#vtResetView').addEventListener('click', resetView);
      host.querySelector('#vtExport').addEventListener('click', function () {
        if (!els.cv.width) return;
        api.save(els.cv.toDataURL('image/png'), 'function-plot.png');
      });
      host.querySelector('#vtCopySummary').addEventListener('click', function () {
        const text = els.summary.textContent;
        if (!text) { api.toast('当前没有可复制的函数信息', 'err'); return; }
        api.copy(text);
      });
      host.querySelector('#vtClearPins').addEventListener('click', function () {
        state.pins = [];
        draw();
      });

      els.cv.addEventListener('pointerdown', onPointerDown);
      els.cv.addEventListener('pointermove', onPointerMove);
      els.cv.addEventListener('pointerup', onPointerUp);
      els.cv.addEventListener('pointercancel', onPointerUp);
      els.cv.addEventListener('pointerleave', onPointerLeave);
      els.cv.addEventListener('click', onClick);
      els.cv.addEventListener('wheel', onWheel, { passive: false });

      resizeHandler = function () {
        clearTimeout(resizeId);
        resizeId = setTimeout(function () {
          if (host.isConnected) draw();
        }, 140);
      };
      window.addEventListener('resize', resizeHandler);

      api.onCleanup(function () {
        clearTimeout(drawTimer);
        clearTimeout(resizeId);
        if (hoverRaf) cancelAnimationFrame(hoverRaf);
        if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        els.cv.removeEventListener('pointerdown', onPointerDown);
        els.cv.removeEventListener('pointermove', onPointerMove);
        els.cv.removeEventListener('pointerup', onPointerUp);
        els.cv.removeEventListener('pointercancel', onPointerUp);
        els.cv.removeEventListener('pointerleave', onPointerLeave);
        els.cv.removeEventListener('click', onClick);
        els.cv.removeEventListener('wheel', onWheel);
      });

      watchTheme(api, function () { draw(); });

      els.fn.value = 'y = sin(x)\ny = x^2 / 8';
      syncOutputs();
      els.readout.innerHTML = '<span class="vt-muted">起始示例：sin(x) 与 x²/8。修改表达式后会自动重绘。</span>';
      draw();
    }
  });

  /* ============================================================
     表格解析 / 图表数据
     ============================================================ */
  function detectDelimiter(lines) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].indexOf('\t') >= 0) return '\t';
    }
    for (let j = 0; j < Math.min(lines.length, 5); j++) {
      if (lines[j].indexOf(',') >= 0) return ',';
    }
    for (let k = 0; k < Math.min(lines.length, 5); k++) {
      if (lines[k].indexOf(';') >= 0) return ';';
    }
    return '';
  }

  function splitDelimited(line, delim) {
    if (!delim) return [line];
    const cells = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line.charAt(i);
      if (ch === '"') {
        if (quoted && line.charAt(i + 1) === '"') { cur += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === delim && !quoted) {
        cells.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map(function (s) { return s.trim(); });
  }

  function parseTableText(text, hasHeader) {
    const raw = String(text == null ? '' : text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const lines = raw.split('\n').filter(function (line) { return line.trim() !== ''; });
    if (!lines.length) throw new Error('请先粘贴表格数据，或载入示例。');
    const delim = detectDelimiter(lines);
    const matrix = lines.map(function (line) { return splitDelimited(line, delim); });
    let head = [];
    let rows = [];
    let warnings = [];
    const truncatedRows = Math.max(0, matrix.length - 1 - 200);
    const working = matrix.slice(0, 201);
    if (truncatedRows) warnings.push('数据超过 200 行，仅使用前 200 行绘制。');

    if (working.length === 1 && hasHeader) throw new Error('只有表头，没有数据行；请取消勾选「首行作为表头」或补充数据。');

    if (hasHeader) {
      head = working[0].slice();
      rows = working.slice(1);
    } else {
      const width = Math.max.apply(null, working.map(function (r) { return r.length; }));
      head = ['标签'];
      for (let c = 1; c < width; c++) head.push('系列 ' + c);
      rows = working.slice();
    }

    rows = rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
    if (!rows.length) throw new Error('没有可用的数据行。');

    let width = Math.max.apply(null, [head.length].concat(rows.map(function (r) { return r.length; })));
    if (width > 8) {
      width = 8;
      warnings.push('列数超过 8 列，仅使用前 8 列。');
    }
    while (head.length < width) head.push('');
    head = head.slice(0, width);
    rows = rows.map(function (r) {
      const out = r.slice(0, width);
      while (out.length < width) out.push('');
      return out;
    });

    if (width === 1) {
      head = [hasHeader ? '序号' : '序号', hasHeader ? (head[0] || '数值') : '数值'];
      rows = rows.map(function (r, i) { return [String(i + 1), r[0]]; });
      width = 2;
    } else {
      head[0] = String(head[0] || '标签').trim() || '标签';
    }
    for (let h = 1; h < width; h++) head[h] = String(head[h] || ('系列 ' + h)).trim();
    return { head: head, rows: rows, hasHeader: !!hasHeader, warnings: warnings };
  }

  function buildChartData(head, rows, hasHeader) {
    const warnings = [];
    const categories = rows.map(function (r, i) {
      const v = String(r[0] == null ? '' : r[0]).trim();
      return v || String(i + 1);
    });
    const series = [];
    for (let c = 1; c < head.length; c++) {
      const values = [];
      let valid = 0;
      let invalid = 0;
      let firstInvalid = null;
      for (let r = 0; r < rows.length; r++) {
        const raw = String(rows[r][c] == null ? '' : rows[r][c]).trim();
        if (!raw) { values.push(null); continue; }
        const n = toNum(raw);
        if (!isFinite(n)) {
          invalid++;
          if (!firstInvalid) firstInvalid = { row: r + 1, text: raw };
          values.push(null);
        } else {
          values.push(n);
          valid++;
        }
      }
      if (!valid) {
        if (invalid) warnings.push('第 ' + (c + 1) + ' 列没有有效数字，已跳过。');
        continue;
      }
      if (invalid) warnings.push('第 ' + (c + 1) + ' 列有 ' + invalid + ' 个非数字单元格（如第 ' + firstInvalid.row + ' 行「' + truncate(firstInvalid.text, 12) + '」），图中按缺失值处理。');
      series.push({ name: String(head[c] || ('系列 ' + c)), values: values, col: c });
    }
    if (!series.length) throw new Error('没有解析到数值列，请检查数据格式。');
    return { head: head, rows: rows, categories: categories, series: series, warnings: warnings, hasHeader: !!hasHeader };
  }

  function seriesStats(series) {
    const valid = series.values.filter(function (v) { return typeof v === 'number' && isFinite(v); });
    if (!valid.length) return { count: 0, min: NaN, max: NaN, avg: NaN, sum: NaN };
    let min = valid[0], max = valid[0], sum = 0;
    for (let i = 0; i < valid.length; i++) {
      if (valid[i] < min) min = valid[i];
      if (valid[i] > max) max = valid[i];
      sum += valid[i];
    }
    return { count: valid.length, min: min, max: max, avg: sum / valid.length, sum: sum };
  }

  /* ============================================================
     工具二：数据图表生成
     ============================================================ */
  R('数据图表生成', {
    render(host, api) {
      host.innerHTML = `
        <div class="vt-workspace">
          <section class="vt-panel" aria-label="图表参数">
            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">01</span><h3>数据</h3></div>
              <label class="vt-field">
                <span>粘贴 CSV / TSV，或每行一个数值</span>
                <textarea id="vtDataText" rows="7" spellcheck="false" autocomplete="off"></textarea>
              </label>
              <label class="vt-check"><input type="checkbox" id="vtHasHeader" checked><span>首行作为表头</span></label>
              <div class="vt-actions">
                <button type="button" class="btn btn-primary" id="vtParseData">解析数据</button>
                <button type="button" class="btn btn-ghost" id="vtLoadSample">载入示例</button>
              </div>
              <div class="vt-error" id="vtDataErr" hidden></div>
              <div class="cp-note" id="vtDataNote">解析后可以直接在下方表格里修改单元格，图表会即时更新。</div>
            </div>

            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">02</span><h3>图表参数</h3></div>
              <label class="vt-field">
                <span>图表类型</span>
                <select id="vtChartType">
                  <option value="bar">柱状图 · 分组</option>
                  <option value="bar-stack">柱状图 · 堆叠</option>
                  <option value="line">折线图</option>
                  <option value="area">面积图</option>
                  <option value="pie">饼图</option>
                  <option value="donut">环形图</option>
                  <option value="scatter">散点图</option>
                </select>
              </label>
              <label class="vt-field"><span>标题</span><input type="text" id="vtChartTitle" maxlength="60"></label>
              <div class="vt-range-inputs">
                <label>宽度 <input type="number" id="vtChartW" min="480" max="1600" step="10"></label>
                <label>高度 <input type="number" id="vtChartH" min="320" max="1000" step="10"></label>
              </div>
              <label class="vt-field">
                <span>排序</span>
                <select id="vtChartSort">
                  <option value="none">原始顺序</option>
                  <option value="label-asc">标签升序</option>
                  <option value="value-asc">数值升序（按合计）</option>
                  <option value="value-desc">数值降序（按合计）</option>
                </select>
              </label>
              <div class="vt-checks">
                <label class="vt-check"><input type="checkbox" id="vtShowValues" checked><span>显示数值标签</span></label>
                <label class="vt-check"><input type="checkbox" id="vtShowGrid" checked><span>网格</span></label>
                <label class="vt-check"><input type="checkbox" id="vtShowLegend" checked><span>图例</span></label>
                <label class="vt-check"><input type="checkbox" id="vtStartZero" checked><span>Y 轴从 0 开始</span></label>
              </div>
              <div class="vt-field"><span>配色预设（纯色）</span><div class="vt-palettes" id="vtPalettes"></div></div>
            </div>

            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">03</span><h3>数据摘要</h3></div>
              <div class="vt-stat-grid" id="vtStats"></div>
              <div class="vt-actions">
                <button type="button" class="btn btn-ghost btn-sm" id="vtCopyStats">复制数据摘要</button>
                <button type="button" class="btn btn-ghost btn-sm" id="vtExportChart">导出 PNG</button>
              </div>
            </div>
          </section>

          <section class="vt-stage" aria-label="图表预览">
            <div class="vt-stage-head">
              <span class="vt-stage-title">图表预览</span>
              <span class="vt-mono" id="vtChartMeta">—</span>
            </div>
            <div class="vt-canvas-shell"><canvas id="vtChart" class="vt-chart-canvas" aria-label="数据图表面布"></canvas></div>
            <div class="vt-error" id="vtChartErr" hidden></div>
            <div class="vt-data-block">
              <div class="vt-data-head"><span>数据表格</span><span class="cp-note">单元格可直接修改</span></div>
              <div class="vt-table-wrap" id="vtTableWrap"></div>
            </div>
            <div class="note" id="vtChartTips">柱状图、折线图与面积图以第一列为标签，其余列为数据系列；散点图使用第一组数值作为 X，其余系列作为 Y；饼图 / 环形图使用第一组数值。</div>
          </section>
        </div>`;

      const els = {
        text: host.querySelector('#vtDataText'),
        header: host.querySelector('#vtHasHeader'),
        parse: host.querySelector('#vtParseData'),
        sample: host.querySelector('#vtLoadSample'),
        dataErr: host.querySelector('#vtDataErr'),
        dataNote: host.querySelector('#vtDataNote'),
        type: host.querySelector('#vtChartType'),
        title: host.querySelector('#vtChartTitle'),
        width: host.querySelector('#vtChartW'),
        height: host.querySelector('#vtChartH'),
        sort: host.querySelector('#vtChartSort'),
        values: host.querySelector('#vtShowValues'),
        grid: host.querySelector('#vtShowGrid'),
        legend: host.querySelector('#vtShowLegend'),
        zero: host.querySelector('#vtStartZero'),
        palettes: host.querySelector('#vtPalettes'),
        stats: host.querySelector('#vtStats'),
        copyStats: host.querySelector('#vtCopyStats'),
        exportBtn: host.querySelector('#vtExportChart'),
        cv: host.querySelector('#vtChart'),
        meta: host.querySelector('#vtChartMeta'),
        chartErr: host.querySelector('#vtChartErr'),
        tableWrap: host.querySelector('#vtTableWrap')
      };

      const state = {
        type: 'bar',
        title: '月度收支',
        width: 860,
        height: 520,
        sort: 'none',
        values: true,
        grid: true,
        legend: true,
        zero: true,
        palette: 0,
        data: null
      };

      let drawTimer = 0;
      let tableTimer = 0;
      let lastSummary = '';

      els.palettes.innerHTML = PALETTES.map(function (p, i) {
        return '<button type="button" class="vt-palette' + (i === 0 ? ' is-on' : '') + '" data-pal="' + i + '"><span class="vt-palette-name">' + esc(p.name) + '</span><span class="vt-swatches">' + p.colors.map(function (c) {
          return '<span class="vt-swatch" style="background:' + c + '"></span>';
        }).join('') + '</span></button>';
      }).join('');

      function showError(el, msg) {
        if (!msg) { el.hidden = true; el.textContent = ''; return; }
        el.hidden = false;
        el.textContent = msg;
      }

      function setDataNote(text, isErr) {
        els.dataNote.textContent = text;
        els.dataNote.classList.toggle('is-err', !!isErr);
      }

      function scheduleDraw() {
        clearTimeout(drawTimer);
        drawTimer = setTimeout(draw, 100);
      }

      function renderTable(ds) {
        let html = '<table class="data-table vt-data-table"><thead><tr>';
        ds.head.forEach(function (h, i) {
          html += '<th contenteditable="true" spellcheck="false" data-col="' + i + '">' + esc(h) + '</th>';
        });
        html += '</tr></thead><tbody>';
        ds.rows.forEach(function (row) {
          html += '<tr>';
          row.forEach(function (cell, i) {
            html += '<td contenteditable="true" spellcheck="false" data-col="' + i + '">' + esc(cell) + '</td>';
          });
          html += '</tr>';
        });
        html += '</tbody></table>';
        els.tableWrap.innerHTML = html;
      }

      function readTable() {
        const table = els.tableWrap.querySelector('table');
        if (!table) return null;
        const head = Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
        const rows = Array.prototype.map.call(table.querySelectorAll('tbody tr'), function (tr) {
          return Array.prototype.map.call(tr.querySelectorAll('td'), function (td) { return td.textContent.trim(); });
        });
        return { head: head, rows: rows };
      }

      function applyTable() {
        const raw = readTable();
        if (!raw) return;
        try {
          const ds = buildChartData(raw.head, raw.rows, true);
          state.data = ds;
          showError(els.dataErr, '');
          showError(els.chartErr, '');
          renderStats(ds);
          setDataNote(ds.warnings.length ? ds.warnings.join(' ') : '表格已更新：' + ds.rows.length + ' 行 × ' + ds.series.length + ' 组数据。', ds.warnings.length > 0);
          draw();
        } catch (e) {
          showError(els.dataErr, '表格数据有误：' + e.message);
        }
      }

      function applyText() {
        const text = els.text.value;
        try {
          const parsed = parseTableText(text, els.header.checked);
          const ds = buildChartData(parsed.head, parsed.rows, parsed.hasHeader);
          ds.warnings = parsed.warnings.concat(ds.warnings);
          state.data = ds;
          renderTable(ds);
          renderStats(ds);
          showError(els.dataErr, '');
          showError(els.chartErr, '');
          setDataNote(ds.warnings.length ? ds.warnings.join(' ') : '已解析 ' + ds.rows.length + ' 行 × ' + ds.series.length + ' 组数据。表格单元格可直接修改。', ds.warnings.length > 0);
          draw();
        } catch (e) {
          showError(els.dataErr, e.message);
          setDataNote('解析失败，已保留上一次成功的数据。', true);
        }
      }

      function renderStats(ds) {
        if (!ds) { els.stats.innerHTML = ''; lastSummary = ''; return; }
        const rows = ds.series.map(function (s, i) {
          const st = seriesStats(s);
          return { name: s.name, stats: st, color: PALETTES[state.palette].colors[i % PALETTES[state.palette].colors.length] };
        });
        els.stats.innerHTML = rows.map(function (row) {
          return '<div class="vt-stat-card"><div class="vt-stat-name"><i class="vt-swatch-line" style="background:' + row.color + '"></i>' + esc(row.name) + '</div><div class="vt-stat-rows"><span>最大 <b>' + fmtNum(row.stats.max, 3) + '</b></span><span>最小 <b>' + fmtNum(row.stats.min, 3) + '</b></span><span>平均 <b>' + fmtNum(row.stats.avg, 3) + '</b></span><span>总和 <b>' + fmtNum(row.stats.sum, 3) + '</b></span></div></div>';
        }).join('');
        const overall = rows.map(function (r) { return r.stats.sum; }).filter(function (v) { return isFinite(v); }).reduce(function (a, b) { return a + b; }, 0);
        lastSummary = [state.title || '数据图表', '行数：' + ds.rows.length, '系列数：' + ds.series.length, ''].concat(rows.map(function (row) {
          return row.name + '：最大 ' + fmtNum(row.stats.max, 4) + ' / 最小 ' + fmtNum(row.stats.min, 4) + ' / 平均 ' + fmtNum(row.stats.avg, 4) + ' / 总和 ' + fmtNum(row.stats.sum, 4);
        })).concat(['', '全部系列总和：' + fmtNum(overall, 4)]).join('\n');
      }

      function orderIndexes(ds) {
        const idx = ds.categories.map(function (_, i) { return i; });
        if (state.sort === 'label-asc') {
          idx.sort(function (a, b) { return String(ds.categories[a]).localeCompare(String(ds.categories[b]), 'zh-CN', { numeric: true }); });
        } else if (state.sort === 'value-asc' || state.sort === 'value-desc') {
          idx.sort(function (a, b) {
            function sum(row) {
              let total = 0;
              ds.series.forEach(function (s) {
                const v = s.values[row];
                if (typeof v === 'number' && isFinite(v)) total += v;
              });
              return total;
            }
            return state.sort === 'value-asc' ? sum(a) - sum(b) : sum(b) - sum(a);
          });
        }
        return idx;
      }

      function chartColors() { return PALETTES[state.palette].colors; }

      function setCanvasSize(W, H) {
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2.5);
        els.cv.width = Math.round(W * dpr);
        els.cv.height = Math.round(H * dpr);
        els.cv.style.width = W + 'px';
        els.cv.style.height = 'auto';
        const ctx = els.cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return ctx;
      }

      function drawFail(msg) {
        const W = clamp(Math.round(state.width), 480, 1600);
        const H = clamp(Math.round(state.height), 320, 1000);
        const ctx = setCanvasSize(W, H);
        const theme = readTheme();
        ctx.fillStyle = theme.surface; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = theme.line; ctx.strokeRect(10.5, 10.5, W - 21, H - 21);
        ctx.fillStyle = theme.text3; ctx.font = '13px ' + theme.fontSans; ctx.textAlign = 'center';
        const lines = wrapCanvasText(ctx, msg, W - 80, 4);
        lines.forEach(function (line, i) { ctx.fillText(line, W / 2, H / 2 - (lines.length - 1) * 10 + i * 22); });
        ctx.textAlign = 'left';
        els.meta.textContent = '—';
      }

      function yDomain(values, startZero) {
        let min = Infinity, max = -Infinity;
        values.forEach(function (v) { if (typeof v === 'number' && isFinite(v)) { if (v < min) min = v; if (v > max) max = v; } });
        if (!isFinite(min) || !isFinite(max)) return [0, 1];
        const nonNegative = min >= 0;
        const nonPositive = max <= 0;
        if (startZero) {
          if (min > 0) min = 0;
          if (max < 0) max = 0;
        }
        if (min === max) {
          if (startZero) {
            max = min + Math.max(Math.abs(min), 1);
          } else {
            const pad = Math.max(Math.abs(min) * 0.1, 1);
            min -= pad; max += pad;
          }
        } else {
          const pad = (max - min) * 0.08;
          if (!(startZero && nonNegative)) min -= pad;
          if (!(startZero && nonPositive)) max += pad;
        }
        return [min, max];
      }

      function drawAxes(ctx, plot, yMin, yMax, cats, theme, horizontalOnly) {
        const yTicks = niceTicks(yMin, yMax, 5);
        const sx = function (i) { return plot.x + (i + 0.5) / Math.max(1, cats) * plot.w; };
        const sy = function (v) { return plot.y + (yMax - v) / (yMax - yMin) * plot.h; };
        if (state.grid) {
          ctx.strokeStyle = theme.line; ctx.lineWidth = 1; ctx.beginPath();
          yTicks.forEach(function (t) {
            const py = Math.round(sy(t)) + 0.5;
            ctx.moveTo(plot.x, py); ctx.lineTo(plot.x + plot.w, py);
          });
          if (!horizontalOnly && cats <= 16) {
            for (let i = 0; i < cats; i++) {
              const px = Math.round(sx(i)) + 0.5;
              ctx.moveTo(px, plot.y); ctx.lineTo(px, plot.y + plot.h);
            }
          }
          ctx.stroke();
        }
        ctx.strokeStyle = theme.lineStrong; ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.moveTo(plot.x + 0.5, plot.y); ctx.lineTo(plot.x + 0.5, plot.y + plot.h);
        ctx.moveTo(plot.x, plot.y + plot.h - 0.5); ctx.lineTo(plot.x + plot.w, plot.y + plot.h - 0.5);
        if (yMin < 0 && yMax > 0) {
          const py = Math.round(sy(0)) + 0.5;
          ctx.moveTo(plot.x, py); ctx.lineTo(plot.x + plot.w, py);
        }
        ctx.stroke();
        ctx.font = '10px ' + theme.fontMono;
        ctx.fillStyle = theme.text3;
        ctx.textAlign = 'right';
        yTicks.forEach(function (t) { ctx.fillText(fmtAxis(t), plot.x - 8, sy(t) + 3); });
        ctx.textAlign = 'left';
        return { sy: sy, yTicks: yTicks };
      }

      function drawXLabels(ctx, plot, labels, theme) {
        const n = Math.max(1, labels.length);
        const step = Math.max(1, Math.ceil(n / (plot.w > 620 ? 12 : 7)));
        ctx.font = '10px ' + theme.fontSans;
        ctx.fillStyle = theme.text3;
        ctx.textAlign = 'center';
        labels.forEach(function (label, i) {
          if (i % step !== 0) return;
          const px = plot.x + (i + 0.5) / n * plot.w;
          ctx.fillText(fitText(ctx, label, Math.max(44, plot.w / n * step - 6)), px, plot.y + plot.h + 16);
        });
        ctx.textAlign = 'left';
      }

      function drawLegend(ctx, items, x, y, maxWidth, theme) {
        if (!state.legend || !items.length) return;
        ctx.font = '11px ' + theme.fontSans;
        ctx.textBaseline = 'middle';
        let cx = x;
        for (let i = 0; i < items.length; i++) {
          const label = fitText(ctx, items[i].name, 130);
          const tw = ctx.measureText(label).width;
          if (cx + tw + 22 > x + maxWidth) {
            if (i === 0) { ctx.fillStyle = theme.text3; ctx.fillText('图例已省略', cx, y); }
            break;
          }
          ctx.fillStyle = items[i].color;
          ctx.fillRect(cx, y - 5, 10, 10);
          ctx.fillStyle = theme.text2;
          ctx.fillText(label, cx + 15, y + 0.5);
          cx += tw + 28;
        }
        ctx.textBaseline = 'alphabetic';
      }

      function draw() {
        const ds = state.data;
        if (!ds) { drawFail('请先解析数据。'); return; }
        const W = clamp(Math.round(state.width), 480, 1600);
        const H = clamp(Math.round(state.height), 320, 1000);
        const ctx = setCanvasSize(W, H);
        const theme = readTheme();
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = theme.surface;
        ctx.fillRect(0, 0, W, H);
        showError(els.chartErr, '');

        const order = orderIndexes(ds);
        const cats = order.map(function (i) { return ds.categories[i]; });
        const colors = chartColors();
        const title = String(state.title || '').trim();
        const titleH = title ? 28 : 0;
        const legendItems = [];
        let legendH = 0;

        if (state.type === 'pie' || state.type === 'donut') {
          const vals = ds.series[0].values;
          order.forEach(function (i, k) {
            if (typeof vals[i] === 'number' && isFinite(vals[i]) && vals[i] > 0) legendItems.push({ name: ds.categories[i] + ' ' + fmtNum(vals[i], 2), color: PIE_COLORS[k % PIE_COLORS.length] });
          });
        } else if (state.type === 'scatter') {
          const ys = ds.series.length >= 2 ? ds.series.slice(1) : ds.series;
          ys.forEach(function (s, i) { legendItems.push({ name: s.name, color: colors[i % colors.length] }); });
        } else {
          ds.series.forEach(function (s, i) { legendItems.push({ name: s.name, color: colors[i % colors.length] }); });
        }
        if (state.legend && legendItems.length) legendH = 22;

        const top = 18 + titleH + legendH + (!title && legendH ? 4 : 0);
        const left = 64, right = 24, bottom = 42;
        const plot = { x: left, y: top, w: Math.max(60, W - left - right), h: Math.max(60, H - top - bottom) };

        if (title) {
          ctx.fillStyle = theme.text;
          ctx.font = '600 18px ' + theme.fontSerif;
          ctx.fillText(fitText(ctx, title, W - 40), 20, 30);
        }
        drawLegend(ctx, legendItems, 20, 48 + (title ? 0 : -16), W - 40, theme);

        if (state.type === 'pie' || state.type === 'donut') {
          drawPie(ctx, ds, order, plot, theme);
        } else if (state.type === 'scatter') {
          drawScatter(ctx, ds, plot, colors, theme);
        } else {
          drawCartesian(ctx, ds, order, plot, colors, theme, cats);
        }

        ctx.fillStyle = theme.text3;
        ctx.font = '10px ' + theme.fontMono;
        ctx.textAlign = 'right';
        ctx.fillText('LOCAL CANVAS · ' + W + ' × ' + H, W - 18, H - 14);
        ctx.textAlign = 'left';
        els.meta.textContent = cats.length + ' 个标签 · ' + ds.series.length + ' 组数据 · ' + W + '×' + H;
      }

      function drawCartesian(ctx, ds, order, plot, colors, theme, cats) {
        const type = state.type;
        const stacked = type === 'bar-stack';
        const isBar = type === 'bar' || type === 'bar-stack';
        const n = Math.max(1, cats.length);
        const band = plot.w / n;
        let yValues = [];
        const orderedValues = ds.series.map(function (s) {
          return order.map(function (i) { return s.values[i]; });
        });
        if (stacked) {
          for (let i = 0; i < n; i++) {
            let pos = 0, neg = 0;
            orderedValues.forEach(function (vals) {
              const v = vals[i];
              if (typeof v !== 'number' || !isFinite(v)) return;
              if (v >= 0) pos += v; else neg += v;
            });
            yValues.push(pos, neg);
          }
        } else {
          orderedValues.forEach(function (vals) { yValues = yValues.concat(vals); });
        }
        const yd = yDomain(yValues, isBar || type === 'line' || type === 'area' ? state.zero : false);
        const yMin = yd[0], yMax = yd[1];
        const axes = drawAxes(ctx, plot, yMin, yMax, n, theme, false);
        const sy = axes.sy;
        const base = clamp(sy(0), plot.y, plot.y + plot.h);
        drawXLabels(ctx, plot, cats, theme);
        ctx.save();
        ctx.beginPath(); ctx.rect(plot.x, plot.y, plot.w, plot.h); ctx.clip();

        if (isBar) {
          const inner = band * 0.7;
          const groupW = stacked ? inner : inner / ds.series.length;
          for (let i = 0; i < n; i++) {
            const start = plot.x + i * band + (band - inner) / 2;
            if (stacked) {
              let pos = 0, neg = 0;
              for (let s = 0; s < orderedValues.length; s++) {
                const v = orderedValues[s][i];
                if (typeof v !== 'number' || !isFinite(v)) continue;
                const from = v >= 0 ? pos : neg;
                const to = from + v;
                if (v >= 0) pos = to; else neg = to;
                const y1px = sy(from), y2px = sy(to);
                ctx.fillStyle = colors[s % colors.length];
                ctx.fillRect(start, Math.min(y1px, y2px), inner, Math.max(1, Math.abs(y2px - y1px)));
              }
              if (state.values && band > 44) {
                const total = pos + neg;
                ctx.font = '10px ' + theme.fontMono;
                ctx.fillStyle = theme.text2;
                ctx.textAlign = 'center';
                ctx.fillText(fmtNum(total, 2), start + inner / 2, total >= 0 ? sy(Math.max(pos, 0)) - 5 : sy(Math.min(neg, 0)) + 13);
                ctx.textAlign = 'left';
              }
            } else {
              for (let s = 0; s < orderedValues.length; s++) {
                const v = orderedValues[s][i];
                if (typeof v !== 'number' || !isFinite(v)) continue;
                const x = start + s * groupW + (groupW > 8 ? 1 : 0);
                const w = Math.max(1, groupW - (groupW > 8 ? 2 : 0));
                const py = sy(v);
                ctx.fillStyle = colors[s % colors.length];
                ctx.fillRect(x, Math.min(base, py), w, Math.max(1, Math.abs(base - py)));
                if (state.values && groupW >= 22) {
                  ctx.font = '9.5px ' + theme.fontMono;
                  ctx.fillStyle = theme.text2;
                  ctx.textAlign = 'center';
                  ctx.fillText(fmtNum(v, 2), x + w / 2, v >= 0 ? py - 4 : py + 12);
                  ctx.textAlign = 'left';
                }
              }
            }
          }
        } else {
          const xAt = function (i) { return plot.x + (i + 0.5) / n * plot.w; };
          for (let s = 0; s < orderedValues.length; s++) {
            const vals = orderedValues[s];
            const color = colors[s % colors.length];
            if (type === 'area') {
              let run = [];
              const flushArea = function () {
                if (run.length > 1) {
                  ctx.beginPath();
                  ctx.moveTo(xAt(run[0].i), base);
                  run.forEach(function (p) { ctx.lineTo(xAt(p.i), sy(p.v)); });
                  ctx.lineTo(xAt(run[run.length - 1].i), base);
                  ctx.closePath();
                  ctx.fillStyle = alphaColor(color, 0.18);
                  ctx.fill();
                }
                run = [];
              };
              for (let i = 0; i < n; i++) {
                const v = vals[i];
                if (typeof v !== 'number' || !isFinite(v)) { flushArea(); continue; }
                run.push({ i: i, v: v });
              }
              flushArea();
            }
            let started = false;
            let prev = null;
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
              const v = vals[i];
              if (typeof v !== 'number' || !isFinite(v)) { started = false; prev = null; continue; }
              const px = xAt(i), py = sy(v);
              if (!started) { ctx.moveTo(px, py); started = true; } else if (prev && Math.abs(v - prev) > (yMax - yMin) * 0.55) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
              prev = v;
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();
            if (state.values && n <= 24) {
              ctx.font = '9.5px ' + theme.fontMono;
              ctx.fillStyle = theme.text2;
              vals.forEach(function (v, i) {
                if (typeof v !== 'number' || !isFinite(v)) return;
                ctx.fillText(fmtNum(v, 2), xAt(i) - 8, sy(v) - 6);
              });
            }
          }
        }
        ctx.restore();
      }

      function drawScatter(ctx, ds, plot, colors, theme) {
        const useX = ds.series.length >= 2;
        const xSeries = useX ? ds.series[0] : null;
        const ySeries = useX ? ds.series.slice(1) : ds.series;
        const xValues = [];
        const yValues = [];
        ySeries.forEach(function (s) {
          s.values.forEach(function (v, i) {
            const x = useX ? xSeries.values[i] : i;
            if (typeof x !== 'number' || !isFinite(x)) return;
            if (typeof v !== 'number' || !isFinite(v)) return;
            xValues.push(x); yValues.push(v);
          });
        });
        if (!xValues.length) { drawFail('散点图没有可用的数值点。'); return; }
        let xMin = Math.min.apply(null, xValues), xMax = Math.max.apply(null, xValues);
        if (xMin === xMax) { xMin -= 1; xMax += 1; }
        const xPad = (xMax - xMin) * 0.08; xMin -= xPad; xMax += xPad;
        const yd = yDomain(yValues, state.zero);
        const yMin = yd[0], yMax = yd[1];
        const xAt = function (v) { return plot.x + (v - xMin) / (xMax - xMin) * plot.w; };
        const yAt = function (v) { return plot.y + (yMax - v) / (yMax - yMin) * plot.h; };
        const xTicks = niceTicks(xMin, xMax, 6);
        const yTicks = niceTicks(yMin, yMax, 5);
        if (state.grid) {
          ctx.strokeStyle = theme.line; ctx.lineWidth = 1; ctx.beginPath();
          xTicks.forEach(function (t) { const px = Math.round(xAt(t)) + 0.5; ctx.moveTo(px, plot.y); ctx.lineTo(px, plot.y + plot.h); });
          yTicks.forEach(function (t) { const py = Math.round(yAt(t)) + 0.5; ctx.moveTo(plot.x, py); ctx.lineTo(plot.x + plot.w, py); });
          ctx.stroke();
        }
        ctx.strokeStyle = theme.lineStrong; ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.moveTo(plot.x + 0.5, plot.y); ctx.lineTo(plot.x + 0.5, plot.y + plot.h);
        ctx.moveTo(plot.x, plot.y + plot.h - 0.5); ctx.lineTo(plot.x + plot.w, plot.y + plot.h - 0.5);
        ctx.stroke();
        ctx.font = '10px ' + theme.fontMono;
        ctx.fillStyle = theme.text3;
        ctx.textAlign = 'center';
        xTicks.forEach(function (t) { ctx.fillText(fmtAxis(t), xAt(t), plot.y + plot.h + 16); });
        ctx.textAlign = 'right';
        yTicks.forEach(function (t) { ctx.fillText(fmtAxis(t), plot.x - 8, yAt(t) + 3); });
        ctx.textAlign = 'left';
        ctx.save();
        ctx.beginPath(); ctx.rect(plot.x, plot.y, plot.w, plot.h); ctx.clip();
        let colorIdx = 0;
        ySeries.forEach(function (s) {
          const color = colors[colorIdx % colors.length];
          colorIdx++;
          s.values.forEach(function (v, i) {
            const x = useX ? xSeries.values[i] : i;
            if (typeof x !== 'number' || !isFinite(x)) return;
            if (typeof v !== 'number' || !isFinite(v)) return;
            const px = xAt(x), py = yAt(v);
            ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
            ctx.strokeStyle = theme.surface; ctx.lineWidth = 1; ctx.stroke();
            if (state.values && xValues.length <= 30) {
              ctx.font = '9px ' + theme.fontMono;
              ctx.fillStyle = theme.text2;
              ctx.fillText(fmtNum(v, 2), px + 6, py - 5);
            }
          });
        });
        ctx.restore();
      }

      function drawPie(ctx, ds, order, plot, theme) {
        const vals = ds.series[0].values;
        const entries = order.map(function (i, k) {
          const v = vals[i];
          return { label: ds.categories[i], value: v, color: PIE_COLORS[k % PIE_COLORS.length] };
        }).filter(function (e) { return typeof e.value === 'number' && isFinite(e.value) && e.value > 0; });
        if (!entries.length) { drawFail('饼图需要至少一个正数数值。'); return; }
        const total = entries.reduce(function (a, e) { return a + e.value; }, 0);
        const cx = plot.x + plot.w / 2;
        const cy = plot.y + plot.h / 2;
        const radius = Math.max(30, Math.min(plot.w, plot.h) * 0.38);
        const inner = state.type === 'donut' ? radius * 0.56 : 0;
        let angle = -Math.PI / 2;
        ctx.save();
        entries.forEach(function (e) {
          const slice = Math.PI * 2 * (e.value / total);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, radius, angle, angle + slice);
          ctx.closePath();
          ctx.fillStyle = e.color;
          ctx.fill();
          ctx.strokeStyle = theme.surface;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          if (state.values && slice > 0.28) {
            const mid = angle + slice / 2;
            const tx = cx + Math.cos(mid) * radius * 0.64;
            const ty = cy + Math.sin(mid) * radius * 0.64;
            ctx.font = '11px ' + theme.fontMono;
            ctx.fillStyle = '#fffefb';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(e.value / total * 1000) / 10 + '%', tx, ty + 4);
            ctx.textAlign = 'left';
          }
          angle += slice;
        });
        if (state.type === 'donut') {
          ctx.beginPath();
          ctx.arc(cx, cy, inner, 0, Math.PI * 2);
          ctx.fillStyle = theme.surface;
          ctx.fill();
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = theme.text;
          ctx.font = '600 17px ' + theme.fontSerif;
          ctx.textAlign = 'center';
          ctx.fillText(fmtNum(total, 2), cx, cy - 2);
          ctx.fillStyle = theme.text3;
          ctx.font = '10px ' + theme.fontSans;
          ctx.fillText('合计', cx, cy + 15);
          ctx.textAlign = 'left';
        }
        ctx.restore();
      }

      function readSettings() {
        state.type = els.type.value;
        state.title = els.title.value;
        state.sort = els.sort.value;
        state.values = els.values.checked;
        state.grid = els.grid.checked;
        state.legend = els.legend.checked;
        state.zero = els.zero.checked;
        const w = parseFloat(els.width.value);
        const h = parseFloat(els.height.value);
        if (isFinite(w)) state.width = clamp(w, 480, 1600);
        if (isFinite(h)) state.height = clamp(h, 320, 1000);
      }

      function bindInput(el, immediate) {
        el.addEventListener('input', function () {
          readSettings();
          if (immediate) scheduleDraw();
        });
        el.addEventListener('change', function () {
          readSettings();
          scheduleDraw();
        });
      }

      els.parse.addEventListener('click', applyText);
      els.sample.addEventListener('click', function () { els.text.value = sampleData(); applyText(); });
      els.header.addEventListener('change', applyText);
      [els.type, els.title, els.width, els.height, els.sort, els.values, els.grid, els.legend, els.zero].forEach(function (el) {
        bindInput(el, true);
      });
      els.title.addEventListener('input', function () {
        if (state.data) renderStats(state.data);
      });
      els.palettes.addEventListener('click', function (e) {
        const btn = e.target && e.target.closest ? e.target.closest('[data-pal]') : null;
        if (!btn) return;
        state.palette = parseInt(btn.getAttribute('data-pal'), 10) || 0;
        Array.prototype.forEach.call(els.palettes.querySelectorAll('.vt-palette'), function (b) {
          b.classList.toggle('is-on', b === btn);
        });
        if (state.data) renderStats(state.data);
        draw();
      });
      els.tableWrap.addEventListener('input', function () {
        clearTimeout(tableTimer);
        tableTimer = setTimeout(applyTable, 120);
      });
      els.copyStats.addEventListener('click', function () {
        if (!lastSummary) { api.toast('暂无可复制的数据摘要', 'err'); return; }
        api.copy(lastSummary);
      });
      els.exportBtn.addEventListener('click', function () {
        if (!els.cv.width) return;
        api.save(els.cv.toDataURL('image/png'), 'data-chart.png');
      });

      function sampleData() {
        return '月份,收入,支出,结余\n1月,128,86,42\n2月,142,91,51\n3月,136,102,34\n4月,158,96,62\n5月,171,110,61\n6月,164,105,59';
      }

      api.onCleanup(function () {
        clearTimeout(drawTimer);
        clearTimeout(tableTimer);
      });
      watchTheme(api, function () { draw(); });

      els.text.value = sampleData();
      els.title.value = state.title;
      els.width.value = String(state.width);
      els.height.value = String(state.height);
      applyText();
      draw();
    }
  });

  /* ============================================================
     工具三：分享链接生成器
     ============================================================ */
  const SHARE_STORAGE_KEY = 'vt_share_platforms_v1';

  const BUILTIN_PLATFORMS = [
    { name: '微博', color: '#e6162d', tpl: 'https://service.weibo.com/share/share.php?url={u}&title={t}' },
    { name: 'QQ 空间', color: '#2b7bd6', tpl: 'https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={u}&title={t}' },
    { name: '豆瓣', color: '#2f7a56', tpl: 'https://www.douban.com/share/service?href={u}&name={t}' },
    { name: 'X', color: '#1b1c18', tpl: 'https://twitter.com/intent/tweet?url={u}&text={t}' },
    { name: 'Facebook', color: '#1877f2', tpl: 'https://www.facebook.com/sharer/sharer.php?u={u}' },
    { name: 'Telegram', color: '#229ed9', tpl: 'https://t.me/share/url?url={u}&text={t}' },
    { name: 'LinkedIn', color: '#0a66c2', tpl: 'https://www.linkedin.com/sharing/share-offsite/?url={u}' },
    { name: 'Reddit', color: '#ff4500', tpl: 'https://www.reddit.com/submit?url={u}&title={t}' },
    { name: 'WhatsApp', color: '#1f9d63', tpl: 'https://api.whatsapp.com/send?text={t}%20{u}' },
    { name: '邮件', color: '#8a641f', tpl: 'mailto:?subject={t}&body={u}' }
  ];

  R('分享链接生成器', {
    render(host, api) {
      host.innerHTML = `
        <div class="vt-workspace vt-share-ws">
          <section class="vt-panel" aria-label="分享参数">
            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">01</span><h3>链接信息</h3></div>
              <label class="vt-field"><span>网址</span><input type="text" id="vtShareUrl" maxlength="2048" spellcheck="false" autocomplete="off"></label>
              <label class="vt-field"><span>标题</span><input type="text" id="vtShareTitle" maxlength="120"></label>
              <label class="vt-field"><span>描述</span><textarea id="vtShareDesc" rows="3" maxlength="300"></textarea></label>
              <div class="vt-error" id="vtUrlErr" hidden></div>
              <div class="vt-url-preview" id="vtFinalUrl"></div>
              <div class="vt-actions">
                <button type="button" class="btn btn-primary" id="vtCopyMain">复制链接</button>
                <button type="button" class="btn btn-ghost" id="vtOpenMain">打开网址</button>
              </div>
            </div>

            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">02</span><h3>UTM 参数</h3></div>
              <div class="vt-grid-3">
                <label class="vt-field"><span>source</span><input type="text" id="vtUtmSource" maxlength="80" spellcheck="false" placeholder="website"></label>
                <label class="vt-field"><span>medium</span><input type="text" id="vtUtmMedium" maxlength="80" spellcheck="false" placeholder="social"></label>
                <label class="vt-field"><span>campaign</span><input type="text" id="vtUtmCampaign" maxlength="80" spellcheck="false" placeholder="share"></label>
              </div>
              <div class="vt-chips" id="vtUtmChips">
                <button type="button" class="vt-chip" data-source="weibo" data-medium="social">微博</button>
                <button type="button" class="vt-chip" data-source="wechat" data-medium="social">微信</button>
                <button type="button" class="vt-chip" data-source="newsletter" data-medium="email">邮件</button>
                <button type="button" class="vt-chip" data-source="copy" data-medium="referral">复制</button>
              </div>
              <div class="cp-note">留空则不添加对应参数；快捷标签可以同时填入 source / medium。</div>
            </div>

            <div class="vt-block">
              <div class="vt-block-head"><span class="vt-kicker">03</span><h3>自定义平台</h3></div>
              <div class="vt-custom-list" id="vtCustomList"></div>
              <div class="vt-custom-form">
                <label class="vt-field"><span>名称</span><input type="text" id="vtCustomName" maxlength="24" placeholder="例如：内部论坛"></label>
                <label class="vt-field"><span>链接模板（{u} 网址，{t} 标题）</span><input type="text" id="vtCustomTpl" spellcheck="false" placeholder="https://example.com/share?url={u}&title={t}"></label>
                <div class="vt-actions">
                  <button type="button" class="btn btn-primary btn-sm" id="vtCustomSave">保存平台</button>
                  <button type="button" class="btn btn-ghost btn-sm" id="vtCustomCancel" hidden>取消编辑</button>
                </div>
                <div class="vt-error" id="vtCustomErr" hidden></div>
              </div>
            </div>
          </section>

          <section class="vt-stage" aria-label="分享预览">
            <div class="vt-stage-head">
              <span class="vt-stage-title">分享卡片与二维码</span>
              <span class="vt-mono" id="vtShareMeta">—</span>
            </div>
            <div class="vt-share-preview">
              <div class="vt-card-shell">
                <canvas id="vtShareCard" class="vt-share-card-canvas" aria-label="分享卡片预览"></canvas>
              </div>
              <div class="vt-qr-shell">
                <canvas id="vtQr" aria-label="分享二维码"></canvas>
                <span class="cp-note">扫码打开最终链接</span>
                <button type="button" class="btn btn-ghost btn-sm" id="vtExportQr">导出二维码 PNG</button>
              </div>
            </div>
            <div class="vt-actions">
              <button type="button" class="btn btn-primary" id="vtExportCard">导出分享卡片 PNG</button>
              <button type="button" class="btn btn-ghost" id="vtCopyMarkdown">复制 Markdown</button>
              <button type="button" class="btn btn-ghost" id="vtCopyHtml">复制 HTML</button>
              <button type="button" class="btn btn-ghost" id="vtCopyPlain">复制纯文本</button>
            </div>

            <div class="vt-stage-head vt-platform-head">
              <span class="vt-stage-title">平台分享</span>
              <span class="cp-note">打开官方分享页，或复制该平台链接</span>
            </div>
            <div class="vt-share-grid" id="vtPlatforms"></div>
            <div class="note">微信与 QQ 不支持从网页直接唤起分享面板，请先复制链接，再粘贴到聊天窗口；QQ 空间可以使用上面的官方分享页。工具不接入第三方短链服务，链接保持原样，二维码与卡片均在本地生成。</div>
          </section>
        </div>`;

      const els = {
        url: host.querySelector('#vtShareUrl'),
        title: host.querySelector('#vtShareTitle'),
        desc: host.querySelector('#vtShareDesc'),
        urlErr: host.querySelector('#vtUrlErr'),
        finalUrl: host.querySelector('#vtFinalUrl'),
        copyMain: host.querySelector('#vtCopyMain'),
        openMain: host.querySelector('#vtOpenMain'),
        utmSource: host.querySelector('#vtUtmSource'),
        utmMedium: host.querySelector('#vtUtmMedium'),
        utmCampaign: host.querySelector('#vtUtmCampaign'),
        utmChips: host.querySelector('#vtUtmChips'),
        customList: host.querySelector('#vtCustomList'),
        customName: host.querySelector('#vtCustomName'),
        customTpl: host.querySelector('#vtCustomTpl'),
        customSave: host.querySelector('#vtCustomSave'),
        customCancel: host.querySelector('#vtCustomCancel'),
        customErr: host.querySelector('#vtCustomErr'),
        card: host.querySelector('#vtShareCard'),
        qr: host.querySelector('#vtQr'),
        shareMeta: host.querySelector('#vtShareMeta'),
        platformGrid: host.querySelector('#vtPlatforms'),
        exportCard: host.querySelector('#vtExportCard'),
        exportQr: host.querySelector('#vtExportQr'),
        copyMarkdown: host.querySelector('#vtCopyMarkdown'),
        copyHtml: host.querySelector('#vtCopyHtml'),
        copyPlain: host.querySelector('#vtCopyPlain')
      };

      let customPlatforms = loadCustomPlatforms();
      let editing = -1;
      let current = { url: location.href, title: document.title || '', desc: '', platforms: [], qrCanvas: null };
      let updateTimer = 0;

      function showError(el, msg) {
        if (!msg) { el.hidden = true; el.textContent = ''; return; }
        el.hidden = false;
        el.textContent = msg;
      }

      function loadCustomPlatforms() {
        let list = [];
        try {
          const raw = localStorage.getItem(SHARE_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              list = parsed.filter(function (p) {
                return p && typeof p.name === 'string' && typeof p.tpl === 'string' && p.name.trim() && p.tpl.indexOf('{u}') >= 0 && /^(https?:\/\/|mailto:)/i.test(p.tpl.trim());
              }).slice(0, 24).map(function (p) {
                return { name: p.name.trim().slice(0, 24), tpl: p.tpl.trim().slice(0, 500) };
              });
            }
          }
        } catch (e) { list = []; }
        return list;
      }

      function saveCustomPlatforms() {
        try {
          localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(customPlatforms));
          return true;
        } catch (e) {
          api.toast('浏览器禁止本地存储，自定义平台未能保存', 'err');
          return false;
        }
      }

      function renderCustomList() {
        if (!customPlatforms.length) {
          els.customList.innerHTML = '<div class="hint-empty">还没有自定义平台。填写名称与模板后保存即可。</div>';
          return;
        }
        els.customList.innerHTML = customPlatforms.map(function (p, i) {
          return '<div class="vt-custom-item"><div class="vt-custom-meta"><div class="vt-custom-name">' + esc(p.name) + '</div><div class="vt-custom-tpl">' + esc(p.tpl) + '</div></div><div class="vt-custom-ops"><button type="button" class="btn btn-ghost btn-sm" data-edit="' + i + '">编辑</button><button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '">删除</button></div></div>';
        }).join('');
      }

      function normalizeUrl(raw) {
        let input = String(raw == null ? '' : raw).trim();
        if (!input) input = location.href;
        if (!/^[a-z][a-z0-9+.-]*:/i.test(input) && input.indexOf('//') !== 0) input = 'https://' + input;
        let url;
        try { url = new URL(input, location.href); }
        catch (e) { return { error: '网址格式不正确，请检查协议与域名。' }; }
        if (['http:', 'https:', 'file:'].indexOf(url.protocol) < 0) return { error: '只支持 http、https 或 file 网址。' };
        const fields = [
          ['source', els.utmSource.value],
          ['medium', els.utmMedium.value],
          ['campaign', els.utmCampaign.value]
        ];
        fields.forEach(function (pair) {
          const value = String(pair[1] || '').trim();
          if (value) url.searchParams.set('utm_' + pair[0], value);
        });
        return { url: url.href, protocol: url.protocol };
      }

      function fillTemplate(tpl, url, title) {
        return String(tpl).replace(/\{u\}/g, encodeURIComponent(url)).replace(/\{t\}/g, encodeURIComponent(title));
      }

      function validateTemplate(tpl) {
        const s = String(tpl || '').trim();
        if (!s) return { error: '请填写链接模板。' };
        if (s.indexOf('{u}') < 0) return { error: '模板必须包含 {u}，用于替换网址。' };
        if (!/^(https?:\/\/|mailto:)/i.test(s)) return { error: '模板需以 http://、https:// 或 mailto: 开头。' };
        if (s.length > 500) return { error: '模板过长（最多 500 个字符）。' };
        return { value: s };
      }

      function makeQrCanvas(text, targetSize) {
        const qf = typeof window.qrcode === 'function' ? window.qrcode : (window.qrcode && window.qrcode.qrcode);
        if (!qf) throw new Error('二维码组件未加载');
        const qr = qf(0, 'M');
        qr.addData(String(text));
        qr.make();
        const n = qr.getModuleCount();
        const quiet = 4;
        const cell = Math.max(2, Math.floor((targetSize || 220) / (n + quiet * 2)));
        const size = (n + quiet * 2) * cell;
        const cv = document.createElement('canvas');
        cv.width = size;
        cv.height = size;
        const cx = cv.getContext('2d');
        cx.fillStyle = '#ffffff';
        cx.fillRect(0, 0, size, size);
        cx.fillStyle = '#141613';
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (!qr.isDark(r, c)) continue;
            cx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
          }
        }
        return cv;
      }

      function buildPlatforms(url, title) {
        const list = BUILTIN_PLATFORMS.map(function (p) {
          return { name: p.name, color: p.color, href: fillTemplate(p.tpl, url, title), custom: false };
        });
        customPlatforms.forEach(function (p) {
          list.push({ name: p.name, color: 'var(--accent-2)', href: fillTemplate(p.tpl, url, title), custom: true });
        });
        list.push({ name: '复制链接', color: 'var(--accent)', href: '', copyOnly: true });
        return list;
      }

      function renderPlatforms(platforms) {
        if (!platforms.length) { els.platformGrid.innerHTML = '<div class="hint-empty">修正网址后会生成平台分享链接。</div>'; return; }
        els.platformGrid.innerHTML = platforms.map(function (p, i) {
          const open = p.href ? '<a class="btn btn-primary btn-sm" href="' + esc(p.href) + '" target="_blank" rel="noopener noreferrer">打开</a>' : '';
          return '<div class="vt-share-card"><div class="vt-share-top"><span class="vt-share-dot" style="background:' + p.color + '"></span><span class="vt-share-name">' + esc(p.name) + '</span></div><div class="vt-share-url">' + esc(p.href || '当前页面链接') + '</div><div class="vt-share-actions">' + open + '<button type="button" class="btn btn-ghost btn-sm" data-copy-idx="' + i + '">复制链接</button></div></div>';
        }).join('');
      }

      function truncateCanvas(ctx, text, maxWidth) {
        return fitText(ctx, text, maxWidth);
      }

      function drawCard(url, title, desc, qrCanvas) {
        const W = 720, H = 420;
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * 1.25;
        els.card.width = Math.round(W * dpr);
        els.card.height = Math.round(H * dpr);
        els.card.style.width = '100%';
        els.card.style.height = 'auto';
        const ctx = els.card.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const theme = readTheme();
        ctx.fillStyle = theme.surface;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = theme.accent;
        ctx.fillRect(0, 0, 8, H);
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, 0.5, W - 10, H - 1);

        ctx.fillStyle = theme.accent;
        ctx.font = '10px ' + theme.fontMono;
        ctx.fillText('SHARE CARD · LOCAL GENERATED', 36, 36);
        ctx.fillStyle = theme.text;
        ctx.font = '600 30px ' + theme.fontSerif;
        const titleLines = wrapCanvasText(ctx, title || '分享链接', 430, 3);
        titleLines.forEach(function (line, i) { ctx.fillText(line, 36, 76 + i * 39); });
        let cursorY = 76 + titleLines.length * 39;
        if (desc) {
          ctx.fillStyle = theme.text2;
          ctx.font = '13px ' + theme.fontSans;
          const descLines = wrapCanvasText(ctx, desc, 430, 2);
          descLines.forEach(function (line, i) { ctx.fillText(line, 36, cursorY + 8 + i * 21); });
          cursorY += descLines.length * 21 + 4;
        }
        ctx.fillStyle = theme.text3;
        ctx.font = '10px ' + theme.fontMono;
        ctx.fillText('LINK', 36, H - 82);
        ctx.fillStyle = theme.text2;
        ctx.font = '11px ' + theme.fontMono;
        const urlLine = truncateCanvas(ctx, url, 430);
        ctx.fillText(urlLine, 36, H - 64);
        ctx.fillStyle = theme.text3;
        ctx.font = '10px ' + theme.fontSans;
        ctx.fillText('扫码打开 · 内容只在本地生成', 36, H - 34);

        const qx = W - 196, qy = H - 196, qs = 150;
        fillRoundRect(ctx, qx, qy, qs + 20, qs + 20, 8, theme.surface2);
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 1;
        roundRectPath(ctx, qx + 0.5, qy + 0.5, qs + 19, qs + 19, 8);
        ctx.stroke();
        if (qrCanvas) {
          ctx.drawImage(qrCanvas, qx + 10, qy + 10, qs, qs);
        } else {
          ctx.fillStyle = theme.text3;
          ctx.font = '11px ' + theme.fontSans;
          ctx.textAlign = 'center';
          ctx.fillText('二维码生成失败', qx + qs / 2 + 10, qy + qs / 2 + 10);
          ctx.textAlign = 'left';
        }

      }

      function drawQr(qrCanvas) {
        const size = 180;
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
        els.qr.width = Math.round(size * dpr);
        els.qr.height = Math.round(size * dpr);
        els.qr.style.width = '100%';
        els.qr.style.height = 'auto';
        const ctx = els.qr.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const theme = readTheme();
        ctx.fillStyle = theme.surface;
        ctx.fillRect(0, 0, size, size);
        if (qrCanvas) {
          ctx.drawImage(qrCanvas, 6, 6, size - 12, size - 12);
        } else {
          ctx.strokeStyle = theme.line;
          ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
          ctx.fillStyle = theme.text3;
          ctx.font = '11px ' + theme.fontSans;
          ctx.textAlign = 'center';
          ctx.fillText('二维码不可用', size / 2, size / 2);
          ctx.textAlign = 'left';
        }
      }

      function updateAll() {
        const built = normalizeUrl(els.url.value);
        if (built.error) {
          showError(els.urlErr, built.error);
          els.finalUrl.textContent = '—';
          current = { url: '', title: els.title.value, desc: els.desc.value, platforms: [], qrCanvas: null };
          renderPlatforms([]);
          drawQr(null);
          drawCard('', els.title.value, els.desc.value, null);
          els.shareMeta.textContent = '—';
          return;
        }
        showError(els.urlErr, '');
        if (built.protocol === 'file:') {
          els.urlErr.hidden = false;
          els.urlErr.textContent = '当前是本地文件地址，分享平台可能无法在外部打开；部署到线上后即可正常分享。';
        }
        const title = String(els.title.value || '').trim() || '分享链接';
        const desc = String(els.desc.value || '').trim();
        const url = built.url;
        els.finalUrl.textContent = url;
        let qrCanvas = null;
        try { qrCanvas = makeQrCanvas(url, 260); } catch (e) {
          showError(els.urlErr, '二维码生成失败：' + e.message);
        }
        drawQr(qrCanvas);
        drawCard(url, title, desc, qrCanvas);
        const platforms = buildPlatforms(url, title);
        current = { url: url, title: title, desc: desc, platforms: platforms, qrCanvas: qrCanvas };
        renderPlatforms(platforms);
        els.shareMeta.textContent = '链接 ' + url.length + ' 字符 · 二维码 ' + (qrCanvas ? qrCanvas.width + 'px' : '不可用');
      }

      function scheduleUpdate() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(updateAll, 120);
      }

      function copyFormat(kind) {
        if (!current.url) { api.toast('请先填写有效网址', 'err'); return; }
        const title = current.title || '分享链接';
        const url = current.url;
        if (kind === 'markdown') {
          api.copy('[' + title.replace(/([\[\]])/g, '\\$1') + '](' + url.replace(/\)/g, '%29') + ')');
        } else if (kind === 'html') {
          api.copy('<a href="' + esc(url) + '">' + esc(title) + '</a>');
        } else {
          api.copy(title + '\n' + url + (current.desc ? '\n' + current.desc : ''));
        }
      }

      function resetCustomForm() {
        editing = -1;
        els.customName.value = '';
        els.customTpl.value = '';
        els.customSave.textContent = '保存平台';
        els.customCancel.hidden = true;
        showError(els.customErr, '');
      }

      function saveCustom() {
        const name = String(els.customName.value || '').trim();
        const check = validateTemplate(els.customTpl.value);
        if (!name) { showError(els.customErr, '请填写平台名称。'); return; }
        if (name.length > 24) { showError(els.customErr, '平台名称最多 24 个字符。'); return; }
        if (check.error) { showError(els.customErr, check.error); return; }
        const tpl = check.value;
        const wasEditing = editing >= 0;
        if (wasEditing) {
          customPlatforms[editing] = { name: name, tpl: tpl };
        } else {
          if (customPlatforms.length >= 24) { showError(els.customErr, '最多保存 24 个自定义平台。'); return; }
          customPlatforms.push({ name: name, tpl: tpl });
        }
        if (!saveCustomPlatforms()) return;
        resetCustomForm();
        renderCustomList();
        updateAll();
        api.toast(wasEditing ? '自定义平台已更新' : '自定义平台已保存');
      }

      function startEdit(index) {
        const p = customPlatforms[index];
        if (!p) return;
        editing = index;
        els.customName.value = p.name;
        els.customTpl.value = p.tpl;
        els.customSave.textContent = '保存修改';
        els.customCancel.hidden = false;
        showError(els.customErr, '');
        els.customName.focus();
        els.customName.scrollIntoView({ block: 'nearest' });
      }

      function deleteCustom(index) {
        if (!customPlatforms[index]) return;
        customPlatforms.splice(index, 1);
        if (editing === index) resetCustomForm();
        else if (editing > index) editing--;
        saveCustomPlatforms();
        renderCustomList();
        updateAll();
        api.toast('已删除自定义平台');
      }

      els.url.addEventListener('input', scheduleUpdate);
      els.title.addEventListener('input', scheduleUpdate);
      els.desc.addEventListener('input', scheduleUpdate);
      els.utmSource.addEventListener('input', scheduleUpdate);
      els.utmMedium.addEventListener('input', scheduleUpdate);
      els.utmCampaign.addEventListener('input', scheduleUpdate);
      els.utmChips.addEventListener('click', function (e) {
        const btn = e.target && e.target.closest ? e.target.closest('[data-source]') : null;
        if (!btn) return;
        els.utmSource.value = btn.getAttribute('data-source') || '';
        els.utmMedium.value = btn.getAttribute('data-medium') || '';
        updateAll();
      });
      els.copyMain.addEventListener('click', function () {
        if (!current.url) { api.toast('请先填写有效网址', 'err'); return; }
        api.copy(current.url);
      });
      els.openMain.addEventListener('click', function () {
        if (!current.url) { api.toast('请先填写有效网址', 'err'); return; }
        window.open(current.url, '_blank', 'noopener');
      });
      els.copyMarkdown.addEventListener('click', function () { copyFormat('markdown'); });
      els.copyHtml.addEventListener('click', function () { copyFormat('html'); });
      els.copyPlain.addEventListener('click', function () { copyFormat('plain'); });
      els.exportCard.addEventListener('click', function () {
        if (!current.url) { api.toast('请先填写有效网址', 'err'); return; }
        api.save(els.card.toDataURL('image/png'), 'share-card.png');
      });
      els.exportQr.addEventListener('click', function () {
        if (!current.qrCanvas) { api.toast('二维码尚不可用', 'err'); return; }
        api.save(current.qrCanvas.toDataURL('image/png'), 'share-qrcode.png');
      });
      els.platformGrid.addEventListener('click', function (e) {
        const btn = e.target && e.target.closest ? e.target.closest('[data-copy-idx]') : null;
        if (!btn) return;
        const idx = parseInt(btn.getAttribute('data-copy-idx'), 10);
        const p = current.platforms[idx];
        if (!p) return;
        api.copy(p.href || current.url);
      });
      els.customList.addEventListener('click', function (e) {
        const target = e.target;
        if (!target || !target.closest) return;
        const editBtn = target.closest('[data-edit]');
        const delBtn = target.closest('[data-del]');
        if (editBtn) { startEdit(parseInt(editBtn.getAttribute('data-edit'), 10)); return; }
        if (delBtn) deleteCustom(parseInt(delBtn.getAttribute('data-del'), 10));
      });
      els.customSave.addEventListener('click', saveCustom);
      els.customCancel.addEventListener('click', resetCustomForm);

      function initFields() {
        els.url.value = location.href;
        els.title.value = document.title || '拾器 ToolBox';
        const meta = document.querySelector('meta[name="description"]');
        els.desc.value = meta ? (meta.getAttribute('content') || '').slice(0, 120) : '';
      }

      initFields();
      renderCustomList();
      updateAll();
      watchTheme(api, function () {
        if (current.url) {
          drawQr(current.qrCanvas);
          drawCard(current.url, current.title, current.desc, current.qrCanvas);
        }
      });

      api.onCleanup(function () {
        clearTimeout(updateTimer);
      });
    }
  });
})();
