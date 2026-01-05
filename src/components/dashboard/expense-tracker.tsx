"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { Timestamp, collection, onSnapshot, query, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

import { addExpense, getExpenses, deleteExpense, addCategory } from '@/lib/firebase/firestore';
import type { Expense, ExpenseCategory, CategoryTotal } from '@/lib/definitions';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { AddExpenseSheet, type OnAddExpensePayload } from '@/components/dashboard/add-expense-sheet';
import { useToast } from '@/hooks/use-toast';
import { cn, formatIndianCurrency } from '@/lib/utils';
import { Loader2, Trash2, Salad, Plane, Home, Archive, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { AnimatedBalance } from './animated-balance';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  const props = { className: cn("h-6 w-6", className) };
  switch (category) {
    case 'Food': return <Salad {...props} />;
    case 'Travel': return <Plane {...props} />;
    case 'Rent': return <Home {...props} />;
    default: return <Archive {...props} />;
  }
};

const COLORS = ['#4F46E5', '#A78BFA', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];

const ActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percent } = props;

  return (
    <g>
      <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill={fill} className="text-lg font-bold">
        {payload.name}
      </text>
       <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#9CA3AF" className="text-sm">
        {formatIndianCurrency(value)}
      </text>
      <text x={cx} y={cy + 20} dy={8} textAnchor="middle" fill="#9CA3AF" className="text-xs">
        ({(percent * 100).toFixed(2)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};


export function ExpenseTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>(['Food', 'Travel', 'Rent', 'Other']);
  const [dateFilter, setDateFilter] = useState('month');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [manualDate, setManualDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const fetchExpenses = useCallback((uid: string) => {
    setLoading(true);
    const expensesColRef = collection(db, 'users', uid, 'expenses');
    const q = query(expensesColRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedExpenses: Expense[] = [];
      snapshot.forEach(doc => {
        fetchedExpenses.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(fetchedExpenses);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch expenses.' });
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);
  
  useEffect(() => {
    if (!user) return;
    const unsubscribe = fetchExpenses(user.uid);
    return () => unsubscribe();
  }, [user, fetchExpenses]);

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

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    const now = new Date();
    if (value === 'month') {
        setFilterStartDate(startOfMonth(now));
        setFilterEndDate(endOfMonth(now));
    }
    // For 'week' and 'today', let the user pick dates.
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return;
    try {
      await deleteExpense(user.uid, expenseId);
      toast({ title: 'Success', description: 'Expense deleted.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete expense.' });
    }
  };

  const filteredExpenses = useMemo(() => {
    if (!filterStartDate || !filterEndDate) return [];
    
    let start = filterStartDate;
    let end = new Date(filterEndDate.getTime());
    end.setHours(23, 59, 59, 999);

    if (dateFilter === 'today') {
        const manualDateObj = new Date(manualDate);
        if (isValid(manualDateObj)) {
            start = new Date(manualDateObj.getTime());
            start.setHours(0, 0, 0, 0);
            end = new Date(manualDateObj.getTime());
            end.setHours(23, 59, 59, 999);
        } else {
            return [];
        }
    }

    return expenses.filter(e => {
        const expenseDate = e.date.toDate();
        return expenseDate >= start && expenseDate <= end;
    });
  }, [expenses, dateFilter, filterStartDate, filterEndDate, manualDate]);


const { total, categoryTotals, chartData } = useMemo(() => {
    const categoryTotalsMap: Map<string, number> = new Map();
    let currentTotal = 0;
    
    filteredExpenses.forEach(expense => {
      currentTotal += expense.amount;
      const currentCategoryTotal = categoryTotalsMap.get(expense.category) || 0;
      categoryTotalsMap.set(expense.category, currentCategoryTotal + expense.amount);
    });
  
    const categoryTotals: CategoryTotal[] = Array.from(categoryTotalsMap.entries()).map(([category, total]) => ({ 
        category, 
        total,
        percentage: currentTotal > 0 ? (total / currentTotal) * 100 : 0
    }));
    
    const chartData = categoryTotals
        .filter(item => item.total > 0)
        .map(item => ({ name: item.category, value: item.total }));
  
    return { total: currentTotal, categoryTotals, chartData };
  }, [filteredExpenses]);

  const onAddExpense = async (values: OnAddExpensePayload) => {
    if (!user) return;
    setIsSubmitting(true);
    
    let categoryToSave = values.category;
    if (values.category === 'Other' && values.otherCategory) {
        categoryToSave = values.otherCategory.trim();
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
      setSheetOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add expense.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };
  
  const onPieLeave = () => {
    setActivePieIndex(null);
  };

  const renderFilterInputs = () => {
    if (dateFilter === 'today') {
        return (
            <Input 
                type="text" 
                value={manualDate} 
                onChange={(e) => setManualDate(e.target.value)} 
                placeholder="YYYY-MM-DD"
                className="bg-card/80 border-white/10"
            />
        );
    }
    if (dateFilter === 'week') {
        return (
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {filterStartDate ? format(filterStartDate, 'LLL dd, y') : <span>Pick a start date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={filterStartDate} onSelect={setFilterStartDate} initialFocus />
                    </PopoverContent>
                </Popover>
                <span>to</span>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {filterEndDate ? format(filterEndDate, 'LLL dd, y') : <span>Pick an end date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={filterEndDate} onSelect={setFilterEndDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
        );
    }
    if (dateFilter === 'month') {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {filterStartDate ? format(filterStartDate, 'MMMM yyyy') : <span>Pick a month</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        onSelect={(date) => {
                            if(date) {
                                setFilterStartDate(startOfMonth(date));
                                setFilterEndDate(endOfMonth(date));
                            }
                        }}
                        initialFocus
                        defaultMonth={filterStartDate}
                    />
                </PopoverContent>
            </Popover>
        )
    }
    return null;
  }
  
  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <AddExpenseSheet categories={categories} onAddExpense={onAddExpense} isSubmitting={isSubmitting} setOpen={setSheetOpen} />
      </Sheet>
      <div className="space-y-6 pb-24">
        
        <Card className="bg-transparent border-none shadow-none">
            <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground">Total Balance</CardTitle>
            <CardDescription className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                <AnimatedBalance value={total} />
            </CardDescription>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card className="bg-card/60 backdrop-blur-xl border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Category Totals</CardTitle>
                        <ToggleGroup type="single" defaultValue="month" value={dateFilter} onValueChange={(value) => value && handleDateFilterChange(value)} aria-label="Date filter">
                            <ToggleGroupItem value="today" aria-label="Today">Today</ToggleGroupItem>
                            <ToggleGroupItem value="week" aria-label="This week">Week</ToggleGroupItem>
                            <ToggleGroupItem value="month" aria-label="This month">Month</ToggleGroupItem>
                        </ToggleGroup>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="mb-4">{renderFilterInputs()}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {categoryTotals.map(({ category, total: categoryTotal, percentage }) => (
                        <Card key={category} className="bg-secondary/50 border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{category}</CardTitle>
                                <CategoryIcon category={category} className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : formatIndianCurrency(categoryTotal)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {percentage?.toFixed(1)}% of total
                                </p>
                            </CardContent>
                        </Card>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3">
                <Card className="bg-card/60 backdrop-blur-xl border-white/10">
                    <CardHeader>
                        <CardTitle>Recent Expenses</CardTitle>
                        <CardDescription>Your latest transactions for the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                            <div className="max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-xl">
                                        <TableRow>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpenses.length > 0 ? (
                                            filteredExpenses.map((e, index) => (
                                                <TableRow key={e.id} className="animate-slide-in-stagger" style={{ '--stagger-delay': `${index * 50}ms` } as React.CSSProperties}>
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
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 active:scale-95 transition-transform"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this expense.</AlertDialogDescription></AlertDialogHeader>
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
                                            <TableRow><TableCell colSpan={4} className="text-center h-24">{!loading && 'No expenses for this period.'}</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        <Card className="bg-card/60 backdrop-blur-xl border-white/10">
            <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
            <CardDescription>Your expense distribution by category.</CardDescription>
            </CardHeader>
            <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-72">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            activeIndex={activePieIndex ?? undefined}
                            activeShape={ActiveShape}
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-none focus:outline-none" />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex justify-center items-center h-72">
                    <p className="text-muted-foreground">No expense data for this period.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </>
  );
}

    