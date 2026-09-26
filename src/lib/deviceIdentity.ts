/**
 * Device identity management for multi-room couch play.
 * Generates and preserves a unique UUID across sessions so multiple rooms can be joined
 * from the same device without keystroke conflicts.
 */
export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem('pixel_device_id');
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        deviceId = crypto.randomUUID();
      } else {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
      localStorage.setItem('pixel_device_id', deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 10);
  }
}
