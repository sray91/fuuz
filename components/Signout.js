'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '../../utils/supabase-browser'

export default function SignOut() {
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    } else {
      // Redirect or update UI
      console.log('Signed out successfully!')
    }
  }

  return (
    <button onClick={handleSignOut}>Sign Out</button>
  )
}