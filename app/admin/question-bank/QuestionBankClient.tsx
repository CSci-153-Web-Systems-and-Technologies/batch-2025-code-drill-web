'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Question {
  id: string;
  course_id: string;
  course_name: string;
  question_text: string;
  question_type: string;
  points: number;
  difficulty_level: string;
  tags: string[] | null;
  created_at: string;
}

interface Course {
  id: string;
  name: string;
}

export default function QuestionBankClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questionsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/question-bank'),
        fetch('/api/admin/courses'),
      ]);

      if (questionsRes.ok) {
        const data = await questionsRes.json();
        setQuestions(data.questions || []);
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(questions.flatMap(q => q.tags || []))
  ).sort();

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || q.question_type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty_level === filterDifficulty;
    const matchesCourse = filterCourse === 'all' || q.course_id === filterCourse;
    const matchesTag = !selectedTag || (q.tags && q.tags.includes(selectedTag));
    
    return matchesSearch && matchesType && matchesDifficulty && matchesCourse && matchesTag;
  });

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">Loading question bank...</div>
      </Card>
    );
  }

  return (
    <div>
      {/* Filters Section */}
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="coding">Coding</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Filter by tag:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    !selectedTag 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTag === tag 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{filteredQuestions.length}</div>
            <div className="text-sm text-gray-500">Questions Found</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {filteredQuestions.filter(q => q.difficulty_level === 'easy').length}
            </div>
            <div className="text-sm text-gray-500">Easy</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {filteredQuestions.filter(q => q.difficulty_level === 'medium').length}
            </div>
            <div className="text-sm text-gray-500">Medium</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {filteredQuestions.filter(q => q.difficulty_level === 'hard').length}
            </div>
            <div className="text-sm text-gray-500">Hard</div>
          </div>
        </Card>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500">No questions match your filters</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-2">
                      {question.question_text}
                    </p>
                    <p className="text-sm text-gray-500">
                      Course: {question.course_name}
                    </p>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {question.points} pts
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                    {question.question_type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded capitalize ${
                    question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                    question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {question.difficulty_level}
                  </span>
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {question.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
