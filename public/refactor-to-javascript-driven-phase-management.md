Phase 1: Setup Core Mechanics in public/script.js
1. Introduce Helper Utilities:
- Create a wait(durationInMs) function: This will return a Promise that resolves after the specified duration, allowing us to use await for phase timing. - DONE
- function wait(durationInMs) { return new Promise(resolve => setTimeout(resolve, durationInMs)); } - DONE
- Potentially a simple playSound(audioElement) helper, though we might integrate this directly into the main loop for clarity. - DEFERRED (integrated directly)
2. Define the New Animation Engine: startBreathingProcess()
- Create an async function startBreathingProcess(). This will be the heart of our new animation. - DONE (skeleton)
- It will be responsible for:
    - Looping through totalCycles. - DONE
    - Inside each cycle, sequentially stepping through phases: Inhale, Hold, Exhale. - DONE
    - Using await wait(...) to control the duration of each phase based on effectiveInhaleTime, effectiveHoldTime, effectiveExhaleTime, and TRANSITION_TIME. - DONE
    - A global flag (e.g., let isProcessRunning = false;) will be used to signal this loop to stop prematurely if the user clicks to stop, or settings change. - DONE (isProcessRunning flag added and used)
3. Modify Global State and Control Variables:
- We'll continue using isAnimating to track if the breathing process should be active. - RETAINED
- currentCycleCount will still be used and updated by startBreathingProcess. - RETAINED & IMPLEMENTED

Phase 2: Rework Animation and Sound Logic within startBreathingProcess() (in public/script.js)
1. Direct Style Manipulation for Circle:
- Instead of relying on CSS keyframes, startBreathingProcess will directly set circleElement.style.transform = 'scale(...)' at the beginning of each phase (e.g., small scale for end of exhale/start of - inhale, large scale for end of inhale/hold). - DONE
- The actual smooth scaling will be handled by adding a CSS transition property to the #breathing-circle in style.css. - DONE (JS sets style, CSS part is Phase 5 but initial JS setup for it is done)
2. Phase-Specific Sound Playback:
- At the beginning of each visual phase (inhale, hold, exhale) within startBreathingProcess, we'll check if (isAudioEnabled). - DONE
- If true, we'll play the corresponding sound: inhaleAudio.currentTime = 0; inhaleAudio.play(); (and similarly for holdAudio, exhaleAudio). - DONE

Phase 3: Update Control Functions in public/script.js
1. Refactor updateAnimation(shouldStopAndReset):
- Remove all CSS @keyframes generation logic. - DONE
- Its primary roles will be:
    - Reading and validating inhaleInput, holdInput, exhaleInput, totalCyclesInput. - DONE
    -Updating effectiveInhaleTime, effectiveHoldTime, effectiveExhaleTime, totalCycles. - DONE
    -Saving settings using saveSettings(). - DONE
    -Updating the duration display text (durationDisplayTextElement). - DONE
    -If shouldStopAndReset is true:
        -Set isAnimating = false; (this will signal startBreathingProcess to stop if it's running). - DONE (via resetAnimationState)
        -Set isProcessRunning = false; (to directly stop the loop). - DONE
        -Call resetAnimationState(). - DONE
- It will not directly start or modify CSS animations anymore. - DONE
2. Refactor resetAnimationState():
- This function will:
    - Set isAnimating = false;. - DONE
    - Set isProcessRunning = false; (ensure loop stops). - DONE
    - Reset currentCycleCount = 0;. - DONE
    - Visually reset the circle to its initial state (e.g., small scale). - DONE
    - Stop any currently playing audio via a simplified stopAllPhaseSounds() (see Phase 4). - DONE (manual pause/reset for now)
    - Reset the hold wipe path to its initial (empty) state. - DONE
    - Update cycleCounterTextElement. - DONE
3. Modify circleElement Click Listener:
- If isAnimating is true (clicking to stop):
    - Set isAnimating = false;. - DONE
    - Set isProcessRunning = false; (to stop the loop). - DONE
    - Call resetAnimationState(). - DONE
- If isAnimating is false (clicking to start):
    - Set isAnimating = true;. - DONE
    - currentCycleCount = 0;. - DONE (handled by startBreathingProcess)
    - Call updateCycleCounterDisplay(). - DONE (handled by startBreathingProcess)
    - Call updateAnimation(false) to ensure settings are current (this will NOT start animation). - DONE
    - Then, invoke startBreathingProcess(). - DONE
4. Modify Settings Input change Listeners:
- They will still call updateAnimation(true), which will now correctly stop the JS-driven animation and reset the state. - DONE (No code change needed)
5. Modify Audio Toggle (audioToggleCheckbox) Listener:
- It will update isAudioEnabled and save settings as before. - DONE (No code change needed)
- If isAudioEnabled becomes false, it should call a function like stopAllPhaseSounds() to immediately silence any currently playing inhale/hold/exhale sound. - DONE (manual pause/reset for now, logic already in place)
- No other special action is needed here to "restart" sounds; startBreathingProcess will handle it based on the new isAudioEnabled value in the next phase it enters. - DONE (Logic already in place)

Phase 4: Simplify public/audio.js
1. Remove Obsolete Functions:
    - Delete triggerSoundsForCycle. - DONE
    - Delete clearScheduledSounds. - DONE
    - Delete stopCurrentCycleSoundsAndClearSchedule. - DONE
2. Simplify Existing Functions (or create new ones):
- initializeAndUnlockAudio can remain as is. - DONE (No change needed)
- playEndSound can remain as is. - DONE (No change needed)
- stopAllSounds can be simplified to stopAllPhaseSounds(inhaleAudio, holdAudio, exhaleAudio) which just pauses and resets currentTime for these three, and then a separate stopEndSound(endAudio). The main stopAllSounds could call both. The key is that we no longer have timeouts to clear. - DONE (stopPhaseSounds created and used by stopAllSounds; script.js updated to call stopPhaseSounds where appropriate)

Phase 5: CSS Adjustments in style.css
1. Remove CSS Keyframe Animation:
- Delete the entire @keyframes breathing-circle { ... } rule. - DONE
2. Add CSS Transition for Smoothness:
- To #breathing-circle, add transition: transform 0.5s ease-in-out; (or your preferred TRANSITION_TIME). This will make the transform: scale(...) changes from JavaScript animate smoothly. - DONE (Handled by JS setting style.transition)
3. Review Radial Wipe Animation:
- The @keyframes radial-hold-wipe will still be used, but its trigger and duration will be more explicitly controlled by JavaScript setting animation properties on the holdWipePathElement during the hold phase within startBreathingProcess. - DONE (Keyframe removed; JS placeholder for direct wipe animation via transition is in script.js)

Phase 6: Testing and Iteration
- Thoroughly test all functionalities:
    - Start/stop.
    - Changing settings (duration, cycles) while idle and while animating.
    - Toggling audio on/off during different phases of a cycle and ensuring it picks up correctly (or stays off) for subsequent phases/cycles.
    - End of cycles behavior.