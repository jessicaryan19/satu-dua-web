"use client";
import AIContainerCard from "@/components/cards/ai-container-card";
import OngoingCallCard from "@/components/cards/ongoing-call-card";
import ReportFormCard from "@/components/cards/report-form-card";
import { useAuth } from "@/hooks/use-auth";
import { CallAnalysis } from "@/services/callService";
import CallServiceSingleton from "@/lib/callServiceSingleton";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function Report() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callIdParam = searchParams.get('callId');
  const { session } = useAuth();
  const operatorId = session?.user.id;

  // States for managing the active call
  const [callId, setCallId] = useState<string | null>(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [loadingLatestCall, setLoadingLatestCall] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [attemptedNavigation, setAttemptedNavigation] = useState(false);

  // Get latest answered call if no callId provided
  useEffect(() => {
    const getLatestCall = async () => {
      // If callId is provided in URL, use it
      if (callIdParam && callIdParam.trim() !== '') {
        // Additional validation - check if callId contains only valid characters
        const validCallIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (validCallIdPattern.test(callIdParam.trim())) {
          setCallId(callIdParam);
          return;
        } else {
          console.warn("Invalid callId format provided");
        }
      }

      // If no valid callId provided, check if there's an active call in the CallService
      setLoadingLatestCall(true);
      try {
        const callService = CallServiceSingleton.getInstance();
        const currentState = callService.getState();
        
        // If there's an active call in the service, use it
        if (currentState.joined && currentState.channelName) {
          console.log("Using active call from CallService:", currentState.channelName);
          setCallId(currentState.channelName);
          setLoadingLatestCall(false);
          return;
        }

        // If no active call in service, try to find one from the channel list
        const { success, channels } = await callService.listChannels();
        
        if (success && channels && channels.length > 0) {
          // Find any waiting call that can be answered
          const waitingCalls = channels.filter((c: any) => c.status === "waiting");
          
          if (waitingCalls.length > 0) {
            // Use the first waiting call
            const callToUse = waitingCalls[0];
            const channelName = callToUse.channelName || callToUse.call_id || callToUse.id;
            
            if (channelName) {
              console.log("Using waiting call:", channelName);
              setCallId(channelName);
            } else {
              console.warn("No valid channel name found in waiting calls");
              router.replace('/');
            }
          } else {
            console.warn("No waiting calls found");
            router.replace('/');
          }
        } else {
          console.warn("No calls available");
          router.replace('/');
        }
      } catch (error) {
        console.error("Error fetching latest call:", error);
        router.replace('/');
      } finally {
        setLoadingLatestCall(false);
      }
    };

    getLatestCall();
  }, [callIdParam, operatorId, router]);

  // Redirect only when both call is ended AND report is saved
  useEffect(() => {
    if (callEnded && reportSaved) {
      console.log("Call ended and report saved, redirecting to dashboard");
      router.replace('/');
    } else if (attemptedNavigation && callEnded && !reportSaved) {
      // User tried to navigate away but hasn't saved report yet
      console.log("Blocking navigation - report must be completed first");
    }
  }, [callEnded, reportSaved, attemptedNavigation, router]);

  // AI analysis and recommendation states
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [callActive, setCallActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [caller, setCaller] = useState<any>(null);
  const [fullAnalysis, setFullAnalysis] = useState<CallAnalysis | null>(null);
  const [confidenceTrend, setConfidenceTrend] = useState<number[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");

  // Get the singleton CallService instance with report-specific callbacks
  const getCallService = () => {
    if (!callId || callId.trim() === '') {
      throw new Error("Cannot initialize CallService without valid callId");
    }

    return CallServiceSingleton.getInstance({
      onError: (err: string) => {
        console.error("Call error:", err);
        
        // Only redirect for critical errors, not connection issues
        if (err.includes("Failed to join channel") || err.includes("Invalid")) {
          setCallActive(false);
          router.replace('/');
        } else if (err.includes("Connection lost") || err.includes("Channel is no longer active")) {
          // For connection issues, just log and let user decide
          console.warn("Connection issue detected:", err);
          // Don't automatically redirect - user might want to try reconnecting
        } else {
          // For other errors, mark call as inactive but stay on page
          setCallActive(false);
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
        
        // Make sure we're extracting the right fields - be more defensive
        const reasoning = analysis.analysis?.reasoning || '';
        const suggestion = analysis.analysis?.suggestion || '';
        
        setAiAnalysis(reasoning);
        setAiRecommendation(suggestion);
        setConfidenceTrend(analysis.confidence_trend || []);

        // If the call is completed, maybe auto-redirect or show completion status
        if (analysis.current_status === "completed") {
          console.log("Call analysis completed:", analysis.suggested_action);
        }
      },
      onChannelClosed: () => {
        setCallActive(false);
        setCallEnded(true);
        setConnectionStatus("disconnected");
        console.log("Channel closed - call ended, report required before navigation");
        // Don't immediately redirect - wait for report to be saved
      },
      onConnectionStatusChange: (userId: string, status: 'connecting' | 'open' | 'closing' | 'closed') => {
        console.log(`Connection status for ${userId}: ${status}`);
        // Update overall connection status based on any active connections
        if (status === 'open') {
          setConnectionStatus("connected");
        } else if (status === 'closed' || status === 'closing') {
          setConnectionStatus("disconnected");
        } else if (status === 'connecting') {
          setConnectionStatus("connecting");
        }
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
        setConnectionStatus("connecting");
        callService.joinChannel(callId).then((result: any) => {
          if (result.success && !callService.getState().callStarted) {
            setConnectionStatus("connected");
            callService.startCall();
          } else if (!result.success) {
            console.error("Failed to join call with callId:", callId);
            setConnectionStatus("disconnected");
            router.replace('/');
          }
        });
      } else if (existingState.joined && existingState.channelName === callId && !existingState.callStarted) {
        // Already joined but call not started
        setConnectionStatus("connected");
        callService.startCall();
      }

      // Fetch caller info
      fetchCallerInfo(callId);

      // Cleanup function - warn user about leaving active call or unsaved report
      const beforeUnload = (event: BeforeUnloadEvent) => {
        const callState = callService.getState();
        if ((callState.joined && callState.callStarted) || (callEnded && !reportSaved)) {
          event.preventDefault();
          const message = callEnded && !reportSaved 
            ? "You must complete the report before leaving this page." 
            : "You have an active call. Are you sure you want to leave?";
          event.returnValue = message;
          return event.returnValue;
        }
      };

      // Block navigation attempts if call ended but report not saved
      const handleRouteChange = () => {
        if (callEnded && !reportSaved) {
          setAttemptedNavigation(true);
          const confirmed = window.confirm(
            "You must complete and save the report before leaving this page. Do you want to stay and complete the report?"
          );
          if (!confirmed) {
            // User insists on leaving - allow but warn
            console.warn("User left without completing report");
            return true;
          }
          return false; // Block navigation
        }
        return true; // Allow navigation
      };

      window.addEventListener('beforeunload', beforeUnload);

      return () => {
        window.removeEventListener('beforeunload', beforeUnload);
      };
    } catch (error) {
      console.error("Error initializing call service:", error);
      router.replace('/');
    }
  }, [callId, callEnded, reportSaved, router]);

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

  // Don't render anything if still loading the latest call
  if (loadingLatestCall) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Latest Call...</h2>
          <p className="text-gray-600 mb-4">Please wait while we fetch your active call.</p>
        </div>
      </div>
    );
  }

  // Don't render anything if callId is null or empty
  if (!callId || callId.trim() === '') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Active Call Found</h2>
          <p className="text-gray-600 mb-4">No active call available for reporting.</p>
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
      setCallEnded(true);
      
      // Don't immediately navigate - let the user complete the report first
      console.log("Call ended. Operator must complete report before leaving.");
    } catch (error) {
      console.error("Error ending call:", error);
      setCallEnded(true);
      // Don't navigate immediately even on error - report still required
    }
  };

  // Test function to simulate receiving AI analysis (for debugging)
  const testAnalysis = () => {
    const mockAnalysis: CallAnalysis = {
      call_id: callId || 'test',
      analysis: {
        is_prank_call: false,
        confidence_score: 0.85,
        trust_score: 0.90,
        location: 'Jakarta',
        reasoning: 'This appears to be a genuine emergency call based on the caller\'s tone and urgency.',
        key_indicators: ['urgent tone', 'clear speech', 'specific location'],
        suggestion: 'Dispatch emergency services immediately to the reported location.',
        escalation_required: true
      },
      confidence_trend: [0.7, 0.8, 0.85],
      current_status: 'analyzing',
      suggested_action: 'dispatch',
      update_timestamp: new Date().toISOString()
    };
    
    setFullAnalysis(mockAnalysis);
    setAiAnalysis(mockAnalysis.analysis.reasoning);
    setAiRecommendation(mockAnalysis.analysis.suggestion);
    setConfidenceTrend(mockAnalysis.confidence_trend);
  };

  // Function to handle reconnection
  const handleReconnect = async () => {
    if (!callId || callId.trim() === '') {
      console.warn("Cannot reconnect: no valid callId");
      return;
    }

    try {
      const callService = getCallService();
      console.log("Attempting to reconnect to channel...");
      
      const result = await callService.reconnectToChannel();
      
      if (result.success) {
        console.log("Reconnection successful");
        setCallActive(true);
        
        // Restart the call if it was active before
        const success = callService.startCall();
        if (success) {
          console.log("Call restarted successfully");
        }
      } else {
        console.error("Reconnection failed:", result.error);
        alert("Failed to reconnect: " + result.error);
      }
    } catch (error) {
      console.error("Error during reconnection:", error);
      alert("Reconnection error: " + error);
    }
  };

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
          callEnded={callEnded}
        />

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-2 rounded text-xs">
            <div><strong>Call ID:</strong> {callId}</div>
            <div><strong>Call ID Valid:</strong> {callId && callId.trim() !== '' ? 'Yes' : 'No'}</div>
            <div><strong>Call Active:</strong> {callActive ? 'Yes' : 'No'}</div>
            <div><strong>Call Ended:</strong> {callEnded ? 'Yes' : 'No'}</div>
            <div><strong>Report Saved:</strong> {reportSaved ? 'Yes' : 'No'}</div>
            <div><strong>Navigation Blocked:</strong> {(callEnded && !reportSaved) ? 'Yes' : 'No'}</div>
            <div><strong>Connection Status:</strong> <span className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>{connectionStatus}</span></div>
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
            <button 
              onClick={testAnalysis}
              className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              Test AI Analysis
            </button>
            <button 
              onClick={handleReconnect}
              className="mt-2 ml-2 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Call Status Messages */}
        {!callEnded && callActive && (
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:info" className="text-blue-600" />
              <h4 className="font-semibold text-blue-800">Call in Progress</h4>
            </div>
            <p className="text-blue-700">
              You can start filling out the report while the call is active. End the call when ready to finalize the report.
            </p>
          </div>
        )}

        {/* Call Ended Notice */}
        {callEnded && !reportSaved && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:warning" className="text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Call Ended - Report Required</h4>
            </div>
            <p className="text-yellow-700">
              The call has ended. You must complete and save the report below before you can return to the dashboard.
            </p>
          </div>
        )}

        <AIContainerCard
          title="Analisa Kejadian"
          result={aiAnalysis}
        />
        <AIContainerCard
          title="Rekomendasi"
          result={aiRecommendation}
        />
      </div>
      <div className="w-2/3 h-full flex flex-col gap-6">
        <ReportFormCard
          callId={callId || ""}
          aiAnalysis={aiAnalysis}
          aiRecommendation={aiRecommendation}
          operatorId={operatorId ?? "No Operator"}
          onReportSaved={() => setReportSaved(true)}
          callEnded={callEnded}
        />
      </div>
    </div>
  );
}
