/* ==========================================================================
   NetJourney — Renderização da topologia de rede em SVG
   Camada 1: desenha o diagrama estático (PC → Switch → Roteador → Internet → Servidor).
   A animação de pacotes percorrendo os links será adicionada na Camada 2,
   reaproveitando os elementos <circle class="packet-dot"> já posicionados aqui
   e as coordenadas expostas em NetJourneyTopology.linkPaths.
   ========================================================================== */

const NetJourneyTopology = (function(){

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Posições dos equipamentos no viewBox 1000x380
  const POS = {
    pc:     {x: 95,  y: 195},
    switch: {x: 305, y: 195},
    router: {x: 515, y: 195},
    cloud:  {x: 730, y: 180},
    server: {x: 925, y: 195}
  };

  let onDeviceClickCallback = null;

  function el(tag, attrs, children){
    const node = document.createElementNS(SVG_NS, tag);
    if(attrs){
      Object.keys(attrs).forEach(k => node.setAttribute(k, attrs[k]));
    }
    if(children){
      children.forEach(c => node.appendChild(c));
    }
    return node;
  }

  /* ---------------- Icons (local coordinates, centered at 0,0) ---------------- */

  function iconPC(){
    return [
      el('rect', {class:'node-icon', x:-20, y:-20, width:40, height:26, rx:2}),
      el('line', {class:'node-icon', x1:-26, y1:12, x2:26, y2:12}),
      el('path', {class:'node-icon', d:'M -30,18 L -26,12 L 26,12 L 30,18 Z'})
    ];
  }

  function iconSwitch(){
    const nodes = [ el('rect', {class:'node-icon', x:-32, y:-15, width:64, height:30, rx:3}) ];
    for(let i=0;i<6;i++){
      const px = -24 + i*9.6;
      nodes.push(el('rect', {class:'node-icon', x:px, y:6, width:5, height:5, 'stroke-width':1}));
    }
    return nodes;
  }

  function iconRouter(){
    return [
      el('rect', {class:'node-icon', x:-28, y:-12, width:56, height:26, rx:4}),
      el('path', {class:'node-icon', d:'M -12,-12 L -20,-26'}),
      el('path', {class:'node-icon', d:'M 12,-12 L 20,-26'}),
      el('circle', {class:'node-icon', cx:-20, cy:-28, r:2.4}),
      el('circle', {class:'node-icon', cx:20, cy:-28, r:2.4}),
      el('path', {class:'node-icon', d:'M -8,4 L 8,4 M 8,4 L 3,-1 M 8,4 L 3,9', transform:'translate(0,2)'})
    ];
  }

  function iconCloud(){
    return [
      el('path', {class:'cloud-shape', d:
        'M -78,14 C -86,14 -92,6 -88,-4 C -85,-12 -76,-14 -70,-11 ' +
        'C -68,-24 -50,-32 -36,-26 C -30,-38 -8,-40 2,-28 ' +
        'C 16,-34 34,-26 34,-12 C 46,-12 54,-2 50,8 ' +
        'C 54,14 50,22 42,22 L -68,22 C -76,22 -80,20 -78,14 Z'
      })
    ];
  }

  function iconServer(){
    const nodes = [ el('rect', {class:'node-icon', x:-18, y:-28, width:36, height:56, rx:3}) ];
    [-16,0,16].forEach(y=>{
      nodes.push(el('line', {class:'node-icon', x1:-18, y1:y, x2:18, y2:y}));
      nodes.push(el('circle', {class:'node-icon', cx:10, cy:y-8, r:1.6, 'stroke-width':1}));
    });
    return nodes;
  }

  const ICONS = { pc: iconPC, switch: iconSwitch, router: iconRouter, cloud: iconCloud, server: iconServer };
  const LABELS = { pc: 'Computador', switch: 'Switch', router: 'Roteador', cloud: 'Internet', server: 'Servidor Web' };
  const SUBLABELS = { pc: '192.168.0.10', switch: 'camada 2', router: 'gateway', cloud: 'rede de redes', server: 'www.ifms.edu.br' };

  function buildNode(id){
    const pos = POS[id];
    const g = el('g', {
      class:'device-node',
      'data-device': id,
      transform:`translate(${pos.x},${pos.y})`,
      tabindex:'0',
      role:'button',
      'aria-label': `Inspecionar ${LABELS[id]}`
    });

    if(id !== 'cloud'){
      const boxW = id==='server' ? 90 : (id==='switch' ? 96 : (id==='router' ? 96 : 90));
      const boxH = id==='server' ? 96 : 80;
      g.appendChild(el('rect', {class:'node-box', x:-boxW/2, y:-boxH/2 - 6, width:boxW, height:boxH, rx:12}));
    }

    ICONS[id]().forEach(node => g.appendChild(node));

    const labelY = id==='cloud' ? 46 : (id==='server' ? 46 : 40);
    g.appendChild(el('text', {class:'node-label', x:0, y:labelY}, [document.createTextNode(LABELS[id])]));
    g.appendChild(el('text', {class:'node-sublabel', x:0, y:labelY+14}, [document.createTextNode(SUBLABELS[id])]));

    g.addEventListener('click', ()=> handleDeviceClick(id, g));
    g.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); handleDeviceClick(id, g); }
    });

    return g;
  }

  function handleDeviceClick(id, g){
    document.querySelectorAll('.device-node.selected').forEach(n=>n.classList.remove('selected'));
    g.classList.add('selected');
    if(typeof onDeviceClickCallback === 'function'){
      onDeviceClickCallback(id);
    }
  }

  function linkPath(fromId, toId){
    const a = POS[fromId], b = POS[toId];
    return `M ${a.x},${a.y} L ${b.x},${b.y}`;
  }

  function buildLink(fromId, toId, opts){
    opts = opts || {};
    const g = el('g', {class:'link-group'});
    const a = POS[fromId], b = POS[toId];
    const line = el('path', {
      id: `link-${fromId}-${toId}`,
      class: 'link-line' + (opts.cloud ? ' cloud' : ''),
      d: linkPath(fromId, toId)
    });
    g.appendChild(line);
    // packet dot placeholder, used by the animation engine in a later layer
    const dot = el('circle', {
      class:'packet-dot',
      id:`packet-${fromId}-${toId}`,
      r:6,
      cx:a.x, cy:a.y
    });
    g.appendChild(dot);
    return g;
  }

  function setLinkState(fromId, toId, state){
    const line = document.getElementById(`link-${fromId}-${toId}`);
    if(!line) return;
    line.classList.toggle('link-down', state==='down');
  }

  function render(svgEl){
    while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    const linksLayer = el('g', {class:'links-layer'});
    linksLayer.appendChild(buildLink('pc','switch'));
    linksLayer.appendChild(buildLink('switch','router'));
    linksLayer.appendChild(buildLink('router','cloud', {cloud:true}));
    linksLayer.appendChild(buildLink('cloud','server', {cloud:true}));
    svgEl.appendChild(linksLayer);

    const nodesLayer = el('g', {class:'nodes-layer'});
    Object.keys(POS).forEach(id => nodesLayer.appendChild(buildNode(id)));
    svgEl.appendChild(nodesLayer);
  }

  return {
    render,
    positions: POS,
    linkPath,
    setLinkState,
    onDeviceClick: function(cb){ onDeviceClickCallback = cb; }
  };
})();
