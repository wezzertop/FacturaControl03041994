/**
 * Utilidades para Notificaciones Web Push y Locales en iOS y Android PWA
 */

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  type: 'reminder' | 'payment_due' | 'transaction' | 'system';
  read: boolean;
  actionUrl?: string;
}

const STORAGE_KEY = 'fc_local_notifications_v1';
const PREFS_KEY = 'fc_notification_preferences_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('Error al solicitar permiso de notificaciones:', err);
    return false;
  }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
          vibrate: [200, 100, 200],
          ...options,
        } as any);
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.svg',
        ...options,
      });
    }
    return true;
  } catch (err) {
    console.warn('Fallo al disparar notificación nativa:', err);
    return false;
  }
}

export function getStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialNotifications();
    return JSON.parse(raw);
  } catch {
    return getInitialNotifications();
  }
}

export function saveNotification(notif: Omit<AppNotification, 'id' | 'date' | 'read'>): AppNotification {
  const list = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    date: new Date().toISOString(),
    read: false,
  };

  const updated = [newNotif, ...list].slice(0, 50); // Guardar últimas 50
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // Disparar notificación del navegador si está permitido
  sendBrowserNotification(newNotif.title, {
    body: newNotif.body,
  });

  return newNotif;
}

export function markAllNotificationsAsRead(): void {
  if (typeof window === 'undefined') return;
  const list = getStoredNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function clearAllNotifications(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

function getInitialNotifications(): AppNotification[] {
  return [
    {
      id: 'welcome_1',
      title: '¡Bienvenido a FacturaControl Móvil!',
      body: 'Recuerda que puedes instalar la app en tu pantalla de inicio y registrar compras al instante.',
      date: new Date().toISOString(),
      type: 'system',
      read: false,
      actionUrl: '/',
    },
  ];
}
