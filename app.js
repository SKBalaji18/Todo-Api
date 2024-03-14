const express = require('express')
const app = express()

const format = require('date-fns/format') //format(date, format, [options])
const isValid = require('date-fns/isValid') //isValid(date)
const toDate = require('date-fns/toDate')

const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const checkQuery = async (request, response, next) => {
  const {search_q, priority, status, category, date} = request.query

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isStatusValid = statusArray.includes(status)
    if (isStatusValid === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const prioritiesArray = ['HIGH', 'MEDIUM', 'LOW']
    const isPriorityValid = prioritiesArray.includes(priority)
    if (isPriorityValid === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (category !== undefined) {
    const categoriesArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryValid = categoriesArray.includes(category)
    if (isCategoryValid === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (date !== undefined) {
    try {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd') //it will provide string date
      const validDate = toDate(new Date(formattedDate)) // it will convert string date into dateTime foramt
      const isDateValid = await isValid(validDate) //isValid is a promise function and it is only run in date time format if we give string format it will throw a error so we use try catch method
      if (isDateValid === true) {
        request.date = formattedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.search_q = search_q
  next()
}

const checkBody = async (request, response, next) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isStatusValid = statusArray.includes(status)
    if (isStatusValid === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const prioritiesArray = ['HIGH', 'MEDIUM', 'LOW']
    const isPriorityValid = prioritiesArray.includes(priority)
    if (isPriorityValid === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (category !== undefined) {
    const categoriesArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryValid = categoriesArray.includes(category)
    if (isCategoryValid === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd') //it will provide string date
      const validDate = toDate(new Date(formattedDate)) // it will convert string date into dateTime foramt
      const isDateValid = await isValid(validDate) //isValid is a promise object and it is only run in date time format if we give string format it will throw a error so we use try catch method
      if (isDateValid === true) {
        request.dueDate = formattedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.id = id
  request.todo = todo
  next()
}

//API-1

app.get('/todos/', checkQuery, checkBody, async (request, response) => {
  const {
    search_q = '',
    priority = '',
    status = '',
    category = '',
    date = '',
  } = request

  const getTodosQuery = `
  SELECT * FROM todo
  WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' AND 
  status LIKE '%${status}%' AND category LIKE '%${category}%' AND due_date LIKE '%${date}%' ;`

  const getTodos = await db.all(getTodosQuery)
  const ans = todo => {
    return {
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    }
  }
  response.send(getTodos.map(eachItem => ans(eachItem)))
})

//API-2

app.get('/todos/:todoId', checkQuery, checkBody, async (request, response) => {
  const {todoId} = request.params
  const getTodosQuery = `
  SELECT * FROM todo
  WHERE id = ${todoId};`

  const getTodo = await db.get(getTodosQuery)
  const ans = todo => {
    return {
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    }
  }
  response.send(ans(getTodo))
})

//API-3

app.get('/agenda/', checkQuery, checkBody, async (request, response) => {
  const {
    search_q = '',
    priority = '',
    status = '',
    category = '',
    date = '',
  } = request

  const getTodosViaDateQuery = `
  SELECT * FROM todo
  WHERE due_date LIKE '%${date}%' ;`

  const getTodosByDate = await db.all(getTodosViaDateQuery)
  const ans = todo => {
    return {
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    }
  }
  response.send(getTodosByDate.map(eachItem => ans(eachItem)))
})

//API-4

app.post('/todos/', checkQuery, checkBody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request

  const postTodosQuery = `
  INSERT INTO todo(id,todo,category,priority,status,due_date)
  VALUES (${id},'${todo}','${category}','${priority}','${status}','${dueDate}');`

  const postTodos = await db.run(postTodosQuery)

  response.send('Todo Successfully Added')
})

//API-5

app.put('/todos/:todoId', checkQuery, checkBody, async (request, response) => {
  const {todo, priority, status, category, dueDate} = request
  const {todoId} = request.params
  let updateTodoQuery = ''
  let updatedColumn = ''
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET 
          status = '${status}'
        WHERE id = ${todoId};`
      updatedColumn = 'Status'
      break
    case priority !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET 
          priority = '${priority}'
        WHERE id = ${todoId};`
      updatedColumn = 'Priority'
      break
    case category !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET 
          category = '${category}'
        WHERE id = ${todoId};`
      updatedColumn = 'Category'
      break
    case todo !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET 
          todo = '${todo}'
        WHERE id = ${todoId};`
      updatedColumn = 'Todo'
      break
    case dueDate !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET 
          due_date = '${dueDate}'
        WHERE id = ${todoId};`
      updatedColumn = 'Due Date'
      break
  }
  await db.run(updateTodoQuery)
  response.send(`${updatedColumn} Updated`)
})

//API-6

app.delete(
  '/todos/:todoId',
  checkQuery,
  checkBody,
  async (request, response) => {
    const {todoId} = request.params
    const deleteTodosQuery = `
    DELETE FROM todo WHERE id = ${todoId};`
    await db.run(deleteTodosQuery)
    response.send('Todo Deleted')
  },
)
module.exports = app
