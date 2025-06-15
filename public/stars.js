// public/stars.js

// Star container and management
let starsContainer = null;
let starsVisible = false;

// Create stars container and stars
function createStars() {
    if (starsContainer) return; // Already created
    
    starsContainer = document.createElement('div');
    starsContainer.id = 'stars-container';
    starsContainer.className = 'stars-container';
    
    // Create multiple star layers for depth
    for (let layer = 0; layer < 3; layer++) {
        const starLayer = document.createElement('div');
        starLayer.className = `star-layer star-layer-${layer + 1}`;
        
        // Create stars for this layer
        const starCount = layer === 0 ? 50 : layer === 1 ? 30 : 20; // Different densities
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = `star star-size-${Math.floor(Math.random() * 3) + 1}`;
            
            // Random position
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            
            // Random animation delay for twinkling
            star.style.animationDelay = Math.random() * 4 + 's';
            
            starLayer.appendChild(star);
        }
        
        starsContainer.appendChild(starLayer);
    }
    
    // Add to body
    document.body.appendChild(starsContainer);
}

// Show stars with fade in
function showStars() {
    if (!starsContainer) createStars();
    
    if (!starsVisible) {
        starsVisible = true;
        starsContainer.style.opacity = '1';
        console.log('Stars appearing for nighttime...');
    }
}

// Hide stars with fade out
function hideStars() {
    if (starsContainer && starsVisible) {
        starsVisible = false;
        starsContainer.style.opacity = '0';
        console.log('Stars fading away for daytime...');
    }
}

// Check if current time should show stars (8 PM - 4 AM)
function shouldShowStars(hour) {
    return hour >= 20 || hour <= 4;
}

// Update stars based on current hour
function updateStars(hour) {
    if (shouldShowStars(hour)) {
        showStars();
    } else {
        hideStars();
    }
}

// Initialize stars system
function initializeStars() {
    createStars();
    
    // Initial check
    const currentHour = new Date().getHours();
    updateStars(currentHour);
    
    console.log('Stars system initialized');
}

// Export for use in other scripts
window.starsModule = {
    updateStars,
    initializeStars,
    shouldShowStars
}; 