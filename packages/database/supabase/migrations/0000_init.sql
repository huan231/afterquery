CREATE TABLE "assignment" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_email" text NOT NULL,
	"hash" text NOT NULL,
	"challenge_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"closes_at" timestamp,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "assignment_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "challenge" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text NOT NULL,
	"repository_url" text NOT NULL,
	"start_in" integer NOT NULL,
	"complete_in" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;