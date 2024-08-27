'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function ActiveWorkoutSessionPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCurrentWorkout();
  }, []);

  async function fetchCurrentWorkout() {
    const workoutData = searchParams.get('workout');
    if (workoutData) {
      const parsedWorkout = JSON.parse(workoutData);
      setCurrentWorkout({ exercises: parsedWorkout });
      setLoading(false);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not found');
        return;
      }

      // Insert the workout into the workouts table
      const workoutId = uuidv4();  // Generate a UUID for the workout

      await supabase.from('workouts').insert({
        workout_id: workoutId,
        user_id: user.id,
        date: new Date(),
        duration: null, // Can update this at the end
        status: 'in-progress',
      });

      // Insert each exercise into the workout_exercises table
      for (let i = 0; i < parsedWorkout.length; i++) {
        const exercise = parsedWorkout[i];
        await supabase.from('workout_exercises').insert({
          workout_exercise_id: uuidv4(),
          workout_id: workoutId,
          exercise_id: exercise.exercise_id,
          order_in_workout: i + 1,
        });
      }

      // Store the workout ID in state to be used later
      setCurrentWorkout((prev) => ({ ...prev, workoutId }));
    } else {
      console.error('No workout data found.');
      setLoading(false);
    }
  }

  async function logSet() {
    const currentExercise = currentWorkout.exercises[currentExerciseIndex];
    const workoutExerciseId = await fetchWorkoutExerciseId(currentWorkout.workoutId, currentExercise.exercise_id);

    // Insert the set data into the sets table
    const newSet = {
      set_id: uuidv4(),
      workout_exercise_id: workoutExerciseId,
      reps: parseInt(reps, 10),
      weight: parseFloat(weight),
      rest_time: null, // You can calculate this if you want to track rest time
      status: 'completed',
    };
    await supabase.from('sets').insert(newSet);

    // Add the set to the completed sets
    setCompletedSets((prev) => [
      ...prev,
      { ...newSet, exerciseName: currentExercise.name, setNumber: currentSetIndex + 1 },
    ]);

    // Move to next set or exercise
    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    } else {
      // Workout complete
      setCurrentSetIndex(currentSetIndex + 1); // Just to trigger a rerender for the "Finish Workout" button
    }

    // Reset inputs
    setWeight('');
    setReps('');
  }

  async function fetchWorkoutExerciseId(workoutId, exerciseId) {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('workout_exercise_id')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .single();

    if (error) {
      console.error('Error fetching workout exercise ID:', error);
      return null;
    }

    return data.workout_exercise_id;
  }

  async function finishWorkout() {
    // Update workout status to 'completed' and duration
    await supabase
      .from('workouts')
      .update({
        status: 'completed',
        duration: null, // You can calculate and set the duration here
      })
      .eq('workout_id', currentWorkout.workoutId);

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
        className="bg-green-500 text-white p-2 rounded mb-4"
      >
        Log Set
      </button>

      {/* Display Completed Sets */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Completed Sets</h2>
        {completedSets.map((set, index) => (
          <div key={index} className="p-2 border rounded mb-2">
            <p>{set.exerciseName} - Set {set.setNumber}</p>
            <p>{set.reps} reps @ {set.weight} lbs</p>
          </div>
        ))}
      </div>

      {/* Show Finish Workout Button */}
      {currentExerciseIndex === currentWorkout.exercises.length - 1 &&
        currentSetIndex === currentExercise.sets &&
        (
          <button
            onClick={finishWorkout}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Finish Workout
          </button>
        )}
    </div>
  );
}