import type { Assignment, Challenge } from '@afterquery/database';
import { redirect } from 'next/navigation';

import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

async function fetchAssignment(assignmentId: string) {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/assignments/${assignmentId}`);

  return (await res.json()) as Assignment;
}

async function fetchChallenge(challengeId: string | number) {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/challenges/${challengeId}`);

  return (await res.json()) as Challenge;
}

export default async function AssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;

  const assignment = await fetchAssignment(assignmentId);
  const challenge = await fetchChallenge(assignment.challengeId);

  async function startAssignment(formData: FormData) {
    'use server';

    const assignmentId = formData.get('assignmentId');

    await fetch(`${process.env.PUBLIC_API_URL!}/assignments/${assignmentId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    redirect(`/assignments/${assignmentId}`);
  }

  async function completeAssignment(formData: FormData) {
    'use server';

    const assignmentId = formData.get('assignmentId');

    await fetch(`${process.env.PUBLIC_API_URL!}/assignments/${assignmentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    redirect(`/`);
  }

  if (!assignment.startedAt) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xs">
          <Card>
            <CardHeader>
              <CardTitle>You&#39;ve been assigned the {challenge.title} coding challenge</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={startAssignment}>
                <input type="hidden" name="assignmentId" value={assignmentId} />
                <FieldGroup>
                  <Button type="submit">Start</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xs">
        <Card>
          <CardHeader>
            <CardTitle>{challenge.title} </CardTitle>
            <CardDescription>{challenge.instructions}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>A git repository has been created for you. Please use the following command to clone it:</p>
            <code>
              git clone {process.env.PUBLIC_API_URL}
              /git/{assignment.hash}.git
            </code>

            <form action={completeAssignment}>
              <input type="hidden" name="assignmentId" value={assignmentId} />
              <FieldGroup>
                <Button type="submit">Complete</Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
