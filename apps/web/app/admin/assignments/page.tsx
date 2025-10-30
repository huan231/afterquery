import Link from 'next/link';
import type { Assignment } from '@afterquery/database';
import { connection } from 'next/server';

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

async function fetchAssignments() {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/assignments`);

  return (await res.json()) as Assignment[];
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

export default async function AssignmentsPage() {
  await connection();

  const assignments = await fetchAssignments();

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
        <Table>
          <TableCaption>A list of assignments.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Challenge</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium">{assignment.candidateEmail}</TableCell>
                <TableCell>{getAssignmentStatus(assignment)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" asChild size="sm">
                    <Link href={`/admin/assignments/${assignment.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SidebarInset>
  );
}
