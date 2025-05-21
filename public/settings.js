// public/settings.js

const APP_SETTINGS_KEY = 'breathingAppSettings';

// Default settings
const DEFAULT_INHALE_TIME = 4;
const DEFAULT_HOLD_TIME = 16;
const DEFAULT_EXHALE_TIME = 8;
const DEFAULT_TOTAL_CYCLES = 10;
const DEFAULT_AUDIO_ENABLED = true;

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

// Export functions and constants if using a module system, or ensure they are globally accessible
// For now, we'll assume global scope for simplicity until further refactoring. 