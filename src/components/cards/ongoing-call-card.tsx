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
}

export default function OngoingCallCard({
  callId,
  caller,
  onPause,
  onMute,
  onEndCall,
  isPaused = false,
  isMuted = false
}: OngoingCallCardProps) {
  const [callDuration, setCallDuration] = useState("00:00:00");
  const [startTime] = useState(Date.now());

  // Update call duration every second
  useEffect(() => {
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
  }, [startTime]);

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
    <div className="w-full bg-destructive-accent flex p-6 rounded-2xl justify-between items-center">
      <div className="flex gap-4">
        <div className="w-fit h-fit bg-accent rounded-full">
          <Icon icon="gg:profile" className="text-5xl text-info" />
        </div>
        <div className="flex flex-col gap-2">
          <Label type="subtitle">{displayName}</Label>
          <Label>{displayPhone}</Label>
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
          >
            <Icon icon={isPaused ? "material-symbols:play-arrow" : "material-symbols:pause"} />
          </Button>
          <Button
            variant={isMuted ? "secondary" : "info_outline"}
            className="w-10 h-10 rounded-full"
            onClick={handleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            <Icon icon={isMuted ? "vaadin:volume-off" : "vaadin:mute"} />
          </Button>
          <Button
            variant="secondary"
            className="w-10 h-10 rounded-full"
            onClick={handleEndCall}
            title="End Call"
          >
            <Icon icon="solar:end-call-bold" />
          </Button>
        </div>
      </div>
    </div>
  )
}
