'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClientInstance } from '@/utils/supabase-browser';

export default function ProfilePage() {
  const [supabase] = useState(() => createBrowserSupabaseClientInstance());
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [maxLifts, setMaxLifts] = useState({})
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingExercise, setEditingExercise] = useState(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    async function initializeProfile() {
      try {
        await fetchUserData()
      } catch (error) {
        console.error("Error initializing profile:", error)
        setError("Failed to initialize profile. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    initializeProfile()
  }, [])

  useEffect(() => {
    if (user) {
      fetchExercises()
      fetchMaxLifts()
    }
  }, [user])

  async function fetchUserData() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    setUser(user)

    if (user) {
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('name')
        .eq('user_id', user.id)
        .single()
      if (profileError) throw profileError
      setName(userData?.name || '')
    }
  }

  async function fetchExercises() {
    const { data, error } = await supabase.from('exercises').select('*')
    if (error) throw error
    setExercises(data)
  }

  async function fetchMaxLifts() {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_max_lifts')
      .select('*')
      .eq('user_id', user.id)
    if (error) throw error
    const maxLiftsObject = data.reduce((acc, lift) => {
      acc[lift.exercise_id] = lift.max_weight
      return acc
    }, {})
    setMaxLifts(maxLiftsObject)
  }

  async function updateMaxLift(exerciseId, weight) {
    try {
      const { error } = await supabase
        .from('user_max_lifts')
        .upsert({ 
          user_id: user.id, 
          exercise_id: exerciseId,
          max_weight: parseFloat(weight) || 0
        })
      if (error) throw error
      setMaxLifts(prev => ({
        ...prev,
        [exerciseId]: parseFloat(weight) || 0
      }))
      setEditingExercise(null)
    } catch (error) {
      console.error('Error updating max lift:', error)
      setError("Failed to update max lift. Please try again.")
    }
  }

  function openEditPopup(exercise) {
    setEditingExercise(exercise)
    setEditValue(maxLifts[exercise.exercise_id] || '')
  }

  if (loading) return <div className="p-4">Loading profile...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!user) return <div className="p-4">Please sign in to view your profile.</div>

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4 text-purple-800">User Profile</h1>
      <p className="mb-2">Name: {name}</p>
      <p className="mb-4">Email: {user?.email}</p>
      
      <h2 className="text-xl font-semibold mt-4 mb-2">Max Lifts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exercises.map((exercise) => (
          <div key={exercise.exercise_id} className="flex items-center justify-between p-2 border rounded bg-white text-black">
            <span>{exercise.name}: {maxLifts[exercise.exercise_id] !== undefined ? `${maxLifts[exercise.exercise_id]} lbs` : 'N/A'}</span>
            <button
              onClick={() => openEditPopup(exercise)}
              className="bg-purple-800 text-white px-2 py-1 rounded"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2 text-black">Edit {editingExercise.name}</h3>
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 border rounded mb-2 text-black"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingExercise(null)}
                className="bg-gray-300 text-black px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMaxLift(editingExercise.exercise_id, editValue)}
                className="bg-green-500 text-black px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}