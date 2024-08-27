'use client';

import { useState, useEffect } from 'react';
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
      // Fetch authenticated user securely
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching authenticated user:', userError.message);
        return;
      }

      if (user) {
        // Redirect to the main page after successful sign-in
        router.push('/');
      } else {
        console.error('No user data found.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
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
        <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded-lg">
          Sign In
        </button>
      </form>
    </div>
  );
}