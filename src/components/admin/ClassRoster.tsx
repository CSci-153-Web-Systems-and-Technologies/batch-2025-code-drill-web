'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';

type Student = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  examCount: number;
  avgAccuracy: number;
  totalPoints: number;
};

export function ClassRoster() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRoster();
  }, []);

  async function loadRoster() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roster');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Failed to load roster:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Card><p className="text-gray-600">Loading roster...</p></Card>;
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Class Roster ({students.length} students)</h2>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Exams</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Avg Accuracy</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Points</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{student.name}</td>
                <td className="py-3 px-4 text-gray-600 text-sm">{student.email}</td>
                <td className="py-3 px-4 text-right text-gray-900">{student.examCount}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-semibold ${
                    student.avgAccuracy >= 80 ? 'text-green-600' :
                    student.avgAccuracy >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {student.avgAccuracy ? `${student.avgAccuracy.toFixed(1)}%` : 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-900">{student.totalPoints}</td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {new Date(student.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No students found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </Card>
  );
}
