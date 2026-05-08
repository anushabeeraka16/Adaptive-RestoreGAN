import { useState, useRef, useEffect, useCallback, useId } from "react";

const API_BASE = "http://localhost:8000";

/* ──────────────────────────────────────────────
   INLINE CSS
────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

:root {
  --bg:        #0c0d11;
  --bg2:       #13141a;
  --surface:   #1a1c24;
  --surface2:  #212430;
  --border:    #2a2d3d;
  --border2:   #363a52;
  --text:      #e8eaf0;
  --text2:     #9ca3b8;
  --text3:     #5c6280;
  --cyan:      #00d4ff;
  --cyan-dim:  rgba(0,212,255,0.12);
  --cyan-glow: 0 0 24px rgba(0,212,255,0.35);
  --green:     #00e89a;
  --green-dim: rgba(0,232,154,0.10);
  --amber:     #ffbe00;
  --amber-dim: rgba(255,190,0,0.12);
  --red:       #ff4d6a;
  --red-dim:   rgba(255,77,106,0.12);
  --purple:    #9d7cff;
  --purple-dim:rgba(157,124,255,0.12);
  --r: 10px;
  --mono: 'Space Mono', monospace;
  --sans: 'Space Grotesk', sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

body::before {
  content: '';
  position: fixed; inset: 0; z-index: 9999; pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
}

@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
@keyframes spin   { to{transform:rotate(360deg)} }
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes barIn  { from{width:0} }
@keyframes glint  { 0%{transform:translateX(-140%)} 100%{transform:translateX(140%)} }
@keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes slideR { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }

.shell { display:flex; flex-direction:column; min-height:100vh; }

.nav {
  height:56px; background:var(--bg2);
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 24px; position:sticky; top:0; z-index:300;
}
.nav-logo { display:flex; align-items:center; gap:12px; }
.logo-mark {
  width:32px; height:32px; border-radius:8px;
  background:linear-gradient(135deg,#00d4ff,#9d7cff);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; font-weight:800; color:#000; flex-shrink:0;
  box-shadow:0 0 20px rgba(0,212,255,0.4);
  animation:float 4s ease-in-out infinite;
}
.logo-text { font-family:var(--mono); font-size:14px; font-weight:700; letter-spacing:0.5px; color:var(--text); }
.logo-text span { color:var(--cyan); }
.logo-badge {
  font-family:var(--mono); font-size:9px; font-weight:700;
  padding:2px 7px; border-radius:4px;
  background:var(--cyan-dim); color:var(--cyan);
  border:1px solid rgba(0,212,255,0.25); letter-spacing:1px;
}
.nav-pills { display:flex; gap:8px; }
.nav-pill {
  font-family:var(--mono); font-size:10px; font-weight:700;
  padding:4px 12px; border-radius:5px; letter-spacing:0.5px;
  border:1px solid var(--border2); color:var(--text2);
  background:var(--surface); white-space:nowrap;
}
.nav-pill.green { background:var(--green-dim); color:var(--green); border-color:rgba(0,232,154,0.3); }
.nav-pill.red   { background:var(--red-dim);   color:var(--red);   border-color:rgba(255,77,106,0.3); }
.nav-status { display:flex; align-items:center; gap:8px; font-family:var(--mono); font-size:10px; font-weight:700; letter-spacing:0.5px; }
.dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.dot.online  { background:var(--green);  box-shadow:0 0 8px var(--green);  animation:pulse 2s infinite; }
.dot.offline { background:var(--red); }
.dot.loading { background:var(--amber); animation:pulse 1s infinite; }

.grid { flex:1; display:grid; grid-template-columns:320px 1fr; }

.sidebar {
  background:var(--bg2); border-right:1px solid var(--border);
  display:flex; flex-direction:column; overflow-y:auto; overflow-x:hidden;
}
.sb-section { padding:20px; border-bottom:1px solid var(--border); }
.sb-label {
  font-family:var(--mono); font-size:9px; font-weight:700;
  letter-spacing:2px; text-transform:uppercase; color:var(--text3);
  margin-bottom:12px; display:flex; align-items:center; gap:8px;
}
.sb-label::before { content:''; width:2px; height:12px; border-radius:1px; background:var(--cyan); flex-shrink:0; }

.dz {
  border:2px dashed var(--border2); border-radius:var(--r);
  min-height:180px; display:flex; flex-direction:column;
  align-items:center; justify-content:center; text-align:center;
  padding:20px; cursor:pointer; transition:all 0.25s;
  background:var(--surface); position:relative; overflow:hidden;
}
.dz:hover, .dz.drag { border-color:var(--cyan); background:var(--cyan-dim); box-shadow:0 0 0 1px rgba(0,212,255,0.2) inset; }
.dz-icon { font-size:30px; margin-bottom:10px; animation:float 5s ease-in-out infinite; }
.dz-title { font-size:13px; font-weight:600; color:var(--text); margin-bottom:4px; }
.dz-sub   { font-size:11px; color:var(--text3); }
.dz-fmts  { display:flex; gap:5px; flex-wrap:wrap; justify-content:center; margin-top:10px; }
.fmt { font-family:var(--mono); font-size:9px; font-weight:700; padding:2px 8px; border-radius:4px; background:var(--surface2); color:var(--cyan); border:1px solid var(--border2); }
.dz-preview { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.dz-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(12,13,17,0.85) 0%, transparent 50%); display:flex; align-items:flex-end; justify-content:center; padding:10px; }
.dz-fname { font-size:11px; font-weight:600; color:rgba(255,255,255,0.85); font-family:var(--mono); }

.model-tabs { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.model-tab {
  border:1px solid var(--border2); border-radius:var(--r);
  padding:10px; background:var(--surface);
  cursor:pointer; transition:all 0.2s;
  display:flex; flex-direction:column; gap:4px;
}
.model-tab:hover { background:var(--surface2); }
.model-tab.active     { background:var(--cyan-dim);   border-color:rgba(0,212,255,0.4);   box-shadow:0 0 12px rgba(0,212,255,0.12); }
.model-tab.active.ds2 { background:var(--purple-dim); border-color:rgba(157,124,255,0.4); box-shadow:0 0 12px rgba(157,124,255,0.12); }
.mt-icon   { font-size:18px; }
.mt-name   { font-size:11px; font-weight:700; color:var(--text); }
.mt-detail { font-family:var(--mono); font-size:9px; color:var(--text3); }
.mt-badge  { font-family:var(--mono); font-size:8px; font-weight:700; padding:2px 6px; border-radius:3px; width:fit-content; margin-top:2px; background:var(--surface2); color:var(--text3); border:1px solid var(--border); }
.model-tab.active     .mt-badge { background:var(--cyan-dim);   color:var(--cyan);   border:1px solid rgba(0,212,255,0.3); }
.model-tab.active.ds2 .mt-badge { background:var(--purple-dim); color:var(--purple); border:1px solid rgba(157,124,255,0.3); }
.model-unavail { font-family:var(--mono); font-size:9px; color:var(--text3); text-align:center; padding:4px; background:var(--red-dim); border-radius:5px; border:1px solid rgba(255,77,106,0.2); }

.thr-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.thr-val { font-family:var(--mono); font-size:18px; font-weight:700; color:var(--cyan); }
.thr-hint { font-size:10px; color:var(--text3); }
input[type=range] { width:100%; -webkit-appearance:none; height:6px; border-radius:3px; background:var(--surface2); border:1px solid var(--border); cursor:pointer; outline:none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--cyan); cursor:pointer; box-shadow:0 0 8px rgba(0,212,255,0.5); border:2px solid var(--bg); }
.thr-labels { display:flex; justify-content:space-between; margin-top:5px; }
.thr-labels span { font-family:var(--mono); font-size:9px; color:var(--text3); }

.pipeline { display:flex; flex-direction:column; }
.pipe-step { display:flex; gap:10px; padding:7px 0; position:relative; }
.pipe-step:not(:last-child)::after { content:''; position:absolute; left:10px; top:28px; bottom:0; width:1px; background:repeating-linear-gradient(to bottom, var(--border2) 0, var(--border2) 3px, transparent 3px, transparent 7px); }
.pipe-num { width:22px; height:22px; border-radius:6px; flex-shrink:0; background:var(--surface2); border:1px solid var(--border2); display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:9px; font-weight:700; color:var(--text3); margin-top:1px; }
.pipe-num.active { background:var(--cyan-dim); border-color:rgba(0,212,255,0.4); color:var(--cyan); box-shadow:0 0 8px rgba(0,212,255,0.2); }
.pipe-text { font-size:11px; color:var(--text2); line-height:1.6; padding-top:2px; }
.pipe-text b { color:var(--text); font-weight:600; }

.run-btn { width:100%; padding:13px; border:none; border-radius:var(--r); font-family:var(--sans); font-size:14px; font-weight:700; cursor:pointer; transition:all 0.25s; display:flex; align-items:center; justify-content:center; gap:9px; position:relative; overflow:hidden; }
.run-btn.on { background:linear-gradient(135deg,var(--cyan) 0%,var(--purple) 100%); color:#000; box-shadow:0 0 24px rgba(0,212,255,0.4); }
.run-btn.on::before { content:''; position:absolute; width:60%; height:100%; top:0; left:-80%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation:glint 2.5s ease-in-out infinite; }
.run-btn.on:hover { box-shadow:0 0 36px rgba(0,212,255,0.6); transform:translateY(-1px); }
.run-btn.off { background:var(--surface2); color:var(--text3); cursor:not-allowed; border:1px solid var(--border); }
.spinner { width:14px; height:14px; border-radius:50%; border:2px solid rgba(0,0,0,0.25); border-top-color:#000; animation:spin 0.7s linear infinite; flex-shrink:0; }
.err-box { margin-top:10px; padding:10px 12px; border-radius:var(--r); background:var(--red-dim); border:1px solid rgba(255,77,106,0.3); font-size:11px; color:var(--red); line-height:1.5; display:flex; gap:8px; }

.content { padding:24px 28px; display:flex; flex-direction:column; gap:18px; overflow-y:auto; }

.empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; min-height:400px; text-align:center; }
.empty-icon  { font-size:48px; animation:float 5s ease-in-out infinite; margin-bottom:4px; }
.empty-title { font-size:20px; font-weight:700; color:var(--text2); }
.empty-sub   { font-size:13px; color:var(--text3); max-width:280px; line-height:1.6; }
.empty-dots  { display:flex; gap:8px; margin-top:8px; }
.empty-dot   { font-family:var(--mono); font-size:10px; font-weight:700; padding:3px 12px; border-radius:4px; }
.ed-c { background:var(--cyan-dim);   color:var(--cyan);   border:1px solid rgba(0,212,255,0.25); }
.ed-g { background:var(--green-dim);  color:var(--green);  border:1px solid rgba(0,232,154,0.25); }
.ed-p { background:var(--purple-dim); color:var(--purple); border:1px solid rgba(157,124,255,0.25); }

.result { animation:fadeUp 0.4s cubic-bezier(.16,1,.3,1); }
.result-hdr { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:18px; }
.result-title { font-size:22px; font-weight:700; color:var(--text); letter-spacing:-0.5px; }
.result-sub   { font-size:12px; color:var(--text2); margin-top:3px; line-height:1.6; }
.result-tag   { font-family:var(--mono); font-size:10px; font-weight:700; padding:5px 14px; border-radius:5px; letter-spacing:0.5px; white-space:nowrap; align-self:flex-start; }
.rt-enhanced { background:var(--green-dim); color:var(--green); border:1px solid rgba(0,232,154,0.35); }
.rt-sharp    { background:var(--cyan-dim);  color:var(--cyan);  border:1px solid rgba(0,212,255,0.35); }
.stat-inline { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.si-chip     { font-family:var(--mono); font-size:9px; font-weight:700; padding:2px 8px; border-radius:4px; background:var(--surface2); color:var(--text3); border:1px solid var(--border); }
.elapsed-tag { font-family:var(--mono); font-size:9px; padding:2px 8px; border-radius:4px; background:var(--surface2); color:var(--text3); border:1px solid var(--border); }

.bcard { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:20px 22px; position:relative; overflow:hidden; }
.bcard::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--cyan),var(--purple),var(--green)); }
.bcard-top  { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:14px; }
.bcard-lbl  { font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--text3); }
.bcard-desc { font-size:11px; color:var(--text3); margin-top:3px; }
.bcard-val  { font-family:var(--mono); font-size:38px; font-weight:700; line-height:1; letter-spacing:-1px; }
.bcard-val.blurry { color:var(--amber); text-shadow:0 0 20px rgba(255,190,0,0.3); }
.bcard-val.sharp  { color:var(--cyan);  text-shadow:0 0 20px rgba(0,212,255,0.3); }
.bcard-unit { font-family:var(--mono); font-size:10px; color:var(--text3); margin-top:2px; }

.bar-wrap { position:relative; margin-bottom:6px; }
.bar-bg { height:12px; background:var(--surface2); border-radius:6px; border:1px solid var(--border); overflow:hidden; position:relative; }
.bar-fg { height:100%; border-radius:6px; animation:barIn 1s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden; }
.bar-fg::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 60%); }
.bar-fg.blurry { background:linear-gradient(90deg,var(--amber),#ff8c00); }
.bar-fg.sharp  { background:linear-gradient(90deg,var(--cyan),var(--purple)); }
.bar-thr { position:absolute; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.35); z-index:1; }
.bar-lbls { display:flex; justify-content:space-between; margin-top:5px; }
.bar-lbls span { font-family:var(--mono); font-size:9px; color:var(--text3); }
.verdict { margin-top:14px; padding:10px 14px; border-radius:7px; font-size:12px; font-weight:600; display:flex; align-items:center; gap:8px; }
.verdict.blurry { background:var(--amber-dim); border:1px solid rgba(255,190,0,0.3); color:#d4a800; }
.verdict.sharp  { background:var(--cyan-dim);  border:1px solid rgba(0,212,255,0.3); color:var(--cyan); }

.gain-banner { display:flex; gap:10px; padding:14px 16px; background:var(--green-dim); border:1px solid rgba(0,232,154,0.3); border-radius:var(--r); align-items:center; }
.gain-title { font-size:12px; font-weight:700; color:var(--green); margin-bottom:4px; }
.gain-sub   { font-size:10px; color:var(--text3); }
.gain-chips { display:flex; gap:8px; margin-left:auto; flex-shrink:0; }
.gain-chip  { font-family:var(--mono); font-size:13px; font-weight:700; padding:5px 14px; border-radius:6px; background:rgba(0,232,154,0.15); color:var(--green); border:1px solid rgba(0,232,154,0.35); text-align:center; }
.gain-chip small { font-size:8px; display:block; color:var(--text3); letter-spacing:0.5px; margin-top:2px; }

.triple-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:20px 22px; position:relative; overflow:hidden; }
.triple-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#ff4d6a,var(--amber),var(--cyan),var(--green)); }
.tc-hdr   { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.tc-title { font-size:14px; font-weight:700; color:var(--text); }
.tc-sub   { font-size:10px; color:var(--text3); margin-top:2px; }
.tc-tag   { font-family:var(--mono); font-size:9px; font-weight:700; padding:3px 10px; border-radius:4px; background:var(--purple-dim); color:var(--purple); border:1px solid rgba(157,124,255,0.3); }

.triple-row { display:grid; grid-template-columns:1fr 24px 1fr 24px 1fr; gap:8px; align-items:start; }
.img-col     { display:flex; flex-direction:column; gap:8px; align-items:center; }
.img-col-hdr { display:flex; justify-content:space-between; align-items:center; width:100%; }
.icol-lbl    { font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
.icol-lbl.orig   { color:var(--text2); }
.icol-lbl.lq     { color:var(--amber); }
.icol-lbl.hq     { color:var(--cyan);  }
.icol-lbl.purple { color:var(--purple);}
.icol-badge { font-family:var(--mono); font-size:8px; font-weight:700; padding:2px 7px; border-radius:3px; }
.ib-orig   { background:var(--surface2); color:var(--text2); border:1px solid var(--border2); }
.ib-lq     { background:var(--amber-dim); color:var(--amber); border:1px solid rgba(255,190,0,0.3); }
.ib-hq     { background:var(--cyan-dim);  color:var(--cyan);  border:1px solid rgba(0,212,255,0.3); }
.ib-purple { background:var(--purple-dim); color:var(--purple); border:1px solid rgba(157,124,255,0.3); }

.img-frame { width:100%; aspect-ratio:1; border-radius:9px; overflow:hidden; border:1px solid var(--border2); background:var(--surface2); cursor:pointer; transition:all 0.2s; position:relative; }
.img-frame:hover     { border-color:var(--cyan);  box-shadow:0 0 16px rgba(0,212,255,0.2); transform:scale(1.02); }
.img-frame.lq-frame:hover { border-color:var(--amber); box-shadow:0 0 16px rgba(255,190,0,0.2); }
.img-frame.hq-frame:hover { border-color:var(--green); box-shadow:0 0 16px rgba(0,232,154,0.2); }
.img-frame img { width:100%; height:100%; object-fit:contain; display:block; }
.img-frame .zoom-hint { position:absolute; inset:0; background:rgba(0,212,255,0.08); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s; font-size:20px; }
.img-frame:hover .zoom-hint { opacity:1; }

.img-meta { font-family:var(--mono); font-size:9px; color:var(--text3); text-align:center; line-height:1.7; width:100%; }
.img-meta.amber { color:var(--amber); }
.img-meta.cyan  { color:var(--cyan);  }

.metric-pair { display:grid; grid-template-columns:1fr 1fr; gap:5px; width:100%; }
.metric-chip  { padding:7px 5px; border-radius:7px; text-align:center; border:1px solid var(--border); background:var(--surface2); transition:all 0.2s; cursor:default; }
.metric-chip:hover { transform:translateY(-2px); border-color:var(--border2); }
.mc-amber  { background:var(--amber-dim);  border-color:rgba(255,190,0,0.3); }
.mc-cyan   { background:var(--cyan-dim);   border-color:rgba(0,212,255,0.3); }
.mc-green  { background:var(--green-dim);  border-color:rgba(0,232,154,0.3); }
.mc-purple { background:var(--purple-dim); border-color:rgba(157,124,255,0.3); }
.mc-val { font-family:var(--mono); font-size:13px; font-weight:700; line-height:1; }
.mc-val.amber  { color:var(--amber);  }
.mc-val.cyan   { color:var(--cyan);   }
.mc-val.green  { color:var(--green);  }
.mc-val.purple { color:var(--purple); }
.mc-key { font-family:var(--mono); font-size:8px; color:var(--text3); margin-top:3px; letter-spacing:0.5px; }

.arr-col { display:flex; align-items:center; justify-content:center; padding-top:80px; }
.arr-col span { color:var(--text3); font-size:14px; animation:float 3s ease-in-out infinite; }

.brow { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.mini-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:16px 18px; position:relative; overflow:hidden; }
.mini-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
.mc-cyan-top::before  { background:linear-gradient(90deg,var(--cyan),var(--purple)); }
.mc-green-top::before { background:linear-gradient(90deg,var(--green),var(--cyan)); }
.mini-title { font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--text3); margin-bottom:12px; display:flex; align-items:center; gap:7px; }

.stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.stat-box  { padding:9px 6px; border-radius:7px; background:var(--surface2); border:1px solid var(--border); text-align:center; transition:all 0.2s; }
.stat-box:hover { border-color:var(--border2); transform:translateY(-2px); }
.stat-num { font-family:var(--mono); font-size:18px; font-weight:700; line-height:1; }
.stat-key { font-family:var(--mono); font-size:8px; color:var(--text3); margin-top:4px; letter-spacing:0.5px; }

.dl-list { display:flex; flex-direction:column; gap:7px; }
.dl-btn  { display:flex; align-items:center; gap:10px; padding:9px 13px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; text-decoration:none; border:none; transition:all 0.2s; font-family:var(--sans); position:relative; overflow:hidden; }
.dl-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent); transform:translateX(-120%); transition:transform 0.4s; }
.dl-btn:hover::before { transform:translateX(120%); }
.dl-orig { background:var(--surface2); color:var(--text2); border:1px solid var(--border2); }
.dl-orig:hover { transform:translateX(3px); }
.dl-lq   { background:var(--amber-dim); color:#d4a800; border:1px solid rgba(255,190,0,0.3); }
.dl-lq:hover { transform:translateX(3px); }
.dl-hq   { background:linear-gradient(135deg,rgba(0,212,255,0.15),rgba(157,124,255,0.15)); color:var(--cyan); border:1px solid rgba(0,212,255,0.3); box-shadow:0 0 16px rgba(0,212,255,0.15); }
.dl-hq:hover { box-shadow:0 0 24px rgba(0,212,255,0.3); transform:translateY(-2px); }

.history-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:16px 18px; position:relative; overflow:hidden; }
.history-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--purple),var(--cyan)); }
.hist-hdr   { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.hist-title { font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--text3); }
.hist-clear { font-family:var(--mono); font-size:9px; cursor:pointer; color:var(--red); background:none; border:none; padding:0; opacity:0.7; transition:opacity 0.2s; }
.hist-clear:hover { opacity:1; }
.hist-row  { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; }
.hist-item { flex-shrink:0; width:80px; cursor:pointer; display:flex; flex-direction:column; gap:4px; align-items:center; }
.hist-thumb { width:80px; height:80px; border-radius:7px; overflow:hidden; border:1px solid var(--border2); background:var(--surface2); transition:all 0.2s; }
.hist-thumb:hover { border-color:var(--cyan); box-shadow:0 0 10px rgba(0,212,255,0.2); transform:scale(1.04); }
.hist-thumb img { width:100%; height:100%; object-fit:cover; }
.hist-badge { font-family:var(--mono); font-size:8px; font-weight:700; padding:1px 6px; border-radius:3px; }
.hb-e { background:var(--green-dim); color:var(--green); border:1px solid rgba(0,232,154,0.3); }
.hb-s { background:var(--cyan-dim);  color:var(--cyan);  border:1px solid rgba(0,212,255,0.3); }
.hist-fname { font-family:var(--mono); font-size:8px; color:var(--text3); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; width:100%; text-align:center; }

.modal-bg { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.88); display:flex; align-items:center; justify-content:center; animation:fadeUp 0.15s; }
.modal-inner { max-width:90vw; max-height:90vh; position:relative; }
.modal-inner img { max-width:90vw; max-height:85vh; object-fit:contain; border-radius:10px; border:1px solid var(--border2); box-shadow:0 0 60px rgba(0,0,0,0.6); }
.modal-close { position:absolute; top:-14px; right:-14px; width:32px; height:32px; border-radius:50%; background:var(--surface); border:1px solid var(--border2); color:var(--text); font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.modal-close:hover { background:var(--red-dim); color:var(--red); border-color:rgba(255,77,106,0.4); }
.modal-label { text-align:center; margin-top:10px; font-family:var(--mono); font-size:11px; color:var(--text3); }
`;

export default function App() {
  const [file,        setFile]       = useState(null);
  const [preview,     setPreview]    = useState(null);
  const [loading,     setLoading]    = useState(false);
  const [result,      setResult]     = useState(null);
  const [error,       setError]      = useState(null);
  const [dragging,    setDragging]   = useState(false);
  const [modelStatus, setModelStatus]= useState(null);
  const [dataset,     setDataset]    = useState("ds1");
  const [threshold,   setThreshold]  = useState(300);
  const [zoomSrc,     setZoomSrc]    = useState(null);
  const [zoomLabel,   setZoomLabel]  = useState("");
  const [history,     setHistory]    = useState([]);
  const [loadingModel,setLoadingModel]= useState(false);
  const inputRef = useRef();

  useEffect(() => {
    fetch(`${API_BASE}/model-status`)
      .then(r => r.json())
      .then(d => setModelStatus(d))
      .catch(() => setModelStatus({ any_loaded:false, ds1_loaded:false, ds2_loaded:false }));
  }, []);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f); setResult(null); setError(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const switchDataset = async (ds) => {
    if (ds === dataset) return;
    setDataset(ds);
    setLoadingModel(true);
    try {
      const fd = new FormData();
      fd.append("dataset", ds);
      const res  = await fetch(`${API_BASE}/load-model`, { method:"POST", body:fd });
      const data = await res.json();
      setModelStatus(prev => ({
        ...prev,
        ds1_loaded: data.ds1_loaded,
        ds2_loaded: data.ds2_loaded,
        active_dataset: data.active_dataset,
      }));
    } catch(e) {
      console.error("Model switch failed:", e);
    } finally {
      setLoadingModel(false);
    }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const onEnhance = async () => {
    if (!file || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dataset", dataset);
      fd.append("threshold", String(threshold));
      const res  = await fetch(`${API_BASE}/enhance`, { method:"POST", body:fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setHistory(prev => [{
        id: Date.now(), name: file.name,
        thumb: `data:image/png;base64,${data.result}`,
        enhanced: data.enhanced, score: data.blur_score, result: data,
      }, ...prev].slice(0, 8));
    } catch(e) {
      setError(e.message || "Request failed — is the backend running on port 8000?");
    } finally { setLoading(false); }
  };

  const isBlurry = result ? result.blur_score < result.threshold : false;
  const pct = result ? Math.min((result.blur_score / 600) * 100, 100) : 0;
  const sStatus = modelStatus === null ? "loading" : (modelStatus.any_loaded ? "online" : "offline");
  const openZoom = (src, label) => { setZoomSrc(src); setZoomLabel(label); };

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">

        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="logo-mark">R</div>
            <div><div className="logo-text">Restore<span>GAN</span></div></div>
            <span className="logo-badge">v2.0</span>
          </div>
          <div className="nav-pills">
            <span className="nav-pill">5 ResBlocks · BCELoss</span>
            <span className="nav-pill">Variance of Laplacian</span>
            {modelStatus && (
              <>
                <span className={`nav-pill ${modelStatus.ds1_loaded ? "green":"red"}`}>DS1 {modelStatus.ds1_loaded ? "✓":"✗"}</span>
                <span className={`nav-pill ${modelStatus.ds2_loaded ? "green":"red"}`}>DS2 {modelStatus.ds2_loaded ? "✓":"✗"}</span>
              </>
            )}
          </div>
          <div className="nav-status">
            <span className={`dot ${sStatus}`}/>
            <span style={{color: sStatus==="online" ? "var(--green)" : sStatus==="offline" ? "var(--red)" : "var(--amber)"}}>
              {sStatus==="loading" ? "Connecting…" : sStatus==="online" ? "API Online" : "API Offline"}
            </span>
          </div>
        </nav>

        <div className="grid">
          <aside className="sidebar">

            {/* Upload */}
            <div className="sb-section">
              <div className="sb-label">Upload Image</div>
              <div className={`dz ${dragging?"drag":""}`}
                onDragOver={e=>{e.preventDefault();setDragging(true)}}
                onDragLeave={()=>setDragging(false)}
                onDrop={onDrop}
                onClick={()=>inputRef.current?.click()}>
                <input ref={inputRef} type="file" accept="image/*"
                  style={{display:"none"}}
                  onChange={e=>handleFile(e.target.files[0])}/>
                {preview ? (
                  <>
                    <img src={preview} className="dz-preview" alt="preview"/>
                    <div className="dz-overlay"><span className="dz-fname">{file?.name}</span></div>
                  </>
                ) : (
                  <>
                    <div className="dz-icon">🩺</div>
                    <div className="dz-title">Drop image here</div>
                    <div className="dz-sub">or click to browse</div>
                    <div className="dz-fmts">{["PNG","JPG","TIFF","BMP"].map(f=><span key={f} className="fmt">{f}</span>)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Model Select */}
            <div className="sb-section">
              <div className="sb-label">Model Selection</div>
              <div className="model-tabs">
                {[
                  { id:"ds1", icon:"🧬", name:"Cancer Detection",   detail:"5 ResBlocks · Sigmoid", badge:"PCAM · DS1",   cls:"" },
                  { id:"ds2", icon:"🔬", name:"Colorectal Texture", detail:"6 ResBlocks · Tanh",    badge:"KATHER · DS2", cls:"ds2" },
                ].map(m => (
                  <div key={m.id}
                    className={`model-tab ${dataset===m.id ? `active ${m.cls}`:""}`}
                    onClick={()=>switchDataset(m.id)}>
                    <span className="mt-icon">{loadingModel && dataset === m.id ? "⏳" : m.icon}</span>
                    <div className="mt-name">{m.name}</div>
                    <div className="mt-detail">{m.detail}</div>
                    <span className="mt-badge">{m.badge}</span>
                  </div>
                ))}
              </div>
              {loadingModel && (
                <div className="model-unavail" style={{marginTop:8, background:"var(--cyan-dim)", borderColor:"rgba(0,212,255,0.3)", color:"var(--cyan)"}}>
                  ⏳ Loading {dataset.toUpperCase()} model…
                </div>
              )}
              {!loadingModel && modelStatus && !modelStatus[`${dataset}_loaded`] && (
                <div className="model-unavail" style={{marginTop:8}}>
                  ⚠ {dataset.toUpperCase()} model file not found in backend/
                </div>
              )}
            </div>

            {/* Threshold */}
            <div className="sb-section">
              <div className="sb-label">Blur Threshold</div>
              <div className="thr-row">
                <div>
                  <div className="thr-val">{threshold}</div>
                  <div className="thr-hint">VoL threshold</div>
                </div>
                <div style={{fontSize:11,color:"var(--text3)",textAlign:"right"}}>
                  {threshold < 200 ? "Very sensitive" : threshold < 350 ? "Balanced" : "Conservative"}
                </div>
              </div>
              <input type="range" min="50" max="600" step="25"
                value={threshold} onChange={e=>setThreshold(Number(e.target.value))}/>
              <div className="thr-labels">
                <span>50 · sensitive</span>
                <span>300 · default</span>
                <span>600 · strict</span>
              </div>
            </div>

            {/* Pipeline */}
            <div className="sb-section">
              <div className="sb-label">Pipeline</div>
              <div className="pipeline">
                {[
                  ["Upload histopathology image", true],
                  ["Resize to 96×96 + GaussianBlur(k=7, σ=2–3)", false],
                  ["Compute Variance of Laplacian blur score", false],
                  [`Score < ${threshold} → GAN enhances`, false],
                  [`Score ≥ ${threshold} → original returned`, false],
                ].map(([t, active], i) => (
                  <div className="pipe-step" key={i}>
                    <span className={`pipe-num ${active?"active":""}`}>{String(i+1).padStart(2,"0")}</span>
                    <span className="pipe-text">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Run */}
            <div className="sb-section">
              <button className={`run-btn ${file && !loading ? "on":"off"}`}
                onClick={onEnhance} disabled={!file || loading}>
                {loading ? <><span className="spinner"/>Processing…</> : <>▶ &nbsp;Run Restore-GAN</>}
              </button>
              {error && <div className="err-box"><span>⚠</span><span>{error}</span></div>}
            </div>

          </aside>

          <main className="content">

            {!result && !loading && (
              <div className="empty">
                <div className="empty-icon">🔬</div>
                <div className="empty-title">Awaiting Input</div>
                <div className="empty-sub">Upload a histopathology image and click Run to enhance with the GAN model</div>
                <div className="empty-dots">
                  <span className="empty-dot ed-c">PSNR</span>
                  <span className="empty-dot ed-g">SSIM</span>
                  <span className="empty-dot ed-p">Restore-GAN</span>
                </div>
              </div>
            )}

            {result && (
              <div className="result">

                <div className="result-hdr">
                  <div>
                    <div className="result-title">Enhancement Result</div>
                    <div className="result-sub">{result.decision}</div>
                    <div className="stat-inline">
                      <span className="si-chip">{result.model_name}</span>
                      <span className="si-chip">{result.orig_size}</span>
                      <span className="elapsed-tag">{result.elapsed_ms}ms</span>
                    </div>
                  </div>
                  <span className={`result-tag ${result.enhanced ? "rt-enhanced":"rt-sharp"}`}>
                    {result.enhanced ? "✓ Enhanced" : "◎ Already Sharp"}
                  </span>
                </div>

                {/* Blur Score */}
                <div className="bcard">
                  <div className="bcard-top">
                    <div>
                      <div className="bcard-lbl">Blur Score — Variance of Laplacian</div>
                      <div className="bcard-desc">Computed on LQ image · threshold {result.threshold}</div>
                    </div>
                    <div>
                      <div className={`bcard-val ${isBlurry?"blurry":"sharp"}`}>{result.blur_score.toFixed(1)}</div>
                      <div className="bcard-unit">VoL score</div>
                    </div>
                  </div>
                  <div className="bar-wrap">
                    <div className="bar-bg">
                      <div className="bar-thr" style={{left:`${(result.threshold/600)*100}%`}}/>
                      <div className={`bar-fg ${isBlurry?"blurry":"sharp"}`} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                  <div className="bar-lbls">
                    <span>0 — very blurry</span>
                    <span>▲ {result.threshold}</span>
                    <span>600 — very sharp</span>
                  </div>
                  <div className={`verdict ${isBlurry?"blurry":"sharp"}`}>
                    <span>{isBlurry ? "⚠" : "✓"}</span>
                    {isBlurry
                      ? `Score ${result.blur_score.toFixed(1)} below threshold ${result.threshold} — GAN enhancement applied`
                      : `Score ${result.blur_score.toFixed(1)} exceeds threshold ${result.threshold} — image already sharp`}
                  </div>
                </div>

                {/* Gain Banner */}
                {result.psnr_gain !== null && (
                  <div className="gain-banner">
                    <div>
                      <div className="gain-title">Quality Improvement</div>
                      <div className="gain-sub">GAN output vs blurred input (relative to HQ reference 96×96)</div>
                    </div>
                    <div className="gain-chips">
                      <div className="gain-chip">
                        {result.psnr_gain >= 0 ? "+" : ""}{result.psnr_gain} dB
                        <small>PSNR GAIN</small>
                      </div>
                      <div className="gain-chip">
                        {result.ssim_gain >= 0 ? "+" : ""}{result.ssim_gain}
                        <small>SSIM GAIN</small>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3-Way Comparison */}
                <div className="triple-card">
                  <div className="tc-hdr">
                    <div>
                      <div className="tc-title">3-Way Image Comparison</div>
                      <div className="tc-sub">Original → Degraded LQ → GAN-Enhanced · click any image to zoom</div>
                    </div>
                    <span className="tc-tag">96 × 96 px</span>
                  </div>
                  <div className="triple-row">

                    {/* Original */}
                    <div className="img-col">
                      <div className="img-col-hdr">
                        <span className="icol-lbl orig">Original</span>
                        <span className="icol-badge ib-orig">INPUT</span>
                      </div>
                      <div className="img-frame" onClick={()=>openZoom(`data:image/png;base64,${result.original}`,"Original Input")}>
                        <img src={`data:image/png;base64,${result.original}`} alt="Original"/>
                        <div className="zoom-hint">🔍</div>
                      </div>
                      <div className="img-meta">{result.orig_size} · uploaded</div>
                      {result.stats_lq && (
                        <div className="metric-pair">
                          <div className="metric-chip">
                            <div className="mc-val" style={{color:"var(--text2)"}}>{result.stats_lq.mean}</div>
                            <div className="mc-key">Mean</div>
                          </div>
                          <div className="metric-chip">
                            <div className="mc-val" style={{color:"var(--text2)"}}>{result.stats_lq.std}</div>
                            <div className="mc-key">Std Dev</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="arr-col"><span>→</span></div>

                    {/* Blurred LQ */}
                    <div className="img-col">
                      <div className="img-col-hdr">
                        <span className="icol-lbl lq">Blurred LQ</span>
                        <span className="icol-badge ib-lq">DEGRADED</span>
                      </div>
                      <div className="img-frame lq-frame" onClick={()=>openZoom(`data:image/png;base64,${result.blurred}`,"Blurred LQ")}>
                        <img src={`data:image/png;base64,${result.blurred}`} alt="Blurred LQ"/>
                        <div className="zoom-hint">🔍</div>
                      </div>
                      <div className="img-meta amber">
                        Score: {result.blur_score.toFixed(1)}<br/>GaussBlur k=7 · σ=2–3
                      </div>
                      <div className="metric-pair">
                        <div className="metric-chip mc-amber">
                          <div className="mc-val amber">{result.psnr_lq}</div>
                          <div className="mc-key">PSNR (dB)</div>
                        </div>
                        <div className="metric-chip mc-amber">
                          <div className="mc-val amber">{result.ssim_lq?.toFixed(4)}</div>
                          <div className="mc-key">SSIM</div>
                        </div>
                      </div>
                    </div>

                    <div className="arr-col"><span>→</span></div>

                    {/* Enhanced HQ */}
                    <div className="img-col">
                      <div className="img-col-hdr">
                        <span className={`icol-lbl ${result.dataset==="ds2" ? "purple":"hq"}`}>
                          {result.enhanced ? "Enhanced HQ" : "Sharp (no change)"}
                        </span>
                        <span className={`icol-badge ${result.dataset==="ds2" ? "ib-purple":"ib-hq"}`}>
                          {result.enhanced ? "RESTORED" : "ORIGINAL"}
                        </span>
                      </div>
                      <div className={`img-frame ${result.enhanced ? (result.dataset==="ds2" ? "":"hq-frame") : ""}`}
                        onClick={()=>openZoom(`data:image/png;base64,${result.result}`, result.enhanced ? "Enhanced HQ":"Original (sharp)")}>
                        <img src={`data:image/png;base64,${result.result}`} alt="Enhanced HQ"/>
                        <div className="zoom-hint">🔍</div>
                      </div>
                      <div className={`img-meta ${result.dataset==="ds2" ? "":"cyan"}`}>
                        {result.model_name}
                      </div>
                      {result.psnr_hq !== null && result.psnr_hq !== undefined ? (
                        <div className="metric-pair">
                          <div className={`metric-chip ${result.dataset==="ds2" ? "mc-purple":"mc-cyan"}`}>
                            <div className={`mc-val ${result.dataset==="ds2" ? "purple":"cyan"}`}>{result.psnr_hq}</div>
                            <div className="mc-key">PSNR (dB)</div>
                          </div>
                          <div className={`metric-chip ${result.dataset==="ds2" ? "mc-purple":"mc-cyan"}`}>
                            <div className={`mc-val ${result.dataset==="ds2" ? "purple":"cyan"}`}>{result.ssim_hq?.toFixed(4)}</div>
                            <div className="mc-key">SSIM</div>
                          </div>
                        </div>
                      ) : (
                        <div className="metric-pair">
                          <div className="metric-chip mc-cyan"><div className="mc-val cyan">—</div><div className="mc-key">PSNR (dB)</div></div>
                          <div className="metric-chip mc-cyan"><div className="mc-val cyan">—</div><div className="mc-key">SSIM</div></div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Bottom Row */}
                <div className="brow">
                  <div className="mini-card mc-cyan-top">
                    <div className="mini-title">Statistics</div>
                    <div className="stat-grid">
                      <div className="stat-box">
                        <div className="stat-num" style={{color: isBlurry ? "var(--amber)":"var(--cyan)"}}>{result.blur_score.toFixed(0)}</div>
                        <div className="stat-key">BLUR SCORE</div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-num" style={{color:"var(--purple)"}}>{result.threshold}</div>
                        <div className="stat-key">THRESHOLD</div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-num" style={{color: result.enhanced ? "var(--green)":"var(--cyan)"}}>{result.enhanced ? "YES":"NO"}</div>
                        <div className="stat-key">ENHANCED</div>
                      </div>
                      {result.psnr_gain !== null && (
                        <>
                          <div className="stat-box">
                            <div className="stat-num" style={{color: result.psnr_gain >= 0 ? "var(--green)":"var(--red)"}}>{result.psnr_gain >= 0 ? "+":""}{result.psnr_gain}</div>
                            <div className="stat-key">PSNR GAIN</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-num" style={{color: result.ssim_gain >= 0 ? "var(--green)":"var(--red)", fontSize:14}}>{result.ssim_gain >= 0 ? "+":""}{result.ssim_gain}</div>
                            <div className="stat-key">SSIM GAIN</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-num" style={{color:"var(--text2)", fontSize:14}}>{result.elapsed_ms}ms</div>
                            <div className="stat-key">ELAPSED</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mini-card mc-green-top">
                    <div className="mini-title">Download</div>
                    <div className="dl-list">
                      <a href={`data:image/png;base64,${result.original}`} download="original.png" className="dl-btn dl-orig">↓ &nbsp;Original image</a>
                      <a href={`data:image/png;base64,${result.blurred}`}  download="blurred_lq.png" className="dl-btn dl-lq">↓ &nbsp;Blurred LQ image</a>
                      <a href={`data:image/png;base64,${result.result}`}
                        download={result.enhanced ? "enhanced_hq.png":"original_sharp.png"}
                        className="dl-btn dl-hq">
                        ↓ &nbsp;{result.enhanced ? "Enhanced HQ output":"Sharp original"}
                      </a>
                    </div>
                  </div>
                </div>

                {/* History */}
                {history.length > 1 && (
                  <div className="history-card">
                    <div className="hist-hdr">
                      <div className="hist-title">Session History ({history.length})</div>
                      <button className="hist-clear" onClick={()=>setHistory([])}>Clear</button>
                    </div>
                    <div className="hist-row">
                      {history.map(h => (
                        <div className="hist-item" key={h.id} onClick={()=>setResult(h.result)}>
                          <div className="hist-thumb"><img src={h.thumb} alt={h.name}/></div>
                          <span className={`hist-badge ${h.enhanced ? "hb-e":"hb-s"}`}>{h.enhanced ? "ENH":"SHP"}</span>
                          <span className="hist-fname">{h.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </main>
        </div>
      </div>

      {zoomSrc && (
        <div className="modal-bg" onClick={()=>setZoomSrc(null)}>
          <div className="modal-inner" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setZoomSrc(null)}>✕</button>
            <img src={zoomSrc} alt={zoomLabel}/>
            <div className="modal-label">{zoomLabel} — click outside to close</div>
          </div>
        </div>
      )}
    </>
  );
}