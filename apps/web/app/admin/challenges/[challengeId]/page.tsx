import Link from 'next/link';
import type { Challenge } from '@afterquery/database';
import { redirect } from 'next/navigation';

import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

async function fetchChallenge(challengeId: string) {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/challenges/${challengeId}`);

  return (await res.json()) as Challenge;
}

export default async function ChallengePage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;

  const challenge = await fetchChallenge(challengeId);

  const hash = crypto.randomUUID();

  async function createAssignment(formData: FormData) {
    'use server';

    const data = {
      candidateEmail: formData.get('candidateEmail'),
      hash: formData.get('hash'),
      challengeId: formData.get('challengeId'),
    };

    await fetch(`${process.env.PUBLIC_API_URL!}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    redirect(`/admin/challenges`);
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href="/admin">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href="/admin/challenges">Challenges</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>{challenge.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <form action={createAssignment}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="candidateEmail">Candidate email</FieldLabel>
              <Input
                id="candidateEmail"
                name="candidateEmail"
                type="email"
                required
                placeholder="szybowski.jan@gmail.com"
                defaultValue="szybowski.jan@gmail.com"
              />
              <input type="hidden" name="hash" value={hash} />
              <input type="hidden" name="challengeId" value={challengeId} />
            </Field>
            <Field>
              <Button type="submit">Create</Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </SidebarInset>
  );
}
