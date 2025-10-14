import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/page-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ page: location }),
        });
      } catch (error) {
        // Silently fail - tracking shouldn't break the app
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location]);
}
