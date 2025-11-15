import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  template: `
    <ng-content />
    @if (!disabled() && text()) {
      <span
        class="tooltip-panel group-hover:flex group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:flex group-focus-within:pointer-events-auto group-focus-within:opacity-100"
        [attr.data-side]="side()"
        role="tooltip"
        aria-hidden="true"
      >
        <span class="flex max-w-xs flex-col gap-0.5">
          <span class="font-medium text-primary">{{ text() }}</span>
          @if (description()) {
            <span class="text-[10px] font-normal text-muted">
              {{ description() }}
            </span>
          }
        </span>
      </span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent {
  readonly text = input.required<string>();
  readonly description = input<string | null | undefined>();
  readonly side = input<TooltipSide>('top');
  readonly block = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  @HostBinding('class.group') protected readonly hostGroup = true;
  @HostBinding('class.tooltip-trigger') protected readonly hostTrigger = true;
  @HostBinding('class.relative') protected readonly hostRelative = true;
  @HostBinding('class.max-w-full') protected readonly hostMaxWidth = true;

  @HostBinding('class.inline-flex')
  protected get hostInlineFlex(): boolean {
    return !this.block();
  }

  @HostBinding('class.block')
  protected get hostBlock(): boolean {
    return this.block();
  }
}
