import { Context } from "telegraf";
import { MenuTemplate } from "telegraf-inline-menu";
import weekTypeMenu from "../week";
import Group, { IGroup } from "../../models/Group";
import User from "../../models/User";
import { withBackMenuButtons } from "../general";

const groupBy = (key: keyof IGroup, value: any) => (group: IGroup) => group[key] === value;

const foundGroupMenu = new MenuTemplate<Context>(({ session, match }) => {
  const groupName = (match || [])[1] || "";

  const { selected } = session;

  selected.group = session.search.foundGroups?.find(groupBy("name", groupName));
  session.userHasSelectedGroup =
    session.user.savedGroups.findIndex(groupBy("id", selected.group?.id)) !== -1;

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

foundGroupMenu.submenu("Расписание", "weekType", weekTypeMenu, {
  hide: async ({ session }) => !!session.selected.group
});

foundGroupMenu.interact("Удалить", "delete", {
  hide: async ({ session }) => !!session.selected.group || !session.userHasSelectedGroup,
  do: async (ctx) => {
    const { user, selected, userHasSelectedGroup } = ctx.session;

    if (selected.group && userHasSelectedGroup) {
      await user
        .update({
          $pull: {
            savedGroups: selected.group.id
          }
        })
        .exec();
      // await User.updateOne({ _id: user.id });

      // user.savedGroups = user.savedGroups.filter(filterAllGroupsExcept("id", selected.group.id));
    }

    return true;
  }
});

foundGroupMenu.interact("Сохранить", "add", {
  hide: async ({ session }) => !!session.selected.group || !session.userHasSelectedGroup,
  do: async (ctx) => {
    const { user, selected, userHasSelectedGroup } = ctx.session;

    if (selected.group && !userHasSelectedGroup) {
      let group = await Group.findById(selected.group.id).exec();

      if (!group) {
        group = await new Group(selected.group).save();
      }

      await user
        .update({
          $addToSet: {
            savedGroups: group.id
          }
        })
        .exec();

      // await User.updateOne(
      //   { _id: user.id },
      //   {
      //     $addToSet: {
      //       savedGroups: group.id
      //     }
      //   }
      // );

      // user.savedGroups.push(group);
    }

    return true;
  }
});

/* 
let userHasSelectedGroup: boolean;

const foundGroupMenu = new MenuTemplate<Context>(({ session, match }) => {
  const groupName = (match || [])[1] || "";
  const isUserGroups = /userGroups/.test((match || [])[0] || "");
  const groups = isUserGroups ? session.user.savedGroups : session.search.foundGroups;

  const group = groups?.find(groupBy("name", groupName));

  if (group) {
    const { selected, user } = session;

    selected.group = group;
    userHasSelectedGroup = user.savedGroups.findIndex(groupBy("name", groupName)) !== -1;

    return {
      parse_mode: "Markdown",
      text: `*${group.name}*\n\nКурс: *${group.course}*\nСеместр: *${group.semester}*\nФакультет: *${group.faculty}*\nСпециальность: *${group.specialty}*`
    };
  }

  return "Ошибка. Группа не найдена";
});

foundGroupMenu.submenu("Расписание", "weekType", weekTypeMenu);

foundGroupMenu.interact("Удалить", "delete", {
  hide: async () => !userHasSelectedGroup,
  do: async (ctx) => {
    const { user, selected } = ctx.session;

    if (selected.group && userHasSelectedGroup) {
      await User.updateOne(
        { _id: user.id },
        {
          $pull: {
            savedGroups: selected.group.id
          }
        }
      );

      user.savedGroups = user.savedGroups.filter(filterAllGroupsExcept("id", selected.group.id));
    }

    return true;
  }
});

foundGroupMenu.interact("Сохранить", "add", {
  hide: async () => userHasSelectedGroup,
  do: async (ctx) => {
    const { user, selected } = ctx.session;

    if (selected.group && !userHasSelectedGroup) {
      let group = await Group.findById(selected.group.id).exec();

      if (!group) {
        const gid = selected.group.id;

        group = new Group({
          _id: gid,
          name: selected.group.name,
          course: selected.group.course,
          semester: selected.group.semester,
          specialty: selected.group.specialty,
          faculty: selected.group.faculty
        });

        await group.save();
      }

      await User.updateOne(
        { _id: user.id },
        {
          $addToSet: {
            savedGroups: group.id
          }
        }
      );

      user.savedGroups.push(group);
    }

    return true;
  }
});
 */
withBackMenuButtons(foundGroupMenu);

export default foundGroupMenu;
