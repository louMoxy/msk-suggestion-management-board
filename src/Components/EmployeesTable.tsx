import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useEmployeeSuggestion from '../Hooks/useEmployeeSuggestion';
import type { Employee } from '../Types/employee';
import useSuggestions from '../Hooks/useSuggestions';
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
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Select,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import EmployeeSidebar from './EmployeeSidebar';
import { Chip, Stack } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  SortOrder,
  SortableColumn,
  getLevelDisplay,
  getAlternatingRowStyle
} from '../utils/tableUtils';
import type { Suggestion } from '../Types/suggestions';
import ErrorHandler from './ErrorHandler';
import { Tabs, Tab } from '@mui/material';
import { AppView } from '../Types/appView';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

const getInitialSortBy = (): SortableColumn => {
  if (typeof window === 'undefined') return 'riskLevel';
  const params = new URLSearchParams(window.location.search);
  const sortBy = params.get('sortBy');
  return (sortBy === 'name' || sortBy === 'department' || sortBy === 'riskLevel') ? sortBy : 'riskLevel';
};

const getInitialSortOrder = (): SortOrder => {
  if (typeof window === 'undefined') return SortOrder.Asc;
  const params = new URLSearchParams(window.location.search);
  const sortOrder = params.get('sortOrder');
  return (sortOrder === SortOrder.Asc || sortOrder === SortOrder.Desc)
    ? (sortOrder as SortOrder)
    : SortOrder.Asc;
};

const getInitialFilters = (): { name?: string; department?: string; riskLevel?: string } => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
        name: params.get('name') || undefined,
        department: params.get('department') || undefined,
        riskLevel: params.get('riskLevel') || undefined,
    };
};

export const EmployeesTable = ({ appView = AppView.Employees, onChangeAppView }: { appView?: AppView; onChangeAppView?: (_e: React.SyntheticEvent, v: AppView | null) => void; }) => {
    const [sortBy, setSortBy] = useState<SortableColumn>(getInitialSortBy());
    const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialSortOrder());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filters, setFilters] = useState<{ name?: string; department?: string; riskLevel?: string }>(getInitialFilters());
    const [columnMenu, setColumnMenu] = useState<{ anchorEl: HTMLElement | null; column: string | null }>({ anchorEl: null, column: null });
    const [employeeDrawerOpen, setEmployeeDrawerOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createMode, setCreateMode] = useState<'create' | 'edit'>('create');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [createData, setCreateData] = useState<Partial<Suggestion>>({
        description: '',
        type: 'equipment',
        status: 'pending',
        priority: 'medium',
    });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const queryClient = useQueryClient();

    const createSuggestionMutation = useMutation({
        mutationFn: async (data: Partial<Suggestion>) => {
            const response = await fetch('http://localhost:3001/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create suggestion');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suggestions'] });
            setCreateOpen(false);
            setSnackbar({ open: true, message: 'Suggestion created successfully', severity: 'success' });
        },
        onError: (error: Error) => setSnackbar({ open: true, message: error.message || 'Failed to create suggestion', severity: 'error' }),
    });

    const updateSuggestionMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Suggestion> }) => {
            const response = await fetch(`http://localhost:3001/suggestions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update suggestion');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suggestions'] });
            setCreateOpen(false);
            setEditingId(null);
            setSnackbar({ open: true, message: 'Suggestion updated successfully', severity: 'success' });
        },
        onError: (error: Error) => setSnackbar({ open: true, message: error.message || 'Failed to update suggestion', severity: 'error' }),
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (sortBy !== 'riskLevel') {
            params.set('sortBy', sortBy);
        } else {
            params.delete('sortBy');
        }
        if (sortOrder !== SortOrder.Asc) {
            params.set('sortOrder', sortOrder);
        } else {
            params.delete('sortOrder');
        }
        if (filters.name) params.set('name', filters.name); else params.delete('name');
        if (filters.department) params.set('department', filters.department); else params.delete('department');
        if (filters.riskLevel) params.set('riskLevel', filters.riskLevel); else params.delete('riskLevel');
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }, [sortBy, sortOrder, filters]);
    
    const { data: employeesData, isLoading, error, isError } = useEmployeeSuggestion({
        sortBy,
        sortOrder,
        page: page + 1,
        limit: rowsPerPage
    });
    const { data: suggestionsData } = useSuggestions();

    const employeeIdToSuggestionCount = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!suggestionsData) return counts;
        for (const s of suggestionsData) {
            counts[s.employeeId] = (counts[s.employeeId] ?? 0) + 1;
        }
        return counts;
    }, [suggestionsData]);

    const employeeIdToSuggestions = useMemo(() => {
        const map: Record<string, { id: string; description: string; priority: number; dateCreated: string }> = {} as any;
        const grouped: Record<string, typeof map[]> = {} as any;
        (suggestionsData || []).forEach(s => {
            if (!grouped[s.employeeId]) grouped[s.employeeId] = [] as any;
            grouped[s.employeeId].push(s as any);
        });
        return grouped as Record<string, any[]>;
    }, [suggestionsData]);

    const openEmployeeDrawer = (employeeId: string) => {
        setSelectedEmployeeId(employeeId);
        setEmployeeDrawerOpen(true);
    };

    const closeEmployeeDrawer = () => {
        setEmployeeDrawerOpen(false);
        setSelectedEmployeeId(null);
    };

    const handleSort = (column: SortableColumn) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc);
        } else {
            setSortBy(column);
            setSortOrder(SortOrder.Asc);
        }
        setPage(0);
    };
    const isColumnFiltered = (column: string) => {
        switch (column) {
            case 'name': return Boolean(filters.name);
            case 'department': return Boolean(filters.department);
            case 'riskLevel': return Boolean(filters.riskLevel);
            default: return false;
        }
    };

    const closeColumnMenu = () => setColumnMenu({ anchorEl: null, column: null });

    const filteredEmployees = useMemo(() => {
        if (!employeesData) return [] as Employee[];
        const byName = (e: Employee) => !filters.name || e.name.toLowerCase().includes(filters.name.toLowerCase());
        const byDept = (e: Employee) => !filters.department || e.department === filters.department;
        const byRisk = (e: Employee) => !filters.riskLevel || getLevelDisplay(e.riskLevel) === filters.riskLevel;
        return employeesData.filter(e => byName(e) && byDept(e) && byRisk(e));
    }, [employeesData, filters]);

    useEffect(() => { setPage(0); }, [filters]);

    const departments = useMemo(() => {
        const set = new Set<string>();
        (employeesData || []).forEach(e => set.add(e.department));
        return Array.from(set).sort();
    }, [employeesData]);

    const riskLevels = ['low', 'medium', 'high'];

    const activeFilterChips = useMemo(() => {
        const chips: { key: keyof typeof filters; label: string }[] = [];
        if (filters.name) chips.push({ key: 'name', label: `Name: ${filters.name}` });
        if (filters.department) chips.push({ key: 'department', label: `Department: ${filters.department}` });
        if (filters.riskLevel) chips.push({ key: 'riskLevel', label: `Risk: ${filters.riskLevel}` });
        return chips;
    }, [filters]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (isError) {
        return <ErrorHandler error={error} />;
    }

    if (!employeesData) {
        return <ErrorHandler error={new Error('No employees data available')} />;
    }
  
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{padding: '0 !important'}}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs value={appView} onChange={onChangeAppView} sx={{ minHeight: 40 }}>
              <Tab value="suggestions" icon={<LightbulbIcon />} iconPosition="start" label="Suggestions" />
              <Tab value="employees" icon={<PeopleAltIcon />} iconPosition="start" label="Employees" />
            </Tabs>
          </Box>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <MuiTable stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? sortOrder : SortOrder.Asc}
                        onClick={() => handleSort('name')}
                      >
                        Name
                      </TableSortLabel>
                      <IconButton size="small" aria-label="Name menu" onClick={(e) => setColumnMenu({ anchorEl: e.currentTarget, column: 'name' })} color={isColumnFiltered('name') ? 'primary' : undefined}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TableSortLabel
                        active={sortBy === 'department'}
                        direction={sortBy === 'department' ? sortOrder : SortOrder.Asc}
                        onClick={() => handleSort('department')}
                      >
                        Department
                      </TableSortLabel>
                      <IconButton size="small" aria-label="Department menu" onClick={(e) => setColumnMenu({ anchorEl: e.currentTarget, column: 'department' })} color={isColumnFiltered('department') ? 'primary' : undefined}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TableSortLabel
                        active={sortBy === 'riskLevel'}
                        direction={sortBy === 'riskLevel' ? sortOrder : SortOrder.Asc}
                        onClick={() => handleSort('riskLevel')}
                      >
                        Risk Level
                      </TableSortLabel>
                      <IconButton size="small" aria-label="Risk menu" onClick={(e) => setColumnMenu({ anchorEl: e.currentTarget, column: 'riskLevel' })} color={isColumnFiltered('riskLevel') ? 'primary' : undefined}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
              <TableCell>Suggestions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((employee: Employee, index: number) => (
                  <TableRow
                    key={employee.id}
                    sx={{ ...getAlternatingRowStyle(index), cursor: 'pointer' }}
                    hover
                    onClick={() => openEmployeeDrawer(employee.id)}
                  >
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{getLevelDisplay(employee.riskLevel)}</TableCell>
                <TableCell>{employeeIdToSuggestionCount[employee.id] ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    colSpan={4}
                    count={filteredEmployees.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableRow>
              </TableFooter>
            </MuiTable>
          </TableContainer>
        </CardContent>
      </Card>
      <EmployeeSidebar
        open={employeeDrawerOpen}
        onClose={closeEmployeeDrawer}
        employee={selectedEmployeeId ? filteredEmployees.find(e => e.id === selectedEmployeeId) || null : null}
        suggestions={selectedEmployeeId ? (employeeIdToSuggestions[selectedEmployeeId] as any) || [] : []}
        onAddSuggestionForEmployee={(employeeId) => {
          setCreateMode('create');
          setEditingId(null);
          setCreateData(prev => ({
            description: '',
            type: prev.type || 'equipment',
            status: prev.status || 'pending',
            priority: prev.priority || 'medium',
            employeeId,
          }));
          setCreateOpen(true);
        }}
        onEditSuggestion={(suggestion) => {
          setCreateMode('edit');
          setEditingId(suggestion.id);
          setCreateData({
            description: suggestion.description,
            type: suggestion.type,
            status: suggestion.status,
            priority: suggestion.priority,
            employeeId: suggestion.employeeId,
          });
          setCreateOpen(true);
        }}
      />
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} aria-labelledby="employee-create-edit-title">
        <DialogTitle id="employee-create-edit-title">{createMode === 'create' ? 'Add suggestion' : 'Edit suggestion'}</DialogTitle>
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
            <Select value={(createData.type as string) || ''} onChange={(e) => setCreateData(prev => ({ ...prev, type: e.target.value as any }))} fullWidth size="small" displayEmpty>
              <MenuItem value="equipment">equipment</MenuItem>
              <MenuItem value="exercise">exercise</MenuItem>
              <MenuItem value="behavioural">behavioural</MenuItem>
              <MenuItem value="lifestyle">lifestyle</MenuItem>
            </Select>
            <Select value={(createData.status as string) || ''} onChange={(e) => setCreateData(prev => ({ ...prev, status: e.target.value as any }))} fullWidth size="small" displayEmpty>
              <MenuItem value="pending">pending</MenuItem>
              <MenuItem value="in_progress">in_progress</MenuItem>
              <MenuItem value="completed">completed</MenuItem>
              <MenuItem value="overdue">overdue</MenuItem>
            </Select>
            <Select value={(createData.priority as string) || ''} onChange={(e) => setCreateData(prev => ({ ...prev, priority: e.target.value as any }))} fullWidth size="small" displayEmpty>
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="medium">medium</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </Select>
            <Select value={(createData.employeeId as string) || ''} onChange={(e) => setCreateData(prev => ({ ...prev, employeeId: e.target.value as any }))} fullWidth size="small" displayEmpty>
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
            <Button variant="contained" onClick={() => createSuggestionMutation.mutate(createData)} disabled={createSuggestionMutation.isPending || !createData.description || !createData.employeeId}>Save</Button>
          ) : (
            <Button variant="contained" onClick={() => { if (editingId) updateSuggestionMutation.mutate({ id: editingId, data: createData }); }} disabled={updateSuggestionMutation.isPending || !createData.description || !createData.employeeId}>Save</Button>
          )}
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {activeFilterChips.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {activeFilterChips.map(({ key, label }) => (
              <Chip key={key} label={label} size="small" onDelete={() => setFilters(prev => ({ ...prev, [key]: undefined }))} color="primary" variant="outlined" />
            ))}
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" onClick={() => setFilters({})}>Clear all</Button>
          </Stack>
        </Box>
      )}

      <Menu anchorEl={columnMenu.anchorEl} open={Boolean(columnMenu.anchorEl)} onClose={closeColumnMenu}>
        {(['name', 'department', 'riskLevel'] as string[]).includes(columnMenu.column || '') && (
          <>
            <MenuItem onClick={() => { if (columnMenu.column) { handleSort(columnMenu.column as SortableColumn); } closeColumnMenu(); }}>
              <ListItemIcon><ArrowUpwardIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Sort ascending</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { if (columnMenu.column) { setSortBy(columnMenu.column as SortableColumn); setSortOrder(SortOrder.Desc); setPage(0); } closeColumnMenu(); }}>
              <ListItemIcon><ArrowDownwardIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Sort descending</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}

        {columnMenu.column === 'name' && (
          <Box sx={{ px: 2, py: 1, minWidth: 240 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterListIcon fontSize="small" />
              <span>Name contains</span>
            </Box>
            <TextField
              value={filters.name || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value || undefined }))}
              size="small"
              fullWidth
              placeholder="Search name"
              onKeyDown={(e) => { if (e.key === 'Enter') closeColumnMenu(); }}
            />
          </Box>
        )}

        {columnMenu.column === 'department' && (
          <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterListIcon fontSize="small" />
              <span>Filter by department</span>
            </Box>
            <Select
              value={filters.department || ''}
              onChange={(e) => { setFilters(prev => ({ ...prev, department: e.target.value || undefined })); closeColumnMenu(); }}
              displayEmpty fullWidth size="small"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {departments.map(dep => <MenuItem key={dep} value={dep}>{dep}</MenuItem>)}
            </Select>
          </Box>
        )}

        {columnMenu.column === 'riskLevel' && (
          <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterListIcon fontSize="small" />
              <span>Filter by risk</span>
            </Box>
            <Select
              value={filters.riskLevel || ''}
              onChange={(e) => { setFilters(prev => ({ ...prev, riskLevel: e.target.value || undefined })); closeColumnMenu(); }}
              displayEmpty fullWidth size="small"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {riskLevels.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </Box>
        )}
      </Menu>
    </Box>
  );
}

