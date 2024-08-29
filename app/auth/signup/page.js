'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import Image from 'next/image';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing up:', error.message);
    } else {
      // Optionally, fetch the authenticated user securely
      const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching authenticated user:', userError.message);
      } else if (authenticatedUser) {
        // Redirect to the main page after successful sign-up and authentication
        router.push('/');
      } else {
        console.error('No authenticated user found.');
      }
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <form onSubmit={handleSignUp} className='flex flex-col space-y-4'>
        <Image src="/fuuz logo.png" alt="logo" width={150} height={150} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="px-4 py-2 rounded border border-gray-300"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="px-4 py-2 rounded border border-gray-300"
        />
        <button type="submit" className='bg-purple-500 text-white px-4 py-2 rounded-lg'>
          Sign Up
        </button>
      </form>
    </div>
  );
}
