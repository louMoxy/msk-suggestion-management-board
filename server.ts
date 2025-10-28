const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../build')));

app.get('/data', (req: any, res: any) => {
  try {
    const mockDataPath = path.join(__dirname, 'mockData.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    
    res.json(mockData);
  } catch (error) {
    console.error('Error reading mock data:', error);
    res.status(500).json({ error: 'Failed to load mock data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
