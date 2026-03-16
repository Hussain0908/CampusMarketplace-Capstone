import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()


    const supabase = await createClient()
    const { data: userData, error: profileError } = await supabase.auth.resetPasswordForEmail(email)

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

   
    return NextResponse.json(
      { message: 'Password reset link sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 