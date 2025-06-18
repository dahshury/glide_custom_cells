export class FormattingService {
  static formatValue(value: any, columnType: string, format: string): string {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    switch (columnType) {
      case "number":
      case "progress":
        return this.formatNumber(value, format);
      case "date":
        return this.formatDate(value, format);
      case "time":
        return this.formatTime(value, format);
      case "datetime":
        return this.formatDateTime(value, format);
      default:
        return String(value);
    }
  }

  private static formatNumber(value: number | string, format: string): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);

    switch (format) {
      case "automatic":
        return num.toLocaleString();
      case "localized":
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
      case "plain":
        return String(num);
      case "compact":
        return new Intl.NumberFormat(undefined, { 
          notation: "compact", 
          compactDisplay: "short" 
        }).format(num);
      case "dollar":
        return new Intl.NumberFormat("en-US", { 
          style: "currency", 
          currency: "USD" 
        }).format(num);
      case "euro":
        return new Intl.NumberFormat("en-EU", { 
          style: "currency", 
          currency: "EUR" 
        }).format(num);
      case "yen":
        return new Intl.NumberFormat("ja-JP", { 
          style: "currency", 
          currency: "JPY" 
        }).format(num);
      case "percent":
        return new Intl.NumberFormat(undefined, { 
          style: "percent", 
          minimumFractionDigits: 0,
          maximumFractionDigits: 2 
        }).format(num);
      case "scientific":
        return num.toExponential(2);
      case "accounting":
        return new Intl.NumberFormat(undefined, { 
          style: "currency", 
          currency: "USD",
          currencySign: "accounting" 
        }).format(num);
      default:
        return num.toLocaleString();
    }
  }

  private static formatDate(value: string | Date, format: string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);

    switch (format) {
      case "localized":
        // Jun 23, 2025
        return date.toLocaleDateString(undefined, { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        });
      case "automatic":
        // ISO format: 2025-06-23
        return date.toISOString().split("T")[0];
      case "distance":
        return this.formatRelativeTime(date);
      default:
        return date.toLocaleDateString();
    }
  }

  private static formatTime(value: string | Date, format: string): string {
    const date = value instanceof Date ? value : new Date(`2000-01-01T${value}`);
    if (isNaN(date.getTime())) return String(value);

    switch (format) {
      case "localized":
        // 3:45 PM
        return date.toLocaleTimeString(undefined, { 
          hour: "numeric", 
          minute: "2-digit" 
        });
      case "automatic":
        // 24-hour format: 15:45
        return date.toLocaleTimeString("en-GB", { 
          hour: "2-digit", 
          minute: "2-digit" 
        });
      default:
        return date.toLocaleTimeString();
    }
  }

  private static formatDateTime(value: string | Date, format: string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);

    switch (format) {
      case "localized":
        // Jun 23, 2025 3:45 PM
        return date.toLocaleDateString(undefined, { 
          year: "numeric", 
          month: "short", 
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
      case "automatic":
        // ISO format
        return date.toISOString();
      case "distance":
        return this.formatRelativeTime(date);
      case "calendar":
        return this.formatCalendarTime(date);
      default:
        return date.toLocaleString();
    }
  }

  private static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (Math.abs(diffMinutes) < 1) return "just now";
    if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${-diffMinutes} minutes ago`;
    }
    if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours} hours` : `${-diffHours} hours ago`;
    }
    if (Math.abs(diffDays) < 30) {
      return diffDays > 0 ? `in ${diffDays} days` : `${-diffDays} days ago`;
    }
    
    const diffMonths = Math.round(diffDays / 30);
    if (Math.abs(diffMonths) < 12) {
      return diffMonths > 0 ? `in ${diffMonths} months` : `${-diffMonths} months ago`;
    }
    
    const diffYears = Math.round(diffDays / 365);
    return diffYears > 0 ? `in ${diffYears} years` : `${-diffYears} years ago`;
  }

  private static formatCalendarTime(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((dateDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString(undefined, { 
      hour: "numeric", 
      minute: "2-digit" 
    });

    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Tomorrow at ${timeStr}`;
    if (diffDays === -1) return `Yesterday at ${timeStr}`;
    if (diffDays > 1 && diffDays < 7) {
      const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
      return `${dayName} at ${timeStr}`;
    }
    
    return date.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
} 