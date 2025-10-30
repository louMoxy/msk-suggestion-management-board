import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useEmployeeSuggestion from '../Hooks/useEmployeeSuggestion';
import useSuggestions from '../Hooks/useSuggestions';
import type { Employee } from '../Types/employee';
import type { Suggestion, SuggestionStatus } from '../Types/suggestions';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TableFooter,
  TablePagination,
  Card,
  CardContent,
  TableContainer,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Paper,
  Checkbox,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Chip, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Card as MuiCard } from '@mui/material';
import { Tabs, Tab } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmployeeSidebar from './EmployeeSidebar';
import SuggestionsKanban from './SuggestionsKanban';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import {
  SortOrder,
  SortableSuggestionColumn,
  formatDate,
  getAlternatingRowStyle
} from '../utils/tableUtils';
import { getStatusChipProps, getPriorityChipProps } from '../utils/tableUtils';
import ErrorHandler from './ErrorHandler';
import { AppView } from '../Types/appView';


type ViewMode = 'table' | 'kanban';

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue'
};

const STATUS_ORDER: SuggestionStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];
const VALID_SORT_COLUMNS: SortableSuggestionColumn[] = ['type', 'status', 'priority', 'dateCreated', 'dateUpdated'];
const DEFAULT_SORT_BY: SortableSuggestionColumn = 'priority';
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_ROWS_PER_PAGE = 10;
const ALL_SUGGESTIONS_LIMIT = 1000;

function getInitialSortBy(): SortableSuggestionColumn {
  if (typeof window === 'undefined') return DEFAULT_SORT_BY;
  const params = new URLSearchParams(window.location.search);
  const sortBy = params.get('sortBy');
  return VALID_SORT_COLUMNS.includes(sortBy as SortableSuggestionColumn)
    ? (sortBy as SortableSuggestionColumn)
    : DEFAULT_SORT_BY;
}

function getInitialSortOrder(): SortOrder {
  if (typeof window === 'undefined') return SortOrder.Asc;
  const params = new URLSearchParams(window.location.search);
  const sortOrder = params.get('sortOrder');
  return sortOrder === SortOrder.Asc || sortOrder === SortOrder.Desc
    ? (sortOrder as SortOrder)
    : SortOrder.Asc;
}

function updateUrlParams(
  sortBy: SortableSuggestionColumn,
  sortOrder: SortOrder,
  filters?: { status?: string; priority?: string; type?: string; employeeId?: string }
): void {
  const params = new URLSearchParams(window.location.search);
  
  if (sortBy !== DEFAULT_SORT_BY) {
    params.set('sortBy', sortBy);
  } else {
    params.delete('sortBy');
  }
  
  if (sortOrder !== SortOrder.Asc) {
    params.set('sortOrder', sortOrder);
  } else {
    params.delete('sortOrder');
  }
  if (filters) {
    if (filters.status) params.set('status', filters.status); else params.delete('status');
    if (filters.priority) params.set('priority', filters.priority); else params.delete('priority');
    if (filters.type) params.set('type', filters.type); else params.delete('type');
    if (filters.employeeId) params.set('employeeId', filters.employeeId); else params.delete('employeeId');
  }
  
  const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history.replaceState({}, '', newUrl);
}

export const SuggestionsTable = ({ appView, onChangeAppView }: { appView: AppView; onChangeAppView: (_e: React.SyntheticEvent, v: AppView | null) => void; }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortableSuggestionColumn>(getInitialSortBy());
  const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialSortOrder());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Suggestion> | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status?: string; priority?: string; type?: string; employeeId?: string }>(() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      status: params.get('status') || undefined,
      priority: params.get('priority') || undefined,
      type: params.get('type') || undefined,
      employeeId: params.get('employeeId') || undefined,
    };
  });
  const [columnMenu, setColumnMenu] = useState<{ anchorEl: HTMLElement | null; column: string | null }>({ anchorEl: null, column: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [createData, setCreateData] = useState<Partial<Suggestion>>({
    description: '',
    type: 'equipment',
    status: 'pending',
    priority: 'medium',
  });
  const [createMode, setCreateMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [employeeDrawerOpen, setEmployeeDrawerOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [bulkEditData, setBulkEditData] = useState<Partial<Suggestion>>({});
  const [expandedDrawerSuggestionIds, setExpandedDrawerSuggestionIds] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();

  useEffect(() => {
    updateUrlParams(sortBy, sortOrder, filters);
  }, [sortBy, sortOrder, filters]);

  const { data: suggestionsData, pagination, isLoading, error, isError } = useSuggestions({
    sortBy,
    sortOrder,
    page: page + 1,
    limit: rowsPerPage,
    status: filters.status,
    priority: filters.priority,
    type: filters.type,
    employeeId: filters.employeeId
  });

  const { data: allSuggestionsData } = useSuggestions({
    limit: ALL_SUGGESTIONS_LIMIT,
    status: filters.status,
    priority: filters.priority,
    type: filters.type,
    employeeId: filters.employeeId
  });

  const { data: employeesData } = useEmployeeSuggestion({
    limit: ALL_SUGGESTIONS_LIMIT
  });

  const employeeMap = useMemo(() => {
    if (!employeesData) return {};
    const map: Record<string, Employee> = {};
    employeesData.forEach(emp => {
      map[emp.id] = emp;
    });
    return map;
  }, [employeesData]);

  const groupedByStatus = useMemo(() => {
    const grouped: Record<SuggestionStatus, Suggestion[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      overdue: []
    };
    
    if (allSuggestionsData) {
      allSuggestionsData.forEach(suggestion => {
        grouped[suggestion.status].push(suggestion);
      });
    }
    
    return grouped;
  }, [allSuggestionsData]);

  const employeeIdToSuggestions = useMemo(() => {
    const map: Record<string, Suggestion[]> = {};
    (allSuggestionsData || []).forEach(s => {
      if (!map[s.employeeId]) map[s.employeeId] = [];
      map[s.employeeId].push(s);
    });
    return map;
  }, [allSuggestionsData]);

  const openEmployeeDrawer = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setEmployeeDrawerOpen(true);
  };

  const closeEmployeeDrawer = () => {
    setEmployeeDrawerOpen(false);
    setSelectedEmployeeId(null);
  };

  const isColumnFiltered = (column: string) => {
    switch (column) {
      case 'type':
        return Boolean(filters.type);
      case 'status':
        return Boolean(filters.status);
      case 'priority':
        return Boolean(filters.priority);
      case 'employeeId':
        return Boolean(filters.employeeId);
      default:
        return false;
    }
  };

  const activeFilterChips = useMemo(() => {
    const chips: { key: keyof typeof filters; label: string }[] = [];
    if (filters.type) chips.push({ key: 'type', label: `Type: ${filters.type}` });
    if (filters.status) chips.push({ key: 'status', label: `Status: ${filters.status}` });
    if (filters.priority) chips.push({ key: 'priority', label: `Priority: ${filters.priority}` });
    if (filters.employeeId) chips.push({ key: 'employeeId', label: `Employee: ${employeeMap[filters.employeeId]?.name || filters.employeeId}` });
    return chips;
  }, [filters, employeeMap]);

  const handleSort = (column: SortableSuggestionColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc);
    } else {
      setSortBy(column);
      setSortOrder(SortOrder.Asc);
    }
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!suggestionsData) return;
    
    if (event.target.checked) {
      const allVisibleIds = new Set(suggestionsData.map(s => s.id));
      setSelectedRows(allVisibleIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (suggestionId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedRows(newSelected);
  };

  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Suggestion> }) => {
      const response = await fetch(`http://localhost:3001/suggestions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update suggestion');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      setEditingRowId(null);
      setEditingData(null);
      setSnackbar({
        open: true,
        message: 'Suggestion updated successfully',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update suggestion',
        severity: 'error'
      });
    },
  });

  const deleteSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`http://localhost:3001/suggestions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete suggestion');
      }
      return true;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      setSelectedRows(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (editingRowId === id) {
        setEditingRowId(null);
        setEditingData(null);
      }
      setConfirmDeleteOpen(false);
      setConfirmDeleteId(null);
      setSnackbar({
        open: true,
        message: 'Suggestion deleted successfully',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      setConfirmDeleteOpen(false);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete suggestion',
        severity: 'error'
      });
    },
  });

  const createSuggestionMutation = useMutation({
    mutationFn: async (data: Partial<Suggestion>) => {
      const payload = {
        description: data.description,
        type: data.type,
        status: data.status,
        priority: data.priority,
        employeeId: data.employeeId,
      } as Record<string, unknown>;
      const response = await fetch('http://localhost:3001/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create suggestion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      setCreateOpen(false);
      setCreateData({ description: '', type: 'equipment', status: 'pending', priority: 'medium' });
      setSnackbar({ open: true, message: 'Suggestion created successfully', severity: 'success' });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create suggestion', severity: 'error' });
    },
  });

  const bulkUpdateSuggestionMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<Suggestion> }) => {
      const requests = ids.map(id =>
        fetch(`http://localhost:3001/suggestions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      );
      const responses = await Promise.all(requests);
      if (responses.some(r => !r.ok)) {
        throw new Error('Failed to update one or more suggestions');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      setSelectedRows(new Set());
      setBulkEditData({});
      setSnackbar({ open: true, message: 'Suggestions updated successfully', severity: 'success' });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: error.message || 'Bulk update failed', severity: 'error' });
    },
  });

  const requestDelete = (id: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      deleteSuggestionMutation.mutate(confirmDeleteId);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setConfirmDeleteId(null);
  };
  const closeColumnMenu = () => setColumnMenu({ anchorEl: null, column: null });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleEdit = (suggestion: Suggestion) => {
    if (editingRowId === suggestion.id) {
      if (editingData) {
        updateSuggestionMutation.mutate({
          id: suggestion.id,
          data: editingData,
        });
      }
    } else {
      setEditingRowId(suggestion.id);
      setEditingData({
        description: suggestion.description,
        type: suggestion.type,
        status: suggestion.status,
        priority: suggestion.priority,
      });
    }
  };

  const handleEditFieldChange = (field: keyof Suggestion, value: string) => {
    if (editingData) {
      setEditingData({
        ...editingData,
        [field]: value,
      });
    }
  };

  const handleMoveSuggestion = (id: string, status: SuggestionStatus) => {
    const suggestion = (allSuggestionsData || []).find(s => s.id === id);
    if (!suggestion || suggestion.status === status) return;
    updateSuggestionMutation.mutate({ id, data: { status } });
  };

  if (isLoading) {
    return <div>Loading suggestions...</div>;
  }
  
  if (isError) {
    return <ErrorHandler error={error} />;
  }

  if (!suggestionsData) {
    return <ErrorHandler error={new Error('No suggestions data')} />;
  }

  const isAllSelected = suggestionsData.length > 0 && suggestionsData.every(s => selectedRows.has(s.id));
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < suggestionsData.length;

  const renderKanbanView = () => (
    <SuggestionsKanban
      statusOrder={STATUS_ORDER}
      statusLabels={STATUS_LABELS}
      groupedByStatus={groupedByStatus}
      onMoveSuggestion={handleMoveSuggestion}
      isMobile={isMobile}
      onEditSuggestion={(suggestion) => {
        setCreateData({
          description: suggestion.description,
          type: suggestion.type,
          status: suggestion.status,
          priority: suggestion.priority,
          employeeId: suggestion.employeeId,
        });
        setCreateMode('edit');
        setEditingId(suggestion.id);
        setCreateOpen(true);
      }}
    />
  );

  const renderSortableHeader = (column: SortableSuggestionColumn, label: string) => (
    <TableCell key={column}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TableSortLabel
          active={sortBy === column}
          direction={sortBy === column ? sortOrder : SortOrder.Asc}
          onClick={() => handleSort(column)}
        >
          {label}
        </TableSortLabel>
        <IconButton
          size="small"
          aria-label={`${label} menu`}
          onClick={(e) => setColumnMenu({ anchorEl: e.currentTarget, column })}
          color={isColumnFiltered(column) ? 'primary' : undefined}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
    </TableCell>
  );

  const renderTableRow = (suggestion: Suggestion, index: number) => {
    const isEditing = editingRowId === suggestion.id;
    const displayData = isEditing && editingData ? editingData : suggestion;

    return (
      <TableRow key={suggestion.id} sx={getAlternatingRowStyle(index)}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selectedRows.has(suggestion.id)}
            onChange={() => handleSelectRow(suggestion.id)}
            disabled={isEditing}
          />
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              value={displayData.description || ''}
              onChange={(e) => handleEditFieldChange('description', e.target.value)}
              size="small"
              fullWidth
              variant="standard"
              multiline
              minRows={3}
            />
          ) : (
            suggestion.description
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Select
              value={displayData.type || ''}
              onChange={(e) => handleEditFieldChange('type', e.target.value)}
              size="small"
              fullWidth
              variant="standard"
            >
              <MenuItem value="equipment">equipment</MenuItem>
              <MenuItem value="exercise">exercise</MenuItem>
              <MenuItem value="behavioural">behavioural</MenuItem>
              <MenuItem value="lifestyle">lifestyle</MenuItem>
            </Select>
          ) : (
            suggestion.type
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Select
              value={displayData.status || ''}
              onChange={(e) => handleEditFieldChange('status', e.target.value)}
              size="small"
              fullWidth
              variant="standard"
            >
              <MenuItem value="pending">pending</MenuItem>
              <MenuItem value="in_progress">in_progress</MenuItem>
              <MenuItem value="completed">completed</MenuItem>
              <MenuItem value="overdue">overdue</MenuItem>
            </Select>
          ) : (
            <Chip size="small" {...getStatusChipProps(suggestion.status)} />
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Select
              value={displayData.priority || ''}
              onChange={(e) => handleEditFieldChange('priority', e.target.value)}
              size="small"
              fullWidth
              variant="standard"
            >
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="medium">medium</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </Select>
          ) : (
            <Chip size="small" {...getPriorityChipProps(suggestion.priority)} />
          )}
        </TableCell>
        <TableCell>
          <Button
            size="small"
            color="primary"
            startIcon={<PersonOutlineIcon fontSize="small" />}
            onClick={() => openEmployeeDrawer(suggestion.employeeId)}
          >
            {employeeMap[suggestion.employeeId]?.name || 'Unknown'}
          </Button>
        </TableCell>
        <TableCell>{formatDate(suggestion.dateCreated)}</TableCell>
        <TableCell>{formatDate(suggestion.dateUpdated)}</TableCell>
        <TableCell>
          {isEditing ? (
            <>
              <IconButton
                size="small"
                onClick={() => handleEdit(suggestion)}
                aria-label="save suggestion"
                disabled={updateSuggestionMutation.isPending}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setEditingRowId(null);
                  setEditingData(null);
                }}
                aria-label="reset changes"
                disabled={updateSuggestionMutation.isPending}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={() => handleEdit(suggestion)}
                aria-label="edit suggestion"
                disabled={updateSuggestionMutation.isPending}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => requestDelete(suggestion.id)}
                aria-label="delete suggestion"
                disabled={updateSuggestionMutation.isPending || deleteSuggestionMutation.isPending}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderRowCard = (suggestion: Suggestion, index: number) => {
    const isEditing = editingRowId === suggestion.id;
    const displayData = isEditing && editingData ? editingData : suggestion;
    return (
      <MuiCard key={suggestion.id} sx={{ mb: 1, p: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Checkbox
            checked={selectedRows.has(suggestion.id)}
            onChange={() => handleSelectRow(suggestion.id)}
            disabled={isEditing}
            sx={{ mt: 0.5 }}
          />
          <Box sx={{ flex: 1 }}>
            {isEditing ? (
              <TextField
                value={displayData.description || ''}
                onChange={(e) => handleEditFieldChange('description', e.target.value)}
                size="small"
                fullWidth
                variant="standard"
                multiline
                minRows={3}
              />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{suggestion.description}</Typography>
            )}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">{suggestion.type}</Typography>
              <Chip size="small" {...getStatusChipProps(suggestion.status)} />
              <Chip size="small" {...getPriorityChipProps(suggestion.priority)} />
              <Typography variant="caption" color="text.secondary">{employeeMap[suggestion.employeeId]?.name || 'Unknown'}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDate(suggestion.dateCreated)}</Typography>
            </Stack>
          </Box>
          <Box>
            {isEditing ? (
              <IconButton size="small" onClick={() => handleEdit(suggestion)} aria-label="save" disabled={updateSuggestionMutation.isPending}>
                <SaveIcon fontSize="small" />
              </IconButton>
            ) : (
              <IconButton size="small" onClick={() => handleEdit(suggestion)} aria-label="edit" disabled={updateSuggestionMutation.isPending}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {!isEditing && (
              <IconButton size="small" onClick={() => requestDelete(suggestion.id)} aria-label="delete" disabled={updateSuggestionMutation.isPending || deleteSuggestionMutation.isPending}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </MuiCard>
    );
  };

  const renderTableView = () => (
    <>
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={pagination?.total ?? 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
      {isMobile ? (
        <Box sx={{ px: 2, py: 1 }}>
          {suggestionsData.map(renderRowCard)}
        </Box>
      ) : (
      <TableContainer sx={{ maxHeight: '70vh' }}>
        <MuiTable stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>Description</TableCell>
            {renderSortableHeader('type', 'Type')}
            {renderSortableHeader('status', 'Status')}
            {renderSortableHeader('priority', 'Priority')}
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Employee
                <IconButton
                  size="small"
                  aria-label={`Employee menu`}
                  onClick={(e) => setColumnMenu({ anchorEl: e.currentTarget, column: 'employeeId' })}
                  color={isColumnFiltered('employeeId') ? 'primary' : undefined}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            </TableCell>
            {renderSortableHeader('dateCreated', 'Date Created')}
            {renderSortableHeader('dateUpdated', 'Date Updated')}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suggestionsData.map(renderTableRow)}
        </TableBody>
        </MuiTable>
      </TableContainer>
      )}
    </>
  );

  return (
    <Card>
      {/* Override the default padding of the CardContent */}
      <CardContent sx={{ padding: '0 !important' }}> 
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tabs value={appView} onChange={onChangeAppView} sx={{ minHeight: 40 }}>
                <Tab value="suggestions" icon={<LightbulbIcon />} iconPosition="start" label="Suggestions" />
                <Tab value="employees" icon={<PeopleAltIcon />} iconPosition="start" label="Employees" />
              </Tabs>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                >
                  <ToggleButton value="table" aria-label="table view">
                    <TableChartIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="kanban" aria-label="kanban view">
                    <ViewKanbanIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => { setCreateMode('create'); setEditingId(null); setCreateOpen(true); }}>
                Add suggestion
              </Button>
            </Box>

          </Box>
        </Box>
        {activeFilterChips.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {activeFilterChips.map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  size="small"
                  onDelete={() => setFilters(prev => ({ ...prev, [key]: undefined }))}
                  color="primary"
                  variant="outlined"
                />)
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" onClick={() => setFilters({})}>Clear all</Button>
            </Stack>
          </Box>
        )}
        {selectedRows.size > 0 && (
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.default' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {selectedRows.size} selected
              </Typography>
              <Select
                value={(bulkEditData.type as string) || ''}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, type: (e.target.value || undefined) as any }))}
                size="small"
                displayEmpty
                sx={{ minWidth: 140 }}
              >
                <MenuItem value=""><em>Type</em></MenuItem>
                <MenuItem value="equipment">equipment</MenuItem>
                <MenuItem value="exercise">exercise</MenuItem>
                <MenuItem value="behavioural">behavioural</MenuItem>
                <MenuItem value="lifestyle">lifestyle</MenuItem>
              </Select>
              <Select
                value={(bulkEditData.status as string) || ''}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, status: (e.target.value || undefined) as any }))}
                size="small"
                displayEmpty
                sx={{ minWidth: 140 }}
              >
                <MenuItem value=""><em>Status</em></MenuItem>
                <MenuItem value="pending">pending</MenuItem>
                <MenuItem value="in_progress">in_progress</MenuItem>
                <MenuItem value="completed">completed</MenuItem>
                <MenuItem value="overdue">overdue</MenuItem>
              </Select>
              <Select
                value={(bulkEditData.priority as string) || ''}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, priority: (e.target.value || undefined) as any }))}
                size="small"
                displayEmpty
                sx={{ minWidth: 140 }}
              >
                <MenuItem value=""><em>Priority</em></MenuItem>
                <MenuItem value="low">low</MenuItem>
                <MenuItem value="medium">medium</MenuItem>
                <MenuItem value="high">high</MenuItem>
              </Select>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  const data: Partial<Suggestion> = {};
                  if (bulkEditData.type) data.type = bulkEditData.type;
                  if (bulkEditData.status) data.status = bulkEditData.status;
                  if (bulkEditData.priority) data.priority = bulkEditData.priority;
                  const ids = Array.from(selectedRows);
                  if (Object.keys(data).length > 0 && ids.length > 0) {
                    bulkUpdateSuggestionMutation.mutate({ ids, data });
                  }
                }}
                disabled={bulkUpdateSuggestionMutation.isPending || (Object.keys(bulkEditData).length === 0)}
              >
                Apply to {selectedRows.size}
              </Button>
              <Button
                size="small"
                onClick={() => setBulkEditData({})}
                disabled={bulkUpdateSuggestionMutation.isPending}
              >
                Reset
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedRows(new Set())}
                disabled={bulkUpdateSuggestionMutation.isPending}
              >
                Clear selection
              </Button>
            </Stack>
          </Box>
        )}
        {viewMode === 'kanban' && (
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={filters.type || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, type: (e.target.value || undefined) as any }))}
              displayEmpty
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=""><em>All types</em></MenuItem>
              <MenuItem value="equipment">equipment</MenuItem>
              <MenuItem value="exercise">exercise</MenuItem>
              <MenuItem value="behavioural">behavioural</MenuItem>
              <MenuItem value="lifestyle">lifestyle</MenuItem>
            </Select>
            <Select
              value={filters.employeeId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, employeeId: (e.target.value || undefined) as any }))}
              displayEmpty
              size="small"
              sx={{ minWidth: 220 }}
            >
              <MenuItem value=""><em>All employees</em></MenuItem>
              {(employeesData || []).map(emp => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </Select>
          </Box>
        )}
        {viewMode === 'table' ? renderTableView() : renderKanbanView()}
      </CardContent>
      <Menu
        anchorEl={columnMenu.anchorEl}
        open={Boolean(columnMenu.anchorEl)}
        onClose={closeColumnMenu}
      >
        {/* Sorting items for sortable columns */}
        {(['type', 'status', 'priority', 'dateCreated', 'dateUpdated'] as string[]).includes(columnMenu.column || '') && (
          <>
            <MenuItem onClick={() => { if (columnMenu.column) handleSort(columnMenu.column as SortableSuggestionColumn); setColumnMenu({ anchorEl: null, column: null }); }}>
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sort ascending</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { if (columnMenu.column) { setSortBy(columnMenu.column as SortableSuggestionColumn); setSortOrder(SortOrder.Desc); setPage(0); } setColumnMenu({ anchorEl: null, column: null }); }}>
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sort descending</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}

        {/* Filter controls per column */}
        {columnMenu.column === 'type' && (
          <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterListIcon fontSize="small" />
              <Typography variant="body2">Filter by type</Typography>
            </Box>
            <Select
              value={filters.type || ''}
              onChange={(e) => { setFilters(prev => ({ ...prev, type: e.target.value || undefined })); closeColumnMenu(); }}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="equipment">equipment</MenuItem>
              <MenuItem value="exercise">exercise</MenuItem>
              <MenuItem value="behavioural">behavioural</MenuItem>
              <MenuItem value="lifestyle">lifestyle</MenuItem>
            </Select>
          </Box>
        )}

        {columnMenu.column === 'status' && (
          <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterListIcon fontSize="small" />
              <Typography variant="body2">Filter by status</Typography>
            </Box>
            <Select
              value={filters.status || ''}
              onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value || undefined })); closeColumnMenu(); }}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="pending">pending</MenuItem>
              <MenuItem value="in_progress">in_progress</MenuItem>
              <MenuItem value="completed">completed</MenuItem>
              <MenuItem value="overdue">overdue</MenuItem>
            </Select>
          </Box>
        )}

        {columnMenu.column === 'priority' && (
          <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterListIcon fontSize="small" />
              <Typography variant="body2">Filter by priority</Typography>
            </Box>
            <Select
              value={filters.priority || ''}
              onChange={(e) => { setFilters(prev => ({ ...prev, priority: e.target.value || undefined })); closeColumnMenu(); }}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="medium">medium</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </Select>
          </Box>
        )}

        {columnMenu.column === 'employeeId' && (
          <Box sx={{ px: 2, py: 1, minWidth: 240 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterListIcon fontSize="small" />
              <Typography variant="body2">Filter by employee</Typography>
            </Box>
            <Select
              value={filters.employeeId || ''}
              onChange={(e) => { setFilters(prev => ({ ...prev, employeeId: e.target.value || undefined })); closeColumnMenu(); }}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {(employeesData || []).map(emp => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </Select>
          </Box>
        )}
      </Menu>
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
      >
        <DialogTitle id="confirm-delete-title">Delete suggestion?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-description">
            This action cannot be undone. Are you sure you want to delete this suggestion?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={deleteSuggestionMutation.isPending}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={deleteSuggestionMutation.isPending} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} aria-labelledby="create-suggestion-title">
        <DialogTitle id="create-suggestion-title">{createMode === 'create' ? 'Add suggestion' : 'Edit suggestion'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 360 }}>
            <TextField
              label="Description"
              value={createData.description || ''}
              onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              size="small"
              autoFocus
            />
            <Select
              value={createData.type || ''}
              onChange={(e) => setCreateData(prev => ({ ...prev, type: e.target.value as any }))}
              fullWidth size="small" displayEmpty
            >
              <MenuItem value="equipment">equipment</MenuItem>
              <MenuItem value="exercise">exercise</MenuItem>
              <MenuItem value="behavioural">behavioural</MenuItem>
              <MenuItem value="lifestyle">lifestyle</MenuItem>
            </Select>
            <Select
              value={createData.status || ''}
              onChange={(e) => setCreateData(prev => ({ ...prev, status: e.target.value as any }))}
              fullWidth size="small" displayEmpty
            >
              <MenuItem value="pending">pending</MenuItem>
              <MenuItem value="in_progress">in_progress</MenuItem>
              <MenuItem value="completed">completed</MenuItem>
              <MenuItem value="overdue">overdue</MenuItem>
            </Select>
            <Select
              value={createData.priority || ''}
              onChange={(e) => setCreateData(prev => ({ ...prev, priority: e.target.value as any }))}
              fullWidth size="small" displayEmpty
            >
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="medium">medium</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </Select>
            <Select
              value={(createData.employeeId as string) || ''}
              onChange={(e) => setCreateData(prev => ({ ...prev, employeeId: e.target.value as any }))}
              fullWidth size="small" displayEmpty
            >
              <MenuItem value=""><em>Select employee</em></MenuItem>
              {(employeesData || []).map(emp => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createSuggestionMutation.isPending || updateSuggestionMutation.isPending}>Cancel</Button>
          {createMode === 'create' ? (
            <Button
              variant="contained"
              onClick={() => createSuggestionMutation.mutate(createData)}
              disabled={createSuggestionMutation.isPending || !createData.description || !createData.employeeId}
            >
              Save
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => { if (editingId) updateSuggestionMutation.mutate({ id: editingId, data: createData }); }}
              disabled={updateSuggestionMutation.isPending || !createData.description || !createData.employeeId}
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <EmployeeSidebar
        open={employeeDrawerOpen}
        onClose={closeEmployeeDrawer}
        employee={selectedEmployeeId ? employeeMap[selectedEmployeeId] : null}
        suggestions={selectedEmployeeId ? (employeeIdToSuggestions[selectedEmployeeId] || []) : []}
        onAddSuggestionForEmployee={(employeeId) => {
          setCreateData(prev => ({
            description: '',
            type: prev.type || 'equipment',
            status: prev.status || 'pending',
            priority: prev.priority || 'medium',
            employeeId,
          }));
          setCreateMode('create');
          setEditingId(null);
          setCreateOpen(true);
        }}
        onEditSuggestion={(suggestion) => {
          setCreateData({
            description: suggestion.description,
            type: suggestion.type,
            status: suggestion.status,
            priority: suggestion.priority,
            employeeId: suggestion.employeeId,
          });
          setCreateMode('edit');
          setEditingId(suggestion.id);
          setCreateOpen(true);
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};
