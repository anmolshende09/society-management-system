export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

export function isValidDateRange(range: DateRange): boolean {
  return range.start.getTime() <= range.end.getTime();
}
