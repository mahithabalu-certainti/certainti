import { useEffect, useState, useCallback } from 'react';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing Service Worker and Push Notifications
 *
 * Features:
 * - Registers service worker
 * - Manages push notification subscriptions
 * - Handles permission requests
 * - Provides methods to show notifications
 *
 * @returns Object with subscription state and control methods
 */
export const useServiceWorkerPush = () => {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    isLoading: true,
    error: null,
  });

  // Check if Service Worker and Push API are supported
  useEffect(() => {
    const isSupported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setState((prev) => ({
      ...prev,
      isSupported,
      isLoading: !isSupported,
    }));

    if (!isSupported) {
      return;
    }

    // Register service worker
    registerServiceWorker();
  }, []);

  // Register Service Worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );

      // Check for existing subscription
      const subscription = await registration.pushManager.getSubscription();

      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
        isLoading: false,
      }));

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker?.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // Optionally notify user about update
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to register Service Worker',
        isLoading: false,
      }));
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to request notification permission',
      }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.isSupported) {
      return null;
    }

    try {
      // Request permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return null;
      }

      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const subscribeOptions: PushSubscriptionOptionsInit = {
          userVisibleOnly: true,
        };

        subscription =
          await registration.pushManager.subscribe(subscribeOptions);

        // TODO: Send subscription to your backend server
        // await sendSubscriptionToServer(subscription);
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
      }));

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to subscribe to push notifications',
      }));
      return null;
    }
  }, [state.isSupported, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return false;
    }

    try {
      await state.subscription.unsubscribe();

      // TODO: Remove subscription from your backend server
      // await removeSubscriptionFromServer(state.subscription);

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }));
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to unsubscribe from push notifications',
      }));
      return false;
    }
  }, [state.subscription]);

  // Show a notification using the Service Worker
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!state.isSupported) {
        return;
      }

      try {
        // Request permission if not granted
        if (Notification.permission !== 'granted') {
          const hasPermission = await requestPermission();
          if (!hasPermission) {
            return;
          }
        }

        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'app-notification',
          ...options,
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    },
    [state.isSupported, requestPermission]
  );

  // Send a message to the Service Worker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendMessageToSW = useCallback(async (message: any) => {
    if (!navigator.serviceWorker.controller) {
      console.warn('No active Service Worker controller');
      return;
    }

    navigator.serviceWorker.controller.postMessage(message);
  }, []);

  return {
    // State
    isSupported: state.isSupported,
    isSubscribed: state.isSubscribed,
    subscription: state.subscription,
    isLoading: state.isLoading,
    error: state.error,
    permission:
      typeof Notification !== 'undefined' ? Notification.permission : 'default',

    // Methods
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    sendMessageToSW,
  };
};
