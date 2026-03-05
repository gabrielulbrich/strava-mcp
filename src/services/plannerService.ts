import { getRecentActivities as fetchActivities } from "../stravaClient.js";

// Helper: Format pace from m/s to min/km
function formatPace(mps: number | undefined): string {
    if (!mps || mps <= 0) return 'N/A';
    const minutesPerKm = 1000 / (mps * 60);
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

// Helper: Get next Monday
function getNextMonday(baseDate = new Date()): Date {
    const result = new Date(baseDate);
    const day = result.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntilNextMonday = (day === 0) ? 1 : (8 - day);
    result.setDate(result.getDate() + daysUntilNextMonday);
    result.setHours(7, 0, 0, 0); // Default to 7 AM start
    return result;
}

export interface PlannerResults {
    analysis: {
        runsAnalyzed: number;
        period: string;
        avgDistanceKm: number;
        avgPace: string;
        avgHeartRate: number | null;
        totalDistanceKm: number;
        trend: string;
    };
    weekPlan: any[];
}

export class PlannerService {
    static async planNextWeek(token: string, numberOfRuns: number = 5, weekStartDate?: string): Promise<PlannerResults> {
        if (!token) {
            throw new Error("STRAVA_ACCESS_TOKEN is missing.");
        }

        console.error(`Fetching recent activities to find ${numberOfRuns} runs...`);
        // Fetch more than needed to ensure we find enough runs
        const activities = await fetchActivities(token, 30);
        
        const runs = activities
            .filter(a => a.type === 'Run' || a.sport_type === 'Run' || a.sport_type === 'TrailRun')
            .slice(0, numberOfRuns);

        if (runs.length === 0) {
            throw new Error("No recent runs found to analyze. Please log some runs on Strava first.");
        }

        // --- Analysis ---
        const totalDist = runs.reduce((sum, r) => sum + (r.distance || 0), 0);
        const avgDist = totalDist / runs.length;
        const avgSpeed = runs.reduce((sum, r) => sum + (r.average_speed || 0), 0) / runs.length;
        
        const hrRuns = runs.filter(r => r.average_heartrate);
        const avgHR = hrRuns.length > 0 
            ? Math.round(hrRuns.reduce((sum, r) => sum + r.average_heartrate!, 0) / hrRuns.length)
            : null;

        const maxDist = Math.max(...runs.map(r => r.distance || 0));
        
        // Trend analysis
        const latestRun = runs[0];
        let trend = "maintaining";
        if (latestRun.distance > avgDist * 1.1) trend = "improving (volume)";
        else if (latestRun.average_speed > avgSpeed * 1.05) trend = "improving (intensity)";

        const analysis = {
            runsAnalyzed: runs.length,
            period: `${new Date(runs[runs.length-1].start_date).toLocaleDateString()} — ${new Date(runs[0].start_date).toLocaleDateString()}`,
            avgDistanceKm: parseFloat((avgDist / 1000).toFixed(2)),
            avgPace: formatPace(avgSpeed),
            avgHeartRate: avgHR,
            totalDistanceKm: parseFloat((totalDist / 1000).toFixed(2)),
            trend
        };

        // --- Planning ---
        const startMonday = weekStartDate ? new Date(weekStartDate) : getNextMonday();
        const plan = [];
        
        const days: { name: string, type: string, multiplier: number, intensity: string, desc: string, isLongRun?: boolean }[] = [
            { name: "Monday", type: "Recovery", multiplier: 0.6, intensity: "Easy", desc: "Easy recovery run at conversational pace." },
            { name: "Tuesday", type: "Intervals", multiplier: 0.8, intensity: "High", desc: "Speed work. Warm up, then 4-6x 400m intervals at 5k pace." },
            { name: "Wednesday", type: "Rest", multiplier: 0, intensity: "Rest", desc: "Rest day or light stretching/yoga." },
            { name: "Thursday", type: "Tempo", multiplier: 0.9, intensity: "Moderate", desc: "Steady run at a 'comfortably hard' pace." },
            { name: "Friday", type: "Rest", multiplier: 0, intensity: "Rest", desc: "Rest day. Prepare for the long run." },
            { name: "Saturday", type: "Long Run", multiplier: 1.25, intensity: "Moderate", desc: "Build endurance. Aim for 10-15% more than your recent average long run.", isLongRun: true },
            { name: "Sunday", type: "Recovery/Rest", multiplier: 0.5, intensity: "Very Easy", desc: "Optional very short recovery jog or complete rest." }
        ];

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startMonday);
            dayDate.setDate(startMonday.getDate() + i);
            const dayConfig = days[i];

            if (!dayConfig) continue;

            if (dayConfig.multiplier === 0) {
                plan.push({
                    date: dayDate.toISOString().split('T')[0],
                    dayOfWeek: dayConfig.name,
                    title: dayConfig.type,
                    description: dayConfig.desc
                });
                continue;
            }

            let distMeters = dayConfig.isLongRun ? maxDist * dayConfig.multiplier : avgDist * dayConfig.multiplier;
            
            let paceMultiplier = 1.0;
            if (dayConfig.intensity === "Easy" || dayConfig.intensity === "Very Easy") paceMultiplier = 0.85;
            if (dayConfig.intensity === "High") paceMultiplier = 1.15;
            if (dayConfig.intensity === "Moderate" && !dayConfig.isLongRun) paceMultiplier = 1.05;
            
            const targetSpeed = avgSpeed * paceMultiplier;
            const durationSeconds = distMeters / targetSpeed;
            
            const startTime = new Date(dayDate);
            startTime.setHours(7, 0, 0, 0);
            const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

            plan.push({
                date: dayDate.toISOString().split('T')[0],
                dayOfWeek: dayConfig.name,
                title: `${dayConfig.type} Run`,
                type: dayConfig.intensity.toLowerCase(),
                distanceKm: parseFloat((distMeters / 1000).toFixed(2)),
                targetPace: formatPace(targetSpeed),
                durationMinutes: Math.round(durationSeconds / 60),
                description: dayConfig.desc,
                startTime: startTime.toTimeString().substring(0, 5),
                endTime: endTime.toTimeString().substring(0, 5)
            });
        }

        return {
            analysis,
            weekPlan: plan
        };
    }
}
