"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';

const expenseSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.string().min(1, { message: "Category is required."}),
  otherCategory: z.string().optional(),
  date: z.date(),
}).refine(data => {
    if (data.category === 'Other' && !data.otherCategory) {
        return false;
    }
    return true;
}, {
    message: "Please specify the category name.",
    path: ["otherCategory"],
});

type AddExpenseSheetProps = {
    categories: string[];
    onAddExpense: (values: z.infer<typeof expenseSchema>) => Promise<void>;
    isSubmitting: boolean;
}

export function AddExpenseSheet({ categories, onAddExpense, isSubmitting }: AddExpenseSheetProps) {
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: 'Food',
      date: new Date(),
      otherCategory: '',
    },
  });

  const selectedCategory = form.watch('category');

  return (
    <SheetContent side="bottom" className="rounded-t-3xl border-none bg-background/80 backdrop-blur-xl">
      <SheetHeader className="text-center mb-6">
        <SheetTitle className="text-2xl font-bold">Add New Expense</SheetTitle>
        <SheetDescription>Enter the details of your expense below.</SheetDescription>
      </SheetHeader>
      <div className="max-w-md mx-auto">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddExpense)} className="space-y-6">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} className="py-6 text-lg"/></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="py-6 text-lg"><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            {selectedCategory === 'Other' && (
                <FormField control={form.control} name="otherCategory" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Custom Category Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Subscriptions" {...field} className="py-6 text-lg"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            )}
            <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                <Button variant="outline" className={cn("pl-3 text-left font-normal text-lg py-6", !field.value && "text-muted-foreground")}><>{format(field.value, 'PPP')}</><CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-lg py-7 rounded-full bg-accent hover:bg-accent/90">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Expense
            </Button>
            </form>
        </Form>
      </div>
    </SheetContent>
  );
}
