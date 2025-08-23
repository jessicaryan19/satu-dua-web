"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import OngoingCallCard from "@/components/cards/ongoing-call-card";
import ReportFormCard from "@/components/cards/report-form-card";
import { CallService } from "@/services/callService";

interface CallerInfo {
  id: string;
  name: string;
  phone_number: string;
  address?: string;
}

export default function Report() {
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get call ID from URL params
  const callId = searchParams.get('callId');

  // Reference to the same CallService instance used in Home
  const callServiceRef = useRef<CallService | null>(null);

  // Initialize CallService
  useEffect(() => {
    if (!callServiceRef.current) {
      callServiceRef.current = new CallService({
        onError: (err) => {
          console.error("Call error:", err);
          // Optionally show error to user or redirect
        },
        onWebSocketResponse: (uid, data) => console.log("WS:", uid, data),
        onChannelClosed: () => {
          console.log("Channel closed, redirecting to home");
          router.push("/");
        },
        onHeartbeatStatus: (isAlive) => {
          if (!isAlive) {
            console.warn("Call connection lost");
            // Optionally show warning to user
          }
        }
      });
    }
  }, [router]);

  // Function to fetch caller information
  async function fetchCallerInfo(callId: string): Promise<CallerInfo | null> {
    try {
      const response = await fetch(`/api/calls/${callId}/caller`);
      if (!response.ok) {
        throw new Error('Failed to fetch caller info');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching caller info:', error);
      return null;
    }
  }

  useEffect(() => {
    async function loadCallerInfo() {
      if (callId) {
        setIsLoading(true);
        const caller = await fetchCallerInfo(callId);
        setCallerInfo(caller);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }

    loadCallerInfo();
  }, [callId]);

  const handleEndCall = async () => {
    console.log("Ending call...");
    const callService = callServiceRef.current;

    if (callService) {
      // Stop the call first
      callService.stopCall();

      // Close the channel if we're the owner (operator)
      const result = await callService.closeChannel();
      if (result.success) {
        console.log("Call ended successfully");
      } else {
        console.error("Failed to close channel:", result.error);
        // Still leave the channel even if close fails
        callService.leaveChannel();
      }
    }

    // Navigate back to home
    router.push("/");
  };

  const handlePause = () => {
    console.log("Toggling pause...");
    const callService = callServiceRef.current;

    if (callService && callService.getState().micTrack) {
      const micTrack = callService.getState().micTrack;

      if (isPaused) {
        // Resume - enable microphone
        micTrack.setEnabled(true);
        setIsPaused(false);
        console.log("Call resumed");
      } else {
        // Pause - disable microphone
        micTrack.setEnabled(false);
        setIsPaused(true);
        console.log("Call paused");
      }
    }
  };

  const handleMute = () => {
    console.log("Toggling mute...");
    const callService = callServiceRef.current;

    if (callService && callService.getState().micTrack) {
      const micTrack = callService.getState().micTrack;

      if (isMuted) {
        // Unmute
        micTrack.setMuted(false);
        setIsMuted(false);
        console.log("Microphone unmuted");
      } else {
        // Mute
        micTrack.setMuted(true);
        setIsMuted(true);
        console.log("Microphone muted");
      }
    }
  };

  // Show loading or error state if no call ID
  if (!callId) {
    return (
      <div className="flex w-full h-full justify-center items-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">No active call found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full gap-4">
      <div className="w-1/3 h-full flex flex-col flex-1 py-4 gap-6">
        {isLoading ? (
          <div className="w-full bg-gray-200 animate-pulse rounded-2xl h-24"></div>
        ) : (
          <OngoingCallCard
            callId={callId}
            caller={callerInfo || undefined}
            onPause={handlePause}
            onMute={handleMute}
            onEndCall={handleEndCall}
            isPaused={isPaused}
            isMuted={isMuted}
          />
        )}
      </div>
      <div className="w-2/3 h-full py-4 flex flex-col gap-6">
        <ReportFormCard
        />
      </div>
    </div>
  );
}
