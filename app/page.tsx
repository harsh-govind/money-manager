"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    fetch("https://api.github.com/repos/harsh-govind/money-manager")
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count))
      .catch(() => setStars(null));
  }, []);

  if (status === "loading") {
    return <Loader />;
  }

  return (
    <div className="min-h-screen">
      <section className="min-h-screen flex flex-col items-center justify-center p-4 border-b">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-7xl md:text-8xl font-bold tracking-tight">
              Money Manager
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              A personal expense management app built for those who need proper
              account and credit card handling with split functionality.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-center pt-4">
            <Button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              size="lg"
              className="text-base group"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() =>
                window.open(
                  "https://github.com/harsh-govind/money-manager",
                  "_blank"
                )
              }
              size="lg"
              variant="outline"
              className="text-base"
            >
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </Button>

            <Button
              onClick={() =>
                window.open(
                  "https://github.com/harsh-govind/money-manager",
                  "_blank"
                )
              }
              size="lg"
              variant="outline"
              className="text-base"
            >
              <Star className="mr-2 h-5 w-5" />
              {stars !== null ? `${stars}` : "Star"}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-24">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Everything you need
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto">
              Built from frustration with existing apps. Finally, a solution
              that handles both accounts and credit cards properly.
            </p>
          </div>

          <div className="space-y-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold">Transactions</h3>
                <p className="text-lg leading-relaxed">
                  Add and manage all your transactions with powerful split
                  functionality. Handle both account and credit card
                  transactions seamlessly in one place.
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Image
                  src="/screenshots/transactions.png"
                  alt="Transactions"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 border rounded-lg overflow-hidden">
                <Image
                  src="/screenshots/analytics.png"
                  alt="Analytics"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-4 order-1 md:order-2">
                <h3 className="text-3xl font-bold">Analytics</h3>
                <p className="text-lg leading-relaxed">
                  Get detailed insights into your spending patterns. Visualize
                  your expenses and track where your money goes with
                  comprehensive analytics.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold">Categories</h3>
                <p className="text-lg leading-relaxed">
                  Organize your expenses with custom categories. Create and
                  manage categories that match your lifestyle and spending
                  habits.
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Image
                  src="/screenshots/category.png"
                  alt="Categories"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 border rounded-lg overflow-hidden">
                <Image
                  src="/screenshots/sources.png"
                  alt="Sources"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-4 order-1 md:order-2">
                <h3 className="text-3xl font-bold">Sources</h3>
                <p className="text-lg leading-relaxed">
                  Manage multiple payment sources including bank accounts,
                  credit cards, and cash. Keep track of all your financial
                  sources in one unified interface.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold">Connections</h3>
                <p className="text-lg leading-relaxed">
                  Split expenses with friends and family. Create connections to
                  track who owes what and manage shared expenses effortlessly.
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Image
                  src="/screenshots/connections.png"
                  alt="Connections"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 border-t">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Open Source</h2>
          <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Built with Next.js, TypeScript, Prisma, NextAuth.js and Supabase. Star the repo on GitHub and contribute to make it better.
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center pt-4">
            <Button
              onClick={() =>
                window.open(
                  "https://github.com/harsh-govind/money-manager",
                  "_blank"
                )
              }
              size="lg"
              variant="outline"
              className="text-base"
            >
              <Github className="mr-2 h-5 w-5" />
              View on GitHub
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
