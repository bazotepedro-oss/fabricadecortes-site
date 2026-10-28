import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function MembrosRedirectPage() {
  const membersUrl = process.env.NEXT_PUBLIC_MEMBERS_URL || 'http://localhost:8080/index.php';
  redirect(membersUrl);
}
