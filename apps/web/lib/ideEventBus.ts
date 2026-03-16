export type IdeEventMap = {
  FILE_OPEN: { fileId: string; group: "left" | "right" };
  FILE_SAVE: { fileId: string };
  FILE_CREATE: { id: string; path: string; parentPath: string; type: "file" | "folder" };
  FILE_RENAME: { id: string; oldPath: string; newPath: string };
  FILE_DELETE: { id: string; path: string };
  FILE_MOVE: { id: string; oldPath: string; newPath: string; targetParentPath: string };
  TAB_SWITCH: { fileId: string; group: "left" | "right" };
  EDITOR_SPLIT: { isSplitView: boolean };
  EDITOR_FOCUS: { group: "left" | "right" };
  TERMINAL_OPEN: undefined;
};

export type IdeEventType = keyof IdeEventMap;
export type IdeEventHandler<K extends IdeEventType> = (payload: IdeEventMap[K]) => void;

class IdeEventBus {
  // Keep storage untyped internally; enforce types at the API boundary.
  private listeners = new Map<IdeEventType, Set<(payload: unknown) => void>>();
  private handlerMap = new Map<IdeEventType, Map<Function, (payload: unknown) => void>>();

  emit<K extends IdeEventType>(event: K, payload: IdeEventMap[K]) {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    // Snapshot iteration to avoid issues if handlers subscribe/unsubscribe during emit.
    [...set].forEach((handler) => handler(payload));
  }

  on<K extends IdeEventType>(event: K, handler: IdeEventHandler<K>) {
    const perEvent = this.handlerMap.get(event) ?? new Map<Function, (payload: unknown) => void>();
    const existing = perEvent.get(handler as unknown as Function);
    const wrapped =
      existing ?? ((payload: unknown) => handler(payload as IdeEventMap[K]));
    perEvent.set(handler as unknown as Function, wrapped);
    this.handlerMap.set(event, perEvent);

    const set = this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    set.add(wrapped);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  off<K extends IdeEventType>(event: K, handler: IdeEventHandler<K>) {
    const set = this.listeners.get(event);
    if (!set) return;
    const perEvent = this.handlerMap.get(event);
    const wrapped = perEvent?.get(handler as unknown as Function);
    if (!wrapped) return;
    set.delete(wrapped);
    perEvent?.delete(handler as unknown as Function);
  }
}

// Single lightweight instance (module singleton).
export const ideEventBus = new IdeEventBus();

