/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TaskPriority {
  RENDAH = 'RENDAH',
  SEDANG = 'SEDANG',
  TINGGI = 'TINGGI'
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color name like 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200/60'
  colorHex: string; // Representing hex color for custom aesthetics
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO String or local YYYY-MM-DDTHH:MM
  priority: TaskPriority;
  isCompleted: boolean;
  soundEnabled: boolean;
  notified: boolean; // Flag to check if notification was already triggered
  categoryId?: string; // Links to modern custom categories
}

export interface AlarmInstance {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  triggeredAt: number;
}
