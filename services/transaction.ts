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
    }>;
}

export async function getTransactionsByUserId(userId: string) {
    try {
        return await prisma.transaction.findMany({
            where: { userId },
            include: {
                category: true,
                source: true,
                splits: {
                    include: {
                        connection: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
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
                        connectionId: conn.id,
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
                        connection: true
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
                        connection: true
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
                            connectionId: conn.id,
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
                        connection: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in updateTransaction:', error);
        throw new Error('Failed to update transaction');
    }
}

