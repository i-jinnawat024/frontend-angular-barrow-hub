import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';

@Pipe({
  name: 'thaiDate',
  standalone: true,
})
export class ThaiDatePipe implements PipeTransform {
  transform(
    value: Date | string | number | null | undefined,
    format: string = 'medium',
    timezone?: string,
    locale: string = 'th',
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return formatDate(date, format, locale || 'th', timezone);
  }
}
