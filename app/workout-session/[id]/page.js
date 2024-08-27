'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation'

export default function WorkoutSessionPage({ params }) {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [workout, setWorkout] = useState(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchWorkout()
  }, [])

  async function fetchWorkout() {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise (*)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching workout:', error)
      setLoading(false)
      return
    }

    setWorkout(data)
    setLoading(false)
  }

  async function logSet(weight, reps) {
    const exercise = workout.workout_exercises[currentExerciseIndex]
    const { error } = await supabase
      .from('sets')
      .insert({
        workout_exercise_id: exercise.id,
        weight,
        reps,
        set_number: currentSetIndex + 1
      })

    if (error) {
      console.error('Error logging set:', error)
      return
    }

    // Move to next set or exercise
    if (currentSetIndex < exercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1)
    } else if (currentExerciseIndex < workout.workout_exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setCurrentSetIndex(0)
    } else {
      // Workout complete
      await supabase
        .from('workouts')
        .update({ status: 'Completed' })
        .eq('id', workout.id)

      router.push('/workout-history')
    }
  }

  if (loading) return <div>Loading workout session...</div>

  if (!workout) return <div>Workout not found</div>

  const currentExercise = workout.workout_exercises[currentExerciseIndex]

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workout Session</h1>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{currentExercise.exercise.name}</h2>
        <p>Set {currentSetIndex + 1} of {currentExercise.sets}</p>
        <p>Previous: {currentExercise.weight} lbs x {currentExercise.reps} reps</p>
      </div>
      <div className="flex space-x-2 mb-4">
        <input
          type="number"
          className="w-20 p-1 border rounded"
          placeholder="Weight"
          id="weight"
        />
        <input
          type="number"
          className="w-20 p-1 border rounded"
          placeholder="Reps"
          id="reps"
        />
      </div>
      <button
        onClick={() => {
          const weight = document.getElementById('weight').value
          const reps = document.getElementById('reps').value
          logSet(weight, reps)
        }}
        className="bg-green-500 text-white p-2 rounded"
      >
        Log Set
      </button>
    </div>
  )
}