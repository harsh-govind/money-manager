export type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER";
export type Connection = { id: string, name: string, amount?: number, percentage?: number }
export type SplitMethod = "equal" | "percentage" | "amount";