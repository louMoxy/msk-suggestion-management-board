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
}

export default function SuggestionsKanban({ statusOrder, statusLabels, groupedByStatus, onMoveSuggestion, onEditSuggestion }: SuggestionsKanbanProps) {
  const [dragOverStatus, setDragOverStatus] = useState<SuggestionStatus | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
      expandable
      expanded={expandedIds.has(suggestion.id)}
      onToggleExpand={() => toggleExpand(suggestion.id)}
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
          minWidth: 300,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: dragOverStatus === status ? 2 : 1,
          borderColor: dragOverStatus === status ? 'primary.main' : 'divider',
          borderRadius: 1,
          transition: 'border-color 120ms ease'
        }}
        onDragOver={handleColumnDragOver(status)}
        onDragLeave={handleColumnDragLeave(status)}
        onDrop={handleColumnDrop(status)}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          {statusLabels[status]} ({suggestions.length})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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

  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 2 }}>
      {statusOrder.map(renderKanbanColumn)}
    </Box>
  );
}


