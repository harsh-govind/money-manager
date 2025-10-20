import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTransactionsByUserId, createTransaction } from "@/services/transaction";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const transactions = await getTransactionsByUserId(session.user.id);

        return NextResponse.json({
            message: "Transactions fetched successfully",
            transactions
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
            transactionSplitted,
            splitMethod,
            connections
        } = await req.json();

        if (!transactionAmount || !transactionDate || !transactionType || !transactionTitle) {
            return NextResponse.json({
                message: "Required fields missing"
            }, { status: 400 });
        }

        const transaction = await createTransaction({
            title: transactionTitle,
            description: transactionDescription || undefined,
            amount: transactionAmount,
            date: new Date(transactionDate),
            type: transactionType,
            categoryId: transactionCategory || undefined,
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
