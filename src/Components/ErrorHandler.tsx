import { Alert, Container } from "@mui/material";

import { Box } from "@mui/material";

interface ErrorHandlerProps {
  error: Error;
}

export default function ErrorHandler({ error }: ErrorHandlerProps) {
  return (
    // TODO: Style this component
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'An error occurred while fetching data'}
        </Alert>
      </Box>
    </Container>
  );
}