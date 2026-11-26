/* ===================== Elenco item (modulo 2) ===================== */
var COLS = [
  { id:'name',     label:'Nome',         tip:'Nome' },
  { id:'start',    label:'Inizio',       tip:'Data di inizio', w:112, lock:'lockStart' },
  { id:'end',      label:'Fine',         tip:'Data di fine', w:112, lock:'lockEnd' },
  { id:'dur',      label:'Durata',       tip:'Durata in giorni lavorativi', w:70, num:true },
  { id:'progress', label:'%',            tip:'Avanzamento', w:60, num:true },
  { id:'assignee', label:'Assegnatario', tip:'Assegnatario', w:140 },
  { id:'notes',    label:'Note',         tip:'Note (fino a 150 caratteri)', w:190 },
  { id:'label',    label:'Etichetta',    tip:'Etichetta mostrata nella barra', w:150 },
  { id:'preds',    label:'Predecessori', tip:'Predecessori, esempio: 3, 5FS+2', w:130 }
];
var ID_W = 56, NAME_MIN = 200;
function colById(id){ for(var i = 0; i < COLS.length; i++) if(COLS[i].id === id) return COLS[i]; return null; }
function itemByUid(u){ for(var i = 0; i < P.items.length; i++) if(P.items[i].uid === u) return P.items[i]; return null; }
function colHidden(id){ return id !== 'name' && P.view.hiddenColumns.indexOf(id) >= 0; }
function visCols(){ return COLS.filter(function(c){ return !colHidden(c.id); }); }
function visRows(){
  var out = [], hideUntil = -1, i, n = P.items.length;
  for(i = 0; i < n; i++){
    if(i < hideUntil) continue;
    out.push(i);
    if(P.items[i].type === 'group' && P.items[i].collapsed) hideUntil = blockEnd(P, i);
  }
  return out;
}
function gridInfo(){
  var vc = visCols(), tpl = ID_W+'px minmax('+NAME_MIN+'px,1fr)', min = ID_W + NAME_MIN;
  vc.forEach(function(c){ if(c.id !== 'name'){ tpl += ' '+c.w+'px'; min += c.w; } });
  return { cols:vc, tpl:tpl, min:min };
}
function applyItemsWidth(){
  var g = gridInfo(), w = prefs.itemsW || Math.min(g.min, Math.round(window.innerWidth * 0.52));
  w = Math.max(300, Math.min(w, Math.round(window.innerWidth * 0.8)));
  $('#panels').style.setProperty('--w-items-open', w+'px');
}
function whyReadOnly(i, col){
  var it = P.items[i];
  if(isGroupAt(P, i)) return 'Le date, la durata e l\'avanzamento di un gruppo sono calcolati dagli elementi che contiene.';
  if(it.type === 'milestone' && (col === 'end' || col === 'dur')) return 'Una milestone dura un solo giorno: si modifica solo la data di inizio.';
  if(col === 'dur' && it.lockStart && it.lockEnd) return 'Con entrambe le date bloccate la durata è calcolata e non modificabile.';
  if(col === 'start' || col === 'end') return 'La data è bloccata: sblocca il lucchetto per modificarla.';
  return 'Campo non modificabile.';
}

function renderItems(){
  var wrap = $('#itemsWrap'), body = $('#itemsBody'), cols = $('#itemsCols'), g = gridInfo(), vr = visRows();
  var sc = wrap.scrollTop, scl = wrap.scrollLeft, frag = document.createDocumentFragment();
  wrap.style.setProperty('--gcols', g.tpl); wrap.style.setProperty('--gmin', g.min+'px');
  $('#panels').style.setProperty('--nrows', String(Math.max(vr.length + 1, 28)));
  cols.textContent = '';
  cols.appendChild(h('div',{ class:'c c-id s1', text:'#', 'data-tip':'Numero di riga. Al passaggio del cursore compare la maniglia per spostare la riga.' }));
  g.cols.forEach(function(c){ cols.appendChild(h('div',{ class:'c c-'+c.id+(c.id === 'name' ? ' s2' : ''), text:c.label, 'data-tip':c.tip })); });
  vr.forEach(function(i){ frag.appendChild(rowEl(P.items[i], i, g.cols)); });
  var add = h('div',{ class:'row add', 'data-tip':'Aggiunge un item in fondo all\'elenco', 'data-keys':'Alt+Invio' }, h('div',{ class:'c c-id s1', text:'+' }), h('div',{ class:'c c-name s2' }, h('span',{ class:'t', text:'Nuovo item' })));
  frag.appendChild(add);
  body.textContent = ''; body.appendChild(frag);
  wrap.scrollTop = sc; wrap.scrollLeft = scl;
  var dl = $('#asgList'); dl.textContent = '';
  P.assignees.forEach(function(a){ dl.appendChild(h('option',{ value:a })); });
  if(ui.edit) focusEditor();
}
function rowEl(it, i, vcols){
  var sel = ui.sel.indexOf(it.uid) >= 0, grp = it.type === 'group';
  var row = h('div',{ class:'row'+(sel ? ' sel' : '')+(grp ? ' grp' : ''), 'data-uid':it.uid });
  row.appendChild(h('div',{ class:'c c-id s1' }, h('span',{ class:'n', text:String(i+1) }), h('span',{ class:'g', 'data-tip':'Trascina per spostare: in verticale cambia l\'ordine, in orizzontale il livello' }, icon('grip'))));
  vcols.forEach(function(c){ row.appendChild(cellEl(it, i, c)); });
  return row;
}
function cellEl(it, i, col){
  var id = col.id, grp = it.type === 'group', ms = it.type === 'milestone';
  var active = ui.cell && ui.cell.uid === it.uid && ui.cell.col === id;
  var editing = ui.edit && ui.edit.uid === it.uid && ui.edit.col === id;
  var ro = id !== 'name' && !canEdit(P, i, id);
  var c = h('div',{ class:'c c-'+id+(id === 'name' ? ' s2' : '')+(active ? ' act' : '')+(ro ? ' ro' : '')+(col.num ? ' num' : ''), 'data-col':id });
  if(id === 'name'){
    c.style.paddingLeft = 'calc(8px + '+(it.level-1)+' * var(--ind))';
    if(grp) c.appendChild(h('button',{ class:'chev', type:'button', tabindex:'-1', 'aria-label':it.collapsed ? 'Espandi' : 'Comprimi', 'data-tip':it.collapsed ? 'Espandi il gruppo' : 'Comprimi il gruppo' }, icon(it.collapsed ? 'right' : 'down')));
    else if(ms) c.appendChild(h('span',{ class:'dia', 'data-tip':'Milestone' }));
    else c.appendChild(h('span',{ class:'chev-sp' }));
  }
  if(editing){ c.appendChild(editorEl(it, i, col)); return c; }
  var txt = cellText(P, it, id);
  if(id === 'progress' && !it.progress) txt = '';
  c.appendChild(h('span',{ class:'t'+(!txt && id === 'name' ? ' blank' : ''), text: txt || (id === 'name' ? '(senza nome)' : '') }));
  if(col.lock && !grp && !(ms && id === 'end')){
    var on = !!it[col.lock];
    c.appendChild(h('button',{ class:'lockb'+(on ? ' on' : ''), type:'button', tabindex:'-1', 'data-lock':col.lock, 'aria-pressed':String(on),
      'data-tip':on ? 'Data bloccata: clic per sbloccare' : 'Blocca la data: non si sposta né si ridimensiona' }, icon('lock')));
  }
  if(id === 'name') c.appendChild(h('button',{ class:'dots', type:'button', tabindex:'-1', 'aria-label':'Menu della riga', 'data-tip':'Comandi della riga' }, icon('more')));
  return c;
}
function editorEl(it, i, col){
  var inp = h('input',{ type:'text', value:editText(P, it, col.id), 'aria-label':col.tip, autocomplete:'off', spellcheck:'false' });
  if(col.id === 'assignee') inp.setAttribute('list','asgList');
  if(col.id === 'notes') inp.maxLength = 150; else if(col.id === 'name') inp.maxLength = 200; else inp.maxLength = 120;
  if(col.num) inp.style.textAlign = 'right';
  inp.addEventListener('keydown',function(ev){
    ev.stopPropagation();
    if(ev.key === 'Enter'){ ev.preventDefault(); endEdit('stay', true); }
    else if(ev.key === 'Escape'){ ev.preventDefault(); endEdit('stay', false); }
    else if(ev.key === 'Tab'){ ev.preventDefault(); endEdit(ev.shiftKey ? 'prev' : 'next', true); }
  });
  inp.addEventListener('blur',function(){ if(ui.edit && ui.edit.el === inp) endEdit('stay', true); });
  ui.edit.el = inp;
  return inp;
}
function focusEditor(){ var e = ui.edit && ui.edit.el; if(e && e.isConnected){ e.focus(); e.select(); } }

/* Selezione senza ricostruire le righe (necessario per il doppio clic) */
function refreshSel(){
  var rows = $('#itemsBody').querySelectorAll('.row[data-uid]'), k, r, u, cells, j;
  for(k = 0; k < rows.length; k++){
    r = rows[k]; u = r.getAttribute('data-uid');
    r.classList.toggle('sel', ui.sel.indexOf(u) >= 0);
    cells = r.querySelectorAll('.c[data-col]');
    for(j = 0; j < cells.length; j++) cells[j].classList.toggle('act', !!(ui.cell && ui.cell.uid === u && ui.cell.col === cells[j].getAttribute('data-col')));
  }
  renderToolbarState();
}
function afterSelect(){ refreshSel(); renderDetails(); renderToolbarState(); if(document.activeElement && document.activeElement !== document.body && document.activeElement.blur && !(ui.edit && ui.edit.el === document.activeElement)) document.activeElement.blur(); }
function scrollToRow(u){
  var r = $('#itemsBody .row[data-uid="'+u+'"]'), w = $('#itemsWrap'); if(!r) return;
  var hh = $('#itemsCols').offsetHeight, top = r.offsetTop, bot = top + r.offsetHeight;
  if(top < w.scrollTop) w.scrollTop = top; else if(bot > w.scrollTop + w.clientHeight - hh) w.scrollTop = bot - w.clientHeight + hh + 4;
}
function navCols(){ return visCols().map(function(c){ return c.id; }); }
function setActive(u, col, mode, ev){
  var vr = visRows().map(function(i){ return P.items[i].uid; });
  if(vr.indexOf(u) < 0) return;
  if(mode === 'range' && ui.anchor && vr.indexOf(ui.anchor) >= 0){
    var a = vr.indexOf(ui.anchor), b = vr.indexOf(u), lo = Math.min(a,b), hi = Math.max(a,b);
    ui.sel = vr.slice(lo, hi+1);
  } else if(mode === 'toggle'){
    var at = ui.sel.indexOf(u); if(at >= 0) ui.sel.splice(at,1); else ui.sel.push(u);
    ui.anchor = u;
  } else { ui.sel = [u]; ui.anchor = u; }
  ui.cell = { uid:u, col:col || (ui.cell && ui.cell.col) || 'name' };
  afterSelect();
  scrollToRow(u);
}
function selectedHiddenFix(){
  var vr = {}; visRows().forEach(function(i){ vr[P.items[i].uid] = true; });
  ui.sel = ui.sel.filter(function(u){ return vr[u]; });
  if(ui.cell && !vr[ui.cell.uid]) ui.cell = ui.sel.length ? { uid:ui.sel[0], col:ui.cell.col } : null;
}

/* Modifica di cella */
function startEdit(u, col){
  var i = findIdx(P, u); if(i < 0) return;
  col = col || (ui.cell && ui.cell.col) || 'name';
  var c = colById(col); if(!c || colHidden(col)) return;
  if(!canEdit(P, i, col)){ toast(whyReadOnly(i, col), 3800); return; }
  if(ui.edit) endEdit('stay', true);
  ui.edit = { uid:u, col:col, el:null };
  ui.cell = { uid:u, col:col };
  if(ui.sel.indexOf(u) < 0 || ui.sel.length > 1){ ui.sel = [u]; ui.anchor = u; }
  renderItems(); renderDetails(); renderToolbarState(); scrollToRow(u); focusEditor();
}
function neighborEditable(u, col, dir){
  var vr = visRows(), nc = navCols(), seq = [], k;
  vr.forEach(function(i){ nc.forEach(function(c){ seq.push({ i:i, c:c }); }); });
  var pos = -1;
  for(k = 0; k < seq.length; k++) if(P.items[seq[k].i].uid === u && seq[k].c === col){ pos = k; break; }
  if(pos < 0) return null;
  for(k = pos + dir; k >= 0 && k < seq.length; k += dir){ if(canEdit(P, seq[k].i, seq[k].c)) return { uid:P.items[seq[k].i].uid, col:seq[k].c }; }
  return null;
}
function endEdit(mode, save){
  var ed = ui.edit; if(!ed) return;
  var val = ed.el ? ed.el.value : '', it = itemByUid(ed.uid), okc = true;
  ui.edit = null;
  if(save && it && val !== editText(P, it, ed.col)){
    ui.lastErr = false;
    var col = colById(ed.col);
    commit('Modifica '+(col ? col.label.toLowerCase() : 'cella'), function(p){ return setField(p, ed.uid, ed.col, val); });
    okc = !ui.lastErr;
  } else renderItems();
  if(!okc){ renderItems(); return; }
  if(mode === 'next' || mode === 'prev'){
    var nx = neighborEditable(ed.uid, ed.col, mode === 'next' ? 1 : -1);
    if(nx) startEdit(nx.uid, nx.col);
  }
  if(!ui.edit && document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
}

/* Operazioni (interfaccia) */
function refUid(){ return ui.cell && itemByUid(ui.cell.uid) ? ui.cell.uid : (ui.sel.length ? ui.sel[ui.sel.length-1] : null); }
function actInsert(where){
  var ref = where === 'end' ? null : refUid(), created = null, w = where;
  if(!ref) w = 'end';
  var ok = commit(where === 'child' ? 'Nuova sottoattività' : 'Nuovo item', function(p){ created = opInsert(p, ref, w); });
  if(!ok || !created) return null;
  ui.sel = [created.uid]; ui.anchor = created.uid; ui.cell = { uid:created.uid, col:'name' };
  selectedHiddenFix();
  startEdit(created.uid, 'name');
  return created;
}
function addItem(){ return actInsert('end'); }
function actDelete(){
  if(!ui.sel.length) return;
  var tops = topsOf(P, ui.sel), total = 0;
  tops.forEach(function(i){ total += blockEnd(P, i) - i; });
  if(total > tops.length && !window.confirm('Eliminare '+(tops.length === 1 ? 'il gruppo' : 'i gruppi selezionati')+' e tutti gli elementi che contengono ('+total+' righe in totale)?')) return;
  var first = findIdx(P, P.items[tops[0]].uid);
  commit(total > 1 ? 'Elimina '+total+' righe' : 'Elimina item', function(p){ opDelete(p, ui.sel.slice()); });
  var vr = visRows();
  if(P.items.length){ var k = Math.min(first, P.items.length-1); var u = P.items[k].uid; ui.sel = [u]; ui.anchor = u; ui.cell = { uid:u, col:(ui.cell && ui.cell.col) || 'name' }; selectedHiddenFix(); } else { ui.sel = []; ui.cell = null; }
  render();
}
var deleteSelected = actDelete;
function actLevel(dir){ if(!ui.sel.length) return; commit(dir > 0 ? 'Aumenta livello' : 'Riduci livello', function(p){ opLevel(p, ui.sel.slice(), dir); }); selectedHiddenFix(); }
function actMove(dir){ if(!ui.sel.length) return; commit(dir < 0 ? 'Sposta su' : 'Sposta giù', function(p){ opMove(p, ui.sel.slice(), dir); }); if(ui.cell) scrollToRow(ui.cell.uid); }
function actDuplicate(){
  if(!ui.sel.length) return; var added = [];
  commit('Duplica', function(p){ added = opDuplicate(p, ui.sel.slice()); });
  if(added.length){ ui.sel = added.slice(); ui.anchor = added[0]; ui.cell = { uid:added[0], col:(ui.cell && ui.cell.col) || 'name' }; render(); scrollToRow(added[0]); }
}
function actLock(){
  if(!ui.sel.length) return;
  var any = false;
  ui.sel.forEach(function(u){ var it = itemByUid(u), i = findIdx(P, u); if(it && !isGroupAt(P, i) && ((it.start && !it.lockStart) || (it.end && !it.lockEnd))) any = true; });
  var n = 0;
  commit(any ? 'Blocca le date' : 'Sblocca le date', function(p){ n = opLock(p, ui.sel.slice(), any); });
  if(!n) toast('Nessuna data da '+(any ? 'bloccare' : 'sbloccare')+' negli elementi selezionati.', 3200);
}
function toggleLockOne(u, which){
  var it = itemByUid(u); if(!it) return;
  if(!it[which === 'lockStart' ? 'start' : 'end']){ toast('Imposta prima la data: il lucchetto agisce su una data esistente.', 3500); return; }
  commit(it[which] ? 'Sblocca la data' : 'Blocca la data', function(p){ var x = p.items[findIdx(p, u)]; x[which] = !x[which]; if(x.type === 'milestone'){ x.lockStart = x[which]; x.lockEnd = x[which]; } });
}
function toggleCollapse(u){
  var it = itemByUid(u); if(!it || it.type !== 'group') return;
  it.collapsed = !it.collapsed; ui.dirty = true;
  selectedHiddenFix();
  if(it.collapsed && ui.sel.length === 0){ ui.sel = [u]; ui.anchor = u; ui.cell = { uid:u, col:'name' }; }
  render();
}

/* Menu contestuale e menu della riga */
function openMenuAt(x, y, entries){
  closePop();
  var m = h('div',{ class:'pop cmenu' });
  entries.forEach(function(e){
    if(e.sep){ m.appendChild(h('div',{ class:'msep' })); return; }
    var it = h('div',{ class:'menuitem'+(e.disabled ? ' dis' : ''), role:'menuitem' }, h('span',{ text:e.label }), e.keys ? h('span',{ class:'k', text:e.keys }) : (e.note ? h('span',{ class:'k', text:e.note }) : null));
    if(!e.disabled) it.addEventListener('click',function(){ closePop(); e.fn(); });
    m.appendChild(it);
  });
  document.body.appendChild(m);
  m.style.left = Math.max(8, Math.min(x, window.innerWidth - m.offsetWidth - 8))+'px';
  m.style.top = Math.max(8, Math.min(y, window.innerHeight - m.offsetHeight - 8))+'px';
  popEl = m; popAnchor = null;
}
function rowMenuEntries(){
  var one = ui.sel.length === 1, it = one ? itemByUid(ui.sel[0]) : null, grp = it && it.type === 'group';
  var e = [
    { label:'Modifica dettagli', fn:function(){ setPanel('details', true, true); }, disabled:!one },
    { label:'Rinomina', keys:'F2', fn:function(){ startEdit(ui.sel[ui.sel.length-1], 'name'); }, disabled:!ui.sel.length },
    { sep:true },
    { label:'Inserisci sopra', keys:'Ctrl+Maiusc+Invio', fn:function(){ actInsert('above'); } },
    { label:'Inserisci sotto', keys:'Ctrl+Invio', fn:function(){ actInsert('below'); } },
    { label:'Crea sottoattività', fn:function(){ actInsert('child'); }, disabled:!one },
    { sep:true },
    { label:'Aumenta livello', keys:'Ctrl+→', fn:function(){ actLevel(1); } },
    { label:'Riduci livello', keys:'Ctrl+←', fn:function(){ actLevel(-1); } },
    { label:'Sposta su', keys:'Ctrl+↑', fn:function(){ actMove(-1); } },
    { label:'Sposta giù', keys:'Ctrl+↓', fn:function(){ actMove(1); } },
    { sep:true }
  ];
  if(grp) e.push({ label:it.collapsed ? 'Espandi il gruppo' : 'Comprimi il gruppo', fn:function(){ toggleCollapse(it.uid); } });
  e.push({ label:'Taglia la barra', note:'modulo 5', disabled:true, fn:function(){} });
  e.push({ label:'Aggiungi collegamento', note:'modulo 5', disabled:true, fn:function(){} });
  e.push({ label:'Cambia colore', note:'modulo 4', disabled:true, fn:function(){} });
  e.push({ label:'Blocca o sblocca le date', fn:actLock });
  e.push({ label:'Duplica', fn:actDuplicate });
  e.push({ label:'Elimina', keys:'Canc', fn:actDelete });
  return e;
}
function openRowMenu(anchor){ var r = anchor.getBoundingClientRect(); openMenuAt(r.left, r.bottom + 4, rowMenuEntries()); }

/* Eventi dell'elenco (delegati) */
function initItemsEvents(){
  var body = $('#itemsBody');
  body.addEventListener('mousedown',function(e){
    if(e.button !== 0 && e.button !== 2) return;
    var row = e.target.closest('.row'); if(!row || row.classList.contains('add')) return;
    var u = row.getAttribute('data-uid');
    if(e.target.closest('.chev') || e.target.closest('.lockb') || e.target.closest('.dots')) return;
    if(ui.edit && e.target.closest('input')) return;
    if(ui.edit) endEdit('stay', true);
    if(!itemByUid(u)) return;
    var cell = e.target.closest('.c'), col = cell && cell.getAttribute('data-col');
    var grip = e.target.closest('.g');
    if(e.button === 2 && ui.sel.indexOf(u) >= 0){ ui.cell = { uid:u, col:col || (ui.cell && ui.cell.col) || 'name' }; refreshSel(); return; }
    var mode = (e.shiftKey && !grip) ? 'range' : (e.ctrlKey || e.metaKey) && !grip ? 'toggle' : 'single';
    if(grip && ui.sel.indexOf(u) >= 0) { /* mantiene la selezione per trascinare più righe */ ui.cell = { uid:u, col:(ui.cell && ui.cell.col) || 'name' }; refreshSel(); }
    else setActive(u, col, mode, e);
    if(grip && e.button === 0){ e.preventDefault(); startRowDrag(e, u); }
  });
  body.addEventListener('dblclick',function(e){
    var row = e.target.closest('.row'); if(!row || row.classList.contains('add')) return;
    if(e.target.closest('.chev') || e.target.closest('.lockb') || e.target.closest('.dots') || e.target.closest('.g')) return;
    var cell = e.target.closest('.c'), col = cell && cell.getAttribute('data-col');
    if(col) startEdit(row.getAttribute('data-uid'), col);
  });
  body.addEventListener('click',function(e){
    var row = e.target.closest('.row'); if(!row) return;
    if(row.classList.contains('add')){ actInsert('end'); return; }
    var u = row.getAttribute('data-uid'), b;
    if((b = e.target.closest('.chev'))){ toggleCollapse(u); return; }
    if((b = e.target.closest('.lockb'))){ toggleLockOne(u, b.getAttribute('data-lock')); return; }
    if((b = e.target.closest('.dots'))){ if(ui.sel.indexOf(u) < 0) setActive(u, 'name', 'single'); openRowMenu(b); return; }
  });
  body.addEventListener('contextmenu',function(e){
    var row = e.target.closest('.row'); if(!row || row.classList.contains('add')) return;
    e.preventDefault();
    var u = row.getAttribute('data-uid');
    if(ui.sel.indexOf(u) < 0) setActive(u, 'name', 'single');
    openMenuAt(e.clientX, e.clientY, rowMenuEntries());
  });
}

/* Trascinamento della riga: verticale = ordine, orizzontale = livello */
function startRowDrag(e0, u0){
  var body = $('#itemsBody'), wrap = $('#itemsWrap');
  var uids = ui.sel.indexOf(u0) >= 0 ? ui.sel.slice() : [u0];
  var st = { active:false, sx:e0.clientX, sy:e0.clientY, line:null, lab:null, res:null };
  function geom(ev){
    var vr = visRows(), r0 = body.getBoundingClientRect(), rh = body.querySelector('.row').offsetHeight || 32;
    var k = Math.round((ev.clientY - r0.top) / rh); k = Math.max(0, Math.min(vr.length, k));
    var insertAt = k < vr.length ? vr[k] : P.items.length;
    var tops = topsOf(P, uids), range = dropRange(P, tops, insertAt);
    var ind = parseFloat(getComputedStyle($('#itemsWrap')).getPropertyValue('--ind-px')) || 16;
    var delta = 0;
    if(range){ delta = Math.round((ev.clientX - st.sx) / ind); delta = Math.max(range.min, Math.min(range.max, delta)); }
    return { k:k, y:k * rh, insertAt:insertAt, range:range, delta:delta, rh:rh, ind:ind };
  }
  function show(gm){
    if(!st.line){ st.line = h('div',{ class:'dropline' }); st.lab = h('div',{ class:'droplab' }); body.appendChild(st.line); body.appendChild(st.lab); body.classList.add('dragging'); }
    st.line.classList.toggle('bad', !gm.range);
    var lvl = gm.range ? gm.range.firstLevel + gm.delta : null;
    var left = ID_W + (lvl ? (lvl - 1) * gm.ind : 0);
    st.line.style.top = (gm.y - 1)+'px'; st.line.style.left = left+'px';
    st.lab.style.top = (gm.y + 2)+'px'; st.lab.style.left = (left + 6)+'px';
    st.lab.textContent = gm.range ? 'Livello '+lvl : 'Posizione non valida';
    st.lab.classList.toggle('bad', !gm.range);
  }
  function onMove(ev){
    if(!st.active){ if(Math.abs(ev.clientX - st.sx) < 5 && Math.abs(ev.clientY - st.sy) < 5) return; st.active = true; }
    var wr = wrap.getBoundingClientRect();
    if(ev.clientY < wr.top + 60) wrap.scrollTop -= 14; else if(ev.clientY > wr.bottom - 24) wrap.scrollTop += 14;
    st.res = geom(ev); show(st.res);
  }
  function cleanup(){
    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.removeEventListener('keydown', onKey, true);
    if(st.line){ st.line.remove(); st.lab.remove(); } body.classList.remove('dragging');
  }
  function onUp(ev){
    var res = st.res; cleanup();
    if(!st.active || !res || !res.range) return;
    commit('Sposta item', function(p){ opDrop(p, uids, res.insertAt, res.delta); });
    selectedHiddenFix(); afterSelect();
  }
  function onKey(ev){ if(ev.key === 'Escape'){ ev.stopPropagation(); st.active = false; cleanup(); } }
  document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); document.addEventListener('keydown', onKey, true);
}

/* Larghezza del pannello Item */
function initItemsResizer(){
  var rz = $('#itemsResizer');
  rz.addEventListener('mousedown',function(e){
    e.preventDefault();
    var pn = $('#panels'), start = $('#pItems').offsetWidth, sx = e.clientX;
    pn.classList.add('resizing');
    function mv(ev){ prefs.itemsW = Math.round(start + ev.clientX - sx); applyItemsWidth(); }
    function up(){ document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); pn.classList.remove('resizing'); savePrefs(); }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
  });
  rz.addEventListener('dblclick',function(){ prefs.itemsW = null; savePrefs(); applyItemsWidth(); });
  window.addEventListener('resize', applyItemsWidth);
}

/* Colonne visibili */
function openColumns(anchor){
  var c = h('div',null, h('h3',{ text:'Colonne dell\'elenco' }));
  COLS.forEach(function(col){
    if(col.id === 'name') return;
    var sw = h('button',{ class:'switch', role:'switch', type:'button', 'aria-checked':String(!colHidden(col.id)), 'aria-label':col.label });
    sw.addEventListener('click',function(){
      var hc = P.view.hiddenColumns, at = hc.indexOf(col.id);
      if(at >= 0) hc.splice(at,1); else hc.push(col.id);
      sw.setAttribute('aria-checked', String(at >= 0)); ui.dirty = true;
      applyItemsWidth(); renderItems(); renderHeader(); renderStatus();
    });
    c.appendChild(h('div',{ class:'swrow' }, h('span',{ text:col.tip.replace(/,.*$/,'') }), sw));
  });
  c.appendChild(h('div',{ class:'note', text:'La scelta riguarda solo la vista: non filtra gli item e non cancella valori. Si salva nel file di progetto.' }));
  openPopover(anchor, c);
}
/* Unisci assegnatari */
function openMerge(anchor){
  var list = P.assignees.slice();
  var c = h('div',null, h('h3',{ text:'Unisci assegnatari' }));
  if(list.length < 2){ c.appendChild(h('div',{ class:'empty', text:'Servono almeno due assegnatari diversi.' })); openPopover(anchor, c); return; }
  var a = h('select',{ class:'sel' }), b = h('select',{ class:'sel' });
  list.forEach(function(n){ a.appendChild(h('option',{ value:n, text:n })); b.appendChild(h('option',{ value:n, text:n })); });
  b.selectedIndex = 1;
  c.appendChild(h('label',{ class:'fld' }, h('span',{ text:'Sostituisci' }), a));
  c.appendChild(h('label',{ class:'fld' }, h('span',{ text:'Con' }), b));
  c.appendChild(h('button',{ class:'btn primary', type:'button', onclick:function(){
    if(a.value === b.value){ toast('Scegli due voci diverse.'); return; }
    var n = 0; commit('Unisci assegnatari', function(p){ n = opMergeAssignees(p, a.value, b.value); });
    closePop(); toast(n+' assegnazioni aggiornate');
  } }, 'Unisci'));
  openPopover(anchor, c);
}
function openMore(anchor){
  var r = anchor.getBoundingClientRect(), has = ui.sel.length > 0;
  openMenuAt(r.left, r.bottom + 6, [
    { label:'Elimina', keys:'Canc', fn:actDelete, disabled:!has },
    { label:'Duplica', fn:actDuplicate, disabled:!has },
    { sep:true },
    { label:'Sposta su', keys:'Ctrl+↑', fn:function(){ actMove(-1); }, disabled:!has },
    { label:'Sposta giù', keys:'Ctrl+↓', fn:function(){ actMove(1); }, disabled:!has },
    { sep:true },
    { label:'Unisci assegnatari…', fn:function(){ openMerge(anchor); } },
    { sep:true },
    { label:'Espandi tutti i gruppi', fn:function(){ setAllCollapsed(false); } },
    { label:'Comprimi tutti i gruppi', fn:function(){ setAllCollapsed(true); } }
  ]);
}
function setAllCollapsed(v){ P.items.forEach(function(it){ if(it.type === 'group') it.collapsed = v; }); ui.dirty = true; selectedHiddenFix(); render(); }

/* ===================== Pannello Dettagli ===================== */
var dRefs = null, dUid = null;
function detailField(label, col, opts){
  opts = opts || {};
  var inp = opts.area ? h('textarea',{ rows:'3', maxlength:'150' }) : h('input',{ type:'text', autocomplete:'off', spellcheck:'false' });
  inp.setAttribute('data-f', col);
  if(col === 'assignee') inp.setAttribute('list','asgList');
  if(opts.max) inp.maxLength = opts.max;
  inp.addEventListener('keydown',function(ev){ ev.stopPropagation(); if(ev.key === 'Enter' && !opts.area){ ev.preventDefault(); inp.blur(); } else if(ev.key === 'Escape'){ var it = itemByUid(dUid); if(it) inp.value = editText(P, it, col); inp.blur(); } });
  inp.addEventListener('change',function(){
    var u = dUid, it = itemByUid(u); if(!it) return;
    if(inp.value === editText(P, it, col)) return;
    ui.lastErr = false;
    var cd = colById(col), val = inp.value;
    commit('Modifica '+(cd ? cd.label.toLowerCase() : col), function(p){ return setField(p, u, col, val); });
    if(ui.lastErr){ var it2 = itemByUid(u); if(it2) inp.value = editText(P, it2, col); }
  });
  var lb = null;
  if(opts.lock){
    lb = h('button',{ class:'lockb big', type:'button', 'data-lock':opts.lock, 'data-tip':'Blocca o sblocca la data' }, icon('lock'));
    lb.addEventListener('click',function(){ toggleLockOne(dUid, opts.lock); });
  }
  var wrap = h('label',{ class:'fld' }, h('span',{ text:label }), lb ? h('div',{ class:'frow' }, inp, lb) : inp);
  dRefs[col] = { inp:inp, lock:lb, wrap:wrap };
  return wrap;
}
function buildDetails(it){
  var b = $('#detailsBody'); b.textContent = ''; dRefs = {}; dUid = it.uid;
  b.appendChild(detailField('Nome', 'name', { max:200 }));
  b.appendChild(detailField('Etichetta della barra', 'label', { max:100 }));
  var tsel = h('select',{ class:'sel', 'aria-label':'Tipo' }, h('option',{ value:'task', text:'Task' }), h('option',{ value:'milestone', text:'Milestone' }), h('option',{ value:'group', text:'Gruppo' }));
  tsel.addEventListener('change',function(){ var u = dUid, v = tsel.value; commit('Cambia tipo', function(p){ return setField(p, u, 'type', v); }); var x = itemByUid(u); if(x) tsel.value = x.type; });
  dRefs.type = { inp:tsel };
  b.appendChild(h('label',{ class:'fld' }, h('span',{ text:'Tipo' }), tsel));
  b.appendChild(detailField('Inizio', 'start', { lock:'lockStart' }));
  b.appendChild(detailField('Fine', 'end', { lock:'lockEnd' }));
  b.appendChild(detailField('Durata (giorni lavorativi)', 'dur'));
  b.appendChild(detailField('Avanzamento (%)', 'progress'));
  b.appendChild(detailField('Assegnatario', 'assignee', { max:80 }));
  b.appendChild(detailField('Ore lavorative per giorno', 'hours'));
  b.appendChild(detailField('Predecessori', 'preds', { max:120 }));
  b.appendChild(detailField('Note (fino a 150 caratteri)', 'notes', { area:true }));
  dRefs.info = h('div',{ class:'note' });
  b.appendChild(dRefs.info);
}
function updateDetails(it){
  var i = findIdx(P, it.uid), ae = document.activeElement;
  Object.keys(dRefs).forEach(function(col){
    var r = dRefs[col]; if(col === 'info') return;
    if(col === 'type'){ r.inp.value = it.type; r.inp.disabled = it.type === 'group'; return; }
    if(r.inp !== ae){ r.inp.value = editText(P, it, col); }
    r.inp.disabled = !canEdit(P, i, col);
    if(col === 'hours') r.inp.placeholder = 'Predefinito: '+(P.calendar.hoursPerDay || 8);
    if(r.lock){
      var on = !!it[r.lock.getAttribute('data-lock')];
      r.lock.classList.toggle('on', on); r.lock.style.display = it.type === 'group' ? 'none' : '';
    }
  });
  dRefs.info.textContent = 'Riga '+(i+1)+'  ·  Livello '+it.level+'  ·  ID '+it.uid;
}
function renderDetails(){
  var b = $('#detailsBody');
  if(!ui.sel.length){ b.textContent = ''; dRefs = null; dUid = null; b.appendChild(h('div',{ class:'empty', text:'Nessun elemento selezionato.' })); return; }
  if(ui.sel.length > 1){ b.textContent = ''; dRefs = null; dUid = null; b.appendChild(h('div',{ class:'empty', text:ui.sel.length+' elementi selezionati. La modifica collettiva dei campi arriva con un modulo successivo; i comandi della barra e del menu agiscono sull\'intera selezione.' })); return; }
  var it = itemByUid(ui.sel[0]); if(!it) return;
  if(!dRefs || dUid !== it.uid) buildDetails(it);
  updateDetails(it);
}
function renderTimeline(){
  var body = $('#tlBody'), n = Math.max(visRows().length + 1, 28), frag = document.createDocumentFragment(), i;
  var ph = h('div',{ class:'ph' }, h('div',null, h('b',{ text:'Timeline e barre' }), h('br'), 'Griglia, scale, scorrimento e barre arrivano con il modulo 3. Le righe qui sotto sono già allineate a quelle dell\'elenco.'));
  frag.appendChild(ph);
  for(i = 0; i < n; i++) frag.appendChild(h('div',{ class:'trow' }));
  var sc = body.scrollTop; body.textContent = ''; body.appendChild(frag); body.scrollTop = sc;
}
