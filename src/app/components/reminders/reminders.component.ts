import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reminders-wrapper animate-slide-up">
      <div class="reminders-header">
        <h2>Schedule Reminders</h2>
        <p>Stay on track with upcoming and urgent alerts</p>
      </div>

      <div class="glass-panel reminders-card">
        <h3>Alert Notifications</h3>

        @if (reminders().length === 0) {
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="bell-off">
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
              <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
              <path d="M18 8a6 6 0 0 0-9.33-5"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <p>All caught up! No urgent pending reminders.</p>
          </div>
        } @else {
          <div class="reminders-list">
            @for (reminder of reminders(); track reminder.id) {
              <div class="reminder-item glass-panel" [class.urgent]="reminder.priority === 'high'">
                <div class="reminder-icon" [class]="'bg-' + reminder.priority">
                  @if (reminder.priority === 'high') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  }
                </div>
                
                <div class="reminder-details">
                  <div class="reminder-title-row">
                    <h4>{{ reminder.title }}</h4>
                    <span class="reminder-time">{{ formatTime(reminder.timeBlock) }}</span>
                  </div>
                  <p>Scheduled for <strong>{{ formatDateLabel(reminder.date) }}</strong></p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .reminders-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }

    .reminders-header h2 {
      font-size: 1.6rem;
      margin-bottom: 4px;
    }

    .reminders-header p {
      color: hsl(var(--text-secondary));
      font-size: 0.95rem;
    }

    .reminders-card {
      background-color: hsl(var(--bg-secondary));
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 350px;
    }

    .reminders-card h3 {
      font-size: 1.1rem;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 14px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: hsl(var(--text-secondary));
      gap: 16px;
    }

    .bell-off {
      color: hsl(var(--text-muted));
      opacity: 0.7;
    }

    .reminders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .reminder-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background-color: hsl(var(--bg-secondary));
      align-items: center;
      border-left: 4px solid hsl(var(--border-color));
    }

    .reminder-item.urgent {
      border-left-color: hsl(var(--accent-danger));
    }

    .reminder-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }

    .bg-high { background-color: hsl(var(--accent-danger)); }
    .bg-medium { background-color: hsl(var(--accent-warning)); }
    .bg-low { background-color: hsl(var(--accent-primary)); }

    .reminder-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .reminder-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .reminder-title-row h4 {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .reminder-time {
      font-size: 0.8rem;
      font-weight: 600;
      color: hsl(var(--accent-primary));
    }

    .reminder-details p {
      font-size: 0.8rem;
      color: hsl(var(--text-secondary));
    }
  `]
})
export class RemindersComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  // Filter tasks that are: 1. Incomplete AND (2. Date is today or in the future)
  reminders = computed(() => {
    const list = this.taskService.tasks();
    const todayStr = new Date().toISOString().split('T')[0];

    return list
      .filter(t => !t.completed && t.date >= todayStr)
      // Sort: urgent (high) first, then date, then time
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;

        return a.timeBlock.localeCompare(b.timeBlock);
      });
  });

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (dateStr === tomorrowStr) return 'Tomorrow';

    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
