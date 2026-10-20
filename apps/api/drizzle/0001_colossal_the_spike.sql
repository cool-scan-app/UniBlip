CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"items" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
