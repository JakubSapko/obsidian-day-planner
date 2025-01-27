<script lang="ts">
  import type { Moment } from "moment";
  import type { Readable } from "svelte/store";

  import { editCancellation, editConfirmation } from "../../store/edit";
  import { getHorizontalPlacing } from "../../store/horizontal-placing";
  import { time } from "../../store/time";
  import {
    durationToSize,
    roundToSnapStep,
    timeToTimelineOffset,
  } from "../../store/timeline-store";
  import { getRelationToNow } from "../../util/moment";
  import { useDrag } from "../hooks/use-drag";
  import { useResize } from "../hooks/use-resize";
  import { watch } from "../hooks/watch";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  import TaskCircleIcon from "./icons/circle.svelte";
  import TaskCompletedIcon from "./icons/check-circle.svelte";

  export let text: string;
  export let id: string;
  export let startTime: Moment;
  export let endTime: Moment;
  export let startMinutes: number | undefined = undefined;
  export let durationMinutes: number;
  export let pointerYOffset: Readable<number>;
  export let isGhost = false;
  export let isCompleted: boolean;

  const {
    dragging,
    cursor,
    pointerYOffsetToTaskStart,
    startMove,
    confirmMove,
    cancelMove,
  } = useDrag();

  const { resizing, cancelResize, startResize, confirmResize } = useResize();

  $: initialOffset = isGhost
    ? roundToSnapStep($pointerYOffset)
    : $timeToTimelineOffset(startMinutes);

  $: offset = $dragging
    ? roundToSnapStep($pointerYOffset - $pointerYOffsetToTaskStart)
    : initialOffset;

  $: offsetToPointer = $pointerYOffset - initialOffset;

  $: height = $resizing
    ? roundToSnapStep(offsetToPointer)
    : $durationToSize(durationMinutes);

  $: horizontalPlacing = $getHorizontalPlacing(id);

  $: relationToNow = isGhost
    ? "future"
    : getRelationToNow($time, startTime, endTime);

  watch(editConfirmation, () => {
    confirmMove(offset, id, durationMinutes);
    confirmResize(id, height, startMinutes);
  });

  watch(editCancellation, () => {
    cancelMove();
    cancelResize();
  });
</script>

<div
  style:height="{height}px"
  style:transform="translateY({offset}px)"
  style:cursor={$cursor}
  style:width="{horizontalPlacing.widthPercent}%"
  style:left="{horizontalPlacing.xOffsetPercent}%"
  class="gap-box absolute-stretch-x"
>
  <div
    class="task {relationToNow}"
    class:is-ghost={isGhost}
    class:past={relationToNow === "past"}
    class:present={relationToNow === "present"}
    class:is-completed={isCompleted}
    on:mousedown|stopPropagation={(e) => {
      startMove(e);
    }}
  >
    {#if isCompleted}
      <TaskCompletedIcon />
    {:else}
      <TaskCircleIcon />
    {/if}
    <RenderedMarkdown {text} />
    <div
      class="resize-handle absolute-stretch-x"
      on:mousedown|stopPropagation={startResize}
    ></div>
  </div>
</div>

<style>
  .gap-box {
    display: flex;
    padding-right: 3px;
    padding-left: 3px;
    transition: 0.05s linear;
  }

  .task {
    overflow: visible;
    display: flex;
    flex: 1 0 0;
    align-items: flex-start;
    justify-content: flex-start;

    padding: 5px;

    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    background-color: var(--background-primary);
    border: 1px solid var(--text-faint);
    border-radius: var(--radius-s);
  }

  .past {
    background-color: var(--background-secondary);
  }

  .present {
    border-color: var(--color-accent);
  }

  .is-ghost {
    opacity: 0.6;
  }

  .is-completed {
    color: var(--text-faint);
    background-color: #7b9c3c;
    text-decoration: line-through;
  }

  .resize-handle {
    cursor: s-resize;
    bottom: -15px;
    height: 30px;
  }
</style>
