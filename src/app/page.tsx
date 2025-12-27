import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Plane, Salad, Home, Archive, CircleDollarSign } from 'lucide-react';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === "hero");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background shadow-sm">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <CircleDollarSign className="h-6 w-6 text-primary" />
          <span className="sr-only">ExpenseWise</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/signup" prefetch={false}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Effortless Expense Tracking
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    ExpenseWise helps you manage your daily spending with a simple and intuitive interface. Keep your finances in check, anytime, anywhere.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup" prefetch={false}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  width={600}
                  height={400}
                  alt="Hero"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Everything You Need to Manage Your Money
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From tracking daily expenses to analyzing your spending habits, ExpenseWise provides a complete toolkit for your personal finance needs.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Salad className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Expense Entry</h3>
                  <p className="text-muted-foreground">
                    Quickly log your expenses with categories like Food, Travel, Rent, and Other.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Plane className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Monthly Analytics</h3>
                  <p className="text-muted-foreground">
                    Filter your expenses by month and see detailed analytics of your spending patterns.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Home className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Profile Management</h3>
                  <p className="text-muted-foreground">
                    Manage your personal information and role to tailor your experience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ExpenseWise. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
