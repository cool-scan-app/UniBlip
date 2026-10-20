CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" "point",
	"created_at" timestamp DEFAULT now() NOT NULL
);
