import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TranslatePipe, TranslateDirective} from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe, TranslateDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('cities-info-collection');
}
