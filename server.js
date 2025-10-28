const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../build')));

// Mock data endpoint
app.get('/data', (req, res) => {
  try {
    // Read mock data from JSON file
    const mockDataPath = path.join(__dirname, 'mockData.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    
    res.json(mockData);
  } catch (error) {
    console.error('Error reading mock data:', error);
    res.status(500).json({ error: 'Failed to load mock data' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Note: Catch-all route removed for now - focus on API endpoints

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /data - Mock data endpoint`);
  console.log(`  GET /health - Health check`);
});
