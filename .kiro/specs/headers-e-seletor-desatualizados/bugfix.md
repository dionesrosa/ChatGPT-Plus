# Bugfix Requirements Document

## Introduction

O userscript ChatGPT-Plus parou de funcionar após mudanças na API e no DOM do ChatGPT. Quatro problemas combinados impedem a síntese e reprodução automática de voz: headers obsoletos enviados na requisição, lógica invertida de detecção no interceptor, headers novos não capturados da sessão nativa, e um possível seletor de stop-button desatualizado após reformulação do DOM em 25/09/2026.

## Bug Analysis

### Current Behavior (Defect)

1.1 QUANDO `direct.js` monta a requisição para `/backend-api/synthesize` ENTÃO o sistema inclui os headers `x-openai-target-path` e `x-openai-target-route`, que não existem mais nas requisições nativas do ChatGPT

1.2 QUANDO o interceptor em `interceptor.js` avalia uma requisição de síntese feita pelo próprio script ENTÃO o sistema classifica-a como `isDirectSynthesis = true` (porque detecta os headers `x-openai-target-path` / `x-openai-target-route`), fazendo com que o bloco de captura de áudio nunca seja executado

1.3 QUANDO o interceptor tenta diferenciar a requisição nativa do ChatGPT da requisição feita pelo script ENTÃO o sistema não consegue distingui-las corretamente, pois a única diferença era a presença desses headers — que agora foram removidos do protocolo nativo

1.4 QUANDO `session.js` captura headers das requisições nativas do ChatGPT ENTÃO o sistema ignora `chatgpt-account-id`, `oai-did`, `originator` e `x-openai-web-frontend`, pois essas chaves não constam em `CAPTURE_HEADER_KEYS`

1.5 QUANDO `direct.js` monta a requisição de síntese ENTÃO o sistema não inclui `chatgpt-account-id`, `oai-did`, `originator` e `x-openai-web-frontend` nos headers enviados ao backend

1.6 QUANDO o monitor de geração executa o polling periódico ENTÃO o sistema usa `document.querySelector('[data-testid="stop-button"]')` para detectar se o ChatGPT ainda está gerando resposta, mas após reformulação do DOM em 25/09/2026 esse seletor pode não existir mais, fazendo com que o monitor nunca detecte o fim da geração

### Expected Behavior (Correct)

2.1 QUANDO `direct.js` monta a requisição para `/backend-api/synthesize` ENTÃO o sistema SHALL omitir `x-openai-target-path` e `x-openai-target-route` dos headers enviados

2.2 QUANDO o interceptor avalia uma requisição de síntese feita pelo script ENTÃO o sistema SHALL usar um mecanismo de identificação diferente dos headers `x-openai-target-path` / `x-openai-target-route` para distinguir "requisição do script" de "requisição nativa do ChatGPT"

2.3 QUANDO o interceptor detecta uma requisição nativa de síntese do ChatGPT ENTÃO o sistema SHALL capturar e reproduzir o áudio corretamente

2.4 QUANDO `session.js` captura headers das requisições nativas ENTÃO o sistema SHALL incluir `chatgpt-account-id`, `oai-did`, `originator` e `x-openai-web-frontend` em `CAPTURE_HEADER_KEYS`

2.5 QUANDO `direct.js` monta a requisição de síntese ENTÃO o sistema SHALL incluir os headers `chatgpt-account-id`, `oai-did`, `originator` e `x-openai-web-frontend` com os valores capturados da sessão nativa

2.6 QUANDO o monitor de geração executa o polling ENTÃO o sistema SHALL usar um seletor atualizado (ou estratégia de detecção alternativa) compatível com o DOM do ChatGPT após 25/09/2026

### Unchanged Behavior (Regression Prevention)

3.1 QUANDO o token de autorização ainda não foi capturado da sessão nativa ENTÃO o sistema SHALL CONTINUE TO usar o fallback do `localStorage` e, se necessário, abrir o menu nativo para capturar o token

3.2 QUANDO `conversation_id` ou `message_id` não podem ser extraídos do DOM ENTÃO o sistema SHALL CONTINUE TO registrar aviso e encerrar sem travar o script

3.3 QUANDO uma requisição de síntese retorna HTTP 4xx ou 5xx ENTÃO o sistema SHALL CONTINUE TO ocultar o indicador de carregamento e liberar o lock de reprodução

3.4 QUANDO qualquer requisição ao `backend-api` é feita pelo ChatGPT nativo ENTÃO o sistema SHALL CONTINUE TO capturar os headers `Authorization` e `oai-language` já existentes em `CAPTURE_HEADER_KEYS`

3.5 QUANDO o modo ativo é `interceptor` (não `player`) ENTÃO o sistema SHALL CONTINUE TO capturar o áudio da requisição nativa e reproduzi-lo pelo player customizado sem fazer requisição direta
