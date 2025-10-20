import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConnectionsByUserId, createConnection, updateConnection, deleteConnectionById } from "@/services/connection";

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

        const result = await getConnectionsByUserId(session.user.id, {
            search,
            limit,
            cursor
        });

        return NextResponse.json({
            message: "Connections fetched successfully",
            connections: result.connections,
            nextCursor: result.nextCursor
        });
    } catch (error) {
        console.error('Error fetching connections:', error);
        return NextResponse.json({
            message: "Failed to fetch connections"
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

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({
                message: "Name is required"
            }, { status: 400 });
        }

        const connection = await createConnection(session.user.id, name);

        return NextResponse.json({
            message: "Connection created successfully",
            connection
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating connection:', error);
        return NextResponse.json({
            message: "Failed to create connection"
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

        const { id, name } = await req.json();

        if (!id || !name) {
            return NextResponse.json({
                message: "Connection ID and name are required"
            }, { status: 400 });
        }

        const connection = await updateConnection(id, session.user.id, name);

        return NextResponse.json({
            message: "Connection updated successfully",
            connection
        });
    } catch (error) {
        console.error('Error updating connection:', error);
        return NextResponse.json({
            message: "Failed to update connection"
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
                message: "Connection ID is required"
            }, { status: 400 });
        }

        await deleteConnectionById(id, session.user.id);

        return NextResponse.json({
            message: "Connection deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting connection:', error);
        return NextResponse.json({
            message: "Failed to delete connection"
        }, { status: 500 });
    }
}

