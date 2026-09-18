CREATE TABLE "ProcessingControl" (
  "workspaceId" TEXT NOT NULL PRIMARY KEY,
  "withdrawnAt" TIMESTAMP(3) NOT NULL,
  "noticeVersion" TEXT NOT NULL,
  CONSTRAINT "ProcessingControl_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
