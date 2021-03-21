import { Context } from "telegraf";
import { IncomingMessage } from "telegraf/typings/telegram-types";
import { Group, GroupList } from "../lib/parsers/DstuGroupListParser";
import { IGroup } from "../models/Group";

export const group = () => async (
  ctx: Context,
  next: () => Promise<void>
): Promise<IncomingMessage | void> => {
  const { groupName } = ctx.session;

  // let group: IGroup | null = null;
  // let groupList: GroupList | null = null;

  // try {
  //   ctx.reply("🔎 Поиск группы...");

  //   groupList = await ctx.dstu.findGroup(groupName);

  //   group = groupList.groups[0];
  // } catch (e) {
  //   return ctx.reply("😞 Неудалось найти группу.\nВозможные причины:\nСайти ДГТУ не доступен.");
  // }

  // if (group && group.name.toLowerCase() === groupName.toLowerCase()) {
  //   ctx.session.group = group;
  // } else {
  //   return ctx.reply("😞 Группа не найдена.");
  // }

  return await next();
};
