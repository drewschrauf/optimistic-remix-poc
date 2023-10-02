import { z } from "zod";

export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("updatePerson"),
    name: z.string(),
  }),
  z.object({
    type: z.literal("updateDog"),
    id: z.string(),
    name: z.string(),
    age: z.number(),
    lovePercent: z.number(),
  }),
]);

export type Action = z.infer<typeof actionSchema>;

export type ActionByType<T extends Action["type"]> = Extract<
  Action,
  { type: T }
>;
