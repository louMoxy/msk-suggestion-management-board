import { useMemo, useState, useEffect } from 'react';
import useEmployeeSuggestion from '../Hooks/useEmployeeSuggestion';
import type { Employee } from '../Types/employee';
import useSuggestions from '../Hooks/useSuggestions';
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
  Paper
} from '@mui/material';
import {
  SortOrder,
  SortableSuggestionColumn,
  getLevelDisplay,
  formatDate,
  getAlternatingRowStyle
} from '../utils/tableUtils';
import ErrorHandler from './ErrorHandler';

type ViewMode = 'table' | 'kanban';

export const SuggestionsTable = () => {
    const getInitialSortBy = (): SortableSuggestionColumn => {
        if (typeof window === 'undefined') return 'priority';
        const params = new URLSearchParams(window.location.search);
        const sortBy = params.get('sortBy');
        const validColumns: SortableSuggestionColumn[] = ['type', 'status', 'priority', 'dateCreated', 'dateUpdated'];
        return validColumns.includes(sortBy as SortableSuggestionColumn) ? sortBy as SortableSuggestionColumn : 'priority';
    };

    const getInitialSortOrder = (): SortOrder => {
        if (typeof window === 'undefined') return SortOrder.Asc;
        const params = new URLSearchParams(window.location.search);
        const sortOrder = params.get('sortOrder');
        return (sortOrder === SortOrder.Asc || sortOrder === SortOrder.Desc)
          ? (sortOrder as SortOrder)
          : SortOrder.Asc;
    };

    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [sortBy, setSortBy] = useState<SortableSuggestionColumn>(getInitialSortBy());
    const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialSortOrder());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (sortBy !== 'priority') {
            params.set('sortBy', sortBy);
        } else {
            params.delete('sortBy');
        }
        if (sortOrder !== SortOrder.Asc) {
            params.set('sortOrder', sortOrder);
        } else {
            params.delete('sortOrder');
        }
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }, [sortBy, sortOrder]);
    
    const { data: suggestionsData, pagination, isLoading, error, isError } = useSuggestions({
        sortBy,
        sortOrder,
        page: page + 1,
        limit: rowsPerPage
    });

    const { data: allSuggestionsData } = useSuggestions({
        limit: 1000
    });

    const { data: employeesData } = useEmployeeSuggestion({
        limit: 1000
    });

    const employeeMap = useMemo(() => {
        const map: Record<string, Employee> = {};
        if (employeesData) {
            employeesData.forEach(emp => {
                map[emp.id] = emp;
            });
        }
        return map;
    }, [employeesData]);

    const groupedByStatus = useMemo(() => {
        if (!allSuggestionsData) {
            return {
                pending: [],
                in_progress: [],
                completed: [],
                overdue: []
            } as Record<SuggestionStatus, Suggestion[]>;
        }
        const grouped: Record<SuggestionStatus, Suggestion[]> = {
            pending: [],
            in_progress: [],
            completed: [],
            overdue: []
        };
        allSuggestionsData.forEach(suggestion => {
            grouped[suggestion.status].push(suggestion);
        });
        return grouped;
    }, [allSuggestionsData]);

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

    if (isLoading) {
        return <div>Loading suggestions...</div>;
    }
    if (isError) {
        return <ErrorHandler error={error} />;
    }

    if (!suggestionsData) {
        return <ErrorHandler error={new Error('No suggestions data')} />;
    }

    const renderKanbanView = () => {
        const statusLabels: Record<SuggestionStatus, string> = {
            pending: 'Pending',
            in_progress: 'In Progress',
            completed: 'Completed',
            overdue: 'Overdue'
        };

        const statusOrder: SuggestionStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

        return (
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 2 }}>
                {statusOrder.map((status) => (
                    <Box
                        key={status}
                        sx={{
                            minWidth: 300,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}
                    >
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            {statusLabels[status]} ({groupedByStatus[status]?.length || 0})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {groupedByStatus[status]?.map((suggestion) => (
                                <Card key={suggestion.id} sx={{ mb: 1 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {suggestion.description}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {getLevelDisplay(suggestion.priority)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Type: {suggestion.type}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Employee: {employeeMap[suggestion.employeeId]?.name || 'Unknown'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Created: {formatDate(suggestion.dateCreated)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                            {(!groupedByStatus[status] || groupedByStatus[status].length === 0) && (
                                <Paper sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                    No suggestions
                                </Paper>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>
        );
    };

    const renderTableView = () => (
        <TableContainer>
            <MuiTable>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            Description
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'type'}
                                direction={sortBy === 'type' ? sortOrder : SortOrder.Asc}
                                onClick={() => handleSort('type')}
                            >
                                Type
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'status'}
                                direction={sortBy === 'status' ? sortOrder : SortOrder.Asc}
                                onClick={() => handleSort('status')}
                            >
                                Status
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'priority'}
                                direction={sortBy === 'priority' ? sortOrder : SortOrder.Asc}
                                onClick={() => handleSort('priority')}
                            >
                                Priority
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Employee</TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'dateCreated'}
                                direction={sortBy === 'dateCreated' ? sortOrder : SortOrder.Asc}
                                onClick={() => handleSort('dateCreated')}
                            >
                                Date Created
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === 'dateUpdated'}
                                direction={sortBy === 'dateUpdated' ? sortOrder : SortOrder.Asc}
                                onClick={() => handleSort('dateUpdated')}
                            >
                                Date Updated
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {suggestionsData.map((suggestion: Suggestion, index: number) => (
                        <TableRow
                            key={suggestion.id}
                            sx={getAlternatingRowStyle(index)}
                        >
                            <TableCell>{suggestion.description}</TableCell>
                            <TableCell>{suggestion.type}</TableCell>
                            <TableCell>{suggestion.status}</TableCell>
                            <TableCell>{getLevelDisplay(suggestion.priority)}</TableCell>
                            <TableCell>{employeeMap[suggestion.employeeId]?.name || 'Unknown'}</TableCell>
                            <TableCell>{formatDate(suggestion.dateCreated)}</TableCell>
                            <TableCell>{formatDate(suggestion.dateUpdated)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            colSpan={7}
                            count={pagination?.total ?? 0}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </TableRow>
                </TableFooter>
            </MuiTable>
        </TableContainer>
    );

    return (
        <Card>
            <CardContent sx={{padding: '0 !important'}}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        aria-label="view mode"
                    >
                        <ToggleButton value="table" aria-label="table view">
                            Table
                        </ToggleButton>
                        <ToggleButton value="kanban" aria-label="kanban view">
                            Kanban
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                {viewMode === 'table' ? renderTableView() : renderKanbanView()}
            </CardContent>
        </Card>
    );
}

