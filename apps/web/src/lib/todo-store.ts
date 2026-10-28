import { useSyncExternalStore } from "react";

export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

export type Filter = "all" | "active" | "done";

const STORAGE_KEY = "todo-app:todos";

const SEED_TODOS: Todo[] = [
  { id: "seed-1", title: "Water the plants", done: false },
  { id: "seed-2", title: "Plan the weekend hike", done: false },
  { id: "seed-3", title: "Read a chapter of a good book", done: true },
];

const listeners = new Set<() => void>();

// Lazily loaded from localStorage on the client; never touched during server rendering.
let current: Todo[] | null = null;

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === "string" &&
    typeof todo.title === "string" &&
    typeof todo.done === "boolean"
  );
}

function loadTodos(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First visit: persist the examples so they behave like real data from now on.
      writeTodos(SEED_TODOS);
      return SEED_TODOS;
    }
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) && data.every(isTodo) ? data : SEED_TODOS;
  } catch {
    return SEED_TODOS;
  }
}

function writeTodos(todos: Todo[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage may be unavailable (private mode, quota); keep working in memory.
  }
}

function getSnapshot(): Todo[] {
  current ??= loadTodos();
  return current;
}

function getServerSnapshot(): Todo[] {
  return SEED_TODOS;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: Todo[]) {
  current = next;
  writeTodos(next);
  listeners.forEach((listener) => listener());
}

export function useTodos(): Todo[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addTodo(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const todo: Todo = { id, title: trimmed, done: false };
  update([...getSnapshot(), todo]);
}

export function toggleTodo(id: string) {
  update(
    getSnapshot().map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo,
    ),
  );
}

export function renameTodo(id: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;
  update(
    getSnapshot().map((todo) =>
      todo.id === id ? { ...todo, title: trimmed } : todo,
    ),
  );
}

export function deleteTodo(id: string) {
  update(getSnapshot().filter((todo) => todo.id !== id));
}

export function clearCompleted() {
  update(getSnapshot().filter((todo) => !todo.done));
}

export function matchesFilter(todo: Todo, filter: Filter): boolean {
  if (filter === "active") return !todo.done;
  if (filter === "done") return todo.done;
  return true;
}
