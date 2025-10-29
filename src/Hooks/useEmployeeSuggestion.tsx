import { useQuery } from '@tanstack/react-query';
import { SortOrder } from '../utils/tableUtils';
import { Employee } from '../Types/employee';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

function getUrlParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    sortBy: params.get('sortBy') || undefined,
    sortOrder: ((): SortOrder | undefined => {
      const v = params.get('sortOrder');
      if (v === SortOrder.Asc || v === SortOrder.Desc) return v;
      return undefined;
    })(),
  };
}

async function fetchEmployees(options: { 
  sortBy?: string; 
  sortOrder?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value != null) {
        params.set(key, value.toString());
      }
    });
    
    const qs = params.toString();
    const url = `http://localhost:3001/employees${qs ? `?${qs}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  }

export default function useEmployeeSuggestion(options?: { 
  sortBy?: string; 
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}) {
  const urlParams = getUrlParams();
  const mergedOptions = {
    ...urlParams,
    ...options,
  };

  const { data, isLoading, error, isError } = useQuery<PaginatedResponse<Employee>, Error>({
    queryKey: ['employees', mergedOptions],
    queryFn: () => fetchEmployees(mergedOptions),
  });

  return {
    data: data?.data,
    pagination: data?.pagination,
    isLoading,
    error: error as Error,
    isError,
  };
}