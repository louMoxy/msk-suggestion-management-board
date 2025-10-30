import React from 'react';
import { Container, Box } from '@mui/material';
import './App.css';
import AppViewRouter from './Components/AppViewRouter';

function App(): React.JSX.Element {
  return (
    <Container maxWidth="xl">
      <Box>
        <AppViewRouter />
      </Box>
    </Container>
  );
}

export default App;
