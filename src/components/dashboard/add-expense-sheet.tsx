"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';

const expenseSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.string().min(1, { message: "Category is required."}),
  otherCategory: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
}).refine(data => {
    if (data.category === 'Other' && !data.otherCategory) {
        return false;
    }
    return true;
}, {
    message: "Please specify the category name.",
    path: ["otherCategory"],
});

// A new type for form submission that converts the date string to a Date object
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type OnAddExpensePayload = Omit<ExpenseFormValues, 'date'> & { date: Date };


type AddExpenseSheetProps = {
    categories: string[];
    onAddExpense: (values: OnAddExpensePayload) => Promise<void>;
    isSubmitting: boolean;
    setOpen: (open: boolean) => void;
}

export function AddExpenseSheet({ categories, onAddExpense, isSubmitting, setOpen }: AddExpenseSheetProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: 'Food',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      otherCategory: '',
    },
  });

  const selectedCategory = form.watch('category');

  const handleFormSubmit = async (values: ExpenseFormValues) => {
    // Convert date string to Date object before passing to parent
    await onAddExpense({
        ...values,
        date: new Date(values.date)
    });
    // Close sheet on successful submission
    if (!form.formState.isSubmitting) {
        setOpen(false);
        form.reset();
    }
  };

  return (
    <SheetContent side="bottom" className="rounded-t-3xl border-none bg-background/80 backdrop-blur-xl">
      <SheetHeader className="text-center mb-6">
        <SheetTitle className="text-2xl font-bold">Add New Expense</SheetTitle>
        <SheetDescription>Enter the details of your expense below.</SheetDescription>
      </SheetHeader>
      <div className="max-w-md mx-auto">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
             <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} className="py-6 text-lg" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-lg py-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white hover:opacity-90">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Expense
            </Button>
            </form>
        </Form>
      </div>
    </SheetContent>
  );
}