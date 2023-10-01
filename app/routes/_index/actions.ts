import { z } from "zod";

const stringOrNumber = z
  .union([z.string(), z.number()])
  .transform((a) => (typeof a === "number" ? a : parseInt(a)));

export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("updatePerson"), name: z.string() }),
  z.object({
    type: z.literal("updateDog"),
    id: z.string(),
    name: z.string(),
    age: stringOrNumber,
    lovePercent: stringOrNumber,
  }),
]);
