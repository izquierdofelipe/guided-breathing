// Placeholder for breathing circle animation logic

const circle = document.getElementById('breathing-circle');

console.log('Breathing app script loaded.');

// Helper function to wait for a specified duration
function wait(durationInMs) {
    return new Promise(resolve => setTimeout(resolve, durationInMs));
}

let isProcessRunning = false; // Flag to control the execution of startBreathingProcess
let activeProcessController = null; // Ensures only the latest process runs

document.addEventListener('DOMContentLoaded', () => {
    const circleElement = document.getElementById('circle');
    const inhaleInput = document.getElementById('inhale-duration');
    const holdInput = document.getElementById('hold-duration');
    const exhaleInput = document.getElementById('exhale-duration');
    const totalCyclesInput = document.getElementById('total-cycles');
    const cycleCounterTextElement = document.getElementById('cycle-counter-text');
    const durationDisplayTextElement = document.getElementById('duration-display-text');
    const cycleCounterContainerElement = document.getElementById('cycle-counter-container');
    const holdWipePathElement = document.getElementById('hold-wipe-path');

    const settingsModal = document.getElementById('settings-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const inhaleAudio = document.getElementById('inhale-audio');
    const holdAudio = document.getElementById('hold-audio');
    const exhaleAudio = document.getElementById('exhale-audio');
    const endAudio = document.getElementById('end-audio');
    const audioToggleCheckbox = document.getElementById('audio-toggle');

    let currentSettings = loadSettings();

    inhaleInput.value = currentSettings.inhaleTime;
    holdInput.value = currentSettings.holdTime;
    exhaleInput.value = currentSettings.exhaleTime;
    totalCyclesInput.value = currentSettings.totalCycles;
    audioToggleCheckbox.checked = currentSettings.audioEnabled;

    const INITIAL_SCALE = 0.05;
    const MAX_SCALE = 1.4;
    const RESTING_SCALE = 0.725; // New scale for idle state

    let effectiveInhaleTime = currentSettings.inhaleTime;
    let effectiveHoldTime = currentSettings.holdTime;
    let effectiveExhaleTime = currentSettings.exhaleTime;
    let totalCycles = currentSettings.totalCycles;

    let isAudioEnabled = currentSettings.audioEnabled;
    let isAnimating = false; // Used by click handler to toggle start/stop intent
    let currentCycleCount = 0;

    if (circleElement) {
        circleElement.style.transition = `transform 1s ease-in-out`;
        circleElement.style.transform = `translate(-50%, -50%) scale(${RESTING_SCALE})`; // Use RESTING_SCALE
    }

    const wipeRadius = holdWipePathElement ? parseFloat(holdWipePathElement.getAttribute('r')) : 0;
    const wipeCircumference = 2 * Math.PI * wipeRadius;
    if (holdWipePathElement) {
        holdWipePathElement.style.setProperty('--wipe-circumference', wipeCircumference);
        holdWipePathElement.style.strokeDasharray = wipeCircumference;
        holdWipePathElement.style.strokeDashoffset = wipeCircumference;
    }

    initializeAndUnlockAudio(inhaleAudio, holdAudio, exhaleAudio, endAudio);

    setupModalEventListeners(settingsModal, modalOverlay, closeModalBtn, cycleCounterContainerElement);

    if (typeof setupDevSliderEventListeners === 'function') {
        setupDevSliderEventListeners(grads, setHour, updateSun, updateSliderPosition);
    }

    async function startBreathingProcess() {
        if (isProcessRunning) {
            console.warn("startBreathingProcess called while isProcessRunning was true; returning to prevent overlap.");
            return;
        }
        isProcessRunning = true; // Mark that a process is now officially trying to run
        isAnimating = true;      // Update intent flag

        const myId = Symbol('processId'); // Unique ID for this specific run
        activeProcessController = myId;   // This instance is now the active one

        initializeAndUnlockAudio(inhaleAudio, holdAudio, exhaleAudio, endAudio);

        currentCycleCount = 0;

        while (currentCycleCount < totalCycles && activeProcessController === myId) {
            currentCycleCount++;
            if (activeProcessController !== myId) break;
            updateCycleCounterDisplay();
            if (activeProcessController !== myId) break;

            // --------- Inhale Phase ---------
            console.log("Inhale for", effectiveInhaleTime, "seconds.");
            if (circleElement) {
                circleElement.style.transition = `transform ${effectiveInhaleTime}s ease-in-out`;
                circleElement.style.transform = `translate(-50%, -50%) scale(${MAX_SCALE})`;
            }
            if (isAudioEnabled && inhaleAudio) {
                inhaleAudio.currentTime = 0;
                inhaleAudio.play().catch(e => console.error("Error playing inhale audio:", e));
            }
            await wait(effectiveInhaleTime * 1000);
            if (activeProcessController !== myId) break;

            // --------- Hold Phase ---------
            console.log("Hold for", effectiveHoldTime, "seconds.");
            if (isAudioEnabled && holdAudio) {
                holdAudio.currentTime = 0;
                holdAudio.play().catch(e => console.error("Error playing hold audio:", e));
            }

            if (holdWipePathElement) {
                holdWipePathElement.style.strokeOpacity = '1';
                holdWipePathElement.style.transition = 'stroke-dashoffset 0s linear';
                holdWipePathElement.style.strokeDashoffset = String(wipeCircumference);
                void holdWipePathElement.offsetWidth;
                holdWipePathElement.style.transition = `stroke-dashoffset ${effectiveHoldTime}s linear`;
                holdWipePathElement.style.strokeDashoffset = '0';
            }
            await wait(effectiveHoldTime * 1000);
            if (activeProcessController !== myId) break;
            if (holdWipePathElement) {
                holdWipePathElement.style.transition = 'stroke-dashoffset 0s linear';
                holdWipePathElement.style.strokeOpacity = '0';
                holdWipePathElement.style.strokeDashoffset = String(wipeCircumference);
            }

            // --------- Exhale Phase ---------
            console.log("Exhale for", effectiveExhaleTime, "seconds.");
            if (circleElement) {
                circleElement.style.transition = `transform ${effectiveExhaleTime}s ease-in-out`;
                circleElement.style.transform = `translate(-50%, -50%) scale(${INITIAL_SCALE})`;
            }
            if (isAudioEnabled && exhaleAudio) {
                exhaleAudio.currentTime = 0;
                exhaleAudio.play().catch(e => console.error("Error playing exhale audio:", e));
            }
            await wait(effectiveExhaleTime * 1000);
            if (activeProcessController !== myId) break;
        }

        if (activeProcessController === myId) { // If I was the one that completed or was last active
            activeProcessController = null;     // Clear myself as active
            if (currentCycleCount >= totalCycles && isProcessRunning) { // Check isProcessRunning to ensure it wasn't reset externally
                console.log("Breathing exercise completed naturally.");
                playEndSound(isAudioEnabled, endAudio);
                resetAnimationState(); // Resets isAnimating and isProcessRunning to false
            } else if (isProcessRunning) { 
                // If loop was broken by activeProcessController change but this instance was still 'myId' (unlikely)
                // or if totalCycles was not met but loop ended.
                // Ensure clean state if resetAnimationState wasn't called.
                isProcessRunning = false;
                isAnimating = false;
            }
        }
        // If the loop exited because activeProcessController !== myId, it means resetAnimationState 
        // (which sets isProcessRunning = false) or another process took over.
        // No specific cleanup for isProcessRunning needed here for that case, resetAnimationState handles it.
    }

    function updateCycleCounterDisplay() {
        cycleCounterTextElement.textContent = `${currentCycleCount} / ${totalCycles}`;
    }

    function updateDurationDisplay() {
        if (durationDisplayTextElement) {
            durationDisplayTextElement.textContent = `${effectiveInhaleTime} - ${effectiveHoldTime} - ${effectiveExhaleTime}`;
        }
    }

    function resetAnimationState() {
        console.log("resetAnimationState called.");
        activeProcessController = null; // Crucial: stop any ongoing process controlled by ID
        isAnimating = false;
        isProcessRunning = false; // Ensure this is set false
        currentCycleCount = 0;

        if (circleElement) {
            circleElement.style.transition = `transform 1s ease-in-out`; // Explicitly set transition for reset
            circleElement.style.transform = `translate(-50%, -50%) scale(${RESTING_SCALE})`; // Use RESTING_SCALE
        }
        
        stopPhaseSounds(inhaleAudio, holdAudio, exhaleAudio); // Use the new function from audio.js

        if (holdWipePathElement) {
            holdWipePathElement.style.transition = 'stroke-dashoffset 0s linear'; 
            holdWipePathElement.style.strokeOpacity = '0';
            holdWipePathElement.style.strokeDashoffset = String(wipeCircumference);
        }
        updateCycleCounterDisplay(); 
    }

    function updateAnimation(shouldStopAndReset = false) { 
        console.log(`updateAnimation called. shouldStopAndReset: ${shouldStopAndReset}`);

        // 1. Read and validate input values
        const newInhaleTime = parseInt(inhaleInput.value, 10) || DEFAULT_INHALE_TIME;
        const newHoldTime = parseInt(holdInput.value, 10) || DEFAULT_HOLD_TIME;
        const newExhaleTime = parseInt(exhaleInput.value, 10) || DEFAULT_EXHALE_TIME;
        const newTotalCycles = parseInt(totalCyclesInput.value, 10) || DEFAULT_TOTAL_CYCLES;

        // 2. Update global effectiveTime and totalCycles variables
        effectiveInhaleTime = Math.max(1, newInhaleTime);
        effectiveHoldTime = Math.max(0, newHoldTime);
        effectiveExhaleTime = Math.max(1, newExhaleTime);
        totalCycles = Math.max(1, newTotalCycles);

        // Ensure input fields reflect validated values
        inhaleInput.value = effectiveInhaleTime;
        holdInput.value = effectiveHoldTime;
        exhaleInput.value = effectiveExhaleTime;
        totalCyclesInput.value = totalCycles;

        // 3. Save settings
        currentSettings = {
            inhaleTime: effectiveInhaleTime,
            holdTime: effectiveHoldTime,
            exhaleTime: effectiveExhaleTime,
            totalCycles: totalCycles,
            audioEnabled: isAudioEnabled // Keep existing audio setting
        };
        saveSettings(currentSettings);
        
        // 4. Update duration display text
        updateDurationDisplay(); 

        // 5. CSS @keyframes generation logic is REMOVED.

        // 6. If shouldStopAndReset is true:
        if (shouldStopAndReset) {
            console.log("updateAnimation: Stopping process and resetting state.");
            isProcessRunning = false; // Signal the async loop to stop
            // isAnimating will be set to false by resetAnimationState
            resetAnimationState();    // Perform full UI and state reset
        }
        // This function no longer directly starts/stops animations or changes .breathing class.
        // It only updates settings and can trigger a reset.
    }

    if (circleElement && inhaleInput && holdInput && exhaleInput && totalCyclesInput && cycleCounterTextElement && durationDisplayTextElement && cycleCounterContainerElement && settingsModal && modalOverlay && closeModalBtn && holdWipePathElement) {
        circleElement.addEventListener('click', () => {
            initializeAndUnlockAudio(inhaleAudio, holdAudio, exhaleAudio, endAudio);
            
            if (isAnimating) { // If current intent is animating, click means STOP
                console.log("Circle clicked: Stopping animation (intent was animating).");
                // resetAnimationState will handle setting isAnimating, isProcessRunning to false,
                // and activeProcessController to null.
                resetAnimationState();
            } else { // If current intent is not animating, click means START
                console.log("Circle clicked: Starting animation (intent was not animating).");
                updateAnimation(false); // Load settings. isAnimating and isProcessRunning are currently false.
                
                // startBreathingProcess will set isAnimating = true, isProcessRunning = true (if it proceeds),
                // and establish the new activeProcessController.
                startBreathingProcess(); 
            }
        });

        // REMOVE OLD animationiteration listener - it's not used with JS-driven phases
        // circleElement.addEventListener('animationiteration', () => { ... }); 

        [inhaleInput, holdInput, exhaleInput, totalCyclesInput].forEach(input => {
            input.addEventListener('change', () => {
                console.log("Settings input changed.");
                updateAnimation(true); 
            }); 
        });

        if (audioToggleCheckbox) {
            audioToggleCheckbox.addEventListener('change', (event) => {
                isAudioEnabled = event.target.checked;
                // Update currentSettings before saving, so saveSettings has the latest audioEnabled state
                currentSettings.audioEnabled = isAudioEnabled; 
                saveSettings(currentSettings); 
                if (!isAudioEnabled) {
                    stopPhaseSounds(inhaleAudio, holdAudio, exhaleAudio); // Use the new function from audio.js
                    console.log("Audio toggled OFF, active phase sounds stopped.");
                } else {
                    console.log("Audio toggled ON.");
                }
            });
        }

        updateAnimation(false); 
        updateCycleCounterDisplay();

    } else {
        console.error('One or more required elements were not found.');
    }

    // Ensure initial updateAnimation call correctly sets up UI displays
    // updateAnimation(false); // This call might also interact with setHour and needs to be aware of manualHour - Already called above

    // Initial call to set up based on current time or defaults
    // if (typeof updateAnimation === "function") { // Already called above
    //     updateAnimation(false);
    // }
}); 