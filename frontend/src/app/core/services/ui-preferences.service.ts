import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface AppLanguage { code: string; displayCode: string; label: string; nativeLabel: string; }

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  readonly languages: AppLanguage[] = [
    { code: 'en', displayCode: 'EN', label: 'English', nativeLabel: 'English' },
    { code: 'hi', displayCode: 'HI', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'ja', displayCode: 'JA', label: 'Japanese', nativeLabel: '日本語' },
    { code: 'nl', displayCode: 'NL', label: 'Dutch', nativeLabel: 'Nederlands' },
    { code: 'ko', displayCode: 'KO', label: 'Korean', nativeLabel: '한국어' },
    { code: 'fr', displayCode: 'FR', label: 'French', nativeLabel: 'Français' },
    { code: 'de', displayCode: 'DE', label: 'German', nativeLabel: 'Deutsch' },
    { code: 'es', displayCode: 'ES', label: 'Spanish', nativeLabel: 'Español' },
  ];

  readonly darkMode = signal(false);
  readonly language = signal('en');
  readonly currentLanguage = computed(
    () => this.languages.find(({ code }) => code === this.language()) ?? this.languages[0],
  );
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(this.languages.map(({ code }) => code));
    if (!this.isBrowser) return;

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
    if (this.isBrowser) localStorage.setItem('app-language', language);
  }

  toggleDarkMode(): void { this.setDarkMode(!this.darkMode()); }

  private setDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
    this.document.documentElement.classList.toggle('dark-theme', enabled);
    if (this.isBrowser) localStorage.setItem('app-theme', enabled ? 'dark' : 'light');
  }
}
