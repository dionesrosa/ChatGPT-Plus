import { logWarn } from '../core/logger.js';
import { releaseReadingLock } from '../core/state.js';
import { player, createPlayerControls, updatePlayPauseIcon, showPlayerControls } from './controls.js';

/**
 * Reproduz uma URL de áudio no player customizado.
 * Substitui o áudio anterior se houver um em andamento.
 * @param {string} audioUrl - object URL do blob de áudio (audio/aac)
 */
export function playWithCustomPlayer(audioUrl) {
    // Libera recursos do áudio anterior
    if (player.audio) {
        player.audio.pause();
        URL.revokeObjectURL(player.audio.src);
    }

    player.audio = new Audio(audioUrl);

    player.audio.addEventListener('ended', () => {
        updatePlayPauseIcon(false);
        releaseReadingLock();
    });

    player.audio.addEventListener('error', () => {
        logWarn('Erro no elemento Audio');
        releaseReadingLock();
    });

    if (!player.controlsEl) createPlayerControls();

    player.audio.play()
        .then(() => {
            updatePlayPauseIcon(true);
            showPlayerControls();
            releaseReadingLock();
        })
        .catch(err => {
            logWarn('Erro ao reproduzir:', err);
            releaseReadingLock();
        });
}
