# AI Recommendations Integration Guide

This document explains how the AI recommendations system is integrated with the Supabase database and the call service.

## Database Schema

The AI recommendations are stored in the `satudua.ai_recommendations` table with the following structure:

```sql
CREATE TABLE satudua.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID UNIQUE NOT NULL REFERENCES satudua.calls(id) ON DELETE CASCADE,
    suggestion TEXT,
    key_indicators JSONB,
    analysis TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## Key Components

### 1. AI Recommendation Service (`/src/services/ai-recommendation-service.ts`)

This service handles all database operations for AI recommendations:

- `saveAIAnalysis()` - Save/update AI analysis for a call
- `getAIRecommendation()` - Get AI recommendation for a specific call
- `getAIRecommendations()` - Get multiple recommendations
- `getAIRecommendationsWithCalls()` - Get recommendations with call details

### 2. Updated Call Service (`/src/services/callService.ts`)

The CallService now automatically:
- Detects AI analysis responses from WebSocket
- Saves them to the database via AIRecommendationService
- Provides a method to get AI recommendations for the current call

### 3. Enhanced AI Container Card (`/src/components/cards/ai-container-card.tsx`)

The AI Container Card now supports:
- Displaying formatted AI recommendations
- Showing confidence scores, trust scores, and key indicators
- Displaying escalation status and suggested actions
- Loading states

### 4. Updated Report Service (`/src/services/report-service.ts`)

The Report Service now includes AI recommendations when fetching:
- Operator reports
- Call details
- Report details

## How It Works

### Automatic Flow (Recommended)

1. **Call starts**: User joins channel and starts call
2. **Audio processing**: Audio is sent to AI analysis service via WebSocket
3. **AI responds**: AI analysis is received via WebSocket
4. **Auto-save**: CallService automatically detects and saves AI analysis
5. **Display**: Components can fetch and display AI recommendations

### Manual Integration

```typescript
import { AIRecommendationService } from '@/services/ai-recommendation-service';

// Save AI analysis
const result = await AIRecommendationService.saveAIAnalysis(callId, analysisData);

// Get AI recommendation for a call
const recommendation = await AIRecommendationService.getAIRecommendation(callId);

// Use in component
<AIContainerCard
  title="AI Analysis"
  aiRecommendation={recommendation.data}
  loading={loading}
/>
```

## Data Structure

### CallAnalysis (from WebSocket)
```typescript
interface CallAnalysis {
  call_id: string;
  analysis: {
    is_prank_call: boolean;
    confidence_score: number;
    trust_score: number;
    location: string;
    reasoning: string;
    key_indicators: string[];
    suggestion: string;
    escalation_required: boolean;
  };
  confidence_trend: number[];
  current_status: string;
  suggested_action: string;
  update_timestamp: string;
}
```

### AIRecommendation (from database)
```typescript
interface AIRecommendation {
  id?: string;
  call_id: string;
  suggestion?: string;
  key_indicators?: any; // JSONB field
  analysis?: string;
  created_at?: string;
}
```

## Features

### Automatic Saving
- AI analysis is automatically saved when received via WebSocket
- Uses upsert logic (insert or update existing recommendation)
- No manual intervention required

### Rich Display
- Formatted display of AI recommendations
- Visual indicators for prank calls, escalation status
- Confidence and trust scores
- Key indicators list
- Timestamps

### Integration with Reports
- AI recommendations are included in report queries
- Linked to calls via foreign key relationship
- Available in operator reports and call details

## Usage Examples

### In a Dashboard Component
```typescript
const [aiRecommendation, setAIRecommendation] = useState<AIRecommendation | null>(null);

// Fetch AI recommendation for current call
useEffect(() => {
  if (callId) {
    AIRecommendationService.getAIRecommendation(callId)
      .then(result => {
        if (result.success) {
          setAIRecommendation(result.data || null);
        }
      });
  }
}, [callId]);

// Display
<AIContainerCard
  title="AI Analysis"
  aiRecommendation={aiRecommendation}
/>
```

### In Call Service
```typescript
const callService = new CallService({
  onAnalysisReceived: (analysis) => {
    // AI analysis is automatically saved
    // You can add custom logic here
    console.log('AI analysis received and saved:', analysis);
  }
});
```

### With Reports
```typescript
// Get reports with AI recommendations
const reports = await ReportService.getOperatorReports(operatorId);
// Each report now includes call.ai_recommendations
```

## Environment Setup

Make sure your Supabase environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
NEXT_PUBLIC_SCHEMA=satudua
```

## Testing

Use the demo component at `/src/components/demo/ai-recommendation-demo.tsx` to test the integration:

1. Join a test channel
2. Simulate AI analysis
3. View the results in the AI Container Card
4. Check the raw data in the development panel

## Notes

- Each call can have only one AI recommendation (unique constraint)
- AI recommendations are automatically deleted when the associated call is deleted (CASCADE)
- The system uses upsert logic, so multiple AI analyses for the same call will update the existing recommendation
- All AI recommendation operations are asynchronous and include proper error handling
