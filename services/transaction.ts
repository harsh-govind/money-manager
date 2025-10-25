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

        const source = await prisma.source.findUnique({
            where: { id: data.sourceId }
        });

        if (!source) {
            throw new Error('Source not found');
        }

        let amountDelta = 0;

        if (source.type === 'CREDIT') {
            if (data.type === 'EXPENSE') {
                amountDelta = data.amount;
            } else if (data.type === 'INCOME') {
                amountDelta = -data.amount;
            }
        } else {
            if (data.type === 'INCOME') {
                amountDelta = data.amount;
            } else if (data.type === 'EXPENSE') {
                amountDelta = -data.amount;
            }
        }

        return await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
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

            if (amountDelta !== 0) {
                await tx.source.update({
                    where: { id: data.sourceId },
                    data: {
                        amount: {
                            increment: amountDelta
                        }
                    }
                });
            }

            return transaction;
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
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId, userId },
            include: { source: true }
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        let amountDelta = 0;

        if (transaction.source.type === 'CREDIT') {
            if (transaction.type === 'EXPENSE') {
                amountDelta = -transaction.amount;
            } else if (transaction.type === 'INCOME') {
                amountDelta = transaction.amount;
            }
        } else {
            if (transaction.type === 'INCOME') {
                amountDelta = -transaction.amount;
            } else if (transaction.type === 'EXPENSE') {
                amountDelta = transaction.amount;
            }
        }

        return await prisma.$transaction(async (tx) => {
            const deleted = await tx.transaction.delete({
                where: {
                    id: transactionId,
                    userId
                }
            });

            if (amountDelta !== 0) {
                await tx.source.update({
                    where: { id: transaction.sourceId },
                    data: {
                        amount: {
                            increment: amountDelta
                        }
                    }
                });
            }

            return deleted;
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

        const oldTransaction = await prisma.transaction.findUnique({
            where: { id: transactionId, userId },
            include: { source: true }
        });

        if (!oldTransaction) {
            throw new Error('Transaction not found');
        }

        const oldSource = oldTransaction.source;
        const newSourceId = data.sourceId || oldTransaction.sourceId;
        const newType = data.type || oldTransaction.type;
        const newAmount = data.amount !== undefined ? data.amount : oldTransaction.amount;

        const newSource = newSourceId !== oldTransaction.sourceId
            ? await prisma.source.findUnique({ where: { id: newSourceId } })
            : oldSource;

        if (!newSource) {
            throw new Error('New source not found');
        }

        let oldSourceDelta = 0;
        let newSourceDelta = 0;

        if (oldSource.type === 'CREDIT') {
            if (oldTransaction.type === 'EXPENSE') {
                oldSourceDelta = -oldTransaction.amount;
            } else if (oldTransaction.type === 'INCOME') {
                oldSourceDelta = oldTransaction.amount;
            }
        } else {
            if (oldTransaction.type === 'INCOME') {
                oldSourceDelta = -oldTransaction.amount;
            } else if (oldTransaction.type === 'EXPENSE') {
                oldSourceDelta = oldTransaction.amount;
            }
        }

        if (newSource.type === 'CREDIT') {
            if (newType === 'EXPENSE') {
                newSourceDelta = newAmount;
            } else if (newType === 'INCOME') {
                newSourceDelta = -newAmount;
            }
        } else {
            if (newType === 'INCOME') {
                newSourceDelta = newAmount;
            } else if (newType === 'EXPENSE') {
                newSourceDelta = -newAmount;
            }
        }

        return await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.update({
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

            if (oldSourceDelta !== 0) {
                await tx.source.update({
                    where: { id: oldTransaction.sourceId },
                    data: {
                        amount: {
                            increment: oldSourceDelta
                        }
                    }
                });
            }

            if (newSourceDelta !== 0) {
                await tx.source.update({
                    where: { id: newSourceId },
                    data: {
                        amount: {
                            increment: newSourceDelta
                        }
                    }
                });
            }

            return transaction;
        });
    } catch (error) {
        console.error('Error in updateTransaction:', error);
        throw new Error('Failed to update transaction');
    }
}

