/* ==========================================================================
   NetJourney — Dados das missões investigativas (Camada 3)
   Cada missão descreve: o sintoma relatado pelo usuário, os valores "quebrados"
   que substituem temporariamente os dados reais nos painéis de inspeção,
   a pergunta de diagnóstico e a correção esperada.
   ========================================================================== */

const DIAG_BANK = {
  gateway: 'Gateway configurado incorretamente no computador',
  dns: 'Servidor DNS configurado incorretamente',
  dup: 'Endereço IP duplicado na rede',
  cable: 'Cabo de rede desconectado (sem link físico)',
  mask: 'Máscara de sub-rede incorreta no computador'
};

const NETJOURNEY_MISSIONS = [
  {
    id:'m1', title:'Missão 1 — A internet não funciona', difficulty:'easy', points:30,
    symptom:'Um usuário liga para o suporte: "Meu computador está conectado, mas nenhum site abre — nem consigo acessar o Google." Você verifica que o cabo está conectado e o switch mostra atividade normal.',
    overrides:{
      pc:{ kv:[
        {k:'Endereço IP', v:'192.168.0.10'},
        {k:'Máscara de sub-rede', v:'255.255.255.0'},
        {k:'Gateway padrão', v:'192.168.0.99', broken:true},
        {k:'Endereço MAC', v:'AA:BB:CC:DD:EE:01'},
        {k:'Servidor DNS', v:'8.8.8.8'}
      ]}
    },
    diagOptions:[DIAG_BANK.dns, DIAG_BANK.gateway, DIAG_BANK.cable, DIAG_BANK.mask],
    diagCorrect:1,
    fixType:'text',
    fixLabel:'Qual deveria ser o gateway padrão correto do computador?',
    fixPlaceholder:'ex: 192.168.0.1',
    fixAnswers:['192.168.0.1'],
    explanation:'O gateway é o "portão de saída" da rede local. Se o computador aponta para um gateway que não existe (ou está errado), todo tráfego destinado à internet se perde ali — mesmo que o restante da rede esteja funcionando perfeitamente. Compare sempre o gateway do computador com o IP real do roteador na LAN.'
  },
  {
    id:'m2', title:'Missão 2 — Site não encontrado', difficulty:'medium', points:45,
    symptom:'O usuário consegue acessar alguns serviços internos normalmente, mas diz: "Quando digito www.ifms.edu.br no navegador, aparece um erro de servidor não encontrado."',
    overrides:{
      pc:{ kv:[
        {k:'Endereço IP', v:'192.168.0.10'},
        {k:'Máscara de sub-rede', v:'255.255.255.0'},
        {k:'Gateway padrão', v:'192.168.0.1'},
        {k:'Endereço MAC', v:'AA:BB:CC:DD:EE:01'},
        {k:'Servidor DNS', v:'4.4.4.4', broken:true}
      ]}
    },
    diagOptions:[DIAG_BANK.gateway, DIAG_BANK.mask, DIAG_BANK.dns, DIAG_BANK.dup],
    diagCorrect:2,
    fixType:'text',
    fixLabel:'Qual servidor DNS deveria estar configurado?',
    fixPlaceholder:'ex: 8.8.8.8',
    fixAnswers:['8.8.8.8'],
    explanation:'O servidor DNS traduz nomes (como www.ifms.edu.br) em endereços IP. Se o DNS configurado no computador está incorreto ou inacessível, o navegador nunca descobre para qual IP se conectar — mesmo que a conectividade de rede em si esteja perfeita.'
  },
  {
    id:'m3', title:'Missão 3 — Conflito de IP', difficulty:'hard', points:60,
    symptom:'A conexão do usuário fica caindo e voltando de forma aleatória, e o sistema operacional chega a exibir um aviso de "conflito de endereço IP detectado na rede".',
    overrides:{
      router:{ kv:[
        {k:'IP na LAN', v:'192.168.0.10', broken:true},
        {k:'IP na WAN', v:'200.130.10.5'},
        {k:'MAC (interface LAN)', v:'11:22:33:44:55:02'}
      ]}
    },
    diagOptions:[DIAG_BANK.cable, DIAG_BANK.dup, DIAG_BANK.gateway, DIAG_BANK.dns],
    diagCorrect:1,
    fixType:'text',
    fixLabel:'Qual deveria ser o IP correto do roteador na LAN?',
    fixPlaceholder:'ex: 192.168.0.1',
    fixAnswers:['192.168.0.1'],
    explanation:'Dois dispositivos não podem usar o mesmo endereço IP na mesma rede ao mesmo tempo. Aqui, o roteador estava configurado com o mesmo IP do computador (192.168.0.10) — os pacotes destinados a esse endereço passam a ter dois destinos possíveis, causando falhas intermitentes para os dois lados.'
  },
  {
    id:'m4', title:'Missão 4 — Sem conexão alguma', difficulty:'easy', points:30,
    symptom:'O usuário relata que o ícone de rede no computador aparece com um X vermelho, e nenhum aplicativo consegue se conectar a absolutamente nada — nem à rede local.',
    overrides:{
      pc:{ kv:[
        {k:'Endereço IP', v:'192.168.0.10'},
        {k:'Máscara de sub-rede', v:'255.255.255.0'},
        {k:'Gateway padrão', v:'192.168.0.1'},
        {k:'Endereço MAC', v:'AA:BB:CC:DD:EE:01'},
        {k:'Servidor DNS', v:'8.8.8.8'},
        {k:'Estado do link Ethernet', v:'Desconectado ⚠', broken:true}
      ]},
      switch:{ table:{
        title:'Tabela de endereços MAC (aprendida)',
        cols:['Endereço MAC','Porta','Dispositivo'],
        rows:[
          ['— (sem link ativo)','1','Computador do usuário'],
          ['11:22:33:44:55:02','2','Roteador (Gateway)']
        ]
      }}
    },
    linkDown:{from:'pc', to:'switch'},
    diagOptions:[DIAG_BANK.dns, DIAG_BANK.mask, DIAG_BANK.gateway, DIAG_BANK.cable],
    diagCorrect:3,
    fixType:'button',
    fixLabel:'Sem link físico ativo entre o computador e o switch. Ação corretiva:',
    fixButtonLabel:'🔌 Reconectar o cabo',
    explanation:'Sem um link físico (ou lógico, em redes sem fio) ativo entre o computador e o switch, nenhum quadro Ethernet consegue sair da máquina. É o problema mais básico da pilha de rede — mas também um dos mais comuns na prática, e por isso é sempre o primeiro item a checar.'
  },
  {
    id:'m5', title:'Missão 5 — Só funciona local', difficulty:'medium', points:45,
    symptom:'O usuário consegue acessar impressoras e outros computadores da mesma sala normalmente, mas reclama: "a internet não funciona" — nenhum site externo carrega.',
    overrides:{
      pc:{ kv:[
        {k:'Endereço IP', v:'192.168.0.10'},
        {k:'Máscara de sub-rede', v:'255.255.0.0', broken:true},
        {k:'Gateway padrão', v:'192.168.0.1'},
        {k:'Endereço MAC', v:'AA:BB:CC:DD:EE:01'},
        {k:'Servidor DNS', v:'8.8.8.8'}
      ]}
    },
    diagOptions:[DIAG_BANK.dup, DIAG_BANK.cable, DIAG_BANK.dns, DIAG_BANK.mask],
    diagCorrect:3,
    fixType:'text',
    fixLabel:'Qual deveria ser a máscara de sub-rede correta?',
    fixPlaceholder:'ex: 255.255.255.0',
    fixAnswers:['255.255.255.0'],
    explanation:'A máscara de sub-rede define até onde vai a rede local. Uma máscara maior do que deveria (255.255.0.0 em vez de 255.255.255.0) faz o computador tratar como "locais" endereços que na verdade estão fora da rede — ele tenta falar diretamente com eles em vez de enviar pelo gateway, e a comunicação externa falha.'
  }
];
