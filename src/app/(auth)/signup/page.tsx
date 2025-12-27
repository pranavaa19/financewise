import Link from "next/link"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <>
      <SignupForm />
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline" prefetch={false}>
          Log in
        </Link>
      </div>
    </>
  )
}
