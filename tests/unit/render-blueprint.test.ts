import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const blueprint = parse(readFileSync(path.resolve("render.yaml"), "utf8")) as {
  projects: Array<{ name: string; environments: Array<Record<string, unknown>> }>;
  previews: { generation: string };
};

function environment() {
  const project = blueprint.projects?.[0];
  const value = project?.environments?.[0];
  if (!project || !value) throw new Error("render.yaml project/environment missing");
  return value;
}

function services() {
  return environment().services as Array<Record<string, unknown>>;
}

function databases() {
  return environment().databases as Array<Record<string, unknown>>;
}

function envMap(service: Record<string, unknown>) {
  return Object.fromEntries((service.envVars as Array<Record<string, unknown>>).map((item) => [item.key, item]));
}

describe("Render client-demo staging Blueprint", () => {
  it("defines one protected isolated Sukoon project with exactly five Singapore services and one database", () => {
    const project = blueprint.projects[0];
    const env = environment();
    expect(blueprint.projects).toHaveLength(1);
    expect(project.name).toBe("sukoon-demo-staging");
    expect(env.name).toBe("demo-staging");
    expect(env.networking).toEqual({ isolation: "enabled" });
    expect(env.permissions).toEqual({ protection: "enabled" });
    expect(services()).toHaveLength(4);
    expect(services().map((service) => service.name)).toEqual(["sukoon-web", "sukoon-worker", "sukoon-storage", "sukoon-clamav"]);
    expect(services().every((service) => service.region === "singapore")).toBe(true);
    expect(databases()).toHaveLength(1);
    expect(databases()[0]).toMatchObject({ name: "sukoon-db", databaseName: "sukoon_demo_staging", region: "singapore", diskSizeGB: 15 });
    expect(databases()[0].plan).not.toBe("free");
    expect(blueprint.previews).toEqual({ generation: "off" });
  });

  it("keeps the first apply on the generated hostname and wires private services", () => {
    const web = services().find((service) => service.name === "sukoon-web")!;
    const worker = services().find((service) => service.name === "sukoon-worker")!;
    const storage = services().find((service) => service.name === "sukoon-storage")!;
    const clamav = services().find((service) => service.name === "sukoon-clamav")!;
    const webEnv = envMap(web);
    const workerEnv = envMap(worker);
    expect(web.domains).toBeUndefined();
    expect(web.renderSubdomainPolicy).toBeUndefined();
    expect(web.healthCheckPath).toBe("/api/health");
    expect(web.preDeployCommand).toBe("npm run db:migrate:deploy");
    expect(worker.startCommand).toBe("npm run worker:staging");
    expect((storage.disk as Record<string, unknown>).mountPath).toBe("/data");
    expect((clamav.disk as Record<string, unknown>).mountPath).toBe("/var/lib/clamav");
    expect(webEnv.BETTER_AUTH_URL).toMatchObject({ fromService: { name: "sukoon-web", type: "web", envVarKey: "RENDER_EXTERNAL_URL" } });
    expect(webEnv.SUKOON_STORAGE_ENDPOINT).toMatchObject({ fromService: { name: "sukoon-storage", type: "pserv", property: "hostport" } });
    expect(webEnv.SUKOON_CLAMAV_ENDPOINT).toMatchObject({ fromService: { name: "sukoon-clamav", type: "pserv", property: "hostport" } });
    expect(workerEnv.DATABASE_URL).toMatchObject({ fromDatabase: { name: "sukoon-db", property: "connectionString" } });
  });

  it("does not hardcode secrets, local data, public storage or public scanner access", () => {
    const allServices = services();
    const rendered = readFileSync(path.resolve("render.yaml"), "utf8");
    expect(rendered).not.toMatch(/\.data|EICAR|localhost|127\.0\.0\.1|onrender\.com/);
    expect(allServices.flatMap((service) => (service.envVars as Array<Record<string, unknown>>)).filter((item) => item.sync === false).map((item) => item.key)).toEqual(expect.arrayContaining(["SUKOON_SMTP_HOST", "SUKOON_SMTP_PASSWORD", "SUKOON_EMAIL_FROM"]));
    expect(allServices.flatMap((service) => (service.envVars as Array<Record<string, unknown>>)).filter((item) => item.generateValue === true).map((item) => item.key)).toEqual(expect.arrayContaining(["BETTER_AUTH_SECRET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]));
    expect(allServices.find((service) => service.name === "sukoon-storage")?.type).toBe("pserv");
    expect(allServices.find((service) => service.name === "sukoon-clamav")?.type).toBe("pserv");
  });
});
