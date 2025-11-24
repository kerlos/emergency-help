'use client';

const USER_PINS_KEY = 'userPins';

export function saveUserPin(pinId: number): void {
  if (typeof window === 'undefined') return;
  
  const pins = getUserPins();
  if (!pins.includes(pinId)) {
    pins.push(pinId);
    localStorage.setItem(USER_PINS_KEY, JSON.stringify(pins));
  }
}

export function getUserPins(): number[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(USER_PINS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function isUserPin(pinId: number): boolean {
  return getUserPins().includes(pinId);
}

export function removeUserPin(pinId: number): void {
  if (typeof window === 'undefined') return;
  
  const pins = getUserPins().filter(id => id !== pinId);
  localStorage.setItem(USER_PINS_KEY, JSON.stringify(pins));
}

