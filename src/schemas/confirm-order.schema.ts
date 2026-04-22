import { z } from "zod";

export const confirmOrderSchema = z.object({
  orderId: z.string().min(1)
});
