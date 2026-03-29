import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

export const setupSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  email: z.email("Enter a valid email address."),
  password: passwordSchema,
  whatsappNumber: z.string().min(7, "WhatsApp number is required."),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const prefectRegistrationSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  displayName: z.string().min(2, "Display name is required."),
  email: z.email("Enter a valid email address."),
  password: passwordSchema,
  grade: z.coerce.number().int().min(6).max(13),
  section: z.string().max(24).optional(),
  appointedYear: z.coerce.number().int().min(2020).max(2100),
  whatsappNumber: z.string().min(7, "WhatsApp number is required."),
  bio: z.string().max(240).optional(),
});

export const staffCreationSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  email: z.email("Enter a valid email address."),
  password: passwordSchema,
  whatsappNumber: z.string().min(7, "WhatsApp number is required."),
  role: z.enum(["TEACHER", "ADMIN"]),
});

export const classSchema = z.object({
  grade: z.coerce.number().int().min(6).max(13),
  section: z.string().min(1).max(12),
  label: z.string().min(2).max(40),
});

export const locationSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(180).optional(),
});

export const dutyAssignmentSchema = z
  .object({
    assigneeId: z.string().min(1),
    kind: z.enum(["ACADEMIC", "LOCATION"]),
    academicClassId: z.string().optional(),
    dutyLocationId: z.string().optional(),
    title: z.string().min(2).max(100),
    notes: z.string().max(240).optional(),
    startsOn: z.string().optional(),
    endsOn: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.kind === "ACADEMIC" && !value.academicClassId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a class duty target.",
        path: ["academicClassId"],
      });
    }

    if (value.kind === "LOCATION" && !value.dutyLocationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a duty location.",
        path: ["dutyLocationId"],
      });
    }
  });

export const taskSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueAt: z.string().optional(),
  assigneeId: z.string().min(1),
});

export const eventSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  eventDate: z.string().min(1, "Event date is required."),
  audience: z.enum(["ALL_PREFECTS", "STAFF_ONLY", "CUSTOM"]),
});

export const announcementSchema = z.object({
  title: z.string().min(2).max(100),
  body: z.string().min(10).max(1200),
  audience: z.enum(["ALL", "PREFECTS", "STAFF", "ADMINS"]),
});

export const absenceSchema = z.object({
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  reason: z.string().min(10, "Reason must be at least 10 characters.").max(800),
});

export const passwordResetRequestSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
