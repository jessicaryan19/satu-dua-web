"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DataCard from "@/components/cards/data-card";
import IncomingCallCard from "@/components/cards/incoming-call-card";
import ReportCard from "@/components/cards/report-card";
import { StatusSwitch } from "@/components/switches/status-switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react/dist/iconify.js";
import { CallService } from "@/services/callService";
import { useRouter } from 'next/navigation';

// Type definitions
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

export default function Home() {
  const router = useRouter();
  const [isStatusActive, setIsStatusActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallWithCaller | null>(null);
  const [isLoadingCaller, setIsLoadingCaller] = useState(false);

  const callServiceRef = useRef<CallService | null>(null);

  if (!callServiceRef.current) {
    callServiceRef.current = new CallService({
      onError: (err) => console.error("Call error:", err),
      onWebSocketResponse: (uid, data) => console.log("WS:", uid, data),
    });
  }

  // Function to fetch caller information from database
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

  async function handleAnswer(call: CallWithCaller) {
    const callService = callServiceRef.current!;
    console.log("Answering call:", call);

    // Step 1: Join the channel
    const joinResult = await callService.joinChannel(call.channelName);
    if (!joinResult.success) {
      console.error("Failed to join call:", joinResult.error);
      return;
    }

    // Step 2: Start the call (audio + WS)
    const started = callService.startCall();
    if (!started) {
      console.error("Failed to start call");
    }

    if (started) {
      router.push("/report?callId=" + call.channelName);
    }
  }

  useEffect(() => {
    const callService = new CallService();

    let interval: NodeJS.Timeout | null = null;

    async function pollCalls() {
      const { success, channels } = await callService.listChannels();
      if (success && channels && channels.length > 0) {
        // For demo: show the first waiting call
        const waitingCall = channels.find(
          (c: any) => c.status === "waiting"
        );

        if (waitingCall) {
          setIsLoadingCaller(true);

          // Fetch caller information using the channel name as call ID
          const callerInfo = await fetchCallerInfo(waitingCall.channelName);

          setIncomingCall({
            ...waitingCall,
            caller: callerInfo
          });
          setIsLoadingCaller(false);
        } else {
          setIncomingCall(null);
        }
      }
    }

    // Poll every 5 seconds
    pollCalls();
    interval = setInterval(pollCalls, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex w-full">
      <div className="w-2/3 h-full py-4 flex flex-col gap-6">
        {/* Header status */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center justify-center">
            <Label type="subtitle">Status</Label>
            <StatusSwitch
              checked={isStatusActive}
              onCheckedChange={setIsStatusActive}
            />
          </div>
          <div className="flex gap-2 items-center justify-center">
            <Icon icon="bi:people-fill" className="text-primary" />
            <Label>15/20 operator bertugas</Label>
          </div>
        </div>

        {/* Stats cards */}
        <div className="w-full flex gap-4">
          <DataCard title="Total Laporan Hari Ini" value="68" icon="carbon:report" />
          <DataCard title="Total Antrian" value="127" icon="solar:incoming-call-bold" />
          <DataCard
            title="Waktu Respons"
            value="10 menit"
            icon="icon-park-solid:timer"
            theme="red"
          />
        </div>

        <Label type="title" className="text-primary">Laporan Hari Ini</Label>

        {/* Reports list */}
        <div className="w-full h-full flex flex-col gap-4">
          <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="finished" />
          <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="disconnected" />
          <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="dispatched" />
          <ReportCard id="ID 2507202100025" timestamp="13:26" reportType="Darurat" eventType="Kriminalitas" reportStatus="dispatched" />
        </div>
      </div>

      {/* Right panel */}
      <div className="relative w-1/3 flex flex-col justify-center items-center flex-1 p-12 gap-6">
        <div className="absolute w-full h-full py-4 ps-4 z-100">
          {incomingCall && (
            <IncomingCallCard
              call={incomingCall}
              onAccept={handleAnswer}
              isLoading={isLoadingCaller}
            />
          )}
        </div>

        {isStatusActive ? (
          <>
            <div className="relative w-full h-1/2">
              <Image
                className="object-contain"
                src="/call-inactive.svg"
                alt="Tidak Tersedia"
                fill
              />
            </div>
            <div>
              <Label type="defaultMuted" className="text-center w-full block">Siap melayani?</Label>
              <Label type="defaultMuted" className="text-center w-full">Tekan tombol ini dan bantu warga yang membutuhkan.</Label>
            </div>
            <Button onClick={() => setIsStatusActive(!isStatusActive)}>Siap Bertugas</Button>
          </>
        ) : (
          <>
            <div className="relative w-full h-1/2">
              <Image
                className="object-contain"
                src="/call-active.svg"
                alt="Aktif"
                fill
              />
            </div>
            <div>
              <Label type="defaultMuted" className="text-center w-full block">
                Belum ada panggilan masuk.
              </Label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
