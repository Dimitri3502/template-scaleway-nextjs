export type ActionStatus = "idle" | "success" | "error";

/** Seul type de retour d'une Server Action, consommé côté client par `useActionState`. */
export interface ActionState {
  readonly status: ActionStatus;
  readonly message: string;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export const IDLE_ACTION_STATE: ActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export function successState(message: string): ActionState {
  return { status: "success", message, fieldErrors: {} };
}

export function errorState(
  message: string,
  fieldErrors: Readonly<Record<string, string>> = {},
): ActionState {
  return { status: "error", message, fieldErrors };
}
