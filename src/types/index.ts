export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  frequency: string;
  videoUrl: string;
  instructions?: string;
  regression: string;
  progression: string;
}

export interface Phase {
  phaseNumber: number;
  phaseName: string;
  weeks: string;
  description: string;
  exercises: Exercise[];
  progressionCriteria: string[];
}

export interface RehabProtocol {
  injuryName: string;
  overview: string;
  laymanExplanation: string;
  equipment: string[];
  redFlags: string[];
  phases: Phase[];
  references: string[];
}

export interface ExerciseLog {
  name: string;
  completed: boolean;
  painScore: number;
  variant: "normal" | "regression" | "progression";
}

export interface LogEntry {
  id: string;
  date: string;
  painScore: number;
  romScore: number;
  completedExercises: boolean;
  notes: string;
  painLocation?: string;
  workoutDetails?: {
    phaseIndex: number;
    exercises: ExerciseLog[];
  };
}

// Database row types (from Supabase)
export interface DbProtocol {
  id: string;
  user_id: string;
  injury_name: string;
  protocol_data: RehabProtocol;
  created_at: string;
}

export interface DbProgressLog {
  id: string;
  user_id: string;
  protocol_id: string;
  pain_score: number;
  rom_score: number;
  completed_exercises: boolean;
  notes: string;
  pain_location: string | null;
  workout_details: LogEntry["workoutDetails"] | null;
  created_at: string;
}
