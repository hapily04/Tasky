"use client";

import type { PointerEvent, RefObject } from "react";
import { Reorder, useDragControls, type PanInfo } from "framer-motion";
import { DailyTaskRow } from "@/components/home/DailyTaskRow";
import { IconGrip } from "@/components/neo/icons";
import type { DailyTask } from "@prisma/client";

type SortableDailyTaskRowProps = {
  task: DailyTask;
  dragConstraintsRef: RefObject<HTMLDivElement | null>;
  onDragEnd: () => void;
  onToggle?: (id: string, completed: boolean) => void;
  onDelete?: (id: string) => void;
  onRestore?: (task: DailyTask) => void;
};

export function SortableDailyTaskRow({
  task,
  dragConstraintsRef,
  onDragEnd,
  onToggle,
  onDelete,
  onRestore,
}: SortableDailyTaskRowProps) {
  const dragControls = useDragControls();

  const startDrag = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    dragControls.start(e);
  };

  return (
    <Reorder.Item
      as="div"
      value={task}
      layout="position"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={dragConstraintsRef}
      dragElastic={0}
      onDragEnd={(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y !== 0) onDragEnd();
      }}
      className="relative w-full bg-surface"
      whileDrag={{
        scale: 1.01,
        boxShadow: "var(--shadow-neo-lg)",
        zIndex: 10,
        cursor: "grabbing",
      }}
    >
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center">
        <button
          type="button"
          aria-label="Reorder task"
          title="Drag to reorder"
          className="flex cursor-grab touch-none items-center self-stretch px-2 py-3 text-ink/50 hover:text-ink active:cursor-grabbing"
          onPointerDown={startDrag}
        >
          <IconGrip className="h-5 w-5" />
        </button>
        <DailyTaskRow
          task={task}
          embedded
          onToggle={onToggle}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      </div>
    </Reorder.Item>
  );
}
