import { useMemo, useState, useEffect } from 'react';
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
  Box
} from '@mui/material';
import {
  SortOrder,
  SortableColumn,
  getLevelDisplay,
  getAlternatingRowStyle
} from '../utils/tableUtils';

interface EmployeesTableProps {
}

export const EmployeesTable = ({ }: EmployeesTableProps) => {
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

    const [sortBy, setSortBy] = useState<SortableColumn>(getInitialSortBy());
    const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialSortOrder());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }, [sortBy, sortOrder]);
    
    const { data: employeesData, pagination, isLoading, error, isError } = useEmployeeSuggestion({
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

    const handleSort = (column: SortableColumn) => {
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

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (isError) {
        return <div>Error: {error?.message}</div>;
    }

    if (!employeesData) {
        return <div>No employees data</div>;
    }
  
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{padding: '0 !important'}}>
          <TableContainer>
            <MuiTable>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'name'}
                      direction={sortBy === 'name' ? sortOrder : SortOrder.Asc}
                      onClick={() => handleSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'department'}
                      direction={sortBy === 'department' ? sortOrder : SortOrder.Asc}
                      onClick={() => handleSort('department')}
                    >
                      Department
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'riskLevel'}
                      direction={sortBy === 'riskLevel' ? sortOrder : SortOrder.Asc}
                      onClick={() => handleSort('riskLevel')}
                    >
                      Risk Level
                    </TableSortLabel>
                  </TableCell>
              <TableCell>Suggestions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeesData.map((employee: Employee, index: number) => (
                  <TableRow
                    key={employee.id}
                    sx={getAlternatingRowStyle(index)}
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
        </CardContent>
      </Card>
    </Box>
  );
}

