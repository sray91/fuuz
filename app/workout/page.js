'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation';

export default function WorkoutPlanningPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchMuscleGroups();
  }, []);

  useEffect(() => {
    console.log('Selected exercises updated:', selectedExercises);
  }, [selectedExercises]);

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
    if (muscleGroup && muscleGroup.muscle_group_id) {
      fetchExercisesForMuscleGroup(muscleGroup.muscle_group_id);
    } else {
      console.error('Invalid muscle group selected:', muscleGroup);
    }
  }

  const addExercise = useCallback((exercise) => {
    console.log('Attempting to add exercise:', exercise);
    setSelectedExercises(prev => {
      const isExerciseInList = prev.some(e => e.exercise_id === exercise.exercise_id);
      console.log('Is exercise already in list?', isExerciseInList);
      
      if (isExerciseInList) {
        console.log('Exercise already in list, not adding');
        return prev;
      }
      
      const newExercise = { ...exercise, sets: 3, reps: 10 };
      const newList = [...prev, newExercise];
      console.log('New selected exercises list:', newList);
      return newList;
    });
  }, []);

  const updateExerciseDetails = useCallback((exerciseId, field, value) => {
    setSelectedExercises(prev => {
      const updated = prev.map(ex =>
        ex.exercise_id === exerciseId ? { ...ex, [field]: parseInt(value) } : ex
      );
      console.log('Updated exercise details:', updated);
      return updated;
    });
  }, []);

  const deleteExercise = useCallback((exerciseId) => {
    setSelectedExercises(prev => {
      const filtered = prev.filter(ex => ex.exercise_id !== exerciseId);
      console.log('Deleted exercise, new list:', filtered);
      return filtered;
    });
  }, []);

  async function startWorkout() {
    console.log('Starting workout with:', selectedExercises);
  
    // Convert the selected exercises to a string format to pass as a query parameter
    const workoutData = JSON.stringify(selectedExercises);
  
    // Navigate to the workout session page and pass the workout data as a query parameter
    router.push(`/workout-session?workout=${encodeURIComponent(workoutData)}`);
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
    <div className="flex h-screen overflow-y-auto">
      {/* Muscle Groups Column */}
      <div className="w-1/3 bg-orange-500 p-6 overflow-y-auto">
        <h1 className='text-white text-2xl font-bold mb-4'>Muscle Groups</h1>
        <div className="space-y-2">
          {muscleGroups.map(group => (
            <button
              key={group.muscle_group_id}
              onClick={() => selectMuscleGroup(group)}
              className={`w-full text-left text-white text-xl py-2 px-4 rounded transition-colors ${
                selectedMuscleGroup?.muscle_group_id === group.muscle_group_id
                  ? 'bg-orange-700'
                  : 'hover:bg-orange-600'
              }`}
            >{group.name}</button>
          ))}
        </div>
      </div>

      {/* Exercises Column */}
      <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto">
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
                    key={exercise.exercise_id}
                    className="bg-white p-4 rounded shadow-md hover:shadow-lg transition-shadow flex justify-between items-center"
                  >
                    <h3 className="text-lg font-semibold text-black">{exercise.name}</h3>
                    <button
                      onClick={() => addExercise(exercise)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-black">No exercises found for this muscle group.</p>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Select a muscle group to see exercises
          </div>
        )}
      </div>

      {/* Selected Exercises Column */}
      <div className="w-1/3 bg-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-blue-300">Selected Exercises</h2>
        {selectedExercises.length > 0 ? (
          <>
            {selectedExercises.map(exercise => (
              <div key={exercise.exercise_id} className="mb-4 p-4 bg-gray-100 rounded relative">
                <h3 className="text-lg font-semibold mb-2 text-black">{exercise.name}</h3>
                <div className="flex space-x-4 mb-2">
                  <input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => updateExerciseDetails(exercise.exercise_id, 'sets', e.target.value)}
                    className="w-20 p-2 border rounded text-black"
                    placeholder="Sets"
                  />
                  <input
                    type="number"
                    value={exercise.reps}
                    onChange={(e) => updateExerciseDetails(exercise.exercise_id, 'reps', e.target.value)}
                    className="w-20 p-2 border rounded text-black"
                    placeholder="Reps"
                  />
                </div>
                <button
                  onClick={() => deleteExercise(exercise.exercise_id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={startWorkout}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
            >
              Start Workout
            </button>
          </>
        ) : (
          <p className="text-center py-4 text-gray-500">
            Select exercises to build your workout
          </p>
        )}
      </div>
    </div>
  );
}