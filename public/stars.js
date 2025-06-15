// public/stars.js

// Star container and management
let starsContainer = null;
let starsVisible = false;

// Check if device can handle stars
function canHandleStars() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return true; // Desktop can handle it
    
    // Conservative check for mobile - disable on very small screens or low memory
    if (window.innerWidth < 400) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
    
    return true; // Allow for modern mobile devices
}

// Create stars container and stars
function createStars() {
    if (starsContainer) return; // Already created
    if (!canHandleStars()) {
        console.log('Stars disabled for device performance');
        return;
    }
    
    starsContainer = document.createElement('div');
    starsContainer.id = 'stars-container';
    starsContainer.className = 'stars-container';
    
    // Create multiple star layers for depth
    for (let layer = 0; layer < 3; layer++) {
        const starLayer = document.createElement('div');
        starLayer.className = `star-layer star-layer-${layer + 1}`;
        
        // Create stars for this layer - increased counts for better visibility
        const isMobile = window.innerWidth <= 768;
        const starCount = isMobile 
            ? (layer === 0 ? 20 : layer === 1 ? 12 : 8)   // 40 total on mobile
            : (layer === 0 ? 40 : layer === 1 ? 25 : 15); // 80 total on desktop
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            
            // Simplified star sizes for mobile performance
            const rand = Math.random();
            let starSize;
            if (isMobile) {
                // Mobile: Only use 2 sizes to reduce complexity
                starSize = rand < 0.7 ? 1 : 2;  // 70% tiny, 30% small
            } else {
                // Desktop: Full variety
                if (rand < 0.5) starSize = 1;       // 50% tiny stars
                else if (rand < 0.8) starSize = 2;  // 30% small stars  
                else if (rand < 0.95) starSize = 3; // 15% medium stars
                else starSize = 4;                  // 5% large bright stars
            }
            
            star.className = `star star-size-${starSize}`;
            
            // Random horizontal position
            star.style.left = Math.random() * 100 + '%';
            
            // Weighted vertical position - more stars in top half
            const rand1 = Math.random();
            const rand2 = Math.random();
            const biasedTop = Math.min(rand1, rand2) * 100; // Bias towards smaller values (top)
            star.style.top = biasedTop + '%';
            
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