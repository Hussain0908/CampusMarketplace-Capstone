import Link from 'next/link'

export default function ConfirmPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Check your email
          </h2>
          <p className="mt-4 text-gray-600">
            We've sent you a confirmation email. Please check your inbox to verify your account.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            It may take up to 5 minutes for the email to arrive. Don't forget to check your spam folder.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  )
}
