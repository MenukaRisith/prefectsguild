"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AccountStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { initialActionState, type ActionState } from "@/lib/action-state";
import {
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  prefectRegistrationSchema,
  setupSchema,
} from "@/lib/schemas";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createPasswordResetToken,
  markPasswordResetTokenUsed,
  consumePasswordResetToken,
} from "@/lib/workflows";
import {
  createSession,
  destroySession,
  invalidateAllUserSessions,
} from "@/lib/session";
import { saveProfileImage } from "@/lib/storage";
import { sendPasswordResetEmail } from "@/lib/email";
import { getSystemSettings } from "@/lib/system-settings";

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function setupSuperAdminAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const superAdminCount = await db.user.count({
    where: { role: Role.SUPER_ADMIN },
  });

  if (superAdminCount > 0) {
    return {
      success: false,
      message: "Super admin has already been configured.",
    };
  }

  const parsed = setupSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingUser = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      message: "An account already exists for this email.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      fullName: parsed.data.fullName,
      whatsappNumber: parsed.data.whatsappNumber,
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "super_admin.created",
    targetType: "User",
    targetId: user.id,
    summary: "Initial super admin account created.",
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const parsed = loginSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const rateLimit = checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many login attempts. Try again in ${rateLimit.retryAfter} seconds.`,
    };
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  if (user.status === AccountStatus.SUSPENDED) {
    return {
      success: false,
      message: "This account has been suspended. Contact the guild office.",
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id);

  await logAudit({
    actorId: user.id,
    action: "auth.login",
    targetType: "User",
    targetId: user.id,
    summary: "User logged in.",
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function registerPrefectAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const parsed = prefectRegistrationSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    return {
      success: false,
      message: "An account already exists for this email.",
    };
  }

  const profileImage = formData.get("profileImage");
  let profileImagePath: string | null = null;

  if (profileImage instanceof File && profileImage.size > 0) {
    try {
      profileImagePath = await saveProfileImage(profileImage);
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to store profile image.",
      };
    }
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      whatsappNumber: parsed.data.whatsappNumber,
      passwordHash,
      role: Role.PREFECT,
      status: AccountStatus.PENDING_VERIFICATION,
      prefectProfile: {
        create: {
          displayName: parsed.data.displayName,
          grade: parsed.data.grade,
          section: parsed.data.section,
          appointedYear: parsed.data.appointedYear,
          profileImagePath,
          bio: parsed.data.bio,
        },
      },
    },
  });

  await logAudit({
    action: "prefect.registered",
    targetType: "User",
    summary: `New prefect registration submitted for ${parsed.data.fullName}.`,
    meta: {
      email,
      grade: parsed.data.grade,
      appointedYear: parsed.data.appointedYear,
    },
  });

  redirect("/login?registered=1");
}

export async function requestPasswordResetAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const parsed = passwordResetRequestSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const settings = await getSystemSettings();
    const resetUrl = `${settings.appUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return {
    success: true,
    message:
      "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const parsed = passwordResetSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const token = await consumePasswordResetToken(parsed.data.token);

  if (!token) {
    return {
      success: false,
      message: "This reset link is invalid or has expired.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.user.update({
    where: { id: token.userId },
    data: { passwordHash },
  });

  await markPasswordResetTokenUsed(token.id);
  await invalidateAllUserSessions(token.userId);

  await logAudit({
    actorId: token.userId,
    action: "auth.password_reset",
    targetType: "User",
    targetId: token.userId,
    summary: "Password reset completed.",
  });

  revalidatePath("/login");

  return {
    success: true,
    message: "Password reset successfully. You can now sign in.",
  };
}
