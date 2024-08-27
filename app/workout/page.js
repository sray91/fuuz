'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';
import { useRouter } from 'next/navigation'
import { calculateMFRI } from '../../utils/mfri'

export default function WorkoutPage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [muscleGroups, setMuscleGroups] = useState([])
  const [exercises, setExercises] = useState({})
  const [selectedExercises, setSelectedExercises] = useState([])
  const [mfriData, setMfriData] = useState({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchMuscleGroups()
    fetchExercises()
    fetchLastWorkouts()
  }, [])

  async function fetchMuscleGroups() {
    const { data, error } = await supabase
      .from('muscle_groups')
      .select('*')
    if (error) console.error('Error fetching muscle groups:', error)
    else setMuscleGroups(data)
  }

  async function fetchExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
    if (error) console.error('Error fetching exercises:', error)
    else {
      const exercisesByMuscleGroup = data.reduce((acc, exercise) => {
        if (!acc[exercise.muscle_group_id]) acc[exercise.muscle_group_id] = []
        acc[exercise.muscle_group_id].push(exercise)
        return acc
      }, {})
      setExercises(exercisesByMuscleGroup)
    }
    setLoading(false)
  }

  async function fetchLastWorkouts() {
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
      .limit(1)

    if (error) {
      console.error('Error fetching last workouts:', error)
      return
    }

    const mfri = {}
    muscleGroups.forEach(group => {
      mfri[group.id] = calculateMFRI(
        data.find(workout => 
          workout.workout_exercises.some(ex => ex.exercise.muscle_group_id === group.id)
        ),
        new Date()
      )
    })

    setMfriData(mfri)
  }

  function toggleExercise(exercise) {
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.id === exercise.id)
      if (exists) {
        return prev.filter(e => e.id !== exercise.id)
      } else {
        return [...prev, { ...exercise, sets: 3, reps: 10, weight: 0 }]
      }
    })
  }

  function updateExerciseDetails(id, field, value) {
    setSelectedExercises(prev => 
      prev.map(ex => 
        ex.id === id ? { ...ex, [field]: parseInt(value) } : ex
      )
    )
  }

  async function startWorkout() {
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: supabase.auth.user().id, date: new Date().toISOString() })
      .select()

    if (error) {
      console.error('Error creating workout:', error)
      return
    }

    const workoutId = data[0].id

    for (let exercise of selectedExercises) {
      const { error } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.id,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight
        })

      if (error) {
        console.error('Error adding exercise to workout:', error)
      }
    }

    router.push(`/workout-session/${workoutId}`)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workout</h1>
      {muscleGroups.map(group => (
        <div key={group.id} className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            {group.name} 
            <span className="ml-2 text-sm font-normal">
              Freshness: {mfriData[group.id] || 'N/A'}%
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {exercises[group.id]?.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => toggleExercise(exercise)}
                className={`p-2 rounded ${
                  selectedExercises.find(e => e.id === exercise.id)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {exercise.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedExercises.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Selected Exercises</h2>
          {selectedExercises.map(exercise => (
            <div key={exercise.id} className="mb-2">
              <p>{exercise.name}</p>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={exercise.sets}
                  onChange={(e) => updateExerciseDetails(exercise.id, 'sets', e.target.value)}
                  className="w-20 p-1 border rounded"
                  placeholder="Sets"
                />
                <input
                  type="number"
                  value={exercise.reps}
                  onChange={(e) => updateExerciseDetails(exercise.id, 'reps', e.target.value)}
                  className="w-20 p-1 border rounded"
                  placeholder="Reps"
                />
                <input
                  type="number"
                  value={exercise.weight}
                  onChange={(e) => updateExerciseDetails(exercise.id, 'weight', e.target.value)}
                  className="w-20 p-1 border rounded"
                  placeholder="Weight"
                />
              </div>
            </div>
          ))}
          <button
            onClick={startWorkout}
            className="mt-4 bg-green-500 text-white p-2 rounded"
          >
            Start Workout
          </button>
        </div>
      )}
    </div>
  )
}