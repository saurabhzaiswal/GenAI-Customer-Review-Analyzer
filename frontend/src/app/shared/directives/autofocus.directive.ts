import { Directive, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appAutofocus]',
})
export class AutofocusDirective implements AfterViewInit {
  constructor(private readonly element: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.element.nativeElement.focus();
  }
}
