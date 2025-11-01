import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTransactionsByUserId, createTransaction, updateTransaction, deleteTransactionById } from "@/services/transaction";

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
        const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean) || undefined;
        const connectionIds = searchParams.get('connectionIds')?.split(',').filter(Boolean) || undefined;
        const sourceIds = searchParams.get('sourceIds')?.split(',').filter(Boolean) || undefined;
        const types = searchParams.get('types')?.split(',').filter(Boolean) as ("INCOME" | "EXPENSE" | "TRANSFER")[] | undefined;
        const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
        const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const cursor = searchParams.get('cursor') || undefined;

        const result = await getTransactionsByUserId(session.user.id, {
            search,
            categoryIds,
            connectionIds,
            sourceIds,
            types,
            dateFrom,
            dateTo,
            limit,
            cursor
        });

        return NextResponse.json({
            message: "Transactions fetched successfully",
            transactions: result.transactions,
            nextCursor: result.nextCursor
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({
            message: "Failed to fetch transactions"
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

        const {
            transactionAmount,
            transactionDate,
            transactionDescription,
            transactionType,
            transactionCategory,
            transactionTitle,
            transactionSource,
            transactionDestination,
            transactionSplitted,
            splitMethod,
            connections
        } = await req.json();

        if (!transactionAmount || !transactionDate || !transactionType || !transactionTitle || !transactionSource || !transactionCategory) {
            return NextResponse.json({
                message: "Required fields missing"
            }, { status: 400 });
        }

        if (transactionType === 'TRANSFER' && !transactionDestination) {
            return NextResponse.json({
                message: "Destination is required for transfers"
            }, { status: 400 });
        }

        const transaction = await createTransaction({
            title: transactionTitle,
            description: transactionDescription || undefined,
            amount: transactionAmount,
            date: new Date(transactionDate),
            type: transactionType,
            categoryId: transactionCategory,
            sourceId: transactionSource,
            destinationId: transactionType === 'TRANSFER' ? transactionDestination : undefined,
            splitMethod: transactionSplitted && splitMethod ? splitMethod : undefined,
            userId: session.user.id,
            connections: transactionSplitted && connections?.length > 0 ? connections : undefined
        });

        return NextResponse.json({
            message: "Transaction created successfully",
            transaction
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({
            message: "Failed to create transaction"
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const {
            id,
            transactionAmount,
            transactionDate,
            transactionDescription,
            transactionType,
            transactionCategory,
            transactionTitle,
            transactionSource,
            transactionDestination,
            transactionSplitted,
            splitMethod,
            connections
        } = await req.json();

        if (!id || !transactionAmount || !transactionDate || !transactionType || !transactionTitle || !transactionSource || !transactionCategory) {
            return NextResponse.json({
                message: "Required fields missing"
            }, { status: 400 });
        }

        if (transactionType === 'TRANSFER' && !transactionDestination) {
            return NextResponse.json({
                message: "Destination is required for transfers"
            }, { status: 400 });
        }

        const transaction = await updateTransaction(
            id,
            session.user.id,
            {
                title: transactionTitle,
                description: transactionDescription || undefined,
                amount: transactionAmount,
                date: new Date(transactionDate),
                type: transactionType,
                categoryId: transactionCategory,
                sourceId: transactionSource,
                destinationId: transactionType === 'TRANSFER' ? transactionDestination : undefined,
                splitMethod: transactionSplitted && splitMethod ? splitMethod : undefined,
                userId: session.user.id,
                connections: transactionSplitted && connections?.length > 0 ? connections : undefined
            }
        );

        return NextResponse.json({
            message: "Transaction updated successfully",
            transaction
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({
            message: "Failed to update transaction"
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
                message: "Transaction ID is required"
            }, { status: 400 });
        }

        await deleteTransactionById(id, session.user.id);

        return NextResponse.json({
            message: "Transaction deleted successfully"
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({
            message: "Failed to delete transaction"
        }, { status: 500 });
    }
}
