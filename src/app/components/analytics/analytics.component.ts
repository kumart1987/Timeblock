import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-wrapper animate-slide-up">
      <!-- Title row -->
      <div class="analytics-header">
        <h2>Productivity Analytics</h2>
        <p>Insights on your schedules and performance</p>
      </div>

      <!-- Top Row: Radial & Priority summary -->
      <div class="summary-row">
        <!-- Radial Completion Chart -->
        <div class="glass-panel analytics-card radial-card">
          <h3>Overall Completion Rate</h3>
          <div class="radial-container">
            <svg class="radial-svg" viewBox="0 0 100 100">
              <!-- Background circle -->
              <circle class="circle-bg" cx="50" cy="50" r="40" />
              <!-- Glow and Progress circle -->
              <circle 
                class="circle-progress" 
                cx="50" 
                cy="50" 
                r="40" 
                [style.strokeDashoffset]="strokeDashoffset()" />
            </svg>
            <div class="radial-label">
              <span class="pct">{{ completionRate() }}%</span>
              <span class="lbl">Completed</span>
            </div>
          </div>
          <div class="radial-stats">
            <div class="stat-item">
              <span class="num text-blue">{{ completedCount() }}</span>
              <span class="lbl">Done</span>
            </div>
            <div class="stat-item">
              <span class="num text-muted">{{ pendingCount() }}</span>
              <span class="lbl">Pending</span>
            </div>
          </div>
        </div>

        <!-- Priority Analysis -->
        <div class="glass-panel analytics-card priority-card">
          <h3>Completion by Priority</h3>
          
          <div class="priority-chart-list">
            <!-- High Priority -->
            <div class="priority-row">
              <div class="priority-label-group">
                <span class="badge badge-high">High</span>
                <span class="pct-detail">{{ priorityStats().high.completed }}/{{ priorityStats().high.total }}</span>
              </div>
              <div class="pct-bar-container">
                <div class="pct-bar-fill bg-red" [style.width.%]="priorityStats().high.rate"></div>
              </div>
              <span class="rate-val">{{ priorityStats().high.rate }}%</span>
            </div>

            <!-- Medium Priority -->
            <div class="priority-row">
              <div class="priority-label-group">
                <span class="badge badge-medium">Medium</span>
                <span class="pct-detail">{{ priorityStats().medium.completed }}/{{ priorityStats().medium.total }}</span>
              </div>
              <div class="pct-bar-container">
                <div class="pct-bar-fill bg-orange" [style.width.%]="priorityStats().medium.rate"></div>
              </div>
              <span class="rate-val">{{ priorityStats().medium.rate }}%</span>
            </div>

            <!-- Low Priority -->
            <div class="priority-row">
              <div class="priority-label-group">
                <span class="badge badge-low">Low</span>
                <span class="pct-detail">{{ priorityStats().low.completed }}/{{ priorityStats().low.total }}</span>
              </div>
              <div class="pct-bar-container">
                <div class="pct-bar-fill bg-blue" [style.width.%]="priorityStats().low.rate"></div>
              </div>
              <span class="rate-val">{{ priorityStats().low.rate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Weekly completion trend -->
      <div class="glass-panel analytics-card trend-card">
        <h3>Last 7 Days Trend</h3>
        
        <div class="trend-chart-container">
          <div class="y-axis-labels">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          <div class="columns-grid">
            @for (day of last7DaysStats(); track day.dateLabel) {
              <div class="column-wrapper">
                <div class="column-bar-hover-box">
                  <div class="tooltip">
                    {{ day.completed }} / {{ day.total }} Tasks ({{ day.rate }}%)
                  </div>
                  <!-- The Column Bar -->
                  <div class="column-bar">
                    <div class="column-fill" [style.height.%]="day.rate"></div>
                  </div>
                </div>
                <span class="column-label">{{ day.dateLabel }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }

    .analytics-header {
      margin-bottom: 8px;
    }

    .analytics-header h2 {
      font-size: 1.6rem;
      margin-bottom: 4px;
    }

    .analytics-header p {
      color: hsl(var(--text-secondary));
      font-size: 0.95rem;
    }

    .summary-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .summary-row {
        grid-template-columns: 1fr;
      }
    }

    .analytics-card {
      background-color: hsl(var(--bg-secondary));
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .analytics-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 14px;
    }

    /* Radial circle chart */
    .radial-card {
      align-items: center;
    }

    .radial-container {
      position: relative;
      width: 160px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .radial-svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .circle-bg {
      fill: none;
      stroke: hsl(var(--bg-tertiary));
      stroke-width: 8;
    }

    .circle-progress {
      fill: none;
      stroke: hsl(var(--accent-primary));
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 251.2; /* 2 * PI * r (r=40) */
      transition: stroke-dashoffset 0.8s ease-out;
    }

    .radial-label {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .radial-label .pct {
      font-size: 2rem;
      font-weight: 800;
      color: hsl(var(--text-primary));
      line-height: 1;
      font-family: var(--font-display);
    }

    .radial-label .lbl {
      font-size: 0.75rem;
      color: hsl(var(--text-secondary));
      margin-top: 4px;
    }

    .radial-stats {
      display: flex;
      gap: 40px;
      border-top: 1px solid hsl(var(--border-color));
      width: 100%;
      padding-top: 16px;
      justify-content: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-item .num {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .stat-item .lbl {
      font-size: 0.75rem;
      color: hsl(var(--text-secondary));
    }

    .text-blue { color: hsl(var(--accent-primary)); }

    /* Priority bar list styling */
    .priority-chart-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      justify-content: center;
      height: 100%;
    }

    .priority-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .priority-label-group {
      display: flex;
      flex-direction: column;
      width: 70px;
      gap: 2px;
    }

    .priority-label-group .pct-detail {
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
    }

    .pct-bar-container {
      flex: 1;
      height: 10px;
      background-color: hsl(var(--bg-tertiary));
      border-radius: 5px;
      overflow: hidden;
    }

    .pct-bar-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.6s ease-out;
    }

    .bg-red { background-color: hsl(var(--accent-danger)); }
    .bg-orange { background-color: hsl(var(--accent-warning)); }
    .bg-blue { background-color: hsl(var(--accent-primary)); }

    .rate-val {
      font-size: 0.85rem;
      font-weight: 700;
      width: 40px;
      text-align: right;
    }

    /* Trend columns bar chart */
    .trend-card {
      width: 100%;
    }

    .trend-chart-container {
      display: flex;
      gap: 20px;
      height: 240px;
      margin-top: 10px;
      padding-bottom: 20px;
    }

    .y-axis-labels {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 180px;
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
      text-align: right;
      width: 35px;
      padding-right: 8px;
    }

    .columns-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      height: 100%;
      align-items: end;
      border-left: 1.5px solid hsl(var(--border-color));
      border-bottom: 1.5px solid hsl(var(--border-color));
      padding-left: 10px;
    }

    .column-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      position: relative;
    }

    .column-bar-hover-box {
      width: 40%;
      max-width: 40px;
      min-width: 16px;
      height: 180px; /* Max height of charts */
      display: flex;
      align-items: flex-end;
      position: relative;
    }

    .column-bar {
      width: 100%;
      height: 100%;
      background-color: hsl(var(--bg-tertiary));
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
      cursor: pointer;
    }

    .column-fill {
      width: 100%;
      background: linear-gradient(180deg, hsl(var(--accent-primary)) 0%, rgba(37, 99, 235, 0.4) 100%);
      border-radius: 6px 6px 0 0;
      transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .column-label {
      font-size: 0.75rem;
      color: hsl(var(--text-secondary));
      margin-top: 10px;
      text-align: center;
    }

    /* Tooltip styling */
    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translate(-50%, -8px);
      background-color: hsl(var(--bg-secondary));
      border: 1px solid hsl(var(--border-color));
      color: hsl(var(--text-primary));
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      box-shadow: var(--shadow-md);
      transition: opacity 0.25s ease-out, transform 0.25s ease-out;
      z-index: 10;
    }

    .column-bar-hover-box:hover .tooltip {
      opacity: 1;
      transform: translate(-50%, -4px);
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  // Basic counters
  totalCount = computed(() => this.taskService.tasks().length);
  completedCount = computed(() => this.taskService.tasks().filter(t => t.completed).length);
  pendingCount = computed(() => this.taskService.tasks().filter(t => !t.completed).length);

  completionRate = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  // Calculate Dashoffset for SVG progress: (1 - pct/100) * circum (251.2)
  strokeDashoffset = computed(() => {
    const pct = this.completionRate();
    const c = 251.2;
    return c - (pct / 100) * c;
  });

  // Priority-wise completion
  priorityStats = computed(() => {
    const list = this.taskService.tasks();

    const getStats = (p: 'high' | 'medium' | 'low') => {
      const items = list.filter(t => t.priority === p);
      const total = items.length;
      const completed = items.filter(t => t.completed).length;
      const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { total, completed, rate };
    };

    return {
      high: getStats('high'),
      medium: getStats('medium'),
      low: getStats('low')
    };
  });

  // Trend analysis for the last 7 days (including today)
  last7DaysStats = computed(() => {
    const list = this.taskService.tasks();
    const stats = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayTasks = list.filter(t => t.date === dateStr);
      const total = dayTasks.length;
      const completed = dayTasks.filter(t => t.completed).length;
      const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

      // Label as 'Mon', 'Tue', etc.
      const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short' });

      stats.push({
        dateStr,
        dateLabel,
        total,
        completed,
        rate
      });
    }

    return stats;
  });
}
