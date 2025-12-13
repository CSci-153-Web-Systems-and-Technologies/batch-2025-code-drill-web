'use client';

import { useEffect, useState, memo } from 'react';
import Link from 'next/link';
import SkillProgressBar from '../ui/SkillProgressBar';
import { getUserSkillsWithBadges } from '@/app/skills/actions';
import { getCategoryIcon, getBadgeIcon } from '@/lib/skills';
import type { SkillWithBadges } from '@/types/skills';

const SkillRow = memo(({ skill }: { skill: SkillWithBadges }) => (
  <div className="group contain-content">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className="text-lg pointer-events-none">{getCategoryIcon(skill.category)}</span>
        <span className="text-sm font-medium text-gray-700">
          {skill.category}
        </span>
        {skill.badges.length > 0 && (
          <span className="text-sm animate-scale-in pointer-events-none">
            {getBadgeIcon(skill.badges[skill.badges.length - 1].badge_type)}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-500">{skill.skill_level}</span>
    </div>
    <SkillProgressBar 
      skill={skill.category}
      current={skill.problems_solved}
      total={50}
    />
  </div>
));

SkillRow.displayName = 'SkillRow';

export default function SkillProgress() {
  const [skills, setSkills] = useState<SkillWithBadges[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSkills = async () => {
      const result = await getUserSkillsWithBadges();
      if (result.data) {
        // Show top 4 skills by problems solved
        const topSkills = result.data
          .sort((a, b) => b.problems_solved - a.problems_solved)
          .slice(0, 4);
        setSkills(topSkills);
      }
      setLoading(false);
    };
    loadSkills();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:1000px_100%]"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-2/3 animate-shimmer bg-[length:1000px_100%]"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:1000px_100%]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Skill Progress</h3>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">Track your mastery across different topics</p>
      
      {skills.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm text-gray-500 mb-4">No skills tracked yet</p>
          <Link href="/problems" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Start solving problems →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {skills.map((skill, index) => (
              <div key={skill.id} style={{ animationDelay: `${index * 75}ms` }} className="animate-fade-in">
                <SkillRow skill={skill} />
              </div>
            ))}
          </div>
          <Link 
            href="/skills"
            className="mt-6 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center 
                       transition-colors duration-200 min-h-[44px] touch-manipulation"
          >
            View All Skills
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </>
      )}
    </div>
  );
}
