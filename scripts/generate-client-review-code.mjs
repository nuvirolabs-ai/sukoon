#!/usr/bin/env node
import { randomBytes } from "node:crypto";

console.log(randomBytes(32).toString("base64url"));
console.error("Paste this value only into the ignored .env.client-review.local file; it is not stored by this command.");
