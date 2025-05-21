// public/dev-slider.js

// These variables will be used by this module and also need to be accessible by background.js
// Consider a shared state or passing them explicitly if not using global scope.
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
        container.style.bottom = '10px'; 
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
        sliderHourDisplayEl.textContent = '-';

        sliderEl = document.createElement('input');
        sliderEl.id = 'dev-time-slider';
        sliderEl.type = 'range';
        sliderEl.min = '0';
        sliderEl.max = '100';
        sliderEl.value = '50';
        sliderEl.step = '1';
        sliderEl.style.width = '100%';
        sliderEl.style.background = 'rgba(255,255,255,0.7)';
        sliderEl.style.padding = '5px';
        sliderEl.style.boxSizing = 'border-box';
        sliderEl.style.borderRadius = '5px';

        container.appendChild(sliderHourDisplayEl);
        container.appendChild(sliderEl);
        document.body.appendChild(container);
    } else {
        sliderEl = null;
        sliderHourDisplayEl = null;
    }
}

function setupDevSliderEventListeners(grads, setHourFunction, updateSunFunction, updateSliderPositionFunction) {
    if (sliderEl) {
        sliderEl.addEventListener('input', e => {
            const targetValue = parseInt(e.target.value, 10);
            const h = Math.round(((grads.length - 1) * targetValue) / 100);
            manualHour = h;
            setHourFunction(h); 
            if (sliderHourDisplayEl) {
                sliderHourDisplayEl.textContent = `${h}:00`;
            }
        });
    }

    // Initial setup for background based on slider or current time
    updateSunFunction(); 

    // Update current hour's gradient every minute (if not in manual mode)
    setInterval(() => {
        if (manualHour === -1) { 
            const currentActualHour = new Date().getHours();
            setHourFunction(currentActualHour);
            if (updateSliderPositionFunction) {
                updateSliderPositionFunction(currentActualHour);
            }
        }
    }, 60_000);
    // Update sun times (and potentially adjust gradient logic based on it) every hour
    setInterval(updateSunFunction, 3_600_000);
}

// Call createDevelopmentSliderAndDisplay on script load if this file is included.
// The event listeners and intervals should be set up after the main script initializes `grads` and `setHour` from background.js.
// For now, we will call createDevelopmentSliderAndDisplay directly.
createDevelopmentSliderAndDisplay();

// Export manualHour, sliderEl, sliderHourDisplayEl, createDevelopmentSliderAndDisplay, setupDevSliderEventListeners
// if using modules. For now, they will be global. 