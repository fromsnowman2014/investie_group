/**
 * Layout Storage System
 * Handles persistence of dashboard layouts to localStorage and cookies
 */

import { DashboardLayout } from './types';
import { DEFAULT_LAYOUT } from './defaultLayout';

const LAYOUT_STORAGE_KEY = 'investie_dashboard_layout';
const LAYOUT_COOKIE_NAME = 'investie_layout';
const LAYOUT_VERSION = '1.0.0';

export class LayoutStorage {
  /**
   * Save layout to both localStorage and cookie for redundancy
   */
  static saveLayout(layout: DashboardLayout): void {
    try {
      const serialized = JSON.stringify(layout);

      // LocalStorage (primary)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LAYOUT_STORAGE_KEY, serialized);
      }

      // Cookie (backup, expires in 1 year)
      if (typeof document !== 'undefined') {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        document.cookie = `${LAYOUT_COOKIE_NAME}=${encodeURIComponent(serialized)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Layout saved successfully');
      }
    } catch (error) {
      console.error('❌ Failed to save layout:', error);
    }
  }

  /**
   * Load layout from storage (localStorage first, then cookie fallback)
   */
  static loadLayout(): DashboardLayout | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // Try localStorage first
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) {
        const layout = JSON.parse(stored);
        if (this.validateLayout(layout)) {
          return layout;
        }
      }

      // Fallback to cookie
      const cookieValue = this.getCookie(LAYOUT_COOKIE_NAME);
      if (cookieValue) {
        const layout = JSON.parse(decodeURIComponent(cookieValue));
        if (this.validateLayout(layout)) {
          return layout;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to load layout:', error);
      return null;
    }
  }

  /**
   * Reset layout to default configuration
   */
  static resetToDefault(): DashboardLayout {
    const defaultLayout: DashboardLayout = {
      ...DEFAULT_LAYOUT,
      lastModified: new Date().toISOString()
    };
    this.saveLayout(defaultLayout);
    return defaultLayout;
  }

  /**
   * Clear all saved layouts
   */
  static clearLayout(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
      }

      if (typeof document !== 'undefined') {
        document.cookie = `${LAYOUT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Layout cleared successfully');
      }
    } catch (error) {
      console.error('❌ Failed to clear layout:', error);
    }
  }

  /**
   * Validate layout structure
   */
  private static validateLayout(layout: unknown): layout is DashboardLayout {
    if (!layout || typeof layout !== 'object') return false;

    const obj = layout as Record<string, unknown>;
    return !!(
      obj.version &&
      Array.isArray(obj.widgets) &&
      obj.gridConfig &&
      obj.widgets.length > 0
    );
  }

  /**
   * Get cookie value by name
   */
  private static getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const matches = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)
    );
    return matches ? matches[1] : null;
  }

  /**
   * Export layout as JSON file
   */
  static exportLayout(layout: DashboardLayout): void {
    try {
      const dataStr = JSON.stringify(layout, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `investie-layout-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Layout exported successfully');
      }
    } catch (error) {
      console.error('❌ Failed to export layout:', error);
    }
  }

  /**
   * Import layout from JSON
   */
  static importLayout(jsonString: string): DashboardLayout | null {
    try {
      const layout = JSON.parse(jsonString);
      if (this.validateLayout(layout)) {
        this.saveLayout(layout);
        return layout;
      }
      throw new Error('Invalid layout format');
    } catch (error) {
      console.error('❌ Failed to import layout:', error);
      return null;
    }
  }
}
