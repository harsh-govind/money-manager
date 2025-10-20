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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { useState } from "react";
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
import { Connection, TransactionType, SplitMethod } from "@/types/transaction";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import axios from "axios";
export default function DashboardPage() {
    const [transactionDialogOpen, setTransactionDialogOpen] = useState<boolean>(false);

    const [transactionAmount, setTransactionAmount] = useState<number | null>(null);
    const [transactionDate, setTransactionDate] = useState<Date>(new Date());
    const [transactionDescription, setTransactionDescription] = useState<string>("");
    const [transactionType, setTransactionType] = useState<TransactionType>("EXPENSE");
    const [transactionTitle, setTransactionTitle] = useState<string>("");
    const [transactionCategory, setTransactionCategory] = useState<string>("");
    const [transactionSplitted, setTransactionSplitted] = useState<boolean>(false);
    const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
    const [connections, setConnections] = useState<Array<Connection>>([
        { id: "1", name: "You" }
    ]);

    const closeTransactionDialog = () => {
        setTransactionDialogOpen(false);
    }

    const addConnection = () => {
        const newId = (connections.length + 1).toString();
        setConnections([...connections, { id: newId, name: "" }]);
    };

    const removeConnection = (id: string) => {
        if (connections.length > 1) {
            setConnections(connections.filter(conn => conn.id !== id));
        }
    };

    const updateConnectionName = (id: string, name: string) => {
        setConnections(connections.map(conn =>
            conn.id === id ? { ...conn, name } : conn
        ));
    };

    const updateConnectionAmount = (id: string, amount: number) => {
        setConnections(connections.map(conn =>
            conn.id === id ? { ...conn, amount } : conn
        ));
    };

    const updateConnectionPercentage = (id: string, percentage: number) => {
        setConnections(connections.map(conn =>
            conn.id === id ? { ...conn, percentage } : conn
        ));
    };

    const calculateEqualSplit = () => {
        if (!transactionAmount || connections.length === 0) return 0;
        return transactionAmount / connections.length;
    };

    const calculateTotalPercentage = () => {
        return connections.reduce((total, conn) => total + (conn.percentage || 0), 0);
    };

    const calculateTotalAmount = () => {
        return connections.reduce((total, conn) => total + (conn.amount || 0), 0);
    };

    const addTransaction = async () => {
        try {

            const response = await axios.post('/api/transaction', {
                transactionAmount,
                transactionDate,
                transactionDescription,
                transactionType,
                transactionCategory,
                transactionTitle,
                connections,
            })

            console.log(response)


        } catch (error) {
            console.error('Error adding transaction\n', error)
            toast.error('Error adding transaction')
        }
    }

    return (
        <>
            <div>
                <Navbar title="Dashboard" />

                <div>
                    <Button onClick={() => setTransactionDialogOpen(true)}>
                        Add Transaction
                    </Button>
                </div>



            </div>

            <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                        <DialogDescription>
                            Add a new transaction to your account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">

                        <div className="flex gap-2">
                            <div className="gap-1 flex flex-col">
                                <Label htmlFor="transaction-amount" className="px-1">
                                    Amount
                                </Label>
                                <Input type="number" placeholder="Amount" value={transactionAmount || ""} onChange={(e) => {
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

                        <div className="flex gap-2">

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="transaction-type" className="px-1">Type</Label>
                                <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)}>
                                    <SelectTrigger className="">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">Income</SelectItem>
                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                        <SelectItem value="TRANSFER">Transfer between accounts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                            <div className="flex flex-col gap-1">
                                <Label htmlFor="transaction-category" className="px-1">Category</Label>
                                <Select value={transactionCategory} onValueChange={(value) => setTransactionCategory(value)}>
                                    <SelectTrigger className="">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Food</SelectItem>
                                        <SelectItem value="expense">Transport</SelectItem>
                                        <SelectItem value="housing">Housing</SelectItem>
                                        <SelectItem value="utilities">Utilities</SelectItem>
                                        <SelectItem value="entertainment">Entertainment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="transaction-title" className="px-1">Title</Label>
                            <Input type="text" placeholder="Title" value={transactionTitle} onChange={(e) => setTransactionTitle(e.target.value)} id="transaction-title" />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="transaction-description" className="px-1">Description</Label>
                            <Textarea placeholder="Description" value={transactionDescription} onChange={(e) => setTransactionDescription(e.target.value)} id="transaction-description" />
                        </div>

                        {transactionType === 'EXPENSE' && <div className="flex flex-col gap-2">

                            <div className="flex items-center gap-3">
                                <Checkbox id="terms" checked={transactionSplitted} onCheckedChange={(checked) => setTransactionSplitted(checked as boolean)} />
                                <Label htmlFor="terms">Splitting among others?</Label>
                            </div>

                            {transactionSplitted && (
                                <div className="border rounded-lg p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Split Transaction</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addConnection}
                                            className="flex items-center gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add Person
                                        </Button>
                                    </div>

                                    <Tabs value={splitMethod} onValueChange={(value) => setSplitMethod(value as SplitMethod)}>
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="equal">Equal</TabsTrigger>
                                            <TabsTrigger value="percentage">Percentage</TabsTrigger>
                                            <TabsTrigger value="amount">Amount</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="equal" className="space-y-3">
                                            <div className="text-sm text-muted-foreground">
                                                Amount will be split equally among {connections.length} people
                                            </div>
                                            <div className="space-y-2">
                                                {connections.map((connection) => (
                                                    <div key={connection.id} className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="Person name"
                                                            value={connection.name}
                                                            onChange={(e) => updateConnectionName(connection.id, e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <div className="text-sm font-medium min-w-[80px] text-right">
                                                            ₹{calculateEqualSplit().toFixed(2)}
                                                        </div>
                                                        {connections.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeConnection(connection.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
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
                                            <div className="space-y-2">
                                                {connections.map((connection) => (
                                                    <div key={connection.id} className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="Person name"
                                                            value={connection.name}
                                                            onChange={(e) => updateConnectionName(connection.id, e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <Input
                                                            type="number"
                                                            placeholder="%"
                                                            value={connection.percentage || ""}
                                                            onChange={(e) => updateConnectionPercentage(connection.id, Number(e.target.value) || 0)}
                                                            className="w-20"
                                                        />
                                                        <div className="text-sm font-medium min-w-[80px] text-right">
                                                            ₹{transactionAmount ? ((transactionAmount * (connection.percentage || 0)) / 100).toFixed(2) : "0.00"}
                                                        </div>
                                                        {connections.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeConnection(connection.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
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
                                            <div className="space-y-2">
                                                {connections.map((connection) => (
                                                    <div key={connection.id} className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="Person name"
                                                            value={connection.name}
                                                            onChange={(e) => updateConnectionName(connection.id, e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <Input
                                                            type="number"
                                                            placeholder="Amount"
                                                            value={connection.amount || ""}
                                                            onChange={(e) => updateConnectionAmount(connection.id, Number(e.target.value) || 0)}
                                                            className="w-24"
                                                        />
                                                        {connections.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeConnection(connection.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            )}

                        </div>
                        }

                    </div>
                    <DialogFooter>
                        <Button onClick={closeTransactionDialog} variant="outline">Cancel</Button>
                        <Button onClick={addTransaction}>Add</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}