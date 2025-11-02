import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellLayoutComponent } from './layouts/shell.layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend-angular-barrow-hub');
}
