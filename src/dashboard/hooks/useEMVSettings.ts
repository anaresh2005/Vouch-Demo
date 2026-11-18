import { useState, useCallback } from 'react';

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
    const instagramCPE = typeof parsed.instagramCPE === 'number' && parsed.instagramCPE >= 0.01 && parsed.instagramCPE <= 100 ? parsed.instagramCPE : EMV_DEFAULTS.instagramCPE;
    const tiktokCPE = typeof parsed.tiktokCPE === 'number' && parsed.tiktokCPE >= 0.01 && parsed.tiktokCPE <= 100 ? parsed.tiktokCPE : EMV_DEFAULTS.tiktokCPE;
    return { instagramCPE, tiktokCPE };
  } catch {
    return EMV_DEFAULTS;
  }
}

export function useEMVSettings() {
  const [settings, setSettings] = useState<EMVSettings>(loadFromStorage);

  const saveSettings = useCallback((next: EMVSettings) => {
    if (![next.instagramCPE, next.tiktokCPE].every(value => Number.isFinite(value) && value >= 0.01 && value <= 100)) {
      throw new Error('Value per engagement must be between $0.01 and $100.');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSettings(next);
  }, []);

  return { settings, saveSettings };
}
