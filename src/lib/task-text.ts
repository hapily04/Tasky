export const TASK_TEXT_MAX_LENGTH = 800;

export function clampTaskText(value: string): string {
  return value.slice(0, TASK_TEXT_MAX_LENGTH);
}
