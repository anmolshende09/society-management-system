import { NotificationId } from "@society/shared-kernel";

export type Channel = "push" | "sms" | "whatsapp" | "email" | "in_app";

export interface RecipientRef {
  userId?: string;
  mobile?: string;
  email?: string;
  pushToken?: string;
}

export interface TemplateDefinition {
  key: string;
  channels: Channel[];
  bodyTemplate: string;
  titleTemplate?: string;
}

export interface SendNotificationCommand {
  templateKey: string;
  recipients: RecipientRef[];
  data: Record<string, unknown>;
  dedupeKey: string;
  channels?: Channel[];
}

export const NOTIFICATION_API_TOKEN = Symbol("NotificationApi");

export interface NotificationApi {
  registerTemplates(moduleKey: string, templates: TemplateDefinition[]): void;
  send(req: SendNotificationCommand): Promise<NotificationId>;
}
