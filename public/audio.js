// public/audio.js

// Audio elements - these will need to be accessed from the main script or passed in.
// For now, assuming they are globally available or will be passed.
// const inhaleAudio = document.getElementById('inhale-audio');
// const holdAudio = document.getElementById('hold-audio');
// const exhaleAudio = document.getElementById('exhale-audio');
// const endAudio = document.getElementById('end-audio');

// Variables that need to be shared or managed:
// - isAudioEnabled
// - audioInitialized
// - holdSoundTimeoutId, exhaleSoundTimeoutId
// - TRANSITION_TIME (from main script)
// - effectiveInhaleTime, effectiveHoldTime, effectiveExhaleTime (from main script)

let audioInitialized = false; // Keep this local to this module if possible
let holdSoundTimeoutId = null;
let exhaleSoundTimeoutId = null;

function initializeAndUnlockAudio(inhaleAudio, holdAudio, exhaleAudio, endAudio) {
    if (audioInitialized) return;

    const audioElements = [
        { el: inhaleAudio, vol: 0.6 },
        { el: holdAudio, vol: 0.6 },
        { el: exhaleAudio, vol: 0.6 },
        { el: endAudio, vol: 0.4 }
    ];

    audioElements.forEach(item => {
        if (item.el) {
            item.el.volume = item.vol;
            item.el.load();
        }
    });

    audioInitialized = true;
    console.log("Audio elements initialized and unlocked on user interaction.");
}

function clearScheduledSounds() {
    if (holdSoundTimeoutId) clearTimeout(holdSoundTimeoutId);
    if (exhaleSoundTimeoutId) clearTimeout(exhaleSoundTimeoutId);
    holdSoundTimeoutId = null;
    exhaleSoundTimeoutId = null;
}

function stopAllSounds(inhaleAudio, holdAudio, exhaleAudio, endAudio) {
    clearScheduledSounds();
    if (inhaleAudio) { inhaleAudio.pause(); inhaleAudio.currentTime = 0; }
    if (holdAudio) { holdAudio.pause(); holdAudio.currentTime = 0; }
    if (exhaleAudio) { exhaleAudio.pause(); exhaleAudio.currentTime = 0; }
    if (endAudio) { endAudio.pause(); endAudio.currentTime = 0; } 
}

function playEndSound(isAudioEnabled, endAudio) {
    if (isAudioEnabled && endAudio) {
        setTimeout(() => {
            endAudio.currentTime = 0;
            endAudio.play().catch(e => console.error("Error playing end audio:", e));
        }, 100);
    }
}

function triggerSoundsForCycle(isAudioEnabled, inhaleAudio, holdAudio, exhaleAudio, TRANSITION_TIME, effectiveInhaleTime, effectiveHoldTime, effectiveExhaleTime) {
    clearScheduledSounds(); 

    if (!isAudioEnabled || !audioInitialized) return;

    if (inhaleAudio) {
        inhaleAudio.currentTime = 0;
        inhaleAudio.play().catch(e => console.error("Error playing inhale audio:", e));
    }

    if (holdAudio && effectiveHoldTime > 0) {
        holdSoundTimeoutId = setTimeout(() => {
            holdAudio.currentTime = 0;
            holdAudio.play().catch(e => console.error("Error playing hold audio:", e));
        }, (TRANSITION_TIME + effectiveInhaleTime) * 1000);
    }

    if (exhaleAudio && effectiveExhaleTime > 0) {
        exhaleSoundTimeoutId = setTimeout(() => {
            exhaleAudio.currentTime = 0;
            exhaleAudio.play().catch(e => console.error("Error playing exhale audio:", e));
        }, (TRANSITION_TIME + effectiveInhaleTime + TRANSITION_TIME + effectiveHoldTime) * 1000);
    }
}

// Add any necessary exports if using a module system. 