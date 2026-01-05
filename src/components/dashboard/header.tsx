"use client"
import Link from "next/link"
import { CircleDollarSign, Plus } from "lucide-react"
import { UserNav } from "./user-nav"
import { Button } from "../ui/button"
import { SheetTrigger } from "../ui/sheet"

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-20 items-center gap-4 border-b border-white/10 bg-background/60 px-4 backdrop-blur-xl md:px-8">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <CircleDollarSign className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">ExpenseWise</span>
        </Link>
      </nav>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center gap-4">
          <SheetTrigger asChild>
            <Button className="h-12 w-12 rounded-full shadow-lg shadow-primary/40 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white active:scale-95 transition-transform">
                <Plus className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <UserNav />
        </div>
      </div>
    </header>
  )
}
