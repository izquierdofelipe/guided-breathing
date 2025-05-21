// public/modal.js

// Elements that need to be available (passed or global):
// - settingsModal
// - modalOverlay
// - closeModalBtn
// - cycleCounterContainerElement

function openSettingsModal(settingsModal, modalOverlay) {
    if (settingsModal && modalOverlay) {
        settingsModal.classList.add('active');
        modalOverlay.classList.add('active');
    }
}

function closeSettingsModal(settingsModal, modalOverlay) {
    if (settingsModal && modalOverlay) {
        settingsModal.classList.remove('active');
        modalOverlay.classList.remove('active');
    }
}

function setupModalEventListeners(settingsModal, modalOverlay, closeModalBtn, cycleCounterContainerElement) {
    if (cycleCounterContainerElement) {
        cycleCounterContainerElement.addEventListener('click', () => openSettingsModal(settingsModal, modalOverlay));
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeSettingsModal(settingsModal, modalOverlay));
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeSettingsModal(settingsModal, modalOverlay);
            }
        });
    }
}

// Add any necessary exports if using a module system. 