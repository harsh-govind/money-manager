import { prisma } from "@/lib/prisma";

type CreateTransactionData = {
    title: string;
    description?: string;
    amount: number;
    date: Date;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    categoryId: string;
    sourceId: string;
    destinationId?: string;
    selectedCardName?: string;
    selectedDestinationCardName?: string;
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
                destination: true,
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

        let destination = null;
        if (data.type === 'TRANSFER') {
            if (!data.destinationId) {
                throw new Error('Destination is required for transfers');
            }

            if (data.sourceId === data.destinationId) {
                throw new Error('Source and destination cannot be the same');
            }

            destination = await prisma.source.findUnique({
                where: { id: data.destinationId }
            });

            if (!destination) {
                throw new Error('Destination not found');
            }
        }

        let sourceDelta = 0;
        let destinationDelta = 0;

        if (data.type === 'TRANSFER') {
            if (source.type === 'CREDIT') {
                sourceDelta = data.amount;
            } else {
                sourceDelta = -data.amount;
            }

            if (destination && destination.type === 'CREDIT') {
                destinationDelta = -data.amount;
            } else if (destination) {
                destinationDelta = data.amount;
            }
        } else {
            if (source.type === 'CREDIT') {
                if (data.type === 'EXPENSE') {
                    sourceDelta = data.amount;
                } else if (data.type === 'INCOME') {
                    sourceDelta = -data.amount;
                }
            } else {
                if (data.type === 'INCOME') {
                    sourceDelta = data.amount;
                } else if (data.type === 'EXPENSE') {
                    sourceDelta = -data.amount;
                }
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
                    destination: true,
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

            if (sourceDelta !== 0) {
                await tx.source.update({
                    where: { id: data.sourceId },
                    data: {
                        amount: {
                            increment: sourceDelta
                        }
                    }
                });
            }

            if (data.type === 'TRANSFER' && data.destinationId && destinationDelta !== 0) {
                await tx.source.update({
                    where: { id: data.destinationId },
                    data: {
                        amount: {
                            increment: destinationDelta
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
                destination: true,
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

export async function deleteTransactionById(transactionId: string, userId: string, moveToTrash: boolean = true) {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId, userId },
            include: {
                source: true,
                destination: true,
                category: true,
                splits: {
                    include: {
                        connection: true,
                        selfUser: true
                    }
                }
            }
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        let sourceDelta = 0;
        let destinationDelta = 0;

        if (transaction.type === 'TRANSFER') {
            if (transaction.source.type === 'CREDIT') {
                sourceDelta = -transaction.amount;
            } else {
                sourceDelta = transaction.amount;
            }

            if (transaction.destination) {
                if (transaction.destination.type === 'CREDIT') {
                    destinationDelta = transaction.amount;
                } else {
                    destinationDelta = -transaction.amount;
                }
            }
        } else {
            if (transaction.source.type === 'CREDIT') {
                if (transaction.type === 'EXPENSE') {
                    sourceDelta = -transaction.amount;
                } else if (transaction.type === 'INCOME') {
                    sourceDelta = transaction.amount;
                }
            } else {
                if (transaction.type === 'INCOME') {
                    sourceDelta = -transaction.amount;
                } else if (transaction.type === 'EXPENSE') {
                    sourceDelta = transaction.amount;
                }
            }
        }

        return await prisma.$transaction(async (tx) => {
            if (moveToTrash) {
                await tx.trash.create({
                    data: {
                        type: 'TRANSACTION',
                        data: {
                            id: transaction.id,
                            title: transaction.title,
                            description: transaction.description,
                            amount: transaction.amount,
                            date: transaction.date,
                            type: transaction.type,
                            categoryId: transaction.categoryId,
                            sourceId: transaction.sourceId,
                            destinationId: transaction.destinationId,
                            selectedCardName: transaction.selectedCardName,
                            selectedDestinationCardName: transaction.selectedDestinationCardName,
                            splitMethod: transaction.splitMethod,
                            category: {
                                title: transaction.category.title,
                                emoji: transaction.category.emoji
                            },
                            source: {
                                name: transaction.source.name,
                                type: transaction.source.type
                            },
                            destination: transaction.destination ? {
                                name: transaction.destination.name,
                                type: transaction.destination.type
                            } : null,
                            splits: transaction.splits.map(split => ({
                                connectionId: split.connectionId,
                                selfUserId: split.selfUserId,
                                amount: split.amount,
                                percentage: split.percentage,
                                connectionName: split.connection?.name,
                                selfUserName: split.selfUser?.name
                            }))
                        },
                        userId
                    }
                });
            }

            const deleted = await tx.transaction.delete({
                where: {
                    id: transactionId,
                    userId
                }
            });

            if (sourceDelta !== 0) {
                await tx.source.update({
                    where: { id: transaction.sourceId },
                    data: {
                        amount: {
                            increment: sourceDelta
                        }
                    }
                });
            }

            if (transaction.type === 'TRANSFER' && transaction.destinationId && destinationDelta !== 0) {
                await tx.source.update({
                    where: { id: transaction.destinationId },
                    data: {
                        amount: {
                            increment: destinationDelta
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
            include: { source: true, destination: true }
        });

        if (!oldTransaction) {
            throw new Error('Transaction not found');
        }

        const oldSource = oldTransaction.source;
        const oldDestination = oldTransaction.destination;
        const newSourceId = data.sourceId || oldTransaction.sourceId;
        const newDestinationId = data.destinationId !== undefined ? data.destinationId : oldTransaction.destinationId;
        const newType = data.type || oldTransaction.type;
        const newAmount = data.amount !== undefined ? data.amount : oldTransaction.amount;

        if (newType === 'TRANSFER' && !newDestinationId) {
            throw new Error('Destination is required for transfers');
        }

        if (newType === 'TRANSFER' && newSourceId === newDestinationId) {
            throw new Error('Source and destination cannot be the same');
        }

        const newSource = newSourceId !== oldTransaction.sourceId
            ? await prisma.source.findUnique({ where: { id: newSourceId } })
            : oldSource;

        if (!newSource) {
            throw new Error('New source not found');
        }

        const newDestination = newType === 'TRANSFER' && newDestinationId
            ? (newDestinationId !== oldTransaction.destinationId
                ? await prisma.source.findUnique({ where: { id: newDestinationId } })
                : oldDestination)
            : null;

        if (newType === 'TRANSFER' && !newDestination) {
            throw new Error('New destination not found');
        }

        let oldSourceDelta = 0;
        let oldDestinationDelta = 0;
        let newSourceDelta = 0;
        let newDestinationDelta = 0;

        if (oldTransaction.type === 'TRANSFER') {
            if (oldSource.type === 'CREDIT') {
                oldSourceDelta = -oldTransaction.amount;
            } else {
                oldSourceDelta = oldTransaction.amount;
            }

            if (oldDestination) {
                if (oldDestination.type === 'CREDIT') {
                    oldDestinationDelta = oldTransaction.amount;
                } else {
                    oldDestinationDelta = -oldTransaction.amount;
                }
            }
        } else {
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
        }

        if (newType === 'TRANSFER') {
            if (newSource.type === 'CREDIT') {
                newSourceDelta = newAmount;
            } else {
                newSourceDelta = -newAmount;
            }

            if (newDestination) {
                if (newDestination.type === 'CREDIT') {
                    newDestinationDelta = -newAmount;
                } else {
                    newDestinationDelta = newAmount;
                }
            }
        } else {
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
                    destination: true,
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

            if (oldTransaction.type === 'TRANSFER' && oldTransaction.destinationId && oldDestinationDelta !== 0) {
                await tx.source.update({
                    where: { id: oldTransaction.destinationId },
                    data: {
                        amount: {
                            increment: oldDestinationDelta
                        }
                    }
                });
            }

            if (newSourceDelta !== 0 && newSourceId !== oldTransaction.sourceId) {
                await tx.source.update({
                    where: { id: newSourceId },
                    data: {
                        amount: {
                            increment: newSourceDelta
                        }
                    }
                });
            } else if (newSourceDelta !== 0 && newSourceId === oldTransaction.sourceId && (newType !== oldTransaction.type || newAmount !== oldTransaction.amount)) {
                await tx.source.update({
                    where: { id: newSourceId },
                    data: {
                        amount: {
                            increment: newSourceDelta - oldSourceDelta
                        }
                    }
                });
            }

            if (newType === 'TRANSFER' && newDestinationId && newDestinationDelta !== 0) {
                if (newDestinationId !== oldTransaction.destinationId) {
                    // Destination changed, apply new delta to new destination
                    await tx.source.update({
                        where: { id: newDestinationId },
                        data: {
                            amount: {
                                increment: newDestinationDelta
                            }
                        }
                    });
                } else if (newDestinationId === oldTransaction.destinationId && newAmount !== oldTransaction.amount) {
                    // Same destination, but amount changed, apply net change
                    await tx.source.update({
                        where: { id: newDestinationId },
                        data: {
                            amount: {
                                increment: newDestinationDelta - oldDestinationDelta
                            }
                        }
                    });
                }
            }

            return transaction;
        });
    } catch (error) {
        console.error('Error in updateTransaction:', error);
        throw new Error('Failed to update transaction');
    }
}

