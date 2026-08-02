export const THEME_KEY = "habit-tracker-theme";
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const FREQUENCIES = ["Daily", "Weekdays", "Weekends", "Custom"];
export const CATEGORY_OPTIONS = ["Health", "Fitness", "Learning", "Work", "Mindfulness", "Reading", "Finance", "Personal"];
export const PIE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://habbit-tracker-backend-2rib.onrender.com";
export const API_URL = `${API_BASE_URL}/api/habits`;

export const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayKey = () => toDateKey(new Date());
export const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function getIsScheduledToday(habit, date = new Date()) {
  const day = date.getDay();
  if (habit.frequency === "Daily") return true;
  if (habit.frequency === "Weekdays") return day >= 1 && day <= 5;
  if (habit.frequency === "Weekends") return day === 0 || day === 6;
  if (habit.frequency === "Custom") return habit.customDays.includes(day);
  return false;
}

export function getCompletionValue(habit, dateStr) {
  return Number(habit.completions?.[dateStr] || 0);
}

export function isCompletedForDay(habit, dateStr = todayKey()) {
  return getCompletionValue(habit, dateStr) >= Number(habit.target || 1);
}

export function countCompletedDays(habit) {
  return Object.entries(habit.completions || {}).filter(([, v]) => Number(v) >= Number(habit.target || 1)).length;
}

export function calculateCurrentStreak(habit) {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = toDateKey(cursor); 
    const scheduled = getIsScheduledToday(habit, cursor);
    if (scheduled && isCompletedForDay(habit, key)) {
      streak += 1;
    } else if (scheduled) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function calculateBestStreak(habit) {
  let best = 0;
  let current = 0;
  const start = new Date(habit.createdAt || new Date());
  const end = new Date();
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = toDateKey(cursor); 
    const scheduled = getIsScheduledToday(habit, cursor);
    if (scheduled && isCompletedForDay(habit, key)) {
      current += 1;
      best = Math.max(best, current);
    } else if (scheduled) {
      current = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return best;
}

export function getLast7Days() {
  const arr = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(toDateKey(d)); 
  }
  return arr;
}

export function getLast30Days() {
  const arr = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(toDateKey(d)); 
  }
  return arr;
}

export function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function getLevel(count) {
  if (count === 0) return "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  if (count === 1) return "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100";
  if (count === 2) return "bg-emerald-400 text-emerald-900 dark:bg-emerald-700 dark:text-emerald-50";
  return "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white";
}

export const sendNotification = async (title, options) => {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch (error) {
    console.warn("ServiceWorker notification failed, using fallback alert:", error);
    alert(`⏰ ${title}\n${options.body}`);
  }
};