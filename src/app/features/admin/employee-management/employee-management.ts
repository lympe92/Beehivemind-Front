import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { RequestService } from '../../../core/services/request.service';
import { EmployeeRole } from '../../../store/employee-auth/employee-auth.state';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';

interface AdminEmployee {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: EmployeeRole;
  created_at: string;
}

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [FormsModule, SlicePipe, DataTableComponent],
  templateUrl: './employee-management.html',
  styleUrl: './employee-management.scss',
})
export class EmployeeManagementComponent implements OnInit {
  private request = inject(RequestService);

  employees = signal<AdminEmployee[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  showForm = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  editingId = signal<number | null>(null);

  form = {
    name: '',
    surname: '',
    email: '',
    password: '',
    role: 'support' as EmployeeRole,
  };

  roles: EmployeeRole[] = ['support', 'moderator', 'admin', 'superadmin'];

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'created_at', label: 'Joined' },
  ];

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.request.getRequest<{ data: AdminEmployee[] }>('admin/employees').subscribe({
      next: (res) => {
        this.employees.set(res.data.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load employees');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.form = { name: '', surname: '', email: '', password: '', role: 'support' };
    this.formMode.set('create');
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(emp: AdminEmployee): void {
    this.form = { name: emp.name, surname: emp.surname, email: emp.email, password: '', role: emp.role };
    this.formMode.set('edit');
    this.editingId.set(emp.id);
    this.showForm.set(true);
  }

  submitForm(): void {
    if (this.formMode() === 'create') {
      this.request.postRequest('admin/employees', this.form).subscribe({
        next: () => { this.showForm.set(false); this.loadEmployees(); },
      });
    } else {
      const id = this.editingId();
      const data: Partial<typeof this.form> = { ...this.form };
      if (!data.password) delete data.password;
      this.request.putRequest(`admin/employees/${id}`, data).subscribe({
        next: () => { this.showForm.set(false); this.loadEmployees(); },
      });
    }
  }

  deleteEmployee(id: number): void {
    if (!confirm('Delete this employee?')) return;
    this.request.deleteRequest(`admin/employees/${id}`).subscribe({
      next: () => this.loadEmployees(),
    });
  }
}
