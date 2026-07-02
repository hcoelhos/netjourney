/* ==========================================================================
   NetJourney — Painel do Professor + Certificado (Camada 5)
   ========================================================================== */

const NetJourneyTeacherPanel = (function(){

  function pct(n){ return isFinite(n) ? Math.round(n) : 0; }

  function overallProgress(){
    const simDone = (typeof NetJourneyAnalytics!=='undefined' && localStorage.getItem('netjourney_game_v1'))
      ? JSON.parse(localStorage.getItem('netjourney_game_v1')).journeyDone : false;
    const missionsFrac = (typeof NetJourneyMissions!=='undefined') ? (NetJourneyMissions.solvedCount / NetJourneyMissions.totalCount) : 0;
    const summary = NetJourneyAnalytics.getSummary();
    const quizFrac = summary.bestQuiz ? (summary.bestQuiz.pct/100) : 0;
    const simFrac = simDone ? 1 : 0;
    return pct(((simFrac + missionsFrac + quizFrac) / 3) * 100);
  }

  function render(){
    const el = document.getElementById('teacherView');
    if(!el) return;
    const summary = NetJourneyAnalytics.getSummary();
    const missionsSolved = typeof NetJourneyMissions!=='undefined' ? NetJourneyMissions.solvedCount : 0;
    const missionsTotal = typeof NetJourneyMissions!=='undefined' ? NetJourneyMissions.totalCount : 5;
    const game = typeof NetJourneyGame!=='undefined' ? NetJourneyGame : null;
    const level = game ? game.levelInfo() : {level:1, title:'—'};
    const progress = overallProgress();

    const missionListHtml = (typeof NETJOURNEY_MISSIONS!=='undefined') ? NETJOURNEY_MISSIONS.map(m=>{
      const solvedRaw = localStorage.getItem('netjourney_missions_v1');
      const solvedMap = solvedRaw ? JSON.parse(solvedRaw) : {};
      const isSolved = !!solvedMap[m.id];
      return `<div class="report-row">
        <span>${isSolved?'✅':'⬜'} ${m.title.replace(/^Missão \d+ — /,'')}</span>
        <span class="report-row-val">${isSolved ? solvedMap[m.id].points+' pts' : '—'}</span>
      </div>`;
    }).join('') : '';

    el.innerHTML = `
      <div class="teacher-head">
        <h2>Painel do Professor</h2>
        <p>Relatório de desempenho deste navegador. Como o NetJourney funciona offline e sem servidor, este painel reflete o uso de <strong>um único aluno/dispositivo</strong> — veja o Manual do Professor para o fluxo sugerido de coleta em turma.</p>
      </div>

      <div class="report-grid">
        <div class="report-card">
          <span class="report-label">Progresso geral</span>
          <span class="report-big">${progress}%</span>
          <div class="report-bar"><div class="report-bar-fill" style="width:${progress}%"></div></div>
        </div>
        <div class="report-card">
          <span class="report-label">Tempo de uso</span>
          <span class="report-big">${summary.timeSpentLabel}</span>
        </div>
        <div class="report-card">
          <span class="report-label">Nível atual</span>
          <span class="report-big" style="font-size:16px;">${level.title}</span>
          <span class="report-sub">${game?game.xp:0} XP · ${game?game.badges.length:0}/10 medalhas</span>
        </div>
        <div class="report-card">
          <span class="report-label">Missões concluídas</span>
          <span class="report-big">${missionsSolved}/${missionsTotal}</span>
        </div>
      </div>

      <div class="report-section">
        <h3>Missões — detalhamento</h3>
        ${missionListHtml}
        <div class="report-row" style="margin-top:8px; border-top:1px solid var(--border); padding-top:10px;">
          <span>Tentativas certas / erradas (diagnóstico + correção)</span>
          <span class="report-row-val">${summary.missionAttempts.correct} certas · ${summary.missionAttempts.wrong} erradas</span>
        </div>
      </div>

      <div class="report-section">
        <h3>Quiz</h3>
        ${summary.lastQuiz ? `
          <div class="report-row"><span>Última tentativa</span><span class="report-row-val">${summary.lastQuiz.score}/${summary.lastQuiz.total} (${summary.lastQuiz.pct}%)</span></div>
          <div class="report-row"><span>Melhor tentativa</span><span class="report-row-val">${summary.bestQuiz.score}/${summary.bestQuiz.total} (${summary.bestQuiz.pct}%)</span></div>
          <div class="report-row"><span>Total de respostas certas / erradas</span><span class="report-row-val">${summary.quizAttempts.correct} certas · ${summary.quizAttempts.wrong} erradas</span></div>
        ` : `<p style="color:var(--text-muted); font-size:13px;">O aluno ainda não fez o quiz.</p>`}
      </div>

      <div class="btn-row" style="margin:18px 0;">
        <button class="btn" onclick="NetJourneyAnalytics.exportReport()">⬇ Exportar relatório (.json)</button>
        <button class="btn ghost" onclick="NetJourneyTeacherPanel.confirmReset()">↺ Zerar todo o progresso</button>
      </div>

      <div class="report-section cert-section">
        <h3>Certificado de Conclusão</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px;">Preencha o nome e imprima (ou salve como PDF, Ctrl+P) como registro de conclusão.</p>
        <div class="certificate" id="certificateBox">
          <div class="cert-eyebrow">NetJourney — Certificado de Conclusão</div>
          <h3 class="cert-title">Aprenda como a Internet funciona</h3>
          <input type="text" id="certNameInput" class="cert-name-input" placeholder="Digite o nome completo" oninput="NetJourneyTeacherPanel.updateCertName()">
          <div class="cert-name" id="certNameDisplay">nome do aluno</div>
          <p class="cert-sub">concluiu a jornada investigativa do NetJourney, explorando a simulação de rede, resolvendo missões de diagnóstico e sendo avaliado(a) por quiz.</p>
          <div class="cert-stats">
            <div><span class="cs-label">Aproveitamento no quiz</span><span class="cs-val">${summary.bestQuiz ? summary.bestQuiz.pct+'%' : '—'}</span></div>
            <div><span class="cs-label">Missões concluídas</span><span class="cs-val">${missionsSolved}/${missionsTotal}</span></div>
            <div><span class="cs-label">Tempo de estudo</span><span class="cs-val">${summary.timeSpentLabel}</span></div>
          </div>
        </div>
        <div class="btn-row" style="margin-top:14px;">
          <button class="btn primary" onclick="window.print()">🖨 Imprimir / salvar como PDF</button>
        </div>
      </div>
    `;
  }

  function updateCertName(){
    const val = document.getElementById('certNameInput').value.trim();
    document.getElementById('certNameDisplay').textContent = val || 'nome do aluno';
  }

  function confirmReset(){
    if(!confirm('Isso vai apagar TODO o progresso salvo neste navegador (missões, quiz, XP, medalhas e relatório). Continuar?')) return;
    if(typeof NetJourneyMissions!=='undefined') NetJourneyMissions.resetProgress();
    if(typeof NetJourneyGame!=='undefined') NetJourneyGame.resetProgress();
    if(typeof NetJourneyAnalytics!=='undefined') NetJourneyAnalytics.resetAll();
    if(typeof NetJourneyQuiz!=='undefined') NetJourneyQuiz.reset();
    render();
  }

  return { render, updateCertName, confirmReset };
})();
