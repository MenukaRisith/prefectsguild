import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

const checkboxSchema = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    },
    z.string().max(max).optional(),
  );

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

export const platformSettingsSchema = z.object({
  schoolName: z.string().min(3, "School name is required.").max(100),
  shortName: z.string().min(2, "Short name is required.").max(50),
  motto: z.string().min(2, "Motto is required.").max(60),
  footerLabel: z.string().min(3, "Footer label is required.").max(90),
  supportWhatsappNumber: z.string().min(7, "Support WhatsApp number is required.").max(30),
  appUrl: z.url("Enter a valid public app URL."),
  attendanceCutoffHour: z.coerce.number().int().min(0).max(23),
});

export const smtpSettingsSchema = z
  .object({
    useCustomSmtp: checkboxSchema,
    smtpHost: optionalText(120),
    smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
    smtpUser: optionalText(120),
    smtpPass: optionalText(160),
    smtpFrom: optionalText(160),
    smtpSecure: checkboxSchema,
    existingPasswordConfigured: checkboxSchema,
  })
  .superRefine((value, context) => {
    if (!value.useCustomSmtp) {
      return;
    }

    if (!value.smtpHost) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SMTP host is required when custom SMTP is enabled.",
        path: ["smtpHost"],
      });
    }

    if (!value.smtpUser) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SMTP username is required when custom SMTP is enabled.",
        path: ["smtpUser"],
      });
    }

    if (!value.smtpFrom) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "From address is required when custom SMTP is enabled.",
        path: ["smtpFrom"],
      });
    }

    if (!value.smtpPass && !value.existingPasswordConfigured) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide an SMTP password the first time custom SMTP is enabled.",
        path: ["smtpPass"],
      });
    }
  });

export const passwordResetRequestSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
