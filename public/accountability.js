// public/accountability.js

// Get the current page name from the URL path
function getCurrentPageName() {
    const path = window.location.pathname;
    if (path === '/Andre' || path === '/andre') return 'Andre';
    if (path === '/Felipe' || path === '/felipe') return 'Felipe';
    return null; // Main page or other pages
}

// Check if we're on an accountability page
function isAccountabilityPage() {
    return getCurrentPageName() !== null;
}

// Function to determine time period based on user's local hour (same logic as server but using local time)
function getTimePeriod(hour) {
    if (hour < 11) return 'morning';      // 0-10: morning
    if (hour < 17) return 'midday';       // 11-16: midday  
    return 'evening';                     // 17-23: evening
}

// Record a completion for the current user
async function recordCompletion() {
    const pageName = getCurrentPageName();
    if (!pageName) return;
    
    try {
        // Get user's local time (same approach as gradient system)
        const now = new Date();
        const currentLocalHour = now.getHours();
        const timePeriod = getTimePeriod(currentLocalHour);
        
        const response = await fetch(`/api/complete/${pageName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timePeriod: timePeriod,
                localHour: currentLocalHour
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`Completion recorded for ${pageName} during ${result.timePeriod} period (local hour: ${result.localHour})`);
            // Update the accountability table with fresh data
            await updateAccountabilityTable();
        } else {
            console.error('Failed to record completion:', response.statusText);
        }
    } catch (error) {
        console.error('Error recording completion:', error);
    }
}

// Fetch current accountability stats
async function fetchAccountabilityStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Failed to fetch stats:', response.statusText);
            return { 
                Andre: { morning: false, midday: false, evening: false },
                Felipe: { morning: false, midday: false, evening: false }
            };
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { 
            Andre: { morning: false, midday: false, evening: false },
            Felipe: { morning: false, midday: false, evening: false }
        };
    }
}

// Create and display the accountability table
async function createAccountabilityTable() {
    if (!isAccountabilityPage()) return;
    
    const stats = await fetchAccountabilityStats();
    const currentPage = getCurrentPageName();
    
    // Helper function to show simple checkmark only when completed
    const getStatusSymbol = (completed) => completed ? '✓' : '';
    
    // Create the minimalist table container
    const tableContainer = document.createElement('div');
    tableContainer.id = 'accountability-container';
    tableContainer.innerHTML = `
        <div class="accountability-section">
            <table class="accountability-table">
                <thead>
                    <tr>
                        <th></th>
                        <th><img src="images/morning.png" alt="Morning" class="period-icon"></th>
                        <th><img src="images/midday.png" alt="Midday" class="period-icon"></th>
                        <th><img src="images/evening.png" alt="Evening" class="period-icon"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="${currentPage === 'Andre' ? 'current-user' : ''}">
                        <td class="name-cell">Andre</td>
                        <td class="period-cell">${getStatusSymbol(stats.Andre?.morning)}</td>
                        <td class="period-cell">${getStatusSymbol(stats.Andre?.midday)}</td>
                        <td class="period-cell">${getStatusSymbol(stats.Andre?.evening)}</td>
                    </tr>
                    <tr class="${currentPage === 'Felipe' ? 'current-user' : ''}">
                        <td class="name-cell">Felipe</td>
                        <td class="period-cell">${getStatusSymbol(stats.Felipe?.morning)}</td>
                        <td class="period-cell">${getStatusSymbol(stats.Felipe?.midday)}</td>
                        <td class="period-cell">${getStatusSymbol(stats.Felipe?.evening)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Add the table to the page
    document.body.appendChild(tableContainer);
}

// Update the accountability table with fresh data
async function updateAccountabilityTable() {
    if (!isAccountabilityPage()) return;
    
    const stats = await fetchAccountabilityStats();
    
    // Helper function to show simple checkmark only when completed
    const getStatusSymbol = (completed) => completed ? '✓' : '';
    
    // Update Andre's row
    const andreRow = document.querySelector('.accountability-table tbody tr:first-child');
    if (andreRow) {
        const andreCells = andreRow.querySelectorAll('.period-cell');
        if (andreCells.length >= 3) {
            andreCells[0].textContent = getStatusSymbol(stats.Andre?.morning);
            andreCells[1].textContent = getStatusSymbol(stats.Andre?.midday);
            andreCells[2].textContent = getStatusSymbol(stats.Andre?.evening);
        }
    }
    
    // Update Felipe's row
    const felipeRow = document.querySelector('.accountability-table tbody tr:last-child');
    if (felipeRow) {
        const felipeCells = felipeRow.querySelectorAll('.period-cell');
        if (felipeCells.length >= 3) {
            felipeCells[0].textContent = getStatusSymbol(stats.Felipe?.morning);
            felipeCells[1].textContent = getStatusSymbol(stats.Felipe?.midday);
            felipeCells[2].textContent = getStatusSymbol(stats.Felipe?.evening);
        }
    }
}

// Initialize accountability features
function initializeAccountability() {
    if (isAccountabilityPage()) {
        console.log(`Accountability page detected: ${getCurrentPageName()}`);
        createAccountabilityTable();
    }
}

// Export functions for use in main script
window.accountabilityModule = {
    isAccountabilityPage,
    getCurrentPageName,
    recordCompletion,
    updateAccountabilityTable,
    initializeAccountability
}; 