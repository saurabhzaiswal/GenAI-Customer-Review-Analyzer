import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Feedback } from '../../models/feedback';
import { ReviewHistoryComponent } from './review-history.component';
import { provideTranslateService } from '@ngx-translate/core';

const reviews: Feedback[] = Array.from({ length: 6 }, (_, index) => ({
  id: `review-${index}`,
  review: index === 0 ? 'Delivery was very slow' : `Helpful product review ${index}`,
  label: index === 0 ? 'negative' : 'positive',
  score: index === 0 ? 2 : 5,
  theme: index === 0 ? 'delivery' : 'product',
  suggestion: 'Follow up with the customer.',
  confidence: 0.9,
  created_at: `2026-07-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
  updated_at: `2026-07-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
}));

describe('ReviewHistoryComponent', () => {
  let fixture: ComponentFixture<ReviewHistoryComponent>;
  let component: ReviewHistoryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewHistoryComponent],
      providers: [provideNoopAnimations(), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewHistoryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('savedReviews', reviews);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('attaches the paginator after asynchronous table creation', () => {
    expect(component.dataSource.paginator).toBeTruthy();
    expect(component.dataSource.paginator?.pageSize).toBe(5);
    expect(component.dataSource.paginator?.length).toBe(6);
  });

  it('paginates the mobile card data with the shared paginator', () => {
    const history = component as unknown as { mobilePageReviews: Feedback[] };
    expect(history.mobilePageReviews).toHaveLength(5);

    component.dataSource.paginator?.nextPage();
    fixture.detectChanges();

    expect(history.mobilePageReviews).toHaveLength(1);
    expect(history.mobilePageReviews[0].id).toBe('review-5');
  });

  it('combines keyword and sentiment filters', () => {
    const search = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    search.value = 'delivery';
    search.dispatchEvent(new Event('input'));

    component.sentimentControl.setValue('negative');
    (component as unknown as { applyFilters(): void }).applyFilters();
    fixture.detectChanges();

    expect(component.dataSource.filteredData).toHaveLength(1);
    expect(component.dataSource.filteredData[0].theme).toBe('delivery');
    expect(component.dataSource.paginator?.pageIndex).toBe(0);
  });
});
