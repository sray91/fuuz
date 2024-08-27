'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation';

export default function ActiveWorkoutSessionPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCurrentWorkout();
  }, []);

  async function fetchCurrentWorkout() {
    // In a real app, you'd fetch the current workout from your database
    // For now, we'll use mock data
    const mockWorkout = {
      id: 1,
      exercises: [
        { id: 1, name: 'Bench Press', sets: 3, reps: 10 },
        { id: 2, name: 'Squats', sets: 3, reps: 12 },
        { id: 3, name: 'Pull-ups', sets: 3, reps: 8 },
      ]
    };
    setCurrentWorkout(mockWorkout);
    setLoading(false);
  }

  function logSet() {
    // Here you would save the completed set to your database
    console.log('Logging set:', { 
      exercise: currentWorkout.exercises[currentExerciseIndex].name, 
      set: currentSetIndex + 1, 
      weight, 
      reps 
    });

    // Move to next set or exercise
    if (currentSetIndex < currentWorkout.exercises[currentExerciseIndex].sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    } else {
      // Workout complete
      finishWorkout();
    }

    // Reset inputs
    setWeight('');
    setReps('');
  }

  function finishWorkout() {
    // Here you would mark the workout as complete in your database
    console.log('Workout completed!');
    router.push('/workout-history');
  }

  if (loading) return <div>Loading workout...</div>;

  const currentExercise = currentWorkout.exercises[currentExerciseIndex];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Active Workout</h1>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{currentExercise.name}</h2>
        <p>Set {currentSetIndex + 1} of {currentExercise.sets}</p>
      </div>
      <div className="mb-4">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-24 p-2 border rounded mr-2"
          placeholder="Weight (lbs)"
        />
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-24 p-2 border rounded"
          placeholder="Reps"
        />
      </div>
      <button
        onClick={logSet}
        className="bg-green-500 text-white p-2 rounded"
      >
        Log Set
      </button>
    </div>
  );
}