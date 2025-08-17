"use client";
import { useEffect, useState } from "react";
import { getAgoraRTC } from "@/lib/agoraClient";

// --- helpers ---
function downsampleTo16kHz(input: Float32Array, inputSampleRate: number) {
  if (inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
      accum += input[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function floatTo16BitPCM(float32Array: Float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export default function VoiceCall() {
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let client: any;
    let micTrack: any;
    let cleanupFns: (() => void)[] = [];

    (async () => {
      // 1. Get channel/token from your API using environment variable
      const apiEndpoint = process.env.NEXT_PUBLIC_AGORA_CREDENTIALS_API || "http://localhost:3000/api/start-call";
      const res = await fetch(apiEndpoint, { method: "POST" });
      const { appId, channel, token } = await res.json();

      const AgoraRTC = await getAgoraRTC();
      client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // 2. For each remote user, open its own WebSocket + processor
      client.on("user-published", async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType);

        if (mediaType === "audio") {
          // Play so you can hear them
          user.audioTrack.play();

          // Open dedicated WS for this user using environment variable
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/v1/call/";
          const ws = new WebSocket(`${wsUrl}/${user.uid}`);
          ws.binaryType = "arraybuffer";

          // Create audio context at 16kHz
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          const remoteStreamTrack = user.audioTrack.getMediaStreamTrack();
          const srcNode = audioCtx.createMediaStreamSource(
            new MediaStream([remoteStreamTrack])
          );
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          srcNode.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const downsampled = downsampleTo16kHz(inputData, audioCtx.sampleRate);
              const int16 = floatTo16BitPCM(downsampled);
              ws.send(int16);
            }
          };

          // Track cleanup
          cleanupFns.push(() => {
            ws.close();
            processor.disconnect();
            srcNode.disconnect();
            audioCtx.close();
          });
        }
      });

      // 3. Join + publish your mic
      await client.join(appId, channel, token, null);
      micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([micTrack]);

      cleanupFns.push(() => micTrack?.stop());
      cleanupFns.push(() => client?.leave());

      setJoined(true);
    })();

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return <div>{joined ? "In voice call" : "Joining..."}</div>;
}
