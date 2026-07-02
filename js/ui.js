/* ==========================================================================
   NetJourney — Interações de interface
   (navegação entre modos, painel de inspeção de equipamentos, log de eventos)
   ========================================================================== */

const NetJourneyUI = (function(){

  /* ---------------- MODE NAVIGATION ---------------- */
  const UNLOCKED_MODES = new Set(['simulacao','missoes','quiz','professor','manual']);

  function switchMode(mode){
    if(!UNLOCKED_MODES.has(mode)){
      flashLockedNotice(mode);
      return;
    }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-'+mode);
    if(target) target.classList.add('active');

    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode===mode));
    document.getElementById('modeNav').classList.remove('mobile-open');

    if(mode==='professor' && typeof NetJourneyTeacherPanel !== 'undefined'){
      NetJourneyTeacherPanel.render();
    }
  }

  function flashLockedNotice(mode){
    // Ainda mostra a view de placeholder correspondente, para dar contexto do que vem a seguir,
    // mas deixa claro visualmente (via botão) que o modo ainda não está desbloqueado.
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-'+mode);
    if(target) target.classList.add('active');
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode===mode));
    document.getElementById('modeNav').classList.remove('mobile-open');
  }

  function initModeNav(){
    document.querySelectorAll('.mode-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> switchMode(btn.dataset.mode));
    });
    document.getElementById('hamburger').addEventListener('click', ()=>{
      document.getElementById('modeNav').classList.toggle('mobile-open');
    });
  }

  /* ---------------- DEVICE INSPECTOR ---------------- */
  function openInspector(deviceId){
    const base = NETJOURNEY_DEVICES[deviceId];
    if(!base) return;

    // Se uma missão estiver ativa, ela pode substituir kv/table deste equipamento
    // por uma versão "quebrada" (ver js/missions.js). Os campos base (nome, camada,
    // descrição) permanecem os mesmos — só os dados técnicos mudam.
    let override = null;
    if(typeof NetJourneyMissions !== 'undefined' && typeof NetJourneyMissions.getOverrideFor === 'function'){
      override = NetJourneyMissions.getOverrideFor(deviceId);
    }
    const data = {
      name: base.name,
      layer: base.layer,
      desc: base.desc,
      kv: (override && override.kv) ? override.kv : base.kv,
      table: (override && override.table) ? override.table : base.table
    };

    document.getElementById('inspTitle').textContent = data.name;
    document.getElementById('inspLayer').textContent = data.layer;
    document.getElementById('inspDesc').textContent = data.desc;

    const body = document.getElementById('inspBody');
    body.innerHTML = '';

    if(data.kv){
      const grid = document.createElement('div');
      grid.className = 'kv-grid';
      data.kv.forEach(item=>{
        const el = document.createElement('div');
        el.className = 'kv-item';
        el.innerHTML = `<div class="k">${item.k}</div><div class="v">${item.v}</div>`;
        grid.appendChild(el);
      });
      body.appendChild(grid);
    }

    if(data.table){
      const wrap = document.createElement('div');
      wrap.style.marginTop = data.kv ? '16px' : '0';
      const title = document.createElement('div');
      title.style.cssText = 'font-family:var(--mono); font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px;';
      title.textContent = data.table.title;
      wrap.appendChild(title);

      const table = document.createElement('table');
      table.className = 'inspector-table';
      const thead = document.createElement('tr');
      data.table.cols.forEach(c=>{
        const th = document.createElement('th');
        th.textContent = c;
        thead.appendChild(th);
      });
      table.appendChild(thead);
      data.table.rows.forEach(row=>{
        const tr = document.createElement('tr');
        row.forEach(cell=>{
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      wrap.appendChild(table);
      body.appendChild(wrap);
    }

    document.getElementById('inspector').classList.add('open');
  }

  function closeInspector(){
    document.getElementById('inspector').classList.remove('open');
    document.querySelectorAll('.device-node.selected').forEach(n=>n.classList.remove('selected'));
  }

  function initInspector(){
    document.getElementById('inspClose').addEventListener('click', closeInspector);
    NetJourneyTopology.onDeviceClick(openInspector);
  }

  /* ---------------- LOG PANEL ----------------
     Exposto para as próximas camadas (motor de simulação) poderem
     adicionar eventos ao log conforme o pacote percorre a rede. */
  function addLogEntry({ proto, msg, time }){
    const logBody = document.getElementById('logBody');
    const empty = document.getElementById('logEmpty');
    if(empty) empty.remove();

    const entry = document.createElement('div');
    entry.className = `log-entry proto-${proto||'eth'}`;
    const t = time || new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    entry.innerHTML = `
      <span class="t">${t}</span>
      <div class="body">
        <div class="proto">${(proto||'eth').toUpperCase()}</div>
        <div class="msg">${msg}</div>
      </div>`;
    logBody.appendChild(entry);
    logBody.scrollTop = logBody.scrollHeight;
  }

  function clearLog(){
    const logBody = document.getElementById('logBody');
    logBody.innerHTML = '<div class="log-empty" id="logEmpty">Nenhum evento ainda.<br>A simulação de tráfego chega na próxima etapa.</div>';
  }

  function initLog(){
    document.getElementById('logClearBtn').addEventListener('click', clearLog);
  }

  function switchManualTab(tab){
    document.querySelectorAll('.manual-tab').forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
    document.querySelectorAll('.manual-panel').forEach(p=> p.classList.toggle('active', p.id==='manual-'+tab));
  }

  function init(){
    initModeNav();
    initInspector();
    initLog();
  }

  return { init, addLogEntry, clearLog, openInspector, closeInspector, switchMode, switchManualTab };
})();
