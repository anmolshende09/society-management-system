import { EmployeeId, DateRange } from "@society/shared-kernel";

export interface EmployeeSummary {
  id: EmployeeId;
  name: string;
  department: string;
  designation: string;
  mobile: string;
  skills: string[];
  status: "active" | "on_leave" | "inactive";
}

export interface AssignableFilter {
  department?: string;
  skill?: string;
  onDutyOnly?: boolean;
}

export interface ShiftAssignment {
  employeeId: EmployeeId;
  shiftName: string;
  startTime: Date;
  endTime: Date;
  locationRef?: string;
}

export const EMPLOYEE_DIRECTORY_API_TOKEN = Symbol("EmployeeDirectoryApi");

export interface EmployeeDirectoryApi {
  getEmployee(employeeId: EmployeeId): Promise<EmployeeSummary | null>;
  listAssignable(filter: AssignableFilter): Promise<EmployeeSummary[]>;
  getShiftRoster(
    scope: { departmentId?: string; gateId?: string },
    window: DateRange,
  ): Promise<ShiftAssignment[]>;
  isOnDuty(employeeId: EmployeeId, at: Date): Promise<boolean>;
}
