// Types for Notification component
export interface NotificationProps {
  show: boolean;
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning';
}

