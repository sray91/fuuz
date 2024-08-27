'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';

export default function WorkoutHistoryPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  async function fetchWorkouts() {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise (*)
        )
      `)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching workouts:', error)
      setLoading(false)
      return
    }

    setWorkouts(data)
    setLoading(false)
  }

  if (loading) return <div>Loading workout history...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workout History</h1>
      {workouts.map(workout => (
        <div key={workout.id} className="mb-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">
            {new Date(workout.date).toLocaleDateString()}
          </h2>
          <ul>
            {workout.workout_exercises.map(exercise => (
              <li key={exercise.id}>
                {exercise.exercise.name}: {exercise.sets} sets x {exercise.reps} reps @ {exercise.weight} lbs
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}