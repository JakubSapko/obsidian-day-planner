import { TFile } from "obsidian";
import { get } from "svelte/store";

import { replaceTimestamp } from "../timestamp/timestamp";
import type { PlanItem } from "../types";

import { Timestamp, appStore, tasks } from "./timeline-store";

export async function updateTimestamps(id: string, timestamp: Timestamp) {
  tasks.update((previous) => {
    return previous.map((task) => {
      if (task.id !== id) {
        return task;
      }

      // todo: split effect from mapping
      updateDurationInDailyNote(task, timestamp);

      return {
        ...task,
        ...timestamp,
      };
    });
  });
}

async function updateDurationInDailyNote(
  task: PlanItem,
  startAndDuration: Timestamp,
) {
  const file = get(appStore).vault.getAbstractFileByPath(task.location.path);

  if (!(file instanceof TFile)) {
    // todo: we can do better
    throw new Error("Something is wrong");
  }

  const contents = await get(appStore).vault.read(file);
  // todo: this is inefficient
  const updated = contents
    .split("\n")
    .map((line, i) => {
      if (i === task.location.line) {
        return replaceTimestamp(task, startAndDuration);
      }

      return line;
    })
    .join("\n");

  await get(appStore).vault.modify(file, updated);
}
