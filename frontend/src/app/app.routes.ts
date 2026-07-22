import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/reviews/pages/review-page/review-page.component').then((m) => m.ReviewPageComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
