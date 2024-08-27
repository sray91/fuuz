'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '../../utils/supabase-browser'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const handleSignUp = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error signing up:', error.message)
    } else {
      // Redirect or update UI
      console.log('Check your email for the login link!')
    }
  }

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  )
}