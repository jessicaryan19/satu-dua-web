"use client";
import { useEffect, useState, useRef } from "react";
import { CallService, WebSocketResponse } from "@/services/callService";

export default function VoiceCall() {
  const [joined, setJoined] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [channelNameInput, setChannelNameInput] = useState("");
  const [isChannelOwner, setIsChannelOwner] = useState(false);
  const [currentChannelName, setCurrentChannelName] = useState<string>("");
  const [heartbeatStatus, setHeartbeatStatus] = useState<boolean | null>(null);

  // Store WebSocket responses
  const [wsResponses, setWsResponses] = useState<{ [userId: string]: WebSocketResponse[] }>({});
  const [wsConnections, setWsConnections] = useState<string[]>([]);

  // Use ref to maintain service instance across renders
  const callServiceRef = useRef<CallService | null>(null);

  // Initialize call service
  useEffect(() => {
    const callbacks = {
      onWebSocketResponse: (userId: string, response: any) => {
        addWebSocketResponse(userId, response);
      },
      onConnectionStatusChange: (userId: string, status: 'connecting' | 'open' | 'closing' | 'closed') => {
        updateConnectionsList();
      },
      onError: (error: string) => {
        alert(error);
      },
      onChannelClosed: () => {
        alert("Channel has been closed");
        setJoined(false);
        setCallStarted(false);
        setIsChannelOwner(false);
        setCurrentChannelName("");
        setHeartbeatStatus(null);
        setWsResponses({});
        setWsConnections([]);
      },
      onHeartbeatStatus: (isAlive: boolean) => {
        setHeartbeatStatus(isAlive);
      }
    };

    callServiceRef.current = new CallService(callbacks);

    return () => {
      callServiceRef.current?.cleanup();
    };
  }, []);

  // Update connections list from service state
  const updateConnectionsList = () => {
    if (callServiceRef.current) {
      const connections = callServiceRef.current.getActiveConnections();
      setWsConnections(connections);
    }
  };

  // Add response to the state
  const addWebSocketResponse = (userId: string, response: any) => {
    setWsResponses(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), {
        timestamp: new Date().toLocaleTimeString(),
        data: response
      }]
    }));
  };

  // Clear responses for a specific user
  const clearUserResponses = (userId: string) => {
    setWsResponses(prev => {
      const newResponses = { ...prev };
      delete newResponses[userId];
      return newResponses;
    });
  };

  // Clear all responses
  const clearAllResponses = () => {
    setWsResponses({});
  };

  // Join the channel but don't start WebSocket connections yet
  const joinChannel = async () => {
    if (!callServiceRef.current) return;

    const result = await callServiceRef.current.joinChannel(channelNameInput);

    if (result.success) {
      const serviceState = callServiceRef.current.getState();
      setJoined(true);
      setIsChannelOwner(serviceState.isChannelOwner);
      setCurrentChannelName(result.channelName || "");
      console.log(`Successfully joined channel: ${result.channelName}`);
    } else {
      console.error("Failed to join channel:", result.error);
    }
  };

  // Close the channel (only for owners)
  const closeChannel = async () => {
    if (!callServiceRef.current) return;

    const result = await callServiceRef.current.closeChannel();

    if (result.success) {
      setJoined(false);
      setCallStarted(false);
      setIsChannelOwner(false);
      setCurrentChannelName("");
      setHeartbeatStatus(null);
      setWsResponses({});
      setWsConnections([]);
      console.log("Channel closed successfully");
    }
  };

  // Start the call - this enables WebSocket connections for remote users
  const startCall = () => {
    if (!callServiceRef.current) return;

    const success = callServiceRef.current.startCall();
    if (success) {
      setCallStarted(true);
      updateConnectionsList();
    }
  };

  // Stop the call - cleanup WebSocket connections but stay in channel
  const stopCall = () => {
    if (!callServiceRef.current) return;

    callServiceRef.current.stopCall();
    setCallStarted(false);
    setWsConnections([]);
  };

  // Leave the channel entirely
  const leaveChannel = () => {
    if (!callServiceRef.current) return;

    callServiceRef.current.leaveChannel();
    setJoined(false);
    setCallStarted(false);
    setIsChannelOwner(false);
    setCurrentChannelName("");
    setHeartbeatStatus(null);
    setWsResponses({});
    setWsConnections([]);
  };

  // Get WebSocket status for a user
  const getWebSocketStatus = (userId: string): string => {
    if (!callServiceRef.current) return 'Not connected';
    return callServiceRef.current.getWebSocketStatus(userId);
  };

  // Render WebSocket response for a specific user
  const renderUserResponses = (userId: string) => {
    const responses = wsResponses[userId] || [];
    if (responses.length === 0) return null;

    return (
      <div key={userId} style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        margin: '10px 0',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <strong>User {userId} Responses ({responses.length})</strong>
          <button
            onClick={() => clearUserResponses(userId)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        </div>

        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {responses.map((response, index) => (
            <div key={index} style={{
              padding: '4px 0',
              borderBottom: index < responses.length - 1 ? '1px solid #eee' : 'none'
            }}>
              <span style={{ color: '#666' }}>[{response.timestamp}]</span>{' '}
              <span style={{
                color: response.data.type === 'error' ? '#ff6b6b' :
                  response.data.type === 'connection' ? '#51cf66' : '#339af0'
              }}>
                {response.data.type}:
              </span>{' '}
              <span>
                {typeof response.data.data === 'object' ?
                  JSON.stringify(response.data.data, null, 2) :
                  response.data.data || response.data.status || response.data.error || 'Unknown'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong> {
            !joined ? "Not connected" :
              !callStarted ? "Connected (audio not being processed)" :
                "In active call (audio being processed)"
          }
        </div>

        {joined && currentChannelName && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Channel:</strong> {currentChannelName}
            {isChannelOwner && <span style={{ color: '#28a745', marginLeft: '8px' }}>(Owner)</span>}
          </div>
        )}

        {joined && heartbeatStatus !== null && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Channel Status:</strong>
            <span style={{
              color: heartbeatStatus ? '#28a745' : '#dc3545',
              marginLeft: '8px',
              fontWeight: 'bold'
            }}>
              {heartbeatStatus ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
        )}
      </div>

      {/* Channel input section */}
      {!joined && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="channelName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Channel Name (optional):
            </label>
            <input
              id="channelName"
              type="text"
              value={channelNameInput}
              onChange={(e) => setChannelNameInput(e.target.value)}
              placeholder="Enter channel name to join existing, or leave empty to create new"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            <strong>Leave empty</strong> to create a new channel, or <strong>enter a channel name</strong> to join an existing one.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {!joined && (
          <button onClick={joinChannel} style={{ padding: '10px 20px' }}>
            {channelNameInput.trim() ? `Join Channel "${channelNameInput}"` : "Create & Join New Channel"}
          </button>
        )}

        {joined && !callStarted && (
          <button onClick={startCall} style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white' }}>
            Start Call
          </button>
        )}

        {joined && callStarted && (
          <button onClick={stopCall} style={{ padding: '10px 20px', backgroundColor: 'orange', color: 'white' }}>
            Stop Call
          </button>
        )}

        {joined && (
          <button onClick={leaveChannel} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white' }}>
            Leave Channel
          </button>
        )}

        {joined && isChannelOwner && (
          <button
            onClick={closeChannel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              marginLeft: '10px'
            }}
          >
            Close Channel
          </button>
        )}

        {Object.keys(wsResponses).length > 0 && (
          <button
            onClick={clearAllResponses}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              marginLeft: 'auto'
            }}
          >
            Clear All Responses
          </button>
        )}
      </div>

      {joined && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
          {callStarted ?
            "🟢 Audio is being sent to WebSocket for processing" :
            "⏸️ Audio is not being processed (call not started)"
          }
        </div>
      )}

      {/* WebSocket Connection Status */}
      {callStarted && wsConnections.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Active WebSocket Connections:</h3>
          {wsConnections.map((userId) => (
            <div key={userId} style={{
              display: 'inline-block',
              margin: '4px',
              padding: '6px 12px',
              backgroundColor: getWebSocketStatus(userId) === 'Connected' ? '#d4edda' : '#f8d7da',
              color: getWebSocketStatus(userId) === 'Connected' ? '#155724' : '#721c24',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              User {userId}: {getWebSocketStatus(userId)}
            </div>
          ))}
        </div>
      )}

      {/* WebSocket Responses */}
      {Object.keys(wsResponses).length > 0 && (
        <div>
          <h3>WebSocket Responses:</h3>
          {Object.keys(wsResponses).map(userId => renderUserResponses(userId))}
        </div>
      )}

      {Object.keys(wsResponses).length === 0 && callStarted && (
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontStyle: 'italic',
          padding: '20px'
        }}>
          No WebSocket responses yet...
        </div>
      )}
    </div>
  );
}
