import { redirect } from 'next/navigation';

// Root "/" redirects signed-in users to dashboard
export default function RootPage() {
  redirect('/dashboard');
}
