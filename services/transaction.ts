import { prisma } from "@/lib/prisma";

type CreateTransactionData = {
    title: string;
    description?: string;
    amount: number;
    date: Date;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    categoryId: string;
    sourceId: string;
    splitMethod?: "equal" | "percentage" | "amount";
    userId: string;
    connections?: Array<{
        id: string;
        amount?: number;
        percentage?: number;
        isSelf?: boolean;
    }>;
}

type GetTransactionsFilters = {
    search?: string;
    categoryIds?: string[];
    connectionIds?: string[];
    sourceIds?: string[];
    types?: ("INCOME" | "EXPENSE" | "TRANSFER")[];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    cursor?: string;
}

export async function getTransactionsByUserId(userId: string, filters?: GetTransactionsFilters) {
    try {
        const {
            search,
            categoryIds,
            connectionIds,
            sourceIds,
            types,
            dateFrom,
            dateTo,
            limit = 20,
            cursor
        } = filters || {};

        const where: any = { userId };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (categoryIds && categoryIds.length > 0) {
            where.categoryId = { in: categoryIds };
        }

        if (sourceIds && sourceIds.length > 0) {
            where.sourceId = { in: sourceIds };
        }

        if (types && types.length > 0) {
            where.type = { in: types };
        }

        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = dateFrom;
            if (dateTo) where.date.lte = dateTo;
        }

        if (connectionIds && connectionIds.length > 0) {
            where.splits = {
                some: {
                    OR: [
                        { connectionId: { in: connectionIds } },
                        { selfUserId: { in: connectionIds } }
                    ]
                }
            };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                category: true,
                source: true,
                splits: {
                    include: {
                        connection: true,
                        selfUser: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: limit + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor }
            })
        });

        let nextCursor: string | undefined = undefined;
        if (transactions.length > limit) {
            const nextItem = transactions.pop();
            nextCursor = nextItem?.id;
        }

        return {
            transactions,
            nextCursor
        };
    } catch (error) {
        console.error('Error in getTransactionsByUserId:', error);
        throw new Error('Failed to get transactions');
    }
}

export async function createTransaction(data: CreateTransactionData) {
    try {
        const { connections, ...transactionData } = data;

        return await prisma.transaction.create({
            data: {
                ...transactionData,
                splits: connections && connections.length > 0 ? {
                    create: connections.map((conn) => ({
                        ...(conn.isSelf ? { selfUserId: conn.id } : { connectionId: conn.id }),
                        amount: conn.amount || null,
                        percentage: conn.percentage || null
                    }))
                } : undefined
            },
            include: {
                category: true,
                source: true,
                splits: {
                    include: {
                        connection: true,
                        selfUser: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in createTransaction:', error);
        throw new Error('Failed to create transaction');
    }
}

export async function getTransactionById(transactionId: string) {
    try {
        return await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                category: true,
                source: true,
                splits: {
                    include: {
                        connection: true,
                        selfUser: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in getTransactionById:', error);
        throw new Error('Failed to get transaction');
    }
}

export async function deleteTransactionById(transactionId: string, userId: string) {
    try {
        return await prisma.transaction.delete({
            where: {
                id: transactionId,
                userId
            }
        });
    } catch (error) {
        console.error('Error in deleteTransactionById:', error);
        throw new Error('Failed to delete transaction');
    }
}

export async function updateTransaction(
    transactionId: string,
    userId: string,
    data: Partial<CreateTransactionData>
) {
    try {
        const { connections, ...updateData } = data;

        return await prisma.transaction.update({
            where: {
                id: transactionId,
                userId
            },
            data: {
                ...updateData,
                ...(connections !== undefined && {
                    splits: {
                        deleteMany: {},
                        create: connections.map((conn) => ({
                            ...(conn.isSelf ? { selfUserId: conn.id } : { connectionId: conn.id }),
                            amount: conn.amount || null,
                            percentage: conn.percentage || null
                        }))
                    }
                })
            },
            include: {
                category: true,
                source: true,
                splits: {
                    include: {
                        connection: true,
                        selfUser: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in updateTransaction:', error);
        throw new Error('Failed to update transaction');
    }
}

