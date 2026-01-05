"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, startOfMonth, startOfWeek, startOfDay, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { Timestamp, collection, onSnapshot, query, addDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

import { addExpense, getExpenses, deleteExpense, addCategory } from '@/lib/firebase/firestore';
import type { Expense, ExpenseCategory, CategoryTotal } from '@/lib/definitions';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { cn, formatIndianCurrency } from '@/lib/utils';
import { Loader2, Calendar as CalendarIcon, Trash2, CircleDollarSign, Salad, Plane, Home, Archive } from 'lucide-react';

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


const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  const props = { className: cn("h-6 w-6", className) };
  switch (category) {
    case 'Food': return <Salad {...props} />;
    case 'Travel': return <Plane {...props} />;
    case 'Rent': return <Home {...props} />;
    default: return <Archive {...props} />;
  }
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export function ExpenseTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [categories, setCategories] = useState<string[]>(['Food', 'Travel', 'Rent', 'Other']);
  const [dateFilter, setDateFilter] = useState('month');

  const fetchExpenses = useCallback(async (uid: string, year: number, month: number) => {
    setLoading(true);
    try {
      const fetchedExpenses = await getExpenses(uid, { year, month });
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch expenses.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    fetchExpenses(user.uid, year, month);
  }, [user, selectedMonth, fetchExpenses]);

  useEffect(() => {
    if (!user) return;
    const categoriesCollectionRef = collection(db, 'users', user.uid, 'categories');
    const q = query(categoriesCollectionRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedCategories: string[] = ['Food', 'Travel', 'Rent'];
        querySnapshot.forEach((doc) => {
            fetchedCategories.push(doc.data().name);
        });
        if (!fetchedCategories.includes('Other')) {
          fetchedCategories.push('Other');
        }
        setCategories([...new Set(fetchedCategories)]); 
    });

    return () => unsubscribe();
  }, [user]);
  
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

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let start, end;
    if (dateFilter === 'today') {
        start = startOfDay(now);
        end = endOfDay(now);
    } else if (dateFilter === 'week') {
        start = startOfWeek(now);
        end = endOfWeek(now);
    } else { // month
        start = startOfMonth(now);
        end = endOfMonth(now);
    }
    return expenses.filter(e => {
        const expenseDate = e.date.toDate();
        return expenseDate >= start && expenseDate <= end;
    });
}, [expenses, dateFilter]);

const { total, categoryTotals, chartData } = useMemo(() => {
  const categoryTotalsMap: Map<string, number> = new Map(categories.map(c => [c, 0]));
  let total = 0;
  
  const sourceExpenses = dateFilter === 'month' 
    ? expenses 
    : filteredExpenses;

  sourceExpenses.forEach(expense => {
    total += expense.amount;
    categoryTotalsMap.set(expense.category, (categoryTotalsMap.get(expense.category) || 0) + expense.amount);
  });

  const categoryTotals: CategoryTotal[] = Array.from(categoryTotalsMap.entries()).map(([category, total]) => ({ category, total }));
  
  const chartData = categoryTotals
      .filter(item => item.total > 0)
      .map(item => ({ name: item.category, value: item.total }));

  return { total, categoryTotals, chartData };
}, [expenses, filteredExpenses, categories, dateFilter]);
  
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

  const onAddExpense = async (values: z.infer<typeof expenseSchema>) => {
    if (!user) return;
    
    let categoryToSave = values.category;
    if (values.category === 'Other' && values.otherCategory) {
        categoryToSave = values.otherCategory;
        if (!categories.includes(categoryToSave)) {
            await addCategory(user.uid, categoryToSave);
        }
    }

    try {
      await addExpense(user.uid, {
        amount: values.amount,
        category: categoryToSave,
        date: Timestamp.fromDate(values.date),
      });
      toast({ title: 'Success', description: 'Expense added.' });
      form.reset({ amount: 0, date: new Date(), category: 'Food', otherCategory: '' });
      
      const expenseMonth = format(values.date, 'yyyy-MM');
      if (expenseMonth !== selectedMonth) {
        setSelectedMonth(expenseMonth);
      } else {
        fetchExpenses(user.uid, ...expenseMonth.split('-').map(Number));
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add expense.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Analytics</CardTitle>
            <ToggleGroup type="single" defaultValue="month" value={dateFilter} onValueChange={(value) => value && setDateFilter(value)} aria-label="Date filter">
              <ToggleGroupItem value="today" aria-label="Today">Today</ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="This week">Week</ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="This month">Month</ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatIndianCurrency(value)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex justify-center items-center h-60">
                    <p className="text-muted-foreground">No expense data for this period.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Totals</CardTitle>
                 <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-[180px]"
                    />
            </CardHeader>
            <CardContent className="space-y-4">
                <Card className="bg-accent/10 text-accent-foreground">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-accent-foreground/80">Total for {format(new Date(selectedMonth + '-02'), 'MMMM yyyy')}</CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatIndianCurrency(total)}
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                {categoryTotals.map(({ category, total }) => (
                  <Card key={category}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{category}</CardTitle>
                      <CategoryIcon category={category} className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : formatIndianCurrency(total)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
            </CardContent>
        </Card>
      </div>


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
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="₹0.00" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  {selectedCategory === 'Other' && (
                    <FormField control={form.control} name="otherCategory" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custom Category Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Subscriptions" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  )}
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
                    <CardTitle>Expense List for {format(new Date(selectedMonth + '-02'), 'MMMM yyyy')}</CardTitle>
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
                                                <TableCell className="font-medium">{formatIndianCurrency(e.amount)}</TableCell>
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

    