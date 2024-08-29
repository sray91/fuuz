'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation';
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
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const workoutData = localStorage.getItem('workoutData');
    console.log('Retrieved workout data:', workoutData);
    if (workoutData) {
      fetchCurrentWorkout(JSON.parse(workoutData));
    } else {
      setError('No workout data found. Please start a new workout.');
      setLoading(false);
    }
  }, []);

  async function fetchCurrentWorkout(parsedWorkout) {
    console.log('Fetching current workout...');
    console.log('Parsed workout:', parsedWorkout);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      const workoutId = uuidv4();
      const { data: insertedWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          workout_id: workoutId,
          user_id: user.id,
          date: new Date().toISOString(),
          duration: null,
          status: 'in_progress',
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      console.log('Inserted workout:', insertedWorkout);

      for (let i = 0; i < parsedWorkout.length; i++) {
        const exercise = parsedWorkout[i];
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

      setCurrentWorkout({ ...insertedWorkout, exercises: parsedWorkout });
    } catch (error) {
      console.error('Error in fetchCurrentWorkout:', error);
      setError(`Failed to initialize workout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function logSet() {
    if (!currentWorkout || !currentWorkout.exercises[currentExerciseIndex]) {
      console.error('No current workout or exercise');
      return;
    }
  
    const currentExercise = currentWorkout.exercises[currentExerciseIndex];
    const workoutExerciseId = await fetchWorkoutExerciseId(currentWorkout.workout_id, currentExercise.exercise_id);
  
    if (!workoutExerciseId) {
      console.error('Failed to fetch workout exercise ID');
      return;
    }
  
    const newSet = {
      set_id: uuidv4(),
      workout_exercise_id: workoutExerciseId,
      reps: parseInt(reps, 10),
      weight: parseFloat(weight),
      rest_time: null,
      status: 'completed',
    };

    console.log('New set object:', JSON.stringify(newSet, null, 2));

    const { data, error } = await supabase.from('sets').insert(newSet);
    if (error) {
      console.error('Supabase Error:', error.message, error.details);
    } else {
      console.log('Set logged successfully');
    }
  
    setCompletedSets((prev) => [
      ...prev,
      { ...newSet, exerciseName: currentExercise.name, setNumber: currentSetIndex + 1 },
    ]);
  
    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    } else {
      await finishWorkout();
    }
  
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
    if (!currentWorkout) {
      console.error('No current workout to finish');
      return;
    }

    const { error } = await supabase
      .from('workouts')
      .update({
        status: 'completed',
        duration: null, // You can calculate and set the duration here
      })
      .eq('workout_id', currentWorkout.workout_id);

    if (error) {
      console.error('Error finishing workout:', error);
      return;
    }

    console.log('Workout completed!');
    router.push('/workout-history');
  }

  if (loading) return <div>Loading workout... Please wait.</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!currentWorkout) return <div>No workout data available. Please start a new workout.</div>;

  const currentExercise = currentWorkout.exercises[currentExerciseIndex];
  if (!currentExercise) return <div>No exercises found in the workout.</div>;

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
          className="w-24 p-2 border rounded mr-2 text-black"
          placeholder="Weight (lbs)"
        />
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-24 p-2 border rounded text-black"
          placeholder="Reps"
        />
      </div>
      <button
        onClick={logSet}
        className="bg-green-500 text-white p-2 rounded mb-4"
      >
        Log Set
      </button>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Completed Sets</h2>
        {completedSets.map((set, index) => (
          <div key={index} className="p-2 border rounded mb-2">
            <p>{set.exerciseName} - Set {set.setNumber}</p>
            <p>{set.reps} reps @ {set.weight} lbs</p>
          </div>
        ))}
      </div>

      {currentExerciseIndex === currentWorkout.exercises.length - 1 &&
        currentSetIndex === currentExercise.sets && (
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