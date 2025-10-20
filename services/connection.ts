import { prisma } from "@/lib/prisma";

type GetConnectionsFilters = {
    search?: string;
    limit?: number;
    cursor?: string;
}

export async function getConnectionsByUserId(userId: string, filters?: GetConnectionsFilters) {
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

        const connections = await prisma.connection.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor }
            })
        });

        let nextCursor: string | undefined = undefined;
        if (connections.length > limit) {
            const nextItem = connections.pop();
            nextCursor = nextItem?.id;
        }

        return {
            connections,
            nextCursor
        };
    } catch (error) {
        console.error('Error in getConnectionsByUserId:', error);
        throw new Error('Failed to get connections');
    }
}

export async function createConnection(userId: string, name: string) {
    try {
        return await prisma.connection.create({
            data: {
                name,
                userId
            }
        });
    } catch (error) {
        console.error('Error in createConnection:', error);
        throw new Error('Failed to create connection');
    }
}

export async function getConnectionById(connectionId: string) {
    try {
        return await prisma.connection.findUnique({
            where: { id: connectionId }
        });
    } catch (error) {
        console.error('Error in getConnectionById:', error);
        throw new Error('Failed to get connection');
    }
}

export async function deleteConnectionById(connectionId: string, userId: string) {
    try {
        return await prisma.connection.delete({
            where: {
                id: connectionId,
                userId
            }
        });
    } catch (error) {
        console.error('Error in deleteConnectionById:', error);
        throw new Error('Failed to delete connection');
    }
}

export async function updateConnection(connectionId: string, userId: string, name: string) {
    try {
        return await prisma.connection.update({
            where: {
                id: connectionId,
                userId
            },
            data: {
                name
            }
        });
    } catch (error) {
        console.error('Error in updateConnection:', error);
        throw new Error('Failed to update connection');
    }
}

