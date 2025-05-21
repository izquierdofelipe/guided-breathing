// Placeholder for breathing circle animation logic

const circle = document.getElementById('breathing-circle');

console.log('Breathing app script loaded.');

// Helper function to wait for a specified duration
function wait(durationInMs) {
    return new Promise(resolve => setTimeout(resolve, durationInMs));
}

let isProcessRunning = false; // Flag to control the execution of startBreathingProcess

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
    let isAnimating = false;
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
            console.warn("startBreathingProcess called while already running.");
            return;
        }
        isProcessRunning = true;
        // isAnimating will be set by the caller (e.g. click handler)

        // Ensure audio is initialized (important if user clicks start without prior interaction)
        // This is already called on DOMContentLoaded, but good to have if start is first interaction point.
        initializeAndUnlockAudio(inhaleAudio, holdAudio, exhaleAudio, endAudio);

        currentCycleCount = 0; // Reset for this new process

        while (currentCycleCount < totalCycles && isProcessRunning) {
            currentCycleCount++; // Increment at the start of the cycle
            if (isProcessRunning) updateCycleCounterDisplay(); // Update display if still running
            if (!isProcessRunning) break;

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
            if (!isProcessRunning) break;
            // Visual transition to Hold (expansion finishes here)

            // --------- Hold Phase ---------
            console.log("Hold for", effectiveHoldTime, "seconds.");
            // Circle scale remains MAX_SCALE
            if (isAudioEnabled && holdAudio) {
                holdAudio.currentTime = 0;
                holdAudio.play().catch(e => console.error("Error playing hold audio:", e));
            }

            if (holdWipePathElement) {
                // Simplified placeholder for wipe activation
                holdWipePathElement.style.strokeOpacity = '1';
                holdWipePathElement.style.transition = 'stroke-dashoffset 0s linear'; // Ensure immediate change for start
                holdWipePathElement.style.strokeDashoffset = String(wipeCircumference);
                void holdWipePathElement.offsetWidth; // Force reflow
                holdWipePathElement.style.transition = `stroke-dashoffset ${effectiveHoldTime}s linear`;
                holdWipePathElement.style.strokeDashoffset = '0';
                console.log("Wipe animation would run for", effectiveHoldTime, "seconds");
            }
            await wait(effectiveHoldTime * 1000);
            if (!isProcessRunning) break;
            if (holdWipePathElement) { // Reset wipe after hold
                holdWipePathElement.style.transition = 'stroke-dashoffset 0s linear';
                holdWipePathElement.style.strokeOpacity = '0';
                holdWipePathElement.style.strokeDashoffset = String(wipeCircumference);
            }
            // Visual transition from Hold to Exhale (hold finishes here)

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
            if (!isProcessRunning) break;
            // Visual transition to Inhale (shrink finishes here, ready for next cycle or end)
        }

        if (isProcessRunning) { // Completed naturally (not aborted)
            console.log("Breathing excercise completed naturally.");
            if (currentCycleCount >= totalCycles) {
                playEndSound(isAudioEnabled, endAudio);
            }
        }
        // If aborted, isProcessRunning would be false.
        // The function that set isProcessRunning to false (e.g. via resetAnimationState) is responsible for UI cleanup.

        isProcessRunning = false;
        // The main isAnimating flag should be managed by the caller that initiated stop, or by resetAnimationState.
        // If the loop finished naturally, the app should return to an idle, non-animating state.
        // This will be handled by resetAnimationState called from the click handler or settings update logic.
        // For safety, if it finished naturally and isAnimating is still true, call resetAnimationState.
        if (isAnimating && currentCycleCount >= totalCycles) {
            console.log("startBreathingProcess completed naturally, ensuring reset.");
            resetAnimationState(); // This will set isAnimating and isProcessRunning to false.
        }
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
        isAnimating = false;
        isProcessRunning = false; // Ensure the async loop is signalled to stop
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
            // Ensure audio is initialized on first significant user interaction if not already.
            initializeAndUnlockAudio(inhaleAudio, holdAudio, exhaleAudio, endAudio);
            
            if (isAnimating) { // Clicking to stop animation
                console.log("Circle clicked: Stopping animation.");
                isAnimating = false;        // Set primary animation flag to false
                isProcessRunning = false;   // Signal the async loop to stop
                resetAnimationState();      // Reset UI and state variables
            } else { // Clicking to start animation
                console.log("Circle clicked: Starting animation.");
                isAnimating = true;        // Set primary animation flag to true
                
                // Ensure current settings are applied before starting
                // This call with 'false' will update effectiveTimes and totalCycles from inputs,
                // but will not call resetAnimationState() itself.
                updateAnimation(false); 
                
                // Start the asynchronous breathing process
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