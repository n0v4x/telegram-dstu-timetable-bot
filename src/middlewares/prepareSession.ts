import { Middleware } from "telegraf/typings";
import { Context } from "telegraf";
import User, { IUser } from "../models/User";
import { logJSON } from "../lib/common/console";

const prepareSession: Middleware<Context> = async ({ session, from }, next) => {
  if (!session.user) {
    const uid = from!.id;
    let user = await User.findById(uid).exec();

    if (!user) {
      user = new User({
        _id: uid,
        name: from?.first_name,
        lastName: from?.last_name,
        username: from?.username,
        savedGroups: []
      });

      await user.save();
    }

    session.user = user;

    console.log(logJSON(session.user));
  }

  if (!session.selected) {
    session.selected = {};
  }

  if (!session.search) {
    session.search = {};
  }

  return next();
};

export default prepareSession;
