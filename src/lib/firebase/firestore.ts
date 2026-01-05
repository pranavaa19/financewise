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

// --- Category Functions ---

export async function addCategory(uid: string, categoryName: string): Promise<void> {
    const categoriesCollectionRef = collection(db, 'users', uid, 'categories');
    // Check if category already exists to avoid duplicates
    const q = query(categoriesCollectionRef, where("name", "==", categoryName));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        await addDoc(categoriesCollectionRef, { name: categoryName, createdAt: Timestamp.now() });
    }
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


export async function getExpenses(uid: string, filter: { year: number, month: number } | { start: Date, end: Date }): Promise<Expense[]> {
  let startDate, endDate;

  if ('month' in filter) {
    startDate = new Date(filter.year, filter.month - 1, 1);
    endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);
  } else {
    startDate = filter.start;
    endDate = filter.end;
  }
  
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

    