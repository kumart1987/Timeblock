import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiaryService, DiaryEntry } from '../../services/diary.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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
                (click)="loadEntryForDate(entry.date)"
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

      <!-- Main Editor Panel -->
      <main class="diary-main glass-panel" [class.readonly-mode]="isReadOnly()">
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
            
            @if (isReadOnly() && entryExists()) {
              <button class="btn btn-secondary" (click)="enableEdit()" aria-label="Edit diary entry">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span>Edit</span>
              </button>
            }
            
            @if (!isReadOnly()) {
              <button class="btn btn-primary" (click)="manualSave()" aria-label="Save diary entry">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>Save</span>
              </button>
              
              @if (entryExists()) {
                <button class="btn btn-secondary" (click)="cancelEdit()" aria-label="Cancel editing">
                  <span>Cancel</span>
                </button>
              }
            }
            
            @if (entryExists()) {
              <button class="btn btn-danger" (click)="deleteCurrentEntry()" aria-label="Delete diary entry">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                <span>Delete</span>
              </button>
            }
          </div>
        </header>

        <!-- Mood Selector Section -->
        <section class="mood-selector-wrapper">
          <label class="section-label">How was your day?</label>
          <div class="mood-options">
            @for (m of moods; track m.id) {
              <button 
                (click)="setMood(m.id)"
                [class.selected]="selectedMood() === m.id"
                [class]="'mood-btn mood-' + m.id"
                [disabled]="isReadOnly()"
                [attr.aria-label]="'Feel ' + m.label">
                <span class="mood-emoji">{{ m.emoji }}</span>
                <span class="mood-label">{{ m.label }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Editor Title & Content -->
        <section class="editor-section">
          <input 
            type="text" 
            placeholder="Give this day a title..." 
            [(ngModel)]="entryTitle" 
            (ngModelChange)="onContentChange()"
            [readonly]="isReadOnly()"
            class="diary-title-input">

          <div class="textarea-container">
            <textarea 
              placeholder="Start writing your story for today here... What did you accomplish? How did you feel?"
              [(ngModel)]="entryContent"
              (ngModelChange)="onContentChange()"
              [readonly]="isReadOnly()"
              class="diary-textarea"
              #editorTextarea></textarea>
            
            <div class="editor-footer">
              <span class="word-count">{{ wordCount() }} words</span>
              <div class="save-status">
                @if (isReadOnly()) {
                  <span class="readonly-indicator">
                    <span class="status-dot"></span> 🔒 Read-Only
                  </span>
                } @else {
                  @if (isSaving()) {
                    <span class="saving-indicator">
                      <span class="status-dot saving"></span> Saving...
                    </span>
                  } @else if (lastSavedTime()) {
                    <span class="saved-indicator">
                      <span class="status-dot saved"></span> Auto-saved {{ lastSavedTime() }}
                    </span>
                  } @else {
                    <span class="draft-indicator">
                      <span class="status-dot"></span> Unsaved changes
                    </span>
                  }
                }
              </div>
            </div>
          </div>
        </section>
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

    /* Mood selector */
    .mood-selector-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;
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
      padding: 10px 16px;
      border-radius: 12px;
      border: 1.5px solid hsl(var(--border-color));
      background-color: hsl(var(--bg-tertiary));
      color: hsl(var(--text-secondary));
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .mood-btn:hover {
      transform: translateY(-1px);
      border-color: hsl(var(--text-muted));
      color: hsl(var(--text-primary));
    }

    /* Mood specific glowing classes when selected */
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
      font-size: 1.1rem;
    }

    /* Editor inputs */
    .editor-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .diary-title-input {
      font-size: 1.5rem;
      font-weight: 700;
      font-family: var(--font-display);
      border: none;
      background: transparent;
      color: hsl(var(--text-primary));
      padding: 4px 0;
      border-bottom: 2px solid transparent;
      outline: none;
      transition: border-color var(--transition-fast);
      width: 100%;
    }

    .diary-title-input:focus {
      border-bottom-color: hsl(var(--border-color));
    }

    .textarea-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: hsl(var(--bg-tertiary));
      border: 1px solid hsl(var(--border-color));
      border-radius: 16px;
      padding: 20px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
      min-height: 250px;
    }

    .diary-textarea {
      flex: 1;
      border: none;
      background: transparent;
      color: hsl(var(--text-primary));
      font-family: var(--font-sans);
      font-size: 0.95rem;
      line-height: 1.6;
      resize: none;
      outline: none;
      width: 100%;
    }

    .editor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      border-top: 1px solid hsl(var(--border-light));
      padding-top: 12px;
    }

    .word-count {
      font-size: 0.8rem;
      color: hsl(var(--text-muted));
      font-weight: 500;
    }

    .save-status {
      font-size: 0.8rem;
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

    .saving-indicator {
      color: hsl(var(--text-secondary));
    }

    .saved-indicator {
      color: hsl(var(--accent-success));
    }

    .draft-indicator {
      color: hsl(var(--text-muted));
    }

    @keyframes pulse {
      from { opacity: 0.4; }
      to { opacity: 1; }
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .readonly-indicator {
      color: hsl(var(--text-muted));
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    /* Read-only editor styling */
    .readonly-mode .diary-title-input {
      border-bottom-color: transparent !important;
      cursor: default;
    }

    .readonly-mode .diary-textarea {
      cursor: default;
    }

    .readonly-mode .mood-btn {
      opacity: 0.6;
      cursor: default;
      pointer-events: none;
    }

    .readonly-mode .mood-btn.selected {
      opacity: 1;
      pointer-events: none;
    }
  `]
})
export class DiaryComponent implements OnInit {
  private readonly diaryService = inject(DiaryService);

  searchQuery = '';
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Form fields
  entryTitle = '';
  entryContent = '';
  selectedMood = signal<string>('');
  
  // Status states
  isSaving = signal<boolean>(false);
  lastSavedTime = signal<string>('');
  isReadOnly = signal<boolean>(true);

  // Computed properties
  entryExists = computed(() => {
    return this.diaryService.entries().some(e => e.date === this.selectedDate());
  });

  // Auto-saving subjects
  private autoSaveSubject = new Subject<void>();

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

  wordCount = computed(() => {
    const content = this.entryContent.trim();
    if (!content) return 0;
    return content.split(/\s+/).length;
  });

  ngOnInit(): void {
    this.diaryService.loadHistory();
    this.loadEntryForDate(this.selectedDate());

    // Configure auto-saving logic: debounces keyboard inputs for 1.5 seconds, then autosaves
    this.autoSaveSubject.pipe(
      debounceTime(1500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.triggerSave();
    });
  }

  loadEntryForDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
    this.diaryService.getEntry(dateStr).subscribe({
      next: (entry) => {
        if (entry) {
          this.entryTitle = entry.title;
          this.entryContent = entry.content;
          this.selectedMood.set(entry.mood);
          this.lastSavedTime.set(this.formatSavedTime(entry.updatedAt));
          this.isReadOnly.set(true); // Entry exists, view-only mode
        } else {
          this.entryTitle = '';
          this.entryContent = '';
          this.selectedMood.set('');
          this.lastSavedTime.set('');
          this.isReadOnly.set(false); // No entry exists, default to editing mode
        }
      },
      error: (err) => {
        console.error('Failed to load diary entry', err);
      }
    });
  }

  setMood(moodId: string): void {
    if (this.selectedMood() === moodId) {
      this.selectedMood.set(''); // toggle off
    } else {
      this.selectedMood.set(moodId);
    }
    this.onContentChange();
  }

  onContentChange(): void {
    // Notify the autosave subject on edit
    this.lastSavedTime.set(''); // remove saved status while editing
    this.autoSaveSubject.next();
  }

  triggerSave(): void {
    if (this.isReadOnly()) {
      return;
    }

    // Do not save completely empty entries
    if (!this.entryTitle.trim() && !this.entryContent.trim() && !this.selectedMood()) {
      return;
    }

    this.isSaving.set(true);
    const entryToSave: DiaryEntry = {
      date: this.selectedDate(),
      title: this.entryTitle.trim(),
      content: this.entryContent.trim(),
      mood: this.selectedMood()
    };

    this.diaryService.saveEntry(entryToSave).subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        this.lastSavedTime.set(this.formatSavedTime(saved.updatedAt));
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Auto-save failed', err);
      }
    });
  }

  adjustDate(days: number): void {
    this.triggerSave(); // Save any pending edits for current day first
    
    const [y, m, d] = this.selectedDate().split('-');
    const current = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    current.setDate(current.getDate() + days);

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');

    this.loadEntryForDate(`${year}-${month}-${day}`);
  }

  goToToday(): void {
    this.triggerSave();
    this.loadEntryForDate(new Date().toISOString().split('T')[0]);
  }

  enableEdit(): void {
    this.isReadOnly.set(false);
  }

  cancelEdit(): void {
    this.loadEntryForDate(this.selectedDate());
  }

  manualSave(): void {
    if (!this.entryTitle.trim() && !this.entryContent.trim() && !this.selectedMood()) {
      return;
    }

    this.isSaving.set(true);
    const entryToSave: DiaryEntry = {
      date: this.selectedDate(),
      title: this.entryTitle.trim(),
      content: this.entryContent.trim(),
      mood: this.selectedMood()
    };

    this.diaryService.saveEntry(entryToSave).subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        this.lastSavedTime.set(this.formatSavedTime(saved.updatedAt));
        this.isReadOnly.set(true); // Lock it upon successful manual save
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Save failed', err);
      }
    });
  }

  deleteCurrentEntry(): void {
    const date = this.selectedDate();
    if (!confirm(`Are you sure you want to delete the diary entry for ${this.formatDateReadable(date)}?`)) {
      return;
    }

    this.diaryService.deleteEntry(date).subscribe({
      next: () => {
        this.entryTitle = '';
        this.entryContent = '';
        this.selectedMood.set('');
        this.lastSavedTime.set('');
        this.isReadOnly.set(false); // Reset to edit mode as it is now empty
      },
      error: (err) => {
        console.error('Delete failed', err);
      }
    });
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
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  getMoodEmoji(moodId: string): string {
    const found = this.moods.find(m => m.id === moodId);
    return found ? found.emoji : '';
  }

  getMoodEmojiAndLabel(moodId: string): string {
    const found = this.moods.find(m => m.id === moodId);
    return found ? `${found.emoji} ${found.label}` : '';
  }

  getPreviewText(text: string): string {
    if (!text) return 'No story written yet...';
    return text;
  }
}
