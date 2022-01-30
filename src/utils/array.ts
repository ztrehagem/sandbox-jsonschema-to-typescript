type Primitive = boolean | number | string | symbol | bigint | null | undefined;
type Unwrap<T> = T extends { [K in keyof T]: infer U } ? U : never;

export function arrayCompact<T extends readonly any[], U extends Primitive>(
  array: T,
  diff: U
) {
  return array.filter((item) => item !== diff) as Exclude<Unwrap<T>, U>[];
}
