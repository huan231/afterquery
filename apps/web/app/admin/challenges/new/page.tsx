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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

export default function NewChallengePage() {
  async function createChallenge(formData: FormData) {
    'use server';

    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      instructions: formData.get('instructions'),
      repositoryUrl: formData.get('repositoryUrl'),
      startIn: formData.get('startIn'),
      completeIn: formData.get('completeIn'),
    };

    const res = await fetch(`${process.env.PUBLIC_API_URL!}/challenges`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    const challenge = (await res.json()) as Challenge;

    redirect(`/admin/challenges/${challenge.id}`);
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
              <BreadcrumbPage>New</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <form action={createChallenge}>
          <FieldGroup>
            <Field>
              <Field className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input id="title" name="title" type="text" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="repositoryUrl">Repository URL</FieldLabel>
                  <Input id="repositoryUrl" name="repositoryUrl" required />
                </Field>
              </Field>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" name="description" />
            </Field>
            <Field>
              <FieldLabel htmlFor="instructions">Instructions</FieldLabel>
              <Textarea id="instructions" name="instructions" />
            </Field>
            <Field>
              <Field className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="startIn">Start in</FieldLabel>
                  <Input id="startIn" type="number" required name="startIn" defaultValue="72" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="completeIn">Complete in</FieldLabel>
                  <Input id="completeIn" type="number" required name="completeIn" defaultValue="48" />
                </Field>
              </Field>
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
