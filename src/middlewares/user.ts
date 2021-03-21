import { Middleware } from "telegraf/typings";
import { Context } from "telegraf";

const user: Middleware<Context> = (ctx, next) => {
  // if (ctx.session.user) {
  // } else {
  //   ctx.session.user = {
  //     savedGroups: []
  //   };
  // }
  // return next();
};

export default user;
