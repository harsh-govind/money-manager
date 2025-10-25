import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTrashItemsByUserId, deleteTrashItem, emptyTrash, getTrashItemById } from "@/services/trash";
import { createTransaction } from "@/services/transaction";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as "TRANSACTION" | "CATEGORY" | "CONNECTION" | "SOURCE" | null;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const cursor = searchParams.get('cursor') || undefined;

        const result = await getTrashItemsByUserId(session.user.id, {
            type: type || undefined,
            limit,
            cursor
        });

        return NextResponse.json({
            message: "Trash items fetched successfully",
            trashItems: result.trashItems,
            nextCursor: result.nextCursor
        });
    } catch (error) {
        console.error('Error fetching trash items:', error);
        return NextResponse.json({
            message: "Failed to fetch trash items"
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

        const { id, action } = await req.json();

        if (!id || !action) {
            return NextResponse.json({
                message: "ID and action are required"
            }, { status: 400 });
        }

        if (action === 'restore') {
            const trashItem = await getTrashItemById(id, session.user.id);

            if (!trashItem) {
                return NextResponse.json({
                    message: "Trash item not found"
                }, { status: 404 });
            }

            if (trashItem.type === 'TRANSACTION') {
                const transactionData = trashItem.data as any;
                await createTransaction({
                    title: transactionData.title,
                    description: transactionData.description,
                    amount: transactionData.amount,
                    date: new Date(transactionData.date),
                    type: transactionData.type,
                    categoryId: transactionData.categoryId,
                    sourceId: transactionData.sourceId,
                    splitMethod: transactionData.splitMethod,
                    userId: session.user.id,
                    connections: transactionData.splits?.map((split: any) => ({
                        id: split.connectionId || split.selfUserId,
                        amount: split.amount,
                        percentage: split.percentage,
                        isSelf: !!split.selfUserId
                    }))
                });
            }

            await deleteTrashItem(id, session.user.id);

            return NextResponse.json({
                message: "Item restored successfully"
            });
        } else if (action === 'empty') {
            const type = req.nextUrl.searchParams.get('type') as "TRANSACTION" | "CATEGORY" | "CONNECTION" | "SOURCE" | null;
            await emptyTrash(session.user.id, type || undefined);

            return NextResponse.json({
                message: "Trash emptied successfully"
            });
        } else {
            return NextResponse.json({
                message: "Invalid action"
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error processing trash action:', error);
        return NextResponse.json({
            message: "Failed to process trash action"
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
                message: "Trash item ID is required"
            }, { status: 400 });
        }

        await deleteTrashItem(id, session.user.id);

        return NextResponse.json({
            message: "Trash item permanently deleted"
        });
    } catch (error) {
        console.error('Error deleting trash item:', error);
        return NextResponse.json({
            message: "Failed to delete trash item"
        }, { status: 500 });
    }
}

