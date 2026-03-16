export type EditorGroup = {
  tabs: string[];
  activeFile: string | null;
};

export type EditorGroupsState = {
  left: EditorGroup;
  right: EditorGroup;
};

export type EditorLayoutState = {
  editorGroups: EditorGroupsState;
  activeGroup: "left" | "right";
  isSplitView: boolean;
};

export type EditorAction =
  | {
      type: "OPEN_FILE";
      payload: { fileId: string; group: "left" | "right" };
    }
  | {
      type: "SET_ACTIVE_FILE";
      payload: { fileId: string | null; group: "left" | "right" };
    }
  | {
      type: "SET_TABS";
      payload: { tabs: string[]; group: "left" | "right" };
    }
  | {
      type: "SET_ACTIVE_GROUP";
      payload: { group: "left" | "right" };
    }
  | {
      type: "SPLIT_EDITOR";
      payload: { isSplitView: boolean };
    }
  | {
      type: "MOVE_TAB";
      payload: { from: number; to: number; group: "left" | "right" };
    }
  | {
      type: "CLOSE_TAB";
      payload: { fileId: string; group: "left" | "right" };
    }
  | {
      type: "SWITCH_TAB";
      payload: { fileId: string; group: "left" | "right" };
    };

export const initialEditorLayoutState: EditorLayoutState = {
  editorGroups: {
    left: { tabs: [], activeFile: null },
    right: { tabs: [], activeFile: null },
  },
  activeGroup: "left",
  isSplitView: false,
};

export function editorReducer(
  state: EditorLayoutState,
  action: EditorAction
): EditorLayoutState {
  switch (action.type) {
    case "OPEN_FILE": {
      const { fileId, group } = action.payload;
      const groupState = state.editorGroups[group];
      const hasTab = groupState.tabs.includes(fileId);
      const tabs = hasTab ? groupState.tabs : [...groupState.tabs, fileId];

      return {
        ...state,
        editorGroups: {
          ...state.editorGroups,
          [group]: {
            tabs,
            activeFile: fileId,
          },
        },
      };
    }

    case "SET_ACTIVE_FILE":
    case "SWITCH_TAB": {
      const { fileId, group } = action.payload;
      return {
        ...state,
        editorGroups: {
          ...state.editorGroups,
          [group]: {
            ...state.editorGroups[group],
            activeFile: fileId,
          },
        },
      };
    }

    case "SET_TABS": {
      const { tabs, group } = action.payload;
      return {
        ...state,
        editorGroups: {
          ...state.editorGroups,
          [group]: {
            ...state.editorGroups[group],
            tabs,
          },
        },
      };
    }

    case "MOVE_TAB": {
      const { from, to, group } = action.payload;
      const currentTabs = state.editorGroups[group].tabs;
      if (
        from < 0 ||
        from >= currentTabs.length ||
        to < 0 ||
        to >= currentTabs.length ||
        from === to
      ) {
        return state;
      }
      const nextTabs = [...currentTabs];
      const [moved] = nextTabs.splice(from, 1);
      nextTabs.splice(to, 0, moved);

      return {
        ...state,
        editorGroups: {
          ...state.editorGroups,
          [group]: {
            ...state.editorGroups[group],
            tabs: nextTabs,
          },
        },
      };
    }

    case "CLOSE_TAB": {
      const { fileId, group } = action.payload;
      const groupState = state.editorGroups[group];
      const tabs = groupState.tabs.filter((t) => t !== fileId);
      let activeFile = groupState.activeFile;

      if (groupState.activeFile === fileId) {
        if (tabs.length === 0) {
          activeFile = null;
        } else {
          const closedIndex = groupState.tabs.indexOf(fileId);
          const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
          activeFile = tabs[newActiveIndex] ?? null;
        }
      }

      return {
        ...state,
        editorGroups: {
          ...state.editorGroups,
          [group]: {
            ...groupState,
            tabs,
            activeFile,
          },
        },
      };
    }

    case "SET_ACTIVE_GROUP": {
      return {
        ...state,
        activeGroup: action.payload.group,
      };
    }

    case "SPLIT_EDITOR": {
      return {
        ...state,
        isSplitView: action.payload.isSplitView,
      };
    }

    default:
      return state;
  }
}

