import { Drawer, Avatar, Box, Typography, Divider, Button, Chip, Stack } from '@mui/material';
import type { Employee } from '../Types/employee';
import type { Suggestion } from '../Types/suggestions';
import SuggestionCard from './SuggestionCard';
import { getLevelDisplay } from '../utils/tableUtils';
import { useState, useMemo } from 'react';

interface EmployeeSidebarProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  suggestions: Suggestion[];
  onAddSuggestionForEmployee?: (employeeId: string) => void;
  onEditSuggestion?: (suggestion: Suggestion) => void;
}

export default function EmployeeSidebar({ open, onClose, employee, suggestions, onAddSuggestionForEmployee, onEditSuggestion }: EmployeeSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const recentSuggestions = useMemo(() => suggestions.slice(0, 5), [suggestions]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 360, p: 2 } }}>
      {employee && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar>
              {employee.name?.slice(0, 1) || '?'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                {employee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.department || '—'}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Stats</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip label={`Risk: ${getLevelDisplay(employee.riskLevel)}`} size="small" color="info" variant="outlined" />
              <Chip label={`Suggestions: ${suggestions.length}`} size="small" color="primary" variant="outlined" />
            </Stack>
          </Box>
          {onAddSuggestionForEmployee && (
            <>
              <Divider />
              <Box>
                <Button variant="contained" size="small" onClick={() => onAddSuggestionForEmployee(employee.id)}>
                  Add suggestion for this employee
                </Button>
              </Box>
            </>
          )}
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent suggestions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentSuggestions.length > 0 ? (
                recentSuggestions.map(suggestion => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    variant="list"
                    expandable
                    expanded={expandedIds.has(suggestion.id)}
                    onToggleExpand={() => toggleExpand(suggestion.id)}
                    showEdit={Boolean(onEditSuggestion)}
                    onEdit={onEditSuggestion}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No suggestions</Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}


