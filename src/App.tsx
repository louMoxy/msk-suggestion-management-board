import React, { useState } from 'react';
import { Container, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import './App.css';
import {EmployeesTable} from './Components/EmployeesTable';
import {SuggestionsTable} from './Components/SuggestionsTable';

type ViewType = 'employees' | 'suggestions';

function App(): React.JSX.Element {
  const [view, setView] = useState<ViewType>('suggestions');

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewType | null,
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="table view"
        >
          <ToggleButton value="suggestions" aria-label="suggestions view">
            Suggestions
          </ToggleButton>
          <ToggleButton value="employees" aria-label="employees view">
            Employees
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box>
        {view === 'employees' && <EmployeesTable />}
        {view === 'suggestions' && <SuggestionsTable />}
      </Box>
    </Container>
  );
}

export default App;
