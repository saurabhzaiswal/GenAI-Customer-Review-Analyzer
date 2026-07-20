import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, length = 120): string {
    return value && value.length > length ? `${value.slice(0, length).trim()}…` : value;
  }
}
