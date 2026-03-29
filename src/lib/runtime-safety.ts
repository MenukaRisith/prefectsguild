import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { ActionState } from "@/lib/action-state";

function logRuntimeError(scope: string, label: string, error: unknown) {
  console.error(`[${scope}] ${label}`, error);
}

export async function safeRead<T>(
  label: string,
  read: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    logRuntimeError("read", label, error);
    return fallback();
  }
}

export async function safeActionState(
  label: string,
  fallbackMessage: string,
  action: () => Promise<ActionState>,
): Promise<ActionState> {
  try {
    return await action();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    logRuntimeError("action", label, error);
    return {
      success: false,
      message: fallbackMessage,
    };
  }
}

export async function safeMutation(
  label: string,
  action: () => Promise<void>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    logRuntimeError("mutation", label, error);
  }
}
