import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndFormat',
  standalone: true
})
export class VndFormatPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

  transform(value: string | null | undefined): string {
    if (!value || !/^-?\d+$/.test(value)) {
      return value ?? '';
    }

    return this.formatter.format(BigInt(value));
  }
}
