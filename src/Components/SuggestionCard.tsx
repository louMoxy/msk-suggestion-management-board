import React from 'react';
import { Box, Typography, IconButton, Card, CardContent, Tooltip, Chip, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import { getLevelDisplay, formatDate, getPriorityChipProps } from '../utils/tableUtils';
import type { Suggestion } from '../Types/suggestions';

interface SuggestionCardProps {
  suggestion: Suggestion;
  variant?: 'list' | 'kanban';
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  showEdit?: boolean;
  onEdit?: (suggestion: Suggestion) => void;
}

export default function SuggestionCard({
  suggestion,
  variant = 'list',
  expandable = false,
  expanded = false,
  onToggleExpand,
  draggable = false,
  onDragStart,
  showEdit = false,
  onEdit,
}: SuggestionCardProps) {
  const content = (
    <Box sx={{ border: variant === 'list' ? 1 : 0, borderColor: 'divider', borderRadius: 1, p: variant === 'list' ? 1 : 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500 }}
          noWrap={expandable ? !expanded : false}
          title={suggestion.description}
        >
          {suggestion.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {showEdit && (
            <Tooltip title="Edit suggestion">
              <IconButton size="small" onClick={() => onEdit?.(suggestion)} aria-label="edit suggestion">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {expandable && onToggleExpand && (
            <IconButton size="small" onClick={() => onToggleExpand?.(suggestion.id)} aria-label={expanded ? 'collapse description' : 'expand description'}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>
      </Box>
      {expandable && expanded && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
          {suggestion.description}
        </Typography>
      )}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
        <Chip size="small" {...getPriorityChipProps(suggestion.priority)} />
        <Typography variant="caption" color="text.secondary">{formatDate(suggestion.dateCreated)}</Typography>
      </Stack>
    </Box>
  );

  if (variant === 'kanban') {
    return (
      <Card sx={{ mb: 1, cursor: draggable ? 'grab' : 'default', bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }} draggable={draggable} onDragStart={(e) => onDragStart?.(e, suggestion.id)}>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}


