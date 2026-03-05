### HTTP Client Consumption Example

#### 1. Start the server in SSE mode
```bash
# Set the port and transport type
export PORT=3000
export MCP_TRANSPORT=sse
npm start
```

#### 2. Connect to the SSE endpoint (GET /sse)
This creates the session. In a real client, you would keep this connection open.

#### 3. Call the `plan-next-week` tool (POST /messages)

**Request:**
```http
POST http://localhost:3000/messages
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "call_tool",
  "params": {
    "name": "plan-next-week",
    "arguments": {
      "numberOfRuns": 5
    }
  }
}
```

**Response (JSON RPC):**
The response will contain the calendar-compatible JSON with the analysis and the week plan.

---

### Direct Library Import (Node.js)

If the other service is also Node-based, it can import the service directly:

```typescript
import { PlannerService } from './services/plannerService.js';

const results = await PlannerService.planNextWeek(stravaToken, 5);
console.log(results.weekPlan);
```
