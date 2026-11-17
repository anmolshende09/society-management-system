import { z } from "zod";

export const ErrorDetailSchema = z.object({
  field: z.string().nullable().optional(),
  issue: z.string(),
  hint: z.string().optional(),
});

export const ErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  status: z.number().int(),
  details: z.array(ErrorDetailSchema).optional(),
  requestId: z.string().optional(),
  docUrl: z.string().url().optional(),
});

export const PaginationMetaSchema = z.object({
  limit: z.number().int().min(1).max(100),
  nextCursor: z.string().nullable(),
  prevCursor: z.string().nullable(),
  hasMore: z.boolean(),
  total: z.number().int().nullable().optional(),
});

export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema.nullable(),
    pagination: PaginationMetaSchema.nullable().default(null),
    error: ErrorPayloadSchema.nullable().default(null),
  });
}

export type ApiResponse<T> = {
  data: T | null;
  pagination: z.infer<typeof PaginationMetaSchema> | null;
  error: z.infer<typeof ErrorPayloadSchema> | null;
};
