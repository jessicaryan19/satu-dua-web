"use client";

// SAMPLE USAGE DONT USE IN PRODUCTION

import dynamic from "next/dynamic";
const VoiceCall = dynamic(() => import("@/components/util/VoiceCall"), { ssr: false });

export default function Home() {
  return <VoiceCall />;
}

