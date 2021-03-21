import { Context } from "telegraf";
import { MenuTemplate } from "telegraf-inline-menu";
import weekTypeMenu from "../week";
import Group, { IGroup } from "../../models/Group";
import User from "../../models/User";
import { withBackMenuButtons } from "../general";

const groupBy = (key: keyof IGroup, value: any) => (group: IGroup) => group[key] === value;
const allGroupsExcept = (key: keyof IGroup, value: any) => (group: IGroup) => group[key] !== value;

const userGroupMenu = new MenuTemplate<Context>(({ session, match }) => {
  const { selected, user, deleted } = session;

  const groupName = (match || [])[1] || "";

  selected.group = deleted.group || user.savedGroups.find(groupBy("name", groupName));

  return selected.group
    ? {
        parse_mode: "Markdown",
        text:
          `*${selected.group.name}*\n\n` +
          `Курс: *${selected.group.course}*\n` +
          `Семестр: *${selected.group.semester}*\n` +
          `Факультет: *${selected.group.faculty}*\n` +
          `Специальность: *${selected.group.specialty}*`
      }
    : "Ошибка. Группа не найдена";
});

userGroupMenu.submenu("Расписание", "weekType", weekTypeMenu, {
  hide: async ({ session }) => !!session.selected.group
});

userGroupMenu.interact("Удалить", "delete", {
  hide: async ({ session }) => !!session.selected.group || !session.deleted.group,
  do: async ({ session }) => {
    const { user, selected, deleted } = session;

    if (selected.group) {
      user
        .updateOne({
          $pull: {
            savedGroups: selected.group.id
          }
        })
        .exec();

      // await User.updateOne(
      //   { _id: user.id },
      //   {
      //     $pull: {
      //       savedGroups: selected.group.id
      //     }
      //   }
      // );

      deleted.group = selected.group;
      user.savedGroups = user.savedGroups.filter(allGroupsExcept("_id", deleted.group.id));
    }

    return true;
  }
});

userGroupMenu.interact("Сохранить", "add", {
  hide: async ({ session }) => !!session.selected.group || !!session.deleted.group,
  do: async ({ session }) => {
    const { user, deleted } = session;

    if (deleted.group) {
      let group = await Group.findById(deleted.group.id).exec();

      if (!group) {
        group = await new Group(deleted.group).save();
      }

      await User.updateOne(
        { _id: user.id },
        {
          $addToSet: {
            savedGroups: deleted.group.id
          }
        }
      );

      user.savedGroups.push(group);

      delete deleted.group;
    }

    return true;
  }
});

withBackMenuButtons(userGroupMenu);

export default userGroupMenu;
