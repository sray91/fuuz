'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { createBrowserSupabaseClientInstance } from '../utils/supabase-browser';
import Link from 'next/link';
import Image from 'next/image';
import SignOut from '@/components/Signout';

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
        router.push('/signin');
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data. Please try again.');
      // Redirect to sign-in if there's an error fetching the user
      router.push('/signin');
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
      {/* Left Sidebar */}
      <div className="w-1/4 bg-white p-6 flex flex-col">
        <div className="flex items-center mb-8">
          <Image
            src="/fuuz logo.png"
            alt="logo"
            width={200}
            height={200}
            className=""
          />
        </div>
        <div className="flex items-center mb-8">
          <Image
            src="/avatar-placeholder.png"
            alt="User Avatar"
            width={50}
            height={50}
            className="rounded-full mr-4"
          />
          <p className="text-xl text-black">Hello, {user?.email}</p>
        </div>
        <nav className="flex flex-col space-y-4">
          <Link href="/workout" className="bg-purple-600 text-white py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors">
            Workout
          </Link>
          <Link href="/workout-history" className="bg-purple-600 text-white py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors">
            Workout history
          </Link>
          <Link href="/goals" className="bg-purple-600 text-white py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors">
            Goals
          </Link>
          <Link href="/settings" className="bg-purple-600 text-white py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors">
            Gym settings
          </Link>
          <SignOut />
        </nav>
      </div>

      {/* Main Content */}
      <div className="w-3/4 bg-orange-500 p-6 overflow-y-auto">
        <h2 className="text-4xl font-bold text-white mb-8">Fresh Muscle Groups</h2>
        <div className="grid grid-cols-2 gap-6">
          {muscleGroups.map((muscle) => (
            <div key={muscle.id} className="bg-black p-4 flex items-center justify-between">
              <div className="flex items-center justify-center text-4xl">
                <Image
                  src={muscleIcons[muscle.name]}
                  alt="muscle icons"
                  width={75}
                  height={75}
                  className=""
                />
              </div>
              <div className="flex flex-wrap">
                <span className="flex text-white text-xl">{muscle.name} </span>
                <div className="flex text-white text-2xl font-bold">{muscle.freshness}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
