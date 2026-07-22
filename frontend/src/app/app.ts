import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from '@app/core/services/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  constructor(_seo: SeoService) {}
}
