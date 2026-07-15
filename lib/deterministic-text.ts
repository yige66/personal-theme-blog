export function compareTextCodePoints(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}
