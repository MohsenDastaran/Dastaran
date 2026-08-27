import z from "zod";

const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;

function emptyToUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return value;
}

export const contactPayloadSchema = z.object({
  email: z.email("Please enter a valid email address."),
  name: z.preprocess(
    emptyToUndefined,
    z.string().min(2, "Name must be at least 2 characters.").optional(),
  ),
  subject: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .min(2, "Subject must be at least 2 characters.")
      .max(50, "Subject must be less than 50 characters.")
      .optional(),
  ),
  phone: z.preprocess(
    emptyToUndefined,
    z.string().regex(phoneRegex, "Invalid phone number!").optional(),
  ),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(500, "Message must be less than 500 characters."),
  company: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type ContactPayload = z.infer<typeof contactPayloadSchema>;
