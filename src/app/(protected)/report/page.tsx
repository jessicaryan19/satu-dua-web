"use client";
import AIContainerCard from "@/components/cards/ai-container-card";
import OngoingCallCard from "@/components/cards/ongoing-call-card";
import ReportFormCard from "@/components/cards/report-form-card";
import { useAuth } from "@/hooks/use-auth";
import { CallAnalysis } from "@/services/callService";
import CallServiceSingleton from "@/lib/callServiceSingleton";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Report() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callId = searchParams.get('callId');
  const { session } = useAuth();
  const operatorId = session?.user.id;

  // Early redirect if no callId is provided
  useEffect(() => {
    if (!callId || callId.trim() === '') {
      console.warn("No valid callId provided, redirecting to dashboard");
      router.replace('/');
      return;
    }

    // Additional validation - check if callId contains only valid characters
    const validCallIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validCallIdPattern.test(callId.trim())) {
      console.warn("Invalid callId format, redirecting to dashboard");
      router.replace('/');
      return;
    }
  }, [callId, router]);

  // AI analysis and recommendation states
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [callActive, setCallActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [caller, setCaller] = useState<any>(null);
  const [fullAnalysis, setFullAnalysis] = useState<CallAnalysis | null>(null);
  const [confidenceTrend, setConfidenceTrend] = useState<number[]>([]);

  // Get the singleton CallService instance with report-specific callbacks
  const getCallService = () => {
    if (!callId || callId.trim() === '') {
      throw new Error("Cannot initialize CallService without valid callId");
    }
    
    return CallServiceSingleton.getInstance({
      onError: (err: string) => {
        console.error("Call error:", err);
        setCallActive(false);
        // If there's a critical error, redirect back to dashboard
        if (err.includes("Failed to join channel") || err.includes("Invalid")) {
          router.replace('/');
        }
      },
      onWebSocketResponse: (uid: string, data: any) => {
        console.log("WS Response from user:", uid, data);
        
        // Log specific message types for debugging
        if (data.type === 'message' && data.data) {
          console.log("Received message data:", data.data);
          
          // Check if it looks like an analysis response
          if (data.data.call_id && data.data.analysis) {
            console.log("Found analysis in WebSocket message - this should trigger onAnalysisReceived");
          }
        }
      },
      onAnalysisReceived: (analysis: CallAnalysis) => {
        console.log("Analysis received:", analysis);
        setFullAnalysis(analysis);
        setAiAnalysis(analysis.analysis.reasoning);
        setAiRecommendation(analysis.analysis.suggestion);
        setConfidenceTrend(analysis.confidence_trend);
        
        // If the call is completed, maybe auto-redirect or show completion status
        if (analysis.current_status === "completed") {
          console.log("Call analysis completed:", analysis.suggested_action);
        }
      },
      onChannelClosed: () => {
        setCallActive(false);
        router.push('/');
      }
    });
  };

  // Initialize and handle call setup
  useEffect(() => {
    // Don't proceed if no callId
    if (!callId || callId.trim() === '') {
      return;
    }

    try {
      const callService = getCallService();
      const existingState = callService.getState();
      
      // If we have a callId and either need to join or we're already in the right channel
      if (!existingState.joined || existingState.channelName !== callId) {
        // Need to join the channel
        callService.joinChannel(callId).then((result: any) => {
          if (result.success && !callService.getState().callStarted) {
            callService.startCall();
          } else if (!result.success) {
            console.error("Failed to join call with callId:", callId);
            router.replace('/');
          }
        });
      } else if (existingState.joined && existingState.channelName === callId && !existingState.callStarted) {
        // Already joined but call not started
        callService.startCall();
      }
      
      // Fetch caller info
      fetchCallerInfo(callId);

      // Cleanup function - warn user about leaving active call
      const beforeUnload = (event: BeforeUnloadEvent) => {
        const callState = callService.getState();
        if (callState.joined && callState.callStarted) {
          event.preventDefault();
          event.returnValue = "You have an active call. Are you sure you want to leave?";
          return event.returnValue;
        }
      };
      
      window.addEventListener('beforeunload', beforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', beforeUnload);
      };
    } catch (error) {
      console.error("Error initializing call service:", error);
      router.replace('/');
    }
  }, [callId, router]);

  // Function to fetch caller information
  async function fetchCallerInfo(callId: string) {
    try {
      const response = await fetch(`/api/calls/${callId}/caller`);
      if (response.ok) {
        const callerData = await response.json();
        setCaller(callerData);
      } else {
        console.warn("Failed to fetch caller info for callId:", callId);
      }
    } catch (error) {
      console.error('Error fetching caller info:', error);
    }
  }

  // Don't render anything if callId is null or empty
  if (!callId || callId.trim() === '') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Call ID Provided</h2>
          <p className="text-gray-600 mb-4">You need a valid call ID to access this page.</p>
          <button 
            onClick={() => router.replace('/')}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Additional validation for callId format
  const validCallIdPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validCallIdPattern.test(callId.trim())) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid Call ID</h2>
          <p className="text-gray-600 mb-4">The provided call ID is not valid.</p>
          <button 
            onClick={() => router.replace('/')}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handlePause = async () => {
    if (!callId || callId.trim() === '') {
      console.warn("Cannot pause: no valid callId");
      return;
    }
    
    try {
      const callService = getCallService();
      const success = await callService.pauseCall(!isPaused);
      if (success) {
        setIsPaused(!isPaused);
      }
    } catch (error) {
      console.error("Error handling pause:", error);
    }
  };

  const handleMute = async () => {
    if (!callId || callId.trim() === '') {
      console.warn("Cannot mute: no valid callId");
      return;
    }
    
    try {
      const callService = getCallService();
      const success = await callService.muteAudio(!isMuted);
      if (success) {
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error("Error handling mute:", error);
    }
  };

  const handleEndCall = async () => {
    if (!callId || callId.trim() === '') {
      console.warn("Cannot end call: no valid callId");
      router.replace('/');
      return;
    }
    
    try {
      const callService = getCallService();
      
      // Stop the call first
      callService.stopCall();
      
      // Close the channel if we're the owner
      const state = callService.getState();
      if (state.isChannelOwner) {
        await callService.closeChannel();
      } else {
        callService.leaveChannel();
      }
      
      // Reset the singleton since the call is completely finished
      CallServiceSingleton.resetInstance();
      
      setCallActive(false);
      router.push('/');
    } catch (error) {
      console.error("Error ending call:", error);
      // Still navigate back to dashboard even if there's an error
      router.replace('/');
    }
  };

  const resultTempExample = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

  return (
    <div className="flex w-full h-full gap-4">
      <div className="w-1/3 h-full flex flex-col ps-4 gap-4">
        <OngoingCallCard 
          callId={callId || undefined}
          caller={caller}
          onPause={handlePause}
          onMute={handleMute}
          onEndCall={handleEndCall}
          isPaused={isPaused}
          isMuted={isMuted}
        />
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-2 rounded text-xs">
            <div><strong>Call ID:</strong> {callId}</div>
            <div><strong>Call ID Valid:</strong> {callId && callId.trim() !== '' ? 'Yes' : 'No'}</div>
            <div><strong>Full Analysis Available:</strong> {fullAnalysis ? 'Yes' : 'No'}</div>
            {fullAnalysis && (
              <>
                <div><strong>Call Status:</strong> {fullAnalysis.current_status}</div>
                <div><strong>Confidence:</strong> {fullAnalysis.analysis.confidence_score}</div>
                <div><strong>Trust Score:</strong> {fullAnalysis.analysis.trust_score}</div>
                <div><strong>Is Prank:</strong> {fullAnalysis.analysis.is_prank_call ? 'Yes' : 'No'}</div>
                <div><strong>Escalation Required:</strong> {fullAnalysis.analysis.escalation_required ? 'Yes' : 'No'}</div>
              </>
            )}
          </div>
        )}
        
        <AIContainerCard
          title="Analisa Kejadian"
          result={aiAnalysis}
        />
        <AIContainerCard
          title="Rekomendasi"
          result={aiRecommendation || resultTempExample}
        />
      </div>
      <div className="w-2/3 h-full flex flex-col gap-6">
        <ReportFormCard
          aiAnalysis={aiAnalysis}
          aiRecommendation={aiRecommendation || resultTempExample}
          operatorId={operatorId ?? "No Operator"}
        />
      </div>
    </div>
  );
}
