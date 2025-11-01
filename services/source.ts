import { prisma } from "@/lib/prisma";

type GetSourcesFilters = {
    search?: string;
    limit?: number;
    cursor?: string;
}

export async function getSourcesByUserId(userId: string, filters?: GetSourcesFilters) {
    try {
        const {
            search,
            limit = 20,
            cursor
        } = filters || {};

        const where: any = { userId };

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const sources = await prisma.source.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor }
            })
        });

        let nextCursor: string | undefined = undefined;
        if (sources.length > limit) {
            const nextItem = sources.pop();
            nextCursor = nextItem?.id;
        }

        return {
            sources,
            nextCursor
        };
    } catch (error) {
        console.error('Error in getSourcesByUserId:', error);
        throw new Error('Failed to get sources');
    }
}

export async function createSource(userId: string, name: string, type: "BANK" | "CASH" | "CREDIT", amount: number, creditLimit?: number, sharedLimit?: boolean, cardNames?: string[]) {
    try {
        return await prisma.source.create({
            data: {
                name,
                type,
                amount,
                ...(creditLimit !== undefined && { creditLimit }),
                ...(sharedLimit !== undefined && { sharedLimit }),
                ...(cardNames !== undefined && { cardNames }),
                userId
            }
        });
    } catch (error) {
        console.error('Error in createSource:', error);
        throw new Error('Failed to create source');
    }
}

export async function getSourceById(sourceId: string) {
    try {
        return await prisma.source.findUnique({
            where: { id: sourceId }
        });
    } catch (error) {
        console.error('Error in getSourceById:', error);
        throw new Error('Failed to get source');
    }
}

export async function deleteSourceById(sourceId: string, userId: string) {
    try {
        return await prisma.source.delete({
            where: {
                id: sourceId,
                userId
            }
        });
    } catch (error) {
        console.error('Error in deleteSourceById:', error);
        throw new Error('Failed to delete source');
    }
}

export async function updateSource(sourceId: string, userId: string, name?: string, type?: "BANK" | "CASH" | "CREDIT", amount?: number, creditLimit?: number, sharedLimit?: boolean, cardNames?: string[]) {
    try {
        return await prisma.source.update({
            where: {
                id: sourceId,
                userId
            },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(amount !== undefined && { amount }),
                ...(creditLimit !== undefined && { creditLimit }),
                ...(sharedLimit !== undefined && { sharedLimit }),
                ...(cardNames !== undefined && { cardNames })
            }
        });
    } catch (error) {
        console.error('Error in updateSource:', error);
        throw new Error('Failed to update source');
    }
}

export async function updateSourceAmount(sourceId: string, userId: string, amountDelta: number) {
    try {
        const source = await prisma.source.findUnique({
            where: { id: sourceId, userId }
        });

        if (!source) {
            throw new Error('Source not found');
        }

        return await prisma.source.update({
            where: {
                id: sourceId,
                userId
            },
            data: {
                amount: source.amount + amountDelta
            }
        });
    } catch (error) {
        console.error('Error in updateSourceAmount:', error);
        throw new Error('Failed to update source amount');
    }
}

