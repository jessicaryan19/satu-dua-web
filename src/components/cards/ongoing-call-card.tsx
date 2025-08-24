"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

interface CallerInfo {
  id: string;
  name: string;
  phone_number: string;
  address?: string;
}

interface OngoingCallCardProps {
  callId?: string; // Channel name or call ID
  caller?: CallerInfo; // Pre-fetched caller info
  onPause?: () => void;
  onMute?: () => void;
  onEndCall?: () => void;
  isPaused?: boolean; // External pause state
  isMuted?: boolean; // External mute state
  callEnded?: boolean; // Whether the call has ended
}

export default function OngoingCallCard({
  callId,
  caller,
  onPause,
  onMute,
  onEndCall,
  isPaused = false,
  isMuted = false,
  callEnded = false
}: OngoingCallCardProps) {
  const [callDuration, setCallDuration] = useState("00:00:00");
  const [startTime] = useState(Date.now());

  // Update call duration every second, but stop when call ends
  useEffect(() => {
    if (callEnded) {
      return; // Don't start timer if call has already ended
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;

      setCallDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, callEnded]);

  const handlePause = () => {
    onPause?.();
  };

  const handleMute = () => {
    onMute?.();
  };

  const handleEndCall = () => {
    onEndCall?.();
  };

  // Display caller info or fallback values
  const displayName = caller?.name || "Unknown Caller";
  const displayPhone = caller?.phone_number || "No Phone Number";

  return (
    <div className={`w-full flex p-6 rounded-2xl justify-between items-center ${
      callEnded ? 'bg-gray-200 border-2 border-gray-400' : 'bg-destructive-accent'
    }`}>
      <div className="flex gap-4">
        <div className="w-fit h-fit bg-accent rounded-full">
          <Icon icon="gg:profile" className="text-5xl text-info" />
        </div>
        <div className="flex flex-col gap-2">
          <Label type="subtitle">{displayName}</Label>
          <Label>{displayPhone}</Label>
          {callEnded && (
            <Label className="text-red-600 text-sm font-medium">Call Ended</Label>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-4">
        <Label type="subtitle">{callDuration}</Label>
        <div className="flex gap-2">
          <Button
            variant={isPaused ? "secondary" : "info"}
            className="w-10 h-10 rounded-full"
            onClick={handlePause}
            title={isPaused ? "Resume" : "Pause"}
            disabled={callEnded}
          >
            <Icon icon={isPaused ? "material-symbols:play-arrow" : "material-symbols:pause"} />
          </Button>
          <Button
            variant={isMuted ? "secondary" : "info_outline"}
            className="w-10 h-10 rounded-full"
            onClick={handleMute}
            title={isMuted ? "Unmute" : "Mute"}
            disabled={callEnded}
          >
            <Icon icon={isMuted ? "vaadin:volume-off" : "vaadin:mute"} />
          </Button>
          <Button
            variant="secondary"
            className="w-10 h-10 rounded-full"
            onClick={handleEndCall}
            title={callEnded ? "Call Ended" : "End Call"}
            disabled={callEnded}
          >
            <Icon icon={callEnded ? "material-symbols:check-circle" : "solar:end-call-bold"} />
          </Button>
        </div>
      </div>
    </div>
  )
}
