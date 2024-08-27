'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Error signing in:', error.message);
    } else {
        // Redirect to the main page after successful sign-up
        router.push('/');
      }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <form onSubmit={handleSignIn} className='flex'>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=" Email"
          required
          className=''
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" Password"
          required
        />
        <button type="submit" className='flex bg-purple-500 p-6 rounded-lg'>Sign In</button>
      </form>
    </div>
  );
}
