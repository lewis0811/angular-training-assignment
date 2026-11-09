import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { JAR_TYPES } from '../../models/budget-plan.model';
import { DefaultJarList } from './default-jar-list';

describe('DefaultJarList', () => {
  it('renders every read-only jar with its rate and guidance', async () => {
    await TestBed.configureTestingModule({ imports: [DefaultJarList] }).compileComponents();
    const fixture = TestBed.createComponent(DefaultJarList);
    fixture.componentRef.setInput('jars', JAR_TYPES.map((jarType, index) => ({
      jarType,
      name: jarType,
      percentage: [35, 20, 10, 10, 10, 10, 5][index]!,
      suggestedLogic: `Guidance for ${jarType}`
    })));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.jar-row')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('35%');
    expect(fixture.nativeElement.textContent).toContain('Guidance for food');
  });
});
