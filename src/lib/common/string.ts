export const replaceNewLineCharactersWithSpaces = (str: string): string => {
  return str.replace(/\r?\n/g, " ");
};

export const removeExtraSpaces = (str: string): string => {
  return str.replace(/(^\s+|\s(?=\s)|\s+$)/g, "");
};

export const normalizeString = (str: string): string => {
  return removeExtraSpaces(replaceNewLineCharactersWithSpaces(str));
};

export const addSpaceBetweenDotAndWord = (str: string): string => {
  return str.replace(/\.(?=[а-я])/gi, ". ");
};

export const decline = (num: number, declensions: string[]): string => {
  const tensAndOnes = Math.abs(num) % 100;
  const ones = tensAndOnes % 10;

  if (tensAndOnes > 10 && tensAndOnes < 20) {
    return declensions[2];
  } else if (ones > 1 && ones < 5) {
    return declensions[1];
  } else if (ones == 1) {
    return declensions[0];
  }

  return declensions[2];
};
