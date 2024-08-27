'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { createBrowserSupabaseClientInstance } from '../utils/supabase-browser';
import Image from 'next/image';

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
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMuscleGroups();
    }
  }, [user]);

  async function fetchUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;

      if (!user) {
        // If no user is found, redirect to the sign-in page
        router.push('/auth/signin');
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data. Please try again.');
      // Redirect to sign-in if there's an error fetching the user
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMuscleGroups() {
    try {
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
      console.error('Error fetching muscle groups:', error);
      setError('Failed to load muscle group data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-bold text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="w-3/4 bg-orange-500 p-6 overflow-y-auto">
        <h2 className="text-4xl font-bold text-white mb-8">Fresh Muscle Groups</h2>
        <div className="grid grid-cols-2 gap-6">
          {muscleGroups.map((muscle) => (
            <div key={muscle.id} className="bg-black rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Image
                  src={muscleIcons[muscle.name]}
                  alt={muscle.name}
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
                <span className="text-white text-xl ml-4">{muscle.name}</span>
              </div>
              <div className="text-white text-2xl font-bold">{muscle.freshness}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
