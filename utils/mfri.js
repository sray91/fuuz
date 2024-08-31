// Constants for MFRI calculation
const MAX_RECOVERY_HOURS = 72;
const MAX_VOLUME = 10000;
const INTENSITY_FACTORS = {
  0.7: 0.7,
  0.8: 0.8,
  0.9: 0.9,
  1.0: 1.0
};

export function calculateMFRI(lastWorkout, currentTime) {
  if (!lastWorkout) return 100; // Fully recovered if no previous workout

  const hoursSinceLastWorkout = (currentTime - new Date(lastWorkout.date)) / (1000 * 60 * 60);
  
  // Calculate volume using Prilepin's chart
  const volume = lastWorkout.workout_exercises.reduce((total, exercise) => {
    const intensity = exercise.weight / (exercise.exercises.user_max || 1); // Fallback to 1 if user_max is not set
    const factor = Object.entries(INTENSITY_FACTORS).reduce((acc, [key, value]) => {
      return intensity <= parseFloat(key) ? value : acc;
    }, 1);
    
    return total + (exercise.sets * exercise.reps * factor);
  }, 0);

  // Recovery calculation: Exponential recovery curve
  const recoveryPercentage = 100 * (1 - Math.exp(-hoursSinceLastWorkout / (MAX_RECOVERY_HOURS / 3)));

  // Fatigue calculation: Logarithmic fatigue curve
  const fatigue = 100 * (1 - Math.log(1 + volume) / Math.log(1 + MAX_VOLUME));

  // MFRI calculation: Weighted average of recovery and fatigue
  const mfri = (0.6 * recoveryPercentage + 0.4 * fatigue);

  return Math.round(mfri);
}

export function getMuscleGroupMFRI(workoutHistory, muscleGroupId, currentTime) {
  const relevantWorkouts = workoutHistory.filter(workout => 
    workout.workout_exercises.some(exercise => exercise.exercises.muscle_group_id === muscleGroupId)
  );

  if (relevantWorkouts.length === 0) return 100; // Fully recovered if no relevant workouts

  const latestWorkout = relevantWorkouts.reduce((latest, current) => 
    new Date(current.date) > new Date(latest.date) ? current : latest
  );

  return calculateMFRI(latestWorkout, currentTime);
}