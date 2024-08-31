'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClientInstance } from '../utils/supabase-browser';
import { updateMuscleFreshness } from '@/utils/muscle-freshness';
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
  const [user, setUser] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      updateFreshnessAndFetchMuscleGroups();
    }
  }, [user]);

  async function fetchUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (!user) {
        router.push('/auth/signin');
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data. Please try again.');
      router.push('/auth/signin');
    }
  }

  async function updateFreshnessAndFetchMuscleGroups() {
    try {
      setLoading(true);
      await updateMuscleFreshness(user.id);

      const { data: muscleGroupsData, error: muscleGroupsError } = await supabase
        .from('muscle_groups')
        .select('*');
      if (muscleGroupsError) throw muscleGroupsError;

      const { data: freshnessData, error: freshnessError } = await supabase
        .from('muscle_freshness')
        .select('*')
        .eq('user_id', user.id);
      if (freshnessError) throw freshnessError;

      const freshnessByMuscleGroup = freshnessData.reduce((acc, item) => {
        acc[item.muscle_group_id] = item.freshness;
        return acc;
      }, {});

      const muscleGroupsWithFreshness = muscleGroupsData.map((group) => ({
        ...group,
        freshness: freshnessByMuscleGroup[group.id] || 100,
      }));

      setMuscleGroups(muscleGroupsWithFreshness);
    } catch (error) {
      console.error('Error updating freshness and fetching muscle groups:', error);
      setError('Failed to load muscle group data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-orange-500">
        <div className="text-2xl font-bold text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-orange-500">
        <div className="text-xl text-white">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-orange-500">
      <div className="p-4">
        {/* Start Workout button - visible only on mobile */}
        <Link href="/workout" className="block lg:hidden w-full mb-6">
          <button className="w-full bg-purple-600 text-white py-3 px-6 rounded-full text-xl font-bold">
            Start Workout
          </button>
        </Link>
        <h2 className="text-3xl font-bold text-white mb-4">Muscle Groups</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3 overflow-y-auto">
        {muscleGroups.map((muscle) => (
          <div key={muscle.id} className="bg-black bg-opacity-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <Image
              src={muscleIcons[muscle.name]}
              alt={muscle.name}
              width={48}
              height={48}
              className="mb-2"
            />
            <span className="text-white text-sm font-semibold text-center">{muscle.name}</span>
            <div className="text-white text-lg font-bold mt-1">{muscle.freshness}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}