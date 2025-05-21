// public/audio.js

// Audio elements - these will need to be accessed from the main script or passed in.
// For now, assuming they are globally available or will be passed.
// const inhaleAudio = document.getElementById('inhale-audio');
// const holdAudio = document.getElementById('hold-audio');
// const exhaleAudio = document.getElementById('exhale-audio');
// const endAudio = document.getElementById('end-audio');

// Variables that need to be shared or managed:
// - isAudioEnabled (managed in script.js)
// - audioInitialized
// - TRANSITION_TIME (managed in script.js)
// - effectiveInhaleTime, effectiveHoldTime, effectiveExhaleTime (managed in script.js)

let audioInitialized = false; 
// holdSoundTimeoutId, exhaleSoundTimeoutId are no longer needed.

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
            item.el.load(); // Good practice to call load()
        }
    });

    audioInitialized = true;
    console.log("Audio elements initialized and unlocked on user interaction.");
}

// clearScheduledSounds is REMOVED as timeouts are no longer used for scheduling cycle sounds.

// Stops only the phase sounds (inhale, hold, exhale)
function stopPhaseSounds(inhaleAudio, holdAudio, exhaleAudio) {
    if (inhaleAudio) { inhaleAudio.pause(); inhaleAudio.currentTime = 0; }
    if (holdAudio) { holdAudio.pause(); holdAudio.currentTime = 0; }
    if (exhaleAudio) { exhaleAudio.pause(); exhaleAudio.currentTime = 0; }
    console.log("Phase sounds stopped and reset.");
}

function stopAllSounds(inhaleAudio, holdAudio, exhaleAudio, endAudio) {
    // This function will be simplified. No scheduled sounds to clear.
    // Call stopPhaseSounds to handle inhale, hold, exhale
    stopPhaseSounds(inhaleAudio, holdAudio, exhaleAudio);
    // Additionally handle endAudio
    if (endAudio) { endAudio.pause(); endAudio.currentTime = 0; } 
    console.log("All sounds (including end sound) stopped and reset.");
}

function playEndSound(isAudioEnabled, endAudio) {
    // isAudioEnabled check is now done by the caller (startBreathingProcess)
    // but keeping it here is a safe double-check if this function were ever called directly elsewhere.
    if (isAudioEnabled && endAudio) {
        endAudio.currentTime = 0;
        endAudio.play().catch(e => console.error("Error playing end audio:", e));
    }
}

// triggerSoundsForCycle is REMOVED.

// stopCurrentCycleSoundsAndClearSchedule is REMOVED.

// Add any necessary exports if using a module system. 
// For now, assuming global scope for these functions. If script.js uses them, they must be available. 