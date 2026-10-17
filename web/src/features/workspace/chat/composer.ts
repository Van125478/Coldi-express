export type ComposerKey = {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  keyCode: number;
};

export function composerAction(event: ComposerKey): "send" | "newline" | "ignore" {
  if (event.isComposing || event.keyCode === 229) return "ignore";
  if (event.key !== "Enter") return "ignore";
  return event.shiftKey ? "newline" : "send";
}
