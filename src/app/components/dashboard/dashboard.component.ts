import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-wrapper animate-slide-up">
      <!-- Search & New Task Row -->
      <div class="action-header">
        <div class="search-box glass-panel">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search tasks..." 
            [(ngModel)]="searchQuery" 
            class="search-input">
        </div>
        <button class="btn btn-primary" (click)="openNewTaskModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Task</span>
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <!-- Total Tasks -->
        <div class="glass-panel stat-card card-blue">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Tasks</span>
            <h3 class="stat-val">{{ totalTasksCount() }}</h3>
            <span class="stat-sub">Today's schedule</span>
          </div>
        </div>

        <!-- Completed Tasks -->
        <div class="glass-panel stat-card card-green">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Completed</span>
            <h3 class="stat-val">{{ completedTasksCount() }}</h3>
            <span class="stat-sub">Finished today</span>
          </div>
        </div>

        <!-- Pending Tasks -->
        <div class="glass-panel stat-card card-orange">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Pending</span>
            <h3 class="stat-val">{{ pendingTasksCount() }}</h3>
            <span class="stat-sub">Still remaining</span>
          </div>
        </div>

        <!-- Completion Progress -->
        <div class="glass-panel stat-card card-cyan">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Progress</span>
            <h3 class="stat-val">{{ progressPercentage() }}%</h3>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" [style.width.%]="progressPercentage()"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Columns Grid -->
      <div class="dashboard-grid">
        <!-- Left Column: Mini Calendar -->
        <div class="glass-panel grid-card">
          <div class="card-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Calendar</span>
            </h3>
            <div class="calendar-nav">
              <button class="nav-arrow" (click)="adjustMonth(-1)" aria-label="Previous Month">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span class="month-year">{{ currentMonthName() }} {{ currentYear() }}</span>
              <button class="nav-arrow" (click)="adjustMonth(1)" aria-label="Next Month">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
          <div class="mini-calendar-body">
            <div class="weekday-header">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div class="calendar-days-grid">
              @for (day of calendarDays(); track day.dateString) {
                <button 
                  [class.empty-day]="day.isEmpty"
                  [class.current-day]="day.isToday"
                  [class.selected-day]="day.isSelected"
                  [class.has-tasks]="day.hasTasks"
                  [disabled]="day.isEmpty"
                  (click)="selectDate(day.dateString)"
                  class="calendar-day-btn">
                  {{ day.dayNum }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Right Column: Timeline / Tasks -->
        <div class="glass-panel grid-card timeline-card">
          <div class="card-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Today's Timeline</span>
            </h3>
            <div class="filter-group">
              <select [(ngModel)]="priorityFilter" class="priority-select">
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div class="timeline-body">
            @if (filteredTasks().length === 0) {
              <div class="empty-state animate-fade">
                <div class="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                  </svg>
                </div>
                <h4>No tasks for today</h4>
                <p>Enjoy your free time, or create a new task to plan your day!</p>
                <button class="btn btn-secondary" (click)="openNewTaskModal()">Add Task</button>
              </div>
            } @else {
              <div class="tasks-list">
                @for (task of sortedFilteredTasks(); track task.id) {
                  <div class="task-item glass-panel" [class.completed]="task.completed">
                    <label class="checkbox-container">
                      <input 
                        type="checkbox" 
                        [checked]="task.completed" 
                        (change)="toggleTaskCompletion(task)">
                      <span class="checkmark"></span>
                    </label>
                    <div class="task-details">
                      <div class="task-title-row">
                        <h4>{{ task.title }}</h4>
                        <span class="task-time">{{ formatTime(task.timeBlock) }}</span>
                      </div>
                      @if (task.description) {
                        <p class="task-desc">{{ task.description }}</p>
                      }
                      <div class="task-footer">
                        <span class="badge" [class]="'badge-' + task.priority">{{ task.priority }}</span>
                      </div>
                    </div>
                    <button class="delete-task-btn" (click)="deleteTask(task)" aria-label="Delete Task">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Float Action Button -->
      <button class="floating-fab" (click)="openNewTaskModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <!-- Task Modal Overlay -->
      @if (isNewTaskModalOpen()) {
        <div class="modal-overlay" (click)="closeNewTaskModal()">
          <div class="glass-panel modal-card animate-slide-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New Task</h3>
              <button class="close-modal-btn" (click)="closeNewTaskModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form (ngSubmit)="saveTask()">
              <div class="form-group">
                <label class="form-label" for="taskTitle">Task Title *</label>
                <input 
                  type="text" 
                  id="taskTitle" 
                  name="taskTitle" 
                  class="input-control" 
                  placeholder="What are you planning?" 
                  required 
                  [(ngModel)]="newTask.title">
              </div>

              <div class="form-group">
                <label class="form-label" for="taskDesc">Description</label>
                <textarea 
                  id="taskDesc" 
                  name="taskDesc" 
                  class="input-control textarea-control" 
                  placeholder="Add details..." 
                  [(ngModel)]="newTask.description" 
                  rows="3"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group col-6">
                  <label class="form-label" for="taskDate">Date</label>
                  <input 
                    type="date" 
                    id="taskDate" 
                    name="taskDate" 
                    class="input-control" 
                    [(ngModel)]="newTask.date">
                </div>

                <div class="form-group col-6">
                  <label class="form-label" for="taskTime">Time Slot</label>
                  <input 
                    type="time" 
                    id="taskTime" 
                    name="taskTime" 
                    class="input-control" 
                    [(ngModel)]="newTask.timeBlock">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Priority</label>
                <div class="priority-radio-group">
                  <label class="priority-radio-label badge-low" [class.selected]="newTask.priority === 'low'">
                    <input type="radio" name="priority" value="low" [(ngModel)]="newTask.priority">
                    <span>Low</span>
                  </label>
                  <label class="priority-radio-label badge-medium" [class.selected]="newTask.priority === 'medium'">
                    <input type="radio" name="priority" value="medium" [(ngModel)]="newTask.priority">
                    <span>Medium</span>
                  </label>
                  <label class="priority-radio-label badge-high" [class.selected]="newTask.priority === 'high'">
                    <input type="radio" name="priority" value="high" [(ngModel)]="newTask.priority">
                    <span>High</span>
                  </label>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeNewTaskModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!newTask.title">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }
    
    .action-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    
    .search-box {
      display: flex;
      align-items: center;
      padding: 6px 14px;
      flex: 1;
      max-width: 400px;
      background-color: hsl(var(--bg-secondary));
    }
    
    .search-icon {
      color: hsl(var(--text-muted));
      margin-right: 10px;
    }
    
    .search-input {
      border: none;
      background: transparent;
      color: hsl(var(--text-primary));
      width: 100%;
      font-size: 0.95rem;
    }
    
    .search-input:focus {
      outline: none;
    }
    
    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      background-color: hsl(var(--bg-secondary));
    }
    
    .stat-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
    }
    
    .stat-icon svg {
      width: 24px;
      height: 24px;
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    
    .stat-label {
      font-size: 0.85rem;
      color: hsl(var(--text-secondary));
      font-weight: 500;
    }
    
    .stat-val {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 4px 0;
      line-height: 1;
    }
    
    .stat-sub {
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
    }
    
    /* Custom themes for stats card */
    .card-blue { border-top: 4px solid hsl(var(--accent-primary)); }
    .card-blue .stat-icon { background-color: rgba(37, 99, 235, 0.1); color: hsl(var(--accent-primary)); }
    
    .card-green { border-top: 4px solid hsl(var(--accent-success)); }
    .card-green .stat-icon { background-color: rgba(16, 185, 129, 0.15); color: hsl(var(--accent-success)); }
    
    .card-orange { border-top: 4px solid hsl(var(--accent-warning)); }
    .card-orange .stat-icon { background-color: rgba(245, 158, 11, 0.15); color: hsl(var(--accent-warning)); }
    
    .card-cyan { border-top: 4px solid hsl(var(--accent-teal)); }
    .card-cyan .stat-icon { background-color: rgba(13, 148, 136, 0.15); color: hsl(var(--accent-teal)); }
    
    .progress-bar-container {
      width: 100%;
      height: 6px;
      background-color: hsl(var(--bg-tertiary));
      border-radius: 3px;
      margin-top: 8px;
      overflow: hidden;
    }
    
    .progress-bar-fill {
      height: 100%;
      background-color: hsl(var(--accent-teal));
      border-radius: 3px;
      transition: width var(--transition-normal);
    }
    
    /* Dashboard 2-column layout */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.1fr 1.9fr;
      gap: 24px;
      align-items: start;
    }
    
    @media (max-width: 992px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .grid-card {
      padding: 24px;
      background-color: hsl(var(--bg-secondary));
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 16px;
    }
    
    .card-header h3 {
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Mini calendar styling */
    .calendar-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .nav-arrow {
      background: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-color));
      color: hsl(var(--text-primary));
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    
    .nav-arrow:hover {
      background-color: hsl(var(--border-color));
    }
    
    .month-year {
      font-size: 0.9rem;
      font-weight: 600;
      min-width: 90px;
      text-align: center;
      font-family: var(--font-display);
    }
    
    .weekday-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-weight: 600;
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
      margin-bottom: 8px;
    }
    
    .calendar-days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    
    .calendar-day-btn {
      aspect-ratio: 1;
      border: none;
      background: transparent;
      color: hsl(var(--text-primary));
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all var(--transition-fast);
    }
    
    .calendar-day-btn:hover:not(.empty-day) {
      background-color: hsl(var(--bg-tertiary));
    }
    
    .calendar-day-btn.empty-day {
      cursor: default;
      opacity: 0.15;
    }
    
    .calendar-day-btn.current-day {
      border: 1px solid hsl(var(--accent-primary));
      color: hsl(var(--accent-primary));
      font-weight: 700;
    }
    
    .calendar-day-btn.selected-day {
      background-color: hsl(var(--accent-primary)) !important;
      color: #ffffff !important;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    }
    
    .calendar-day-btn.has-tasks::after {
      content: "";
      position: absolute;
      bottom: 4px;
      width: 4px;
      height: 4px;
      background-color: currentColor;
      border-radius: 50%;
    }
    
    .calendar-day-btn.selected-day.has-tasks::after {
      background-color: #ffffff;
    }
    
    /* Timeline styling */
    .timeline-card {
      min-height: 420px;
    }
    
    .priority-select {
      background: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-color));
      color: hsl(var(--text-primary));
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      font-family: var(--font-sans);
    }
    
    .timeline-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
      color: hsl(var(--text-secondary));
    }
    
    .empty-icon {
      width: 60px;
      height: 60px;
      color: hsl(var(--text-muted));
      margin-bottom: 16px;
      opacity: 0.7;
    }
    
    .empty-state h4 {
      font-size: 1.1rem;
      margin-bottom: 6px;
    }
    
    .empty-state p {
      font-size: 0.85rem;
      margin-bottom: 20px;
      max-width: 280px;
    }
    
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .task-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 16px;
      background-color: hsl(var(--bg-secondary));
      position: relative;
      border-left: 4px solid hsl(var(--border-color));
      transition: all var(--transition-fast);
    }
    
    .task-item.completed {
      opacity: 0.6;
      border-left-color: hsl(var(--accent-success)) !important;
    }
    
    .task-item.completed .task-title-row h4 {
      text-decoration: line-through;
      color: hsl(var(--text-muted));
    }
    
    .task-item:hover {
      transform: translateX(4px);
    }
    
    .task-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .task-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    
    .task-title-row h4 {
      font-size: 0.95rem;
      font-weight: 600;
    }
    
    .task-time {
      font-size: 0.8rem;
      color: hsl(var(--accent-primary));
      font-weight: 600;
      white-space: nowrap;
    }
    
    .task-desc {
      font-size: 0.85rem;
      color: hsl(var(--text-secondary));
      line-height: 1.4;
    }
    
    .task-footer {
      display: flex;
      margin-top: 4px;
    }
    
    .delete-task-btn {
      background: transparent;
      border: none;
      color: hsl(var(--text-muted));
      cursor: pointer;
      opacity: 0;
      transition: all var(--transition-fast);
      padding: 4px;
      border-radius: 4px;
      align-self: center;
    }
    
    .task-item:hover .delete-task-btn {
      opacity: 1;
    }
    
    .delete-task-btn:hover {
      color: hsl(var(--accent-danger));
      background-color: rgba(239, 68, 68, 0.08);
    }
    
    /* FAB Floating Button */
    .floating-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: hsl(var(--accent-primary));
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
      z-index: 90;
      transition: transform var(--transition-fast), background-color var(--transition-fast);
    }
    
    .floating-fab:hover {
      transform: scale(1.1);
      background-color: hsl(var(--accent-primary-hover));
    }
    
    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .modal-card {
      width: 100%;
      max-width: 500px;
      background-color: hsl(var(--bg-secondary));
      padding: 30px;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    
    .close-modal-btn {
      background: transparent;
      border: none;
      color: hsl(var(--text-muted));
      cursor: pointer;
      transition: color var(--transition-fast);
    }
    
    .close-modal-btn:hover {
      color: hsl(var(--text-primary));
    }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    
    .col-6 {
      flex: 1;
    }
    
    .textarea-control {
      resize: none;
    }
    
    .priority-radio-group {
      display: flex;
      gap: 12px;
      width: 100%;
    }
    
    .priority-radio-label {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      border: 2px solid transparent;
      transition: all var(--transition-fast);
      position: relative;
    }
    
    .priority-radio-label input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }
    
    .priority-radio-label.badge-low { border-color: rgba(37, 99, 235, 0.15); }
    .priority-radio-label.badge-low.selected { background-color: hsl(var(--accent-primary)); color: #fff; border-color: hsl(var(--accent-primary)); }
    
    .priority-radio-label.badge-medium { border-color: rgba(245, 158, 11, 0.15); }
    .priority-radio-label.badge-medium.selected { background-color: hsl(var(--accent-warning)); color: #fff; border-color: hsl(var(--accent-warning)); }
    
    .priority-radio-label.badge-high { border-color: rgba(239, 68, 68, 0.15); }
    .priority-radio-label.badge-high.selected { background-color: hsl(var(--accent-danger)); color: #fff; border-color: hsl(var(--accent-danger)); }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      border-top: 1px solid hsl(var(--border-color));
      padding-top: 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  searchQuery = '';
  priorityFilter = 'all';
  isNewTaskModalOpen = signal(false);

  // Calendar properties
  currentYear = signal<number>(new Date().getFullYear());
  currentMonth = signal<number>(new Date().getMonth()); // 0-indexed
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  // New task form state
  newTask = {
    title: '',
    description: '',
    date: '',
    timeBlock: '09:00',
    priority: 'medium' as 'high' | 'medium' | 'low'
  };

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  ngOnInit(): void {
    this.taskService.loadTasks();
    this.resetNewTaskForm();
  }

  // Task lists matching search & priorities
  filteredTasks = computed(() => {
    const list = this.taskService.tasks();
    const date = this.selectedDate();
    const query = this.searchQuery.toLowerCase().trim();
    const priority = this.priorityFilter;

    return list.filter(task => {
      const matchDate = task.date === date;
      const matchPriority = priority === 'all' || task.priority === priority;
      const matchQuery = !query || 
        task.title.toLowerCase().includes(query) || 
        task.description.toLowerCase().includes(query);

      return matchDate && matchPriority && matchQuery;
    });
  });

  sortedFilteredTasks = computed(() => {
    // Sort tasks by timeBlock ascending
    return [...this.filteredTasks()].sort((a, b) => a.timeBlock.localeCompare(b.timeBlock));
  });

  // Task Stats computed signals
  totalTasksCount = computed(() => this.filteredTasks().length);
  completedTasksCount = computed(() => this.filteredTasks().filter(t => t.completed).length);
  pendingTasksCount = computed(() => this.filteredTasks().filter(t => !t.completed).length);
  
  progressPercentage = computed(() => {
    const total = this.totalTasksCount();
    if (total === 0) return 0;
    return Math.round((this.completedTasksCount() / total) * 100);
  });

  // Calendar logic
  currentMonthName = computed(() => this.months[this.currentMonth()]);

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const selected = this.selectedDate();
    const allTasks = this.taskService.tasks();

    const days: Array<{ dayNum: string; dateString: string; isEmpty: boolean; isToday: boolean; isSelected: boolean; hasTasks: boolean }> = [];
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Weekday of first day (0 = Sunday, 6 = Saturday)
    const startWeekday = firstDay.getDay();

    // Fill empty cells for previous month padding
    for (let i = 0; i < startWeekday; i++) {
      days.push({ dayNum: '', dateString: '', isEmpty: true, isToday: false, isSelected: false, hasTasks: false });
    }

    // Fill current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      // Correct timezone offset local format YYYY-MM-DD
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selected;
      const hasTasks = allTasks.some(t => t.date === dateStr);

      days.push({
        dayNum: String(d),
        dateString: dateStr,
        isEmpty: false,
        isToday,
        isSelected,
        hasTasks
      });
    }

    return days;
  });

  adjustMonth(offset: number): void {
    let nextMonth = this.currentMonth() + offset;
    let nextYear = this.currentYear();

    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    this.currentMonth.set(nextMonth);
    this.currentYear.set(nextYear);
  }

  selectDate(dateStr: string): void {
    if (dateStr) {
      this.selectedDate.set(dateStr);
      this.newTask.date = dateStr;
    }
  }

  // Task controls
  toggleTaskCompletion(task: Task): void {
    const updated = { ...task, completed: !task.completed };
    this.taskService.saveTask(updated).subscribe();
  }

  deleteTask(task: Task): void {
    if (task.id) {
      this.taskService.deleteTask(task.id).subscribe();
    }
  }

  // Modal actions
  openNewTaskModal(): void {
    this.resetNewTaskForm();
    this.isNewTaskModalOpen.set(true);
  }

  closeNewTaskModal(): void {
    this.isNewTaskModalOpen.set(false);
  }

  resetNewTaskForm(): void {
    this.newTask = {
      title: '',
      description: '',
      date: this.selectedDate(),
      timeBlock: '09:00',
      priority: 'medium'
    };
  }

  saveTask(): void {
    if (!this.newTask.title.trim()) return;

    const taskToSave: Task = {
      title: this.newTask.title,
      description: this.newTask.description,
      date: this.newTask.date,
      timeBlock: this.newTask.timeBlock,
      priority: this.newTask.priority,
      completed: false
    };

    this.taskService.saveTask(taskToSave).subscribe({
      next: () => {
        this.closeNewTaskModal();
      },
      error: (err) => {
        console.error('Failed to create task', err);
      }
    });
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
