/* ============================================================
   工具实现：图片工具（单图交互处理）
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file', accept: 'image/*' }, extra || {});

  /* ---------- 通用单图工作台 ---------- */
  function single(name, cfg) {
    /* 统一给图片类工具补一段与「左参数 / 右预览」一致的使用说明 */
    const STEPS = [
      '点击「选择图片」或将图片拖到虚线框里，读取与处理都在本机完成。',
      '拖动左侧滑块、填写数值或选颜色，右侧预览会实时刷新，两栏不需要来回滚动。',
      '满意后点「下载结果图片」保存；要直接贴到聊天窗口时用「复制图片」。',
      '点任意预览图可放大查看细节，按 Esc 或点击遮罩关闭。'
    ];
    const fields = [F('file', '选择图片', { placeholder: '点击选择或拖拽图片到这里' })].concat(cfg.fields || []);
    R(name, { steps: STEPS, render(host, api) {
      host.innerHTML = `<div class="ws ws-split">
        <div class="ws-tabs" role="tablist"><button type="button" class="ws-tab is-on" data-tab="ctl" role="tab" aria-selected="true">参数设置</button><button type="button" class="ws-tab" data-tab="out" role="tab" aria-selected="false">结果预览</button></div>
        <div class="ws-col ws-ctl is-on" data-col="ctl">
          <div class="ws-bar"><span class="ws-bar-title">参数设置</span><span class="ws-bar-meta">${fields.length} 项参数</span><button type="button" class="ws-bar-btn" id="imReset">重置</button></div>
          <div class="ws-body">
            <div class="tool-form"><div class="form-grid" id="imForm">${fields.map(f => Object.assign({}, f, { wide: f.wide !== false })).map(T.fieldHTML).join('')}</div></div>
            <div class="cp-row" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><button class="btn btn-primary" id="imDl">下载结果图片</button><button class="btn btn-ghost" id="imCopy">复制图片</button></div>
            <div class="cp-note" id="imInfo" style="margin-top:8px">请先选择一张图片</div>
          </div>
        </div>
        <div class="ws-col ws-out" data-col="out">
          <div class="ws-bar"><span class="ws-bar-title">结果预览</span><span class="ws-out-stat" id="imInfo2">等待选择图片</span></div>
          <div class="ws-body">
            <div class="cp-canvas-wrap"><canvas id="imCanvas" width="600" height="400"></canvas></div>
            ${cfg.tip ? `<div class="note">${cfg.tip}</div>` : ''}
          </div>
        </div>
      </div>`;
      const form = host.querySelector('#imForm'), cv = host.querySelector('#imCanvas'), ctx = cv.getContext('2d', { willReadFrequently: true });
      const info = host.querySelector('#imInfo');
      const info2 = host.querySelector('#imInfo2');
      let img = null, srcUrl = null;
      const vals = () => T.collect(form, fields);
      async function redraw() {
        if (!img) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); return; }
        try {
          const v = vals();
          const base = T.imageCanvas(img);
          const out = await cfg.draw(ctx, cv, base, img, v, api);
          if (out && out !== cv) { cv.width = out.width; cv.height = out.height; ctx.drawImage(out, 0, 0); }
          info.textContent = '已生成结果，可下载或复制';
          if (info2) info2.textContent = `${img.naturalWidth} × ${img.naturalHeight} → ${cv.width} × ${cv.height} px`;
        } catch (e) { console.error(e); info.textContent = '处理失败：' + e.message; if (info2) info2.textContent = '处理失败'; }
      }
      form.querySelectorAll('input[type=file]').forEach(inp => {
        const upd = async () => {
          const f = inp.files && inp.files[0];
          const slot = form.querySelector(`[data-names="${inp.dataset.key}"]`);
          if (!f) return;
          if (slot) slot.textContent = f.name;
          try {
            if (srcUrl) URL.revokeObjectURL(srcUrl);
            srcUrl = URL.createObjectURL(f);
            img = await T.loadImage(srcUrl);
            await redraw();
          } catch (e) { info.textContent = '无法读取：' + e.message; }
        };
        inp.addEventListener('change', upd);
        const drop = form.querySelector(`[data-drop="${inp.dataset.key}"]`);
        if (drop) {
          drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
          drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
          drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('drag'); if (e.dataTransfer.files.length) { inp.files = e.dataTransfer.files; upd(); } });
        }
      });
      form.querySelectorAll('[data-key]').forEach(el => {
        if (el.type === 'file') return;
        el.addEventListener('input', redraw); el.addEventListener('change', redraw);
      });
      form.querySelectorAll('input[type=color]').forEach(inp => {
        const hex = form.querySelector(`[data-hex="${inp.dataset.key}"]`);
        inp.addEventListener('input', () => { if (hex) hex.value = inp.value; });
        if (hex) hex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(hex.value)) { inp.value = hex.value; redraw(); } });
      });
      host.querySelector('#imReset').onclick = () => {
        fields.forEach(f => {
          const el = form.querySelector(`[data-key="${f.key}"]`);
          if (!el) return;
          if (f.type === 'file') {
            el.value = '';
            const slot = form.querySelector(`[data-names="${f.key}"]`);
            if (slot) slot.textContent = f.placeholder || '尚未选择图片';
            const clr = form.querySelector(`[data-clear="${f.key}"]`);
            if (clr) clr.hidden = true;
          } else if (f.type === 'checkbox') {
            el.checked = !!f.def;
          } else if (f.type === 'color') {
            const v = f.def || '#6366f1';
            el.value = v;
            const hx = form.querySelector(`[data-hex="${f.key}"]`);
            if (hx) hx.value = v;
          } else if (f.type === 'range') {
            const v = f.def == null ? (f.min == null ? 0 : f.min) : f.def;
            el.value = v;
            const o = form.querySelector(`[data-out="${f.key}"]`);
            if (o) o.textContent = v;
          } else {
            el.value = f.def == null ? '' : f.def;
          }
        });
        img = null;
        if (srcUrl) { URL.revokeObjectURL(srcUrl); srcUrl = null; }
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        info.textContent = '请先选择一张图片';
        if (info2) info2.textContent = '等待选择图片';
      };
      host.querySelector('#imDl').onclick = () => {
        if (!img) return T.toast('请先选择图片', 'err');
        T.save(cv.toDataURL(cfg.mime ? cfg.mime(vals()) : 'image/png', cfg.quality || .92), (cfg.fileName ? cfg.fileName(vals()) : 'result') + '.' + (cfg.ext || 'png'));
      };
      host.querySelector('#imCopy').onclick = async () => {
        if (!img) return T.toast('请先选择图片', 'err');
        try { const blob = await T.canvasBlob(cv, 'image/png'); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); T.toast('图片已复制'); }
        catch (e) { T.toast('浏览器不支持复制图片，请下载', 'err'); }
      };
      api.onCleanup(() => { if (srcUrl) URL.revokeObjectURL(srcUrl); });
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#9aa7ba'; ctx.font = '15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('选择图片后在此预览处理结果', 300, 200); ctx.textAlign = 'left';
    }});
  }

  /* ---------- 1. 证件照规格制作 ---------- */
  const ID_SIZES = { '一寸 25×35mm': [295,413], '小一寸 22×32mm': [260,378], '二寸 35×49mm': [413,579], '小二寸 35×45mm': [413,531], '身份证 26×32mm': [307,378], '社保卡 26×32mm': [307,378], '签证 33×48mm': [390,567], '美国签证 51×51mm': [600,600], '护照 33×48mm': [390,567], '驾照 21×26mm': [248,307], '教师资格 25×35mm': [295,413], '公务员考试 20×28mm': [236,331] };
  single('证件照规格制作', {
    fields: [S('spec','照片规格',Object.keys(ID_SIZES),'一寸 25×35mm'), N('dpi','分辨率 DPI',300), I('bg','底色','#438edb',{type:'color'}), C('replace','自动替换浅色背景',false,'替换近白背景'), S('layout','排版',[['single','单张'],['4','4 张排版'],['8','8 张排版']],'single'), N('zoom','人像缩放',1,{min:.5,max:2,step:.05}), N('offsetY','垂直位置微调',0,{step:1})],
    fileName: v => '证件照_' + v.spec.split(' ')[0],
    tip: '默认按 300 DPI 输出标准像素尺寸。勾选「自动替换浅色背景」会把接近白色的背景替换为指定底色（适合纯色背景照片）；排版模式会生成可直接打印的多张排版图。',
    draw(ctx, cv, base, img, v) {
      const [w,h] = ID_SIZES[v.spec] || [295,413];
      const scale = (Number(v.dpi)||300)/300;
      const W = Math.round(w*scale), H = Math.round(h*scale);
      const target = document.createElement('canvas'); target.width=W; target.height=H;
      const tc = target.getContext('2d');
      // 居中裁切，人像等比放大铺满
      const ratio = Math.max(W/base.width, H/base.height) * (Number(v.zoom)||1);
      const dw = base.width*ratio, dh = base.height*ratio;
      tc.drawImage(base, (W-dw)/2, (H-dh)/2 + (Number(v.offsetY)||0)*scale, dw, dh);
      if (v.replace) {
        const d = tc.getImageData(0,0,W,H), px=d.data;
        const hex=v.bg.replace('#',''), br=parseInt(hex.slice(0,2),16),bg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);
        for(let i=0;i<px.length;i+=4){
          const r=px[i],g=px[i+1],b=px[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
          if(mn>185 && mx-mn<38){const k=(mn-185)/70;px[i]=Math.round(br+(r-br)*(1-k));px[i+1]=Math.round(bg+(g-bg)*(1-k));px[i+2]=Math.round(bb+(b-bb)*(1-k));}
        }
        tc.putImageData(d,0,0);
      }
      if (v.layout==='single') { cv.width=W;cv.height=H;ctx.drawImage(target,0,0);return; }
      const cnt=Number(v.layout),cols=cnt===4?2:2,rows=cnt/2,gap=Math.round(18*scale),pad=Math.round(24*scale);
      cv.width=cols*W+(cols+1)*gap+pad*0; cv.height=rows*H+(rows+1)*gap;
      ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
      for(let i=0;i<cnt;i++)ctx.drawImage(target,gap+(i%cols)*(W+gap),gap+Math.floor(i/cols)*(H+gap));
    }
  });

  /* ---------- 2. 海报设计 ---------- */
  single('海报设计', {
    fields: [S('ratio','画布比例',[['3:4','竖版 3:4'],['1:1','方形 1:1'],['16:9','横版 16:9'],['9:16','手机海报 9:16']],'3:4'), I('title','主标题','把繁琐的小事\n交给一个页面'), I('subtitle','副标题','282 个在线工具 · 打开即用'), I('titleColor','文字颜色','#ffffff',{type:'color'}), I('overlay','遮罩颜色','#111827',{type:'color'}), N('overlayAlpha','遮罩透明度（0-1）',.45,{min:0,max:1,step:.05}), S('align','文字对齐',[['left','左对齐'],['center','居中'],['right','右对齐']],'left'), N('fontSize','主标题字号',54), N('blur','背景模糊（px）',0,{min:0,max:30}), I('badge','角标文字','拾器 ToolBox')],
    fileName: () => 'poster', ext: 'jpg', mime: () => 'image/jpeg', quality: .93,
    tip: '文字直接绘制到图片上，支持多行标题（用 \\n 换行）；适合快速做活动海报、封面图。',
    draw(ctx,cv,base,img,v) {
      const map={'3:4':[900,1200],'1:1':[1000,1000],'16:9':[1280,720],'9:16':[720,1280]};
      const [w,h]=map[v.ratio]||map['3:4'];cv.width=w;cv.height=h;
      const scale=Math.max(w/base.width,h/base.height);
      ctx.save();if(v.blur>0)ctx.filter=`blur(${v.blur}px)`;
      ctx.drawImage(base,(w-base.width*scale)/2,(h-base.height*scale)/2,base.width*scale,base.height*scale);ctx.restore();
      ctx.fillStyle=v.overlay;ctx.globalAlpha=Number(v.overlayAlpha)||0;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
      const align=v.align||'left',x=align==='center'?w/2:align==='right'?w-70:70;
      ctx.textAlign=align;
      ctx.fillStyle=v.titleColor;ctx.font=`bold ${v.fontSize}px "Microsoft YaHei",sans-serif`;
      const lines=String(v.title||'').split('\n'),lh=v.fontSize*1.32;
      let y=h*.62;
      lines.forEach(l=>{ctx.fillText(l,x,y);y+=lh;});
      ctx.font=`${Math.round(v.fontSize*.4)}px "Microsoft YaHei",sans-serif`;ctx.globalAlpha=.85;
      ctx.fillText(String(v.subtitle||''),x,y+18);ctx.globalAlpha=1;
      if(v.badge){ctx.font='bold 22px sans-serif';ctx.globalAlpha=.9;ctx.textAlign=align==='right'?'left':'right';ctx.fillText(v.badge,align==='right'?70:w-70,64);ctx.globalAlpha=1;}
      ctx.textAlign='left';
    }
  });

  /* ---------- 3. 表情包制作 ---------- */
  single('表情包制作', {
    fields: [I('top','顶部文字',''), I('bottom','底部文字','我看看怎么个事'), N('fontSize','字号',44), I('color','文字颜色','#ffffff',{type:'color'}), I('stroke','描边颜色','#000000',{type:'color'}), N('strokeWidth','描边宽度',5), N('maxWidth','最大宽度（0 为原宽）',0), C('shadow','添加阴影',true,'阴影')],
    fileName: () => 'meme', ext: 'png',
    draw(ctx,cv,base,img,v) {
      let w=base.width,h=base.height;
      if(v.maxWidth>0&&w>v.maxWidth){h=Math.round(h*v.maxWidth/w);w=v.maxWidth;}
      cv.width=w;cv.height=h;ctx.drawImage(base,0,0,w,h);
      const drawText=(text,y)=>{
        if(!text)return;
        ctx.font=`bold ${v.fontSize}px "Microsoft YaHei","SimHei",sans-serif`;ctx.textAlign='center';ctx.textBaseline=y<0?'top':'bottom';
        ctx.lineJoin='round';ctx.strokeStyle=v.stroke;ctx.lineWidth=Number(v.strokeWidth)||0;
        if(v.shadow){ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;}
        const lines=String(text).split('\n');
        lines.forEach((l,i)=>{const yy=y<0?18+i*v.fontSize*1.2:h-18-(lines.length-1-i)*v.fontSize*1.2;
          if(v.strokeWidth>0)ctx.strokeText(l,w/2,yy);ctx.fillStyle=v.color;ctx.fillText(l,w/2,yy);});
        ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.textAlign='left';ctx.textBaseline='alphabetic';
      };
      drawText(v.top,-1);drawText(v.bottom,1);
    }
  });

  /* ---------- 5. 图片尺寸调整 ---------- */
  single('图片尺寸调整', {
    fields: [N('width','目标宽度（px）',800),N('height','目标高度（px）',0),C('lock','锁定宽高比',true,'等比缩放'),C('percent','按百分比缩放',false,'百分比模式'),N('pct','缩放百分比',50),S('fit','填充方式',[['stretch','拉伸铺满'],['contain','等比留白'],['cover','等比裁切铺满']],'stretch')],
    fileName: () => 'resized', ext: 'png',
    draw(ctx,cv,base,img,v) {
      let w,h;
      if(v.percent){w=Math.round(base.width*(Number(v.pct)||100)/100);h=Math.round(base.height*(Number(v.pct)||100)/100);}
      else {w=Math.round(Number(v.width)||base.width);h=Math.round(Number(v.height)||0);if(v.lock||!h)h=Math.round(w*base.height/base.width);}
      cv.width=Math.max(1,w);cv.height=Math.max(1,h);
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
      if(v.fit==='contain'&&!v.lock){const s=Math.min(w/base.width,h/base.height),dw=base.width*s,dh=base.height*s;ctx.drawImage(base,(w-dw)/2,(h-dh)/2,dw,dh);}
      else if(v.fit==='cover'&&!v.lock){const s=Math.max(w/base.width,h/base.height),dw=base.width*s,dh=base.height*s;ctx.drawImage(base,(w-dw)/2,(h-dh)/2,dw,dh);}
      else ctx.drawImage(base,0,0,w,h);
    }
  });

  /* ---------- 6. 图片裁剪 ---------- */
  single('图片裁剪', {
    fields: [S('ratio','裁剪比例',[['free','自由'],['1:1','1:1 方形'],['4:3','4:3'],['3:4','3:4'],['16:9','16:9'],['9:16','9:16'],['2:3','2:3']],'1:1'),N('x','起始 X（px，0 为居中）',0),N('y','起始 Y（px）',0),N('w','裁剪宽度（px，0 为最大）',0),N('h','裁剪高度（px）',0),C('maximize','按选区填满输出（放大）',false,'放大到 800px 宽')],
    fileName: () => 'cropped', ext: 'png',
    draw(ctx,cv,base,img,v) {
      const ratios={'1:1':1,'4:3':4/3,'3:4':3/4,'16:9':16/9,'9:16':9/16,'2:3':2/3};
      let cw=Math.round(Number(v.w)||0),ch=Math.round(Number(v.h)||0);
      if(v.ratio!=='free'){
        const r=ratios[v.ratio];
        if(!cw){cw=base.width;ch=Math.round(cw/r);if(ch>base.height){ch=base.height;cw=Math.round(ch*r);}}
        else if(!ch)ch=Math.round(cw/r);
      } else {if(!cw)cw=base.width;if(!ch)ch=base.height;}
      cw=Math.min(cw,base.width);ch=Math.min(ch,base.height);
      const x=Number(v.x)||Math.round((base.width-cw)/2),y=Number(v.y)||Math.round((base.height-ch)/2);
      const ow=v.maximize?Math.min(800,cw*2):cw,oh=v.maximize?Math.round(ow*ch/cw):ch;
      cv.width=ow;cv.height=oh;ctx.drawImage(base,x,y,cw,ch,0,0,ow,oh);
    }
  });

  /* ---------- 7. 圆形头像裁剪 ---------- */
  single('圆形头像裁剪', {
    fields: [S('shape','形状',[['circle','圆形'],['round','圆角方形']],'circle'),N('size','输出尺寸（px）',400),N('radius','圆角半径（圆角方形）',60),N('border','边框宽度（px）',0),I('borderColor','边框颜色','#7c6cff',{type:'color'}),I('bg','背景色','#ffffff',{type:'color'}),C('transparent','透明背景',true,'透明')],
    fileName: () => 'avatar', ext: 'png',
    draw(ctx,cv,base,img,v) {
      const s=Math.round(Number(v.size)||400);cv.width=s;cv.height=s;
      if(!v.transparent){ctx.fillStyle=v.bg;ctx.fillRect(0,0,s,s);}
      const bw=Number(v.border)||0,inner=s-bw*2;
      ctx.save();
      ctx.beginPath();
      if(v.shape==='circle')ctx.arc(s/2,s/2,inner/2,0,Math.PI*2);
      else {const r=Math.min(Number(v.radius)||60,inner/2),x=bw,y=bw,w=inner,h=inner;
        ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
      ctx.clip();
      const sc=Math.max(inner/base.width,inner/base.height);
      ctx.drawImage(base,(s-base.width*sc)/2,(s-base.height*sc)/2,base.width*sc,base.height*sc);
      ctx.restore();
      if(bw>0){ctx.beginPath();if(v.shape==='circle')ctx.arc(s/2,s/2,(inner+bw)/2,0,Math.PI*2);
        else{const r=Math.min(Number(v.radius)||60,(s-bw)/2);ctx.moveTo(bw/2+r,bw/2);ctx.arcTo(s-bw/2,bw/2,s-bw/2,s-bw/2,r);ctx.arcTo(s-bw/2,s-bw/2,bw/2,s-bw/2,r);ctx.arcTo(bw/2,s-bw/2,bw/2,bw/2,r);ctx.arcTo(bw/2,bw/2,s-bw/2,bw/2,r);ctx.closePath();}
        ctx.strokeStyle=v.borderColor;ctx.lineWidth=bw;ctx.stroke();}
    }
  });

  /* ---------- 8. 图片透视校正（四点单应变换） ---------- */
  function solve8(A,b){
    const n=8,M=A.map((row,i)=>row.concat([b[i]]));
    for(let c=0;c<n;c++){
      let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
      [M[c],M[p]]=[M[p],M[c]];
      if(Math.abs(M[c][c])<1e-12)continue;
      for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}
    }
    const x=new Array(n).fill(0);
    for(let i=0;i<n;i++)if(Math.abs(M[i][i])>1e-12)x[i]=M[i][n]/M[i][i];
    return x;
  }
  function homography(src,dst){
    const A=[],b=[];
    for(let i=0;i<4;i++){
      const [x,y]=src[i],[u,w]=dst[i];
      A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);
      A.push([0,0,0,x,y,1,-w*x,-w*y]);b.push(w);
    }
    return solve8(A,b);
  }
  single('图片透视校正', {
    fields: [N('tlx','左上点 X（0-1）',.08),N('tly','左上点 Y（0-1）',.08),N('trx','右上点 X（0-1）',.92),N('try','右上点 Y（0-1）',.12),N('brx','右下点 X（0-1）',.88),N('bry','右下点 Y（0-1）',.92),N('blx','左下点 X（0-1）',.12),N('bly','左下点 Y（0-1）',.88),C('previewPoints','显示四个控制点',true,'显示控制点'),N('quality','采样精度（1 最快）',1)],
    fileName: () => 'perspective_fixed', ext: 'png',
    tip: '把四个角点坐标填成文档 / 白板在照片中的实际位置（用 0~1 表示相对图片宽高的比例），工具会用单应变换把倾斜的四边形拉正。建议先关闭「显示控制点」再下载。',
    draw(ctx,cv,base,img,v) {
      const W=base.width,H=base.height;cv.width=W;cv.height=H;
      const norm=[[v.tlx,v.tly],[v.trx,v.try],[v.brx,v.bry],[v.blx,v.bly]].map(([x,y])=>[x*W,y*H]);
      const h=homography(norm,[[0,0],[W,0],[W,H],[0,H]]);
      const src=base.getContext('2d').getImageData(0,0,W,H).data;
      const out=ctx.createImageData(W,H),dst=out.data;
      const step=Math.max(1,Math.round(Number(v.quality)||1));
      for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step){
        const den=h[6]*x+h[7]*y+1;
        const sx=(h[0]*x+h[1]*y+h[2])/den,sy=(h[3]*x+h[4]*y+h[5])/den;
        if(sx<0||sy<0||sx>=W-1||sy>=H-1){for(let dy=0;dy<step;dy++)for(let dx=0;dx<step;dx++){const p=((y+dy)*W+(x+dx))*4;if(p<dst.length){dst[p]=255;dst[p+1]=255;dst[p+2]=255;dst[p+3]=255;}}continue;}
        const si=(Math.floor(sy)*W+Math.floor(sx))*4;
        for(let dy=0;dy<step;dy++)for(let dx=0;dx<step;dx++){
          const p=((y+dy)*W+(x+dx))*4;if(p>=dst.length)continue;
          dst[p]=src[si];dst[p+1]=src[si+1];dst[p+2]=src[si+2];dst[p+3]=255;
        }
      }
      ctx.putImageData(out,0,0);
      if(v.previewPoints){ctx.strokeStyle='#ff3b5c';ctx.lineWidth=Math.max(2,W/400);ctx.beginPath();norm.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();
        norm.forEach(([x,y],i)=>{ctx.fillStyle='#ff3b5c';ctx.beginPath();ctx.arc(x,y,W/90,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font=`bold ${Math.round(W/45)}px sans-serif`;ctx.fillText(String(i+1),x+W/80,y-W/80);});}
    }
  });

  /* ---------- 14. 添加水印 ---------- */
  single('添加水印', {
    fields: [I('text','水印文字','© 拾器 ToolBox'),N('fontSize','字号',28),I('color','文字颜色','#ffffff',{type:'color'}),N('opacity','不透明度（0-1）',.5,{min:0,max:1,step:.05}),S('pos','位置',[['tile','全图平铺'],['tl','左上'],['tr','右上'],['bl','左下'],['br','右下'],['center','居中']],'tile'),N('rotate','旋转角度',-30),C('shadow','添加阴影',true,'阴影'),S('mode','水印类型',[['text','文字水印'],['date','日期水印']],'text')],
    fileName: () => 'watermarked', ext: 'png',
    draw(ctx,cv,base,img,v) {
      cv.width=base.width;cv.height=base.height;ctx.drawImage(base,0,0);
      const text=v.mode==='date'?new Date().toLocaleDateString('zh-CN'):String(v.text||'');
      if(!text)return;
      ctx.save();ctx.globalAlpha=Number(v.opacity)||.5;ctx.fillStyle=v.color;
      ctx.font=`bold ${v.fontSize}px "Microsoft YaHei",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      if(v.shadow){ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=4;}
      const tw=ctx.measureText(text).width,pad=tw+60,gapY=Math.max(90,v.fontSize*3.5);
      const put=(x,y)=>{ctx.save();ctx.translate(x,y);ctx.rotate((Number(v.rotate)||0)*Math.PI/180);ctx.fillText(text,0,0);ctx.restore();};
      if(v.pos==='tile'){
        for(let y=-cv.height;y<cv.height*2;y+=gapY)for(let x=-cv.width;x<cv.width*2;x+=pad+70)put(x,y);
      } else {
        const m=Math.max(24,v.fontSize);
        const map={tl:[m+tw/2,m+v.fontSize],tr:[cv.width-m-tw/2,m+v.fontSize],bl:[m+tw/2,cv.height-m-v.fontSize],br:[cv.width-m-tw/2,cv.height-m-v.fontSize],center:[cv.width/2,cv.height/2]};
        put(...(map[v.pos]||map.center));
      }
      ctx.restore();
    }
  });

  /* ---------- 15. 去水印（区域修补） ---------- */
  single('去水印', {
    fields: [N('x','区域 X（px）',0),N('y','区域 Y（px）',0),N('w','区域宽度（px）',200),N('h','区域高度（px）',60),S('method','修补方式',[['stretch','邻近像素拉伸'],['blur','局部强模糊'],['mean','邻近均值填充']],'stretch'),C('previewBox','显示选区框',true,'显示选框')],
    fileName: () => 'cleaned', ext: 'png',
    tip: '框选水印区域后用邻近像素拉伸 / 模糊覆盖，适合纯色或简单纹理背景；复杂背景建议用专业修复工具。坐标为图片像素值。',
    draw(ctx,cv,base,img,v) {
      cv.width=base.width;cv.height=base.height;ctx.drawImage(base,0,0);
      const x=T.clamp(Math.round(Number(v.x)||0),0,base.width-1),y=T.clamp(Math.round(Number(v.y)||0),0,base.height-1);
      const w=T.clamp(Math.round(Number(v.w)||0),1,base.width-x),h=T.clamp(Math.round(Number(v.h)||0),1,base.height-y);
      if(v.method==='stretch'){
        const sx=x>2?x-2:Math.min(base.width-1,x+w+1);
        const patch=document.createElement('canvas');patch.width=2;patch.height=h;
        patch.getContext('2d').drawImage(base,sx,y,2,h,0,0,2,h);
        ctx.drawImage(patch,0,0,2,h,x,y,w,h);
      } else if(v.method==='blur'){
        const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d').drawImage(base,x,y,w,h,0,0,w,h);
        ctx.save();ctx.filter='blur(12px)';ctx.drawImage(tmp,x-12,y-12,w+24,h+24);ctx.restore();
        ctx.drawImage(tmp,x,y,w,h); // 叠加中心内容保证尺寸
      } else {
        const d=ctx.getImageData(Math.max(0,x-6),y,Math.min(6,base.width),h).data;
        let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];n++;}
        ctx.fillStyle=`rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`;ctx.fillRect(x,y,w,h);
      }
      if(v.previewBox){ctx.strokeStyle='#ff3b5c';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);}
    }
  });

  /* ---------- 16. 图片旋转翻转 ---------- */
  single('图片旋转翻转', {
    fields: [N('angle','旋转角度',90),C('flipH','水平翻转',false,'水平镜像'),C('flipV','垂直翻转',false,'垂直镜像'),I('bg','旋转留白背景色','#ffffff',{type:'color'}),C('transparent','透明背景',false,'透明')],
    fileName: () => 'rotated', ext: 'png',
    draw(ctx,cv,base,img,v) {
      const a=(Number(v.angle)||0)*Math.PI/180,w=base.width,h=base.height;
      const nw=Math.ceil(Math.abs(w*Math.cos(a))+Math.abs(h*Math.sin(a))),nh=Math.ceil(Math.abs(w*Math.sin(a))+Math.abs(h*Math.cos(a)));
      cv.width=nw;cv.height=nh;
      if(!v.transparent){ctx.fillStyle=v.bg;ctx.fillRect(0,0,nw,nh);}
      ctx.save();ctx.translate(nw/2,nh/2);ctx.rotate(a);ctx.scale(v.flipH?-1:1,v.flipV?-1:1);
      ctx.drawImage(base,-w/2,-h/2);ctx.restore();
    }
  });

  /* ---------- 17. 图片调色 ---------- */
  single('图片调色', {
    fields: [N('brightness','亮度（-100 ~ 100）',0),N('contrast','对比度（-100 ~ 100）',0),N('saturation','饱和度（-100 ~ 100）',0),N('temperature','色温（-100 冷 ~ 100 暖）',0),N('hue','色相偏移（度）',0),N('gamma','伽马（0.2 ~ 3）',1,{min:.2,max:3,step:.05})],
    fileName: () => 'adjusted', ext: 'png',
    draw(ctx,cv,base,img,v) {
      cv.width=base.width;cv.height=base.height;ctx.drawImage(base,0,0);
      const b=Number(v.brightness)||0,c=(Number(v.contrast)||0)/100,s=1+(Number(v.saturation)||0)/100,t=(Number(v.temperature)||0),g=Number(v.gamma)||1;
      const cf=(259*(c*255+255))/(255*(259-c*255));
      const d=ctx.getImageData(0,0,cv.width,cv.height),px=d.data;
      for(let i=0;i<px.length;i+=4){
        let r=px[i]+b+t,g0=px[i+1]+b+t*.35,bl=px[i+2]+b-t;
        r=cf*(r-128)+128;g0=cf*(g0-128)+128;bl=cf*(bl-128)+128;
        const lum=.2126*r+.7152*g0+.0722*bl;
        r=lum+(r-lum)*s;g0=lum+(g0-lum)*s;bl=lum+(bl-lum)*s;
        const inv=1/g;
        px[i]=T.clamp(Math.pow(T.clamp(r,0,255)/255,inv)*255,0,255);
        px[i+1]=T.clamp(Math.pow(T.clamp(g0,0,255)/255,inv)*255,0,255);
        px[i+2]=T.clamp(Math.pow(T.clamp(bl,0,255)/255,inv)*255,0,255);
      }
      ctx.putImageData(d,0,0);
    }
  });

  /* ---------- 18. 图片滤镜 ---------- */
  const FILTERS={none:'',grayscale:'grayscale(1)',sepia:'sepia(.85)',vintage:'sepia(.5) contrast(1.15) saturate(.8) brightness(1.05)',film:'contrast(1.2) saturate(.75) sepia(.25)',invert:'invert(1)',cold:'hue-rotate(180deg) saturate(.8)',warm:'sepia(.3) saturate(1.3)',vivid:'saturate(1.8) contrast(1.1)',dream:'blur(.6px) brightness(1.1) saturate(1.2)'};
  single('图片滤镜', {
    fields: [S('filter','滤镜风格',[['none','原图'],['grayscale','黑白'],['sepia','复古棕褐'],['vintage','复古胶片'],['film','电影感'],['invert','反色负片'],['cold','冷色调'],['warm','暖色调'],['vivid','鲜艳'],['dream','梦幻柔光']],'vintage'),N('intensity','强度（0-100）',100),N('vignette','暗角强度（0-100）',0)],
    fileName: () => 'filtered', ext: 'jpg', mime: () => 'image/jpeg', quality: .92,
    draw(ctx,cv,base,img,v) {
      cv.width=base.width;cv.height=base.height;
      const f=FILTERS[v.filter]||'';
      const pct=Number(v.intensity)||100;
      ctx.save();
      if(f&&pct<100){ctx.filter=f.replace(/\(([\d.]+)\)/g,(m,n)=>`(${1+(+n-1)*pct/100})`);}
      else ctx.filter=f;
      ctx.drawImage(base,0,0);ctx.restore();
      const vg=(Number(v.vignette)||0)/100;
      if(vg>0){const gr=ctx.createRadialGradient(cv.width/2,cv.height/2,Math.min(cv.width,cv.height)*.25,cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*.72);
        gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,`rgba(0,0,0,${vg*.85})`);ctx.fillStyle=gr;ctx.fillRect(0,0,cv.width,cv.height);}
    }
  });

  /* ---------- 21. 图片噪点消除 ---------- */
  single('图片噪点消除', {
    fields: [S('method','降噪算法',[['median','中值滤波（去椒盐噪点）'],['mean','均值模糊'],['gauss','高斯模糊']],'median'),N('radius','卷积半径（1-3）',1),N('strength','强度（0-100）',70),C('sharpen','降噪后轻微锐化',true,'锐化')],
    fileName: () => 'denoised', ext: 'png',
    draw(ctx,cv,base,img,v) {
      cv.width=base.width;cv.height=base.height;ctx.drawImage(base,0,0);
      const r=T.clamp(Math.round(Number(v.radius)||1),1,3),strength=T.clamp((Number(v.strength)||0)/100,0,1);
      const src=ctx.getImageData(0,0,cv.width,cv.height),d=src.data,W=cv.width,H=cv.height;
      const out=ctx.createImageData(W,H),o=out.data;
      const kernel=[];if(v.method==='gauss'){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)kernel.push([dx,dy,Math.exp(-(dx*dx+dy*dy)/(2*r*r))]);}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const p=(y*W+x)*4;
        for(let ch=0;ch<3;ch++){
          const vals=[];
          if(v.method==='median'){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)vals.push(d[((T.clamp(y+dy,0,H-1))*W+T.clamp(x+dx,0,W-1))*4+ch]);vals.sort((a,b)=>a-b);}
          let nv;
          if(v.method==='median')nv=vals[Math.floor(vals.length/2)];
          else if(v.method==='gauss'){let sum=0,ws=0;kernel.forEach(([dx,dy,wt])=>{sum+=d[((T.clamp(y+dy,0,H-1))*W+T.clamp(x+dx,0,W-1))*4+ch]*wt;ws+=wt;});nv=sum/ws;}
          else {let sum=0,n=0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){sum+=d[((T.clamp(y+dy,0,H-1))*W+T.clamp(x+dx,0,W-1))*4+ch];n++;}nv=sum/n;}
          o[p+ch]=v.sharpen?T.clamp(d[p+ch]+(d[p+ch]-nv)*.25,0,255):d[p+ch]+(nv-d[p+ch])*strength;
        }
        o[p+3]=255;
      }
      ctx.putImageData(out,0,0);
    }
  });

  /* ---------- 24. 颜色拾取器（交互取色） ---------- */
  R('颜色拾取器', { render(host, api) {
    host.innerHTML = `<div class="custom-pane"><div class="cp-row"><label class="file-drop" style="flex:1"><input type="file" id="cpFile" accept="image/*"><span class="file-btn">选择图片</span><span class="file-names" id="cpName">尚未选择文件</span></label></div>
      <div class="cp-row"><div id="cpSwatch" style="width:56px;height:38px;border-radius:8px;border:1px solid var(--line-strong);background:#7c6cff"></div><span id="cpValue" style="font-family:ui-monospace,monospace;font-size:14px;font-weight:700;color:var(--accent)">点击图片取色</span><button class="btn btn-ghost" id="cpCopy">复制色值</button></div>
      <div class="cp-canvas-wrap"><canvas id="cpCanvas" width="600" height="400"></canvas></div><div id="cpList" style="display:flex;gap:8px;flex-wrap:wrap"></div></div>`;
    const cv=host.querySelector('#cpCanvas'),ctx=cv.getContext('2d',{willReadFrequently:true});
    let colors=[],url=null;
    const setColor=(r,g,b)=>{
      const hex='#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
      host.querySelector('#cpSwatch').style.background=hex;
      host.querySelector('#cpValue').textContent=`${hex.toUpperCase()}  ·  rgb(${r}, ${g}, ${b})`;
      host.querySelector('#cpCopy').onclick=()=>T.copy(hex.toUpperCase());
      colors.unshift(hex);colors=colors.slice(0,12);
      host.querySelector('#cpList').innerHTML=colors.map(c=>`<div style="text-align:center;font-size:10px;font-family:monospace"><div style="width:44px;height:32px;border-radius:6px;background:${c};border:1px solid var(--line)"></div>${c}</div>`).join('');
    };
    host.querySelector('#cpFile').onchange=async e=>{
      const f=e.target.files[0];if(!f)return;
      host.querySelector('#cpName').textContent=f.name;
      if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(f);
      const img=await T.loadImage(url);
      const scale=Math.min(600/img.naturalWidth,400/img.naturalHeight,1);
      cv.width=Math.round(img.naturalWidth*scale);cv.height=Math.round(img.naturalHeight*scale);
      ctx.drawImage(img,0,0,cv.width,cv.height);
    };
    cv.onclick=e=>{
      const rect=cv.getBoundingClientRect(),x=Math.floor((e.clientX-rect.left)*cv.width/rect.width),y=Math.floor((e.clientY-rect.top)*cv.height/rect.height);
      try{const d=ctx.getImageData(x,y,1,1).data;setColor(d[0],d[1],d[2]);}catch(_){T.toast('请先选择图片','err');}
    };
    api.onCleanup(()=>{if(url)URL.revokeObjectURL(url);});
    ctx.fillStyle='#eef2f9';ctx.fillRect(0,0,600,400);ctx.fillStyle='#8893a9';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText('选择图片后在图上点击吸取颜色',300,200);ctx.textAlign='left';
  }});

  /* ---------- 25. 图片直方图 ---------- */
  single('图片直方图查看', {
    fields: [S('channel','通道',[['luma','亮度'],['rgb','RGB 三通道'],['r','红'],['g','绿'],['b','蓝']],'rgb'),N('bins','柱数',128)],
    fileName: () => 'histogram', ext: 'png',
    draw(ctx,cv,base,img,v) {
      const bins=T.clamp(Math.round(Number(v.bins)||128),16,256);
      const d=base.getContext('2d').getImageData(0,0,base.width,base.height).data;
      const hist={r:new Uint32Array(bins),g:new Uint32Array(bins),b:new Uint32Array(bins),l:new Uint32Array(bins)};
      for(let i=0;i<d.length;i+=4){
        const r=d[i],g=d[i+1],b=d[i+2];
        hist.r[Math.min(bins-1,Math.floor(r/256*bins))]++;
        hist.g[Math.min(bins-1,Math.floor(g/256*bins))]++;
        hist.b[Math.min(bins-1,Math.floor(b/256*bins))]++;
        hist.l[Math.min(bins-1,Math.floor((.2126*r+.7152*g+.0722*b)/256*bins))]++;
      }
      const keys=v.channel==='rgb'?['r','g','b']:v.channel==='luma'?['l']:[v.channel];
      const max=Math.max(...keys.map(k=>Math.max(...hist[k])));
      const W=760,H=380,pad=40;cv.width=W;cv.height=H;
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#d8dee9';ctx.lineWidth=1;
      for(let i=0;i<=4;i++){const y=pad+(H-pad*2)*i/4;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-pad,y);ctx.stroke();ctx.fillStyle='#9aa7ba';ctx.font='10px sans-serif';ctx.fillText(String(Math.round(max*(1-i/4))),4,y+3);}
      const colors={r:'rgba(251,113,133,.75)',g:'rgba(52,211,153,.75)',b:'rgba(78,168,255,.75)',l:'rgba(124,108,255,.65)'};
      keys.forEach(k=>{ctx.fillStyle=colors[k];const bw=(W-pad*2)/bins;
        for(let i=0;i<bins;i++){const hh=(hist[k][i]/max)*(H-pad*2);ctx.fillRect(pad+i*bw,H-pad-hh,Math.max(1,bw),hh);}});
      ctx.fillStyle='#2c3a55';ctx.font='12px sans-serif';ctx.fillText('0',pad,H-14);ctx.fillText('128',W/2-10,H-14);ctx.fillText('255',W-pad-24,H-14);
      ctx.font='bold 13px sans-serif';ctx.fillText('像素分布直方图 · 峰值 '+max,pad,24);
      // 统计信息
      let sum=0,n=0;for(let i=0;i<d.length;i+=4){sum+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];n++;}
      ctx.font='11px sans-serif';ctx.fillStyle='#6d7891';ctx.fillText('平均亮度 '+(sum/n).toFixed(1)+' / 255',W-190,24);
    }
  });

  /* ---------- 28. 图片模糊打码 ---------- */
  single('图片模糊打码', {
    fields: [N('x','区域 X（px）',0),N('y','区域 Y（px）',0),N('w','区域宽度（px）',240),N('h','区域高度（px）',120),S('mode','遮挡方式',[['mosaic','马赛克'],['blur','高斯模糊'],['solid','纯色遮盖']],'mosaic'),N('block','马赛克块大小 / 模糊半径',16),I('color','遮盖颜色','#222222',{type:'color'}),C('previewBox','显示选区框',false,'显示选框')],
    fileName: () => 'masked', ext: 'png',
    tip: '输入要遮挡的矩形区域（像素坐标），可对人脸、车牌、号码等敏感信息打码。下载前建议关闭「显示选区框」。',
    draw(ctx,cv,base,img,v) {
      cv.width=base.width;cv.height=base.height;ctx.drawImage(base,0,0);
      const x=T.clamp(Math.round(Number(v.x)||0),0,base.width-1),y=T.clamp(Math.round(Number(v.y)||0),0,base.height-1);
      const w=T.clamp(Math.round(Number(v.w)||0),1,base.width-x),h=T.clamp(Math.round(Number(v.h)||0),1,base.height-y),b=Math.max(2,Math.round(Number(v.block)||16));
      if(v.mode==='solid'){ctx.fillStyle=v.color;ctx.fillRect(x,y,w,h);}
      else if(v.mode==='blur'){
        const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d').drawImage(base,x,y,w,h,0,0,w,h);
        ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.filter=`blur(${b}px)`;ctx.drawImage(tmp,x-b,y-b,w+b*2,h+b*2);ctx.restore();
      } else {
        const sw=Math.max(1,Math.floor(w/b)),sh=Math.max(1,Math.floor(h/b));
        const tmp=document.createElement('canvas');tmp.width=sw;tmp.height=sh;
        tmp.getContext('2d').drawImage(base,x,y,w,h,0,0,sw,sh);
        ctx.imageSmoothingEnabled=false;ctx.drawImage(tmp,0,0,sw,sh,x,y,w,h);ctx.imageSmoothingEnabled=true;
      }
      if(v.previewBox){ctx.strokeStyle='#ff3b5c';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);}
    }
  });

  /* ---------- 29. 图片边框生成 ---------- */
  single('图片边框生成', {
    fields: [N('border','边框宽度（px）',24),I('color','边框颜色','#ffffff',{type:'color'}),S('style','样式',[['solid','纯色边框'],['gradient','渐变边框'],['polaroid','拍立得风格'],['shadow','投影白边']],'solid'),N('radius','圆角半径',0),I('bg','外底色','#eef2f9',{type:'color'}),C('shadow','添加投影',true,'阴影')],
    fileName: () => 'framed', ext: 'png',
    draw(ctx,cv,base,img,v) {
      const b=Math.max(0,Math.round(Number(v.border)||0)),pad=v.style==='polaroid'?b*2:b;
      cv.width=base.width+b*2+(v.shadow?30:0);cv.height=base.height+b*2+(v.style==='polaroid'?b*2:0)+(v.shadow?30:0);
      ctx.fillStyle=v.bg;ctx.fillRect(0,0,cv.width,cv.height);
      const bx=15,by=15;
      if(v.shadow){ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=22;ctx.shadowOffsetY=10;}
      if(v.style==='gradient'){const gr=ctx.createLinearGradient(0,0,cv.width,cv.height);gr.addColorStop(0,'#7c6cff');gr.addColorStop(1,'#4ea8ff');ctx.fillStyle=gr;}
      else ctx.fillStyle=v.color;
      ctx.fillRect(bx,by,base.width+b*2,base.height+(v.style==='polaroid'?b*3:b*2));
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      const r=Math.round(Number(v.radius)||0);
      if(r>0){ctx.save();ctx.beginPath();ctx.roundRect?ctx.roundRect(bx+b,by+b,base.width,base.height,r):ctx.rect(bx+b,by+b,base.width,base.height);ctx.clip();}
      ctx.drawImage(base,bx+b,by+b);
      if(r>0)ctx.restore();
    }
  });
})();
