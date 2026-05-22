"use client";

import { NeoInput } from "@/components/neo/NeoInput";
import { TASK_TEXT_MAX_LENGTH, clampTaskText } from "@/lib/task-text";
import { NeoIconButton } from "@/components/neo/NeoIconButton";
import { IconRemove } from "@/components/neo/icons";

type SubtaskFieldListProps = {
  fields: string[];
  onChange: (fields: string[]) => void;
  showRemove?: boolean;
  legend?: string;
  optionalHint?: boolean;
};

export function SubtaskFieldList({
  fields,
  onChange,
  showRemove = true,
  legend = "Subtasks",
  optionalHint = true,
}: SubtaskFieldListProps) {
  const updateField = (index: number, value: string) => {
    const next = fields.map((f, i) => (i === index ? clampTaskText(value) : f));
    if (index === fields.length - 1 && value.trim() !== "") {
      onChange([...next, ""]);
    } else {
      onChange(next);
    }
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) {
      onChange([""]);
      return;
    }
    const next = fields.filter((_, i) => i !== index);
    if (next.length === 0 || next.every((f) => f.trim() === "")) {
      onChange([""]);
    } else if (next[next.length - 1]?.trim() !== "") {
      onChange([...next, ""]);
    } else {
      onChange(next);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-bold uppercase tracking-wide">
        {legend}
        {optionalHint && (
          <span className="font-medium normal-case text-ink/60"> (optional)</span>
        )}
      </legend>
      {fields.map((val, i) => (
        <div key={i} className="flex items-end gap-2">
          <NeoInput
            name={`subtask-${i}`}
            label={fields.length === 1 ? "Subtask" : `Subtask ${i + 1}`}
            value={val}
            maxLength={TASK_TEXT_MAX_LENGTH}
            onChange={(e) => updateField(i, e.target.value)}
            placeholder="Add a subtask"
            className="flex-1"
          />
          {showRemove && (fields.length > 1 || val.trim() !== "") && (
            <NeoIconButton
              type="button"
              label="Remove subtask field"
              variant="danger"
              className="mb-0.5"
              onClick={() => removeField(i)}
            >
              <IconRemove />
            </NeoIconButton>
          )}
        </div>
      ))}
    </fieldset>
  );
}

export function getFilledSubtasks(fields: string[]) {
  return fields.map((t) => t.trim()).filter(Boolean);
}
