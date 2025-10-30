import Link from 'next/link';
import type { Challenge } from '@afterquery/database';
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

async function fetchChallenges() {
  const res = await fetch(`${process.env.PUBLIC_API_URL!}/challenges`);

  return (await res.json()) as Challenge[];
}

export default async function ChallengesPage() {
  await connection();

  const challenges = await fetchChallenges();

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
              <BreadcrumbPage>Challenges</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link href="/admin/challenges/new">Add challenge</Link>
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Table>
          <TableCaption>A list of your challenges.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Challenge</TableHead>
              <TableHead>Repository URL</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {challenges.map((challenge) => (
              <TableRow key={challenge.id}>
                <TableCell className="font-medium">{challenge.title}</TableCell>
                <TableCell>{challenge.repositoryUrl}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" asChild size="sm">
                    <Link href={`/admin/challenges/${challenge.id}`}>Invite</Link>
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
