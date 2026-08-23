import { z } from "zod";

// Validation stricte des entrées (section 17.2) pour le CRUD plats
// (section 10.2, 9.2).
export const dishInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  descriptionEn: z.string().trim().max(2000).optional().nullable(),
  category: z.string().trim().max(60).optional().nullable(),
  categoryEn: z.string().trim().max(60).optional().nullable(),
  ingredients: z.string().trim().max(1000).optional().nullable(),
  ingredientsEn: z.string().trim().max(1000).optional().nullable(),
  prepTimeMinutes: z.coerce.number().int().min(0).max(600).optional().nullable(),
  price: z.coerce.number().min(0).max(10000),
  isAvailable: z.boolean().optional(),
  allergenCodes: z.array(z.string()).optional(),
});

export type DishInput = z.infer<typeof dishInputSchema>;
