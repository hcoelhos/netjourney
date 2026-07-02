/* ==========================================================================
   NetJourney — Motor de missões investigativas (Camada 3)
   ========================================================================== */

const NetJourneyMissions = (function(){

  const STORAGE_KEY = 'netjourney_missions_v1';
  let solved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); // {missionId: {points, at}}
  let activeMissionId = null;
  let diagSelected = null;
  let diagConfirmedCorrect = false;
  let fixDone = false;
  let onMissionComplete = null; // hook para a Camada 4 (gamificação) somar XP

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(solved)); }

  function getMission(id){ return NETJOURNEY_MISSIONS.find(m=>m.id===id); }

  /* ---------------- API usada por ui.js (inspetor) ---------------- */
  function getOverrideFor(deviceId){
    if(!activeMissionId) return null;
    const m = getMission(activeMissionId);
    if(!m || !m.overrides) return null;
    return m.overrides[deviceId] || null;
  }

  /* ---------------- Grid de missões ---------------- */
  function diffLabel(d){ return {easy:'Fácil', medium:'Médio', hard:'Difícil'}[d] || d; }

  function renderGrid(){
    const grid = document.getElementById('missionGrid');
    grid.innerHTML = NETJOURNEY_MISSIONS.map((m,i)=>{
      const isSolved = !!solved[m.id];
      return `
      <div class="mission-card ${isSolved?'solved':''}">
        <div class="mission-card-top">
          <span class="mission-number">MISSÃO ${i+1} DE ${NETJOURNEY_MISSIONS.length}</span>
          <span class="mission-status-icon">${isSolved?'✅':'🔍'}</span>
        </div>
        <h3>${m.title.replace(/^Missão \d+ — /,'')}</h3>
        <p class="mission-symptom">${m.symptom.slice(0,90)}${m.symptom.length>90?'…':''}</p>
        <div class="mission-card-foot">
          <span class="diff-badge ${m.difficulty}">${diffLabel(m.difficulty)}</span>
          <span class="mission-points">${isSolved? '✓ '+solved[m.id].points+' pts' : '+'+m.points+' pts'}</span>
        </div>
        <button class="btn ${isSolved?'':'primary'} small" style="margin-top:6px;" onclick="NetJourneyMissions.start('${m.id}')">
          ${isSolved ? 'Refazer missão' : 'Iniciar missão'}
        </button>
      </div>`;
    }).join('');
    updateProgressHeader();
  }

  function updateProgressHeader(){
    const total = NETJOURNEY_MISSIONS.length;
    const done = Object.keys(solved).length;
    const pct = Math.round((done/total)*100);
    const fill = document.getElementById('missionsProgressFill');
    const label = document.getElementById('missionsProgressLabel');
    if(fill) fill.style.width = pct+'%';
    if(label) label.textContent = `${done} de ${total} concluídas`;
  }

  /* ---------------- Workspace de uma missão ---------------- */
  function start(id){
    const m = getMission(id);
    if(!m) return;
    activeMissionId = id;
    diagSelected = null;
    diagConfirmedCorrect = false;
    fixDone = false;

    if(m.linkDown){
      NetJourneyTopology.setLinkState(m.linkDown.from, m.linkDown.to, 'down');
    }

    document.getElementById('missionListHead').style.display = 'none';
    document.getElementById('missionGrid').style.display = 'none';
    const ws = document.getElementById('missionWorkspace');
    ws.classList.add('active');
    renderWorkspace();

    // fecha qualquer inspetor aberto de uma sessão anterior, para forçar nova leitura dos dados
    if(typeof NetJourneyUI !== 'undefined') NetJourneyUI.closeInspector();
  }

  function renderWorkspace(){
    const m = getMission(activeMissionId);
    const ws = document.getElementById('missionWorkspace');

    ws.innerHTML = `
      <button class="mission-back" onclick="NetJourneyMissions.exit()">← Voltar às missões</button>

      <div class="mission-briefing">
        <div class="tag-row">
          <span class="diff-badge ${m.difficulty}">${diffLabel(m.difficulty)}</span>
          <span class="mission-points">+${m.points} pts</span>
        </div>
        <h3>${m.title}</h3>
        <div class="symptom-box">
          <span class="lbl">Relato do usuário</span>
          ${m.symptom}
        </div>
        <p class="mission-hint-note">Clique nos equipamentos da topologia (aba "Simulação") para inspecionar a configuração atual e encontrar a inconsistência antes de responder abaixo.</p>
      </div>

      <div class="diagnosis-card">
        <h4>1. Qual é a causa do problema?</h4>
        <div id="diagOptions">
          ${m.diagOptions.map((opt,i)=>`<button class="diag-option" data-i="${i}" onclick="NetJourneyMissions.selectDiag(${i})">${opt}</button>`).join('')}
        </div>
        <div class="btn-row" style="margin-top:10px;">
          <button class="btn primary small" onclick="NetJourneyMissions.submitDiag()">Confirmar diagnóstico</button>
        </div>
        <div class="mission-feedback" id="diagFeedback"></div>
      </div>

      <div class="diagnosis-card" id="fixCard" style="opacity:${diagConfirmedCorrect?1:.4}; pointer-events:${diagConfirmedCorrect?'auto':'none'};">
        <h4>2. Como corrigir?</h4>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:10px;">${m.fixLabel}</p>
        ${ m.fixType==='text' ? `
          <div class="fix-row">
            <input type="text" class="fix-input" id="fixInput" placeholder="${m.fixPlaceholder||''}" autocomplete="off" spellcheck="false">
            <button class="fix-action-btn" onclick="NetJourneyMissions.submitFix()">Aplicar correção</button>
          </div>
        ` : `
          <div class="fix-row">
            <button class="fix-action-btn" id="fixButton" onclick="NetJourneyMissions.submitFix()">${m.fixButtonLabel}</button>
          </div>
        `}
        <div class="mission-feedback" id="fixFeedback"></div>
      </div>
    `;
  }

  function selectDiag(i){
    diagSelected = i;
    document.querySelectorAll('.diag-option').forEach(el=>{
      el.classList.toggle('selected', parseInt(el.dataset.i)===i);
      el.classList.remove('correct','wrong');
    });
  }

  function submitDiag(){
    const m = getMission(activeMissionId);
    const fb = document.getElementById('diagFeedback');
    if(diagSelected===null){
      fb.className = 'mission-feedback show err';
      fb.textContent = 'Selecione uma alternativa antes de confirmar.';
      return;
    }
    const correct = diagSelected === m.diagCorrect;
    if(typeof NetJourneyAnalytics !== 'undefined') NetJourneyAnalytics.recordMissionAttempt(correct);
    document.querySelectorAll('.diag-option').forEach(el=>{
      const i = parseInt(el.dataset.i);
      if(i===m.diagCorrect) el.classList.add('correct');
      else if(i===diagSelected && !correct) el.classList.add('wrong');
    });
    if(correct){
      diagConfirmedCorrect = true;
      fb.className = 'mission-feedback show ok';
      fb.textContent = '✓ Diagnóstico correto! Agora proponha a correção abaixo.';
      const fixCard = document.getElementById('fixCard');
      fixCard.style.opacity = 1;
      fixCard.style.pointerEvents = 'auto';
    } else {
      fb.className = 'mission-feedback show err';
      fb.textContent = '✗ Ainda não é isso. Volte ao inspetor de equipamentos e compare os dados com atenção — a pista está na diferença entre dois valores que deveriam combinar.';
    }
  }

  function norm(s){ return (s||'').toString().trim().toLowerCase().replace(/\s+/g,''); }

  function submitFix(){
    if(!diagConfirmedCorrect) return;
    const m = getMission(activeMissionId);
    const fb = document.getElementById('fixFeedback');
    let correct = false;

    if(m.fixType==='text'){
      const val = document.getElementById('fixInput').value;
      correct = m.fixAnswers.some(a=>norm(a)===norm(val));
    } else {
      correct = true; // ação de botão único (ex.: reconectar cabo) é sempre a correção certa, uma vez liberada
    }

    if(correct){
      fixDone = true;
      fb.className = 'mission-feedback show ok';
      fb.textContent = '✓ Correção aplicada com sucesso!';
      if(typeof NetJourneyAnalytics !== 'undefined') NetJourneyAnalytics.recordMissionAttempt(true);
      completeMission();
    } else {
      fb.className = 'mission-feedback show err';
      fb.textContent = '✗ Esse valor não resolve o problema. Reveja os dados do equipamento afetado no inspetor.';
      if(typeof NetJourneyAnalytics !== 'undefined') NetJourneyAnalytics.recordMissionAttempt(false);
    }
  }

  function completeMission(){
    const m = getMission(activeMissionId);

    // desfaz a "quebra": restaura o link visual e limpa o override
    if(m.linkDown){
      NetJourneyTopology.setLinkState(m.linkDown.from, m.linkDown.to, 'up');
    }
    const alreadySolved = !!solved[m.id];
    solved[m.id] = { points: m.points, at: Date.now() };
    save();

    if(!alreadySolved && typeof onMissionComplete === 'function'){
      onMissionComplete(m);
    }

    // mostra tela de sucesso com a explicação pedagógica
    const ws = document.getElementById('missionWorkspace');
    ws.innerHTML = `
      <button class="mission-back" onclick="NetJourneyMissions.exit()">← Voltar às missões</button>
      <div class="mission-briefing" style="border-color:var(--green);">
        <div class="tag-row">
          <span class="diff-badge easy" style="border-color:var(--green); color:var(--green);">Missão concluída</span>
          <span class="mission-points">+${m.points} pts</span>
        </div>
        <h3>${m.title}</h3>
        <p style="color:var(--text); margin-top:10px;">${m.explanation}</p>
      </div>
      <div class="btn-row">
        <button class="btn primary" onclick="NetJourneyMissions.exit()">Voltar à lista de missões</button>
      </div>
    `;
  }

  function exit(){
    const m = getMission(activeMissionId);
    // restaura qualquer alteração visual pendente (idempotente — seguro mesmo se já estava normal)
    if(m && m.linkDown){
      NetJourneyTopology.setLinkState(m.linkDown.from, m.linkDown.to, 'up');
    }
    activeMissionId = null;
    document.getElementById('missionWorkspace').classList.remove('active');
    document.getElementById('missionListHead').style.display = '';
    document.getElementById('missionGrid').style.display = '';
    if(typeof NetJourneyUI !== 'undefined') NetJourneyUI.closeInspector();
    renderGrid();
  }

  function init(){
    renderGrid();
  }

  return {
    init, start, exit, selectDiag, submitDiag, submitFix,
    getOverrideFor,
    get solvedCount(){ return Object.keys(solved).length; },
    get totalCount(){ return NETJOURNEY_MISSIONS.length; },
    get activeMissionId(){ return activeMissionId; },
    get isDiagConfirmed(){ return diagConfirmedCorrect; },
    onMissionComplete: function(cb){ onMissionComplete = cb; },
    resetProgress: function(){ solved = {}; save(); renderGrid(); }
  };
})();
