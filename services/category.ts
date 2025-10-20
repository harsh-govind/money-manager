import { prisma } from "@/lib/prisma";

type GetCategoriesFilters = {
    search?: string;
    limit?: number;
    cursor?: string;
}

export async function getCategoriesByUserId(userId: string, filters?: GetCategoriesFilters) {
    try {
        const {
            search,
            limit = 20,
            cursor
        } = filters || {};

        const where: any = { userId };

        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        const categories = await prisma.category.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor }
            })
        });

        let nextCursor: string | undefined = undefined;
        if (categories.length > limit) {
            const nextItem = categories.pop();
            nextCursor = nextItem?.id;
        }

        return {
            categories,
            nextCursor
        };
    } catch (error) {
        console.error('Error in getCategoriesByUserId:', error);
        throw new Error('Failed to get categories');
    }
}

export async function createCategory(userId: string, title: string, emoji: string) {
    try {
        return await prisma.category.create({
            data: {
                title,
                emoji,
                userId
            }
        });
    } catch (error) {
        console.error('Error in createCategory:', error);
        throw new Error('Failed to create category');
    }
}

export async function getCategoryById(categoryId: string) {
    try {
        return await prisma.category.findUnique({
            where: { id: categoryId }
        });
    } catch (error) {
        console.error('Error in getCategoryById:', error);
        throw new Error('Failed to get category');
    }
}

export async function deleteCategoryById(categoryId: string, userId: string) {
    try {
        return await prisma.category.delete({
            where: {
                id: categoryId,
                userId
            }
        });
    } catch (error) {
        console.error('Error in deleteCategoryById:', error);
        throw new Error('Failed to delete category');
    }
}

export async function updateCategory(categoryId: string, userId: string, title?: string, emoji?: string) {
    try {
        return await prisma.category.update({
            where: {
                id: categoryId,
                userId
            },
            data: {
                ...(title && { title }),
                ...(emoji && { emoji })
            }
        });
    } catch (error) {
        console.error('Error in updateCategory:', error);
        throw new Error('Failed to update category');
    }
}

