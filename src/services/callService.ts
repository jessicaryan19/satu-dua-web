import { getAgoraRTC } from "@/lib/agoraClient";
import { downsampleTo16kHz, floatTo16BitPCM } from "@/services/util/audio_util";
import { AIRecommendationService } from "@/services/ai-recommendation-service";

export interface CallState {
  joined: boolean;
  callStarted: boolean;
  client: any;
  micTrack: any;
  wsConnections: { [userId: string]: WebSocket };
  wsCleanupFns: (() => void)[];
  channelName?: string;
  isChannelOwner: boolean;
  heartbeatActive: boolean;
}

export interface WebSocketResponse {
  timestamp: string;
  data: any;
}

export interface CallCallbacks {
  onWebSocketResponse?: (userId: string, response: any) => void;
  onConnectionStatusChange?: (userId: string, status: 'connecting' | 'open' | 'closing' | 'closed') => void;
  onError?: (error: string) => void;
  onChannelClosed?: () => void;
  onHeartbeatStatus?: (isAlive: boolean) => void;
  onAnalysisReceived?: (analysis: CallAnalysis) => void;
}

export interface CallAnalysis {
  call_id: string;
  analysis: {
    is_prank_call: boolean;
    confidence_score: number;
    trust_score: number;
    location: string;
    reasoning: string;
    key_indicators: string[];
    suggestion: string;
    escalation_required: boolean;
  };
  confidence_trend: number[];
  current_status: string;
  suggested_action: string;
  update_timestamp: string;
}

export class CallService {
  private state: CallState = {
    joined: false,
    callStarted: false,
    client: null,
    micTrack: null,
    wsConnections: {},
    wsCleanupFns: [],
    channelName: undefined,
    isChannelOwner: false,
    heartbeatActive: false
  };

  private callbacks: CallCallbacks = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(callbacks: CallCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public getState(): Readonly<CallState> {
    return { ...this.state };
  }

  public updateCallbacks(newCallbacks: CallCallbacks): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  /**
   * Handle AI analysis received from WebSocket and save to database
   */
  private async handleAIAnalysis(analysis: CallAnalysis): Promise<void> {
    if (!this.state.channelName) {
      console.warn('No channel name available for AI analysis');
      return;
    }

    try {
      const result = await AIRecommendationService.saveAIAnalysis(this.state.channelName, analysis);
      
      if (result.success) {
        console.log(`AI analysis saved successfully for call ${this.state.channelName}`);
      } else {
        console.error(`Failed to save AI analysis: ${result.error}`);
        this.callbacks.onError?.(`Failed to save AI analysis: ${result.error}`);
      }
    } catch (error) {
      console.error('Error handling AI analysis:', error);
      this.callbacks.onError?.(`Error handling AI analysis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async joinChannel(channelNameInput?: string): Promise<{ success: boolean; channelName?: string; error?: string }> {
    try {
      let apiEndpoint, requestOptions, responseData;
      let isOwner = false;

      if (channelNameInput?.trim()) {
        // Join existing channel using join-call endpoint
        apiEndpoint = `${process.env.NEXT_PUBLIC_AGORA_CREDENTIALS_API}/join-call` || "http://localhost:3000/api/join-call";
        requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-operator-key": "supersecret_operator_key"
          },
          body: JSON.stringify({ channelName: channelNameInput.trim() })
        };
        isOwner = false;
      } else {
        // Create new channel using start-call endpoint
        apiEndpoint = `${process.env.NEXT_PUBLIC_AGORA_CREDENTIALS_API}/start-call` || "http://localhost:3000/api/start-call";
        requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }
        };
        isOwner = true;
      }

      const res = await fetch(apiEndpoint, requestOptions);

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }

      responseData = await res.json();

      // Handle different response formats
      const appId = responseData.appId;
      const channel = responseData.channel || responseData.channelName;
      const token = responseData.token;

      if (!appId || !channel || !token) {
        throw new Error("Invalid response: missing appId, channel, or token");
      }

      const AgoraRTC = await getAgoraRTC();
      const newClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Add connection state monitoring
      newClient.on("connection-state-change", (curState: string, revState: string) => {
        console.log(`Agora connection state changed: ${revState} -> ${curState}`);
        
        if (curState === "DISCONNECTED" && this.state.joined) {
          console.warn("Agora client disconnected unexpectedly");
          this.callbacks.onError?.("Connection lost");
          // Don't automatically leave, let the heartbeat handle it
        } else if (curState === "RECONNECTING") {
          console.log("Agora client attempting to reconnect...");
        } else if (curState === "CONNECTED") {
          console.log("Agora client connected successfully");
        }
      });

      // Monitor user events for better debugging
      newClient.on("user-left", (user: any, reason: string) => {
        console.log(`User ${user.uid} left channel, reason: ${reason}`);
      });

      // Join channel and publish mic (but no WebSocket yet)
      await newClient.join(appId, channel, token, null);
      const newMicTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await newClient.publish([newMicTrack]);

      // Add logging for existing remote users
      console.log(`Joined channel with ${newClient.remoteUsers.length} existing remote users`);
      newClient.remoteUsers.forEach((user: any) => {
        console.log(`Remote user ${user.uid} has audio: ${!!user.audioTrack}`);
      });

      this.state.client = newClient;
      this.state.micTrack = newMicTrack;
      this.state.joined = true;
      this.state.channelName = channel;
      this.state.isChannelOwner = isOwner;

      // Start heartbeat to monitor channel status
      this.startHeartbeat();

      console.log(`Successfully joined channel: ${channel} (Owner: ${isOwner})`);
      return { success: true, channelName: channel };
    } catch (error) {
      const errorMessage = `Failed to join channel: ${error instanceof Error ? error.message : "unknown error"}`;
      console.error(errorMessage, error);
      this.callbacks.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  public startCall(): boolean {
    if (!this.state.client || !this.state.joined) {
      this.callbacks.onError?.("Cannot start call: not joined to channel");
      return false;
    }

    const newCleanupFns: (() => void)[] = [];

    // Handle existing remote users first - subscribe and play their audio
    this.state.client.remoteUsers.forEach(async (user: any) => {
      console.log(`Processing existing remote user ${user.uid}...`);
      
      // Check if user has audio track
      if (user.audioTrack) {
        console.log(`Existing user ${user.uid} already has audio track, playing it`);
        user.audioTrack.play();
        
        // Set up WebSocket for this user
        const cleanup = this.setupWebSocketForUser(user);
        if (cleanup) newCleanupFns.push(cleanup);
      } else {
        console.log(`Existing user ${user.uid} has no audio track, trying to subscribe...`);
        try {
          // Subscribe to their audio if they have published it
          await this.state.client.subscribe(user, "audio");
          if (user.audioTrack) {
            console.log(`Successfully subscribed to ${user.uid} audio, now playing`);
            user.audioTrack.play();
            
            // Set up WebSocket for this user
            const cleanup = this.setupWebSocketForUser(user);
            if (cleanup) newCleanupFns.push(cleanup);
          }
        } catch (error) {
          console.log(`Could not subscribe to ${user.uid} audio:`, error);
        }
      }
    });

    // Listen for new users joining after call starts
    const handleUserPublished = async (user: any, mediaType: string) => {
      console.log(`User ${user.uid} published ${mediaType}`);
      
      try {
        // Subscribe to the user's media
        await this.state.client.subscribe(user, mediaType);
        
        if (mediaType === "audio") {
          // Always play audio to hear the remote user
          user.audioTrack.play();
          console.log(`Playing audio for user ${user.uid}`);
          
          // Set up WebSocket only if call is started
          if (this.state.callStarted) {
            const cleanup = this.setupWebSocketForUser(user);
            if (cleanup) {
              this.state.wsCleanupFns.push(cleanup);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to subscribe to user ${user.uid}:`, error);
        this.callbacks.onError?.(`Failed to subscribe to user ${user.uid}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    // Also handle user leaving
    const handleUserUnpublished = (user: any, mediaType: string) => {
      console.log(`User ${user.uid} unpublished ${mediaType}`);
      if (mediaType === "audio") {
        // Clean up WebSocket connection for this user
        const ws = this.state.wsConnections[user.uid];
        if (ws) {
          ws.close();
          delete this.state.wsConnections[user.uid];
        }
      }
    };

    this.state.client.on("user-published", handleUserPublished);
    this.state.client.on("user-unpublished", handleUserUnpublished);
    
    newCleanupFns.push(() => {
      this.state.client.off("user-published", handleUserPublished);
      this.state.client.off("user-unpublished", handleUserUnpublished);
    });

    this.state.wsCleanupFns = newCleanupFns;
    this.state.callStarted = true;

    console.log("Call started, listening for remote users");
    return true;
  }

  public stopCall(): void {
    // Clean up WebSocket connections first
    this.state.wsCleanupFns.forEach(cleanup => cleanup());
    this.state.wsCleanupFns = [];
    this.state.wsConnections = {};
    
    // Stop microphone track and unpublish
    if (this.state.micTrack) {
      this.state.micTrack.stop();
      this.state.micTrack.close();
    }
    
    // Unpublish all tracks from the client
    if (this.state.client && this.state.joined) {
      try {
        this.state.client.unpublish();
      } catch (error) {
        console.warn("Error unpublishing tracks:", error);
      }
    }
    
    this.state.callStarted = false;
    console.log("Call stopped completely");
  }

  public leaveChannel(): void {
    // First stop the call if it's active
    if (this.state.callStarted) {
      this.stopCall();
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Then leave the channel
    this.state.micTrack?.stop();
    this.state.client?.leave();
    this.state.client = null;
    this.state.micTrack = null;
    this.state.joined = false;
    this.state.channelName = undefined;
    this.state.isChannelOwner = false;
  }

  public async reconnectToChannel(): Promise<{ success: boolean; error?: string }> {
    if (!this.state.channelName) {
      return { success: false, error: "No channel to reconnect to" };
    }

    const channelName = this.state.channelName;
    console.log(`Attempting to reconnect to channel: ${channelName}`);

    try {
      // Clean up current state
      this.cleanup();
      
      // Try to rejoin the same channel
      const result = await this.joinChannel(channelName);
      
      if (result.success) {
        console.log("Successfully reconnected to channel");
        return { success: true };
      } else {
        console.error("Failed to reconnect:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = `Reconnection failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  public async listChannels(): Promise<{ success: boolean; channels?: any[]; error?: string }> {
    try {
      const apiEndpoint = `${process.env.NEXT_PUBLIC_AGORA_CREDENTIALS_API}/call-list` || "http://localhost:3000/api/list-call";
      const requestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-operator-key": "supersecret_operator_key"
        }
      };

      const res = await fetch(apiEndpoint, requestOptions);

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      const channels = responseData.channels || responseData.calls || responseData;

      console.log("Successfully retrieved channel list:", channels);
      return { success: true, channels };
    } catch (error) {
      const errorMessage = `Failed to list channels: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage, error);
      this.callbacks.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  public async closeChannel(): Promise<{ success: boolean; error?: string }> {
    if (!this.state.channelName || !this.state.isChannelOwner) {
      const error = "Cannot close channel: not the owner or no active channel";
      this.callbacks.onError?.(error);
      return { success: false, error };
    }

    if (!process.env.NEXT_PUBLIC_OPERATOR_KEY) {
      console.warn("Warning: NEXT_PUBLIC_OPERATOR_KEY environment variable is not set.");
    }
    try {
      const apiEndpoint = `${process.env.NEXT_PUBLIC_AGORA_CREDENTIALS_API}/end-call` || "http://localhost:3000/api/end-call";
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-key": process.env.NEXT_PUBLIC_OPERATOR_KEY || ""
        },
        body: JSON.stringify({ channelName: this.state.channelName })
      };

      const res = await fetch(apiEndpoint, requestOptions);

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();

      // Leave the channel after successful close
      this.leaveChannel();
      this.callbacks.onChannelClosed?.();

      console.log(`Successfully closed channel: ${this.state.channelName}`);
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to close channel: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage, error);
      this.callbacks.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  public cleanup(): void {
    if (this.state.callStarted) {
      this.state.wsCleanupFns.forEach(cleanup => cleanup());
    }
    this.stopHeartbeat();
    this.state.micTrack?.stop();
    this.state.client?.leave();
    this.state = {
      joined: false,
      callStarted: false,
      client: null,
      micTrack: null,
      wsConnections: {},
      wsCleanupFns: [],
      channelName: undefined,
      isChannelOwner: false,
      heartbeatActive: false
    };
  }

  public getWebSocketStatus(userId: string): string {
    const ws = this.state.wsConnections[userId];
    if (!ws) return 'Not connected';

    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'Connecting...';
      case WebSocket.OPEN:
        return 'Connected';
      case WebSocket.CLOSING:
        return 'Closing...';
      case WebSocket.CLOSED:
        return 'Closed';
      default:
        return 'Unknown';
    }
  }

  public getActiveConnections(): string[] {
    return Object.keys(this.state.wsConnections);
  }

  /**
   * Get AI recommendation for the current call
   */
  public async getAIRecommendation(): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.state.channelName) {
      return {
        success: false,
        error: 'No active call to get AI recommendation for'
      };
    }

    return await AIRecommendationService.getAIRecommendation(this.state.channelName);
  }

  public async muteAudio(mute: boolean = true): Promise<boolean> {
    if (!this.state.micTrack) {
      this.callbacks.onError?.("Cannot mute: no microphone track available");
      return false;
    }

    try {
      if (mute) {
        await this.state.micTrack.setMuted(true);
      } else {
        await this.state.micTrack.setMuted(false);
      }
      console.log(`Audio ${mute ? 'muted' : 'unmuted'}`);
      return true;
    } catch (error) {
      const errorMessage = `Failed to ${mute ? 'mute' : 'unmute'} audio: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      this.callbacks.onError?.(errorMessage);
      return false;
    }
  }

  public async pauseCall(pause: boolean = true): Promise<boolean> {
    if (!this.state.client || !this.state.joined) {
      this.callbacks.onError?.("Cannot pause: not joined to channel");
      return false;
    }

    try {
      if (pause) {
        // Unpublish microphone track to pause transmission
        if (this.state.micTrack) {
          await this.state.client.unpublish([this.state.micTrack]);
        }
      } else {
        // Re-publish microphone track to resume transmission
        if (this.state.micTrack) {
          await this.state.client.publish([this.state.micTrack]);
        }
      }
      console.log(`Call ${pause ? 'paused' : 'resumed'}`);
      return true;
    } catch (error) {
      const errorMessage = `Failed to ${pause ? 'pause' : 'resume'} call: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      this.callbacks.onError?.(errorMessage);
      return false;
    }
  }

  public async checkChannelHeartbeat(): Promise<boolean> {
    if (!this.state.channelName) {
      return false;
    }

    try {
      const apiEndpoint = `${process.env.NEXT_PUBLIC_AGORA_CREDENTIALS_API}/join-call` || "http://localhost:3000/api/heartbeat";
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-key": "supersecret_operator_key"
        },
        body: JSON.stringify({ channelName: this.state.channelName })
      };

      const res = await fetch(apiEndpoint, requestOptions);

      if (!res.ok) {
        console.warn(`Heartbeat failed: ${res.status} ${res.statusText}`);
        return false;
      }

      const responseData = await res.json();
      const isAlive = responseData.alive === true || responseData.status === 'active';

      return isAlive;
    } catch (error) {
      console.warn("Heartbeat check failed:", error);
      return false;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.state.heartbeatActive = true;
    let failedHeartbeats = 0;
    const maxFailedHeartbeats = 3; // Allow 3 failures before giving up

    // Check heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      const isAlive = await this.checkChannelHeartbeat();
      this.callbacks.onHeartbeatStatus?.(isAlive);

      if (!isAlive) {
        failedHeartbeats++;
        console.warn(`Heartbeat failed (${failedHeartbeats}/${maxFailedHeartbeats})`);
        
        if (failedHeartbeats >= maxFailedHeartbeats && this.state.joined) {
          console.warn("Channel appears to be dead after multiple failures, leaving channel");
          this.callbacks.onError?.("Channel is no longer active");
          this.callbacks.onChannelClosed?.();
        }
      } else {
        // Reset failed count on successful heartbeat
        failedHeartbeats = 0;
      }
    }, 30000);

    // Initial heartbeat check
    setTimeout(async () => {
      const isAlive = await this.checkChannelHeartbeat();
      this.callbacks.onHeartbeatStatus?.(isAlive);
    }, 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.state.heartbeatActive = false;
  }

  private setupWebSocketForUser(user: any): (() => void) | null {
    try {
      // Play audio so you can hear them
      user.audioTrack.play();

      // Open dedicated WebSocket for this user
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/v1/call/";
      const ws = new WebSocket(`${wsUrl}/${user.uid}`);
      ws.binaryType = "arraybuffer";

      console.log(`Opening WebSocket for user ${user.uid} at ${wsUrl}/${user.uid}`);
      
      // Handle WebSocket messages
      ws.onopen = () => {
        console.log(`WebSocket opened for user ${user.uid}`);
        this.callbacks.onWebSocketResponse?.(user.uid, { type: 'connection', status: 'connected' });
        this.callbacks.onConnectionStatusChange?.(user.uid, 'open');
      };

      ws.onmessage = (event) => {
        try {
          // Try to parse as JSON first
          const data = typeof event.data === 'string' ?
            JSON.parse(event.data) :
            event.data;

          console.log('Received WebSocket data:', data); // Add debug logging

          // Check if this is an analysis response - be more flexible with the check
          if (data && typeof data === 'object' && (
            (data.call_id && data.analysis && data.current_status) || // Original format
            (data.analysis && data.analysis.reasoning) || // Alternative format
            (data.type === 'analysis') // Another possible format
          )) {
            console.log('Detected analysis response, processing...');
            
            // Save to database automatically
            this.handleAIAnalysis(data as CallAnalysis);
            
            // Also notify callback
            this.callbacks.onAnalysisReceived?.(data as CallAnalysis);
          }

          this.callbacks.onWebSocketResponse?.(user.uid, { type: 'message', data });
        } catch (error) {
          console.log('Failed to parse WebSocket message as JSON, treating as binary:', error);
          // If not JSON, treat as binary or raw data
          this.callbacks.onWebSocketResponse?.(user.uid, {
            type: 'binary',
            size: event.data.byteLength || event.data.length,
            data: event.data instanceof ArrayBuffer ? '[Binary Data]' : event.data
          });
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for user ${user.uid}:`, error);
        this.callbacks.onWebSocketResponse?.(user.uid, { type: 'error', error: error.toString() });
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed for user ${user.uid}:`, event.code, event.reason);
        this.callbacks.onWebSocketResponse?.(user.uid, {
          type: 'connection',
          status: 'closed',
          code: event.code,
          reason: event.reason
        });
        this.callbacks.onConnectionStatusChange?.(user.uid, 'closed');
      };

      // Store the WebSocket connection
      this.state.wsConnections[user.uid] = ws;

      // Try to set up audio processing with better error handling
      try {
        // Create audio context with default sample rate first
        const audioCtx = new AudioContext(); // Use default sample rate
        const remoteStreamTrack = user.audioTrack.getMediaStreamTrack();
        
        console.log(`Audio context sample rate: ${audioCtx.sampleRate}Hz for user ${user.uid}`);
        
        const srcNode = audioCtx.createMediaStreamSource(
          new MediaStream([remoteStreamTrack])
        );
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);

        srcNode.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Handle sample rate conversion properly
              let processedData: Float32Array;
              if (audioCtx.sampleRate === 16000) {
                // Already at 16kHz, no conversion needed
                processedData = inputData;
              } else {
                // Convert to 16kHz
                processedData = downsampleTo16kHz(inputData, audioCtx.sampleRate);
              }
              
              const int16 = floatTo16BitPCM(processedData);
              ws.send(int16);
            } catch (audioError) {
              console.warn(`Audio processing error for user ${user.uid}:`, audioError);
            }
          }
        };

        // Return cleanup function
        return () => {
          try {
            ws.close();
            processor.disconnect();
            srcNode.disconnect();
            audioCtx.close();
          } catch (cleanupError) {
            console.warn(`Cleanup error for user ${user.uid}:`, cleanupError);
          }

          // Remove from connections tracking
          delete this.state.wsConnections[user.uid];
        };

      } catch (audioSetupError) {
        console.error(`Failed to setup audio processing for user ${user.uid}:`, audioSetupError);
        
        // If audio setup fails, still return a cleanup function for the WebSocket
        return () => {
          ws.close();
          delete this.state.wsConnections[user.uid];
        };
      }

    } catch (error: unknown) {
      console.error("Failed to setup WebSocket for user:", user.uid, error);
      this.callbacks.onError?.(`Failed to setup WebSocket for user ${user.uid}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // Add this method for testing WebSocket connections
  public testWebSocketConnection(): void {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/v1/call/";
    const testWs = new WebSocket(`${wsUrl}/test`);
    
    testWs.onopen = () => {
      console.log("Test WebSocket connection successful");
      testWs.close();
    };
    
    testWs.onerror = (error) => {
      console.error("Test WebSocket connection failed:", error);
    };

    testWs.onclose = (event) => {
      console.log("Test WebSocket closed:", event.code, event.reason);
    };
  }
}
