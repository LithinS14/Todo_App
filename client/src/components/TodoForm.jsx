"use client"

import { useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import "../styles/TodoForm.css"

function TodoForm({ addTodo }) {
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState(null)
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("Task title cannot be empty")
      return
    }

    addTodo({
      title: title.trim(),
      dueDate: dueDate ? dueDate.toISOString() : null,
      completed: false,
    })

    setTitle("")
    setDueDate(null)
    setError("")
  }

  return (
    <div className="todo-form-container">
      <h2>Add New Task</h2>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit} className="todo-form">
        <div className="form-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-input"
          />

          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            placeholderText="Due date (optional)"
            dateFormat="MMM d, yyyy"
            minDate={new Date()}
            className="date-picker"
            isClearable
          />

          <button type="submit" className="add-button">
            Add Task
          </button>
        </div>
      </form>
    </div>
  )
}

export default TodoForm

