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
  const [workoutId, setWorkoutId] = useState(null);
  const router = useRouter();
  const [restTime, setRestTime] = useState(60); // Default rest time in seconds
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    fetchCurrentWorkout();
  }, []);

  useEffect(() => {
    let interval;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (restTime === 0) {
      setIsResting(false);
      setRestTime(60); // Reset to default rest time
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  async function fetchCurrentWorkout() {
    const workoutData = localStorage.getItem('workoutData');
    console.log('Retrieved workout data:', workoutData);
    
    if (!workoutData) {
      setError('No workout data found. Please start a new workout.');
      setLoading(false);
      return;
    }
  
    const { workoutId, exercises } = JSON.parse(workoutData);
    setWorkoutId(workoutId);
  
    try {
      // Fetch the existing workout
      const { data: existingWorkout, error: workoutError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (*),
            sets (*)
          )
        `)
        .eq('workout_id', workoutId)
        .single();
  
      if (workoutError) throw workoutError;
  
      console.log('Fetched existing workout:', existingWorkout);
  
      // Merge the fetched workout data with the exercises from localStorage
      const mergedExercises = existingWorkout.workout_exercises.map(we => {
        const localExercise = exercises.find(e => e.exercise_id === we.exercise_id);
        return {
          ...we,
          ...localExercise,
          exercises: we.exercises, // Keep the exercises data from the database
          sets: we.sets || [] // Ensure sets is always an array
        };
      });
  
      setCurrentWorkout({ ...existingWorkout, exercises: mergedExercises });
    } catch (error) {
      console.error('Error in fetchCurrentWorkout:', error);
      setError(`Failed to fetch workout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function logSet() {
    if (!workoutId || !currentWorkout || !currentWorkout.exercises[currentExerciseIndex]) {
      console.error('No current workout or exercise');
      setError('No active workout found. Please start a new workout.');
      return;
    }
  
    const currentExercise = currentWorkout.exercises[currentExerciseIndex];
    
    const newSet = {
      set_id: uuidv4(),
      workout_exercise_id: currentExercise.workout_exercise_id,
      reps: parseInt(reps, 10),
      weight: parseFloat(weight),
      rest_time: null,
      status: 'completed',
    };
  
    console.log('New set object:', JSON.stringify(newSet, null, 2));
  
    const { data, error } = await supabase.from('sets').insert(newSet);
    if (error) {
      console.error('Supabase Error:', error.message, error.details);
      setError(`Failed to log set: ${error.message}`);
    } else {
      console.log('Set logged successfully');
      
      // Update the local state
      setCurrentWorkout(prevWorkout => {
        const updatedExercises = [...prevWorkout.exercises];
        updatedExercises[currentExerciseIndex] = {
          ...updatedExercises[currentExerciseIndex],
          sets: Array.isArray(updatedExercises[currentExerciseIndex].sets) 
            ? [...updatedExercises[currentExerciseIndex].sets, newSet]
            : [newSet]
        };
        return { ...prevWorkout, exercises: updatedExercises };
      });
  
      setCompletedSets(prev => [
        ...prev,
        {
          ...newSet,
          exerciseName: currentExercise.exercises.name,
          setNumber: currentSetIndex + 1
        }
      ]);
  
      if (currentSetIndex < currentExercise.sets - 1) {
        setCurrentSetIndex(currentSetIndex + 1);
      } else if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      } else {
        await finishWorkout();
      }
      
      setIsResting(true);
      setWeight('');
      setReps('');
    }
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
    if (!workoutId) {
      console.error('No current workout to finish');
      return;
    }

    const { error } = await supabase
      .from('workouts')
      .update({
        status: 'completed',
        end_time: new Date().toLocaleString('en-US', { timeZone: 'UTC' }),
        duration: null, // You can calculate and set the duration here if needed
      })
      .eq('workout_id', workoutId);

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
        <h2 className="text-xl font-semibold">{currentExercise.exercises.name}</h2>
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
        className={`bg-green-500 text-white p-2 rounded mb-4 ${isResting ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isResting}
      >
        {isResting ? `Rest (${restTime}s)` : 'Log Set'}
      </button>
  
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Completed Sets</h2>
        {completedSets.map((set, index) => (
          <div key={set.set_id} className="p-2 border rounded mb-2">
            <p>{set.exerciseName} - Set {set.setNumber}</p>
            <p>{set.reps} reps @ {set.weight} lbs</p>
          </div>
        ))}
      </div>
  
      {currentExerciseIndex === currentWorkout.exercises.length - 1 &&
        currentSetIndex === currentExercise.sets - 1 && (
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