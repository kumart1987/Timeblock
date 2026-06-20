import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly USER_KEY = 'timeblock-user';

  currentUser = signal<User | null>(null);

  constructor() {
    this.checkSession();
  }

  signup(username: string, password: string): Observable<User> {
    return this.http.post<User>('/api/auth/signup', { username, password }).pipe(
      tap(user => this.setSession(user))
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>('/api/auth/login', { username, password }).pipe(
      tap(user => this.setSession(user))
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }

  private checkSession(): void {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(this.USER_KEY);
      if (savedUser) {
        try {
          this.currentUser.set(JSON.parse(savedUser));
        } catch {
          this.currentUser.set(null);
        }
      }
    }
  }

  private setSession(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUser.set(user);
  }
}
