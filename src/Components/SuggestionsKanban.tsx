import { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import SuggestionCard from './SuggestionCard';
import type { Suggestion, SuggestionStatus } from '../Types/suggestions';

interface SuggestionsKanbanProps {
  statusOrder: SuggestionStatus[];
  statusLabels: Record<SuggestionStatus, string>;
  groupedByStatus: Record<SuggestionStatus, Suggestion[]>;
  onMoveSuggestion: (id: string, status: SuggestionStatus) => void;
  onEditSuggestion?: (suggestion: Suggestion) => void;
  isMobile?: boolean;
}

export default function SuggestionsKanban({ statusOrder, statusLabels, groupedByStatus, onMoveSuggestion, onEditSuggestion, isMobile }: SuggestionsKanbanProps) {
  const [dragOverStatus, setDragOverStatus] = useState<SuggestionStatus | null>(null);
  const [activeStatus, setActiveStatus] = useState<SuggestionStatus>(statusOrder[0]);

  const handleCardDragStart = (suggestionId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', suggestionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (status: SuggestionStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) setDragOverStatus(status);
  };

  const handleColumnDragLeave = (status: SuggestionStatus) => () => {
    if (dragOverStatus === status) setDragOverStatus(null);
  };

  const handleColumnDrop = (status: SuggestionStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    const suggestionId = e.dataTransfer.getData('text/plain');
    setDragOverStatus(null);
    if (!suggestionId) return;
    onMoveSuggestion(suggestionId, status);
  };

  const renderKanbanCard = (suggestion: Suggestion) => (
    <SuggestionCard
      key={suggestion.id}
      suggestion={suggestion}
      variant="kanban"
      draggable
      onDragStart={(e) => handleCardDragStart(suggestion.id)(e)}
      expandable={false}
      showEdit={Boolean(onEditSuggestion)}
      onEdit={onEditSuggestion}
    />
  );

  const renderKanbanColumn = (status: SuggestionStatus) => {
    const suggestions = groupedByStatus[status] || [];
    const isEmpty = suggestions.length === 0;

    return (
      <Box
        key={status}
        sx={{
          minWidth: 340,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: dragOverStatus === status ? 2 : 1,
          borderColor: dragOverStatus === status ? 'primary.main' : 'divider',
          borderRadius: 1,
          transition: 'border-color 120ms ease',
          backgroundColor: 'rgba(90,119,223,0.06)'
        }}
        onDragOver={handleColumnDragOver(status)}
        onDragLeave={handleColumnDragLeave(status)}
        onDrop={handleColumnDrop(status)}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            px: 1.5,
            py: 1,
            mb: 1.5,
            backgroundColor: 'rgba(240,243,250,0.9)',
            backdropFilter: 'blur(2px)',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {statusLabels[status]} ({suggestions.length})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 1 }}>
          {isEmpty ? (
            <Paper sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              No suggestions
            </Paper>
          ) : (
            suggestions.map(renderKanbanCard)
          )}
        </Box>
      </Box>
    );
  };

  if (isMobile) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 1, display: 'flex', gap: 1, overflowX: 'auto' }}>
          {statusOrder.map(s => (
            <Box
              key={s}
              onClick={() => setActiveStatus(s)}
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                border: '1px solid',
                borderColor: activeStatus === s ? 'primary.main' : 'divider',
                backgroundColor: activeStatus === s ? 'rgba(90,119,223,0.12)' : 'background.paper',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {statusLabels[s]}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex' }}>
          {renderKanbanColumn(activeStatus)}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 2 }}>
      {statusOrder.map(renderKanbanColumn)}
    </Box>
  );
}


