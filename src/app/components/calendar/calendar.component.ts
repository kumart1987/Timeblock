import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-page-container animate-slide-up">
      <div class="calendar-main-panel glass-panel">
        <div class="calendar-header">
          <div class="month-select-row">
            <h2>{{ currentMonthName() }} {{ currentYear() }}</h2>
            <div class="nav-buttons">
              <button class="nav-btn" (click)="adjustMonth(-1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button class="nav-btn-today" (click)="goToToday()">Today</button>
              <button class="nav-btn" (click)="adjustMonth(1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="calendar-body">
          <div class="weekday-labels">
            <span>Sunday</span>
            <span>Monday</span>
            <span>Tuesday</span>
            <span>Wednesday</span>
            <span>Thursday</span>
            <span>Friday</span>
            <span>Saturday</span>
          </div>

          <div class="days-grid">
            @for (day of calendarDays(); track day.dateString + '-' + day.dayNum) {
              <div 
                [class.empty]="day.isEmpty" 
                [class.today]="day.isToday" 
                [class.selected]="day.dateString === selectedDate()"
                (click)="!day.isEmpty && selectDate(day.dateString)"
                class="day-cell">
                
                <span class="day-number">{{ day.dayNum }}</span>
                
                <div class="cell-tasks-container">
                  @for (task of day.tasks.slice(0, 3); track task.id) {
                    <div class="calendar-task-badge" [class]="'badge-' + task.priority" [class.completed]="task.completed">
                      {{ task.title }}
                    </div>
                  }
                  @if (day.tasks.length > 3) {
                    <span class="more-tasks-label">+{{ day.tasks.length - 3 }} more</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Right Side Task Drawer -->
      <div class="glass-panel task-drawer">
        <div class="drawer-header">
          <h3>Tasks on {{ formatDateReadable(selectedDate()) }}</h3>
        </div>

        <div class="drawer-body">
          @if (drawerTasks().length === 0) {
            <div class="drawer-empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p>No tasks scheduled for this day.</p>
              <button class="btn btn-secondary" (click)="quickCreateTask()">Add New Task</button>
            </div>
          } @else {
            <div class="drawer-tasks-list">
              @for (task of drawerTasks(); track task.id) {
                <div class="drawer-task-item glass-panel" [class.completed]="task.completed">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      [checked]="task.completed" 
                      (change)="toggleTask(task)">
                    <span class="checkmark"></span>
                  </label>
                  <div class="drawer-task-details">
                    <div class="drawer-task-title-row">
                      <h4>{{ task.title }}</h4>
                      <span class="task-time">{{ formatTime(task.timeBlock) }}</span>
                    </div>
                    @if (task.description) {
                      <p>{{ task.description }}</p>
                    }
                    <div>
                      <span class="badge" [class]="'badge-' + task.priority">{{ task.priority }}</span>
                    </div>
                  </div>
                  <button class="delete-btn" (click)="deleteTask(task)" aria-label="Delete task">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Quick create field -->
        <div class="drawer-footer">
          <input 
            type="text" 
            placeholder="Quick add task + Enter" 
            [(ngModel)]="quickTaskTitle" 
            (keyup.enter)="saveQuickTask()" 
            class="input-control">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-page-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      height: calc(100vh - 130px);
      width: 100%;
    }

    @media (max-width: 1100px) {
      .calendar-page-container {
        grid-template-columns: 1fr;
        height: auto;
      }
      .task-drawer {
        height: 400px;
      }
    }

    .calendar-main-panel {
      background-color: hsl(var(--bg-secondary));
      display: flex;
      flex-direction: column;
      padding: 24px;
      height: 100%;
      overflow: hidden;
    }

    .calendar-header {
      margin-bottom: 20px;
    }

    .month-select-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .month-select-row h2 {
      font-size: 1.5rem;
      font-family: var(--font-display);
    }

    .nav-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-btn {
      background-color: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-color));
      color: hsl(var(--text-primary));
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .nav-btn:hover {
      background-color: hsl(var(--border-color));
    }

    .nav-btn-today {
      background-color: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-color));
      color: hsl(var(--text-primary));
      height: 32px;
      padding: 0 16px;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .nav-btn-today:hover {
      background-color: hsl(var(--border-color));
    }

    .calendar-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .weekday-labels {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-weight: 600;
      font-size: 0.8rem;
      color: hsl(var(--text-muted));
      padding-bottom: 12px;
      border-bottom: 1px solid hsl(var(--border-color));
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: repeat(6, 1fr);
      flex: 1;
      gap: 1px;
      background-color: hsl(var(--border-color));
      margin-top: 1px;
    }

    .day-cell {
      background-color: hsl(var(--bg-secondary));
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      cursor: pointer;
      overflow: hidden;
      transition: background-color var(--transition-fast);
    }

    .day-cell:hover:not(.empty) {
      background-color: hsl(var(--bg-tertiary));
    }

    .day-cell.empty {
      background-color: hsl(var(--bg-primary));
      opacity: 0.3;
      cursor: default;
    }

    .day-cell.selected {
      border: 2px solid hsl(var(--accent-primary));
    }

    .day-cell.today .day-number {
      background-color: hsl(var(--accent-primary));
      color: #ffffff;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .day-number {
      font-size: 0.85rem;
      font-weight: 500;
      color: hsl(var(--text-secondary));
    }

    .cell-tasks-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      overflow: hidden;
    }

    .calendar-task-badge {
      font-size: 0.7rem;
      padding: 3px 6px;
      border-radius: 4px;
      font-weight: 500;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      width: 100%;
    }

    .calendar-task-badge.completed {
      text-decoration: line-through;
      opacity: 0.5;
    }

    .more-tasks-label {
      font-size: 0.65rem;
      color: hsl(var(--text-muted));
      font-weight: 600;
      margin-left: 2px;
    }

    /* Task Drawer styling */
    .task-drawer {
      background-color: hsl(var(--bg-secondary));
      display: flex;
      flex-direction: column;
      padding: 24px;
      height: 100%;
    }

    .drawer-header {
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .drawer-header h3 {
      font-size: 1.1rem;
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 16px;
    }

    .drawer-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 80%;
      text-align: center;
      color: hsl(var(--text-secondary));
      gap: 12px;
    }

    .drawer-empty-state p {
      font-size: 0.85rem;
      max-width: 200px;
    }

    .drawer-tasks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .drawer-task-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: hsl(var(--bg-secondary));
      border-left: 3px solid hsl(var(--border-color));
      transition: transform var(--transition-fast);
    }

    .drawer-task-item.completed {
      opacity: 0.6;
      border-left-color: hsl(var(--accent-success)) !important;
    }

    .drawer-task-item.completed h4 {
      text-decoration: line-through;
      color: hsl(var(--text-muted));
    }

    .drawer-task-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .drawer-task-details p {
      font-size: 0.8rem;
      color: hsl(var(--text-secondary));
    }

    .drawer-task-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .drawer-task-title-row h4 {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: hsl(var(--text-muted));
      cursor: pointer;
      transition: color var(--transition-fast);
    }

    .delete-btn:hover {
      color: hsl(var(--accent-danger));
    }

    .drawer-footer {
      border-top: 1px solid hsl(var(--border-color));
      padding-top: 16px;
    }
  `]
})
export class CalendarComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  currentYear = signal<number>(new Date().getFullYear());
  currentMonth = signal<number>(new Date().getMonth());
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  quickTaskTitle = '';

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  currentMonthName = computed(() => this.months[this.currentMonth()]);

  // Generate calendar cells (including task list per day cell)
  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const allTasks = this.taskService.tasks();

    const days: Array<{ dayNum: string; dateString: string; isEmpty: boolean; isToday: boolean; tasks: Task[] }> = [];

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();

    const todayStr = new Date().toISOString().split('T')[0];

    // Padding cells
    for (let i = 0; i < startWeekday; i++) {
      days.push({ dayNum: '', dateString: '', isEmpty: true, isToday: false, tasks: [] });
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const isToday = dateStr === todayStr;
      const dayTasks = allTasks.filter(t => t.date === dateStr);

      days.push({
        dayNum: String(d),
        dateString: dateStr,
        isEmpty: false,
        isToday,
        tasks: dayTasks
      });
    }

    // Fill remaining cells to make a full grid of 42 cells (6 weeks)
    const totalCells = 42;
    const remaining = totalCells - days.length;
    for (let j = 0; j < remaining; j++) {
      days.push({ dayNum: '', dateString: '', isEmpty: true, isToday: false, tasks: [] });
    }

    return days;
  });

  // Selected date tasks
  drawerTasks = computed(() => {
    const list = this.taskService.tasks();
    const date = this.selectedDate();
    return list
      .filter(t => t.date === date)
      .sort((a, b) => a.timeBlock.localeCompare(b.timeBlock));
  });

  adjustMonth(offset: number): void {
    let m = this.currentMonth() + offset;
    let y = this.currentYear();

    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }

    this.currentMonth.set(m);
    this.currentYear.set(y);
  }

  goToToday(): void {
    const today = new Date();
    this.currentYear.set(today.getFullYear());
    this.currentMonth.set(today.getMonth());
    this.selectedDate.set(today.toISOString().split('T')[0]);
  }

  selectDate(dateStr: string): void {
    if (dateStr) {
      this.selectedDate.set(dateStr);
    }
  }

  toggleTask(task: Task): void {
    const updated = { ...task, completed: !task.completed };
    this.taskService.saveTask(updated).subscribe();
  }

  deleteTask(task: Task): void {
    if (task.id) {
      this.taskService.deleteTask(task.id).subscribe();
    }
  }

  quickCreateTask(): void {
    this.quickTaskTitle = 'New Task';
    this.saveQuickTask();
  }

  saveQuickTask(): void {
    const title = this.quickTaskTitle.trim();
    if (!title) return;

    const task: Task = {
      title,
      description: '',
      date: this.selectedDate(),
      timeBlock: '12:00',
      priority: 'medium',
      completed: false
    };

    this.taskService.saveTask(task).subscribe({
      next: () => {
        this.quickTaskTitle = '';
      }
    });
  }

  formatDateReadable(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}
