// Placeholder for breathing circle animation logic

const circle = document.getElementById('breathing-circle');
const instructionText = document.getElementById('instruction-text');

console.log('Breathing app script loaded.');

document.addEventListener('DOMContentLoaded', () => {
    // Default settings
    const DEFAULT_INHALE_TIME = 4;
    const DEFAULT_HOLD_TIME = 16;
    const DEFAULT_EXHALE_TIME = 8;
    const DEFAULT_TOTAL_CYCLES = 10;
    const DEFAULT_AUDIO_ENABLED = true;
    const TRANSITION_TIME = 0.5; 

    const APP_SETTINGS_KEY = 'breathingAppSettings';

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

    // Audio elements
    const inhaleAudio = document.getElementById('inhale-audio');
    const holdAudio = document.getElementById('hold-audio');
    const exhaleAudio = document.getElementById('exhale-audio');
    const endAudio = document.getElementById('end-audio');
    const audioToggleCheckbox = document.getElementById('audio-toggle');

    let manualHour = -1; // -1 means automatic, 0-23 means manual override by slider
    let sliderEl = null; // Will be the slider input element
    let sliderHourDisplayEl = null; // Will be the span element for displaying the hour

    // Function to create and append a slider and its hour display for development/testing
    function createDevelopmentSliderAndDisplay() {
        const devHostnames = ['localhost', '127.0.0.1'];
        if (devHostnames.includes(window.location.hostname)) {
            console.log("Development mode detected, creating time slider with display.");

            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.bottom = '10px'; // Adjusted for text display
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.width = '80%';
            container.style.maxWidth = '500px';
            container.style.zIndex = '1000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';

            sliderHourDisplayEl = document.createElement('span');
            sliderHourDisplayEl.id = 'dev-time-slider-display';
            sliderHourDisplayEl.style.background = 'rgba(0,0,0,0.7)';
            sliderHourDisplayEl.style.color = 'white';
            sliderHourDisplayEl.style.padding = '3px 8px';
            sliderHourDisplayEl.style.borderRadius = '3px';
            sliderHourDisplayEl.style.marginBottom = '5px';
            sliderHourDisplayEl.style.fontSize = '12px';
            sliderHourDisplayEl.textContent = '-'; // Initial text

            sliderEl = document.createElement('input');
            sliderEl.id = 'dev-time-slider';
            sliderEl.type = 'range';
            sliderEl.min = '0';
            sliderEl.max = '100';
            sliderEl.value = '50';
            sliderEl.step = '1';
            sliderEl.style.width = '100%'; // Slider takes full width of container
            sliderEl.style.background = 'rgba(255,255,255,0.7)'; // Slider background
            sliderEl.style.padding = '5px';
            sliderEl.style.boxSizing = 'border-box';
            sliderEl.style.borderRadius = '5px';

            container.appendChild(sliderHourDisplayEl);
            container.appendChild(sliderEl);
            document.body.appendChild(container);
            
            // No need to return, elements are assigned to sliderEl and sliderHourDisplayEl
        } else {
            sliderEl = null;
            sliderHourDisplayEl = null;
        }
    }

    createDevelopmentSliderAndDisplay(); // Create slider and display if in dev mode

    // Function to load settings from localStorage
    function loadSettings() {
        const savedSettings = localStorage.getItem(APP_SETTINGS_KEY);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            return {
                inhaleTime: parseInt(settings.inhaleTime, 10) || DEFAULT_INHALE_TIME,
                holdTime: parseInt(settings.holdTime, 10) || DEFAULT_HOLD_TIME,
                exhaleTime: parseInt(settings.exhaleTime, 10) || DEFAULT_EXHALE_TIME,
                totalCycles: parseInt(settings.totalCycles, 10) || DEFAULT_TOTAL_CYCLES,
                audioEnabled: typeof settings.audioEnabled === 'boolean' ? settings.audioEnabled : DEFAULT_AUDIO_ENABLED
            };
        }
        return {
            inhaleTime: DEFAULT_INHALE_TIME,
            holdTime: DEFAULT_HOLD_TIME,
            exhaleTime: DEFAULT_EXHALE_TIME,
            totalCycles: DEFAULT_TOTAL_CYCLES,
            audioEnabled: DEFAULT_AUDIO_ENABLED
        };
    }

    // Function to save settings to localStorage
    function saveSettings(settings) {
        localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    }

    // Load initial settings
    let currentSettings = loadSettings();

    // Set initial input values from loaded or default settings
    inhaleInput.value = currentSettings.inhaleTime;
    holdInput.value = currentSettings.holdTime;
    exhaleInput.value = currentSettings.exhaleTime;
    totalCyclesInput.value = currentSettings.totalCycles;
    audioToggleCheckbox.checked = currentSettings.audioEnabled;

    let isAnimating = false;
    let keyframesRule = null;
    let currentCycleCount = 0;
    // Initialize effective times and total cycles from loaded or default settings
    let effectiveInhaleTime = currentSettings.inhaleTime;
    let effectiveHoldTime = currentSettings.holdTime;
    let effectiveExhaleTime = currentSettings.exhaleTime;
    let totalCycles = currentSettings.totalCycles;

    let holdSoundTimeoutId = null;
    let exhaleSoundTimeoutId = null;
    let isAudioEnabled = currentSettings.audioEnabled; // Initialize from loaded or default
    let audioInitialized = false; // Flag to ensure audio is initialized only once

    // Initial setup for the wipe path's circumference and dash properties
    const wipeRadius = parseFloat(holdWipePathElement.getAttribute('r'));
    const wipeCircumference = 2 * Math.PI * wipeRadius;
    holdWipePathElement.style.setProperty('--wipe-circumference', wipeCircumference);
    holdWipePathElement.style.strokeDasharray = wipeCircumference;
    holdWipePathElement.style.strokeDashoffset = wipeCircumference; // Start empty

    function initializeAndUnlockAudio() {
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
                item.el.load(); // Explicitly ask the browser to load the audio file
            }
        });

        audioInitialized = true;
        console.log("Audio elements initialized and unlocked on user interaction.");
    }

    // Add event listeners to initialize audio on the first user interaction
    // This helps with autoplay policies in browsers like Safari.
    document.addEventListener('click', initializeAndUnlockAudio, { once: true });
    document.addEventListener('keydown', initializeAndUnlockAudio, { once: true });
    document.addEventListener('touchstart', initializeAndUnlockAudio, { once: true });

    // Initialize audio immediately when the page loads
    initializeAndUnlockAudio();

    // ---------- Dynamic Background Logic Start --------------------
    const grads = [
        [{color:"00000c",position:0},{color:"00000c",position:0}],
        [{color:"020111",position:85},{color:"191621",position:100}],
        [{color:"020111",position:60},{color:"20202c",position:100}],
        [{color:"020111",position:10},{color:"3a3a52",position:100}],
        [{color:"20202c",position:0},{color:"515175",position:100}],
        [{color:"40405c",position:0},{color:"6f71aa",position:80},{color:"8a76ab",position:100}],
        [{color:"4a4969",position:0},{color:"7072ab",position:50},{color:"cd82a0",position:100}],
        [{color:"757abf",position:0},{color:"8583be",position:60},{color:"eab0d1",position:100}],
        [{color:"82addb",position:0},{color:"ebb2b1",position:100}],
        [{color:"94c5f8",position:1},{color:"a6e6ff",position:70},{color:"b1b5ea",position:100}],
        [{color:"b7eaff",position:0},{color:"94dfff",position:100}],
        [{color:"9be2fe",position:0},{color:"67d1fb",position:100}],
        [{color:"90dffe",position:0},{color:"38a3d1",position:100}],
        [{color:"57c1eb",position:0},{color:"246fa8",position:100}],
        [{color:"2d91c2",position:0},{color:"1e528e",position:100}],
        [{color:"2473ab",position:0},{color:"1e528e",position:70},{color:"5b7983",position:100}],
        [{color:"1e528e",position:0},{color:"265889",position:50},{color:"9da671",position:100}],
        [{color:"1e528e",position:0},{color:"728a7c",position:50},{color:"e9ce5d",position:100}],
        [{color:"154277",position:0},{color:"576e71",position:30},{color:"e1c45e",position:70},{color:"b26339",position:100}],
        [{color:"163C52",position:0},{color:"4F4F47",position:30},{color:"C5752D",position:60},{color:"B7490F",position:80},{color:"2F1107",position:100}],
        [{color:"071B26",position:0},{color:"071B26",position:30},{color:"8A3B12",position:80},{color:"240E03",position:100}],
        [{color:"010A10",position:30},{color:"59230B",position:80},{color:"2F1107",position:100}],
        [{color:"090401",position:50},{color:"4B1D06",position:100}],
        [{color:"00000c",position:80},{color:"150800",position:100}],
    ];

    const toCSS = stops =>
        `linear-gradient(to bottom,${stops.map(s=>` #${s.color} ${s.position}%`).join(',')})`;

    let curHour = -1;
    const tzMapPromise = fetch('/tz-latlng.json')
        .then(r => r.json())
        .catch(err => {
            console.warn('Failed to load tz-latlng.json, using default coordinates. Error:', err);
            return {}; // Return empty object on error to avoid breaking lat/lng lookup
        });

    async function setHour(h) {
        // Ensure h is a number and within 0-23 range for safety, though grads array handles Math.min/max
        const hourToShow = Math.min(Math.max(Math.round(h), 0), 23);
        
        // If the hour to show is the same as the current hour, AND we are NOT in manual mode (or slider doesn't exist),
        // then there's no need to update.
        if (hourToShow === curHour && !(sliderEl && manualHour !== -1)) {
            return;
        }

        curHour = hourToShow;
        const gradIndex = Math.min(Math.max(hourToShow, 0), grads.length - 1);
        document.body.style.background = toCSS(grads[gradIndex]);
    }

    // Helper function to update slider position
    function updateSliderPosition(hourToShow) {
        if (sliderEl) {
            const sliderValue = (hourToShow / (grads.length - 1)) * 100;
            sliderEl.value = sliderValue;
        }
        if (sliderHourDisplayEl) {
            sliderHourDisplayEl.textContent = `${hourToShow}:00`;
        }
    }

    async function updateSun() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const map = await tzMapPromise;
            const [lat, lng] = map[tz] || [40.7144, -74.0060]; // Default to New York if timezone not in map
            const now = new Date();
            // console.log('SunCalc object:', SunCalc); // Keep for debugging if needed
            const times = SunCalc.getTimes(now, lat, lng);

            const currentActualHour = now.getHours(); // Using wall clock hour for gradient selection

            // console.log(`Daylight hours for ${tz} [${lat}, ${lng}]: ...`); // Keep for debugging

            if (manualHour !== -1) {
                setHour(manualHour); // Stick to manual hour if active
            } else {
                setHour(currentActualHour);
                updateSliderPosition(currentActualHour); // Update slider if in automatic mode
            }

        } catch (error) {
            console.error("Error in updateSun:", error);
            // Fallback behavior
            const fallbackHour = new Date().getHours();
            if (manualHour !== -1) {
                setHour(manualHour);
            } else {
                setHour(fallbackHour);
                updateSliderPosition(fallbackHour);
            }
        }
    }

    // Slider event listener for testing
    if (sliderEl) {
        sliderEl.addEventListener('input', e => {
            const targetValue = parseInt(e.target.value, 10);
            // Calculate hour based on the slider's 0-100 value and the number of gradient steps (24 hours, 0-23)
            const h = Math.round(((grads.length - 1) * targetValue) / 100);
            manualHour = h;
            setHour(h); // Update background gradient
            // Update the slider's visual text display to the new hour
            // updateSliderPosition(h); // Call this to also update the text element if not already handled
            if (sliderHourDisplayEl) { // Direct update to be certain
                sliderHourDisplayEl.textContent = `${h}:00`;
            }
        });
    }

    // Initial setup
    updateSun(); // Call immediately to set initial background and slider position

    // Update current hour's gradient every minute (if not in manual mode)
    setInterval(() => {
        if (manualHour === -1) { // Only update if manual override is not active
            const currentActualHour = new Date().getHours();
            setHour(currentActualHour);
            updateSliderPosition(currentActualHour);
        }
    }, 60_000);
    // Update sun times (and potentially adjust gradient logic based on it) every hour
    setInterval(updateSun, 3_600_000);

    // ---------- Dynamic Background Logic End ----------------------

    function openSettingsModal() {
        if (settingsModal && modalOverlay) {
            settingsModal.classList.add('active');
            modalOverlay.classList.add('active');
        }
    }

    function closeSettingsModal() {
        if (settingsModal && modalOverlay) {
            settingsModal.classList.remove('active');
            modalOverlay.classList.remove('active');
        }
    }

    // Event listeners for modal
    if (cycleCounterContainerElement) {
        cycleCounterContainerElement.addEventListener('click', openSettingsModal);
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeSettingsModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeSettingsModal();
            }
        });
    }

    // Find the @keyframes rule
    for (let i = 0; i < document.styleSheets.length; i++) {
        try {
            const sheet = document.styleSheets[i];
            if (!sheet.cssRules) continue;
            for (let j = 0; j < sheet.cssRules.length; j++) {
                const rule = sheet.cssRules[j];
                if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'breathing-circle') {
                    keyframesRule = rule;
                    break;
                }
            }
            if (keyframesRule) break;
        } catch (e) {
            // Catch potential CORS issues with external stylesheets
            console.warn("Could not access stylesheet: " + document.styleSheets[i].href, e);
            continue;
        }
    }

    if (!keyframesRule) {
        console.error('@keyframes breathing-circle not found.');
        return; // Stop if we can't find the keyframes
    }

    function updateCycleCounterDisplay() {
        cycleCounterTextElement.textContent = `${currentCycleCount} / ${totalCycles}`;
    }

    function updateDurationDisplay() {
        if (durationDisplayTextElement) {
            durationDisplayTextElement.textContent = `${effectiveInhaleTime} - ${effectiveHoldTime} - ${effectiveExhaleTime}`;
        }
    }

    function clearScheduledSounds() {
        if (holdSoundTimeoutId) clearTimeout(holdSoundTimeoutId);
        if (exhaleSoundTimeoutId) clearTimeout(exhaleSoundTimeoutId);
        holdSoundTimeoutId = null;
        exhaleSoundTimeoutId = null;
    }

    function stopAllSounds() {
        clearScheduledSounds();
        if (inhaleAudio) { inhaleAudio.pause(); inhaleAudio.currentTime = 0; }
        if (holdAudio) { holdAudio.pause(); holdAudio.currentTime = 0; }
        if (exhaleAudio) { exhaleAudio.pause(); exhaleAudio.currentTime = 0; }
        if (endAudio) { endAudio.pause(); endAudio.currentTime = 0; } 
    }

    function playEndSound() {
        if (isAudioEnabled && endAudio) {
            // Small delay to ensure other sounds are fully stopped
            setTimeout(() => {
                endAudio.currentTime = 0;
                endAudio.play().catch(e => console.error("Error playing end audio:", e));
            }, 100);
        }
    }

    function triggerSoundsForCycle() {
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

    function forceRestartWipeAnimation() {
        if (holdWipePathElement) {
            holdWipePathElement.style.animationName = 'none';
            holdWipePathElement.style.animationDuration = '';
            holdWipePathElement.style.animationDelay = '';
            holdWipePathElement.style.animationTimingFunction = '';
            holdWipePathElement.style.animationFillMode = '';

            holdWipePathElement.style.strokeDashoffset = String(wipeCircumference);
            holdWipePathElement.style.strokeOpacity = '0';

            if (effectiveHoldTime <= 0) {
                return;
            }

            void holdWipePathElement.offsetWidth;

            setTimeout(() => {
                holdWipePathElement.style.animationDuration = `${effectiveHoldTime}s`;
                holdWipePathElement.style.animationDelay = `${TRANSITION_TIME + effectiveInhaleTime + TRANSITION_TIME}s`;
                holdWipePathElement.style.animationTimingFunction = 'linear';
                holdWipePathElement.style.animationFillMode = 'forwards';
                
                holdWipePathElement.style.animationName = 'radial-hold-wipe';
            }, 0);

        } else {
        }
    }

    function resetAnimationState() {
        isAnimating = false;
        currentCycleCount = 0;
        circleElement.classList.remove('breathing');
        stopAllSounds(); // Stop any scheduled or playing sounds
        if (holdWipePathElement) {
            holdWipePathElement.style.animationName = 'none'; // Stop wipe animation
            holdWipePathElement.style.strokeDashoffset = wipeCircumference; // Reset its visual state
        }
        updateCycleCounterDisplay();
    }

    function updateAnimation() {
        effectiveInhaleTime = parseInt(inhaleInput.value, 10) || DEFAULT_INHALE_TIME;
        effectiveHoldTime = parseInt(holdInput.value, 10) || DEFAULT_HOLD_TIME;
        effectiveExhaleTime = parseInt(exhaleInput.value, 10) || DEFAULT_EXHALE_TIME;
        totalCycles = parseInt(totalCyclesInput.value, 10) || DEFAULT_TOTAL_CYCLES;

        // Ensure times are non-negative, with minimums for inhale/exhale
        effectiveInhaleTime = Math.max(1, effectiveInhaleTime);
        effectiveHoldTime = Math.max(0, effectiveHoldTime);
        effectiveExhaleTime = Math.max(1, effectiveExhaleTime);

        inhaleInput.value = effectiveInhaleTime;
        holdInput.value = effectiveHoldTime;
        exhaleInput.value = effectiveExhaleTime;
        totalCyclesInput.value = totalCycles;

        // Save current settings
        saveSettings({
            inhaleTime: effectiveInhaleTime,
            holdTime: effectiveHoldTime,
            exhaleTime: effectiveExhaleTime,
            totalCycles: totalCycles,
            audioEnabled: isAudioEnabled
        });

        // Calculate the total duration for one cycle including transitions
        const baseAnimationDuration = effectiveInhaleTime + effectiveHoldTime + effectiveExhaleTime;
        let newTotalDuration;

        if (baseAnimationDuration <= 0) { // Should not happen with new checks but good fallback
            effectiveInhaleTime = DEFAULT_INHALE_TIME;
            effectiveHoldTime = DEFAULT_HOLD_TIME;
            effectiveExhaleTime = DEFAULT_EXHALE_TIME;
            newTotalDuration = DEFAULT_INHALE_TIME + DEFAULT_HOLD_TIME + DEFAULT_EXHALE_TIME + (3 * TRANSITION_TIME);
        } else {
            newTotalDuration = baseAnimationDuration + (3 * TRANSITION_TIME);
        }
        
        while (keyframesRule.cssRules.length > 0) { keyframesRule.deleteRule(keyframesRule.cssRules[0].keyText); }

        const points = [];
        let currentTime = 0;

        // Start (Beginning of Inhale Transition)
        points.push({ t: currentTime, scale: 0.05 });
        currentTime += TRANSITION_TIME;
        // End of Inhale Transition / Start of Inhale Animation
        points.push({ t: currentTime, scale: 0.05 });
        currentTime += effectiveInhaleTime;
        // End of Inhale Animation / Start of Hold Transition
        points.push({ t: currentTime, scale: 1.4 });
        currentTime += TRANSITION_TIME;
        // End of Hold Transition / Start of Hold Animation
        points.push({ t: currentTime, scale: 1.4 });
        currentTime += effectiveHoldTime;
        // End of Hold Animation / Start of Exhale Transition
        points.push({ t: currentTime, scale: 1.4 });
        currentTime += TRANSITION_TIME;
        // End of Exhale Transition / Start of Exhale Animation
        points.push({ t: currentTime, scale: 1.4 });
        currentTime += effectiveExhaleTime;
        // End of Exhale Animation
        points.push({ t: currentTime, scale: 0.05 });

        // Convert time points to percentages for keyframes
        const kf = points.map(point => ({
            p: (point.t / newTotalDuration) * 100,
            scale: point.scale
        }));
        
        const uniqueKeyframes = kf.filter((item, index, self) => 
            index === self.findIndex((t) => t.p.toFixed(2) === item.p.toFixed(2)) || 
            (item.p.toFixed(2) === "100.00" && self.filter(x => x.p.toFixed(2) === "100.00").length === 1) // Ensure 100% keyframe is kept if it's the last unique
        );

        uniqueKeyframes.forEach(key => {
            const keyText = `${key.p.toFixed(2)}%`;
            const ruleString = `${keyText} { transform: translate(-50%, -50%) scale(${key.scale.toFixed(2)}); }`;
            keyframesRule.appendRule(ruleString);
        });
        
        circleElement.style.animationDuration = `${newTotalDuration}s`;

        updateCycleCounterDisplay();
        updateDurationDisplay();

        if (isAnimating) {
            if (currentCycleCount >= totalCycles) {
                stopAllSounds(); // Clear phase sounds before end sound
                playEndSound();
                resetAnimationState();
            } else {
                circleElement.classList.remove('breathing');
                void circleElement.offsetWidth; 
                circleElement.classList.add('breathing');
                if (isAudioEnabled) triggerSoundsForCycle(); // Check before triggering
                forceRestartWipeAnimation(); 
            }
        } else {
            if (holdWipePathElement) {
                holdWipePathElement.style.animationName = 'none';
                holdWipePathElement.style.strokeDashoffset = String(wipeCircumference); 
                holdWipePathElement.style.strokeOpacity = '0';
            }
        }
    }

    if (circleElement && inhaleInput && holdInput && exhaleInput && totalCyclesInput && cycleCounterTextElement && durationDisplayTextElement && cycleCounterContainerElement && settingsModal && modalOverlay && closeModalBtn && holdWipePathElement) {
        circleElement.addEventListener('click', () => {
            // Ensure audio is initialized before starting the breath cycle
            initializeAndUnlockAudio();
            
            if (isAnimating) {
                resetAnimationState();
            } else {
                isAnimating = true;
                currentCycleCount = 0; 
                updateAnimation(); 
            }
        });

        circleElement.addEventListener('animationiteration', () => {
            if (!isAnimating) {
                return;
            }
            currentCycleCount++;
            updateCycleCounterDisplay();
            if (currentCycleCount >= totalCycles) {
                stopAllSounds(); // Clear phase sounds before end sound
                playEndSound();
                resetAnimationState();
            } else {
                if (isAudioEnabled) triggerSoundsForCycle(); // Check before triggering
                forceRestartWipeAnimation(); 
            }
        });

        [inhaleInput, holdInput, exhaleInput, totalCyclesInput].forEach(input => {
            input.addEventListener('change', updateAnimation);
        });

        if (audioToggleCheckbox) {
            audioToggleCheckbox.addEventListener('change', (event) => {
                isAudioEnabled = event.target.checked;
                if (!isAudioEnabled) {
                    stopAllSounds(); // If audio is disabled, stop any current sounds
                }
                // Save settings when audio toggle changes
                saveSettings({
                    inhaleTime: effectiveInhaleTime,
                    holdTime: effectiveHoldTime,
                    exhaleTime: effectiveExhaleTime,
                    totalCycles: totalCycles,
                    audioEnabled: isAudioEnabled
                });
            });
            // Initialize based on checkbox current state (in case it's not checked by default in future)
            isAudioEnabled = audioToggleCheckbox.checked; // This was already here, ensure it aligns with loaded settings
        }

        updateAnimation(); // Initial setup

    } else {
        console.error('One or more required elements were not found.');
    }

    // Ensure initial updateAnimation call correctly sets up UI displays
    // updateAnimation(); // This call might also interact with setHour and needs to be aware of manualHour

    // Initial call to set up based on current time or defaults
    if (typeof updateAnimation === "function") {
        updateAnimation(); // Ensure breathing animation settings and displays are also initialized.
    }
}); 