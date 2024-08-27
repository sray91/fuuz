'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation';

export default function WorkoutPlanningPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchMuscleGroups();
  }, []);

  async function fetchMuscleGroups() {
    try {
      const { data, error } = await supabase.from('muscle_groups').select('*');
      if (error) throw error;
      setMuscleGroups(data);
    } catch (error) {
      console.error('Error fetching muscle groups:', error);
      setError('Failed to load muscle groups. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchExercisesForMuscleGroup(muscleGroupId) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('muscle_group_id', muscleGroupId);
      if (error) throw error;
      setExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setError('Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function selectMuscleGroup(muscleGroup) {
    setSelectedMuscleGroup(muscleGroup);
    fetchExercisesForMuscleGroup(muscleGroup.id);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-orange-500">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-orange-500">
        <div className="text-white text-2xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Muscle Groups Column */}
      <div className="w-1/2 bg-orange-500 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Plan Your Workout</h1>
        <div className="space-y-2">
          {muscleGroups.map(group => (
            <button
              key={group.id}
              onClick={() => selectMuscleGroup(group)}
              className={`w-full text-left text-white text-xl py-2 px-4 rounded transition-colors ${
                selectedMuscleGroup?.id === group.id
                  ? 'bg-orange-700'
                  : 'hover:bg-orange-600'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Column */}
      <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
        {selectedMuscleGroup ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-blue-300">
              {selectedMuscleGroup.name} Exercises
            </h2>
            {loading ? (
              <div className="text-center py-4">Loading exercises...</div>
            ) : exercises.length > 0 ? (
              <div className="space-y-2">
                {exercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className="bg-white p-4 rounded shadow-md hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-semibold">{exercise.name}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4">No exercises found for this muscle group.</p>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Select a muscle group to see exercises
          </div>
        )}
      </div>
    </div>
  );
}