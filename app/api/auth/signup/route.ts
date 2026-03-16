import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = await request.json()

    const supabase = await createClient()

    const emailParts = email.split('@')
    if (emailParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const domain = emailParts[1]
    const domainParts = domain.split('.')
    const universityDomain = domainParts.length > 2 ? 
      domainParts.slice(-2).join('.') : 
      domain                             

   //Since we are soft deleting, im checking to see if their account exists and if its soft deleted or not
   //If it is we will just reactivate the acount
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('email, deleted')
      .eq('email', email)
      .single()

    if (existingUser && !existingUser.deleted) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    //This is gonna verify the university email domain, we are trying to match it to whatever we pull from the provided users email
    const { data: universityData, error: universityError } = await supabase
      .from('universities')
      .select('university_id')
      .ilike('web_url', `%${universityDomain}%`)
      .single()

    if (universityError) {
      return NextResponse.json(
        { error: 'Could not verify university email domain' },
        { status: 400 }
      )
    }
//This is from the docs
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect_to=/home`,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (existingUser && existingUser.deleted) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          deleted: false,
          first_name: firstName,
          last_name: lastName,
          university_id: universityData.university_id,
          registration_date: new Date().toISOString(),
        })
        .eq('email', email)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reactivate user record' },
          { status: 500 }
        )
      }
    } else {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          university_id: universityData.university_id,
          registration_date: new Date().toISOString(),
          deleted: false,
        })

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: 'Check your email for the confirmation link',
        user: data.user 
      },
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
