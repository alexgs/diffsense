export type Brand<T, B extends string> = T & { readonly __brand: B };

export type SuiteId = Brand<string, "SuiteId">;
export type ScenarioId = Brand<string, "ScenarioId">;
export type ModelId = Brand<string, "ModelId">;
export type ProviderId = Brand<string, "ProviderId">;

export const asSuiteId = (s: string) => s as SuiteId;
export const asScenarioId = (s: string) => s as ScenarioId;
export const asModelId = (s: string) => s as ModelId;
export const asProviderId = (s: string) => s as ProviderId;
