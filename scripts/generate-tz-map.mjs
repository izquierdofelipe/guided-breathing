import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname }      from 'node:path';
import { fileURLToPath }         from 'node:url';

const URL = 'https://data.iana.org/time-zones/data/zone1970.tab';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'tz-latlng.json');

// isLatitude: boolean to indicate if parsing latitude (true) or longitude (false)
function dmsToDec(str, isLatitude) {
  const sign = str[0] === '-' ? -1 : 1;
  let deg, min, sec = 0;
  let offset = 1; // Starting index after sign

  if (isLatitude) {
    // Latitude: DD or DDMM or DDMMSS (e.g., +43, +4339, +433900)
    deg = +str.slice(offset, offset + 2);
    offset += 2;
    if (str.length >= offset + 2) { // Check if minutes exist (string has at least sign+DD+MM)
      min = +str.slice(offset, offset + 2);
      offset += 2;
      if (str.length >= offset + 2) { // Check if seconds exist (string has at least sign+DD+MM+SS)
        sec = +str.slice(offset, offset + 2);
      } else {
        sec = 0; // Case: sign+DDMM (e.g., +4339)
      }
    } else {
      min = 0; // Case: sign+DD only (e.g., +43)
      sec = 0;
    }
  } else {
    // Longitude: DDD or DDDMM or DDDMMSS (e.g., -079, -07923, -0792300)
    deg = +str.slice(offset, offset + 3);
    offset += 3;
    if (str.length >= offset + 2) { // Check if minutes exist (string has at least sign+DDD+MM)
      min = +str.slice(offset, offset + 2);
      offset += 2;
      if (str.length >= offset + 2) { // Check if seconds exist (string has at least sign+DDD+MM+SS)
        sec = +str.slice(offset, offset + 2);
      } else {
        sec = 0; // Case: sign+DDDMM (e.g., -07923)
      }
    } else {
      min = 0; // Case: sign+DDD only (e.g., -079)
      sec = 0;
    }
  }
  
  if (min >= 60 || sec >= 60) {
    // Optional: Add warning for invalid min/sec values, though robust slicing should prevent this from bad data.
    // console.warn(`Invalid minutes or seconds in DMS string: ${str}. Min: ${min}, Sec: ${sec}. TZID: ${currentTzidForWarning}`);
  }

  return sign * (deg + min / 60 + sec / 3600);
}

async function main() {
    console.log('Fetching timezone data from:', URL);
    const raw = await fetch(URL).then(r => r.text());
    console.log('Successfully fetched raw timezone data.');
    let currentTzidForWarning = null; // For logging within dmsToDec if needed

    const map = Object.fromEntries(
      raw
        .split('\n')
        .filter(l => l && l[0] !== '#')
        .map(l => {
          const parts = l.split('\t');
          if (parts.length < 3) {
            return null; 
          }
          const coordsInput = parts[1];
          const tzid = parts[2];
          currentTzidForWarning = tzid; // Set for potential use in dmsToDec warnings

          let lonSignIndex = -1;
          for (let i = 1; i < coordsInput.length; i++) {
            if (coordsInput[i] === '+' || coordsInput[i] === '-') {
              lonSignIndex = i;
              break;
            }
          }

          if (lonSignIndex === -1 || lonSignIndex === 0) {
            console.warn(`Could not reliably split lat/lon from coords: '${coordsInput}' for TZID: ${tzid}, line: ${l}`);
            return null;
          }

          const latStr = coordsInput.slice(0, lonSignIndex);
          const lonStr = coordsInput.slice(lonSignIndex);
          
          try {
            const lat = dmsToDec(latStr, true);  // true for latitude
            const lon = dmsToDec(lonStr, false); // false for longitude
            // Basic validation for typical coordinate ranges
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
              console.warn(`Parsed coordinates out of typical range for TZID ${tzid}: Lat ${lat}, Lon ${lon}. Original: ${coordsInput}`);
              // return null; // Optionally filter out these entries
            }
            return [tzid, [lat, lon]];
          } catch (e) {
            console.warn(`Error parsing DMS for TZID ${tzid}, lat: '${latStr}' or lon: '${lonStr}' from line ${l}:`, e.message);
            return null;
          }
        })
        .filter(entry => entry !== null)
    );
    currentTzidForWarning = null; // Clear after use

    await writeFile(OUT, JSON.stringify(map, null, 2));
    console.log('Wrote', OUT, 'with', Object.keys(map).length, 'entries');
}

main().catch(err => {
    console.error("Error generating timezone map:", err);
    process.exit(1);
}); 