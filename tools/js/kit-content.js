/* ============================================================
 * kit-content.js — 内容类工具（配平 / 五行讲解 / 亲属称谓 / 今日运势 / 五行八字）
 * ------------------------------------------------------------
 * 全部本地计算，不依赖外部库；传统民俗类内容仅作文化参考。
 * 本文件可覆盖同名工具注册，不修改任何已有文件。
 * ============================================================ */
(function () {
  'use strict';

  var T = window.TOOLKIT;
  if (!T) return;
  var esc = T.esc;

  function R(name, cfg) { T.register(name, cfg); }
  function qs(root, sel) { return root ? root.querySelector(sel) : null; }
  function qsa(root, sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  function nowMs() { return (window.performance && window.performance.now) ? window.performance.now() : Date.now(); }
  function fmtMs(ms) { return ms < 1 ? ms.toFixed(2) + ' ms' : ms < 100 ? ms.toFixed(1) + ' ms' : Math.round(ms) + ' ms'; }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function readStore(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeStore(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function dropStore(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* noop */ }
  }
  function rgbToHex(rgb) {
    var m = String(rgb || '').match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (!m) return '';
    return '#' + [m[1], m[2], m[3]].map(function (x) {
      var s = Number(x).toString(16).toUpperCase();
      return s.length < 2 ? '0' + s : s;
    }).join('');
  }
  function copyText(text) { T.copy(text); }

  /* ============================================================
   * 一、化学方程式配平
   * ============================================================ */
  var SUB_DIGITS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

  function ChemError(msg) { this.name = 'ChemError'; this.message = msg; }
  ChemError.prototype = Object.create(Error.prototype);

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }
  function lcm(a, b) { return Math.abs(a / gcd(a, b) * b) || 1; }
  function FR(n, d) {
    if (d == null) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function fAdd(a, b) { return FR(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fSub(a, b) { return FR(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fMul(a, b) { return FR(a.n * b.n, a.d * b.d); }
  function fDiv(a, b) { return FR(a.n * b.d, a.d * b.n); }
  function fNeg(a) { return FR(-a.n, a.d); }
  function fZero(a) { return a.n === 0; }

  function normalizeFormula(s) {
    s = String(s == null ? '' : s);
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function (ch) { return SUB_DIGITS[ch]; });
    s = s.replace(/⁺/g, '+').replace(/⁻/g, '-');
    s = s.replace(/（/g, '(').replace(/）/g, ')').replace(/【/g, '[').replace(/】/g, ']');
    s = s.replace(/\s+/g, '');
    s = s.replace(/\((s|l|g|aq)\)/gi, '');
    return s;
  }

  function extractCharge(term) {
    var m = term.match(/^(.*?)(?:\^)?(\d{0,2})([+-])$/);
    if (m && m[1]) {
      var q = m[2] ? parseInt(m[2], 10) : 1;
      if (m[3] === '-') q = -q;
      return { formula: m[1], charge: q, suffix: term.slice(m[1].length) };
    }
    m = term.match(/^(.*?)([+-])(\d+)$/);
    if (m && m[1]) {
      var q2 = parseInt(m[3], 10);
      if (m[2] === '-') q2 = -q2;
      return { formula: m[1], charge: q2, suffix: term.slice(m[1].length) };
    }
    return { formula: term, charge: 0, suffix: '' };
  }

  function parseGroupString(str) {
    var idx = 0;
    function readNum() {
      var s = '';
      while (idx < str.length && /\d/.test(str[idx])) { s += str[idx]; idx++; }
      return s ? parseInt(s, 10) : 1;
    }
    function readSeq(stop) {
      var counts = {};
      while (idx < str.length) {
        var ch = str[idx];
        if (stop && ch === stop) { idx++; return counts; }
        if (ch === '(' || ch === '[' || ch === '{') {
          var close = ch === '(' ? ')' : ch === '[' ? ']' : '}';
          idx++;
          var inner = readSeq(close);
          var n = readNum();
          Object.keys(inner).forEach(function (el) { counts[el] = (counts[el] || 0) + inner[el] * n; });
          continue;
        }
        if (/[A-Z]/.test(ch)) {
          var sym = ch; idx++;
          if (idx < str.length && /[a-z]/.test(str[idx])) { sym += str[idx]; idx++; }
          var num = readNum();
          counts[sym] = (counts[sym] || 0) + num;
          continue;
        }
        throw new ChemError('无法识别的字符「' + ch + '」');
      }
      if (stop) throw new ChemError('括号不匹配，缺少「' + stop + '」');
      return counts;
    }
    var out = readSeq(null);
    if (idx < str.length) throw new ChemError('解析未完成');
    return out;
  }

  function parseFormula(formula) {
    var total = {};
    var segs = formula.split(/[·.．*⋅]/);
    segs.forEach(function (seg) {
      if (!seg) throw new ChemError('结晶水点号两侧缺少物质');
      var mul = 1;
      var m = seg.match(/^(\d+)(.*)$/);
      if (m) { mul = parseInt(m[1], 10); seg = m[2]; }
      if (!seg) throw new ChemError('数字后缺少物质');
      var counts = parseGroupString(seg);
      Object.keys(counts).forEach(function (el) {
        total[el] = (total[el] || 0) + counts[el] * mul;
      });
    });
    return total;
  }

  function splitSide(side) {
    var parts = [], buf = '', i = 0;
    while (i < side.length) {
      var ch = side[i];
      if (ch === '+') {
        var prev = side[i - 1] || '';
        var next = side[i + 1] || '';
        var isCharge = /[A-Za-z0-9)\]]/.test(prev) &&
          (next === '' || /\s/.test(next) || next === '+' || next === '-' || next === '·' || next === '.' || next === ')' || next === ']');
        if (!isCharge) { parts.push(buf); buf = ''; i++; continue; }
      }
      buf += ch; i++;
    }
    parts.push(buf);
    var out = [];
    parts.forEach(function (p) { p = p.trim(); if (p) out.push(p); });
    return out;
  }

  function parseEquationLine(line) {
    var s = String(line == null ? '' : line).trim();
    s = s.replace(/^\s*(?:\d+[.)、]|（\d+）|\(\d+\))\s*/, '');
    if (!s) throw new ChemError('方程式为空');
    var arrowRe = /\s*(?:<=>|⇌|⟶|→|⇒|=>|->|—>|=)\s*/;
    var parts = s.split(arrowRe);
    if (parts.length < 2) throw new ChemError('缺少「→」或「=」箭头');
    if (parts.length > 2) throw new ChemError('箭头数量过多，一行只放一个方程式');
    var leftRaw = splitSide(parts[0]);
    var rightRaw = splitSide(parts[1]);
    if (!leftRaw.length || !rightRaw.length) throw new ChemError('箭头两侧都必须有物质');
    var species = [], leftIdx = [], rightIdx = [];
    function addTerms(terms, side, idxArr) {
      terms.forEach(function (term) {
        var t = normalizeFormula(term);
        var coef = 1;
        var cm = t.match(/^(\d+)(?=[A-Z(\[{])/);
        if (cm) { coef = parseInt(cm[1], 10); t = t.slice(cm[1].length); }
        if (!t) throw new ChemError('「' + term + '」缺少化学式');
        var ch = extractCharge(t);
        if (!ch.formula) throw new ChemError('「' + term + '」无法解析电荷');
        var counts;
        try { counts = parseFormula(ch.formula); }
        catch (e) { throw new ChemError('「' + term + '」' + (e.message || '化学式无法解析')); }
        var idx = species.length;
        var display = ch.formula + (ch.suffix || '');
        species.push({ side: side, display: display, coef: coef, formula: ch.formula, counts: counts, charge: ch.charge });
        idxArr.push(idx);
      });
    }
    addTerms(leftRaw, 'L', leftIdx);
    addTerms(rightRaw, 'R', rightIdx);
    return { species: species, leftIdx: leftIdx, rightIdx: rightIdx };
  }

  function rref(A, m, n) {
    var pivots = [], row = 0;
    for (var col = 0; col < n && row < m; col++) {
      var sel = -1;
      for (var i = row; i < m; i++) if (!fZero(A[i][col])) { sel = i; break; }
      if (sel < 0) continue;
      var tmp = A[row]; A[row] = A[sel]; A[sel] = tmp;
      var pv = A[row][col];
      for (var j = 0; j < n; j++) A[row][j] = fDiv(A[row][j], pv);
      for (var i2 = 0; i2 < m; i2++) {
        if (i2 === row) continue;
        var f = A[i2][col];
        if (fZero(f)) continue;
        for (var j2 = 0; j2 < n; j2++) A[i2][j2] = fSub(A[i2][j2], fMul(f, A[row][j2]));
      }
      pivots.push(col); row++;
    }
    return { pivots: pivots, rank: row };
  }

  function nullspace(A, m, n, pivots) {
    var pivotSet = {};
    pivots.forEach(function (p) { pivotSet[p] = true; });
    var free = [], j;
    for (j = 0; j < n; j++) if (!pivotSet[j]) free.push(j);
    var basis = [];
    free.forEach(function (f) {
      var x = [];
      for (j = 0; j < n; j++) x.push(FR(0));
      x[f] = FR(1);
      for (var r = 0; r < pivots.length; r++) {
        var p = pivots[r];
        var s = FR(0);
        for (var j2 = 0; j2 < n; j2++) {
          if (j2 === p) continue;
          s = fAdd(s, fMul(A[r][j2], x[j2]));
        }
        x[p] = fNeg(s);
      }
      basis.push(x);
    });
    return basis;
  }

  function integerize(x) {
    var l = 1, i;
    for (i = 0; i < x.length; i++) if (x[i].n !== 0) l = lcm(l, x[i].d);
    var arr = [];
    for (i = 0; i < x.length; i++) arr.push(x[i].n * (l / x[i].d));
    var g = 0;
    for (i = 0; i < arr.length; i++) g = gcd(g, Math.abs(arr[i]));
    if (g > 1) for (i = 0; i < arr.length; i++) arr[i] = arr[i] / g;
    return arr;
  }

  function positiveVector(arr) {
    var hasPos = false, hasNeg = false, hasZero = false, i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] > 0) hasPos = true;
      else if (arr[i] < 0) hasNeg = true;
      else hasZero = true;
    }
    if (hasZero) return null;
    if (hasPos && hasNeg) return null;
    if (hasNeg) { for (i = 0; i < arr.length; i++) arr[i] = -arr[i]; }
    return arr;
  }

  function positiveSolution(basis, n) {
    var k = basis.length;
    if (!k) return null;
    if (k === 1) {
      var v = positiveVector(integerize(basis[0]));
      return v ? { coefs: v, unique: true } : null;
    }
    var best = null, bestKey = null;
    var limit = k > 4 ? 4 : k;
    var range = 3;
    var combo = [];
    var iter = 0;
    function walk(pos) {
      if (iter++ > 200000) return;
      if (pos === limit) {
        var allZero = true;
        for (var z = 0; z < limit; z++) if (combo[z] !== 0) { allZero = false; break; }
        if (allZero) return;
        var x = [];
        for (var j = 0; j < n; j++) x.push(FR(0));
        for (var b = 0; b < limit; b++) {
          if (!combo[b]) continue;
          for (var j2 = 0; j2 < n; j2++) x[j2] = fAdd(x[j2], fMul(FR(combo[b]), basis[b][j2]));
        }
        var vec = positiveVector(integerize(x));
        if (!vec) return;
        var sum = 0, max = 0;
        for (var q = 0; q < vec.length; q++) { sum += vec[q]; if (vec[q] > max) max = vec[q]; }
        var key = sum * 10000 + max;
        if (!best || key < bestKey) { best = vec; bestKey = key; }
        return;
      }
      for (var c = -range; c <= range; c++) { combo[pos] = c; walk(pos + 1); }
    }
    walk(0);
    return best ? { coefs: best, unique: false } : null;
  }

  function balanceEquation(line) {
    var parsed = parseEquationLine(line);
    var sp = parsed.species, n = sp.length;
    var elems = [];
    sp.forEach(function (s) { Object.keys(s.counts).forEach(function (el) { if (elems.indexOf(el) < 0) elems.push(el); }); });
    var rows = [], labels = [];
    elems.forEach(function (el) {
      var row = [];
      for (var j = 0; j < n; j++) {
        var c = sp[j].counts[el] || 0;
        row.push(FR(sp[j].side === 'L' ? c : -c));
      }
      rows.push(row); labels.push(el);
    });
    var hasCharge = sp.some(function (s) { return s.charge !== 0; });
    if (hasCharge) {
      var crow = [];
      for (var j2 = 0; j2 < n; j2++) crow.push(FR(sp[j2].side === 'L' ? sp[j2].charge : -sp[j2].charge));
      rows.push(crow); labels.push('电荷');
    }
    var m = rows.length;
    var A = rows.map(function (r) { return r.slice(); });
    var rr = rref(A, m, n);
    var basis = nullspace(A, m, n, rr.pivots);
    var sol = positiveSolution(basis, n);
    var res = {
      ok: false, line: line, species: sp, labels: labels, rank: rr.rank, nullity: n - rr.rank,
      hasCharge: hasCharge, elements: [], charge: null
    };
    if (!sol) {
      res.error = '无解：在当前物质之间找不到所有元素（及电荷）同时守恒的正整数系数。请检查化学式、离子电荷或是否漏写物质。';
      return res;
    }
    res.ok = true;
    res.coefs = sol.coefs;
    res.unique = sol.unique;
    if (!sol.unique) res.note = '该方程组存在多组独立解（多解），这里给出总系数最小的一组。';
    var leftParts = [], rightParts = [];
    for (var j3 = 0; j3 < n; j3++) {
      var c3 = sol.coefs[j3];
      var piece = (c3 === 1 ? '' : c3) + sp[j3].display;
      if (sp[j3].side === 'L') leftParts.push(piece); else rightParts.push(piece);
    }
    res.balanced = leftParts.join(' + ') + ' → ' + rightParts.join(' + ');
    var elementRows = [];
    labels.forEach(function (label, ri) {
      var left = 0, right = 0;
      var leftBits = [], rightBits = [];
      for (var j4 = 0; j4 < n; j4++) {
        var val = label === '电荷' ? sp[j4].charge : (sp[j4].counts[label] || 0);
        if (val === 0) continue;
        var bit = sol.coefs[j4] + '×' + val;
        if (sp[j4].side === 'L') { left += sol.coefs[j4] * val; leftBits.push(bit); }
        else { right += sol.coefs[j4] * val; rightBits.push(bit); }
      }
      elementRows.push({
        label: label, left: left, right: right, ok: left === right,
        leftBits: leftBits.join(' + ') || '0', rightBits: rightBits.join(' + ') || '0'
      });
    });
    res.elements = elementRows;
    return res;
  }

  if (window.__CT_TEST__) {
    window.__CT_TEST_HOOKS__ = { balanceEquation: balanceEquation, parseEquationLine: parseEquationLine };
  }

  var CHEM_EXAMPLES = [
    { label: '铁在氧气中燃烧', text: 'Fe + O2 -> Fe2O3' },
    { label: '丙烷完全燃烧', text: 'C3H8 + O2 -> CO2 + H2O' },
    { label: '铝与盐酸', text: 'Al + HCl -> AlCl3 + H2' },
    { label: '中和反应', text: 'Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O' },
    { label: '实验室制氧气', text: 'KClO3 -> KCl + O2' },
    { label: '高炉炼铁', text: 'Fe2O3 + CO -> Fe + CO2' },
    { label: '结晶水受热', text: 'CuSO4·5H2O -> CuSO4 + H2O' },
    { label: '离子电荷示例', text: 'Fe3+ + Cl- -> FeCl3' }
  ];

  function chemResultText(items, elapsed) {
    var lines = ['化学方程式配平结果', '生成时间：' + new Date().toLocaleString('zh-CN'), '总耗时：' + fmtMs(elapsed), ''];
    items.forEach(function (item, i) {
      lines.push('【方程式 ' + (i + 1) + '】' + item.line);
      if (!item.ok) { lines.push('结果：' + item.error); lines.push(''); return; }
      lines.push('配平：' + item.balanced);
      lines.push('矩阵：' + item.labels.length + ' 行 × ' + item.species.length + ' 列，秩 ' + item.rank + '，零空间维数 ' + item.nullity);
      if (item.note) lines.push('说明：' + item.note);
      lines.push('元素守恒：');
      item.elements.forEach(function (e) {
        lines.push('  ' + e.label + '：左 ' + e.left + '，右 ' + e.right + (e.ok ? '，守恒' : '，不守恒'));
      });
      lines.push('');
    });
    lines.push('提示：结果由本地整数线性代数计算，仅用于学习与核对。');
    return lines.join('\n');
  }

  function renderChem(pane, api) {
    pane.innerHTML =
      '<div class="ct-wrap ct-chem">' +
        '<section class="ct-card ct-chem-input">' +
          '<div class="ct-head">' +
            '<div><h3 class="ct-title">输入方程式</h3><p class="ct-sub">输入一个或多个方程式，按行批量配平。支持 =、-&gt;、→、⇌ 等箭头。</p></div>' +
            '<div class="ct-head-actions">' +
              '<button type="button" class="btn btn-primary" id="chemRun">配平</button>' +
              '<button type="button" class="btn btn-ghost" id="chemCopy">复制结果</button>' +
              '<button type="button" class="btn btn-ghost" id="chemDownload">下载 txt</button>' +
            '</div>' +
          '</div>' +
          '<textarea id="chemInput" class="ct-textarea ct-mono" rows="6" spellcheck="false" aria-label="化学方程式输入">Fe + O2 -> Fe2O3</textarea>' +
          '<p class="ct-hint">每行一个方程式。支持元素符号、括号分组（Ca(OH)2）、结晶水点号（CuSO4·5H2O）、离子电荷（Fe3+、Cl-）与系数缺省；点号按同一物质的结晶水组分累加。</p>' +
          '<div class="ct-chip-row" id="chemExamples">' +
            CHEM_EXAMPLES.map(function (ex, i) {
              return '<button type="button" class="ct-chip" data-chem-ex="' + i + '">' + esc(ex.label) + '</button>';
            }).join('') +
          '</div>' +
        '</section>' +
        '<div id="chemOut" class="ct-results"><div class="ct-empty">点击「配平」开始；所有计算都在当前浏览器内完成。</div></div>' +
      '</div>';

    var input = qs(pane, '#chemInput');
    var out = qs(pane, '#chemOut');
    var lastText = '';

    function run() {
      var t0 = nowMs();
      var raw = input.value;
      var lines = raw.split(/\r?\n|；|;/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!lines.length) {
        out.innerHTML = '<div class="ct-note ct-note-err">请先输入至少一个方程式，例如 <code>Fe + O2 -&gt; Fe2O3</code>。</div>';
        lastText = '';
        return;
      }
      var items = [];
      lines.forEach(function (line, i) {
        var t = nowMs();
        try {
          var r = balanceEquation(line);
          r.line = line;
          r.index = i + 1;
          r.ms = nowMs() - t;
          items.push(r);
        } catch (e) {
          items.push({ ok: false, line: line, index: i + 1, error: e && e.message ? e.message : String(e), ms: nowMs() - t });
        }
      });
      var elapsed = nowMs() - t0;
      lastText = chemResultText(items, elapsed);
      var okCount = items.filter(function (x) { return x.ok; }).length;
      var errCount = items.length - okCount;
      var html = '';
      html += '<div class="ct-summary">' +
        '<span class="ct-badge ' + (okCount ? 'ct-badge-good' : 'ct-badge-err') + '">成功 ' + okCount + '</span>' +
        (errCount ? '<span class="ct-badge ct-badge-err">失败 ' + errCount + '</span>' : '') +
        '<span class="ct-meta">共 ' + items.length + ' 条 · 总耗时 ' + fmtMs(elapsed) + '</span>' +
        '</div>';

      items.forEach(function (item) {
        var head = '<div class="ct-result-head"><span class="ct-result-no">方程式 ' + item.index + '</span>' +
          '<span class="ct-meta">' + esc(item.line) + ' · ' + fmtMs(item.ms) + '</span></div>';
        if (!item.ok) {
          html += '<section class="ct-result ct-result-err">' + head +
            '<div class="ct-note ct-note-err"><b>第 ' + item.index + ' 条无法配平：</b>' + esc(item.error) + '</div>' +
            '<p class="ct-hint">常见原因：元素符号大小写写错（如 CL 应为 Cl）、漏写生成物、离子电荷与原子数无法同时守恒。</p>' +
            '</section>';
          return;
        }
        html += '<section class="ct-result">' + head +
          '<div class="ct-eq ct-mono">' + esc(item.balanced) + '</div>' +
          (item.note ? '<div class="ct-note ct-note-warn">' + esc(item.note) + '</div>' : '') +
          '<div class="ct-meta">原子矩阵 ' + item.labels.length + ' 行 × ' + item.species.length + ' 列 · 秩 ' + item.rank + ' · 零空间维数 ' + item.nullity + ' · 耗时 ' + fmtMs(item.ms) + '</div>' +
          '<div class="ct-table-wrap"><table class="data-table ct-table"><thead><tr><th>元素</th><th>左边原子数</th><th>右边原子数</th><th>核对</th></tr></thead><tbody>' +
            item.elements.map(function (e) {
              return '<tr><td><b>' + esc(e.label) + '</b></td><td class="ct-mono">' + esc(e.left) + '<span class="ct-muted">（' + esc(e.leftBits) + '）</span></td>' +
                '<td class="ct-mono">' + esc(e.right) + '<span class="ct-muted">（' + esc(e.rightBits) + '）</span></td>' +
                '<td>' + (e.ok ? '<span class="ct-ok">守恒</span>' : '<span class="ct-bad">不守恒</span>') + '</td></tr>';
            }).join('') +
          '</tbody></table></div>' +
          '<details class="ct-details"><summary>逐步说明</summary>' +
            '<ol class="ct-steps">' +
              '<li>解析出 ' + item.species.length + ' 种物质，' + item.labels.length + ' 条守恒关系（' + item.labels.map(function (x) { return esc(x); }).join('、') + '）。</li>' +
              '<li>把每种物质的原子数写成列向量，左边取正、右边取负，得到原子矩阵。</li>' +
              '<li>对矩阵做精确分数高斯消元，秩为 ' + item.rank + '，零空间维数为 ' + item.nullity + '。</li>' +
              '<li>对零空间基向量按分母最小公倍数取整，再除以最大公约数，得到最简正整数系数：' + esc(item.coefs.join(' : ')) + '。</li>' +
              '<li>逐元素核对左右原子数，结果见上表。</li>' +
            '</ol>' +
          '</details>' +
          '</section>';
      });
      out.innerHTML = html;
      // 事件绑定在 innerHTML 之后
      qsa(out, '[data-copy-eq]').forEach(function (b) {
        b.addEventListener('click', function () { copyText(b.getAttribute('data-copy-eq')); });
      });
    }

    qs(pane, '#chemRun').onclick = run;
    qs(pane, '#chemCopy').onclick = function () {
      if (!lastText) { T.toast('还没有可复制的结果', 'err'); return; }
      copyText(lastText);
    };
    qs(pane, '#chemDownload').onclick = function () {
      if (!lastText) { T.toast('还没有可下载的结果', 'err'); return; }
      T.save(T.textBlob(lastText), '化学方程式配平.txt');
    };
    on(input, 'keydown', function (e) {
      if (e.isComposing) return;
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });
    qsa(pane, '[data-chem-ex]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ex = CHEM_EXAMPLES[Number(b.getAttribute('data-chem-ex'))];
        if (!ex) return;
        input.value = ex.text;
        input.focus();
        run();
      });
    });
    run();
  }

  R('化学方程式配平', { render: renderChem });

  /* ============================================================
   * 二、五行讲解
   * ============================================================ */
  var WX_ORDER = ['木', '火', '土', '金', '水'];
  var WX_DATA = {
    '木': {
      short: '生发', color: 'good',
      lead: '木对应春季与东方，象征生长、舒展与规划。传统上把树木向上生长的样子比作人的进取心与条理感，也用它来描述肝的疏泄功能。它不是一种可以测量的物质，而是一套用来归纳关系的分类语言。',
      pos: '东方', season: '春季', colorName: '青、绿', taste: '酸', organ: '肝、胆', mood: '怒', job: '教育、文化出版、林木园艺、医药、策划设计',
      imbalance: '木过旺时容易急躁、固执、睡不安稳；木不足时常见犹豫、提不起劲、计划多而落地少。传统上还会联系到眼睛、筋腱与情绪郁结。',
      advice: '作息上尽量在子时前入睡，白天安排户外散步与拉伸。饮食可适量选择青色蔬菜与酸味食物，但不必刻意偏食。情绪上给计划留出弹性，避免把每件事都做成必须完成的任务。'
    },
    '火': {
      short: '炎上', color: 'err',
      lead: '火对应夏季与南方，象征温热、光明与推动力。传统上把火比作心脏的泵血与精神活动，也用来描述表达欲和影响力。火不是越旺越好，过旺会灼伤，不足则缺少热度。',
      pos: '南方', season: '夏季', colorName: '赤、红', taste: '苦', organ: '心、小肠', mood: '喜', job: '能源、餐饮、传媒、演艺、电子、营销',
      imbalance: '火过旺时容易亢奋、口干、情绪起伏大；火不足时常见畏寒、动力不足、表达意愿低。传统上会联系到睡眠、心神与血液循环。',
      advice: '夏天避免长时间暴晒与熬夜，给兴奋状态留出冷却时间。饮食可适量选择苦味与红色食材，但脾胃虚寒者不宜过量。工作节奏上把高强度任务拆成短段，中间安排安静休息。'
    },
    '土': {
      short: '承载', color: 'warn',
      lead: '土对应长夏与中央，象征承载、消化与稳定。传统上把土比作脾胃的运化功能，也用来描述一个人对现实资源的整合能力。土性厚重，过厚则滞，过薄则虚。',
      pos: '中央、西南与东北', season: '长夏、四季末', colorName: '黄、棕', taste: '甘', organ: '脾、胃', mood: '思', job: '地产、农业、建筑、仓储、物流、中介、餐饮供应链',
      imbalance: '土过旺时容易思虑过度、行动迟缓、胃口负担重；土不足时常见消化弱、容易担心、难以坚持。传统上会联系到肌肉、口腔与湿气。',
      advice: '三餐尽量定时，少吃过甜与过油的食物。把担心的事写下来再逐项处理，避免反复在脑中打转。运动选择快走、八段锦一类温和而持续的方式。'
    },
    '金': {
      short: '收敛', color: 'text',
      lead: '金对应秋季与西方，象征收敛、边界与决断。传统上把金比作肺的宣发肃降，也用来描述规则感、审美与取舍能力。金气清肃，过则冷硬，不足则优柔。',
      pos: '西方', season: '秋季', colorName: '白、金属色', taste: '辛', organ: '肺、大肠', mood: '悲', job: '金融、机械、法律、五金、军警、审计、精密制造',
      imbalance: '金过旺时容易苛刻、鼻咽干燥、难以放松；金不足时常见边界感弱、容易感伤、决断拖延。传统上会联系到呼吸系统、皮肤与大肠。',
      advice: '秋季注意润燥与保暖，室内保持适度通风。饮食可适量选择白色食材与辛味，但不宜过度辛辣。练习把拒绝说得清楚而不带情绪，给关系留出边界。'
    },
    '水': {
      short: '润下', color: 'accent',
      lead: '水对应冬季与北方，象征收藏、流动与智慧。传统上把水比作肾的藏精与膀胱的代谢，也用来描述一个人的储备、适应力与深层思考。水能载舟亦能覆舟，过则泛滥，不足则枯竭。',
      pos: '北方', season: '冬季', colorName: '黑、蓝', taste: '咸', organ: '肾、膀胱', mood: '恐', job: '物流、贸易、水产、旅游、信息、咨询、金融流动',
      imbalance: '水过旺时容易多思多虑、畏寒、行动被情绪拖住；水不足时常见口干、腰膝乏力、缺乏安全感。传统上会联系到骨骼、耳与泌尿系统。',
      advice: '冬季早睡晚起，注意腰腹与足部保暖。饮水适量而均匀，不必一次猛灌。给自己留独处与复盘的时间，但避免在深夜反复推演最坏结果。'
    }
  };
  function wxNext(el) { return WX_ORDER[(WX_ORDER.indexOf(el) + 1) % 5]; }
  function wxKe(el) { return WX_ORDER[(WX_ORDER.indexOf(el) + 2) % 5]; }
  function wxPrev(el) { return WX_ORDER[(WX_ORDER.indexOf(el) + 4) % 5]; }
  function wxKeMe(el) { return WX_ORDER[(WX_ORDER.indexOf(el) + 3) % 5]; }

  function wxWheelHTML() {
    var pts = [];
    WX_ORDER.forEach(function (el, i) {
      var rad = (-90 + i * 72) * Math.PI / 180;
      pts.push({ el: el, x: 50 + 38 * Math.cos(rad), y: 50 + 38 * Math.sin(rad) });
    });
    function line(from, to, kind, label) {
      var dx = to.x - from.x, dy = to.y - from.y;
      var len = Math.sqrt(dx * dx + dy * dy);
      var ang = Math.atan2(dy, dx) * 180 / Math.PI;
      return '<i class="ct-wx-line ct-wx-line-' + kind + '" data-kind="' + kind + '" data-from="' + from.el + '" data-to="' + to.el + '" ' +
        'style="left:' + from.x.toFixed(3) + '%;top:' + from.y.toFixed(3) + '%;width:' + len.toFixed(3) + '%;transform:rotate(' + ang.toFixed(2) + 'deg)" ' +
        'aria-hidden="true"></i>';
    }
    var lines = '';
    pts.forEach(function (p, i) {
      lines += line(p, pts[(i + 1) % 5], 'sheng');
      lines += line(p, pts[(i + 2) % 5], 'ke');
    });
    return '<div class="ct-wx-wheel" id="wxWheel" role="group" aria-label="五行相生相克关系图">' +
      lines +
      '<div class="ct-wx-center"><span>五行</span><em>相生 · 相克</em></div>' +
      pts.map(function (p) {
        return '<button type="button" class="ct-wx-node" data-el="' + p.el + '" style="left:' + p.x.toFixed(3) + '%;top:' + p.y.toFixed(3) + '%" aria-pressed="false">' +
          '<b>' + p.el + '</b><small>' + esc(WX_DATA[p.el].short) + '</small></button>';
      }).join('') +
      '</div>';
  }

  function wxInfoHTML(el) {
    var d = WX_DATA[el];
    return '<div class="ct-wx-info-head"><span class="ct-wx-mark ct-wx-mark-' + d.color + '">' + el + '</span>' +
      '<div><h3 class="ct-title">' + el + ' · ' + esc(d.short) + '</h3><p class="ct-sub">五行之一，传统用来归纳生长、功能与关系，不是科学分类。</p></div></div>' +
      '<p class="ct-wx-lead">' + esc(d.lead) + '</p>' +
      '<dl class="ct-def">' +
        '<div><dt>方位</dt><dd>' + esc(d.pos) + '</dd></div>' +
        '<div><dt>季节</dt><dd>' + esc(d.season) + '</dd></div>' +
        '<div><dt>颜色</dt><dd>' + esc(d.colorName) + '</dd></div>' +
        '<div><dt>味道</dt><dd>' + esc(d.taste) + '</dd></div>' +
        '<div><dt>脏腑</dt><dd>' + esc(d.organ) + '</dd></div>' +
        '<div><dt>情绪</dt><dd>' + esc(d.mood) + '</dd></div>' +
        '<div class="ct-def-wide"><dt>行业倾向</dt><dd>' + esc(d.job) + '</dd></div>' +
      '</dl>' +
      '<div class="ct-wx-rel">' +
        '<div class="ct-wx-rel-item ct-wx-rel-sheng"><b>我生</b><span>' + el + ' 生 ' + wxNext(el) + '</span><em>把力量向外输出，像树木长出新枝。</em></div>' +
        '<div class="ct-wx-rel-item ct-wx-rel-sheng"><b>生我</b><span>' + wxPrev(el) + ' 生 ' + el + '</span><em>得到滋养与支持，是力量的来源。</em></div>' +
        '<div class="ct-wx-rel-item ct-wx-rel-ke"><b>我克</b><span>' + el + ' 克 ' + wxKe(el) + '</span><em>主动约束与改造，像树根抓住泥土。</em></div>' +
        '<div class="ct-wx-rel-item ct-wx-rel-ke"><b>克我</b><span>' + wxKeMe(el) + ' 克 ' + el + '</span><em>受到外部限制，需要学会与之相处。</em></div>' +
      '</div>' +
      '<h4 class="ct-wx-h4">失衡表现</h4><p class="ct-wx-p">' + esc(d.imbalance) + '</p>' +
      '<h4 class="ct-wx-h4">日常调和建议</h4><p class="ct-wx-p">' + esc(d.advice) + '</p>' +
      '<p class="ct-note ct-note-soft">以上为传统民俗与文化的解释框架，不具科学依据，也不构成健康、职业或投资建议。</p>';
  }

  var WX_FB_KEY = 'ct_wuxing_feedback_v1';
  var WX_FB_LABELS = ['很准', '一般', '不认同'];

  function wxRenderStats(host) {
    var data = readStore(WX_FB_KEY, {});
    var counts = { '很准': 0, '一般': 0, '不认同': 0 };
    WX_FB_LABELS.forEach(function (k) { counts[k] = Number(data[k]) || 0; });
    var total = counts['很准'] + counts['一般'] + counts['不认同'];
    var html = '<div class="ct-fb-stat">已记录：' +
      WX_FB_LABELS.map(function (k) { return esc(k) + ' ' + counts[k] + ' 次'; }).join(' · ') +
      (total ? '（共 ' + total + ' 次）' : '') + '</div>';
    if (total) {
      html += '<div class="ct-fb-bars">' + WX_FB_LABELS.map(function (k) {
        var pct = Math.round(counts[k] / total * 100);
        return '<div class="ct-fb-bar"><span>' + esc(k) + '</span><i class="ct-bar"><b style="width:' + pct + '%"></b></i><em>' + pct + '%</em></div>';
      }).join('') + '</div>';
    }
    html += '<p class="ct-hint">记录只保存在本机浏览器 localStorage，不上传；清空站点数据后会一并重置。</p>';
    host.innerHTML = html;
  }

  function renderWuxing(pane, api) {
    pane.innerHTML =
      '<div class="ct-wrap ct-wx">' +
        '<div class="ct-wx-layout">' +
          '<section class="ct-card ct-wx-left">' +
            '<div class="ct-head"><div><h3 class="ct-title">五行关系图</h3><p class="ct-sub">点击任一「行」查看含义、对应与失衡表现。</p></div>' +
              '<div class="ct-head-actions"><button type="button" class="btn btn-ghost btn-sm" id="wxCopy">复制讲解</button></div></div>' +
            wxWheelHTML() +
            '<div class="ct-wx-legend"><span><i class="ct-line-sample ct-line-sheng"></i>相生（外圈）</span><span><i class="ct-line-sample ct-line-ke"></i>相克（内五角）</span></div>' +
            '<div class="ct-wx-toggles" id="wxToggles">' +
              '<button type="button" class="ct-toggle" data-toggle="woSheng" aria-pressed="false">我生</button>' +
              '<button type="button" class="ct-toggle" data-toggle="shengMe" aria-pressed="false">生我</button>' +
              '<button type="button" class="ct-toggle" data-toggle="woKe" aria-pressed="false">我克</button>' +
              '<button type="button" class="ct-toggle" data-toggle="keMe" aria-pressed="false">克我</button>' +
            '</div>' +
            '<p class="ct-hint">开关用于高亮当前选中行的四类关系；全部关闭时显示完整关系图。</p>' +
            '<div class="ct-wx-personal">' +
              '<label for="wxBirth" class="ct-label">出生年份或日期（可选）</label>' +
              '<div class="ct-inline"><input type="text" id="wxBirth" class="ct-input" placeholder="如 1995 或 1995-06-15" autocomplete="off">' +
              '<button type="button" class="btn btn-primary" id="wxCalc">计算五行分布</button></div>' +
              '<p class="ct-hint">按传统干支统计五行分布；若站点农历组件已加载且输入完整日期，会统计年、月、日三柱六字。</p>' +
            '</div>' +
            '<div id="wxDist" class="ct-wx-dist"></div>' +
          '</section>' +
          '<section class="ct-card ct-wx-right" id="wxInfo"></section>' +
        '</div>' +
        '<section class="ct-card ct-wx-feedback">' +
          '<div class="ct-head"><div><h3 class="ct-title">这个讲解符合你的理解吗？</h3><p class="ct-sub">你的反馈只保存在本机，用来看看这类内容是否讲清楚了。</p></div></div>' +
          '<div class="ct-fb-actions" id="wxFbActions">' +
            WX_FB_LABELS.map(function (k) { return '<button type="button" class="btn btn-ghost" data-fb="' + k + '">' + k + '</button>'; }).join('') +
            '<button type="button" class="btn btn-ghost btn-sm" id="wxFbClear">清空记录</button>' +
          '</div>' +
          '<div id="wxFbStat" class="ct-fb-stat"></div>' +
          '<p class="ct-note ct-note-soft">内容为传统文化参考，不具科学依据。</p>' +
        '</section>' +
      '</div>';

    var wheel = qs(pane, '#wxWheel');
    var info = qs(pane, '#wxInfo');
    var dist = qs(pane, '#wxDist');
    var selected = '木';
    var toggles = { woSheng: false, shengMe: false, woKe: false, keMe: false };
    var lastText = '';
    var distPlain = '';

    function wxPlain(el, dist) {
      var d = WX_DATA[el];
      var lines = [
        '五行讲解 · ' + el + ' · ' + d.short,
        '含义：' + d.lead,
        '对应：方位 ' + d.pos + '；季节 ' + d.season + '；颜色 ' + d.colorName + '；味道 ' + d.taste + '；脏腑 ' + d.organ + '；情绪 ' + d.mood + '；行业倾向 ' + d.job + '。',
        '关系：我生 ' + el + '生' + wxNext(el) + '；生我 ' + wxPrev(el) + '生' + el + '；我克 ' + el + '克' + wxKe(el) + '；克我 ' + wxKeMe(el) + '克' + el + '。',
        '失衡表现：' + d.imbalance,
        '日常调建议：' + d.advice
      ];
      if (dist) lines.push('', dist);
      lines.push('', '说明：以上为传统民俗与文化的解释框架，不具科学依据，也不构成健康、职业或投资建议。');
      return lines.join('\n');
    }

    function updateWheel() {
      var nodes = qsa(wheel, '.ct-wx-node');
      nodes.forEach(function (n) {
        var el = n.getAttribute('data-el');
        var on = el === selected;
        n.classList.toggle('is-on', on);
        n.setAttribute('aria-pressed', String(on));
      });
      var lines = qsa(wheel, '.ct-wx-line');
      var any = toggles.woSheng || toggles.shengMe || toggles.woKe || toggles.keMe;
      lines.forEach(function (ln) {
        var kind = ln.getAttribute('data-kind');
        var from = ln.getAttribute('data-from');
        var to = ln.getAttribute('data-to');
        var hl = false;
        if (kind === 'sheng' && toggles.woSheng && from === selected) hl = true;
        if (kind === 'sheng' && toggles.shengMe && to === selected) hl = true;
        if (kind === 'ke' && toggles.woKe && from === selected) hl = true;
        if (kind === 'ke' && toggles.keMe && to === selected) hl = true;
        ln.classList.toggle('is-hl', hl);
        ln.classList.toggle('is-dim', any && !hl);
      });
    }

    function select(el) {
      selected = el;
      info.innerHTML = wxInfoHTML(el);
      updateWheel();
      lastText = wxPlain(el, distPlain);
    }

    qsa(wheel, '.ct-wx-node').forEach(function (n) {
      n.addEventListener('click', function () { select(n.getAttribute('data-el')); });
    });
    qsa(pane, '[data-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-toggle');
        toggles[key] = !toggles[key];
        b.classList.toggle('is-on', toggles[key]);
        b.setAttribute('aria-pressed', String(toggles[key]));
        updateWheel();
      });
    });
    select('木');

    var CHAR_ELEM = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    function manualYearGZ(y) {
      var gan = '甲乙丙丁戊己庚辛壬癸', zhi = '子丑寅卯辰巳午未申酉戌亥';
      var n = ((y - 4) % 60 + 60) % 60;
      return gan.charAt(n % 10) + zhi.charAt(n % 12);
    }
    function countWX(chars) {
      var c = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
      chars.split('').forEach(function (ch) { if (CHAR_ELEM[ch]) c[CHAR_ELEM[ch]]++; });
      return c;
    }
    function adviceFor(counts, strong, missing) {
      var tips = [];
      if (missing.length) {
        var map = {
          '木': '多接触绿植与户外光线，方位可取东方，颜色偏青绿，作息尽量早睡。',
          '火': '增加日照与中等强度运动，方位可取南方，颜色偏红，保持适度社交。',
          '土': '规律三餐与睡眠，接触园艺或土地，颜色偏黄棕，把计划落到固定时段。',
          '金': '整理空间与边界，方位可取西方，颜色偏白，练习断舍离与清楚表达拒绝。',
          '水': '注意补水与睡眠，方位可取北方，颜色偏蓝黑，给自己留独处与复盘时间。'
        };
        missing.forEach(function (el) { tips.push('偏缺' + el + '：' + map[el]); });
      }
      if (strong) {
        var drain = {
          '木': '木偏旺时可用火来泄、用金来制，日常多做输出型的事，少把情绪憋在心里。',
          '火': '火偏旺时可用土来泄、用水来制，给兴奋状态安排冷却时间，避免连续熬夜。',
          '土': '土偏旺时可用金来泄、用木来制，减少反复思虑，把担心写成可执行的清单。',
          '金': '金偏旺时可用水来泄、用火来制，放松标准，给关系留一点弹性。',
          '水': '水偏旺时可用木来泄、用土来制，减少深夜反刍，把想法落到白天的小行动。'
        };
        tips.push(drain[strong]);
      }
      if (!tips.length) tips.push('五行分布较为均衡。保持规律作息与适度运动，不必刻意补某一行。');
      return tips.slice(0, 3).join(' ');
    }

    function calc() {
      var raw = qs(pane, '#wxBirth').value.trim();
      if (!raw) {
        dist.innerHTML = '<div class="ct-note ct-note-warn">输入出生年份或日期后，这里会显示五行分布与偏旺/偏缺讲解。</div>';
        return;
      }
      var m = raw.match(/^(\d{4})(?:[-/.](\d{1,2})(?:[-/.](\d{1,2}))?)?$/);
      if (!m) {
        dist.innerHTML = '<div class="ct-note ct-note-err">无法识别：请输入四位年份（如 1995）或完整日期（如 1995-06-15）。</div>';
        return;
      }
      var y = parseInt(m[1], 10), mo = m[2] ? parseInt(m[2], 10) : null, da = m[3] ? parseInt(m[3], 10) : null;
      if (mo != null && (mo < 1 || mo > 12)) { dist.innerHTML = '<div class="ct-note ct-note-err">月份需要在 1–12 之间。</div>'; return; }
      if (da != null && (da < 1 || da > 31)) { dist.innerHTML = '<div class="ct-note ct-note-err">日期需要在 1–31 之间。</div>'; return; }
      var chars = '', source = '', pillars = '';
      if (mo && da && window.Lunar) {
        try {
          var lunar = window.Lunar.fromDate(new Date(y, mo - 1, da, 12, 0, 0));
          var ygz = typeof lunar.getYearInGanZhiExact === 'function' ? lunar.getYearInGanZhiExact() : lunar.getYearInGanZhi();
          var mgz = typeof lunar.getMonthInGanZhiExact === 'function' ? lunar.getMonthInGanZhiExact() : lunar.getMonthInGanZhi();
          var dgz = typeof lunar.getDayInGanZhiExact === 'function' ? lunar.getDayInGanZhiExact() : lunar.getDayInGanZhi();
          chars = ygz + mgz + dgz;
          source = '按年、月、日三柱六字统计（未含时辰）';
          pillars = '年柱 ' + ygz + ' · 月柱 ' + mgz + ' · 日柱 ' + dgz;
        } catch (e) { chars = ''; }
      }
      if (!chars) {
        chars = manualYearGZ(y);
        source = window.Lunar ? '按年份干支粗算（完整日期解析失败）' : '农历组件未加载，按年份干支粗算';
        pillars = '年柱 ' + chars;
      }
      var counts = countWX(chars);
      var total = chars.length;
      var max = 0, min = 99, strong = '', missing = [];
      var strongMin = total >= 4 ? Math.max(2, Math.ceil(total * 0.5)) : 99;
      WX_ORDER.forEach(function (el) {
        if (counts[el] > max) max = counts[el];
        if (counts[el] < min) min = counts[el];
      });
      WX_ORDER.forEach(function (el) {
        if (counts[el] === 0) missing.push(el);
        if (counts[el] === max && max >= strongMin && !strong) strong = el;
      });
      var bars = WX_ORDER.map(function (el) {
        var pct = Math.round(counts[el] / total * 100);
        var tag = counts[el] === 0 ? '缺' : (counts[el] === max && max >= strongMin) ? '偏旺' : counts[el] === 1 ? '偏弱' : '中和';
        return '<div class="ct-wx-bar"><span class="ct-wx-bar-name">' + el + '</span><i class="ct-bar ct-bar-' + WX_DATA[el].color + '"><b style="width:' + pct + '%"></b></i><em>' + counts[el] + ' 字 · ' + tag + '</em></div>';
      }).join('');
      var summary = '本次统计 ' + total + ' 个字：' + WX_ORDER.map(function (el) { return el + ' ' + counts[el]; }).join('、') + '。';
      if (total <= 2) {
        summary += '仅有年份两字，样本很少，只能看大致倾向，不宜据此判断偏旺或偏缺。';
      } else {
        if (strong) summary += '其中' + strong + '出现最多，传统上视为偏旺；';
        else summary += '没有某一行明显压过其他行，分布相对均衡；';
        if (missing.length) summary += missing.join('、') + '未出现，称为偏缺。';
        else summary += '五行俱全，没有完全缺失的行。';
      }
      summary += '五行讲的是关系与平衡，偏旺或偏缺只是描述倾向，不等于好坏。';
      var note = source + (pillars ? '；' + pillars : '') + '。';
      var adviceText = adviceFor(counts, strong, missing);
      distPlain = '个人五行分布（' + note + '）\n' +
        WX_ORDER.map(function (el) { return el + '：' + counts[el] + ' 字'; }).join('、') + '\n' +
        summary + '\n调和建议：' + adviceText;
      lastText = wxPlain(selected, distPlain);
      dist.innerHTML =
        '<div class="ct-wx-dist-head"><b>五行分布</b><span class="ct-meta">' + esc(note) + '</span></div>' +
        '<div class="ct-wx-bars">' + bars + '</div>' +
        '<p class="ct-wx-p">' + esc(summary) + '</p>' +
        '<p class="ct-wx-p"><b>调和建议：</b>' + esc(adviceText) + '</p>' +
        '<p class="ct-note ct-note-soft">传统民俗/文化参考，不具科学依据；请勿据此做医疗、婚恋或职业决策。</p>';
    }
    qs(pane, '#wxCalc').onclick = calc;
    qs(pane, '#wxCopy').onclick = function () {
      if (!lastText) { T.toast('还没有可复制的讲解', 'err'); return; }
      copyText(lastText);
    };
    on(qs(pane, '#wxBirth'), 'keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calc(); }
    });

    var fbStat = qs(pane, '#wxFbStat');
    wxRenderStats(fbStat);
    qsa(pane, '#wxFbActions [data-fb]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-fb');
        var data = readStore(WX_FB_KEY, {});
        data[key] = (Number(data[key]) || 0) + 1;
        writeStore(WX_FB_KEY, data);
        wxRenderStats(fbStat);
        T.toast('已记录：' + key + '（仅保存在本机）');
      });
    });
    qs(pane, '#wxFbClear').onclick = function () {
      dropStore(WX_FB_KEY);
      wxRenderStats(fbStat);
      T.toast('已清空本地反馈记录');
    };
  }

  R('五行讲解', { render: renderWuxing });

  /* ============================================================
   * 三、亲戚称谓计算器
   * ------------------------------------------------------------
   * 不用穷举链式查表：先把关系词拆成 父/母/夫/妻/子/女/兄/弟/姐/妹
   * 等原始步，再在内存里搭一棵亲属关系图；称谓由「共同祖先 + 代数 +
   * 堂表判定 + 姻亲标记」推算，陌生链条也能给出可理解的结论。
   * ============================================================ */
  var KIN_TOKEN_MAP = {
    '爸爸': { steps: [['F']] }, '父亲': { steps: [['F']] }, '老爸': { steps: [['F']] }, '爹': { steps: [['F']] }, '家父': { steps: [['F']] }, '父': { steps: [['F']] },
    '妈妈': { steps: [['M']] }, '母亲': { steps: [['M']] }, '老妈': { steps: [['M']] }, '娘': { steps: [['M']] }, '家母': { steps: [['M']] }, '母': { steps: [['M']] },
    '爷爷': { steps: [['F'], ['F']] }, '祖父': { steps: [['F'], ['F']] }, '阿公': { steps: [['F'], ['F']] },
    '奶奶': { steps: [['F'], ['M']] }, '祖母': { steps: [['F'], ['M']] }, '阿婆': { steps: [['F'], ['M']] },
    '外公': { steps: [['M'], ['F']] }, '姥爷': { steps: [['M'], ['F']] }, '外祖父': { steps: [['M'], ['F']] },
    '外婆': { steps: [['M'], ['M']] }, '姥姥': { steps: [['M'], ['M']] }, '外祖母': { steps: [['M'], ['M']] },
    '曾祖父': { steps: [['F'], ['F'], ['F']] }, '太爷爷': { steps: [['F'], ['F'], ['F']] },
    '曾祖母': { steps: [['F'], ['F'], ['M']] }, '太奶奶': { steps: [['F'], ['F'], ['M']] },
    '高祖父': { steps: [['F'], ['F'], ['F'], ['F']] }, '高祖母': { steps: [['F'], ['F'], ['F'], ['M']] },
    '老公': { steps: [['H']] }, '丈夫': { steps: [['H']] }, '先生': { steps: [['H']] }, '夫': { steps: [['H']] },
    '老婆': { steps: [['W']] }, '妻子': { steps: [['W']] }, '太太': { steps: [['W']] }, '妻': { steps: [['W']] },
    '爱人': { steps: [['SP']] }, '伴侣': { steps: [['SP']] },
    '儿子': { steps: [['S']] }, '儿': { steps: [['S']] }, '崽': { steps: [['S']] },
    '女儿': { steps: [['D']] }, '闺女': { steps: [['D']] }, '女': { steps: [['D']] },
    '哥哥': { steps: [['OB']] }, '大哥': { steps: [['OB']] }, '兄长': { steps: [['OB']] }, '兄': { steps: [['OB']] },
    '弟弟': { steps: [['YB']] }, '小弟': { steps: [['YB']] }, '弟': { steps: [['YB']] },
    '姐姐': { steps: [['OS']] }, '大姐': { steps: [['OS']] }, '姐': { steps: [['OS']] },
    '妹妹': { steps: [['YS']] }, '小妹': { steps: [['YS']] }, '妹': { steps: [['YS']] },
    '兄弟': { steps: [['B']] }, '姐妹': { steps: [['Z']] },
    '孙子': { steps: [['S'], ['S']] }, '孙儿': { steps: [['S'], ['S']] },
    '孙女': { steps: [['S'], ['D']] }, '孙女儿': { steps: [['S'], ['D']] },
    '外孙': { steps: [['D'], ['S']] }, '外孙子': { steps: [['D'], ['S']] },
    '外孙女': { steps: [['D'], ['D']] }, '外孙女儿': { steps: [['D'], ['D']] },
    '曾孙': { steps: [['S'], ['S'], ['S']] }, '曾孙女': { steps: [['S'], ['S'], ['D']] },
    '外曾孙': { steps: [['D'], ['S'], ['S']] }, '外曾孙女': { steps: [['D'], ['S'], ['D']] },
    '玄孙': { steps: [['S'], ['S'], ['S'], ['S']] },
    '岳父': { steps: [['W'], ['F']] }, '丈人': { steps: [['W'], ['F']] }, '老丈人': { steps: [['W'], ['F']] }, '泰山': { steps: [['W'], ['F']] },
    '岳母': { steps: [['W'], ['M']] }, '丈母娘': { steps: [['W'], ['M']] }, '泰水': { steps: [['W'], ['M']] },
    '公公': { steps: [['H'], ['F']] }, '公爹': { steps: [['H'], ['F']] },
    '婆婆': { steps: [['H'], ['M']] }, '婆母': { steps: [['H'], ['M']] },
    '儿媳': { steps: [['S'], ['W']] }, '儿媳妇': { steps: [['S'], ['W']] },
    '女婿': { steps: [['D'], ['H']] }, '姑爷': { steps: [['D'], ['H']] },
    '嫂子': { steps: [['OB'], ['W']] }, '嫂嫂': { steps: [['OB'], ['W']] }, '大嫂': { steps: [['OB'], ['W']] },
    '弟媳': { steps: [['YB'], ['W']] }, '弟妹': { steps: [['YB'], ['W']] }, '弟媳妇': { steps: [['YB'], ['W']] },
    '姐夫': { steps: [['OS'], ['H']] }, '妹夫': { steps: [['YS'], ['H']] },
    '伯父': { steps: [['F'], ['OB']] }, '伯伯': { steps: [['F'], ['OB']] }, '大伯': { steps: [['F'], ['OB']] }, '大爷': { steps: [['F'], ['OB']] }, '伯': { steps: [['F'], ['OB']] },
    '叔父': { steps: [['F'], ['YB']] }, '叔叔': { steps: [['F'], ['YB']] }, '叔': { steps: [['F'], ['YB']] },
    '姑姑': { steps: [['F'], ['Z']] }, '姑妈': { steps: [['F'], ['Z']] }, '姑母': { steps: [['F'], ['Z']] }, '姑': { steps: [['F'], ['Z']] },
    '舅舅': { steps: [['M'], ['B']] }, '舅父': { steps: [['M'], ['B']] }, '娘舅': { steps: [['M'], ['B']] }, '舅': { steps: [['M'], ['B']] },
    '姨妈': { steps: [['M'], ['Z']] }, '姨母': { steps: [['M'], ['Z']] }, '阿姨': { steps: [['M'], ['Z']] }, '姨': { steps: [['M'], ['Z']] },
    '伯母': { steps: [['F'], ['OB'], ['W']] }, '大娘': { steps: [['F'], ['OB'], ['W']] }, '大妈': { steps: [['F'], ['OB'], ['W']] },
    '婶婶': { steps: [['F'], ['YB'], ['W']] }, '婶母': { steps: [['F'], ['YB'], ['W']] }, '婶子': { steps: [['F'], ['YB'], ['W']] }, '婶': { steps: [['F'], ['YB'], ['W']] },
    '姑父': { steps: [['F'], ['Z'], ['H']] }, '姑丈': { steps: [['F'], ['Z'], ['H']] }, '姑爹': { steps: [['F'], ['Z'], ['H']] },
    '舅妈': { steps: [['M'], ['B'], ['W']] }, '舅母': { steps: [['M'], ['B'], ['W']] }, '妗子': { steps: [['M'], ['B'], ['W']] },
    '姨父': { steps: [['M'], ['Z'], ['H']] }, '姨丈': { steps: [['M'], ['Z'], ['H']] }, '姨爹': { steps: [['M'], ['Z'], ['H']] },
    '侄子': { steps: [['B'], ['S']] }, '侄儿': { steps: [['B'], ['S']] },
    '侄女': { steps: [['B'], ['D']] }, '侄女儿': { steps: [['B'], ['D']] },
    '外甥': { steps: [['Z'], ['S']] }, '外甥女': { steps: [['Z'], ['D']] },
    '侄孙': { steps: [['B'], ['S'], ['S']] }, '侄孙女': { steps: [['B'], ['S'], ['D']] },
    '外甥孙': { steps: [['Z'], ['S'], ['S']] }, '外甥孙女': { steps: [['Z'], ['S'], ['D']] },
    '堂哥': { steps: [['F'], ['B'], ['S']], age: 'older' }, '堂兄': { steps: [['F'], ['B'], ['S']], age: 'older' },
    '堂弟': { steps: [['F'], ['B'], ['S']], age: 'younger' },
    '堂姐': { steps: [['F'], ['B'], ['D']], age: 'older' }, '堂姊': { steps: [['F'], ['B'], ['D']], age: 'older' },
    '堂妹': { steps: [['F'], ['B'], ['D']], age: 'younger' },
    '表哥': { steps: [['M'], ['Z'], ['S']], age: 'older' }, '表兄': { steps: [['M'], ['Z'], ['S']], age: 'older' },
    '表弟': { steps: [['M'], ['Z'], ['S']], age: 'younger' },
    '表姐': { steps: [['M'], ['Z'], ['D']], age: 'older' }, '表姊': { steps: [['M'], ['Z'], ['D']], age: 'older' },
    '表妹': { steps: [['M'], ['Z'], ['D']], age: 'younger' },
    '伯公': { steps: [['F'], ['F'], ['OB']] }, '伯爷爷': { steps: [['F'], ['F'], ['OB']] }, '伯祖父': { steps: [['F'], ['F'], ['OB']] },
    '叔公': { steps: [['F'], ['F'], ['YB']] }, '叔爷爷': { steps: [['F'], ['F'], ['YB']] }, '叔祖父': { steps: [['F'], ['F'], ['YB']] },
    '姑婆': { steps: [['F'], ['F'], ['Z']] }, '姑奶奶': { steps: [['F'], ['F'], ['Z']] }, '姑祖母': { steps: [['F'], ['F'], ['Z']] },
    '舅公': { steps: [['F'], ['M'], ['B']] }, '舅爷': { steps: [['F'], ['M'], ['B']] }, '舅爷爷': { steps: [['F'], ['M'], ['B']] }, '舅祖父': { steps: [['F'], ['M'], ['B']] },
    '姨婆': { steps: [['F'], ['M'], ['Z']] }, '姨奶奶': { steps: [['F'], ['M'], ['Z']] }, '姨祖母': { steps: [['F'], ['M'], ['Z']] },
    '继父': { steps: [['F']], special: 'step' }, '后爸': { steps: [['F']], special: 'step' }, '后爹': { steps: [['F']], special: 'step' },
    '继母': { steps: [['M']], special: 'step' }, '后妈': { steps: [['M']], special: 'step' }, '后娘': { steps: [['M']], special: 'step' },
    '养父': { steps: [['F']], special: 'adopt' }, '养母': { steps: [['M']], special: 'adopt' },
    '继子': { steps: [['S']], special: 'step' }, '继女': { steps: [['D']], special: 'step' },
    '养子': { steps: [['S']], special: 'adopt' }, '养女': { steps: [['D']], special: 'adopt' },
    '干爹': { steps: [['F']], special: 'god' }, '干爸': { steps: [['F']], special: 'god' }, '干妈': { steps: [['M']], special: 'god' },
    '干儿子': { steps: [['S']], special: 'god' }, '干女儿': { steps: [['D']], special: 'god' }
  };
  var KIN_TOKEN_KEYS = Object.keys(KIN_TOKEN_MAP).sort(function (a, b) { return b.length - a.length; });
  var KIN_STEP_LABEL = { F: '父（+1）', M: '母（+1）', H: '夫（0）', W: '妻（0）', SP: '配偶（0）', S: '子（-1）', D: '女（-1）', OB: '兄（0）', YB: '弟（0）', OS: '姐（0）', YS: '妹（0）', B: '兄弟（0）', Z: '姐妹（0）' };

  function KinGraph() {
    this.nodes = [];
    this.self = null;
    this.path = [];
  }
  KinGraph.prototype.node = function (gender) {
    var n = { id: this.nodes.length, gender: gender || null, father: null, mother: null, spouse: null, children: [], relAge: {}, unknownParent: null, special: null };
    this.nodes.push(n);
    return n;
  };
  KinGraph.prototype.addChild = function (p, c) {
    if (!p) return;
    if (p.children.indexOf(c) < 0) p.children.push(c);
  };
  KinGraph.prototype.linkSpouse = function (a, b) {
    if (!a || !b || a === b) return;
    a.spouse = b; b.spouse = a;
  };
  KinGraph.prototype.ensureSpouse = function (n, gender) {
    if (n.spouse) return n.spouse;
    var sp = this.node(gender);
    this.linkSpouse(n, sp);
    if (n.gender == null && n !== this.self && gender) n.gender = gender === 'M' ? 'F' : 'M';
    if (n.gender && gender) {
      var kids = n.children.slice();
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i];
        if (n.gender === 'M') { if (!c.mother) { c.mother = sp; this.addChild(sp, c); } }
        else { if (!c.father) { c.father = sp; this.addChild(sp, c); } }
      }
    }
    return sp;
  };
  KinGraph.prototype.ensureParent = function (n, gender) {
    var key = gender === 'M' ? 'father' : 'mother';
    if (n[key]) return n[key];
    var other = gender === 'M' ? n.mother : n.father;
    if (other && other.spouse) {
      var sp = other.spouse;
      if (sp.gender === gender || sp.gender == null) {
        if (sp.gender == null) sp.gender = gender;
        n[key] = sp; this.addChild(sp, n); return sp;
      }
    }
    if (n.unknownParent) {
      var up = n.unknownParent;
      if (up.gender === gender) { n[key] = up; this.addChild(up, n); return up; }
      if (up.gender != null) {
        var sp2 = this.ensureSpouse(up, gender);
        n[key] = sp2; this.addChild(sp2, n); return sp2;
      }
      if (up === this.self) {
        var sp3 = this.ensureSpouse(up, gender);
        n[key] = sp3; this.addChild(sp3, n); return sp3;
      }
      up.gender = gender === 'M' ? 'F' : 'M';
    }
    var p = this.node(gender);
    n[key] = p; this.addChild(p, n);
    if (other) this.linkSpouse(p, other);
    return p;
  };
  KinGraph.prototype.ensureChild = function (n, gender) {
    var i, candidates = [];
    for (i = 0; i < n.children.length; i++) {
      var c = n.children[i];
      if (c.gender !== gender) continue;
      if (c === this.self) continue;
      candidates.push(c);
    }
    var chosen = null;
    for (i = candidates.length - 1; i >= 0; i--) {
      if (this.path.indexOf(candidates[i]) >= 0) { chosen = candidates[i]; break; }
    }
    if (!chosen && candidates.length) chosen = candidates[candidates.length - 1];
    if (chosen) {
      if (n.children.indexOf(this.self) >= 0 && this.self.gender === gender) this.ambiguousSelf = true;
      if (this.path.indexOf(chosen) >= 0 && chosen !== n) this.ambiguousAncestor = chosen;
      return chosen;
    }
    var child = this.node(gender);
    if (n.gender === 'M') {
      child.father = n; this.addChild(n, child);
      if (n.spouse) { child.mother = n.spouse; this.addChild(n.spouse, child); }
    } else if (n.gender === 'F') {
      child.mother = n; this.addChild(n, child);
      if (n.spouse) { child.father = n.spouse; this.addChild(n.spouse, child); }
    } else {
      child.unknownParent = n; this.addChild(n, child);
    }
    return child;
  };
  KinGraph.prototype.ensureSibling = function (n, gender, age) {
    var f = this.ensureParent(n, 'M');
    var i, sib = null;
    for (i = 0; i < f.children.length; i++) {
      var c = f.children[i];
      if (c !== n && c.gender === gender) { sib = c; break; }
    }
    if (!sib) {
      sib = this.node(gender);
      sib.father = f; this.addChild(f, sib);
      if (n.mother) { sib.mother = n.mother; this.addChild(n.mother, sib); }
    }
    if (age) {
      n.relAge[sib.id] = age;
      sib.relAge[n.id] = age === 'older' ? 'younger' : 'older';
    }
    return sib;
  };

  function kinTokenize(chain) {
    var raw = String(chain == null ? '' : chain).trim();
    if (!raw) return { steps: [], tokens: [], error: null };
    var segs = raw.split(/的|之/);
    var steps = [], tokens = [], error = null;
    for (var si = 0; si < segs.length; si++) {
      var seg = segs[si].replace(/[\s,，、。；;]+/g, '');
      if (!seg) continue;
      if (/^(我|自己|本人|咱|俺)$/.test(seg)) { tokens.push({ text: seg, steps: [], special: null }); continue; }
      var pos = 0, found = [];
      while (pos < seg.length) {
        var matched = null;
        for (var k = 0; k < KIN_TOKEN_KEYS.length; k++) {
          var key = KIN_TOKEN_KEYS[k];
          if (seg.substr(pos, key.length) === key) { matched = key; break; }
        }
        if (!matched) { error = { token: seg.slice(pos), segment: seg, index: si + 1 }; break; }
        var def = KIN_TOKEN_MAP[matched];
        for (var s = 0; s < def.steps.length; s++) {
          steps.push({ type: def.steps[s][0], special: def.special || null, token: matched });
        }
        found.push({ text: matched, steps: def.steps, special: def.special || null, age: def.age || null });
        pos += matched.length;
      }
      if (error) break;
      tokens = tokens.concat(found);
    }
    return { steps: steps, tokens: tokens, error: error };
  }

  function kinBuild(steps, selfGender, tokens) {
    var g = new KinGraph();
    g.self = g.node(selfGender || null);
    g.path = [g.self];
    var cur = g.self;
    for (var i = 0; i < steps.length; i++) {
      var t = steps[i].type;
      if (t === 'F') cur = g.ensureParent(cur, 'M');
      else if (t === 'M') cur = g.ensureParent(cur, 'F');
      else if (t === 'H') cur = g.ensureSpouse(cur, 'M');
      else if (t === 'W') cur = g.ensureSpouse(cur, 'F');
      else if (t === 'SP') cur = g.ensureSpouse(cur, null);
      else if (t === 'S') cur = g.ensureChild(cur, 'M');
      else if (t === 'D') cur = g.ensureChild(cur, 'F');
      else if (t === 'OB') cur = g.ensureSibling(cur, 'M', 'older');
      else if (t === 'YB') cur = g.ensureSibling(cur, 'M', 'younger');
      else if (t === 'OS') cur = g.ensureSibling(cur, 'F', 'older');
      else if (t === 'YS') cur = g.ensureSibling(cur, 'F', 'younger');
      else if (t === 'B') cur = g.ensureSibling(cur, 'M', null);
      else if (t === 'Z') cur = g.ensureSibling(cur, 'F', null);
      if (steps[i].special && !cur.special) cur.special = steps[i].special;
      g.path.push(cur);
    }
    if (tokens && tokens.length) {
      for (var k = 0; k < tokens.length; k++) {
        if (k !== tokens.length - 1 || !tokens[k].age) continue;
        if (g.self.relAge[cur.id] == null) {
          g.self.relAge[cur.id] = tokens[k].age;
          cur.relAge[g.self.id] = tokens[k].age === 'older' ? 'younger' : 'older';
        }
      }
    }
    return { graph: g, target: cur };
  }

  function kinBFS(from, to) {
    var q = [from], seen = {}, prev = {};
    seen[from.id] = true;
    while (q.length) {
      var cur = q.shift();
      if (cur === to) break;
      var edges = [];
      if (cur.father) edges.push([cur.father, 'F']);
      if (cur.mother) edges.push([cur.mother, 'M']);
      if (cur.spouse) edges.push([cur.spouse, cur.spouse.gender === 'M' ? 'H' : cur.spouse.gender === 'F' ? 'W' : 'X']);
      for (var i = 0; i < cur.children.length; i++) {
        var c = cur.children[i];
        edges.push([c, c.gender === 'M' ? 'S' : c.gender === 'F' ? 'D' : 'C']);
      }
      if (cur.unknownParent) edges.push([cur.unknownParent, 'U']);
      for (var e = 0; e < edges.length; e++) {
        var n = edges[e][0];
        if (seen[n.id]) continue;
        seen[n.id] = true;
        prev[n.id] = { node: cur, label: edges[e][1] };
        q.push(n);
      }
    }
    if (!seen[to.id]) return null;
    var steps = [], cur2 = to;
    while (cur2 !== from) {
      var p = prev[cur2.id];
      steps.unshift({ from: p.node, to: cur2, label: p.label });
      cur2 = p.node;
    }
    return steps;
  }

  function KT(formal, oral, dialect, note) { return { formal: formal, oral: oral, dialect: dialect || [], note: note || '' }; }
  function kinTermG(gender, male, female, unknown) {
    if (gender === 'M') return male;
    if (gender === 'F') return female;
    return unknown || KT(male.formal + '/' + female.formal, male.oral + '/' + female.oral, male.dialect.concat(female.dialect), '对方性别未指定，两种称呼并列。');
  }
  function kinAncestorTerm(depth, labels, gender) {
    if (depth === 1) return kinTermG(gender, KT('父亲', '爸爸', ['爹', '老爸']), KT('母亲', '妈妈', ['娘', '老妈']));
    if (depth === 2) {
      var key = labels.join('');
      if (key === 'FF') return KT('祖父', '爷爷', ['阿公']);
      if (key === 'FM') return KT('祖母', '奶奶', ['阿婆']);
      if (key === 'MF') return KT('外祖父', '外公', ['姥爷']);
      if (key === 'MM') return KT('外祖母', '外婆', ['姥姥']);
    }
    if (depth === 3) {
      var hasM = labels.indexOf('M') >= 0;
      return kinTermG(gender,
        KT(hasM ? '外曾祖父' : '曾祖父', hasM ? '外太爷爷' : '太爷爷', ['太公']),
        KT(hasM ? '外曾祖母' : '曾祖母', hasM ? '外太奶奶' : '太奶奶', ['太婆']));
    }
    if (depth === 4) {
      var hasM2 = labels.indexOf('M') >= 0;
      return kinTermG(gender,
        KT(hasM2 ? '外高祖父' : '高祖父', hasM2 ? '外高祖' : '高祖'),
        KT(hasM2 ? '外高祖母' : '高祖母', hasM2 ? '外高祖母' : '高祖母'));
    }
    return KT('第 ' + depth + ' 代祖先', '祖辈', [], '超出常用称谓范围。');
  }
  function kinDescendantTerm(depth, labels, gender) {
    var wai = labels[0] === 'D';
    if (depth === 1) return kinTermG(gender, KT('儿子', '儿子', ['儿']), KT('女儿', '女儿', ['闺女']));
    if (depth === 2) return kinTermG(gender, KT(wai ? '外孙' : '孙子', wai ? '外孙' : '孙儿'), KT(wai ? '外孙女' : '孙女', wai ? '外孙女' : '孙女'));
    if (depth === 3) return kinTermG(gender, KT(wai ? '外曾孙' : '曾孙', wai ? '外曾孙' : '曾孙'), KT(wai ? '外曾孙女' : '曾孙女', wai ? '外曾孙女' : '曾孙女'));
    if (depth === 4) return kinTermG(gender, KT(wai ? '外玄孙' : '玄孙', wai ? '外玄孙' : '玄孙'), KT(wai ? '外玄孙女' : '玄孙女', wai ? '外玄孙女' : '玄孙女'));
    return KT('第 ' + depth + ' 代后代', '后代', [], '超出常用称谓范围。');
  }
  function kinSiblingTerm(gender, age, prefix) {
    prefix = prefix || '';
    var f, o;
    if (gender === 'M') {
      if (age === 'older') { f = prefix + '兄'; o = prefix + '哥'; }
      else if (age === 'younger') { f = prefix + '弟'; o = prefix + '弟'; }
      else { f = prefix + '兄弟'; o = prefix + '兄弟'; }
    } else if (gender === 'F') {
      if (age === 'older') { f = prefix + '姐'; o = prefix + '姐'; }
      else if (age === 'younger') { f = prefix + '妹'; o = prefix + '妹'; }
      else { f = prefix + '姐妹'; o = prefix + '姐妹'; }
    } else {
      return KT(prefix + '兄弟姐妹', prefix + '兄弟姐妹', [], '对方性别未指定。');
    }
    var note = '';
    if (prefix === '堂') note = '父之兄弟的子女称堂，同姓同宗。';
    else if (prefix === '表') note = '父之姐妹、母之兄弟、母之姐妹的子女称表。';
    else if (!age) note = '未给出长幼，按年龄称哥哥/弟弟或姐姐/妹妹。';
    return KT(f, o, [], note);
  }
  function kinUncleTerm(side, gender, age) {
    if (side === 'paternal') {
      if (gender === 'M') {
        if (age === 'older') return KT('伯父', '伯伯', ['大伯', '大爷']);
        if (age === 'younger') return KT('叔父', '叔叔', ['叔']);
        return KT('伯父或叔父', '伯伯/叔叔', ['大伯/叔叔'], '父之兄弟，按长幼分伯父与叔父。');
      }
      return KT('姑母', '姑姑', ['姑妈', '娘娘']);
    }
    if (gender === 'M') return KT('舅父', '舅舅', ['娘舅', '舅']);
    if (age === 'older') return KT('姨母', '姨妈', ['大姨']);
    if (age === 'younger') return KT('姨母', '小姨', ['姨姨']);
    return KT('姨母', '姨妈', ['姨母', '阿姨']);
  }
  function kinNephewTerm(viaGender, gender, depth) {
    if (depth === 2) {
      if (viaGender === 'M') return kinTermG(gender, KT('侄子', '侄子', ['侄儿']), KT('侄女', '侄女', ['侄女儿']));
      if (viaGender === 'F') return kinTermG(gender, KT('外甥', '外甥', []), KT('外甥女', '外甥女', []));
      return KT('侄/甥', '侄子或外甥', [], '兄弟姐妹的子女，按兄弟姐妹性别分侄与甥。');
    }
    if (depth === 3) {
      if (viaGender === 'M') return kinTermG(gender, KT('侄孙', '侄孙', ['侄孙子']), KT('侄孙女', '侄孙女', []));
      if (viaGender === 'F') return kinTermG(gender, KT('外甥孙', '外甥孙', ['甥孙']), KT('外甥孙女', '外甥孙女', []));
      return KT('侄孙/甥孙', '侄孙或外甥孙', [], '兄弟姐妹的孙辈。');
    }
    var label = viaGender === 'M' ? '侄' : viaGender === 'F' ? '外甥' : '侄/甥';
    return kinTermG(gender, KT(label + '曾孙', label + '曾孙'), KT(label + '曾孙女', label + '曾孙女'), KT(label + '后代', label + '后代'));
  }
  function kinGrandUncleTerm(line2, refGender, gender, age) {
    var maternal = line2.charAt(0) === 'M';
    var prefix = maternal ? '外' : '';
    if (refGender === 'M') {
      if (gender === 'M') {
        if (age === 'older') return KT(prefix + '伯祖父', prefix + '伯公', [prefix + '伯爷爷']);
        if (age === 'younger') return KT(prefix + '叔祖父', prefix + '叔公', [prefix + '叔爷爷']);
        return KT(prefix + '伯祖父或叔祖父', prefix + '伯公/叔公', [prefix + '伯爷爷/叔爷爷'], '祖父的兄弟，按长幼分伯公与叔公。');
      }
      return KT(prefix + '姑祖母', prefix + '姑婆', [prefix + '姑奶奶']);
    }
    if (gender === 'M') return KT(prefix + '舅祖父', prefix + '舅公', [prefix + '舅爷']);
    return KT(prefix + '姨祖母', prefix + '姨婆', [prefix + '姨奶奶']);
  }
  function kinCousinPrefix(firstUp, sibGender) { return (firstUp === 'F' && sibGender === 'M') ? '堂' : '表'; }

  function kinClassifyConsanguineal(from, steps) {
    var to = steps.length ? steps[steps.length - 1].to : from;
    var i, firstDown = -1;
    for (i = 0; i < steps.length; i++) {
      if (steps[i].label === 'S' || steps[i].label === 'D' || steps[i].label === 'C') { firstDown = i; break; }
    }
    var upCount = firstDown < 0 ? steps.length : firstDown;
    var downCount = firstDown < 0 ? 0 : steps.length - firstDown;
    var labels = [];
    for (i = 0; i < upCount; i++) labels.push(steps[i].label === 'F' ? 'F' : steps[i].label === 'M' ? 'M' : 'U');
    var downLabels = [];
    for (i = firstDown; i >= 0 && i < steps.length; i++) downLabels.push(steps[i].label);
    var lastLabel = steps.length ? steps[steps.length - 1].label : '';
    var targetGender = lastLabel === 'F' || lastLabel === 'M' ? (lastLabel === 'F' ? 'M' : 'F') : lastLabel === 'S' ? 'M' : lastLabel === 'D' ? 'F' : null;
    if (downCount === 0) {
      var anc = kinAncestorTerm(steps.length, labels, targetGender);
      anc.gen = steps.length; anc.affinity = false; anc.kind = '直系';
      return anc;
    }
    if (upCount === 0) {
      var desc = kinDescendantTerm(steps.length, downLabels, targetGender);
      desc.gen = -steps.length; desc.affinity = false; desc.kind = '直系';
      return desc;
    }
    var R = from;
    for (i = 0; i < upCount - 1; i++) R = steps[i].to;
    var B = steps[firstDown].to;
    var firstUp = steps[0].label;
    var age = R.relAge[B.id] || null;
    var res = null;
    if (upCount === 1) {
      if (downCount === 1) res = kinSiblingTerm(B.gender, age, '');
      else if (downCount === 2) res = kinNephewTerm(B.gender, targetGender, 2);
      else if (downCount === 3) res = kinNephewTerm(B.gender, targetGender, 3);
      else res = kinNephewTerm(B.gender, targetGender, downCount);
    } else if (upCount === 2) {
      var side = firstUp === 'F' ? 'paternal' : 'maternal';
      if (downCount === 1) res = kinUncleTerm(side, B.gender, age);
      else if (downCount === 2) res = kinSiblingTerm(targetGender, from.relAge[to.id] || null, kinCousinPrefix(firstUp, B.gender));
      else if (downCount === 3) {
        var pref = kinCousinPrefix(firstUp, B.gender);
        res = kinTermG(targetGender, KT(pref + '侄', pref + '侄子'), KT(pref + '侄女', pref + '侄女'));
      } else {
        var pref2 = kinCousinPrefix(firstUp, B.gender);
        res = kinTermG(targetGender, KT(pref2 + '侄孙', pref2 + '侄孙'), KT(pref2 + '侄孙女', pref2 + '侄孙女'));
      }
    } else if (upCount === 3) {
      var line2 = labels.slice(0, 2).join('');
      var refGender = labels[1] === 'M' ? 'F' : labels[1] === 'F' ? 'M' : null;
      if (downCount === 1) res = kinGrandUncleTerm(line2, refGender, B.gender, age);
      else if (downCount === 2) res = KT('父辈的堂/表亲', '堂伯/堂叔/堂姑/表舅/表姨', [], '祖辈旁系分支的子女，各地称呼差异较大。');
      else res = KT('祖辈旁系的 ' + (downCount - 1) + ' 代后代', '远房亲戚', [], '超出常用称谓范围，可按路径理解。');
    } else {
      var refGender2 = labels[upCount - 2] === 'M' ? 'F' : labels[upCount - 2] === 'F' ? 'M' : null;
      if (downCount === 1) {
        var prefix = (firstUp === 'M' ? '外' : '') + '曾';
        if (refGender2 === 'M') {
          if (B.gender === 'M') res = KT(prefix + (age === 'older' ? '伯祖父' : age === 'younger' ? '叔祖父' : '伯祖父或叔祖父'), prefix + (age === 'older' ? '伯公' : age === 'younger' ? '叔公' : '伯公/叔公'));
          else res = KT(prefix + '姑祖母', prefix + '姑婆', [prefix + '姑奶奶']);
        } else {
          if (B.gender === 'M') res = KT(prefix + '舅祖父', prefix + '舅公', [prefix + '舅爷']);
          else res = KT(prefix + '姨祖母', prefix + '姨婆', [prefix + '姨奶奶']);
        }
      } else res = KT('第 ' + (upCount - 1) + ' 代祖辈的旁系后代', '远房亲戚', [], '超出常用称谓范围，可按路径理解。');
    }
    if (!res) res = KT('旁系亲属', '远房亲戚', [], '');
    res.gen = upCount - downCount; res.affinity = false; res.kind = '旁系';
    return res;
  }

  function kinIsParentOf(p, c) { return !!p && !!c && (c.father === p || c.mother === p || c.unknownParent === p); }
  function kinParentsOf(n) {
    var out = [];
    if (!n) return out;
    if (n.father) out.push(n.father);
    if (n.mother) out.push(n.mother);
    if (n.unknownParent && out.indexOf(n.unknownParent) < 0) out.push(n.unknownParent);
    return out;
  }
  function kinSiblingsOf(n) {
    var out = [], i, j;
    var ps = [n.father, n.mother, n.unknownParent];
    for (i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (!p) continue;
      for (j = 0; j < p.children.length; j++) {
        var c = p.children[j];
        if (c !== n && out.indexOf(c) < 0) out.push(c);
      }
    }
    return out;
  }
  function kinIsSiblingOf(a, b) { return kinSiblingsOf(a).indexOf(b) >= 0; }
  function kinChildOfWith(a, target) { return a && target && a.children.indexOf(target) >= 0 ? target : null; }
  function kinSiblingOfWith(a, target) { return a && target && kinSiblingsOf(a).indexOf(target) >= 0 ? target : null; }
  function kinGrandchildOfWith(a, targetSpouse) {
    if (!a || !targetSpouse) return null;
    for (var i = 0; i < a.children.length; i++) {
      var c = a.children[i];
      for (var j = 0; j < c.children.length; j++) if (c.children[j] === targetSpouse) return targetSpouse;
    }
    return null;
  }
  function kinGrandchildLine(a, g) {
    for (var i = 0; i < a.children.length; i++) {
      var c = a.children[i];
      for (var j = 0; j < c.children.length; j++) if (c.children[j] === g) return c.gender === 'M' ? 'son' : c.gender === 'F' ? 'daughter' : 'unknown';
    }
    return 'unknown';
  }
  function kinSpouseTerm(gender) {
    return kinTermG(gender, KT('丈夫', '老公', ['先生', '夫']), KT('妻子', '老婆', ['太太', '夫人']));
  }
  function kinInLawParentTerm(spouse, to) {
    var sg = spouse.gender;
    if (sg === 'F') return kinTermG(to.gender, KT('岳父', '岳父', ['丈人', '老丈人', '泰山']), KT('岳母', '岳母', ['丈母娘', '泰水']));
    if (sg === 'M') return kinTermG(to.gender, KT('公公', '公公', ['老爷子']), KT('婆婆', '婆婆', ['老太太']));
    return KT('岳父/公公', '配偶的父亲', ['丈人/公公'], '配偶性别未指定，两种称呼并列。');
  }
  function kinInLawSiblingTerm(spouse, to) {
    var sg = spouse.gender;
    var age = spouse.relAge[to.id] || null;
    if (sg === 'F') {
      if (to.gender === 'M') {
        if (age === 'older') return KT('内兄', '大舅子', ['大舅哥']);
        if (age === 'younger') return KT('内弟', '小舅子', []);
        return KT('内兄弟', '舅子', ['大舅子/小舅子'], '妻子的兄弟，按长幼分内兄与内弟。');
      }
      if (age === 'older') return KT('姨姐', '大姨子', ['大姨姐']);
      if (age === 'younger') return KT('姨妹', '小姨子', []);
      return KT('姨姐妹', '姨子', ['大姨子/小姨子'], '妻子的姐妹，按长幼分姨姐与姨妹。');
    }
    if (sg === 'M') {
      if (to.gender === 'M') {
        if (age === 'older') return KT('夫兄', '大伯子', ['大伯哥']);
        if (age === 'younger') return KT('夫弟', '小叔子', []);
        return KT('夫兄弟', '伯子/叔子', ['大伯子/小叔子'], '丈夫的兄弟，按长幼分大伯子与小叔子。');
      }
      if (age === 'older') return KT('夫姐', '大姑子', ['大姑姐']);
      if (age === 'younger') return KT('夫妹', '小姑子', []);
      return KT('夫姐妹', '姑子', ['大姑子/小姑子'], '丈夫的姐妹，按长幼分大姑子与小姑子。');
    }
    return KT('配偶的兄弟/姐妹', '姻亲', ['内兄弟/叔伯'], '配偶性别未指定。');
  }
  function kinInLawGrandparentTerm(spouse, to) {
    var sg = spouse.gender;
    if (sg === 'F') return kinTermG(to.gender, KT('岳祖父', '岳祖父', ['太岳父']), KT('岳祖母', '岳祖母', ['太岳母']));
    if (sg === 'M') return kinTermG(to.gender, KT('祖公公', '祖公公', []), KT('祖婆婆', '祖婆婆', []));
    return KT('配偶的祖父/祖母', '姻亲祖辈', [], '配偶性别未指定。');
  }
  function kinChildInLawTerm(child) {
    if (child.gender === 'M') return KT('儿媳', '儿媳妇', ['媳妇儿']);
    if (child.gender === 'F') return KT('女婿', '女婿', ['姑爷']);
    return KT('儿媳/女婿', '子女的配偶', [], '子女性别未指定。');
  }
  function kinGrandchildInLawTerm(from, g) {
    var wai = kinGrandchildLine(from, g) === 'daughter';
    if (g.gender === 'F') return KT(wai ? '外孙女婿' : '孙女婿', wai ? '外孙女婿' : '孙女婿', []);
    if (g.gender === 'M') return KT(wai ? '外孙媳妇' : '孙媳妇', wai ? '外孙媳妇' : '孙媳妇', []);
    return KT('孙辈的配偶', '孙辈配偶', [], '');
  }
  function kinNephewInLawTerm(from, n) {
    var sibs = kinSiblingsOf(from), sib = null;
    for (var i = 0; i < sibs.length; i++) {
      if (kinIsParentOf(sibs[i], n)) { sib = sibs[i]; break; }
    }
    var via = sib ? sib.gender : null;
    if (n.gender === 'M') {
      if (via === 'M') return KT('侄媳妇', '侄媳妇', []);
      if (via === 'F') return KT('外甥媳妇', '外甥媳妇', []);
      return KT('侄/甥的配偶', '侄子或外甥的妻子', [], '');
    }
    if (via === 'M') return KT('侄女婿', '侄女婿', []);
    if (via === 'F') return KT('外甥女婿', '外甥女婿', []);
    return KT('侄/甥的配偶', '侄女或外甥女的丈夫', [], '');
  }
  function kinSpouseSiblingChildTerm(spouse, spSib, to) {
    var sg = spouse.gender;
    if (sg === 'F') {
      if (spSib.gender === 'M') return kinTermG(to.gender, KT('内侄', '内侄', ['妻侄']), KT('内侄女', '内侄女', ['妻侄女']));
      return kinTermG(to.gender, KT('姨甥', '姨甥', ['妻甥']), KT('姨甥女', '姨甥女', ['妻甥女']));
    }
    if (sg === 'M') {
      if (spSib.gender === 'M') return kinTermG(to.gender, KT('侄子', '侄子', []), KT('侄女', '侄女', []));
      return kinTermG(to.gender, KT('外甥', '外甥', []), KT('外甥女', '外甥女', []));
    }
    return kinTermG(to.gender, KT('配偶的侄子/外甥', '姻亲侄辈', []), KT('配偶的侄女/外甥女', '姻亲侄女', []));
  }
  function kinSiblingInLawTerm(from, sib) {
    var age = from.relAge[sib.id] || null;
    if (sib.gender === 'M') {
      if (age === 'older') return KT('嫂子', '嫂子', ['嫂嫂', '大嫂']);
      if (age === 'younger') return KT('弟媳', '弟媳', ['弟妹']);
      return KT('嫂子/弟媳', '嫂子或弟媳');
    }
    if (sib.gender === 'F') {
      if (age === 'older') return KT('姐夫', '姐夫', []);
      if (age === 'younger') return KT('妹夫', '妹夫', []);
      return KT('姐夫/妹夫', '姐夫或妹夫');
    }
    return KT('兄弟姐妹的配偶', '姻亲', []);
  }
  function kinClassifyAffinal(from, to) {
    var sp = from.spouse, i, j;
    if (sp === to) return { rel: kinSpouseTerm(to.gender), kind: '姻亲' };
    if (sp && kinParentsOf(sp).indexOf(to) >= 0) return { rel: kinInLawParentTerm(sp, to), kind: '姻亲' };
    if (sp && kinIsSiblingOf(sp, to)) return { rel: kinInLawSiblingTerm(sp, to), kind: '姻亲' };
    if (sp) {
      var spParents = kinParentsOf(sp);
      for (i = 0; i < spParents.length; i++) {
        var gps = kinParentsOf(spParents[i]);
        for (j = 0; j < gps.length; j++) if (to === gps[j]) return { rel: kinInLawGrandparentTerm(sp, to), kind: '姻亲' };
      }
    }
    if (to.spouse) {
      var sib = kinSiblingOfWith(from, to.spouse);
      if (sib) return { rel: kinSiblingInLawTerm(from, sib), kind: '姻亲' };
      var ch = kinChildOfWith(from, to.spouse);
      if (ch) return { rel: kinChildInLawTerm(ch), kind: '姻亲' };
      var g = kinGrandchildOfWith(from, to.spouse);
      if (g) return { rel: kinGrandchildInLawTerm(from, g), kind: '姻亲' };
      var sibs = kinSiblingsOf(from);
      for (i = 0; i < sibs.length; i++) {
        for (j = 0; j < sibs[i].children.length; j++) {
          if (sibs[i].children[j] === to.spouse) return { rel: kinNephewInLawTerm(from, to.spouse), kind: '姻亲' };
        }
      }
    }
    if (sp) {
      if (to.spouse && kinIsSiblingOf(sp, to.spouse)) {
        var sib2 = to.spouse;
        var age2 = sp.relAge[sib2.id] || null;
        if (from.gender === 'F' && sp.gender === 'M' && sib2.gender === 'F') {
          if (age2 === 'older') return { rel: KT('姐夫', '姐夫', [], '丈夫的姐姐的丈夫，随丈夫称呼。'), kind: '姻亲' };
          if (age2 === 'younger') return { rel: KT('妹夫', '妹夫', [], '丈夫的妹妹的丈夫，随丈夫称呼。'), kind: '姻亲' };
          return { rel: KT('姐夫/妹夫', '姐夫或妹夫', [], '丈夫的姐妹的丈夫，随丈夫称呼。'), kind: '姻亲' };
        }
        if (from.gender === 'F' && sp.gender === 'M' && sib2.gender === 'M') return { rel: KT('妯娌', '妯娌', ['嫂子/弟媳'], '丈夫的兄弟的妻子，彼此称妯娌。'), kind: '姻亲' };
        if (from.gender === 'M' && sp.gender === 'F' && sib2.gender === 'F') return { rel: KT('连襟', '连襟', ['襟兄弟'], '妻子的姐妹的丈夫，彼此称连襟。'), kind: '姻亲' };
      }
      var spSibs = kinSiblingsOf(sp);
      for (i = 0; i < spSibs.length; i++) {
        if (kinIsParentOf(spSibs[i], to)) return { rel: kinSpouseSiblingChildTerm(sp, spSibs[i], to), kind: '姻亲' };
      }
      var spP = [sp.father, sp.mother];
      for (i = 0; i < spP.length; i++) {
        var p = spP[i];
        if (p && kinIsSiblingOf(p, to)) {
          var base = kinUncleTerm(p.gender === 'M' ? 'paternal' : 'maternal', to.gender, p.relAge[to.id] || null);
          if (sp.gender === 'F') return { rel: KT('岳' + base.formal, '岳' + base.oral, base.dialect.map(function (x) { return '岳' + x; }), '妻子的' + base.oral + '，姻亲称谓。'), kind: '姻亲' };
          return { rel: KT('丈夫的' + base.formal, '丈夫的' + base.oral, base.dialect, '随丈夫称呼，姻亲关系。'), kind: '姻亲' };
        }
      }
    }
    if (to.spouse) {
      // 对方的配偶是自己父母的兄弟姐妹：姑父 / 姨父 / 舅妈 / 伯母 / 婶婶
      var fromParents = [from.father, from.mother];
      for (i = 0; i < fromParents.length; i++) {
        var fp = fromParents[i];
        if (!fp || !kinIsSiblingOf(fp, to.spouse)) continue;
        var ss = to.spouse;
        var sAge = fp.relAge[ss.id] || null;
        if (fp === from.father) {
          if (ss.gender === 'M') {
            if (sAge === 'older') return { rel: KT('伯母', '伯母', ['大娘', '大妈'], '父亲的哥哥的妻子。'), kind: '姻亲' };
            if (sAge === 'younger') return { rel: KT('婶婶', '婶婶', ['婶子'], '父亲的弟弟的妻子。'), kind: '姻亲' };
            return { rel: KT('伯母/婶婶', '伯母或婶婶', [], '父亲的兄弟的妻子，按长幼分。'), kind: '姻亲' };
          }
          return { rel: KT('姑父', '姑父', ['姑丈', '姑爹'], '父亲的姐妹的丈夫。'), kind: '姻亲' };
        }
        if (ss.gender === 'M') return { rel: KT('舅妈', '舅妈', ['舅母', '妗子'], '母亲的兄弟的妻子。'), kind: '姻亲' };
        return { rel: KT('姨父', '姨父', ['姨丈', '姨爹'], '母亲的姐妹的丈夫。'), kind: '姻亲' };
      }
      if (to.spouse === from.father || to.spouse === from.mother) {
        return { rel: KT(to.gender === 'M' ? '继父' : '继母', to.gender === 'M' ? '继父' : '继母', ['后爸/后妈'], '父母的再婚配偶，按继亲关系处理。'), kind: '姻亲' };
      }
      if (sp && to.spouse === sp) return { rel: to.gender === 'M' ? KT('继子', '继子', []) : KT('继女', '继女', []), kind: '姻亲' };
    }
    return null;
  }
  function kinApplySpecial(rel, to) {
    if (!rel || !to || !to.special) return rel;
    var s = to.special;
    var table = {
      step: { '父亲': ['继父', '继父', ['后爸']], '母亲': ['继母', '继母', ['后妈']], '儿子': ['继子', '继子', []], '女儿': ['继女', '继女', []] },
      adopt: { '父亲': ['养父', '养父', []], '母亲': ['养母', '养母', []], '儿子': ['养子', '养子', []], '女儿': ['养女', '养女', []] },
      god: { '父亲': ['干爹', '干爹', ['干爸']], '母亲': ['干妈', '干妈', []], '儿子': ['干儿子', '干儿子', []], '女儿': ['干女儿', '干女儿', []] }
    };
    var row = table[s] && table[s][rel.formal];
    if (row) {
      var out = KT(row[0], row[1], row[2], '按' + (s === 'step' ? '继亲' : s === 'adopt' ? '养亲' : '干亲') + '关系标注，法律与民俗口径可能不同。');
      out.gen = rel.gen; out.kind = s === 'step' ? '继亲' : s === 'adopt' ? '养亲' : '干亲'; out.affinity = rel.affinity;
      return out;
    }
    rel.note = (rel.note ? rel.note + ' ' : '') + '含' + (s === 'step' ? '继亲' : s === 'adopt' ? '养亲' : '干亲') + '关系。';
    return rel;
  }
  function kinApplySpecialFrom(rel, from, to) {
    if (!rel || !from || !from.special) return rel;
    var s = from.special;
    var label = s === 'step' ? '继亲' : s === 'adopt' ? '养亲' : '干亲';
    if (kinIsParentOf(from, to) && (rel.formal === '儿子' || rel.formal === '女儿')) {
      var childTerms = { step: ['继子', '继女'], adopt: ['养子', '养女'], god: ['干儿子', '干女儿'] };
      var ct = childTerms[s];
      if (ct) {
        var out = KT(rel.formal === '儿子' ? ct[0] : ct[1], rel.formal === '儿子' ? ct[0] : ct[1], [], '对方为' + label + '关系，按社会关系标注。');
        out.gen = rel.gen; out.kind = s === 'step' ? '继亲' : s === 'adopt' ? '养亲' : '干亲'; out.affinity = rel.affinity;
        return out;
      }
    }
    if (kinIsParentOf(to, from) && (rel.formal === '父亲' || rel.formal === '母亲')) {
      var parentTerms = { step: ['继父', '继母'], adopt: ['养父', '养母'], god: ['干爹', '干妈'] };
      var pt = parentTerms[s];
      if (pt) {
        var out2 = KT(rel.formal === '父亲' ? pt[0] : pt[1], rel.formal === '父亲' ? pt[0] : pt[1], [], '对方为' + label + '关系，按社会关系标注。');
        out2.gen = rel.gen; out2.kind = s === 'step' ? '继亲' : s === 'adopt' ? '养亲' : '干亲'; out2.affinity = rel.affinity;
        return out2;
      }
    }
    rel.note = (rel.note ? rel.note + ' ' : '') + '含' + label + '关系。';
    return rel;
  }
  function kinClassify(from, to) {
    if (from === to) return { rel: KT('本人', '本人', [], '关系链推算回到本人。'), gen: 0, affinity: false, kind: '本人' };
    var steps = kinBFS(from, to);
    if (!steps) return { rel: KT('无法识别', '无直接亲缘关系', [], '关系图中两点不连通。'), gen: null, affinity: false, kind: '未知' };
    var hasSpouse = false, i;
    for (i = 0; i < steps.length; i++) {
      if (steps[i].label === 'H' || steps[i].label === 'W' || steps[i].label === 'X') { hasSpouse = true; break; }
    }
    var gen = 0;
    for (i = 0; i < steps.length; i++) {
      var l = steps[i].label;
      if (l === 'F' || l === 'M' || l === 'U') gen++;
      else if (l === 'S' || l === 'D' || l === 'C') gen--;
    }
    if (hasSpouse) {
      var af = kinClassifyAffinal(from, to);
      if (af) {
        af.gen = gen; af.affinity = true;
        af.rel = kinApplySpecial(af.rel, to);
        af.rel = kinApplySpecialFrom(af.rel, from, to);
        return af;
      }
      var fb = KT('姻亲', '关系较远的姻亲', [], '未匹配到常用称谓，可按关系路径理解。');
      fb = kinApplySpecial(fb, to);
      fb = kinApplySpecialFrom(fb, from, to);
      return { rel: fb, gen: gen, affinity: true, kind: '姻亲' };
    }
    var con = kinClassifyConsanguineal(from, steps);
    con.affinity = false;
    con = kinApplySpecial(con, to);
    con = kinApplySpecialFrom(con, from, to);
    return { rel: con, gen: con.gen, affinity: false, kind: con.kind };
  }

  var KIN_EXAMPLES = [
    '爸爸的妈妈的哥哥', '妈妈的姐姐的女儿', '老婆的弟弟', '儿子的女儿的丈夫',
    '爸爸的哥哥的儿子', '妈妈的哥哥的女儿', '哥哥的老婆', '姐姐的儿子',
    '爷爷的哥哥', '儿子的老婆', '爸爸的老婆', '侄子的儿子'
  ];

  function kinPathText(path) {
    if (!path) return '';
    var names = { F: '父', M: '母', S: '子', D: '女', C: '子女', H: '夫', W: '妻', X: '配偶', U: '父/母' };
    return path.map(function (s) { return names[s.label] || s.label; }).join(' → ');
  }

  function renderKinship(pane, api) {
    pane.innerHTML =
      '<div class="ct-wrap ct-kin">' +
        '<section class="ct-card">' +
          '<div class="ct-head">' +
            '<div><h3 class="ct-title">输入关系链</h3><p class="ct-sub">用「的」连接关系词，按亲属关系图逐级推算；覆盖父系、母系、堂表与常见姻亲。</p></div>' +
            '<div class="ct-head-actions"><button type="button" class="btn btn-primary" id="kinRun">推算称谓</button><button type="button" class="btn btn-ghost" id="kinCopy">复制结果</button></div>' +
          '</div>' +
          '<div class="ct-form-row">' +
            '<label class="ct-field ct-field-grow"><span>关系链</span><input type="text" id="kinChain" class="ct-input" value="爸爸的妈妈的哥哥" autocomplete="off" spellcheck="false"></label>' +
            '<label class="ct-field"><span>我的性别</span><select id="kinGender" class="ct-select"><option value="">不指定</option><option value="M">男</option><option value="F">女</option></select></label>' +
            '<label class="ct-field"><span>显示方式</span><select id="kinMode" class="ct-select"><option value="formal">书面称谓</option><option value="oral">口语称呼</option></select></label>' +
          '</div>' +
          '<div class="ct-chip-row" id="kinExamples">' +
            KIN_EXAMPLES.map(function (x) { return '<button type="button" class="ct-chip" data-kin-ex="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') +
          '</div>' +
          '<p class="ct-hint">支持：爸爸/妈妈、爷爷/奶奶、外公/外婆、哥哥/弟弟/姐姐/妹妹、儿子/女儿、老公/老婆、岳父/岳母、公公/婆婆、儿媳/女婿、嫂子/弟媳、姐夫/妹夫、伯父/叔叔/姑姑/舅舅/姨妈、侄子/侄女/外甥/外甥女、堂表兄弟姐妹，以及继/养/干亲标注。地区别称会一并列出。</p>' +
        '</section>' +
        '<div id="kinOut" class="ct-results"><div class="ct-empty">输入关系链后点击「推算称谓」，或直接点下方示例。</div></div>' +
      '</div>';

    var chainEl = qs(pane, '#kinChain');
    var genderEl = qs(pane, '#kinGender');
    var modeEl = qs(pane, '#kinMode');
    var out = qs(pane, '#kinOut');
    var lastText = '';

    function run() {
      var chain = chainEl.value.trim();
      if (!chain) {
        out.innerHTML = '<div class="ct-note ct-note-warn">请先输入关系链，例如「爸爸的妈妈的哥哥」。</div>';
        lastText = '';
        return;
      }
      var tk = kinTokenize(chain);
      if (tk.error) {
        out.innerHTML = '<div class="ct-note ct-note-err"><b>第 ' + tk.error.index + ' 段「' + esc(tk.error.segment) + '」中有不认识的关系词：</b>' + esc(tk.error.token) + '。请改用「爸爸、妈妈、哥哥、弟弟、姐姐、妹妹、儿子、女儿、老公、老婆」等关系词，并用「的」连接。</div>';
        lastText = '';
        return;
      }
      if (!tk.steps.length) {
        out.innerHTML = '<div class="ct-note ct-note-warn">没有解析到有效关系步，请检查输入。</div>';
        lastText = '';
        return;
      }
      var built = kinBuild(tk.steps, genderEl.value || null, tk.tokens);
      var g = built.graph;
      var target = built.target;
      var main = kinClassify(g.self, target);
      var rev = kinClassify(target, g.self);
      var mode = modeEl.value;
      var primary = mode === 'oral' ? main.rel.oral : main.rel.formal;
      var secondary = mode === 'oral' ? main.rel.formal : main.rel.oral;
      var alias = main.rel.dialect && main.rel.dialect.length ? main.rel.dialect.join(' / ') : '暂无特别常见的地区别称';
      var kindText = main.kind === '直系' ? '直系血亲' : main.kind === '旁系' ? '旁系血亲' : main.kind === '姻亲' ? '姻亲（因婚姻关系）' : main.kind;
      var genText = main.gen == null ? '—' : main.gen > 0 ? '对方比我高 ' + main.gen + ' 辈' : main.gen < 0 ? '对方比我低 ' + (-main.gen) + ' 辈' : '同辈';
      var notes = [];
      if (g.ambiguousAncestor) notes.push('这条写法也可能指直系尊亲本人，而不一定是旁系亲属。');
      if (g.ambiguousSelf) notes.push('这条写法也可能指本人，也可能指同辈兄弟姐妹。');
      if (tk.steps.some(function (s) { return s.special; })) notes.push('关系链中含继亲、养亲或干亲标注，称谓按社会关系处理，法律与民俗口径可能不同。');
      var hasSpouseStep = tk.steps.some(function (s) { return s.type === 'H' || s.type === 'W' || s.type === 'SP'; });
      if (hasSpouseStep) notes.push('结果含姻亲成分，已在关系类型中标注「因婚姻关系」。');

      var tokenRows = tk.tokens.map(function (t) {
        var labels = t.steps.map(function (st) { return KIN_STEP_LABEL[st[0]] || st[0]; }).join(' · ');
        var delta = 0;
        t.steps.forEach(function (st) { if (st[0] === 'F' || st[0] === 'M') delta++; else if (st[0] === 'S' || st[0] === 'D') delta--; });
        return { text: t.text, labels: labels || '本人', delta: delta, special: t.special };
      });
      var cum = 0;
      var pathRows = tokenRows.map(function (r, i) {
        cum += r.delta;
        return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(r.text) + '</b></td><td>' + esc(r.labels) + '</td><td>' + (r.delta > 0 ? '+' + r.delta : String(r.delta)) + '</td><td>' + (cum > 0 ? '+' + cum : String(cum)) + '</td></tr>';
      }).join('');
      var canonical = kinPathText(kinBFS(g.self, target));

      var html = '<section class="ct-result ct-kin-main">' +
        '<div class="ct-result-head"><span class="ct-result-no">推算结果</span><span class="ct-meta">' + esc(chain) + '</span></div>' +
        '<div class="ct-kin-term">' + esc(primary) + '</div>' +
        '<div class="ct-kin-terms">' +
          '<div><span>书面称谓</span><b>' + esc(main.rel.formal) + '</b></div>' +
          '<div><span>口语称呼</span><b>' + esc(main.rel.oral) + '</b></div>' +
          '<div><span>地区 / 方言别称</span><b>' + esc(alias) + '</b></div>' +
        '</div>' +
        '<div class="ct-badge-row"><span class="ct-badge">' + esc(kindText) + '</span><span class="ct-badge">' + esc(genText) + '</span>' +
          (main.affinity ? '<span class="ct-badge ct-badge-warn">因婚姻关系</span>' : '') + '</div>' +
        (main.rel.note ? '<p class="ct-wx-p">' + esc(main.rel.note) + '</p>' : '') +
        (notes.length ? '<div class="ct-note ct-note-soft">' + notes.map(esc).join('<br>') + '</div>' : '') +
        '</section>' +
        '<section class="ct-result">' +
          '<div class="ct-result-head"><span class="ct-result-no">反向称呼</span><span class="ct-meta">对方怎么称呼我</span></div>' +
          '<div class="ct-kin-reverse"><b>' + esc(rev.rel.formal) + '</b><span>' + esc(rev.rel.oral) + '</span></div>' +
          (rev.rel.dialect && rev.rel.dialect.length ? '<p class="ct-hint">别称：' + esc(rev.rel.dialect.join(' / ')) + '</p>' : '') +
          (rev.rel.note ? '<p class="ct-wx-p">' + esc(rev.rel.note) + '</p>' : '') +
        '</section>' +
        '<section class="ct-result">' +
          '<div class="ct-result-head"><span class="ct-result-no">关系路径与代数推导</span><span class="ct-meta">逐级展开</span></div>' +
          '<div class="ct-table-wrap"><table class="data-table ct-table"><thead><tr><th>序</th><th>关系词</th><th>原始步</th><th>本步代数</th><th>累计代数</th></tr></thead><tbody>' + pathRows + '</tbody></table></div>' +
          '<div class="ct-kin-algebra">' +
            '<div><span>标准化路径</span><b class="ct-mono">' + esc(canonical) + '</b></div>' +
            '<div><span>代数差</span><b>' + (main.gen == null ? '—' : (main.gen > 0 ? '+' + main.gen : String(main.gen))) + '</b></div>' +
            '<div><span>关系类型</span><b>' + esc(kindText) + '</b></div>' +
            '<div><span>堂表判定</span><b>' + esc(main.kind === '旁系' ? '父系伯叔之子女称堂，父之姐妹与母系亲属之子女称表' : '直系或姻亲，不涉及堂表区分') + '</b></div>' +
          '</div>' +
          '<p class="ct-hint">代数规则：父/母 +1，子/女 -1，夫/妻 0，兄/弟/姐/妹 0；共同祖先处分支后按「父系堂、母系表」判定。若链条超出常用称谓，会给出可理解的层级描述。</p>' +
        '</section>';

      lastText = '亲戚称谓推算\n关系链：' + chain + '\n我的性别：' + (genderEl.value === 'M' ? '男' : genderEl.value === 'F' ? '女' : '不指定') +
        '\n标准称谓（书面）：' + main.rel.formal + '\n口语称呼：' + main.rel.oral + '\n地区/方言别称：' + alias +
        '\n反向称呼（对方叫我）：' + rev.rel.formal + ' / ' + rev.rel.oral +
        '\n关系类型：' + kindText + '\n代数差：' + (main.gen == null ? '—' : (main.gen > 0 ? '+' + main.gen : String(main.gen))) +
        '\n标准化路径：' + canonical + '\n\n说明：称谓因地区与家庭习惯差异较大，结果供参考。';
      out.innerHTML = html;
    }

    qs(pane, '#kinRun').onclick = run;
    qs(pane, '#kinCopy').onclick = function () {
      if (!lastText) { T.toast('还没有可复制的结果', 'err'); return; }
      copyText(lastText);
    };
    qsa(pane, '[data-kin-ex]').forEach(function (b) {
      b.addEventListener('click', function () {
        chainEl.value = b.getAttribute('data-kin-ex');
        run();
      });
    });
    on(chainEl, 'keydown', function (e) {
      if (e.isComposing) return;
      if (e.key === 'Enter') { e.preventDefault(); run(); }
    });
    var timer = null;
    on(chainEl, 'input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 320);
    });
    api.onCleanup(function () { clearTimeout(timer); });
    on(genderEl, 'change', run);
    on(modeEl, 'change', run);
    run();
  }

  R('亲戚称谓计算器', { render: renderKinship });

  /* ============================================================
   * 四、今日运势（本地种子生成 + 讲解 + 反馈）
   * ============================================================ */
  function hashString(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pickN(rng, arr, n) {
    var pool = arr.slice(), out = [];
    for (var i = 0; i < n && pool.length; i++) {
      var idx = Math.floor(rng() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }
  function fortuneRating(n) {
    if (n >= 88) return '很旺';
    if (n >= 78) return '平稳偏上';
    if (n >= 65) return '平稳';
    if (n >= 52) return '略有起伏';
    return '需要慢一点';
  }
  var FORTUNE_DIMS = [
    {
      key: '事业', do: ['先完成最重要的一件事', '把复杂任务拆成三段', '主动同步一次进度', '整理待办并删掉两件不重要的事', '找一个安静时段做深度工作'],
      watch: ['避免在会议里临时承诺过多', '不要因为追求完美而迟迟不交付', '少在上午处理琐碎消息', '别把同事的反馈当成否定', '避免同时开启三个以上任务'],
      tip: ['把需要说服别人的沟通放到下午', '给下午留出 30 分钟缓冲', '先写结论再补细节', '把决定留到信息齐全之后', '用清单代替记忆']
    },
    {
      key: '财运', do: ['核对一次固定支出', '处理一件拖延的报销或账单', '把想买的东西放进购物车冷静一天', '记录今天的每一笔支出', '比较一下常用订阅是否还用得上'],
      watch: ['避免因为情绪好就冲动下单', '不要碰看不懂的高收益产品', '别替不熟的人做担保', '避免在深夜做消费决定', '不要用“反正不贵”说服自己'],
      tip: ['大额支出先睡一觉再决定', '把预算写下来比记在脑子里可靠', '先问自己下个月还会不会用', '留一笔不动的小额备用金', '把优惠券用在原本就要买的东西上']
    },
    {
      key: '感情', do: ['主动问一句对方今天过得怎样', '把感谢说出口', '安排一段不看手机的相处时间', '认真听完对方的一句话再回应', '给久未联系的朋友发条消息'],
      watch: ['避免用沉默表达不满', '不要翻旧账', '别在疲惫时讨论重要问题', '避免替对方做决定', '不要把猜测当成事实'],
      tip: ['先确认对方需要建议还是倾听', '把“你总是”换成“我感到”', '给彼此留一点独处空间', '重要的话当面说', '用小行动代替大承诺']
    },
    {
      key: '健康', do: ['把水杯放在伸手可及的地方', '饭后散步十分钟', '提前半小时放下手机', '做一组肩颈拉伸', '按时吃一顿正经饭'],
      watch: ['避免连续久坐超过一小时', '不要用咖啡代替睡眠', '别在睡前处理工作消息', '避免空腹喝浓茶或咖啡', '不要忽略持续的小疼痛'],
      tip: ['困的时候先闭眼十分钟', '把运动安排在固定时段', '晚餐七分饱即可', '睡前调暗屏幕亮度', '把体检预约放进日历']
    }
  ];
  var FORTUNE_GOOD = ['整理房间的一角', '把待办清单缩短', '主动沟通一件小事', '散步二十分钟', '读几页书', '提前完成一项任务', '给家人打个电话', '记录三件值得感谢的事', '把手机调成静音一小时', '做一顿简单的饭', '复盘一个旧决定', '早睡半小时'];
  var FORTUNE_BAD = ['在情绪上头时做决定', '同时开启多任务', '过量咖啡因', '深夜刷购物软件', '替别人承担不属于你的责任', '在群里发长段情绪文字', '临时改变重要计划', '空腹出门', '把工作和休息混在一起', '答应一个你并不想答应的请求', '反复检查已经完成的事', '用熬夜补白天的时间'];
  var FORTUNE_COLORS = [
    { name: '松绿', cls: 'ct-sw-accent' }, { name: '苔绿', cls: 'ct-sw-good' },
    { name: '琥珀', cls: 'ct-sw-warn' }, { name: '赭红', cls: 'ct-sw-err' },
    { name: '墨灰', cls: 'ct-sw-text' }, { name: '雾白', cls: 'ct-sw-line' }
  ];
  var FORTUNE_SLOTS = ['07:00–09:00', '09:00–11:00', '11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00', '19:00–21:00', '21:00–23:00'];
  var FORTUNE_FB_KEY = 'ct_fortune_feedback_v1';
  var FORTUNE_FB_LABELS = ['准', '一般', '不准'];

  function fortuneGenerate(dateStr, name) {
    var seed = hashString(dateStr + '|' + (name || '匿名'));
    var rng = mulberry32(seed);
    var dims = FORTUNE_DIMS.map(function (d) {
      var score = 52 + Math.floor(rng() * 44);
      var doTxt = d.do[Math.floor(rng() * d.do.length)];
      var watchTxt = d.watch[Math.floor(rng() * d.watch.length)];
      var tipTxt = d.tip[Math.floor(rng() * d.tip.length)];
      return {
        key: d.key, score: score, rating: fortuneRating(score),
        text: '今天适合' + doTxt + '。' + watchTxt + '。' + tipTxt + '。'
      };
    });
    var overall = Math.round(dims.reduce(function (a, b) { return a + b.score; }, 0) / dims.length);
    var good = pickN(rng, FORTUNE_GOOD, 3);
    var bad = pickN(rng, FORTUNE_BAD, 3);
    var color = FORTUNE_COLORS[Math.floor(rng() * FORTUNE_COLORS.length)];
    var num = 1 + Math.floor(rng() * 9);
    var slot = FORTUNE_SLOTS[Math.floor(rng() * FORTUNE_SLOTS.length)];
    return { date: dateStr, name: name || '匿名', seed: seed, dims: dims, overall: overall, rating: fortuneRating(overall), good: good, bad: bad, color: color, num: num, slot: slot };
  }

  function fortuneText(f) {
    var lines = [
      '今日运势 · ' + f.date + ' · ' + f.name,
      '综合：' + f.overall + ' 分 · ' + f.rating,
      ''
    ];
    f.dims.forEach(function (d) { lines.push(d.key + '：' + d.score + ' 分 · ' + d.rating + '。' + d.text); });
    lines.push('');
    lines.push('今日宜：' + f.good.join('、'));
    lines.push('今日忌：' + f.bad.join('、'));
    lines.push('幸运色：' + f.color.name + '；幸运数字：' + f.num + '；最佳时段：' + f.slot);
    lines.push('');
    lines.push('说明：内容由日期与昵称在本地生成，同一天同一昵称结果稳定；仅供娱乐，不构成任何决策建议。');
    return lines.join('\n');
  }

  function fortuneRenderStats(host) {
    var list = readStore(FORTUNE_FB_KEY, []);
    if (!Array.isArray(list)) list = [];
    var counts = { '准': 0, '一般': 0, '不准': 0 };
    list.forEach(function (it) { if (it && counts[it.choice] != null) counts[it.choice]++; });
    var total = counts['准'] + counts['一般'] + counts['不准'];
    var html = '<div class="ct-fb-stat">已记录：' + FORTUNE_FB_LABELS.map(function (k) { return esc(k) + ' ' + counts[k] + ' 次'; }).join(' · ') + (total ? '（共 ' + total + ' 次）' : '') + '</div>';
    if (total) {
      html += '<div class="ct-fb-bars">' + FORTUNE_FB_LABELS.map(function (k) {
        var pct = Math.round(counts[k] / total * 100);
        return '<div class="ct-fb-bar"><span>' + esc(k) + '</span><i class="ct-bar"><b style="width:' + pct + '%"></b></i><em>' + pct + '%</em></div>';
      }).join('') + '</div>';
    }
    if (list.length) {
      var recent = list.slice(-8).reverse();
      html += '<div class="ct-fb-history"><b>你的历史反馈</b><ul>' +
        recent.map(function (it) {
          return '<li><span>' + esc(it.date || '') + '</span><span>' + esc(it.name || '匿名') + '</span><em>' + esc(it.choice || '') + '</em></li>';
        }).join('') + '</ul></div>';
    }
    html += '<p class="ct-hint">反馈只保存在本机 localStorage，不上传；最多保留最近 200 条。</p>';
    host.innerHTML = html;
  }

  function renderFortune(pane, api) {
    pane.innerHTML =
      '<div class="ct-wrap ct-fortune">' +
        '<section class="ct-card">' +
          '<div class="ct-head">' +
            '<div><h3 class="ct-title">生成设置</h3><p class="ct-sub">按日期与昵称本地生成，同一天同一昵称结果稳定；分维度评分、讲解与宜忌。</p></div>' +
            '<div class="ct-head-actions"><button type="button" class="btn btn-primary" id="fortuneRun">生成今日运势</button><button type="button" class="btn btn-ghost" id="fortuneCopy">复制总结</button></div>' +
          '</div>' +
          '<div class="ct-form-row">' +
            '<label class="ct-field"><span>昵称（可留空）</span><input type="text" id="fortuneName" class="ct-input" placeholder="可留空，默认匿名" autocomplete="off"></label>' +
            '<label class="ct-field"><span>日期</span><input type="date" id="fortuneDate" class="ct-input"></label>' +
          '</div>' +
          '<p class="ct-hint">结果由日期 + 昵称作为本地种子生成，不使用任何账号或网络请求。仅供娱乐，不构成决策建议。</p>' +
        '</section>' +
        '<div id="fortuneOut" class="ct-results"><div class="ct-empty">点击「生成今日运势」查看分维度评分与讲解。</div></div>' +
        '<section class="ct-card ct-fortune-fb">' +
          '<div class="ct-head"><div><h3 class="ct-title">今天准不准？</h3><p class="ct-sub">点一下记录感受，只在本地统计，不上传。</p></div></div>' +
          '<div class="ct-fb-actions" id="fortuneFbActions">' +
            FORTUNE_FB_LABELS.map(function (k) { return '<button type="button" class="btn btn-ghost" data-ffb="' + k + '">' + k + '</button>'; }).join('') +
            '<button type="button" class="btn btn-ghost btn-sm" id="fortuneFbClear">清空记录</button>' +
          '</div>' +
          '<div id="fortuneFbStat" class="ct-fb-stat"></div>' +
        '</section>' +
      '</div>';

    var nameEl = qs(pane, '#fortuneName');
    var dateEl = qs(pane, '#fortuneDate');
    var out = qs(pane, '#fortuneOut');
    var fbStat = qs(pane, '#fortuneFbStat');
    var current = null;
    dateEl.value = todayISO();

    function run() {
      var date = dateEl.value || todayISO();
      var name = nameEl.value.trim();
      current = fortuneGenerate(date, name);
      var f = current;
      var dimsHTML = f.dims.map(function (d) {
        var cls = d.score >= 78 ? 'ct-bar-good' : d.score >= 60 ? 'ct-bar-accent' : 'ct-bar-warn';
        return '<div class="ct-fortune-dim">' +
          '<div class="ct-fortune-dim-head"><b>' + esc(d.key) + '</b><span>' + d.score + ' 分 · ' + esc(d.rating) + '</span></div>' +
          '<i class="ct-bar ' + cls + '"><b style="width:' + d.score + '%"></b></i>' +
          '<p class="ct-wx-p">' + esc(d.text) + '</p>' +
          '</div>';
      }).join('');
      out.innerHTML =
        '<section class="ct-result ct-fortune-hero">' +
          '<div class="ct-fortune-hero-left"><span class="ct-meta">' + esc(f.date) + ' · ' + esc(f.name) + '</span>' +
            '<div class="ct-fortune-score">' + f.overall + '<small>分</small></div>' +
            '<div class="ct-fortune-rating">' + esc(f.rating) + '</div>' +
          '</div>' +
          '<div class="ct-fortune-hero-right">' + dimsHTML + '</div>' +
        '</section>' +
        '<section class="ct-result">' +
          '<div class="ct-result-head"><span class="ct-result-no">今日宜 / 忌</span><span class="ct-meta">各 3 条</span></div>' +
          '<div class="ct-fortune-grid">' +
            '<div class="ct-fortune-list ct-fortune-good"><h4>宜</h4><ul>' + f.good.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
            '<div class="ct-fortune-list ct-fortune-bad"><h4>忌</h4><ul>' + f.bad.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
          '</div>' +
          '<div class="ct-fortune-lucky">' +
            '<div class="ct-lucky-item"><span class="ct-sw ' + f.color.cls + '" id="fortuneSwatch"></span><div><b>幸运色 · ' + esc(f.color.name) + '</b><em id="fortuneHex">读取中</em></div></div>' +
            '<div class="ct-lucky-item"><span class="ct-lucky-num">' + f.num + '</span><div><b>幸运数字</b><em>1–9 中取一</em></div></div>' +
            '<div class="ct-lucky-item"><span class="ct-lucky-time">' + esc(f.slot) + '</span><div><b>最佳时段</b><em>本地时间</em></div></div>' +
          '</div>' +
          '<p class="ct-note ct-note-soft">运势内容由日期与昵称本地生成，仅供娱乐，不构成任何决策建议。</p>' +
        '</section>';
      var sw = qs(out, '#fortuneSwatch');
      var hexEl = qs(out, '#fortuneHex');
      if (sw && hexEl) {
        var hex = '';
        try { hex = rgbToHex(window.getComputedStyle(sw).backgroundColor); } catch (e) { hex = ''; }
        hexEl.textContent = hex || '色值随主题变化';
      }
    }

    qs(pane, '#fortuneRun').onclick = run;
    qs(pane, '#fortuneCopy').onclick = function () {
      if (!current) { T.toast('先生成一次运势', 'err'); return; }
      copyText(fortuneText(current));
    };
    on(nameEl, 'keydown', function (e) {
      if (e.isComposing) return;
      if (e.key === 'Enter') { e.preventDefault(); run(); }
    });
    on(dateEl, 'change', run);

    fortuneRenderStats(fbStat);
    qsa(pane, '#fortuneFbActions [data-ffb]').forEach(function (b) {
      b.addEventListener('click', function () {
        var choice = b.getAttribute('data-ffb');
        var list = readStore(FORTUNE_FB_KEY, []);
        if (!Array.isArray(list)) list = [];
        list.push({ date: dateEl.value || todayISO(), name: (nameEl.value.trim() || '匿名'), choice: choice, ts: Date.now() });
        if (list.length > 200) list = list.slice(list.length - 200);
        writeStore(FORTUNE_FB_KEY, list);
        fortuneRenderStats(fbStat);
        T.toast('已记录：' + choice + '（仅保存在本机）');
      });
    });
    qs(pane, '#fortuneFbClear').onclick = function () {
      dropStore(FORTUNE_FB_KEY);
      fortuneRenderStats(fbStat);
      T.toast('已清空本地反馈记录');
    };
    run();
  }

  R('今日运势', { render: renderFortune });

  /* ============================================================
   * 五、五行八字查询（保留四柱排盘，追加旺弱缺、日主强弱、十神、导出）
   * ============================================================ */
  var BAZI_GAN_ELEM = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  var BAZI_ZHI_ELEM = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  var BAZI_ELEM_ORDER = ['金', '木', '水', '火', '土'];
  var BAZI_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var BAZI_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  var BAZI_YANG_GAN = { '甲': 1, '丙': 1, '戊': 1, '庚': 1, '壬': 1 };
  var BAZI_WANG_WEAK = {
    '金': { wang: '金气偏旺，传统上形容重规则、决断快，但容易显得冷硬。', ruo: '金气偏弱，传统上形容边界感与取舍容易摇摆。', que: '金未出现，传统上视为该行偏缺，可在颜色、方位与作息上作象征性补充。' },
    '木': { wang: '木气偏旺，传统上形容主见强、行动快，但容易急。', ruo: '木气偏弱，传统上形容计划多、落地慢，需要外部节奏带动。', que: '木未出现，传统上视为该行偏缺，可在颜色、方位与作息上作象征性补充。' },
    '水': { wang: '水气偏旺，传统上形容思虑深、适应力强，但容易想太多。', ruo: '水气偏弱，传统上形容储备与安全感不足，容易紧绷。', que: '水未出现，传统上视为该行偏缺，可在颜色、方位与作息上作象征性补充。' },
    '火': { wang: '火气偏旺，传统上形容热情、表达强，但容易亢奋。', ruo: '火气偏弱，传统上形容动力与表达意愿偏低。', que: '火未出现，传统上视为该行偏缺，可在颜色、方位与作息上作象征性补充。' },
    '土': { wang: '土气偏旺，传统上形容稳重、能承载，但容易思虑过度。', ruo: '土气偏弱，传统上形容消化与坚持力需要照顾。', que: '土未出现，传统上视为该行偏缺，可在颜色、方位与作息上作象征性补充。' }
  };

  function baziPick(lunar, names) {
    for (var i = 0; i < names.length; i++) {
      if (typeof lunar[names[i]] === 'function') {
        try { return lunar[names[i]](); } catch (e) { /* noop */ }
      }
    }
    return '';
  }
  function baziShiShen(dayGan, otherGan) {
    if (!dayGan || !otherGan) return '—';
    if (dayGan === otherGan) return '比肩';
    var dayEl = BAZI_GAN_ELEM[dayGan], otherEl = BAZI_GAN_ELEM[otherGan];
    var same = (!!BAZI_YANG_GAN[dayGan]) === (!!BAZI_YANG_GAN[otherGan]);
    if (dayEl === otherEl) return same ? '比肩' : '劫财';
    if (BAZI_SHENG[dayEl] === otherEl) return same ? '食神' : '伤官';
    if (BAZI_KE[dayEl] === otherEl) return same ? '偏财' : '正财';
    if (BAZI_KE[otherEl] === dayEl) return same ? '七杀' : '正官';
    if (BAZI_SHENG[otherEl] === dayEl) return same ? '偏印' : '正印';
    return '—';
  }
  function baziAnalyze(dateStr, timeStr) {
    if (!window.Lunar || !window.Solar) throw new Error('农历组件未加载（vendor/lunar.js），无法排盘。请确认 index.html 已引入 lunar.js。');
    var m = String(dateStr || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) throw new Error('请输入有效的出生日期。');
    var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), da = parseInt(m[3], 10);
    var tm = String(timeStr || '08:00').match(/^(\d{1,2}):(\d{1,2})/);
    var hh = tm ? parseInt(tm[1], 10) : 8, mi = tm ? parseInt(tm[2], 10) : 0;
    var lunar = window.Lunar.fromDate(new Date(y, mo - 1, da, hh, mi, 0));
    var yearGZ = baziPick(lunar, ['getYearInGanZhiExact', 'getYearInGanZhiByLiChun', 'getYearInGanZhi']);
    var monthGZ = baziPick(lunar, ['getMonthInGanZhiExact', 'getMonthInGanZhi']);
    var dayGZ = baziPick(lunar, ['getDayInGanZhiExact', 'getDayInGanZhi']);
    var timeGZ = baziPick(lunar, ['getTimeInGanZhi']);
    if (!yearGZ || !monthGZ || !dayGZ || !timeGZ) throw new Error('排盘失败：农历组件返回的四柱不完整。');
    var pillars = [
      { name: '年柱', gz: yearGZ, gan: yearGZ.charAt(0), zhi: yearGZ.charAt(1) },
      { name: '月柱', gz: monthGZ, gan: monthGZ.charAt(0), zhi: monthGZ.charAt(1) },
      { name: '日柱', gz: dayGZ, gan: dayGZ.charAt(0), zhi: dayGZ.charAt(1) },
      { name: '时柱', gz: timeGZ, gan: timeGZ.charAt(0), zhi: timeGZ.charAt(1) }
    ];
    var dayGan = pillars[2].gan;
    var counts = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    pillars.forEach(function (p) {
      counts[BAZI_GAN_ELEM[p.gan] || '土']++;
      counts[BAZI_ZHI_ELEM[p.zhi] || '土']++;
    });
    var total = 8;
    var strong = '', weak = [], missing = [];
    BAZI_ELEM_ORDER.forEach(function (el) {
      if (counts[el] === 0) missing.push(el);
      if (counts[el] >= 3 && !strong) strong = el;
    });
    var dayEl = BAZI_GAN_ELEM[dayGan];
    var sameCount = counts[dayEl] + counts[Object.keys(BAZI_SHENG).filter(function (k) { return BAZI_SHENG[k] === dayEl; })[0]];
    var otherCount = total - sameCount;
    var ratio = sameCount / total;
    var level = ratio >= 0.6 ? '偏强' : ratio >= 0.5 ? '中和偏强' : ratio >= 0.4 ? '中和偏弱' : '偏弱';
    var explain = '同类（比劫 + 印）' + sameCount + ' 个，异类（食伤 + 财 + 官杀）' + otherCount + ' 个，同类占比约 ' + Math.round(ratio * 100) + '%。按这个粗略口径，日主' + level + '。';
    var advice = [];
    if (level === '偏强' || level === '中和偏强') {
      advice.push('传统上宜“泄、耗、克”，把精力更多用在输出与创造上，避免硬碰硬。');
      advice.push('颜色可偏向白、金、蓝黑；方位可参考西、北；作息上避免长期熬夜与过度亢奋。');
      advice.push('每周安排有氧运动与安静独处各一段，给强能量留出出口。');
    } else if (level === '偏弱' || level === '中和偏弱') {
      advice.push('传统上宜“生、扶”，先保证睡眠、规律进食与稳定节奏。');
      advice.push('颜色可偏向青绿、红；方位可参考东、南；多接触自然光与绿植。');
      advice.push('把大目标拆小，借外部日程与同伴督促把根扎稳。');
    } else {
      advice.push('同类与异类大致相当，传统上视为相对中和，不必刻意补某一行。');
      advice.push('保持规律作息与适度运动，按季节调整饮食即可。');
    }
    var shiShen = pillars.map(function (p, i) {
      return { name: p.name, gan: p.gan, zhi: p.zhi, shi: i === 2 ? '日主' : baziShiShen(dayGan, p.gan) };
    });
    return {
      date: dateStr, time: String(timeStr || '08:00'), lunar: lunar.toString(), shengxiao: baziPick(lunar, ['getYearShengXiao']),
      pillars: pillars, counts: counts, total: total, strong: strong, weak: weak, missing: missing,
      dayGan: dayGan, dayEl: dayEl, sameCount: sameCount, otherCount: otherCount, ratio: ratio, level: level,
      explain: explain, advice: advice, shiShen: shiShen
    };
  }

  function baziText(a) {
    var lines = [
      '五行八字排盘',
      '公历：' + a.date + ' ' + a.time,
      '农历：' + a.lunar,
      '生肖：' + (a.shengxiao || '—'),
      '',
      '四柱：' + a.pillars.map(function (p) { return p.name + ' ' + p.gz; }).join(' / '),
      '日主：' + a.dayGan + '（' + a.dayEl + '）',
      '',
      '五行计数：' + BAZI_ELEM_ORDER.map(function (el) { return el + ' ' + a.counts[el]; }).join('、'),
      '旺 / 弱 / 缺：' + BAZI_ELEM_ORDER.map(function (el) {
        var tag = a.counts[el] === 0 ? '缺' : a.counts[el] >= 3 ? '旺' : a.counts[el] === 1 ? '弱' : '中和';
        return el + ' ' + tag;
      }).join('、'),
      '日主强弱：' + a.level + '（同类 ' + a.sameCount + '，异类 ' + a.otherCount + '，同类占比 ' + Math.round(a.ratio * 100) + '%）',
      a.explain,
      '',
      '十神（以日干为准）：' + a.shiShen.map(function (s) { return s.name + ' ' + s.gan + '→' + s.shi; }).join('；'),
      '',
      '传统调和建议：',
      a.advice.map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n'),
      '',
      '说明：八字与五行属传统民俗文化，以上为文化参考，不具科学依据，也不构成健康、婚恋、职业或投资建议。'
    ];
    return lines.join('\n');
  }

  function renderBazi(pane, api) {
    pane.innerHTML =
      '<div class="ct-wrap ct-bazi">' +
        '<section class="ct-card">' +
          '<div class="ct-head">' +
            '<div><h3 class="ct-title">排盘设置</h3><p class="ct-sub">四柱排盘、五行计数、旺弱缺、日主强弱与十神；结果由站点自带的 lunar.js 在本地推算。</p></div>' +
            '<div class="ct-head-actions"><button type="button" class="btn btn-primary" id="baziRun">排盘</button><button type="button" class="btn btn-ghost" id="baziExport">导出排盘文本</button><button type="button" class="btn btn-ghost" id="baziCopy">复制文本</button></div>' +
          '</div>' +
          '<div class="ct-form-row">' +
            '<label class="ct-field"><span>出生日期</span><input type="date" id="baziDate" class="ct-input" value="1995-06-15"></label>' +
            '<label class="ct-field"><span>出生时间</span><input type="time" id="baziTime" class="ct-input" value="08:30"></label>' +
          '</div>' +
          '<p class="ct-hint">默认按公历日期与本地时间排盘；年柱、月柱优先采用按节气划分的精确干支。若农历组件未加载，会给出明确提示。</p>' +
        '</section>' +
        '<div id="baziOut" class="ct-results"><div class="ct-empty">点击「排盘」查看四柱、五行与十神。</div></div>' +
      '</div>';

    var dateEl = qs(pane, '#baziDate');
    var timeEl = qs(pane, '#baziTime');
    var out = qs(pane, '#baziOut');
    var currentText = '';

    function run() {
      var a;
      try { a = baziAnalyze(dateEl.value, timeEl.value); }
      catch (e) {
        out.innerHTML = '<div class="ct-note ct-note-err"><b>无法排盘：</b>' + esc(e && e.message ? e.message : String(e)) + '</div>';
        currentText = '';
        return;
      }
      currentText = baziText(a);
      var pillarHTML = a.pillars.map(function (p, i) {
        var shi = a.shiShen[i];
        return '<div class="ct-pillar">' +
          '<div class="ct-pillar-name">' + esc(p.name) + '</div>' +
          '<div class="ct-pillar-gz"><b>' + esc(p.gan) + '</b><b>' + esc(p.zhi) + '</b></div>' +
          '<div class="ct-pillar-meta"><span>天干 ' + esc(p.gan) + ' · ' + esc(BAZI_GAN_ELEM[p.gan] || '—') + '</span><span>地支 ' + esc(p.zhi) + ' · ' + esc(BAZI_ZHI_ELEM[p.zhi] || '—') + '</span></div>' +
          '<div class="ct-pillar-shi">' + esc(shi.shi) + '</div>' +
          '</div>';
      }).join('');
      var elemHTML = BAZI_ELEM_ORDER.map(function (el) {
        var c = a.counts[el];
        var tag = c === 0 ? '缺' : c >= 3 ? '旺' : c === 1 ? '弱' : '中和';
        var cls = c === 0 ? 'ct-badge-err' : c >= 3 ? 'ct-badge-warn' : c === 1 ? 'ct-badge' : 'ct-badge-good';
        var pct = Math.round(c / a.total * 100);
        var desc = c === 0 ? BAZI_WANG_WEAK[el].que : c >= 3 ? BAZI_WANG_WEAK[el].wang : c === 1 ? BAZI_WANG_WEAK[el].ruo : '该行出现两次，按这个口径视为中和。';
        return '<div class="ct-bazi-elem">' +
          '<div class="ct-bazi-elem-head"><b>' + el + '</b><span class="ct-badge ' + cls + '">' + c + ' 个 · ' + tag + '</span></div>' +
          '<i class="ct-bar"><b style="width:' + pct + '%"></b></i>' +
          '<p class="ct-hint">' + esc(desc) + '</p>' +
          '</div>';
      }).join('');
      var shiRows = a.shiShen.map(function (s) {
        return '<tr><td>' + esc(s.name) + '</td><td><b>' + esc(s.gan) + '</b></td><td>' + esc(s.shi) + '</td><td>' + esc(s.zhi) + '（' + esc(BAZI_ZHI_ELEM[s.zhi] || '—') + '）</td></tr>';
      }).join('');
      out.innerHTML =
        '<section class="ct-result">' +
          '<div class="ct-result-head"><span class="ct-result-no">四柱排盘</span><span class="ct-meta">' + esc(a.date + ' ' + a.time) + '</span></div>' +
          '<div class="ct-bazi-kv"><span>农历</span><b>' + esc(a.lunar) + '</b><span>生肖</span><b>' + esc(a.shengxiao || '—') + '</b><span>日主</span><b>' + esc(a.dayGan + '（' + a.dayEl + '）') + '</b></div>' +
          '<div class="ct-pillars">' + pillarHTML + '</div>' +
        '</section>' +
        '<section class="ct-result">' +
          '<div class="ct-result-head"><span class="ct-result-no">五行计数与旺弱缺</span><span class="ct-meta">按四柱八字八个字统计</span></div>' +
          '<div class="ct-bazi-elems">' + elemHTML + '</div>' +
        '</section>' +
        '<section class="ct-result">' +
          '<div class="ct-result-head"><span class="ct-result-no">日主强弱与调和</span><span class="ct-meta">粗判，仅供文化参考</span></div>' +
          '<div class="ct-bazi-strength"><b>' + esc(a.level) + '</b><span>同类 ' + a.sameCount + ' · 异类 ' + a.otherCount + ' · 同类占比 ' + Math.round(a.ratio * 100) + '%</span></div>' +
          '<p class="ct-wx-p">' + esc(a.explain) + '</p>' +
          '<ol class="ct-steps">' + a.advice.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
          '<p class="ct-note ct-note-soft">以上为传统民俗与文化的解释框架，不具科学依据，也不构成健康、婚恋、职业或投资建议。</p>' +
        '</section>' +
        '<section class="ct-result">' +
          '<div class="ct-result-head"><span class="ct-result-no">十神</span><span class="ct-meta">以日干与其它天干的阴阳五行关系计算</span></div>' +
          '<div class="ct-table-wrap"><table class="data-table ct-table"><thead><tr><th>柱</th><th>天干</th><th>十神</th><th>地支（五行）</th></tr></thead><tbody>' + shiRows + '</tbody></table></div>' +
          '<p class="ct-hint">十神是传统命理的关系标签；这里只按天干阴阳与五行生克简化计算，未涉及藏干、旺衰、格局与大运。</p>' +
        '</section>';
    }

    qs(pane, '#baziRun').onclick = run;
    qs(pane, '#baziCopy').onclick = function () {
      if (!currentText) { T.toast('还没有可复制的排盘', 'err'); return; }
      copyText(currentText);
    };
    qs(pane, '#baziExport').onclick = function () {
      if (!currentText) { T.toast('还没有可导出的排盘', 'err'); return; }
      T.save(T.textBlob(currentText), '五行八字排盘.txt');
    };
    on(dateEl, 'change', run);
    on(timeEl, 'change', run);
    run();
  }

  R('五行八字查询', { render: renderBazi });

  if (window.__CT_TEST__) {
    window.__CT_TEST_HOOKS__ = Object.assign(window.__CT_TEST_HOOKS__ || {}, {
      balanceEquation: balanceEquation,
      parseEquationLine: parseEquationLine,
      kinTokenize: kinTokenize,
      kinBuild: kinBuild,
      kinClassify: kinClassify,
      baziAnalyze: baziAnalyze
    });
  }
})();


