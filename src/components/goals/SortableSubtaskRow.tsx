"use client";

import type { PointerEvent, RefObject } from "react";
import { Reorder, useDragControls, type PanInfo } from "framer-motion";
import { SubtaskRow } from "@/components/goals/SubtaskRow";
import { IconGrip } from "@/components/neo/icons";
import type { Subtask } from "@prisma/client";

type SortableSubtaskRowProps = {
  subtask: Subtask;
  dragConstraintsRef: RefObject<HTMLDivElement | null>;
  onDragEnd: () => void;
  onToggle?: (
    subtaskId: string,
    result: { goalCompleted?: boolean; subtaskCompleted?: boolean },
  ) => void;
  onArchive?: (subtaskId: string) => void;
  onTitleUpdate?: (subtaskId: string, title: string) => void;
  onEditingChange?: (editing: boolean) => void;
};

export function SortableSubtaskRow({
  subtask,
  dragConstraintsRef,
  onDragEnd,
  onToggle,
  onArchive,
  onTitleUpdate,
  onEditingChange,
}: SortableSubtaskRowProps) {
  const dragControls = useDragControls();

  const startDrag = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    dragControls.start(e);
  };

  return (
    <Reorder.Item
      as="div"
      value={subtask}
      layout="position"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={dragConstraintsRef}
      dragElastic={0}
      onDragEnd={(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y !== 0) onDragEnd();
      }}
      className="relative w-full border-t-3 border-ink bg-surface first:border-t-0"
      whileDrag={{
        scale: 1.005,
        boxShadow: "var(--shadow-neo-lg)",
        zIndex: 10,
        cursor: "grabbing",
      }}
    >
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-stretch">
        <button
          type="button"
          aria-label="Reorder subtask"
          title="Drag to reorder"
          className="flex cursor-grab touch-none items-center self-stretch px-2 text-ink/50 hover:text-ink active:cursor-grabbing"
          onPointerDown={startDrag}
        >
          <IconGrip className="h-5 w-5" />
        </button>
        <SubtaskRow
          subtask={subtask}
          embedded
          onToggle={onToggle}
          onArchive={onArchive}
          onTitleUpdate={onTitleUpdate}
          onEditingChange={onEditingChange}
        />
      </div>
    </Reorder.Item>
  );
}
