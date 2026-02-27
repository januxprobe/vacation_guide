'use client';

import { createContext, useContext } from 'react';
import type { TripConfig } from './trip-config';

const TripConfigContext = createContext<TripConfig | null>(null);

export function TripConfigProvider({
  config,
  children,
}: {
  config: TripConfig;
  children: React.ReactNode;
}) {
  return (
    <TripConfigContext.Provider value={config}>
      {children}
    </TripConfigContext.Provider>
  );
}

export function useTripConfig(): TripConfig {
  const config = useContext(TripConfigContext);
  if (!config) {
    throw new Error('useTripConfig must be used within a TripConfigProvider');
  }
  return config;
}
