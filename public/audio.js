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
let mainAudioElement = null;

// Audio sources for different phases
const audioSources = {
    inhale: 'audio/inhale/inhale-1.mp3',
    hold: 'audio/hold/hold-1.mp3',
    exhale: 'audio/exhale/exhale-1.mp3',
    end: 'audio/end/end-1.mp3'
};

function initializeAndUnlockAudio(inhaleAudio, holdAudio, exhaleAudio, endAudio) {
    return new Promise((resolve) => {
        if (audioInitialized && mainAudioElement) {
            console.log("Audio already initialized");
            resolve();
            return;
        }

        // Create a single audio element for better mobile compatibility
        if (!mainAudioElement) {
            mainAudioElement = document.createElement('audio');
            mainAudioElement.id = 'main-audio';
            mainAudioElement.preload = 'none'; // Don't preload on mobile to avoid issues
            mainAudioElement.volume = 0.6;
            document.body.appendChild(mainAudioElement);
            
            console.log("Single audio element created for mobile compatibility");
        }

        // Properly unlock audio context on mobile
        const unlockAudio = () => {
            if (mainAudioElement && !audioInitialized) {
                // Set a temporary silent source to unlock
                mainAudioElement.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhST1sK2FBxYLdlTFm'; // Tiny WAV file
                const playPromise = mainAudioElement.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        mainAudioElement.pause();
                        mainAudioElement.currentTime = 0;
                        mainAudioElement.src = ''; // Clear the temporary source
                        audioInitialized = true;
                        console.log("Audio context unlocked successfully");
                        resolve();
                    }).catch((error) => {
                        console.warn("Audio unlock failed, but continuing:", error);
                        audioInitialized = true;
                        resolve();
                    });
                } else {
                    // Older browser fallback
                    audioInitialized = true;
                    console.log("Audio unlocked (legacy browser)");
                    resolve();
                }
            } else {
                resolve();
            }
        };

        // Try to unlock immediately (this should work on the first user click)
        unlockAudio();
    });
}

// Simple, reliable audio playing function for mobile
function playAudioPhase(phase, isAudioEnabled) {
    return new Promise((resolve) => {
        if (!isAudioEnabled || !mainAudioElement || !audioSources[phase]) {
            console.log(`Skipping ${phase} audio (disabled or not available)`);
            resolve();
            return;
        }

        console.log(`Playing ${phase} audio...`);
        
        // Stop any current audio
        mainAudioElement.pause();
        mainAudioElement.currentTime = 0;
        
        // Set the source for this phase
        mainAudioElement.src = audioSources[phase];
        
        // Set up event listeners for this play attempt
        const onEnded = () => {
            console.log(`${phase} audio completed`);
            cleanup();
            resolve();
        };
        
        const onError = (error) => {
            console.log(`${phase} audio error (continuing):`, error);
            cleanup();
            resolve(); // Don't block breathing cycle on audio errors
        };
        
        const onCanPlay = () => {
            const playPromise = mainAudioElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`${phase} audio started successfully`);
                }).catch(onError);
            }
        };
        
        const cleanup = () => {
            mainAudioElement.removeEventListener('ended', onEnded);
            mainAudioElement.removeEventListener('error', onError);
            mainAudioElement.removeEventListener('canplay', onCanPlay);
        };
        
        // Add event listeners
        mainAudioElement.addEventListener('ended', onEnded, { once: true });
        mainAudioElement.addEventListener('error', onError, { once: true });
        
        // Try to play immediately if ready, otherwise wait for canplay
        if (mainAudioElement.readyState >= 2) {
            onCanPlay();
        } else {
            mainAudioElement.addEventListener('canplay', onCanPlay, { once: true });
            mainAudioElement.load(); // Force load
        }
        
        // Safety timeout - don't wait forever
        setTimeout(() => {
            cleanup();
            console.log(`${phase} audio safety timeout - continuing`);
            resolve();
        }, 1000); // Much shorter timeout for mobile
    });
}

// Stop all audio
function stopAllAudio() {
    if (mainAudioElement) {
        mainAudioElement.pause();
        mainAudioElement.currentTime = 0;
        console.log("All audio stopped");
    }
}

// Legacy functions for compatibility
function stopPhaseSounds() {
    stopAllAudio();
}

function stopAllSounds() {
    stopAllAudio();
}

function playEndSound(isAudioEnabled) {
    if (isAudioEnabled) {
        playAudioPhase('end', isAudioEnabled);
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