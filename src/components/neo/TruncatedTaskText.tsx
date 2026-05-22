"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { TaskTextDialog } from "@/components/neo/TaskTextDialog";

type TruncatedTaskTextProps = {
  text: string;
  id?: string;
  dialogTitle?: string;
  className?: string;
  /** Tailwind gradient stop color for the fade, e.g. `from-white` or `from-success/20` */
  fadeFromClass?: string;
};

export function TruncatedTaskText({
  text,
  id,
  dialogTitle = "Task",
  className = "",
  fadeFromClass = "from-white",
}: TruncatedTaskTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const check = () => {
      setOverflows(measure.offsetWidth > container.clientWidth + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  const openDialog = () => setDialogOpen(true);

  return (
    <>
      <div ref={containerRef} className={`relative min-w-0 ${className}`}>
        <span
          ref={measureRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 whitespace-nowrap opacity-0"
        >
          {text}
        </span>

        {overflows ? (
          <>
            <button
              type="button"
              className="relative z-10 block w-full min-w-0 cursor-pointer pr-8 text-left"
              aria-label={`View full text: ${text}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openDialog();
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="block overflow-hidden font-medium leading-snug whitespace-nowrap">
                {text}
              </span>
            </button>
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l to-transparent ${fadeFromClass}`}
            />
          </>
        ) : (
          <span
            id={id}
            className="block overflow-hidden font-medium leading-snug whitespace-nowrap"
          >
            {text}
          </span>
        )}
      </div>
      <TaskTextDialog
        open={dialogOpen}
        text={text}
        title={dialogTitle}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
