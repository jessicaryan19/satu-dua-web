/**
 * Demo component showing how to use the AI Recommendation Service
 * This shows the complete integration workflow
 */

"use client";
import { useEffect, useState } from "react";
import { CallService, CallAnalysis } from "@/services/callService";
import { AIRecommendationService, AIRecommendation } from "@/services/ai-recommendation-service";
import AIContainerCard from "@/components/cards/ai-container-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIRecommendationDemo() {
  const [callService] = useState(() => new CallService({
    onAnalysisReceived: (analysis: CallAnalysis) => {
      console.log("AI Analysis received:", analysis);
      // The CallService now automatically saves to database
      // But we can also manually refresh our local state
      fetchAIRecommendation();
    },
    onError: (error: string) => {
      console.error("Call Service Error:", error);
    }
  }));

  const [aiRecommendation, setAIRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  // Fetch AI recommendation for current call
  const fetchAIRecommendation = async () => {
    const callState = callService.getState();
    if (!callState.channelName) return;

    setLoading(true);
    try {
      const result = await AIRecommendationService.getAIRecommendation(callState.channelName);
      if (result.success && result.data) {
        setAIRecommendation(result.data);
      } else {
        setAIRecommendation(null);
      }
    } catch (error) {
      console.error("Error fetching AI recommendation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Join a test channel
  const joinTestChannel = async () => {
    const result = await callService.joinChannel();
    if (result.success) {
      setCurrentCallId(result.channelName || null);
      // Start the call to enable AI analysis
      callService.startCall();
    }
  };

  // Leave current channel
  const leaveChannel = () => {
    callService.leaveChannel();
    setCurrentCallId(null);
    setAIRecommendation(null);
  };

  // Simulate AI analysis (for testing without actual mobile app)
  const simulateAIAnalysis = async () => {
    const callState = callService.getState();
    if (!callState.channelName) {
      alert("Join a channel first!");
      return;
    }

    // Create mock analysis data
    const mockAnalysis: CallAnalysis = {
      call_id: callState.channelName,
      analysis: {
        is_prank_call: Math.random() > 0.7, // 30% chance of prank call
        confidence_score: 0.8 + Math.random() * 0.2, // 80-100%
        trust_score: 0.6 + Math.random() * 0.4, // 60-100%
        location: "Jakarta Pusat",
        reasoning: "Analysis based on voice patterns, background noise, and conversation content. The caller's tone and urgency suggest a legitimate emergency situation.",
        key_indicators: [
          "Clear voice with no distortion",
          "Background noise consistent with urban environment",
          "Caller provided specific location details",
          "Emotional stress patterns detected"
        ],
        suggestion: "Proceed with standard emergency response protocol. Dispatch units to reported location.",
        escalation_required: Math.random() > 0.8 // 20% chance
      },
      confidence_trend: [0.3, 0.5, 0.7, 0.8, 0.85],
      current_status: "analyzing",
      suggested_action: "Continue monitoring. Ready for dispatch if needed.",
      update_timestamp: new Date().toISOString()
    };

    // Save to database
    const result = await AIRecommendationService.saveAIAnalysis(callState.channelName, mockAnalysis);
    if (result.success) {
      console.log("Mock AI analysis saved successfully");
      // Refresh the display
      fetchAIRecommendation();
    } else {
      console.error("Failed to save mock analysis:", result.error);
    }
  };

  // Manual refresh
  const refreshRecommendation = () => {
    fetchAIRecommendation();
  };

  useEffect(() => {
    // Initial load
    fetchAIRecommendation();
  }, [currentCallId]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendation Service Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={joinTestChannel} 
              disabled={!!currentCallId}
              variant="default"
            >
              Join Test Channel
            </Button>
            
            <Button 
              onClick={leaveChannel} 
              disabled={!currentCallId}
              variant="outline"
            >
              Leave Channel
            </Button>
            
            <Button 
              onClick={simulateAIAnalysis} 
              disabled={!currentCallId}
              variant="secondary"
            >
              Simulate AI Analysis
            </Button>
            
            <Button 
              onClick={refreshRecommendation} 
              disabled={!currentCallId}
              variant="ghost"
            >
              Refresh
            </Button>
          </div>

          <div className="flex gap-4">
            <div>
              <span className="text-sm font-medium">Current Call ID:</span>
              <Badge variant={currentCallId ? "default" : "secondary"}>
                {currentCallId || "No active call"}
              </Badge>
            </div>
            
            <div>
              <span className="text-sm font-medium">AI Status:</span>
              <Badge variant={aiRecommendation ? "default" : "secondary"}>
                {aiRecommendation ? "Analysis Available" : "No Analysis"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIContainerCard
          title="AI Analysis Results"
          aiRecommendation={aiRecommendation || undefined}
          loading={loading}
        />
        
        {/* Raw JSON Display for Development */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Raw Data (Development)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-xs">
                {aiRecommendation ? 
                  JSON.stringify(aiRecommendation, null, 2) : 
                  "No AI recommendation data available"
                }
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How to Use AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Automatic Usage (Recommended):</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>AI analysis is automatically saved when received via WebSocket</li>
              <li>Use the updated AIContainerCard component with aiRecommendation prop</li>
              <li>The CallService handles everything automatically</li>
            </ul>
            
            <h4 className="font-medium mt-4">Manual Usage:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Call AIRecommendationService.saveAIAnalysis() to save analysis</li>
              <li>Call AIRecommendationService.getAIRecommendation() to fetch analysis</li>
              <li>Use AIRecommendationService.getAIRecommendationsWithCalls() for reports</li>
            </ul>
            
            <h4 className="font-medium mt-4">Database Schema:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>ai_recommendations table with call_id (unique), suggestion, key_indicators (JSONB), analysis</li>
              <li>One recommendation per call (upsert behavior)</li>
              <li>Linked to calls table via foreign key</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
