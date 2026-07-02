/* ==========================================================================
   NetJourney — Motor de gamificação (Camada 4)
   Unifica a pontuação de Missões (Camada 3), da Jornada de simulação
   (Camada 2) e do Quiz nesta mesma camada, num placar geral com níveis
   e medalhas.
   ========================================================================== */

const NetJourneyGame = (function(){

  const STORAGE_KEY = 'netjourney_game_v1';

  const LEVELS = [
    {min:0,   title:'Estagiário de TI'},
    {min:150, title:'Técnico de Redes Júnior'},
    {min:350, title:'Técnico de Redes Pleno'},
    {min:600, title:'Analista de Redes'},
    {min:900, title:'Arquiteto de Redes'}
  ];

  const BADGES = [
    {id:'primeira-jornada', icon:'🚀', name:'Primeira Jornada',      desc:'Completou a jornada de simulação (Camada 2) do início ao fim.'},
    {id:'detetive',         icon:'🕵️', name:'Detetive de Redes',     desc:'Resolveu sua primeira missão investigativa.'},
    {id:'investigador',     icon:'🎯', name:'Investigador Completo', desc:'Resolveu todas as 5 missões investigativas.'},
    {id:'mestre-dns',       icon:'🌐', name:'Mestre do DNS',         desc:'Resolveu a missão de DNS incorreto.'},
    {id:'roteador-ninja',   icon:'🥷', name:'Roteador Ninja',        desc:'Resolveu a missão de gateway incorreto.'},
    {id:'especialista-arp', icon:'🔗', name:'Especialista em ARP',   desc:'Acertou todas as questões de ARP do quiz.'},
    {id:'mestre-tcp',       icon:'🤝', name:'Mestre do TCP',         desc:'Acertou todas as questões de TCP do quiz.'},
    {id:'sem-erros',        icon:'💯', name:'Sem Erros',             desc:'Gabaritou o quiz (100%).'},
    {id:'sequencia',        icon:'🔥', name:'Em Chamas',             desc:'Acertou 5 questões seguidas no quiz.'},
    {id:'arquiteto',        icon:'👑', name:'Arquiteto de Redes',    desc:'Alcançou o nível máximo.'}
  ];

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"xp":0,"badges":[],"journeyDone":false}');

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function levelInfo(){
    let idx=0;
    for(let i=0;i<LEVELS.length;i++){ if(state.xp>=LEVELS[i].min) idx=i; }
    return { level:idx+1, title:LEVELS[idx].title, next:LEVELS[idx+1], floor:LEVELS[idx].min };
  }

  function addXP(amount, reason){
    const before = levelInfo();
    state.xp += amount;
    save();
    toast(`+${amount} XP`, reason||'', false);
    renderWidgets();
    const after = levelInfo();
    if(after.level > before.level){
      window.setTimeout(()=> toast('Subiu de nível! 🎉', `Agora você é: ${after.title}`, true), 450);
      if(!after.next) unlockBadge('arquiteto');
    }
  }

  function unlockBadge(id){
    if(state.badges.includes(id)) return;
    state.badges.push(id);
    save();
    const b = BADGES.find(x=>x.id===id);
    if(b) toast(`Conquista desbloqueada ${b.icon}`, b.name, true);
    renderWidgets();
  }

  /* ---------------- Toasts ---------------- */
  function toast(title, sub, isBadge){
    let stack = document.getElementById('gameToastStack');
    if(!stack) return;
    const el = document.createElement('div');
    el.className = 'toast'+(isBadge?' badge':'');
    el.innerHTML = `<div class="t-title">${title}</div><div class="t-sub">${sub||''}</div>`;
    stack.appendChild(el);
    window.setTimeout(()=>el.remove(), 2900);
  }

  /* ---------------- Widgets ---------------- */
  function renderWidgets(){
    const info = levelInfo();
    const chip = document.getElementById('headerLevelChip');
    if(chip) chip.textContent = `⭐ ${info.title} · ${state.xp} XP`;

    const bigLevel = document.getElementById('quizLevelBadge');
    const bigXp = document.getElementById('quizXpCount');
    const bigNext = document.getElementById('quizXpNext');
    const bigFill = document.getElementById('quizXpFill');
    if(bigLevel) bigLevel.textContent = `Nível ${info.level} — ${info.title}`;
    if(bigXp) bigXp.textContent = `${state.xp} XP`;
    if(info.next){
      const span = info.next.min - info.floor;
      const done = state.xp - info.floor;
      const pct = Math.min(100, Math.round((done/span)*100));
      if(bigFill) bigFill.style.width = pct+'%';
      if(bigNext) bigNext.textContent = `${info.next.min - state.xp} XP para "${info.next.title}"`;
    } else {
      if(bigFill) bigFill.style.width = '100%';
      if(bigNext) bigNext.textContent = 'Nível máximo alcançado!';
    }

    const grid = document.getElementById('achievementGrid');
    if(grid){
      grid.innerHTML = BADGES.map(b=>{
        const on = state.badges.includes(b.id);
        return `<div class="achv-item ${on?'on':''}">
          <div class="achv-icon">${b.icon}</div>
          <div>
            <div class="achv-name">${b.name}</div>
            <div class="achv-desc">${b.desc}</div>
          </div>
        </div>`;
      }).join('');
    }
  }

  /* ---------------- Hooks para as outras camadas ---------------- */
  function wireHooks(){
    if(typeof NetJourneyMissions !== 'undefined'){
      NetJourneyMissions.onMissionComplete(function(m){
        addXP(m.points, m.title);
        unlockBadge('detetive');
        if(m.id==='m2') unlockBadge('mestre-dns');
        if(m.id==='m1') unlockBadge('roteador-ninja');
        if(NetJourneyMissions.solvedCount >= NetJourneyMissions.totalCount) unlockBadge('investigador');
      });
    }
    if(typeof NetJourneySimulation !== 'undefined'){
      NetJourneySimulation.onStepChange(function(step){
        if(step.id==='done' && !state.journeyDone){
          state.journeyDone = true;
          save();
          addXP(40, 'Jornada de simulação concluída');
          unlockBadge('primeira-jornada');
        }
      });
    }
  }

  function resetProgress(){
    state = {xp:0, badges:[], journeyDone:false};
    save();
    renderWidgets();
  }

  function init(){
    renderWidgets();
    wireHooks();
  }

  return {
    init, addXP, unlockBadge, resetProgress,
    get xp(){ return state.xp; },
    get badges(){ return state.badges.slice(); },
    get badgeDefs(){ return BADGES; },
    levelInfo
  };
})();
