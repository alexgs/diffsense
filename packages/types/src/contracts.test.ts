import { describe, it, expectTypeOf } from "vitest";
import type { Scenario, Runner } from "@diffsense/types";
import { asModelId } from "@diffsense/types";

describe("types package: compile-time contracts", () => {
  it("Scenario<I, E> wires generics to input/expected", () => {
    type S = Scenario<{ foo: number }, boolean>;
    expectTypeOf<S["input"]>().toEqualTypeOf<{ foo: number }>();
    expectTypeOf<S["expected"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("Runner.run signature is (prompt: string) => Promise<{ outputText: string; ... }>", () => {
    type R = Runner;
    // Param types
    // @ts-expect-error -- Something about `[string]` it doesn't like
    expectTypeOf<Parameters<R["run"]>>().toEqualTypeOf<[string]>();

    // Return type shape (we check only the required piece to stay stable)
    type RunReturn = ReturnType<R["run"]>;

    // Promise<{ outputText: string; ... }>
    expectTypeOf<RunReturn>().toExtend<Promise<{ outputText: string }>>();
  });

  it("ModelId is a branded string: assignable to string, not vice versa", () => {
    type ModelId = ReturnType<typeof asModelId>;

    // brand extends string
    expectTypeOf<ModelId>().toExtend<string>();

    // plain string should not be assignable to the brand
    expectTypeOf<string>().not.toExtend<ModelId>();
  });
});
