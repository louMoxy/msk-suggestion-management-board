export interface Employee {
    id: string;
    name: string;
    department: string;
    riskLevel: EmployeeRiskLevel;
  }
  export type EmployeeRiskLevel = 'low' | 'medium' | 'high';