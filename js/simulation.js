/* ==========================================================================
   NetJourney — Motor de simulação (Camada 2)
   Percorre a jornada de uma requisição HTTP real: DNS → ARP → TCP → HTTP,
   animando um pacote sobre a topologia SVG e alimentando o log de eventos.
   ========================================================================== */

const NetJourneySimulation = (function(){

  const PROTO_COLOR = {
    dns:  'var(--proto-dns)',
    arp:  'var(--proto-arp)',
    tcp:  'var(--proto-tcp)',
    http: 'var(--proto-http)',
    eth:  'var(--proto-eth)'
  };
  // valores resolvidos (sem var()) para uso em atributos SVG que não aceitam custom properties
  // em todos os navegadores — resolvidos em runtime a partir do :root computado.
  function resolveColor(token){
    return getComputedStyle(document.documentElement).getPropertyValue(
      {dns:'--proto-dns', arp:'--proto-arp', tcp:'--proto-tcp', http:'--proto-http', eth:'--proto-eth'}[token]
    ).trim() || '#5eead4';
  }

  /* ---------------- A jornada completa ---------------- */
  const STEPS = [
    {
      id:'start', phase:'eth', path:null,
      scenario:'Usuário digitou a URL no navegador.',
      log:{proto:'eth', msg:'Usuário digitou: www.ifms.edu.br e pressionou Enter.'},
      highlight:['pc']
    },
    {
      id:'dns-query', phase:'dns', path:['pc','switch','router','cloud'], tag:'DNS?',
      scenario:'Consultando o DNS para descobrir o endereço IP de www.ifms.edu.br...',
      log:{proto:'dns', msg:'Consulta DNS enviada: qual é o IP de www.ifms.edu.br?'},
      highlight:['pc','switch','router','cloud']
    },
    {
      id:'dns-response', phase:'dns', path:['cloud','router','switch','pc'], tag:'DNS✓',
      scenario:'Servidor DNS respondeu com o endereço IP.',
      log:{proto:'dns', msg:'Resposta DNS recebida: www.ifms.edu.br = 200.130.55.20'},
      highlight:['cloud','router','switch','pc']
    },
    {
      id:'arp-request', phase:'arp', path:['pc','switch','router'], tag:'ARP?',
      scenario:'Antes de enviar dados, o computador precisa do endereço MAC do gateway (roteador).',
      log:{proto:'arp', msg:'ARP (broadcast): quem possui o IP 192.168.0.1?'},
      highlight:['pc','switch','router']
    },
    {
      id:'arp-reply', phase:'arp', path:['router','switch','pc'], tag:'ARP✓',
      scenario:'O gateway respondeu à consulta ARP com seu endereço MAC.',
      log:{proto:'arp', msg:'ARP reply: 192.168.0.1 está em 11:22:33:44:55:02'},
      highlight:['router','switch','pc']
    },
    {
      id:'tcp-syn', phase:'tcp', path:['pc','switch','router','cloud','server'], tag:'SYN',
      scenario:'Iniciando conexão TCP com o servidor (etapa 1 do three-way handshake)...',
      log:{proto:'tcp', msg:'TCP SYN enviado — solicitando abertura de conexão na porta 443'},
      highlight:['pc','server']
    },
    {
      id:'tcp-synack', phase:'tcp', path:['server','cloud','router','switch','pc'], tag:'SYN-ACK',
      scenario:'Servidor aceitou o pedido de conexão (etapa 2 do handshake).',
      log:{proto:'tcp', msg:'TCP SYN-ACK recebido — servidor aceitou a conexão'},
      highlight:['server','pc']
    },
    {
      id:'tcp-ack', phase:'tcp', path:['pc','switch','router','cloud','server'], tag:'ACK',
      scenario:'Conexão TCP estabelecida (etapa 3 do handshake completa).',
      log:{proto:'tcp', msg:'TCP ACK enviado — conexão estabelecida'},
      highlight:['pc','server']
    },
    {
      id:'http-get', phase:'http', path:['pc','switch','router','cloud','server'], tag:'GET',
      scenario:'Enviando a requisição HTTP para buscar a página.',
      log:{proto:'http', msg:'HTTP GET / HTTP/1.1  —  Host: www.ifms.edu.br'},
      highlight:['pc','server']
    },
    {
      id:'http-response', phase:'http', path:['server','cloud','router','switch','pc'], tag:'200',
      scenario:'Servidor respondeu com sucesso.',
      log:{proto:'http', msg:'HTTP/1.1 200 OK — página recebida (14 KB)'},
      highlight:['server','pc']
    },
    {
      id:'done', phase:'ok', path:null,
      scenario:'Página www.ifms.edu.br carregada com sucesso!',
      log:{proto:'ok', msg:'Página carregada com sucesso. Jornada concluída.'},
      highlight:['pc']
    }
  ];

  const HOP_DURATION_MS = 650; // por salto, em velocidade 1x
  const PAUSE_BETWEEN_STEPS_MS = 550;

  let currentIndex = -1;
  let playing = false;
  let busy = false; // true enquanto uma animação de passo está em andamento
  let speed = 1;
  let onStepChange = null; // callback opcional (usado por futuras camadas: missões/gamificação)

  /* ---------------- helpers de DOM ---------------- */
  function svgEl(){ return document.getElementById('topologySvg'); }

  function clearHighlights(){
    document.querySelectorAll('.device-node.hl-active').forEach(n=>{
      n.classList.remove('hl-active');
      n.style.removeProperty('--hl-color');
      n.style.removeProperty('--hl-glow');
    });
  }

  function applyHighlights(deviceIds, protoToken){
    clearHighlights();
    const color = resolveColor(protoToken);
    (deviceIds||[]).forEach(id=>{
      const node = document.querySelector(`.device-node[data-device="${id}"]`);
      if(node){
        node.classList.add('hl-active');
        node.style.setProperty('--hl-color', color);
        node.style.setProperty('--hl-glow', color+'73');
      }
    });
  }

  function setScenario(msg, live){
    const bar = document.getElementById('scenarioBar');
    const msgEl = document.getElementById('scenarioMsg');
    if(msgEl) msgEl.textContent = msg;
    if(bar) bar.classList.toggle('live', !!live);
  }

  function updateProgressUI(){
    const total = STEPS.length;
    const done = Math.max(0, currentIndex+1);
    const pct = Math.round((done/total)*100);
    const progressEl = document.getElementById('simProgress');
    const fillEl = document.getElementById('simProgressFill');
    if(progressEl) progressEl.textContent = `Passo ${done} de ${total}`;
    if(fillEl) fillEl.style.width = pct+'%';
  }

  /* ---------------- animação do pacote ---------------- */
  function buildPacketNode(tag, protoToken){
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS,'g');
    g.setAttribute('class','active-packet');
    const color = resolveColor(protoToken);

    const circle = document.createElementNS(NS,'circle');
    circle.setAttribute('class','packet-core');
    circle.setAttribute('r','9');
    circle.setAttribute('fill', color);
    g.appendChild(circle);

    if(tag){
      const bg = document.createElementNS(NS,'rect');
      const w = Math.max(30, tag.length*8+14);
      bg.setAttribute('class','packet-tag-bg');
      bg.setAttribute('x', -w/2); bg.setAttribute('y', -30);
      bg.setAttribute('width', w); bg.setAttribute('height', 16);
      bg.setAttribute('rx', 8);
      g.appendChild(bg);

      const text = document.createElementNS(NS,'text');
      text.setAttribute('class','packet-tag');
      text.setAttribute('x', 0); text.setAttribute('y', -18);
      text.setAttribute('fill', color);
      text.textContent = tag;
      g.appendChild(text);
    }
    return g;
  }

  function smoothstep(t){ return t*t*(3-2*t); }

  function animatePacketAlongPath(path, tag, protoToken, onDone){
    const positions = path.map(id => NetJourneyTopology.positions[id]);
    const g = buildPacketNode(tag, protoToken);
    svgEl().appendChild(g);

    const segCount = positions.length - 1;
    const segDuration = (HOP_DURATION_MS / speed);
    let segIndex = 0;
    let segStart = performance.now();

    function place(x,y){ g.setAttribute('transform', `translate(${x},${y})`); }
    place(positions[0].x, positions[0].y);

    function tick(now){
      const elapsed = now - segStart;
      let t = Math.min(1, elapsed/segDuration);
      const a = positions[segIndex], b = positions[segIndex+1];
      const et = smoothstep(t);
      place(a.x + (b.x-a.x)*et, a.y + (b.y-a.y)*et);

      if(t>=1){
        segIndex++;
        if(segIndex>=segCount){
          g.remove();
          if(onDone) onDone();
          return;
        }
        segStart = now;
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  /* ---------------- execução de um passo ---------------- */
  function runStep(index, callback){
    if(index<0 || index>=STEPS.length){ if(callback) callback(); return; }
    busy = true;
    const step = STEPS[index];
    currentIndex = index;

    setScenario(step.scenario, step.phase!=='ok' && index<STEPS.length-1);
    applyHighlights(step.highlight, step.phase);
    if(step.log) NetJourneyUI.addLogEntry(step.log);
    updateProgressUI();
    if(typeof onStepChange==='function') onStepChange(step, index);

    if(step.path){
      animatePacketAlongPath(step.path, step.tag, step.phase, ()=>{
        busy = false;
        if(callback) callback();
      });
    } else {
      window.setTimeout(()=>{ busy=false; if(callback) callback(); }, 400/speed);
    }
  }

  function next(){
    if(busy) return;
    if(currentIndex>=STEPS.length-1) return;
    runStep(currentIndex+1);
  }

  function play(){
    if(playing) return;
    playing = true;
    updatePlayButton();
    loop();
  }
  function loop(){
    if(!playing) return;
    if(currentIndex>=STEPS.length-1){ playing=false; updatePlayButton(); clearHighlights(); return; }
    if(busy) { window.setTimeout(loop, 80); return; }
    runStep(currentIndex+1, ()=>{
      if(!playing) return;
      window.setTimeout(loop, PAUSE_BETWEEN_STEPS_MS/speed);
    });
  }
  function pause(){
    playing = false;
    updatePlayButton();
  }
  function reset(){
    playing = false;
    busy = false;
    currentIndex = -1;
    clearHighlights();
    document.querySelectorAll('.active-packet').forEach(n=>n.remove());
    NetJourneyUI.clearLog();
    setScenario('Clique em "Iniciar jornada" para acompanhar a requisição passo a passo, ou clique em um equipamento para inspecioná-lo.', false);
    updateProgressUI();
    updatePlayButton();
  }

  function updatePlayButton(){
    const btn = document.getElementById('simPlayBtn');
    if(!btn) return;
    if(playing){
      btn.textContent = '⏸ Pausar';
    } else if(currentIndex>=STEPS.length-1 && currentIndex!==-1){
      btn.textContent = '▶ Reproduzir novamente';
    } else if(currentIndex>=0){
      btn.textContent = '▶ Continuar';
    } else {
      btn.textContent = '▶ Iniciar jornada';
    }
  }

  function togglePlay(){
    if(currentIndex>=STEPS.length-1 && !playing){ reset(); play(); return; }
    if(playing) pause(); else play();
  }

  function setSpeed(v){ speed = parseFloat(v)||1; }

  function init(){
    document.getElementById('simPlayBtn').addEventListener('click', togglePlay);
    document.getElementById('simNextBtn').addEventListener('click', ()=>{ pause(); next(); });
    document.getElementById('simResetBtn').addEventListener('click', reset);
    document.getElementById('simSpeed').addEventListener('change', (e)=> setSpeed(e.target.value));
    updateProgressUI();
    updatePlayButton();
  }

  return {
    init, play, pause, next, reset, togglePlay,
    get steps(){ return STEPS; },
    get currentIndex(){ return currentIndex; },
    get isPlaying(){ return playing; },
    get isBusy(){ return busy; },
    onStepChange: function(cb){ onStepChange = cb; }
  };
})();
