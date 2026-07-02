/* ==========================================================================
   NetJourney — Banco de questões do Quiz (Camada 4)
   Cada questão tem um "topic" usado pelo motor de gamificação para conceder
   medalhas temáticas (ex.: acertar todas as questões de ARP desbloqueia
   "Especialista em ARP").
   ========================================================================== */

const NETJOURNEY_QUIZ = [
  {
    topic:'geral',
    q:'Qual é a principal função do switch em uma rede local?',
    opts:[
      'Traduzir nomes de domínio em endereços IP',
      'Encaminhar quadros entre dispositivos da mesma rede usando endereços MAC',
      'Conectar a rede local à Internet',
      'Armazenar as páginas web visitadas'
    ], correct:1,
    exp:'O switch opera na camada de enlace (camada 2) e encaminha quadros Ethernet dentro da rede local com base na tabela de endereços MAC que ele aprende.'
  },
  {
    topic:'geral',
    q:'Qual é a principal função do roteador (gateway) em uma rede local?',
    opts:[
      'Encaminhar pacotes entre a rede local e outras redes, com base em endereços IP',
      'Resolver nomes de domínio como www.ifms.edu.br',
      'Armazenar os endereços MAC de todos os dispositivos da internet',
      'Executar o sistema operacional dos computadores da rede'
    ], correct:0,
    exp:'O roteador opera na camada de rede (camada 3) e decide, com base em sua tabela de rotas, para onde encaminhar cada pacote — inclusive para fora da rede local, rumo à Internet.'
  },
  {
    topic:'ip-mac',
    q:'Qual a diferença fundamental entre um endereço IP e um endereço MAC?',
    opts:[
      'Não há diferença, são sinônimos',
      'O MAC identifica logicamente a rede; o IP identifica fisicamente o fabricante',
      'O IP é um endereço lógico que pode mudar conforme a rede; o MAC é físico e fixo na placa de rede',
      'O IP é usado só por switches; o MAC só por roteadores'
    ], correct:2,
    exp:'O endereço MAC é gravado de fábrica na interface de rede e não muda. O IP é um endereço lógico, atribuído conforme a rede em que o dispositivo está — por isso pode (e costuma) mudar.'
  },
  {
    topic:'ip-mac',
    q:'Se você levar seu notebook de uma rede Wi-Fi para outra, o que normalmente muda?',
    opts:[
      'O endereço MAC da placa de rede',
      'O endereço IP atribuído ao notebook',
      'Nada muda em nenhum dos dois endereços',
      'O endereço MAC e o IP mudam juntos sempre'
    ], correct:1,
    exp:'O endereço MAC é fixo na placa de rede. Já o IP costuma ser atribuído pela rede à qual você se conecta — por isso ele muda a cada rede diferente.'
  },
  {
    topic:'arp',
    q:'Para que serve o protocolo ARP?',
    opts:[
      'Para traduzir nomes de domínio em endereços IP',
      'Para descobrir qual endereço MAC corresponde a um determinado endereço IP na rede local',
      'Para estabelecer uma conexão confiável entre dois computadores',
      'Para criptografar o tráfego da rede'
    ], correct:1,
    exp:'ARP (Address Resolution Protocol) resolve a pergunta "quem tem este IP?" respondendo com o endereço MAC correspondente — essencial para que o quadro Ethernet saiba para qual MAC ser enviado.'
  },
  {
    topic:'arp',
    q:'Antes de enviar dados para a Internet, por que o computador precisa fazer uma consulta ARP para o gateway?',
    opts:[
      'Porque precisa saber o endereço MAC do gateway para montar o quadro Ethernet corretamente',
      'Porque precisa saber a senha da rede Wi-Fi',
      'Porque o ARP substitui a necessidade de um endereço IP',
      'Isso não é necessário, o ARP só é usado por servidores'
    ], correct:0,
    exp:'Mesmo sabendo o IP do gateway, o computador precisa do endereço MAC dele para poder enviar um quadro Ethernet — e é o ARP que fornece essa informação.'
  },
  {
    topic:'dns',
    q:'Qual é a função do DNS?',
    opts:[
      'Encaminhar pacotes entre redes diferentes',
      'Converter nomes de domínio (como www.ifms.edu.br) em endereços IP',
      'Verificar se um site está usando conexão segura',
      'Definir a velocidade máxima da conexão'
    ], correct:1,
    exp:'O DNS funciona como uma "agenda telefônica" da Internet: transforma nomes fáceis de lembrar em endereços IP, que são o que os roteadores realmente usam para encaminhar o tráfego.'
  },
  {
    topic:'dns',
    q:'Se o servidor DNS configurado no computador estiver incorreto, o que normalmente acontece?',
    opts:[
      'O computador perde o endereço MAC',
      'Sites deixam de carregar por nome (ex.: www.ifms.edu.br), mesmo com a rede local funcionando',
      'O roteador para de encaminhar pacotes para todos os dispositivos',
      'Nada acontece, o DNS é opcional'
    ], correct:1,
    exp:'Sem conseguir resolver o nome para um IP, o navegador não sabe para onde se conectar — por isso o sintoma típico é "site não encontrado", mesmo com o resto da rede operando normalmente.'
  },
  {
    topic:'gateway-roteamento',
    q:'O que é o "gateway padrão" configurado em um computador?',
    opts:[
      'O servidor que hospeda os sites que o usuário visita',
      'O endereço IP do roteador que serve como saída da rede local para outras redes',
      'O nome do roteador Wi-Fi',
      'O endereço MAC do próprio computador'
    ], correct:1,
    exp:'O gateway padrão é o "portão de saída": quando o destino de um pacote não está na rede local, o computador o envia para esse endereço, que geralmente é o roteador.'
  },
  {
    topic:'gateway-roteamento',
    q:'Com base em que um roteador decide para onde encaminhar um pacote?',
    opts:[
      'Na tabela de rotas, comparando o IP de destino com as redes conhecidas',
      'No endereço MAC de origem do pacote',
      'No nome de domínio do site de destino',
      'Em um sorteio entre as interfaces disponíveis'
    ], correct:0,
    exp:'O roteador consulta sua tabela de rotas para descobrir qual é o próximo salto (ou interface de saída) mais adequado para o IP de destino do pacote.'
  },
  {
    topic:'tcp',
    q:'O que é o "three-way handshake" do TCP?',
    opts:[
      'Uma forma de criptografar a conexão',
      'A sequência SYN → SYN-ACK → ACK usada para estabelecer uma conexão confiável antes de trocar dados',
      'O processo de resolução de nomes DNS',
      'Um tipo de erro de rede'
    ], correct:1,
    exp:'Antes de trocar dados de aplicação (como uma requisição HTTP), o TCP estabelece a conexão com essa troca de três mensagens, garantindo que ambos os lados estão prontos para se comunicar.'
  },
  {
    topic:'http',
    q:'O que significa a resposta "200 OK" de um servidor HTTP?',
    opts:[
      'Que houve um erro grave no servidor',
      'Que a página não foi encontrada',
      'Que a requisição foi bem-sucedida e o conteúdo está sendo devolvido',
      'Que o servidor está sobrecarregado'
    ], correct:2,
    exp:'"200 OK" é o código de status HTTP que indica sucesso: o servidor processou a requisição corretamente e está retornando o conteúdo solicitado.'
  }
];
