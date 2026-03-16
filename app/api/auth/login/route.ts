import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select(`
        first_name,
        last_name,
        email,
        university_id,
        universities (
          name,
          state,
          city
        )
      `)
      .eq('email', email)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Error fetching user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: data.user,
      profile: userData,
      redirect: '/home'
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
