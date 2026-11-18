/* ============================================================
   工具实现：数据换算 / 金融财税 / 法律劳动 / 生活娱乐
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
  const TXT = (value, title) => ({ type: 'text', value, title });
  const round = (n, d) => Math.round(n * Math.pow(10, d == null ? 2 : d)) / Math.pow(10, d == null ? 2 : d);

  /* ======================= 一、数据换算 ======================= */
  const UNIT_SETS = {
    '长度单位换算': { 米: 1, 千米: 1000, 厘米: .01, 毫米: .001, 微米: 1e-6, 纳米: 1e-9, 英寸: .0254, 英尺: .3048, 码: .9144, 英里: 1609.344, 海里: 1852, 市尺: 1 / 3, 市里: 500, 光年: 9.4607e15 },
    '面积单位换算': { 平方米: 1, 平方千米: 1e6, 平方厘米: 1e-4, 平方毫米: 1e-6, 公顷: 1e4, 公亩: 100, 亩: 666.6667, 平方英尺: .092903, 平方英寸: .00064516, 平方码: .836127, 英亩: 4046.856, 平方英里: 2.58999e6 },
    '体积容量换算': { 升: 1, 毫升: .001, 立方米: 1000, 立方厘米: .001, 立方英尺: 28.3168, 立方英寸: .0163871, 美制加仑: 3.78541, 英制加仑: 4.54609, 美制夸脱: .946353, 美制品脱: .473176, 液量盎司: .0295735, 杯: .24, 汤匙: .015, 茶匙: .005 },
    '重量质量换算': { 千克: 1, 克: .001, 毫克: 1e-6, 吨: 1000, 斤: .5, 两: .05, 磅: .45359237, 盎司: .0283495, 英石: 6.35029, 克拉: .0002, 短吨: 907.185, 长吨: 1016.05 },
    '速度单位换算': { '米/秒': 1, '千米/小时': 1 / 3.6, '英里/小时': .44704, 节: .514444, '英尺/秒': .3048, 马赫: 340.3, '厘米/秒': .01 },
    '压强换算': { 帕斯卡: 1, 千帕: 1000, 兆帕: 1e6, 巴: 1e5, 毫巴: 100, 标准大气压: 101325, '磅力/平方英寸': 6894.76, 毫米汞柱: 133.322, 托: 133.322, '千克力/平方厘米': 98066.5 },
    '功率换算': { 瓦特: 1, 千瓦: 1000, 兆瓦: 1e6, 毫瓦: .001, 马力: 735.499, 英制马力: 745.7, '焦耳/秒': 1, '千卡/小时': 1.163, 'BTU/小时': .293071, '英尺磅力/秒': 1.35582 },
    '数据存储换算': { Byte: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5, bit: .125, Kbit: 128, Mbit: 131072, Gbit: 134217728 },
    '角度弧度换算': { 度: 1, 弧度: 180 / Math.PI, 梯度: .9, 角分: 1 / 60, 角秒: 1 / 3600, 圈: 360, 毫弧度: 180 / Math.PI / 1000 },
    '面积亩 / 公顷 / 平方米换算': { 平方米: 1, 亩: 666.6667, 公顷: 1e4, 平方千米: 1e6, 分: 66.66667, 厘: 6.666667, 英亩: 4046.856, 平方市尺: 1 / 9 }
  };
  Object.keys(UNIT_SETS).forEach(name => {
    const u = UNIT_SETS[name], keys = Object.keys(u);
    R(name, {
      fields: [N('v', '数值', 1), S('from', '原始单位', keys, keys[0])], live: true,
      run: v => {
        const base = u[v.from] || 1;
        const raw = (Number(v.v) || 0) * base;
        const rows = keys.map(k => [k, raw / u[k] < 1e-4 || raw / u[k] > 1e12 ? (raw / u[k]).toExponential(6) : T.fmt(raw / u[k], 8)]);
        return { type: 'table', title: `${T.fmt(v.v, 6)} ${v.from} = ?`, head: ['单位', '换算结果'], rows };
      }
    });
  });

  R('温度换算', {
    fields: [N('v', '温度值', 100), S('from', '原始单位', ['摄氏度 ℃', '华氏度 ℉', '开尔文 K', '兰氏度 °R', '列氏度 °Ré'], '摄氏度 ℃')], live: true,
    run: v => {
      const x = Number(v.v) || 0, f = v.from;
      let c = f.startsWith('摄氏') ? x : f.startsWith('华氏') ? (x - 32) * 5 / 9 : f.startsWith('开尔文') ? x - 273.15 : f.startsWith('兰氏') ? (x - 491.67) * 5 / 9 : x * 1.25;
      return { type: 'table', title: '温度换算结果', head: ['单位', '数值'], rows: [
        ['摄氏度 ℃', T.fmt(c, 4)], ['华氏度 ℉', T.fmt(c * 9 / 5 + 32, 4)], ['开尔文 K', T.fmt(c + 273.15, 4)],
        ['兰氏度 °R', T.fmt((c + 273.15) * 9 / 5, 4)], ['列氏度 °Ré', T.fmt(c * .8, 4)],
        ['状态参考', c <= 0 ? '水的冰点及以下' : c >= 100 ? '水的沸点及以上' : '常温区间']
      ] };
    }
  });

  R('进制转换', {
    fields: [I('v', '输入数值', '255'), S('from', '原进制', [['2', '二进制 2'], ['8', '八进制 8'], ['10', '十进制 10'], ['16', '十六进制 16'], ['36', '三十六进制 36']], '10'), S('to', '目标进制', [['2', '二进制 2'], ['8', '八进制 8'], ['10', '十进制 10'], ['16', '十六进制 16'], ['36', '三十六进制 36']], '16')], live: true,
    run: v => {
      const n = parseInt(String(v.v).trim(), Number(v.from));
      if (isNaN(n)) throw new Error(`「${v.v}」不是合法的 ${v.from} 进制数值`);
      const rows = [2, 8, 10, 16, 36].map(b => [`${b} 进制`, n.toString(b).toUpperCase()]);
      rows.push(['当前目标', n.toString(Number(v.to)).toUpperCase()]);
      return { type: 'table', title: '进制换算', head: ['进制', '结果'], rows };
    }
  });

  R('时间戳转换', {
    fields: [I('v', '时间戳或日期', String(Date.now()), { hint: '支持 10 位秒 / 13 位毫秒，或 2026-11-14 16:30:00' }), S('unit', '时间戳单位', [['auto', '自动判断'], ['s', '秒（10 位）'], ['ms', '毫秒（13 位）']], 'auto')], live: true,
    run: v => {
      const s = String(v.v).trim();
      let ms;
      if (/^\d{10,13}$/.test(s)) {
        const n = Number(s);
        ms = v.unit === 's' ? n * 1000 : v.unit === 'ms' ? n : (s.length === 10 ? n * 1000 : n);
      } else {
        ms = new Date(s.replace(/-/g, '/')).getTime();
        if (isNaN(ms)) throw new Error('无法识别日期格式，请使用 YYYY-MM-DD HH:mm:ss');
      }
      const d = new Date(ms), p = n => T.pad(n);
      return KV([
        ['Unix 秒时间戳', Math.floor(ms / 1000)], ['Unix 毫秒时间戳', ms],
        ['本地时间', `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`],
        ['UTC 时间', d.toUTCString()], ['ISO 8601', d.toISOString()],
        ['星期', '日一二三四五六'[d.getDay()] === '日' ? '星期日' : '星期' + '日一二三四五六'[d.getDay()]],
        ['相对现在', (ms - Date.now()) > 0 ? '未来 ' + T.fmt((ms - Date.now()) / 86400000, 2) + ' 天' : '过去 ' + T.fmt((Date.now() - ms) / 86400000, 2) + ' 天']
      ], '时间转换结果');
    }
  });

  R('罗马数字互转', {
    fields: [I('v', '阿拉伯数字或罗马数字', '2026')], live: true,
    run: v => {
      const s = String(v.v).trim().toUpperCase();
      if (/^\d+$/.test(s)) {
        const n = Number(s);
        if (n < 1 || n > 3999 || n % 1) throw new Error('请输入 1 ~ 3999 之间的整数');
        const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
        let x = n, out = '';
        map.forEach(([k, c]) => { while (x >= k) { out += c; x -= k; } });
        return KV([['阿拉伯数字', n], ['罗马数字', out]], '转换结果');
      }
      const map = { M:1000, D:500, C:100, L:50, X:10, V:5, I:1 };
      if (!/^[MDCLXVI]+$/.test(s)) throw new Error('不是合法的罗马数字');
      let total = 0;
      for (let i = 0; i < s.length; i++) total += (map[s[i]] < map[s[i+1]] ? -map[s[i]] : map[s[i]]);
      return KV([['罗马数字', s], ['阿拉伯数字', total]], '转换结果');
    }
  });

  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error('请输入合法 HEX 色值，如 #6366f1');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), l = (max+min)/2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g-b)/d + (g < b ? 6 : 0) : max === g ? (b-r)/d + 2 : (r-g)/d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s*100), Math.round(l*100)];
  }
  R('色值转换', {
    fields: [I('v', '色值', '#6366f1', { hint: '支持 #RGB / #RRGGBB / rgb(…) / hsl(…) / 255,108,241' }), S('from', '输入格式', [['auto','自动识别'],['hex','HEX'],['rgb','RGB'],['hsl','HSL']], 'auto')], live: true,
    run: v => {
      const s = String(v.v).trim();
      let r, g, b;
      const mR = s.match(/(-?\d+(?:\.\d+)?)\D+(-?\d+(?:\.\d+)?)\D+(-?\d+(?:\.\d+)?)/);
      if (v.from === 'hex' || (v.from === 'auto' && /^#?[0-9a-f]{3,6}$/i.test(s) && !s.includes(','))) [r,g,b] = hex2rgb(s);
      else if (v.from === 'hsl' || (v.from === 'auto' && /hsl/i.test(s))) {
        const [h, sa, l] = mR.slice(1).map(Number);
        const c = (1 - Math.abs(2*l/100 - 1)) * sa/100, x = c * (1 - Math.abs((h/60)%2 - 1)), m = l/100 - c/2;
        const seg = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h/60)%6] || [0,0,0];
        [r,g,b] = seg.map(z => Math.round((z+m)*255));
      } else if (mR) [r,g,b] = mR.slice(1).map(x => T.clamp(Number(x), 0, 255));
      else throw new Error('无法识别色值');
      const [h, sa, l] = rgb2hsl(r,g,b);
      const hex = '#' + [r,g,b].map(x => Math.round(x).toString(16).padStart(2,'0')).join('');
      const swatch = `<div style="display:flex;align-items:center;gap:14px"><div style="width:78px;height:52px;border-radius:9px;background:${hex};border:1px solid var(--line-strong)"></div><div style="font-size:13px">${hex}<br><span style="color:var(--text-3);font-size:11px">${r}, ${g}, ${b}</span></div></div>`;
      return [
        { type:'html', title:'颜色预览', value: swatch },
        KV([['HEX', hex.toUpperCase()], ['RGB', `rgb(${r}, ${g}, ${b})`], ['HSL', `hsl(${h}, ${sa}%, ${l}%)`],
            ['CSS 变量', `--color: ${hex};`], ['相对亮度', T.fmt((.2126*r + .7152*g + .0722*b)/255, 3)],
            ['建议文字色', (.2126*r+.7152*g+.0722*b) > 140 ? '#111827（深色文字）' : '#ffffff（浅色文字）']], '色值转换')
      ];
    }
  });

  const CN_NUM = ['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
  const CN_SM = ['零','一','二','三','四','五','六','七','八','九'];
  function intToChinese(n, upper) {
    const dig = upper ? CN_NUM : CN_SM, unit = ['', '十', '百', '千'], big = ['', '万', '亿', '兆'];
    if (n === 0) return dig[0];
    let s = String(n), out = '', zero = false;
    const groups = [];
    while (s.length) { groups.unshift(s.slice(-4)); s = s.slice(0, -4); }
    groups.forEach((g, gi) => {
      let part = '', has = false;
      for (let i = 0; i < g.length; i++) {
        const d = Number(g[i]), pos = g.length - i - 1;
        if (d === 0) { zero = true; }
        else { if (zero && part) part += dig[0]; zero = false; part += dig[d] + unit[pos]; has = true; }
      }
      if (has) out += part + big[groups.length - gi - 1];
    });
    return out.replace(/^一十/, upper ? '壹拾' : '十');
  }
  function rmbUpper(num) {
    const n = Number(num);
    if (!isFinite(n)) throw new Error('请输入有效金额');
    if (Math.abs(n) >= 1e12) throw new Error('金额超出支持范围');
    const neg = n < 0, x = Math.abs(n);
    const yuan = Math.floor(x), jiao = Math.floor((x - yuan) * 10 + 1e-6), fen = Math.round((x - yuan) * 100 - jiao * 10);
    let s = intToChinese(yuan, true) + '元';
    if (jiao === 0 && fen === 0) s += '整';
    else { s += (jiao ? CN_NUM[jiao] + '角' : (yuan ? '零' : '')) + (fen ? CN_NUM[fen] + '分' : '整'); }
    return (neg ? '负' : '') + s;
  }
  R('发票大写金额转换', {
    fields: [N('v', '小写金额（元）', 12345.67, { hint: '最多两位小数' })], live: true,
    run: v => KV([['小写金额', '¥ ' + T.fmt(v.v, 2)], ['人民币大写', '『' + rmbUpper(v.v) + '』'], ['中文大写数字', intToChinese(Math.floor(Math.abs(v.v)), true)]], '发票金额大写')
  });
  R('数字大小写转换', {
    fields: [N('v', '阿拉伯数字', 2026), S('mode', '转换方向', [['upper','数字 → 中文大写'],['small','数字 → 中文小写'],['amount','数字 → 人民币金额大写']], 'upper')], live: true,
    run: v => KV([['原始数字', v.v], ['转换结果', v.mode === 'amount' ? rmbUpper(v.v) : intToChinese(Math.abs(Math.trunc(v.v)), v.mode === 'upper')]], '转换结果')
  });

  /* ======================= 二、金融财税 ======================= */
  const TAX_BRACKETS = [[36000,.03,0],[144000,.1,2520],[300000,.2,16920],[420000,.25,31920],[660000,.3,52920],[960000,.35,85920],[Infinity,.45,181920]];
  function annualTax(taxable) {
    if (taxable <= 0) return 0;
    for (const [cap, rate, quick] of TAX_BRACKETS) if (taxable <= cap) return Math.max(0, taxable * rate - quick);
    return 0;
  }
  R('个税计算器', {
    fields: [N('salary','税前月薪（元）',15000), N('social','五险一金个人部分（元/月）',2250), N('special','专项附加扣除（元/月）',2000), N('other','其他扣除（元/月）',0), S('mode','计税口径',[['month','按月度换算（累计预扣近似）'],['year','按全年综合所得']],'month')], live:true,
    run: v => {
      const monthlyBase = 5000;
      const mDeduct = (Number(v.social)||0)+(Number(v.special)||0)+(Number(v.other)||0);
      const mTaxable = Math.max(0, (Number(v.salary)||0) - monthlyBase - mDeduct);
      const yTaxable = mTaxable * 12;
      const yTax = annualTax(yTaxable);
      const rows = [
        ['税前月薪', T.money(v.salary)], ['基本减除费用', T.money(monthlyBase)],
        ['各项扣除合计', T.money(mDeduct)], ['月应纳税所得额', T.money(mTaxable)],
        ['年应纳税所得额', T.money(yTaxable)], ['适用税率 / 速算扣除数', (TAX_BRACKETS.find(b => yTaxable <= b[0])[1]*100) + '% / ' + T.money(TAX_BRACKETS.find(b => yTaxable <= b[0])[2])],
        ['全年应纳个税', T.money(yTax)], ['月均个税', T.money(yTax/12)],
        ['税后月薪（估算）', T.money((Number(v.salary)||0) - (Number(v.social)||0) - yTax/12)],
        ['实际税负率', T.fmt(yTax / ((Number(v.salary)||0)*12) * 100, 2) + '%']
      ];
      const table = { type:'table', title:'全年 12 个月逐月预扣（简化口径）', head:['月份','累计应纳税所得额','本月预扣个税','税后到手'], rows: Array.from({length:12},(_,i)=>{
        const cum = mTaxable*(i+1), cumTax = annualTax(cum*12)/12*(i+1);
        const prev = annualTax(mTaxable*i*12)/12*i;
        return [i+1, T.money(cum), T.money(Math.max(0,cumTax-prev)), T.money((Number(v.salary)||0)-(Number(v.social)||0)-Math.max(0,cumTax-prev))];
      })};
      return [KV(rows,'工资薪金个税测算'), table, {type:'note', value:'依据现行综合所得年度税率表估算，未考虑年终奖单独计税、专项附加扣除年度确认差异等因素，结果仅供参考。'}];
    }
  });
  R('年终奖个税计算', {
    fields: [N('bonus','全年一次性奖金（元）',50000), S('mode','计税方式',[['single','单独计税'],['merge','并入综合所得（需填月薪）']],'single'), N('salary','税前月薪（并入计税时填）',15000), N('deduct','月薪各项扣除合计（元/月）',4250)], live:true,
    run: v => {
      const b = Number(v.bonus)||0;
      const mBrackets = [[3000,.03,0],[12000,.1,210],[25000,.2,1410],[35000,.25,2660],[55000,.3,4410],[80000,.35,7160],[Infinity,.45,15160]];
      let taxSingle = 0, rate = 0;
      if (b > 0) { const [, r, q] = mBrackets.find(x => b <= x[0]); taxSingle = b*r - q; rate = r; }
      const mTaxable = Math.max(0, (Number(v.salary)||0) - 5000 - (Number(v.deduct)||0));
      const mergedExtra = annualTax((mTaxable*12) + b) - annualTax(mTaxable*12);
      return [KV([
        ['奖金金额', T.money(b)], ['单独计税适用税率', (rate*100)+'%'],
        ['单独计税应纳税额', T.money(taxSingle)], ['单独计税税后到手', T.money(b - taxSingle)],
        ['并入综合所得增加税额', T.money(mergedExtra)], ['并入综合所得税后到手', T.money(b - mergedExtra)],
        ['更划算的方式', taxSingle <= mergedExtra ? '单独计税' : '并入综合所得'],
        ['两种方式差额', T.money(Math.abs(taxSingle - mergedExtra))]
      ],'年终奖计税对比'), {type:'note',value:'全年一次性奖金单独计税政策以当期有效法规为准；并入综合所得的测算基于你填写的月薪与扣除额估算。'}];
    }
  });
  function loanSchedule(principal, annualRate, months, mode) {
    const r = annualRate / 100 / 12;
    let rows = [], totalInterest = 0;
    if (mode === 'equalPrincipal') {
      const pmtP = principal / months;
      let remain = principal;
      for (let i = 1; i <= months; i++) {
        const interest = remain * r, pmt = pmtP + interest;
        totalInterest += interest; remain -= pmtP;
        rows.push([i, T.fmt(pmt,2), T.fmt(pmtP,2), T.fmt(interest,2), T.fmt(Math.max(0,remain),2)]);
      }
    } else {
      const pmt = r === 0 ? principal/months : principal * r * Math.pow(1+r,months) / (Math.pow(1+r,months)-1);
      let remain = principal;
      for (let i = 1; i <= months; i++) {
        const interest = remain * r, p = pmt - interest;
        totalInterest += interest; remain -= p;
        rows.push([i, T.fmt(pmt,2), T.fmt(p,2), T.fmt(interest,2), T.fmt(Math.max(0,remain),2)]);
      }
    }
    return { rows, totalInterest, first: parseFloat(rows[0] && rows[0][1].replace(/,/g,'') || 0) };
  }
  function loanRegister(name, defAmount) {
    R(name, {
      fields: [N('amount','贷款本金（元）',defAmount), N('rate','年利率（%）',4.2), N('years','贷款年限（年）',30), S('mode','还款方式',[['equalInstallment','等额本息'],['equalPrincipal','等额本金']],'equalInstallment')], live:true,
      run: v => {
        const p = Number(v.amount)||0, months = Math.max(1, Math.round((Number(v.years)||1)*12));
        const { rows, totalInterest, first } = loanSchedule(p, Number(v.rate)||0, months, v.mode);
        const last = parseFloat(rows[rows.length-1][1].replace(/,/g,''));
        return [KV([
          ['贷款本金', T.money(p)], ['贷款期数', months + ' 期'], ['年利率', T.fmt(v.rate,3)+'%'],
          ['首月月供', T.money(first)], ['末月月供', T.money(last)],
          ['支付利息总额', T.money(totalInterest)], ['本息合计', T.money(p + totalInterest)],
          ['利息占本金', T.fmt(totalInterest/p*100,2)+'%']
        ], name + '测算结果'),
        {type:'table', title:'还款计划表（前 24 期，可导出完整 CSV）', head:['期数','月供(元)','本金(元)','利息(元)','剩余本金(元)'], rows: rows.slice(0,24)},
        {type:'note', value:`完整 ${months} 期计划可在结果表格「导出 CSV」中获取（表格展示前 24 期）；本测算不含提前还款、利率调整与手续费。`}];
      }
    });
  }
  loanRegister('房贷计算器', 1000000);
  loanRegister('车贷计算器', 150000);

  R('复利计算器', {
    fields: [N('p','初始本金（元）',10000), N('rate','年化收益率（%）',8), N('years','投资年限（年）',20), N('add','每年追加投入（元）',0), N('freq','每年复利次数',1)], live:true,
    run: v => {
      const p=Number(v.p)||0, r=(Number(v.rate)||0)/100, n=Number(v.freq)||1, y=Number(v.years)||1, add=Number(v.add)||0;
      const per = r/n, total = p*Math.pow(1+per, n*y) + (per ? add/n*((Math.pow(1+per,n*y)-1)/per) : add*y);
      const principal = p + add*y;
      const rows = Array.from({length:Math.min(y,40)},(_,i)=>{ const k=i+1; const val = p*Math.pow(1+per,n*k)+(per?add/n*((Math.pow(1+per,n*k)-1)/per):add*k); return [k+' 年', T.fmt(principal>k*add?p+add*k:p+add*k,2), T.fmt(val,2), T.fmt(val-(p+add*k),2)]; });
      return [KV([['投入本金合计', T.money(principal)],['期末终值', T.money(total)],['累计收益', T.money(total-principal)],['总收益率', T.fmt((total-principal)/principal*100,2)+'%'],['年化（本金口径）', T.fmt(r*100,2)+'%']],'复利测算'),
        {type:'table',title:'逐年增长明细',head:['年份','累计投入','期末资产','累计收益'],rows}];
    }
  });
  R('单利计算器', {
    fields: [N('p','本金（元）',10000),N('rate','年利率（%）',3),N('years','期限（年）',5)], live:true,
    run: v => { const p=Number(v.p)||0,r=(Number(v.rate)||0)/100,y=Number(v.years)||0,i=p*r*y;
      return KV([['本金',T.money(p)],['利息总额',T.money(i)],['本息合计',T.money(p+i)],['年利息',T.money(p*r)]],'单利计算'); }
  });
  R('分期 IRR 内部收益率计算', {
    fields: [N('amount','实际到手本金（元）',10000),N('pmt','每期还款（元）',950),N('n','期数（月）',12),N('fee','一次性手续费（元）',0)], live:true,
    run: v => {
      const cash = Number(v.amount)||0, pmt = Number(v.pmt)||0, n = Number(v.n)||1, fee = Number(v.fee)||0;
      const npv = rate => { let s = cash - fee; for (let i=1;i<=n;i++) s -= pmt/Math.pow(1+rate,i); return s; };
      let lo=0, hi=5, mid=0;
      for (let i=0;i<200;i++){ mid=(lo+hi)/2; if (npv(mid)>0) lo=mid; else hi=mid; }
      const monthly=(lo+hi)/2, apr=monthly*12*100, eff=(Math.pow(1+monthly,12)-1)*100;
      return KV([['实际到手',T.money(cash-fee)],['总还款额',T.money(pmt*n)],['总利息/费用',T.money(pmt*n-(cash-fee))],
        ['月 IRR',T.fmt(monthly*100,4)+'%'],['名义年化 APR',T.fmt(apr,2)+'%'],['实际年化 IRR（复利）',T.fmt(eff,2)+'%']],'分期真实利率');
    }
  });
  R('折旧计算', {
    fields: [N('cost','资产原值（元）',100000),N('salvage','预计净残值（元）',5000),N('years','折旧年限（年）',5),S('mode','折旧方法',[['straight','直线法（平均年限法）'],['ddb','双倍余额递减法'],['syd','年数总和法']],'straight')], live:true,
    run: v => {
      const c=Number(v.cost)||0,s=Number(v.salvage)||0,y=Math.max(1,Math.round(Number(v.years)||1)), dep=c-s, rows=[];
      let remain=c, acc=0;
      for(let i=1;i<=y;i++){
        let d;
        if(v.mode==='straight') d=dep/y;
        else if(v.mode==='syd') d=dep*(y-i+1)*2/(y*(y+1));
        else { d = i===y ? remain-s : Math.min(remain*(2/y), remain-s); }
        d=Math.max(0,d); acc+=d; remain-=d;
        rows.push([i,T.fmt(d,2),T.fmt(acc,2),T.fmt(remain,2)]);
      }
      return [KV([['应计折旧总额',T.money(dep)],['年均折旧额',T.money(dep/y)],['折旧方法',v.mode==='straight'?'直线法':v.mode==='ddb'?'双倍余额递减法':'年数总和法']],'折旧测算'),
        {type:'table',title:'逐年折旧明细',head:['年份','本年折旧(元)','累计折旧(元)','账面净值(元)'],rows}];
    }
  });
  R('增值税计算器', {
    fields: [N('v','金额',10000),N('rate','税率（%）',13),S('mode','金额类型',[['excl','不含税价 → 求价税合计'],['incl','价税合计 → 求不含税价']],'excl')], live:true,
    run: v => { const x=Number(v.v)||0,r=(Number(v.rate)||0)/100;
      const net=v.mode==='excl'?x:x/(1+r), tax=net*r, gross=net+tax;
      return KV([['不含税价',T.money(net)],['增值税额',T.money(tax)],['价税合计',T.money(gross)],['适用税率',T.fmt(v.rate,2)+'%']],'增值税测算'); }
  });
  R('毛利率计算', { fields:[N('revenue','销售收入（元）',100000),N('cost','销售成本（元）',60000)],live:true,
    run:v=>{const a=Number(v.revenue)||0,b=Number(v.cost)||0;return KV([['毛利额',T.money(a-b)],['毛利率',T.fmt((a-b)/a*100,2)+'%'],['成本率',T.fmt(b/a*100,2)+'%'],['加价率（成本口径）',T.fmt((a-b)/b*100,2)+'%']],'毛利测算');} });
  R('利润率计算', { fields:[N('revenue','营业收入（元）',200000),N('cost','营业成本（元）',120000),N('expense','期间费用（元）',30000),N('tax','税费及其他（元）',10000)],live:true,
    run:v=>{const a=Number(v.revenue)||0,p=a-(Number(v.cost)||0)-(Number(v.expense)||0)-(Number(v.tax)||0),g=a-(Number(v.cost)||0);
      return KV([['毛利润',T.money(g)],['毛利率',T.fmt(g/a*100,2)+'%'],['净利润',T.money(p)],['净利率',T.fmt(p/a*100,2)+'%'],['盈亏平衡点营收（按当前成本率）',T.money(((Number(v.expense)||0)+(Number(v.tax)||0))/(g/a))]],'利润测算');} });
  R('投资回本周期计算', { fields:[N('invest','初始投资（元）',100000),N('income','每期净现金流（元）',8000),S('period','周期单位',[['月','月'],['季度','季度'],['年','年']],'月'),N('growth','每期现金流增长率（%）',0)],live:true,
    run:v=>{const inv=Number(v.invest)||0,c=Number(v.income)||0,g=(Number(v.growth)||0)/100;
      if(c<=0) throw new Error('每期净现金流需大于 0');
      let acc=0,n=0,rows=[];
      while(acc<inv && n<600){n++;const cf=c*Math.pow(1+g,n-1);acc+=cf;rows.push([n,T.fmt(cf,2),T.fmt(acc,2)]);}
      return [KV([['初始投资',T.money(inv)],['回本期数',n+' '+v.period],['折合年数',T.fmt(v.period==='月'?n/12:v.period==='季度'?n/4:n,2)+' 年'],['简单回本期（不增长）',T.fmt(inv/c,1)+' '+v.period]],'回本周期'),
        {type:'table',title:'现金流累计（前 24 期）',head:['期数','当期现金流','累计现金流'],rows:rows.slice(0,24)}];} });
  R('汇率换算器', {
    fields:[N('v','金额',100),S('from','原始币种',['CNY','USD','EUR','JPY','GBP','HKD','KRW','AUD','CAD','SGD','TWD','THB'],'USD'),S('to','目标币种',['CNY','USD','EUR','JPY','GBP','HKD','KRW','AUD','CAD','SGD','TWD','THB'],'CNY')],live:true,
    run:v=>{const rate={CNY:1,USD:7.12,EUR:7.75,JPY:.047,GBP:9.12,HKD:.91,KRW:.0052,AUD:4.68,CAD:5.12,SGD:5.33,TWD:.22,THB:.20};
      const r=rate[v.from]/rate[v.to], val=(Number(v.v)||0)*r;
      return [KV([['换算金额',T.fmt(val,4)+' '+v.to],['参考汇率',`1 ${v.from} ≈ ${T.fmt(r,6)} ${v.to}`],['反向汇率',`1 ${v.to} ≈ ${T.fmt(1/r,6)} ${v.from}`]],'汇率换算'),
        {type:'note',kind:'warn',value:'汇率为内置静态参考值（非实时行情），仅用于估算；实际交易请以银行/结算机构牌价为准。'}];} });
  R('定投收益计算器', { fields:[N('monthly','每期定投金额（元）',1000),N('rate','预期年化收益率（%）',8),N('years','定投年限（年）',10),S('freq','定投频率',[['12','每月'],['4','每季度'],['1','每年']],'12')],live:true,
    run:v=>{const m=Number(v.monthly)||0,r=(Number(v.rate)||0)/100,n=Number(v.freq)||12,y=Number(v.years)||1,per=r/n,N=n*y;
      const fv=per?m*((Math.pow(1+per,N)-1)/per)*(1+per):m*N, principal=m*N;
      const rows=Array.from({length:Math.min(Math.ceil(y),30)},(_,i)=>{const k=i+1,cnt=n*k,vv=per?m*((Math.pow(1+per,cnt)-1)/per)*(1+per):m*cnt;return[k+' 年',T.fmt(m*cnt,2),T.fmt(vv,2),T.fmt(vv-m*cnt,2)];});
      return [KV([['累计投入',T.money(principal)],['期末市值',T.money(fv)],['预期收益',T.money(fv-principal)],['总收益率',T.fmt((fv-principal)/principal*100,2)+'%']],'定投测算'),
        {type:'table',title:'逐年资产变化',head:['年份','累计投入','期末市值','累计收益'],rows}];} });
  R('房租摊销计算', { fields:[N('rent','月租金（元）',3000),N('days','当月天数',30),N('used','实际使用天数',15),N('deposit','押金 / 其他费用（元）',0)],live:true,
    run:v=>{const daily=(Number(v.rent)||0)/(Number(v.days)||30),amt=daily*(Number(v.used)||0);
      return KV([['日租金',T.money(daily)],['按天摊销金额',T.money(amt)],['含押金总支出',T.money(amt+(Number(v.deposit)||0))],['整月租金',T.money(v.rent)]],'租金摊销');} });
  R('印花税计算', { fields:[N('amount','合同金额（元）',100000),S('type','合同类型',[['.001','借款合同 0.1‰'],['.0003','买卖合同 / 建设工程 0.3‰'],['.0005','产权转移书据 0.5‰'],['.001','租赁合同 1‰'],['.0003','技术合同 0.3‰'],['.00025','证券交易 0.25‰（卖出方）'],['5','权利许可证照 5 元/件']],'.0003')],live:true,
    run:v=>{const a=Number(v.amount)||0,r=Number(v.type);
      const tax = v.type==='5' ? 5 : a*r;
      return [KV([['计税依据',T.money(a)],['适用税率/标准',v.type==='5'?'按件 5 元':T.fmt(r*1000,3)+'‰'],['应纳印花税',T.money(Math.max(0,tax))],['备注','应纳税额不足 1 角免征；实际以现行《印花税法》税目税率表为准']],'印花税测算'),
        {type:'note',value:'小规模纳税人、小微企业等可能享受减半征收优惠，此处按法定税率计算。'}];} });
  R('预算分摊计算器', { fields:[N('total','总预算（元）',100000),S('mode','分摊方式',[['weight','按权重分摊'],['equal','平均分摊']],'weight'),X('items','分摊项（每行：名称,权重 或 名称）','研发,5\n市场,3\n运营,2\n行政,1')],live:true,
    run:v=>{const lines=String(v.items).split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{const [n,w]=s.split(/[,，]/).map(x=>x.trim());return[n,Number(w)||1];});
      if(!lines.length) throw new Error('请填写分摊项');
      const sum=lines.reduce((a,b)=>a+(v.mode==='equal'?1:b[1]),0),total=Number(v.total)||0;
      const rows=lines.map(([n,w])=>[n,v.mode==='equal'?1:w,T.fmt((v.mode==='equal'?1:w)/sum*100,2)+'%',T.fmt(total*(v.mode==='equal'?1:w)/sum,2)]);
      return {type:'table',title:'预算分摊明细（总预算 '+T.money(total)+'）',head:['项目','权重','占比','分摊金额(元)'],rows};} });
  R('补贴个税测算', { fields:[N('salary','税前月薪（元）',15000),N('deduct','五险一金及专项附加扣除（元/月）',4250),N('subsidy','补贴 / 奖金金额（元）',10000),S('mode','计税方式',[['merge','并入当月工资计税'],['single','按全年一次性奖金单独计税']],'merge')],live:true,
    run:v=>{const base=Math.max(0,(Number(v.salary)||0)-5000-(Number(v.deduct)||0)),s=Number(v.subsidy)||0;
      let tax;
      if(v.mode==='single'){const b=[[3000,.03,0],[12000,.1,210],[25000,.2,1410],[35000,.25,2660],[55000,.3,4410],[80000,.35,7160],[Infinity,.45,15160]].find(x=>s<=x[0]);tax=s*b[1]-b[2];}
      else tax=annualTax((base+s)*12)-annualTax(base*12);
      return KV([['补贴 / 奖金金额',T.money(s)],['当月应纳税所得额',T.money(base)],['预计增加个税',T.money(Math.max(0,tax))],['税后实得',T.money(s-Math.max(0,tax))],['计税方式',v.mode==='single'?'全年一次性奖金单独计税':'并入综合所得']],'补贴计税测算');} });
  R('成本分摊计算器', { fields:[N('total','共同成本总额（元）',12000),X('items','分摊对象（每行：名称,分摊基数）','A部门,40\nB部门,35\nC部门,25')],live:true,
    run:v=>{const lines=String(v.items).split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{const p=s.split(/[,，]/);return[p[0],Number(p[1])||0];});
      const sum=lines.reduce((a,b)=>a+b[1],0); if(!sum) throw new Error('分摊基数合计不能为 0');
      return {type:'table',title:'成本分摊明细',head:['对象','分摊基数','占比','分摊成本(元)','单位基数成本'],rows:lines.map(([n,b])=>[n,b,T.fmt(b/sum*100,2)+'%',T.fmt((Number(v.total)||0)*b/sum,2),T.fmt((Number(v.total)||0)/sum,4)])};} });
  R('折扣计算器', { fields:[N('price','原价（元）',299),S('mode','优惠方式',[['rate','折扣率'],['cut','满减'],['coupon','立减金额']],'rate'),N('v1','折扣数（如 8.5 折）或满减门槛',8.5),N('v2','减免金额（满减/立减时用）',50),N('qty','购买数量',1)],live:true,
    run:v=>{const p=Number(v.price)||0,q=Number(v.qty)||1,orig=p*q;let final=orig,label='';
      if(v.mode==='rate'){final=orig*(Number(v.v1)||0)/10;label=T.fmt(v.v1,2)+' 折';}
      else if(v.mode==='cut'){const times=Number(v.v1)?Math.floor(orig/(Number(v.v1))):0;final=orig-times*(Number(v.v2)||0);label=`满 ${v.v1} 减 ${v.v2}（触发 ${times} 次）`;}
      else {final=orig-(Number(v.v2)||0);label='立减 '+v.v2+' 元';}
      final=Math.max(0,final);
      return KV([['原价合计',T.money(orig)],['优惠方式',label],['优惠金额',T.money(orig-final)],['到手价',T.money(final)],['单件到手价',T.money(final/q)],['实际折扣',T.fmt(final/orig*10,2)+' 折']],'折扣测算');} });
  R('利息计算器', { fields:[N('p','本金（元）',50000),N('rate','年利率（%）',2.5),N('days','计息天数',365),S('basis','计息基础',[['365','365 天'],['360','360 天（银行惯例）']],'365')],live:true,
    run:v=>{const p=Number(v.p)||0,r=(Number(v.rate)||0)/100,d=Number(v.days)||0,b=Number(v.basis)||365,i=p*r*d/b;
      return KV([['本金',T.money(p)],['日利率',T.fmt(r/b*100,6)+'%'],['日利息',T.money(p*r/b)],['利息总额',T.money(i)],['本息合计',T.money(p+i)]],'利息计算');} });
  R('台账金额汇总', { fields:[X('rows','金额台账（每行：名称,金额；支持正负）','收入-项目A,12000\n收入-项目B,8500\n支出-采购,-4200\n支出-差旅,-980.5'),C('group','按前缀分组汇总',true,'按「-」前的前缀分组')],live:true,
    run:v=>{const lines=String(v.rows).split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{const i=s.lastIndexOf(','),j=s.lastIndexOf('，');const k=Math.max(i,j);return[s.slice(0,k).trim(),Number(s.slice(k+1))||0];});
      const total=lines.reduce((a,b)=>a+b[1],0),groups={};
      lines.forEach(([n,a])=>{const g=v.group&&n.includes('-')?n.split('-')[0]:'全部';groups[g]=(groups[g]||0)+a;});
      const rows=lines.map(([n,a],i)=>[i+1,n,T.fmt(a,2),a>=0?'收入':'支出']);
      rows.push(['','合计',T.fmt(total,2),total>=0?'结余为正':'结余为负']);
      return [KV([['记录条数',lines.length],['收入合计',T.money(lines.filter(x=>x[1]>0).reduce((a,b)=>a+b[1],0))],['支出合计',T.money(Math.abs(lines.filter(x=>x[1]<0).reduce((a,b)=>a+b[1],0)))],['净结余',T.money(total)],['分组汇总',Object.keys(groups).map(k=>k+': '+T.money(groups[k])).join('；')]],'台账汇总'),
        {type:'table',title:'台账明细',head:['序号','项目','金额(元)','方向'],rows}];} });

  /* ======================= 三、法律与劳动权益 ======================= */
  R('劳动合同试用期测算', { fields:[N('months','劳动合同期限（月）',36),S('type','合同类型',[['fixed','固定期限劳动合同'],['task','以完成一定工作任务为期限'],['open','无固定期限']],'fixed'),N('salary','约定月薪（元）',10000)],live:true,
    run:v=>{const m=Number(v.months)||0;let max=0,desc='';
      if(v.type==='fixed'||v.type==='open'){ if(m<3||v.type==='task'){max=0;desc='合同期限不满 3 个月 / 以完成一定工作任务为期限，不得约定试用期';}
        else if(m<12){max=1;desc='合同期限 3 个月以上不满 1 年，试用期不得超过 1 个月';}
        else if(m<36){max=2;desc='合同期限 1 年以上不满 3 年，试用期不得超过 2 个月';}
        else {max=6;desc='3 年以上固定期限或无固定期限，试用期不得超过 6 个月';}}
      else {max=0;desc='以完成一定工作任务为期限的劳动合同，不得约定试用期';}
      return [KV([['合同期限',m+' 个月'],['法定试用期上限',max?max+' 个月':'不得约定试用期'],['法律依据说明',desc],['试用期工资下限',T.money(Math.max((Number(v.salary)||0)*.8,0))+'（不低于本单位同岗位最低档工资或合同约定工资的 80%，且不低于当地最低工资标准）'],['同一用人单位与同一劳动者','只能约定一次试用期']],'试用期测算'),
        {type:'note',value:'依据《劳动合同法》第十九条、第二十条整理，仅供参考，具体争议请咨询专业律师或当地人社部门。'}];} });
  R('经济补偿金计算器', { fields:[N('years','本单位工作年限（年）',3.5),N('salary','离职前 12 个月平均工资（元/月）',12000),N('localAvg','当地上年度职工月平均工资（元）',9000),S('type','补偿口径',[['N','N（协商解除 / 法定情形）'],['N1','N+1（未提前 30 天通知的代通知金）'],['2N','2N（违法解除赔偿金）']],'N')],live:true,
    run:v=>{const y=Number(v.years)||0,s=Number(v.salary)||0,cap=(Number(v.localAvg)||0)*3;
      const effSalary=cap>0&&s>cap?cap:s;let yN=Math.floor(y)+(y%1>=.5?1:y%1>0?.5:0);
      if(effSalary===cap&&cap>0&&yN>12)yN=12;
      const n=yN*effSalary;
      const base=v.type==='2N'?n*2:v.type==='N1'?n+s:n;
      return [KV([['工作年限',y+' 年'],['折算补偿月数',yN+' 个月'],['月工资基数',T.money(s)],['是否触及 3 倍社平封顶',s>cap&&cap>0?'是，按 '+T.money(cap)+' 计':'否'],
        ['补偿口径',v.type],['N 金额',T.money(n)],['应付总额',T.money(base)]],'经济补偿金测算'),
        {type:'note',value:'依据《劳动合同法》第四十七条、第八十七条整理：每满 1 年支付 1 个月工资，6 个月以上不满 1 年按 1 年计，不满 6 个月支付半个月；月工资高于当地社平 3 倍的按 3 倍封顶且年限最多 12 年。N+1 中的「+1」为代通知金，按上月工资计算。'}];} });
  R('加班工资计算器', { fields:[N('salary','月工资基数（元）',10000),N('wd','工作日加班小时数',10),N('we','休息日加班小时数',8),N('hd','法定节假日加班小时数',4),C('noRest','休息日已安排补休',false,'休息日已补休')],live:true,
    run:v=>{const s=Number(v.salary)||0,h=s/21.75/8;
      const a=h*(Number(v.wd)||0)*1.5,b=v.noRest?0:h*(Number(v.we)||0)*2,c=h*(Number(v.hd)||0)*3;
      return [KV([['日工资',T.money(s/21.75)],['小时工资',T.money(h)],['工作日加班 1.5 倍',T.money(a)],['休息日加班 2 倍',T.money(b)],['法定节假日加班 3 倍',T.money(c)],['加班工资合计',T.money(a+b+c)]],'加班工资测算'),
        {type:'note',value:'月计薪天数为 21.75 天。休息日安排补休的可以不支付加班费；法定节假日加班不得以补休替代。'}];} });
  R('年假天数计算器', { fields:[N('totalYears','累计工作年限（年）',6),N('thisYear','本年度已休年假（天）',2),N('joinMonth','本年入职月份（在职不满一年填，1-12）',1),C('fullYear','本年度全年在职',true,'全年在职'),N('salary','月工资（用于未休折算，元）',10000)],live:true,
    run:v=>{const y=Number(v.totalYears)||0;let legal=y<1?0:y<10?5:y<20?10:15;
      let entitled=legal;
      if(!v.fullYear){const rest=12-(Number(v.joinMonth)||1)+1;entitled=Math.floor(legal*rest/12*2)/2;}
      const rest=Math.max(0,entitled-(Number(v.thisYear)||0)),daily=(Number(v.salary)||0)/21.75;
      return [KV([['累计工作年限',y+' 年'],['法定年休假天数',legal+' 天'],['本年度应休',entitled+' 天'],['已休',(Number(v.thisYear)||0)+' 天'],['剩余可休',rest+' 天'],
        ['日工资（21.75 天口径）',T.money(daily)],['未休年假折算工资（300% 口径）',T.money(rest*daily*3)]],'年休假测算'),
        {type:'note',value:'依据《职工带薪年休假条例》：累计工作满 1 年不满 10 年 5 天，满 10 年不满 20 年 10 天，满 20 年 15 天；未休年假按日工资收入的 300% 支付（其中含正常工资）。'}];} });
  R('工伤赔偿测算工具', { fields:[N('level','伤残等级（1-10）',9),N('salary','本人工资（元/月）',8000),N('months','停工留薪期（月）',6),N('medical','医疗费及其他实际支出（元）',15000)],live:true,
    run:v=>{const lv=T.clamp(Math.round(Number(v.level)||10),1,10),s=Number(v.salary)||0;
      const oneOff={1:27,2:25,3:23,4:21,5:18,6:16,7:13,8:11,9:9,10:7}[lv];
      const monthly={1:.9,2:.85,3:.8,4:.75,5:.7,6:.6}[lv]||0;
      const rows=[['一次性伤残补助金',T.money(s*oneOff),oneOff+' 个月本人工资'],['停工留薪期工资',T.money(s*(Number(v.months)||0)),'原工资福利待遇不变'],['医疗费及实际支出',T.money(v.medical),'凭票据实报销']];
      if(monthly)rows.push(['伤残津贴（按月）',T.money(s*monthly),'1-6 级保留劳动关系按月发放']);
      if(lv>=5&&lv<=10)rows.push(['一次性工伤医疗/就业补助金','按各省标准','解除/终止劳动关系时由当地规定']);
      return [KV([['伤残等级',lv+' 级'],['本人工资',T.money(s)],['补助金计发月数',oneOff+' 个月'],['以上可测算项目合计',T.money(s*oneOff+s*(Number(v.months)||0)+(Number(v.medical)||0))]],'工伤待遇参考测算'),
        {type:'table',title:'待遇明细',head:['项目','金额 / 标准','说明'],rows},
        {type:'note',kind:'warn',value:'各省一次性工伤医疗补助金、伤残就业补助金标准差异较大，工亡补助金、护理费、伙食补助等未纳入，本结果仅供粗略参考。'}];} });

  function docTool(name, fields, build) {
    R(name, { fields, run: v => {
      const text = build(v);
      return [{type:'text',value:text,title:'生成文本 · 可复制或下载 .txt',download:'document.txt'},
        {type:'note',value:'模板为通用参考文本，涉及法律效力的文件建议由专业人士审阅后再签署。'}];
    }});
  }
  docTool('离职交接清单模板生成',
    [I('name','员工姓名','张三'),I('dept','部门 / 岗位','技术部 / 前端工程师'),I('date','离职日期','2026-12-01'),I('handover','接手人','李四')],
    v=>`离职工作交接清单\n\n员工姓名：${v.name}\n部门 / 岗位：${v.dept}\n离职日期：${v.date}\n接手人：${v.handover}\n\n一、工作事项交接\n  □ 在研项目进度、文档与代码仓库权限\n  □ 需求 / 缺陷 / 任务清单及当前状态说明\n  □ 客户、供应商及内部对接人联系方式\n  □ 周期性工作（周报、例会、定时任务）说明\n\n二、资料与账号交接\n  □ 业务文档、设计稿、合同、报表归档\n  □ 企业邮箱、IM、代码仓库、后台系统账号移交 / 注销\n  □ 密钥、证书、令牌等敏感凭据移交并重置\n\n三、资产归还\n  □ 笔记本电脑 / 显示器 / 门禁卡 / 工牌\n  □ 办公钥匙、U 盘、移动硬盘等\n  □ 备用金、借款、未报销单据结清\n\n四、财务与人事\n  □ 当月工资、加班费、未休年假折算确认\n  □ 社保、公积金停缴月份确认\n  □ 竞业限制 / 保密义务提示\n\n移交人签字：____________    接手人签字：____________\n部门负责人：____________    人事确认：____________\n日期：______年____月____日`);
  docTool('借条规范文本生成器',
    [I('borrower','借款人姓名 / 身份证号','张三 / 4403********1234'),I('lender','出借人姓名','李四'),N('amount','借款金额（元）',20000),I('purpose','借款用途','资金周转'),I('date','借款日期','2026-11-14'),I('due','还款日期','2027-05-14'),N('rate','年利率（%，0 表示无息）',0)],
    v=>`借  条\n\n借款人：${v.borrower}\n出借人：${v.lender}\n\n今因${v.purpose}，借款人向出借人借到人民币（大写）『${rmbUpper(v.amount)}』（小写 ¥${T.fmt(v.amount,2)} 元）。\n借款日期：${v.date}；约定还款日期：${v.due}。\n${Number(v.rate)>0?`借款年利率：${T.fmt(v.rate,2)}%（不超过合同成立时一年期 LPR 的四倍）。`:'本借款为无息借款。'}\n\n双方约定：\n1. 出借人已通过银行转账方式全额交付上述款项，借款人确认已收到。\n2. 借款人应于约定日期一次性归还本金${Number(v.rate)>0?'及利息':''}，逾期未还的，出借人有权主张逾期利息及实现债权的合理费用。\n3. 因本借条产生争议，双方同意由出借人所在地有管辖权的人民法院处理。\n4. 本借条一式两份，双方各执一份，自借款人签字（按手印）之日起生效。\n\n借款人（签字 / 捺印）：____________   日期：__________\n出借人（签字）：__________________   日期：__________\n\n附：借款人身份证复印件、转账凭证。`);
  docTool('送达地址确认模板',
    [I('name','当事人姓名 / 名称','张三'),I('id','证件号码 / 统一社会信用代码','4403********1234'),I('addr','送达地址','广东省深圳市南山区××路××号'),I('phone','联系电话','138****0000'),I('email','电子邮箱','example@mail.com')],
    v=>`送达地址确认书\n\n确认人：${v.name}\n证件号码：${v.id}\n\n一、本人确认以下地址为各类法律文书、通知、函件的有效送达地址：\n  送达地址：${v.addr}\n  联系电话：${v.phone}\n  电子邮箱：${v.email}\n\n二、本人确认：上述地址适用于合同履行期间、争议协商阶段以及诉讼 / 仲裁的一审、二审、再审和执行全部程序。\n\n三、若上述地址发生变更，本人应在变更后 3 日内以书面形式通知对方；未及时通知的，按原地址送达即视为有效送达。\n\n四、因地址不准确、拒收、未及时告知变更，导致文书未被实际接收的，文书退回之日或邮寄凭证载明的投寄之日视为送达之日；电子送达以系统显示发送成功之日为准。\n\n确认人（签字 / 盖章）：____________\n日期：______年____月____日`);

  /* ======================= 四、生活与娱乐 ======================= */
  const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  function randomTool(name, fields, fn) {
    R(name, { fields, runLabel: '重新生成', run: v => fn(v) });
  }
  /* 抽取动画：纵向滚动的候选条，最终停在结果上 */
  function rollHTML(pool, final, cls, delay, h, renderItem) {
    const itemH = h || 56;
    const seq = Array.from({ length: 16 }, () => pick(pool.length ? pool : [final]));
    seq.push(final);
    return `<div class="roll-wrap ${cls || ''}"><div class="roll-strip" style="--dist:-${(seq.length - 1) * itemH}px;animation-delay:${delay || 0}s">${seq.map(v => `<div class="roll-item">${renderItem ? renderItem(v) : T.esc(String(v))}</div>`).join('')}</div></div>`;
  }
  function dieHTML(n) {
    const layout = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[n] || [];
    return `<span class="die" aria-label="${n} 点">${Array.from({ length: 9 }, (_, i) => `<i class="${layout.includes(i) ? 'pip' : ''}"></i>`).join('')}</span>`;
  }
  function rollRow(items, pool, cls) {
    return `<div class="roll-row">${items.map((x, i) => `<div class="roll-cell"><div class="roll-cap">${i + 1}</div>${rollHTML(pool, x, cls, i * .07)}</div>`).join('')}</div>`;
  }
  function coinRow(items) {
    return `<div class="coin-row">${items.map((x, i) => `<div class="coin ${x === '正面' ? 'coin-front' : 'coin-back'}" style="animation-delay:${i * .08}s"><span>${x === '正面' ? '正' : '反'}</span></div>`).join('')}</div>`;
  }
  randomTool('随机抽签工具', [X('items','抽签选项（每行一个）','一等奖\n二等奖\n三等奖\n谢谢参与'),N('count','抽取数量',1),C('repeat','允许重复',false,'允许重复抽取')], v=>{
    const list=String(v.items).split('\n').map(s=>s.trim()).filter(Boolean);
    if(!list.length) throw new Error('请填写抽签选项');
    const n=Math.min(Number(v.count)||1, v.repeat?100:list.length);
    const pool=[...list],out=[];
    for(let i=0;i<n;i++){const idx=rnd(0,pool.length-1);out.push(pool[idx]);if(!v.repeat)pool.splice(idx,1);}
    const html = out.length <= 8
      ? rollRow(out, list, 'roll-text')
      : `<div class="pop-in" style="font-size:20px;font-weight:700;text-align:center;padding:18px;color:var(--accent)">${out.map(T.esc).join('　·　')}</div>`;
    return [{type:'html',title:'抽签结果',value:html},KV(out.map((x,i)=>['第 '+(i+1)+' 签',x]))];
  });
  randomTool('随机摇号器', [N('min','最小值',1),N('max','最大值',100),N('count','摇出数量',1),C('repeat','允许重复',false,'允许重复')], v=>{
    const a=Math.ceil(Number(v.min)||0),b=Math.floor(Number(v.max)||100);
    if(b<a) throw new Error('最大值需大于最小值');
    const n=Math.min(Number(v.count)||1,v.repeat?200:b-a+1),out=[],seen=new Set();
    let guard=0;
    while(out.length<n&&guard++<5000){const x=rnd(a,b);if(!v.repeat&&seen.has(x))continue;seen.add(x);out.push(x);}
    const html = out.length <= 12
      ? rollRow(out, Array.from({length: Math.min(60, b - a + 1)}, (_, i) => a + i), '')
      : `<div class="pop-in" style="font-size:20px;font-weight:800;text-align:center;padding:18px;letter-spacing:3px;color:var(--accent)">${out.join('　')}</div>`;
    return [{type:'html',title:'摇号结果',value:html},KV([['范围',a+' ~ '+b],['结果（升序）',[...out].sort((x,y)=>x-y).join(', ')]])];
  });
  randomTool('骰子模拟器', [N('count','骰子个数',2),N('sides','每个骰子的面数',6)], v=>{
    const n=T.clamp(Math.round(Number(v.count)||1),1,20),s=T.clamp(Math.round(Number(v.sides)||6),2,100);
    const out=Array.from({length:n},()=>rnd(1,s));
    const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
    const pool=Array.from({length:s},(_,i)=>i+1);
    return [{type:'html',title:'投掷结果',value:`<div class="roll-row">${out.map((x,i)=>rollHTML(pool,x,'roll-dice',i*.07,64,s<=6?dieHTML:null)).join('')}</div>`},KV([['各骰点数',out.join(' + ')],['点数总和',out.reduce((a,b)=>a+b,0)],['平均值',T.fmt(out.reduce((a,b)=>a+b,0)/n,2)]])];
  });
  randomTool('硬币翻转', [N('count','翻转次数',1)], v=>{
    const n=T.clamp(Math.round(Number(v.count)||1),1,100),out=Array.from({length:n},()=>Math.random()<.5?'正面':'反面');
    const html = out.length <= 20 ? coinRow(out) : `<div class="pop-in" style="font-size:20px;text-align:center;padding:16px">${out.map(x=>x==='正面'?'正':'反').join(' ')}</div>`;
    return [{type:'html',title:'翻转结果',value:html},KV([['结果',out.join('、')],['正面',out.filter(x=>x==='正面').length+' 次'],['反面',out.filter(x=>x==='反面').length+' 次']])];
  });
  randomTool('名字随机抽取', [X('items','名单（每行一个名字）','张三\n李四\n王五\n赵六\n钱七'),N('count','抽取人数',1)], v=>{
    const list=String(v.items).split(/\n/).map(s=>s.trim()).filter(Boolean);
    if(!list.length) throw new Error('请填写名单');
    const shuffled=[...list].sort(()=>Math.random()-.5),out=shuffled.slice(0,Math.min(Number(v.count)||1,list.length));
    const html = out.length <= 8 ? rollRow(out, list, 'roll-text') : `<div class="pop-in" style="font-size:22px;font-weight:700;text-align:center;padding:18px;color:var(--accent)">${out.map(T.esc).join('、')}</div>`;
    return [{type:'html',title:'点名结果',value:html},KV([['名单人数',list.length],['被抽中',out.join('、')]])];
  });

  /* 倒计时 / 秒表：自定义渲染 */
  R('倒计时工具', { render(host, api) {
    host.innerHTML = `<div class="cp-row"><span class="cp-label">目标时间</span><input type="datetime-local" id="cdTarget" style="min-width:230px"><button class="btn btn-primary" id="cdSet">设置目标</button><span class="cp-label">或</span><input type="number" id="cdMin" value="5" min="1" style="width:80px"><span class="cp-label">分钟后</span><button class="btn btn-ghost" id="cdQuick">快速开始</button></div>
      <div class="cp-canvas-wrap" style="padding:30px"><div id="cdShow" style="font-size:clamp(32px,6vw,62px);font-weight:800;letter-spacing:3px;font-variant-numeric:tabular-nums;color:var(--accent)">00 : 00 : 00</div><div id="cdSub" style="color:var(--text-3);font-size:12px;margin-top:8px">设置目标时间后开始倒计时</div></div>`;
    const d=new Date(Date.now()+5*60000);d.setSeconds(0);
    host.querySelector('#cdTarget').value=`${d.getFullYear()}-${T.pad(d.getMonth()+1)}-${T.pad(d.getDate())}T${T.pad(d.getHours())}:${T.pad(d.getMinutes())}`;
    let target=null, timer=null;
    const tick=()=>{const el=host.querySelector('#cdShow'),sub=host.querySelector('#cdSub');if(!el)return;
      if(!target){return;}
      const diff=target-Date.now();
      if(diff<=0){el.textContent='00 : 00 : 00';el.style.color='var(--err)';sub.textContent='⏰ 时间到！';T.toast('倒计时结束');clearInterval(timer);timer=null;return;}
      const s=Math.floor(diff/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;
      el.textContent=`${T.pad(h)} : ${T.pad(m)} : ${T.pad(ss)}`;el.style.color='var(--accent)';
      sub.textContent=`目标：${target.toLocaleString('zh-CN')} · 剩余 ${T.fmt(diff/86400000,2)} 天`;}
    const start=ts=>{target=ts;clearInterval(timer);tick();timer=setInterval(tick,250);};
    host.querySelector('#cdSet').onclick=()=>{const val=host.querySelector('#cdTarget').value;if(!val)return T.toast('请选择目标时间','err');const ts=new Date(val).getTime();if(isNaN(ts))return T.toast('时间格式有误','err');start(ts);T.toast('倒计时已开始');};
    host.querySelector('#cdQuick').onclick=()=>{const min=Number(host.querySelector('#cdMin').value)||5;start(Date.now()+min*60000);T.toast(min+' 分钟倒计时开始');};
    api.onCleanup(()=>clearInterval(timer));
  }});
  R('正计时秒表', { render(host, api) {
    host.innerHTML=`<div class="cp-row"><button class="btn btn-primary" id="swStart">开始</button><button class="btn btn-ghost" id="swLap">计次</button><button class="btn btn-ghost" id="swReset">重置</button></div>
      <div class="cp-canvas-wrap" style="padding:26px"><div id="swShow" style="font-size:clamp(32px,6vw,58px);font-weight:800;font-variant-numeric:tabular-nums;color:var(--accent)">00:00.00</div></div>
      <div id="swLaps" style="max-height:220px;overflow:auto"></div>`;
    let running=false,startTs=0,elapsed=0,timer=null,laps=[],lastLap=0;
    const show=()=>{const e=host.querySelector('#swShow');if(!e)return;const ms=Math.floor(elapsed),m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000),cs=Math.floor(ms%1000/10);e.textContent=`${T.pad(m)}:${T.pad(s)}.${T.pad(cs)}`;};
    const tick=()=>{elapsed=Date.now()-startTs;show();};
    host.querySelector('#swStart').onclick=e=>{running=!running;e.target.textContent=running?'暂停':'继续';e.target.className=running?'btn btn-ghost':'btn btn-primary';
      if(running){startTs=Date.now()-elapsed;timer=setInterval(tick,20);}else{clearInterval(timer);}};
    host.querySelector('#swLap').onclick=()=>{if(!running&&!elapsed)return;const delta=elapsed-lastLap;lastLap=elapsed;laps.push(delta);
      host.querySelector('#swLaps').innerHTML='<div class="kv-grid">'+laps.map((l,i)=>`<div class="kv-k">第 ${i+1} 次</div><div class="kv-v">${T.fmt(l/1000,2)} s　（累计 ${T.fmt(laps.slice(0,i+1).reduce((a,b)=>a+b,0)/1000,2)} s）</div>`).join('')+'</div>';};
    host.querySelector('#swReset').onclick=()=>{running=false;clearInterval(timer);elapsed=0;lastLap=0;laps=[];host.querySelector('#swStart').textContent='开始';host.querySelector('#swStart').className='btn btn-primary';host.querySelector('#swLaps').innerHTML='';show();};
    show();api.onCleanup(()=>clearInterval(timer));
  }});

  const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${T.pad(d.getMonth()+1)}-${T.pad(d.getDate())}`;};
  R('生日倒计时', { fields:[I('birth','出生日期 / 下次生日', '1995-06-15', {type:'date', hint:'填出生年月日即可'}),C('lunar','按农历生日计算',false,'按农历')],live:true,
    run:v=>{const b=new Date(String(v.birth).replace(/-/g,'/'));if(isNaN(b.getTime()))throw new Error('请输入有效日期');
      const now=new Date();now.setHours(0,0,0,0);let next=new Date(now.getFullYear(),b.getMonth(),b.getDate());
      if(next<now)next=new Date(now.getFullYear()+1,b.getMonth(),b.getDate());
      const days=Math.ceil((next-now)/86400000),age=next.getFullYear()-b.getFullYear();
      return [KV([['出生日期',String(v.birth)],['下次生日',next.toLocaleDateString('zh-CN')],['还有',days+' 天'],['届时年龄',age+' 岁'],['已出生',Math.floor((now-b)/86400000)+' 天']],'生日倒计时'),
        {type:'note',value:v.lunar?'农历生日需结合当年农历换算，当前按公历日期计算。':`距离生日还有 ${days} 天，提前准备礼物吧 `}];} });
  R('纪念日计算', { fields:[I('date','起始日期','2020-05-20',{type:'date'}),I('target','目标日期（留空为今天）','',{type:'date'}),C('anniv','显示周年列表',true,'显示未来周年')],live:true,
    run:v=>{const a=new Date(String(v.date).replace(/-/g,'/'));const b=v.target?new Date(String(v.target).replace(/-/g,'/')):new Date();
      if(isNaN(a.getTime())||isNaN(b.getTime()))throw new Error('请输入有效日期');
      a.setHours(0,0,0,0);b.setHours(0,0,0,0);
      const days=Math.round((b-a)/86400000),weeks=Math.floor(Math.abs(days)/7),months=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();
      const rows=[['相隔天数',Math.abs(days)+' 天'],['相隔周数',weeks+' 周又 '+Math.abs(days)%7+' 天'],['相隔月数（自然月）',Math.abs(months)+' 个月'],['相隔年数',T.fmt(Math.abs(days)/365.2425,2)+' 年'],['方向',days>=0?'起始日 → 目标日':'目标日在起始日之前']];
      const annivs=v.anniv?Array.from({length:8},(_,i)=>{const y=a.getFullYear()+i+1;return[y+' 周年',`${y}-${T.pad(a.getMonth()+1)}-${T.pad(a.getDate())}`,'星期'+'日一二三四五六'[new Date(y,a.getMonth(),a.getDate()).getDay()]];}):[];
      return [KV(rows,'纪念日计算'),...(annivs.length?[{type:'table',title:'未来周年日期',head:['周年','日期','星期'],rows:annivs}]:[])];} });
  R('生肖查询', { fields:[I('v','年份或日期','2026',{hint:'如 1990 或 1990-05-20'})],live:true,
    run:v=>{const s=String(v.v).trim();let y;
      if(/^\d{4}$/.test(s))y=Number(s);else{const d=new Date(s.replace(/-/g,'/'));if(isNaN(d.getTime()))throw new Error('请输入年份或日期');y=d.getFullYear();}
      let zodiac='';
      try{ if(window.Lunar){const lunar=window.Lunar.fromYmdHms?window.Lunar.fromDate(new Date(y,5,1)):null;zodiac=lunar?lunar.getYearShengXiao():'';} }catch(e){}
      if(!zodiac){const animals=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];zodiac=animals[((y-4)%12+12)%12];}
      return KV([['输入',s],['公历年份',y],['生肖',zodiac+' 年'],['干支（近似）',(()=>{const g='甲乙丙丁戊己庚辛壬癸',z='子丑寅卯辰巳午未申酉戌亥',i=((y-4)%60+60)%60;return g[i%10]+z[i%12];})()],['本命年',((y-4)%12+12)%12===(((new Date().getFullYear()-4)%12+12)%12)?'是':'否']],'生肖查询');} });
  R('五行八字查询', { fields:[I('date','出生日期','1995-06-15',{type:'date'}),I('time','出生时间','08:30',{type:'time'})],live:true,
    run:v=>{if(!window.Lunar||!window.Solar)throw new Error('农历组件未加载');
      const d=new Date(String(v.date).replace(/-/g,'/')),[hh,mm]=(String(v.time||'08:00')).split(':').map(Number);
      const lunar=window.Lunar.fromDate(new Date(d.getFullYear(),d.getMonth(),d.getDate(),hh||0,mm||0,0));
      const gz=[lunar.getYearInGanZhi(),lunar.getMonthInGanZhi(),lunar.getDayInGanZhi(),lunar.getTimeInGanZhi()];
      const wx={甲乙:'木',丙丁:'火',戊己:'土',庚辛:'金',壬癸:'水',子亥:'水',寅卯:'木',巳午:'火',申酉:'金',辰戌丑未:'土'};
      const counts={金:0,木:0,水:0,火:0,土:0};
      gz.join('').split('').forEach(c=>{if(wx[c])counts[wx[c]]++;});
      return [KV([['公历',`${v.date} ${v.time}`],['农历',lunar.toString()],['年柱',gz[0]],['月柱',gz[1]],['日柱',gz[2]],['时柱',gz[3]],['生肖',lunar.getYearShengXiao()],['五行分布',Object.keys(counts).map(k=>k+counts[k]).join('　')],['日主',gz[2][0]+'（'+(wx[gz[2][0]]||'')+'）']],'四柱八字参考'),
        {type:'note',kind:'warn',value:'八字命理属传统民俗文化，结果仅供娱乐参考，不构成任何人生决策建议。'}];} });
  R('农历公历互转', { fields:[I('date','日期','2026-02-17',{type:'date',hint:'公历→农历填公历日期；农历→公历请把年月日按农历日期填写（按非闰月换算）'}),S('mode','转换方向',[['s2l','公历 → 农历'],['l2s','农历 → 公历']],'s2l')],live:true,
    run:v=>{if(!window.Solar||!window.Lunar)throw new Error('农历组件未加载');
      const d=new Date(String(v.date).replace(/-/g,'/'));
      if(isNaN(d.getTime()))throw new Error('请输入有效日期');
      let rows=[];
      if(v.mode==='s2l'){
        const solar=window.Solar.fromYmd(d.getFullYear(),d.getMonth()+1,d.getDate());
        const l=solar.getLunar();
        const festivals=[].concat(
          typeof l.getFestivals==='function'?l.getFestivals():[],
          typeof l.getOtherFestivals==='function'?l.getOtherFestivals():[],
          typeof solar.getFestivals==='function'?solar.getFestivals():[],
          typeof solar.getOtherFestivals==='function'?solar.getOtherFestivals():[]
        ).filter(Boolean);
        rows=[['公历',`${v.date}`],['农历',l.getYearInChinese()+'年 '+l.getMonthInChinese()+'月'+l.getDayInChinese()],['干支',l.getYearInGanZhi()+'年 '+l.getMonthInGanZhi()+'月 '+l.getDayInGanZhi()+'日'],['生肖',l.getYearShengXiao()],['节气',l.getJieQi()||'—'],['节日',festivals.join('、')||'—']];
      } else {
        /* 农历 → 公历：把输入的年月日按农历解读（默认非闰月） */
        const y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate();
        let l,s;
        try{ l=window.Lunar.fromYmd(y,m,day); s=l.getSolar(); }
        catch(e){ l=window.Lunar.fromDate(d); s=l.getSolar(); }
        const w=new Date(s.getYear(),s.getMonth()-1,s.getDay()).getDay();
        rows=[['输入农历',`${y} 年 ${m} 月 ${day} 日（按非闰月换算）`],['对应公历',s.toYmd()],['星期','星期'+'日一二三四五六'[w]],['干支',l.getYearInGanZhi()],['生肖',l.getYearShengXiao()]];
      }
      return KV(rows,'历法转换');} });
  R('节日倒计时', { fields:[S('target','目标节日',[['newyear','元旦'],['spring','春节'],['qingming','清明节'],['labour','劳动节'],['dragon','端午节'],['mid','中秋节'],['national','国庆节'],['christmas','圣诞节']],'spring')],live:true,
    run:v=>{const y=new Date().getFullYear();
      const fixed={newyear:[[1,1,'元旦']],qingming:[[4,4,'清明节']],labour:[[5,1,'劳动节']],national:[[10,1,'国庆节']],christmas:[[12,25,'圣诞节']]};
      let candidates=[];
      if(fixed[v.target]){[y,y+1].forEach(yr=>fixed[v.target].forEach(([m,d,n])=>candidates.push(new Date(yr,m-1,d))));}
      else{ /* 农历节日：用 lunar.js 推算未来两年 */ const map={spring:[1,1,'春节'],dragon:[5,5,'端午节'],mid:[8,15,'中秋节']};const[lm,ld]=map[v.target];
        for(let yr=y;yr<=y+2;yr++){try{const l=window.Lunar.fromYmd(yr,lm,ld);const s=l.getSolar();candidates.push(new Date(s.getYear(),s.getMonth()-1,s.getDay()));}catch(e){}}
        if(!candidates.length){candidates=[new Date(y,0,1)];}
      }
      const now=new Date();now.setHours(0,0,0,0);
      const next=candidates.map(d=>{d.setHours(0,0,0,0);return d;}).filter(d=>d>=now).sort((a,b)=>a-b)[0]||candidates[0];
      const days=Math.ceil((next-now)/86400000);
      return KV([['节日',({newyear:'元旦',spring:'春节',qingming:'清明节',labour:'劳动节',dragon:'端午节',mid:'中秋节',national:'国庆节',christmas:'圣诞节'})[v.target]],['最近一次',next.toLocaleDateString('zh-CN')],['还有',days+' 天'],['星期','星期'+'日一二三四五六'[next.getDay()]]],'节日倒计时');} });
  R('密码生成器', { fields:[N('len','密码长度',16),C('upper','包含大写字母 A-Z',true,'A-Z'),C('lower','包含小写字母 a-z',true,'a-z'),C('digit','包含数字 0-9',true,'0-9'),C('symbol','包含特殊符号',true,'!@#$…'),C('ambiguous','排除易混淆字符 0O1lI',true,'排除易混淆'),N('count','生成数量',5)],runLabel:'重新生成',
    run:v=>{let chars=(v.upper?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':'')+(v.lower?'abcdefghijklmnopqrstuvwxyz':'')+(v.digit?'0123456789':'')+(v.symbol?'!@#$%^&*()-_=+[]{};:,.?/':'');
      if(v.ambiguous)chars=chars.replace(/[0O1lI]/g,'');
      if(!chars)throw new Error('至少选择一种字符类型');
      const n=T.clamp(Math.round(Number(v.count)||1),1,50),len=T.clamp(Math.round(Number(v.len)||16),4,128);
      const arr=crypto.getRandomValues(new Uint32Array(len*n));
      const list=Array.from({length:n},(_,i)=>Array.from({length:len},(_,j)=>chars[arr[i*len+j]%chars.length]).join(''));
      return [{type:'text',value:list.join('\n'),title:'生成的密码 · 建议保存到密码管理器',download:'passwords.txt'},
        KV([['字符空间',chars.length+' 种字符'],['理论组合数',len+' 位 ≈ '+(Math.log10(chars.length)*len).toFixed(1)+' (log10)'],['生成数量',n]],'强度参考'),
        {type:'note',value:'密码由浏览器 crypto.getRandomValues 生成，不会上传或记录。'}];} });
  R('密码强度检测', { fields:[I('pwd','待检测密码','',{hint:'仅在本机计算，不会上传'})],live:true,
    run:v=>{const s=String(v.pwd||'');
      if(!s)return [{type:'html',title:'等待输入',value:'<div style="padding:18px 16px;border:1px dashed var(--line-strong);border-radius:8px;color:var(--text-3);font-size:12.5px;line-height:1.9">在上方输入密码后，这里会显示强度条、熵值估算与 8 项检查结果。密码不会离开本机，也不会被记录。</div>'},
        {type:'note',value:'建议长度 12 位以上，混合大小写、数字与符号，并避免在多个账号间复用同一密码。'}];
      const checks=[['长度 ≥ 8',s.length>=8],['长度 ≥ 12',s.length>=12],['含小写字母',/[a-z]/.test(s)],['含大写字母',/[A-Z]/.test(s)],['含数字',/\d/.test(s)],['含特殊符号',/[^A-Za-z0-9]/.test(s)],['无连续重复',!/(.)\1{2,}/.test(s)],['无常见弱密码',!/^(123456|password|qwerty|admin|111111|abc123|888888)$/i.test(s)]];
      const pool=(/[a-z]/.test(s)?26:0)+(/[A-Z]/.test(s)?26:0)+(/\d/.test(s)?10:0)+(/[^A-Za-z0-9]/.test(s)?33:0)||1;
      const entropy=s.length*Math.log2(pool),score=checks.filter(c=>c[1]).length;
      const level=entropy<28?'很弱':entropy<40?'弱':entropy<60?'中等':entropy<80?'强':'很强';
      const color=entropy<28?'var(--err)':entropy<40?'var(--warn)':entropy<60?'var(--accent)':'var(--good)';
      return [{type:'html',title:'强度评估',value:`<div style="display:flex;align-items:center;gap:16px"><div style="font-size:30px;font-weight:800;color:${color}">${level}</div><div style="flex:1"><div style="height:8px;background:var(--surface-3);border-radius:9px;overflow:hidden"><div style="height:100%;width:${Math.min(100,entropy/100*100)}%;background:${color};transition:.3s"></div></div><div style="font-size:11px;color:var(--text-3);margin-top:6px">熵值约 ${T.fmt(entropy,1)} bit · 字符集 ${pool} 种</div></div></div>`},
        KV(checks.map(([k,ok])=>[k,ok?'通过':'未通过']).concat([['估算暴力破解组合数','2^'+Math.round(entropy)]],),'检查项'),
        {type:'note',value:'强度估算基于字符空间与长度，未考虑字典攻击与个人信息泄露，请勿在真实账号间复用密码。'}];} });
  R('亲戚称谓计算器', { fields:[I('chain','关系链（用「的」连接）','爸爸的妈妈的哥哥'),S('mode','称呼方视角',[['self','我称呼对方'],['other','对方称呼我']],'self')],live:true,
    run:v=>{const s=String(v.chain||'').replace(/的/g,'');
      const map={'爸爸':'父亲','妈妈':'母亲','哥哥':'兄','弟弟':'弟','姐姐':'姐','妹妹':'妹','爷爷':'祖父','奶奶':'祖母','外公':'外祖父','外婆':'外祖母','老公':'夫','老婆':'妻','儿子':'子','女儿':'女'};
      const rules=[[/爸爸的爸爸|爷爷/,'爷爷 / 祖父'],[/爸爸的妈妈|奶奶/,'奶奶 / 祖母'],[/妈妈的爸爸|外公/,'外公 / 外祖父'],[/妈妈的妈妈|外婆/,'外婆 / 外祖母'],
        [/爸爸的哥哥/,'伯父'],[/爸爸的弟弟/,'叔叔'],[/爸爸的姐姐|爸爸的妹妹/,'姑姑'],[/妈妈的哥哥|妈妈的弟弟/,'舅舅'],[/妈妈的姐姐|妈妈的妹妹/,'姨妈'],
        [/哥哥的儿子|弟弟的儿子/,'侄子'],[/哥哥的女儿|弟弟的女儿/,'侄女'],[/姐姐的儿子|妹妹的儿子/,'外甥'],[/姐姐的女儿|妹妹的女儿/,'外甥女'],
        [/伯父的儿子|叔叔的儿子|姑姑的儿子|舅舅的儿子|姨妈的儿子/,'表兄弟 / 堂兄弟'],[/爸爸的哥哥的老婆|伯母/,'伯母'],[/爸爸的弟弟的老婆/,'婶婶'],[/妈妈的哥哥的老婆|妈妈的弟弟的老婆/,'舅妈'],[/老婆的妈妈/,'岳母'],[/老婆的爸爸/,'岳父'],[/老公的妈妈/,'婆婆'],[/老公的爸爸/,'公公']];
      const normalized=Object.keys(map).reduce((a,k)=>a.replace(new RegExp(k,'g'),map[k]),s);
      let found='';for(const [re,r] of rules)if(re.test(s)||re.test(normalized)){found=r;break;}
      return [KV([['输入关系链',v.chain],['规范化',normalized],['建议称谓',found||'关系较复杂，建议按「父系称堂、母系称表」逐层拆分'],['视角',v.mode==='self'?'我称呼对方':'对方称呼我（需反向推算）']],'称谓推算'),
        {type:'note',value:'称谓各地风俗差异很大（如「姥爷 / 外公」「大伯 / 大爷」），这里给出通用书面称谓。'}];} });
  R('配色方案生成', { fields:[I('base','基础色','#6366f1'),S('mode','配色模式',[['complementary','互补色'],['analogous','邻近色'],['triadic','三角色'],['split','分裂互补'],['mono','单色阶']],'analogous'),N('count','色块数量',5)],live:true,
    run:v=>{const [r,g,b]=hex2rgb(v.base),[h,s,l]=rgb2hsl(r,g,b),n=T.clamp(Math.round(Number(v.count)||5),2,12);
      const offs={complementary:[0,180],analogous:[-60,-30,0,30,60],triadic:[0,120,240],split:[0,150,210],mono:[]}[v.mode];
      const colors=Array.from({length:n},(_,i)=>{
        if(v.mode==='mono')return [h,s,Math.round(T.clamp(12+i*(76/(n-1)),0,96))];
        return [(h+offs[i%offs.length]+360)%360,T.clamp(s+(i>offs.length-1?-8:0),10,100),Math.round(T.clamp(l+(i>offs.length-1?(i%2?12:-12):0),12,92))];
      });
      const hsl2hex=(hh,ss,ll)=>{ss/=100;ll/=100;const c=(1-Math.abs(2*ll-1))*ss,x=c*(1-Math.abs((hh/60)%2-1)),m=ll-c/2;const seg=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(hh/60)%6]||[0,0,0];return '#'+seg.map(z=>Math.round((z+m)*255).toString(16).padStart(2,'0')).join('');};
      const hexes=colors.map(c=>hsl2hex(...c).toUpperCase());
      const swatches=`<div style="display:flex;flex-wrap:wrap;gap:8px">${hexes.map(x=>`<div style="width:96px;border:1px solid var(--line);border-radius:9px;overflow:hidden"><div style="height:66px;background:${x}"></div><div style="padding:6px;font-size:10.5px;font-family:monospace;text-align:center">${x}</div></div>`).join('')}</div>`;
      return [{type:'html',title:'配色色卡',value:swatches},{type:'text',value:`:root {\n${hexes.map((x,i)=>`  --color-${i+1}: ${x};`).join('\n')}\n}`,title:'CSS 变量代码',download:'palette.css'}];} });
  randomTool('九宫格随机选择', [X('items','九个选项（每行一个，不足 9 个自动补位）','吃饭\n看电影\n散步\n打游戏\n看书\n运动\n做饭\n睡觉\n发呆')], v=>{
    const list=String(v.items).split('\n').map(s=>s.trim()).filter(Boolean);while(list.length<9)list.push('选项 '+(list.length+1));
    const chosen=rnd(0,8);
    const gridHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;max-width:400px;margin:0 auto">${list.slice(0,9).map((x,i)=>`<div class="${i===chosen?'chosen-cell':''}" style="padding:16px 6px;text-align:center;border-radius:9px;font-size:12px;${i===chosen?'background:var(--accent);color:var(--on-accent);font-weight:700;box-shadow:0 6px 20px var(--accent-soft)':'background:var(--surface-2);border:1px solid var(--line)'}">${T.esc(x)}</div>`).join('')}</div>`;
    return [{type:'html',title:'选中：'+list[chosen],value:gridHTML}];
  });
  randomTool('真心话大冒险', [S('mode','题目类型',[['all','随机混合'],['truth','真心话'],['dare','大冒险']],'all')], v=>{
    const truth=['说出你最近一次撒谎的内容','你手机里最后一条聊天记录是和谁？','描述你最尴尬的一次经历','你最想对在场某个人说的一句话','你偷偷坚持最久的习惯是什么？','如果可以重来，你会改变哪个决定？','你最害怕的东西是什么？','说出一个从没告诉过别人的小秘密'];
    const dare=['用方言念一段绕口令','给通讯录第 5 个人发一句夸奖','模仿一种动物直到下一轮','原地做 10 个深蹲','用三种语言说「你好」','唱一首歌的副歌部分','闭眼单脚站立 20 秒','给身边的人一个真诚的赞美'];
    const isTruth=v.mode==='truth'||(v.mode==='all'&&Math.random()<.5);
    const q=isTruth?pick(truth):pick(dare);
    return [{type:'html',title:isTruth?'真心话':'大冒险',value:`<div class="flip-in" style="font-size:20px;text-align:center;padding:26px;font-weight:650;line-height:1.8">${T.esc(q)}</div>`}];
  });
  randomTool('随机抉择器', [X('items','候选选项（每行一个）','方案 A：稳妥推进\n方案 B：大胆尝试\n方案 C：再观望一下')], v=>{
    const list=String(v.items).split('\n').map(s=>s.trim()).filter(Boolean);if(!list.length)throw new Error('请填写至少两个选项');
    const winner=pick(list);
    return [{type:'html',title:'帮你决定了',value:`<div class="reveal-pop" style="text-align:center;padding:20px"><div style="font-size:12px;color:var(--text-3);margin-bottom:10px">从 ${list.length} 个选项中随机选中</div><div style="font-size:24px;font-weight:800;color:var(--accent)">${T.esc(winner)}</div></div>`},
      {type:'table',title:'全部选项',head:['选项','结果'],rows:list.map(x=>[x,x===winner?'选中':'—'])}];
  });
  R('许愿转盘', { render(host, api) {
    host.innerHTML=`<div class="cp-row"><span class="cp-label">转盘选项（每行一个）</span><button class="btn btn-primary" id="spinGo">开始转动</button></div>
      <textarea id="spinItems" class="cp-row" style="width:100%;min-height:76px;background:var(--bg-soft);border:1px solid var(--line);border-radius:8px;padding:9px;color:var(--text)">奶茶\n火锅\n看电影\n宅家\n出游\n早睡</textarea>
      <div class="cp-canvas-wrap"><canvas id="spinCanvas" width="420" height="420"></canvas><div style="margin-top:10px;font-size:14px;font-weight:700;color:var(--accent)" id="spinResult">点击「开始转动」</div></div>`;
    const cv=host.querySelector('#spinCanvas'),ctx=cv.getContext('2d'),colors=['#7c6cff','#4ea8ff','#34d399','#fbbf24','#fb7185','#a78bfa','#22d3ee','#f472b6'];
    let angle=0,spinning=false;
    const items=()=>host.querySelector('#spinItems').value.split('\n').map(s=>s.trim()).filter(Boolean);
    function draw(){const list=items(),n=Math.max(2,list.length),cx=210,cy=210,R=185;ctx.clearRect(0,0,420,420);
      for(let i=0;i<n;i++){const a0=angle+i*2*Math.PI/n,a1=a0+2*Math.PI/n;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a0,a1);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.stroke();
        ctx.save();ctx.translate(cx,cy);ctx.rotate(a0+Math.PI/n);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.fillText(list[i].slice(0,8),R-16,5);ctx.restore();}
      ctx.beginPath();ctx.arc(cx,cy,24,0,7);ctx.fillStyle='#fff';ctx.fill();
      ctx.beginPath();ctx.moveTo(cx,cy-R-8);ctx.lineTo(cx-12,cy-R-26);ctx.lineTo(cx+12,cy-R-26);ctx.closePath();ctx.fillStyle='#fb7185';ctx.fill();
    }
    host.querySelector('#spinItems').addEventListener('input',draw);
    host.querySelector('#spinGo').onclick=()=>{if(spinning)return;spinning=true;
      const list=items(),extra=Math.random()*Math.PI*2+Math.PI*8,start=angle,t0=performance.now(),dur=3200;
      const step=now=>{const p=Math.min(1,(now-t0)/dur),ease=1-Math.pow(1-p,4);angle=start+extra*ease;draw();
        if(p<1)requestAnimationFrame(step);else{spinning=false;const n=Math.max(2,list.length),norm=((angle%(2*Math.PI))+2*Math.PI)%(2*Math.PI);const idx=Math.floor(((2*Math.PI-norm)/(2*Math.PI))*n)%n;
          host.querySelector('#spinResult').textContent=''+list[idx];T.toast('转到：'+list[idx]);}};
      requestAnimationFrame(step);};
    draw();
  }});
  randomTool('三餐随机选择', [S('meal','选择餐次',[['any','随便哪餐'],['breakfast','早餐'],['lunch','午餐'],['dinner','晚餐']],'any')], v=>{
    const db={breakfast:['豆浆油条','包子+小米粥','三明治+咖啡','肠粉','煎饼果子','燕麦牛奶','小笼包'],lunch:['黄焖鸡米饭','麻辣烫','日式拉面','沙县拌面','轻食沙拉','煲仔饭','酸菜鱼','兰州拉面'],dinner:['火锅','烤肉','家常炒菜','意面','寿司','粥+小菜','烧烤','螺蛳粉']};
    const pool=v.meal==='any'?Object.values(db).flat():db[v.meal];
    return [{type:'html',title:'今天就吃这个',value:`<div class="pop-in" style="font-size:28px;font-weight:800;text-align:center;padding:24px;color:var(--accent)">${pick(pool)}</div>`}];
  });
  randomTool('幸运数字生成', [N('min','范围最小值',1),N('max','范围最大值',49),N('count','生成个数',6),C('sorted','结果按升序排列',true,'升序排列')], v=>{
    const a=Math.ceil(Number(v.min)||1),b=Math.floor(Number(v.max)||49),n=Math.min(Number(v.count)||6,b-a+1,50),seen=new Set(),out=[];
    let guard=0;while(out.length<n&&guard++<5000){const x=rnd(a,b);if(!seen.has(x)){seen.add(x);out.push(x);}}
    const res=v.sorted?[...out].sort((x,y)=>x-y):out;
    return [{type:'html',title:'幸运数字',value:`<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:14px">${res.map((x,i)=>`<div class="pop-in" style="animation-delay:${i*.06}s;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--on-accent);font-weight:800;font-size:17px">${x}</div>`).join('')}</div>`},KV([['结果',res.join(', ')],['合计',res.reduce((a,b)=>a+b,0)]])];
  });
  R('租房预算测算', { fields:[N('income','税后月收入（元）',12000),N('saving','期望月储蓄（元）',3000),N('other','固定生活开支（元/月）',3500),N('deposit','押付方式（月数，如押一付三填 4）',4),N('rent','目标月租金（元）',3200)],live:true,
    run:v=>{const inc=Number(v.income)||0,avail=inc-(Number(v.saving)||0)-(Number(v.other)||0),rent=Number(v.rent)||0;
      const ratio=rent/inc*100,first=rent*(Number(v.deposit)||1);
      return KV([['税后月收入',T.money(inc)],['可用于租房上限',T.money(avail)],['目标月租金',T.money(rent)],['房租收入比',T.fmt(ratio,1)+'%'],['首期需准备（含押金）',T.money(first)],['月结余（含储蓄）',T.money(inc-rent-(Number(v.other)||0))],['建议',ratio>40?'房租占比偏高，压力较大':ratio>30?'房租占比略高，注意控制其他开支':'房租占比健康（一般建议 ≤ 30%）']],'租房预算');} });
  R('BMI 身体指数计算器', { fields:[N('h','身高（cm）',170),N('w','体重（kg）',65),N('age','年龄',28)],live:true,
    run:v=>{const h=(Number(v.h)||0)/100,w=Number(v.w)||0;if(h<=0||w<=0)throw new Error('请输入有效身高体重');
      const bmi=w/(h*h),ideal=[18.5*h*h,23.9*h*h];
      const level=bmi<18.5?'偏瘦':bmi<24?'正常':bmi<28?'超重':'肥胖';
      return [KV([['BMI 指数',T.fmt(bmi,2)],['体重评价',level],['健康体重范围',T.fmt(ideal[0],1)+' ~ '+T.fmt(ideal[1],1)+' kg'],['当前体重差',bmi<18.5?'还需增重 '+T.fmt(ideal[0]-w,1)+' kg':bmi>23.9?'建议减重 '+T.fmt(w-ideal[1],1)+' kg':'在健康范围内'],['基础代谢估算（Mifflin）',T.fmt(10*w+6.25*(Number(v.h)||0)-5*(Number(v.age)||25)+5,0)+' kcal/天（男）']],'BMI 测算'),
        {type:'note',value:'采用中国成人 BMI 标准（18.5~23.9 为正常）；孕妇、运动员、儿童不适用该标准。'}];} });
})();
