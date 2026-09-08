import { Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { of } from 'rxjs';
import { RequestService } from '../../../core/services/request.service';
import { EmployeeRole } from '../../../store/employee-auth/employee-auth.state';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { AppErrorComponent } from '../../../shared/components/ui/app-error/app-error';
import { ModalService } from '../../../core/modal/modal.service';
import { FormModalComponent } from '../../../shared/components/ui/modal/form-modal/form-modal';
import { DynamicField } from '../../../core/models/form.model';
import { syncValidators } from '../../../shared/components/ui/form/validators.config';

interface AdminEmployee {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: EmployeeRole;
  created_at: string;
}

interface EmployeeFormValue {
  name: string;
  surname: string;
  email: string;
  password?: string | null;
  role: EmployeeRole;
}

const ROLES: EmployeeRole[] = ['support', 'moderator', 'admin', 'superadmin'];

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [SlicePipe, DataTableComponent, CardComponent, AppErrorComponent],
  templateUrl: './employee-management.html',
})
export class EmployeeManagementComponent implements OnInit {
  private request = inject(RequestService);
  private modal = inject(ModalService);

  employees = signal<AdminEmployee[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'created_at', label: 'Added' },
  ];

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.error.set(null);
    this.request.getRequest<AdminEmployee[]>('admin/employees').subscribe({
      next: (res) => {
        this.employees.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The employee list did not load.');
        this.loading.set(false);
      },
    });
  }

  /** The employee form is a field config, not markup — the same driver the dashboard's dialogs use. */
  private fields(row: AdminEmployee | null): DynamicField[] {
    return [
      { name: 'name', type: 'text', label: 'First name', size: 'half', value: row?.name ?? '', syncValidators: [syncValidators.required()] },
      { name: 'surname', type: 'text', label: 'Last name', size: 'half', value: row?.surname ?? '', syncValidators: [syncValidators.required()] },
      { name: 'email', type: 'email', label: 'Email', size: 'full', value: row?.email ?? '', syncValidators: [syncValidators.required(), syncValidators.email()] },
      {
        name: 'password', type: 'password', size: 'full',
        label: row ? 'Password (leave blank to keep)' : 'Password',
        placeholder: 'Min. 8 characters',
        value: '',
        syncValidators: row ? [] : [syncValidators.required(), syncValidators.minLength(8)],
      },
      {
        name: 'role', type: 'select', label: 'Role', size: 'half',
        value: row?.role ?? 'support',
        options: of(ROLES.map(r => ({ displayValue: r, returnValue: r }))),
        syncValidators: [syncValidators.required()],
      },
    ];
  }

  async openCreate(): Promise<void> {
    const result = await this.modal.open<EmployeeFormValue>(FormModalComponent, {
      type: 'center',
      data: { title: 'Add employee', fields: this.fields(null), submitLabel: 'Create', cancelLabel: 'Cancel' },
    });
    if (!result) return;
    this.request.postRequest('admin/employees', result).subscribe({
      next: () => this.loadEmployees(),
    });
  }

  async openEdit(emp: AdminEmployee): Promise<void> {
    const result = await this.modal.open<EmployeeFormValue>(FormModalComponent, {
      type: 'center',
      data: { title: 'Edit employee', fields: this.fields(emp), submitLabel: 'Save', cancelLabel: 'Cancel' },
    });
    if (!result) return;
    const data: Partial<EmployeeFormValue> = { ...result };
    if (!data.password) delete data.password;
    this.request.putRequest(`admin/employees/${emp.id}`, data).subscribe({
      next: () => this.loadEmployees(),
    });
  }

  async deleteEmployee(emp: AdminEmployee): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Remove this employee?',
      message: `${emp.name} ${emp.surname} loses access to the admin panel immediately.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!confirmed) return;
    this.request.deleteRequest(`admin/employees/${emp.id}`).subscribe({
      next: () => this.loadEmployees(),
    });
  }
}
