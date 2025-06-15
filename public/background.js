// public/background.js

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
    const hourToShow = Math.min(Math.max(Math.round(h), 0), 23);
    if (hourToShow === curHour && !(sliderEl && manualHour !== -1)) {
        return;
    }
    curHour = hourToShow;
    const gradIndex = Math.min(Math.max(hourToShow, 0), grads.length - 1);
    document.body.style.background = toCSS(grads[gradIndex]);
    
    // Update ultra-conservative stars based on time (8 PM - 4 AM)
    if (window.starsModule) {
        window.starsModule.updateStars(hourToShow);
    }
}

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
        const times = SunCalc.getTimes(now, lat, lng);
        const currentActualHour = now.getHours();
        if (manualHour !== -1) {
            setHour(manualHour);
        } else {
            setHour(currentActualHour);
            updateSliderPosition(currentActualHour);
        }
    } catch (error) {
        console.error("Error in updateSun:", error);
        const fallbackHour = new Date().getHours();
        if (manualHour !== -1) {
            setHour(manualHour);
        } else {
            setHour(fallbackHour);
            updateSliderPosition(fallbackHour);
        }
    }
}

// Variables used by background.js that might need to be passed or made available globally:
// - sliderEl
// - sliderHourDisplayEl
// - manualHour (consider managing its state within background.js or passing it)

// Initialization and event listeners will be handled in script.js or a main controller module.

// ---------- Dynamic Background Logic End ---------------------- 