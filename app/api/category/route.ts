import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategoriesByUserId, createCategory, updateCategory, deleteCategoryById } from "@/services/category";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const cursor = searchParams.get('cursor') || undefined;

        const result = await getCategoriesByUserId(session.user.id, {
            search,
            limit,
            cursor
        });

        return NextResponse.json({
            message: "Categories fetched successfully",
            categories: result.categories,
            nextCursor: result.nextCursor
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({
            message: "Failed to fetch categories"
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const { title, emoji } = await req.json();

        if (!title || !emoji) {
            return NextResponse.json({
                message: "Title and emoji are required"
            }, { status: 400 });
        }

        const category = await createCategory(session.user.id, title, emoji);

        return NextResponse.json({
            message: "Category created successfully",
            category
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({
            message: "Failed to create category"
        }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const { id, title, emoji } = await req.json();

        if (!id) {
            return NextResponse.json({
                message: "Category ID is required"
            }, { status: 400 });
        }

        if (!title && !emoji) {
            return NextResponse.json({
                message: "At least one field (title or emoji) is required"
            }, { status: 400 });
        }

        const category = await updateCategory(id, session.user.id, title, emoji);

        return NextResponse.json({
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({
            message: "Failed to update category"
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                message: "Category ID is required"
            }, { status: 400 });
        }

        await deleteCategoryById(id, session.user.id);

        return NextResponse.json({
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({
            message: "Failed to delete category"
        }, { status: 500 });
    }
}

