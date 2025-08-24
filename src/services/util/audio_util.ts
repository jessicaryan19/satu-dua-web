
export function downsampleTo16kHz(input: Float32Array, inputSampleRate: number) {
  // Validate inputs
  if (!input || input.length === 0) {
    console.warn("Empty input array for downsampling");
    return new Float32Array(0);
  }
  
  if (inputSampleRate <= 0) {
    console.warn("Invalid input sample rate:", inputSampleRate);
    return input;
  }
  
  if (inputSampleRate === 16000) return input;
  
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const sourceIndex = Math.round(i * ratio);
    if (sourceIndex < input.length) {
      result[i] = input[sourceIndex];
    }
  }
  
  return result;
}

export function floatTo16BitPCM(float32Array: Float32Array) {
  // Validate input
  if (!float32Array || float32Array.length === 0) {
    console.warn("Empty input array for PCM conversion");
    return new ArrayBuffer(0);
  }
  
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    // Clamp values to valid range and handle NaN/Infinity
    let s = float32Array[i];
    if (isNaN(s) || !isFinite(s)) {
      s = 0;
    } else {
      s = Math.max(-1, Math.min(1, s));
    }
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
