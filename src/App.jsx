import React from "react";
import HabitTrackerPro from "./pages/HabitTrackerPro";

export default function App({ user, onLogout }) {
  return <HabitTrackerPro user={user} onLogout={onLogout} />;
}