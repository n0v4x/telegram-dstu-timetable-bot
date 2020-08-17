import { MessageMedia, InputMediaPhoto } from "telegraf/typings/telegram-types";

export const imagesToMediaGroup = (images: Buffer[]): MessageMedia[] => {
  const result = images.map(
    (image) =>
      ({
        type: "photo",
        media: {
          source: image
        }
      } as InputMediaPhoto)
  );

  return result;
};
