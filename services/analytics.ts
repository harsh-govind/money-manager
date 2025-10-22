import { prisma } from "@/lib/prisma";
import { format, startOfDay, endOfDay, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

type GetAnalyticsParams = {
    userId: string;
    dateFrom: Date;
    dateTo: Date;
    timeRange: string;
};

export async function getAnalytics({ userId, dateFrom, dateTo, timeRange }: GetAnalyticsParams) {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startOfDay(dateFrom),
                    lte: endOfDay(dateTo)
                }
            },
            include: {
                category: true,
                source: true,
                splits: {
                    include: {
                        connection: true,
                        selfUser: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        const transfers = transactions
            .filter(t => t.type === 'TRANSFER')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        const incomeCount = transactions.filter(t => t.type === 'INCOME').length;
        const expenseCount = transactions.filter(t => t.type === 'EXPENSE').length;
        const transferCount = transactions.filter(t => t.type === 'TRANSFER').length;

        const categoryMap = new Map<string, { id: string; name: string; emoji: string; amount: number; count: number }>();

        transactions
            .filter(t => t.type === 'EXPENSE')
            .forEach(t => {
                const existing = categoryMap.get(t.categoryId);
                if (existing) {
                    existing.amount += t.amount;
                    existing.count += 1;
                } else {
                    categoryMap.set(t.categoryId, {
                        id: t.categoryId,
                        name: t.category.title,
                        emoji: t.category.emoji,
                        amount: t.amount,
                        count: 1
                    });
                }
            });

        const categoryBreakdown = Array.from(categoryMap.values())
            .sort((a, b) => b.amount - a.amount);

        const sourceMap = new Map<string, { id: string; name: string; type: string; amount: number; count: number }>();

        transactions.forEach(t => {
            const existing = sourceMap.get(t.sourceId);
            const impact = t.type === 'INCOME' ? t.amount : t.type === 'EXPENSE' ? -t.amount : 0;

            if (existing) {
                existing.amount += impact;
                existing.count += 1;
            } else {
                sourceMap.set(t.sourceId, {
                    id: t.sourceId,
                    name: t.source.name,
                    type: t.source.type,
                    amount: impact,
                    count: 1
                });
            }
        });

        const sourceBreakdown = Array.from(sourceMap.values())
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

        let intervals: Date[] = [];

        if (timeRange === '1week' || timeRange === '1month') {
            intervals = eachDayOfInterval({ start: dateFrom, end: dateTo });
        } else {
            intervals = eachMonthOfInterval({ start: dateFrom, end: dateTo });
        }

        const timeSeriesData = intervals.map(date => {
            const dateStr = format(date, timeRange === '1week' || timeRange === '1month' ? 'MMM dd' : 'MMM yyyy');
            const dayTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                if (timeRange === '1week' || timeRange === '1month') {
                    return format(tDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                } else {
                    return format(tDate, 'yyyy-MM') === format(date, 'yyyy-MM');
                }
            });

            const dayIncome = dayTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
            const dayExpenses = dayTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

            return {
                date: dateStr,
                income: dayIncome,
                expenses: dayExpenses,
                net: dayIncome - dayExpenses
            };
        });

        const topTransactions = [...transactions]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10)
            .map(t => ({
                id: t.id,
                title: t.title,
                amount: t.amount,
                date: t.date,
                type: t.type,
                category: {
                    emoji: t.category.emoji,
                    title: t.category.title
                }
            }));

        return {
            totals: {
                income,
                expenses,
                transfers,
                balance,
                incomeCount,
                expenseCount,
                transferCount
            },
            categoryBreakdown,
            sourceBreakdown,
            timeSeriesData,
            topTransactions
        };
    } catch (error) {
        console.error('Error in getAnalytics service:', error);
        throw new Error('Failed to fetch analytics data');
    }
}

