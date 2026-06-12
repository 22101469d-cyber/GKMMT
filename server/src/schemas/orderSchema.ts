import { z } from "zod";

export const createOrderSchema = z.object({
  profileId: z.string().uuid(),
  reportId: z.string().uuid(),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});
