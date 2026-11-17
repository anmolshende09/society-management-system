import { z } from "zod";

export const ActorContextSchema = z.object({
  userId: z.string().uuid(),
  membershipId: z.string().uuid().optional(),
  viaImpersonation: z.boolean().default(false),
});

export const AggregateRefSchema = z.object({
  type: z.string(),
  id: z.string().uuid(),
});

export function createEventEnvelopeSchema<T extends z.ZodTypeAny>(
  payloadSchema: T,
) {
  return z.object({
    eventId: z.string(),
    eventType: z.string().regex(/^[a-z_]+\.[a-z_]+\.[a-z_]+$/),
    eventVersion: z.number().int().min(1).default(1),
    tenantId: z.string().uuid(),
    occurredAt: z.string().datetime(),
    actor: ActorContextSchema,
    aggregate: AggregateRefSchema,
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    payload: payloadSchema,
  });
}

export type EventEnvelope<T> = {
  eventId: string;
  eventType: string;
  eventVersion: number;
  tenantId: string;
  occurredAt: string;
  actor: z.infer<typeof ActorContextSchema>;
  aggregate: z.infer<typeof AggregateRefSchema>;
  correlationId: string;
  causationId?: string;
  payload: T;
};
