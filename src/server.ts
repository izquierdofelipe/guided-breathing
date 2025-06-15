import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;

// JSON parsing middleware
app.use(express.json());

// Path to accountability data file
const ACCOUNTABILITY_FILE = path.join(__dirname, '../data/accountability.json');

// Interface for accountability data
interface DayPeriods {
  morning: boolean;   // before 11 AM
  midday: boolean;    // 11 AM - 5 PM
  evening: boolean;   // after 5 PM
}

interface AccountabilityData {
  Andre: DayPeriods;
  Felipe: DayPeriods;
}

// Function to determine time period based on current hour
function getTimePeriod(hour: number): keyof DayPeriods {
  if (hour < 11) return 'morning';      // 0-10: morning
  if (hour < 17) return 'midday';       // 11-16: midday  
  return 'evening';                     // 17-23: evening
}

// Ensure data directory and file exist
function ensureAccountabilityFile(): AccountabilityData {
  try {
    const dataDir = path.dirname(ACCOUNTABILITY_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(ACCOUNTABILITY_FILE)) {
      const initialData: AccountabilityData = { 
        Andre: { morning: false, midday: false, evening: false },
        Felipe: { morning: false, midday: false, evening: false }
      };
      fs.writeFileSync(ACCOUNTABILITY_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const data = fs.readFileSync(ACCOUNTABILITY_FILE, 'utf8');
    return JSON.parse(data) as AccountabilityData;
  } catch (error) {
    console.error('Error with accountability file:', error);
    return { 
      Andre: { morning: false, midday: false, evening: false },
      Felipe: { morning: false, midday: false, evening: false }
    };
  }
}

// Redirect HTTP to HTTPS only when behind a proxy (Heroku)
app.use((req, res, next) => {
  if (
    req.headers['x-forwarded-proto'] &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Record a completion for a specific user
app.post('/api/complete/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  
  if (name !== 'Andre' && name !== 'Felipe') {
    return res.status(400).json({ success: false, message: 'Invalid name' });
  }

  try {
    const data = ensureAccountabilityFile();
    
    // Get time period from client request (user's local time) or fallback to server time
    let timePeriod: keyof DayPeriods;
    let hourForLogging: number;
    
    if (req.body && req.body.timePeriod && req.body.localHour !== undefined) {
      // Use client-provided time period (based on user's local time)
      timePeriod = req.body.timePeriod;
      hourForLogging = req.body.localHour;
    } else {
      // Fallback to server time (should rarely happen now)
      const currentHour = new Date().getHours();
      timePeriod = getTimePeriod(currentHour);
      hourForLogging = currentHour;
    }

    // Mark the appropriate time period as completed
    data[name as keyof AccountabilityData][timePeriod] = true;
    
    fs.writeFileSync(ACCOUNTABILITY_FILE, JSON.stringify(data, null, 2));
    console.log(`${name} completed a breathing session during ${timePeriod} period (hour: ${hourForLogging})`);
    
    res.json({ 
      success: true, 
      timePeriod: timePeriod,
      localHour: hourForLogging,
      data: data[name as keyof AccountabilityData]
    });
  } catch (error) {
    console.error('Error recording completion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API endpoint to get current stats
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const data = ensureAccountabilityFile();
    res.json(data);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// API endpoint to reset daily counts (called by Heroku Scheduler)
app.post('/api/reset-daily', (req: Request, res: Response) => {
  try {
    const resetData: AccountabilityData = { 
      Andre: { morning: false, midday: false, evening: false },
      Felipe: { morning: false, midday: false, evening: false }
    };
    
    // Write the reset data to the file
    fs.writeFileSync(ACCOUNTABILITY_FILE, JSON.stringify(resetData, null, 2));
    
    console.log('Daily accountability periods reset for both Andre and Felipe');
    res.json({ 
      success: true, 
      message: 'Daily periods reset successfully',
      data: resetData 
    });
  } catch (error) {
    console.error('Error resetting daily periods:', error);
    res.status(500).json({ error: 'Failed to reset daily periods' });
  }
});

// Health check endpoint (optional)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// All other routes should serve the index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 