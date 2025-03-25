const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const cron = require("node-cron")
require("dotenv").config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
.connect(process.env.MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err))

// Models
const userSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
createdAt: { type: Date, default: Date.now },
})

const todoSchema = new mongoose.Schema({
title: { type: String, required: true },
completed: { type: Boolean, default: false },
dueDate: { type: Date },
user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)
const Todo = mongoose.model("Todo", todoSchema)

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
try {
const { name, email, password } = req.body

// Check if user already exists
const existingUser = await User.findOne({ email })
if (existingUser) {
    return res.status(400).json({ message: "User already exists" })
}

// Hash password
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt)

// Create new user
const user = new User({
    name,
    email,
    password: hashedPassword,
})

await user.save()

// Create token
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

res.status(201).json({
    token,
    user: {
    id: user._id,
    name: user.name,
    email: user.email,
    },
})
} catch (error) {
console.error("Registration error:", error)
res.status(500).json({ message: "Server error" })
}
})

app.post("/api/auth/login", async (req, res) => {
try {
const { email, password } = req.body

// Check if user exists
const user = await User.findOne({ email })
if (!user) {
    return res.status(400).json({ message: "Invalid credentials" })
}

// Validate password
const isMatch = await bcrypt.compare(password, user.password)
if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" })
}

// Create token
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

res.json({
    token,
    user: {
    id: user._id,
    name: user.name,
    email: user.email,
    },
})
} catch (error) {
console.error("Login error:", error)
res.status(500).json({ message: "Server error" })
}
})

app.get("/api/auth/me", async (req, res) => {
try {
const token = req.headers.authorization?.split(" ")[1]

if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" })
}

const decoded = jwt.verify(token, process.env.JWT_SECRET)
const user = await User.findById(decoded.id).select("-password")

if (!user) {
    return res.status(404).json({ message: "User not found" })
}

res.json({ user })
} catch (error) {
console.error("Auth check error:", error)
res.status(401).json({ message: "Token is not valid" })
}
})

// Middleware to verify token
const auth = async (req, res, next) => {
try {
const token = req.headers.authorization?.split(" ")[1]

if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" })
}

const decoded = jwt.verify(token, process.env.JWT_SECRET)
req.user = decoded
next()
} catch (error) {
res.status(401).json({ message: "Token is not valid" })
}
}

// Todo Routes
app.get("/api/todos", auth, async (req, res) => {
try {
const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 })
res.json(todos)
} catch (error) {
console.error("Get todos error:", error)
res.status(500).json({ message: "Server error" })
}
})

app.post("/api/todos", auth, async (req, res) => {
try {
const { title, completed, dueDate } = req.body

const newTodo = new Todo({
    title,
    completed,
    dueDate,
    user: req.user.id,
})

const todo = await newTodo.save()
res.status(201).json(todo)
} catch (error) {
console.error("Create todo error:", error)
res.status(500).json({ message: "Server error" })
}
})

app.put("/api/todos/:id", auth, async (req, res) => {
try {
const todo = await Todo.findById(req.params.id)

if (!todo) {
    return res.status(404).json({ message: "Todo not found" })
}

// Check if todo belongs to user
if (todo.user.toString() !== req.user.id) {
    return res.status(401).json({ message: "Not authorized" })
}

const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })

res.json(updatedTodo)
} catch (error) {
console.error("Update todo error:", error)
res.status(500).json({ message: "Server error" })
}
})

app.delete("/api/todos/:id", auth, async (req, res) => {
try {
const todo = await Todo.findById(req.params.id)

if (!todo) {
    return res.status(404).json({ message: "Todo not found" })
}

// Check if todo belongs to user
if (todo.user.toString() !== req.user.id) {
    return res.status(401).json({ message: "Not authorized" })
}

await Todo.findByIdAndDelete(req.params.id)

res.json({ message: "Todo removed" })
} catch (error) {
console.error("Delete todo error:", error)
res.status(500).json({ message: "Server error" })
}
})

// Email notification setup
const transporter = nodemailer.createTransport({
service: process.env.EMAIL_SERVICE,
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASSWORD,
},
})

// Schedule daily email reminders at 8 PM
cron.schedule("0 20 * * *", async () => {
try {
const today = new Date()
today.setHours(0, 0, 0, 0)

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

// Find users with due tasks
const users = await User.find()

for (const user of users) {
    // Find due tasks for this user
    const dueTodos = await Todo.find({
    user: user._id,
    dueDate: {
        $gte: today,
        $lt: tomorrow,
    },
    completed: false,
    })

    if (dueTodos.length > 0) {
    // Send email reminder
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "TodoApp: Tasks Due Today",
        html: `
        <h2>Hello ${user.name},</h2>
        <p>You have ${dueTodos.length} task(s) due today:</p>
        <ul>
            ${dueTodos.map((todo) => `<li>${todo.title}</li>`).join("")}
        </ul>
        <p>Login to your TodoApp account to complete these tasks.</p>
        <p>Best regards,<br>TodoApp Team</p>
        `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Reminder email sent to ${user.email}`)
    }
}
} catch (error) {
console.error("Error sending reminder emails:", error)
}
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

