import { useQuery } from '@tanstack/react-query';
import { SortOrder } from '../utils/tableUtils';
import type { Suggestion } from '../Types/suggestions';

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
    status: params.get('status') || undefined,
    priority: params.get('priority') || undefined,
    type: params.get('type') || undefined,
    employeeId: params.get('employeeId') || undefined,
  };
}

async function fetchSuggestions(options?: { 
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  type?: string;
  source?: string;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<PaginatedResponse<Suggestion>> {
  const params = new URLSearchParams();
  
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value != null) {
        params.set(key, value.toString());
      }
    });
  }
  
  const qs = params.toString();
  const url = `http://localhost:3001/suggestions${qs ? `?${qs}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }
  return response.json();
}

export default function useSuggestions(options?: { 
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  type?: string;
  source?: string;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}) {
  const urlParams = getUrlParams();
  const mergedOptions = {
    ...urlParams,
    ...options,
  };

  const { data, isLoading, error, isError } = useQuery<PaginatedResponse<Suggestion>, Error>({
    queryKey: ['suggestions', mergedOptions],
    queryFn: () => fetchSuggestions(mergedOptions),
  });

  return {
    data: data?.data,
    pagination: data?.pagination,
    isLoading,
    error: error as Error,
    isError,
  };
}


