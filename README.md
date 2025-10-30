## MSK Suggestion Management Board - Technical Task

A React + MUI app for managing employee suggestions in table and kanban views. Uses a simple mock API server for data.

### Prerequisites
- Node 18+
- npm 9+

### Install
```
npm install
```

### Start the app (frontend + mock server)
Run both services concurrently in a single command:
```
npm run dev
```
This starts the mock API on `http://localhost:3001` and the React app on `http://localhost:3000`.

### Build
```
npm run build
```

### Notes on the mock server
- Location: `mockdata/server.js` with seed data in `mockdata/mockData.json`.
- Endpoints (selected):
  - `GET /suggestions` with pagination and query params (e.g. `status`, `type`, `employeeId`, `sortBy`, `sortOrder`, `page`, `limit`).
  - `PATCH /suggestions/:id` to update a suggestion.
  - `DELETE /suggestions/:id` to remove a suggestion.
  - `POST /suggestions` to create a suggestion.
- This is intended for local development only; no persistence beyond edits to the JSON file.

