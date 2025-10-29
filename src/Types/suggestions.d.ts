export type SuggestionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type SuggestionPriority = 'low' | 'medium' | 'high';
export type SuggestionType = 'equipment' | 'exercise' | 'behavioural' | 'lifestyle';
export type SuggestionSource = 'vida' | 'admin';

export interface Suggestion {
  id: string;
  employeeId: string;
  type: SuggestionType;
  description: string;
  status: SuggestionStatus;
  priority: SuggestionPriority;
  source: SuggestionSource;
  dateCreated: string;
  dateUpdated: string;
  notes: string;
  dateCompleted?: string;
  createdBy?: string;
}