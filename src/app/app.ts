import { Component, signal, inject } from '@angular/core';
import { ShellLayoutComponent } from './layouts/shell.layout';
import { ThemeService } from './shared/services/theme.service';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-root',
  imports: [ ShellLayoutComponent,MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend-angular-barrow-hub');
  // Instantiate theme service once at the root to keep theme in sync across the app
  private readonly themeService = inject(ThemeService);
}
