/* ============================================================
   工具实现：文件处理 / PDF / 压缩包 / 编码 / 表格 / Markdown
   ============================================================ */
(function () {
  'use strict';
  const T = window.TOOLKIT, R = T.register;
  const N = (key, label, def, extra) => Object.assign({ key, label, type: 'number', def, step: 'any' }, extra || {});
  const S = (key, label, options, def) => ({ key, label, type: 'select', options, def });
  const I = (key, label, def, extra) => Object.assign({ key, label, def }, extra || {});
  const X = (key, label, def, extra) => Object.assign({ key, label, type: 'textarea', def, rows: 7 }, extra || {});
  const C = (key, label, def, cl) => ({ key, label, type: 'checkbox', def, checkLabel: cl || '启用' });
  const F = (key, label, extra) => Object.assign({ key, label, type: 'file' }, extra || {});
  const FS = (key, label, extra) => Object.assign({ key, label, type: 'files' }, extra || {});
  const KV = (rows, title) => ({ type: 'kv', rows, title });
  const TXT = (value, title, name) => ({ type: 'text', value, title, download: name });
  const baseName = f => (f && f.name || 'file').replace(/\.[^.]+$/, '');
  const rename = (f, ext) => baseName(f) + '.' + ext;
  const bytes = async f => new Uint8Array(await T.readFile(f, 'buffer'));
  const pdfBytes = async bytes => new Blob([bytes], { type: 'application/pdf' });
  const PDF = () => window.PDFLib;
  const jsPDF = () => window.jspdf && window.jspdf.jsPDF;
  const zipBlob = async entries => {
    if (!window.JSZip) throw new Error('ZIP 组件未加载');
    const z = new JSZip();
    entries.forEach(e => z.file(e.name, e.data));
    return await z.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  };

  /* ---- pdf.js 渲染 ---- */
  function pdfjs() {
    const lib = window.pdfjsLib;
    if (!lib) throw new Error('PDF 渲染组件未加载');
    if (!lib.GlobalWorkerOptions.workerSrc) lib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    return lib;
  }
  async function pdfRenderPages(file, scale) {
    const lib = pdfjs(), data = await bytes(file);
    const doc = await lib.getDocument({ data }).promise;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: scale || 1.5 });
      const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: cx, viewport: vp }).promise;
      pages.push(cv);
    }
    return { pages, numPages: doc.numPages, doc };
  }

  /* ---- 中文文本 → PDF（canvas 逐行绘制后嵌入，绕过字体限制） ---- */
  function lineRenderer(canvas, lines, opt) {
    const cx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    const pad = opt.pad || 60, fs = opt.fontSize || 18, lh = fs * 1.65;
    cx.fillStyle = opt.bg || '#fff'; cx.fillRect(0, 0, W, H);
    let y = pad + fs;
    const out = [];
    for (const raw of lines) {
      const isHead = /^#{1,3}\s/.test(raw), isCode = /^\s{4,}|^```/.test(raw);
      const text = raw.replace(/^#{1,6}\s+/, '').replace(/^[-*]\s+/, '  • ').replace(/^>\s?/, '  ').replace(/\*\*|`|~~/g, '');
      cx.font = isHead ? `bold ${fs * (raw.startsWith('# ') ? 1.7 : 1.3)}px "Microsoft YaHei",sans-serif` : isCode ? `${fs * .88}px ui-monospace,Consolas,monospace` : `${fs}px "Microsoft YaHei",sans-serif`;
      cx.fillStyle = isHead ? opt.accent || '#4f46e5' : isCode ? '#586077' : opt.color || '#202a3c';
      if (isCode) { cx.fillStyle = '#f2f5fa'; cx.fillRect(pad - 8, y - fs, W - pad * 2 + 16, lh); cx.fillStyle = '#445'; }
      // 按宽度折行
      let line = '';
      for (const ch of Array.from(text)) {
        if (cx.measureText(line + ch).width > W - pad * 2) { cx.fillText(line, pad, y); y += lh; line = ch; if (y > H - pad) break; }
        else line += ch;
      }
      cx.fillText(line, pad, y);
      y += isHead ? lh * 1.5 : lh * 1.15;
      if (y > H - pad) break;
    }
    return canvas;
  }
  function textToPdf(text, opt) {
    const J = jsPDF(); if (!J) throw new Error('PDF 组件未加载');
    opt = opt || {};
    const lines = String(text).split(/\r?\n/), pageSize = 30, chunks = [];
    for (let i = 0; i < lines.length; i += pageSize) chunks.push(lines.slice(i, i + pageSize));
    if (!chunks.length) chunks.push(['']);
    const pdf = new J({ unit: 'pt', format: 'a4', compress: true });
    chunks.forEach((part, idx) => {
      if (idx) pdf.addPage();
      const cv = document.createElement('canvas'); cv.width = 794; cv.height = 1123;
      lineRenderer(cv, part, opt);
      pdf.addImage(cv.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, 595, 842);
    });
    return pdf.output('blob');
  }
  function markdownCanvas(md, opt) {
    opt = opt || {};
    const lines = String(md || '').split(/\r?\n/), W = opt.width || 800, fs = 17, lh = 30, pad = 40;
    const H = Math.max(400, Math.min(12000, lines.length * lh + pad * 2 + 60));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, W, H);
    let y = pad + 16;
    cx.textBaseline = 'top';
    for (const raw of lines) {
      const level = (raw.match(/^#+/) || [''])[0].length;
      const isCode = /^```/.test(raw), isQuote = /^>\s?/.test(raw), isList = /^\s*[-*+]\s/.test(raw);
      const text = raw.replace(/^#{1,6}\s*/, '').replace(/^>\s?/, '').replace(/^(\s*)[-*+]\s/, '$1• ').replace(/\*\*|`|~~/g, '');
      if (isCode) { y += 4; continue; }
      if (level) { cx.font = `bold ${Math.round(fs * (1.85 - level * .15))}px "Microsoft YaHei",sans-serif`; cx.fillStyle = '#4338ca'; y += level === 1 ? 16 : 10; }
      else if (isQuote) { cx.font = `${fs}px "Microsoft YaHei",sans-serif`; cx.fillStyle = '#64748b'; }
      else { cx.font = `${fs}px "Microsoft YaHei",sans-serif`; cx.fillStyle = '#243044'; }
      if (isQuote) { cx.fillStyle = '#eef2ff'; cx.fillRect(pad - 10, y - 4, W - pad * 2 + 20, lh); cx.fillStyle = '#475569'; }
      cx.fillText(text.slice(0, 80), pad, y);
      y += level ? lh * 1.5 : lh;
      if (y > H - pad) break;
    }
    cx.textBaseline = 'alphabetic';
    return cv;
  }

  /* ===================== PDF 工具 ===================== */
  function parsePages(str, total) {
    if (!str || !String(str).trim()) return Array.from({ length: total }, (_, i) => i);
    const out = [];
    String(str).split(/[,，]/).forEach(part => {
      const m = part.trim().match(/^(\d+)\s*[-~]\s*(\d+)$/);
      if (m) { for (let i = +m[1]; i <= Math.min(+m[2], total); i++) if (!out.includes(i - 1)) out.push(i - 1); }
      else { const n = parseInt(part, 10); if (n >= 1 && n <= total && !out.includes(n - 1)) out.push(n - 1); }
    });
    return out.sort((a, b) => a - b);
  }

  R('PDF 合并', { fields:[FS('files','选择多个 PDF 文件',{accept:'application/pdf,.pdf'})],
    run:async v=>{
      const files=v.files||[];if(files.length<2)throw new Error('请至少选择 2 个 PDF 文件');
      const L=PDF();if(!L)throw new Error('PDF 组件未加载');
      const merged=await L.PDFDocument.create();let pages=0;
      for(const f of files){const src=await L.PDFDocument.load(await bytes(f));const copied=await merged.copyPages(src,src.getPageIndices());copied.forEach(p=>merged.addPage(p));pages+=src.getPageCount();}
      const out=await merged.save();
      return [{type:'file',blob:await pdfBytes(out),name:'merged.pdf',title:'合并后的 PDF'},KV([['源文件数',files.length],['合并后总页数',pages],['输出体积',T.fmt(out.length/1024,1)+' KB']],'合并信息')];} });

  R('PDF 拆分', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'}),S('mode','拆分方式',[['each','每页一个 PDF'],['range','按指定页码导出为一个 PDF'],['half','按前后半拆分']],'each'),I('pages','页码范围（如 1-3,5,8）','1-3')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');
      const L=PDF();if(!L)throw new Error('PDF 组件未加载');
      const src=await L.PDFDocument.load(await bytes(v.file)),total=src.getPageCount();
      const groups=v.mode==='each'?Array.from({length:total},(_,i)=>[i]):v.mode==='half'?[Array.from({length:Math.ceil(total/2)},(_,i)=>i),Array.from({length:Math.floor(total/2)},(_,i)=>i+Math.ceil(total/2))].filter(g=>g.length):[parsePages(v.pages,total)];
      const items=[];
      for(let g=0;g<groups.length;g++){
        const doc=await L.PDFDocument.create(),cp=await doc.copyPages(src,groups[g]);cp.forEach(p=>doc.addPage(p));
        const out=await doc.save();
        items.push({name:`${baseName(v.file)}_part${g+1}.pdf`,data:out});
      }
      return [{type:'files',items:items.map(x=>({blob:new Blob([x.data],{type:'application/pdf'}),name:x.name})),title:`已拆分为 ${items.length} 个文件`},
        {type:'file',blob:await zipBlob(items),name:'pdf_parts.zip',title:'打包下载全部'},
        KV([['原始页数',total],['输出文件数',items.length]],'拆分信息')];} });

  R('PDF 转图片', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'}),N('scale','渲染缩放倍率',1.5,{min:.5,max:3,step:.1}),S('format','输出格式',[['image/png','PNG（清晰）'],['image/jpeg','JPG（体积小）']],'image/png')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');
      const {pages,numPages}=await pdfRenderPages(v.file,Number(v.scale)||1.5);
      const ext=v.format==='image/jpeg'?'jpg':'png',items=pages.map((cv,i)=>({src:cv.toDataURL(v.format,.9),name:`page_${String(i+1).padStart(2,'0')}.${ext}`}));
      return [{type:'images',items,title:`共导出 ${numPages} 页`,zip:async()=>{const z=new JSZip();items.forEach(it=>z.file(it.name,it.src.split(',')[1],{base64:true}));T.save(await z.generateAsync({type:'blob'}),'pdf_pages.zip');}}];} });

  R('图片转 PDF', { fields:[FS('files','选择多张图片（一页一张）',{accept:'image/*'}),S('page','页面尺寸',[['a4','A4 纵向'],['a4l','A4 横向'],['fit','自适应图片']],'a4'),N('quality','JPEG 画质',.9,{min:.3,max:1,step:.05})],
    run:async v=>{
      const files=v.files||[];if(!files.length)throw new Error('请选择图片');
      const J=jsPDF();if(!J)throw new Error('PDF 组件未加载');
      const pdf=new J({unit:'pt',format:'a4',compress:true});
      for(let i=0;i<files.length;i++){
        const {img,url}=await (async()=>{const u=URL.createObjectURL(files[i]);return{img:await T.loadImage(u),url:u};})();
        const c=T.imageCanvas(img),cv=document.createElement('canvas');cv.width=c.width;cv.height=c.height;
        const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(c,0,0);
        const jpg=cv.toDataURL('image/jpeg',Number(v.quality)||.9);
        if(i)pdf.addPage();
        const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight();
        if(v.page==='fit')pdf.addImage(jpg,'JPEG',0,0,W,H);
        else{const s=Math.min(W/c.width,H/c.height),dw=c.width*s,dh=c.height*s;pdf.addImage(jpg,'JPEG',(W-dw)/2,(H-dh)/2,dw,dh);}
        URL.revokeObjectURL(url);
      }
      const blob=pdf.output('blob');
      return [{type:'file',blob,name:'images.pdf',title:'生成的 PDF'},KV([['图片数',files.length],['页数',files.length],['体积',T.fmt(blob.size/1024,1)+' KB']],'生成信息')];} });

  /* PDF 加密/解密：AES-GCM 自保护格式 .pdfx（明确说明非标准 PDF 打开密码） */
  const MAGIC=new Uint8Array([80,68,70,88,49]); // PDFX1
  async function derive(pwd,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pwd),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
  R('PDF 加密', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'}),I('pwd','设置密码','my-password'),C('note','了解保护方式说明',true,'显示说明')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');if(!v.pwd)throw new Error('请设置密码');
      const data=await bytes(v.file),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
      const key=await derive(v.pwd,salt),enc=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data));
      const out=new Uint8Array(MAGIC.length+16+12+enc.length);out.set(MAGIC,0);out.set(salt,5);out.set(iv,21);out.set(enc,33);
      return [{type:'file',blob:new Blob([out],{type:'application/octet-stream'}),name:baseName(v.file)+'.pdfx',title:'加密保护文件'},
        ...(v.note?[{type:'note',kind:'warn',value:'浏览器标准库无法给标准 PDF 写入打开密码，本工具使用 <b>AES-256-GCM</b> 把整个 PDF 封装为 <code>.pdfx</code> 文件。请保留原始 PDF，并用「PDF 解密」输入同一密码还原；.pdfx 需要在本站还原后才能用普通阅读器打开。'}]:[])];} });
  R('PDF 解密', { fields:[F('file','选择 .pdfx 加密文件',{accept:'.pdfx,application/octet-stream,.pdf'}),I('pwd','输入密码','')],
    run:async v=>{
      if(!v.file)throw new Error('请选择文件');if(!v.pwd)throw new Error('请输入密码');
      const data=await bytes(v.file);
      if(data.length<33||!MAGIC.every((b,i)=>data[i]===b))return {type:'note',kind:'warn',value:'该文件不是本工具生成的 .pdfx 加密文件。标准 PDF 的打开密码移除需要服务端 qpdf / pikepdf 支持，浏览器端暂不处理。'};
      const salt=data.slice(5,21),iv=data.slice(21,33),enc=data.slice(33);
      const key=await derive(v.pwd,salt);
      let dec;try{dec=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,enc);}catch(e){throw new Error('密码错误或文件已损坏');}
      return [{type:'file',blob:new Blob([dec],{type:'application/pdf'}),name:baseName(v.file).replace(/\.pdfx$/,'')+'.pdf',title:'还原后的标准 PDF'},
        {type:'note',value:'解密成功，文件已还原为可直接打开的标准 PDF。'}];} });

  R('PDF 压缩', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'}),N('quality','图片质量（0.3 ~ 0.9）',.6,{min:.3,max:.9,step:.05}),N('scale','渲染倍率',1.2,{min:.6,max:2,step:.1})],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');
      const {pages}=await pdfRenderPages(v.file,Number(v.scale)||1.2),J=jsPDF();
      const pdf=new J({unit:'pt',format:'a4',compress:true});
      pages.forEach((cv,i)=>{if(i)pdf.addPage();const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight();const s=Math.min(W/cv.width,H/cv.height);pdf.addImage(cv.toDataURL('image/jpeg',Number(v.quality)||.6),'JPEG',(W-cv.width*s)/2,(H-cv.height*s)/2,cv.width*s,cv.height*s);});
      const blob=pdf.output('blob');
      return [{type:'file',blob,name:baseName(v.file)+'_compressed.pdf',title:'压缩后的 PDF'},
        KV([['原始体积',T.fmt(v.file.size/1024,1)+' KB'],['压缩后体积',T.fmt(blob.size/1024,1)+' KB'],['体积变化',T.fmt((blob.size/v.file.size-1)*100,1)+'%'],['页数',pages.length]],'压缩报告'),
        {type:'note',kind:'warn',value:'压缩方式是把每页重渲染为 JPEG 图像，文字将不再可选中/可搜索；如需保留文字，请降低质量档位或改用专业 PDF 优化工具。'}];} });

  R('PDF 页面删除', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'}),I('pages','要删除的页码（如 2,5,8-10）','2,5')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');
      const L=PDF(),doc=await L.PDFDocument.load(await bytes(v.file)),total=doc.getPageCount();
      const dels=parsePages(v.pages,total).sort((a,b)=>b-a);
      if(!dels.length)throw new Error('没有有效的页码');
      dels.forEach(i=>doc.removePage(i));
      const out=await doc.save();
      return [{type:'file',blob:await pdfBytes(out),name:baseName(v.file)+'_trimmed.pdf',title:'删除页面后的 PDF'},KV([['原始页数',total],['删除页数',dels.length],['剩余页数',doc.getPageCount()]],'处理结果')];} });

  R('PDF 页面调整', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'}),I('order','页面顺序（如 3,1,2,4；留空保持原序）',''),N('rotate','所有页面旋转角度',0),C('reverse','反转页面顺序',false,'倒序排列')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');
      const L=PDF(),src=await L.PDFDocument.load(await bytes(v.file)),total=src.getPageCount();
      let idx=Array.from({length:total},(_,i)=>i);
      if(String(v.order||'').trim())idx=parsePages(v.order,total);
      if(v.reverse)idx.reverse();
      const doc=await L.PDFDocument.create(),cp=await doc.copyPages(src,idx);cp.forEach(p=>doc.addPage(p));
      if(Number(v.rotate))doc.getPages().forEach(p=>p.setRotation(L.degrees(((p.getRotation().angle+Number(v.rotate))%360+360)%360)));
      const out=await doc.save();
      return [{type:'file',blob:await pdfBytes(out),name:baseName(v.file)+'_reordered.pdf',title:'调整后的 PDF'},KV([['原始页数',total],['输出页数',idx.length],['页面顺序',idx.map(i=>i+1).join(' → ')],['旋转角度',v.rotate+'°']],'处理结果')];} });

  R('PDF 提取文本', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'}),C('pageBreak','按页分隔并标注页码',true,'按页标注')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');
      const lib=pdfjs(),doc=await lib.getDocument({data:await bytes(v.file)}).promise;
      const parts=[];
      for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),tc=await page.getTextContent();
        let text='',lastY=null;
        tc.items.forEach(it=>{if(lastY!==null&&Math.abs(it.transform[5]-lastY)>3)text+='\n';text+=it.str;lastY=it.transform[5];});
        parts.push(v.pageBreak?`───── 第 ${i} 页 ─────\n${text}`:text);}
      const all=parts.join('\n\n');
      return [TXT(all,`已提取 ${doc.numPages} 页文本`,baseName(v.file)+'.txt'),KV([['页数',doc.numPages],['字符数',all.length],['提示','扫描版 PDF 无文字层，需用 OCR 才能提取']],'提取信息')];} });

  /* ---- Office → PDF（文本级简化转换） ---- */
  async function zipText(file,path){
    const z=await JSZip.loadAsync(file),f=z.file(path);return f?await f.async('string'):'';
  }
  R('Word 转 PDF', { fields:[F('file','选择 DOCX 文件',{accept:'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),N('fontSize','正文字号',17)],
    run:async v=>{
      if(!v.file)throw new Error('请选择 DOCX 文件');
      const xml=await zipText(v.file,'word/document.xml');
      if(!xml)throw new Error('未找到 word/document.xml，可能不是有效的 DOCX');
      const dp=new DOMParser().parseFromString(xml,'application/xml'),paras=Array.from(dp.getElementsByTagName('w:p'));
      const lines=paras.map(p=>Array.from(p.getElementsByTagName('w:t')).map(t=>t.textContent).join(''));
      const blob=textToPdf(lines.filter(Boolean).join('\n'),{fontSize:Number(v.fontSize)||17});
      return [{type:'file',blob,name:baseName(v.file)+'.pdf',title:'生成的 PDF'},
        TXT(lines.filter(Boolean).join('\n'),'提取的正文（可校对）',baseName(v.file)+'.txt'),
        {type:'note',kind:'warn',value:'浏览器端转换按段落提取文字并重排，<b>不保留</b>图片、表格、页眉页脚与复杂样式；复杂文档请用桌面 Office 另存为 PDF。'}];} });

  R('Excel 转 PDF', { fields:[F('file','选择 XLSX / CSV 文件',{accept:'.xlsx,.xls,.csv'}),S('sheet','工作表',[['0','第一个工作表']],'0')],
    run:async v=>{
      if(!v.file)throw new Error('请选择表格文件');
      if(!window.XLSX)throw new Error('表格组件未加载');
      const wb=window.XLSX.read(await bytes(v.file),{type:'array'}),name=wb.SheetNames[0],rows=window.XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});
      const text=rows.map(r=>r.map(String).join('　|　')).join('\n');
      const blob=textToPdf(text,{fontSize:14});
      return [{type:'file',blob,name:baseName(v.file)+'.pdf',title:'生成的 PDF'},
        {type:'table',title:`工作表「${name}」预览`,head:rows[0]?rows[0].map((_,i)=>'列 '+(i+1)):['内容'],rows:rows.slice(0,30).map(r=>r.map(String))},
        {type:'note',value:'按单元格文本重排为 PDF，不保留单元格边框与列宽。'}];} });

  R('PPT 转 PDF', { fields:[F('file','选择 PPTX 文件',{accept:'.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation'})],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PPTX 文件');
      const z=await JSZip.loadAsync(v.file),slides=Object.keys(z.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>(+a.match(/slide(\d+)/)[1])-(+b.match(/slide(\d+)/)[1]));
      if(!slides.length)throw new Error('未找到幻灯片内容');
      const lines=[];
      for(let i=0;i<slides.length;i++){const xml=await z.file(slides[i]).async('string'),dp=new DOMParser().parseFromString(xml,'application/xml');
        lines.push(`# 第 ${i+1} 页`);Array.from(dp.getElementsByTagName('a:t')).forEach(t=>{if(t.textContent.trim())lines.push(t.textContent);});lines.push('');}
      const blob=textToPdf(lines.join('\n'),{fontSize:18});
      return [{type:'file',blob,name:baseName(v.file)+'.pdf',title:'生成的 PDF'},TXT(lines.join('\n'),'提取的幻灯片文本',baseName(v.file)+'.txt'),
        {type:'note',kind:'warn',value:'按幻灯片提取文字生成 PDF，不保留背景、图片与版式。'}];} });

  R('PDF 转 Word', { fields:[F('file','选择 PDF 文件',{accept:'application/pdf,.pdf'})],
    run:async v=>{
      if(!v.file)throw new Error('请选择 PDF');
      const lib=pdfjs(),doc=await lib.getDocument({data:await bytes(v.file)}).promise;
      let html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Document</title><style>body{font-family:"Microsoft YaHei",sans-serif;font-size:12pt;line-height:1.7}h2{color:#4338ca}</style></head><body>';
      for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),tc=await page.getTextContent();
        html+=`<h2>第 ${i} 页</h2>`;let lastY=null;
        tc.items.forEach(it=>{const br=lastY!==null&&Math.abs(it.transform[5]-lastY)>3?'<br>':'';html+=br+T.esc(it.str);lastY=it.transform[5];});
        html+='<div style="page-break-after:always"></div>';}
      html+='</body></html>';
      const blob=new Blob(['\ufeff'+html],{type:'application/msword;charset=utf-8'});
      return [{type:'file',blob,name:baseName(v.file)+'.doc',title:'生成的 Word 文档（.doc）'},
        {type:'note',value:'生成的是 Word 可直接打开的 HTML 格式 .doc 文档，保留文字与分页；如需标准 .docx 可用 Word「另存为」转换一次。扫描件需先 OCR。'}];} });

  /* ===================== 通用文件工具 ===================== */
  function parseCSV(text,sep){
    const rows=[],s=String(text||'');let row=[],cur='',q=false;
    for(let i=0;i<s.length;i++){const c=s[i];
      if(q){if(c==='"'){if(s[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}
      else if(c==='"')q=true;
      else if(c===sep){row.push(cur);cur='';}
      else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur='';}
      else if(c!=='\r')cur+=c;}
    if(cur||row.length){row.push(cur);rows.push(row);}
    return rows.filter(r=>r.some(x=>x!==''));
  }
  R('CSV 查看编辑', { fields:[F('file','选择 CSV 文件',{accept:'.csv,text/csv,.tsv'}),S('sep','分隔符',[['，逗号 ,','auto'],[',','逗号'],[';','分号'],['\\t','Tab']],'auto'),X('edit','编辑内容（每行一条，用分隔符隔开；留空则使用文件原内容）','')],
    run:async v=>{
      let text=v.edit&&String(v.edit).trim()?String(v.edit):(v.file?await T.readFile(v.file):'');
      if(!text)throw new Error('请选择 CSV 文件或粘贴内容');
      let sep=v.sep==='\\t'?'\t':v.sep===','?',':v.sep===';'?';':(text.split('\n')[0].includes('\t')?'\t':text.includes(';')&&!text.includes(',')?';':',');
      const rows=parseCSV(text,sep);
      if(!rows.length)throw new Error('未解析到数据');
      const cols=Math.max(...rows.map(r=>r.length)),head=rows[0].map((_,i)=>'列 '+(i+1));
      const norm=rows.map(r=>Array.from({length:cols},(_,i)=>r[i]||''));
      return [{type:'table',title:`表格预览 · ${rows.length} 行 × ${cols} 列`,head,rows:norm.slice(0,200)},
        TXT(norm.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n'),'规范化 CSV（可复制到编辑框再导出）',baseName(v.file||{name:'table'})+'_normalized.csv'),
        KV([['总行数',rows.length],['列数',cols],['分隔符',sep==='\t'?'Tab':sep],['BOM',text.charCodeAt(0)===0xFEFF?'有':'无']],'文件信息')];} });

  R('文件批量重命名', { fields:[FS('files','选择要重命名的文件'),I('pattern','命名规则','{name}_{n}'),I('prefix','前缀',''),I('suffix','后缀',''),I('find','查找（支持正则）',''),I('replace','替换为',''),N('start','起始序号',1),C('regex','查找使用正则',false,'正则'),C('keepExt','保留原扩展名',true,'保留扩展名')],
    run:async v=>{
      const files=v.files||[];if(!files.length)throw new Error('请选择文件');
      const entries=[],rows=[];
      for(let i=0;i<files.length;i++){
        const f=files[i],dot=f.name.lastIndexOf('.'),stem=dot>0?f.name.slice(0,dot):f.name,ext=dot>0?f.name.slice(dot):'';
        let nm=String(v.pattern||'{name}_{n}').replace(/\{name\}/g,stem).replace(/\{n\}/g,String((Number(v.start)||1)+i)).replace(/\{ext\}/g,ext.replace('.','')).replace(/\{date\}/g,new Date().toISOString().slice(0,10));
        nm=(v.prefix||'')+nm+(v.suffix||'');
        if(v.find){try{nm=v.regex?nm.replace(new RegExp(v.find,'g'),v.replace||''):nm.split(v.find).join(v.replace||'');}catch(e){throw new Error('正则错误：'+e.message);}}
        if(v.keepExt)nm+=ext;
        entries.push({name:nm,data:new Uint8Array(await T.readFile(f,'buffer'))});
        rows.push([i+1,f.name,nm]);
      }
      return [{type:'table',title:'重命名对照表',head:['#','原文件名','新文件名'],rows},
        {type:'file',blob:await zipBlob(entries),name:'renamed_files.zip',title:'打包下载重命名后的文件'},
        {type:'note',value:'浏览器无法直接修改本机文件名，因此按新名称打包成 ZIP，解压后即为重命名结果。可用占位符：{name} 原名、{n} 序号、{ext} 扩展名、{date} 日期。'}];} });

  R('ZIP 压缩', { fields:[FS('files','选择要打包的文件'),I('name','压缩包文件名','archive.zip'),S('level','压缩级别',[['DEFLATE','标准压缩'],['STORE','仅打包（最快）']],'DEFLATE')],
    run:async v=>{
      const files=v.files||[];if(!files.length)throw new Error('请选择文件');
      const z=new JSZip();
      for(const f of files)z.file(f.webkitRelativePath||f.name,new Uint8Array(await T.readFile(f,'buffer')));
      const blob=await z.generateAsync({type:'blob',compression:v.level==='STORE'?'STORE':'DEFLATE',compressionOptions:{level:6}});
      const total=files.reduce((a,b)=>a+b.size,0);
      return [{type:'file',blob,name:String(v.name||'archive.zip').replace(/\.zip$/,'')+'.zip',title:'生成的压缩包'},
        KV([['文件数',files.length],['原始总大小',T.fmt(total/1024,1)+' KB'],['压缩包大小',T.fmt(blob.size/1024,1)+' KB'],['压缩率',T.fmt((1-blob.size/total)*100,1)+'%']],'压缩报告')];} });

  R('ZIP 解压', { fields:[F('file','选择 ZIP 文件',{accept:'.zip,application/zip'})],
    run:async v=>{
      if(!v.file)throw new Error('请选择 ZIP 文件');
      const z=await JSZip.loadAsync(v.file),items=[],rows=[];
      const names=Object.keys(z.files);
      for(const n of names){const e=z.files[n];if(e.dir){rows.push(['DIR',n,'','目录']);continue;}
        const data=await e.async('uint8array');items.push({blob:new Blob([data]),name:n.replace(/^.*\//,'')});
        rows.push(['FILE',n,T.fmt(data.length/1024,1)+' KB','文件']);}
      return [{type:'table',title:`压缩包内容 · ${items.length} 个文件`,head:['类型','路径','大小','说明'],rows:rows.slice(0,300)},
        {type:'files',items,title:'逐个下载'},
        {type:'note',value:'所有解压都在浏览器内完成；如需保留原目录结构，可逐个下载或使用「文件夹清单导出」。'}];} });

  R('文件哈希计算', { fields:[F('file','选择任意文件')],
    run:async v=>{
      if(!v.file)throw new Error('请选择文件');
      const buf=await bytes(v.file),h=await T.hashAll(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength));
      return [KV(Object.entries(h).map(([k,val])=>[k,val]),'哈希校验值'),
        KV([['文件名',v.file.name],['文件大小',T.fmt(v.file.size/1024,2)+' KB'],['类型',v.file.type||'未知'],['用途','与提供方公布的校验值比对，一致则文件完整未被篡改']],'文件信息')];} });

  R('文件对比', { fields:[F('a','文件 A',{accept:'.txt,.md,.json,.csv,.log,.xml,.js,.css,.html,text/*'}),F('b','文件 B',{accept:'.txt,.md,.json,.csv,.log,.xml,.js,.css,.html,text/*'}),C('ignoreSpace','忽略行首尾空白',false,'忽略空白')],
    run:async v=>{
      if(!v.a||!v.b)throw new Error('请选择两个文件');
      const a=String(await T.readFile(v.a)).split(/\r?\n/),b=String(await T.readFile(v.b)).split(/\r?\n/);
      const clean=x=>v.ignoreSpace?x.trim():x,n=a.length,m=b.length;
      const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
      for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=clean(a[i])===clean(b[j])?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
      const rows=[];let i=0,j=0;
      while(i<n&&j<m){if(clean(a[i])===clean(b[j])){rows.push(['=',i+1,j+1,a[i]]);i++;j++;}
        else if(dp[i+1][j]>=dp[i][j+1]){rows.push(['−',i+1,'',a[i]]);i++;}else{rows.push(['+','',j+1,b[j]]);j++;}}
      while(i<n)rows.push(['−',i+1,'',a[i++]]);while(j<m)rows.push(['+','',j+1,b[j++]]);
      const add=rows.filter(r=>r[0]==='+').length,del=rows.filter(r=>r[0]==='−').length;
      return [KV([['文件 A',v.a.name+' · '+n+' 行'],['文件 B',v.b.name+' · '+m+' 行'],['新增行',add],['删除行',del],['相同行',rows.length-add-del],['相似度',T.fmt((rows.length-add-del)/(rows.length||1)*100,1)+'%']],'差异概览'),
        {type:'table',title:'逐行差异（前 300 行）',head:['标记','A 行号','B 行号','内容'],rows:rows.slice(0,300)}];} });

  R('JSON 文件格式化', { fields:[F('file','选择 JSON 文件',{accept:'.json,application/json'}),S('mode','操作',[['pretty','格式化'],['minify','压缩'],['validate','校验']],'pretty'),N('indent','缩进空格数',2)],
    run:async v=>{
      if(!v.file)throw new Error('请选择 JSON 文件');
      const s=String(await T.readFile(v.file));let obj;try{obj=JSON.parse(s);}catch(e){return {type:'note',kind:'err',value:'JSON 语法错误：'+T.esc(e.message)};}
      const out=v.mode==='minify'?JSON.stringify(obj):JSON.stringify(obj,null,Math.max(1,Number(v.indent)||2));
      if(v.mode==='validate')return KV([['校验','合法'],['根节点',Array.isArray(obj)?'数组':typeof obj],['键数',Object.keys(obj).length]],'校验结果');
      return [TXT(out,'格式化结果',baseName(v.file)+'.json'),KV([['原始大小',T.fmt(s.length/1024,1)+' K 字符'],['结果大小',T.fmt(out.length/1024,1)+' K 字符']])];} });

  R('XML 格式化', { fields:[F('file','选择 XML 文件（留空可用下方文本）',{accept:'.xml,text/xml,.svg,.html'}),X('text','或直接粘贴 XML','<root><item id="1"><name>拾器</name></item><item id="2"><name>ToolBox</name></item></root>')],
    run:async v=>{
      const s=v.file?String(await T.readFile(v.file)):String(v.text||'');
      if(!s.trim())throw new Error('请输入 XML 内容');
      const err=new DOMParser().parseFromString(s,'application/xml').querySelector('parsererror');
      return [TXT(T.formatXML(s),'格式化结果',baseName(v.file||{name:'data'})+'.xml'),
        ...(err?[{type:'note',kind:'warn',value:'XML 可能不合法：'+T.esc(err.textContent.slice(0,200))}]:[{type:'note',value:'XML 语法基本合法。'}])];} });

  R('YAML 转换', { fields:[F('file','选择 YAML / JSON 文件（可选）',{accept:'.yaml,.yml,.json,text/*'}),X('text','或直接粘贴内容','name: 拾器\nversion: 1.0\nlocal: true'),S('mode','方向',[['y2j','YAML → JSON'],['j2y','JSON → YAML']],'y2j')],
    run:async v=>{
      const s=v.file?String(await T.readFile(v.file)):String(v.text||'');
      if(!s.trim())throw new Error('请输入内容');
      if(v.mode==='j2y'){
        let obj;try{obj=JSON.parse(s);}catch(e){return {type:'note',kind:'err',value:'JSON 解析失败：'+T.esc(e.message)};}
        const dump=(o,ind)=>{const p=' '.repeat(ind);
          if(Array.isArray(o))return o.map(x=>typeof x==='object'?p+'-\n'+dump(x,ind+2):p+'- '+JSON.stringify(x)).join('\n');
          if(o&&typeof o==='object')return Object.entries(o).map(([k,val])=>p+k+':'+(val&&typeof val==='object'?'\n'+dump(val,ind+2):' '+(typeof val==='string'&&/[:\s#]/.test(val)?JSON.stringify(val):String(val)))).join('\n');
          return p+String(o);};
        return TXT(dump(obj,0),'YAML 结果',baseName(v.file||{name:'data'})+'.yaml');
      }
      // YAML → JSON：轻量缩进解析
      const lines=s.split(/\r?\n/).filter(l=>l.trim()&&!l.trim().startsWith('#')),root={},stack=[{i:-1,o:root}];
      lines.forEach(l=>{const m=l.match(/^(\s*)([^:]+):\s*(.*)$/);if(!m)return;
        const ind=m[1].length,k=m[2].trim(),val=m[3].trim();
        while(stack.length>1&&stack[stack.length-1].i>=ind)stack.pop();
        const parent=stack[stack.length-1].o;
        if(!val){const o={};parent[k]=o;stack.push({i:ind,o});}
        else{let x=val.replace(/^['"]|['"]$/g,'');if(x==='true')x=true;else if(x==='false')x=false;else if(x==='null')x=null;else if(/^-?\d+(\.\d+)?$/.test(x))x=Number(x);parent[k]=x;}});
      return [TXT(JSON.stringify(root,null,2),'JSON 结果',baseName(v.file||{name:'data'})+'.json'),
        {type:'note',value:'内置轻量解析器支持常见键值与嵌套对象；数组、多行字符串等复杂语法请用专业库。'}];} });

  R('大文件分片', { fields:[F('file','选择要分片的文件'),N('size','每片大小（MB）',5),C('zip','打包为 ZIP 下载',true,'打包下载')],
    run:async v=>{
      if(!v.file)throw new Error('请选择文件');
      const chunk=Math.max(1,Math.round((Number(v.size)||5)*1024*1024)),n=Math.ceil(v.file.size/chunk),items=[],rows=[];
      for(let i=0;i<n;i++){const blob=v.file.slice(i*chunk,Math.min((i+1)*chunk,v.file.size)),name=`${v.file.name}.part${String(i+1).padStart(3,'0')}`;
        items.push({blob,name});rows.push([i+1,name,T.fmt(blob.size/1024,1)+' KB']);}
      const res=[{type:'table',title:`共 ${n} 个分片`,head:['#','文件名','大小'],rows},{type:'files',items,title:'逐个下载分片'},TXT(JSON.stringify({fileName:v.file.name,totalSize:v.file.size,chunkSize:chunk,parts:n,created:new Date().toISOString()},null,2),'分片清单（合并时参考）','manifest.json')];
      if(v.zip)res.push({type:'file',blob:await zipBlob(await Promise.all(items.map(async x=>({name:x.name,data:new Uint8Array(await x.blob.arrayBuffer())})))),name:'chunks.zip',title:'打包下载全部分片'});
      return res;} });

  R('分片合并', { fields:[FS('files','按顺序选择全部分片'),I('name','还原后的文件名','restored.bin')],
    run:async v=>{
      const files=(v.files||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
      if(!files.length)throw new Error('请选择分片文件');
      const parts=await Promise.all(files.map(f=>bytes(f)));
      const total=parts.reduce((a,b)=>a+b.length,0),out=new Uint8Array(total);let off=0;
      parts.forEach(p=>{out.set(p,off);off+=p.length;});
      return [{type:'file',blob:new Blob([out]),name:String(v.name||'restored.bin'),title:'合并后的文件'},
        KV([['分片数',files.length],['总大小',T.fmt(total/1024/1024,2)+' MB'],['顺序',files.map(f=>f.name).slice(0,4).join(' → ')+(files.length>4?' …':'')]],'合并信息')];} });

  /* GBK 编码：利用浏览器 TextDecoder 反查生成编码表 */
  let gbkMap=null;
  function buildGbk(){
    if(gbkMap)return gbkMap;
    gbkMap=new Map();
    const dec=new TextDecoder('gbk');
    for(let hi=0x81;hi<=0xFE;hi++)for(let lo=0x40;lo<=0xFE;lo++){
      if(lo===0x7F)continue;
      const c=dec.decode(new Uint8Array([hi,lo]));
      if(c.length===1&&!gbkMap.has(c))gbkMap.set(c,[hi,lo]);
    }
    return gbkMap;
  }
  R('文本编码转换', { fields:[F('file','选择文本文件'),S('mode','转换方向',[['g2u','GBK / GB18030 → UTF-8'],['u2g','UTF-8 → GBK']],'g2u'),C('bom','输出 UTF-8 BOM',false,'添加 BOM')],
    run:async v=>{
      if(!v.file)throw new Error('请选择文本文件');
      const buf=await bytes(v.file);
      if(v.mode==='g2u'){
        const text=new TextDecoder('gbk').decode(buf);
        return [TXT(text,'解码结果（UTF-8）',baseName(v.file)+'_utf8.txt'),
          {type:'file',blob:new Blob([v.bom?'\ufeff'+text:text],{type:'text/plain;charset=utf-8'}),name:baseName(v.file)+'_utf8.txt',title:'下载转换后文件'},
          {type:'note',value:'浏览器原生 GBK/GB18030 解码，可正确处理简体中文、繁体中文与常用符号。'}];
      }
      const map=buildGbk(),src=String(await T.readFile(v.file)).replace(/^\ufeff/,''),out=[];
      for(const ch of Array.from(src)){
        const cp=ch.codePointAt(0);
        if(cp<128)out.push(cp);
        else if(map.has(ch))out.push(...map.get(ch));
        else out.push(0x3F);
      }
      const blob=new Blob([new Uint8Array(out)],{type:'text/plain;charset=gbk'});
      return [{type:'file',blob,name:baseName(v.file)+'_gbk.txt',title:'下载 GBK 编码文件'},
        KV([['原始字符数',src.length],['输出字节数',out.length],['无法编码字符',Array.from(src).filter(c=>c.codePointAt(0)>=128&&!map.has(c)).length]],'转换信息'),
        {type:'note',value:'通过浏览器 GBK 解码器反向构建编码表（约 2 万码位，首次运行需几百毫秒）；生僻字与 emoji 无法用 GBK 表示，会被替换为 ?。'}];} });

  function decodeMime(s){return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,(m,cs,enc,val)=>{
    try{const raw=enc.toLowerCase()==='b'?Uint8Array.from(atob(val),c=>c.charCodeAt(0)):Uint8Array.from(val.replace(/_/g,' ').replace(/=([0-9A-F]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16))),c=>c.charCodeAt(0));
      return new TextDecoder(cs).decode(raw);}catch(e){return val;}});}
  R('EML 查看器', { fields:[F('file','选择 .eml 邮件文件',{accept:'.eml,message/rfc822'}),C('html','正文以 HTML 预览',false,'HTML 预览')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 EML 文件');
      const raw=String(await T.readFile(v.file)),idx=raw.search(/\r?\n\r?\n/),head=idx<0?raw:raw.slice(0,idx),body=idx<0?'':raw.slice(idx).replace(/^\r?\n\r?\n/,'');
      const headers={};let cur='';
      head.split(/\r?\n/).forEach(l=>{const m=l.match(/^([\w-]+):\s*(.*)$/);if(m){cur=m[1];headers[cur]=decodeMime(m[2]);}else if(cur)headers[cur]+=' '+decodeMime(l.trim());});
      const ct=(headers['Content-Type']||'').toLowerCase(),te=(headers['Content-Transfer-Encoding']||'').toLowerCase();
      let text=body;
      if(te==='quoted-printable')text=text.replace(/=\r?\n/g,'').replace(/=([0-9A-F]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
      else if(te==='base64'){try{text=new TextDecoder(/charset=gb/i.test(ct)?'gbk':'utf-8').decode(Uint8Array.from(atob(text.replace(/\s/g,'')),c=>c.charCodeAt(0)));}catch(e){}}
      try{text=new TextDecoder(/charset=gb/i.test(ct)?'gbk':'utf-8').decode(Uint8Array.from(text,c=>c.charCodeAt(0)&255));}catch(e){}
      const rows=Object.entries(headers).map(([k,val])=>[k,val]);
      return [{type:'table',title:'邮件头',head:['字段','值'],rows:rows.slice(0,40)},
        v.html&&/html/i.test(ct)?{type:'html',title:'正文预览',value:text}:TXT(text.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' '),'邮件正文',baseName(v.file)+'.txt'),
        KV([['文件名',v.file.name],['Content-Type',ct||'未知'],['编码',te||'7bit'],['头部字段数',rows.length]],'文件信息')];} });

  R('Markdown 导出 PDF', { fields:[X('text','Markdown 内容','# 拾器 ToolBox\n\n一个纯本地运行的在线工具站。\n\n## 特性\n\n- 282 个工具，覆盖图片、文件、开发与学习\n- 所有文件都在浏览器内处理，不上传服务器\n- 支持离线使用\n\n> 把繁琐的小事，交给一个页面。\n\n## 示例代码\n\n```js\nconsole.log("Hello ToolBox")\n```'),N('fontSize','字号',17)],
    run:async v=>{
      const blob=textToPdf(String(v.text||''),{fontSize:Number(v.fontSize)||17});
      return [{type:'file',blob,name:'document.pdf',title:'生成的 PDF'},
        {type:'image',src:markdownCanvas(String(v.text||'')).toDataURL('image/png'),name:'preview.png',title:'首页预览（Canvas 渲染，中文正常）'}];} });

  R('Markdown 导出图片', { fields:[X('text','Markdown 内容','# 拾器 ToolBox\n\n把繁琐的小事，交给一个页面。\n\n## 功能清单\n\n- 图片处理：裁剪、压缩、调色\n- 文件处理：PDF 合并、拆分、转图片\n- 开发工具：JSON、Base64、正则\n\n> 全部本地运行，隐私零风险。'),N('width','图片宽度（px）',800)],
    run:v=>{
      const cv=markdownCanvas(String(v.text||''),{width:Number(v.width)||800});
      return [{type:'image',src:cv.toDataURL('image/png'),name:'markdown.png',title:`长图 ${cv.width} × ${cv.height} px`},
        {type:'html',title:'Markdown 渲染预览',value:`<div class="html-out">${window.marked?window.marked.parse(String(v.text||'')):T.esc(v.text||'')}</div>`}];} });

  R('日志查看工具', { fields:[F('file','选择日志文件',{accept:'.log,.txt,.out,text/*'}),I('filter','关键词过滤（留空显示全部）',''),N('limit','最多显示行数',200)],
    run:async v=>{
      if(!v.file)throw new Error('请选择日志文件');
      const s=String(await T.readFile(v.file)),all=s.split(/\r?\n/);
      let lines=all.filter(l=>!v.filter||l.includes(v.filter));
      const color=l=>/ERROR|FATAL|Exception|Traceback/i.test(l)?'var(--err)':/WARN/i.test(l)?'var(--warn)':/DEBUG|TRACE/i.test(l)?'var(--text-3)':/INFO/i.test(l)?'var(--accent-2)':'var(--text-2)';
      const html=lines.slice(0,Number(v.limit)||200).map((l,i)=>`<div style="display:flex;gap:10px;font-family:ui-monospace,monospace;font-size:11.5px;color:${color(l)};border-bottom:1px solid var(--line);padding:2px 6px"><span style="color:var(--text-3);min-width:46px">${all.indexOf(l)+1}</span><span style="word-break:break-all">${T.esc(l)}</span></div>`).join('');
      return [KV([['总行数',all.length],['过滤后',lines.length],['文件大小',T.fmt(v.file.size/1024,1)+' KB'],['ERROR 行数',all.filter(l=>/ERROR|FATAL/i.test(l)).length],['WARN 行数',all.filter(l=>/WARN/i.test(l)).length]],'日志概览'),
        {type:'html',title:'日志内容（按级别着色）',value:`<div style="max-height:520px;overflow:auto;border:1px solid var(--line);border-radius:8px">${html}</div>`}];} });

  R('批量文件编码检测', { fields:[FS('files','选择要检测的文本文件')],
    run:async v=>{
      const files=v.files||[];if(!files.length)throw new Error('请选择文件');
      const rows=[];
      for(const f of files){
        const buf=await bytes(f);let enc='未知',bom='无';
        if(buf[0]===0xEF&&buf[1]===0xBB&&buf[2]===0xBF){enc='UTF-8';bom='UTF-8 BOM';}
        else if(buf[0]===0xFF&&buf[1]===0xFE){enc='UTF-16 LE';bom='UTF-16 LE BOM';}
        else if(buf[0]===0xFE&&buf[1]===0xFF){enc='UTF-16 BE';bom='UTF-16 BE BOM';}
        else{
          try{new TextDecoder('utf-8',{fatal:true}).decode(buf);enc='UTF-8（无 BOM）';}
          catch(e){try{new TextDecoder('gbk',{fatal:true}).decode(buf);enc='GBK / GB18030';}catch(_){enc='二进制或非文本';}}
        }
        rows.push([f.name,T.fmt(f.size/1024,1)+' KB',enc,bom]);
      }
      return {type:'table',title:`检测 ${rows.length} 个文件`,head:['文件名','大小','推断编码','BOM'],rows};} });

  R('富文本转 HTML', { render(host, api) {
    host.innerHTML=`<div class="custom-pane"><div class="cp-row">
      <button class="btn btn-ghost" data-cmd="bold"><b>B</b></button><button class="btn btn-ghost" data-cmd="italic"><i>I</i></button><button class="btn btn-ghost" data-cmd="underline"><u>U</u></button>
      <button class="btn btn-ghost" data-cmd="formatBlock" data-val="h2">H2</button><button class="btn btn-ghost" data-cmd="formatBlock" data-val="p">正文</button>
      <button class="btn btn-ghost" data-cmd="insertUnorderedList">• 列表</button><button class="btn btn-ghost" data-cmd="insertOrderedList">1. 列表</button>
      <button class="btn btn-ghost" data-cmd="justifyCenter">居中</button><button class="btn btn-ghost" id="rtLink">插入链接</button>
      <button class="btn btn-primary" id="rtCopy">复制 HTML</button><button class="btn btn-ghost" id="rtDl">下载 .html</button></div>
      <div id="rtEditor" contenteditable="true" style="min-height:220px;background:var(--bg-soft);border:1px solid var(--line);border-radius:9px;padding:16px;font-size:14px;line-height:1.9;outline:none"><h2>在这里编辑内容</h2><p>选中文字后点击上方按钮设置格式，支持<b>加粗</b>、<i>斜体</i>、列表与链接。</p><ul><li>第一项</li><li>第二项</li></ul></div>
      <div class="cp-label">生成的 HTML 代码</div><pre class="code-out" id="rtCode" style="max-height:220px"></pre></div>`;
    const ed=host.querySelector('#rtEditor'),code=host.querySelector('#rtCode');
    const update=()=>{code.textContent=ed.innerHTML;};
    host.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{ed.focus();document.execCommand(b.dataset.cmd,false,b.dataset.val||null);update();});
    host.querySelector('#rtLink').onclick=()=>{const url=prompt('输入链接地址','https://');if(url){ed.focus();document.execCommand('createLink',false,url);update();}};
    host.querySelector('#rtCopy').onclick=()=>{update();T.copy(ed.innerHTML);};
    host.querySelector('#rtDl').onclick=()=>{update();T.save(new Blob(['<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>Document</title></head><body>'+ed.innerHTML+'</body></html>'],{type:'text/html;charset=utf-8'}),'document.html');};
    ed.addEventListener('input',update);update();
  }});

  R('HTML 转纯文本', { fields:[X('text','HTML 代码','<div class="box"><h1>标题</h1><p>这是一段 <b>加粗</b> 文字与 <a href="#">链接</a>。</p><ul><li>项目一</li><li>项目二</li></ul></div>'),C('keepLink','保留链接地址',false,'保留 URL'),C('collapse','压缩多余空白',true,'压缩空白')],live:true,
    run:v=>{
      const dp=new DOMParser().parseFromString(String(v.text||''),'text/html');
      dp.querySelectorAll('script,style,noscript').forEach(e=>e.remove());
      if(v.keepLink)dp.querySelectorAll('a[href]').forEach(a=>a.textContent+=` [${a.getAttribute('href')}]`);
      dp.querySelectorAll('br,p,div,li,h1,h2,h3,h4,tr,blockquote').forEach(e=>e.insertAdjacentText('beforebegin','\n'));
      let out=dp.body.textContent||'';
      if(v.collapse)out=out.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').split('\n').map(l=>l.trim()).join('\n').trim();
      return [TXT(out,'纯文本结果','plain.txt'),KV([['原始字符',String(v.text||'').length],['结果字符',out.length],['移除标签',(String(v.text||'').match(/<[^>]+>/g)||[]).length+' 个']])];} });

  R('字体预览工具', { fields:[F('file','选择字体文件',{accept:'.ttf,.otf,.woff,.woff2'}),X('text','预览文字','拾器 ToolBox 282 个在线工具\nABCDEFGHIJKLM 0123456789\n春风不度玉门关，疑是地上霜。',{rows:4}),N('size','预览字号',32)],
    run:async v=>{
      if(!v.file)throw new Error('请选择字体文件');
      const fam='preview_'+Date.now(),buf=await bytes(v.file);
      const face=new FontFace(fam,buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength));
      await face.load();document.fonts.add(face);
      const html=String(v.text||'').split('\n').map((l,i)=>`<div style="font-family:'${fam}',sans-serif;font-size:${i===0?Number(v.size)||32:(Number(v.size)||32)*.6}px;line-height:1.7;padding:6px 0">${T.esc(l)}</div>`).join('');
      return [{type:'html',title:'字体预览（已在本页加载，切换工具后失效）',value:`<div style="background:var(--bg-soft);border-radius:9px;padding:18px">${html}</div>`},
        KV([['文件名',v.file.name],['字体大小',T.fmt(v.file.size/1024,1)+' KB'],['格式',v.file.name.split('.').pop().toUpperCase()],['FontFace 状态',face.status]],'字体信息')];} });

  R('文本文件编码 BOM 增减', { fields:[F('file','选择文本文件'),S('mode','操作',[['add','添加 UTF-8 BOM'],['remove','移除 BOM'],['check','仅检测']],'add')],
    run:async v=>{
      if(!v.file)throw new Error('请选择文本文件');
      const buf=await bytes(v.file);
      const bomKind=buf[0]===0xEF&&buf[1]===0xBB&&buf[2]===0xBF?'UTF-8 BOM':buf[0]===0xFF&&buf[1]===0xFE?'UTF-16 LE BOM':buf[0]===0xFE&&buf[1]===0xFF?'UTF-16 BE BOM':'无 BOM';
      if(v.mode==='check')return KV([['文件名',v.file.name],['BOM 类型',bomKind],['文件大小',buf.length+' 字节']],'BOM 检测');
      let out;
      if(v.mode==='add'){out=new Uint8Array(buf.length+3);out.set([0xEF,0xBB,0xBF],0);out.set(bomKind==='UTF-8 BOM'?buf.slice(3):buf,3);}
      else{out=bomKind==='无 BOM'?buf:buf.slice(3);}
      return [{type:'file',blob:new Blob([out],{type:'text/plain;charset=utf-8'}),name:baseName(v.file)+(v.mode==='add'?'_bom':'_nobom')+'.txt',title:'处理后的文件'},
        KV([['原始 BOM',bomKind],['操作',v.mode==='add'?'添加':'移除'],['原始字节',buf.length],['结果字节',out.length]],'处理信息')];} });

  R('Excel 表格合并', { fields:[FS('files','选择多个 Excel 文件',{accept:'.xlsx,.xls,.csv'}),C('oneSheet','合并到同一个工作表',false,'合并为单表')],
    run:async v=>{
      const files=v.files||[];if(files.length<2)throw new Error('请至少选择 2 个表格文件');
      if(!window.XLSX)throw new Error('表格组件未加载');
      const X=window.XLSX,out=X.utils.book_new(),rows=[];
      for(const f of files){const wb=X.read(await bytes(f),{type:'array'});
        wb.SheetNames.forEach(sn=>{if(v.oneSheet){const data=X.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:''});data.forEach(r=>rows.push(r));}
          else X.utils.book_append_sheet(out,wb.Sheets[sn],(baseName(f)+'_'+sn).slice(0,31));});}
      if(v.oneSheet)X.utils.book_append_sheet(out,X.utils.aoa_to_sheet(rows),'合并结果');
      const buf=X.write(out,{bookType:'xlsx',type:'array'});
      return [{type:'file',blob:new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),name:'merged.xlsx',title:'合并后的工作簿'},
        KV([['源文件数',files.length],['输出工作表数',out.SheetNames.length],['输出体积',T.fmt(buf.length/1024,1)+' KB']],'合并信息')];} });

  R('Excel 拆分工作表', { fields:[F('file','选择 Excel 文件',{accept:'.xlsx,.xls,.ods'}),S('format','输出格式',[['xlsx','XLSX'],['csv','CSV（每表一个）']],'xlsx')],
    run:async v=>{
      if(!v.file)throw new Error('请选择 Excel 文件');
      if(!window.XLSX)throw new Error('表格组件未加载');
      const X=window.XLSX,wb=X.read(await bytes(v.file),{type:'array'}),items=[],rows=[];
      wb.SheetNames.forEach(sn=>{
        if(v.format==='csv'){items.push({blob:new Blob(['\ufeff'+X.utils.sheet_to_csv(wb.Sheets[sn])],{type:'text/csv;charset=utf-8'}),name:sn+'.csv'});}
        else{const nw=X.utils.book_new();X.utils.book_append_sheet(nw,wb.Sheets[sn],sn);items.push({blob:new Blob([X.write(nw,{bookType:'xlsx',type:'array'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),name:sn+'.xlsx'});}
        rows.push([sn,X.utils.sheet_to_json(wb.Sheets[sn],{header:1}).length+' 行']);
      });
      return [{type:'table',title:`拆出 ${wb.SheetNames.length} 个工作表`,head:['工作表','数据量'],rows},
        {type:'files',items,title:'逐个下载'},
        {type:'file',blob:await zipBlob(await Promise.all(items.map(async x=>({name:x.name,data:new Uint8Array(await x.blob.arrayBuffer())})))),name:'sheets.zip',title:'打包下载'}];} });

  R('ODS 格式转换', { fields:[F('file','选择 ODS / XLSX / CSV 文件',{accept:'.ods,.xlsx,.xls,.csv'}),S('format','输出格式',[['xlsx','XLSX'],['csv','CSV'],['json','JSON']],'xlsx')],
    run:async v=>{
      if(!v.file)throw new Error('请选择文件');
      if(!window.XLSX)throw new Error('表格组件未加载');
      const X=window.XLSX,wb=X.read(await bytes(v.file),{type:'array'}),sn=wb.SheetNames[0],data=X.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:''});
      let blob,name;
      if(v.format==='xlsx'){blob=new Blob([X.write(wb,{bookType:'xlsx',type:'array'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});name=baseName(v.file)+'.xlsx';}
      else if(v.format==='csv'){blob=new Blob(['\ufeff'+X.utils.sheet_to_csv(wb.Sheets[sn])],{type:'text/csv;charset=utf-8'});name=baseName(v.file)+'.csv';}
      else{blob=new Blob([JSON.stringify(X.utils.sheet_to_json(wb.Sheets[sn],{defval:''}),null,2)],{type:'application/json'});name=baseName(v.file)+'.json';}
      return [{type:'file',blob,name,title:'转换结果'},
        {type:'table',title:`工作表「${sn}」预览`,head:(data[0]||[]).map((_,i)=>'列 '+(i+1)),rows:data.slice(0,30).map(r=>r.map(String))},
        KV([['工作表数',wb.SheetNames.length],['总行数',data.length]],'文件信息')];} });

  R('文件夹清单导出', { render(host, api) {
    host.innerHTML=`<div class="custom-pane"><div class="cp-row"><label class="file-drop" style="flex:1"><input type="file" id="flInput" webkitdirectory directory multiple><span class="file-btn">选择整个文件夹</span><span class="file-names" id="flName">尚未选择</span></label><button class="btn btn-primary" id="flCsv">导出 CSV</button><button class="btn btn-ghost" id="flMd">导出 Markdown</button></div>
      <div class="cp-canvas-wrap" style="text-align:left;max-height:520px;overflow:auto" id="flOut"><span class="cp-note">选择文件夹后在此生成树形清单</span></div></div>`;
    let rows=[];
    host.querySelector('#flInput').onchange=e=>{
      const files=Array.from(e.target.files||[]);
      if(!files.length)return;
      host.querySelector('#flName').textContent=`已读取 ${files.length} 个文件`;
      rows=files.map(f=>[f.webkitRelativePath||f.name,f.size,f.type||'—',new Date(f.lastModified).toLocaleString('zh-CN')]);
      const tree={};
      files.forEach(f=>{const parts=(f.webkitRelativePath||f.name).split('/');let cur=tree;parts.forEach((p,i)=>{cur[p]=cur[p]||(i===parts.length-1?{__file:true,size:f.size}:{});cur=cur[p];if(i===parts.length-1)return;});});
      const render=(o,depth)=>Object.keys(o).sort((a,b)=>(o[a].__file?1:0)-(o[b].__file?1:0)).map(k=>{
        if(o[k].__file)return `<div style="padding-left:${depth*16}px;font-size:12px;color:var(--text-2)">· ${T.esc(k)} <span style="color:var(--text-3)">· ${T.fmt(o[k].size/1024,1)} KB</span></div>`;
        return `<div style="padding-left:${depth*16}px;font-size:12.5px;color:var(--accent);font-weight:600">▸ ${T.esc(k)}/</div>`+render(o[k],depth+1);}).join('');
      host.querySelector('#flOut').innerHTML=render(tree,0);
      host.querySelector('#flCsv').onclick=()=>{const esc=x=>'"'+String(x).replace(/"/g,'""')+'"';T.save(new Blob(['\ufeff'+[['路径','字节','类型','修改时间'],...rows].map(r=>r.map(esc).join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),'folder_list.csv');};
      host.querySelector('#flMd').onclick=()=>T.save(T.textBlob('# 文件夹清单\n\n| 路径 | 大小 | 类型 | 修改时间 |\n| --- | --- | --- | --- |\n'+rows.map(r=>'| '+r.map(x=>String(x).replace(/\|/g,'\\|')).join(' | ')+' |').join('\n')),'folder_list.md');
    };
  }});

  R('文档分页预览', { fields:[X('text','文档内容','第一章　项目概述\n\n这是一个纯本地运行的在线工具站，包含 282 个工具。所有文件都在浏览器中处理，不会上传到任何服务器，用户隐私得到充分保障。\n\n第二章　功能设计\n\n工具按 12 个大类组织：图片、音视频、文件处理、条码二维码、金融财税、法律劳动、数据换算、生活娱乐、教育学习、文本、开发工具与益智游戏。\n\n第三章　技术实现\n\n站点采用纯静态 HTML / CSS / JavaScript 构建，无后端依赖；图片处理基于 Canvas，PDF 处理基于 pdf-lib 与 pdf.js，表格处理基于 SheetJS。',{rows:9}),N('perPage','每页字数',220)],
    run:v=>{
      const s=String(v.text||''),per=Math.max(50,Number(v.perPage)||220),paras=s.split(/\n\s*\n/),pages=[];
      let cur='',len=0;
      paras.forEach(p=>{if(len+p.length>per&&cur){pages.push(cur.trim());cur='';len=0;}cur+=p+'\n\n';len+=p.length;});
      if(cur.trim())pages.push(cur.trim());
      const html=pages.map((p,i)=>`<div style="background:#fff;color:#202a3c;border:1px solid var(--line);border-radius:6px;padding:30px 34px;min-height:260px;box-shadow:var(--shadow);margin-bottom:20px"><div style="font-size:11px;color:#98a2b3;text-align:right;margin-bottom:16px">第 ${i+1} / ${pages.length} 页</div><div style="white-space:pre-wrap;line-height:1.9;font-size:13.5px">${T.esc(p)}</div></div>`).join('');
      return [{type:'html',title:`共 ${pages.length} 页（可打印）`,value:`<div style="max-width:640px;margin:0 auto">${html}</div>`},
        KV([['总字数',s.length],['分页阈值',per+' 字 / 页'],['页数',pages.length]],'分页信息')];} });
})();
