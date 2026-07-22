import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'dayjsFormat',
  standalone: true,
  pure: false,
})
export class DayjsFormatPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';

    return new Intl.DateTimeFormat(this.translate.currentLang() || 'en', {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(parsed);
  }
}
