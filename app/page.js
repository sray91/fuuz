'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '../utils/supabase-browser';
import Link from 'next/link';
import Image from 'next/image';

const muscleIcons = {
  Quads: '🦵',
  Hamstrings: '🦵',
  Abs: '🦵',
  Chest: '💪',
  Glutes: '🍑',
  Back: '🔙',
  'Lower back': '⬇️',
  Shoulders: '💪',
  Triceps: '💪',
  Biceps: '💪',
};

export default function DashboardPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [user, setUser] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data. Please try again.');
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
          <div className="text-4xl font-bold mr-2">⚡</div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
            FUUZ
          </h1>
        </div>
        <div className="flex items-center mb-8">
          <Image
            src="/avatar-placeholder.png"
            alt="User Avatar"
            width={50}
            height={50}
            className="rounded-full mr-4"
          />
          <p className="text-xl">Hello, {user?.email}</p>
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
          <Link href="/gym-settings" className="bg-purple-600 text-white py-3 px-6 rounded-full text-center hover:bg-purple-700 transition-colors">
            Gym settings
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="w-3/4 bg-orange-500 p-6 overflow-y-auto">
        <h2 className="text-4xl font-bold text-white mb-8">Fresh Muscle Groups</h2>
        <div className="grid grid-cols-2 gap-6">
          {muscleGroups.map((muscle) => (
            <div key={muscle.id} className="bg-black bg-opacity-20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-300 rounded-lg mr-4 flex items-center justify-center text-4xl">
                  {muscleIcons[muscle.name] || '💪'}
                </div>
                <span className="text-white text-xl">{muscle.name}</span>
              </div>
              <div className="text-white text-2xl font-bold">{muscle.freshness}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
