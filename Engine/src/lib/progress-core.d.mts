/** One job of the current step (Fill the Site): its own count when it reports one ("45 of 144"). */
export type Job = {
  key: string;
  label: string;
  state: "done" | "now" | "todo";
  startedAt?: number;
  secs?: number;
  done?: number;
  total?: number;
  /** when done and total were read (ms) */
  countAt?: number;
  /** finished in an earlier run within the last hours, so this run skipped it */
  earlier?: boolean;
  /** the stage and total of the job's first counted round (wholeCount) */
  stage?: string;
  first?: number;
};
export type P = {
  step: number;
  name: string;
  startedAt: number;
  stepStartedAt: number;
  updatedAt: number;
  note: string;
  waiting: boolean;
  waitingSince?: number;
  liveUrl: string;
  done: boolean;
  durations: Record<number, number>;
  jobs?: Job[];
};
export const STEPS: string[];
export const BUDGETS: number[];
export const LIVE_FROM: number;
export const JOB_SECONDS: Record<string, number>;
export function clock(sec: number): string;
export function wholeCount(j: Job, row: { stage: string; done: number; total: number }): { done: number; total: number };
export function minutesToGo(p: P | null, now: number): number;
export function togoNote(p: P | null, now: number): string;
export function currentJob(p: P | null): Job | null;
export function jobLate(j: Job | null, now: number): boolean;
export function isStale(p: P | null, now: number): boolean;
export function stepRows(p: P | null): { n: number; num: string; name: string; state: "done" | "now" | "todo"; time: string; mark: string }[];
export function jobRows(p: P | null, now: number): { key: string; name: string; state: "done" | "now" | "todo"; time: string; mark: string }[];
export function noteLine(p: P | null): string;
