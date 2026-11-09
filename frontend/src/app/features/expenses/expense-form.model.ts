import { FormControl, FormGroup } from '@angular/forms';
import { JarType } from '../../models/budget-plan.model';

export type ExpenseFormGroup = FormGroup<{
  expenseDate: FormControl<string>;
  jarType: FormControl<JarType | null>;
  amountVnd: FormControl<string>;
  description: FormControl<string>;
}>;
