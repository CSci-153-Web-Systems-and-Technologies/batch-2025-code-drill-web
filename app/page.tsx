import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/shared/Container';

export default function Home() {
  return (
    <Container className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, Alex!
        </h1>
        <p className="text-xl text-gray-600">
          Ready to continue your coding journey?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1250</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">47</div>
            <div className="text-sm text-gray-600">Problems Solved</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">5 days</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </div>
        </Card>
      </div>

      <div className="text-center">
        <Button size="lg">Start Practice Session</Button>
      </div>
    </Container>
  );
}
