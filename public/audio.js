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
        { el: inhaleAudio, vol: 0.6, name: 'inhale' },
        { el: holdAudio, vol: 0.6, name: 'hold' },
        { el: exhaleAudio, vol: 0.6, name: 'exhale' },
        { el: endAudio, vol: 0.4, name: 'end' }
    ];

    audioElements.forEach(item => {
        if (item.el) {
            try {
                // Set volume
                item.el.volume = item.vol;
                
                // Set properties for better mobile compatibility
                item.el.preload = 'auto'; // Try to preload
                item.el.muted = false;
                
                // Force load the audio
                item.el.load();
                
                // Add error listener
                item.el.addEventListener('error', (e) => {
                    console.error(`Error loading ${item.name} audio:`, e);
                });
                
                // Add loaded listener
                item.el.addEventListener('canplaythrough', () => {
                    console.log(`${item.name} audio loaded and ready`);
                }, { once: true });
                
                console.log(`${item.name} audio element initialized`);
            } catch (error) {
                console.error(`Error initializing ${item.name} audio:`, error);
            }
        } else {
            console.warn(`${item.name} audio element not found`);
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

// Enhanced function to safely play audio with mobile-specific handling
function safelyPlayAudio(audioElement, audioName) {
    if (!audioElement) {
        console.warn(`${audioName} audio element not found`);
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        // First, stop and reset the audio
        audioElement.pause();
        audioElement.currentTime = 0;
        
        let timeoutId;
        let isResolved = false;
        
        // Add event listeners for this play attempt
        const onPlay = () => {
            if (isResolved) return;
            isResolved = true;
            console.log(`${audioName} audio started playing successfully`);
            cleanup();
            resolve();
        };
        
        const onError = (error) => {
            if (isResolved) return;
            isResolved = true;
            console.error(`Error playing ${audioName} audio:`, error);
            cleanup();
            reject(error);
        };
        
        const onCanPlay = () => {
            // Audio is ready to play
            audioElement.play()
                .then(onPlay)
                .catch(onError);
        };
        
        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            audioElement.removeEventListener('canplay', onCanPlay);
            audioElement.removeEventListener('error', onError);
        };
        
        // Check if audio is already ready to play
        if (audioElement.readyState >= 2) { // HAVE_CURRENT_DATA or better
            audioElement.play()
                .then(onPlay)
                .catch(onError);
        } else {
            // Wait for audio to be ready
            audioElement.addEventListener('canplay', onCanPlay, { once: true });
            audioElement.addEventListener('error', onError, { once: true });
            
            // Force load if needed
            if (audioElement.readyState === 0) {
                audioElement.load();
            }
        }
        
        // Timeout after 2 seconds
        timeoutId = setTimeout(() => {
            if (isResolved) return;
            isResolved = true;
            cleanup();
            console.warn(`${audioName} audio play attempt timed out`);
            resolve(); // Don't reject on timeout, just continue
        }, 2000);
    });
}

// Add any necessary exports if using a module system. 
// For now, assuming global scope for these functions. If script.js uses them, they must be available. 