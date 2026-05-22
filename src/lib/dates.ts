/** Calendar date at UTC midnight (for date-only inputs and stored deadlines). */
export function parseDateOnlyInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m! - 1, d));
}

/** `YYYY-MM-DD` for &lt;input type="date"&gt; from a stored deadline. */
export function formatDateOnlyInput(deadline: Date): string {
  const y = deadline.getUTCFullYear();
  const mo = String(deadline.getUTCMonth() + 1).padStart(2, "0");
  const day = String(deadline.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function endOfDayUTC(d: Date) {
  const start = startOfDayUTC(d);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
}

export function todayStartUTC() {
  return startOfDayUTC(new Date());
}
