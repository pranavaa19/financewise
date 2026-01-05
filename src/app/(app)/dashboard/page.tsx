"use client";

import { useState } from 'react';
import { ExpenseTracker } from "@/components/dashboard/expense-tracker";
import { AddExpenseSheet, type OnAddExpensePayload } from '@/components/dashboard/add-expense-sheet';
import { useAuth } from '@/hooks/use-auth';
import { addCategory, addExpense } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<string[]>(['Food', 'Travel', 'Rent', 'Other']);
    
    const onAddExpense = async (values: OnAddExpensePayload) => {
        if (!user) return;
        setIsSubmitting(true);
        
        let categoryToSave = values.category;
        if (values.category === 'Other' && values.otherCategory) {
            categoryToSave = values.otherCategory.trim();
            if (!categories.includes(categoryToSave)) {
                await addCategory(user.uid, categoryToSave);
                // The categories state will be updated by the onSnapshot listener in ExpenseTracker
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

    return (
        <>
            <AddExpenseSheet 
                categories={categories} 
                onAddExpense={onAddExpense} 
                isSubmitting={isSubmitting} 
                setOpen={setSheetOpen} 
            />
            <ExpenseTracker />
        </>
    )
}
    