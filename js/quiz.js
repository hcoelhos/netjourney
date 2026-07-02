/* ==========================================================================
   NetJourney — Motor do Quiz (Camada 4)
   ========================================================================== */

const NetJourneyQuiz = (function(){

  let answers = {};
  let submitted = false;

  function render(){
    const list = document.getElementById('quizList');
    if(list.dataset.rendered) return;
    list.dataset.rendered = '1';
    list.innerHTML = NETJOURNEY_QUIZ.map((q,i)=>`
      <div class="quiz-q" id="njq_${i}">
        <div class="qtitle">${i+1}. ${q.q}</div>
        ${q.opts.map((o,j)=>`<button class="quiz-opt" id="njqopt_${i}_${j}" onclick="NetJourneyQuiz.select(${i},${j})">${o}</button>`).join('')}
        <div class="quiz-explain" id="njqexp_${i}">${q.exp}</div>
      </div>
    `).join('');
  }

  function select(qIdx, optIdx){
    if(submitted) return;
    answers[qIdx] = optIdx;
    for(let j=0;j<NETJOURNEY_QUIZ[qIdx].opts.length;j++){
      document.getElementById(`njqopt_${qIdx}_${j}`).classList.toggle('selected', j===optIdx);
    }
  }

  function submit(){
    const total = NETJOURNEY_QUIZ.length;
    if(Object.keys(answers).length < total){
      if(!confirm(`Você respondeu ${Object.keys(answers).length} de ${total} questões. Corrigir mesmo assim?`)) return;
    }
    submitted = true;
    let score = 0, streak = 0, bestStreak = 0, xpEarned = 0;
    const topicAll = {}; // topic -> true (permanece true só se TODAS as questões desse tópico foram acertadas)

    NETJOURNEY_QUIZ.forEach((q,i)=>{
      const chosen = answers[i];
      for(let j=0;j<q.opts.length;j++){
        const el = document.getElementById(`njqopt_${i}_${j}`);
        el.classList.remove('selected');
        if(j===q.correct) el.classList.add('correct');
        else if(j===chosen) el.classList.add('wrong');
      }
      document.getElementById(`njqexp_${i}`).classList.add('show');

      if(topicAll[q.topic]===undefined) topicAll[q.topic] = true;

      if(chosen===q.correct){
        score++; streak++; bestStreak = Math.max(bestStreak, streak);
        xpEarned += 15 + (streak>=3 ? 5 : 0);
        if(typeof NetJourneyAnalytics !== 'undefined') NetJourneyAnalytics.recordQuizAnswer(true);
      } else {
        streak = 0;
        topicAll[q.topic] = false;
        if(typeof NetJourneyAnalytics !== 'undefined') NetJourneyAnalytics.recordQuizAnswer(false);
      }
    });

    const pct = Math.round((score/total)*100);
    document.getElementById('quizScoreBox').innerHTML = `
      <div class="score-box">
        <div class="score-num">${score}/${total}</div>
        <p style="margin-top:10px;">${pct}% de acerto — ${pct>=70?'Excelente! Você domina os conceitos de redes explorados no NetJourney. 🎉':'Revise as explicações acima e tente novamente — cada tentativa é um novo aprendizado.'}</p>
        ${bestStreak>=3?`<p style="font-family:var(--mono); font-size:12px; color:var(--amber); margin-top:6px;">🔥 Melhor sequência: ${bestStreak} acertos seguidos</p>`:''}
      </div>`;

    if(xpEarned>0 && typeof NetJourneyGame !== 'undefined') NetJourneyGame.addXP(xpEarned, `Quiz: ${score}/${total} acertos`);
    if(typeof NetJourneyAnalytics !== 'undefined') NetJourneyAnalytics.recordQuizResult(score, total);
    if(typeof NetJourneyGame !== 'undefined'){
      if(bestStreak>=5) NetJourneyGame.unlockBadge('sequencia');
      if(pct===100) NetJourneyGame.unlockBadge('sem-erros');
      if(topicAll['arp']) NetJourneyGame.unlockBadge('especialista-arp');
      if(topicAll['tcp']) NetJourneyGame.unlockBadge('mestre-tcp');
    }
  }

  function reset(){
    answers = {};
    submitted = false;
    document.getElementById('quizList').dataset.rendered = '';
    document.getElementById('quizScoreBox').innerHTML = '';
    render();
  }

  return { render, select, submit, reset };
})();
