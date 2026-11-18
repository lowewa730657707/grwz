/* ============================================================
   工具实现：教育学习（可打印练习纸 / 练习生成 / 学科辅助）
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

  const A4W = 794, A4H = 1123, M = 46;

  /* 通用练习纸渲染器 */
  function paper(name, controls, draw, extraHTML) {
    R(name, {
      steps: [
        '在左侧设置纸张参数：标题、行列数、字号等；清空标题输入框后纸张上就不再显示标题。',
        '右侧是 A4 纵向实时预览，参数改动会立即重绘，不需要点击生成按钮。',
        '点「下载 PNG」保存图片，或点「打印」直接打印。',
        '打印时请选择「实际大小 / 100%」，不要选「适应页面」，否则格子会被缩放。'
      ],
      render(host, api) {
      host.innerHTML = `<div class="ws ws-split">
        <div class="ws-tabs" role="tablist"><button type="button" class="ws-tab is-on" data-tab="ctl" role="tab" aria-selected="true">参数设置</button><button type="button" class="ws-tab" data-tab="out" role="tab" aria-selected="false">纸张预览</button></div>
        <div class="ws-col ws-ctl is-on" data-col="ctl">
          <div class="ws-bar"><span class="ws-bar-title">参数设置</span><span class="ws-bar-meta">${controls.length} 项参数</span><button type="button" class="ws-bar-btn" id="ppReset">重置</button></div>
          <div class="ws-body">
            <div class="tool-form"><div class="form-grid" id="ppForm">${controls.map(T.fieldHTML).join('')}</div></div>
            ${extraHTML || ''}
            <div class="cp-row" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><button class="btn btn-primary" id="ppDl">下载 PNG（可直接打印）</button><button class="btn btn-ghost" id="ppPrint">打印</button></div>
            <div class="cp-note" style="margin-top:8px">A4 纵向 · 300dpi 等效清晰度 · 全部在本地生成</div>
          </div>
        </div>
        <div class="ws-col ws-out" data-col="out">
          <div class="ws-bar"><span class="ws-bar-title">纸张预览</span><span class="ws-out-stat" id="ppStat">A4 · 794 × 1123</span></div>
          <div class="ws-body">
            <div class="cp-canvas-wrap"><canvas id="ppCanvas" width="${A4W}" height="${A4H}"></canvas></div>
          </div>
        </div>
      </div>`;
      const form = host.querySelector('#ppForm'), cv = host.querySelector('#ppCanvas'), ctx = cv.getContext('2d');
      function redraw() {
        const v = T.collect(form, controls);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, A4W, A4H);
        try { draw(ctx, v, A4W, A4H); }
        catch (e) { ctx.fillStyle = '#c00'; ctx.fillText('绘制失败：' + e.message, 60, 60); }
      }
      form.querySelectorAll('[data-key]').forEach(el => {
        el.addEventListener('input', redraw); el.addEventListener('change', redraw);
      });
      host.querySelector('#ppDl').onclick = () => T.save(cv.toDataURL('image/png'), name + '.png');
      host.querySelector('#ppPrint').onclick = () => window.print();
      host.querySelector('#ppReset').onclick = () => {
        controls.forEach(f => {
          const el = form.querySelector(`[data-key="${f.key}"]`);
          if (!el) return;
          if (f.type === 'checkbox') el.checked = !!f.def;
          else if (f.type === 'color') {
            const v = f.def || '#6366f1';
            el.value = v;
            const hx = form.querySelector(`[data-hex="${f.key}"]`);
            if (hx) hx.value = v;
          } else if (f.type === 'range') {
            const v = f.def == null ? (f.min == null ? 0 : f.min) : f.def;
            el.value = v;
            const o = form.querySelector(`[data-out="${f.key}"]`);
            if (o) o.textContent = v;
          } else el.value = f.def == null ? '' : f.def;
        });
        redraw();
        T.toast('已恢复默认参数');
      };
      redraw();
      if (controls.some(f => f.type === 'color')) {
        form.querySelectorAll('input[type=color]').forEach(inp => {
          const hex = form.querySelector(`[data-hex="${inp.dataset.key}"]`);
          inp.addEventListener('input', () => { if (hex) hex.value = inp.value; });
          if (hex) hex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(hex.value)) inp.value = hex.value; });
        });
      }
    }});
  }
  const gridLines = (ctx, x0, y0, w, h, cols, rows, color, lw) => {
    ctx.strokeStyle = color || '#d8dee9'; ctx.lineWidth = lw || 1;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) { ctx.moveTo(x0 + i*w/cols, y0); ctx.lineTo(x0 + i*w/cols, y0+h); }
    for (let j = 0; j <= rows; j++) { ctx.moveTo(x0, y0 + j*h/rows); ctx.lineTo(x0+w, y0 + j*h/rows); }
    ctx.stroke();
  };
  const title = (ctx, text, sub) => {
    const t = String(text == null ? '' : text).trim();
    if (t) {
      ctx.fillStyle = '#1b2337'; ctx.font = 'bold 24px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t, A4W/2, 34);
    }
    if (sub) { ctx.fillStyle = '#8893a9'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(sub, A4W/2, t ? 54 : 34); }
    ctx.textAlign = 'left';
  };
  const footer = ctx => { ctx.fillStyle = '#b3bccd'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('拾器 ToolBox · 本地生成 · 可自由打印使用', A4W/2, A4H-18); ctx.textAlign = 'left'; };

  /* --- 田字格 --- */
  paper('田字格生成', [N('rows','行数',10),N('cols','列数',8),I('color','线条颜色','#e05a5a',{type:'color'}),C('cross','显示十字虚线',true,'显示虚线'),I('chars','范字（可选，按顺序填入格子）','')], (ctx,v)=>{
    title(ctx,'田字格练习纸','按笔顺规范书写 · 每格一字');
    const gw=(A4W-M*2)/v.cols, gh=(A4H-100-M)/v.rows, size=Math.min(gw,gh);
    const ox=(A4W-size*v.cols)/2, oy=80;
    const chars=String(v.chars||'').replace(/\s/g,'').split('');
    ctx.strokeStyle=v.color;ctx.lineWidth=1.4;
    for(let r=0;r<v.rows;r++)for(let c=0;c<v.cols;c++){
      const x=ox+c*size,y=oy+r*size;
      ctx.strokeRect(x,y,size,size);
      if(v.cross){ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle=v.color;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(x+size/2,y);ctx.lineTo(x+size/2,y+size);ctx.moveTo(x,y+size/2);ctx.lineTo(x+size,y+size/2);ctx.stroke();ctx.restore();}
      const ch=chars[r*v.cols+c];if(ch){ctx.fillStyle='#d5dae4';ctx.font=`${Math.floor(size*.7)}px "KaiTi","STKaiti",serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ch,x+size/2,y+size/2);ctx.textBaseline='alphabetic';ctx.textAlign='left';}
    }
    footer(ctx);
  });

  /* --- 四线三格 --- */
  paper('四线三格英语本', [N('lines','行组数',12),I('color','线条颜色','#5b8def',{type:'color'}),C('label','显示行号',false,'显示行号')], (ctx,v)=>{
    title(ctx,'四线三格英语书写纸','注意字母占格：上中下三格');
    const top=84,avail=A4H-top-M,gap=avail/v.lines,h=Math.min(gap*.62,52);
    ctx.strokeStyle=v.color;ctx.lineWidth=1.3;
    for(let i=0;i<v.lines;i++){
      const y=top+i*gap+14;
      for(let j=0;j<4;j++){ctx.beginPath();ctx.lineWidth=j===0||j===3?1.6:1;
        if(j===1||j===2){ctx.setLineDash([6,5]);}else ctx.setLineDash([]);
        ctx.moveTo(M,y+j*h/3);ctx.lineTo(A4W-M,y+j*h/3);ctx.stroke();}
      ctx.setLineDash([]);
      if(v.label){ctx.fillStyle='#c3cad7';ctx.font='10px sans-serif';ctx.fillText(String(i+1),M-24,y+h/3);}
    }
    ctx.setLineDash([]);footer(ctx);
  });

  /* --- 方格稿纸 --- */
  paper('方格稿纸生成', [N('cols','每行格数',20),N('rows','行数',25),I('color','格子颜色','#cfd8e6',{type:'color'})], (ctx,v)=>{
    title(ctx,'方格稿纸',`每页 ${v.cols} × ${v.rows} 格`);
    const w=A4W-M*2,cell=w/v.cols,h=Math.min(cell,(A4H-100-M)/v.rows);
    gridLines(ctx,M,80,v.cols*h,v.rows*h,v.cols,v.rows,v.color,1);
    ctx.strokeStyle='#9aa7ba';ctx.lineWidth=1.6;ctx.strokeRect(M,80,v.cols*h,v.rows*h);
    footer(ctx);
  });

  /* --- 坐标纸 --- */
  paper('坐标纸生成', [N('step','小格边长（px）',20),C('axis','显示坐标轴与刻度',true,'显示坐标轴'),I('color','网格颜色','#d7dfeb',{type:'color'})], (ctx,v)=>{
    title(ctx,'坐标纸','适用于函数图像与几何作图');
    const s=Math.max(8,Number(v.step)||20),x0=M,y0=78,w=A4W-M*2,h=A4H-110-M;
    const cols=Math.floor(w/s),rows=Math.floor(h/s);
    gridLines(ctx,x0,y0,cols*s,rows*s,cols,rows,v.color,.8);
    if(v.axis){
      const cx=x0+cols*s/2,cy=y0+rows*s/2;
      ctx.strokeStyle='#2c3a55';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x0+cols*s,cy);ctx.moveTo(cx,y0);ctx.lineTo(cx,y0+rows*s);ctx.stroke();
      ctx.fillStyle='#2c3a55';ctx.font='10px sans-serif';ctx.textAlign='center';
      for(let i=-Math.floor(cols/2);i<=Math.floor(cols/2);i++){if(i===0||i%5!==0)continue;const x=cx+i*s;ctx.fillText(String(i),x,cy+14);}
      ctx.textAlign='right';
      for(let j=-Math.floor(rows/2);j<=Math.floor(rows/2);j++){if(j===0||j%5!==0)continue;const y=cy-j*s;ctx.fillText(String(j),cx-6,y+3);}
      ctx.textAlign='left';
    }
    footer(ctx);
  });

  /* --- 五线谱 --- */
  paper('五线谱草稿纸', [N('groups','谱表组数',10),I('color','谱线颜色','#404a5e',{type:'color'}),C('clef','绘制谱号符号',true,'显示谱号')], (ctx,v)=>{
    title(ctx,'五线谱草稿纸','高音谱号 · 每组五线四间');
    const top=84,avail=A4H-top-M,gap=avail/v.groups,sp=Math.min(gap*.3,11);
    ctx.strokeStyle=v.color;ctx.lineWidth=1;
    for(let i=0;i<v.groups;i++){
      const y=top+i*gap+12;
      for(let j=0;j<5;j++){ctx.beginPath();ctx.moveTo(M,y+j*sp);ctx.lineTo(A4W-M,y+j*sp);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(M,y+4*sp);ctx.moveTo(A4W-M,y);ctx.lineTo(A4W-M,y+4*sp);ctx.stroke();
      if(v.clef){ctx.fillStyle=v.color;ctx.font='42px serif';ctx.fillText('𝄞',M+10,y+4*sp-2);}
    }
    footer(ctx);
  });

  /* --- 简谱草稿纸 --- */
  paper('简谱草稿纸', [N('rows','行数',18),N('bars','每行小节数',4),I('color','线条颜色','#aab4c4',{type:'color'})], (ctx,v)=>{
    title(ctx,'简谱草稿纸','数字简谱 · 小节线与节奏横线');
    const top=84,gap=(A4H-top-M)/v.rows;
    ctx.strokeStyle=v.color;ctx.lineWidth=1;
    for(let i=0;i<v.rows;i++){
      const y=top+i*gap+gap*.5;
      ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(A4W-M,y);ctx.stroke();
      for(let b=0;b<=v.bars;b++){const x=M+(A4W-M*2)*b/v.bars;ctx.beginPath();ctx.moveTo(x,y-16);ctx.lineTo(x,y+16);ctx.stroke();}
    }
    footer(ctx);
  });

  /* --- 答题卡 --- */
  paper('答题卡模板生成', [N('count','题目数量',50),N('options','每题选项数',4),I('school','标题 / 考试名称','课堂练习答题卡')], (ctx,v)=>{
    title(ctx,String(v.school||''),'姓名 ____________　班级 ____________　学号 ____________');
    ctx.fillStyle='#8a94a8';ctx.font='11px sans-serif';
    ctx.fillText('请用 2B 铅笔填涂：● 正确填涂　○ 未填涂　修改时务必擦干净',M,76);
    const perRow=5,rowH=Math.min(96,(A4H-130-M)/Math.ceil(v.count/perRow)),startY=98;
    const letters='ABCDEFGH';
    for(let i=0;i<v.count;i++){
      const r=Math.floor(i/perRow),c=i%perRow,cw=(A4W-M*2)/perRow,x=M+c*cw,y=startY+r*rowH;
      ctx.fillStyle='#1b2337';ctx.font='12px sans-serif';ctx.fillText(String(i+1).padStart(2,'0')+'.',x+4,y+18);
      for(let j=0;j<v.options;j++){
        const ox=x+32+j*30;
        if(ox+20>x+cw-4)break;
        ctx.strokeStyle='#8893a9';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(ox+8,y+14,8,6,0,0,7);ctx.stroke();
        ctx.fillStyle='#5a6478';ctx.font='10px sans-serif';ctx.fillText(letters[j],ox+5,y+34);
      }
    }
    footer(ctx);
  });

  /* --- 课程表 --- */
  paper('课程表模板生成', [N('periods','每天节次',7),I('title','表格标题','课程表'),C('weekend','包含周末',false,'含周六周日')], (ctx,v)=>{
    title(ctx,String(v.title||''),'');
    const days=v.weekend?['周一','周二','周三','周四','周五','周六','周日']:['周一','周二','周三','周四','周五'];
    const x0=M,y0=86,w=A4W-M*2,h=Math.min(A4H-150-M,(v.periods+1)*72),cw=w/(days.length+1),rh=h/(v.periods+1);
    ctx.strokeStyle='#8e9ab0';ctx.lineWidth=1.3;
    for(let i=0;i<=days.length+1;i++){ctx.beginPath();ctx.moveTo(x0+i*cw,y0);ctx.lineTo(x0+i*cw,y0+h);ctx.stroke();}
    for(let j=0;j<=v.periods+1;j++){ctx.beginPath();ctx.moveTo(x0,y0+j*rh);ctx.lineTo(x0+w,y0+j*rh);ctx.stroke();}
    ctx.fillStyle='#2c3a55';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    days.forEach((d,i)=>ctx.fillText(d,x0+(i+1.5)*cw,y0+rh/2));
    ctx.font='12px sans-serif';
    for(let j=0;j<v.periods;j++)ctx.fillText('第 '+(j+1)+' 节',x0+cw/2,y0+(j+1.5)*rh);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';footer(ctx);
  });

  /* --- 错题本 --- */
  paper('错题本模板', [N('rows','每页条目数',6),I('subject','科目','数学')], (ctx,v)=>{
    title(ctx,String(v.subject||''),'日期 / 题目 / 错因 / 正解 / 复盘');
    const heads=['日期','题目与条件','错误原因','正确解法','复盘与提醒'],widths=[.1,.31,.18,.27,.14];
    const x0=M,y0=84,w=A4W-M*2,rh=Math.min(160,(A4H-110-M)/v.rows);
    ctx.strokeStyle='#9aa7ba';ctx.lineWidth=1.2;ctx.fillStyle='#eef2f9';
    for(let r=0;r<v.rows;r++){
      const y=y0+r*rh;ctx.fillRect(x0,y,w,26);ctx.strokeRect(x0,y,w,rh);
      let x=x0;
      heads.forEach((hd,i)=>{const cw=w*widths[i];if(i){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+rh);ctx.stroke();}
        ctx.fillStyle='#4a5670';ctx.font='bold 11px sans-serif';ctx.fillText(hd,x+6,y+17);x+=cw;});
      ctx.fillStyle='#dfe6f0';ctx.setLineDash([3,4]);
      for(let l=1;l<4;l++){ctx.beginPath();ctx.moveTo(x0,y+26+l*(rh-26)/4);ctx.lineTo(x0+w,y+26+l*(rh-26)/4);ctx.stroke();}
      ctx.setLineDash([]);
    }
    ctx.strokeRect(x0,y0,w,v.rows*rh);footer(ctx);
  });

  /* --- 默写表 --- */
  paper('默写表生成', [X('items','词条（每行：中文,英文 / 或单个词）','apple,苹果\nbanana,香蕉\norange,橙子\ngrape,葡萄\nwater,水\nmilk,牛奶\nbread,面包\nbook,书\nschool,学校\nfriend,朋友'),C('hide','隐藏答案列（用于默写）',true,'隐藏答案')], (ctx,v)=>{
    title(ctx,'默写表','左侧题目 · 右侧填写答案');
    const lines=String(v.items||'').split('\n').map(s=>s.trim()).filter(Boolean).map(s=>s.split(/[,，]/).map(x=>x.trim()));
    const rows=Math.max(lines.length,10),x0=M,y0=84,w=A4W-M*2,rh=Math.min(44,(A4H-110-M)/rows);
    ctx.strokeStyle='#a4aec0';ctx.lineWidth=1;ctx.font='13px "Microsoft YaHei",sans-serif';
    for(let i=0;i<rows;i++){
      const y=y0+i*rh;ctx.strokeRect(x0,y,w,rh);
      ctx.beginPath();ctx.moveTo(x0+w*.5,y);ctx.lineTo(x0+w*.5,y+rh);ctx.moveTo(x0,y+rh);ctx.lineTo(x0+w,y+rh);ctx.stroke();
      const it=lines[i]||[];
      ctx.fillStyle='#1b2337';ctx.fillText(String(i+1).padStart(2,'0')+'.  '+(v.hide?(it[0]||''):(it[1]||it[0]||'')),x0+12,y+rh*.65);
      if(!v.hide){ctx.fillStyle='#6b778f';ctx.fillText(it[0]||'',x0+w*.5+12,y+rh*.65);}
    }
    footer(ctx);
  });

  /* --- 汉字描红 --- */
  paper('汉字描红生成', [I('chars','要描红的汉字','天地人和'),N('repeat','每个字重复次数',5),N('cols','每行格数',8)], (ctx,v)=>{
    title(ctx,'汉字描红字帖','先描后写 · 注意笔顺与间架结构');
    const chars=String(v.chars||'').replace(/\s/g,'').split('');
    const all=[];chars.forEach(c=>{for(let i=0;i<v.repeat;i++)all.push(c);});
    const size=88,cols=v.cols,rows=Math.ceil(all.length/cols),ox=(A4W-size*cols)/2,oy=88;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const idx=r*cols+c,ch=all[idx];if(!ch)continue;const x=ox+c*size,y=oy+r*size;
      ctx.strokeStyle='#e08a8a';ctx.lineWidth=1.3;ctx.strokeRect(x,y,size,size);
      ctx.save();ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x+size/2,y);ctx.lineTo(x+size/2,y+size);ctx.moveTo(x,y+size/2);ctx.lineTo(x+size,y+size/2);ctx.stroke();ctx.restore();
      ctx.fillStyle=r%2===0?'#d0d6e0':'#e6eaf0';ctx.font=`${Math.floor(size*.72)}px "KaiTi","STKaiti",serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ch,x+size/2,y+size/2+2);
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    }
    footer(ctx);
  });

  /* --- 思维导图大纲 --- */
  R('思维导图大纲生成', { fields:[X('outline','大纲（用缩进表示层级，2 空格 / 1 Tab 为一级）','项目计划\n  目标设定\n    用户增长\n    收入目标\n  执行阶段\n    需求评审\n    开发实现\n    测试上线\n  复盘总结'),S('layout','布局',[['right','向右展开'],['tree','树形居中']],'right')],live:true,
    run:v=>{
      const lines=String(v.outline||'').split('\n').filter(s=>s.trim()).map(s=>{const m=s.match(/^(\s*)/);let d=Math.floor((m[1].replace(/\t/g,'  ').length)/2);return{d,text:s.trim()};});
      if(!lines.length)throw new Error('请填写大纲内容');
      const rowH=34,xStep=200,nodes=[],edges=[];
      lines.forEach((l,i)=>{nodes.push({...l,x:l.d*xStep+20,y:i*rowH+20});
        for(let j=i-1;j>=0;j--)if(lines[j].d===l.d-1){edges.push([j,i]);break;}});
      const w=Math.max(...nodes.map(n=>n.x))+230,h=lines.length*rowH+40;
      const colors=['#7c6cff','#4ea8ff','#34d399','#fbbf24','#fb7185'];
      let svg=`<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;background:var(--bg-soft);border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
      edges.forEach(([a,b])=>{const p=nodes[a],q=nodes[b];svg+=`<path d="M${p.x+150} ${p.y+12} C${p.x+175} ${p.y+12}, ${q.x-25} ${q.y+12}, ${q.x} ${q.y+12}" fill="none" stroke="var(--line-strong)" stroke-width="1.6"/>`;});
      nodes.forEach(n=>{const c=colors[Math.min(n.d,4)];svg+=`<rect x="${n.x}" y="${n.y}" width="150" height="25" rx="6" fill="${c}" opacity="${n.d===0?1:.18+Math.max(0,.3-n.d*.06)}"/><text x="${n.x+9}" y="${n.y+17}" font-size="12" fill="${n.d===0?'#fff':'var(--text)'}">${T.esc(n.text.slice(0,18))}</text>`;});
      svg+='</svg>';
      return [{type:'html',title:`思维导图 · ${lines.length} 个节点`,value:svg},
        {type:'text',value:'# '+lines[0].text+'\n\n'+lines.slice(1).map(l=>'  '.repeat(l.d)+'- '+l.text).join('\n'),title:'Markdown 大纲',download:'outline.md'}];} });

  /* --- 口算题生成 --- */
  R('口算题生成', { fields:[N('count','题目数量',40),S('ops','运算类型',[['+-','加法 + 减法'],['*','乘法'],['+-*','加减乘'],['all','加减乘除']],'+-'),N('max','数值上限',100),S('grade','难度',[['1','一年级（20 以内）'],['2','二年级（100 以内）'],['3','三年级（含乘除）']],'2'),C('answer','同时生成答案',true,'生成答案表')],runLabel:'重新出题',
    run:v=>{
      const n=T.clamp(Math.round(Number(v.count)||20),1,200),mx=v.grade==='1'?20:v.grade==='2'?100:Number(v.max)||100;
      const ops=v.ops==='all'?['+','-','*','/']:v.ops==='+-*'?['+','-','*']:v.ops==='*'?['*']:['+','-'];
      const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
      const qs=[],ans=[];
      for(let i=0;i<n;i++){
        const op=ops[rnd(0,ops.length-1)];let a,b,r,expr;
        if(op==='+'){a=rnd(1,mx);b=rnd(1,mx-a>1?mx-a:mx);r=a+b;expr=`${a} + ${b}`;}
        else if(op==='-'){a=rnd(2,mx);b=rnd(1,a);r=a-b;expr=`${a} − ${b}`;}
        else if(op==='*'){a=rnd(2,v.grade==='1'?9:12);b=rnd(2,v.grade==='1'?9:12);r=a*b;expr=`${a} × ${b}`;}
        else {b=rnd(2,9);r=rnd(2,12);a=b*r;expr=`${a} ÷ ${b}`;}
        qs.push(expr+' = ______');ans.push(r);
      }
      const cols=4,rows=[];
      for(let i=0;i<qs.length;i+=cols)rows.push(qs.slice(i,i+cols).concat(Array(cols).fill('')).slice(0,cols));
      const res=[{type:'table',title:'口算练习题（可导出 CSV 打印）',head:['第 1 列','第 2 列','第 3 列','第 4 列'],rows},
        {type:'text',value:qs.map((q,i)=>`${String(i+1).padStart(2,'0')}. ${q}`).join('\n'),title:'题目纯文本',download:'口算题.txt'}];
      if(v.answer)res.push({type:'text',value:qs.map((q,i)=>`${String(i+1).padStart(2,'0')}. ${q.replace('______',ans[i])}`).join('\n'),title:'参考答案',download:'口算题答案.txt'});
      return res;} });

  /* --- 填空题生成器 --- */
  R('填空题生成器', { fields:[X('text','原文','光合作用是指绿色植物通过叶绿体，利用光能，把二氧化碳和水转化成储存能量的有机物，并且释放出氧气的过程。'),N('rate','挖空比例（%）',30),S('mode','挖空方式',[['word','按词 / 短语'],['char','按字']],'word'),I('blank','空格标记','______'),C('answer','生成答案对照',true,'生成答案')],runLabel:'重新生成',
    run:v=>{
      const s=String(v.text||'').trim();if(!s)throw new Error('请填写原文');
      const rate=T.clamp((Number(v.rate)||30)/100,.05,.9);
      let units;
      if(v.mode==='char')units=Array.from(s);
      else units=s.split(/([\u4e00-\u9fa5]{2,4}|[A-Za-z]+|\d+)/).filter(x=>x!==''&&x!==undefined);
      const idx=units.map((_,i)=>i).filter(i=>/[\u4e00-\u9fa5A-Za-z0-9]/.test(units[i])).sort(()=>Math.random()-.5).slice(0,Math.max(1,Math.round(units.filter(x=>/[\u4e00-\u9fa5A-Za-z0-9]/.test(x)).length*rate)));
      const chosen=new Set(idx),answers=[];
      const out=units.map((u,i)=>{if(chosen.has(i)){answers.push(u);return v.blank;}return u;}).join(v.mode==='char'?'':'');
      return [{type:'html',title:'填空题目',value:`<div style="font-size:15px;line-height:2.1;padding:8px">${T.esc(out)}</div>`},
        ...(v.answer?[{type:'text',value:answers.map((a,i)=>`${i+1}. ${a}`).join('\n'),title:'参考答案（按空格顺序）',download:'填空答案.txt'}]:[]),
        {type:'text',value:out,title:'纯文本题目',download:'填空题.txt'}];} });

  /* --- 拼音标注 --- */
  R('拼音标注工具', { fields:[X('text','要标注的汉字','床前明月光，疑是地上霜。举头望明月，低头思故乡。'),S('mode','标注形式',[['ruby','逐字注音（ruby 上下对照）'],['inline','括号紧跟（汉字(拼音)）'],['list','逐字对照表']],'ruby'),C('tone','显示声调符号',true,'带声调')],live:true,
    run:v=>{
      if(!window.pinyinPro)throw new Error('拼音组件未加载');
      const s=String(v.text||''),chars=Array.from(s);
      const pys=chars.map(c=>{if(!/[\u4e00-\u9fa5]/.test(c))return '';try{return window.pinyinPro.pinyin(c,{toneType:v.tone?'symbol':'none'});}catch(e){return '';}});
      if(v.mode==='ruby'){
        const html=chars.map((c,i)=>pys[i]?`<ruby style="margin:0 2px">${T.esc(c)}<rt style="font-size:10px;color:var(--accent)">${T.esc(pys[i])}</rt></ruby>`:T.esc(c)).join('');
        return [{type:'html',title:'拼音标注预览',value:`<div style="font-size:22px;line-height:2.4;padding:10px">${html}</div>`},
          {type:'text',value:chars.map((c,i)=>pys[i]?`${c}(${pys[i]})`:c).join(''),title:'可复制文本',download:'拼音.txt'}];
      }
      if(v.mode==='inline')return {type:'text',value:chars.map((c,i)=>pys[i]?`${c}(${pys[i]})`:c).join(''),title:'拼音标注',download:'拼音.txt'};
      return {type:'table',title:'逐字对照表',head:['序号','汉字','拼音'],rows:chars.map((c,i)=>[i+1,c,pys[i]||'—']).filter(r=>r[2]!=='—')};} });

  /* --- 汉字笔顺查询 --- */
  R('汉字笔顺查询', { fields:[I('char','输入单个汉字','永'),C('showPaper','生成田字格描红参考',true,'生成描红格')],live:true,
    run:v=>{
      const c=String(v.char||'').trim();if(!c)throw new Error('请输入汉字');
      const rules='先横后竖、先撇后捺、从上到下、从左到右、先外后内、先中间后两边、先外后内再封口';
      const strokes=window.pinyinPro?[]:[];
      let canvasHTML='';
      if(v.showPaper&&document.createElement){
        const cv=document.createElement('canvas');cv.width=240;cv.height=240;const ctx=cv.getContext('2d');
        ctx.fillStyle='#fff';ctx.fillRect(0,0,240,240);ctx.strokeStyle='#e05a5a';ctx.lineWidth=2;ctx.strokeRect(8,8,224,224);
        ctx.save();ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(120,8);ctx.lineTo(120,232);ctx.moveTo(8,120);ctx.lineTo(232,120);ctx.stroke();ctx.restore();
        ctx.fillStyle='#d6dbe5';ctx.font='150px "KaiTi","STKaiti",serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c[0],120,124);
        canvasHTML=`<img src="${cv.toDataURL('image/png')}" style="width:170px;border:1px solid var(--line);border-radius:8px">`;
      }
      let py='';try{py=window.pinyinPro.pinyin(c[0],{toneType:'symbol'});}catch(e){}
      return [KV([['汉字',c[0]],['拼音',py||'—'],['Unicode','U+'+c[0].codePointAt(0).toString(16).toUpperCase().padStart(4,'0')],['通用笔顺规则',rules],['结构提示','书写时注意重心居中、横平竖直、左右部件比例']],'汉字信息'),
        ...(canvasHTML?[{type:'html',title:'田字格参考',value:`<div style="display:flex;gap:18px;align-items:center">${canvasHTML}<div style="font-size:12px;color:var(--text-3);line-height:1.9">浅灰字为描红范字。<br>逐笔动画需要专业笔顺字库数据，本工具提供规则速查与描红纸；<br>可配合「汉字描红生成」批量打印练习。</div></div>`}]:[])];} });

  /* --- 音标查询 --- */
  const IPA_DICT={apple:['ˈæp.əl','苹果'],banana:['bəˈnɑː.nə','香蕉'],computer:['kəmˈpjuː.tər','电脑'],hello:['həˈləʊ','你好'],world:['wɜːld','世界'],book:['bʊk','书'],school:['skuːl','学校'],teacher:['ˈtiː.tʃər','老师'],student:['ˈstjuː.dənt','学生'],water:['ˈwɔː.tər','水'],morning:['ˈmɔː.nɪŋ','早晨'],family:['ˈfæm.əl.i','家庭'],friend:['frend','朋友'],beautiful:['ˈbjuː.tɪ.fəl','美丽的'],important:['ɪmˈpɔː.tənt','重要的'],language:['ˈlæŋ.ɡwɪdʒ','语言'],knowledge:['ˈnɒl.ɪdʒ','知识'],development:['dɪˈvel.əp.mənt','发展'],environment:['ɪnˈvaɪ.rən.mənt','环境']};
  R('音标查询', { fields:[I('word','查询单词','beautiful'),S('mode','展示方式',[['one','单词音标'],['all','全部词库']],'one')],live:true,
    run:v=>{
      const w=String(v.word||'').trim().toLowerCase();
      if(v.mode==='all')return {type:'table',title:'内置常用词音表（'+Object.keys(IPA_DICT).length+' 词）',head:['单词','IPA 音标','释义'],rows:Object.entries(IPA_DICT).map(([k,[p,m]])=>[k,'/'+p+'/',m])};
      const hit=IPA_DICT[w];
      const vowels=[['/iː/','长音 "衣"，如 see'],['/ɪ/','短音，如 sit'],['/æ/','开口 "æ"，如 cat'],['/ɑː/','长音 "啊"，如 car'],['/ɒ/','短音，如 hot'],['/ɔː/','长音，如 thought'],['/ʊ/','短音，如 book'],['/uː/','长音，如 food'],['/ə/','弱读中央元音，如 about'],['/ɜː/','长音，如 bird'],['/eɪ/','双元音，如 day'],['/aɪ/','双元音，如 my'],['/əʊ/','双元音，如 go'],['/aʊ/','双元音，如 now'],['/ɔɪ/','双元音，如 boy']];
      return [KV([['单词',w||'—'],['音标',hit?'/'+hit[0]+'/':'内置词库未收录'],['释义',hit?hit[1]:'—'],['提示',hit?'点击「全部词库」查看 20 个常用词的 IPA 音标':'可切换展示方式查看内置词库；在线完整音标建议查阅权威词典']],'音标查询'),
        {type:'table',title:'常用元音速查',head:['音标','发音提示'],rows:vowels}];} });

  /* --- 化学元素周期表（118 元素 · 点击查看介绍） --- */
  const EL_ALL = window.ELEMENTS || [];
  const EL_CAT = {
    '碱金属': '#d9584f', '碱土金属': '#c0863a', '过渡金属': '#3f76a8', '主族金属': '#6f5bb5',
    '类金属': '#2f8a72', '非金属': '#2f9a8f', '卤素': '#a8588c', '稀有气体': '#5b6bb5',
    '镧系': '#6b7280', '锕系': '#8a6b4f'
  };
  const ELLEGEND = Object.keys(EL_CAT);
  R('化学元素周期表', { render(host) {
    const all = EL_ALL;
    if (!all.length) { host.innerHTML = '<div class="hint-empty">元素数据未加载</div>'; return; }
    const byZ = {}, bySym = {};
    all.forEach(e => { byZ[e.z] = e; bySym[e.sym.toUpperCase()] = e; });

    host.innerHTML = `<div class="custom-pane">
      <div class="cp-row">
        <input id="elQ" type="text" placeholder="搜索：元素符号 / 中文名 / 英文名 / 原子序数，如 Fe、铁、iron、26" style="flex:1;min-width:220px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:9px 11px;font-size:13px" spellcheck="false">
        <div class="el-switch" role="tablist"><button type="button" class="is-on" data-ev="table" role="tab">周期表</button><button type="button" data-ev="list" role="tab">清单</button></div>
        <span class="cp-note" id="elCount">共 118 种元素</span>
      </div>
      <div class="el-legend" id="elLegend">${ELLEGEND.map(k => `<span class="el-lg"><i style="background:${EL_CAT[k]}"></i>${k}</span>`).join('')}</div>
      <div class="el-layout">
        <div class="el-main">
          <div class="el-scroll" id="elTableWrap"><div class="el-grid" id="elGrid"></div></div>
          <div class="el-scroll" id="elListWrap" hidden><table class="data-table el-table"><thead><tr><th>序号</th><th>符号</th><th>中文名</th><th>英文名</th><th>原子量</th><th>类别</th><th>周期</th><th>族</th></tr></thead><tbody id="elListBody"></tbody></table></div>
        </div>
        <aside class="el-detail" id="elDetail"></aside>
      </div>
      <div class="note">点击任意元素查看原子量、族与常见用途。原子量取 IUPAC 常用值；半衰期极短的人工元素取最长寿同位素质量数，以方括号或整数标注。位置按标准长式周期表排布，镧系与锕系单列在下方。</div>
    </div>`;

    const grid = host.querySelector('#elGrid');
    const listBody = host.querySelector('#elListBody');
    const detail = host.querySelector('#elDetail');
    const q = host.querySelector('#elQ');
    const countEl = host.querySelector('#elCount');
    const tableWrap = host.querySelector('#elTableWrap');
    const listWrap = host.querySelector('#elListWrap');

    const posOf = e => {
      if (e.cat === '镧系') return { row: 9, col: 3 + (e.z - 57) };
      if (e.cat === '锕系') return { row: 10, col: 3 + (e.z - 89) };
      return { row: e.p, col: e.g };
    };
    const match = e => {
      const k = q.value.trim().toLowerCase();
      if (!k) return false;
      return String(e.z) === k || e.sym.toLowerCase() === k || e.sym.toLowerCase().indexOf(k) === 0 ||
        e.cn.indexOf(k) >= 0 || e.en.toLowerCase().indexOf(k) >= 0;
    };

    let sel = bySym['FE'] || all[0];
    let view = 'table';

    function drawGrid() {
      let html = '';
      all.forEach(e => {
        const pos = posOf(e);
        const hit = match(e);
        const active = sel && sel.z === e.z;
        html += `<button type="button" class="el-cell${hit ? ' is-hit' : ''}${active ? ' is-sel' : ''}" data-z="${e.z}"
          style="grid-column:${pos.col};grid-row:${pos.row};--el:${EL_CAT[e.cat] || '#6b7280'}"
          title="${T.esc(e.cn)} ${e.sym} · 第 ${e.p} 周期 第 ${e.g} 族 · ${e.cat}">
          <span class="el-z">${e.z}</span><b>${e.sym}</b><small>${e.cn}</small></button>`;
      });
      html += `<div class="el-fblock" style="grid-column:3;grid-row:6">57-71<br>镧系</div>`;
      html += `<div class="el-fblock" style="grid-column:3;grid-row:7">89-103<br>锕系</div>`;
      grid.innerHTML = html;
      grid.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { sel = byZ[+b.dataset.z]; drawGrid(); drawDetail(); });
    }

    function drawList() {
      listBody.innerHTML = all.map(e => `<tr data-z="${e.z}"${sel && sel.z === e.z ? ' class="is-sel"' : ''}><td>${e.z}</td><td><b>${e.sym}</b></td><td>${e.cn}</td><td>${e.en}</td><td>${e.mass}</td><td>${e.cat}</td><td>${e.p}</td><td>${e.g}</td></tr>`).join('');
      listBody.querySelectorAll('tr[data-z]').forEach(tr => tr.onclick = () => { sel = byZ[+tr.dataset.z]; drawDetail(); drawList(); drawGrid(); });
    }

    function drawDetail() {
      if (!sel) {
        const stat = ELLEGEND.map(k => [k, all.filter(e => e.cat === k).length]).filter(x => x[1]);
        detail.innerHTML = `<div class="el-detail-empty"><b>点击任意元素查看介绍</b><p>共收录 ${all.length} 种元素，按 ${ELLEGEND.length} 个类别着色。</p><div class="el-stat">${stat.map(([k, n]) => `<span><i style="background:${EL_CAT[k]}"></i>${k}<em>${n}</em></span>`).join('')}</div></div>`;
        return;
      }
      const e = sel;
      const sameGroup = all.filter(x => x.g === e.g && x.cat !== '镧系' && x.cat !== '锕系' && x.z !== e.z).slice(0, 10);
      const samePeriod = all.filter(x => x.p === e.p && x.cat !== '镧系' && x.cat !== '锕系' && x.z !== e.z);
      const prev = byZ[e.z - 1], next = byZ[e.z + 1];
      detail.innerHTML = `
        <div class="el-card" style="--el:${EL_CAT[e.cat] || '#6b7280'}">
          <div class="el-card-top"><span class="el-card-z">${e.z}</span><span class="el-card-cat">${e.cat}</span></div>
          <div class="el-card-sym">${e.sym}</div>
          <div class="el-card-cn">${e.cn}<em>${e.en}</em></div>
          <div class="el-card-note">${T.esc(e.note)}</div>
        </div>
        <div class="el-kv">
          <div><span>原子量</span><b>${e.mass}</b></div>
          <div><span>位置</span><b>第 ${e.p} 周期 · 第 ${e.g} 族</b></div>
          <div><span>分类</span><b>${e.cat}</b></div>
          <div><span>周边</span><b>${prev ? prev.cn + ' ← ' : ''}本元素${next ? ' → ' + next.cn : ''}</b></div>
        </div>
        ${sameGroup.length ? `<div class="el-rel"><span class="el-rel-t">同族元素</span><div class="el-chips">${sameGroup.map(x => `<button type="button" class="el-chip" data-z="${x.z}">${x.sym}<i>${x.cn}</i></button>`).join('')}</div></div>` : ''}
        <div class="el-rel"><span class="el-rel-t">同周期（${samePeriod.length + 1} 种）</span><div class="el-chips">${samePeriod.map(x => `<button type="button" class="el-chip" data-z="${x.z}">${x.sym}<i>${x.cn}</i></button>`).join('')}</div></div>`;
      detail.querySelectorAll('.el-chip').forEach(b => b.onclick = () => { sel = byZ[+b.dataset.z]; drawDetail(); drawGrid(); drawList(); });
      detail.scrollTop = 0;
    }

    function refreshCount() {
      const k = q.value.trim();
      if (!k) { countEl.textContent = `共 ${all.length} 种元素`; return; }
      const hits = all.filter(match);
      countEl.textContent = `匹配 ${hits.length} 种`;
      if (hits.length && !hits.some(e => e.z === (sel && sel.z))) { sel = hits[0]; drawDetail(); }
      drawGrid();
    }

    q.addEventListener('input', refreshCount);
    q.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { const hits = all.filter(match); if (hits.length) { sel = hits[0]; drawDetail(); drawGrid(); drawList(); } }
    });
    host.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => {
      view = b.dataset.ev;
      host.querySelectorAll('[data-ev]').forEach(x => x.classList.toggle('is-on', x === b));
      tableWrap.hidden = view !== 'table';
      listWrap.hidden = view !== 'list';
    });
    drawGrid(); drawList(); drawDetail();
  }});

  /* --- 公式编辑器 --- */
  const SYM=[['\\alpha','α'],['\\beta','β'],['\\gamma','γ'],['\\theta','θ'],['\\pi','π'],['\\sum','∑'],['\\int','∫'],['\\infty','∞'],['\\pm','±'],['\\times','×'],['\\div','÷'],['\\leq','≤'],['\\geq','≥'],['\\neq','≠'],['\\sqrt{}','√()'],['\\frac{a}{b}','a/b'],['x^{2}','x²'],['\\partial','∂'],['\\nabla','∇'],['\\in','∈'],['\\rightarrow','→']];
  function latexPreview(s){
    let out=s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,'($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g,'√($1)')
      .replace(/\^\{([^{}]*)\}/g,(m,a)=>a.replace(/2/g,'²').replace(/3/g,'³')).replace(/_\{([^{}]*)\}/g,'₁')
      .replace(/\\left|\\right/g,'');
    SYM.forEach(([l,u])=>{out=out.split(l).join(u);});
    return out.replace(/[{}]/g,'');
  }
  R('公式编辑器', { fields:[X('tex','LaTeX 公式','E = mc^{2}\\quad\\sum_{i=1}^{n} x_i = \\frac{n(n+1)}{2}'),C('symbols','显示常用符号面板',true,'显示符号面板')],live:true,
    run:v=>{
      const preview=latexPreview(String(v.tex||''));
      const panel=v.symbols?`<div style="display:flex;flex-wrap:wrap;gap:6px">${SYM.map(([l,u])=>`<span style="border:1px solid var(--line);background:var(--surface);border-radius:6px;padding:3px 8px;font-size:12px;font-family:monospace;color:var(--text-2)" title="${T.esc(l)}">${T.esc(u)}</span>`).join('')}</div>`:'';
      return [{type:'html',title:'公式预览',value:`<div style="font-family:'Cambria Math',Georgia,serif;font-size:28px;padding:22px;text-align:center;background:var(--bg-soft);border-radius:8px;white-space:pre-wrap">${T.esc(preview)}</div>`},
        {type:'text',value:String(v.tex||''),title:'LaTeX 源码',download:'formula.tex'},
        ...(panel?[{type:'html',title:'常用符号（复制对应 LaTeX 命令）',value:panel}]:[]),
        {type:'note',value:'此处使用 Unicode 近似渲染，便于快速查看；精确排版请复制到支持 KaTeX / MathJax / LaTeX 的编辑器中。'}];} });

  /* --- 单位换算练习题 --- */
  R('单位换算练习题生成', { fields:[N('count','题目数量',20),S('cat','单位类别',[['length','长度'],['weight','重量'],['area','面积'],['volume','容量'],['time','时间']],'length'),C('answer','生成答案',true,'生成答案')],runLabel:'重新出题',
    run:v=>{
      const sets={length:[['千米','米',1000],['米','厘米',100],['厘米','毫米',10],['米','分米',10],['千米','米',1000]],weight:[['千克','克',1000],['吨','千克',1000],['斤','克',500],['千克','斤',2]],area:[['平方米','平方分米',100],['公顷','平方米',10000],['平方千米','公顷',100],['亩','平方米',666.67]],volume:[['升','毫升',1000],['立方米','升',1000],['升','立方厘米',1000]],time:[['小时','分钟',60],['分钟','秒',60],['天','小时',24],['周','天',7]]};
      const set=sets[v.cat]||sets.length,n=T.clamp(Math.round(Number(v.count)||20),1,100),qs=[],ans=[];
      for(let i=0;i<n;i++){const [a,b,k]=set[Math.floor(Math.random()*set.length)],x=Math.floor(Math.random()*90+10)/ (k===666.67?1:10)*10/10||1;
        const val=Math.floor(Math.random()*99+1),r=val*k;qs.push(`${val} ${a} = ______ ${b}`);ans.push(T.fmt(r,2)+' '+b);}
      const rows=[];for(let i=0;i<qs.length;i+=2)rows.push([qs[i],qs[i+1]||'']);
      return [{type:'table',title:'换算练习题',head:['题目','题目'],rows},
        ...(v.answer?[{type:'text',value:qs.map((q,i)=>`${i+1}. ${q.replace('______',ans[i])}`).join('\n'),title:'参考答案',download:'换算题答案.txt'}]:[])];} });

  /* --- 时间加减法 --- */
  R('时间加减法计算', { fields:[I('date','起始时间','2026-11-14 16:30',{hint:'格式 YYYY-MM-DD HH:mm'}),S('op','运算',[['add','加上'],['sub','减去']],'add'),N('days','天',10),N('hours','小时',5),N('minutes','分钟',30)],live:true,
    run:v=>{
      const d=new Date(String(v.date).replace(/-/g,'/'));if(isNaN(d.getTime()))throw new Error('时间格式有误，请使用 YYYY-MM-DD HH:mm');
      const delta=((Number(v.days)||0)*1440+(Number(v.hours)||0)*60+(Number(v.minutes)||0))*60000*(v.op==='sub'?-1:1);
      const r=new Date(d.getTime()+delta),p=n=>T.pad(n);
      const fmt=x=>`${x.getFullYear()}-${p(x.getMonth()+1)}-${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}:${p(x.getSeconds())}`;
      return KV([['起始时间',fmt(d)],['运算',v.op==='add'?'加上 ':'减去 '],['偏移量',`${v.days} 天 ${v.hours} 小时 ${v.minutes} 分钟`],['结果时间',fmt(r)],['星期','星期'+'日一二三四五六'[r.getDay()]],['相差天数',T.fmt(Math.abs(delta)/86400000,4)+' 天'],['ISO',r.toISOString()]],'时间计算');} });

  /* --- 分数计算器 --- */
  R('分数计算器', { fields:[N('a1','第一个分数 · 分子',2),N('a2','第一个分数 · 分母',3),S('op','运算',[['+','加 +'],['-','减 −'],['*','乘 ×'],['/','除 ÷']],'+'),N('b1','第二个分数 · 分子',3),N('b2','第二个分数 · 分母',4)],live:true,
    run:v=>{
      const gcd=(a,b)=>b?gcd(b,a%b):a;
      const a1=Math.round(Number(v.a1)||0),a2=Math.round(Number(v.a2)||1),b1=Math.round(Number(v.b1)||0),b2=Math.round(Number(v.b2)||1);
      if(!a2||!b2)throw new Error('分母不能为 0');
      let n,d;
      if(v.op==='+'){n=a1*b2+b1*a2;d=a2*b2;}else if(v.op==='-'){n=a1*b2-b1*a2;d=a2*b2;}
      else if(v.op==='*'){n=a1*b1;d=a2*b2;}else{n=a1*b2;d=a2*b1;}
      if(!d)throw new Error('除数为 0');
      if(d<0){n=-n;d=-d;}
      const g=gcd(Math.abs(n),Math.abs(d))||1;
      return KV([['原式',`${a1}/${a2} ${v.op} ${b1}/${b2}`],['未约分结果',`${n}/${d}`],['最简分数',n%g===0?`${n/g}/${d/g}`:`${n}/${d}`],['带分数',Math.abs(n/g)>=d/g?`${Math.trunc(n/g/(d/g))} 又 ${Math.abs(n/g)%(d/g)}/${d/g}`:'真分数'],['小数',T.fmt(n/d,8)],['百分比',T.fmt(n/d*100,4)+'%']],'分数运算');} });

  /* --- 几何绘图辅助 --- */
  R('几何绘图辅助', { render(host, api) {
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><span class="cp-label">函数表达式（用 x 作自变量）</span><input type="text" id="geoExpr" value="Math.sin(x)*2" style="flex:1;min-width:200px"><input type="color" id="geoColor" value="#7c6cff" style="width:38px;height:34px;border:1px solid var(--line);border-radius:7px;background:transparent"><button class="btn btn-primary" id="geoDraw">绘制</button><button class="btn btn-ghost" id="geoDl">下载图片</button></div>
      <div class="cp-row cp-note">支持 sin / cos / tan / sqrt / abs / pow / log / exp / PI，例如：x*x/2 - 3、Math.sin(x)*Math.cos(x*2)。</div>
      <div class="cp-canvas-wrap"><canvas id="geoCv" width="760" height="560"></canvas></div></div>`;
    const cv=host.querySelector('#geoCv'),ctx=cv.getContext('2d');
    function draw(){
      const expr=host.querySelector('#geoExpr').value.trim(),color=host.querySelector('#geoColor').value;
      const W=760,H=560,cx=W/2,cy=H/2,scale=48;
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#e6ebf3';ctx.lineWidth=1;ctx.beginPath();
      for(let x=0;x<W;x+=scale){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=0;y<H;y+=scale){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();
      ctx.strokeStyle='#2c3a55';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(W,cy);ctx.moveTo(cx,0);ctx.lineTo(cx,H);ctx.stroke();
      ctx.fillStyle='#8893a9';ctx.font='10px sans-serif';
      for(let i=-8;i<=8;i++)if(i)ctx.fillText(String(i),cx+i*scale+2,cy+13);
      for(let j=-5;j<=5;j++)if(j)ctx.fillText(String(-j),cx+4,cy+j*scale-3);
      let fn;
      try{
        if(!/^[0-9xX+\-*/().,\s a-zA-Z]*$/.test(expr))throw new Error('表达式含非法字符');
        fn=new Function('x','"use strict"; const {sin,cos,tan,sqrt,abs,pow,log,exp,PI}=Math; return ('+expr+');');
        fn(1);
      }catch(e){ctx.fillStyle='#c00';ctx.font='14px sans-serif';ctx.fillText('表达式错误：'+e.message,20,26);return;}
      ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.beginPath();let started=false;
      for(let px=0;px<W;px++){
        const x=(px-cx)/scale;let y;
        try{y=fn(x);}catch(e){continue;}
        if(!isFinite(y)||Math.abs(y)>1e6){started=false;continue;}
        const py=cy-y*scale;
        if(!started){ctx.moveTo(px,py);started=true;}else ctx.lineTo(px,py);
      }
      ctx.stroke();
      ctx.fillStyle='#2c3a55';ctx.font='13px sans-serif';ctx.fillText('y = '+expr,20,26);
    }
    host.querySelector('#geoDraw').onclick=draw;
    host.querySelector('#geoExpr').addEventListener('keydown',e=>{if(e.key==='Enter')draw();});
    host.querySelector('#geoDl').onclick=()=>T.save(cv.toDataURL('image/png'),'几何图像.png');
    draw();
  }});
})();
