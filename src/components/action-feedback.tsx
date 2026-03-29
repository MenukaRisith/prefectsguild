import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ActionState } from "@/lib/action-state";

export function ActionFeedback({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <Alert
      className={
        state.success
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100"
          : "border-rose-500/30 bg-rose-500/5 text-rose-900 dark:text-rose-100"
      }
    >
      <AlertTitle>{state.success ? "Done" : "Check this"}</AlertTitle>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
