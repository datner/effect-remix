import { NodeContext } from "@effect/platform-node";
import * as Sqlite from "@effect/sql-sqlite-node";
import { Config, Layer, String } from "effect";
import { fileURLToPath } from "node:url";

const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

export const SqliteLive = Sqlite.client.layer({
  filename: Config.succeed("db.sqlite"),
  transformQueryNames: Config.succeed(String.camelToSnake),
  transformResultNames: Config.succeed(String.snakeToCamel),
});

export const MigratorLive = Layer.provide(
  Sqlite.migrator.layer({
    loader: Sqlite.migrator.fromFileSystem(migrationsDir),
    schemaDirectory: "app/migrations",
  }),
  Layer.merge(SqliteLive, NodeContext.layer),
);
