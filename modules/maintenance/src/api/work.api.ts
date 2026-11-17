import { TaskId } from "@society/shared-kernel";

export type TaskSource =
  | "manual"
  | "complaint"
  | "asset"
  | "amc"
  | "preventive"
  | "inspection"
  | "meeting"
  | "hr"
  | "security"
  | "vendor"
  | "inventory"
  | "procurement"
  | "amenity";

export type TaskPriority = "Low" | "Normal" | "High" | "Urgent" | "Critical";

export interface LocationRef {
  propertyNodeId?: string;
  unitId?: string;
  description?: string;
}

export interface TaskSummary {
  id: TaskId;
  title: string;
  priority: TaskPriority;
  status: string;
  assignedTo?: string;
  dueAt?: Date;
}

export interface CreateTaskCommand {
  source: TaskSource;
  title: string;
  priority: TaskPriority;
  location: LocationRef;
  linkedEntities?: { type: string; id: string }[];
  dueAt?: Date;
  idempotencyKey: string;
}

export const WORK_API_TOKEN = Symbol("WorkApi");

export interface WorkApi {
  createTask(req: CreateTaskCommand): Promise<TaskId>;
  getTaskSummary(taskId: TaskId): Promise<TaskSummary | null>;
}
