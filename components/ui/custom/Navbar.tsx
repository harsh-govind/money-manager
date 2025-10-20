import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Navbar = ({ title }: { title: string }) => {
    const { data: session } = useSession();
    return (
        <div className="flex justify-between items-center py-4 select-none">
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
                        {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
                        {/* <DropdownMenuSeparator /> */}
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/signin" })}>Sign Out</DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </div>
    )
}