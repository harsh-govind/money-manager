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
    creditLimit?: number;
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
    isSelf?: boolean;
}

export type Split = {
    id: string;
    transactionId: string;
    connectionId: string | null;
    selfUserId: string | null;
    amount?: number;
    percentage?: number;
    createdAt: Date;
    updatedAt: Date;
    connection?: Connection;
    selfUser?: {
        id: string;
        name: string | null;
    };
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
    destinationId?: string | null;
    splitMethod?: SplitMethod;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    category: Category;
    source: Source;
    destination?: Source | null;
    splits?: Split[];
}