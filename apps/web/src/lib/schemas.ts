import { z } from "zod";

export const ProfileInput = z.object({
  name: z.string().trim().min(1).max(20),
  relation: z.enum(["self", "partner", "family", "friend", "other"]).default("other"),
  gender: z.enum(["male", "female"]),
  calendar: z.enum(["solar", "lunar"]).default("solar"),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  leapMonth: z.boolean().default(false),
  hour: z.number().int().min(0).max(23).nullable(),
  minute: z.number().int().min(0).max(59).nullable(),
  placeName: z.string().trim().max(40).nullable().optional(),
  longitude: z.number().min(70).max(140).nullable().optional(),
  ziSect: z.union([z.literal(1), z.literal(2)]).default(1),
});
export type ProfileInputT = z.infer<typeof ProfileInput>;

export const Question = z.string().trim().max(200).default("");
