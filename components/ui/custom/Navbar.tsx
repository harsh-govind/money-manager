import { signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export const Navbar = ({ title }: { title: string }) => {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <div className="flex justify-between items-center py-4 select-none px-2 md:px-0">
            <h1 className="text-3xl font-bold">{title}</h1>
            <div className="flex items-center gap-2">
                <ThemeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Avatar>
                            <AvatarImage src={session?.user?.image || ""} />
                            <AvatarFallback>MM</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => router.push('/trash')}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Trash
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </div>
    )
}
