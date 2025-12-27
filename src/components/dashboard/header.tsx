import Link from "next/link"
import { CircleDollarSign } from "lucide-react"
import { UserNav } from "./user-nav"

export function Header() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-8 z-10">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <CircleDollarSign className="h-6 w-6 text-primary" />
          <span className="font-headline">ExpenseWise</span>
        </Link>
      </nav>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Future search bar can go here */}
        </div>
        <UserNav />
      </div>
    </header>
  )
}
