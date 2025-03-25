"use client"

import { format } from "date-fns"
import "../styles/TodoItem.css"

function TodoItem({ todo, toggleComplete, deleteTodo }) {
  const formatDueDate = (dateString) => {
    if (!dateString) return null

    const date = new Date(dateString)
    return format(date, "MMM d, yyyy")
  }

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <div className="todo-item-content">
        <label className="checkbox-container">
          <input type="checkbox" checked={todo.completed} onChange={() => toggleComplete(todo._id)} />
          <span className="checkmark"></span>
        </label>

        <div className="todo-details">
          <p className="todo-title">{todo.title}</p>
          {todo.dueDate && <span className="todo-due-date">Due: {formatDueDate(todo.dueDate)}</span>}
        </div>
      </div>

      <button className="delete-button" onClick={() => deleteTodo(todo._id)} aria-label="Delete task">
        ×
      </button>
    </div>
  )
}

export default TodoItem

