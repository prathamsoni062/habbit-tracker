import React, { useMemo } from "react";
import { BarChart3, Calendar, CheckCircle2, Flame, Target, Bell, Trophy } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { StatCard, Card } from "./UIComponents";
import { isCompletedForDay, getIsScheduledToday, calculateBestStreak, getLast7Days, formatDate, getLast30Days, PIE_COLORS } from "../utils/habitUtils";

export default function DashboardView({ activeHabits, todayHabits }) {
  const metrics = useMemo(() => {
    const total = activeHabits.length;
    const dueToday = todayHabits.length;
    const completedToday = todayHabits.filter((h) => isCompletedForDay(h)).length;
    const bestStreak = total ? Math.max(...activeHabits.map((h) => calculateBestStreak(h))) : 0;
    const completionRate = dueToday ? Math.round((completedToday / dueToday) * 100) : 0;
    return { total, dueToday, completedToday, bestStreak, completionRate };
  }, [activeHabits, todayHabits]);

  const weeklyChartData = useMemo(() => getLast7Days().map((dateStr) => ({
    date: formatDate(dateStr),
    completed: activeHabits.filter((h) => isCompletedForDay(h, dateStr)).length,
    scheduled: activeHabits.filter((h) => getIsScheduledToday(h, new Date(dateStr))).length,
  })), [activeHabits]);

  const consistencyData = useMemo(() => getLast30Days().map((dateStr) => ({
    date: formatDate(dateStr),
    completed: activeHabits.filter((h) => isCompletedForDay(h, dateStr)).length,
  })), [activeHabits]);

  const categoryPieData = useMemo(() => {
    const map = activeHabits.reduce((acc, habit) => { acc[habit.category] = (acc[habit.category] || 0) + 1; return acc; }, {});
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

  return (
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
                  {categoryPieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
            <div><h2 className="text-lg font-semibold">Quick reminders</h2></div>
            <Bell className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {todayHabits.slice(0, 5).map((habit) => (
              <div key={habit._id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{habit.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{habit.preferredTime || "Anytime"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
             <div className="flex items-center gap-2"><Trophy className="h-5 w-5" /><p className="font-semibold">Achievements</p></div>
             <div className="mt-3 space-y-2 text-sm">{achievements.map((a) => <div key={a}>• {a}</div>)}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}