'use client'

import { useState, useEffect } from 'react'
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

  async function fetchWorkouts() {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        workout_id,
        date,
        workout_exercises (
          exercise_id,
          exercise (name)
        )
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      setLoading(false);
      return;
    }

    setWorkouts(data);
    const dates = data.map(workout => new Date(workout.date).toDateString());
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
  }

  function selectWorkout(workout) {
    setSelectedWorkout(workout);
  }

  if (loading) return <div>Loading workout history...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workout History</h1>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        className="mx-auto text-black"
      />
      <div className="mt-4">
        {workoutsOnSelectedDate.length > 0 ? (
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
        )}

        {selectedWorkout && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-bold mb-4">
              Workout Details for {new Date(selectedWorkout.date).toLocaleDateString()}
            </h2>
            <ul>
              {selectedWorkout.workout_exercises.map((exercise, idx) => (
                <li key={idx} className="mb-2">
                  <h3 className="font-semibold text-lg">{exercise.exercise.name}</h3>
                  <ul className="ml-4">
                    {exercise.sets?.map((set, setIndex) => (
                      <li key={setIndex}>
                        Set {setIndex + 1}: {set.reps} reps @ {set.weight} lbs
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
