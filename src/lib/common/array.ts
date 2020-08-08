export const flat = <T>(arr: T[][]): T[] => {
  return arr.reduce((acc, curr) => acc.concat(curr), []);
};
