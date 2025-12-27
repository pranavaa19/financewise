# **App Name**: ExpenseWise

## Core Features:

- Profile Management: Allows users to create, view, and edit their profile information, including full name, role (Owner or Tenant), and phone number. Data is stored in Firestore.
- Expense Entry: Enables users to add new expenses, including the amount, category (Food, Travel, Rent, Other), and date. Saved to Firestore.
- Expense Listing: Displays a list of the user's expenses, fetched from Firestore, with the ability to delete individual entries.
- Monthly Expense Filtering: Allows users to filter expenses by month using a month selector. Implements Firestore queries to fetch only the relevant expenses for the selected month.
- Total Expense Calculation: Calculates and displays the total expense amount for the selected month. Updates automatically when expenses are added, deleted, or the month changes.
- Category-wise Totals: Calculates and displays the total expenses for each category (Food, Travel, Rent, Other) for the selected month. Updates in real-time with data changes.

## Style Guidelines:

- Primary color: Soft Blue (#A0D2EB) to evoke a sense of calmness and trust in financial matters.
- Background color: Light Gray (#F5F5F5) for a clean and unobtrusive backdrop, ensuring readability and focus.
- Accent color: Warm Yellow (#FFDB58) to highlight important actions and elements, such as CTAs and totals, creating visual interest and guiding user attention.
- Body and headline font: 'PT Sans', a humanist sans-serif to balance modernity and readability, ensuring a comfortable user experience.
- Simple, minimalist icons for expense categories to provide visual cues and improve usability.
- Clean and straightforward layout with clear sections for profile management, expense entry, and expense listing.
- Subtle animations for adding or deleting expenses to provide visual feedback and enhance the user experience.