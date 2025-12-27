import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { ExpenseTracker } from "@/components/dashboard/expense-tracker"
import { LayoutDashboard, User } from "lucide-react"

export default function DashboardPage() {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
        <TabsTrigger value="dashboard">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-4">
        <ExpenseTracker />
      </TabsContent>
      <TabsContent value="profile" className="mt-4">
        <ProfileForm />
      </TabsContent>
    </Tabs>
  )
}
