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

