// public/stars.js

// Star container and management
let starsContainer = null;
let starsVisible = false;

// Check if device can handle stars
function canHandleStars() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return true; // Desktop can handle it
    
    // Less restrictive check for mobile - only disable on very old/weak devices
    if (window.innerWidth < 320) return false; // Only disable on very tiny screens
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) return false; // Only disable on very weak CPUs
    
    return true; // Allow for most mobile devices
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
        
        // Create stars for this layer - enhanced counts now that z-index is fixed
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480; // Additional size check
        let starCount;
        
        if (isSmallMobile) {
            // Very small screens - increased for better night sky
            starCount = layer === 0 ? 20 : layer === 1 ? 12 : 8; // 40 total (was 28)
        } else if (isMobile) {
            // Regular mobile screens - enhanced count
            starCount = layer === 0 ? 28 : layer === 1 ? 18 : 12; // 58 total (was 40)
        } else {
            // Desktop - beautiful full experience
            starCount = layer === 0 ? 50 : layer === 1 ? 35 : 25; // 110 total (was 80)
        }
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            
            // Enhanced star size distribution for more natural look
            const rand = Math.random();
            let starSize;
            if (isMobile) {
                // Mobile: 3 sizes for better variety while keeping performance
                if (rand < 0.6) starSize = 1;       // 60% tiny stars
                else if (rand < 0.85) starSize = 2; // 25% small stars
                else starSize = 3;                  // 15% medium stars
            } else {
                // Desktop: Full variety with enhanced distribution
                if (rand < 0.45) starSize = 1;      // 45% tiny stars
                else if (rand < 0.75) starSize = 2; // 30% small stars  
                else if (rand < 0.92) starSize = 3; // 17% medium stars
                else starSize = 4;                  // 8% large bright stars (increased from 5%)
            }
            
            star.className = `star star-size-${starSize}`;
            
            // Random horizontal position
            star.style.left = Math.random() * 100 + '%';
            
            // Weighted vertical position - more stars in top half
            const rand1 = Math.random();
            const rand2 = Math.random();
            const biasedTop = Math.min(rand1, rand2) * 100; // Bias towards smaller values (top)
            star.style.top = biasedTop + '%';
            
            // Enhanced animation delay with more variation
            const animationDelay = Math.random() * 6 + 's'; // Longer range for more variety
            star.style.animationDelay = animationDelay;
            
            // Add slight variation in animation duration for more organic feel
            const baseDuration = isMobile ? 5 : 4; // Mobile: 5s base, Desktop: 4s base
            const durationVariation = 0.5 + Math.random() * 2; // +0.5 to +2.5 seconds
            star.style.animationDuration = (baseDuration + durationVariation) + 's';
            
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
    
    // Check if stars were actually created (might be disabled for performance)
    if (!starsContainer) return;
    
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