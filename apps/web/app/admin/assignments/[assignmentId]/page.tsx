import Link from 'next/link';
import type { Assignment, Challenge } from '@afterquery/database';
import { Badge } from 'lucide-react';

import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Commit = {
  sha: '851d563880cb08b1728fc8a5a392eb70f4d3e8d0';
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
};

type DiffFile = {
  sha: '9daeafb9864cf43055ae93beb0afd6c7d144bfa4';
  filename: 'test.txt';
  status: 'added';
  additions: 1;
  deletions: 0;
  changes: 1;
  patch: '@@ -0,0 +1 @@\n+test';
};

async function fetchAssignment(assignmentId: string) {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/assignments/${assignmentId}`);

  return (await res.json()) as Assignment;
}

async function fetchAssignmentCommits(assignmentId: string) {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/assignments/${assignmentId}/commits`);

  return (await res.json()) as Commit[];
}

async function fetchAssignmentDiff(assignmentId: string) {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/assignments/${assignmentId}/diff`);

  return (await res.json()) as DiffFile[];
}

function getAssignmentStatus(assignment: Assignment) {
  if (assignment.completedAt) {
    return 'COMPLETED';
  }

  if (!assignment.startedAt) {
    return 'PENDING';
  }

  return 'STARTED';
}

export default async function AssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;

  const assignment = await fetchAssignment(assignmentId);
  const commits = await fetchAssignmentCommits(assignmentId);
  const diff = await fetchAssignmentDiff(assignmentId);

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
              <BreadcrumbPage>Assignments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          <div>{getAssignmentStatus(assignment)}</div>
          <Button asChild>
            <Link href={`/assignments/${assignmentId}`}>Preview</Link>
          </Button>
        </div>

        <Table>
          <TableCaption>Commits</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Commit</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commits.map((commit) => (
              <TableRow key={commit.sha}>
                <TableCell className="font-medium">{commit.sha}</TableCell>
                <TableCell>
                  {commit.commit.author.name} {commit.commit.author.email}
                </TableCell>
                <TableCell>{commit.commit.message}</TableCell>
                <TableCell className="text-right">{commit.commit.author.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Table>
          <TableCaption>Diff</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Commit</TableHead>
              <TableHead>Path</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diff.map((file) => (
              <TableRow key={file.sha}>
                <TableCell className="font-medium">{file.sha}</TableCell>
                <TableCell>
                  <code>{file.patch}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SidebarInset>
  );
}
