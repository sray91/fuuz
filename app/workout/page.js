'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

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
    setSelectedExercises(prev => {
      const isExerciseInList = prev.some(e => e.exercise_id === exercise.exercise_id);
      if (isExerciseInList) {
        console.log('Exercise already in list, not adding');
        return prev;
      }
      const newExercise = { ...exercise, sets: 3, reps: 10 };
      console.log('Adding new exercise:', newExercise);
      return [...prev, newExercise];
    });
  }, []);

  const updateExerciseDetails = useCallback((exerciseId, field, value) => {
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      setSelectedExercises(prev =>
        prev.map(ex =>
          ex.exercise_id === exerciseId ? { ...ex, [field]: numericValue } : ex
        )
      );
    } else {
      console.warn(`Invalid ${field} value: ${value}`);
    }
  }, []);

  const deleteExercise = useCallback((exerciseId) => {
    setSelectedExercises(prev => prev.filter(ex => ex.exercise_id !== exerciseId));
  }, []);

  async function startWorkout() {
    console.log('Starting workout with:', selectedExercises);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }
  
      const workoutId = uuidv4();
      const currentDate = new Date();
      
      // Create the workout
      const { data: insertedWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          workout_id: workoutId,
          user_id: user.id,
          date: currentDate.toLocaleString('en-US', { timeZone: 'UTC' }),
          duration: null,
          status: 'in_progress',
        })
        .select()
        .single();
  
      if (workoutError) throw workoutError;
  
      console.log('Inserted workout:', insertedWorkout);
  
      // Create workout exercises
      for (let i = 0; i < selectedExercises.length; i++) {
        const exercise = selectedExercises[i];
        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_exercise_id: uuidv4(),
            workout_id: workoutId,
            exercise_id: exercise.exercise_id,
            order_in_workout: i + 1,
          });
  
        if (exerciseError) throw exerciseError;
      }
  
      // Store workout data in localStorage
      localStorage.setItem('workoutData', JSON.stringify({
        workoutId: workoutId,
        exercises: selectedExercises
      }));
  
      router.push('/workout-session');
    } catch (error) {
      console.error('Error starting workout:', error);
      setError(`Failed to start workout: ${error.message}`);
    }
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
    <div className="flex flex-col lg:flex-row h-full overflow-y-auto">
      {/* Muscle Groups Column */}
      <div className="w-full lg:w-1/3 bg-orange-500 p-6 mb-4 lg:mb-0">
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
      <div className="w-full lg:w-1/3 bg-gray-50 p-6 mb-4 lg:mb-0">
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
      <div className="w-full lg:w-1/3 bg-white p-6">
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
                    min="1"
                  />
                  <input
                    type="number"
                    value={exercise.reps}
                    onChange={(e) => updateExerciseDetails(exercise.exercise_id, 'reps', e.target.value)}
                    className="w-20 p-2 border rounded text-black"
                    placeholder="Reps"
                    min="1"
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