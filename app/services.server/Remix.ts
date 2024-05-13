import { HttpServer } from "@effect/platform";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Params as RemixParams } from "@remix-run/react";
import { Context, Effect, Layer, ManagedRuntime, Utils } from "effect";
import { Auth, Session } from "./Auth";
import { MigratorLive } from "./Database";
import { Password } from "./Password";
import { Users } from "./Users";

const AppLayer = Layer.mergeAll(Auth.layer, Users.layer, Password.layer, MigratorLive);

const runtime = ManagedRuntime.make(AppLayer);

interface Params {
  readonly _: unique symbol;
}
const Params = Context.GenericTag<Params, RemixParams>("@services/Params");

type AppEnv = Layer.Layer.Success<typeof AppLayer>;

type RequestEnv = HttpServer.request.ServerRequest | Params | Session;

export interface RemixHandler<E, R> extends
  Effect.Effect<
    HttpServer.response.ServerResponse,
    E | HttpServer.response.ServerResponse,
    R | AppEnv | RequestEnv
  >
{}

export const makeServerContext = (
  args: LoaderFunctionArgs | ActionFunctionArgs,
) =>
  Layer.provideMerge(
    Session.layer,
    Layer.succeedContext(
      Context.empty().pipe(
        Context.add(
          HttpServer.request.ServerRequest,
          HttpServer.request.fromWeb(args.request),
        ),
        Context.add(Params, args.params),
      ),
    ),
  );

export const loader =
  <E, R extends AppEnv | RequestEnv>(effect: RemixHandler<E, R>) => async (args: LoaderFunctionArgs) =>
    effect.pipe(
      Effect.map(HttpServer.response.toWeb),
      Effect.provide(makeServerContext(args)),
      runtime.runPromise,
    );

export const unwrapLoader = <E1, R1 extends AppEnv | RequestEnv, E2, R2 extends AppEnv>(
  effect: Effect.Effect<RemixHandler<E1, R1>, E2, R2>,
) => {
  const awaitedHandler = runtime.runPromise(effect).then(action);
  return async (args: LoaderFunctionArgs) => awaitedHandler.then(handler => handler(args));
};

// <Eff extends YieldWrap<Effect<any, any, any>>, AEff>(
//   f: (resume: Adapter) => Generator<Eff, AEff, never>
// ): Effect<
//   AEff,
//   [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
//   [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
// >
export const loaderGen: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv | RequestEnv>>>(
    f: (
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, HttpServer.response.ServerResponse, never>,
  ): (args: LoaderFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Self, Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv | RequestEnv>>>(
    self: Self,
    f: (
      this: Self,
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, HttpServer.response.ServerResponse, never>,
  ): (args: LoaderFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = (...args: [any]) => loader(Effect.gen(...args));

export const unwrapLoaderGen: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv>>, AEff extends RemixHandler<any, any>>(
    f: (
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, AEff, any>,
  ): (args: LoaderFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <
    Self,
    Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv | RequestEnv>>,
    AEff extends RemixHandler<any, any>,
  >(
    self: Self,
    f: (
      this: Self,
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, AEff, any>,
  ): (args: LoaderFunctionArgs) => Promise<Response>;
} = (...args: [any]) => unwrapLoader(Effect.gen(...args) as any);

export const action =
  <E, R extends AppEnv | RequestEnv>(effect: RemixHandler<E, R>) => async (args: ActionFunctionArgs) =>
    effect.pipe(
      Effect.map(HttpServer.response.toWeb),
      Effect.provide(makeServerContext(args)),
      runtime.runPromise,
    );

export const unwrapAction = <E1, R1 extends AppEnv | RequestEnv, E2, R2 extends AppEnv>(
  effect: Effect.Effect<RemixHandler<E1, R1>, E2, R2>,
) => {
  const awaitedHandler = runtime.runPromise(effect).then(action);
  return async (args: LoaderFunctionArgs) => awaitedHandler.then(handler => handler(args));
};

export const actionGen: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv | RequestEnv>>>(
    f: (
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, HttpServer.response.ServerResponse, never>,
  ): (args: ActionFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Self, Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv | RequestEnv>>>(
    self: Self,
    f: (
      this: Self,
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, HttpServer.response.ServerResponse, never>,
  ): (args: ActionFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = (...args: [any]) => action(Effect.gen(...args));

export const unwrapActionGen: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv>>, AEff extends RemixHandler<any, any>>(
    f: (
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, AEff, any>,
  ): (args: ActionFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <
    Self,
    Eff extends Utils.YieldWrap<Effect.Effect<any, any, AppEnv | RequestEnv>>,
    AEff extends RemixHandler<any, any>,
  >(
    self: Self,
    f: (
      this: Self,
      resume: Effect.Adapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Generator<Eff, AEff, any>,
  ): (args: ActionFunctionArgs) => Promise<Response>;
} = (...args: [any]) => unwrapAction(Effect.gen(...args) as any);
