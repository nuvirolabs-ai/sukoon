# Migration policy

Sukoon migrations are append-only, checked in, and applied with `prisma migrate deploy`. The repository does not use `prisma migrate reset`, fixture migrations, or destructive startup migrations.

Rollback is a release operation: restore an approved database backup or add and review an explicit inverse migration as a new forward migration. No inverse is run automatically, because dropping user records is not a safe development default. The wrapper in `scripts/run-prisma-safe.mjs` refuses production URLs and reset commands and accepts only uniquely named `sukoon_s02_local_*` or `sukoon_s02_test_*` databases.
