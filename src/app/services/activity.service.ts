import { Injectable, signal } from '@angular/core';

export interface ActivityLog {
  id: string;
  description: string;
  type: 'task' | 'diary' | 'system';
  timestamp: string; // ISO string
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  activities = signal<ActivityLog[]>([]);

  constructor() {
    this.loadActivities();
  }

  logActivity(description: string, type: 'task' | 'diary' | 'system'): void {
    const newLog: ActivityLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      description,
      type,
      timestamp: new Date().toISOString()
    };
    
    this.activities.update(list => {
      const updated = [newLog, ...list].slice(0, 20); // Limit to last 20 logs
      localStorage.setItem('timeblock_activities', JSON.stringify(updated));
      return updated;
    });
  }

  loadActivities(): void {
    const saved = localStorage.getItem('timeblock_activities');
    if (saved) {
      try {
        this.activities.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse activities', e);
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  }

  private resetToDefaults(): void {
    const initial: ActivityLog[] = [
      { 
        id: 'init-welcome', 
        description: 'Welcome to TimeBlock! Your workspace is ready.', 
        type: 'system', 
        timestamp: new Date().toISOString() 
      }
    ];
    this.activities.set(initial);
    localStorage.setItem('timeblock_activities', JSON.stringify(initial));
  }
}
