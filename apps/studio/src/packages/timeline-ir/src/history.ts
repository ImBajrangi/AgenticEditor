import { TimelineIR, TimelineMutationOp } from "./types";
import { TimelineMutator } from "./mutator";

export interface HistoryTransaction {
  id: string;
  description: string;
  timestamp: number;
  timelineBefore: TimelineIR;
  timelineAfter: TimelineIR;
  mutations: TimelineMutationOp[];
}

export interface SerializedHistoryState {
  past: TimelineIR[];
  present: TimelineIR;
  future: TimelineIR[];
  transactionLog: HistoryTransaction[];
  maxHistory: number;
}

export class TimelineHistoryManager {
  private past: TimelineIR[] = [];
  private present: TimelineIR;
  private future: TimelineIR[] = [];
  private transactionLog: HistoryTransaction[] = [];
  private maxHistory: number;

  constructor(initialTimeline: TimelineIR, maxHistory: number = 50) {
    this.present = initialTimeline;
    this.maxHistory = maxHistory;
  }

  public get current(): TimelineIR {
    return this.present;
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public pushMutation(mutation: TimelineMutationOp): TimelineIR {
    const next = TimelineMutator.apply(this.present, mutation);
    this.past.push(this.present);
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.present = next;
    this.future = [];
    return this.present;
  }

  /**
   * Pushes multiple mutations as a single atomic transaction (e.g. AI Edit Transaction #42).
   * One Cmd+Z undoes the entire batch!
   */
  public pushTransaction(mutations: TimelineMutationOp[], description: string = "Batch Edit Transaction"): TimelineIR {
    const before = this.present;
    let current = this.present;

    for (const mutation of mutations) {
      current = TimelineMutator.apply(current, mutation);
    }

    this.past.push(before);
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }

    this.transactionLog.push({
      id: `tx_${Date.now()}`,
      description,
      timestamp: Date.now(),
      timelineBefore: before,
      timelineAfter: current,
      mutations,
    });

    this.present = current;
    this.future = [];
    return this.present;
  }

  /**
   * Directly sets a new snapshot as a single undoable state (e.g. from an AI Run).
   */
  public pushSnapshot(newTimeline: TimelineIR, description: string = "Timeline Update"): TimelineIR {
    this.past.push(this.present);
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.present = newTimeline;
    this.future = [];
    return this.present;
  }

  public undo(): TimelineIR | null {
    if (!this.canUndo()) return null;
    const previous = this.past.pop()!;
    this.future.unshift(this.present);
    this.present = previous;
    return this.present;
  }

  public redo(): TimelineIR | null {
    if (!this.canRedo()) return null;
    const next = this.future.shift()!;
    this.past.push(this.present);
    this.present = next;
    return this.present;
  }

  public getTransactionLog(): HistoryTransaction[] {
    return this.transactionLog;
  }

  /**
   * Serializes the full history state for persistent storage (survives app restart).
   */
  public serialize(): string {
    const state: SerializedHistoryState = {
      past: this.past,
      present: this.present,
      future: this.future,
      transactionLog: this.transactionLog,
      maxHistory: this.maxHistory,
    };
    return JSON.stringify(state);
  }

  /**
   * Restores a TimelineHistoryManager instance from persistent serialized state.
   */
  public static deserialize(serialized: string): TimelineHistoryManager {
    const state: SerializedHistoryState = JSON.parse(serialized);
    const manager = new TimelineHistoryManager(state.present, state.maxHistory);
    manager.past = state.past || [];
    manager.future = state.future || [];
    manager.transactionLog = state.transactionLog || [];
    return manager;
  }
}
