export function calculateMFRI(lastWorkout, currentTime) {
    if (!lastWorkout) return 100; // Fully recovered if no previous workout
  
    const hoursSinceLastWorkout = (currentTime - new Date(lastWorkout.date)) / (1000 * 60 * 60);
    
    // Calculate volume using Prilepin's chart
    const volume = lastWorkout.workout_exercises.reduce((total, exercise) => {
      const intensity = exercise.weight / exercise.exercise.user_max; // Assuming user_max is stored
      let factor;
      if (intensity <= 0.7) factor = 0.7;
      else if (intensity <= 0.8) factor = 0.8;
      else if (intensity <= 0.9) factor = 0.9;
      else factor = 1;
      
      return total + (exercise.sets * exercise.reps * factor);
    }, 0);
  
    // Simple recovery formula: 100% recovery after 72 hours, linear recovery rate
    const recoveryRate = 100 / (72 * 60 * 60 * 1000);
    const recoveryPercentage = Math.min(100, hoursSinceLastWorkout * recoveryRate * 100);
  
    // MFRI calculation
    const fatigue = Math.max(0, 100 - (volume / 100)); // Assuming max volume is 10000
    const mfri = (fatigue + recoveryPercentage) / 2;
  
    return Math.round(mfri);
  }