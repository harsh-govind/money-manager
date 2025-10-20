import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const session = await getServerSession(authOptions);

        console.log(session);

        console.log(body);


        return Response.json({
            hey: "done",
        });
    } catch (error) {
        return Response.json({
            message: "Internal Server Error",
        }, {
            status: 500,
        });
    }
}
