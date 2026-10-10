# Headers e Seletor Desatualizados — Bugfix Design

## Overview

O userscript ChatGPT-Plus parou de funcionar após mudanças no protocolo da API e no DOM do ChatGPT. Quatro falhas combinadas impedem a síntese e a reprodução automática de voz:

1. `direct.js` envia os headers `x-openai-target-path` e `x-openai-target-route`, que foram removidos do protocolo nativo e que agora são a única "marca" usada pelo interceptor para reconhecer requisições do próprio script — criando uma lógica circular quebrada.
2. Com a remoção desses headers, o interceptor (`interceptor.js`) não consegue mais distinguir "minha requisição" de "requisição nativa", e a captura de áudio no modo `interceptor` para de funcionar.
3. Quatro headers novos exigidos pela API (`chatgpt-account-id`, `oai-did`, `originator`, `x-openai-web-frontend`) não são capturados em `session.js` nem reenviados em `direct.js`.
4. O seletor `[data-testid="stop-button"]` em `generation.js` pode não existir mais após a reformulação do DOM em 25/09/2026, fazendo com que o monitor nunca detecte o fim da geração.

A estratégia de correção usa uma flag de estado booleana (`isSynthesizing`) em `state.js` para identificar requisições do próprio script sem depender de nenhum header especial, atualiza `session.js` e `direct.js` para os novos headers, e adiciona múltiplos seletores com fallback em `generation.js`.

## Glossary

- **Bug_Condition (C)**: Conjunto de condições que, isoladamente ou em combinação, impedem o funcionamento do script (headers obsoletos enviados, headers novos ausentes, mecanismo de distinção quebrado, seletor DOM inválido).
- **Property (P)**: O comportamento correto esperado para cada entrada afetada pela condição de bug — síntese disparada, áudio capturado, fim de geração detectado.
- **Preservation**: Comportamentos existentes que NÃO devem ser alterados pela correção (fallback de token, tratamento de erros HTTP, captura dos headers já existentes, modo interceptor).
- **`isSynthesizing`**: Flag booleana a ser adicionada a `state.js`; quando `true`, indica que o script está executando uma requisição de síntese direta, permitindo ao interceptor ignorar essa requisição sem depender de headers especiais.
- **`buildSynthesisHeaders`**: Função em `direct.js` que monta o objeto de headers para a requisição de síntese.
- **`CANONICAL_KEYS`**: Mapa em `session.js` de chave normalizada (lowercase) para nome canônico dos headers de sessão a capturar.
- **`checkGenerationState`**: Função em `generation.js` que faz polling para detectar o fim da geração de resposta.
- **`handleSynthesisResponse`** / bloco equivalente em `buildPageInterceptorSource`: Lógica que decide se uma resposta de `/backend-api/synthesize` deve ter seu áudio capturado.

## Bug Details

### Bug Condition

O bug manifesta-se em quatro situações distintas, que podem ocorrer de forma independente ou combinada.

**Formal Specification:**
```
FUNCTION isBugCondition(context)
  INPUT: context com campos:
    - requestHeaders   : objeto com os headers que direct.js montaria
    - capturedKeys     : lista de chaves em CANONICAL_KEYS
    - stopButtonExists : booleano — seletor atual encontra elemento no DOM
    - mode             : 'player' | 'interceptor'
  OUTPUT: boolean

  // Condição A — headers obsoletos presentes
  condA := 'x-openai-target-path' IN requestHeaders
        OR 'x-openai-target-route' IN requestHeaders

  // Condição B — headers novos ausentes da captura
  condB := 'chatgpt-account-id' NOT IN capturedKeys
        OR 'oai-did'             NOT IN capturedKeys
        OR 'originator'          NOT IN capturedKeys
        OR 'x-openai-web-frontend' NOT IN capturedKeys

  // Condição C — interceptor não distingue requisições (consequência de condA)
  condC := mode = 'interceptor'
        AND NOT ('x-openai-target-path' IN requestHeaders
                 OR 'x-openai-target-route' IN requestHeaders)
        AND isSynthesizingFlag NOT IN state

  // Condição D — seletor DOM obsoleto
  condD := NOT stopButtonExists

  RETURN condA OR condB OR condC OR condD
END FUNCTION
```

### Examples

- **A**: `direct.js` inclui `x-openai-target-path: /backend-api/synthesize` → a requisição é marcada como `isDirectSynthesis = true` pelo interceptor → o bloco de captura de áudio nunca é executado, nem no modo `player` nem no modo `interceptor`.
- **B**: O ChatGPT nativo envia `chatgpt-account-id: abc123` numa requisição → `session.js` ignora a chave → `direct.js` não reenvia esse header → API retorna 401/403.
- **C** (após remover headers obsoletos sem adicionar a flag): O script faz uma requisição para `/backend-api/synthesize` → o interceptor não a distingue de uma requisição nativa → captura e tenta reproduzir o próprio áudio que acabou de ser solicitado, gerando loop.
- **D**: DOM após 25/09/2026 não contém `[data-testid="stop-button"]` → `currentState` sempre `'idle'` → `lastState` nunca transita de `'gerando'` para `'idle'` → `onResponseFinished()` nunca é chamado → reprodução automática nunca dispara.

## Expected Behavior

### Preservation Requirements

**Comportamentos que não devem mudar:**

- QUANDO o token de autorização ainda não foi capturado ENTÃO o script SHALL continuar usando o fallback do `localStorage` e, se necessário, abrir o menu nativo (requisito 3.1).
- QUANDO `conversation_id` ou `message_id` não podem ser extraídos ENTÃO o script SHALL continuar registrando aviso e encerrando sem travar (requisito 3.2).
- QUANDO uma requisição retorna HTTP 4xx ou 5xx ENTÃO o script SHALL continuar ocultando o indicador de carregamento e liberando o lock (requisito 3.3).
- QUANDO qualquer requisição ao `backend-api` é feita pelo ChatGPT nativo ENTÃO o script SHALL continuar capturando `Authorization` e `oai-language` (e os demais headers já existentes) em `CAPTURE_HEADER_KEYS` (requisito 3.4).
- QUANDO o modo ativo é `interceptor` ENTÃO o script SHALL continuar capturando o áudio da requisição nativa e reproduzindo-o pelo player customizado sem fazer requisição direta (requisito 3.5).

**Escopo:**
Toda lógica não relacionada aos quatro arquivos modificados (`session.js`, `direct.js`, `interceptor.js`, `generation.js`, `state.js`) deve permanecer idêntica. Em particular: `audio.js`, `controls.js`, `menu.js`, `settings.js`, `logger.js` e `index.js` não são alterados.

## Hypothesized Root Cause

1. **Headers sentinel obsoletos em `direct.js`**: `buildSynthesisHeaders` adiciona `x-openai-target-path` e `x-openai-target-route` como marcadores para que o interceptor reconheça a própria requisição. Quando a API parou de aceitar esses headers, eles foram removidos do protocolo nativo — mas o script ainda os envia, causando falha na requisição e mantendo a lógica de detecção do interceptor dependente de um campo inexistente.

2. **Ausência de mecanismo de flag interno**: A distinção "minha requisição vs. nativa" deveria ser feita internamente (ex.: variável de estado), não por meio de headers injetados na requisição HTTP. A ausência de tal mecanismo fez o projeto depender de um artefato do protocolo externo.

3. **`CANONICAL_KEYS` não atualizado em `session.js`**: O mapa de captura não inclui `chatgpt-account-id`, `oai-did`, `originator` e `x-openai-web-frontend`. Como `mergeSessionHeaders` itera apenas pelas chaves presentes em `CANONICAL_KEYS`, esses valores nunca são armazenados e, consequentemente, nunca são reenviados por `direct.js`.

4. **Seletor único em `generation.js`**: `document.querySelector('[data-testid="stop-button"]')` não tem fallback. Mudanças de DOM — como a reformulação de 25/09/2026 — silenciosamente quebram a detecção sem nenhum aviso, pois o código simplesmente retorna `null` (interpretado como `'idle'`) em todas as verificações.

## Correctness Properties

Property 1: Bug Condition — Síntese direta funciona com headers atualizados e flag de estado

_For any_ requisição de síntese em que o modo é `player`, `buildSynthesisHeaders` NÃO inclui `x-openai-target-path` nem `x-openai-target-route`, a flag `isSynthesizing` é setada para `true` antes do `fetch` e resetada para `false` após, e os quatro novos headers (`chatgpt-account-id`, `oai-did`, `originator`, `x-openai-web-frontend`) são incluídos quando disponíveis, a função corrigida SHALL executar a requisição e reproduzir o áudio sem interferência do interceptor.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5**

Property 2: Bug Condition — Interceptor distingue requisições pelo estado, não por headers

_For any_ requisição para `/backend-api/synthesize` onde `isSynthesizing` é `true`, o interceptor corrigido SHALL ignorar a resposta (não capturar o áudio). _For any_ requisição para `/backend-api/synthesize` onde `isSynthesizing` é `false` e `response.ok` é verdadeiro, o interceptor SHALL capturar e reproduzir o áudio.

**Validates: Requirements 2.2, 2.3**

Property 3: Bug Condition — Monitor detecta fim de geração com seletores atualizados

_For any_ estado de DOM onde o ChatGPT está gerando resposta, `checkGenerationState` corrigida SHALL retornar `'gerando'` usando ao menos um dos seletores candidatos; quando nenhum botão de stop for encontrado, SHALL retornar `'idle'`.

**Validates: Requirements 2.6**

Property 4: Preservation — Captura de headers existentes não é afetada

_For any_ requisição nativa ao `backend-api` que contenha headers já presentes em `CANONICAL_KEYS`, a função `mergeSessionHeaders` SHALL continuar armazenando esses valores em `sessionHeaders` com o mesmo comportamento de antes.

**Validates: Requirements 3.4**

## Fix Implementation

### Changes Required

#### Arquivo: `src/core/state.js`

**Mudança**: Adicionar a flag `isSynthesizing` e suas funções de controle.

```
// Adicionar:
export let isSynthesizing = false;

export function setSynthesizing(value) {
    isSynthesizing = value;
}
```

---

#### Arquivo: `src/synthesis/session.js`

**Mudança**: Adicionar os quatro novos headers a `CANONICAL_KEYS`.

```
// Adicionar ao mapa CANONICAL_KEYS:
'chatgpt-account-id':      'Chatgpt-Account-Id',
'oai-did':                 'OAI-DID',
'originator':              'Originator',
'x-openai-web-frontend':   'X-OpenAI-Web-Frontend',
```

Como `CAPTURE_HEADER_KEYS = Object.values(CANONICAL_KEYS)`, a lista de captura é atualizada automaticamente.

---

#### Arquivo: `src/synthesis/direct.js`

**Mudanças**:

1. Importar `setSynthesizing` de `state.js`.
2. Em `buildSynthesisHeaders`:
   - Remover `x-openai-target-path` e `x-openai-target-route`.
   - Adicionar os quatro novos headers, chamando `getSessionHeader()` para cada um.
   - Omitir chaves cujo valor seja nulo/vazio (não enviar strings vazias).
3. Em `requestSynthesisDirect`, envolver o `fetch` com `setSynthesizing(true)` antes e `setSynthesizing(false)` no `finally`.

**Pseudocódigo de `buildSynthesisHeaders` corrigida:**
```
FUNCTION buildSynthesisHeaders(authToken)
  headers := { authorization: authToken }

  FOR EACH [sessionKey, headerName] IN [
    ['OAI-Language',              'oai-language'],
    ['OAI-Session-Id',            'oai-session-id'],
    ['OAI-Device-Id',             'oai-device-id'],
    ['OAI-Client-Build-Number',   'oai-client-build-number'],
    ['OAI-Client-Version',        'oai-client-version'],
    ['X-OAI-IS-Client-Observation','x-oai-is-client-observation'],
    ['Chatgpt-Account-Id',        'chatgpt-account-id'],
    ['OAI-DID',                   'oai-did'],
    ['Originator',                'originator'],
    ['X-OpenAI-Web-Frontend',     'x-openai-web-frontend'],
  ] DO
    value := getSessionHeader(sessionKey) ?? (sessionKey = 'OAI-Language' ? 'pt-BR' : null)
    IF value IS NOT null AND value != '' THEN
      headers[headerName] := value
    END IF
  END FOR

  RETURN headers
END FUNCTION
```

**Pseudocódigo de `requestSynthesisDirect` corrigida (trecho relevante):**
```
setSynthesizing(true)
TRY
  response := await fetch(url, { method: 'GET', credentials: 'include', headers: buildSynthesisHeaders(authToken) })
  // ... restante do tratamento de resposta inalterado ...
FINALLY
  setSynthesizing(false)
END TRY
```

---

#### Arquivo: `src/synthesis/interceptor.js`

**Mudanças**:

1. Importar `isSynthesizing` de `state.js` no contexto Tampermonkey.
2. Em `handleSynthesisResponse`: substituir a verificação de headers obsoletos por `isSynthesizing`.
3. Em `buildPageInterceptorSource` (contexto da página): a flag de página não tem acesso direto a `state.js` (contexto isolado). A solução é usar um `CustomEvent` de sinalização: antes de `fetch` em `direct.js`, disparar `window.dispatchEvent(new CustomEvent('cgpt-plus-synthesizing', { detail: true }))`, e o código injetado na página escuta esse evento para setar uma variável local `__cgptIsSynthesizing`. Alternativamente — e mais simples — o código injetado pode verificar se `window.__cgptIsSynthesizing` é `true` (setado pelo Tampermonkey via `unsafeWindow` ou pelo próprio `patchLocalFetch`).

**Abordagem escolhida**: usar `window.__cgptIsSynthesizing` como ponte entre o contexto Tampermonkey e o código injetado na página, pois o `patchLocalFetch` já roda no mesmo contexto que o código injetado pode ler.

**Pseudocódigo de `handleSynthesisResponse` corrigida:**
```
FUNCTION handleSynthesisResponse(url, headers, response)
  IF NOT url.includes('backend-api/synthesize') THEN RETURN
  IF isSynthesizing THEN RETURN          // requisição do próprio script — ignorar
  IF NOT response.ok THEN RETURN
  // capturar áudio normalmente
END FUNCTION
```

**Pseudocódigo do bloco equivalente em `buildPageInterceptorSource` corrigido:**
```
// No fetch interceptado na página:
IF url.includes('backend-api/synthesize')
   AND NOT window.__cgptIsSynthesizing
   AND response.ok THEN
  // capturar áudio
END IF
```

Em `direct.js`, antes e depois do fetch:
```
window.__cgptIsSynthesizing = true   // antes
// ... fetch ...
window.__cgptIsSynthesizing = false  // no finally
```

---

#### Arquivo: `src/monitor/generation.js`

**Mudança**: Substituir o seletor único por uma função que tenta múltiplos seletores em ordem de prioridade, com log de aviso na primeira vez que o seletor padrão falha.

**Pseudocódigo de `findStopButton` nova:**
```
FUNCTION findStopButton()
  SELECTORS := [
    '[data-testid="stop-button"]',
    '[data-testid="composer-cancel-button"]',
    'button[aria-label="Stop generating"]',
    'button[aria-label="Parar de gerar"]',
    'button[data-testid*="stop"]',
  ]

  FOR EACH selector IN SELECTORS DO
    el := document.querySelector(selector)
    IF el IS NOT null THEN RETURN el
  END FOR

  RETURN null
END FUNCTION
```

`checkGenerationState` passa a chamar `findStopButton()` em vez de `document.querySelector(...)` diretamente.

## Testing Strategy

### Validation Approach

A estratégia segue duas fases: (1) executar os testes exploratórios no código **não corrigido** para confirmar ou refutar a análise de causa raiz; (2) após a correção, verificar que todas as condições de bug foram resolvidas e que os comportamentos de preservação permanecem intactos.

### Exploratory Bug Condition Checking

**Objetivo**: Evidenciar as falhas antes da correção, confirmando cada causa raiz identificada.

**Plano de testes**:

1. **Headers obsoletos presentes** (vai falhar no código original): Montar `buildSynthesisHeaders('Bearer test')` e afirmar que as chaves `x-openai-target-path` e `x-openai-target-route` estão presentes — esperado: `true` (confirma o bug).
2. **Interceptor marca requisição como `isDirectSynthesis`** (vai falhar no código original): Chamar `handleSynthesisResponse` com um objeto de headers contendo `x-openai-target-path` e verificar que a captura de áudio NÃO ocorre.
3. **Headers novos ausentes na captura** (vai falhar no código original): Chamar `mergeSessionHeaders({ 'chatgpt-account-id': 'acc1' })` e verificar que `sessionHeaders['Chatgpt-Account-Id']` é `undefined` — esperado no bug: `undefined`.
4. **Seletor DOM obsoleto** (depende do DOM disponível): Verificar que `document.querySelector('[data-testid="stop-button"]')` retorna `null` num DOM pós-25/09/2026.

**Contra-exemplos esperados**:
- `buildSynthesisHeaders` retorna objeto com `x-openai-target-path`.
- `handleSynthesisResponse` retorna cedo quando os headers obsoletos estão presentes.
- `mergeSessionHeaders` ignora chaves fora de `CANONICAL_KEYS`.
- `checkGenerationState` retorna sempre `'idle'` quando o seletor não existe.

### Fix Checking

**Objetivo**: Verificar que, para todas as entradas em que a condição de bug se aplica, a função corrigida produz o comportamento esperado.

**Pseudocódigo:**
```
FOR ALL context WHERE isBugCondition(context) DO
  result := functionFixed(context)
  ASSERT expectedBehavior(result)
END FOR
```

**Casos de teste**:
1. `buildSynthesisHeaders` NÃO deve conter `x-openai-target-path` nem `x-openai-target-route`.
2. `buildSynthesisHeaders` com `getSessionHeader('Chatgpt-Account-Id') = 'acc1'` deve incluir `'chatgpt-account-id': 'acc1'`.
3. `buildSynthesisHeaders` com `getSessionHeader('OAI-DID') = null` não deve incluir a chave `'oai-did'`.
4. `handleSynthesisResponse` com `isSynthesizing = true` não deve chamar `playWithCustomPlayer`.
5. `handleSynthesisResponse` com `isSynthesizing = false` e `response.ok = true` deve chamar `playWithCustomPlayer`.
6. `mergeSessionHeaders({ 'chatgpt-account-id': 'acc1' })` deve armazenar `sessionHeaders['Chatgpt-Account-Id'] = 'acc1'`.
7. `findStopButton()` deve retornar elemento quando qualquer um dos seletores alternativos existe no DOM.
8. `requestSynthesisDirect` deve setar `isSynthesizing = true` antes do fetch e `false` após, mesmo em caso de erro.

### Preservation Checking

**Objetivo**: Verificar que, para todas as entradas em que a condição de bug NÃO se aplica, a função corrigida produz o mesmo resultado que a função original.

**Pseudocódigo:**
```
FOR ALL context WHERE NOT isBugCondition(context) DO
  ASSERT functionOriginal(context) = functionFixed(context)
END FOR
```

**Abordagem**: Testes baseados em propriedades são recomendados para preservation checking — eles geram automaticamente muitos cenários e cobrem casos de borda que testes manuais podem perder.

**Casos de teste**:

1. **Preservação de headers existentes**: `mergeSessionHeaders` com chaves já presentes em `CANONICAL_KEYS` deve continuar atualizando `sessionHeaders` corretamente.
2. **Preservação do fallback de token**: `resolveAuthToken` deve continuar retornando valor do `localStorage` quando `getAuthorizationHeader()` retorna `null`.
3. **Preservação de erros HTTP**: Quando `response.ok = false`, `requestSynthesisDirect` deve continuar chamando `hideLoadingIndicator` e `releaseReadingLock`.
4. **Preservação do modo interceptor**: Com `PLAY_MODE = 'interceptor'` e `isSynthesizing = false`, o interceptor deve continuar capturando áudio de requisições nativas.
5. **Preservação da detecção `'gerando'`**: Quando o DOM contém `[data-testid="stop-button"]`, `findStopButton()` ainda deve retornar esse elemento (seletor original mantido como primeira opção).

### Unit Tests

- Testar `buildSynthesisHeaders` para ausência de headers obsoletos.
- Testar `buildSynthesisHeaders` para presença condicional de cada novo header (presente vs. ausente no `sessionHeaders`).
- Testar `mergeSessionHeaders` com cada uma das quatro novas chaves.
- Testar `handleSynthesisResponse` nos dois estados de `isSynthesizing`.
- Testar `findStopButton` com cada seletor individualmente presente no DOM (mock).
- Testar `setSynthesizing` / `isSynthesizing` em `state.js`.

### Property-Based Tests

- Gerar aleatoriamente objetos `sessionHeaders` com subconjuntos de todas as chaves conhecidas; verificar que `buildSynthesisHeaders` nunca inclui `x-openai-target-path` ou `x-openai-target-route` e nunca inclui chaves com valor nulo/vazio.
- Gerar aleatoriamente lotes de headers raw e verificar que `mergeSessionHeaders` armazena exatamente as chaves presentes em `CANONICAL_KEYS` e ignora as demais.
- Gerar aleatoriamente sequências de chamadas `setSynthesizing(true/false)` intercaladas com `handleSynthesisResponse` e verificar que captura de áudio só ocorre quando `isSynthesizing = false`.

### Integration Tests

- Simular fluxo completo no modo `player`: geração finalizada → `checkGenerationState` detecta → `requestSynthesisDirect` executada → `isSynthesizing` setada/resetada → interceptor não interfere → `playWithCustomPlayer` chamada.
- Simular fluxo completo no modo `interceptor`: requisição nativa de síntese chega → `isSynthesizing = false` → interceptor captura áudio → `playWithCustomPlayer` chamada.
- Simular DOM pós-25/09/2026 sem `[data-testid="stop-button"]` mas com `[data-testid="composer-cancel-button"]` → `checkGenerationState` detecta corretamente os estados `'gerando'` e `'idle'`.
