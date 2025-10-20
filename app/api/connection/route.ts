import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConnectionsByUserId, createConnection } from "@/services/connection";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const connections = await getConnectionsByUserId(session.user.id);

        return NextResponse.json({
            message: "Connections fetched successfully",
            connections
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

