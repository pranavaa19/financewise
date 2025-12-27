import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  deleteDoc,
  WithFieldValue,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import type { UserProfile, Expense, ExpenseCategory } from '../definitions';

// --- Profile Functions ---

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const profileRef = doc(db, 'users', uid, 'profile', 'data');
  await setDoc(profileRef, profile, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profileRef = doc(db, 'users', uid, 'profile', 'data');
  const docSnap = await getDoc(profileRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

// --- Expense Functions ---

type ExpenseData = {
    userId: string;
    amount: number;
    category: ExpenseCategory;
    date: Timestamp;
    createdAt: Timestamp;
}

export async function addExpense(uid: string, expense: Omit<ExpenseData, 'createdAt' | 'userId'>): Promise<string> {
    const expenseData: ExpenseData = {
        ...expense,
        userId: uid,
        createdAt: Timestamp.now(),
    };
    const expensesCollectionRef = collection(db, 'users', uid, 'expenses');
    const docRef = await addDoc(expensesCollectionRef, expenseData);
    return docRef.id;
}


export async function getExpensesForMonth(uid: string, year: number, month: number): Promise<Expense[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const expensesCollectionRef = collection(db, 'users', uid, 'expenses');
  const q = query(
    expensesCollectionRef,
    where('date', '>=', startTimestamp),
    where('date', '<=', endTimestamp),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const expenses: Expense[] = [];
  querySnapshot.forEach((doc) => {
    expenses.push({ id: doc.id, ...doc.data() } as Expense);
  });
  return expenses;
}

export async function deleteExpense(uid: string, expenseId: string): Promise<void> {
  const expenseRef = doc(db, 'users', uid, 'expenses', expenseId);
  await deleteDoc(expenseRef);
}
