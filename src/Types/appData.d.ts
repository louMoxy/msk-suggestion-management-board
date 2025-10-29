import type { Employee } from './employee';
import type { Suggestion } from './suggestions';

export interface AppData {
  employees: Employee[];
  suggestions: Suggestion[];
}