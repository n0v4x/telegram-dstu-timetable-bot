import { createBackMainMenuButtons, MenuTemplate, resendMenuToContext } from "telegraf-inline-menu";
import { Context } from "telegraf";
import { Session } from "telegraf/typings";
import { Message } from "telegraf/typings/telegram-types";
import menu from ".";

export const sendMainMenu = async (ctx: Context): Promise<Message> =>
  resendMenuToContext(menu.rootMenu, ctx, "/");

export const withBackMenuButtons = (menuTemplate: MenuTemplate<Context>): void => {
  menuTemplate.manualRow(createBackMainMenuButtons("Назад", "Главное меню"));
};
