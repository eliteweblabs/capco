/**
 * Banner Alert Feature
 *
 * Site-wide banner alerts with position and expiration settings.
 *
 * Components:
 * - BannerAlert.astro - Individual banner alert component
 * - BannerAlertsLoader.astro - Loads and displays all active banners
 *
 * API Endpoints:
 * - GET /api/banner-alerts/get - Fetch active banners
 * - POST /api/banner-alerts/upsert - Create/update banners
 * - POST /api/banner-alerts/delete - Delete banners
 *
 * Admin Page:
 * - /admin/banner-alerts - Manage banner alerts
 *
 * Shortcode Usage:
 * - <BannerAlert id="123"/> - Display specific banner by ID
 * - <BannerAlertsLoader/> - Display all active banners
 * - <BannerAlertsLoader position="top"/> - Display only top banners
 * - <BannerAlertsLoader position="bottom"/> - Display only bottom banners
 */

export interface BannerAlert {
  id: number;
  title?: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  position: "top" | "bottom";
  expireMs: number | null;
  dismissible: boolean;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
