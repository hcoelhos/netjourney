/* ==========================================================================
   NetJourney — Rastreamento leve de uso (Camada 5)
   Registra tempo de sessão, tentativas e acertos em missões e no quiz,
   para alimentar o Painel do Professor e o Certificado de Conclusão.

   IMPORTANTE (limitação honesta): como o NetJourney roda inteiramente no
   navegador, sem servidor, este painel reflete o uso feito NESTE navegador
   (um aluno por vez) — não é um dashboard de turma. Para uso em sala, cada
   aluno pode usar o botão "Exportar relatório" ao final e entregar o
   arquivo ao professor. Ver docs/MANUAL-PROFESSOR.md para o fluxo sugerido.
   ========================================================================== */

const NetJourneyAnalytics = (function(){

  const STORAGE_KEY = 'netjourney_analytics_v1';

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
    firstVisit: Date.now(),
    quizHistory: [],           // [{score,total,pct,at}]
    missionAttempts: {correct:0, wrong:0},
    quizAttempts: {correct:0, wrong:0}
  };
  if(!state.firstVisit) state.firstVisit = Date.now();

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function recordQuizResult(score, total){
    const pct = Math.round((score/total)*100);
    state.quizHistory.push({score, total, pct, at: Date.now()});
    if(state.quizHistory.length>20) state.quizHistory.shift(); // limite razoável de histórico
    save();
  }

  function recordQuizAnswer(correct){
    if(correct) state.quizAttempts.correct++; else state.quizAttempts.wrong++;
    save();
  }

  function recordMissionAttempt(correct){
    if(correct) state.missionAttempts.correct++; else state.missionAttempts.wrong++;
    save();
  }

  function formatDuration(ms){
    const totalSec = Math.floor(ms/1000);
    const h = Math.floor(totalSec/3600);
    const m = Math.floor((totalSec%3600)/60);
    const s = totalSec%60;
    if(h>0) return `${h}h ${m}min`;
    if(m>0) return `${m} min ${s}s`;
    return `${s}s`;
  }

  function getSummary(){
    const timeSpentMs = Date.now() - state.firstVisit;
    const lastQuiz = state.quizHistory.length ? state.quizHistory[state.quizHistory.length-1] : null;
    const bestQuiz = state.quizHistory.reduce((best,cur)=> (!best || cur.pct>best.pct) ? cur : best, null);
    return {
      timeSpentMs,
      timeSpentLabel: formatDuration(timeSpentMs),
      firstVisit: state.firstVisit,
      lastQuiz, bestQuiz,
      quizHistory: state.quizHistory.slice(),
      missionAttempts: {...state.missionAttempts},
      quizAttempts: {...state.quizAttempts}
    };
  }

  function exportReport(){
    const summary = getSummary();
    const missions = (typeof NetJourneyMissions!=='undefined') ? {
      solved: NetJourneyMissions.solvedCount, total: NetJourneyMissions.totalCount
    } : null;
    const game = (typeof NetJourneyGame!=='undefined') ? {
      xp: NetJourneyGame.xp, level: NetJourneyGame.levelInfo(), badges: NetJourneyGame.badges
    } : null;

    const report = {
      geradoEm: new Date().toISOString(),
      tempoDeUso: summary.timeSpentLabel,
      quiz: {
        ultimaTentativa: summary.lastQuiz,
        melhorTentativa: summary.bestQuiz,
        totalRespostasCertas: summary.quizAttempts.correct,
        totalRespostasErradas: summary.quizAttempts.wrong
      },
      missoes: missions ? { concluidas: missions.solved, total: missions.total,
        tentativasCertas: summary.missionAttempts.correct, tentativasErradas: summary.missionAttempts.wrong } : null,
      gamificacao: game
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netjourney-relatorio-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetAll(){
    state = { firstVisit: Date.now(), quizHistory:[], missionAttempts:{correct:0,wrong:0}, quizAttempts:{correct:0,wrong:0} };
    save();
  }

  function init(){ save(); } // garante que firstVisit é persistido desde o primeiro carregamento

  return { init, recordQuizResult, recordQuizAnswer, recordMissionAttempt, getSummary, exportReport, resetAll, formatDuration };
})();
