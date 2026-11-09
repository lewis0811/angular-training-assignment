import { Component, input } from '@angular/core';
import { DefaultJar } from '../../models/budget-plan.model';

@Component({
  selector: 'app-default-jar-list',
  standalone: true,
  template: `
    <ul class="jar-list" aria-label="Default jar allocations">
      @for (jar of jars(); track jar.jarType) {
        <li class="jar-row">
          <span class="jar-icon" aria-hidden="true">{{ jar.name.charAt(0) }}</span>
          <span class="jar-copy">
            <strong>{{ jar.name }}</strong>
            <small>{{ jar.suggestedLogic }}</small>
          </span>
          <span class="jar-rate">{{ jar.percentage }}%</span>
        </li>
      }
    </ul>
  `,
  styles: [`
    .jar-list { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
    .jar-row { display: flex; align-items: center; gap: 12px; padding: 13px 15px; border: 1px solid #e8ece5; border-radius: 14px; background: #fff; }
    .jar-icon { display: grid; width: 38px; height: 38px; flex: 0 0 38px; place-items: center; border-radius: 12px; background: #f0f5eb; color: #4b7f55; font-weight: 800; }
    .jar-copy { display: grid; min-width: 0; gap: 3px; flex: 1; }
    strong { color: #294338; font-size: 14px; }
    small { overflow: hidden; color: #7a867d; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .jar-rate { color: #2e6944; font-weight: 800; }
  `]
})
export class DefaultJarList {
  readonly jars = input.required<DefaultJar[]>();
}
