import { CallService, CallCallbacks } from "@/services/callService";

class CallServiceSingleton {
  private static instance: CallService | null = null;

  public static getInstance(callbacks?: CallCallbacks): CallService {
    if (!CallServiceSingleton.instance) {
      CallServiceSingleton.instance = new CallService(callbacks);
    } else if (callbacks) {
      // Update callbacks on existing instance
      CallServiceSingleton.instance.updateCallbacks(callbacks);
    }
    return CallServiceSingleton.instance;
  }

  public static hasInstance(): boolean {
    return CallServiceSingleton.instance !== null;
  }

  public static resetInstance(): void {
    if (CallServiceSingleton.instance) {
      CallServiceSingleton.instance.cleanup();
      CallServiceSingleton.instance = null;
    }
  }

  public static getInstanceState() {
    return CallServiceSingleton.instance?.getState() || null;
  }
}

export default CallServiceSingleton;
