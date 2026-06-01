import { useState, useEffect, useCallback } from 'react';

export interface EMVSettings {
  instagramCPE: number; // $ per engagement for Instagram
  tiktokCPE: number;   // $ per engagement for TikTok
}

export const EMV_DEFAULTS: EMVSettings = {
  instagramCPE: 0.25,
  tiktokCPE: 0.20,
};

const STORAGE_KEY = 'vouch_emv_settings';

function loadFromStorage(): EMVSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMV_DEFAULTS;
    const parsed = JSON.parse(raw);
    const instagramCPE = typeof parsed.instagramCPE === 'number' && parsed.instagramCPE > 0 ? parsed.instagramCPE : EMV_DEFAULTS.instagramCPE;
    const tiktokCPE = typeof parsed.tiktokCPE === 'number' && parsed.tiktokCPE > 0 ? parsed.tiktokCPE : EMV_DEFAULTS.tiktokCPE;
    return { instagramCPE, tiktokCPE };
  } catch {
    return EMV_DEFAULTS;
  }
}

export function useEMVSettings() {
  const [settings, setSettings] = useState<EMVSettings>(loadFromStorage);

  const saveSettings = useCallback((next: EMVSettings) => {
    // Clamp values to reasonable bounds: $0.01 – $100
    const clamped: EMVSettings = {
      instagramCPE: Math.min(100, Math.max(0.01, next.instagramCPE)),
      tiktokCPE: Math.min(100, Math.max(0.01, next.tiktokCPE)),
    };
    setSettings(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
    } catch {
      // localStorage unavailable — settings still work in-memory
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    saveSettings(EMV_DEFAULTS);
  }, [saveSettings]);

  return { settings, saveSettings, resetToDefaults };
}
