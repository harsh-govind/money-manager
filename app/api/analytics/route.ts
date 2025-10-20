import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnalytics } from "@/services/analytics";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get('timeRange') || '1month';

        const now = new Date();
        let dateFrom: Date;
        let dateTo: Date;

        switch (timeRange) {
            case '1week':
                dateFrom = startOfWeek(subWeeks(now, 0));
                dateTo = endOfWeek(now);
                break;
            case '1month':
                dateFrom = startOfMonth(now);
                dateTo = endOfMonth(now);
                break;
            case '3months':
                dateFrom = startOfMonth(subMonths(now, 2));
                dateTo = endOfMonth(now);
                break;
            case '6months':
                dateFrom = startOfMonth(subMonths(now, 5));
                dateTo = endOfMonth(now);
                break;
            case '1year':
                dateFrom = startOfMonth(subMonths(now, 11));
                dateTo = endOfMonth(now);
                break;
            default:
                dateFrom = startOfMonth(now);
                dateTo = endOfMonth(now);
        }

        const analyticsData = await getAnalytics({
            userId: session.user.id,
            dateFrom,
            dateTo,
            timeRange
        });

        return NextResponse.json(analyticsData, { status: 200 });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({
            message: "Failed to fetch analytics"
        }, { status: 500 });
    }
}

