import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSourcesByUserId, createSource } from "@/services/source";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const sources = await getSourcesByUserId(session.user.id);

        return NextResponse.json({
            message: "Sources fetched successfully",
            sources
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

        const { name, type, amount } = await req.json();

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

        const source = await createSource(session.user.id, name, type, amount || 0);

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

