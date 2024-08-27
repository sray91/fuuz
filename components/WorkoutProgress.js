'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '../../utils/supabase-browser'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { calculateMFRI } from '../../utils/mfri'

export default function WorkoutProgress() {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const [workoutData, setWorkoutData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkoutData()
  }, [])

  async function fetchWorkoutData() {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise (*)
        )
      `)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching workout data:', error)
      setLoading(false)
      return
    }

    const processedData = data.map(workout => {
      const totalVolume = workout.workout_exercises.reduce((sum, exercise) => 
        sum + exercise.sets * exercise.reps * exercise.weight, 0
      )

      const mfri = calculateMFRI(workout, new Date())

      return {
        date: new Date(workout.date).toLocaleDateString(),
        volume: totalVolume,
        mfri: mfri
      }
    })

    setWorkoutData(processedData)
    setLoading(false)
  }

  if (loading) return <div>Loading workout progress...</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Workout Progress</h2>
      <LineChart width={600} height={300} data={workoutData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#8884d8" name="Total Volume" />
        <Line yAxisId="right" type="monotone" dataKey="mfri" stroke="#82ca9d" name="MFRI" />
      </LineChart>
    </div>
  )
}