import { Context } from "telegraf";
import { IncomingMessage } from "telegraf/typings/telegram-types";

const MIN_LEN = 3;
const MAX_LEN = 20;
const ALLOWED_RANGE_CHARACTERS = "[a-zа-я0-9]";

const TEST_REGEX = new RegExp(`^${ALLOWED_RANGE_CHARACTERS}+$`, "i");
const REPLACE_REGEX = new RegExp(`${ALLOWED_RANGE_CHARACTERS}`, "ig");

export const validGroupName = () => async (
  ctx: Context,
  next: () => Promise<void>
): Promise<IncomingMessage | void> => {
  if (ctx.updateType !== "message" || !ctx.updateSubTypes.includes("text")) {
    return await ctx.reply("Отправьте название группы");
  }

  const groupName = ctx.message?.text || "";

  if (groupName.length < MIN_LEN) {
    return await ctx.reply(`⚠️ Минимальное кол-во символов: ${MIN_LEN}`);
  } else if (groupName.length > MAX_LEN) {
    return await ctx.reply(`⚠️ Максимальная кол-во символов: ${MAX_LEN}`);
  } else if (!TEST_REGEX.test(groupName)) {
    return await ctx.reply(
      `⚠️ Недопустимые символы в названии группы: "${groupName.replace(REPLACE_REGEX, "")}"`
    );
  }

  ctx.state.groupName = groupName;

  return await next();
};
