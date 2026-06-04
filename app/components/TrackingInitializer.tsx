'use client';

import { useEffect } from 'react';
import { initializeTracking } from '../lib/trackingClient';

export function TrackingInitializer() {
  useEffect(() => {
    initializeTracking();
  }, []);

  return null;
}
