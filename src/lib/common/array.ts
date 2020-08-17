export const flat = <T>(arr: T[][]): T[] => {
  return arr.reduce((acc, curr) => acc.concat(curr), []);
};

export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) throw new RangeError("parameter 'size' must be more than 0");

  const copy: T[] = [...arr];
  const result: T[][] = [];

  while (copy.length) {
    result.push(copy.splice(0, size));
  }

  return result;
};
