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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TransactionType } from "@/types/transaction";
import { Checkbox } from "@/components/ui/checkbox";
export default function DashboardPage() {
    const [transactionDialogOpen, setTransactionDialogOpen] = useState<boolean>(false);

    const [transactionAmount, setTransactionAmount] = useState<number | null>(null);
    const [transactionDate, setTransactionDate] = useState<Date>(new Date());
    const [transactionDescription, setTransactionDescription] = useState<string>("");
    const [transactionType, setTransactionType] = useState<TransactionType>("EXPENSE");
    const [transactionTitle, setTransactionTitle] = useState<string>("");
    const [transactionCategory, setTransactionCategory] = useState<string>("");
    const [transactionSplitted, setTransactionSplitted] = useState<boolean>(false);

    const closeTransactionDialog = () => {
        setTransactionDialogOpen(false);
    }

    const addTransaction = () => {
        console.log("Adding transaction");
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

                            <div>
                                j
                            </div>

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