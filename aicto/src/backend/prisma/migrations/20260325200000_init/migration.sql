-- CreateTable
CREATE TABLE "projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "yunxiao_project_id" TEXT,
    "feishu_chat_id" TEXT,
    "github_repo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "health_score" INTEGER NOT NULL DEFAULT 100,
    "config" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "demands" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project_id" INTEGER NOT NULL,
    "yunxiao_id" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "assignee" TEXT,
    "planned_start" DATETIME,
    "planned_end" DATETIME,
    "actual_start" DATETIME,
    "actual_end" DATETIME,
    "story_points" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "raw_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "demands_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bugs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project_id" INTEGER NOT NULL,
    "yunxiao_id" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT,
    "priority" TEXT,
    "reporter" TEXT,
    "assignee" TEXT,
    "found_version" TEXT,
    "fixed_version" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    "raw_data" TEXT,
    CONSTRAINT "bugs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "iterations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project_id" INTEGER NOT NULL,
    "yunxiao_id" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "owner" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "iterations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "record_count" INTEGER,
    "error_message" TEXT,
    "started_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    CONSTRAINT "sync_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Insert initial migration record
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") 
VALUES ('20260325200000_init', 'manual-init', datetime('now'), '20260325200000_init', NULL, NULL, datetime('now'), 1);