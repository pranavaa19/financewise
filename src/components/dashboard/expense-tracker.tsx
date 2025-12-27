"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, startOfMonth } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

import { addExpense, getExpensesForMonth, deleteExpense } from '@/lib/firebase/firestore';
import type { Expense, ExpenseCategory, CategoryTotal } from '@/lib/definitions';
import { expenseCategories } from '@/lib/definitions';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, Calendar as CalendarIcon, Trash2, CircleDollarSign, Salad, Plane, Home, Archive } from 'lucide-react';

const expenseSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.enum(expenseCategories),
  date: z.date(),
});

const CategoryIcon = ({ category, className }: { category: ExpenseCategory; className?: string }) => {
  const props = { className: cn("h-6 w-6", className) };
  switch (category) {
    case 'Food': return <Salad {...props} />;
    case 'Travel': return <Plane {...props} />;
    case 'Rent': return <Home {...props} />;
    case 'Other': return <Archive {...props} />;
    default: return <CircleDollarSign {...props} />;
  }
};

export function ExpenseTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const fetchedExpenses = await getExpensesForMonth(user.uid, year, month);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch expenses.' });
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth, toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);
  
  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return;
    const originalExpenses = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    try {
      await deleteExpense(user.uid, expenseId);
      toast({ title: 'Success', description: 'Expense deleted.' });
    } catch (error) {
      setExpenses(originalExpenses);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete expense.' });
    }
  };

  const { total, categoryTotals } = useMemo(() => {
    const categoryTotalsMap: Map<ExpenseCategory, number> = new Map(expenseCategories.map(c => [c, 0]));
    let total = 0;
    expenses.forEach(expense => {
      total += expense.amount;
      categoryTotalsMap.set(expense.category, (categoryTotalsMap.get(expense.category) || 0) + expense.amount);
    });
    const categoryTotals: CategoryTotal[] = Array.from(categoryTotalsMap.entries()).map(([category, total]) => ({ category, total }));
    return { total, categoryTotals };
  }, [expenses]);
  
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: 'Food',
      date: new Date(),
    },
  });

  const onAddExpense = async (values: z.infer<typeof expenseSchema>) => {
    if (!user) return;
    try {
      await addExpense(user.uid, {
        ...values,
        date: Timestamp.fromDate(values.date),
      });
      toast({ title: 'Success', description: 'Expense added.' });
      form.reset({ ...form.getValues(), amount: 0, date: new Date() });
      
      const expenseMonth = format(values.date, 'yyyy-MM');
      if (expenseMonth === selectedMonth) {
        fetchExpenses();
      } else {
        setSelectedMonth(expenseMonth);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add expense.' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Analytics</CardTitle>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[180px]"
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-accent/10 text-accent-foreground col-span-full lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-accent-foreground/80">Total</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : `$${total.toFixed(2)}`}
                </div>
              </CardContent>
            </Card>
            {categoryTotals.map(({ category, total }) => (
              <Card key={category}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{category}</CardTitle>
                  <CategoryIcon category={category} className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : `$${total.toFixed(2)}`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddExpense)} className="space-y-4">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="$0.00" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><>{format(field.value, 'PPP')}</><CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                    </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Expense
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
            <Card>
                <CardHeader>
                    <CardTitle>Expense List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                        <div className="max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length > 0 ? (
                                        expenses.map(e => (
                                            <TableRow key={e.id} className="animate-enter">
                                                <TableCell className="font-medium">${e.amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <CategoryIcon category={e.category} className="h-4 w-4"/>
                                                        {e.category}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(e.date.toDate(), 'MMM d, yyyy')}</TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this expense.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteExpense(e.id)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24">{!loading && 'No expenses for this month.'}</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
