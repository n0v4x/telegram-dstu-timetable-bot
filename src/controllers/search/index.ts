import { Context } from "telegraf";
import Scene from "telegraf/scenes/base";
import { leave } from "telegraf/stage";
import menu from "../../menu";
import { GroupList } from "../../lib/parsers/DstuGroupListParser";

const MIN_LEN = 3;
const MAX_LEN = 20;
const ALLOWED_RANGE_CHARACTERS = "[a-zа-я0-9]";

const MAX_FOUND = 6;

const TEST_REGEX = new RegExp(`^${ALLOWED_RANGE_CHARACTERS}+$`, "i");
const REPLACE_REGEX = new RegExp(`${ALLOWED_RANGE_CHARACTERS}`, "ig");

const search = new Scene("search");

search.enter(async (ctx: Context) => {
  ctx.reply("Введите название группы: ");
});

search.leave(async (ctx: Context) => {
  await menu.replyToContext(ctx, "/foundGroups/");

  const { search } = ctx.session;

  if (search.error) {
    delete search.error;
  }

  if (search.foundGroups && search.foundGroups.length === 0) {
    delete search.foundGroups;
  }
});

search.on("text", async (ctx: Context) => {
  const groupName = ctx.message?.text || "";

  let groupList: GroupList | undefined;
  let error: string | undefined;

  if (groupName.length < MIN_LEN) {
    error = `⚠️ Минимальное кол-во символов: ${MIN_LEN}`;
  } else if (groupName.length > MAX_LEN) {
    error = `⚠️ Максимальная кол-во символов: ${MAX_LEN}`;
  } else if (!TEST_REGEX.test(groupName)) {
    error = `⚠️ Недопустимые символы в названии группы: "${groupName.replace(REPLACE_REGEX, "")}"`;
  } else {
    const searchNotifyMsg = await ctx.reply("🔎 Поиск группы...");

    try {
      groupList = await ctx.dstu.findGroup(groupName);
    } catch (e) {
      console.log(e);
      error = "😞 Неудалось найти группу.\nВозможные причины:\nСайти ДГТУ не доступен.";
    } finally {
      await ctx.deleteMessage(searchNotifyMsg.message_id);
    }

    if (groupList && groupList.groups.length === 0) {
      error = "😞 Группа не найдена.";
    }
  }

  const { search } = ctx.session;

  search.error = error;
  search.foundGroups = groupList ? groupList.groups.slice(0, MAX_FOUND) : [];

  ctx.scene.leave();
});

export default search;
