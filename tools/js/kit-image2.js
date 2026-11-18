/* ============================================================
   工具实现：图片工具（批量 / 格式 / PDF / GIF / EXIF）
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file', accept: 'image/*' }, extra || {});
  const FS = (key, label, extra) => Object.assign({ key, label, type: 'files', accept: 'image/*' }, extra || {});
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const nameOf = (f, ext) => (f.name || 'image').replace(/\.[^.]+$/, '') + '.' + ext;
  const dataURLBase64 = u => String(u).split(',')[1] || '';
  const b64ToBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function toImage(file) {
    const url = URL.createObjectURL(file);
    try { const img = await T.loadImage(url); return { img, url }; }
    catch (e) { URL.revokeObjectURL(url); throw e; }
  }
  async function loadAll(files) {
    if (!files || !files.length) throw new Error('请先选择图片文件');
    const out = [];
    for (const f of files) out.push(await toImage(f));
    return out;
  }
  const freeAll = list => list.forEach(x => URL.revokeObjectURL(x.url));
  async function zipOf(items) {
    if (!window.JSZip) throw new Error('ZIP 组件未加载');
    const zip = new JSZip();
    items.forEach(it => zip.file(it.name, dataURLBase64(it.src), { base64: true }));
    return await zip.generateAsync({ type: 'blob' });
  }
  function zipResult(items, zipName) {
    return async () => { const blob = await zipOf(items); T.save(blob, zipName); };
  }
  const cvToUrl = (cv, mime, q) => cv.toDataURL(mime || 'image/png', q == null ? .92 : q);

  /* ---------- 4. 图片压缩 ---------- */
  R('图片压缩', { fields:[F('file','选择图片'),S('format','输出格式',[['image/jpeg','JPEG（体积最小）'],['image/webp','WebP（推荐）'],['image/png','PNG（无损）']],'image/jpeg'),N('quality','画质（0.1 ~ 1）',.75,{min:.1,max:1,step:.05}),N('maxWidth','最大宽度（0 为不缩放）',0),C('auto','自动推荐画质',false,'按目标体积自动调整')],
    run:async v=>{
      if(!v.file)throw new Error('请选择图片');
      const {img,url}=await toImage(v.file);
      try{
        let c=T.imageCanvas(img);
        if(v.maxWidth>0&&c.width>v.maxWidth){const nh=Math.round(c.height*v.maxWidth/c.width);const t=document.createElement('canvas');t.width=v.maxWidth;t.height=nh;t.getContext('2d').drawImage(c,0,0,t.width,t.height);c=t;}
        const mime=v.format.startsWith('image/jpeg')?'image/jpeg':v.format,q=T.clamp(Number(v.quality)||.75,.1,1);
        if(mime==='image/jpeg'){const bg=document.createElement('canvas');bg.width=c.width;bg.height=c.height;const bx=bg.getContext('2d');bx.fillStyle='#fff';bx.fillRect(0,0,bg.width,bg.height);bx.drawImage(c,0,0);c=bg;}
        let blob=await T.canvasBlob(c,mime,q);
        let used=q;
        if(v.auto){for(let i=0;i<8&&blob.size>v.file.size*.5;i++){used=Math.max(.1,used-.08);blob=await T.canvasBlob(c,mime,used);}}
        const ext=mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png';
        return [{type:'file',blob,name:nameOf(v.file,ext),title:'压缩后文件'},
          KV([['原始体积',T.fmt(v.file.size/1024,1)+' KB'],['压缩后体积',T.fmt(blob.size/1024,1)+' KB'],
            ['节省',T.fmt((1-blob.size/v.file.size)*100,1)+'%'],['输出格式',mime],['实际画质',T.fmt(used,2)],['尺寸',`${c.width} × ${c.height} px`]],'压缩报告'),
          {type:'image',src:cvToUrl(c,mime,q),name:'preview.'+ext,title:'压缩预览（预览为原始画质，下载文件为压缩画质）'}];
      }finally{URL.revokeObjectURL(url);}
    }});

  /* ---------- 9. 图片格式转换 ---------- */
  R('图片格式转换', { fields:[FS('files','选择图片（可多选批量）'),S('format','目标格式',[['image/png','PNG'],['image/jpeg','JPG'],['image/webp','WebP']],'image/png'),N('quality','画质（JPG / WebP）',.92,{min:.1,max:1,step:.05}),I('bg','JPG 背景填充色','#ffffff',{type:'color'})],
    run:async v=>{
      const list=await loadAll(v.files);
      try{
        const ext=v.format==='image/jpeg'?'jpg':v.format==='image/webp'?'webp':'png',items=[];
        for(let i=0;i<list.length;i++){
          let c=T.imageCanvas(list[i].img);
          if(v.format==='image/jpeg'){const t=document.createElement('canvas');t.width=c.width;t.height=c.height;const x=t.getContext('2d');x.fillStyle=v.bg||'#fff';x.fillRect(0,0,t.width,t.height);x.drawImage(c,0,0);c=t;}
          items.push({src:cvToUrl(c,v.format,Number(v.quality)||.92),name:nameOf(v.files[i],ext)});
        }
        return [{type:'images',items,title:`已转换 ${items.length} 张图片`,zip:zipResult(items,'converted_images.zip')},
          KV([['输入格式',v.files.map(f=>f.name.split('.').pop()).join(', ')],['输出格式',ext.toUpperCase()],['文件数',items.length]],'转换信息')];
      }finally{freeAll(list);}
    }});

  /* ---------- 10. HEIC 转 JPG ---------- */
  R('HEIC 转 JPG', { fields:[FS('files','选择 HEIC / HEIF 照片（可批量）',{accept:'.heic,.heif,image/heic,image/heif'}),S('format','输出格式',[['image/jpeg','JPG'],['image/png','PNG']],'image/jpeg'),N('quality','JPG 画质',.9,{min:.1,max:1,step:.05})],
    run:async v=>{
      if(!v.files||!v.files.length)throw new Error('请选择 HEIC / HEIF 文件');
      if(!window.heic2any)throw new Error('HEIC 解码组件未加载');
      const items=[];
      for(const f of v.files){
        let blob;
        try{blob=await window.heic2any({blob:f,toType:v.format,quality:Number(v.quality)||.9});}
        catch(e){throw new Error(`${f.name} 转换失败：${e.message||'文件可能不是 HEIC 格式'}`);}
        const arr=Array.isArray(blob)?blob:[blob];
        for(let i=0;i<arr.length;i++){
          const dataURL=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(arr[i]);});
          items.push({src:dataURL,name:nameOf(f,arr.length>1?`${i+1}.${v.format==='image/jpeg'?'jpg':'png'}`:v.format==='image/jpeg'?'jpg':'png')});
        }
      }
      return [{type:'images',items,title:`已转换 ${items.length} 张图片`,zip:zipResult(items,'heic_converted.zip')},
        {type:'note',value:'HEIC 解码使用本地 WebAssembly 组件，首次转换可能需要几秒；照片不会上传到任何服务器。'}];
    }});

  /* ---------- 11. AVIF 格式转换 ---------- */
  R('AVIF 格式转换', { fields:[F('file','选择 AVIF / JPG / PNG / WebP 图片',{accept:'image/avif,image/jpeg,image/png,image/webp,.avif'}),S('format','目标格式',[['image/png','PNG'],['image/jpeg','JPG'],['image/webp','WebP']],'image/jpeg'),N('quality','画质',.9,{min:.1,max:1,step:.05})],
    run:async v=>{
      if(!v.file)throw new Error('请选择图片');
      const {img,url}=await toImage(v.file);
      try{
        const c=T.imageCanvas(img);
        let cc=c;
        if(v.format==='image/jpeg'){cc=document.createElement('canvas');cc.width=c.width;cc.height=c.height;const x=cc.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cc.width,cc.height);x.drawImage(c,0,0);}
        const src=cvToUrl(cc,v.format,Number(v.quality)||.9);
        const blob=await T.canvasBlob(cc,v.format,Number(v.quality)||.9);
        const ext=v.format==='image/jpeg'?'jpg':v.format==='image/webp'?'webp':'png';
        return [{type:'image',src,name:nameOf(v.file,ext),title:'转换预览'},
          KV([['原始格式',v.file.type||v.file.name.split('.').pop()],['原始体积',T.fmt(v.file.size/1024,1)+' KB'],['输出格式',ext.toUpperCase()],['输出体积',T.fmt(blob.size/1024,1)+' KB'],['体积变化',T.fmt((blob.size/v.file.size-1)*100,1)+'%'],['图片尺寸',`${c.width} × ${c.height}`]],'体积对比'),
          {type:'note',kind:'warn',value:'浏览器原生支持 AVIF <b>解码</b>，因此可以把 AVIF 转成 JPG / PNG / WebP；但 Canvas 目前不支持 AVIF <b>编码</b>，其他格式转 AVIF 需要 WASM 编码器，本工具暂不提供。'}];
      }finally{URL.revokeObjectURL(url);}
    }});

  /* ---------- 12. 图片转 Base64 ---------- */
  R('图片转 Base64', { fields:[F('file','选择图片'),C('prefix','包含 data:image 前缀',true,'Data URL 格式'),C('wrap','生成可直接用的代码片段',true,'附带 CSS / HTML / MD')],
    run:async v=>{
      if(!v.file)throw new Error('请选择图片');
      const raw=await T.readFile(v.file,'dataURL'),out=v.prefix?String(raw):String(raw).split(',')[1];
      const css=`background-image: url("${raw}");`,html=`<img src="${raw}" alt="image">`,md=`![image](${raw})`;
      return [{type:'text',value:out,title:'Base64 / Data URL',download:'image_base64.txt'},
        KV([['文件名',v.file.name],['MIME',v.file.type||'未知'],['文件大小',T.fmt(v.file.size/1024,1)+' KB'],['Base64 长度',out.length+' 字符'],['编码后膨胀',T.fmt(out.length/v.file.size*100-100,1)+'%']],'编码信息'),
        ...(v.wrap?[{type:'text',value:`/* CSS */\n${css}\n\n<!-- HTML -->\n${html}\n\n/* Markdown */\n${md}`,title:'可直接使用的代码片段',download:'snippets.txt'}]:[])];
    }});

  /* ---------- 13. 多图合成 PDF ---------- */
  R('多图合成 PDF', { fields:[FS('files','按顺序选择多张图片'),S('page','页面尺寸',[['a4','A4 纵向'],['a4l','A4 横向'],['fit','自适应图片尺寸']],'a4'),S('fitMode','图片适配',[['contain','完整显示（留白）'],['cover','铺满页面（裁切）']],'contain'),I('bg','页面背景色','#ffffff',{type:'color'})],
    run:async v=>{
      const list=await loadAll(v.files);
      try{
        if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('PDF 组件未加载');
        const {jsPDF}=window.jspdf;
        let pdf=null;
        for(let i=0;i<list.length;i++){
          let c=T.imageCanvas(list[i].img);
          const jpg=document.createElement('canvas');jpg.width=c.width;jpg.height=c.height;
          const jc=jpg.getContext('2d');jc.fillStyle=v.bg||'#fff';jc.fillRect(0,0,jpg.width,jpg.height);jc.drawImage(c,0,0);
          const dataURL=jpg.toDataURL('image/jpeg',.9);
          const pw=jpg.width,ph=jpg.height;
          if(!pdf)pdf=new jsPDF({orientation:v.page==='a4l'||(v.page==='fit'&&pw>ph)?'landscape':'portrait',unit:'pt',format:v.page==='fit'?[pw,ph]:'a4',compress:true});
          else pdf.addPage(v.page==='fit'?[pw,ph]:'a4',v.page==='a4l'||(v.page==='fit'&&pw>ph)?'landscape':'portrait');
          const size=pdf.getPageWidth?{w:pdf.internal.pageSize.getWidth(),h:pdf.internal.pageSize.getHeight()}:{w:595,h:842};
          const W=size.w,H=size.h;
          if(v.page==='fit')pdf.addImage(dataURL,'JPEG',0,0,W,H);
          else{
            const s=v.fitMode==='cover'?Math.max(W/pw,H/ph):Math.min(W/pw,H/ph),dw=pw*s,dh=ph*s;
            pdf.addImage(dataURL,'JPEG',(W-dw)/2,(H-dh)/2,dw,dh);
          }
        }
        const blob=pdf.output('blob');
        return [{type:'file',blob,name:'images_combined.pdf',title:'生成的 PDF'},
          KV([['图片数量',list.length],['PDF 页数',list.length],['页面尺寸',v.page==='fit'?'自适应':v.page==='a4l'?'A4 横向':'A4 纵向'],['PDF 体积',T.fmt(blob.size/1024,1)+' KB']],'合成信息')];
      }finally{freeAll(list);}
    }});

  /* ---------- 19. 图片拼接 ---------- */
  R('图片拼接', { fields:[FS('files','按顺序选择多张图片'),S('direction','拼接方向',[['h','横向拼接'],['v','纵向拼接'],['grid','网格拼接']],'h'),N('cols','网格列数（网格模式）',3),N('gap','图片间距（px）',8),I('bg','背景色','#ffffff',{type:'color'}),S('align','图片尺寸对齐',[['normalize','统一高度/宽度（推荐）'],['keep','保留原始尺寸']],'normalize'),N('cell','统一尺寸（px）',400)],
    run:async v=>{
      const list=await loadAll(v.files);
      try{
        const n=list.length,gap=Math.max(0,Math.round(Number(v.gap)||0)),cell=Math.round(Number(v.cell)||400);
        const cvs=list.map(x=>T.imageCanvas(x.img));
        let dims;
        if(v.align==='normalize'){
          if(v.direction==='v')dims=cvs.map(c=>{const h=cell,w=Math.round(c.width*c.height?cell*c.width/c.height:cell);return[w,h];});
          else dims=cvs.map(()=>[cell,cell]);
          if(v.direction==='h')dims=cvs.map(c=>[Math.round(cell*c.width/c.height),cell]);
          if(v.direction==='grid')dims=cvs.map(()=>[cell,cell]);
        } else dims=cvs.map(c=>[c.width,c.height]);
        const cols=v.direction==='h'?n:v.direction==='v'?1:Math.max(1,Math.round(Number(v.cols)||3));
        const rows=v.direction==='v'?n:Math.ceil(n/cols);
        const rowH=[],colW=[];
        for(let r=0;r<rows;r++)rowH[r]=Math.max(...Array.from({length:Math.min(cols,n-r*cols)},(_,i)=>dims[r*cols+i][1]));
        for(let cc=0;cc<cols;cc++){let m=0;for(let r=0;r<rows;r++)if(dims[r*cols+cc])m=Math.max(m,dims[r*cols+cc][0]);colW[cc]=m;}
        const W=colW.reduce((a,b)=>a+b,0)+gap*(cols+1),H=rowH.reduce((a,b)=>a+b,0)+gap*(rows+1);
        const out=document.createElement('canvas');out.width=W;out.height=H;const ctx=out.getContext('2d');
        ctx.fillStyle=v.bg||'#fff';ctx.fillRect(0,0,W,H);
        let y=gap;
        for(let r=0;r<rows;r++){
          let x=gap;
          for(let cc=0;cc<cols;cc++){
            const idx=r*cols+cc;if(idx>=n)break;
            const [dw,dh]=dims[idx];
            ctx.drawImage(cvs[idx],x,y,dw,dh);
            x+=colW[cc]+gap;
          }
          y+=rowH[r]+gap;
        }
        return [{type:'image',src:out.toDataURL('image/png'),name:'stitched.png',title:`拼接结果 ${W} × ${H} px`},
          KV([['图片数量',n],['排列',`${rows} 行 × ${cols} 列`],['输出尺寸',`${W} × ${H} px`],['间距',gap+' px']],'拼接信息')];
      }finally{freeAll(list);}
    }});

  /* ---------- 20. 图片分割 ---------- */
  R('图片分割', { fields:[F('file','选择要分割的图片'),N('cols','横向切分数',3),N('rows','纵向切分数',3),S('shape','输出形状',[['rect','按网格矩形'],['square','强制正方形切块']],'rect')],
    run:async v=>{
      if(!v.file)throw new Error('请选择图片');
      const {img,url}=await toImage(v.file);
      try{
        const c=T.imageCanvas(img),cols=Math.max(1,Math.round(Number(v.cols)||3)),rows=Math.max(1,Math.round(Number(v.rows)||3));
        let cw,ch;
        if(v.shape==='square'){const size=Math.min(Math.floor(c.width/cols),Math.floor(c.height/rows));cw=size;ch=size;}
        else{cw=Math.floor(c.width/cols);ch=Math.floor(c.height/rows);}
        const items=[];
        for(let r=0;r<rows;r++)for(let cc=0;cc<cols;cc++){
          const t=document.createElement('canvas');t.width=cw;t.height=ch;
          t.getContext('2d').drawImage(c,cc*cw,r*ch,cw,ch,0,0,cw,ch);
          items.push({src:t.toDataURL('image/png'),name:`${nameOf(v.file,'png').replace(/\.png$/,'')}_r${r+1}c${cc+1}.png`});
        }
        return [{type:'images',items,title:`已切分为 ${items.length} 块（每块 ${cw} × ${ch} px）`,zip:zipResult(items,'split_images.zip')}];
      }finally{URL.revokeObjectURL(url);}
    }});

  /* ---------- 22 / 23. EXIF ---------- */
  const EXIF_TAGS={0x010F:'相机制造商 Make',0x0110:'相机型号 Model',0x0112:'方向 Orientation',0x011A:'X 分辨率',0x011B:'Y 分辨率',0x0128:'分辨率单位',0x0131:'软件 Software',0x0132:'修改时间 DateTime',0x013B:'作者 Artist',0x8298:'版权 Copyright',0x829A:'曝光时间 ExposureTime',0x829D:'光圈 FNumber',0x8822:'曝光程序',0x8827:'ISO 感光度',0x9000:'Exif 版本',0x9003:'拍摄时间 DateTimeOriginal',0x9004:'数字化时间',0x9204:'曝光补偿',0x9207:'测光模式',0x9208:'光源',0x9209:'闪光灯',0x920A:'焦距 FocalLength',0xA002:'图像宽度',0xA003:'图像高度',0xA402:'曝光模式',0xA403:'白平衡',0xA405:'等效 35mm 焦距'};
  function parseExif(buf){
    const dv=new DataView(buf),len=dv.byteLength;
    if(len<4||dv.getUint16(0)!==0xFFD8)return {error:'不是 JPEG 文件（PNG / WebP 通常不含 EXIF，或需专门解析）'};
    let pos=2,start=-1;
    while(pos+4<len){
      if(dv.getUint8(pos)!==0xFF)break;
      const marker=dv.getUint8(pos+1),size=dv.getUint16(pos+2,false);
      if(marker===0xDA)break;
      if(marker===0xE1&&pos+10<len&&String.fromCharCode(...new Uint8Array(buf,pos+4,4))==='Exif'){start=pos+10;break;}
      pos+=2+size;
    }
    if(start<0)return {error:'未找到 EXIF 数据（图片可能已被清理过）'};
    const le=dv.getUint16(start,false)===0x4949;
    const u16=o=>dv.getUint16(start+o,le),u32=o=>dv.getUint32(start+o,le);
    const ifd0=u32(4);
    if(!ifd0||ifd0>len)return {error:'EXIF IFD 损坏'};
    const tags={};let gpsPtr=0,exifPtr=0;
    const readEntry=(off,into)=>{
      const count=u16(off),type=u16(off+2),tag=u16(off+6),valOff=u32(off+8);
      const sizes={1:1,2:1,3:2,4:4,5:8,6:1,7:1,8:2,9:4,10:8,11:4,12:8};
      const total=count*(sizes[type]||1),base=total<=4?start+off+8:start+valOff;
      if(tag===0x8769)exifPtr=u32(off+8);
      if(tag===0x8825)gpsPtr=u32(off+8);
      if(EXIF_TAGS[tag]){
        let val='';
        if(type===2){let s='';for(let i=0;i<Math.min(count,200);i++)s+=String.fromCharCode(dv.getUint8(base+i));val=s.replace(/\0/g,'').trim();}
        else if(type===3)val=String(dv.getUint16(base,le));
        else if(type===4)val=String(dv.getUint32(base,le));
        else if(type===5){const a=dv.getUint32(base,le),b=dv.getUint32(base+4,le);val=b?String(a/b):'0';}
        else if(type===10){const a=dv.getInt32(base,le),b=dv.getInt32(base+4,le);val=b?String(a/b):'0';}
        else if(type===7){let s='';for(let i=0;i<Math.min(count,40);i++)s+=dv.getUint8(base+i).toString(16).padStart(2,'0');val=s;}
        else val=String(dv.getUint16(base,le));
        into[EXIF_TAGS[tag]]=val;
      }
      if(tag===0x8769||tag===0x8825)return;
    };
    function scanIFD(off,into){
      if(!off||off+2>len)return;
      const n=u16(off);
      for(let i=0;i<Math.min(n,200);i++){const p=off+2+i*12;if(p+12>len)break;readEntry(p,into);}
    }
    scanIFD(ifd0,tags);
    if(exifPtr)scanIFD(exifPtr,tags);
    // GPS
    let gps=null;
    if(gpsPtr&&gpsPtr+2<len){
      const n=u16(gpsPtr),raw={};
      for(let i=0;i<Math.min(n,20);i++){
        const p=gpsPtr+2+i*12;if(p+12>len)break;
        const tag=u16(p+6),type=u16(p+2),cnt=u16(p),vo=u32(p+8);
        const sizes={1:1,2:1,3:2,4:4,5:8,7:1,9:4,10:8};
        const total=cnt*(sizes[type]||1),base=start+(total<=4?p+8:vo);
        if(type===2){let s='';for(let k=0;k<Math.min(cnt,20);k++)s+=String.fromCharCode(dv.getUint8(base+k));raw[tag]=s.replace(/\0/g,'').trim();}
        else if(type===5&&cnt>=3){const arr=[];for(let k=0;k<3;k++){const a=dv.getUint32(base+k*8,le),b=dv.getUint32(base+k*8+4,le);arr.push(b?a/b:0);}raw[tag]=arr;}
      }
      const toDec=a=>a?(a[0]+a[1]/60+a[2]/3600):null;
      const lat=toDec(raw[2]),lon=toDec(raw[4]);
      if(lat!=null&&lon!=null){const la=raw[1]==='S'?-lat:lat,lo=raw[3]==='W'?-lon:lon;gps={lat:la,lon:lo,ref:raw[1]+' / '+raw[3]};}
    }
    return {tags,gps};
  }
  R('图片 EXIF 查看器', { fields:[F('file','选择 JPEG 照片',{accept:'image/jpeg,.jpg,.jpeg'})],
    run:async v=>{
      if(!v.file)throw new Error('请选择照片');
      const buf=await T.readFile(v.file,'buffer');
      const r=parseExif(buf);
      if(r.error)return {type:'note',kind:'warn',value:''+T.esc(r.error)};
      const rows=Object.entries(r.tags).map(([k,val])=>[k,val]);
      const res=[{type:'table',title:`EXIF 元数据（${rows.length} 项）`,head:['字段','值'],rows}];
      if(r.gps){res.push(KV([['纬度',r.gps.lat.toFixed(6)+'°'],['经度',r.gps.lon.toFixed(6)+'°'],['参考',r.gps.ref],['地图链接','https://www.openstreetmap.org/?mlat='+r.gps.lat+'&mlon='+r.gps.lon]],'GPS 定位信息'));
        res.push({type:'note',kind:'warn',value:'照片包含 GPS 定位信息，公开分享前建议先用「图片 EXIF 清除」移除，避免泄露拍摄地点。'});}
      else res.push({type:'note',value:'未发现 GPS 定位信息。所有解析都在本地完成，照片不会上传。'});
      return res;
    }});

  R('图片 EXIF 清除', { fields:[F('file','选择图片',{accept:'image/*'})],
    run:async v=>{
      if(!v.file)throw new Error('请选择图片');
      const buf=await T.readFile(v.file,'buffer');
      const dv=new DataView(buf),bytes=new Uint8Array(buf);
      const isJpeg=bytes.length>4&&dv.getUint16(0)===0xFFD8;
      if(isJpeg){
        // 无损移除 APP1(Exif/XMP) 与 APP2 / APP13 等元数据段
        const chunks=[new Uint8Array(buf,0,2)];let pos=2,removed=0,sizeRemoved=0;
        while(pos+4<bytes.length){
          if(bytes[pos]!==0xFF)break;
          const marker=bytes[pos+1];
          if(marker===0xDA){chunks.push(new Uint8Array(buf,pos));break;}
          const segLen=dv.getUint16(pos+2,false),end=pos+2+segLen;
          const payload=String.fromCharCode(...bytes.slice(pos+4,Math.min(pos+14,end)));
          const drop=(marker>=0xE1&&marker<=0xEF)&&(payload.startsWith('Exif')||payload.startsWith('http')||marker===0xE2||marker===0xED||marker===0xEE);
          if(drop){removed++;sizeRemoved+=segLen+2;}else chunks.push(new Uint8Array(buf,pos,segLen+2));
          pos=end;
        }
        const total=chunks.reduce((a,b)=>a+b.length,0),out=new Uint8Array(total);let o=0;
        chunks.forEach(c=>{out.set(c,o);o+=c.length;});
        const blob=new Blob([out],{type:'image/jpeg'});
        return [{type:'file',blob,name:nameOf(v.file,'jpg'),title:'已清除元数据的 JPEG（无损，未重新编码）'},
          KV([['移除的元数据段',removed+' 个'],['减少体积',T.fmt(sizeRemoved/1024,1)+' KB'],['原始体积',T.fmt(v.file.size/1024,1)+' KB'],['输出体积',T.fmt(blob.size/1024,1)+' KB'],['画面质量','完全不变（仅删除元数据段）']],'清理报告')];
      }
      const {img,url}=await toImage(v.file);
      try{const c=T.imageCanvas(img),blob=await T.canvasBlob(c,'image/png');
        return [{type:'file',blob,name:nameOf(v.file,'png'),title:'已清除元数据的 PNG'},
          {type:'note',value:'非 JPEG 图片通过 Canvas 重新编码为 PNG 以移除元数据；PNG 为无损编码，但文件体积可能变化。'}];
      }finally{URL.revokeObjectURL(url);}
    }});

  /* ---------- 26 / 27. GIF 拆帧与合成 ---------- */
  function gifReader(){return window.GifReader||(window.__gifumb&&window.__gifumb.GifReader);}
  function gifWriter(){return window.GifWriter||(window.__gifumb&&window.__gifumb.GifWriter);}
  R('GIF 拆分', { fields:[F('file','选择 GIF 动图',{accept:'image/gif,.gif'}),C('zip','打包下载所有帧',true,'生成 ZIP')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 GIF 文件');
      const GifReader=gifReader();if(!GifReader)throw new Error('GIF 解码组件未加载');
      const buf=await T.readFile(v.file,'buffer');
      const reader=new GifReader(new Uint8Array(buf));
      const n=reader.numFrames(),w=reader.width,h=reader.height;
      const acc=document.createElement('canvas');acc.width=w;acc.height=h;const actx=acc.getContext('2d');
      const items=[],infos=[];
      for(let i=0;i<n;i++){
        const frame=reader.frameInfo(i),fb=new Uint8ClampedArray(w*h*4);
        try{reader.decodeAndBlitFrameRGBA(i,fb);}catch(e){continue;}
        const cur=actx.getImageData(0,0,w,h),d=cur.data;
        for(let p=0;p<w*h;p++){if(fb[p*4+3]>0){d[p*4]=fb[p*4];d[p*4+1]=fb[p*4+1];d[p*4+2]=fb[p*4+2];d[p*4+3]=255;}}
        actx.putImageData(cur,0,0);
        items.push({src:acc.toDataURL('image/png'),name:`frame_${String(i+1).padStart(3,'0')}.png`});
        infos.push([i+1,frame.width+' × '+frame.height,(frame.delay||10)+' × 10ms',frame.disposal===undefined?'—':frame.disposal]);
      }
      return [{type:'images',items,title:`共拆解 ${items.length} 帧（${w} × ${h} px）`,zip:v.zip?zipResult(items,'gif_frames.zip'):null},
        {type:'table',title:'帧信息',head:['帧号','尺寸','延时','处置方式'],rows:infos}];
    }});

  const PALETTE=(()=>{
    const p=[];
    for(let r=0;r<6;r++)for(let g=0;g<6;g++)for(let b=0;b<6;b++)p.push((Math.round(r*255/5)<<16)|(Math.round(g*255/5)<<8)|Math.round(b*255/5));
    while(p.length<256){const g=T.clamp(Math.round((p.length-216)*6),0,255);p.push((g<<16)|(g<<8)|g);}
    return p;
  })();
  const nearest=(r,g,b)=>{
    const ri=Math.round(r/255*5),gi=Math.round(g/255*5),bi=Math.round(b/255*5);
    return ri*36+gi*6+bi;
  };
  R('GIF 合成', { fields:[FS('files','按顺序选择多张图片'),N('fps','帧率（每秒帧数）',8),N('width','输出宽度（0 用首图宽度）',0),N('height','输出高度（0 按比例）',0),N('loop','循环次数（0 无限）',0),C('dither','简单抖动（提升观感）',false,'抖动')],
    run:async v=>{
      const GifWriter=gifWriter();if(!GifWriter)throw new Error('GIF 编码组件未加载');
      const list=await loadAll(v.files);
      try{
        const first=T.imageCanvas(list[0].img);
        const W=Math.round(Number(v.width)||first.width),H=Math.round(Number(v.height)||first.height*W/first.width);
        const buf=new Uint8Array(W*H*list.length*2+65536);
        const gf=new GifWriter(buf,W,H,{loop:Math.round(Number(v.loop)||0),palette:PALETTE});
        const delay=Math.max(1,Math.round(100/Math.max(.1,Number(v.fps)||8)));
        list.forEach(x=>{
          const c=document.createElement('canvas');c.width=W;c.height=H;const cx=c.getContext('2d');
          cx.fillStyle='#fff';cx.fillRect(0,0,W,H);cx.drawImage(x.img,0,0,W,H);
          const d=cx.getImageData(0,0,W,H).data,idx=new Uint8Array(W*H);
          for(let p=0;p<W*H;p++)idx[p]=nearest(d[p*4],d[p*4+1],d[p*4+2]);
          gf.addFrame(0,0,W,H,idx,{palette:PALETTE,delay});
        });
        const end=gf.end();
        const blob=new Blob([buf.subarray(0,end)],{type:'image/gif'});
        return [{type:'file',blob,name:'animation.gif',title:'生成的 GIF 动图'},
          {type:'image',src:cvToUrl(T.imageCanvas(list[0].img),'image/png'),name:'first_frame.png',title:'首帧预览'},
          KV([['帧数',list.length],['尺寸',`${W} × ${H} px`],['帧率',v.fps+' fps'],['单帧延时',delay*10+' ms'],['预计时长',T.fmt(list.length/(Number(v.fps)||8),2)+' 秒'],['GIF 体积',T.fmt(blob.size/1024,1)+' KB']],'合成信息'),
          {type:'note',value:'使用 216 色 Web 安全调色板编码，适合表情包 / 简单动画；照片级渐变动图建议使用专业编码器。'}];
      }finally{freeAll(list);}
    }});
})();
