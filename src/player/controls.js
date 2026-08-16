import { logWarn } from '../core/logger.js';

/** Referências do player customizado */
export const player = {
    audio:        null,   // elemento Audio atual
    controlsEl:   null,   // div de controles injetada no DOM
    playPauseBtn: null,   // botão play/pause
    loadingEl:    null,   // indicador de carregamento
};

/** Cria e injeta a barra de controles no DOM. Chamado apenas uma vez. */
export function createPlayerControls() {
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

/** Atualiza o ícone do botão play/pause */
export function updatePlayPauseIcon(playing) {
    if (player.playPauseBtn) {
        player.playPauseBtn.textContent = playing ? '⏸' : '▶️';
    }
}

/** Exibe os controles por 3s e depois os oculta (a menos que o mouse esteja sobre eles) */
export function showPlayerControls() {
    if (!player.controlsEl) return;
    player.controlsEl.style.opacity = '1';
    setTimeout(() => {
        if (player.controlsEl && !player.controlsEl.matches(':hover')) {
            player.controlsEl.style.opacity = '0';
        }
    }, 3000);
}

/** Exibe o indicador de loading enquanto o áudio está sendo processado */
export function showLoadingIndicator() {
    if (player.loadingEl) return; // já existe

    const el = document.createElement('div');
    el.id = 'cgpt-plus-loading';

    // Keyframe da animação de pulso
    if (!document.getElementById('cgpt-plus-loading-style')) {
        const style = document.createElement('style');
        style.id = 'cgpt-plus-loading-style';
        style.textContent = `
            @keyframes cgpt-spin {
                0%   { transform: translateX(-50%) rotate(0deg); }
                100% { transform: translateX(-50%) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    Object.assign(el.style, {
        position:     'fixed',
        top:          '14px',
        left:         '50%',
        transform:    'translateX(-50%)',
        zIndex:       '99999',
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        background:   'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(8px)',
        borderRadius: '999px',
        padding:      '6px 16px',
        color:        '#fff',
        fontSize:     '13px',
        userSelect:   'none',
        pointerEvents: 'none',
    });

    // Spinner SVG
    const spinner = document.createElement('span');
    spinner.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="animation:cgpt-spin 0.8s linear infinite;display:block">
        <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <path d="M8 2a6 6 0 0 1 6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

    const label = document.createElement('span');
    label.textContent = 'Gerando áudio…';

    el.appendChild(spinner);
    el.appendChild(label);
    document.body.appendChild(el);
    player.loadingEl = el;
}

/** Remove o indicador de loading */
export function hideLoadingIndicator() {
    if (player.loadingEl) {
        player.loadingEl.remove();
        player.loadingEl = null;
    }
}
