'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function WorkoutHistoryPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [workouts, setWorkouts] = useState([]);
  const [workoutDates, setWorkoutDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutsOnSelectedDate, setWorkoutsOnSelectedDate] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [error, setError] = useState(null);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  async function fetchSetsForExercise(workoutExerciseId) {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('workout_exercise_id', workoutExerciseId);

    if (error) {
      console.error('Error fetching sets:', error.message, error.details);
      return [];
    }

    console.log(`Sets for workout_exercise_id ${workoutExerciseId}:`, data);

    return data;
  }  

  async function fetchWorkouts() {
    try {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          workout_id,
          date,
          workout_exercises (
            workout_exercise_id,
            exercise_id,
            exercises (name)
          )
        `)
        .order('date', { ascending: false });

      if (workoutsError) throw workoutsError;

      console.log("Raw Workouts Data:", JSON.stringify(workoutsData, null, 2));

      const uniqueWorkouts = new Map();

      for (const workout of workoutsData) {
        if (!uniqueWorkouts.has(workout.workout_id)) {
          const workoutWithSets = {
            ...workout,
            workout_exercises: await Promise.all(workout.workout_exercises.map(async exercise => {
              const sets = await fetchSetsForExercise(exercise.workout_exercise_id);
              return { ...exercise, sets };
            }))
          };
          uniqueWorkouts.set(workout.workout_id, workoutWithSets);
        } else {
          console.warn(`Duplicate workout_id found: ${workout.workout_id}`);
        }
      }

      const uniqueWorkoutsArray = Array.from(uniqueWorkouts.values());
      console.log("Unique Workouts:", JSON.stringify(uniqueWorkoutsArray, null, 2));

      setWorkouts(uniqueWorkoutsArray);
      const dates = uniqueWorkoutsArray.map(workout => new Date(workout.date).toDateString());
      setWorkoutDates([...new Set(dates)]);
    } catch (error) {
      console.error('Error fetching workouts:', error.message, error.details);
      setError('Failed to load workout history. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(date) {
    setSelectedDate(date);
    const selectedDateString = date.toDateString();
    const workoutsForTheDay = workouts.filter(workout => {
      return new Date(workout.date).toDateString() === selectedDateString;
    });
    setWorkoutsOnSelectedDate(workoutsForTheDay);
    setSelectedWorkout(null);
  }

  function tileContent({ date, view }) {
    if (view === 'month') {
      const dateString = date.toDateString();
      if (workoutDates.includes(dateString)) {
        return <div className="bg-green-500 w-2 h-2 rounded-full mx-auto mt-1"></div>;
      }
    }
    return null;
  }

  function selectWorkout(workout) {
    console.log("Workout selected:", workout);
    setSelectedWorkout(workout);
  }

  function goBack() {
    setSelectedWorkout(null);
  }

  async function deleteWorkout(workoutId) {
    try {
      // Start a Supabase transaction
      const { data, error } = await supabase.rpc('delete_workout', {
        workout_id_param: workoutId
      });
  
      if (error) throw error;
  
      console.log('Deletion result:', data);
  
      // Remove the deleted workout from state
      setWorkouts(workouts.filter(w => w.workout_id !== workoutId));
      setWorkoutsOnSelectedDate(workoutsOnSelectedDate.filter(w => w.workout_id !== workoutId));
      setSelectedWorkout(null);
      setWorkoutToDelete(null);
  
      // Update workoutDates
      const updatedDates = workouts
        .filter(w => w.workout_id !== workoutId)
        .map(w => new Date(w.date).toDateString());
      setWorkoutDates([...new Set(updatedDates)]);
  
    } catch (error) {
      console.error('Error deleting workout:', error);
      setError(`Failed to delete workout: ${error.message}`);
    }
  }

  if (loading) return <div>Loading workout history...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Workout History</h1>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        className="mx-auto text-black mb-4"
      />
      <div className="flex-1 overflow-y-auto">
        {selectedWorkout ? (
          <div className="mt-4 p-4 border rounded bg-gray-50 text-black relative">
            <button 
              onClick={goBack} 
              className="text-blue-500 hover:text-blue-700 underline mb-4">
              Back to Workout List
            </button>
            <button 
              onClick={() => setWorkoutToDelete(selectedWorkout)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">
              Workout Details for {new Date(selectedWorkout.date).toLocaleDateString()}
            </h2>
            <ul>
              {selectedWorkout.workout_exercises.map((exercise, idx) => (
                <li key={idx} className="mb-2">
                  <h3 className="font-semibold text-lg">
                    {exercise?.exercises?.name || 'Exercise name not available'}
                  </h3>
                  <ul className="ml-4">
                    {exercise.sets?.length > 0 ? (
                      exercise.sets.map((set, setIndex) => (
                        <li key={setIndex}>
                          Set {setIndex + 1}: {set.reps} reps @ {set.weight} lbs
                        </li>
                      ))
                    ) : (
                      <li>No sets available for this exercise.</li>
                    )}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          workoutsOnSelectedDate.length > 0 ? (
            workoutsOnSelectedDate.map((workout, index) => (
              <div
                key={index}
                className="mb-4 p-4 border rounded cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => selectWorkout(workout)}
              >
                <h2 className="text-xl font-semibold">
                  {new Date(workout.date).toLocaleDateString()}
                </h2>
                <p>Click to view details</p>
              </div>
            ))
          ) : (
            <p>No workouts found on this date.</p>
          )
        )}
      </div>

      {workoutToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded text-black">
            <p>Are you sure you want to delete this workout?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setWorkoutToDelete(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteWorkout(workoutToDelete.workout_id)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}