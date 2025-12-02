import SkillProgressBar from '../ui/SkillProgressBar';

interface Skill {
  name: string;
  current: number;
  total: number;
}

interface SkillProgressProps {
  skills: Skill[];
}

export default function SkillProgress({ skills }: SkillProgressProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Skill Progress</h3>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">Track your mastery across different topics</p>
      <div>
        {skills.map((skill) => (
          <SkillProgressBar 
            key={skill.name}
            skill={skill.name}
            current={skill.current}
            total={skill.total}
          />
        ))}
      </div>
      <button className="mt-6 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center">
        Browse All Topics
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
