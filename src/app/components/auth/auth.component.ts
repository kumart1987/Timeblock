import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-wrapper">
      <div class="background-decor bg-circle-1"></div>
      <div class="background-decor bg-circle-2"></div>
      
      <div class="glass-panel auth-card animate-slide-up">
        <div class="brand">
          <div class="brand-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2>TimeBlock</h2>
          <p>Optimize your daily schedule</p>
        </div>

        <div class="tabs">
          <button [class.active]="isLoginView()" (click)="toggleView(true)">Login</button>
          <button [class.active]="!isLoginView()" (click)="toggleView(false)">Sign Up</button>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger animate-fade">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (successMessage()) {
          <div class="alert alert-success animate-fade">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{{ successMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" #authForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <div class="input-with-icon">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                type="text" 
                id="username" 
                name="username" 
                class="input-control" 
                placeholder="Enter username" 
                required
                [(ngModel)]="username"
                #userModel="ngModel">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="input-with-icon">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="input-control" 
                placeholder="Enter password" 
                required
                [(ngModel)]="password">
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary submit-btn" 
            [disabled]="authForm.invalid || isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
            } @else {
              {{ isLoginView() ? 'Sign In' : 'Create Account' }}
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      background-color: hsl(var(--bg-primary));
      position: relative;
      overflow: hidden;
      padding: 20px;
    }
    .background-decor {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 0;
      opacity: 0.15;
    }
    .bg-circle-1 {
      width: 300px;
      height: 300px;
      background: hsl(var(--accent-primary));
      top: -50px;
      left: -50px;
    }
    .bg-circle-2 {
      width: 400px;
      height: 400px;
      background: hsl(var(--accent-purple));
      bottom: -100px;
      right: -100px;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 40px 30px;
      z-index: 1;
    }
    .brand {
      text-align: center;
      margin-bottom: 30px;
    }
    .brand-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background-color: rgba(37, 99, 235, 0.1);
      color: hsl(var(--accent-primary));
      border-radius: 12px;
      margin-bottom: 12px;
    }
    .brand-logo svg {
      width: 28px;
      height: 28px;
    }
    .brand h2 {
      font-size: 1.8rem;
      margin-bottom: 4px;
    }
    .brand p {
      color: hsl(var(--text-secondary));
      font-size: 0.9rem;
    }
    .tabs {
      display: flex;
      background-color: hsl(var(--bg-tertiary));
      padding: 4px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .tabs button {
      flex: 1;
      border: none;
      background: none;
      padding: 8px 16px;
      font-weight: 500;
      font-size: 0.9rem;
      color: hsl(var(--text-secondary));
      cursor: pointer;
      border-radius: 6px;
      transition: all var(--transition-fast);
    }
    .tabs button.active {
      background-color: hsl(var(--bg-secondary));
      color: hsl(var(--text-primary));
      box-shadow: var(--shadow-sm);
    }
    .input-with-icon {
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: hsl(var(--text-muted));
      pointer-events: none;
    }
    .input-with-icon .input-control {
      padding-left: 42px;
    }
    .submit-btn {
      width: 100%;
      margin-top: 10px;
      height: 46px;
    }
    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .alert-danger {
      background-color: rgba(239, 68, 68, 0.1);
      color: hsl(var(--accent-danger));
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .alert-success {
      background-color: rgba(16, 185, 129, 0.1);
      color: hsl(var(--accent-success));
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoginView = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  username = '';
  password = '';

  toggleView(isLogin: boolean): void {
    this.isLoginView.set(isLogin);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.username = '';
    this.password = '';
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage.set('Please fill out all fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const action$ = this.isLoginView() 
      ? this.authService.login(this.username, this.password)
      : this.authService.signup(this.username, this.password);

    action$.subscribe({
      next: (user) => {
        this.isLoading.set(false);
        if (this.isLoginView()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.successMessage.set('Account created successfully! Redirecting...');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Authentication failed. Please try again.');
      }
    });
  }
}
