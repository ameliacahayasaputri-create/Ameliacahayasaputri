/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Volume2, 
  AlertCircle, 
  Sparkles,
  Info
} from 'lucide-react';
import { Task, TaskPriority, AlarmInstance, Category } from './types';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import CategoryManager from './components/CategoryManager';
import NotificationToast from './components/NotificationToast';
import { playNotificationSound, playTickSound } from './utils/audio';

const STORAGE_KEY = 'manajemen_tugas_agenda_v1';
const STORAGE_KEY_CATEGORIES = 'manajemen_tugas_kategori_v1';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal membaca kategori dari localStorage:', e);
    }
    return [
      { id: 'cat-kerja', name: 'Kerja', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/60', colorHex: '#6366f1' },
      { id: 'cat-pribadi', name: 'Pribadi', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60', colorHex: '#10b981' },
      { id: 'cat-belanja', name: 'Belanja', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/60', colorHex: '#f59e0b' }
    ];
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [triggeredAlarms, setTriggeredAlarms] = useState<AlarmInstance[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  // Prevent multiple overlapping audio rings by maintaining a rate limit ref
  const lastSoundPlayedRef = useRef<number>(0);

  // Load tasks on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        // Hydrate with high-fidelity template examples for a welcoming experience!
        const templateTasks: Task[] = [
          {
            id: 'template-1',
            title: '💡 Jajal Pembuatan Agenda Tugas',
            description: 'Tentukan waktu pengingat 5 menit lagi untuk menguji alarm suara otomatis.',
            dueDate: (() => {
              const d = new Date();
              d.setMinutes(d.getMinutes() + 5);
              return d.toISOString().slice(0, 16);
            })(),
            priority: TaskPriority.TINGGI,
            isCompleted: false,
            soundEnabled: true,
            notified: false
          },
          {
            id: 'template-2',
            title: '🚀 Eksplorasi Dasbor Pengingat Modern',
            description: 'Dilengkapi dengan countdown live, filter terlambat, dan alarm ramah browser.',
            dueDate: (() => {
              const d = new Date();
              d.setHours(d.getHours() + 2);
              return d.toISOString().slice(0, 16);
            })(),
            priority: TaskPriority.SEDANG,
            isCompleted: false,
            soundEnabled: true,
            notified: false
          }
        ];
        setTasks(templateTasks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templateTasks));
      }
    } catch (e) {
      console.warn('Gagal membaca data dari localStorage:', e);
    }

    // Check existing browser Notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Save tasks on modification
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    } catch (e) {
      console.error('Gagal menyimpan data ke localStorage:', e);
    }
  };

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(newCategories));
    } catch (e) {
      console.error('Gagal menyimpan kategori ke localStorage:', e);
    }
  };

  const handleAddCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`
    };
    saveCategories([...categories, newCat]);
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    const nextList = categories.map(c => c.id === updatedCat.id ? updatedCat : c);
    saveCategories(nextList);
  };

  const handleDeleteCategory = (catId: string) => {
    const nextList = categories.filter(c => c.id !== catId);
    saveCategories(nextList);

    // Safeguard Tasks: set deleted category association to undefined
    const cleanedTasks = tasks.map(t => {
      if (t.categoryId === catId) {
        return { ...t, categoryId: undefined };
      }
      return t;
    });
    saveTasks(cleanedTasks);
  };

  // Live seconds tick + Alarm checker loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Evaluate tasks that have matched or exceeded their target reminder time
      const timeMs = now.getTime();
      let hasUpdates = false;
      const updatedTasks = tasks.map((task) => {
        if (!task.isCompleted && !task.notified) {
          const taskTime = new Date(task.dueDate).getTime();
          if (timeMs >= taskTime) {
            // Found a newly triggered task reminder!
            hasUpdates = true;
            
            // 1. Play synthesized bell (with global rate-limiter check)
            if (task.soundEnabled && (timeMs - lastSoundPlayedRef.current > 4000)) {
              playNotificationSound();
              lastSoundPlayedRef.current = timeMs;
            }

            // 2. Trigger native browser window Notification (if permitted)
            triggerBrowserNotification(task);

            // 3. Register inside local in-app overlay triggers
            setTriggeredAlarms((prev) => {
              if (prev.some((alarm) => alarm.taskId === task.id)) return prev;
              return [
                ...prev,
                {
                  taskId: task.id,
                  taskTitle: task.title,
                  taskDescription: task.description,
                  triggeredAt: timeMs,
                },
              ];
            });

            return { ...task, notified: true };
          }
        }
        return task;
      });

      if (hasUpdates) {
        saveTasks(updatedTasks);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tasks]);

  // Request browser Notification permission
  const requestDesktopNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Perangkat atau browser Anda tidak mendukung notifikasi desktop.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (err) {
      console.warn('Gagal meminta izin notifikasi:', err);
    }
  };

  // Trigger HTML5 Notification
  const triggerBrowserNotification = (task: Task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const title = `Agenda: ${task.title}`;
        const options: NotificationOptions = {
          body: task.description || 'Waktu pelaksanaan tugas telah tiba!',
          icon: '/favicon.ico',
        };
        new Notification(title, options);
      } catch (err) {
        console.warn('Gagal memicu browser notification:', err);
      }
    }
  };

  // Add a task
  const handleAddTask = (item: Omit<Task, 'id' | 'isCompleted' | 'notified'>) => {
    const newTask: Task = {
      ...item,
      id: `task-${Date.now()}`,
      isCompleted: false,
      notified: false,
    };
    saveTasks([newTask, ...tasks]);
    playTickSound();
  };

  // Mark task completed or active
  const handleToggleComplete = (id: string) => {
    const updated = tasks.map((task) => {
      if (task.id === id) {
        const nextState = !task.isCompleted;
        if (nextState) {
          // Play reward sound
          playTickSound();
          // Also remove from triggered alarms if active
          setTriggeredAlarms((prev) => prev.filter((alarm) => alarm.taskId !== id));
        }
        return { 
          ...task, 
          isCompleted: nextState,
          // Reset notified state if task is unmarked as completed so it can trigger again in future
          notified: nextState ? task.notified : false
        };
      }
      return task;
    });
    saveTasks(updated);
  };

  // Toggle alarm sound preference for a task
  const handleToggleSound = (id: string) => {
    const updated = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, soundEnabled: !task.soundEnabled };
      }
      return task;
    });
    saveTasks(updated);
    playTickSound();
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTriggeredAlarms((prev) => prev.filter((alarm) => alarm.taskId !== id));
    saveTasks(updated);
  };

  // Alarm action: Dismiss alarm
  const handleDismissAlarm = (taskId: string) => {
    setTriggeredAlarms((prev) => prev.filter((alarm) => alarm.taskId !== taskId));
    playTickSound();
  };

  // Alarm action: Snooze alarm for 5 minutes
  const handleSnoozeAlarm = (taskId: string) => {
    const updated = tasks.map((task) => {
      if (task.id === taskId) {
        const snoozeTime = new Date();
        snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
        
        // Format to YYYY-MM-DDTHH:MM local format
        const year = snoozeTime.getFullYear();
        const month = String(snoozeTime.getMonth() + 1).padStart(2, '0');
        const day = String(snoozeTime.getDate()).padStart(2, '0');
        const hours = String(snoozeTime.getHours()).padStart(2, '0');
        const minutes = String(snoozeTime.getMinutes()).padStart(2, '0');

        return {
          ...task,
          dueDate: `${year}-${month}-${day}T${hours}:${minutes}`,
          notified: false, // allow re-trigger
        };
      }
      return task;
    });

    setTriggeredAlarms((prev) => prev.filter((alarm) => alarm.taskId !== taskId));
    saveTasks(updated);
    playTickSound();
  };

  // Alarm action: Complete instantly from modal
  const handleCompleteAlarm = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, isCompleted: true };
      }
      return t;
    });
    setTriggeredAlarms((prev) => prev.filter((alarm) => alarm.taskId !== taskId));
    saveTasks(updated);
    playTickSound();
  };

  // General task summary calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const overdueCount = tasks.filter(
    (t) => !t.isCompleted && new Date(t.dueDate).getTime() < currentTime.getTime()
  ).length;
  const pendingCount = totalCount - completedCount;

  // Localized Indonesian Date-Time styling block
  const formattedHeaderDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentTime);

  const formattedHeaderTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <main id="app-root-container" className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* App Greeting & Dynamic Clock */}
        <header id="app-header" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-1 uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Auto-Pengingat Aktif
            </span>
            <h1 id="app-title" className="text-xl md:text-2xl font-bold text-gray-950 tracking-tight mt-1">
              Asisten Tugas & Agenda
            </h1>
            <p className="text-xs text-gray-500">Buat jadwal, atur prioritas, dan biarkan alarm otomatis menuntun produktivitas Anda.</p>
          </div>

          {/* Dynamic Clock Frame */}
          <div className="flex flex-col items-end shrink-0 bg-gray-50/70 border border-gray-100 rounded-xl p-3 text-right">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg md:text-xl font-mono tracking-tight">
              <Clock className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span>{formattedHeaderTime}</span>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase mt-0.5">{formattedHeaderDate}</span>
          </div>
        </header>

        {/* Dashboard Status Counters (Bento Grid Style) */}
        <section id="stats-dashboard" className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div id="stat-total" className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-indigo-100 transition-all">
            <div className="p-3 bg-gray-50 text-gray-600 rounded-xl shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Tugas</p>
              <h4 className="text-lg font-bold text-gray-900 font-mono mt-0.5">{totalCount}</h4>
            </div>
          </div>

          <div id="stat-pending" className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-amber-100 transition-all">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Menunggu</p>
              <h4 className="text-lg font-bold text-amber-900 font-mono mt-0.5">{pendingCount}</h4>
            </div>
          </div>

          <div id="stat-completed" className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-emerald-100 transition-all">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Selesai</p>
              <h4 className="text-lg font-bold text-emerald-900 font-mono mt-0.5">{completedCount}</h4>
            </div>
          </div>

          <div id="stat-overdue" className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-rose-100 transition-all">
            <div className={`p-3 rounded-xl shrink-0 ${overdueCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Terlambat</p>
              <h4 className={`text-lg font-bold font-mono mt-0.5 ${overdueCount > 0 ? 'text-rose-600 font-extrabold' : 'text-gray-900'}`}>{overdueCount}</h4>
            </div>
          </div>
        </section>

        {/* Desktop Permission Assistance Panel */}
        {notificationPermission !== 'granted' && (
          <div id="permission-guidance" className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950">
            <div className="flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold block sm:inline">Dapatkan Notifikasi Desktop:</span>
                <span className="text-gray-600 ml-0.5"> Aktifkan agar sistem mengirim pemberitahuan instan di luar tab browser. Jika diblokir oleh sandbox, Anda tetap dapat mengandalkan alarm suara & dialog di dalam aplikasi ini.</span>
              </div>
            </div>
            <button
              id="btn-request-permission"
              onClick={requestDesktopNotificationPermission}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs transition"
            >
              Aktifkan Izin
            </button>
          </div>
        )}

        {/* Primary Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Form on left (Width: 5cols) */}
          <div className="md:col-span-5 space-y-4">
            <TaskForm categories={categories} onAddTask={handleAddTask} />

            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
            
            {/* Quick explanation helper */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 text-xs text-gray-500 space-y-2">
              <h4 className="font-semibold text-gray-800 flex items-center gap-1"><Volume2 className="w-4 h-4 text-indigo-500" /> Bagaimana Cara Kerjanya?</h4>
              <p className="leading-relaxed">Aplikasi berjalan real-time. Ketika jarum jam di pojok kanan atas berdetak menyentuh batas target pengingat tugas Anda, suara alarm synth bell akan berbunyi dan panel pengingat darurat langsung muncul di layar untuk memastikan agenda Anda selesai tepat waktu.</p>
            </div>
          </div>

          {/* List on right (Width: 7cols) */}
          <div className="md:col-span-7">
            <TaskList 
              tasks={tasks} 
              categories={categories}
              currentTime={currentTime}
              onToggleComplete={handleToggleComplete}
              onToggleSound={handleToggleSound}
              onDeleteTask={handleDeleteTask}
              onTriggerAlarmSound={() => {
                playNotificationSound();
              }}
            />
          </div>
        </div>

      </div>

      {/* Instant pop-up overlay for triggered alarms */}
      <NotificationToast 
        alarms={triggeredAlarms}
        onDismiss={handleDismissAlarm}
        onSnooze={handleSnoozeAlarm}
        onComplete={handleCompleteAlarm}
      />
    </main>
  );
}
