import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue-dark to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-3xl font-bold text-white">StaffTrack</h1>
          <p className="text-blue-200 mt-1 text-sm">Attendance & Salary for Indian Businesses</p>
        </div>

        {/* Clerk Sign In */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                card: 'shadow-2xl rounded-2xl',
                headerTitle: 'font-bold text-gray-900',
                formButtonPrimary: 'btn-primary w-full',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
