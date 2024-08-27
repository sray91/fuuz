'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '../../utils/supabase-browser'

export default function ProfilePage() {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const [user, setUser] = useState(null)
  const [maxLifts, setMaxLifts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    fetchMaxLifts()
  }, [])

  async function fetchUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function fetchMaxLifts() {
    const { data, error } = await supabase
      .from('user_max_lifts')
      .select(`
        *,
        exercise (*)
      `)

    if (error) {
      console.error('Error fetching max lifts:', error)
      setLoading(false)
      return
    }

    const maxLiftsObject = data.reduce((acc, lift) => {
      acc[lift.exercise.id] = lift.max_weight
      return acc
    }, {})

    setMaxLifts(maxLiftsObject)
    setLoading(false)
  }

  async function updateMaxLift(exerciseId, weight) {
    const { error } = await supabase
      .from('user_max_lifts')
      .upsert({ user_id: user.id, exercise_id: exerciseId, max_weight: weight })

    if (error) {
      console.error('Error updating max lift:', error)
      return
    }

    setMaxLifts(prev => ({ ...prev, [exerciseId]: weight }))
  }

  if (loading) return <div>Loading profile...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <p>Email: {user?.email}</p>
      <h2 className="text-xl font-semibold mt-4 mb-2">Max Lifts</h2>
      {Object.entries(maxLifts).map(([exerciseId, weight]) => (
        <div key={exerciseId} className="mb-2">
          <label htmlFor={`max-${exerciseId}`} className="mr-2">{exerciseId}:</label>
          <input
            id={`max-${exerciseId}`}
            type="number"
            value={weight}
            onChange={(e) => updateMaxLift(exerciseId, e.target.value)}
            className="w-20 p-1 border rounded"
          />
          <span className="ml-2">lbs</span>
        </div>
      ))}
    </div>
  )
}