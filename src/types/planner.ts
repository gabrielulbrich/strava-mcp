/**
 * Shared types for the planner feature.
 */

export interface WorkoutDay {
    date: string;
    dayOfWeek: string;
    title: string;
    type?: string;
    distanceKm?: number;
    targetPace?: string;
    durationMinutes?: number;
    description: string;
    startTime?: string;
    endTime?: string;
}

export interface RunAnalysis {
    runsAnalyzed: number;
    period: string;
    avgDistanceKm: number;
    avgPace: string;
    avgHeartRate: number | null;
    totalDistanceKm: number;
    trend: string;
    fitnessInsights: string;
}

export interface PlannerResults {
    analysis: RunAnalysis;
    weekPlan: WorkoutDay[];
}

/** Summarized view of a single run, used as AI prompt input. */
export interface RunSummary {
    index: number;
    date: string;
    distanceKm: number;
    durationMin: number | null;
    avgPace: string;
    avgHR: number | null;
    elevationGain: number | null;
    name: string;
}
