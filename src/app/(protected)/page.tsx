"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import IncomingCallCard from "@/components/cards/incoming-call-card";
import { StatusSwitch } from "@/components/switches/status-switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react/dist/iconify.js";
import CallServiceSingleton from "@/lib/callServiceSingleton";
import { useRouter } from 'next/navigation';

import ReportList from "@/components/pages/dashboard/report-list";
import DashboardDataCard from "@/components/pages/dashboard/dashboard-data-cards";

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
  created_at?: string;
  answered_at?: string;
}

interface ChannelData {
  id?: string;
  channelName?: string;
  call_id?: string;
  status: 'waiting' | 'active' | 'ongoing' | 'completed';
  created_at?: string;
  answered_at?: string;
}

export default function Home() {
  const router = useRouter();
  const [isStatusActive, setIsStatusActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallWithCaller | null>(null);
  const [isLoadingCaller, setIsLoadingCaller] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState<string>("0 menit");
  const [responseTimeData, setResponseTimeData] = useState<number[]>([]);
  const [totalCallsToday, setTotalCallsToday] = useState(0);

  // Get the singleton CallService instance
  const getCallService = () => {
    return CallServiceSingleton.getInstance({
      onError: (err: string) => console.error("Call error:", err),
      onWebSocketResponse: (uid: string, data: unknown) => console.log("WS:", uid, data),
    });
  };

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

  // Function to calculate and format response time
  function calculateAverageResponseTime(responseTimes: number[]): string {
    if (responseTimes.length === 0) return "0 menit";

    const averageMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const averageMinutes = averageMs / (1000 * 60);

    if (averageMinutes < 1) {
      const averageSeconds = Math.round(averageMs / 1000);
      return `${averageSeconds} detik`;
    } else if (averageMinutes < 60) {
      return `${Math.round(averageMinutes)} menit`;
    } else {
      const hours = Math.floor(averageMinutes / 60);
      const minutes = Math.round(averageMinutes % 60);
      return `${hours}j ${minutes}m`;
    }
  }

  // Function to simulate or calculate response time for a call
  function calculateCallResponseTime(call: { created_at?: string; answered_at?: string }): number {
    // If the call has timestamp data, calculate actual response time
    if (call.created_at && call.answered_at) {
      return new Date(call.answered_at).getTime() - new Date(call.created_at).getTime();
    }

    // If only created_at is available, calculate time since creation (for waiting calls)
    if (call.created_at) {
      return Date.now() - new Date(call.created_at).getTime();
    }

    // If no timestamp data, simulate realistic response times (for demo purposes)
    // In real implementation, this would come from actual call data
    const baseTime = 60000; // 1 minute base
    const variance = Math.random() * 240000; // 0-4 minutes variance
    return baseTime + variance;
  }

  async function handleAnswer(call: CallWithCaller) {
    const callService = getCallService();
    console.log("Answering call:", call);

    // Validate that we have a valid call with channel name
    if (!call.channelName || call.channelName.trim() === '') {
      console.error("Cannot answer call: invalid or missing channel name");
      return;
    }

    // Record the time when call is answered for response time calculation
    const answerTime = Date.now();

    // If call has creation time, calculate response time
    if (call.created_at) {
      const responseTime = answerTime - new Date(call.created_at).getTime();
      setResponseTimeData(prev => {
        const newData = [...prev, responseTime];
        const updatedData = newData.slice(-10); // Keep only last 10

        // Calculate and update average response time
        const newAverage = calculateAverageResponseTime(updatedData);
        setAverageResponseTime(newAverage);

        return updatedData;
      });
    }

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
      // Clean up if we can't start the call
      callService.leaveChannel();
      return;
    }

    if (started) {
      // Navigate to report page with callId - ensure it's a valid string
      const callId = call.channelName.trim();
      if (callId) {
        router.push("/report?callId=" + encodeURIComponent(callId));
      } else {
        console.error("Cannot navigate to report: invalid callId");
        callService.stopCall();
        callService.leaveChannel();
      }
    }
  }

  // Memoize the polling function to prevent unnecessary re-renders
  const pollCalls = useCallback(async () => {
    const callService = getCallService();
    const { success, channels } = await callService.listChannels();

    if (success && channels && channels.length > 0) {
      // Count total calls in queue (waiting status)
      const waitingCalls = channels.filter((c: any) => c.status === "waiting");
      const activeCalls = channels.filter((c: any) => c.status === "active" || c.status === "ongoing");
      const completedCalls = channels.filter((c: any) => c.status === "completed");

      // Update queue count
      setQueueCount(waitingCalls.length);

      // Update total calls today (all statuses combined)
      setTotalCallsToday(channels.length);

      // Calculate response times for completed calls
      const responseTimes: number[] = [];
      completedCalls.forEach((call: any) => {
        const responseTime = calculateCallResponseTime(call);
        responseTimes.push(responseTime);
      });

      // Also include active calls for current waiting times
      activeCalls.forEach((call: any) => {
        if (call.created_at && !call.answered_at) {
          const waitingTime = Date.now() - new Date(call.created_at).getTime();
          responseTimes.push(waitingTime);
        }
      });

      // Update response time data (keep last 10 calls for better average)
      if (responseTimes.length > 0) {
        setResponseTimeData(prev => {
          const newData = [...prev, ...responseTimes];
          const updatedData = newData.slice(-10); // Keep only last 10 response times

          // Calculate and update average response time immediately
          const newAverage = calculateAverageResponseTime(updatedData);
          setAverageResponseTime(newAverage);

          return updatedData;
        });
      }

      // For demo: show the first waiting call
      const waitingCall = waitingCalls.find((c: any) => c.status === "waiting");

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
    } else {
      // No channels available
      setQueueCount(0);
      setIncomingCall(null);
    }
  }, []); // Empty dependency array since the function doesn't depend on any state

  useEffect(() => {
    const callService = getCallService();

    let interval: NodeJS.Timeout | null = null;

    // Poll every 5 seconds
    pollCalls();
    interval = setInterval(pollCalls, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pollCalls]); // Now depends on the memoized pollCalls function

  return (
    <div className="flex h-full gap-4">
      <div className="w-2/3 flex flex-col gap-4 h-full">
        <div className="flex justify-between items-center px-4">
          <div className="flex gap-4 items-center">
            <Label type="subtitle">Status</Label>
            <StatusSwitch
              checked={isStatusActive}
              onCheckedChange={setIsStatusActive}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Icon icon="bi:people-fill" className="text-primary" />
            <Label>15/20 operator bertugas</Label>
          </div>
        </div>

        <DashboardDataCard
          queueCount={queueCount}
          averageResponseTime={averageResponseTime}
        />

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 mx-4 rounded text-xs">
            <h4 className="font-semibold mb-2">Debug Info (Development Only)</h4>
            <div><strong>Current Queue Count:</strong> {queueCount}</div>
            <div><strong>Total Calls Today:</strong> {totalCallsToday}</div>
            <div><strong>Average Response Time:</strong> {averageResponseTime}</div>
            <div><strong>Response Time Samples:</strong> {responseTimeData.length}</div>
            <div><strong>Status Active:</strong> {isStatusActive ? 'Yes' : 'No'}</div>
            <div><strong>Incoming Call:</strong> {incomingCall ? incomingCall.channelName : 'None'}</div>
            {responseTimeData.length > 0 && (
              <div><strong>Latest Response Times (ms):</strong> {responseTimeData.slice(-3).map(t => Math.round(t / 1000)).join(', ')}s</div>
            )}
          </div>
        )}

        <Label type="title" className="text-primary px-4">Laporan Hari Ini</Label>
        <ReportList />
      </div>

      <div className="relative w-1/3 flex flex-col justify-center items-center p-12 gap-6 h-full">
        {/* Right panel */}
        <div className="absolute w-full h-full py-4 ps-4 z-100">
          {!isStatusActive && incomingCall && (
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
              <Image className="object-contain" src="/call-inactive.svg" alt="Tidak Tersedia" fill />
            </div>
            <div>
              <Label type="defaultMuted" className="text-center w-full block">Siap melayani?</Label>
              <Label type="defaultMuted" className="text-center w-full">Tekan tombol ini dan bantu warga yang membutuhkan.</Label>
            </div>
            <Button onClick={() => setIsStatusActive(prev => !prev)}>Siap Bertugas</Button>
          </>
        ) : (
          <>
            <div className="relative w-full h-1/2">
              <Image className="object-contain" src="/call-active.svg" alt="Aktif" fill />
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
