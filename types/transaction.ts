export type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER";
export type SplitMethod = "equal" | "percentage" | "amount";
export type SourceType = "BANK" | "CASH" | "CREDIT";

export type Category = {
    id: string;
    title: string;
    emoji: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export type Source = {
    id: string;
    name: string;
    type: SourceType;
    amount: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export type Connection = {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    amount?: number;
    percentage?: number;
    selected?: boolean;
}

export type Split = {
    id: string;
    transactionId: string;
    connectionId: string;
    amount?: number;
    percentage?: number;
    createdAt: Date;
    updatedAt: Date;
    connection?: Connection;
}

export type Transaction = {
    id: string;
    title: string;
    description?: string;
    amount: number;
    date: Date;
    type: TransactionType;
    categoryId: string;
    sourceId: string;
    splitMethod?: SplitMethod;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    category: Category;
    source: Source;
    splits?: Split[];
}