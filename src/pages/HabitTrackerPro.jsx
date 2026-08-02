import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Moon, Sun, Calendar, CheckCircle2, BarChart3, ListTodo, Sparkles, Bell, Download, Upload, LogOut, User } from "lucide-react";

import { Card, AppButton, Modal } from "../components/UIComponents";
import HabitForm from "../components/HabitForm";
import DashboardView from "../components/DashboardView";
import HabitsView from "../components/HabitsView";
import CalendarView from "../components/CalendarView";

import { API_URL, THEME_KEY, getAuthHeaders, todayKey, getIsScheduledToday, isCompletedForDay, sendNotification } from "../utils/habitUtils";

export default function HabitTrackerPro({ user, onLogout }) {
  const [habits, setHabits] = useState([]);
  const [view, setView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const fileInputRef = useRef(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notifiedHabitsRef = useRef({ date: todayKey(), ids: new Set() });

  // Service Worker Registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    setDarkMode(storedTheme ? storedTheme === "dark" : true);
    fetch(API_URL, { headers: getAuthHeaders() }).then(res => res.json()).then(setHabits).catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.archived), [habits]);
  const todayHabits = useMemo(() => activeHabits.filter(h => getIsScheduledToday(h)), [activeHabits]);

  // Notifications Loop
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setNotificationsEnabled(true);
  }, []);

  useEffect(() => {
    if (!notificationsEnabled || todayHabits.length === 0) return;
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayDate = todayKey();

      if (notifiedHabitsRef.current.date !== todayDate) {
        notifiedHabitsRef.current = { date: todayDate, ids: new Set() };
      }

      todayHabits.forEach((habit) => {
        if (habit.preferredTime === currentTime && !isCompletedForDay(habit, todayDate) && !notifiedHabitsRef.current.ids.has(habit._id)) {
          sendNotification("Habit Reminder", { body: `Time to: ${habit.name}` });
          notifiedHabitsRef.current.ids.add(habit._id);
        }
      });
    };
    checkReminders();
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, [notificationsEnabled, todayHabits]);

  // Network Handlers
  const handleNetworkUpdate = async (url, method, body) => {
    try {
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: body ? JSON.stringify(body) : undefined });
      if (res.ok) {
        const data = await res.json();
        setHabits(prev => method === 'DELETE' ? prev.filter(h => h._id !== data._id) : prev.map(h => h._id === data._id ? data : h));
      }
    } catch (err) { console.error(err); }
  };

  const updateHabitProgress = (id, delta) => handleNetworkUpdate(`${API_URL}/${id}/progress`, "PATCH", { date: todayKey(), delta });
  const toggleComplete = (id) => handleNetworkUpdate(`${API_URL}/${id}/toggle`, "PATCH", { date: todayKey() });
  const toggleArchive = (id) => handleNetworkUpdate(`${API_URL}/${id}/archive`, "PATCH");
  const deleteHabit = (id) => handleNetworkUpdate(`${API_URL}/${id}`, "DELETE");

  const saveHabit = async (habitData) => {
    try {
      const url = editingHabit ? `${API_URL}/${editingHabit._id}` : API_URL;
      const res = await fetch(url, { method: editingHabit ? "PUT" : "POST", headers: getAuthHeaders(), body: JSON.stringify(habitData) });
      if (res.ok) {
        const data = await res.json();
        setHabits(prev => editingHabit ? prev.map(h => h._id === data._id ? data : h) : [data, ...prev]);
        setFormOpen(false); setEditingHabit(null);
      }
    } catch (err) { console.error(err); }
  };

  const markAllDueDone = async () => {
    for (const h of habits.filter(h => getIsScheduledToday(h) && !h.archived && !isCompletedForDay(h))) {
      await toggleComplete(h._id);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
             <Card className="border-none bg-gradient-to-r from-slate-900 to-black text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold md:text-5xl">Habit Tracker Pro</h1>
                        <div className="mt-5 flex gap-3">
                            <AppButton onClick={() => { setEditingHabit(null); setFormOpen(true); }} className="bg-white text-slate-900"><Plus className="h-4 w-4" /> Add habit</AppButton>
                            <AppButton onClick={markAllDueDone} className="bg-white/10 text-white"><CheckCircle2 className="h-4 w-4" /> Mark due done</AppButton>
                        </div>
                    </div>
                </div>
             </Card>
          </motion.div>

          <div className="mb-6 flex justify-between items-center">
            <div className="flex gap-2">
              {[["dashboard", "Dashboard", BarChart3], ["habits", "Habits", ListTodo], ["calendar", "Calendar", Calendar]].map(([key, label, Icon]) => (
                <button key={key} onClick={() => setView(key)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm ${view === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-slate-900"}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 items-center">
                <AppButton onClick={() => setDarkMode(!darkMode)} className="bg-white dark:bg-slate-900">{darkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}</AppButton>
                <AppButton onClick={onLogout} className="bg-red-500 text-white"><LogOut className="h-4 w-4" /> Logout</AppButton>
            </div>
          </div>

          {view === "dashboard" && <DashboardView activeHabits={activeHabits} todayHabits={todayHabits} />}
          {view === "habits" && <HabitsView activeHabits={activeHabits} archivedHabits={archivedHabits} updateHabitProgress={updateHabitProgress} toggleComplete={toggleComplete} setEditingHabit={setEditingHabit} setFormOpen={setFormOpen} toggleArchive={toggleArchive} deleteHabit={deleteHabit} />}
          {view === "calendar" && <CalendarView activeHabits={activeHabits} />}
          
        </div>

        <Modal open={formOpen} title={editingHabit ? "Edit habit" : "Create habit"} onClose={() => { setFormOpen(false); setEditingHabit(null); }}>
          <HabitForm initialHabit={editingHabit} onSave={saveHabit} onClose={() => { setFormOpen(false); setEditingHabit(null); }} />
        </Modal>
      </div>
    </div>
  );
}