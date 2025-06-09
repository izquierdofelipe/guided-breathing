import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

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