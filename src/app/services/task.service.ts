import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Task {
  id?: string;
  userId?: string;
  title: string;
  description: string;
  timeBlock: string; // "HH:MM"
  duration?: number; // Duration in hours
  priority: 'high' | 'medium' | 'low';
  date: string; // "YYYY-MM-DD"
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  tasks = signal<Task[]>([]);

  private getHeaders(): HttpHeaders {
    const user = this.authService.currentUser();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user ? user.id : ''
    });
  }

  loadTasks(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.tasks.set([]);
      return;
    }
    
    this.http.get<Task[]>('/api/tasks', { headers: this.getHeaders() }).subscribe({
      next: (loadedTasks) => {
        this.tasks.set(loadedTasks);
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
      }
    });
  }

  saveTask(task: Task): Observable<Task> {
    return this.http.post<Task>('/api/tasks', task, { headers: this.getHeaders() }).pipe(
      tap(() => this.loadTasks()) // Reload local signals list
    );
  }

  deleteTask(taskId: string): Observable<any> {
    return this.http.delete<any>(`/api/tasks/${taskId}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.loadTasks())
    );
  }
}
