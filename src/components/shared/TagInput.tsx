'use client';

import React, { useState, useEffect, useRef } from 'react';
import { suggestTags } from '@/lib/question-tags-actions';
import { normalizeTags, validateTags } from '@/lib/question-tags';

interface TagInputProps {
  courseId?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  error?: string;
}

export default function TagInput({
  courseId,
  value = [],
  onChange,
  placeholder = 'Add tags (e.g., loops, arrays)...',
  maxTags = 10,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length > 0) {
        const results = await suggestTags(inputValue, courseId, 10);
        // Filter out already selected tags
        const filtered = results.filter(tag => !value.includes(tag));
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounce);
  }, [inputValue, value, courseId]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const normalized = normalizeTags([tag]);
    if (normalized.length === 0) return;
    
    const newTag = normalized[0];
    
    // Don't add duplicates
    if (value.includes(newTag)) {
      setInputValue('');
      setShowSuggestions(false);
      return;
    }
    
    // Check max tags limit
    if (value.length >= maxTags) {
      setInputValue('');
      setShowSuggestions(false);
      return;
    }
    
    // Validate tag
    const validation = validateTags([newTag]);
    if (validation.errors.length > 0) {
      console.warn('Invalid tag:', validation.errors[0]);
      return;
    }
    
    onChange([...value, newTag]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter or Tab: add tag
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      
      if (showSuggestions && suggestions.length > 0) {
        // Add selected suggestion
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        // Add manually typed tag
        addTag(inputValue.trim());
      }
    }
    // Backspace: remove last tag if input is empty
    else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
    // Arrow Down: navigate suggestions
    else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    }
    // Arrow Up: navigate suggestions
    else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    // Escape: close suggestions
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      {/* Tag Display + Input */}
      <div
        className={`flex flex-wrap gap-2 p-2 bg-gray-800 border rounded-lg min-h-[42px] ${
          error ? 'border-red-500' : 'border-gray-700'
        } focus-within:border-blue-500`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Display existing tags */}
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-red-300 focus:outline-none"
              aria-label={`Remove tag ${tag}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim() && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={value.length >= maxTags}
          className="flex-1 min-w-[120px] bg-transparent text-white focus:outline-none placeholder-gray-500 disabled:cursor-not-allowed"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm ${
                index === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      {error ? (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">
          {value.length}/{maxTags} tags. Press Enter or Tab to add. Use lowercase letters, numbers, and hyphens only.
        </p>
      )}
    </div>
  );
}
