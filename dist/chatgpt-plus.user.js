// ==UserScript==
// @name         ChatGPT Plus
// @namespace    https://github.com/dionesrosa
// @version      0.2.23
// @description  Reprodução automática de voz ao finalizar resposta no chat do ChatGPT.
// @author       Diones Souza
// @icon         data:image/png;base64,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
// @homepageURL  https://github.com/dionesrosa/ChatGPT-Plus
// @supportURL   https://github.com/dionesrosa/ChatGPT-Plus/issues
// @updateURL    https://raw.githubusercontent.com/dionesrosa/ChatGPT-Plus/main/dist/chatgpt-plus.user.js
// @downloadURL  https://raw.githubusercontent.com/dionesrosa/ChatGPT-Plus/main/dist/chatgpt-plus.user.js
// @match        *://chatgpt.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    (() => {
      // src/config/settings.js
      var SCRIPT_NAME = "ChatGPT Plus";
      var SCRIPT_VERSION = "0.3.0";
      var PLAY_MODE = "player";
      var TTS_VOICE = "cove";
    
      // src/core/logger.js
      function logInfo(...args) {
        console.log(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
      }
      function logWarn(...args) {
        console.warn(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
      }
    
      // src/core/state.js
      var isReading = false;
      var lastState = null;
      var monitorInterval = null;
      var resetTimeout = null;
      function acquireReadingLock(safetyMs = 2e4) {
        isReading = true;
        resetTimeout = setTimeout(() => {
          logWarn("Timeout de seguran\xE7a \u2013 resetando isReading");
          releaseReadingLock();
        }, safetyMs);
      }
      function releaseReadingLock() {
        clearTimeout(resetTimeout);
        isReading = false;
      }
      function setLastState(value) {
        lastState = value;
      }
      function setMonitorInterval(ref) {
        monitorInterval = ref;
      }
      var isSynthesizing = false;
      function setSynthesizing(value) {
        isSynthesizing = value;
      }
    
      // src/player/controls.js
      var player = {
        audio: null,
        // elemento Audio atual
        controlsEl: null,
        // div de controles injetada no DOM
        playPauseBtn: null,
        // botão play/pause
        loadingEl: null
        // indicador de carregamento
      };
      function createPlayerControls() {
        const div = document.createElement("div");
        div.id = "cgpt-plus-player";
        Object.assign(div.style, {
          position: "fixed",
          top: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: "99999",
          display: "flex",
          gap: "4px",
          alignItems: "center",
          background: "rgba(0,0,0,0.70)",
          backdropFilter: "blur(8px)",
          borderRadius: "999px",
          padding: "6px 16px",
          opacity: "0",
          transition: "opacity 0.3s ease",
          userSelect: "none"
        });
        div.addEventListener("mouseenter", () => div.style.opacity = "1");
        div.addEventListener("mouseleave", () => div.style.opacity = "0");
        const btnStyle = {
          cursor: "pointer",
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "18px",
          padding: "0 6px",
          lineHeight: "1"
        };
        const makeBtn = (icon, title, onClick) => {
          const btn = document.createElement("button");
          btn.textContent = icon;
          btn.title = title;
          Object.assign(btn.style, btnStyle);
          btn.addEventListener("click", onClick);
          return btn;
        };
        const rewindBtn = makeBtn("\u23EA", "Voltar 10s", () => {
          if (player.audio) player.audio.currentTime = Math.max(0, player.audio.currentTime - 10);
        });
        const ppBtn = makeBtn("\u25B6\uFE0F", "Play / Pause", () => {
          if (!player.audio) return;
          if (player.audio.paused || player.audio.ended) {
            player.audio.play().then(() => updatePlayPauseIcon(true));
          } else {
            player.audio.pause();
            updatePlayPauseIcon(false);
          }
        });
        const stopBtn = makeBtn("\u23F9", "Parar", () => {
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
        if (player.playPauseBtn) {
          player.playPauseBtn.textContent = playing ? "\u23F8" : "\u25B6\uFE0F";
        }
      }
      function showPlayerControls() {
        if (!player.controlsEl) return;
        player.controlsEl.style.opacity = "1";
        setTimeout(() => {
          if (player.controlsEl && !player.controlsEl.matches(":hover")) {
            player.controlsEl.style.opacity = "0";
          }
        }, 3e3);
      }
      function showLoadingIndicator() {
        if (player.loadingEl) return;
        const el = document.createElement("div");
        el.id = "cgpt-plus-loading";
        if (!document.getElementById("cgpt-plus-loading-style")) {
          const style = document.createElement("style");
          style.id = "cgpt-plus-loading-style";
          style.textContent = `
                @keyframes cgpt-spin {
                    0%   { transform: translateX(-50%) rotate(0deg); }
                    100% { transform: translateX(-50%) rotate(360deg); }
                }
            `;
          document.head.appendChild(style);
        }
        Object.assign(el.style, {
          position: "fixed",
          top: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: "99999",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,0,0,0.70)",
          backdropFilter: "blur(8px)",
          borderRadius: "999px",
          padding: "6px 16px",
          color: "#fff",
          fontSize: "13px",
          userSelect: "none",
          pointerEvents: "none"
        });
        const spinner = document.createElement("span");
        spinner.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="animation:cgpt-spin 0.8s linear infinite;display:block">
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
            <path d="M8 2a6 6 0 0 1 6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
        const label = document.createElement("span");
        label.textContent = "Gerando \xE1udio\u2026";
        el.appendChild(spinner);
        el.appendChild(label);
        document.body.appendChild(el);
        player.loadingEl = el;
      }
      function hideLoadingIndicator() {
        if (player.loadingEl) {
          player.loadingEl.remove();
          player.loadingEl = null;
        }
      }
    
      // src/player/audio.js
      function playWithCustomPlayer(audioUrl) {
        if (player.audio) {
          player.audio.pause();
          URL.revokeObjectURL(player.audio.src);
        }
        player.audio = new Audio(audioUrl);
        player.audio.addEventListener("ended", () => {
          updatePlayPauseIcon(false);
          releaseReadingLock();
        });
        player.audio.addEventListener("error", () => {
          logWarn("Erro no elemento Audio");
          releaseReadingLock();
        });
        if (!player.controlsEl) createPlayerControls();
        player.audio.play().then(() => {
          hideLoadingIndicator();
          updatePlayPauseIcon(true);
          showPlayerControls();
          releaseReadingLock();
        }).catch((err) => {
          hideLoadingIndicator();
          logWarn("Erro ao reproduzir:", err);
          releaseReadingLock();
        });
      }
    
      // src/synthesis/session.js
      var sessionHeaders = {};
      var CANONICAL_KEYS = {
        authorization: "Authorization",
        "oai-language": "OAI-Language",
        "chatgpt-account-id": "Chatgpt-Account-Id",
        "oai-did": "OAI-DID",
        "originator": "Originator",
        "x-openai-web-frontend": "X-OpenAI-Web-Frontend"
      };
      var CAPTURE_HEADER_KEYS = Object.values(CANONICAL_KEYS);
      function mergeSessionHeaders(headers) {
        if (!headers) return;
        for (const [rawName, value] of Object.entries(headers)) {
          if (!value) continue;
          const canonical = CANONICAL_KEYS[rawName.toLowerCase()];
          if (canonical) {
            sessionHeaders[canonical] = value;
          }
        }
      }
      function getSessionHeader(name) {
        return sessionHeaders[name] ?? null;
      }
      function getAuthorizationHeader() {
        const auth = getSessionHeader("Authorization");
        if (!auth) return null;
        return auth.startsWith("Bearer ") ? auth : `Bearer ${auth}`;
      }
    
      // src/synthesis/interceptor.js
      var BRIDGE_EVENT = "cgpt-plus-session-headers";
      var AUDIO_EVENT = "cgpt-plus-synthesize-audio";
      var PAGE_FLAG = "__cgptPlusFetchPatched";
      function normalizeHeaders(headers) {
        if (!headers) return null;
        if (typeof headers.entries === "function") {
          return Object.fromEntries([...headers.entries()]);
        }
        if (Array.isArray(headers)) {
          return Object.fromEntries(headers);
        }
        return { ...headers };
      }
      function captureHeadersFromRequest(url, headers) {
        if (!url.includes("backend-api")) return;
        const normalized = normalizeHeaders(headers);
        if (!normalized) return;
        mergeSessionHeaders(normalized);
      }
      function handleSynthesisResponse(url, headers, response) {
        if (!url.includes("backend-api/synthesize") || isSynthesizing || !response.ok) {
          return;
        }
        logInfo("Resposta de s\xEDntese capturada:", url);
        const clone = response.clone();
        clone.arrayBuffer().then((buffer) => {
          const blob = new Blob([buffer], { type: "audio/aac" });
          const objectUrl = URL.createObjectURL(blob);
          playWithCustomPlayer(objectUrl);
        }).catch((err) => {
          logWarn("Falha ao processar resposta de s\xEDntese:", err);
        });
      }
      function buildPageInterceptorSource() {
        const keys = JSON.stringify(CAPTURE_HEADER_KEYS.map((k) => k.toLowerCase()));
        const headerEvent = JSON.stringify(BRIDGE_EVENT);
        const audioEvent = JSON.stringify(AUDIO_EVENT);
        const pageFlag = JSON.stringify(PAGE_FLAG);
        return `
    (function () {
        if (window[${pageFlag}]) return;
        window[${pageFlag}] = true;
    
        const KEYS = ${keys};
    
        function normalizeHeaders(headers) {
            if (!headers) return null;
            if (typeof headers.entries === 'function') {
                return Object.fromEntries(Array.from(headers.entries()));
            }
            if (Array.isArray(headers)) {
                return Object.fromEntries(headers);
            }
            return Object.assign({}, headers);
        }
    
        function getHeader(headers, key) {
            if (!headers) return undefined;
            const lower = key.toLowerCase();
            for (const name of Object.keys(headers)) {
                if (name.toLowerCase() === lower) return headers[name];
            }
            return undefined;
        }
    
        function publishHeaders(headers) {
            if (!headers) return;
            const payload = {};
            for (const key of KEYS) {
                const value = getHeader(headers, key);
                if (value) payload[key] = value;
            }
            if (Object.keys(payload).length === 0) return;
            window.dispatchEvent(new CustomEvent(${headerEvent}, { detail: payload }));
        }
    
        function publishAudio(buffer) {
            const blob = new Blob([buffer], { type: 'audio/aac' });
            const objectUrl = URL.createObjectURL(blob);
            window.dispatchEvent(new CustomEvent(${audioEvent}, { detail: { objectUrl } }));
        }
    
        const originalFetch = window.fetch;
        window.fetch = async function (resource, options) {
            const url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
            const normalizedHeaders = normalizeHeaders(options && options.headers);
    
            if (url.includes('backend-api')) {
                publishHeaders(normalizedHeaders);
            }
    
            const response = await originalFetch.apply(this, arguments);
    
            if (url.includes('backend-api/synthesize') && !window.__cgptIsSynthesizing && response.ok) {
                response.clone().arrayBuffer()
                    .then(publishAudio)
                    .catch(function () {});
            }
    
            return response;
        };
    
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    
        XMLHttpRequest.prototype.open = function (method, url) {
            this.__cgptUrl = typeof url === 'string' ? url : String(url);
            this.__cgptHeaders = {};
            return originalOpen.apply(this, arguments);
        };
    
        XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
            this.__cgptHeaders = this.__cgptHeaders || {};
            this.__cgptHeaders[name.toLowerCase()] = value;
            return originalSetRequestHeader.apply(this, arguments);
        };
    
        XMLHttpRequest.prototype.send = function () {
            if (this.__cgptUrl && this.__cgptUrl.includes('backend-api')) {
                publishHeaders(this.__cgptHeaders);
            }
            return originalSend.apply(this, arguments);
        };
    })();
    `;
      }
      function injectPageInterceptor() {
        if (window[PAGE_FLAG]) return;
        const source = buildPageInterceptorSource();
        const blob = new Blob([source], { type: "application/javascript" });
        const blobUrl = URL.createObjectURL(blob);
        const script = document.createElement("script");
        script.src = blobUrl;
        script.onload = () => {
          URL.revokeObjectURL(blobUrl);
          script.remove();
        };
        script.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          script.remove();
          logWarn("Falha ao injetar interceptor no contexto da p\xE1gina");
        };
        (document.documentElement || document.head || document.body).appendChild(script);
      }
      function installBridgeListeners() {
        window.addEventListener(BRIDGE_EVENT, (event) => {
          mergeSessionHeaders(event.detail);
        });
        window.addEventListener(AUDIO_EVENT, (event) => {
          const objectUrl = event.detail?.objectUrl;
          if (objectUrl) {
            playWithCustomPlayer(objectUrl);
          }
        });
      }
      function patchLocalFetch() {
        if (window.__cgptPlusLocalFetchPatched) return;
        window.__cgptPlusLocalFetchPatched = true;
        const originalFetch = window.fetch;
        window.fetch = async function(resource, options) {
          const url = typeof resource === "string" ? resource : resource?.url ?? "";
          captureHeadersFromRequest(url, options?.headers);
          const response = await originalFetch.apply(this, arguments);
          handleSynthesisResponse(url, normalizeHeaders(options?.headers), response);
          return response;
        };
      }
      function installFetchInterceptor() {
        installBridgeListeners();
        injectPageInterceptor();
        patchLocalFetch();
        logInfo("Interceptor de fetch instalado");
      }
    
      // src/ui/menu.js
      function findVoiceButton(container) {
        return container?.querySelector('button[aria-label="Ler em voz alta"]') || container?.querySelector('button[aria-label="Read aloud"]') || container?.querySelector('[data-testid="voice-play-turn-action-button"]');
      }
      function findVoiceButtonGlobal() {
        return document.querySelector('button[aria-label="Ler em voz alta"]') || document.querySelector('button[aria-label="Read aloud"]') || document.querySelector('[data-testid="voice-play-turn-action-button"]');
      }
      function openLastMessageMenu() {
        const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
        const lastMessage = assistantMessages[assistantMessages.length - 1];
        const directBtn = findVoiceButton(lastMessage);
        if (directBtn) {
          logInfo("Bot\xE3o de voz encontrado diretamente na mensagem");
          clickPlayButton();
          return;
        }
        let moreActionsBtn = lastMessage?.querySelector('button[aria-label="Mais a\xE7\xF5es"], button[aria-label="More actions"]');
        if (!moreActionsBtn) {
          const allButtons = document.querySelectorAll('button[aria-label="Mais a\xE7\xF5es"], button[aria-label="More actions"]');
          moreActionsBtn = allButtons[allButtons.length - 1];
        }
        if (!moreActionsBtn) {
          logWarn('Nenhum bot\xE3o "Mais a\xE7\xF5es" encontrado');
          releaseReadingLock();
          return;
        }
        moreActionsBtn.click();
        const attemptToFindPlayButton = (retries = 0) => {
          const playBtn = findVoiceButtonGlobal();
          if (playBtn) {
            clickPlayButton();
          } else if (retries < 5) {
            setTimeout(() => attemptToFindPlayButton(retries + 1), 250);
          } else {
            logWarn("Bot\xE3o de leitura n\xE3o apareceu ap\xF3s abrir o menu");
            releaseReadingLock();
          }
        };
        setTimeout(() => attemptToFindPlayButton(), 300);
      }
      function clickPlayButton() {
        const playBtn = findVoiceButtonGlobal();
        if (!playBtn) {
          logWarn("Bot\xE3o de leitura sumiu");
          releaseReadingLock();
          return;
        }
        const isPlaying = playBtn.getAttribute("aria-pressed") === "true" || playBtn.textContent?.trim() === "Parar" || playBtn.textContent?.trim() === "Stop";
        if (isPlaying) {
          playBtn.click();
          const waitForIdle = (retries = 0) => {
            const btn = findVoiceButtonGlobal();
            const stillPlaying = btn?.getAttribute("aria-pressed") === "true" || btn?.textContent?.trim() === "Parar" || btn?.textContent?.trim() === "Stop";
            if (btn && !stillPlaying) {
              startReadingUI(btn);
            } else if (retries < 4) {
              setTimeout(() => waitForIdle(retries + 1), 500);
            } else {
              logWarn("N\xE3o foi poss\xEDvel iniciar leitura ap\xF3s parar");
              releaseReadingLock();
            }
          };
          setTimeout(() => waitForIdle(), 500);
          return;
        }
        startReadingUI(playBtn);
      }
      function startReadingUI(button) {
        button.click();
        setTimeout(() => document.querySelector("#prompt-textarea")?.focus(), 500);
        releaseReadingLock();
      }
    
      // src/synthesis/direct.js
      function getConversationId() {
        const match = location.pathname.match(/\/c\/([a-f0-9-]{36})/i);
        return match ? match[1] : null;
      }
      function getLastMessageId() {
        const messages = document.querySelectorAll(
          '[data-message-author-role="assistant"][data-message-id]'
        );
        const last = messages[messages.length - 1];
        return last?.dataset?.messageId ?? null;
      }
      function resolveAuthToken() {
        const captured = getAuthorizationHeader();
        if (captured) {
          return captured;
        }
        try {
          const raw = localStorage.getItem("oai/apps/accountSwitchSessions");
          const sessions = JSON.parse(raw);
          const token = Array.isArray(sessions) ? sessions.find((s) => s?.sessionToken?.startsWith("eyJhbGciOiJSUzI1NiI"))?.sessionToken : null;
          if (token) {
            logInfo("Token obtido do localStorage");
            mergeSessionHeaders({ authorization: `Bearer ${token}` });
            return `Bearer ${token}`;
          }
        } catch (_) {
        }
        return null;
      }
      function buildSynthesisHeaders(authToken) {
        const headers = {
          authorization: authToken,
          "accept": "*/*",
          "accept-language": "pt-BR,pt-PT;q=0.9,pt;q=0.8,en-US;q=0.7,en;q=0.6",
          "origin": "https://chatgpt.com",
          "referer": "https://chatgpt.com/",
          "oai-language": getSessionHeader("OAI-Language") ?? "pt-BR"
        };
        const accountId = getSessionHeader("Chatgpt-Account-Id");
        if (accountId) headers["chatgpt-account-id"] = accountId;
        const oaiDid = getSessionHeader("OAI-DID");
        if (oaiDid) headers["oai-did"] = oaiDid;
        const originator = getSessionHeader("Originator");
        if (originator) headers["originator"] = originator;
        const webFrontend = getSessionHeader("X-OpenAI-Web-Frontend");
        if (webFrontend) headers["x-openai-web-frontend"] = webFrontend;
        return headers;
      }
      async function requestSynthesisDirect() {
        const authToken = resolveAuthToken();
        if (!authToken) {
          logInfo("Token ainda n\xE3o dispon\xEDvel \u2013 aguardando requisi\xE7\xE3o nativa ou usando UI");
          openLastMessageMenu();
          return;
        }
        const conversationId = getConversationId();
        const messageId = getLastMessageId();
        if (!conversationId || !messageId) {
          logWarn("N\xE3o foi poss\xEDvel obter conversation_id ou message_id", { conversationId, messageId });
          releaseReadingLock();
          return;
        }
        const url = `https://chatgpt.com/backend-api/synthesize?message_id=${encodeURIComponent(messageId)}&conversation_id=${encodeURIComponent(conversationId)}&voice=${encodeURIComponent(TTS_VOICE)}&format=aac`;
        logInfo("Requisitando s\xEDntese direta:", url);
        showLoadingIndicator();
        try {
          setSynthesizing(true);
          window.__cgptIsSynthesizing = true;
          const response = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: buildSynthesisHeaders(authToken)
          });
          if (!response.ok) {
            logWarn(`Erro na s\xEDntese: HTTP ${response.status}`);
            hideLoadingIndicator();
            releaseReadingLock();
            return;
          }
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            logWarn("Resposta inesperada (JSON) em vez de \xE1udio");
            hideLoadingIndicator();
            releaseReadingLock();
            return;
          }
          const buffer = await response.arrayBuffer();
          if (!buffer.byteLength) {
            logWarn("Resposta de \xE1udio vazia");
            hideLoadingIndicator();
            releaseReadingLock();
            return;
          }
          const blob = new Blob([buffer], { type: "audio/aac" });
          const objectUrl = URL.createObjectURL(blob);
          playWithCustomPlayer(objectUrl);
        } catch (err) {
          hideLoadingIndicator();
          logWarn("Falha ao solicitar s\xEDntese:", err);
          releaseReadingLock();
        } finally {
          setSynthesizing(false);
          window.__cgptIsSynthesizing = false;
        }
      }
    
      // src/monitor/generation.js
      function onResponseFinished() {
        if (isReading) return;
        acquireReadingLock(2e4);
        if (PLAY_MODE === "player") {
          setTimeout(() => requestSynthesisDirect(), 400);
        } else {
          setTimeout(() => openLastMessageMenu(), 400);
        }
      }
      function findStopButton() {
        return document.querySelector('[data-testid="stop-button"]') || document.querySelector('[data-testid="composer-cancel-button"]') || document.querySelector('button[aria-label="Stop generating"]') || document.querySelector('button[aria-label="Parar de gerar"]') || document.querySelector('button[data-testid*="stop"]');
      }
      function checkGenerationState() {
        const stopButton = findStopButton();
        const currentState = stopButton ? "gerando" : "idle";
        if (lastState === "gerando" && currentState === "idle") {
          logInfo("Resposta finalizada \u2013 iniciando reprodu\xE7\xE3o autom\xE1tica");
          onResponseFinished();
        }
        setLastState(currentState);
      }
      function startMonitoring() {
        if (monitorInterval) return;
        setMonitorInterval(setInterval(checkGenerationState, 700));
        logInfo("Monitoramento iniciado");
      }
    
      // src/index.js
      if (PLAY_MODE === "player") {
        installFetchInterceptor();
      }
      function boot() {
        startMonitoring();
        logInfo(`Script carregado \u2013 modo: ${PLAY_MODE}`);
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
      } else {
        boot();
      }
    })();
    
})();