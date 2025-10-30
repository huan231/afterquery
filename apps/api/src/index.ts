import * as fs from 'node:fs';
import path from 'node:path';
import * as os from 'node:os';

import express from 'express';
// eslint-disable-next-line import/no-unresolved
import { Octokit } from 'octokit';
import { assignmentTable, challengeTable } from '@afterquery/database';
import { simpleGit } from 'simple-git';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Resend } from 'resend';
import { eq } from 'drizzle-orm';

import { db } from './db.ts';

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });
const resend = new Resend(process.env.RESEND_API_KEY);

const GITHUB_USERNAME = `huan231`;
const GITHUB_ORG = `afterquery-janszybowski-test`;

const PUBLIC_URL = process.env.PUBLIC_URL;

const proxyMiddleware = createProxyMiddleware<express.Request, express.Response>({
  auth: `${GITHUB_USERNAME}:${process.env.GITHUB_PAT}`,
  followRedirects: true,
  target: 'https://github.com',
  changeOrigin: true,
  pathRewrite: async (originalPath, req) => {
    const [assignment] = await db
      .select()
      .from(assignmentTable)
      .where(eq(assignmentTable.hash, req.params.hash.replace(/\.git$/, '')));

    if (!assignment) {
      throw new Error();
    }

    if (!assignment.startedAt || assignment.completedAt) {
      throw new Error();
    }

    if (!assignment.closesAt || assignment.closesAt < new Date()) {
      throw new Error();
    }

    const path = originalPath.split('/').slice(3).join('/');

    return `/${GITHUB_ORG}/chall_${assignment.challengeId}_${assignment.id}/${path}`;
  },
  on: {
    error: (err, req, res, target) => {
      console.log(target);
      console.error(err);

      throw err;
    },
  },
});

const app = express();

app.get('/git/:hash/info/refs', proxyMiddleware);
app.post('/git/:hash/git-upload-pack', proxyMiddleware);
app.post('/git/:hash/git-receive-pack', proxyMiddleware);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.post('/challenges', async (req, res) => {
  const [challenge] = await db.insert(challengeTable).values(req.body).returning();

  const repo = `chall_${challenge.id}`;

  await octokit.request('POST /orgs/{org}/repos', {
    org: GITHUB_ORG,
    name: repo,
    private: true,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), repo));
  const git = simpleGit({ baseDir: tmp });

  await git.clone(challenge.repositoryUrl, 'mirror.git', ['--bare']);

  const mgit = simpleGit({ baseDir: path.join(tmp, 'mirror.git') });

  await mgit.push(
    `https://${GITHUB_USERNAME}:${process.env.GITHUB_PAT}@github.com/${GITHUB_ORG}/${repo}.git`,
    'HEAD:refs/heads/main',
  );

  await fs.promises.rm(tmp, { recursive: true, force: true });

  res.status(201).json(challenge);
});

app.get('/challenges', async (req, res) => {
  const challenges = await db.select().from(challengeTable);

  res.status(200).json(challenges);
});

app.get('/challenges/:challengeId', async (req, res) => {
  const [challenge] = await db
    .select()
    .from(challengeTable)
    .where(eq(challengeTable.id, parseInt(req.params.challengeId)));

  res.status(200).json(challenge);
});

app.get('/assignments', async (req, res) => {
  const assignments = await db.select().from(assignmentTable);

  res.status(200).json(assignments);
});

app.post('/assignments', async (req, res) => {
  const [assignment] = await db.insert(assignmentTable).values(req.body).returning();
  const [challenge] = await db.select().from(challengeTable).where(eq(challengeTable.id, assignment.challengeId));

  const url = new URL(`/assignments/${assignment.id}`, PUBLIC_URL);

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: assignment.candidateEmail,
    subject: 'You have been assigned a coding challenge',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
<p>Hello,</p>
<p>You have been assigned the <em>${challenge.title}</em> coding challenge</p>
<p>To view the challenge, visit this link:</p>
<p><a href="${url}">${url}</a></p>
<p>Once you click start, you'll be provided with a Git repository to work from. Please do not share this URL with anyone else.</p>
<p>Best of luck!</p>
</body>
</html>`,
  });

  res.status(201).json(assignment);
});

app.get('/assignments/:assignmentId', async (req, res) => {
  const [assignment] = await db
    .select()
    .from(assignmentTable)
    .where(eq(assignmentTable.id, parseInt(req.params.assignmentId)));

  if (!assignment) {
    res.status(404).send();
    return;
  }

  res.status(200).json(assignment);
});

app.get('/assignments/:assignmentId/commits', async (req, res) => {
  const [assignment] = await db
    .select()
    .from(assignmentTable)
    .where(eq(assignmentTable.id, parseInt(req.params.assignmentId)));

  if (!assignment) {
    res.status(404).send();
    return;
  }

  const repo = `chall_${assignment.challengeId}_${assignment.id}`;

  const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner: GITHUB_ORG,
    repo,
    sha: 'main',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  res.status(200).json(response.data);
});

app.get('/assignments/:assignmentId/diff', async (req, res) => {
  const [assignment] = await db
    .select()
    .from(assignmentTable)
    .where(eq(assignmentTable.id, parseInt(req.params.assignmentId)));

  if (!assignment) {
    res.status(404).send();
    return;
  }

  const repo = `chall_${assignment.challengeId}_${assignment.id}`;

  const response = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', {
    owner: GITHUB_ORG,
    repo,
    basehead: `${assignment.commit}...HEAD`,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  res.status(200).json(response.data.files);
});

app.post('/assignments/:assignmentId/start', async (req, res) => {
  const [assignment] = await db
    .select()
    .from(assignmentTable)
    .where(eq(assignmentTable.id, parseInt(req.params.assignmentId)));

  if (assignment.startedAt) {
    res.status(400).send();
    return;
  }

  const [challenge] = await db.select().from(challengeTable).where(eq(challengeTable.id, assignment.challengeId));

  const repo = `chall_${assignment.challengeId}_${assignment.id}`;

  await octokit.request('POST /orgs/{org}/repos', {
    org: GITHUB_ORG,
    name: repo,
    private: true,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), repo));
  const git = simpleGit({ baseDir: tmp });

  await git.clone(challenge.repositoryUrl, 'mirror.git', ['--bare']);

  await git.clone(
    `https://${GITHUB_USERNAME}:${process.env.GITHUB_PAT}@github.com/${GITHUB_ORG}/chall_${assignment.challengeId}.git`,
    'seed.git',
    ['--bare'],
  );

  const mgit = simpleGit({ baseDir: path.join(tmp, 'mirror.git') });
  const sgit = simpleGit({ baseDir: path.join(tmp, 'seed.git') });

  const mHead = await mgit.revparse('HEAD');
  const sHead = await sgit.revparse('HEAD');

  if (mHead !== sHead) {
    await mgit.push(
      `https://${GITHUB_USERNAME}:${process.env.GITHUB_PAT}@github.com/${GITHUB_ORG}/chall_${assignment.challengeId}.git`,
      'HEAD:refs/heads/main',
    );
  }

  await mgit.push(
    `https://${GITHUB_USERNAME}:${process.env.GITHUB_PAT}@github.com/${GITHUB_ORG}/${repo}.git`,
    'HEAD:refs/heads/main',
  );

  await fs.promises.rm(tmp, { recursive: true, force: true });

  const closesAt = new Date();
  closesAt.setHours(new Date().getHours() + challenge.completeIn);

  await db
    .update(assignmentTable)
    .set({
      startedAt: new Date(),
      closesAt,
      commit: mHead,
    })
    .where(eq(assignmentTable.id, assignment.id));

  res.status(200).json(assignment);
});

app.post('/assignments/:assignmentId/complete', async (req, res) => {
  const [assignment] = await db
    .select()
    .from(assignmentTable)
    .where(eq(assignmentTable.id, parseInt(req.params.assignmentId)));

  if (!assignment.closesAt || assignment.closesAt < new Date()) {
    res.status(400).send();
    return;
  }

  await db
    .update(assignmentTable)
    .set({
      completedAt: new Date(),
    })
    .where(eq(assignmentTable.id, assignment.id));

  res.status(200).json(assignment);
});

app.use((err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
  console.error(err);

  next(err);
});

const PORT = process.env.PORT || 4000;

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:4000`);
});
