/* ============================================================
 * 工具实现：联网工具（多语言翻译 / 实时汇率换算 / 天气查询 / 英文单词释义）
 * ------------------------------------------------------------
 * · 四个工具都依赖公开免费接口，需要联网；请求由浏览器直接发往
 *   第三方接口，不经过本站服务器。
 * · 接口返回的文本插入 DOM 前一律经 T.esc 转义，或直接用 textContent。
 * · 每个请求都带 AbortController + 8 秒超时；切换页面时通过
 *   api.onCleanup 统一取消，避免留下悬挂的请求。
 * ============================================================ */
(function () {
  'use strict';

  var T = window.TOOLKIT;
  if (!T || typeof T.register !== 'function') return;
  var R = T.register;
  var esc = T.esc;

  /* ============ 公共：可取消 + 超时的 JSON 请求 ============ */
  function net() {
    var ctrls = [];
    var dead = false;

    function release(c) {
      var i = ctrls.indexOf(c);
      if (i >= 0) ctrls.splice(i, 1);
    }

    function abortAll() {
      dead = true;
      for (var i = 0; i < ctrls.length; i++) {
        try { ctrls[i].abort(); } catch (e) { /* noop */ }
      }
      ctrls.length = 0;
    }

    function getJSON(url, opt) {
      opt = opt || {};
      if (dead) return Promise.reject(new Error('请求已取消'));
      var ctrl = null;
      try { ctrl = new AbortController(); } catch (e) { ctrl = null; }
      if (ctrl) ctrls.push(ctrl);
      var timedOut = false;
      var timer = setTimeout(function () {
        timedOut = true;
        if (ctrl) { try { ctrl.abort(); } catch (e) { /* noop */ } }
      }, opt.timeout || 8000);

      var init = { cache: 'no-store' };
      if (ctrl) init.signal = ctrl.signal;

      return fetch(url, init).then(function (res) {
        if (!res.ok) {
          var err = new Error('HTTP ' + res.status);
          err.status = res.status;
          throw err;
        }
        return res.text();
      }).then(function (txt) {
        clearTimeout(timer);
        if (ctrl) release(ctrl);
        if (!txt) return null;
        try { return JSON.parse(txt); }
        catch (e) {
          var bad = new Error('接口返回内容无法解析');
          bad.badJSON = true;
          throw bad;
        }
      }).catch(function (e) {
        clearTimeout(timer);
        if (ctrl) release(ctrl);
        if (timedOut) {
          var te = new Error('请求超时（8 秒）');
          te.timeout = true;
          return Promise.reject(te);
        }
        return Promise.reject(e);
      });
    }

    return { getJSON: getJSON, abortAll: abortAll, isDead: function () { return dead; } };
  }

  /* 把各种异常整理成简短可读的原因（外层统一加「接口不可用/网络被拦截」） */
  function errText(e) {
    if (!e) return '未知错误';
    if (e.timeout) return '请求超时（8 秒）';
    if (e.name === 'AbortError') return '请求已取消';
    if (e.badJSON) return '接口返回内容无法解析';
    if (e.status) return 'HTTP ' + e.status;
    var m = String(e.message || e);
    if (/Failed to fetch|NetworkError|Load failed|network error|fetch failed/i.test(m)) return '网络不可达或被拦截';
    return m;
  }

  function setBusy(btn, on, label) {
    if (!btn) return;
    if (on) {
      if (btn.getAttribute('data-label') == null) btn.setAttribute('data-label', btn.textContent);
      btn.disabled = true;
      btn.textContent = label || '查询中…';
      btn.style.opacity = '0.65';
      btn.setAttribute('aria-busy', 'true');
    } else {
      btn.disabled = false;
      var lbl = btn.getAttribute('data-label');
      if (lbl != null) btn.textContent = lbl;
      btn.style.opacity = '';
      btn.removeAttribute('aria-busy');
    }
  }

  function hintHTML(text) { return '<div class="hint-empty">' + esc(text) + '</div>'; }
  function errHTML(text) { return '<div class="note err">' + esc(text) + '</div>'; }

  /* 金额显示：小额自动增加小数位；汇率等可显式指定精度 */
  function money(n, digits) {
    if (!isFinite(n)) return '—';
    if (digits != null) return T.fmt(n, digits);
    var a = Math.abs(n);
    var d = a !== 0 && a < 1 ? 4 : 2;
    if (a !== 0 && a < 0.01) d = 6;
    return T.fmt(n, d);
  }

  /* 汇率统一保留 4 位小数，表格列更整齐 */
  function rateText(n) {
    if (!isFinite(n)) return '—';
    return Number(n).toFixed(4);
  }

  function pushUniq(arr, v) {
    v = String(v == null ? '' : v).trim();
    if (!v) return;
    if (arr.indexOf(v) < 0) arr.push(v);
  }

  /* ============ 公共：语音朗读（按语言挑选 voice） ============ */
  var voiceCache = null;
  var voiceHooked = false;

  function refreshVoices() {
    try { voiceCache = window.speechSynthesis.getVoices() || []; }
    catch (e) { voiceCache = []; }
  }

  function ensureVoiceHook() {
    if (voiceHooked || !('speechSynthesis' in window)) return;
    voiceHooked = true;
    try { window.speechSynthesis.addEventListener('voiceschanged', refreshVoices); }
    catch (e) { /* noop */ }
  }

  function speak(text, lang) {
    var body = String(text == null ? '' : text).trim();
    if (!body) { T.toast('没有可朗读的内容', 'err'); return; }
    if (!('speechSynthesis' in window)) { T.toast('当前浏览器不支持朗读', 'err'); return; }
    ensureVoiceHook();
    var synth = window.speechSynthesis;
    if (!voiceCache) refreshVoices();
    var voices = voiceCache || [];
    var want = String(lang || 'zh-CN');
    var wantLow = want.toLowerCase();
    var base = wantLow.split('-')[0];
    var hit = null, i, vl;
    for (i = 0; i < voices.length; i++) {
      vl = String(voices[i].lang || '').toLowerCase().replace('_', '-');
      if (vl === wantLow) { hit = voices[i]; break; }
    }
    if (!hit) {
      for (i = 0; i < voices.length; i++) {
        vl = String(voices[i].lang || '').toLowerCase().replace('_', '-');
        if (vl.indexOf(base) === 0) { hit = voices[i]; break; }
      }
    }
    try { synth.cancel(); } catch (e) { /* noop */ }
    var u;
    try {
      u = new SpeechSynthesisUtterance(body.slice(0, 1200));
      u.lang = want;
      /* 个别浏览器/扩展返回的 voice 对象不能直接赋值，赋值失败就用默认语音 */
      if (hit) { try { u.voice = hit; } catch (e2) { /* noop */ } }
      u.rate = 1;
    } catch (e) {
      T.toast('当前浏览器无法朗读', 'err');
      return;
    }
    try { synth.speak(u); }
    catch (e) { T.toast('朗读失败，当前浏览器可能不支持该语言', 'err'); }
  }

  /* ============================================================
   * 1. 多语言翻译
   * ============================================================ */
  var LANGS = [
    { n: '中文', g: 'zh-CN', s: 'zh-CN' },
    { n: '英文', g: 'en', s: 'en-US' },
    { n: '日文', g: 'ja', s: 'ja-JP' },
    { n: '韩文', g: 'ko', s: 'ko-KR' },
    { n: '法文', g: 'fr', s: 'fr-FR' },
    { n: '德文', g: 'de', s: 'de-DE' },
    { n: '西班牙文', g: 'es', s: 'es-ES' },
    { n: '俄文', g: 'ru', s: 'ru-RU' },
    { n: '葡萄牙文', g: 'pt', s: 'pt-PT' },
    { n: '意大利文', g: 'it', s: 'it-IT' },
    { n: '泰文', g: 'th', s: 'th-TH' },
    { n: '越南文', g: 'vi', s: 'vi-VN' },
    { n: '阿拉伯文', g: 'ar', s: 'ar-SA' }
  ];
  var LANG_BY_G = {};
  for (var li = 0; li < LANGS.length; li++) LANG_BY_G[LANGS[li].g] = LANGS[li];
  var DEFAULT_TARGETS = { 'zh-CN': 1, 'en': 1, 'ja': 1 };

  function trRowHTML(lang) {
    return '<div class="sys-card" data-row="' + esc(lang.g) + '" style="margin:0">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
        '<div class="sys-title" style="margin:0">' + esc(lang.n) + '</div>' +
        '<div style="display:flex;gap:6px">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="copy" disabled>复制</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="speak" disabled>朗读</button>' +
        '</div>' +
      '</div>' +
      '<div data-body style="margin-top:8px;font-size:13.5px;line-height:1.85;color:var(--text-3);white-space:pre-wrap;word-break:break-word">翻译中…</div>' +
      '<div data-engine class="cp-note" style="margin-top:6px"></div>' +
      '<div data-err style="display:none"></div>' +
    '</div>';
  }

  async function trGoogle(inst, text, sl, tl) {
    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
      encodeURIComponent(sl) + '&tl=' + encodeURIComponent(tl) + '&dt=t&q=' + encodeURIComponent(text);
    var d = await inst.getJSON(url);
    var parts = [];
    if (d && Array.isArray(d[0])) {
      for (var i = 0; i < d[0].length; i++) {
        var seg = d[0][i];
        if (seg && typeof seg[0] === 'string') parts.push(seg[0]);
      }
    }
    var out = parts.join('').trim();
    if (!out) throw new Error('Google 接口返回空结果');
    return out;
  }

  async function trMyMemory(inst, text, sl, tl) {
    if (text.length > 500) throw new Error('文本超过 500 字符，MyMemory 不适用');
    var slPart = (sl === 'auto' ? 'Autodetect' : sl);
    var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) +
      '&langpair=' + encodeURIComponent(slPart) + '|' + encodeURIComponent(tl);
    var d = await inst.getJSON(url);
    var t = d && d.responseData && d.responseData.translatedText;
    if (typeof t !== 'string') throw new Error('MyMemory 返回格式异常');
    t = t.trim();
    if (!t) throw new Error('MyMemory 返回空结果');
    if (/PLEASE SELECT TWO DISTINCT LANGUAGES|INVALID LANGUAGE PAIR|SAME LANGUAGE/i.test(t)) {
      var same = new Error('源语言与目标语言相同');
      same.sameLang = true;
      throw same;
    }
    if (/MYMEMORY WARNING|QUOTA|QUERY LENGTH LIMIT/i.test(t)) throw new Error('MyMemory 免费额度已用完');
    return t;
  }

  /* 降级链：并行请求 Google 与 MyMemory，谁先成功用谁；都失败时汇总原因 */
  async function trOne(inst, text, sl, tl) {
    var errs = [];
    var jobs = [];
    jobs.push(trGoogle(inst, text, sl, tl).then(function (out) { return { text: out, via: 'Google 翻译' }; }));
    if (text.length <= 500) {
      jobs.push(trMyMemory(inst, text, sl, tl).then(function (out) { return { text: out, via: 'MyMemory 翻译记忆库' }; }));
    }
    return await new Promise(function (resolve, reject) {
      var pending = jobs.length, done = false;
      if (!pending) return reject(new Error('没有可用的翻译接口'));
      jobs.forEach(function (job) {
        job.then(function (res) {
          if (done) return;
          done = true;
          resolve(res);
        }).catch(function (e) {
          if (e && e.sameLang && !done) {
            done = true;
            resolve({ text: text, via: '已是目标语言，保留原文', same: true });
            return;
          }
          errs.push(errText(e));
          if (--pending === 0 && !done) reject(new Error(errs.join('；')));
        });
      });
    });
  }

  R('多语言翻译', {
    render(host, api) {
      var inst = net();
      var seq = 0;
      var lastResults = {};

      var srcOptions = '<option value="auto">自动检测</option>' + LANGS.map(function (l) {
        return '<option value="' + esc(l.g) + '">' + esc(l.n) + '</option>';
      }).join('');

      var targetChecks = LANGS.map(function (l) {
        return '<label style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--text-2);cursor:pointer;white-space:nowrap">' +
          '<input type="checkbox" value="' + esc(l.g) + '"' + (DEFAULT_TARGETS[l.g] ? ' checked' : '') +
          ' style="accent-color:var(--accent)">' + esc(l.n) + '</label>';
      }).join('');

      host.innerHTML = '<div class="custom-pane">' +
        '<div class="note">需联网：待翻译文本会发送到第三方公共翻译接口（Google / MyMemory），请勿提交密码、证件号等敏感内容；译文仅供参考。</div>' +
        '<div class="cp-row">' +
          '<span class="cp-label">源语言</span>' +
          '<select id="trSrc" style="min-width:130px">' + srcOptions + '</select>' +
          '<span class="cp-note" id="trCount">0 / 1500 字符</span>' +
        '</div>' +
        '<textarea id="trText" rows="5" spellcheck="false" placeholder="输入要翻译的文本，最多 1500 字符…" style="width:100%;min-height:120px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:12px;font-size:13px;line-height:1.85;resize:vertical"></textarea>' +
        '<div class="cp-row" style="align-items:flex-start;gap:6px 12px">' +
          '<span class="cp-label" style="padding-top:4px">目标语言</span>' +
          '<div id="trLangs" style="display:flex;flex-wrap:wrap;gap:8px 14px">' + targetChecks + '</div>' +
        '</div>' +
        '<div class="cp-row">' +
          '<button type="button" class="btn btn-primary" id="trGo">翻译</button>' +
          '<button type="button" class="btn btn-ghost" id="trCopyAll">全部复制</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="trAll">全选</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="trNone">清空</button>' +
          '<span class="cp-note" id="trMsg">可同时选择多种语言，点击「翻译」并发请求</span>' +
        '</div>' +
        '<div id="trOut" style="display:flex;flex-direction:column;gap:10px"></div>' +
      '</div>';

      var textEl = host.querySelector('#trText');
      var srcEl = host.querySelector('#trSrc');
      var countEl = host.querySelector('#trCount');
      var msgEl = host.querySelector('#trMsg');
      var goBtn = host.querySelector('#trGo');
      var outEl = host.querySelector('#trOut');
      var boxEl = host.querySelector('#trLangs');

      textEl.addEventListener('input', function () {
        var n = textEl.value.length;
        countEl.textContent = n + ' / 1500 字符' + (n > 1500 ? ' · 超出部分将被截断' : '');
        countEl.style.color = n > 1500 ? 'var(--err)' : '';
      });

      host.querySelector('#trAll').onclick = function () {
        var bs = boxEl.querySelectorAll('input[type=checkbox]');
        for (var i = 0; i < bs.length; i++) bs[i].checked = true;
      };
      host.querySelector('#trNone').onclick = function () {
        var bs = boxEl.querySelectorAll('input[type=checkbox]');
        for (var i = 0; i < bs.length; i++) bs[i].checked = false;
      };

      host.querySelector('#trCopyAll').onclick = function () {
        var lines = [];
        for (var i = 0; i < LANGS.length; i++) {
          var name = LANGS[i].n;
          if (Object.prototype.hasOwnProperty.call(lastResults, name)) {
            lines.push(name + '：' + lastResults[name]);
          }
        }
        if (!lines.length) { T.toast('还没有可复制的译文', 'err'); return; }
        T.copy(lines.join('\n\n'));
      };

      goBtn.onclick = doTranslate;

      async function doTranslate() {
        var raw = String(textEl.value || '');
        if (!raw.trim()) { T.toast('请输入要翻译的文本', 'err'); textEl.focus(); return; }
        var src = srcEl.value || 'auto';
        var picks = [];
        var boxes = boxEl.querySelectorAll('input[type=checkbox]');
        for (var i = 0; i < boxes.length; i++) if (boxes[i].checked) picks.push(boxes[i].value);
        if (!picks.length) { T.toast('请至少选择一种目标语言', 'err'); return; }

        var text = raw;
        if (raw.length > 1500) {
          text = raw.slice(0, 1500);
          T.toast('文本超过 1500 字符，已截断后翻译', 'err');
        }

        var my = ++seq;
        lastResults = {};
        outEl.innerHTML = picks.map(function (code) { return trRowHTML(LANG_BY_G[code]); }).join('');
        setBusy(goBtn, true, '翻译中…');
        msgEl.textContent = '正在并发请求 ' + picks.length + ' 个目标语言…';

        var ok = 0;
        await Promise.all(picks.map(function (code) {
          var lang = LANG_BY_G[code];
          var row = outEl.querySelector('[data-row="' + code + '"]');
          if (!row) return Promise.resolve();
          var bodyEl = row.querySelector('[data-body]');
          var engEl = row.querySelector('[data-engine]');
          var errEl = row.querySelector('[data-err]');
          var copyBtn = row.querySelector('[data-act="copy"]');
          var speakBtn = row.querySelector('[data-act="speak"]');
          var sameLang = src !== 'auto' && src === lang.g;

          var job = sameLang
            ? Promise.resolve({ text: text, via: '源语言与目标语言相同' })
            : trOne(inst, text, src, lang.g);

          return job.then(function (res) {
            if (my !== seq || inst.isDead()) return;
            ok++;
            lastResults[lang.n] = res.text;
            bodyEl.textContent = res.text;
            bodyEl.style.color = 'var(--text)';
            engEl.textContent = '引擎：' + res.via;
            errEl.style.display = 'none';
            errEl.innerHTML = '';
            copyBtn.disabled = false;
            speakBtn.disabled = false;
            copyBtn.onclick = function () { T.copy(res.text); };
            speakBtn.onclick = function () { speak(res.text, lang.s); };
          }).catch(function (e) {
            if (my !== seq || inst.isDead()) return;
            bodyEl.textContent = '—';
            engEl.textContent = '';
            errEl.style.display = 'block';
            errEl.innerHTML = errHTML('接口不可用/网络被拦截 — ' + (e && e.message ? e.message : '未知错误'));
          });
        }));

        if (my !== seq || inst.isDead()) return;
        setBusy(goBtn, false);
        msgEl.textContent = ok > 0
          ? '完成 ' + ok + ' / ' + picks.length + ' 个语言 · 数据来自公共翻译接口'
          : '全部失败：接口不可用或网络被拦截，请检查网络后重试';
      }

      api.onCleanup(function () {
        seq++;
        inst.abortAll();
        try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
      });
    }
  });

  /* ============================================================
   * 2. 实时汇率换算
   * ============================================================ */
  var CUR = [
    ['USD', '美元'], ['EUR', '欧元'], ['JPY', '日元'], ['GBP', '英镑'],
    ['HKD', '港元'], ['CNY', '人民币'], ['AUD', '澳元'], ['CAD', '加元'],
    ['CHF', '瑞郎'], ['SGD', '新加坡元'], ['KRW', '韩元'], ['THB', '泰铢'],
    ['TWD', '新台币'], ['MOP', '澳门元'], ['MYR', '林吉特'], ['NZD', '新西兰元'],
    ['RUB', '卢布'], ['INR', '印度卢比']
  ];
  var CUR_NAME = {};
  for (var ci = 0; ci < CUR.length; ci++) CUR_NAME[CUR[ci][0]] = CUR[ci][1];
  var FX_COMMON = ['USD', 'EUR', 'JPY', 'GBP', 'HKD', 'CNY', 'AUD', 'CAD', 'CHF', 'SGD', 'KRW', 'THB'];
  var FX_CHECKED = { USD: 1, EUR: 1, JPY: 1, HKD: 1, CNY: 1 };

  function fxRate(from, to, rates) {
    var a = rates[from], b = rates[to];
    if (typeof a !== 'number' || typeof b !== 'number') return null;
    if (!isFinite(a) || !isFinite(b) || a <= 0) return null;
    return b / a;
  }

  /* 主接口 open.er-api.com，失败降级 frankfurter.app（ECB 参考价） */
  async function fxRates(inst) {
    var errs = [];
    try {
      var d = await inst.getJSON('https://open.er-api.com/v6/latest/CNY');
      if (!d || d.result !== 'success' || !d.rates || typeof d.rates !== 'object') throw new Error('返回数据不完整');
      return {
        rates: d.rates,
        source: 'open.er-api.com',
        updated: d.time_last_update_utc || '—'
      };
    } catch (e) {
      errs.push('open.er-api ' + errText(e));
    }
    try {
      var d2 = await inst.getJSON('https://api.frankfurter.app/latest?from=CNY');
      if (!d2 || !d2.rates || typeof d2.rates !== 'object') throw new Error('返回数据不完整');
      var r = {};
      Object.keys(d2.rates).forEach(function (k) { r[k] = d2.rates[k]; });
      r.CNY = 1;
      return { rates: r, source: 'frankfurter.app（欧洲央行参考价）', updated: d2.date || '—' };
    } catch (e2) {
      errs.push('frankfurter ' + errText(e2));
    }
    throw new Error(errs.join('；'));
  }

  R('实时汇率换算', {
    render(host, api) {
      var inst = net();
      var seq = 0;
      var state = { rates: null, source: '', updated: '' };

      function curOptions(selected) {
        return CUR.map(function (c) {
          return '<option value="' + esc(c[0]) + '"' + (c[0] === selected ? ' selected' : '') + '>' +
            esc(c[0] + ' ' + c[1]) + '</option>';
        }).join('');
      }

      var commonChecks = FX_COMMON.map(function (code) {
        return '<label style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--text-2);cursor:pointer;white-space:nowrap">' +
          '<input type="checkbox" value="' + esc(code) + '"' + (FX_CHECKED[code] ? ' checked' : '') +
          ' style="accent-color:var(--accent)">' + esc(code) + '</label>';
      }).join('');

      host.innerHTML = '<div class="custom-pane">' +
        '<div class="note">需联网：汇率来自 open.er-api.com（失败时回退 frankfurter.app 的欧洲央行参考价）。数据仅供参考。</div>' +
        '<div class="cp-row">' +
          '<span class="cp-label">金额</span>' +
          '<input id="fxAmt" type="number" min="0" step="any" value="100" style="width:140px" aria-label="金额">' +
          '<span class="cp-label">从</span>' +
          '<select id="fxFrom" style="min-width:150px" aria-label="源货币">' + curOptions('USD') + '</select>' +
          '<span class="cp-label">到</span>' +
          '<select id="fxTo" style="min-width:150px" aria-label="目标货币">' + curOptions('CNY') + '</select>' +
          '<button type="button" class="btn btn-primary" id="fxGo">换算</button>' +
          '<button type="button" class="btn btn-ghost" id="fxSwap">互换</button>' +
          '<span class="cp-note" id="fxMsg">输入金额后点击「换算」</span>' +
        '</div>' +
        '<div class="cp-row" style="align-items:flex-start;gap:6px 12px">' +
          '<span class="cp-label" style="padding-top:4px">常用货币对照</span>' +
          '<div id="fxCodes" style="display:flex;flex-wrap:wrap;gap:8px 14px">' + commonChecks + '</div>' +
        '</div>' +
        '<div id="fxOut">' + hintHTML('输入金额并点击「换算」，即可获取实时汇率与常用货币对照。') + '</div>' +
        '<div class="note">汇率结果仅供参考，实际结汇价格以银行 / 支付机构实时报价为准。</div>' +
      '</div>';

      var amtEl = host.querySelector('#fxAmt');
      var fromEl = host.querySelector('#fxFrom');
      var toEl = host.querySelector('#fxTo');
      var goBtn = host.querySelector('#fxGo');
      var swapBtn = host.querySelector('#fxSwap');
      var msgEl = host.querySelector('#fxMsg');
      var outEl = host.querySelector('#fxOut');
      var codesEl = host.querySelector('#fxCodes');

      function selectedCodes() {
        var list = [];
        var bs = codesEl.querySelectorAll('input[type=checkbox]');
        for (var i = 0; i < bs.length; i++) if (bs[i].checked) list.push(bs[i].value);
        return list;
      }

      function render(amount, from, to) {
        var rates = state.rates;
        var rate = fxRate(from, to, rates);
        if (rate == null) {
          outEl.innerHTML = errHTML('当前接口缺少 ' + from + ' 或 ' + to + ' 的汇率，换成 USD / EUR / CNY 等主要货币再试');
          return;
        }
        var out = amount * rate;
        var inv = rate > 0 ? 1 / rate : 0;

        var codes = selectedCodes();
        if (codes.indexOf(to) < 0) codes.push(to);

        var rows = codes.map(function (code) {
          var r1 = fxRate(from, code, rates);
          var v = r1 == null ? null : amount * r1;
          return '<tr><td>' + esc(code + ' ' + (CUR_NAME[code] || '')) + '</td><td>' +
            esc(r1 == null ? '—' : rateText(r1)) + '</td><td>' +
            esc(v == null ? '—' : money(v) + ' ' + code) + '</td></tr>';
        }).join('');

        outEl.innerHTML = '<div class="sys-card">' +
          '<div class="sys-title">换算结果</div>' +
          '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">' +
            '<span style="font-family:var(--font-mono);font-size:30px;font-weight:600;line-height:1.2;color:var(--accent);font-variant-numeric:tabular-nums">' +
              esc(money(out)) + '</span>' +
            '<span style="font-family:var(--font-mono);font-size:14px;color:var(--text-3)">' + esc(to) + '</span>' +
          '</div>' +
          '<div class="cp-note" style="margin-top:6px">' +
            esc(money(amount) + ' ' + from + ' → ' + money(out) + ' ' + to) + '</div>' +
          '<div class="kv-grid" style="margin-top:12px">' +
            '<div class="kv-k">汇率</div><div class="kv-v">1 ' + esc(from) + ' = ' + esc(rateText(rate)) + ' ' + esc(to) + '</div>' +
            '<div class="kv-k">反向汇率</div><div class="kv-v">1 ' + esc(to) + ' = ' + esc(rateText(inv)) + ' ' + esc(from) + '</div>' +
            '<div class="kv-k">数据来源</div><div class="kv-v">' + esc(state.source) + '</div>' +
            '<div class="kv-k">更新时间</div><div class="kv-v">' + esc(state.updated || '—') + '</div>' +
          '</div>' +
          '<div class="sys-title" style="margin:16px 0 8px">常用货币对照（按 ' + esc(from) + ' 计）</div>' +
          '<div style="overflow:auto;border:1px solid var(--line);border-radius:8px">' +
            '<table class="data-table"><thead><tr>' +
              '<th>货币</th><th>1 ' + esc(from) + ' =</th><th>换算金额</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table>' +
          '</div>' +
        '</div>';
      }

      async function run() {
        var raw = amtEl.value;
        if (raw === '' || raw == null) { T.toast('请输入金额', 'err'); amtEl.focus(); return; }
        var amount = Number(raw);
        if (!isFinite(amount)) { T.toast('金额格式不正确', 'err'); amtEl.focus(); return; }
        if (amount < 0) { T.toast('金额不能为负数', 'err'); amtEl.focus(); return; }

        var from = fromEl.value, to = toEl.value;
        var my = ++seq;
        setBusy(goBtn, true, '换算中…');
        msgEl.textContent = '正在获取汇率…';
        outEl.innerHTML = hintHTML('正在请求汇率接口…');

        try {
          if (!state.rates) {
            var got = await fxRates(inst);
            if (my !== seq || inst.isDead()) return;
            state.rates = got.rates;
            state.source = got.source;
            state.updated = got.updated;
          }
          if (my !== seq || inst.isDead()) return;
          render(amount, from, to);
          msgEl.textContent = '汇率来源：' + state.source;
        } catch (e) {
          if (my !== seq || inst.isDead()) return;
          outEl.innerHTML = errHTML('接口不可用/网络被拦截 — ' + (e && e.message ? e.message : '未知错误'));
          msgEl.textContent = '获取汇率失败，请检查网络后重试';
        } finally {
          if (my === seq && !inst.isDead()) setBusy(goBtn, false);
        }
      }

      goBtn.onclick = run;
      amtEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); run(); }
      });
      swapBtn.onclick = function () {
        var a = fromEl.value;
        fromEl.value = toEl.value;
        toEl.value = a;
        if (amtEl.value !== '' && state.rates) run();
        else T.toast('已互换货币');
      };

      api.onCleanup(function () {
        seq++;
        inst.abortAll();
      });
    }
  });

  /* ============================================================
   * 3. 天气查询
   * ============================================================ */
  function wmoText(code) {
    var c = Number(code);
    if (!isFinite(c)) return '—';
    if (c === 0) return '晴';
    if (c === 1) return '大部晴朗';
    if (c === 2) return '局部多云';
    if (c === 3) return '阴';
    if (c === 45 || c === 48) return '雾';
    if (c === 51 || c === 53 || c === 55) return '毛毛雨';
    if (c === 56 || c === 57) return '冻毛毛雨';
    if (c === 61 || c === 63 || c === 65) return '雨';
    if (c === 66 || c === 67) return '冻雨';
    if (c === 71 || c === 73 || c === 75) return '雪';
    if (c === 77) return '雪粒';
    if (c === 80 || c === 81 || c === 82) return '阵雨';
    if (c === 85 || c === 86) return '阵雪';
    if (c === 95) return '雷暴';
    if (c === 96 || c === 99) return '雷暴伴冰雹';
    return '未知（' + c + '）';
  }

  function wmoRows() {
    return '<div class="cp-note" style="margin-top:8px">天气描述依据 WMO 天气代码映射：0 晴、1—3 多云、45/48 雾、51—57 毛毛雨、61—67 雨、71—77 雪、80—82 阵雨、85—86 阵雪、95—99 雷暴。</div>';
  }

  async function wxGeocode(inst, city) {
    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) +
      '&count=5&language=zh&format=json';
    var d = await inst.getJSON(url);
    return (d && Array.isArray(d.results)) ? d.results : [];
  }

  async function wxForecast(inst, lat, lon) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(lat) +
      '&longitude=' + encodeURIComponent(lon) +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=auto&forecast_days=7';
    var d = await inst.getJSON(url);
    if (!d || !d.current || !d.daily) throw new Error('天气数据不完整');
    return d;
  }

  function dayLabel(iso, idx) {
    var p = String(iso == null ? '' : iso).split('-');
    var wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var w = '';
    if (p.length === 3) {
      var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      if (!isNaN(dt.getTime())) w = wd[dt.getDay()];
    }
    var label = p.length === 3 ? p[1] + '-' + p[2] : String(iso == null ? '' : iso);
    if (idx === 0) return label + ' ' + w + ' · 今天';
    if (idx === 1) return label + ' ' + w + ' · 明天';
    return label + ' ' + w;
  }

  function wxPlaceLabel(it) {
    return [it.name, it.admin1, it.country].filter(Boolean).join(' · ');
  }

  R('天气查询', {
    render(host, api) {
      var inst = net();
      var seq = 0;
      var cands = [];
      var activeIdx = -1;

      host.innerHTML = '<div class="custom-pane">' +
        '<div class="cp-row">' +
          '<span class="cp-label">城市</span>' +
          '<input id="wxCity" type="text" placeholder="南宁 / 北京 / 上海 / Tokyo" style="flex:1;min-width:200px" aria-label="城市名">' +
          '<button type="button" class="btn btn-primary" id="wxGo">查询</button>' +
          '<span class="cp-note" id="wxMsg">支持中文城市名，需联网</span>' +
        '</div>' +
        '<div id="wxOut">' + hintHTML('输入城市名后点击「查询」，可查看当前天气与未来 7 天预报。') + '</div>' +
        '<div class="note">天气数据来自 open-meteo.com 免费接口（无需 Key），预报仅供参考。</div>' +
      '</div>';

      var cityEl = host.querySelector('#wxCity');
      var goBtn = host.querySelector('#wxGo');
      var msgEl = host.querySelector('#wxMsg');
      var outEl = host.querySelector('#wxOut');

      function chipsHTML(active) {
        return cands.map(function (it, i) {
          return '<button type="button" class="btn ' + (i === active ? 'btn-primary' : 'btn-ghost') +
            ' btn-sm" data-city="' + i + '">' + esc(wxPlaceLabel(it)) + '</button>';
        }).join('');
      }

      function currentHTML(d, it) {
        var cur = d.current || {};
        var daily = d.daily;
        var temp = cur.temperature_2m;
        var code = cur.weather_code;

        var dayRows = (daily.time || []).map(function (t, i) {
          var max = daily.temperature_2m_max ? daily.temperature_2m_max[i] : null;
          var min = daily.temperature_2m_min ? daily.temperature_2m_min[i] : null;
          var pop = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null;
          var wcode = daily.weather_code ? daily.weather_code[i] : null;
          return '<tr><td>' + esc(dayLabel(t, i)) + '</td><td>' + esc(wmoText(wcode)) + '</td>' +
            '<td>' + esc(max == null ? '—' : T.fmt(max, 1) + ' °C') + '</td>' +
            '<td>' + esc(min == null ? '—' : T.fmt(min, 1) + ' °C') + '</td>' +
            '<td>' + esc(pop == null ? '—' : pop + '%') + '</td></tr>';
        }).join('');

        return '<div class="sys-card">' +
          '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap">' +
            '<div>' +
              '<div class="sys-title" style="margin:0 0 8px">' + esc(wxPlaceLabel(it)) + '</div>' +
              '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">' +
                '<span style="font-family:var(--font-mono);font-size:38px;font-weight:600;line-height:1.1;color:var(--accent);font-variant-numeric:tabular-nums">' +
                  esc(temp == null ? '—' : T.fmt(temp, 1)) + '</span>' +
                '<span style="font-family:var(--font-mono);font-size:14px;color:var(--text-3)">°C</span>' +
                '<span style="font-size:14px;color:var(--text-2)">' + esc(wmoText(code)) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="cp-note">坐标 ' + esc(Number(it.latitude).toFixed(2) + ', ' + Number(it.longitude).toFixed(2)) +
              ' · 时区 ' + esc(d.timezone || d.timezone_abbreviation || '—') + '</div>' +
          '</div>' +
          '<div class="kv-grid" style="margin-top:14px">' +
            '<div class="kv-k">体感温度</div><div class="kv-v">' + esc(cur.apparent_temperature == null ? '—' : T.fmt(cur.apparent_temperature, 1) + ' °C') + '</div>' +
            '<div class="kv-k">相对湿度</div><div class="kv-v">' + esc(cur.relative_humidity_2m == null ? '—' : cur.relative_humidity_2m + '%') + '</div>' +
            '<div class="kv-k">风速</div><div class="kv-v">' + esc(cur.wind_speed_10m == null ? '—' : T.fmt(cur.wind_speed_10m, 1) + ' km/h') + '</div>' +
            '<div class="kv-k">降水量</div><div class="kv-v">' + esc(cur.precipitation == null ? '—' : T.fmt(cur.precipitation, 1) + ' mm') + '</div>' +
            '<div class="kv-k">观测时间</div><div class="kv-v">' + esc(cur.time || '—') + '</div>' +
            '<div class="kv-k">数据来源</div><div class="kv-v">open-meteo.com</div>' +
          '</div>' +
          '<div class="sys-title" style="margin:16px 0 8px">未来 7 天预报</div>' +
          '<div style="overflow:auto;border:1px solid var(--line);border-radius:8px">' +
            '<table class="data-table"><thead><tr>' +
              '<th>日期</th><th>天气</th><th>最高温</th><th>最低温</th><th>降水概率</th>' +
            '</tr></thead><tbody>' + dayRows + '</tbody></table>' +
          '</div>' +
          wmoRows() +
        '</div>';
      }

      function bindChips() {
        var chips = outEl.querySelectorAll('[data-city]');
        for (var i = 0; i < chips.length; i++) chips[i].addEventListener('click', onChip);
      }

      async function loadWeather(idx, my) {
        var it = cands[idx];
        if (!it) return;
        activeIdx = idx;
        var d = await wxForecast(inst, it.latitude, it.longitude);
        if (my !== seq || inst.isDead()) return;
        var html = '';
        if (cands.length > 1) {
          html += '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:10px">' +
            '<span class="cp-label">匹配到 ' + cands.length + ' 个地点，可切换：</span>' +
            chipsHTML(idx) + '</div>';
        }
        html += currentHTML(d, it);
        outEl.innerHTML = html;
        msgEl.textContent = '已更新 · ' + (d.current && d.current.time ? d.current.time : '刚刚');
        bindChips();
      }

      function onChip(ev) {
        var b = ev.currentTarget;
        var idx = Number(b.getAttribute('data-city'));
        if (!isFinite(idx) || idx === activeIdx) return;
        var my = seq;
        msgEl.textContent = '正在切换到 ' + cands[idx].name + '…';
        loadWeather(idx, my).catch(function (e) {
          if (my !== seq || inst.isDead()) return;
          outEl.innerHTML = errHTML('接口不可用/网络被拦截 — ' + errText(e));
          msgEl.textContent = '切换失败，请重试';
        });
      }

      async function query() {
        var city = String(cityEl.value || '').trim();
        if (!city) { T.toast('请输入城市名', 'err'); cityEl.focus(); return; }
        if (city.length > 40) { T.toast('城市名过长，请检查输入', 'err'); cityEl.focus(); return; }
        if (/^[0-9\s.,-]+$/.test(city)) { T.toast('请输入城市名称，例如 南宁、北京', 'err'); cityEl.focus(); return; }

        var my = ++seq;
        cands = [];
        activeIdx = -1;
        setBusy(goBtn, true, '查询中…');
        msgEl.textContent = '正在查询「' + city + '」…';
        outEl.innerHTML = hintHTML('正在请求地理编码接口…');

        try {
          var list = await wxGeocode(inst, city);
          if (my !== seq || inst.isDead()) return;
          if (!list.length) {
            outEl.innerHTML = errHTML('没有找到「' + city + '」，换个写法试试（例如「南宁」「Beijing」「San Francisco」）。');
            msgEl.textContent = '未找到该城市';
            return;
          }
          cands = list.slice(0, 5);
          await loadWeather(0, my);
        } catch (e) {
          if (my !== seq || inst.isDead()) return;
          outEl.innerHTML = errHTML('接口不可用/网络被拦截 — ' + errText(e));
          msgEl.textContent = '查询失败，请检查网络后重试';
        } finally {
          if (my === seq && !inst.isDead()) setBusy(goBtn, false);
        }
      }

      goBtn.onclick = query;
      cityEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); query(); }
      });

      api.onCleanup(function () {
        seq++;
        inst.abortAll();
      });
    }
  });

  /* ============================================================
   * 4. 英文单词释义
   * ============================================================ */
  var POS_CN = {
    'noun': '名词', 'verb': '动词', 'adjective': '形容词', 'adverb': '副词',
    'pronoun': '代词', 'preposition': '介词', 'conjunction': '连词',
    'interjection': '感叹词', 'exclamation': '感叹词', 'numeral': '数词',
    'article': '冠词', 'determiner': '限定词', 'auxiliary verb': '助动词',
    'auxiliary': '助动词', 'particle': '小品词', 'prefix': '前缀', 'suffix': '后缀'
  };
  var POS_ORDER = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];

  function posLabel(pos) {
    var raw = String(pos == null ? '' : pos).trim();
    if (!raw) return '未标注词性';
    var cn = POS_CN[raw.toLowerCase()];
    return cn ? cn + ' · ' + raw : raw;
  }

  function chipHTML(word) {
    return '<span style="display:inline-block;border:1px solid var(--line);border-radius:100px;' +
      'padding:2px 9px;font-size:11.5px;color:var(--text-2);background:var(--surface-2);' +
      'font-family:var(--font-mono)">' + esc(word) + '</span>';
  }

  function sortPos(groups) {
    return groups.slice().sort(function (a, b) {
      var ia = POS_ORDER.indexOf(String(a.pos).toLowerCase());
      var ib = POS_ORDER.indexOf(String(b.pos).toLowerCase());
      if (ia < 0) ia = 99;
      if (ib < 0) ib = 99;
      return ia - ib;
    });
  }

  var DM_POS = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: 'other', pron: 'pronoun', prep: 'preposition', conj: 'conjunction', interj: 'interjection', num: 'numeral', art: 'article', det: 'determiner' };
  function dmPos(tag) {
    var t = String(tag || '').trim().toLowerCase();
    return DM_POS[t] || t || 'other';
  }

  R('英文单词释义', {
    steps: [
      '输入英文单词后按 Enter 或点「查询」，先查 Datamuse 词典（直连、响应快）。',
      '音标、例句与更多同义词会在 Free Dictionary API 可用时自动补充，接口不可用不影响主要释义。',
      '点释义下的同反义词标签可以直接查那个词；点「朗读单词」用浏览器语音朗读。',
      '查不到时可以点下方给出的拼写建议，或换用词形还原后的原形（例如 running → run）。'
    ],
    render(host, api) {
      var inst = net();
      var seq = 0;
      var lastCopy = '';

      host.innerHTML = '<div class="custom-pane">' +
        '<div class="cp-row">' +
          '<span class="cp-label">单词</span>' +
          '<input id="wdWord" type="text" placeholder="例如 resilience" style="flex:1;min-width:200px" autocomplete="off" spellcheck="false" aria-label="英文单词">' +
          '<button type="button" class="btn btn-primary" id="wdGo">查询</button>' +
          '<button type="button" class="btn btn-ghost" id="wdSpeak">朗读单词</button>' +
          '<button type="button" class="btn btn-ghost" id="wdCopy">复制全部释义</button>' +
          '<span class="cp-note" id="wdMsg">需联网 · 主词典 Datamuse</span>' +
        '</div>' +
        '<div id="wdOut">' + hintHTML('输入英文单词后点击「查询」，查看读音、词性、释义、例句与同反义词。') + '</div>' +
        '<div class="note">释义来自 Datamuse（WordNet 数据），音标、例句与补充同反义词来自 free Dictionary API。两个接口都不需要密钥，但都需要联网；网络被拦截时会提示具体原因。</div>' +
      '</div>';

      var wordEl = host.querySelector('#wdWord');
      var goBtn = host.querySelector('#wdGo');
      var msgEl = host.querySelector('#wdMsg');
      var outEl = host.querySelector('#wdOut');
      var speakBtn = host.querySelector('#wdSpeak');
      var copyBtn = host.querySelector('#wdCopy');

      function linkChip(w) {
        return '<button type="button" data-w="' + esc(w) + '" style="border:1px solid var(--line);border-radius:100px;' +
          'padding:2px 10px;font-size:11.5px;color:var(--text-2);background:var(--surface-2);' +
          'font-family:var(--font-mono);cursor:pointer">' + esc(w) + '</button>';
      }

      function buildCopy(word, st) {
        var lines = [String(word)];
        if (st.ipa.length) lines.push('音标：' + st.ipa.join(' / '));
        else if (st.pron) lines.push('读音：' + st.pron);
        st.groups.forEach(function (g) {
          lines.push('');
          lines.push('【' + posLabel(g.pos) + '】');
          g.defs.forEach(function (d, i) {
            lines.push((i + 1) + '. ' + d.text);
            if (d.example) lines.push('   例：' + d.example);
          });
          if (g.syn.length) lines.push('同义词：' + g.syn.join(', '));
          if (g.ant.length) lines.push('反义词：' + g.ant.join(', '));
        });
        if (st.synAll.length) lines.push('\n常见同义词：' + st.synAll.join(', '));
        if (st.antAll.length) lines.push('常见反义词：' + st.antAll.join(', '));
        lines.push('\n数据来源：' + st.sources.join(' + '));
        return lines.join('\n');
      }

      function renderWord(word, st) {
        var ipaHTML = st.ipa.length
          ? '<span style="font-family:var(--font-mono);font-size:12.5px;color:var(--text-3)">' + esc(st.ipa.join('  /  ')) + '</span>'
          : (st.pron ? '<span style="font-family:var(--font-mono);font-size:12.5px;color:var(--text-3)">读音 ' + esc(st.pron) + '</span>' : '');

        var body = '';
        st.groups.forEach(function (g) {
          var items = g.defs.map(function (d) {
            var ex = d.example ? '<div style="margin-top:5px;padding-left:10px;border-left:2px solid var(--line);color:var(--text-3);font-size:12px;line-height:1.7">例：' + esc(d.example) + '</div>' : '';
            return '<li style="margin-bottom:7px">' + esc(d.text) + ex + '</li>';
          }).join('');
          var syn = g.syn.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px"><span class="cp-label">同义词</span>' + g.syn.slice(0, 10).map(linkChip).join('') + '</div>' : '';
          var ant = g.ant.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px"><span class="cp-label">反义词</span>' + g.ant.slice(0, 10).map(linkChip).join('') + '</div>' : '';
          body += '<div style="margin-bottom:14px">' +
            '<div class="sys-title" style="margin-bottom:8px">' + esc(posLabel(g.pos)) + '</div>' +
            (items ? '<ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.85;color:var(--text-2)">' + items + '</ol>' : '<div class="cp-note">该词性下暂无释义</div>') +
            syn + ant + '</div>';
        });

        var exList = [];
        st.groups.forEach(function (g) {
          g.defs.forEach(function (d) { if (d.example && exList.indexOf(d.example) < 0) exList.push(d.example); });
        });
        var exHTML = exList.length
          ? '<div style="margin-top:6px;border-top:1px solid var(--line);padding-top:10px"><div class="sys-title" style="margin-bottom:6px">例句</div><ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.85;color:var(--text-2)">' + exList.slice(0, 6).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>'
          : '';

        var synHTML = st.synAll.length
          ? '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px"><span class="cp-label">常见同义词</span>' + st.synAll.slice(0, 12).map(linkChip).join('') + '</div>' : '';
        var antHTML = st.antAll.length
          ? '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px"><span class="cp-label">常见反义词</span>' + st.antAll.slice(0, 12).map(linkChip).join('') + '</div>' : '';

        lastCopy = buildCopy(word, st);
        return '<div class="sys-card">' +
          '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">' +
            '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">' +
              '<span style="font-family:var(--font-serif);font-size:26px;font-weight:600;color:var(--text)">' + esc(word) + '</span>' +
              ipaHTML +
            '</div>' +
            '<span class="cp-note">来源：' + esc(st.sources.join(' + ')) + '</span>' +
          '</div>' +
          body + exHTML + synHTML + antHTML +
        '</div>';
      }

      function missHTML(word, sug, reason) {
        lastCopy = '';
        var chips = (sug && sug.length)
          ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">' + sug.slice(0, 8).map(function (s) { return linkChip(s.word || s); }).join('') + '</div>'
          : '';
        var ext = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
          '<a class="btn btn-ghost btn-sm" href="https://www.merriam-webster.com/dictionary/' + encodeURIComponent(word) + '" target="_blank" rel="noopener noreferrer">韦氏词典</a>' +
          '<a class="btn btn-ghost btn-sm" href="https://dictionary.cambridge.org/dictionary/english/' + encodeURIComponent(word) + '" target="_blank" rel="noopener noreferrer">剑桥词典</a>' +
          '<a class="btn btn-ghost btn-sm" href="https://dict.youdao.com/result?word=' + encodeURIComponent(word) + '&lang=en" target="_blank" rel="noopener noreferrer">有道词典</a>' +
          '</div>';
        return '<div class="sys-card">' +
          '<div class="sys-title">未收录「' + esc(word) + '」</div>' +
          '<div class="cp-note" style="margin-top:6px">' + esc(reason || '词典接口没有返回释义。可以检查拼写、试试词形还原（running → run、better → good），或从下面的建议里选一个。') + '</div>' +
          chips + ext + '</div>';
      }

      function bindChips() {
        Array.prototype.forEach.call(outEl.querySelectorAll('[data-w]'), function (b) {
          b.onclick = function () { wordEl.value = b.getAttribute('data-w'); query(); };
        });
      }

      async function query() {
        var raw = String(wordEl.value || '').trim();
        if (!raw) { T.toast('请输入英文单词', 'err'); wordEl.focus(); return; }
        if (!/^[A-Za-z][A-Za-z '\-.]*$/.test(raw)) { T.toast('请输入英文单词（不支持中文或数字）', 'err'); wordEl.focus(); return; }
        if (raw.length > 40) { T.toast('单词过长，请检查输入', 'err'); wordEl.focus(); return; }
        var word = raw.toLowerCase();
        var my = ++seq;
        lastCopy = '';
        setBusy(goBtn, true, '查询中…');
        msgEl.textContent = '正在查询「' + word + '」…';
        outEl.innerHTML = hintHTML('正在请求 Datamuse 词典…');

        var enc = encodeURIComponent(word);
        var dmP = inst.getJSON('https://api.datamuse.com/words?sp=' + enc + '&md=dpr&max=3').catch(function (e) { return { __err: e }; });
        var fdP = inst.getJSON('https://api.dictionaryapi.dev/api/v2/entries/en/' + enc, { timeout: 5000 }).catch(function () { return null; });
        var synP = inst.getJSON('https://api.datamuse.com/words?rel_syn=' + enc + '&max=12').catch(function () { return []; });
        var antP = inst.getJSON('https://api.datamuse.com/words?rel_ant=' + enc + '&max=12').catch(function () { return []; });

        var dm = await dmP;
        if (my !== seq || inst.isDead()) return;
        var dmErr = dm && dm.__err ? dm.__err : null;
        if (dm && dm.__err) dm = null;

        var entry = null;
        if (Array.isArray(dm)) {
          for (var i = 0; i < dm.length; i++) {
            if (dm[i] && String(dm[i].word || '').toLowerCase() === word) { entry = dm[i]; break; }
          }
          if (!entry && dm.length) entry = dm[0];
        }

        var st = { groups: [], ipa: [], pron: '', synAll: [], antAll: [], sources: [] };

        if (entry) {
          if (entry.pron) st.pron = String(entry.pron);
          var tags = Array.isArray(entry.tags) ? entry.tags : [];
          var defs = Array.isArray(entry.defs) ? entry.defs : [];
          var gmap = {};
          defs.forEach(function (d) {
            if (typeof d !== 'string' || !d.trim()) return;
            var pos = 'other', text = d.trim();
            var m = /^([a-z]{1,5})\t([\s\S]+)$/.exec(text);
            if (m) { pos = dmPos(m[1]); text = m[2]; }
            else if (tags.length) pos = dmPos(tags[0]);
            if (!gmap[pos]) { gmap[pos] = { pos: pos, defs: [], syn: [], ant: [] }; st.groups.push(gmap[pos]); }
            gmap[pos].defs.push({ text: text, example: '' });
          });
          if (!st.groups.length && tags.length) {
            st.groups.push({ pos: dmPos(tags[0]), defs: [{ text: '词典只给出了词性，没有更多释义。', example: '' }], syn: [], ant: [] });
          }
          if (st.groups.length) st.sources.push('Datamuse');
        }

        /* 补充词典：音标、例句、更多同反义词 */
        var fd = await fdP;
        if (fd && Array.isArray(fd)) {
          var fdSyn = [], fdAnt = [], gotFd = false;
          fd.forEach(function (en) {
            if (!en) return;
            if (en.phonetic) pushUniq(st.ipa, en.phonetic);
            (en.phonetics || []).forEach(function (p) { if (p && p.text) pushUniq(st.ipa, p.text); });
            (en.meanings || []).forEach(function (m) {
              if (!m) return;
              gotFd = true;
              var pos = m.partOfSpeech || 'other';
              var g = null;
              for (var k = 0; k < st.groups.length; k++) if (st.groups[k].pos === pos) { g = st.groups[k]; break; }
              if (!g) { g = { pos: pos, defs: [], syn: [], ant: [] }; st.groups.push(g); }
              (m.definitions || []).forEach(function (def) {
                if (!def || !def.definition) return;
                if (def.example) {
                  var hit = null;
                  for (var q = 0; q < g.defs.length; q++) if (!g.defs[q].example && g.defs[q].text.toLowerCase().slice(0, 18) === String(def.definition).toLowerCase().slice(0, 18)) { hit = g.defs[q]; break; }
                  if (hit) hit.example = def.example;
                  else g.defs.push({ text: def.definition, example: def.example });
                }
                (def.synonyms || []).forEach(function (s) { pushUniq(g.syn, s); pushUniq(fdSyn, s); });
                (def.antonyms || []).forEach(function (s) { pushUniq(g.ant, s); pushUniq(fdAnt, s); });
              });
              (m.synonyms || []).forEach(function (s) { pushUniq(g.syn, s); pushUniq(fdSyn, s); });
              (m.antonyms || []).forEach(function (s) { pushUniq(g.ant, s); pushUniq(fdAnt, s); });
            });
          });
          if (gotFd) st.sources.push('Free Dictionary');
          st.synAll = fdSyn.slice(0, 12);
          st.antAll = fdAnt.slice(0, 12);
        }

        var syn = await synP, ant = await antP;
        if (my !== seq || inst.isDead()) return;
        (Array.isArray(syn) ? syn : []).forEach(function (x) { if (x && x.word && x.word.toLowerCase() !== word) pushUniq(st.synAll, x.word); });
        (Array.isArray(ant) ? ant : []).forEach(function (x) { if (x && x.word && x.word.toLowerCase() !== word) pushUniq(st.antAll, x.word); });

        st.groups.forEach(function (g) { g.defs = g.defs.slice(0, 8); });
        st.groups = sortPos(st.groups).filter(function (g) { return g.defs.length; });

        if (st.groups.length) {
          outEl.innerHTML = renderWord(word, st);
          msgEl.textContent = '查询完成 · ' + st.sources.join(' + ');
        } else {
          var sug = [];
          try { sug = await inst.getJSON('https://api.datamuse.com/sug?s=' + enc + '&max=8'); } catch (e) { /* noop */ }
          if (my !== seq || inst.isDead()) return;
          var reason = dmErr ? ('主词典请求失败：' + errText(dmErr)) : '主词典里没有这个词的释义记录。';
          outEl.innerHTML = missHTML(word, Array.isArray(sug) ? sug : [], reason + ' 下面是拼写相近的词，点一下即可查询。');
          msgEl.textContent = '未找到释义';
        }
        bindChips();
        if (!inst.isDead()) setBusy(goBtn, false);
      }

      goBtn.onclick = query;
      wordEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); query(); }
      });
      speakBtn.onclick = function () {
        var w = String(wordEl.value || '').trim();
        if (!w) { T.toast('请先输入单词', 'err'); wordEl.focus(); return; }
        speak(w, 'en-US');
      };
      copyBtn.onclick = function () {
        if (!lastCopy) { T.toast('还没有可复制的释义', 'err'); return; }
        T.copy(lastCopy);
      };
      wordEl.focus();

      api.onCleanup(function () {
        seq++;
        inst.abortAll();
        try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
      });
    }
  });
})();
