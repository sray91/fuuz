'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';

export default function ProfilePage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [user, setUser] = useState(null)
  const [maxLifts, setMaxLifts] = useState({})
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        await fetchUserData()
        await fetchExercises()
        await fetchMaxLifts()
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load profile data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError("Loading timed out. Please refresh the page.")
    }, 15000) // 15 seconds timeout

    return () => clearTimeout(timeoutId)
  }, [])

  async function fetchUserData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      console.log("Fetched user:", user)
      setUser(user)
      setEmail(user?.email || '')
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('user_id', user.id)
          .single()
        if (error) throw error
        console.log("Fetched user data:", data)
        setName(data?.name || '')
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      throw error
    }
  }

  async function fetchExercises() {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
      if (error) throw error
      console.log("Fetched exercises:", data)
      setExercises(data)
    } catch (error) {
      console.error('Error fetching exercises:', error)
      throw error
    }
  }

  async function fetchMaxLifts() {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_max_lifts')
        .select('*')
        .eq('user_id', user.id)
      if (error) throw error
      console.log("Fetched max lifts:", data)
      const maxLiftsObject = data.reduce((acc, lift) => {
        acc[lift.exercise_id] = lift.max_weight
        return acc
      }, {})
      setMaxLifts(maxLiftsObject)
    } catch (error) {
      console.error('Error fetching max lifts:', error)
      throw error
    }
  }

  async function updateUserInfo() {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ user_id: user.id, name, email })
      if (error) throw error
      console.log('User info updated successfully')
    } catch (error) {
      console.error('Error updating user info:', error)
      setError("Failed to update user info. Please try again.")
    }
  }

  async function updateMaxLift(exerciseId, weight) {
    try {
      const { error } = await supabase
        .from('user_max_lifts')
        .upsert({ user_id: user.id, exercise_id: exerciseId, max_weight: weight })
      if (error) throw error
      setMaxLifts(prev => ({ ...prev, [exerciseId]: weight }))
      console.log(`Max lift updated for exercise ${exerciseId}: ${weight}`)
    } catch (error) {
      console.error('Error updating max lift:', error)
      setError("Failed to update max lift. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Loading profile...</h1>
        <p>User: {user ? 'Loaded' : 'Not loaded'}</p>
        <p>Exercises: {exercises.length} loaded</p>
        <p>Max Lifts: {Object.keys(maxLifts).length} loaded</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-500 text-white p-2 rounded"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="mb-4">
        <label htmlFor="name" className="block mb-2 text-black">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block mb-2 text-black">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded text-black"
        />
      </div>
      <button
        onClick={updateUserInfo}
        className="bg-blue-500 text-white p-2 rounded mb-4"
      >
        Update User Info
      </button>

      <h2 className="text-xl font-semibold mt-4 mb-2">Max Lifts</h2>
      {exercises.map((exercise) => (
        <div key={exercise.id} className="mb-2">
          <label htmlFor={`max-${exercise.id}`} className="mr-2 text-black">{exercise.name}:</label>
          <input
            id={`max-${exercise.id}`}
            type="number"
            value={maxLifts[exercise.id] || ''}
            onChange={(e) => updateMaxLift(exercise.id, e.target.value)}
            className="w-20 p-1 border rounded text-black"
          />
          <span className="ml-2">lbs</span>
        </div>
      ))}
    </div>
  )
}