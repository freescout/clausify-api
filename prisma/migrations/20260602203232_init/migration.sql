-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ClauseType" AS ENUM ('personal_data', 'third_party', 'abusive', 'retention', 'recourse');

-- CreateEnum
CREATE TYPE "Rating" AS ENUM ('green', 'orange', 'red');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT,
    "current_global_score" INTEGER,
    "current_rating" "Rating",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cgv_versions" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "raw_text" TEXT,
    "source_url" TEXT,
    "extracted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cgv_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "cgv_version_id" TEXT NOT NULL,
    "global_score" INTEGER NOT NULL,
    "rating" "Rating" NOT NULL,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clauses" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "clause_type" "ClauseType" NOT NULL,
    "content" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "score_impact" INTEGER NOT NULL,

    CONSTRAINT "clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_tags" (
    "site_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_tags_pkey" PRIMARY KEY ("site_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sites_domain_key" ON "sites"("domain");

-- CreateIndex
CREATE INDEX "cgv_versions_site_id_idx" ON "cgv_versions"("site_id");

-- CreateIndex
CREATE UNIQUE INDEX "cgv_versions_site_id_content_hash_key" ON "cgv_versions"("site_id", "content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "analyses_cgv_version_id_key" ON "analyses"("cgv_version_id");

-- CreateIndex
CREATE INDEX "clauses_analysis_id_idx" ON "clauses"("analysis_id");

-- CreateIndex
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_name_key" ON "tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "site_tags_tag_id_idx" ON "site_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "cgv_versions" ADD CONSTRAINT "cgv_versions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_cgv_version_id_fkey" FOREIGN KEY ("cgv_version_id") REFERENCES "cgv_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clauses" ADD CONSTRAINT "clauses_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_tags" ADD CONSTRAINT "site_tags_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_tags" ADD CONSTRAINT "site_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
