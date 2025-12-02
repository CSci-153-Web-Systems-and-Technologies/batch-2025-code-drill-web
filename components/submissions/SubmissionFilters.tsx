'use client';

interface Filters {
  language: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filters: Filters;
  availableLanguages: string[];
  onFilterChange: (filters: Filters) => void;
  isLoading: boolean;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Wrong Answer', label: 'Wrong Answer' },
  { value: 'Time Limit Exceeded', label: 'Time Limit Exceeded' },
  { value: 'Runtime Error', label: 'Runtime Error' },
  { value: 'Compilation Error', label: 'Compilation Error' },
];

const LANGUAGE_DISPLAY: Record<string, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

export default function SubmissionFilters({
  filters,
  availableLanguages,
  onFilterChange,
  isLoading,
}: Props) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    onFilterChange({ language: '', status: '', dateFrom: '', dateTo: '' });
  };

  const hasActiveFilters =
    filters.language || filters.status || filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            disabled={isLoading}
            className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Language Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Language
          </label>
          <select
            value={filters.language}
            onChange={(e) => handleChange('language', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
          >
            <option value="">All Languages</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_DISPLAY[lang] || lang}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            From Date
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            To Date
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
