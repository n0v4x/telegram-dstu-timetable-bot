import { Context } from "vm";
import { IncomingMessage } from "telegraf/typings/telegram-types";
import DstuApi from "../services/DstuApi";

export const dstuApi = () => async (
  ctx: Context,
  next: () => Promise<void>
): Promise<IncomingMessage | void> => {
  const api = new DstuApi();

  Object.defineProperty(ctx, "dstu", {
    get: () => api
  });

  return await next();
};
