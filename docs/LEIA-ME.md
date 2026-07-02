# NetJourney — Projeto Completo (Camadas 1 a 5)

Objeto de aprendizagem interativo que ensina como uma requisição HTTP percorre
uma rede real, do computador do usuário até o servidor web, com simulação
visual, missões investigativas, quiz, gamificação e painel do professor.

## Como abrir
Basta abrir `index.html` em qualquer navegador moderno. Funciona 100% offline,
sem instalação, sem servidor.

## Objetivo e público-alvo
**Objetivo:** ao final, o aluno explica o papel de cada equipamento de rede,
diferencia IP de MAC, compreende ARP, DNS, gateway/roteamento, o three-way
handshake do TCP e o ciclo de requisição/resposta HTTP — e sabe diagnosticar
problemas comuns de configuração de rede.

**Público-alvo:** estudantes de Ensino Técnico em Informática, graduação em
Computação/TI, ou disciplinas de Redes de Computadores. Não exige conhecimento
prévio de redes.

## As 5 camadas construídas

### Camada 1 — Arquitetura + Interface + Topologia
Topologia de rede em SVG puro (Computador → Switch → Roteador → Internet →
Servidor). Clique em qualquer equipamento para abrir um inspetor com dados
técnicos reais (IP, MAC, tabela de rotas, tabela MAC etc.).

### Camada 2 — Motor de Simulação
Um pacote anima-se fisicamente sobre a topologia, percorrendo 11 passos reais:
DNS → ARP → TCP (three-way handshake) → HTTP → página carregada. Log de
eventos em tempo real (estilo Wireshark), controles de play/pause/próximo
passo/velocidade.

### Camada 3 — Missões Investigativas
5 missões (gateway errado, DNS incorreto, IP duplicado, cabo desconectado,
máscara errada) em que o aluno usa o mesmo inspetor de equipamentos — agora
mostrando dados "quebrados" — para diagnosticar e corrigir problemas reais de
rede, como um técnico de suporte faria.

### Camada 4 — Quiz Inteligente + XP/Badges
12 questões cobrindo todo o conteúdo, com explicação após cada resposta sozinha.
Sistema de XP e 5 níveis (Estagiário de TI → Arquiteto de Redes) e 10 medalhas,
unificando a pontuação das Missões, da Jornada de simulação e do próprio Quiz.

### Camada 5 — Painel do Professor + Certificado + Manuais
Relatório individual de desempenho (tempo de uso, progresso, missões, histórico
de quiz), botão de exportação de relatório em `.json`, certificado de conclusão
imprimível/PDF, e manuais completos do professor e do aluno dentro do próprio
objeto (aba "Manual").

## Limitação importante (documentada no Manual do Professor)
Por rodar inteiramente no navegador, sem servidor, o Painel do Professor
reflete o uso de **um aluno por navegador** — não é um dashboard central de
turma. O manual sugere um fluxo prático para contornar isso em sala (exportar
relatório `.json` individual e consolidar manualmente).

## Estrutura de arquivos
```
netjourney/
  index.html
  css/style.css
  js/devices-data.js       → dados de cada equipamento
  js/topology.js           → desenha o SVG da topologia
  js/ui.js                 → navegação, inspetor, log, abas do manual
  js/simulation.js         → motor da jornada do pacote (Camada 2)
  js/missions-data.js      → as 5 missões
  js/missions.js           → motor de missões (Camada 3)
  js/quiz-data.js          → banco de 12 questões
  js/gamification.js       → XP, níveis, medalhas (Camada 4)
  js/quiz.js                → lógica do quiz
  js/analytics.js           → NOVO — tempo de uso, tentativas certas/erradas (Camada 5)
  js/teacher-panel.js       → NOVO — painel do professor + certificado (Camada 5)
  js/main.js
  docs/LEIA-ME.md           → este arquivo
```

## Testado (headless, automatizado, a cada camada)
Cada camada foi validada com testes automatizados via DOM headless antes da
entrega — navegação, simulação completa, as 5 missões resolvidas de ponta a
ponta, quiz com pontuação e medalhas por tópico, painel do professor refletindo
dados reais, certificado, abas do manual, e regressão cruzada confirmando que
nenhuma camada quebrou as anteriores.
