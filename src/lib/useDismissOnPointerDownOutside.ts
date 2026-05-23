"use client";

import { useEffect, type RefObject } from "react";

type UseDismissOnPointerDownOutsideOptions = {
  enabled?: boolean;
  ignoreRefs?: RefObject<Element | null>[];
  ignoreSelector?: string;
};

function isInside(
  target: EventTarget | null,
  ref: RefObject<Element | null> | undefined,
): boolean {
  if (!target || !ref?.current || !(target instanceof Node)) return false;
  return ref.current.contains(target);
}

function matchesIgnoreSelector(target: EventTarget | null, selector?: string): boolean {
  if (!selector || !(target instanceof Element)) return false;
  return target.closest(selector) !== null;
}

export function useDismissOnPointerDownOutside(
  ref: RefObject<Element | null>,
  onDismiss: () => void,
  options: UseDismissOnPointerDownOutsideOptions = {},
) {
  const { enabled = true, ignoreRefs = [], ignoreSelector } = options;

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target;
      if (matchesIgnoreSelector(target, ignoreSelector)) return;
      if (matchesIgnoreSelector(target, "[data-dismiss-ignore]")) return;
      if (isInside(target, ref)) return;
      if (ignoreRefs.some((ignoreRef) => isInside(target, ignoreRef))) return;

      onDismiss();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [enabled, ignoreRefs, ignoreSelector, onDismiss, ref]);
}
