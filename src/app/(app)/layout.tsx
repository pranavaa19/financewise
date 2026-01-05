import type { ReactNode } from 'react';
import { Header } from '@/components/dashboard/header';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Sheet>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-8 sm:py-6 md:gap-8">
          {children}
        </main>
      </div>
    </Sheet>
  );
}
