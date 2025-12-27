"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfile, saveUserProfile } from "@/lib/firebase/firestore"
import type { UserProfile } from "@/lib/definitions"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  role: z.enum(["Owner", "Tenant"]),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number." }),
})

export function ProfileForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      role: "Tenant",
      phoneNumber: "",
    },
  })

  useEffect(() => {
    if (user) {
      setLoadingInitialData(true);
      getUserProfile(user.uid)
        .then((profile) => {
          if (profile) {
            form.reset(profile)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingInitialData(false));
    }
  }, [user, form])

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save your profile.",
      })
      return
    }

    setLoading(true)
    try {
      await saveUserProfile(user.uid, values)
      toast({
        title: "Profile Saved",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save your profile. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Manage your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingInitialData ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Owner">Owner</SelectItem>
                        <SelectItem value="Tenant">Tenant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
