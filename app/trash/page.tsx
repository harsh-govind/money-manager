"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/custom/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type TrashItem = {
    id: string;
    type: string;
    deletedAt: string;
    data: {
        id: string;
        title: string;
        description?: string;
        amount: number;
        date: string;
        type: "INCOME" | "EXPENSE" | "TRANSFER";
        category?: {
            title: string;
            emoji: string;
        };
        source?: {
            name: string;
            type: string;
        };
    };
};

export default function TrashPage() {
    const router = useRouter();
    const [trashItems, setTrashItems] = useState<Array<TrashItem>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [emptyingTrash, setEmptyingTrash] = useState<boolean>(false);

    useEffect(() => {
        loadTrashItems();
    }, []);

    const loadTrashItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/trash?type=TRANSACTION');
            setTrashItems(response.data.trashItems);
        } catch (error) {
            console.error('Error loading trash items:', error);
            toast.error('Failed to load trash items');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (trashId: string) => {
        setRestoringId(trashId);
        try {
            await axios.post('/api/trash', { id: trashId, action: 'restore' });
            setTrashItems(trashItems.filter(item => item.id !== trashId));
            toast.success('Transaction restored successfully');
        } catch (error) {
            console.error('Error restoring item:', error);
            toast.error('Failed to restore transaction');
        } finally {
            setRestoringId(null);
        }
    };

    const handlePermanentDelete = async (trashId: string) => {
        if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
            return;
        }

        setDeletingId(trashId);
        try {
            await axios.delete(`/api/trash?id=${trashId}`);
            setTrashItems(trashItems.filter(item => item.id !== trashId));
            toast.success('Item permanently deleted');
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm('Are you sure you want to permanently delete all items in the trash? This action cannot be undone.')) {
            return;
        }

        setEmptyingTrash(true);
        try {
            await axios.post('/api/trash', { action: 'empty', id: '' });
            setTrashItems([]);
            toast.success('Trash emptied successfully');
        } catch (error) {
            console.error('Error emptying trash:', error);
            toast.error('Failed to empty trash');
        } finally {
            setEmptyingTrash(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <Navbar title="Trash" />

            <div className="flex justify-between items-center gap-3 md:gap-0 md:mx-0 mx-2">
                <div>
                    <h2 className="text-lg md:text-xl font-semibold">Deleted Items</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Manage deleted items                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => router.push('/dashboard')} variant="outline" className="text-xs md:text-sm h-8 md:h-10 px-3 md:px-4" disabled={restoringId !== null || deletingId !== null || emptyingTrash}>
                        <span className="md:hidden">Back</span>
                        <span className="hidden md:inline">Back to Dashboard</span>
                    </Button>
                    {trashItems.length > 0 && (
                        <Button onClick={handleEmptyTrash} variant="destructive" className="text-xs md:text-sm h-8 md:h-10 px-3 md:px-4" disabled={emptyingTrash || restoringId !== null || deletingId !== null}>
                            {emptyingTrash ? (
                                <>
                                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />
                                    Emptying...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                    <span className="md:hidden">Empty</span>
                                    <span className="hidden md:inline">Empty Trash</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="border-0 md:border rounded-md p-0 md:p-4 md:min-h-[calc(100vh-200px)] min-h-[calc(100vh-230px)] md:mx-0 mx-2">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : trashItems.length === 0 ? (
                    <div className="text-center py-8 md:py-12 text-muted-foreground px-4">
                        <Trash2 className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-50" />
                        <h3 className="text-base md:text-lg font-semibold mb-2">Trash is empty</h3>
                        <p className="text-xs md:text-sm">Deleted items will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-2 md:space-y-3">
                        {trashItems.map((item) => {
                            const data = item.data;
                            return (
                                <Card key={item.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="px-2.5 py-2 md:p-4">
                                        <div className="md:hidden space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-semibold truncate text-sm flex-1">{data.title}</h3>
                                                <div className={`text-base font-bold shrink-0 ${data.type === 'INCOME' ? 'text-green-600 dark:text-green-400' :
                                                    data.type === 'EXPENSE' ? 'text-red-600 dark:text-red-400' :
                                                        'text-blue-600 dark:text-blue-400'
                                                    }`}>
                                                    {data.type === 'INCOME' ? '+' : data.type === 'EXPENSE' ? '-' : ''}
                                                    ₹{data.amount?.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-1 min-w-0 overflow-hidden">
                                                    <span className="shrink-0">{data.category?.emoji} {data.category?.title}</span>
                                                    <span className="shrink-0">•</span>
                                                    <span className="shrink-0">
                                                        {data.source?.type === 'BANK' ? '🏦' :
                                                            data.source?.type === 'CASH' ? '💵' : '💳'}
                                                    </span>
                                                    <span className="truncate">{data.source?.name}</span>
                                                </div>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 shrink-0"
                                                        >
                                                            <span className="text-base leading-none">⋯</span>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-32 p-1" align="end">
                                                        <div className="space-y-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRestore(item.id)}
                                                                disabled={restoringId === item.id || deletingId !== null || emptyingTrash}
                                                                className="w-full justify-start h-8 px-2 text-xs"
                                                            >
                                                                {restoringId === item.id ? (
                                                                    <>
                                                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                                        Restoring
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <RotateCcw className="h-3 w-3 mr-2" />
                                                                        Restore
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handlePermanentDelete(item.id)}
                                                                disabled={deletingId === item.id || restoringId !== null || emptyingTrash}
                                                                className="w-full justify-start h-8 px-2 text-xs text-destructive hover:text-destructive"
                                                            >
                                                                {deletingId === item.id ? (
                                                                    <>
                                                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                                        Deleting
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                                        Delete
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground pt-0.5">
                                                Deleted: {format(new Date(item.deletedAt), 'dd MMM yyyy')}
                                            </div>
                                        </div>

                                        <div className="hidden md:flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="text-4xl bg-muted/50 p-2 rounded-lg">
                                                    {data.category?.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg mb-1 truncate">
                                                        {data.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                                                        <span className="flex items-center gap-1">
                                                            {data.category?.emoji} {data.category?.title}
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {data.source?.type === 'BANK' ? '🏦' :
                                                                data.source?.type === 'CASH' ? '💵' : '💳'} {data.source?.name}
                                                        </span>
                                                        <span>•</span>
                                                        <span className={`font-semibold ${data.type === 'INCOME' ? 'text-green-600' :
                                                            data.type === 'EXPENSE' ? 'text-red-600' :
                                                                'text-blue-600'
                                                            }`}>
                                                            {data.type === 'INCOME' ? '+' : data.type === 'EXPENSE' ? '-' : ''}
                                                            ₹{data.amount?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {data.description && (
                                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                            {data.description}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                        <span>
                                                            Transaction: {format(new Date(data.date), 'MMM dd, yyyy HH:mm')}
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            Deleted: {format(new Date(item.deletedAt), 'MMM dd, yyyy HH:mm')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRestore(item.id)}
                                                    disabled={restoringId === item.id || deletingId !== null || emptyingTrash}
                                                    className="gap-2 min-w-[100px]"
                                                >
                                                    {restoringId === item.id ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Restoring
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="h-4 w-4" />
                                                            Restore
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handlePermanentDelete(item.id)}
                                                    disabled={deletingId === item.id || restoringId !== null || emptyingTrash}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    {deletingId === item.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

