import nodeHtmlToImage from "node-html-to-image";

export const htmlToImage = async (html: string): Promise<Buffer> => {
  const result = (await nodeHtmlToImage({
    html
  })) as Buffer;

  return result;
};

export type HtmlAttributeValue = string | string[] | number | number[] | undefined;
export type HtmlChildren = string | number | string[] | number[];

export interface HtmlAttributes {
  class?: string | string[];
  id?: string;
  [key: string]: HtmlAttributeValue;
}

export const attributesToString = (attributes: HtmlAttributes): string => {
  const attributesString: string[] = [];

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) continue;

    const attributeString = `${key}="${Array.isArray(value) ? value.join(" ") : value}"`;

    attributesString.push(attributeString);
  }

  const result = attributesString.join(" ");

  return result;
};

export const tag = (tag: string, children: HtmlChildren, attributes?: HtmlAttributes): string => {
  const attributesString = attributes ? attributesToString(attributes) : "";
  const result = `<${tag}${attributesString && " " + attributesString}>${
    Array.isArray(children) ? children.join("") : children
  }</${tag}>`;

  return result;
};
