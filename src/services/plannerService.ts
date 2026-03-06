import { getRecentActivities as fetchActivities } from "../stravaClient.js";
import { generateAiPlan } from "./aiPlannerService.js";
import type { PlannerResults, RunSummary } from "../types/planner.js";
import { formatPace, getNextMonday, getWeekDates } from "../utils/runningUtils.js";

export type { PlannerResults, WorkoutDay, RunAnalysis } from "../types/planner.js";

/**
 * Orchestrates the plan-next-week flow:
 * 1. Fetches recent runs from Strava
 * 2. Computes aggregate stats
 * 3. Delegates analysis and planning to the AI service
 */
export class PlannerService {
    static async planNextWeek(
        token: string,
        numberOfRuns: number = 5,
        weekStartDate?: string
    ): Promise<PlannerResults> {
        if (!token) {
            throw new Error("STRAVA_ACCESS_TOKEN is missing.");
        }

        // --- 1. Fetch and filter runs from Strava ---
        console.error(`Fetching recent activities to find ${numberOfRuns} runs...`);
        const activities = await fetchActivities(token, 30);

        const runs = activities
            .filter(a => a.type === 'Run' || a.sport_type === 'Run' || a.sport_type === 'TrailRun')
            .slice(0, numberOfRuns);

        if (runs.length === 0) {
            throw new Error("No recent runs found to analyze. Please log some runs on Strava first.");
        }

        // --- 2. Compute aggregate stats ---
        const totalDist = runs.reduce((sum, r) => sum + (r.distance || 0), 0);
        const avgDist = totalDist / runs.length;
        const avgSpeed = runs.reduce((sum, r) => sum + (r.average_speed || 0), 0) / runs.length;

        const hrRuns = runs.filter(r => r.average_heartrate);
        const avgHR = hrRuns.length > 0
            ? Math.round(hrRuns.reduce((sum, r) => sum + r.average_heartrate!, 0) / hrRuns.length)
            : null;

        const maxDist = Math.max(...runs.map(r => r.distance || 0));

        const runSummaries: RunSummary[] = runs.map((r, i) => ({
            index: i + 1,
            name: r.name,
            date: new Date(r.start_date).toLocaleDateString(),
            distanceKm: parseFloat((r.distance / 1000).toFixed(2)),
            durationMin: r.moving_time ? Math.round(r.moving_time / 60) : null,
            avgPace: formatPace(r.average_speed),
            avgHR: r.average_heartrate ? Math.round(r.average_heartrate) : null,
            elevationGain: r.total_elevation_gain ?? null,
        }));

        // --- 3. Delegate to AI service ---
        const startMonday = weekStartDate ? new Date(weekStartDate) : getNextMonday();
        const weekDates = getWeekDates(startMonday);

        return generateAiPlan({
            runSummaries,
            avgDistKm: avgDist / 1000,
            avgPace: formatPace(avgSpeed),
            avgHR,
            maxDistKm: maxDist / 1000,
            totalDistKm: totalDist / 1000,
            weekDates,
        });
    }
}
