/** Remove absent optional fields while preserving Firestore timestamps/sentinels. */
export function cleanDocument<T>(value: T): T {
  if (Array.isArray(value))
    return value.map((item) => cleanDocument(item ?? null)) as T;
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, cleanDocument(item)]),
    ) as T;
  }
  return value;
}
