import { createClient } from '@supabase/supabase-js'
import { calculateMFRI, getMuscleGroupMFRI } from './mfri'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function updateMuscleFreshness(userId) {
  try {
    // Fetch all muscle groups
    const { data: muscleGroups, error: muscleGroupError } = await supabase
      .from('muscle_groups')
      .select('*')

    if (muscleGroupError) {
      throw new Error(`Error fetching muscle groups: ${muscleGroupError.message}`)
    }

    // Fetch user's workout history
    const { data: workoutHistory, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercises (*)
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (workoutError) {
      throw new Error(`Error fetching workout history: ${workoutError.message}`)
    }

    const currentTime = new Date()

    // Calculate and update freshness for each muscle group
    for (const group of muscleGroups) {
      const freshness = getMuscleGroupMFRI(workoutHistory, group.muscle_group_id, currentTime)

      // Add this check before upserting
      const freshnessValue = freshness != null ? Math.round(freshness) : 100

      // Upsert the freshness value
      const { error: upsertError } = await supabase
        .from('muscle_freshness')
        .upsert({
          user_id: userId,
          muscle_group_id: group.muscle_group_id,
          freshness: freshnessValue,  // Use the checked value
          last_updated: currentTime.toISOString()
        }, {
          onConflict: 'user_id,muscle_group_id'
        })

      if (upsertError) {
        console.error(`Error upserting muscle freshness for group ${group.muscle_group_id}:`, upsertError)
      }
    }

    console.log(`Muscle freshness updated successfully for user ${userId}`)
  } catch (error) {
    console.error('Error in updateMuscleFreshness:', error)
    throw error // Re-throw the error for the caller to handle
  }
}

export async function getUserMuscleFreshness(userId) {
  try {
    const { data, error } = await supabase
      .from('muscle_freshness')
      .select(`
        *,
        muscle_groups (name)
      `)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Error fetching muscle freshness: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in getUserMuscleFreshness:', error)
    throw error
  }
}