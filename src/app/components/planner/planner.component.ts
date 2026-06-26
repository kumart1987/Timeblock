import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="planner-container animate-slide-up">
      <div class="planner-card glass-panel">
        <div class="planner-header">
          <div class="date-selector">
            <button class="nav-btn" (click)="adjustDate(-1)" aria-label="Previous Day">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2>{{ formatReadableDate(selectedDate()) }}</h2>
            <button class="nav-btn" (click)="adjustDate(1)" aria-label="Next Day">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <button class="btn btn-secondary" (click)="goToToday()">Go to Today</button>
        </div>

        <div class="planner-schedule-grid">
          @for (slot of timeSlots(); track slot.hourStr) {
            <div class="schedule-row">
              <div class="time-label">
                <span>{{ slot.displayTime }}</span>
              </div>
              
              <div class="slot-content">
                <!-- Task blocks in this slot -->
                @for (task of slot.tasks; track task.id) {
                  <div class="timeblock-item" [class]="'priority-' + task.priority" [class.completed]="task.completed">
                    <div class="timeblock-details">
                      <h4>{{ task.title }}</h4>
                      @if (task.description) {
                        <p>{{ task.description }}</p>
                      }
                    </div>
                    <div class="timeblock-actions">
                      <button (click)="toggleTask(task)" [attr.aria-label]="task.completed ? 'Mark incomplete' : 'Mark complete'">
                        @if (task.completed) {
                          <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        } @else {
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                        }
                      </button>
                      <button (click)="deleteTask(task)" aria-label="Delete Block">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                }

                <!-- Quick add indicator/form in slot -->
                @if (activeSlotAdd() === slot.hourStr) {
                  <div class="quick-add-form animate-fade">
                    <input 
                      type="text" 
                      placeholder="Block title..." 
                      [(ngModel)]="quickTaskTitle" 
                      (keyup.enter)="saveQuickTask(slot.hourStr)"
                      class="input-control quick-add-input"
                      #quickInput>
                    
                    <select [(ngModel)]="quickPriority" class="priority-select">
                      <option value="low">Low</option>
                      <option value="medium">Med</option>
                      <option value="high">High</option>
                    </select>

                    <select [(ngModel)]="quickDuration" class="duration-select">
                      <option [ngValue]="1">1 hr</option>
                      <option [ngValue]="2">2 hrs</option>
                      <option [ngValue]="3">3 hrs</option>
                      <option [ngValue]="4">4 hrs</option>
                      <option [ngValue]="5">5 hrs</option>
                    </select>

                    <button class="btn btn-primary btn-sm" (click)="saveQuickTask(slot.hourStr)">Add</button>
                    <button class="btn btn-secondary btn-sm" (click)="cancelQuickAdd()">Cancel</button>
                  </div>
                } @else {
                  <button class="slot-add-placeholder" (click)="startQuickAdd(slot.hourStr)">
                    + Block Time Slot
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .planner-container {
      width: 100%;
      height: 100%;
    }

    .planner-card {
      background-color: hsl(var(--bg-secondary));
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .planner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 16px;
    }

    .date-selector {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .date-selector h2 {
      font-size: 1.4rem;
      min-width: 200px;
      text-align: center;
      font-family: var(--font-display);
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

    .planner-schedule-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: calc(100vh - 250px);
      overflow-y: auto;
      padding-right: 8px;
    }

    .schedule-row {
      display: flex;
      align-items: stretch;
      gap: 20px;
      min-height: 70px;
    }

    .time-label {
      width: 70px;
      text-align: right;
      font-weight: 600;
      font-size: 0.85rem;
      color: hsl(var(--text-secondary));
      padding-top: 10px;
      font-family: var(--font-display);
    }

    .slot-content {
      flex: 1;
      border-bottom: 1px solid hsl(var(--border-light));
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 8px;
    }

    .slot-add-placeholder {
      display: none;
      flex: 1;
      height: 44px;
      border: 1.5px dashed hsl(var(--border-color));
      background: transparent;
      color: hsl(var(--text-muted));
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      align-items: center;
      justify-content: center;
    }

    .schedule-row:hover .slot-add-placeholder {
      display: flex;
    }

    .slot-add-placeholder:hover {
      border-color: hsl(var(--accent-primary));
      color: hsl(var(--accent-primary));
      background-color: rgba(37, 99, 235, 0.02);
    }

    /* Visual block items */
    .timeblock-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex: 1;
      padding: 12px 20px;
      border-radius: 12px;
      transition: all var(--transition-fast);
      border-left: 5px solid transparent;
    }

    .timeblock-item.completed {
      opacity: 0.6;
      border-left-color: hsl(var(--accent-success)) !important;
    }

    .timeblock-item.completed h4 {
      text-decoration: line-through;
      color: hsl(var(--text-muted));
    }

    .timeblock-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .timeblock-details h4 {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .timeblock-details p {
      font-size: 0.8rem;
      color: hsl(var(--text-secondary));
    }

    .timeblock-actions {
      display: flex;
      gap: 10px;
    }

    .timeblock-actions button {
      background: transparent;
      border: none;
      color: hsl(var(--text-muted));
      cursor: pointer;
      transition: color var(--transition-fast);
    }

    .timeblock-actions button:hover {
      color: hsl(var(--text-primary));
    }

    .timeblock-actions button:hover .check-icon {
      color: hsl(var(--accent-success));
    }

    .timeblock-actions button:last-child:hover {
      color: hsl(var(--accent-danger));
    }

    /* Color blocks mapping based on priority */
    .priority-low {
      background-color: rgba(37, 99, 235, 0.08);
      border-left-color: hsl(var(--accent-primary));
      color: hsl(var(--text-primary));
    }

    .priority-medium {
      background-color: rgba(245, 158, 11, 0.08);
      border-left-color: hsl(var(--accent-warning));
      color: hsl(var(--text-primary));
    }

    .priority-high {
      background-color: rgba(239, 68, 68, 0.08);
      border-left-color: hsl(var(--accent-danger));
      color: hsl(var(--text-primary));
    }

    /* Quick Add form styling */
    .quick-add-form {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      background: hsl(var(--bg-tertiary));
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid hsl(var(--border-color));
    }

    .quick-add-input {
      flex: 1;
      height: 36px;
      padding: 4px 12px;
      font-size: 0.85rem;
    }

    .quick-add-form .priority-select,
    .quick-add-form .duration-select {
      height: 36px;
      padding: 4px 8px;
      background: hsl(var(--bg-primary));
      border: 1px solid hsl(var(--border-color));
      color: hsl(var(--text-primary));
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      outline: none;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: 6px;
    }

    @media (max-width: 576px) {
      .planner-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      .date-selector {
        justify-content: space-between;
      }
      .date-selector h2 {
        font-size: 1.15rem;
        min-width: 0;
      }
      .quick-add-form {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        width: 100%;
      }
      .quick-add-input {
        width: 100%;
      }
      .quick-add-form .priority-select,
      .quick-add-form .duration-select {
        width: 100%;
      }
      .schedule-row {
        gap: 10px;
      }
      .time-label {
        width: 55px;
        font-size: 0.8rem;
      }
      .timeblock-item {
        padding: 8px 12px;
      }
    }
  `]
})
export class PlannerComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly activityService = inject(ActivityService);

  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  activeSlotAdd = signal<string | null>(null);

  // Quick form state
  quickTaskTitle = '';
  quickPriority = 'medium' as 'high' | 'medium' | 'low';
  quickDuration = 1;

  // Hours list (8:00 to 21:00)
  hours = Array.from({ length: 14 }, (_, i) => i + 8);

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  timeSlots = computed(() => {
    const list = this.taskService.tasks();
    const date = this.selectedDate();

    return this.hours.map(hour => {
      const hourStr = String(hour).padStart(2, '0') + ':00';
      const slotTasks = list.filter(t => {
        if (t.date !== date) return false;
        const startHour = parseInt(t.timeBlock.split(':')[0], 10);
        const duration = t.duration || 1;
        return startHour <= hour && hour < startHour + duration;
      });
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayTime = `${displayHour} ${ampm}`;

      return {
        hourStr,
        displayTime,
        tasks: slotTasks
      };
    });
  });

  adjustDate(days: number): void {
    const [y, m, d] = this.selectedDate().split('-');
    const current = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    current.setDate(current.getDate() + days);

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');

    this.selectedDate.set(`${year}-${month}-${day}`);
    this.cancelQuickAdd();
  }

  goToToday(): void {
    this.selectedDate.set(new Date().toISOString().split('T')[0]);
    this.cancelQuickAdd();
  }

  startQuickAdd(hourStr: string): void {
    this.quickTaskTitle = '';
    this.quickPriority = 'medium';
    this.quickDuration = 1;
    this.activeSlotAdd.set(hourStr);
  }

  cancelQuickAdd(): void {
    this.activeSlotAdd.set(null);
  }

  saveQuickTask(hourStr: string): void {
    const title = this.quickTaskTitle.trim();
    if (!title) return;

    const task: Task = {
      title,
      description: '',
      date: this.selectedDate(),
      timeBlock: hourStr,
      duration: this.quickDuration,
      priority: this.quickPriority,
      completed: false
    };

    this.taskService.saveTask(task).subscribe({
      next: () => {
        this.cancelQuickAdd();
        this.activityService.logActivity(`Task "${task.title}" was created`, 'task');
      }
    });
  }

  toggleTask(task: Task): void {
    const updated = { ...task, completed: !task.completed };
    this.taskService.saveTask(updated).subscribe({
      next: () => {
        const action = updated.completed ? 'completed' : 'reopened';
        this.activityService.logActivity(`Task "${task.title}" was ${action}`, 'task');
      }
    });
  }

  deleteTask(task: Task): void {
    if (task.id) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.activityService.logActivity(`Task "${task.title}" was deleted`, 'task');
        }
      });
    }
  }

  formatReadableDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
}
