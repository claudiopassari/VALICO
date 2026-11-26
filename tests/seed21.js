module.exports = async function seed(p){
  await p.evaluate(()=>{const A=window.GanttApp,C=A.core;
    A.commit('seed',q=>{
      const rows=[['Cantiere',1],['Fondazioni',2],['Scavi',3],['Getti',3],['Armature',4],['Casseri',4],['Struttura',2],['Pilastri',3],['Solai',3],['Impianti',1],['Elettrico',2],['Quadri',3],['Collaudo',2],['Consegna',1]];
      rows.forEach(([n,l],i)=>{const it=C.newItem(n);it.level=l;q.items.push(it)});
      [[2,'23/11/26',3],[4,'26/11/26',4],[5,'27/11/26',2],[7,'30/11/26',5],[8,'07/12/26',4]].forEach(([i,d,n])=>{C.setField(q,q.items[i].uid,'start',d);C.setField(q,q.items[i].uid,'dur',String(n))});
      C.setField(q,q.items[13].uid,'type','milestone');C.setField(q,q.items[13].uid,'start','18/12/26');
      q.items[4].assignee='Rossi';q.items[5].assignee='Bianchi';q.view.hiddenColumns=['notes','label'];
    });A.ui.dirty=false;A.ui.sel=[];A.render();});
};
