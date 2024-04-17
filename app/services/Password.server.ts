import bcrypt from "bcryptjs";
import { Config, Context, Effect, Layer } from "effect";
import { Hash, PasswordHashingError, PasswordInvalidError, PasswordValidatingError, Salt } from "./Password";

const SaltRounds = Config.number("saltRounds").pipe(
  Config.withDefault(10),
);

export const make = Effect.gen(function*($) {
  const rounds = yield* $(SaltRounds);
  const Salt = Effect.async<Salt, PasswordHashingError, never>(register => {
    bcrypt.genSalt(rounds, (err, salt) => {
      if (err) {
        register(Effect.fail(new PasswordHashingError({ reason: err, type: "Salting" })));
      }
      register(Effect.succeed(salt as Salt));
    });
  }).pipe(Effect.withSpan("Password.Salt"));

  const hash = (password: string) =>
    Effect.flatMap(Salt, salt =>
      Effect.async<Hash, PasswordHashingError, never>(register => {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            register(Effect.fail(new PasswordHashingError({ reason: err, type: "Hashing" })));
          }
          register(Effect.succeed(hash as Hash));
        });
      })).pipe(Effect.withSpan("Password.hash"));

  const compare = (password: string, hash: Hash) =>
    Effect.async<boolean, PasswordValidatingError, never>(register => {
      bcrypt.compare(password, hash, (err, result) => {
        if (err) {
          register(Effect.fail(new PasswordValidatingError({ reason: err })));
        }
        register(Effect.succeed(result));
      });
    }).pipe(Effect.withSpan("Password.compare"));

  const validate = (password: string, hash: Hash) =>
    compare(password, hash).pipe(
      Effect.catchTag("PasswordValidatingError", reason =>
        new PasswordInvalidError({ reason, message: "Could not validate password" })),
      Effect.if({
        onTrue: () =>
          Effect.void,
        onFalse: () => new PasswordInvalidError({ message: "Password is incorrect" }),
      }),
    ).pipe(Effect.withSpan("Password.validate"));

  return {
    hash,
    compare,
    validate,
  };
});

export class Password extends Context.Tag("@services/Password")<Password, Effect.Effect.Success<typeof make>>() {
  static live = Layer.effect(this, make);
  static layer = this.live;
}
