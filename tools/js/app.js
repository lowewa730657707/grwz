/* ============================================================
   站点应用层：目录索引 / 路由 / 搜索 / 收藏 / 主题 / 渲染
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT;

  const ICONS = {
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    media: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    design: '<path d="M4 20l4.5-1 10-10-3.5-3.5L5 15.5z"/><path d="M13 7.5l3.5 3.5"/><path d="M3 21h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM19 19h2v2h-2zM14 19h2v2h-2z"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2m4 0h2M8 15h2m4 0h2M8 19h2m4 0h2"/>',
    law: '<path d="M12 3v18M5 7h14M7 7l-4 8h8zM17 7l-4 8h8zM8 21h8"/>',
    convert: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    life: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    edu: '<path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3z"/>',
    text: '<path d="M4 6h16M4 10h12M4 14h16M4 18h9"/>',
    dev: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/>',
    system: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    game: '<path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/><rect x="2" y="6" width="20" height="12" rx="5"/>',
    emptySearch: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    emptyStar: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
    shield: '<path d="M12 3l7 3v5.5c0 4.4-2.9 7.4-7 9-4.1-1.6-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>'
  };
  const svg = (id, cls) => `<svg class="${cls || 'side-svg'}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[id] || ICONS.dev}</svg>`;

  /* ---------------- 工具索引 ---------------- */
  const DESIGN_GROUPS = {
    '配色与检查': ['对比度检查器', '颜色关系生成器', '配色方案生成', '色盲模拟器', '图片主色提取', '色板明度阶梯', '暗色模式配色转换', '配色批量对比度检查', '色彩混合器', '颜色色卡色号'],
    '规范与排版': ['字阶生成器', '间距阶梯生成器', 'px / rem 换算', '栅格布局生成器', '设计 Token 导出器', '图片比例计算器', '字体配对预览', '行高与字距生成器', '触控目标检查器', '多倍图尺寸换算', '文案长度检查器', '多行文本截断生成器'],
    'CSS 与动效': ['CSS 阴影生成器', '圆角生成器', 'CSS 按钮生成器', '文本阴影生成器', 'CSS 滤镜生成器', '缓动曲线生成器', '玻璃卡片生成器', 'CSS 过渡生成器', 'CSS 关键帧动画生成器', '输入框样式生成器', 'CSS 样式表生成器', 'CSS 代码速查'],
    '素材导出': ['SVG 图案生成器', '占位图生成器', 'Favicon 生成器', 'OG 分享卡片生成器', '调色板卡片导出', 'SVG 波浪分隔线', 'SVG 纹理生成器', 'SVG 转 PNG', 'LQIP 图片占位符'],
    '数据可视化': ['数据图表生成'],
    '内容与响应式': ['占位文案生成器', '响应式断点生成器', '响应式图片 srcset 生成器']
  };
  const DESIGN_GROUP_ORDER = ['配色与检查', '规范与排版', 'CSS 与动效', '素材导出', '数据可视化', '内容与响应式'];
  const NET_TOOLS = new Set(['中文翻译', '当前 IP 查询', '邮箱地址检测', '多语言翻译', '实时汇率换算', '天气查询', '英文单词释义']);

  /* 已重做的小游戏：给出与面板一致的操作说明 */
  const GAME_STEPS = {
    '贪吃蛇': [
      '先选难度（慢速 / 普通 / 快速 / 极速），再点「开始游戏」，3-2-1 倒计时结束后开始。',
      '方向键或 WASD 转向，空格暂停；手机上可用画布下方的十字方向键。',
      '吃到食物 +10 分，每吃 5 个提速一档；撞墙或撞到自己即结束。',
      '结束面板会给出得分、用时与是否破纪录，点「再来一局」可继续；成绩保存在本机。'
    ],
    '2048 小游戏': [
      '点「开始游戏」；方向键 / WASD 或触屏滑动移动方块，相同数字相撞即合并。',
      '每次有效移动会生成一个新方块，得分、步数与用时实时显示。',
      '合成 2048 时会提示一次，但可以继续玩；棋盘填满且无法再合并时结束。',
      '结束后可「再来一局」，最高分保存在本机。'
    ],
    '打砖块': [
      '点「开始游戏」后球黏在挡板上，按空格或点「发射」发球。',
      '鼠标移动、← / → 或 A / D 移动挡板；触屏可拖动挡板，也可用下方按钮。',
      '清空全部砖块过关，共 3 关；球落底扣 1 条命，3 条命用完结束。',
      '点「暂停」或按 P 可暂停，结算面板显示得分、剩余生命、关卡与用时。'
    ],
    '俄罗斯方块': [
      '点「开始游戏」后方块从顶部下落：← / → 或 A / D 移动，↑ / W 旋转，↓ 软降，空格硬降。',
      'P 暂停、R 重开；右侧显示下一块预览与分数、等级、消行数。',
      '填满一整行会消除并得分，消除行数越多等级越高、下落越快。',
      '方块堆到顶部即结束，结算面板给出得分与最高分。'
    ],
    '记忆翻牌': [
      '先选难度（4×4 / 5×4 / 6×6），再点「开始游戏」。',
      '点击卡片翻开，连续翻开两张相同图案即配对成功，不同则自动翻回。',
      '用时与翻牌次数实时统计，剩余配对数量会显示在面板上。',
      '全部配对完成即结算，翻牌次数越少越好，最佳记录保存在本机。'
    ],
    '国际象棋': [
      '选择难度与执子颜色后开始，点击棋子会显示全部合法落点，再点落点走子。',
      '支持王车易位、吃过路兵与兵升变；被将军时会有提示。',
      '悔棋会撤回你与 AI 各一步；想不出时可用「提示」让 AI 推荐一步。',
      '计时从你第一次走子开始，结束后在结算面板可以再来一局。'
    ],
    '黑白棋': [
      '你是黑棋先行，点击高亮圆点落子，夹住的对方棋子会翻面。',
      '难度分三档，困难档 AI 会做浅层搜索；可用「显示合法点」开关辅助判断。',
      '双方都没有合法落点时对局结束，按棋子数判定胜负并给出结算面板。',
      '计时从你第一次落子开始，「悔棋」撤回你与 AI 各一步。'
    ],
    '井字棋': [
      '点击空格落子，先连成横、竖或斜线三个即获胜。',
      '可切换「完美」与「简单随机」难度；完美模式只能打成平局。',
      '右侧记录胜 / 负 / 平比分，点「重新开始」或结算面板的「再来一局」可继续。'
    ],
    '扫雷小游戏': [
      '左键翻开格子，右键标记旗帜；第一次点击一定不会踩雷。',
      '数字表示周围八格的雷数，翻开所有非雷格子即获胜。',
      '踩到雷立即结束，点「重新开始」换一局；用时记录在本机。'
    ],
    '数独生成器': [
      '选择难度后点「新游戏」，题目会自动生成且有唯一解。',
      '点击格子后用数字键 1-9 填数，0 或 Delete 清空，方向键移动选中格。',
      '填满且全部正确即完成；卡住时可以用「提示一格」。'
    ],
    '数独解题器': [
      '按题目把数字填进棋盘，空格留空。',
      '点「求解」后会自动求出答案，并提示是否唯一解。',
      '点「清空题目」可以重新录入。'
    ],
    '猜数字': [
      '系统随机想一个 1~100 的整数，输入你的猜测后按回车或点「猜！」。',
      '每猜一次会提示偏大或偏小，并在下方记录历史猜测。',
      '猜中即结束，次数越少越好；「换一局」重新开始。'
    ],
    '迷宫生成': [
      '点「生成新迷宫」得到随机迷宫，方向键 / WASD 移动，从左上走到右下。',
      '点「显示解法」会画出从起点到终点的路径。',
      '到达终点即完成，用时从第一次移动开始统计。'
    ],
    '拼图游戏': [
      '点击与空格相邻的数字块移动，把数字按顺序排好即完成。',
      '点击「重新打乱」可换一局，步数与用时会被记录。',
      '先固定第一行与第一列，再收尾最后两格，是最省步数的思路。'
    ],
    '华容道': [
      '点击与空格相邻的数字块移动，把 1~15 按顺序排好、空格在右下角即完成。',
      '「显示解法」只给出目标状态提示，不直接代打。',
      '步数与用时记录在本机，可以反复挑战更少步数。'
    ],
    '心算挑战': [
      '点「开始」后在 60 秒内尽可能多地答对加减乘除题。',
      '输入答案后按回车提交，答对连击加分，答错会短暂停顿。',
      '时间结束后给出得分、最高连对与记录。'
    ],
    '反应测试': [
      '点「开始」后等待屏幕变色，变色瞬间尽快点击。',
      '共测 5 次，抢跑或过早点击会有提示，本次不计入。',
      '结束后给出平均反应时间与最佳成绩。'
    ],
    '色彩辨识度测试': [
      '点「开始」后在九宫格中找出颜色略有不同的一格。',
      '每答对一次得分并提升难度，30 秒内尽量多答。',
      '结束后给出得分与关卡，结果仅供娱乐参考。'
    ],
    '找不同': [
      '每局有 3 处不同，点击右图中与原图不同的格子。',
      '点错会短暂标红；「提示一处」会标出一处并影响最终得分。',
      '找齐 3 处即结算，用时与得分记录在本机。'
    ],
    '消消乐小游戏': [
      '点击两个相邻方块交换位置，凑成三个及以上同色连成一线即可消除。',
      '换不出三连的交换会自动还原，不消耗步数。',
      '30 步内尽量拿到 400 分，连锁消除得分更高；步数用完即结算。'
    ]
  };
  function designGroupOf(name) {
    for (const g of DESIGN_GROUP_ORDER) if (DESIGN_GROUPS[g].includes(name)) return g;
    return '其他';
  }

  const CATALOG = window.CATALOG || [];
  const ALL = [];
  CATALOG.forEach((cat, ci) => {
    cat.tools.forEach((t) => {
      const [name, desc, extra] = t;
      let py = '';
      try {
        if (window.pinyinPro) {
          py = window.pinyinPro.pinyin(name.replace(/[^\u4e00-\u9fa5]/g, ''), { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
        }
      } catch (e) { /* 忽略拼音失败 */ }
      ALL.push({
        name, desc, cat, catId: cat.id, catIndex: ci + 1, gid: ALL.length + 1, py,
        group: cat.id === 'design' ? designGroupOf(name) : '',
        hay: (name + ' ' + desc + ' ' + (extra || '') + ' ' + cat.name + ' ' + cat.en + ' ' + py).toLowerCase()
      });
    });
  });
  const byName = Object.create(null);
  ALL.forEach(t => { byName[t.name] = t; });

  /* ---------------- 本地存储 ---------------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('toolbox_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('toolbox_' + k, JSON.stringify(v)); } catch (e) { /* 忽略隐私模式限制 */ } }
  };
  let favs = LS.get('favs', []);
  if (!Array.isArray(favs)) favs = [];
  favs = favs.filter(n => byName[n]);
  const isFav = n => favs.indexOf(n) >= 0;

  /* ---------------- 状态 ---------------- */
  const state = { view: 'home', cat: null, query: '', tool: null };

  /* ---------------- 元素 ---------------- */
  const el = {
    homeView: document.getElementById('homeView'),
    toolView: document.getElementById('toolView'),
    aboutView: document.getElementById('aboutView'),
    catBlocks: document.getElementById('catBlocks'),
    hero: document.querySelector('.hero'),
    features: document.getElementById('features'),
    howto: document.getElementById('howto'),
    recentBlock: document.getElementById('recentBlock'),
    recentGrid: document.getElementById('recentGrid'),
    heroStats: document.getElementById('heroStats'),
    topStat: document.getElementById('topStat'),
    sideNav: document.getElementById('sideNav'),
    toolIco: document.getElementById('toolIco'),
    toolTitle: document.getElementById('toolTitle'),
    toolDesc: document.getElementById('toolDesc'),
    toolMeta: document.getElementById('toolMeta'),
    toolPanel: document.getElementById('toolPanel'),
    toolAside: document.getElementById('toolAside'),
    crumbs: document.getElementById('crumbs'),
    related: document.getElementById('related'),
    favToggle: document.getElementById('favToggle'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    main: document.getElementById('main'),
    // eslint-disable-next-line no-restricted-globals
    search: document.getElementById('search'),
    searchbox: document.querySelector('.searchbox'),
    clearSearch: document.getElementById('clearSearch')
  };

  /* ---------------- 主题 ---------------- */
  document.documentElement.dataset.theme = LS.get('theme', 'light') === 'dark' ? 'dark' : 'light';
  document.getElementById('themeBtn').onclick = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    LS.set('theme', next);
    T.toast(next === 'dark' ? '已切换深色主题' : '已切换浅色主题');
  };

  /* ---------------- 侧栏 ---------------- */
  function renderSide() {
    let h = `<div class="side-label">工具目录</div>
      <button class="side-item ${state.view === 'home' && !state.cat ? 'active' : ''}" data-nav="home">${svg('dev')}<span>全部工具</span><span class="side-count">${ALL.length}</span></button>
      <button class="side-item ${state.view === 'fav' ? 'active' : ''}" data-nav="fav">${svg('emptyStar')}<span>我的收藏</span><span class="side-count">${favs.length}</span></button>
      <div class="side-sep"></div><div class="side-label">分类</div>`;
    CATALOG.forEach(c => {
      h += `<button class="side-item ${state.cat === c.id ? 'active' : ''}" data-nav="cat" data-cat="${c.id}" title="${T.esc(c.desc)}">${svg(c.icon)}<span>${T.esc(c.name)}</span><span class="side-count">${c.tools.length}</span></button>`;
    });
    h += `<div class="side-sep"></div><button class="side-item ${state.view === 'about' ? 'active' : ''}" data-nav="about"><svg class="side-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><span>关于本站</span></button>`;
    el.sideNav.innerHTML = h;
  }

  /* ---------------- 卡片 ---------------- */
  function cardHTML(t) {
    const ready = T.has(t.name);
    const fav = isFav(t.name);
    const name = T.esc(t.name);
    const href = '#/t/' + encodeURIComponent(t.name);
    return `<div class="tool-card">
      <a class="tc-link" href="${href}" aria-label="打开工具：${name}"></a>
      <div class="tc-top">
        <span class="tc-ico">${svg(t.cat.icon)}</span>
        <span class="tc-name">${name}</span>
        <span class="tc-no">${String(t.gid).padStart(3, '0')}</span>
      </div>
      <div class="tc-desc">${T.esc(t.desc)}</div>
      <div class="tc-foot">
        <span class="status ${ready ? 'ready' : 'soon'}"><i></i>${ready ? '可用' : '即将上线'}</span>
        <button class="tc-fav ${fav ? 'on' : ''}" data-fav="${name}" aria-label="${fav ? '取消收藏' : '收藏'}${name}" aria-pressed="${fav}" title="${fav ? '取消收藏' : '收藏'}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/></svg>
        </button>
      </div>
    </div>`;
  }
  const grid = list => `<div class="tool-grid">${list.map(cardHTML).join('')}</div>`;
  function listBlock(list) {
    if (!list.some(t => t.group && t.group !== '其他')) return grid(list);
    const order = DESIGN_GROUP_ORDER.concat(['其他']);
    return order.map(g => {
      const items = list.filter(t => (t.group || '其他') === g);
      if (!items.length) return '';
      return `<div class="tool-sub">
        <div class="sub-head"><span class="sub-name">${T.esc(g)}</span><span class="sub-count">${items.length} 个工具</span></div>
        ${grid(items)}
      </div>`;
    }).join('');
  }

  function emptyState(kind, title, text) {
    return `<div class="empty-state">
      <div class="es-ico"><svg viewBox="0 0 24 24">${kind === 'star' ? ICONS.emptyStar : ICONS.emptySearch}</svg></div>
      <h3>${title}</h3><p>${text}</p></div>`;
  }

  /* ---------------- 首页 ---------------- */
  function renderStats() {
    const ready = T.count();
    el.heroStats.innerHTML = `
      <div class="hstat accent"><b>${ALL.length}</b><span>工具总数</span></div>
      <div class="hstat"><b>${ready}</b><span>已上线可用</span></div>
      <div class="hstat"><b>${CATALOG.length}</b><span>工具分类</span></div>
      <div class="hstat"><b>0</b><span>内容上传次数</span></div>`;
    el.topStat.textContent = `${ready} / ${ALL.length} 可用`;
  }

  function renderRecents() {    const stored = LS.get('recent', []);
    const names = (Array.isArray(stored) ? stored : []).filter(n => byName[n]).slice(0, 5);
    if (state.view !== 'home' || state.cat || !names.length) {
      el.recentBlock.hidden = true;
      el.recentGrid.innerHTML = '';
      return;
    }
    el.recentBlock.hidden = false;
    el.recentGrid.innerHTML = names.map(n => cardHTML(byName[n])).join('');
  }

  function addRecent(name) {
    if (!byName[name]) return;
    const stored = LS.get('recent', []);
    const list = (Array.isArray(stored) ? stored : []).filter(n => n !== name);
    list.unshift(name);
    LS.set('recent', list.slice(0, 8));
  }

  function setHomeChrome(isHome) {
    el.hero.classList.toggle('hidden', !isHome);
    el.features.classList.toggle('hidden', !isHome);
    el.howto.classList.toggle('hidden', !isHome);
    if (!isHome) el.recentBlock.hidden = true;
  }

  function renderHome() {
    const isDefaultHome = state.view === 'home' && !state.cat;
    setHomeChrome(isDefaultHome);
    let html = '';

    if (state.view === 'q') {
      const q = state.query.trim();
      const res = q ? ALL.filter(t => matchQuery(t, q)) : [];
      html = `<div class="list-title"><h2>搜索结果</h2><span>关键词「${T.esc(q)}」 · 找到 ${res.length} 个工具</span></div>` +
        (res.length ? grid(res) : emptyState('search', '没有找到相关工具', '换个关键词试试，例如「PDF」「压缩」「个税」「regex」，也可以直接输入拼音首字母。'));
    } else if (state.view === 'fav') {
      const res = ALL.filter(t => isFav(t.name));
      html = `<div class="list-title"><h2>我的收藏</h2><span>共 ${res.length} 个 · 点击卡片右下角星标可收藏或取消</span></div>` +
        (res.length ? grid(res) : emptyState('star', '还没有收藏的工具', '在任意工具卡片上点击星标，下次就能在这里快速找到它。'));
    } else if (state.cat) {
      const c = CATALOG.find(x => x.id === state.cat);
      if (!c) { location.hash = '#/'; return; }
      const list = ALL.filter(t => t.catId === state.cat);
      html = `<div class="list-title"><h2>${T.esc(c.name)}</h2><span>${T.esc(c.desc)} · ${list.length} 个工具</span></div>` + listBlock(list);
    } else {
      CATALOG.forEach((c, i) => {
        const list = ALL.filter(t => t.catId === c.id);
        html += `<div class="cat-block" id="cat-${c.id}">
          <div class="cat-head">
            <span class="cat-no">${String(i + 1).padStart(2, '0')}</span>
            <span class="cat-badge">${svg(c.icon)}</span>
            <div class="cat-title">
              <h3>${T.esc(c.name)}<em>${T.esc(c.en)}</em></h3>
              <p>${T.esc(c.desc)}</p>
            </div>
            <span class="cat-meta">${list.length} 个工具</span>
          </div>
          ${listBlock(list)}
        </div>`;
      });
    }
    el.catBlocks.innerHTML = html;
    renderRecents();
  }

  function matchQuery(t, q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(part => t.hay.indexOf(part) >= 0);
  }

  /* ---------------- 工具说明 ---------------- */
  function usageSteps(t, cfg) {
    if (!cfg) {
      return [
        '该工具尚未开放，界面与说明来自设计稿。',
        '可以先从下方的「同类工具」中选择已上线的替代方案。',
        '也可以在顶部搜索框输入关键词，查找功能相近的工具。'
      ];
    }
    if (Array.isArray(cfg.steps) && cfg.steps.length) return cfg.steps.slice();
    const steps = [];
    if (cfg.render) {
      if (t.catId === 'game') {
        if (GAME_STEPS[t.name]) return GAME_STEPS[t.name].slice();
        steps.push('先在面板里选择难度并点击「开始游戏」，倒计时结束后即可操作。');
        steps.push('键盘方向键 / WASD 控制，空格暂停；手机上可用面板内的方向按钮。');
        steps.push('结束时会出现结算面板，显示本局成绩、用时与最高记录，可一键再来一局。');
      } else if (t.catId === 'system') {
        steps.push('点击面板内的检测按钮，按页面提示操作；摄像头、麦克风与全屏检测需要浏览器授权。');
        steps.push('检测结果会显示在面板中，可复制或刷新；拒绝授权不影响其他工具。');
        steps.push('所有检测都在当前浏览器内完成，不会上传设备信息。');
      } else {
        steps.push('在面板内先完成输入或选择，再点击主操作按钮；面板顶部的工具栏会显示当前状态。');
        steps.push('结果直接显示在同一面板中，可预览、复制或下载；出现红色提示时按提示修正输入。');
        steps.push('所有处理都在当前浏览器内完成，页面关闭后不会在服务器留下副本。');
      }
    } else {
      const fields = cfg.fields || [];
      const hasFile = fields.some(f => f.type === 'file' || f.type === 'files');
      const labels = fields.filter(f => f.type !== 'file' && f.type !== 'files').map(f => f.label).filter(Boolean);
      steps.push('页面为左右分栏：左边调参数，右边看预览；窄屏时用上方「参数设置 / 结果预览」切换，不必来回滚动。');
      if (hasFile) steps.push('点击「选择文件」或将文件拖入虚线区域；选择后可点「清除」重新选择。');
      if (labels.length) {
        const head = labels.slice(0, 4).map(x => `「${x}」`).join('');
        steps.push('设置参数' + (labels.length > 4 ? `，包括${head}等 ${labels.length} 项` : `：${head}`) + (hasFile ? '，再确认输出格式等选项。' : '；带说明的字段会提示取值范围，输入框右侧的 × 可一键清空。'));
      } else if (!hasFile) {
        steps.push('在上方表单中设置参数。');
      }
      if (cfg.live) steps.push('参数变化后结果会自动刷新，不需要重复点击按钮。');
      else steps.push(`点击「${cfg.runLabel || '开始处理'}」，等待浏览器完成本地运算；输入框内按 Enter 或 Ctrl / ⌘ + Enter 也可以执行。`);
      steps.push('在结果区预览、复制或下载；点「重置」可恢复默认参数。');
    }
    return steps;
  }

  function controlName(f) {
    return ({ file: '文件选择', files: '多文件', textarea: '多行文本', select: '下拉选择', checkbox: '开关', color: '颜色选择', range: '滑块', number: '数字输入', date: '日期', time: '时间' }[f.type] || '文本输入');
  }
  function defaultText(f) {
    if (f.type === 'file' || f.type === 'files') return '—';
    if (f.type === 'checkbox') return f.def ? '开' : '关';
    const v = f.def == null ? '' : String(f.def);
    return v.length > 22 ? v.slice(0, 22) + '…' : (v || '空');
  }

  function renderAside(t) {
    const doc = (window.TOOL_DOCS || {})[t.name];
    const cfg = T.get(t.name);
    const intro = (doc && doc.intro) || t.desc;
    const feat = doc && doc.feat;
    const out = doc && doc.out;
    const tips = doc && doc.tips;
    const steps = usageSteps(t, cfg);
    const fields = (cfg && cfg.fields) || [];
    const params = fields.length ? `<details class="aside-params">
        <summary>参数说明（${fields.length} 项）</summary>
        <div class="param-list">
          ${fields.map(f => `<div class="param-row"><div class="param-name">${T.esc(f.label || f.key)}</div><div class="param-type">${T.esc(controlName(f))}</div><div class="param-def">${T.esc(defaultText(f))}${f.hint ? `<em>${T.esc(f.hint)}</em>` : ''}</div></div>`).join('')}
        </div>
      </details>` : '';

    el.toolAside.innerHTML = `
      <div class="tool-doc">
        <section class="doc-col">
          <h3><span>01</span>功能介绍</h3>
          <p class="aside-text">${T.esc(intro)}</p>
          ${feat ? `<p class="aside-text">${T.esc(feat)}</p>` : ''}
          ${cfg ? `<p class="aside-text">${t.catId === 'game' ? '单局成绩与用时保存在本机浏览器，可在「游戏记录」里查看或清空。' : cfg.render ? '操作、参数与预览都在同一面板内，改动后即时生效，不需要额外提交。' : '表单在左、预览在右，参数与结果同屏可见；窄屏时用上方「参数设置 / 结果预览」切换。'}</p>` : ''}
        </section>
        <section class="doc-col">
          <h3><span>02</span>使用说明</h3>
          <ol class="aside-steps">${steps.map(s => `<li>${T.esc(s)}</li>`).join('')}</ol>
          ${params}
        </section>
        <section class="doc-col">
          <h3><span>03</span>输出与提示</h3>
          ${out ? `<p class="aside-text">${T.esc(out)}</p>` : `<p class="aside-text">结果以预览卡片的形式呈现，每张卡片右上角都提供复制、下载等出口。</p>`}
          ${tips ? `<div class="aside-note"><b>使用提示</b><p>${T.esc(tips)}</p></div>` : ''}
          ${t.catId === 'game' ? `<div class="aside-note"><b>计时与记录</b><p>本局用时从第一次操作开始计时，成绩保存在本机；可在「游戏记录」中查看或清空。</p></div>` : ''}
          ${t.catId === 'system' ? `<div class="aside-note"><b>授权提示</b><p>摄像头、麦克风与全屏检测需要浏览器授权或用户点击触发；拒绝授权不影响其他工具。</p></div>` : ''}
          ${NET_TOOLS.has(t.name) ? `<div class="aside-note"><b>需要联网</b><p>该工具会访问第三方公共接口，只发送查询所需的内容；请勿提交敏感信息。</p></div>` : ''}
          ${cfg ? '' : `<div class="aside-note"><b>尚未上线</b><p>该工具还没有注册实现，可以先使用下方的同类工具，或稍后再来查看。</p></div>`}
          <div class="aside-privacy">${svg('shield')}<p>${NET_TOOLS.has(t.name) ? '除查询所需内容外，文件与输入不会上传；接口由第三方提供。' : '内容只在本地处理，文件与输入不会上传到服务器，也不会写入本站存储。'}</p></div>
        </section>
      </div>`;
  }

  /* ---------------- 工具详情 ---------------- */
  function renderTool(name) {
    const t = byName[name];
    if (!t) { location.hash = '#/'; return; }
    const ready = T.has(name);

    el.crumbs.innerHTML = `<a href="#/">全部工具</a><span aria-hidden="true">/</span><a href="#/c/${t.catId}">${T.esc(t.cat.name)}</a><span aria-hidden="true">/</span><span>${T.esc(t.name)}</span>`;
    el.toolIco.innerHTML = svg(t.cat.icon, '');
    el.toolTitle.innerHTML = `${T.esc(t.name)}<a class="tool-cat-tag" href="#/c/${t.catId}" title="查看 ${T.esc(t.cat.name)} 分类">${T.esc(t.cat.name)}</a>`;
    el.toolDesc.textContent = t.desc;
    el.toolMeta.innerHTML =
      (t.group ? `<span class="meta-item">${T.esc(t.group)}</span>` : '') +
      `<span class="meta-item">NO. ${String(t.gid).padStart(3, '0')}</span>` +
      `<span class="meta-item">本地运行 · 不上传</span>` +
      (NET_TOOLS.has(t.name) ? `<span class="meta-item is-net">需联网</span>` : '') +
      (ready ? `<span class="meta-item is-ready">已上线</span>` : `<span class="meta-item is-soon">即将上线</span>`);

    updateFavToggle();
    renderAside(t);
    T.mount(el.toolPanel, name);

    const related = ALL.filter(x => x.catId === t.catId && x.name !== name).slice(0, 8);
    el.related.innerHTML = related.length
      ? `<h4>同类工具</h4><div class="rel-grid">${related.map(x => `<a class="rel-item" href="#/t/${encodeURIComponent(x.name)}"><span class="rel-ico">${svg(x.cat.icon, '')}</span><span class="rel-name">${T.esc(x.name)}</span><span class="rel-go">→</span></a>`).join('')}</div>`
      : '';
    document.title = `${t.name} · 拾器 ToolBox`;
    addRecent(name);
    el.main.scrollTop = 0;
  }

  function updateFavToggle() {
    const name = state.tool;
    const fav = name ? isFav(name) : false;
    el.favToggle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/></svg>${fav ? '已收藏' : '收藏'}`;
    el.favToggle.classList.toggle('on', fav);
    el.favToggle.setAttribute('aria-pressed', String(fav));
  }

  /* ---------------- 收藏 ---------------- */
  function syncFavUI() {
    document.querySelectorAll('[data-fav]').forEach(btn => {
      const name = btn.dataset.fav;
      const fav = isFav(name);
      btn.classList.toggle('on', fav);
      btn.setAttribute('aria-pressed', String(fav));
      btn.setAttribute('aria-label', (fav ? '取消收藏' : '收藏') + name);
      btn.title = fav ? '取消收藏' : '收藏';
    });
    if (state.view === 'tool') updateFavToggle();
  }

  function toggleFav(name) {
    const i = favs.indexOf(name);
    if (i >= 0) { favs.splice(i, 1); T.toast('已取消收藏'); }
    else { favs.push(name); T.toast('已加入收藏'); }
    LS.set('favs', favs);
    renderSide();
    syncFavUI();
    if (state.view === 'fav') renderHome();
  }

  /* ---------------- 路由 ---------------- */
  function parseHash() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (h === 'main') return;
    state.cat = null; state.query = ''; state.tool = null;
    if (h.startsWith('t/')) { state.view = 'tool'; state.tool = h.slice(2); state.cat = byName[state.tool] ? byName[state.tool].catId : null; }
    else if (h.startsWith('c/')) { state.view = 'home'; state.cat = h.slice(2); }
    else if (h.startsWith('q/')) { state.view = 'q'; state.query = h.slice(2); }
    else if (h === 'fav') { state.view = 'fav'; }
    else if (h === 'about') { state.view = 'about'; }
    else { state.view = 'home'; }
    renderCurrent();
  }

  function animateView(view) {
    if (!view || !view.classList) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    view.classList.remove('view-in');
    void view.offsetWidth;
    view.classList.add('view-in');
  }

  function renderCurrent() {
    renderSide();
    renderStats();
    const isTool = state.view === 'tool';
    const isAbout = state.view === 'about';
    el.toolView.classList.toggle('hidden', !isTool);
    el.aboutView.classList.toggle('hidden', !isAbout);
    el.homeView.classList.toggle('hidden', isTool || isAbout);
    if (search.value !== (state.view === 'q' ? state.query : '')) {
      search.value = state.view === 'q' ? state.query : '';
      el.searchbox.classList.toggle('has-value', !!search.value);
    }
    if (isTool) {
      renderTool(state.tool);
    } else if (isAbout) {
      document.title = '关于本站 · 拾器 ToolBox';
      el.main.scrollTop = 0;
    } else {
      renderHome();
      document.title = '拾器 ToolBox · 本地运行的在线工具集';
      el.main.scrollTop = 0;
    }
    document.getElementById('favBtn').classList.toggle('active', state.view === 'fav');
    document.body.classList.remove('nav-open');
    document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
    if (!isTool) {
      T.resetCleanups();
      if (el.toolPanel) el.toolPanel.innerHTML = '';
    }
    animateView(isTool ? el.toolView : isAbout ? el.aboutView : el.homeView);
    document.getElementById('main').scrollTop = 0;
  }

  window.APP = {
    showHome() { location.hash = '#/'; },
    state, ALL, byName, toggleFav, isFav, renderCurrent
  };

  /* ---------------- 事件 ---------------- */
  const search = el.search;
  let searchTimer = null;
  search.addEventListener('input', () => {
    const v = search.value;
    el.searchbox.classList.toggle('has-value', !!v);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (v.trim()) location.hash = '#/q/' + encodeURIComponent(v.trim());
      else if (state.view === 'q') location.hash = '#/';
    }, 160);
  });
  el.clearSearch.onclick = () => {
    search.value = '';
    el.searchbox.classList.remove('has-value');
    location.hash = '#/';
    search.focus();
  };
  document.getElementById('heroSearchBtn').onclick = () => search.focus();

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); search.focus(); search.select();
    }
    if (e.key === 'Escape') {
      const zb = document.getElementById('imgZoom');
      if (zb && zb.classList.contains('show')) { closeZoom(); return; }
      if (document.activeElement === search) { search.blur(); return; }
      if (state.view === 'tool' || state.view === 'about') location.hash = '#/';
    }
  });

  el.copyLinkBtn.onclick = async () => {
    const url = location.origin + location.pathname + location.hash;
    try {
      await navigator.clipboard.writeText(url);
      T.toast('链接已复制');
    } catch (e) {
      T.toast('复制失败，请手动复制地址栏链接', 'err');
    }
  };

  el.favToggle.onclick = () => { if (state.tool) toggleFav(state.tool); };
  document.getElementById('infoBtn').onclick = () => {
    const info = document.querySelector('.tool-aside');
    if (!info) return;
    info.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  document.getElementById('favBtn').onclick = () => { location.hash = '#/fav'; };
  document.getElementById('menuBtn').onclick = () => {
    const open = document.body.classList.toggle('nav-open');
    document.getElementById('menuBtn').setAttribute('aria-expanded', String(open));
  };
  document.getElementById('mobileMask').onclick = () => {
    document.body.classList.remove('nav-open');
    document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
  };
  document.getElementById('clearRecent').onclick = () => {
    LS.set('recent', []);
    renderRecents();
    T.toast('已清空最近使用');
  };

  /* ---------------- 结果图片放大查看 ---------------- */
  function openZoom(src, alt) {
    let box = document.getElementById('imgZoom');
    if (!box) {
      box = document.createElement('div');
      box.id = 'imgZoom'; box.className = 'img-zoom';
      box.innerHTML = '<img alt=""><button type="button" class="img-zoom-close" aria-label="关闭预览">×</button><span class="img-zoom-tip">点击任意位置或按 Esc 关闭 · 右键可另存</span>';
      document.body.appendChild(box);
      box.addEventListener('click', () => box.classList.remove('show'));
    }
    const img = box.querySelector('img');
    img.src = src; img.alt = alt || '预览图';
    box.classList.add('show');
  }
  function closeZoom() {
    const box = document.getElementById('imgZoom');
    if (box) box.classList.remove('show');
  }

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const k = nav.dataset.nav;
      location.hash = k === 'home' ? '#/' : k === 'fav' ? '#/fav' : k === 'about' ? '#/about' : '#/c/' + nav.dataset.cat;
      return;
    }
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(fav.dataset.fav);
      return;
    }
    const jump = e.target.closest('[data-jump]');
    if (jump) { location.hash = '#/c/' + jump.dataset.jump; return; }
    const zoomable = e.target.closest('.image-out img, #toolPanel .thumb img');
    if (zoomable) { openZoom(zoomable.src, zoomable.alt); }
  });

  window.addEventListener('hashchange', parseHash);

  /* ---------------- 启动 ---------------- */
  const kbd = document.getElementById('searchKbd');
  if (kbd) kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘ K' : 'Ctrl K';
  function syncSearchPlaceholder() {
    if (!search) return;
    search.placeholder = window.innerWidth < 620
      ? '搜索工具…'
      : '搜索工具名称或关键词，如 PDF、二维码、个税';
  }
  syncSearchPlaceholder();
  window.addEventListener('resize', syncSearchPlaceholder);

  function init() {
    renderStats();
    document.title = ALL.length ? `拾器 ToolBox · ${ALL.length} 个本地工具` : '拾器 ToolBox';
    parseHash();
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
