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
        data: {
          seo: {
            title: 'AI Customer Review Analyzer | Sentiment, Themes & Insights',
            description: 'Analyze customer reviews with AI-powered sentiment scores, themes, recommendations, saved history, and actionable dashboard insights.',
            image: '/img/main.png',
            imageWidth: '1217',
            imageHeight: '866',
            imageAlt: 'GenAI Customer Review Analyzer landing page',
          },
        },
        loadComponent: () => import('./features/reviews/pages/review-page/review-page.component').then((m) => m.ReviewPageComponent),
      },
      {
        path: 'dashboard',
        data: {
          seo: {
            title: 'Customer Intelligence Dashboard | GenAI Review Analyzer',
            description: 'Explore customer sentiment, recurring themes, review trends, saved feedback, and actionable AI-powered customer intelligence.',
            image: '/img/dashboard.png',
            imageWidth: '1398',
            imageHeight: '861',
            imageAlt: 'GenAI Customer Review Analyzer intelligence dashboard',
          },
        },
        loadComponent: () => import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
