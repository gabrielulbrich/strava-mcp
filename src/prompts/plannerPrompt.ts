import type { RunSummary } from "../types/planner.js";

export interface AiPlannerInput {
    runSummaries: RunSummary[];
    avgDistKm: number;
    avgPace: string;
    avgHR: number | null;
    maxDistKm: number;
    totalDistKm: number;
    weekDates: string[];
}

/**
 * Builds the structured coaching prompt sent to the Gemini model.
 */
export function buildPlannerPrompt(input: AiPlannerInput): string {
    const { runSummaries, avgDistKm, avgPace, avgHR, maxDistKm, totalDistKm, weekDates } = input;

    return `
You are an expert running coach. Analyze the following recent runs from a Strava athlete and create a personalized training plan for next week.

## Athlete's Recent Runs (last ${runSummaries.length} runs):
${JSON.stringify(runSummaries, null, 2)}

## Summary Stats:
- Average distance: ${avgDistKm.toFixed(2)} km
- Average pace: ${avgPace}
- Average heart rate: ${avgHR ? `${avgHR} bpm` : 'N/A'}
- Longest recent run: ${maxDistKm.toFixed(2)} km
- Total distance analyzed: ${totalDistKm.toFixed(2)} km

## Week to Plan:
The plan should start on ${weekDates[0]} (Monday) through ${weekDates[6]} (Sunday).

## Instructions:
1. Analyze the athlete's fitness level, trends (improving/declining/maintaining), and any patterns.
2. Create a balanced 7-day training plan that follows periodization principles.
3. Adapt recommendations based on the athlete's actual performance data.
4. Each workout day should have appropriate distances and paces derived from the athlete's data.

## Required JSON Output Format:
Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "analysis": {
    "runsAnalyzed": <number>,
    "period": "<first run date> — <last run date>",
    "avgDistanceKm": <number>,
    "avgPace": "<M:SS /km>",
    "avgHeartRate": <number or null>,
    "totalDistanceKm": <number>,
    "trend": "<one of: improving (volume), improving (intensity), maintaining, declining>",
    "fitnessInsights": "<2-3 sentences of personalized coaching insights about the athlete's current fitness and training patterns>"
  },
  "weekPlan": [
    {
      "date": "<YYYY-MM-DD>",
      "dayOfWeek": "<Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday>",
      "title": "<workout title>",
      "type": "<easy|moderate|high|rest>",
      "distanceKm": <number or omit if rest day>,
      "targetPace": "<M:SS /km or omit if rest day>",
      "durationMinutes": <number or omit if rest day>,
      "description": "<specific, actionable coaching instruction for this workout>",
      "startTime": "<HH:MM or omit if rest day>",
      "endTime": "<HH:MM or omit if rest day>"
    }
  ]
}

The weekPlan array must contain exactly 7 entries, one for each day from ${weekDates[0]} to ${weekDates[6]}.
For rest days, include only: date, dayOfWeek, title, and description.
`;
}
