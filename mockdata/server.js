const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../build')));

function loadMockData() {
  const mockDataPath = path.join(__dirname, 'mockData.json');
  return JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
}

function saveMockData(data) {
  const mockDataPath = path.join(__dirname, 'mockData.json');
  fs.writeFileSync(mockDataPath, JSON.stringify(data, null, 2), 'utf8');
}

function filterEmployees(employees, filters) {
  return employees.filter((employee) => {
    if (filters.department && employee.department !== filters.department) {
      return false;
    }
    if (filters.riskLevel && employee.riskLevel !== filters.riskLevel) {
      return false;
    }
    return true;
  });
}

function filterSuggestions(suggestions, filters) {
  return suggestions.filter((suggestion) => {
    if (filters.status && suggestion.status !== filters.status) {
      return false;
    }
    if (filters.priority && suggestion.priority !== filters.priority) {
      return false;
    }
    if (filters.type && suggestion.type !== filters.type) {
      return false;
    }
    if (filters.source && suggestion.source !== filters.source) {
      return false;
    }
    if (filters.employeeId && suggestion.employeeId !== filters.employeeId) {
      return false;
    }
    return true;
  });
}

function sortArray(array, sortBy, sortOrder = 'asc') {
  if (!sortBy) return array;
  
  const sorted = [...array].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'riskLevel') {
      const riskLevelOrder = { high: 0, medium: 1, low: 2 };
      aVal = riskLevelOrder[aVal?.toLowerCase()] ?? 999;
      bVal = riskLevelOrder[bVal?.toLowerCase()] ?? 999;
    }
    else if (sortBy.includes('date') && typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

function paginateArray(array, page, limit) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || null;
  
  if (!limitNum) {
    return {
      data: array,
      pagination: {
        page: pageNum,
        limit: array.length,
        total: array.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      }
    };
  }
  
  const total = array.length;
  const totalPages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedData = array.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: total,
      totalPages: totalPages,
      hasNext: pageNum < totalPages,
      hasPrevious: pageNum > 1
    }
  };
}

app.get('/employees', (req, res) => {
  try {
    const mockData = loadMockData();
    let employees = mockData.employees;
    
    const filters = {
      department: req.query.department,
      riskLevel: req.query.riskLevel,
    };
    employees = filterEmployees(employees, filters);
    
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder || 'asc';
    employees = sortArray(employees, sortBy, sortOrder);
    
    const page = req.query.page;
    const limit = req.query.limit;
    const result = paginateArray(employees, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error reading mock data:', error);
    res.status(500).json({ error: 'Failed to load employees data' });
  }
});

app.get('/suggestions', (req, res) => {
  try {
    const mockData = loadMockData();
    let suggestions = mockData.suggestions;
    
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      type: req.query.type,
      source: req.query.source,
      employeeId: req.query.employeeId,
    };
    suggestions = filterSuggestions(suggestions, filters);
    
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder || 'asc';
    suggestions = sortArray(suggestions, sortBy, sortOrder);
    
    const page = req.query.page;
    const limit = req.query.limit;
    const result = paginateArray(suggestions, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error reading mock data:', error);
    res.status(500).json({ error: 'Failed to load suggestions data' });
  }
});

app.get('/suggestions/:employeeId', (req, res) => {
  try {
    const mockData = loadMockData();
    const { employeeId } = req.params;
    let filteredSuggestions = mockData.suggestions.filter(
      (suggestion) => suggestion.employeeId === employeeId
    );
    
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      type: req.query.type,
      source: req.query.source,
    };
    filteredSuggestions = filterSuggestions(filteredSuggestions, filters);
    
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder || 'asc';
    filteredSuggestions = sortArray(filteredSuggestions, sortBy, sortOrder);
    
    const page = req.query.page;
    const limit = req.query.limit;
    const result = paginateArray(filteredSuggestions, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error reading mock data:', error);
    res.status(500).json({ error: 'Failed to load suggestions data' });
  }
});

app.post('/suggestions', (req, res) => {
  try {
    const mockData = loadMockData();
    const newSuggestion = req.body;
    
    if (!newSuggestion.employeeId || !newSuggestion.type || !newSuggestion.description) {
      return res.status(400).json({ error: 'Missing required fields: employeeId, type, description' });
    }
    
    const newId = Date.now().toString();
    const now = new Date().toISOString();
    
    const suggestion = {
      id: newId,
      employeeId: newSuggestion.employeeId,
      type: newSuggestion.type,
      description: newSuggestion.description,
      status: newSuggestion.status || 'pending',
      priority: newSuggestion.priority || 'low',
      source: newSuggestion.source || 'admin',
      dateCreated: newSuggestion.dateCreated || now,
      dateUpdated: now,
      notes: newSuggestion.notes || '',
      ...(newSuggestion.dateCompleted && { dateCompleted: newSuggestion.dateCompleted }),
      ...(newSuggestion.createdBy && { createdBy: newSuggestion.createdBy })
    };
    
    mockData.suggestions.push(suggestion);
    saveMockData(mockData);
    
    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

app.put('/suggestions/:id', (req, res) => {
  try {
    const mockData = loadMockData();
    const { id } = req.params;
    const updateData = req.body;
    
    const suggestionIndex = mockData.suggestions.findIndex(s => s.id === id);
    
    if (suggestionIndex === -1) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    const updatedSuggestion = {
      ...mockData.suggestions[suggestionIndex],
      ...updateData,
      id: mockData.suggestions[suggestionIndex].id,
      dateUpdated: new Date().toISOString()
    };
    
    mockData.suggestions[suggestionIndex] = updatedSuggestion;
    saveMockData(mockData);
    
    res.json(updatedSuggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

app.patch('/suggestions/:id', (req, res) => {
  try {
    const mockData = loadMockData();
    const { id } = req.params;
    const updateData = req.body;
    
    const suggestionIndex = mockData.suggestions.findIndex(s => s.id === id);
    
    if (suggestionIndex === -1) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    const updatedSuggestion = {
      ...mockData.suggestions[suggestionIndex],
      ...updateData,
      id: mockData.suggestions[suggestionIndex].id,
      dateUpdated: new Date().toISOString()
    };
    
    mockData.suggestions[suggestionIndex] = updatedSuggestion;
    saveMockData(mockData);
    
    res.json(updatedSuggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

app.delete('/suggestions/:id', (req, res) => {
  try {
    const mockData = loadMockData();
    const { id } = req.params;
    
    const suggestionIndex = mockData.suggestions.findIndex(s => s.id === id);
    
    if (suggestionIndex === -1) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    mockData.suggestions.splice(suggestionIndex, 1);
    saveMockData(mockData);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ error: 'Failed to delete suggestion' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
