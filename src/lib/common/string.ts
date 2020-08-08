export const replaceNewLineCharactersWithSpaces = (str: string): string => {
  return str.replace(/\r?\n/g, " ");
};

export const removeExtraSpaces = (str: string): string => {
  return str.replace(/(^\s+|\s(?=\s)|\s+$)/g, "");
};

export const normalizeString = (str: string): string => {
  return removeExtraSpaces(replaceNewLineCharactersWithSpaces(str));
};
