import * as Migrator from "@sqlfx/sqlite/Migrator/Node";
import * as Sqlite from "@sqlfx/sqlite/node";
import { Config, Layer } from "effect";
import { fileURLToPath } from "node:url";

const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

export const SqliteLive = Sqlite.makeLayer({
  filename: Config.succeed("db.sqlite"),
  transformQueryNames: Config.succeed(Sqlite.transform.camelToSnake),
  transformResultNames: Config.succeed(Sqlite.transform.snakeToCamel),
});

export const MigratorLive = Layer.provide(
  Migrator.makeLayer({
    loader: Migrator.fromDisk(migrationsDir),
    schemaDirectory: "app/migrations",
  }),
  SqliteLive,
);
