import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategoriesByUserId, createCategory } from "@/services/category";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const categories = await getCategoriesByUserId(session.user.id);

        return NextResponse.json({
            message: "Categories fetched successfully",
            categories
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

