'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';

export default function SignOut() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    } else {
      // Redirect or update UI
      router.push('/signin');
    }
  }

  return (
    <button onClick={handleSignOut} className="bg-orange-500 text-white py-3 px-6 font-bold rounded-full text-center hover:bg-purple-700 transition-colors">Sign Out</button>
  )
}