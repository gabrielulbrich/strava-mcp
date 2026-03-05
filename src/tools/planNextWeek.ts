import { z } from "zod";
import { PlannerService } from "../services/plannerService.js";

const PlanNextWeekInputSchema = z.object({
  numberOfRuns: z.number().int().positive().optional().default(5).describe("Number of recent runs to analyze (default: 5)"),
  weekStartDate: z.string().optional().describe("The date the plan should start (ISO format, e.g. '2026-03-09'). Defaults to next Monday."),
});

type PlanNextWeekInput = z.infer<typeof PlanNextWeekInputSchema>;

export const planNextWeekTool = {
    name: "plan-next-week",
    description: "Analyzes the 5 previous runs and plans the next week of exercises in a calendar-compatible JSON format.",
    inputSchema: PlanNextWeekInputSchema,
    execute: async ({ numberOfRuns, weekStartDate }: PlanNextWeekInput) => {
        const token = process.env.STRAVA_ACCESS_TOKEN;

        if (!token || token === 'YOUR_STRAVA_ACCESS_TOKEN_HERE') {
            return {
                content: [{ type: "text" as const, text: "❌ Configuration Error: STRAVA_ACCESS_TOKEN is missing or not set." }],
                isError: true,
            };
        }

        try {
            const result = await PlannerService.planNextWeek(token, numberOfRuns, weekStartDate);

            return {
                content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }]
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            console.error("Error in plan-next-week tool:", errorMessage);
            return {
                content: [{ type: "text" as const, text: `❌ API Error: ${errorMessage}` }],
                isError: true,
            };
        }
    }
};
