import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSourcesByUserId, createSource, updateSource, deleteSourceById } from "@/services/source";

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

        const result = await getSourcesByUserId(session.user.id, {
            search,
            limit,
            cursor
        });

        return NextResponse.json({
            message: "Sources fetched successfully",
            sources: result.sources,
            nextCursor: result.nextCursor
        });
    } catch (error) {
        console.error('Error fetching sources:', error);
        return NextResponse.json({
            message: "Failed to fetch sources"
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

        const { name, type, amount, creditLimit, sharedLimit, cardNames } = await req.json();

        if (!name || !type) {
            return NextResponse.json({
                message: "Name and type are required"
            }, { status: 400 });
        }

        if (!["BANK", "CASH", "CREDIT"].includes(type)) {
            return NextResponse.json({
                message: "Invalid type. Must be BANK, CASH, or CREDIT"
            }, { status: 400 });
        }

        const source = await createSource(session.user.id, name, type, amount || 0, creditLimit, sharedLimit, cardNames);

        return NextResponse.json({
            message: "Source created successfully",
            source
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating source:', error);
        return NextResponse.json({
            message: "Failed to create source"
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

        const { id, name, type, amount, creditLimit, sharedLimit, cardNames } = await req.json();

        if (!id) {
            return NextResponse.json({
                message: "Source ID is required"
            }, { status: 400 });
        }

        if (type && !["BANK", "CASH", "CREDIT"].includes(type)) {
            return NextResponse.json({
                message: "Invalid type. Must be BANK, CASH, or CREDIT"
            }, { status: 400 });
        }

        const source = await updateSource(id, session.user.id, name, type, amount, creditLimit, sharedLimit, cardNames);

        return NextResponse.json({
            message: "Source updated successfully",
            source
        });
    } catch (error) {
        console.error('Error updating source:', error);
        return NextResponse.json({
            message: "Failed to update source"
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
                message: "Source ID is required"
            }, { status: 400 });
        }

        await deleteSourceById(id, session.user.id);

        return NextResponse.json({
            message: "Source deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting source:', error);
        return NextResponse.json({
            message: "Failed to delete source"
        }, { status: 500 });
    }
}

