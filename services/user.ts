import { prisma } from "@/lib/prisma";

export async function getUserByEmail(email: string) {
    try {
        return await prisma.user.findUnique({
            where: { email }
        });
    } catch (error) {
        console.error('Error in getUserByEmail:', error);
        throw new Error('Failed to get user by email');
    }
}

export async function getUserById(userId: string) {
    try {
        return await prisma.user.findUnique({
            where: { id: userId }
        });
    } catch (error) {
        console.error('Error in getUserById:', error);
        throw new Error('Failed to get user by id');
    }
}

export async function createUser(data: { email: string; name?: string; image?: string }) {
    try {
        return await prisma.user.create({
            data
        });
    } catch (error) {
        console.error('Error in createUser:', error);
        throw new Error('Failed to create user');
    }
}

export async function updateUser(userId: string, data: { name?: string; image?: string }) {
    try {
        return await prisma.user.update({
            where: { id: userId },
            data
        });
    } catch (error) {
        console.error('Error in updateUser:', error);
        throw new Error('Failed to update user');
    }
}

