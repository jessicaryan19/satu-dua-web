// lib/agoraClient.ts
import type AgoraRTCType from "agora-rtc-sdk-ng";

let AgoraRTC: typeof AgoraRTCType | null = null;

export const getAgoraRTC = async () => {
  if (!AgoraRTC) {
    const mod = await import("agora-rtc-sdk-ng");
    AgoraRTC = mod.default;
  }
  return AgoraRTC;
};

