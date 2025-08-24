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
import { OperatorService } from "@/services/operator-service";
import { useAuth } from "@/hooks/use-auth";

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
  const { session } = useAuth(); // Get session from auth hook
  const [isStatusActive, setIsStatusActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallWithCaller | null>(null);
  const [isLoadingCaller, setIsLoadingCaller] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState<string>("0 menit");
  const [responseTimeData, setResponseTimeData] = useState<number[]>([]);
  const [totalCallsToday, setTotalCallsToday] = useState(0);
  const [currentCallHeartbeat, setCurrentCallHeartbeat] = useState<boolean | null>(null);
  const [callFirstDetectedAt, setCallFirstDetectedAt] = useState<number | null>(null);
  const [activeOperatorCount, setActiveOperatorCount] = useState(0);
  const [totalOperatorCount, setTotalOperatorCount] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Heartbeat grace period (30 seconds for new calls to establish)
  const HEARTBEAT_GRACE_PERIOD = 30000; // 30 seconds

  // Get current operator info from session
  const currentOperatorInfo = OperatorService.getCurrentOperatorInfo(session);
  const currentOperatorId = OperatorService.getCurrentOperatorId(session);

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

  // Function to check if current call is still alive
  async function checkCurrentCallHeartbeat(callId: string): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AGORA_CREDENTIALS_API}/join-call` || "http://localhost:3000/api/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-key": "supersecret_operator_key"
        },
        body: JSON.stringify({ channelName: callId })
      });

      if (!response.ok) {
        return false;
      }

      const responseData = await response.json();
      return responseData.alive === true || responseData.status === 'active';
    } catch (error) {
      console.error('Heartbeat check failed:', error);
      return false;
    }
  }

  // Function to update operator status
  async function updateOperatorStatus(isActive: boolean): Promise<void> {
    if (!session) {
      console.error('No session available for updating operator status');
      setIsStatusActive(!isActive); // Revert the toggle
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const result = await OperatorService.updateOperatorStatus(session, isActive);
      
      if (result.success) {
        console.log(`Operator status updated to ${isActive ? 'active' : 'inactive'}`);
        
        // Wait a moment for the database to update, then refresh the count
        setTimeout(async () => {
          await fetchActiveOperatorCount();
          await fetchTotalOperatorCount();
        }, 500); // 500ms delay to ensure DB is updated
        
        // Also refresh immediately for faster UI feedback
        await fetchActiveOperatorCount();
        await fetchTotalOperatorCount();
      } else {
        console.error('Failed to update operator status:', result.error);
        // Revert the toggle if update failed
        setIsStatusActive(!isActive);
      }
    } catch (error) {
      console.error('Error updating operator status:', error);
      // Revert the toggle if update failed
      setIsStatusActive(!isActive);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Function to fetch active operator count
  async function fetchActiveOperatorCount(): Promise<void> {
    try {
      const result = await OperatorService.getActiveOperatorCount();
      
      if (result.success) {
        setActiveOperatorCount(result.count);
      } else {
        console.error('Failed to fetch active operator count:', result.error);
      }
    } catch (error) {
      console.error('Error fetching active operator count:', error);
    }
  }

  // Function to fetch total operator count
  async function fetchTotalOperatorCount(): Promise<void> {
    try {
      const result = await OperatorService.getTotalOperatorCount();
      
      if (result.success) {
        setTotalOperatorCount(result.count);
      } else {
        console.error('Failed to fetch total operator count:', result.error);
      }
    } catch (error) {
      console.error('Error fetching total operator count:', error);
    }
  }

  // Handle status switch change
  const handleStatusChange = async (newStatus: boolean) => {
    setIsStatusActive(newStatus);
    // Invert the database value: when UI shows inactive (ready), DB should be active
    await updateOperatorStatus(!newStatus);
  };

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

    // Step 1: If we have a current incoming call, check if we should run heartbeat
    if (incomingCall && incomingCall.channelName && callFirstDetectedAt) {
      const timeSinceDetected = Date.now() - callFirstDetectedAt;
      
      // Only check heartbeat if enough time has passed (grace period)
      if (timeSinceDetected >= HEARTBEAT_GRACE_PERIOD) {
        console.log("Checking heartbeat for current call:", incomingCall.channelName, `(${Math.round(timeSinceDetected/1000)}s since detected)`);
        const isCallAlive = await checkCurrentCallHeartbeat(incomingCall.channelName);
        setCurrentCallHeartbeat(isCallAlive);

        if (isCallAlive) {
          console.log("Current call is still alive, keeping it and updating stats only");
          
          // Update only the statistics, don't change the current call
          const { success, channels } = await callService.listChannels();
          if (success && channels) {
            const waitingCalls = channels.filter((c: any) => c.status === "waiting");
            const activeCalls = channels.filter((c: any) => c.status === "active" || c.status === "ongoing");
            const completedCalls = channels.filter((c: any) => c.status === "completed");

            // Update queue count and statistics
            setQueueCount(waitingCalls.length);
            setTotalCallsToday(channels.length);

            // Update response time data
            const responseTimes: number[] = [];
            completedCalls.forEach((call: any) => {
              const responseTime = calculateCallResponseTime(call);
              responseTimes.push(responseTime);
            });

            activeCalls.forEach((call: any) => {
              if (call.created_at && !call.answered_at) {
                const waitingTime = Date.now() - new Date(call.created_at).getTime();
                responseTimes.push(waitingTime);
              }
            });

            if (responseTimes.length > 0) {
              setResponseTimeData(prev => {
                const newData = [...prev, ...responseTimes];
                const updatedData = newData.slice(-10);
                const newAverage = calculateAverageResponseTime(updatedData);
                setAverageResponseTime(newAverage);
                return updatedData;
              });
            }
          }
          return; // Don't refresh the call list, keep current call
        } else {
          console.log("Current call is no longer alive, will refresh call list");
          setCurrentCallHeartbeat(false);
          setIncomingCall(null); // Clear the dead call
          setCallFirstDetectedAt(null); // Reset detection time
        }
      } else {
        // Still in grace period, just update statistics
        console.log(`Call in grace period (${Math.round(timeSinceDetected/1000)}s/${Math.round(HEARTBEAT_GRACE_PERIOD/1000)}s), skipping heartbeat check`);
        
        const { success, channels } = await callService.listChannels();
        if (success && channels) {
          const waitingCalls = channels.filter((c: any) => c.status === "waiting");
          const activeCalls = channels.filter((c: any) => c.status === "active" || c.status === "ongoing");
          const completedCalls = channels.filter((c: any) => c.status === "completed");

          // Update queue count and statistics
          setQueueCount(waitingCalls.length);
          setTotalCallsToday(channels.length);

          // Update response time data
          const responseTimes: number[] = [];
          completedCalls.forEach((call: any) => {
            const responseTime = calculateCallResponseTime(call);
            responseTimes.push(responseTime);
          });

          activeCalls.forEach((call: any) => {
            if (call.created_at && !call.answered_at) {
              const waitingTime = Date.now() - new Date(call.created_at).getTime();
              responseTimes.push(waitingTime);
            }
          });

          if (responseTimes.length > 0) {
            setResponseTimeData(prev => {
              const newData = [...prev, ...responseTimes];
              const updatedData = newData.slice(-10);
              const newAverage = calculateAverageResponseTime(updatedData);
              setAverageResponseTime(newAverage);
              return updatedData;
            });
          }
        }
        return; // Keep current call during grace period
      }
    }

    // Step 2: Fetch full call list (either no current call or current call is dead)
    console.log("Fetching fresh call list");
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

      // For demo: show the first waiting call (only if we don't have a current call)
      if (!incomingCall) {
        const waitingCall = waitingCalls.find((c: any) => c.status === "waiting");

        if (waitingCall) {
          setIsLoadingCaller(true);

          // Fetch caller information using the channel name as call ID
          const callerInfo = await fetchCallerInfo(waitingCall.channelName);

          const newCall = {
            ...waitingCall,
            caller: callerInfo
          };

          setIncomingCall(newCall);
          setCurrentCallHeartbeat(null); // Reset heartbeat status for new call
          setCallFirstDetectedAt(Date.now()); // Record when this call was first detected
          setIsLoadingCaller(false);
          console.log("Set new incoming call:", waitingCall.channelName, "- grace period started");
        } else {
          setIncomingCall(null);
          setCurrentCallHeartbeat(null);
          setCallFirstDetectedAt(null);
        }
      }
    } else {
      // No channels available
      setQueueCount(0);
      setIncomingCall(null);
      setCurrentCallHeartbeat(null);
      setCallFirstDetectedAt(null);
    }
  }, [incomingCall, callFirstDetectedAt]); // Add callFirstDetectedAt as dependency

  useEffect(() => {
    const callService = getCallService();

    let interval: NodeJS.Timeout | null = null;

    // Initial setup
    pollCalls();
    fetchActiveOperatorCount(); // Fetch initial operator count
    fetchTotalOperatorCount(); // Fetch total operator count
    
    // Poll every 5 seconds
    interval = setInterval(() => {
      pollCalls();
      // Refresh operator count more frequently (every 10 seconds instead of 30)
      if (Date.now() % 10000 < 5000) { // Roughly every 2nd poll
        fetchActiveOperatorCount();
        fetchTotalOperatorCount();
      }
    }, 5000);

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
              onCheckedChange={handleStatusChange}
              disabled={isUpdatingStatus}
            />
            {isUpdatingStatus && (
              <Label className="text-sm text-gray-500">Updating...</Label>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Icon icon="bi:people-fill" className="text-primary" />
            <Label>{activeOperatorCount}/{totalOperatorCount} operator bertugas</Label>
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
            <div><strong>DB isActive Value:</strong> {!isStatusActive ? 'true' : 'false'}</div>
            <div><strong>UI State:</strong> {!isStatusActive ? 'Showing ACTIVE UI (call-active.svg)' : 'Showing INACTIVE UI (call-inactive.svg)'}</div>
            <div><strong>Active Operators:</strong> {activeOperatorCount}</div>
            <div><strong>Total Operators:</strong> {totalOperatorCount}</div>
            <div><strong>Current Operator ID:</strong> {currentOperatorId || 'Not logged in'}</div>
            <div><strong>Current Operator Email:</strong> {currentOperatorInfo?.email || 'N/A'}</div>
            <div><strong>Session Available:</strong> {session ? 'Yes' : 'No'}</div>
            <div><strong>Updating Status:</strong> {isUpdatingStatus ? 'Yes' : 'No'}</div>
            <div><strong>Incoming Call:</strong> {incomingCall ? incomingCall.channelName : 'None'}</div>
            <div><strong>Current Call Heartbeat:</strong> {
              currentCallHeartbeat === null ? 'Not checked' :
              currentCallHeartbeat ? '✅ Alive' : '❌ Dead'
            }</div>
            {callFirstDetectedAt && (
              <div><strong>Call Grace Period:</strong> {
                Math.max(0, Math.round((HEARTBEAT_GRACE_PERIOD - (Date.now() - callFirstDetectedAt)) / 1000))
              }s remaining</div>
            )}
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
              heartbeatStatus={currentCallHeartbeat}
            />
          )}
        </div>
        {isStatusActive ? (
          <>
            <div className="relative w-full h-1/2">
              <Image className="object-contain" src="/call-inactive.svg" alt="Operator Tidak Aktif" fill />
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
              <Image className="object-contain" src="/call-active.svg" alt="Operator Aktif - Siap Menerima Panggilan" fill />
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
