export type Pick = {
  at: string;
  listPosition?: number;
  outcome: PickOutcome;
  query: string;
  termsKept?: number;
  termsTyped?: number;
};

export type PickOutcome = "abandoned" | "auto" | "miss" | "picked" | "wrong";

export type PickSummary = {
  abandonedShare: number;
  degradedShare: number;
  missShare: number;
  notNewestShare: number;
  queries: number;
  unresolved: string[];
  wrongShare: number;
};
