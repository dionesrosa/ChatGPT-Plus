// ============================
//  Configurações do script
// ============================
const SCRIPT_NAME    = 'ChatGPT Plus';
const SCRIPT_VERSION = '0.3.0';

/**
 * Modos de reprodução disponíveis:
 *
 *  'ui'     – Modo 1 (padrão anterior): simula cliques na interface do ChatGPT
 *             para acionar o botão nativo de "Ler em voz alta".
 *
 *  'player' – Modo 2: extrai message_id e conversation_id do DOM e faz a
 *             requisição de síntese diretamente, reutilizando os headers de
 *             sessão capturados do tráfego real. O áudio é reproduzido em um
 *             player próprio, sem depender da UI nativa do ChatGPT.
 */
const PLAY_MODE = 'player'; // 'ui' | 'player'

/** Voz a usar no modo 'player'. Valores conhecidos: cove, ember, breeze, juniper, etc. */
const TTS_VOICE = 'cove';

// ============================
//  Estado interno
// ============================
let isReading       = false;  // Indica se a leitura está em andamento
let lastState       = null;   // Último estado observado ('gerando' ou 'idle')
let monitorInterval = null;   // Referência ao setInterval do monitor
let resetTimeout    = null;   // Timeout de segurança para desbloquear isReading

// ============================
//  Funções auxiliares de log
// ============================
function logInfo(...args) {
    console.log(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
}
function logWarn(...args) {
    console.warn(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
}

// ============================
//  Gerenciamento do bloqueio (isReading)
// ============================

function resetReadingLock() {
    clearTimeout(resetTimeout);
    isReading = false;
}

function scheduleSafetyReset(ms = 20000) {
    resetTimeout = setTimeout(() => {
        logWarn('Timeout de segurança – resetando isReading');
        resetReadingLock();
    }, ms);
}

// ============================================================
//  MODO 2 – Requisição direta + Player customizado
// ============================================================

/**
 * Headers de sessão capturados ao interceptar qualquer fetch do ChatGPT.
 * Preenchidos automaticamente por installFetchInterceptor().
 */
const sessionHeaders = {};

/**
 * Instala um interceptor no fetch nativo com dois objetivos:
 *  1. Coletar os headers de sessão OAI de qualquer requisição ao backend.
 *  2. Capturar a resposta do endpoint /synthesize e redirecionar o áudio
 *     para o player customizado (evita que dois players toquem ao mesmo tempo).
 */
function installFetchInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async function (resource, options) {
        const url = typeof resource === 'string' ? resource : resource?.url ?? '';

        // 1. Coleta headers de sessão de qualquer chamada ao backend
        if (url.includes('chatgpt.com/backend-api') && options?.headers) {
            const h = options.headers;
            const pick = (key) => {
                // headers pode ser objeto simples ou Headers
                const val = typeof h.get === 'function' ? h.get(key) : h[key];
                if (val) sessionHeaders[key] = val;
            };
            ['Authorization', 'OAI-Language', 'OAI-Session-Id', 'OAI-Device-Id',
             'OAI-Client-Build-Number', 'OAI-Client-Version',
             'X-OAI-IS-Client-Observation'].forEach(pick);
        }

        const response = await originalFetch.apply(this, arguments);

        // 2. Captura a resposta de síntese e redireciona para o player próprio
        if (url.includes('backend-api/synthesize')) {
            logInfo('Resposta de síntese capturada:', url);
            const clone       = response.clone();
            const buffer      = await clone.arrayBuffer();
            const blob        = new Blob([buffer], { type: 'audio/aac' });
            const objectUrl   = URL.createObjectURL(blob);
            playWithCustomPlayer(objectUrl);
        }

        return response;
    };

    logInfo('Interceptor de fetch instalado');
}

/**
 * Extrai o conversation_id da URL atual.
 * Formato esperado: /c/<conversation_id>
 * @returns {string|null}
 */
function getConversationId() {
    const match = location.pathname.match(/\/c\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
}

/**
 * Extrai o message_id da última mensagem do assistente no DOM.
 * O ChatGPT armazena o ID no atributo data-message-id.
 * @returns {string|null}
 */
function getLastMessageId() {
    const messages = document.querySelectorAll('[data-message-author-role="assistant"][data-message-id]');
    const last     = messages[messages.length - 1];
    return last?.dataset?.messageId ?? null;
}

/**
 * Solicita a síntese de voz diretamente ao backend do ChatGPT,
 * sem simular cliques na UI.
 */
async function requestSynthesisDirect() {
    const conversationId = getConversationId();
    const messageId      = getLastMessageId();

    if (!conversationId || !messageId) {
        logWarn('Não foi possível obter conversation_id ou message_id', { conversationId, messageId });
        resetReadingLock();
        return;
    }

    if (!sessionHeaders['Authorization']) {
        logWarn('Token de autorização ainda não capturado – aguardando próxima resposta da UI');
        // Fallback: tenta via UI para que o interceptor capture os headers
        openLastMessageMenu();
        return;
    }

    const url = `https://chatgpt.com/backend-api/synthesize`
        + `?message_id=${encodeURIComponent(messageId)}`
        + `&conversation_id=${encodeURIComponent(conversationId)}`
        + `&voice=${encodeURIComponent(TTS_VOICE)}`
        + `&format=aac`;

    logInfo('Requisitando síntese direta:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':              sessionHeaders['Authorization'],
                'OAI-Language':               sessionHeaders['OAI-Language']               ?? 'pt-BR',
                'OAI-Session-Id':             sessionHeaders['OAI-Session-Id']             ?? '',
                'OAI-Device-Id':              sessionHeaders['OAI-Device-Id']              ?? '',
                'OAI-Client-Build-Number':    sessionHeaders['OAI-Client-Build-Number']    ?? '',
                'OAI-Client-Version':         sessionHeaders['OAI-Client-Version']         ?? '',
                'X-OAI-IS-Client-Observation':sessionHeaders['X-OAI-IS-Client-Observation']?? '',
                'X-OpenAI-Target-Path':       '/backend-api/synthesize',
                'X-OpenAI-Target-Route':      '/backend-api/synthesize',
            },
        });

        if (!response.ok) {
            logWarn(`Erro na síntese: HTTP ${response.status}`);
            resetReadingLock();
            return;
        }

        const buffer    = await response.arrayBuffer();
        const blob      = new Blob([buffer], { type: 'audio/aac' });
        const objectUrl = URL.createObjectURL(blob);
        playWithCustomPlayer(objectUrl);

    } catch (err) {
        logWarn('Falha ao solicitar síntese:', err);
        resetReadingLock();
    }
}

// ============================
//  Player customizado
// ============================

const player = {
    audio:        null,
    controlsEl:   null,
    playPauseBtn: null,
};

function playWithCustomPlayer(audioUrl) {
    if (player.audio) {
        player.audio.pause();
        URL.revokeObjectURL(player.audio.src);
    }

    player.audio = new Audio(audioUrl);
    player.audio.addEventListener('ended',  () => { updatePlayPauseIcon(false); resetReadingLock(); });
    player.audio.addEventListener('error',  () => { logWarn('Erro no elemento Audio'); resetReadingLock(); });

    if (!player.controlsEl) createPlayerControls();

    player.audio.play()
        .then(() => { updatePlayPauseIcon(true); showPlayerControls(); resetReadingLock(); })
        .catch(err => { logWarn('Erro ao reproduzir:', err); resetReadingLock(); });
}

function createPlayerControls() {
    const div = document.createElement('div');
    div.id = 'cgpt-plus-player';
    Object.assign(div.style, {
        position:       'fixed',
        top:            '14px',
        left:           '50%',
        transform:      'translateX(-50%)',
        zIndex:         '99999',
        display:        'flex',
        gap:            '4px',
        alignItems:     'center',
        background:     'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(8px)',
        borderRadius:   '999px',
        padding:        '6px 16px',
        opacity:        '0',
        transition:     'opacity 0.3s ease',
        userSelect:     'none',
    });

    div.addEventListener('mouseenter', () => div.style.opacity = '1');
    div.addEventListener('mouseleave', () => div.style.opacity = '0');

    const btnStyle = {
        cursor:     'pointer',
        background: 'none',
        border:     'none',
        color:      '#fff',
        fontSize:   '18px',
        padding:    '0 6px',
        lineHeight: '1',
    };

    const makeBtn = (icon, title, onClick) => {
        const btn = document.createElement('button');
        btn.textContent = icon;
        btn.title       = title;
        Object.assign(btn.style, btnStyle);
        btn.addEventListener('click', onClick);
        return btn;
    };

    const rewindBtn = makeBtn('⏪', 'Voltar 10s', () => {
        if (player.audio) player.audio.currentTime = Math.max(0, player.audio.currentTime - 10);
    });

    const ppBtn = makeBtn('▶️', 'Play / Pause', () => {
        if (!player.audio) return;
        if (player.audio.paused || player.audio.ended) {
            player.audio.play().then(() => updatePlayPauseIcon(true));
        } else {
            player.audio.pause();
            updatePlayPauseIcon(false);
        }
    });

    const stopBtn = makeBtn('⏹', 'Parar', () => {
        if (!player.audio) return;
        player.audio.pause();
        player.audio.currentTime = 0;
        updatePlayPauseIcon(false);
    });

    player.playPauseBtn = ppBtn;

    div.appendChild(rewindBtn);
    div.appendChild(ppBtn);
    div.appendChild(stopBtn);

    document.body.appendChild(div);
    player.controlsEl = div;
}

function updatePlayPauseIcon(playing) {
    if (player.playPauseBtn) player.playPauseBtn.textContent = playing ? '⏸' : '▶️';
}

function showPlayerControls() {
    if (!player.controlsEl) return;
    player.controlsEl.style.opacity = '1';
    setTimeout(() => {
        if (player.controlsEl && !player.controlsEl.matches(':hover')) {
            player.controlsEl.style.opacity = '0';
        }
    }, 3000);
}

// ============================================================
//  MODO 1 – Simulação de cliques na UI (comportamento original)
// ============================================================

function onResponseFinished() {
    if (isReading) return;
    isReading = true;
    scheduleSafetyReset(20000);

    if (PLAY_MODE === 'player') {
        // Pequena pausa para o DOM finalizar a renderização da mensagem
        setTimeout(() => requestSynthesisDirect(), 400);
    } else {
        setTimeout(() => openLastMessageMenu(), 400);
    }
}

function openLastMessageMenu() {
    const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const lastMessage       = assistantMessages[assistantMessages.length - 1];

    let moreActionsBtn = lastMessage?.querySelector('button[aria-label="Mais ações"]');
    if (!moreActionsBtn) {
        const allButtons = document.querySelectorAll('button[aria-label="Mais ações"]');
        moreActionsBtn   = allButtons[allButtons.length - 1];
    }

    if (!moreActionsBtn) {
        logWarn('Nenhum botão "Mais ações" encontrado');
        resetReadingLock();
        return;
    }

    moreActionsBtn.click();

    const attemptToFindPlayButton = (retries = 0) => {
        const playBtn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
        if (playBtn) {
            clickPlayButton();
        } else if (retries < 5) {
            setTimeout(() => attemptToFindPlayButton(retries + 1), 250);
        } else {
            logWarn('Botão de leitura não apareceu após abrir o menu');
            resetReadingLock();
        }
    };

    setTimeout(() => attemptToFindPlayButton(), 300);
}

function clickPlayButton() {
    const playBtn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
    if (!playBtn) {
        logWarn('Botão de leitura sumiu');
        resetReadingLock();
        return;
    }

    const currentState = playBtn.textContent?.trim();

    if (currentState === 'Parar') {
        playBtn.click();
        setTimeout(() => {
            const btn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
            if (btn && btn.textContent?.trim() !== 'Parar') {
                startReadingUI(btn);
            } else {
                setTimeout(() => {
                    const btn2 = document.querySelector('[data-testid="voice-play-turn-action-button"]');
                    if (btn2 && btn2.textContent?.trim() !== 'Parar') startReadingUI(btn2);
                    else { logWarn('Não foi possível iniciar leitura após parar'); resetReadingLock(); }
                }, 500);
            }
        }, 500);
        return;
    }

    startReadingUI(playBtn);
}

function startReadingUI(button) {
    button.click();
    setTimeout(() => document.querySelector('#prompt-textarea')?.focus(), 500);
    resetReadingLock();
}

// ============================
//  Monitoramento do estado de geração
// ============================

function checkGenerationState() {
    const stopButton   = document.querySelector('[data-testid="stop-button"]');
    const currentState = stopButton ? 'gerando' : 'idle';

    if (lastState === 'gerando' && currentState === 'idle') {
        logInfo('Resposta finalizada – iniciando reprodução automática');
        onResponseFinished();
    }

    lastState = currentState;
}

function startMonitoring() {
    if (monitorInterval) return;
    monitorInterval = setInterval(checkGenerationState, 700);
    logInfo('Monitoramento iniciado');
}

// ============================
//  Inicialização
// ============================

if (PLAY_MODE === 'player') {
    installFetchInterceptor();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startMonitoring();
} else {
    window.addEventListener('DOMContentLoaded', startMonitoring);
}

logInfo(`Script carregado – modo: ${PLAY_MODE}`);
