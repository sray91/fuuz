'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '../utils/supabase-browser';
import Image from 'next/image';
import Link from 'next/link';

const muscleIcons = {
  Quadriceps: '/quads.png',
  Hamstrings: '/hamstrings.png',
  Abs: '/abs.png',
  Chest: '/chest.png',
  Glutes: '/glutes.png',
  Back: '/back.png',
  'Lower back': '/lower-back.png',
  Shoulders: '/shoulders.png',
  Triceps: '/triceps.png',
  Biceps: '/biceps.png',
  Abductors: '/abductors.png',
  Adductors: '/adductors.png',
  Calves: '/calves.png',
  Trapezius: '/traps.png',
  Forearms: '/forearm.png',
  Neck: '/neck.png'
};

export default function DashboardPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [muscleFreshness, setMuscleFreshness] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMuscleFreshness();
  }, []);

  async function fetchMuscleFreshness() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('muscle_freshness')
        .select(`
          *,
          muscle_groups (name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Fetched muscle freshness data:', data);
      setMuscleFreshness(data);
    } catch (error) {
      console.error('Error fetching muscle freshness:', error);
      setError(`Failed to load muscle freshness: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-orange-500">
      <div className="text-2xl font-bold text-white">Loading dashboard...</div>
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-orange-500">
      <div className="text-xl text-white">{error}</div>
    </div>;
  }

  return (
    <div className="flex flex-col h-full bg-orange-500">
      <div className="p-4">
        <Link href="/workout" className="block lg:hidden w-full mb-6">
          <button className="w-full bg-purple-600 text-white py-3 px-6 rounded-full text-xl font-bold">
            Start Workout
          </button>
        </Link>
        <h2 className="text-3xl font-bold text-white mb-4">Muscle Groups</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3 overflow-y-auto">
        {muscleFreshness.map((muscle) => (
          <div key={muscle.id} className="bg-black bg-opacity-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <Image
              src={muscleIcons[muscle.muscle_groups.name]}
              alt={muscle.muscle_groups.name}
              width={48}
              height={48}
              className="mb-2"
            />
            <span className="text-white text-sm font-semibold text-center">{muscle.muscle_groups.name}</span>
            <div className="text-white text-lg font-bold mt-1">{muscle.freshness}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}