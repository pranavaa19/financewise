import type { Timestamp } from "firebase/firestore";

export type UserProfile = {
  fullName: string;
  role: 'Owner' | 'Tenant';
  phoneNumber: string;
};

export type ExpenseCategory = 'Food' | 'Travel' | 'Rent' | 'Other';

export const expenseCategories: ExpenseCategory[] = ['Food', 'Travel', 'Rent', 'Other'];

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  userId: string;
  createdAt: Timestamp;
};

export type CategoryTotal = {
  category: ExpenseCategory;
  total: number;
};
