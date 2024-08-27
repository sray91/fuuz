'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '../../utils/supabase-browser'

export default function WorkoutPage() {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const [muscleGroups, setMuscleGroups] = useState([])
  const [exercises, setExercises] = useState({})
  const [selectedExercises, setSelectedExercises] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMuscleGroups()
    fetchExercises()
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

  function toggleExercise(exercise) {
    setSelectedExercises(prev => 
      prev.find(e => e.id === exercise.id)
        ? prev.filter(e => e.id !== exercise.id)
        : [...prev, exercise]
    )
  }

  async function startWorkout() {
    // Here you would typically save the workout and redirect to a workout session page
    console.log('Starting workout with:', selectedExercises)
    // Implement the logic to save the workout to Supabase and start the session
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workout</h1>
      {muscleGroups.map(group => (
        <div key={group.id} className="mb-4">
          <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
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
          <ul>
            {selectedExercises.map(exercise => (
              <li key={exercise.id}>{exercise.name}</li>
            ))}
          </ul>
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