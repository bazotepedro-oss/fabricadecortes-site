import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function MembrosRedirectPage() {
  const membersUrl = process.env.NEXT_PUBLIC_MEMBERS_URL || 'https://membros.fabricadecortes.com/index.php';
  redirect(membersUrl);
}
