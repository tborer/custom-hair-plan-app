import React from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlanCancel() {
  const title = "Checkout canceled | Hair Plan";
  const description = "You canceled checkout. You can resume anytime to unlock your full plan.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="bg-background min-h-screen flex flex-col">
        <Header />

        <main className="mx-auto max-w-3xl w-full px-4 py-16 sm:py-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Checkout canceled</CardTitle>
              <CardDescription>
                No charge was made. You can return to your insight and resume whenever you’re ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Link href="/">
                  <Button className="px-6">Return home</Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Have questions before purchasing? Reach out and we’ll help.
              </p>
            </CardContent>
          </Card>
        </main>
        <SiteFooter maxWidthClass="max-w-3xl" help={{ page: "Plan Cancel" }} />
      </div>
    </>
  );
}