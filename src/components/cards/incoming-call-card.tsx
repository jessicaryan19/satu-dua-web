import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

interface CallerInfo {
  id: string;
  name: string;
  phone_number: string;
  address?: string;
}

interface CallWithCaller {
  id: string;
  channelName: string;
  status: string;
  caller?: CallerInfo;
}

type IncomingCallCardProps = {
  call: CallWithCaller;
  onAccept: (call: CallWithCaller) => void;
  isLoading?: boolean;
  heartbeatStatus?: boolean | null;
}

export default function IncomingCallCard({ call, onAccept, isLoading = false, heartbeatStatus = null }: IncomingCallCardProps) {
  // Display caller info or loading state
  const displayName = call.caller?.name || "Unknown Caller";
  const displayPhone = call.caller?.phone_number || "No Phone Number";

  // Determine heartbeat indicator
  const getHeartbeatIndicator = () => {
    if (heartbeatStatus === null) return null;
    if (heartbeatStatus === true) return "💚"; // Green heart for alive
    return "💔"; // Broken heart for dead
  };

  const getHeartbeatText = () => {
    if (heartbeatStatus === null) return "";
    if (heartbeatStatus === true) return "Call Active";
    return "Call Ended";
  };

  return (
    <div className="w-full h-full bg-destructive-accent rounded-2xl border-2 border-destructive overflow-hidden relative animate-[blink-shadow_1s_infinite]">
      <Image
        className="object-cover flex-1"
        src="/call-pattern.svg"
        alt=""
        fill
      />
      <div className="absolute inset-0 bg-destructive mix-blend-screen" />
      <div className="absolute w-full h-full flex flex-col gap-10 justify-center items-center">
        <div className="flex flex-col gap-4 justify-center items-center">
          <div className="w-fit h-fit bg-accent rounded-full">
            {isLoading ? (
              <Icon icon="eos-icons:loading" className="text-9xl text-info animate-spin" />
            ) : (
              <Icon icon="gg:profile" className="text-9xl text-info" />
            )}
          </div>

          {isLoading ? (
            <>
              <div className="h-6 w-32 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
            </>
          ) : (
            <>
              <Label className="text-black" type="strong">{displayName}</Label>
              <Label className="text-black" type="subtitle">{displayPhone}</Label>
              {heartbeatStatus !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">{getHeartbeatIndicator()}</span>
                  <Label className="text-black text-xs">{getHeartbeatText()}</Label>
                </div>
              )}
            </>
          )}
        </div>

        <Button
          variant="success"
          className="p-6"
          onClick={() => onAccept(call)}
          disabled={isLoading}
        >
          <Icon icon="ion:call" className="text-9xl" />
          <Label type="subtitle">{isLoading ? "Loading..." : "Angkat"}</Label>
        </Button>
      </div>
    </div>
  )
}
