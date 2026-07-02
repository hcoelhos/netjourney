/* ==========================================================================
   NetJourney — Ponto de entrada
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function(){
  NetJourneyTopology.render(document.getElementById('topologySvg'));
  NetJourneyUI.init();
  NetJourneySimulation.init();
  NetJourneyMissions.init();
  NetJourneyGame.init();
  NetJourneyQuiz.render();
  NetJourneyAnalytics.init();

  // Log de boas-vindas (demonstra o formato que o motor de simulação usará)
  NetJourneyUI.addLogEntry({ proto:'eth', msg:'Topologia carregada. Clique em "Iniciar jornada" ou inspecione um equipamento.' });
});
