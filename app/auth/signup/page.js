'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing up:', error.message);
    } else {
      // Redirect or update UI
      router.push('/');    }
  };

  return (
    <div className='flex flex-col items-center'>
      <form onSubmit={handleSignUp}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=" Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" Password"
          required
        />
        <button type="submit" className='flex bg-purple-500 rounded-lg p-6'>Sign Up</button>
      </form>
    </div>
  );
}