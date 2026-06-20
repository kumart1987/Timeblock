import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiaryService, DiaryEntry } from '../../services/diary.service';

export interface ActiveEntryUI {
  id?: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  updatedAt?: string;
  isEditing: boolean;
  isSaving?: boolean;
  backup?: {
    title: string;
    content: string;
    mood: string;
  };
}

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="diary-container animate-slide-up">
      <!-- Sidebar - Memory Lane -->
      <aside class="diary-sidebar glass-panel">
        <div class="sidebar-header">
          <h3>Memory Lane 📖</h3>
          <div class="search-box">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search memories..." 
              [(ngModel)]="searchQuery" 
              class="search-input">
          </div>
        </div>

        <div class="history-list">
          @if (filteredHistory().length === 0) {
            <div class="empty-history">
              <p>No stories found.</p>
            </div>
          } @else {
            @for (entry of filteredHistory(); track entry.id) {
              <div 
                [class.active]="selectedDate() === entry.date"
                (click)="loadEntriesForDate(entry.date)"
                class="history-card">
                <div class="card-header-row">
                  <span class="entry-date">{{ formatDateShort(entry.date) }}</span>
                  @if (entry.mood) {
                    <span class="entry-mood" [class]="'mood-' + entry.mood">
                      {{ getMoodEmoji(entry.mood) }}
                    </span>
                  }
                </div>
                <h4 class="entry-title">{{ entry.title || 'Untitled Entry' }}</h4>
                <p class="entry-preview">{{ getPreviewText(entry.content) }}</p>
              </div>
            }
          }
        </div>
      </aside>

      <!-- Main Panel -->
      <main class="diary-main glass-panel">
        <!-- Date Selector Header -->
        <header class="diary-header">
          <div class="date-selector">
            <button class="nav-btn" (click)="adjustDate(-1)" aria-label="Previous Day">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2>{{ formatDateReadable(selectedDate()) }}</h2>
            <button class="nav-btn" (click)="adjustDate(1)" aria-label="Next Day">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="goToToday()">Today</button>
            <button class="btn btn-primary" (click)="addMemory()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Memory</span>
            </button>
          </div>
        </header>

        <!-- Memories List -->
        <div class="memories-list">
          @if (activeEntries().length === 0) {
            <div class="empty-memories glass-panel">
              <span class="empty-icon">✍️</span>
              <h3>No memories recorded for this day</h3>
              <p>Capture your thoughts, accomplishments, or feelings for this date.</p>
              <button class="btn btn-primary" (click)="addMemory()">Start Writing</button>
            </div>
          } @else {
            @for (entry of activeEntries(); track entry.id || $index) {
              <div class="memory-card glass-panel" [class.editing]="entry.isEditing">
                
                @if (entry.isEditing) {
                  <!-- Edit Mode -->
                  <div class="memory-edit-form">
                    <!-- Mood Selector -->
                    <div class="mood-selector-wrapper">
                      <label class="section-label">How was your day?</label>
                      <div class="mood-options">
                        @for (m of moods; track m.id) {
                          <button 
                            (click)="setCardMood(entry, m.id)"
                            [class.selected]="entry.mood === m.id"
                            [class]="'mood-btn mood-' + m.id"
                            [attr.aria-label]="'Feel ' + m.label">
                            <span class="mood-emoji">{{ m.emoji }}</span>
                            <span class="mood-label">{{ m.label }}</span>
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Title Input -->
                    <input 
                      type="text" 
                      placeholder="Give this memory a title..." 
                      [(ngModel)]="entry.title" 
                      class="diary-title-input">

                    <!-- Content Textarea -->
                    <div class="textarea-container">
                      <textarea 
                        placeholder="Write your story for today here... What did you accomplish? How did you feel?"
                        [(ngModel)]="entry.content"
                        class="diary-textarea"></textarea>
                      
                      <div class="card-edit-actions">
                        <span class="word-count">{{ getCardWordCount(entry.content) }} words</span>
                        <div class="btn-group">
                          <button class="btn btn-secondary btn-sm" (click)="cancelCardEdit(entry, $index)">Cancel</button>
                          <button class="btn btn-primary btn-sm" [disabled]="entry.isSaving" (click)="saveCardEntry(entry)">
                            {{ entry.isSaving ? 'Saving...' : 'Save' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                } @else {
                  <!-- View Mode -->
                  <div class="memory-view-content">
                    <div class="card-header-row">
                      <div class="title-mood-row">
                        <h3 class="memory-card-title">{{ entry.title || 'Untitled Memory' }}</h3>
                        @if (entry.mood) {
                          <span class="mood-badge" [class]="'mood-' + entry.mood">
                            {{ getMoodEmoji(entry.mood) }} {{ getMoodLabel(entry.mood) }}
                          </span>
                        }
                      </div>
                      @if (entry.updatedAt) {
                        <span class="updated-time">
                          Saved {{ formatSavedTime(entry.updatedAt) }}
                        </span>
                      }
                    </div>

                    <p class="memory-card-body">{{ entry.content || 'No description written...' }}</p>

                    <div class="card-view-actions">
                      <button class="btn btn-secondary btn-sm" (click)="enableCardEdit(entry)" aria-label="Edit memory">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button class="btn btn-danger-link btn-sm" (click)="deleteCardEntry(entry, $index)" aria-label="Delete memory">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                }

              </div>
            }
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .diary-container {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
      height: calc(100vh - 130px);
      width: 100%;
    }

    @media (max-width: 992px) {
      .diary-container {
        grid-template-columns: 1fr;
        height: auto;
      }
      .diary-sidebar {
        height: 300px;
      }
    }

    /* Sidebar styles */
    .diary-sidebar {
      background-color: hsl(var(--bg-secondary));
      display: flex;
      flex-direction: column;
      padding: 24px;
      height: 100%;
      overflow: hidden;
    }

    .sidebar-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .sidebar-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .search-box {
      display: flex;
      align-items: center;
      padding: 8px 14px;
      background-color: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-color));
      border-radius: 10px;
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
      font-size: 0.85rem;
    }

    .search-input:focus {
      outline: none;
    }

    .history-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-right: 4px;
    }

    .empty-history {
      text-align: center;
      padding: 40px 10px;
      color: hsl(var(--text-muted));
      font-size: 0.9rem;
    }

    .history-card {
      background-color: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-light));
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all var(--transition-fast);
    }

    .history-card:hover {
      border-color: hsl(var(--border-color));
      transform: translateY(-2px);
    }

    .history-card.active {
      border-color: hsl(var(--accent-primary));
      background-color: rgba(37, 99, 235, 0.05);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.05);
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .entry-date {
      font-size: 0.75rem;
      font-weight: 600;
      color: hsl(var(--text-muted));
    }

    .entry-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: hsl(var(--text-primary));
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .entry-preview {
      font-size: 0.8rem;
      color: hsl(var(--text-secondary));
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Main Panel styles */
    .diary-main {
      background-color: hsl(var(--bg-secondary));
      display: flex;
      flex-direction: column;
      padding: 28px;
      height: 100%;
      gap: 24px;
      overflow-y: auto;
    }

    .diary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid hsl(var(--border-color));
      padding-bottom: 20px;
    }

    .date-selector {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .date-selector h2 {
      font-size: 1.35rem;
      min-width: 250px;
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

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    /* Memories List */
    .memories-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .memory-card {
      background-color: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-light));
      border-radius: 16px;
      padding: 24px;
      transition: all var(--transition-normal);
    }

    .memory-card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border-color: hsl(var(--border-color));
    }

    .memory-card.editing {
      border-color: hsl(var(--accent-primary));
      background-color: rgba(37, 99, 235, 0.02);
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.05);
    }

    .memory-view-content {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .title-mood-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .memory-card-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: hsl(var(--text-primary));
      margin: 0;
    }

    .mood-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid hsl(var(--border-color));
    }

    .mood-badge.mood-happy {
      background-color: rgba(234, 179, 8, 0.06);
      color: #eab308;
      border-color: rgba(234, 179, 8, 0.2);
    }
    .mood-badge.mood-productive {
      background-color: rgba(16, 185, 129, 0.06);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.2);
    }
    .mood-badge.mood-tired {
      background-color: rgba(139, 92, 246, 0.06);
      color: #8b5cf6;
      border-color: rgba(139, 92, 246, 0.2);
    }
    .mood-badge.mood-calm {
      background-color: rgba(20, 184, 166, 0.06);
      color: #20b8a6;
      border-color: rgba(20, 184, 166, 0.2);
    }
    .mood-badge.mood-sad {
      background-color: rgba(59, 130, 246, 0.06);
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.2);
    }

    .updated-time {
      font-size: 0.75rem;
      color: hsl(var(--text-muted));
    }

    .memory-card-body {
      font-size: 0.95rem;
      line-height: 1.6;
      color: hsl(var(--text-secondary));
      white-space: pre-wrap;
      margin: 0;
    }

    .card-view-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 10px;
      border-top: 1px solid hsl(var(--border-light));
      padding-top: 12px;
    }

    .card-edit-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
    }

    .btn-group {
      display: flex;
      gap: 8px;
    }

    .btn-sm {
      padding: 6px 12px !important;
      font-size: 0.8rem !important;
      border-radius: 8px !important;
    }

    .btn-danger-link {
      background: transparent;
      color: hsl(var(--accent-danger));
      border: 1.5px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-fast);
    }

    .btn-danger-link:hover {
      background-color: rgba(239, 68, 68, 0.06);
      border-color: rgba(239, 68, 68, 0.15);
      border-radius: 8px;
    }

    .empty-memories {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      border: 1.5px dashed hsl(var(--border-color));
      border-radius: 20px;
      background: transparent;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 16px;
    }

    .empty-memories h3 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .empty-memories p {
      font-size: 0.85rem;
      color: hsl(var(--text-muted));
      margin-bottom: 20px;
      max-width: 320px;
    }

    /* Mood selector */
    .mood-selector-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: hsl(var(--text-secondary));
      letter-spacing: 0.02em;
    }

    .mood-options {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .mood-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 10px;
      border: 1.5px solid hsl(var(--border-color));
      background-color: hsl(var(--bg-secondary));
      color: hsl(var(--text-secondary));
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .mood-btn:hover {
      transform: translateY(-1px);
      border-color: hsl(var(--text-muted));
      color: hsl(var(--text-primary));
    }

    .mood-happy.selected {
      background-color: rgba(234, 179, 8, 0.08) !important;
      border-color: #eab308 !important;
      color: #eab308 !important;
      box-shadow: 0 0 12px rgba(234, 179, 8, 0.15);
    }
    .mood-productive.selected {
      background-color: rgba(16, 185, 129, 0.08) !important;
      border-color: #10b981 !important;
      color: #10b981 !important;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
    }
    .mood-tired.selected {
      background-color: rgba(139, 92, 246, 0.08) !important;
      border-color: #8b5cf6 !important;
      color: #8b5cf6 !important;
      box-shadow: 0 0 12px rgba(139, 92, 246, 0.15);
    }
    .mood-calm.selected {
      background-color: rgba(20, 184, 166, 0.08) !important;
      border-color: #20b8a6 !important;
      color: #20b8a6 !important;
      box-shadow: 0 0 12px rgba(20, 184, 166, 0.15);
    }
    .mood-sad.selected {
      background-color: rgba(59, 130, 246, 0.08) !important;
      border-color: #3b82f6 !important;
      color: #3b82f6 !important;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
    }

    .mood-emoji {
      font-size: 1.05rem;
    }

    /* Editor inputs */
    .diary-title-input {
      font-size: 1.35rem;
      font-weight: 700;
      font-family: var(--font-display);
      border: none;
      background: transparent;
      color: hsl(var(--text-primary));
      padding: 6px 0;
      border-bottom: 2px solid hsl(var(--border-color));
      outline: none;
      transition: border-color var(--transition-fast);
      width: 100%;
      margin-bottom: 16px;
    }

    .diary-title-input:focus {
      border-bottom-color: hsl(var(--accent-primary));
    }

    .textarea-container {
      display: flex;
      flex-direction: column;
      background-color: hsl(var(--bg-secondary));
      border: 1px solid hsl(var(--border-color));
      border-radius: 12px;
      padding: 16px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .diary-textarea {
      border: none;
      background: transparent;
      color: hsl(var(--text-primary));
      font-family: var(--font-sans);
      font-size: 0.95rem;
      line-height: 1.6;
      resize: vertical;
      min-height: 150px;
      outline: none;
      width: 100%;
    }

    .word-count {
      font-size: 0.8rem;
      color: hsl(var(--text-muted));
      font-weight: 500;
    }

    .status-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: hsl(var(--text-muted));
      margin-right: 6px;
      vertical-align: middle;
    }

    .status-dot.saving {
      background-color: hsl(var(--accent-warning));
      animation: pulse 1s infinite alternate;
    }

    .status-dot.saved {
      background-color: hsl(var(--accent-success));
    }
  `]
})
export class DiaryComponent implements OnInit {
  private readonly diaryService = inject(DiaryService);

  searchQuery = '';
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Form entries for UI list
  activeEntries = signal<ActiveEntryUI[]>([]);

  moods = [
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'productive', emoji: '🚀', label: 'Productive' },
    { id: 'calm', emoji: '🧘', label: 'Calm' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'sad', emoji: '😔', label: 'Sad' }
  ];

  // History entries sorted
  history = this.diaryService.entries;

  filteredHistory = computed(() => {
    const list = this.history();
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return list;
    return list.filter(entry => 
      entry.title.toLowerCase().includes(query) || 
      entry.content.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.diaryService.loadHistory();
    this.loadEntriesForDate(this.selectedDate());
  }

  loadEntriesForDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
    this.diaryService.getEntriesForDate(dateStr).subscribe({
      next: (entries) => {
        this.activeEntries.set(
          entries.map(e => ({
            id: e.id,
            date: e.date,
            title: e.title,
            content: e.content,
            mood: e.mood,
            updatedAt: e.updatedAt,
            isEditing: false
          }))
        );
      },
      error: (err) => {
        console.error('Failed to load diary entries', err);
      }
    });
  }

  addMemory(): void {
    const newEntry: ActiveEntryUI = {
      date: this.selectedDate(),
      title: '',
      content: '',
      mood: '',
      isEditing: true
    };
    this.activeEntries.update(entries => [...entries, newEntry]);
  }

  setCardMood(entry: ActiveEntryUI, moodId: string): void {
    if (entry.mood === moodId) {
      entry.mood = ''; // toggle off
    } else {
      entry.mood = moodId;
    }
  }

  getCardWordCount(text: string): number {
    const content = (text || '').trim();
    if (!content) return 0;
    return content.split(/\s+/).length;
  }

  enableCardEdit(entry: ActiveEntryUI): void {
    entry.backup = {
      title: entry.title,
      content: entry.content,
      mood: entry.mood
    };
    entry.isEditing = true;
  }

  cancelCardEdit(entry: ActiveEntryUI, index: number): void {
    if (!entry.id) {
      // It's a new unsaved entry, remove it
      this.activeEntries.update(entries => entries.filter((_, idx) => idx !== index));
    } else {
      // Revert from backup
      if (entry.backup) {
        entry.title = entry.backup.title;
        entry.content = entry.backup.content;
        entry.mood = entry.backup.mood;
      }
      entry.isEditing = false;
    }
  }

  saveCardEntry(entry: ActiveEntryUI): void {
    if (!entry.title.trim() && !entry.content.trim() && !entry.mood) {
      alert('Please fill out at least one field (title, mood, or content) before saving.');
      return;
    }

    entry.isSaving = true;
    const entryToSave: DiaryEntry = {
      id: entry.id,
      date: entry.date,
      title: entry.title.trim(),
      content: entry.content.trim(),
      mood: entry.mood
    };

    this.diaryService.saveEntry(entryToSave).subscribe({
      next: (saved) => {
        entry.isSaving = false;
        entry.id = saved.id;
        entry.updatedAt = saved.updatedAt;
        entry.isEditing = false;
        // Reload history sidebar list
        this.diaryService.loadHistory();
      },
      error: (err) => {
        entry.isSaving = false;
        console.error('Save failed', err);
        alert('Failed to save memory. Please try again.');
      }
    });
  }

  deleteCardEntry(entry: ActiveEntryUI, index: number): void {
    if (!entry.id) {
      // Unsaved new memory, just remove from screen
      this.activeEntries.update(entries => entries.filter((_, idx) => idx !== index));
      return;
    }

    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    this.diaryService.deleteEntry(entry.id).subscribe({
      next: () => {
        this.activeEntries.update(entries => entries.filter((_, idx) => idx !== index));
      },
      error: (err) => {
        console.error('Delete failed', err);
        alert('Failed to delete memory.');
      }
    });
  }

  adjustDate(days: number): void {
    // Check if there are unsaved new memories
    const unsaved = this.activeEntries().some(e => e.isEditing && !e.id);
    if (unsaved && !confirm('You have unsaved memories. Are you sure you want to change dates? Unsaved cards will be lost.')) {
      return;
    }

    const [y, m, d] = this.selectedDate().split('-');
    const current = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    current.setDate(current.getDate() + days);

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');

    this.loadEntriesForDate(`${year}-${month}-${day}`);
  }

  goToToday(): void {
    // Check if there are unsaved new memories
    const unsaved = this.activeEntries().some(e => e.isEditing && !e.id);
    if (unsaved && !confirm('You have unsaved memories. Are you sure you want to change dates? Unsaved cards will be lost.')) {
      return;
    }
    this.loadEntriesForDate(new Date().toISOString().split('T')[0]);
  }

  // Formatting helpers
  formatDateReadable(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatSavedTime(timeStr?: string): string {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  getMoodEmoji(moodId: string): string {
    const found = this.moods.find(m => m.id === moodId);
    return found ? found.emoji : '';
  }

  getMoodLabel(moodId: string): string {
    const found = this.moods.find(m => m.id === moodId);
    return found ? found.label : '';
  }

  getPreviewText(text: string): string {
    if (!text) return 'No story written yet...';
    return text;
  }
}
