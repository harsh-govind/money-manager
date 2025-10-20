"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
export default function DashboardPage() {
    const { data: session } = useSession();

    return (
        <div className="min-h-screen">
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button onClick={() => signOut({ callbackUrl: "/signin" })} variant="outline">
                            Sign Out
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Your account information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4">
                                {session?.user?.image && (
                                    <Avatar>
                                        <AvatarImage src={session?.user?.image} />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                )}
                                <div>
                                    <p className="font-medium">{session?.user?.name}</p>
                                    <p className="text-sm">{session?.user?.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome</CardTitle>
                            <CardDescription>You are successfully signed in</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                This is a protected page. Only authenticated users can access this dashboard.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                            <CardDescription>Your activity overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">No data available yet</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}