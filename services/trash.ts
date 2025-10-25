import { prisma } from "@/lib/prisma";

type TrashType = "TRANSACTION" | "CATEGORY" | "CONNECTION" | "SOURCE";

type GetTrashFilters = {
    type?: TrashType;
    limit?: number;
    cursor?: string;
}

export async function getTrashItemsByUserId(userId: string, filters?: GetTrashFilters) {
    try {
        const {
            type,
            limit = 20,
            cursor
        } = filters || {};

        const where: any = { userId };

        if (type) {
            where.type = type;
        }

        const trashItems = await prisma.trash.findMany({
            where,
            orderBy: { deletedAt: 'desc' },
            take: limit + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor }
            })
        });

        let nextCursor: string | undefined = undefined;
        if (trashItems.length > limit) {
            const nextItem = trashItems.pop();
            nextCursor = nextItem?.id;
        }

        return {
            trashItems,
            nextCursor
        };
    } catch (error) {
        console.error('Error in getTrashItemsByUserId:', error);
        throw new Error('Failed to get trash items');
    }
}

export async function addToTrash(userId: string, type: TrashType, data: any) {
    try {
        return await prisma.trash.create({
            data: {
                type,
                data,
                userId
            }
        });
    } catch (error) {
        console.error('Error in addToTrash:', error);
        throw new Error('Failed to add item to trash');
    }
}

export async function deleteTrashItem(trashId: string, userId: string) {
    try {
        return await prisma.trash.delete({
            where: {
                id: trashId,
                userId
            }
        });
    } catch (error) {
        console.error('Error in deleteTrashItem:', error);
        throw new Error('Failed to delete trash item');
    }
}

export async function getTrashItemById(trashId: string, userId: string) {
    try {
        return await prisma.trash.findUnique({
            where: {
                id: trashId,
                userId
            }
        });
    } catch (error) {
        console.error('Error in getTrashItemById:', error);
        throw new Error('Failed to get trash item');
    }
}

export async function emptyTrash(userId: string, type?: TrashType) {
    try {
        const where: any = { userId };
        if (type) {
            where.type = type;
        }

        return await prisma.trash.deleteMany({
            where
        });
    } catch (error) {
        console.error('Error in emptyTrash:', error);
        throw new Error('Failed to empty trash');
    }
}

