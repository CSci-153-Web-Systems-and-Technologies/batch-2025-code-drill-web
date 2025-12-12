import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userRecord || (userRecord.role !== 'professor' && userRecord.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabase
      .from('professor_courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    // For each course, get stats
    const coursesWithStats = await Promise.all(
      (courses || []).map(async (course) => {
        // Count templates
        const { count: templateCount } = await supabase
          .from('exam_templates')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        // Count questions
        const { count: questionCount } = await supabase
          .from('exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        // Count students (users with role='student')
        // This is a simple count, you may want to track course enrollments separately
        const { count: studentCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        return {
          ...course,
          template_count: templateCount || 0,
          question_count: questionCount || 0,
          student_count: studentCount || 0,
        };
      })
    );

    return NextResponse.json({ courses: coursesWithStats });
  } catch (error) {
    console.error('Error in courses stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
