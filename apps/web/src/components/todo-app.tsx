"use client";

import { useState, type FormEvent } from "react";
import { TodoItem } from "@/components/todo-item";
import {
  addTodo,
  clearCompleted,
  matchesFilter,
  useTodos,
  type Filter,
} from "@/lib/todo-store";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "done", label: "Done" },
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: "Nothing here yet. Add your first task above.",
  active: "No active tasks. Enjoy the calm!",
  done: "No completed tasks yet.",
};

export function TodoApp() {
  const todos = useTodos();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const remaining = todos.filter((todo) => !todo.done).length;
  const completed = todos.length - remaining;
  const visible = todos.filter((todo) => matchesFilter(todo, filter));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTodo(draft);
    setDraft("");
  }

  return (
    <main className="page">
      <div className="card">
        <header className="card-header">
          <h1 className="title" data-testid="app-title">
            Todos
          </h1>
          <p className="subtitle">Stay on top of your day, one task at a time.</p>
        </header>

        <form className="add-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="add-input"
            data-testid="new-todo-input"
            aria-label="New todo"
            placeholder="What needs to be done?"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            className="add-button"
            data-testid="add-todo-button"
            disabled={!draft.trim()}
          >
            Add
          </button>
        </form>

        <div className="filters" role="group" aria-label="Filter todos">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="filter"
              data-testid={`filter-${value}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length > 0 ? (
          <ul className="todo-list" data-testid="todo-list">
            {visible.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        ) : (
          <p className="empty" data-testid="empty-state">
            {EMPTY_MESSAGES[filter]}
          </p>
        )}

        <footer className="card-footer">
          <span className="counter" data-testid="todo-count">
            {remaining} {remaining === 1 ? "item" : "items"} left
          </span>
          <button
            type="button"
            className="clear-completed"
            data-testid="clear-completed"
            disabled={completed === 0}
            onClick={clearCompleted}
          >
            Clear completed
          </button>
        </footer>
      </div>
    </main>
  );
}
