export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}
export type SortableColumn = 'name' | 'department' | 'riskLevel';
export type SortableSuggestionColumn = 'description' | 'type' | 'status' | 'priority' | 'dateCreated' | 'dateUpdated';

export function getLevelDisplay(level: string): string {
  switch (level.toLowerCase()) {
    case 'high':
      return '🔴 High';
    case 'medium':
      return '🟡 Medium';
    case 'low':
      return '🟢 Low';
    default:
      return level;
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function getAlternatingRowStyle(index: number) {
  return {
    backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent'
  };
}

export function getStatusChipProps(status: string) {
  const key = status.toLowerCase();
  switch (key) {
    case 'pending':
      return { label: 'Pending', color: 'warning' as const };
    case 'in_progress':
      return { label: 'In Progress', color: 'info' as const };
    case 'completed':
      return { label: 'Completed', color: 'success' as const };
    case 'overdue':
      return { label: 'Overdue', color: 'error' as const };
    default:
      return { label: status, color: 'default' as const, variant: 'outlined' as const };
  }
}

export function getPriorityChipProps(priority: string) {
  const key = priority.toLowerCase();
  switch (key) {
    case 'high':
      return { label: 'High', color: 'error' as const };
    case 'medium':
      return { label: 'Medium', color: 'warning' as const };
    case 'low':
      return { label: 'Low', color: 'success' as const };
    default:
      return { label: priority, color: 'default' as const, variant: 'outlined' as const };
  }
}

