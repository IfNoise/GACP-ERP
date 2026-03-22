import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CourseList } from './_components/course-list';

export default async function CoursesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <CourseList />
    </div>
  );
}
