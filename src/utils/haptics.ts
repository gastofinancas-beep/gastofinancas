export function triggerHaptic(duration = 10) {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      const enabled = localStorage.getItem('gasto_haptics_enabled');
      if (enabled === 'false') return;
      navigator.vibrate(duration);
    } catch {
      // Ignore vibration errors on unsupported devices/browsers
    }
  }
}
