import { prisma } from "@/lib/prisma";

export async function getSourcesByUserId(userId: string) {
    try {
        return await prisma.source.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Error in getSourcesByUserId:', error);
        throw new Error('Failed to get sources');
    }
}

export async function createSource(userId: string, name: string, type: "BANK" | "CASH" | "CREDIT", amount: number) {
    try {
        return await prisma.source.create({
            data: {
                name,
                type,
                amount,
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

export async function updateSource(sourceId: string, userId: string, name?: string, type?: "BANK" | "CASH" | "CREDIT", amount?: number) {
    try {
        return await prisma.source.update({
            where: {
                id: sourceId,
                userId
            },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(amount !== undefined && { amount })
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

