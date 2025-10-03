const STORAGE_KEY = 'voicera_read_notifications';
const MAX_AGE_DAYS = 7;

export interface ReadNotification {
  id: string;
  readAt: number; // timestamp
}

export const notificationStorage = {
  getReadNotifications(): ReadNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const notifications: ReadNotification[] = JSON.parse(stored);
      const cutoffTime = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
      
      // Filter out old notifications to prevent localStorage bloat
      return notifications.filter(n => n.readAt > cutoffTime);
    } catch (error) {
      console.error('Error reading notification storage:', error);
      return [];
    }
  },

  markAsRead(notificationIds: string[]): void {
    try {
      const existing = this.getReadNotifications();
      const newReadNotifications: ReadNotification[] = notificationIds.map(id => ({
        id,
        readAt: Date.now(),
      }));
      
      // Merge and deduplicate
      const allRead = [...existing, ...newReadNotifications];
      const unique = allRead.filter((n, index, self) => 
        index === self.findIndex(t => t.id === n.id)
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    } catch (error) {
      console.error('Error saving notification storage:', error);
    }
  },

  isRead(notificationId: string): boolean {
    const readNotifications = this.getReadNotifications();
    return readNotifications.some(n => n.id === notificationId);
  },

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notification storage:', error);
    }
  }
};
