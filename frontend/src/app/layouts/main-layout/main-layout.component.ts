import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@app/layouts/navbar/navbar.component';
import { FooterComponent } from '@app/layouts/footer/footer.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '@app/core/services/loading.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, MatProgressBarModule, TranslatePipe],
})
export class MainLayoutComponent {
  protected readonly loadingService = inject(LoadingService);
}
