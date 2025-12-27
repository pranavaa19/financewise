import type { ReactNode } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CircleDollarSign } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    const heroImage = PlaceHolderImages.find(p => p.id === "hero");
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
                <CircleDollarSign className="h-8 w-8 mx-auto text-primary" />
                <h1 className="text-3xl font-bold font-headline">ExpenseWise</h1>
                <p className="text-balance text-muted-foreground">
                    Enter your details below to access your account
                </p>
            </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {heroImage && 
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                data-ai-hint={heroImage.imageHint}
                width="1920"
                height="1080"
                className="h-full w-full object-cover"
                priority
            />
        }
      </div>
    </div>
  );
}
