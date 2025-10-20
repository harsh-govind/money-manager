"use client";;
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/custom/Navbar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { DateTimePicker } from "@/components/ui/custom/DateTimePicker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Connection, TransactionType, SplitMethod, Category, Source, SourceType } from "@/types/transaction";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus } from "lucide-react";
import axios from "axios";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
export default function DashboardPage() {
    const [transactionDialogOpen, setTransactionDialogOpen] = useState<boolean>(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
    const [connectionDialogOpen, setConnectionDialogOpen] = useState<boolean>(false);
    const [sourceDialogOpen, setSourceDialogOpen] = useState<boolean>(false);

    const [categories, setCategories] = useState<Array<Category>>([]);
    const [availableConnections, setAvailableConnections] = useState<Array<Connection>>([]);
    const [sources, setSources] = useState<Array<Source>>([]);

    const [newCategoryTitle, setNewCategoryTitle] = useState<string>("");
    const [newCategoryEmoji, setNewCategoryEmoji] = useState<string>("");
    const [newConnectionName, setNewConnectionName] = useState<string>("");
    const [newSourceName, setNewSourceName] = useState<string>("");
    const [newSourceType, setNewSourceType] = useState<SourceType>("BANK");
    const [newSourceAmount, setNewSourceAmount] = useState<number>(0);

    const [transactionAmount, setTransactionAmount] = useState<number | null>(null);
    const [transactionDate, setTransactionDate] = useState<Date>(new Date());
    const [transactionDescription, setTransactionDescription] = useState<string>("");
    const [transactionType, setTransactionType] = useState<TransactionType>("EXPENSE");
    const [transactionTitle, setTransactionTitle] = useState<string>("");
    const [transactionCategory, setTransactionCategory] = useState<string>("");
    const [transactionSource, setTransactionSource] = useState<string>("");
    const [transactionSplitted, setTransactionSplitted] = useState<boolean>(false);
    const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
    const [savingTransaction, setSavingTransaction] = useState<boolean>(false);

    const [activeTab, setActiveTab] = useState<string>("transactions");
    const tabs = [
        {
            label: "Transactions",
            value: "transactions"
        },
        {
            label: "Categories",
            value: "categories"
        },
        {
            label: "Connections",
            value: "connections"
        },
        {
            label: "Sources",
            value: "sources"
        },
    ]

    useEffect(() => {
        loadCategories();
        loadConnections();
        loadSources();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await axios.get('/api/category');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const loadConnections = async () => {
        try {
            const response = await axios.get('/api/connection');
            const connections = response.data.connections.map((conn: Connection) => ({
                ...conn,
                selected: false,
                amount: 0,
                percentage: 0
            }));
            setAvailableConnections(connections);
        } catch (error) {
            console.error('Error loading connections:', error);
            toast.error('Failed to load connections');
        }
    };

    const loadSources = async () => {
        try {
            const response = await axios.get('/api/source');
            setSources(response.data.sources);
        } catch (error) {
            console.error('Error loading sources:', error);
            toast.error('Failed to load sources');
        }
    };

    const createCategory = async () => {
        if (!newCategoryTitle || !newCategoryEmoji) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            const response = await axios.post('/api/category', {
                title: newCategoryTitle,
                emoji: newCategoryEmoji
            });
            setCategories([response.data.category, ...categories]);
            setNewCategoryTitle("");
            setNewCategoryEmoji("");
            setCategoryDialogOpen(false);
            toast.success(response.data.message);
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Failed to create category');
        }
    };

    const createConnection = async () => {
        if (!newConnectionName) {
            toast.error('Please enter a name');
            return;
        }

        try {
            const response = await axios.post('/api/connection', {
                name: newConnectionName
            });
            const newConnection = {
                ...response.data.connection,
                selected: false,
                amount: 0,
                percentage: 0
            };
            setAvailableConnections([newConnection, ...availableConnections]);
            setNewConnectionName("");
            setConnectionDialogOpen(false);
            toast.success(response.data.message);
        } catch (error) {
            console.error('Error creating connection:', error);
            toast.error('Failed to create connection');
        }
    };

    const createSource = async () => {
        if (!newSourceName) {
            toast.error('Please enter a name');
            return;
        }

        try {
            const response = await axios.post('/api/source', {
                name: newSourceName,
                type: newSourceType,
                amount: newSourceAmount
            });
            setSources([response.data.source, ...sources]);
            setNewSourceName("");
            setNewSourceType("BANK");
            setNewSourceAmount(0);
            setSourceDialogOpen(false);
            toast.success(response.data.message);
        } catch (error) {
            console.error('Error creating source:', error);
            toast.error('Failed to create source');
        }
    };

    const closeTransactionDialog = () => {
        setTransactionDialogOpen(false);
    }

    const toggleConnectionSelection = (id: string) => {
        setAvailableConnections(availableConnections.map(conn =>
            conn.id === id ? { ...conn, selected: !conn.selected } : conn
        ));
    };

    const updateConnectionAmount = (id: string, amount: number) => {
        setAvailableConnections(availableConnections.map(conn =>
            conn.id === id ? { ...conn, amount } : conn
        ));
    };

    const updateConnectionPercentage = (id: string, percentage: number) => {
        setAvailableConnections(availableConnections.map(conn =>
            conn.id === id ? { ...conn, percentage } : conn
        ));
    };

    const getSelectedConnections = () => {
        return availableConnections.filter(conn => conn.selected);
    };

    const calculateEqualSplit = () => {
        const selected = getSelectedConnections();
        if (!transactionAmount || selected.length === 0) return 0;
        return transactionAmount / selected.length;
    };

    const calculateTotalPercentage = () => {
        const selected = getSelectedConnections();
        return selected.reduce((total, conn) => total + (conn.percentage || 0), 0);
    };

    const calculateTotalAmount = () => {
        const selected = getSelectedConnections();
        return selected.reduce((total, conn) => total + (conn.amount || 0), 0);
    };

    const addTransaction = async () => {
        try {
            if (!transactionTitle || !transactionAmount || !transactionSource || !transactionCategory) {
                toast.error('Please fill required fields');
                return;
            }
            setSavingTransaction(true);

            const selectedForSplit = getSelectedConnections();

            const response = await axios.post('/api/transaction', {
                transactionAmount,
                transactionDate,
                transactionDescription,
                transactionType,
                transactionCategory,
                transactionTitle,
                transactionSource,
                transactionSplitted,
                splitMethod,
                connections: selectedForSplit,
            })

            toast.success(response.data.message);
            closeTransactionDialog();
            setTransactionTitle("");
            setTransactionDescription("");
            setTransactionAmount(null);
            setTransactionDate(new Date());
            setTransactionCategory("");
            setTransactionSource("");
            setTransactionSplitted(false);
            setAvailableConnections(availableConnections.map(conn => ({
                ...conn,
                selected: false,
                amount: 0,
                percentage: 0
            })));

        } catch (error) {
            console.error('Error adding transaction\n', error)
            toast.error('Error adding transaction')
        } finally {
            setSavingTransaction(false);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <Navbar title="Dashboard" />

                <div className=" flex gap-4 justify-between">
                    <div className="flex gap-2 items-center">
                        {tabs.map((tab) => (
                            <div key={tab.value} onClick={() => setActiveTab(tab.value)} className={`border px-2 py-1 rounded-md cursor-pointer hover:bg-muted ${activeTab === tab.value ? "bg-muted" : ""}`}>
                                <span className={`${activeTab === tab.value ? "font-bold" : ""} ${activeTab === tab.value ? "text-foreground" : ""}`}>{tab.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setTransactionDialogOpen(true)} size="sm">
                            Add Transaction
                        </Button>
                        <Button onClick={() => setCategoryDialogOpen(true)} variant="outline" size="sm">
                            Add Category
                        </Button>
                        <Button onClick={() => setConnectionDialogOpen(true)} variant="outline" size="sm">
                            Add Connection
                        </Button>
                        <Button onClick={() => setSourceDialogOpen(true)} variant="outline" size="sm">
                            Add Source
                        </Button>
                    </div>
                </div>


                <div>
                    hi
                </div>

            </div>

            <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
                <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                        <DialogDescription>
                            Track your income, expenses, and transfers with detailed information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="transaction-title" className="px-1">Title *</Label>
                            <Input type="text" placeholder="e.g., Grocery Shopping" value={transactionTitle} onChange={(e) => setTransactionTitle(e.target.value)} id="transaction-title" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="transaction-amount" className="px-1">
                                    Amount *
                                </Label>
                                <Input type="number" placeholder="0.00" value={transactionAmount || ""} onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                        setTransactionAmount(null);
                                    } else {
                                        const numValue = Number(value);
                                        if (!isNaN(numValue)) {
                                            setTransactionAmount(numValue);
                                        }
                                    }
                                }}
                                    id="transaction-amount" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </div>

                            <DateTimePicker date={transactionDate} setDate={setTransactionDate} />
                        </div>

                        <div className="flex gap-4 w-full">
                            <div className="flex flex-col gap-1 w-1/2">
                                <Label htmlFor="transaction-type" className="px-1">Type *</Label>
                                <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">💰 Income</SelectItem>
                                        <SelectItem value="EXPENSE">💸 Expense</SelectItem>
                                        <SelectItem value="TRANSFER">🔄 Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1 w-1/2">
                                <div className="flex items-center justify-between px-1">
                                    <Label htmlFor="transaction-category">Category *</Label>
                                </div>
                                <div className="flex gap-2 w-full items-center">
                                    <Select value={transactionCategory} onValueChange={(value) => setTransactionCategory(value)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    No categories yet
                                                </div>
                                            ) : (
                                                categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.emoji} {category.title}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setCategoryDialogOpen(true);
                                        }}
                                    >
                                        <Plus />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between px-1">
                                <Label htmlFor="transaction-source">Source *</Label>
                            </div>
                            <div className="flex gap-2 w-full items-center">
                                <Select value={transactionSource} onValueChange={(value) => setTransactionSource(value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sources.length === 0 ? (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No sources yet
                                            </div>
                                        ) : (
                                            sources.map((source) => (
                                                <SelectItem key={source.id} value={source.id}>
                                                    {source.type === 'BANK' ? '🏦' : source.type === 'CASH' ? '💵' : '💳'} {source.name} (₹{source.amount.toFixed(2)})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setSourceDialogOpen(true);
                                    }}
                                >
                                    <Plus />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="transaction-description" className="px-1">Description</Label>
                            <Textarea
                                placeholder="Add any additional notes..."
                                value={transactionDescription}
                                onChange={(e) => setTransactionDescription(e.target.value)}
                                id="transaction-description"
                                rows={3}
                            />
                        </div>

                        {transactionType === 'EXPENSE' && <div className="flex flex-col gap-3">

                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Checkbox id="terms" checked={transactionSplitted} onCheckedChange={(checked) => setTransactionSplitted(checked as boolean)} />
                                <Label htmlFor="terms" className="cursor-pointer">Split this expense with others</Label>
                            </div>

                            {transactionSplitted && (
                                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Select People to Split With</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setConnectionDialogOpen(true)}
                                            className="flex items-center gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add Connection
                                        </Button>
                                    </div>

                                    {availableConnections.length === 0 ? (
                                        <div className="text-sm text-muted-foreground text-center py-4">
                                            No connections available. Add a connection to split expenses.
                                        </div>
                                    ) : (
                                        <>
                                            <Tabs value={splitMethod} onValueChange={(value) => setSplitMethod(value as SplitMethod)}>
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="equal">Equal</TabsTrigger>
                                                    <TabsTrigger value="percentage">Percentage</TabsTrigger>
                                                    <TabsTrigger value="amount">Amount</TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="equal" className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        Amount will be split equally among {getSelectedConnections().length} selected {getSelectedConnections().length === 1 ? 'person' : 'people'}
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {availableConnections.map((connection) => (
                                                            <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                                                <Checkbox
                                                                    checked={connection.selected}
                                                                    onCheckedChange={() => toggleConnectionSelection(connection.id)}
                                                                />
                                                                <Label className="flex-1 cursor-pointer" onClick={() => toggleConnectionSelection(connection.id)}>
                                                                    {connection.name}
                                                                </Label>
                                                                {connection.selected && (
                                                                    <div className="text-sm font-medium min-w-[80px] text-right">
                                                                        ₹{calculateEqualSplit().toFixed(2)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>

                                                <TabsContent value="percentage" className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        Total: {calculateTotalPercentage()}%
                                                        {calculateTotalPercentage() !== 100 && (
                                                            <span className="text-red-500 ml-2">
                                                                (Must equal 100%)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {availableConnections.map((connection) => (
                                                            <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                                                <Checkbox
                                                                    checked={connection.selected}
                                                                    onCheckedChange={() => toggleConnectionSelection(connection.id)}
                                                                />
                                                                <Label className="flex-1 cursor-pointer" onClick={() => toggleConnectionSelection(connection.id)}>
                                                                    {connection.name}
                                                                </Label>
                                                                {connection.selected && (
                                                                    <>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="%"
                                                                            value={connection.percentage || ""}
                                                                            onChange={(e) => updateConnectionPercentage(connection.id, Number(e.target.value) || 0)}
                                                                            className="w-20"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        <div className="text-sm font-medium min-w-[80px] text-right">
                                                                            ₹{transactionAmount ? ((transactionAmount * (connection.percentage || 0)) / 100).toFixed(2) : "0.00"}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>

                                                <TabsContent value="amount" className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        Total: ₹{calculateTotalAmount().toFixed(2)}
                                                        {transactionAmount && calculateTotalAmount() !== transactionAmount && (
                                                            <span className="text-red-500 ml-2">
                                                                (Must equal ₹{transactionAmount})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {availableConnections.map((connection) => (
                                                            <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                                                <Checkbox
                                                                    checked={connection.selected}
                                                                    onCheckedChange={() => toggleConnectionSelection(connection.id)}
                                                                />
                                                                <Label className="flex-1 cursor-pointer" onClick={() => toggleConnectionSelection(connection.id)}>
                                                                    {connection.name}
                                                                </Label>
                                                                {connection.selected && (
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Amount"
                                                                        value={connection.amount || ""}
                                                                        onChange={(e) => updateConnectionAmount(connection.id, Number(e.target.value) || 0)}
                                                                        className="w-24"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                        }

                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={closeTransactionDialog} variant="outline">Cancel</Button>
                        <Button onClick={addTransaction} className="w-[135px]" disabled={savingTransaction}>
                            {savingTransaction ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : "Add Transaction"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Category</DialogTitle>
                        <DialogDescription>
                            Add a new category to organize your transactions better.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Category Details *</Label>
                            <div className="flex gap-3 items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                        >
                                            {newCategoryEmoji || "😀"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0 border-0" align="start">
                                        <EmojiPicker
                                            onEmojiClick={(emojiData: EmojiClickData) => {
                                                setNewCategoryEmoji(emojiData.emoji);
                                            }}
                                            width="100%"
                                            height="400px"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    id="category-title"
                                    placeholder="e.g., Food & Dining"
                                    value={newCategoryTitle}
                                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Click the emoji to pick one, then enter a category name</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={() => setCategoryDialogOpen(false)} variant="outline">Cancel</Button>
                        <Button onClick={createCategory}>Create Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Connection</DialogTitle>
                        <DialogDescription>
                            Add a person you frequently split expenses with.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="connection-name">Name *</Label>
                            <Input
                                id="connection-name"
                                placeholder="e.g., John Doe"
                                value={newConnectionName}
                                onChange={(e) => setNewConnectionName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">You can select this person when splitting expenses</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={() => setConnectionDialogOpen(false)} variant="outline">Cancel</Button>
                        <Button onClick={createConnection}>Add Connection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Source</DialogTitle>
                        <DialogDescription>
                            Add a payment source like bank account, cash, or credit card.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="source-name">Name *</Label>
                            <Input
                                id="source-name"
                                placeholder="e.g., HDFC Bank"
                                value={newSourceName}
                                onChange={(e) => setNewSourceName(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="source-type">Type *</Label>
                            <Select value={newSourceType} onValueChange={(value) => setNewSourceType(value as SourceType)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK">🏦 Bank</SelectItem>
                                    <SelectItem value="CASH">💵 Cash</SelectItem>
                                    <SelectItem value="CREDIT">💳 Credit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="source-amount">{newSourceType === 'CREDIT' ? 'Current Credit Limit' : 'Current Balance'}</Label>
                            <Input
                                id="source-amount"
                                type="number"
                                placeholder="0.00"
                                value={newSourceAmount || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                        setNewSourceAmount(0);
                                    } else {
                                        const numValue = Number(value);
                                        if (!isNaN(numValue)) {
                                            setNewSourceAmount(numValue);
                                        }
                                    }
                                }}
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <p className="text-xs text-muted-foreground">Enter the current balance in this source</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={() => setSourceDialogOpen(false)} variant="outline">Cancel</Button>
                        <Button onClick={createSource}>Add Source</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}