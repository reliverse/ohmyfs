import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import type {
  FavoriteItem,
  FileEntry,
  FileManagerState,
  FileOperation,
  FileViewMode,
  RecentItem,
  SearchResult,
} from "~/types/file";
import type { FileStructureDefinition } from "~/types/filesystem-engine";

// Action types
type FileManagerAction =
  | { type: "SET_CURRENT_PATH"; payload: string }
  | { type: "SET_SELECTED_ITEMS"; payload: string[] }
  | { type: "ADD_SELECTED_ITEM"; payload: string }
  | { type: "REMOVE_SELECTED_ITEM"; payload: string }
  | { type: "CLEAR_SELECTION" }
  | {
      type: "SET_CLIPBOARD";
      payload: { items: FileEntry[]; operation: "copy" | "cut" | null };
    }
  | { type: "SET_VIEW_MODE"; payload: Partial<FileViewMode> }
  | { type: "ADD_FAVORITE"; payload: FavoriteItem }
  | { type: "REMOVE_FAVORITE"; payload: string }
  | { type: "ADD_RECENT_ITEM"; payload: RecentItem }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | undefined }
  | { type: "ADD_OPERATION"; payload: FileOperation }
  | {
      type: "UPDATE_OPERATION";
      payload: { id: string; updates: Partial<FileOperation> };
    }
  | { type: "REMOVE_OPERATION"; payload: string }
  | { type: "SET_SEARCH_RESULTS"; payload: SearchResult | undefined }
  | { type: "LOAD_STATE"; payload: Partial<FileManagerState> }
  | { type: "SET_STRUCTURE_PANEL_OPEN"; payload: boolean }
  | { type: "SET_STRUCTURE_EDITOR_PATH"; payload: string | null }
  | { type: "ADD_STRUCTURE_HISTORY"; payload: FileStructureDefinition }
  | { type: "SET_STRUCTURE_HISTORY"; payload: FileStructureDefinition[] };

// Initial state
const initialState: FileManagerState = {
  currentPath: "",
  selectedItems: [],
  clipboard: {
    items: [],
    operation: null,
  },
  viewMode: {
    type: "list",
    sortBy: "name",
    sortOrder: "asc",
    showHidden: false,
    groupBy: "none",
  },
  favorites: [],
  recentItems: [],
  operations: [],
  isLoading: false,
  // Structure-related initial state
  structurePanelOpen: false,
  structureEditorPath: null,
  structureHistory: [],
};

// Reducer
function fileManagerReducer(
  state: FileManagerState,
  action: FileManagerAction
): FileManagerState {
  switch (action.type) {
    case "SET_CURRENT_PATH":
      return { ...state, currentPath: action.payload };
    case "SET_SELECTED_ITEMS":
      return { ...state, selectedItems: action.payload };
    case "ADD_SELECTED_ITEM":
      return {
        ...state,
        selectedItems: state.selectedItems.includes(action.payload)
          ? state.selectedItems
          : [...state.selectedItems, action.payload],
      };
    case "REMOVE_SELECTED_ITEM":
      return {
        ...state,
        selectedItems: state.selectedItems.filter(
          (item) => item !== action.payload
        ),
      };
    case "CLEAR_SELECTION":
      return { ...state, selectedItems: [] };
    case "SET_CLIPBOARD":
      return { ...state, clipboard: action.payload };
    case "SET_VIEW_MODE":
      return {
        ...state,
        viewMode: { ...state.viewMode, ...action.payload },
      };
    case "ADD_FAVORITE":
      return {
        ...state,
        favorites: [
          ...state.favorites.filter((f) => f.id !== action.payload.id),
          action.payload,
        ],
      };
    case "REMOVE_FAVORITE":
      return {
        ...state,
        favorites: state.favorites.filter((f) => f.id !== action.payload),
      };
    case "ADD_RECENT_ITEM": {
      const existingIndex = state.recentItems.findIndex(
        (r) => r.path === action.payload.path
      );
      const updatedRecent =
        existingIndex >= 0
          ? [
              action.payload,
              ...state.recentItems.slice(0, existingIndex),
              ...state.recentItems.slice(existingIndex + 1),
            ]
          : [action.payload, ...state.recentItems.slice(0, 9)]; // Keep only 10 recent items
      return { ...state, recentItems: updatedRecent };
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "ADD_OPERATION":
      return { ...state, operations: [...state.operations, action.payload] };
    case "UPDATE_OPERATION":
      return {
        ...state,
        operations: state.operations.map((op) =>
          op.id === action.payload.id
            ? { ...op, ...action.payload.updates }
            : op
        ),
      };
    case "REMOVE_OPERATION":
      return {
        ...state,
        operations: state.operations.filter((op) => op.id !== action.payload),
      };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "LOAD_STATE":
      return { ...state, ...action.payload };
    case "SET_STRUCTURE_PANEL_OPEN":
      return { ...state, structurePanelOpen: action.payload };
    case "SET_STRUCTURE_EDITOR_PATH":
      return { ...state, structureEditorPath: action.payload };
    case "ADD_STRUCTURE_HISTORY": {
      const newHistory = [action.payload, ...state.structureHistory].slice(
        0,
        10
      );
      return { ...state, structureHistory: newHistory };
    }
    case "SET_STRUCTURE_HISTORY":
      return { ...state, structureHistory: action.payload };
    default:
      return state;
  }
}

// Context
const FileManagerContext = createContext<{
  state: FileManagerState;
  dispatch: React.Dispatch<FileManagerAction>;
  actions: {
    setCurrentPath: (path: string) => void;
    setSelectedItems: (items: string[]) => void;
    addSelectedItem: (item: string) => void;
    removeSelectedItem: (item: string) => void;
    clearSelection: () => void;
    setClipboard: (
      items: FileEntry[],
      operation: "copy" | "cut" | null
    ) => void;
    setViewMode: (viewMode: Partial<FileViewMode>) => void;
    addFavorite: (favorite: FavoriteItem) => void;
    removeFavorite: (id: string) => void;
    addRecentItem: (item: RecentItem) => void;
    setLoading: (loading: boolean) => void;
    setError: (error?: string) => void;
    addOperation: (operation: FileOperation) => void;
    updateOperation: (id: string, updates: Partial<FileOperation>) => void;
    removeOperation: (id: string) => void;
    setSearchResults: (results?: SearchResult) => void;
    loadState: (state: Partial<FileManagerState>) => void;
    // Structure-related actions
    setStructurePanelOpen: (open: boolean) => void;
    setStructureEditorPath: (path: string | null) => void;
    addStructureHistory: (definition: FileStructureDefinition) => void;
    setStructureHistory: (history: FileStructureDefinition[]) => void;
  };
} | null>(null);

// Provider component
export function FileManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(fileManagerReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("ohmyfs-file-manager-state");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: "LOAD_STATE", payload: parsedState });
      } catch (error) {
        console.error("Failed to load file manager state:", error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "ohmyfs-file-manager-state",
      JSON.stringify({
        currentPath: state.currentPath,
        viewMode: state.viewMode,
        favorites: state.favorites,
        recentItems: state.recentItems,
      })
    );
  }, [state.currentPath, state.viewMode, state.favorites, state.recentItems]);

  // Action creators
  const actions = {
    setCurrentPath: useCallback((path: string) => {
      dispatch({ type: "SET_CURRENT_PATH", payload: path });
    }, []),

    setSelectedItems: useCallback((items: string[]) => {
      dispatch({ type: "SET_SELECTED_ITEMS", payload: items });
    }, []),

    addSelectedItem: useCallback((item: string) => {
      dispatch({ type: "ADD_SELECTED_ITEM", payload: item });
    }, []),

    removeSelectedItem: useCallback((item: string) => {
      dispatch({ type: "REMOVE_SELECTED_ITEM", payload: item });
    }, []),

    clearSelection: useCallback(() => {
      dispatch({ type: "CLEAR_SELECTION" });
    }, []),

    setClipboard: useCallback(
      (items: FileEntry[], operation: "copy" | "cut" | null) => {
        dispatch({ type: "SET_CLIPBOARD", payload: { items, operation } });
      },
      []
    ),

    setViewMode: useCallback((viewMode: Partial<FileViewMode>) => {
      dispatch({ type: "SET_VIEW_MODE", payload: viewMode });
    }, []),

    addFavorite: useCallback((favorite: FavoriteItem) => {
      dispatch({ type: "ADD_FAVORITE", payload: favorite });
    }, []),

    removeFavorite: useCallback((id: string) => {
      dispatch({ type: "REMOVE_FAVORITE", payload: id });
    }, []),

    addRecentItem: useCallback((item: RecentItem) => {
      dispatch({ type: "ADD_RECENT_ITEM", payload: item });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: "SET_LOADING", payload: loading });
    }, []),

    setError: useCallback((error?: string) => {
      dispatch({ type: "SET_ERROR", payload: error });
    }, []),

    addOperation: useCallback((operation: FileOperation) => {
      dispatch({ type: "ADD_OPERATION", payload: operation });
    }, []),

    updateOperation: useCallback(
      (id: string, updates: Partial<FileOperation>) => {
        dispatch({ type: "UPDATE_OPERATION", payload: { id, updates } });
      },
      []
    ),

    removeOperation: useCallback((id: string) => {
      dispatch({ type: "REMOVE_OPERATION", payload: id });
    }, []),

    setSearchResults: useCallback((results?: SearchResult) => {
      dispatch({ type: "SET_SEARCH_RESULTS", payload: results });
    }, []),

    loadState: useCallback((state: Partial<FileManagerState>) => {
      dispatch({ type: "LOAD_STATE", payload: state });
    }, []),

    // Structure-related actions
    setStructurePanelOpen: useCallback((open: boolean) => {
      dispatch({ type: "SET_STRUCTURE_PANEL_OPEN", payload: open });
    }, []),

    setStructureEditorPath: useCallback((path: string | null) => {
      dispatch({ type: "SET_STRUCTURE_EDITOR_PATH", payload: path });
    }, []),

    addStructureHistory: useCallback((definition: FileStructureDefinition) => {
      dispatch({ type: "ADD_STRUCTURE_HISTORY", payload: definition });
    }, []),

    setStructureHistory: useCallback((history: FileStructureDefinition[]) => {
      dispatch({ type: "SET_STRUCTURE_HISTORY", payload: history });
    }, []),
  };

  return (
    <FileManagerContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </FileManagerContext.Provider>
  );
}

// Hook to use the file manager context
export function useFileManager() {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error("useFileManager must be used within a FileManagerProvider");
  }
  return context;
}

// Convenience hooks
export function useFileManagerState() {
  const { state } = useFileManager();
  return state;
}

export function useFileManagerActions() {
  const { actions } = useFileManager();
  return actions;
}
