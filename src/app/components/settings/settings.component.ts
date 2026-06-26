import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-wrapper animate-slide-up">
      <div class="settings-header">
        <h2>App Settings</h2>
        <p>Manage your account, workspace data, and visualization preferences</p>
      </div>

      <div class="settings-grid">
        <!-- Profile Card -->
        <div class="glass-panel settings-card">
          <h3>User Profile</h3>
          
          <div class="profile-preview">
            <div class="profile-avatar">{{ userInitial() }}</div>
            <div class="profile-details">
              <h4>{{ username() }}</h4>
              <p>User ID: {{ userId() }}</p>
            </div>
          </div>
        </div>

        <!-- Preferences Settings -->
        <div class="glass-panel settings-card">
          <h3>Appearance & Visuals</h3>
          
          <div class="setting-item">
            <div class="setting-info">
              <h4>Dark Mode</h4>
              <p>Switch between light and dark visual themes</p>
            </div>
            <button 
              class="btn btn-secondary theme-btn" 
              (click)="themeService.toggleTheme()">
              {{ themeService.isDarkMode() ? 'Disable Dark Mode' : 'Enable Dark Mode' }}
            </button>
          </div>
        </div>

        <!-- Data Management -->
        <div class="glass-panel settings-card span-2">
          <h3>Workspace Data Management</h3>
          <p class="warning-text">These actions are local and will write directly to your database files on disk.</p>

          <div class="setting-item border-top">
            <div class="setting-info">
              <h4>Wipe Tasks Database</h4>
              <p>Permanently deletes all tasks associated with your account from the local server. This cannot be undone.</p>
            </div>
            <button class="btn btn-danger" (click)="wipeTasks()">Wipe Tasks</button>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h4>Clear Browser Settings</h4>
              <p>Resets all preferences, themes, and authorization tokens stored in the browser's LocalStorage cache.</p>
            </div>
            <button class="btn btn-secondary" (click)="clearCache()">Reset Settings</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }

    .settings-header h2 {
      font-size: 1.6rem;
      margin-bottom: 4px;
    }

    .settings-header p {
      color: hsl(var(--text-secondary));
      font-size: 0.95rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
      .span-2 {
        grid-column: span 1 !important;
      }
    }

    .settings-card {
      background-color: hsl(var(--bg-secondary));
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .span-2 {
      grid-column: span 2;
    }

    .settings-card h3 {
      font-size: 1.1rem;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 14px;
    }

    .profile-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 0;
    }

    .profile-avatar {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background-color: rgba(37, 99, 235, 0.1);
      color: hsl(var(--accent-primary));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2rem;
      font-family: var(--font-display);
    }

    .profile-details h4 {
      font-size: 1.05rem;
      font-weight: 600;
    }

    .profile-details p {
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      gap: 20px;
    }

    .border-top {
      border-top: 1px solid hsl(var(--border-color));
      padding-top: 20px;
    }

    .setting-info h4 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .setting-info p {
      font-size: 0.8rem;
      color: hsl(var(--text-secondary));
      max-width: 450px;
    }

    .warning-text {
      font-size: 0.8rem;
      color: hsl(var(--accent-danger));
      font-weight: 500;
      margin-bottom: 8px;
    }

    .theme-btn {
      white-space: nowrap;
    }

    @media (max-width: 576px) {
      .setting-item {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .setting-item button {
        width: 100%;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  protected readonly themeService = inject(ThemeService);

  username = signal('');
  userId = signal('');
  userInitial = signal('');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.username.set(user.username);
      this.userId.set(user.id);
      this.userInitial.set(user.username.slice(0, 2).toUpperCase());
    }
  }

  wipeTasks(): void {
    if (confirm('Are you sure you want to delete all your tasks? This cannot be undone.')) {
      const userTasks = this.taskService.tasks();
      let deleteCount = 0;
      
      if (userTasks.length === 0) {
        alert('No tasks to delete.');
        return;
      }

      userTasks.forEach(task => {
        if (task.id) {
          this.taskService.deleteTask(task.id).subscribe({
            next: () => {
              deleteCount++;
              if (deleteCount === userTasks.length) {
                alert('All tasks have been successfully wiped.');
              }
            }
          });
        }
      });
    }
  }

  clearCache(): void {
    if (confirm('This will log you out and reset browser configurations. Proceed?')) {
      localStorage.clear();
      window.location.reload();
    }
  }
}
