"use client";



import { forwardRef, useId } from "react";

import { TruncatedTaskText } from "@/components/neo/TruncatedTaskText";



type NeoCheckboxProps = {

  checked: boolean;

  onChange: (checked: boolean) => void;

  label: string;

  /** Stable id for the visible label when it is not expandable (avoids hydration mismatches). */

  labelId?: string;

  /** Shown in the full-text popup when the label is truncated. */

  expandDialogTitle?: string;

  /** Tailwind `from-*` class for truncated-label fade, matched to row background. */

  fadeFromClass?: string;

  disabled?: boolean;

  className?: string;

};



export const NeoCheckbox = forwardRef<HTMLButtonElement, NeoCheckboxProps>(function NeoCheckbox(

  {

    checked,

    onChange,

    label,

    labelId: labelIdProp,

    expandDialogTitle = "Task",

    fadeFromClass = "from-white",

    disabled,

    className = "",

  },

  ref,

) {

  const autoLabelId = useId();

  const labelId = labelIdProp ?? autoLabelId;



  return (

    <div

      className={`flex min-w-0 items-center gap-3 ${disabled ? "opacity-50" : ""} ${className}`}

    >

      <button

        ref={ref}

        type="button"

        role="checkbox"

        aria-checked={checked}

        aria-label={label}

        disabled={disabled}

        onClick={() => !disabled && onChange(!checked)}

        onPointerDown={(e) => e.stopPropagation()}

        className={`neo-border flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center text-lg font-black transition-transform active:scale-95 disabled:cursor-not-allowed ${checked ? "bg-success" : "bg-surface"}`}

      >

        {checked ? "✓" : ""}

      </button>

      <div className="min-w-0 flex-1">

        <TruncatedTaskText

          id={labelId}

          text={label}

          dialogTitle={expandDialogTitle}

          fadeFromClass={fadeFromClass}

        />

      </div>

    </div>

  );

});


