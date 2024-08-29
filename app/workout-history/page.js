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
  
    console.log(`Sets for workout_exercise_id ${workoutExerciseId}:`, data); // Debug log
  
    return data;
  }  

  async function fetchWorkouts() {
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

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError.message, workoutsError.details);
      setLoading(false);
      return;
    }

    console.log("Workouts Data:", JSON.stringify(workoutsData, null, 2));

    const workoutsWithSets = await Promise.all(workoutsData.map(async workout => {
      const workoutWithSets = {
        ...workout,
        workout_exercises: await Promise.all(workout.workout_exercises.map(async exercise => {
          const sets = await fetchSetsForExercise(exercise.workout_exercise_id);
          return { ...exercise, sets };
        }))
      };
      return workoutWithSets;
    }));

    setWorkouts(workoutsWithSets);
    const dates = workoutsWithSets.map(workout => new Date(workout.date).toDateString());
    setWorkoutDates(dates);
    setLoading(false);
  }

  function handleDateChange(date) {
    setSelectedDate(date);
    const selectedDateString = date.toDateString();
    const workoutsForTheDay = workouts.filter(workout => {
      return new Date(workout.date).toDateString() === selectedDateString;
    });
    setWorkoutsOnSelectedDate(workoutsForTheDay);
    setSelectedWorkout(null);  // Clear any previously selected workout
  }

  function tileContent({ date, view }) {
    if (view === 'month') {
      const dateString = date.toDateString();
      if (workoutDates.includes(dateString)) {
        return <div className="bg-green-500 w-2 h-2 rounded-full mx-auto mt-1"></div>;
      }
    }
    return null; // Return null if no custom content
  }

  function selectWorkout(workout) {
    console.log("Workout selected:", workout); // Log selected workout for debugging
    setSelectedWorkout(workout);
  }

  function goBack() {
    setSelectedWorkout(null); // Clear selected workout to show the list again
  }

  if (loading) return <div>Loading workout history...</div>;

  return (
    <div className="p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Workout History</h1>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent} // Ensure tileContent is defined
        className="mx-auto text-black mb-4"
      />
      <div className="flex-1 overflow-y-auto"> {/* This ensures the content is scrollable */}
        {selectedWorkout ? (
          <div className="mt-4 p-4 border rounded bg-gray-50 text-black">
            <button 
              onClick={goBack} 
              className="text-blue-500 hover:text-blue-700 underline mb-4">
              Back to Workout List
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
    </div>
  );
}