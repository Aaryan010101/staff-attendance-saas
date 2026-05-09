import { Header } from '@/components/ui/Header';
import { StaffForm } from '@/components/staff/StaffForm';

export default function NewStaffPage() {
  return (
    <div className="page-enter">
      <Header title="Add Staff" subtitle="Fill in the details below" />
      <div className="p-4 lg:p-6 max-w-xl mx-auto">
        <div className="card">
          <StaffForm />
        </div>
      </div>
    </div>
  );
}
