import TodoItem from "./TodoItem"
import "../styles/TodoList.css"

function TodoList({ todos, toggleComplete, deleteTodo }) {
  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo._id} todo={todo} toggleComplete={toggleComplete} deleteTodo={deleteTodo} />
      ))}
    </div>
  )
}

export default TodoList

