/* ==========================================================================
   NetJourney — Dados dos equipamentos (para o painel de inspeção)
   Este arquivo é intencionalmente separado do resto do código para que,
   nas próximas etapas, o motor de missões possa alterar estes valores
   (ex.: "gateway incorreto") sem tocar na lógica de renderização.
   ========================================================================== */

const NETJOURNEY_DEVICES = {

  pc: {
    name: 'Computador do usuário',
    layer: 'Host — todas as camadas',
    desc: 'A máquina onde o usuário digitou o endereço www.ifms.edu.br no navegador. É aqui que a jornada da requisição começa.',
    kv: [
      {k:'Endereço IP', v:'192.168.0.10'},
      {k:'Máscara de sub-rede', v:'255.255.255.0'},
      {k:'Gateway padrão', v:'192.168.0.1'},
      {k:'Endereço MAC', v:'AA:BB:CC:DD:EE:01'},
      {k:'Servidor DNS', v:'8.8.8.8'}
    ],
    table: null
  },

  switch: {
    name: 'Switch de acesso',
    layer: 'Camada 2 — Enlace',
    desc: 'Equipamento que encaminha quadros Ethernet dentro da rede local, usando endereços MAC. Ele aprende em qual porta está cada dispositivo observando o tráfego.',
    kv: null,
    table: {
      title: 'Tabela de endereços MAC (aprendida)',
      cols: ['Endereço MAC', 'Porta', 'Dispositivo'],
      rows: [
        ['AA:BB:CC:DD:EE:01', '1', 'Computador do usuário'],
        ['11:22:33:44:55:02', '2', 'Roteador (Gateway)']
      ]
    }
  },

  router: {
    name: 'Roteador / Gateway',
    layer: 'Camada 3 — Rede',
    desc: 'Encaminha pacotes entre a rede local (LAN) e redes externas, com base em endereços IP e na tabela de rotas. É o "portão de saída" da rede local.',
    kv: [
      {k:'IP na LAN', v:'192.168.0.1'},
      {k:'IP na WAN', v:'200.130.10.5'},
      {k:'MAC (interface LAN)', v:'11:22:33:44:55:02'}
    ],
    table: {
      title: 'Tabela de rotas',
      cols: ['Destino', 'Próximo salto', 'Interface'],
      rows: [
        ['192.168.0.0/24', '—  (rede diretamente conectada)', 'LAN'],
        ['0.0.0.0/0  (rota padrão)', '200.130.1.1', 'WAN']
      ]
    }
  },

  cloud: {
    name: 'Internet',
    layer: 'Rede de redes',
    desc: 'A Internet não é um único cabo: é um conjunto de milhares de redes interligadas por roteadores de operadoras (backbones). Um pacote pode atravessar vários roteadores intermediários até chegar ao destino — cada um decidindo, com sua própria tabela de rotas, para onde encaminhar em seguida.',
    kv: [
      {k:'Roteadores atravessados (típico)', v:'8 a 15 saltos'},
      {k:'Protocolo de roteamento entre operadoras', v:'BGP'}
    ],
    table: null
  },

  server: {
    name: 'Servidor Web (IFMS)',
    layer: 'Camada 7 — Aplicação',
    desc: 'A máquina que hospeda o site www.ifms.edu.br. Recebe a requisição HTTP, processa e devolve a página solicitada.',
    kv: [
      {k:'IP público', v:'200.130.55.20'},
      {k:'Domínio', v:'www.ifms.edu.br'},
      {k:'Porta', v:'443 (HTTPS)'},
      {k:'Serviço', v:'Servidor Web (Apache/Nginx)'}
    ],
    table: null
  }

};
