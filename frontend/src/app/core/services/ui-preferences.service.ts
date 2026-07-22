import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface AppLanguage { code: string; label: string; nativeLabel: string; }

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  readonly languages: AppLanguage[] = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
    { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
    { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
    { code: 'fr', label: 'French', nativeLabel: 'Français' },
    { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  ];

  readonly darkMode = signal(false);
  readonly language = signal('en');
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(this.languages.map(({ code }) => code));
    const savedLanguage = localStorage.getItem('app-language');
    const browserLanguage = navigator.language.split('-')[0];
    this.setLanguage(this.languages.some(({ code }) => code === savedLanguage) ? savedLanguage! :
      this.languages.some(({ code }) => code === browserLanguage) ? browserLanguage : 'en');

    const savedTheme = localStorage.getItem('app-theme');
    this.setDarkMode(savedTheme ? savedTheme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  }

  setLanguage(language: string): void {
    if (!this.languages.some(({ code }) => code === language)) return;
    this.language.set(language);
    this.translate.use(language);
    this.document.documentElement.lang = language;
    localStorage.setItem('app-language', language);
  }

  toggleDarkMode(): void { this.setDarkMode(!this.darkMode()); }

  private setDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
    this.document.documentElement.classList.toggle('dark-theme', enabled);
    localStorage.setItem('app-theme', enabled ? 'dark' : 'light');
  }
}
