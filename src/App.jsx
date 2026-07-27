import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Moon, Sun, Search, Filter, Trash2, Edit3, Calendar,
  Flame, Target, Download, Upload, Archive, CheckCircle2,
  Circle, X, BarChart3, ListTodo, Sparkles, Bell, Trophy,
  LogOut, User,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const THEME_KEY = "habit-tracker-theme";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FREQUENCIES = ["Daily", "Weekdays", "Weekends", "Custom"];
const CATEGORY_OPTIONS = [
  "Health", "Fitness", "Learning", "Work",
  "Mindfulness", "Reading", "Finance", "Personal",
];
const PIE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://habbit-tracker-backend-2rib.onrender.com";
const API_URL = `${API_BASE_URL}/api/habits`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function getIsScheduledToday(habit, date = new Date()) {
  const day = date.getDay();
  if (habit.frequency === "Daily") return true;
  if (habit.frequency === "Weekdays") return day >= 1 && day <= 5;
  if (habit.frequency === "Weekends") return day === 0 || day === 6;
  if (habit.frequency === "Custom") return habit.customDays.includes(day);
  return false;
}

function getCompletionValue(habit, dateStr) {
  return Number(habit.completions?.[dateStr] || 0);
}

function isCompletedForDay(habit, dateStr = todayKey()) {
  return getCompletionValue(habit, dateStr) >= Number(habit.target || 1);
}

function countCompletedDays(habit) {
  return Object.entries(habit.completions || {}).filter(([, v]) => Number(v) >= Number(habit.target || 1)).length;
}

function calculateCurrentStreak(habit) {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().slice(0, 10);
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

function calculateBestStreak(habit) {
  let best = 0;
  let current = 0;
  const start = new Date(habit.createdAt || new Date());
  const end = new Date();
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
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

function getLast7Days() {
  const arr = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

function getLast30Days() {
  const arr = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getLevel(count) {
  if (count === 0) return "bg-slate-200 dark:bg-slate-800";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-900/60";
  if (count === 2) return "bg-emerald-400 dark:bg-emerald-700";
  return "bg-emerald-600 dark:bg-emerald-500";
}

function AppButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 ${className}`}>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 ${className}`}
      {...props}
    />
  );
}

function Modal({ open, title, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">{title}</h3>
                <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, gradient }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight">{value}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function HabitForm({ initialHabit, onSave, onClose }) {
  const [form, setForm] = useState(
    initialHabit || {
      name: "",
      category: "Health",
      frequency: "Daily",
      customDays: [],
      target: 1,
      unit: "times",
      preferredTime: "08:00",
      color: "from-indigo-500 to-purple-500",
      notes: "",
    }
  );

  const gradients = [
    "from-indigo-500 to-purple-500",
    "from-emerald-500 to-lime-500",
    "from-sky-500 to-cyan-500",
    "from-pink-500 to-rose-500",
    "from-amber-500 to-orange-500",
    "from-violet-500 to-fuchsia-500",
  ];

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      customDays: prev.customDays.includes(day)
        ? prev.customDays.filter((d) => d !== day)
        : [...prev.customDays, day].sort(),
    }));
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Habit name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Walk 8,000 steps"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Category</label>
          <Select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Frequency</label>
          <Select value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}>
            {FREQUENCIES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
        </div>

        {form.frequency === "Custom" && (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Custom days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, idx) => {
                const active = form.customDays.includes(idx);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`rounded-full px-3 py-2 text-sm ${active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">Target</label>
          <Input
            type="number"
            min="1"
            value={form.target}
            onChange={(e) => setForm((p) => ({ ...p, target: Number(e.target.value) || 1 }))}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Unit</label>
          <Input
            value={form.unit}
            onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            placeholder="times, pages, mins"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Preferred time</label>
          <Input
            type="time"
            value={form.preferredTime}
            onChange={(e) => setForm((p) => ({ ...p, preferredTime: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Color theme</label>
          <div className="flex flex-wrap gap-2">
            {gradients.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm((p) => ({ ...p, color: g }))}
                className={`h-10 w-10 rounded-2xl bg-gradient-to-r ${g} ${form.color === g ? "ring-4 ring-slate-300 dark:ring-slate-700" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Notes</label>
          <Textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Motivation, cue, reward, or extra guidance"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <AppButton onClick={onClose} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Cancel
        </AppButton>
        <AppButton
          onClick={() => {
            if (!form.name.trim()) return;
            onSave(form);
          }}
          className="bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        >
          <CheckCircle2 className="h-4 w-4" />
          Save habit
        </AppButton>
      </div>
    </div>
  );
}

export default function HabitTrackerPro({ user, onLogout }) {
  const [habits, setHabits] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("priority");
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const isDark = storedTheme ? storedTheme === "dark" : true;
    setDarkMode(isDark);
  }, []);

  // Fetch habits from Backend
  useEffect(() => {
    fetch(API_URL, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setHabits(data))
      .catch((err) => console.error("Error fetching habits:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.archived), [habits]);
  const todayHabits = useMemo(() => activeHabits.filter((h) => getIsScheduledToday(h)), [activeHabits]);

  const filteredHabits = useMemo(() => {
    const source = showArchived ? archivedHabits : activeHabits;
    let data = source.filter((habit) => {
      const q = search.toLowerCase();
      const matchesSearch = [habit.name, habit.category, habit.notes].join(" ").toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "All" || habit.category === categoryFilter;
      const completed = isCompletedForDay(habit);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Completed" && completed) ||
        (statusFilter === "Pending" && !completed) ||
        (statusFilter === "Scheduled Today" && getIsScheduledToday(habit));
      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (sortBy === "name") data.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "streak") data.sort((a, b) => calculateCurrentStreak(b) - calculateCurrentStreak(a));
    if (sortBy === "completion") data.sort((a, b) => countCompletedDays(b) - countCompletedDays(a));
    if (sortBy === "priority") {
      data.sort((a, b) => {
        const aToday = getIsScheduledToday(a) ? 1 : 0;
        const bToday = getIsScheduledToday(b) ? 1 : 0;
        const aDone = isCompletedForDay(a) ? 1 : 0;
        const bDone = isCompletedForDay(b) ? 1 : 0;
        return bToday - aToday || aDone - bDone;
      });
    }
    return data;
  }, [activeHabits, archivedHabits, showArchived, search, categoryFilter, statusFilter, sortBy]);

  const metrics = useMemo(() => {
    const total = activeHabits.length;
    const dueToday = todayHabits.length;
    const completedToday = todayHabits.filter((h) => isCompletedForDay(h)).length;
    const bestStreak = total ? Math.max(...activeHabits.map((h) => calculateBestStreak(h))) : 0;
    const completionRate = dueToday ? Math.round((completedToday / dueToday) * 100) : 0;
    return { total, dueToday, completedToday, bestStreak, completionRate };
  }, [activeHabits, todayHabits]);

  const weeklyChartData = useMemo(() => {
    return getLast7Days().map((dateStr) => {
      const completed = activeHabits.filter((h) => isCompletedForDay(h, dateStr)).length;
      const scheduled = activeHabits.filter((h) => getIsScheduledToday(h, new Date(dateStr))).length;
      return {
        date: formatDate(dateStr),
        completed,
        scheduled,
      };
    });
  }, [activeHabits]);

  const consistencyData = useMemo(() => {
    return getLast30Days().map((dateStr) => {
      const completed = activeHabits.filter((h) => isCompletedForDay(h, dateStr)).length;
      return { date: formatDate(dateStr), completed };
    });
  }, [activeHabits]);

  const categoryPieData = useMemo(() => {
    const map = activeHabits.reduce((acc, habit) => {
      acc[habit.category] = (acc[habit.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeHabits]);

  const achievements = useMemo(() => {
    const list = [];
    if (metrics.completedToday >= 3) list.push("Completed 3+ habits today");
    if (metrics.bestStreak >= 7) list.push("Reached a 7-day streak");
    if (metrics.completionRate === 100 && metrics.dueToday > 0) list.push("Perfect day unlocked");
    if (activeHabits.length >= 5) list.push("Built a strong routine with 5+ habits");
    return list;
  }, [metrics, activeHabits.length]);

  const monthHeatmap = useMemo(() => {
    const now = new Date();
    const grid = getMonthGrid(now.getFullYear(), now.getMonth());
    return grid.map((d) => {
      if (!d) return null;
      const key = d.toISOString().slice(0, 10);
      const count = activeHabits.filter((h) => isCompletedForDay(h, key)).length;
      return { date: d, count };
    });
  }, [activeHabits]);

  // Network Calls Handlers
  const updateHabitProgress = async (habitId, delta) => {
    try {
      const res = await fetch(`${API_URL}/${habitId}/progress`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: todayKey(), delta })
      });
      if (res.ok) {
        const updatedHabit = await res.json();
        setHabits((prev) => prev.map((h) => (h._id === updatedHabit._id ? updatedHabit : h)));
      }
    } catch (err) { console.error("Failed to update progress", err); }
  };

  const toggleComplete = async (habitId) => {
    try {
      const res = await fetch(`${API_URL}/${habitId}/toggle`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: todayKey() })
      });
      if (res.ok) {
        const updatedHabit = await res.json();
        setHabits((prev) => prev.map((h) => (h._id === updatedHabit._id ? updatedHabit : h)));
      }
    } catch (err) { console.error("Failed to toggle completion", err); }
  };

  const saveHabit = async (habitData) => {
    try {
      if (editingHabit) {
        const res = await fetch(`${API_URL}/${editingHabit._id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(habitData)
        });
        if (res.ok) {
          const updated = await res.json();
          setHabits((prev) => prev.map((h) => (h._id === updated._id ? updated : h)));
        }
      } else {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(habitData)
        });
        if (res.ok) {
          const created = await res.json();
          setHabits((prev) => [created, ...prev]);
        }
      }
      setEditingHabit(null);
      setFormOpen(false);
    } catch (err) { console.error("Failed to save habit", err); }
  };

  const toggleArchive = async (habitId) => {
    try {
      const res = await fetch(`${API_URL}/${habitId}/archive`, { method: "PATCH", headers: getAuthHeaders() });
      if (res.ok) {
        const updated = await res.json();
        setHabits((prev) => prev.map((h) => (h._id === updated._id ? updated : h)));
      }
    } catch (err) { console.error(err); }
  };

  const deleteHabit = async (habitId) => {
    try {
      const res = await fetch(`${API_URL}/${habitId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        setHabits((prev) => prev.filter((h) => h._id !== habitId));
      }
    } catch (err) { console.error(err); }
  };

  const markAllDueDone = async () => {
    const dueHabits = habits.filter(h => getIsScheduledToday(h) && !h.archived && !isCompletedForDay(h));
    for (const habit of dueHabits) {
      await toggleComplete(habit._id);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(habits, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "habit-tracker-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        if (Array.isArray(parsed)) setHabits(parsed);
      } catch { }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="overflow-hidden border-none bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white dark:from-slate-900 dark:via-indigo-950 dark:to-black">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                      Smart routine builder
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Habit Tracker Pro</h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                    Build better routines with streaks, analytics, category tracking, reminders, notes, archive mode, import/export, and a beautiful dashboard.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <AppButton
                      onClick={() => {
                        setEditingHabit(null);
                        setFormOpen(true);
                      }}
                      className="bg-white text-slate-900"
                    >
                      <Plus className="h-4 w-4" />
                      Add habit
                    </AppButton>
                    <AppButton onClick={markAllDueDone} className="bg-white/10 text-white backdrop-blur hover:bg-white/15">
                      <CheckCircle2 className="h-4 w-4" />
                      Mark all due done
                    </AppButton>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm text-slate-300">Today’s completion</p>
                    <div className="mt-2 text-4xl font-bold">{metrics.completionRate}%</div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-white" style={{ width: `${metrics.completionRate}%` }} />
                    </div>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm text-slate-300">Achievements</p>
                    <div className="mt-2 flex min-h-[76px] flex-wrap gap-2">
                      {achievements.length ? (
                        achievements.slice(0, 2).map((item) => (
                          <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-300">Complete more habits to unlock badges.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["dashboard", "Dashboard", BarChart3],
                ["habits", "Habits", ListTodo],
                ["calendar", "Calendar", Calendar],
              ].map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium ${view === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium truncate max-w-[150px]">{user?.name || user?.email}</span>
              </div>
              <AppButton onClick={() => setDarkMode((p) => !p)} className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {darkMode ? "Light" : "Dark"}
              </AppButton>
              <AppButton onClick={exportData} className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Download className="h-4 w-4" />
                Export
              </AppButton>
              <AppButton onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Upload className="h-4 w-4" />
                Import
              </AppButton>
              <AppButton onClick={onLogout} className="bg-red-500 text-white hover:bg-red-600">
                <LogOut className="h-4 w-4" />
                Logout
              </AppButton>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importData} />
            </div>
          </div>

          {view === "dashboard" && (
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Active habits" value={metrics.total} subtitle="Your current routine count" icon={Target} gradient="from-indigo-500 to-purple-500" />
                <StatCard title="Due today" value={metrics.dueToday} subtitle="Scheduled habits for today" icon={Calendar} gradient="from-emerald-500 to-lime-500" />
                <StatCard title="Completed today" value={metrics.completedToday} subtitle="Progress made today" icon={CheckCircle2} gradient="from-sky-500 to-cyan-500" />
                <StatCard title="Best streak" value={`${metrics.bestStreak} days`} subtitle="Your strongest streak so far" icon={Flame} gradient="from-amber-500 to-orange-500" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Weekly completion trend</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Completed vs scheduled habits over the last 7 days</p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.12} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="scheduled" radius={[8, 8, 0, 0]} fill="#cbd5e1" />
                        <Bar dataKey="completed" radius={[8, 8, 0, 0]} fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Habits by category</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">See how your routine is distributed</p>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie data={categoryPieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                          {categoryPieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categoryPieData.map((item, index) => (
                      <span key={item.name} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {item.name} • {item.value}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">30-day consistency</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Daily total completed habits</p>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <LineChart data={consistencyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.12} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Quick reminders</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Best time cues for your routine</p>
                    </div>
                    <Bell className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    {todayHabits.length ? (
                      todayHabits.slice(0, 5).map((habit) => (
                        <div key={habit._id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{habit.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{habit.preferredTime || "Anytime"} • {habit.target} {habit.unit}</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs dark:bg-slate-900">{habit.category}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                        No habits scheduled for today.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      <p className="font-semibold">Achievement board</p>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      {achievements.length ? achievements.map((a) => <div key={a}>• {a}</div>) : <div>• Keep going. Your next badge is close.</div>}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {view === "habits" && (
            <div className="grid gap-6">
              <Card>
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search habits, category, notes..." className="pl-10" />
                  </div>

                  <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option>All</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>

                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {[
                      "All",
                      "Completed",
                      "Pending",
                      "Scheduled Today",
                    ].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>

                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    {[
                      ["priority", "Sort: Priority"],
                      ["name", "Sort: Name"],
                      ["streak", "Sort: Streak"],
                      ["completion", "Sort: Completion"],
                    ].map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </Select>

                  <AppButton onClick={() => setShowArchived((p) => !p)} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Archive className="h-4 w-4" />
                    {showArchived ? "Show Active" : "Archived"}
                  </AppButton>
                </div>
              </Card>

              <div className="grid gap-4">
                {filteredHabits.length ? (
                  filteredHabits.map((habit) => {
                    const streak = calculateCurrentStreak(habit);
                    const best = calculateBestStreak(habit);
                    const completedDays = countCompletedDays(habit);
                    const progress = Math.min(100, Math.round((getCompletionValue(habit, todayKey()) / Number(habit.target || 1)) * 100));
                    const doneToday = isCompletedForDay(habit);
                    const scheduledToday = getIsScheduledToday(habit);

                    return (
                      <motion.div key={habit._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="overflow-hidden">
                          <div className={`mb-4 h-2 rounded-full bg-gradient-to-r ${habit.color}`} />
                          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.8fr_auto] lg:items-center">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-semibold">{habit.name}</h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">{habit.category}</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">{habit.frequency}</span>
                                {scheduledToday && (
                                  <span className={`rounded-full px-3 py-1 text-xs ${doneToday ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                                    {doneToday ? "Done today" : "Due today"}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{habit.notes || "No notes added."}</p>
                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Current streak</p>
                                  <p className="mt-1 text-lg font-semibold">{streak} days</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Best streak</p>
                                  <p className="mt-1 text-lg font-semibold">{best} days</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Completed days</p>
                                  <p className="mt-1 text-lg font-semibold">{completedDays}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/60">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-sm font-medium">Today’s progress</p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">{getCompletionValue(habit, todayKey())}/{habit.target} {habit.unit}</p>
                                </div>
                                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div className={`h-2 rounded-full bg-gradient-to-r ${habit.color}`} style={{ width: `${progress}%` }} />
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                  <AppButton onClick={() => updateHabitProgress(habit._id, -1)} className="bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100">-1</AppButton>
                                  <AppButton onClick={() => updateHabitProgress(habit._id, 1)} className="bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100">+1</AppButton>
                                  <AppButton
                                    onClick={() => toggleComplete(habit._id)}
                                    className={doneToday ? "bg-emerald-600 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"}
                                  >
                                    {doneToday ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                    {doneToday ? "Completed" : "Complete"}
                                  </AppButton>
                                </div>
                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Reminder: {habit.preferredTime || "Anytime"}</p>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                                <p className="text-slate-500 dark:text-slate-400">Created</p>
                                <p className="font-medium">{formatDate(habit.createdAt)}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                                <p className="text-slate-500 dark:text-slate-400">Target</p>
                                <p className="font-medium">{habit.target} {habit.unit}</p>
                              </div>
                            </div>

                            <div className="flex flex-row gap-2 lg:flex-col">
                              <AppButton
                                onClick={() => {
                                  setEditingHabit(habit);
                                  setFormOpen(true);
                                }}
                                className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </AppButton>
                              <AppButton
                                onClick={() => toggleArchive(habit._id)}
                                className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <Archive className="h-4 w-4" />
                                {habit.archived ? "Restore" : "Archive"}
                              </AppButton>
                              <AppButton
                                onClick={() => deleteHabit(habit._id)}
                                className="bg-red-600 text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </AppButton>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <Card className="py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                        <Filter className="h-6 w-6 text-slate-500" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold">No habits match your filters</h3>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Try changing the search, category, or archived view. You can also create a new habit to get started.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {view === "calendar" && (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Monthly completion heatmap</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">A quick look at your consistency this month</p>
                  </div>
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  {DAYS.map((day) => (
                    <div key={day} className="py-2 font-medium">{day}</div>
                  ))}
                  {monthHeatmap.map((cell, idx) => (
                    <div key={idx} className="aspect-square">
                      {cell ? (
                        <div className={`flex h-full flex-col items-center justify-center rounded-2xl ${getLevel(cell.count)}`}>
                          <span className="text-xs font-semibold">{cell.date.getDate()}</span>
                          <span className="text-[10px] opacity-75">{cell.count}</span>
                        </div>
                      ) : (
                        <div className="h-full rounded-2xl bg-transparent" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Legend & insights</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Understand your pattern more clearly</p>
                </div>
                <div className="space-y-3">
                  {[
                    ["0 completed", "bg-slate-200 dark:bg-slate-800"],
                    ["1 completed", "bg-emerald-200 dark:bg-emerald-900/60"],
                    ["2 completed", "bg-emerald-400 dark:bg-emerald-700"],
                    ["3+ completed", "bg-emerald-600 dark:bg-emerald-500"],
                  ].map(([label, cls]) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-md ${cls}`} />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <h3 className="font-semibold">What this tracker supports</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>• Daily, weekdays, weekends, and custom-day habits</li>
                    <li>• Streak tracking and best streak calculation</li>
                    <li>• Notes, categories, reminders, and target units</li>
                    <li>• Search, filter, sort, archive, import, export</li>
                    <li>• Dashboard analytics and completion heatmap</li>
                    <li>• MongoDB persistence and dark mode</li>
                  </ul>
                </div>
              </Card>
            </div>
          )}
        </div>

        <Modal
          open={formOpen}
          title={editingHabit ? "Edit habit" : "Create new habit"}
          onClose={() => {
            setFormOpen(false);
            setEditingHabit(null);
          }}
        >
          <HabitForm
            initialHabit={editingHabit}
            onSave={saveHabit}
            onClose={() => {
              setFormOpen(false);
              setEditingHabit(null);
            }}
          />
        </Modal>
      </div>
    </div>
  );
}