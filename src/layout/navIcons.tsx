import type { ReactNode } from "react";
import {
  BoltIcon,
  ChatIcon,
  DocsIcon,
  DollarLineIcon,
  FileIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  InfoIcon,
  MailIcon,
  PageIcon,
  UserIcon,
  VideoIcon,
} from "../icons";
import type { NavItemConfig } from "./sidebarMenu";

const ICONS: Record<string, ReactNode> = {
  grid: <GridIcon />,
  file: <FileIcon />,
  folder: <FolderIcon />,
  video: <VideoIcon />,
  dollar: <DollarLineIcon />,
  group: <GroupIcon />,
  page: <PageIcon />,
  chat: <ChatIcon />,
  info: <InfoIcon />,
  mail: <MailIcon />,
  docs: <DocsIcon />,
  user: <UserIcon />,
  bolt: <BoltIcon />,
};

export function getNavIcon(iconKey?: string): ReactNode {
  if (!iconKey) return <GridIcon />;
  return ICONS[iconKey] ?? <GridIcon />;
}

export type NavItemWithIcon = NavItemConfig & { icon: ReactNode };

export function withNavIcons(items: NavItemConfig[]): NavItemWithIcon[] {
  return items.map((item) => ({
    ...item,
    icon: getNavIcon(item.iconKey),
  }));
}
