import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'dayjsFormat',
  standalone: true,
})
export class DayjsFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format = 'MMM D, YYYY h:mm A'): string {
    if (!value) {
      return '-';
    }

    const parsed = dayjs(value);

    return parsed.isValid() ? parsed.format(format) : '-';
  }
}
