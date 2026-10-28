"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import {
  deleteTodo,
  renameTodo,
  toggleTodo,
  type Todo,
} from "@/lib/todo-store";

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const cancelledRef = useRef(false);

  function startEditing() {
    setDraft(todo.title);
    cancelledRef.current = false;
    setEditing(true);
  }

  function finishEditing(value: string) {
    setEditing(false);
    if (cancelledRef.current) return;
    if (value.trim() && value.trim() !== todo.title) {
      renameTodo(todo.id, value);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      cancelledRef.current = true;
      event.currentTarget.blur();
    }
  }

  return (
    <li
      className="todo-item"
      data-testid="todo-item"
      data-done={todo.done}
    >
      <input
        type="checkbox"
        className="todo-check"
        data-testid="todo-toggle"
        checked={todo.done}
        onChange={() => toggleTodo(todo.id)}
        aria-label={`Mark "${todo.title}" as ${todo.done ? "not done" : "done"}`}
      />

      {editing ? (
        <input
          type="text"
          className="todo-edit-input"
          data-testid="todo-edit-input"
          aria-label="Edit todo"
          value={draft}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(event) => finishEditing(event.currentTarget.value)}
        />
      ) : (
        <span
          className="todo-title"
          data-testid="todo-title"
          onDoubleClick={startEditing}
        >
          {todo.title}
        </span>
      )}

      {!editing && (
        <div className="todo-actions">
          <button
            type="button"
            className="todo-action"
            data-testid="todo-edit"
            aria-label={`Edit "${todo.title}"`}
            onClick={startEditing}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
              <path
                d="M4 20h4L19 9l-4-4L4 16v4Zm10.5-13.5 4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="todo-action todo-action-delete"
            data-testid="todo-delete"
            aria-label={`Delete "${todo.title}"`}
            onClick={() => deleteTodo(todo.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
              <path
                d="M6 6l12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}
    </li>
  );
}
