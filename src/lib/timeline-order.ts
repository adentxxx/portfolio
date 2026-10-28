import {
  readCreated,
  readPeriod,
  type PeriodFields,
} from "@/lib/content-format";

/** Year and month used for «по настоящее время». Passed in so SSR and the browser match. */
export type RankClock = { year: number; month: number };

export function rankClock(date: Date): RankClock {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

type Tie = { id: string; order: number };

/**
 * Higher rank is newer and sits higher on the timeline.
 * Month 0 is a year without a month (before January).
 * Ongoing sits above a project in the same month and below the next month.
 */
function pointRank(
  year: number | null,
  month: number | null,
  ongoing: boolean,
): number {
  if (!year || year < 1000 || year > 9999) return -1;
  const safeMonth = month && month >= 1 && month <= 12 ? month : 0;
  return year * 10000 + safeMonth * 100 + (ongoing ? 50 : 0);
}

export function companyDateRank(
  company: PeriodFields & { dateLabel: string },
  clock: RankClock,
): number {
  const period = readPeriod(company);
  if (period.ongoing) return pointRank(clock.year, clock.month, true);
  if (period.endYear) return pointRank(period.endYear, period.endMonth, false);
  return pointRank(period.startYear, period.startMonth, false);
}

export function companySortRank(
  company: PeriodFields & { dateLabel: string; manualRank: number | null },
  clock: RankClock,
): number {
  return company.manualRank ?? companyDateRank(company, clock);
}

export function projectSortRank(project: {
  dateLabel: string;
  createdMonth: number | null;
  createdYear: number | null;
}): number {
  const created = readCreated(
    project.dateLabel,
    project.createdMonth,
    project.createdYear,
  );
  return pointRank(created.createdYear, created.createdMonth, false);
}

/** Newer first. Same date keeps the stored order, then id. */
export function byRank<T extends Tie>(items: T[], rankOf: (item: T) => number): T[] {
  return [...items].sort((a, b) => {
    const diff = rankOf(b) - rankOf(a);
    if (diff !== 0) return diff;
    if (a.order !== b.order) return a.order - b.order;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Rank for an item dropped between two neighbors.
 * `higher` is the card above (larger rank), `lower` is the card below.
 */
export function rankBetween(higher: number | null, lower: number | null): number {
  if (higher == null && lower == null) return 0;
  if (higher == null) return (lower ?? 0) + 1;
  if (lower == null) return higher - 1;
  if (higher - lower > 1) return lower + Math.floor((higher - lower) / 2);
  return higher + 1;
}
