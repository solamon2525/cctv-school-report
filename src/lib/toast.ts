type ToastType = 'ok' | 'err' | 'warn';
const ico: Record<ToastType,string> = { ok:'✓', err:'✕', warn:'⚠' };
const bg: Record<ToastType,string>  = { ok:'#e8f5e9', err:'#fde8e8', warn:'#fef3dc' };
const cl: Record<ToastType,string>  = { ok:'#1b5e20', err:'#7f1e1e', warn:'#6b4600' };
const bd: Record<ToastType,string>  = { ok:'rgba(46,125,50,.3)', err:'rgba(183,28,28,.3)', warn:'rgba(196,137,26,.3)' };

export function toast(msg: string, type: ToastType = 'ok', dur = 3000) {
  let c = document.getElementById('__toast__');
  if (!c) {
    c = document.createElement('div');
    c.id = '__toast__';
    Object.assign(c.style, { position:'fixed', bottom:'22px', right:'22px', zIndex:'9999', display:'flex', flexDirection:'column', gap:'8px', pointerEvents:'none' });
    document.body.appendChild(c);
  }
  const d = document.createElement('div');
  Object.assign(d.style, { background: bg[type], border:`1px solid ${bd[type]}`, color: cl[type], padding:'10px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', display:'flex', alignItems:'center', gap:'9px', minWidth:'220px', maxWidth:'320px', pointerEvents:'auto', fontFamily:'Sarabun,sans-serif' });
  d.className = 'toast-in';
  d.innerHTML = `<span style="font-size:15px">${ico[type]}</span><span>${msg}</span>`;
  c.appendChild(d);
  setTimeout(() => { d.style.opacity='0'; d.style.transition='opacity .2s'; }, dur - 220);
  setTimeout(() => d.remove(), dur);
}
