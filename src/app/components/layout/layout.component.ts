import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { TaskService } from '../../services/task.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="layout-container">
      <!-- Mobile Sidebar Toggle Overlay -->
      @if (mobileSidebarOpen()) {
        <div class="sidebar-overlay" (click)="toggleMobileSidebar()"></div>
      }

      <!-- Sidebar -->
      <aside class="sidebar-panel glass-panel" [class.open]="mobileSidebarOpen()">
        <div class="sidebar-brand">
          <div class="logo-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="8" y="8" width="84" height="84" rx="20" fill="currentColor" fill-opacity="0.05" />
              <path d="M28 28v44M48 28L30 48l18 24" />
              <path d="M56 28h24M68 28v44" />
              <circle cx="78" cy="72" r="10" stroke="currentColor" stroke-width="6" fill="none" />
              <path d="M78 68v4h4" stroke="currentColor" stroke-width="5" />
            </svg>
          </div>
          <div class="brand-text">
            <h2>TimeBlock</h2>
            <span>Enterprise</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMobileSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/calendar" routerLinkActive="active" (click)="closeMobileSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Calendar</span>
          </a>

          <a routerLink="/planner" routerLinkActive="active" (click)="closeMobileSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Planner</span>
          </a>

          <a routerLink="/analytics" routerLinkActive="active" (click)="closeMobileSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Analytics</span>
          </a>

          <a routerLink="/reminders" routerLinkActive="active" (click)="closeMobileSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>Reminders</span>
          </a>

          <a routerLink="/settings" routerLinkActive="active" (click)="closeMobileSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="avatar">
              {{ userInitial() }}
            </div>
            <div class="user-info">
              <h4>{{ username() }}</h4>
              <span>Local Workspace</span>
            </div>
          </div>
          
          <button class="logout-btn" (click)="onLogout()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Workspace -->
      <div class="main-workspace">
        <header class="header-panel glass-panel">
          <div class="header-left">
            <button class="hamburger-btn" (click)="toggleMobileSidebar()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div class="welcome-badge">
              <h1>Welcome Back 👋</h1>
            </div>
          </div>

          <div class="header-right">
            <!-- Theme Toggle Switch -->
            <button class="theme-toggle" (click)="themeService.toggleTheme()" [attr.aria-label]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              @if (themeService.isDarkMode()) {
                <!-- Sun Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              } @else {
                <!-- Moon Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              }
            </button>
          </div>
        </header>

        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      overflow-x: hidden;
      background-color: hsl(var(--bg-primary));
    }
    
    /* Sidebar styling */
    .sidebar-panel {
      width: var(--sidebar-width);
      min-height: calc(100vh - 40px);
      margin: 20px 0 20px 20px;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      padding: 30px 20px;
      border-radius: 20px;
      background: hsl(var(--bg-secondary));
    }
    
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 40px;
    }
    
    .logo-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      background-color: rgba(37, 99, 235, 0.1);
      color: hsl(var(--accent-primary));
      border-radius: 10px;
    }
    
    .logo-box svg {
      width: 22px;
      height: 22px;
    }
    
    .brand-text h2 {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.1;
    }
    
    .brand-text span {
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 500;
      color: hsl(var(--text-secondary));
      transition: all var(--transition-fast);
    }
    
    .sidebar-nav a svg {
      color: hsl(var(--text-muted));
      transition: color var(--transition-fast);
    }
    
    .sidebar-nav a:hover {
      background-color: hsl(var(--bg-tertiary));
      color: hsl(var(--text-primary));
    }
    
    .sidebar-nav a:hover svg {
      color: hsl(var(--text-primary));
    }
    
    .sidebar-nav a.active {
      background-color: hsl(var(--accent-primary));
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
    
    .sidebar-nav a.active svg {
      color: #ffffff;
    }
    
    .sidebar-footer {
      border-top: 1px solid hsl(var(--border-color));
      padding-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background-color: rgba(37, 99, 235, 0.1);
      color: hsl(var(--accent-primary));
      font-family: var(--font-display);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .user-info h4 {
      font-size: 0.9rem;
      font-weight: 600;
      line-height: 1.2;
    }
    
    .user-info span {
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      width: 100%;
      border-radius: 8px;
      border: 1px solid hsl(var(--border-color));
      background: transparent;
      color: hsl(var(--text-secondary));
      cursor: pointer;
      font-weight: 500;
      font-size: 0.85rem;
      transition: all var(--transition-fast);
    }
    
    .logout-btn:hover {
      background-color: rgba(239, 68, 68, 0.08);
      color: hsl(var(--accent-danger));
      border-color: rgba(239, 68, 68, 0.2);
    }
    
    /* Main Workspace */
    .main-workspace {
      flex: 1;
      margin-left: calc(var(--sidebar-width) + 20px);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 100vh;
    }
    
    .header-panel {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      background: hsl(var(--bg-secondary));
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .hamburger-btn {
      display: none;
      background: none;
      border: none;
      color: hsl(var(--text-primary));
      cursor: pointer;
    }
    
    .welcome-badge h1 {
      font-size: 1.4rem;
      font-weight: 700;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background-color: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-color));
      color: hsl(var(--text-primary));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    
    .theme-toggle:hover {
      background-color: hsl(var(--border-color));
      transform: scale(1.05);
    }
    
    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    /* Mobile Overlay and Responsiveness */
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 99;
    }
    
    @media (max-width: 992px) {
      .sidebar-panel {
        position: fixed;
        left: -300px;
        top: 0;
        bottom: 0;
        margin: 0;
        height: 100vh;
        border-radius: 0;
        transition: left var(--transition-normal);
        box-shadow: var(--shadow-lg);
      }
      .sidebar-panel.open {
        left: 0;
      }
      .sidebar-overlay {
        display: block;
      }
      .main-workspace {
        margin-left: 0;
        padding: 16px;
      }
      .hamburger-btn {
        display: block;
      }
      .welcome-badge h1 {
        font-size: 1.15rem;
      }
    }
  `]
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  mobileSidebarOpen = signal<boolean>(false);

  username = () => this.authService.currentUser()?.username || 'User';

  userInitial = () => {
    const name = this.username();
    return name.slice(0, 2).toUpperCase();
  };

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(open => !open);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
