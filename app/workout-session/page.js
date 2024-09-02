'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { updateMuscleFreshness } from '@/utils/muscle-freshness'; // Import the new function

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
  const [restTime, setRestTime] = useState(60);
  const [isResting, setIsResting] = useState(false);
  const [editableRestTime, setEditableRestTime] = useState('60');
  const router = useRouter();

  // New state for adding exercises
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [availableExercises, setAvailableExercises] = useState([]);

  useEffect(() => {
    fetchCurrentWorkout();
    fetchMuscleGroups();
  }, []);

  useEffect(() => {
    let interval;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (restTime === 0) {
      setIsResting(false);
      setRestTime(parseInt(editableRestTime, 10));
    }
    return () => clearInterval(interval);
  }, [isResting, restTime, editableRestTime]);

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
      const { data: existingWorkout, error: workoutError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('workout_id', workoutId)
        .single();
  
      if (workoutError) throw workoutError;
  
      console.log('Fetched existing workout:', existingWorkout);
  
      const mergedExercises = existingWorkout.workout_exercises.map(we => ({
        ...we,
        sets: 3, // Default to 3 sets (managed in component state, not from database)
        exercises: we.exercises // This correctly references the nested exercises data
      }));
  
      setCurrentWorkout({ ...existingWorkout, exercises: mergedExercises });
    } catch (error) {
      console.error('Error in fetchCurrentWorkout:', error);
      setError(`Failed to fetch workout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMuscleGroups() {
    try {
      const { data, error } = await supabase.from('muscle_groups').select('*');
      if (error) throw error;
      setMuscleGroups(data);
    } catch (error) {
      console.error('Error fetching muscle groups:', error);
      setError('Failed to load muscle groups. Please try again.');
    }
  }

  async function fetchExercisesForMuscleGroup(muscleGroupId) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('muscle_group_id', muscleGroupId);
      if (error) throw error;
      setAvailableExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setError('Failed to load exercises. Please try again.');
    }
  }

  async function addExerciseToWorkout(exercise) {
    try {
      const newWorkoutExercise = {
        workout_exercise_id: uuidv4(),
        workout_id: workoutId,
        exercise_id: exercise.exercise_id,
        order_in_workout: currentWorkout.exercises.length + 1,
      };
  
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert(newWorkoutExercise);
  
      if (error) throw error;
  
      // Create a new exercise object that includes both workout_exercise and exercise data
      const newExercise = {
        ...newWorkoutExercise,
        exercises: exercise, // This holds the exercise details
        sets: 3, // Default number of sets (managed in component state, not in database)
      };
  
      setCurrentWorkout(prevWorkout => ({
        ...prevWorkout,
        exercises: [...prevWorkout.exercises, newExercise]
      }));
  
      setShowAddExercise(false);
    } catch (error) {
      console.error('Error adding exercise:', error);
      setError(`Failed to add exercise: ${error.message}`);
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
      rest_time: parseInt(editableRestTime, 10),
      status: 'completed',
    };
  
    console.log('New set object:', JSON.stringify(newSet, null, 2));
  
    try {
      // Insert the new set
      const { data, error } = await supabase.from('sets').insert(newSet);
      if (error) throw error;
  
      console.log('Set logged successfully');
  
      // Update user_max if necessary
      if (parseFloat(weight) > (currentExercise.exercises.user_max || 0)) {
        const { error: updateError } = await supabase
          .from('exercises')
          .update({ user_max: parseFloat(weight) })
          .eq('exercise_id', currentExercise.exercises.exercise_id);
  
        if (updateError) {
          console.error('Error updating user_max:', updateError);
        } else {
          console.log('Updated user_max for exercise');
          // Update the local state to reflect the new user_max
          setCurrentWorkout(prevWorkout => ({
            ...prevWorkout,
            exercises: prevWorkout.exercises.map(ex =>
              ex.exercise_id === currentExercise.exercises.exercise_id
                ? { ...ex, exercises: { ...ex.exercises, user_max: parseFloat(weight) } }
                : ex
            )
          }));
        }
      }
  
      // Update local state
      setCompletedSets(prev => [
        ...prev,
        {
          ...newSet,
          exerciseName: currentExercise.exercises.name,
          setNumber: currentSetIndex + 1
        }
      ]);
  
      // Move to next set or exercise
      const totalSets = currentExercise.sets || 3; // Default to 3 if not defined
      if (currentSetIndex < totalSets - 1) {
        setCurrentSetIndex(currentSetIndex + 1);
      } else if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      }
  
      // Reset input fields
      setWeight('');
      setReps('');
      
      // Start rest timer
      setIsResting(true);
      setRestTime(parseInt(editableRestTime, 10));
  
    } catch (error) {
      console.error('Error logging set:', error);
      setError(`Failed to log set: ${error.message}`);
    }
  }

  async function finishWorkout() {
    if (!workoutId) {
      console.error('No current workout to finish');
      setError('No active workout found. Please start a new workout.');
      return;
    }
  
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
  
      const startTime = new Date(currentWorkout.start_time);
      const endTime = new Date();
      const duration = endTime - startTime; // Duration in milliseconds
  
      const { error } = await supabase
        .from('workouts')
        .update({
          status: 'completed',
          end_time: endTime.toISOString(),
          duration: duration,
        })
        .eq('workout_id', workoutId);
  
      if (error) throw error;
  
      console.log('Workout completed. Updating muscle freshness...');
      await updateMuscleFreshness(user.id);
      console.log('Muscle freshness updated successfully');
  
      // Clear local storage
      localStorage.removeItem('workoutData');
  
      console.log('Workout completed and muscle freshness updated!');
      router.push('/workout-history');
    } catch (error) {
      console.error('Error finishing workout:', error);
      setError(`Failed to finish workout: ${error.message}`);
    }
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
          className="w-24 p-2 border rounded mr-2 text-black"
          placeholder="Reps"
        />
        <input
          type="number"
          value={editableRestTime}
          onChange={(e) => setEditableRestTime(e.target.value)}
          className="w-24 p-2 border rounded text-black"
          placeholder="Rest Time (s)"
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
          <div key={set.set_id || index} className="p-2 border rounded mb-2">
            <p>{set.exerciseName || 'Exercise'} - Set {set.setNumber || index + 1}</p>
            <p>{set.reps} reps @ {set.weight} lbs</p>
            <p>Rest time: {set.rest_time}s</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAddExercise(true)}
        className="bg-blue-500 text-white p-2 rounded mb-4 mr-2"
      >
        Add Exercise
      </button>

      <button
        onClick={finishWorkout}
        className="bg-red-500 text-white p-2 rounded mb-4"
      >
        Finish Workout
      </button>

      {showAddExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-black">Add Exercise</h2>
            <select
              className="w-full p-2 mb-4 border rounded text-black"
              onChange={(e) => {
                setSelectedMuscleGroup(e.target.value);
                fetchExercisesForMuscleGroup(e.target.value);
              }}
            >
              <option value="">Select Muscle Group</option>
              {muscleGroups.map(group => (
                <option key={group.muscle_group_id} value={group.muscle_group_id}>
                  {group.name}
                </option>
              ))}
            </select>
            {availableExercises.length > 0 && (
              <div className="mb-4">
                {availableExercises.map(exercise => (
                  <button
                    key={exercise.exercise_id}
                    onClick={() => addExerciseToWorkout(exercise)}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded text-black"
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddExercise(false)}
              className="w-full bg-gray-300 text-black p-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}