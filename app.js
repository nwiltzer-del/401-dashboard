/* =====================================================================
   401 DES SEIGNEURS — prototype
   One shared "event" model underneath every surface. A deficiency on a
   grid cell and a "come to 403" capture are the SAME object, different
   fields. Nothing persists between sessions yet — this is to feel the loop.
   ===================================================================== */

// ---- Real 401 structure, from the plans + master checklist ----
const STAGES = [
  "Frames/Doors/Baseboards","Primer paint","Tile","Grout","Flooring",
  "Cabinets & Vanities","Countertops","Plumbing finish","Electrical finish","Caulking",
  "Stairs","Interior hardware","Cleaning","Final paint","MEP finish",
  "Corrections & electrical fixtures","Cleaning (2nd pass)","Blinds","Balcony/window hardware","Seuille Gran.",
  "ID quinc. Porte","LED trim strip","Lighting check","Dropsill",
  "Ceiling/Access hatch","Balcony guardrail","Balcony divider","Balcony outlet"
];

// unit types + areas pulled from the architectural sheets
const FLOORS = {
  "RDC":{units:[
      ["121","3½",null,"seed-hi"],["120","M1"],["119","M1"],["118","M1"],["117","M1"],
      ["116","M1"],["115","M1"],["114","M1"],["113","M1"],["112","M1"],["111","M1"],
      ["110","M1"],["109","M1"],["103","M1"],["127","M1"],["126","M1"],["125","M1"],
      ["124","M1"],["123","M1"],["102","M1"]
    ],
    common:["Bike Room (104)","Sprinkler (107)","Employee Office","Commercial (122)",
      "Mailroom","Elec. Shaft","Garbage Chute","Courtyard Access"]},
  "2e":{units:[
      ["221","5½ M1"],["220","5½ M1"],["219","5½ M1"],["218","5½ M1"],["217","5½ M1"],
      ["216","5½ M1"],["215","5½ M1"],["214","5½ M3"],["213","5½ M4"],["212","5½ M1"],
      ["211","5½ M1"],["210","5½ M1"],["209","5½ M1"],["208","3½ A13"],["207","3½ A11"],
      ["205","4½ B1"],["203","5½ M1"],["202","5½ M1"]
    ],
    common:["Gym (2-G)","Lobby 2e","Telecom (2-SE)","Garbage Chute (2-CD)","Pods (2-WO)"]},
  "3e":{units:[["309","A9"],["308","A10"],["307","A11"],["306","A12"],["305","A3"],
      ["304","S2"],["303","A4"],["302","A1"]],common:["Corridor 3e","Elec. Shaft"]},
  "4e":{units:[["409","A9"],["408","A10"],["407","A11"],["406","A12"],["405","A3"],
      ["404","S2"],["403","A4"],["402","A1"]],common:["Corridor 4e","Elec. Shaft"]},
  "5e":{units:[["509","A9"],["508","A10"],["507","A11"],["506","A12"],["505","A3"],
      ["504","S2"],["503","A4"],["502","A1"]],common:["Corridor 5e","Elec. Shaft"]},
  "6e":{units:[["622","B7"],["621","B8"],["623","C2"],["620","A1"],["624","A5"],
      ["619","A9"],["625","A10"],["618","A11"],["626","A12"],["617","A3"],
      ["616","S2"],["615","A4"],["614","A1"]],common:["Corridor 6e","Elec. Shaft"]},
  "7e":{units:[["709","B7"],["707","B8"],["704","C2"],["702","A1"],["701","A5"]],
    common:["Corridor 7e","Terrasse 7e"]},
  "8e":{units:[["809","B7"],["807","B8"],["804","C2"],["802","A1"],["801","A5"]],
    common:["Corridor 8e"]},
  "9e":{units:[["909","B7"],["907","B8"],["904","C2"],["902","A1"],["901","A5"]],
    common:["Corridor 9e"]}
};

// ---- State ----
let state = {};          // state[floor][unitId][stageIndex] = 'done'|'prog'|'none'|'defic'
let stageNotes = {};     // stageNotes["6e/622/6"] = {text, photos, flag}
let events = [];         // shared spine: every capture + status change
let currentFloor = "6e";
let capture = {};        // in-progress capture form

// seed some realistic progress so it doesn't open empty
function seed(){
  for(const f in FLOORS){
    state[f]={};
    const list=[...FLOORS[f].units.map(u=>u[0]), ...FLOORS[f].common];
    list.forEach((id,idx)=>{
      state[f][id]=STAGES.map((_,si)=>{
        // higher floors + later = less done; RDC/2e mostly done
        const base = (f==="RDC"||f==="2e") ? 0.82 : (f==="6e"?0.6:0.7);
        const r=Math.random();
        if(r < base - si*0.018) return 'done';
        if(r < base - si*0.018 + 0.12) return 'prog';
        return 'none';
      });
    });
  }
  // a couple of real deficiencies from the sheet
  setStage("6e","622",6,'defic',{text:"Backsplash — bathroom (BS) missing",photos:1,flag:false});
  setStage("2e","221",6,'defic',{text:"Backsplash bathroom missing",photos:0,flag:true,flagType:"Next meeting"});
  setStage("6e","626",7,'prog');
}
function setStage(f,u,si,val,note){
  if(!state[f]) state[f]={};
  if(!state[f][u]) state[f][u]=STAGES.map(()=> 'none');
  state[f][u][si]=val;
  if(note) stageNotes[`${f}/${u}/${si}`]=note;
}

// ---- Navigation ----
let currentView='home';
function go(v){
  currentView=v;
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('on'));
  const nb=document.getElementById('nav-'+v); if(nb) nb.classList.add('on');
  if(v==='progress') renderGrid();
  if(v==='flags') renderFlags();
  if(v==='deficiencies') renderDeficiencies();
  if(v==='home') renderHome();
  // back button shows on every screen except home
  document.getElementById('backbtn').classList.toggle('show', v!=='home');
  window.scrollTo(0,0);
}
function goBack(){
  // if a sheet is open, close that first
  if(document.getElementById('sheet').classList.contains('show')){ closeSheet(); return; }
  go('home');
}

// ---- HOME render ----
function renderHome(){
  // stats
  let doneUnits=0,total=0,defic=0,flags=0;
  for(const f in state){
    for(const u in state[f]){
      const arr=state[f][u];
      if(arr.every(s=>s==='done')) doneUnits++;
      total++;
      defic+=arr.filter(s=>s==='defic').length;
    }
  }
  events.forEach(e=>{if(e.flag && !e.resolved) flags++;});
  document.getElementById('tile-done').textContent=doneUnits;
  document.getElementById('tile-defic').textContent=defic;
  document.getElementById('tile-flags').textContent=flags;

  const feed=document.getElementById('feed');
  const todays=events.filter(e=>e.today);
  document.getElementById('feed-count').textContent=todays.length;
  if(todays.length===0){
    document.getElementById('feed-empty').style.display='';
    [...feed.querySelectorAll('.event')].forEach(n=>n.remove());
    return;
  }
  document.getElementById('feed-empty').style.display='none';
  [...feed.querySelectorAll('.event')].forEach(n=>n.remove());
  todays.slice().reverse().forEach(e=> feed.appendChild(eventNode(e)));
}

function eventNode(e){
  const n=document.createElement('div');n.className='event';
  const colors={done:'var(--done)',prog:'var(--prog)',none:'var(--none)',defic:'var(--defic)',event:'var(--hivis)'};
  n.innerHTML=`
    <div class="dot" style="background:${colors[e.kindColor]||'var(--hivis)'}"></div>
    <div class="body">
      <div class="line1">${e.title}</div>
      ${e.note?`<div class="line2">${e.note}</div>`:''}
      <div class="tags">
        ${e.loc?`<span class="chip loc">📍 ${e.loc}</span>`:''}
        ${e.who?`<span class="chip">${e.who}</span>`:''}
        ${e.flag?`<span class="chip flag">⚑ ${e.flagType||'Flagged'}</span>`:''}
      </div>
      ${e.time?`<div class="time">${e.time}</div>`:''}
    </div>
    <button class="mailbtn" title="Email this">✉</button>`;
  n.querySelector('.mailbtn').onclick=(ev)=>{ev.stopPropagation();openEmailDraft(e);};
  return n;
}

// ---- PROGRESS GRID render ----
function renderGrid(){
  const fr=document.getElementById('floor-row');
  fr.innerHTML='';
  Object.keys(FLOORS).forEach(f=>{
    const c=document.createElement('button');
    c.className='floor-chip'+(f===currentFloor?' on':'');
    c.textContent=f; c.onclick=()=>{currentFloor=f;renderGrid();};
    fr.appendChild(c);
  });
  const gs=document.getElementById('grid-scroll');
  gs.innerHTML='';
  const fdata=FLOORS[currentFloor];
  const block=document.createElement('div');block.className='unit-block';

  const rows=[
    ...fdata.units.map(u=>({id:u[0],type:u[1],common:false})),
    ...fdata.common.map(c=>({id:c,type:'Common area',common:true}))
  ];
  rows.forEach(r=> block.appendChild(unitCard(currentFloor,r)));
  gs.appendChild(block);
}

function unitCard(f,r){
  const arr=state[f][r.id]||STAGES.map(()=>'none');
  const done=arr.filter(s=>s==='done').length;
  const pct=Math.round(done/STAGES.length*100);
  const hasDefic=arr.some(s=>s==='defic');

  const card=document.createElement('div');card.className='unit-card';
  const label = r.common ? r.id : ('Unité '+r.id);
  card.innerHTML=`
    <div class="unit-top">
      <div>
        <div class="unit-name">${label} ${hasDefic?'<span style="color:var(--defic)">▲</span>':''}</div>
        <div class="unit-sub">${r.type}</div>
      </div>
      <div class="unit-prog">
        <div class="pct" style="color:${pct===100?'var(--done)':'var(--ink)'}">${pct}%</div>
        <div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${hasDefic?'var(--defic)':'var(--done)'}"></div></div>
      </div>
      <span class="chev">›</span>
    </div>
    <div class="stages"></div>`;
  card.querySelector('.unit-top').onclick=()=>{
    card.classList.toggle('open');
    if(card.classList.contains('open')) fillStages(card,f,r);
  };
  return card;
}

function fillStages(card,f,r){
  const wrap=card.querySelector('.stages');
  if(wrap.dataset.filled) return;
  wrap.dataset.filled="1";
  STAGES.forEach((nm,si)=>{
    const val=state[f][r.id][si];
    const note=stageNotes[`${f}/${r.id}/${si}`];
    const cell=document.createElement('div');
    cell.className='stage '+val;
    cell.innerHTML=`<span class="sdot"></span><span><span class="snm">${nm}</span>${note&&note.text?`<span class="snote">▲ ${note.text}</span>`:''}</span>`;
    cell.onclick=()=> openStageSheet(f,r,si,cell);
    wrap.appendChild(cell);
  });
}

// ---- FLAGS render ----
function fullStamp(ts){
  if(!ts) return '';
  const d=new Date(ts);
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' · '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
}
function flagNode(e){
  const n=document.createElement('div');
  n.className='event'+(e.resolved?' resolved':'');
  n.innerHTML=`
    <button class="flagdot ${e.resolved?'resolved':''}" title="${e.resolved?'Mark not addressed':'Mark addressed'}">${e.resolved?'✓':'⚑'}</button>
    <div class="body">
      <div class="line1">${e.title}</div>
      ${e.note?`<div class="line2">${e.note}</div>`:''}
      <div class="tags">
        ${e.loc?`<span class="chip loc">📍 ${e.loc}</span>`:''}
        <span class="chip flag${e.resolved?' resolved':''}">${e.resolved?'✓ Addressed':'⚑ '+(e.flagType||'Flagged')}</span>
      </div>
      ${e.ts?`<div class="time">${fullStamp(e.ts)}</div>`:''}
    </div>
    <button class="mailbtn" title="Email this">✉</button>`;
  n.querySelector('.flagdot').onclick=(ev)=>{ev.stopPropagation(); e.resolved=!e.resolved; renderFlags(); renderHome();};
  n.querySelector('.mailbtn').onclick=(ev)=>{ev.stopPropagation();openEmailDraft(e);};
  return n;
}
function renderFlags(){
  const ff=document.getElementById('flag-feed');
  [...ff.querySelectorAll('.event, .flags-divider')].forEach(n=>n.remove());
  const flagged=events.filter(e=>e.flag);
  document.getElementById('flag-empty').style.display= flagged.length?'none':'';
  const byOldest=(a,b)=>(a.ts||0)-(b.ts||0);
  const open=flagged.filter(e=>!e.resolved).sort(byOldest);
  const done=flagged.filter(e=>e.resolved).sort(byOldest);
  open.forEach(e=> ff.appendChild(flagNode(e)));
  if(done.length){
    const hdr=document.createElement('div');
    hdr.className='section-label flags-divider';
    hdr.style.margin='18px 4px 8px';
    hdr.textContent='Addressed';
    ff.appendChild(hdr);
    done.forEach(e=> ff.appendChild(flagNode(e)));
  }
}

// ---- DEFICIENCIES render (every open deficiency across the whole grid,
// not just today's log — a deficiency logged last week is still open) ----
function collectDeficiencies(){
  const out=[];
  for(const f in state){
    const fdata=FLOORS[f];
    const rows=[
      ...fdata.units.map(u=>({id:u[0],type:u[1],common:false})),
      ...fdata.common.map(c=>({id:c,type:'Common area',common:true}))
    ];
    rows.forEach(r=>{
      const arr=state[f][r.id];
      if(!arr) return;
      arr.forEach((val,si)=>{
        if(val!=='defic') return;
        const note=stageNotes[`${f}/${r.id}/${si}`]||{};
        const label=r.common?r.id:('Unité '+r.id);
        out.push({
          title:`${label} · ${STAGES[si]}`,
          note:note.text||'', loc:`${f} · ${label}`, who:'', time:'',
          photos:note.photos||0, flag:note.flag||false, flagType:note.flagType,
          kindColor:'defic'
        });
      });
    });
  }
  return out;
}
function renderDeficiencies(){
  const df=document.getElementById('defic-feed');
  [...df.querySelectorAll('.event')].forEach(n=>n.remove());
  const list=collectDeficiencies();
  document.getElementById('defic-empty').style.display= list.length?'none':'';
  list.forEach(e=> df.appendChild(eventNode(e)));
}

/* ===================== SHEET / CAPTURE ===================== */
let sheetMode='capture';
let stageCtx=null;

function nowStr(){
  const d=new Date();
  let h=d.getHours(),m=d.getMinutes();const ap=h>=12?'PM':'AM';h=h%12||12;
  return `${h}:${String(m).padStart(2,'0')} ${ap}`;
}
function today(){return new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});}

const CAP_PRESETS={
  capture:   {title:"Quick capture", color:'event'},
  deficiency:{title:"Log a deficiency", color:'defic'},
  attendance:{title:"Attendance", color:'event'},
  delay:     {title:"Log a delay", color:'prog'},
  flag:      {title:"New flag", color:'event'}
};

function openCapture(mode='capture'){
  sheetMode=mode; stageCtx=null;
  capture={loc:'',who:'',note:'',photos:0,flag:false,flagType:'Next meeting',status:null,severity:null,trades:{}};
  if(mode==='flag'){ capture.flag=true; capture.flagType='Follow up'; }
  const p=CAP_PRESETS[mode];
  document.getElementById('sheet-title').textContent=p.title;
  document.getElementById('sheet-auto').innerHTML=`⏱ auto-stamped <b>${today()} · ${nowStr()}</b>`;
  document.getElementById('sheet-body').innerHTML=buildCaptureBody(mode);
  document.getElementById('save-btn').textContent = mode==='attendance'?'Save attendance':mode==='flag'?'Save flag':'Save to log';
  wireCaptureBody(mode);
  showSheet();
}

function allLocations(){
  const out=[];
  for(const f in FLOORS){
    FLOORS[f].units.forEach(u=>out.push(`${f} · Unité ${u[0]}`));
    FLOORS[f].common.forEach(c=>out.push(`${f} · ${c}`));
  }
  return out;
}
const TRADES=[
  // finishing — most frequent day-to-day taps
  "Painter","Electrician (finish)","Plumber (finish)","Ceramic/Tile","Countertops & Backsplash",
  "Cabinetry/Millwork","Flooring","Wood stairs","Trim/Doors/Hardware","Railings/Guardrails",
  "Blinds/Window coverings","General labour","Cleaning",
  // rough-in — still active, less frequent
  "Sprinklers/Fire protection","HVAC/Ventilation","Low voltage/Data","Drywall install","Drywall taping","Insulation",
  // structure & envelope — rare now, kept for delays/earlier-phase logging
  "Demolition","Excavation","Concrete","Structural steel/Framing","Metal-stud framing",
  "Masonry","Waterproofing/Membrane","Roofing","Exterior windows","Metal cladding","Landscaping"
];

function buildCaptureBody(mode){
  if(mode==='attendance'){
    return `<div class="field"><label>Crews on site today — tap to set headcount</label>
      <div id="att-list"></div></div>`;
  }
  if(mode==='flag'){
    return `<div class="field"><label>What's the flag</label>
      <textarea id="cap-note" placeholder="e.g. Call cleaners back to unit 424"></textarea></div>
      <div class="field"><label>Where (optional)</label>
        <select class="opt-select" id="cap-loc">
          <option value="">Select unit or area…</option>
          ${allLocations().map(l=>`<option>${l}</option>`).join('')}
        </select></div>
      <div class="field"><label>Type</label>
        <div class="opt-row" id="cap-flagtype">
          <button class="opt on" data-ft="Follow up">Follow up</button>
          <button class="opt" data-ft="Next meeting">Next meeting</button>
          <button class="opt" data-ft="Waiting on architect">Waiting on architect</button>
          <button class="opt" data-ft="Back-charge">Back-charge</button>
        </div></div>
      <div class="field"><label>Photos</label>
        <div class="photo-row" id="cap-photos">
          <div class="add-photo" onclick="addPhoto()">＋</div>
        </div></div>`;
  }
  let html='';
  // location
  html+=`<div class="field"><label>Where</label>
    <select class="opt-select" id="cap-loc">
      <option value="">Select unit or area…</option>
      ${allLocations().map(l=>`<option>${l}</option>`).join('')}
    </select></div>`;
  // who (not for delay)
  html+=`<div class="field"><label>Who's with you</label>
    <div class="opt-row" id="cap-who">
      ${TRADES.map(t=>`<button class="opt" data-who="${t}">${t}</button>`).join('')}
    </div></div>`;
  // delay severity
  if(mode==='delay'){
    html+=`<div class="field"><label>Impact — this decides what the app does with it</label>
      <div class="opt-row" id="cap-sev">
        <button class="opt" data-sev="Absorbed">Absorbed<br><small style="font-weight:400;opacity:.7">extra hours, no schedule hit — logs to cost trail</small></button>
        <button class="opt" data-sev="Contained">Contained<br><small style="font-weight:400;opacity:.7">one unit, worked around</small></button>
        <button class="opt" data-sev="Propagating">Propagating<br><small style="font-weight:400;opacity:.7">downstream trades need to know</small></button>
      </div></div>`;
  }
  // notes
  html+=`<div class="field"><label>${mode==='delay'?'What happened & why':'Notes'}</label>
    <textarea id="cap-note" placeholder="${mode==='deficiency'?'e.g. Backsplash bathroom missing':'Type or dictate what this is…'}"></textarea></div>`;
  // photos
  html+=`<div class="field"><label>Photos</label>
    <div class="photo-row" id="cap-photos">
      <div class="add-photo" onclick="addPhoto()">＋</div>
    </div></div>`;
  // flag
  html+=`<div class="field">
    <div class="flag-toggle" id="cap-flag" onclick="toggleFlag()">
      <span class="fico">⚑</span>
      <span class="ft"><b>Flag this</b><small>collect it for later — nothing gets buried</small></span>
      <span class="switch"></span>
    </div>
    <div class="flag-sub">
      <div class="opt-row" id="cap-flagtype">
        <button class="opt on" data-ft="Next meeting">Next meeting</button>
        <button class="opt" data-ft="Follow up">Follow up</button>
        <button class="opt" data-ft="Waiting on architect">Waiting on architect</button>
        <button class="opt" data-ft="Back-charge">Back-charge</button>
      </div>
    </div></div>`;
  return html;
}

function wireCaptureBody(mode){
  if(mode==='attendance'){
    const list=document.getElementById('att-list');
    list.innerHTML=TRADES.map(t=>`
      <div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)">
        <span style="flex:1;font-size:15px;font-weight:600">${t}</span>
        <button class="opt" style="width:44px;text-align:center" onclick="attStep('${t}',-1,this)">–</button>
        <span id="att-${t}" style="min-width:26px;text-align:center;font-size:17px;font-weight:750">0</span>
        <button class="opt" style="width:44px;text-align:center" onclick="attStep('${t}',1,this)">+</button>
      </div>`).join('');
    return;
  }
  const loc=document.getElementById('cap-loc');
  if(loc) loc.onchange=e=>capture.loc=e.target.value;
  document.querySelectorAll('#cap-who .opt').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#cap-who .opt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');capture.who=b.dataset.who;
  });
  document.querySelectorAll('#cap-sev .opt').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#cap-sev .opt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');capture.severity=b.dataset.sev;
  });
  const nt=document.getElementById('cap-note');
  if(nt) nt.oninput=e=>capture.note=e.target.value;
  document.querySelectorAll('#cap-flagtype .opt').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#cap-flagtype .opt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');capture.flagType=b.dataset.ft;
  });
}

function attStep(t,d,btn){
  capture.trades[t]=Math.max(0,(capture.trades[t]||0)+d);
  document.getElementById('att-'+t).textContent=capture.trades[t];
}
function addPhoto(){
  capture.photos++;
  const row=document.getElementById('cap-photos');
  const t=document.createElement('div');t.className='photo-thumb';
  t.innerHTML='📷<small>photo '+capture.photos+'</small>';
  row.insertBefore(t,row.firstChild);
}
function toggleFlag(){
  const el=document.getElementById('cap-flag');
  el.classList.toggle('on');capture.flag=el.classList.contains('on');
}

/* ---- Stage cell sheet (from the grid) ---- */
function openStageSheet(f,r,si,cell){
  sheetMode='stage';
  stageCtx={f,r,si,cell};
  const key=`${f}/${r.id}/${si}`;
  const existing=stageNotes[key]||{};
  capture={note:existing.text||'',photos:existing.photos||0,flag:existing.flag||false,
           flagType:existing.flagType||'Next meeting',status:state[f][r.id][si]};
  const label = r.common?r.id:('Unité '+r.id);
  document.getElementById('sheet-title').textContent=`${label} · ${STAGES[si]}`;
  document.getElementById('sheet-auto').innerHTML=`Set status — tap to change`;
  document.getElementById('sheet-body').innerHTML=`
    <div class="field"><label>Status</label>
      <div class="opt-row" id="st-status">
        <button class="opt status-done ${capture.status==='done'?'on':''}" data-st="done">🟢 Complete</button>
        <button class="opt status-prog ${capture.status==='prog'?'on':''}" data-st="prog">🟡 In progress</button>
        <button class="opt status-none ${capture.status==='none'?'on':''}" data-st="none">🔴 Not started</button>
        <button class="opt status-defic ${capture.status==='defic'?'on':''}" data-st="defic">🟠 Deficiency</button>
      </div></div>
    <div id="defic-extra" style="display:${capture.status==='defic'?'block':'none'}">
      <div class="field"><label>What's the deficiency / note</label>
        <textarea id="cap-note" placeholder="e.g. Backsplash bathroom missing">${capture.note}</textarea></div>
      <div class="field"><label>Photos</label>
        <div class="photo-row" id="cap-photos"><div class="add-photo" onclick="addPhoto()">＋</div></div></div>
      <div class="field">
        <div class="flag-toggle ${capture.flag?'on':''}" id="cap-flag" onclick="toggleFlag()">
          <span class="fico">⚑</span><span class="ft"><b>Flag this</b><small>collect it for later</small></span>
          <span class="switch"></span></div>
        <div class="flag-sub">
          <div class="opt-row" id="cap-flagtype">
            <button class="opt ${capture.flagType==='Next meeting'?'on':''}" data-ft="Next meeting">Next meeting</button>
            <button class="opt ${capture.flagType==='Back-charge'?'on':''}" data-ft="Back-charge">Back-charge</button>
            <button class="opt ${capture.flagType==='Waiting on architect'?'on':''}" data-ft="Waiting on architect">Waiting on architect</button>
          </div></div></div>
    </div>`;
  // wire
  document.querySelectorAll('#st-status .opt').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#st-status .opt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');capture.status=b.dataset.st;
    document.getElementById('defic-extra').style.display = b.dataset.st==='defic'?'block':'none';
  });
  const nt=document.getElementById('cap-note'); if(nt) nt.oninput=e=>capture.note=e.target.value;
  document.querySelectorAll('#cap-flagtype .opt').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#cap-flagtype .opt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');capture.flagType=b.dataset.ft;});
  document.getElementById('save-btn').textContent='Save';
  showSheet();
}

/* ---- Save (writes to the shared spine) ---- */
function saveEvent(){
  if(sheetMode==='stage'){
    const {f,r,si}=stageCtx;
    const key=`${f}/${r.id}/${si}`;
    state[f][r.id][si]=capture.status||'none';
    if(capture.status==='defic'||capture.note||capture.flag){
      stageNotes[key]={text:capture.note,photos:capture.photos,flag:capture.flag,flagType:capture.flagType};
    } else { delete stageNotes[key]; }
    // log to spine
    const label=r.common?r.id:('Unité '+r.id);
    const statusWord={done:'marked complete',prog:'in progress',none:'reset',defic:'DEFICIENCY'}[capture.status];
    events.push({
      title:`${label} · ${STAGES[si]} — ${statusWord}`,
      note:capture.note||'', loc:`${f} · ${label}`, who:'', time:nowStr(), ts:Date.now(), today:true,
      photos:capture.photos||0, flag:capture.flag, flagType:capture.flagType, resolved:false,
      kindColor:capture.status
    });
    closeSheet();
    // update just the tapped cell + the unit's summary — keep the card open
    // so multiple stages can be changed in one pass
    const cell=stageCtx.cell;
    const val=capture.status||'none';
    const note=stageNotes[key];
    cell.className='stage '+val;
    cell.innerHTML=`<span class="sdot"></span><span><span class="snm">${STAGES[si]}</span>${note&&note.text?`<span class="snote">▲ ${note.text}</span>`:''}</span>`;

    const card=cell.closest('.unit-card');
    const arr=state[f][r.id];
    const done=arr.filter(s=>s==='done').length;
    const pct=Math.round(done/STAGES.length*100);
    const hasDefic=arr.some(s=>s==='defic');
    card.querySelector('.unit-name').innerHTML=`${label} ${hasDefic?'<span style="color:var(--defic)">▲</span>':''}`;
    const pctEl=card.querySelector('.pct');
    pctEl.textContent=pct+'%';
    pctEl.style.color=pct===100?'var(--done)':'var(--ink)';
    const fillEl=card.querySelector('.prog-fill');
    fillEl.style.width=pct+'%';
    fillEl.style.background=hasDefic?'var(--defic)':'var(--done)';

    toast(capture.status==='defic'?'Deficiency saved to unit + log':'Status updated');
    return;
  }

  // capture / deficiency / delay / attendance
  if(sheetMode==='attendance'){
    const crews=Object.entries(capture.trades).filter(([_,n])=>n>0);
    if(crews.length===0){toast('Set at least one crew count');return;}
    const total=crews.reduce((a,[_,n])=>a+n,0);
    events.push({
      title:`Attendance — ${total} on site`,
      note:crews.map(([t,n])=>`${t}: ${n}`).join(' · '),
      loc:'', who:'', time:nowStr(), ts:Date.now(), today:true, photos:0, flag:false, kindColor:'event'
    });
    closeSheet();toast('Attendance logged — ready to send to Stack');go('home');return;
  }

  if(sheetMode==='flag'){
    if(!capture.note || !capture.note.trim()){ toast('Add a note for this flag'); return; }
    const newEv={
      title:capture.note.trim(), note:'', loc:capture.loc, who:'',
      time:nowStr(), ts:Date.now(), today:true, photos:capture.photos||0,
      flag:true, flagType:capture.flagType, resolved:false,
      kindColor:'event'
    };
    events.push(newEv);
    showPostSave(newEv);
    return;
  }

  const p=CAP_PRESETS[sheetMode];
  let title = sheetMode==='deficiency'?'Deficiency logged'
            : sheetMode==='delay'?`Delay — ${capture.severity||'logged'}`
            : (capture.who? `With ${capture.who}` : 'Site note');
  if(capture.loc && sheetMode==='capture' && capture.who){
    title=`${capture.who} · ${capture.loc.split('·').pop().trim()}`;
  }
  const newEv={
    title, note:capture.note||'', loc:capture.loc, who:capture.who,
    time:nowStr(), ts:Date.now(), today:true, photos:capture.photos||0,
    flag:capture.flag, flagType:capture.flagType, resolved:false,
    kindColor:p.color, severity:capture.severity
  };
  events.push(newEv);
  // Post-save step: offer to draft an email right now, while it's fresh
  showPostSave(newEv);
}

function showPostSave(ev){
  document.getElementById('sheet-title').textContent='Saved to log';
  document.getElementById('sheet-auto').innerHTML=`${ev.loc||'Logged'} · ${ev.time}`;
  document.getElementById('sheet-body').innerHTML=`
    <div style="text-align:center;padding:6px 0 4px">
      <div style="font-size:44px;color:var(--done)">✓</div>
      <div style="font-size:16px;font-weight:650;margin-top:6px">Captured${ev.flag?' & flagged':''}</div>
      <div style="font-size:13px;color:var(--ink-dim);margin-top:6px;line-height:1.5">
        It's in today's log${ev.flag?` and flagged for <b style="color:var(--hivis)">${ev.flagType}</b>`:''}.<br>Want to draft the email now while it's fresh?
      </div>
    </div>
    <div class="postsave">
      <button onclick="closeSheet();go('home')">Done</button>
      <button class="mail" onclick="openEmailDraft(window.__lastEv)">✉ Email this</button>
    </div>`;
  window.__lastEv=ev;
  document.getElementById('save-btn').parentElement.style.display='none';
  // keep sheet open
}

/* ===================== EMAIL DRAFT ===================== */
// Build a draft from any logged event. Subject = project · unit · trade.
function buildDraft(ev){
  const PROJECT="401DS";
  // pull a clean unit label out of the location if present
  let unitPart="";
  if(ev.loc){
    // loc looks like "6e · Unité 614" or "6e · Bike Room (104)"
    const tail=ev.loc.split('·').pop().trim();
    unitPart=tail;
  }
  const tradePart = ev.who || (ev.title.includes('Électr')?'Électricien':'');
  const subjBits=[PROJECT, unitPart, tradePart].filter(Boolean);
  const subject=subjBits.join(' · ');
  const bodyLines=[];
  if(ev.note) bodyLines.push(ev.note);
  bodyLines.push('');
  bodyLines.push(ev.time?`— logged ${today()} at ${ev.time}`:`— logged ${today()}`);
  if(ev.loc) bodyLines.push(`Location: ${ev.loc}`);
  return {subject, body:bodyLines.join('\n'), photos:ev.photos||0, ev};
}

function openEmailDraft(ev){
  const d=buildDraft(ev);
  sheetMode='email';
  document.getElementById('sheet-title').textContent='Email draft';
  document.getElementById('sheet-auto').innerHTML='Review, then open in your mail app to finish & send';
  document.getElementById('sheet-body').innerHTML=`
    <div class="email-draft">
      <div class="email-line"><span class="k">To</span><span class="v" style="color:var(--ink-faint)">— you'll pick the trade foreman</span></div>
      <div class="email-line"><span class="k">Subject</span><span class="v subj">${d.subject}</span></div>
      <div class="email-line body"><span class="k">Message</span><span class="v">${d.body||'(no note added)'}</span></div>
      ${d.photos?`<div class="email-att">${Array.from({length:d.photos}).map((_,i)=>`<div class="pa">📷</div>`).join('')}<span style="align-self:center;font-size:12px;color:var(--ink-dim)">${d.photos} photo${d.photos>1?'s':''} attached</span></div>`:''}
    </div>
    <div class="email-note">In the real app this opens your mail composer with everything filled in, ready to send.<br>Here it's a preview of the draft that gets created.</div>
    <div class="email-actions">
      <button class="ghost" onclick="closeSheet()">Close</button>
      <button class="primary" onclick="openMailComposer('${encodeURIComponent(d.subject)}','${encodeURIComponent(d.body)}')">Open in mail</button>
    </div>`;
  document.getElementById('save-btn').parentElement.style.display='none';
  showSheet();
}

function openMailComposer(subj,body){
  // on a real device this launches the mail app; harmless in preview
  const link=`mailto:?subject=${subj}&body=${body}`;
  try{ window.location.href=link; }catch(e){}
  closeSheet();
  toast('Draft ready in your mail app');
}

/* ---- sheet plumbing ---- */
function showSheet(){
  // email mode hides the footer save button; everything else shows it
  document.getElementById('save-btn').parentElement.style.display = (sheetMode==='email')?'none':'';
  document.getElementById('scrim').classList.add('show');
  document.getElementById('sheet').classList.add('show');
}
function closeSheet(){document.getElementById('scrim').classList.remove('show');document.getElementById('sheet').classList.remove('show');}
function toast(msg){
  const t=document.getElementById('toast');t.innerHTML='✓ '+msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600);
}

// greeting by time of day
(function(){
  const h=new Date().getHours();
  const g = h<11?"Morning walkthrough?":h<15?"What's happening on site?":"End-of-day round?";
  document.getElementById('greeting').textContent=g;
})();

seed();
renderHome();
