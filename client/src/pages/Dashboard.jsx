"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import TodoForm from "../components/TodoForm"
import TodoList from "../components/TodoList"
import TodoFilter from "../components/TodoFilter"
import { useAuth } from "../contexts/AuthContext"
import "../styles/Dashboard.css"

function Dashboard() {
  const { currentUser } = useAuth()
  const [todos, setTodos] = useState([])
  const [filteredTodos, setFilteredTodos] = useState([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTodos()
  }, [])

  useEffect(() => {
    filterTodos()
  }, [todos, filter])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      const response = await axios.get("http://localhost:5000/api/todos")
      setTodos(response.data)
      setError(null)
    } catch (error) {
      console.error("Error fetching todos:", error)
      setError("Failed to load tasks. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (todo) => {
    try {
      const response = await axios.post("http://localhost:5000/api/todos", todo)
      setTodos([...todos, response.data])
    } catch (error) {
      console.error("Error adding todo:", error)
      setError("Failed to add task. Please try again.")
    }
  }

  const toggleComplete = async (id) => {
    try {
      const todoToUpdate = todos.find((todo) => todo._id === id)
      const response = await axios.put(`http://localhost:5000/api/todos/${id}`, {
        completed: !todoToUpdate.completed,
      })

      setTodos(todos.map((todo) => (todo._id === id ? { ...todo, completed: !todo.completed } : todo)))
    } catch (error) {
      console.error("Error updating todo:", error)
      setError("Failed to update task. Please try again.")
    }
  }

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`)
      setTodos(todos.filter((todo) => todo._id !== id))
    } catch (error) {
      console.error("Error deleting todo:", error)
      setError("Failed to delete task. Please try again.")
    }
  }

  const filterTodos = () => {
    switch (filter) {
      case "active":
        setFilteredTodos(todos.filter((todo) => !todo.completed))
        break
      case "completed":
        setFilteredTodos(todos.filter((todo) => todo.completed))
        break
      default:
        setFilteredTodos(todos)
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name}</h1>
        <p>Manage your tasks efficiently</p>
      </div>

      <div className="dashboard-content">
        <TodoForm addTodo={addTodo} />

        {error && <div className="error-message">{error}</div>}

        <TodoFilter filter={filter} setFilter={setFilter} />

        {loading ? (
          <div className="loading">Loading your tasks...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="empty-state">
            <p>
              {filter === "all"
                ? "You have no tasks. Add a new task to get started!"
                : filter === "active"
                  ? "You have no active tasks."
                  : "You have no completed tasks."}
            </p>
          </div>
        ) : (
          <TodoList todos={filteredTodos} toggleComplete={toggleComplete} deleteTodo={deleteTodo} />
        )}
      </div>
    </div>
  )
}

export default Dashboard

