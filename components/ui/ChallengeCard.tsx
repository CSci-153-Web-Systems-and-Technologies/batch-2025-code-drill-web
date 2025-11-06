interface ChallengeCardProps {
  title: string;
  description: string;
  participants: number;
  points: number;
  daysLeft: number;
}

export default function ChallengeCard({ 
  title, 
  description, 
  participants, 
  points,
  daysLeft 
}: ChallengeCardProps) {
  const isUrgent = daysLeft <= 3;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:border-blue-200 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {points} pts
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{participants} participants</span>
        <span className={`font-medium ${isUrgent ? 'text-orange-500' : 'text-gray-500'}`}>
          {daysLeft} days left
        </span>
      </div>
    </div>
  );
}
