import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface DiaryEntry {
  id?: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiaryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  entries = signal<DiaryEntry[]>([]);

  private getHeaders(): HttpHeaders {
    const user = this.authService.currentUser();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user ? user.id : ''
    });
  }

  getEntriesForDate(date: string): Observable<DiaryEntry[]> {
    return this.http.get<DiaryEntry[]>(`/api/diary?date=${date}`, { headers: this.getHeaders() });
  }

  saveEntry(entry: DiaryEntry): Observable<DiaryEntry> {
    return this.http.post<DiaryEntry>('/api/diary', entry, { headers: this.getHeaders() }).pipe(
      tap(() => this.loadHistory())
    );
  }

  deleteEntry(id: string): Observable<any> {
    return this.http.delete<any>(`/api/diary/${id}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.loadHistory())
    );
  }

  loadHistory(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.entries.set([]);
      return;
    }

    this.http.get<DiaryEntry[]>('/api/diary/history', { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.entries.set(data);
      },
      error: (err) => {
        console.error('Failed to load diary history', err);
      }
    });
  }
}
