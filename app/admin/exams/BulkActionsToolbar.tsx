'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { bulkPublishQuestions, bulkUnpublishQuestions, deleteQuestion } from '@/app/professor-exams/actions';

interface Question {
  id: string;
  title: string;
  question_type: string;
  difficulty: string;
  points: number;
  is_published: boolean;
  template_id: string;
}

interface BulkActionsToolbarProps {
  selectedQuestions: string[];
  questions: Question[];
  onActionComplete: () => void;
}

export default function BulkActionsToolbar({
  selectedQuestions,
  questions,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const selectedQuestionsData = questions.filter((q) =>
    selectedQuestions.includes(q.id)
  );
  const canPublish = selectedQuestionsData.some((q) => !q.is_published);
  const canUnpublish = selectedQuestionsData.some((q) => q.is_published);

  const handleBulkPublish = async () => {
    if (selectedQuestions.length === 0) return;

    const unpublishedIds = selectedQuestionsData
      .filter((q) => !q.is_published)
      .map((q) => q.id);

    if (unpublishedIds.length === 0) {
      setMessage({
        type: 'error',
        text: 'No unpublished questions selected',
      });
      return;
    }

    if (
      !confirm(
        `Publish ${unpublishedIds.length} question(s)? This will make them visible to students.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await bulkPublishQuestions(unpublishedIds);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Questions published successfully',
        });
        onActionComplete();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to publish questions',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while publishing questions',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedQuestions.length === 0) return;

    const publishedIds = selectedQuestionsData
      .filter((q) => q.is_published)
      .map((q) => q.id);

    if (publishedIds.length === 0) {
      setMessage({
        type: 'error',
        text: 'No published questions selected',
      });
      return;
    }

    if (
      !confirm(
        `Unpublish ${publishedIds.length} question(s)? This will hide them from students.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await bulkUnpublishQuestions(publishedIds);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Questions unpublished successfully',
        });
        onActionComplete();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to unpublish questions',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while unpublishing questions',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;

    if (
      !confirm(
        `⚠️ DELETE ${selectedQuestions.length} question(s)?\n\nThis will permanently delete:\n- All question content\n- Version history\n- Preview tokens\n- Student answers (if any)\n\nThis action CANNOT be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const questionId of selectedQuestions) {
        const result = await deleteQuestion(questionId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setMessage({
          type: 'success',
          text: `Successfully deleted ${successCount} question(s)`,
        });
      } else {
        setMessage({
          type: 'error',
          text: `Deleted ${successCount} question(s), failed to delete ${errorCount}`,
        });
      }

      onActionComplete();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while deleting questions',
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedQuestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 bg-blue-500/10 border-blue-500/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold">
            {selectedQuestions.length} question(s) selected
          </p>
          <p className="text-sm text-gray-400">
            Choose an action to apply to all selected questions
          </p>
        </div>
        <div className="flex gap-3">
          {canPublish && (
            <Button
              onClick={handleBulkPublish}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Publishing...' : 'Publish Selected'}
            </Button>
          )}
          {canUnpublish && (
            <Button
              onClick={handleBulkUnpublish}
              disabled={loading}
              variant="secondary"
            >
              {loading ? 'Unpublishing...' : 'Unpublish Selected'}
            </Button>
          )}
          <Button
            onClick={handleBulkDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Deleting...' : 'Delete Selected'}
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </Card>
  );
}
