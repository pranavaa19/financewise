import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <>
      <LoginForm />
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline" prefetch={false}>
          Sign up
        </Link>
      </div>
    </>
  )
}
