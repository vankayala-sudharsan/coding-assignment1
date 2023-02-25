const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

function namTodo(each) {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  };
}

app.get("/todos/", async (request, response) => {
  const possibleStatus = ["TO DO", "IN PROGRESS", "DONE"];
  const possiblePriority = ["HIGH", "MEDIUM", "LOW"];
  const possibleCategory = ["WORK", "HOME", "LEARNING"];
  const Qp = request.query;
  const { status, priority, category, search_q } = Qp;
  let query;
  if (status !== undefined) {
    if (possibleStatus.includes(status)) {
      query = `SELECT * FROM todo WHERE status = '${status}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (possiblePriority.includes(priority)) {
      query = `SELECT * FROM todo WHERE priority = '${priority}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (priority !== undefined && status !== undefined) {
    if (
      possiblePriority.includes(priority) &&
      possibleStatus.includes(status)
    ) {
      query = `SELECT * FROM todo WHERE priority = '${priority}',status = '${status}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (search_q !== undefined) {
    query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  } else if (category !== undefined && status !== undefined) {
    if (
      possibleCategory.includes(category) &&
      possibleStatus.includes(status)
    ) {
      query = `SELECT * FROM todo WHERE category = '${category}',status = '${status}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (category !== undefined) {
    if (possibleCategory.includes(category)) {
      query = `SELECT * FROM todo WHERE category = '${category}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (category !== undefined && priority !== undefined) {
    if (
      possibleCategory.includes(category) &&
      possiblePriority.includes(priority)
    ) {
      query = `SELECT * FROM todo WHERE category = '${category}',priority = '${priority}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (query !== undefined) {
    const responseArray = await db.all(query);
    response.send(responseArray.map((each) => namTodo(each)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `SELECT * FROM todo WHERE id = ${todoId};`;
  const responseeach = await db.get(query);

  response.send(namTodo(responseeach));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isvalidDate = isValid(new Date(date));
  if (isvalidDate) {
    const formatdate = format(new Date(date), "yyyy-MM-dd");

    const query = `SELECT * FROM todo WHERE due_date = '${formatdate}';`;
    const responseArray = await db.all(query);
    response.send(responseArray);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const todos = request.body;
  const { id, todo, priority, status, category, dueDate } = todos;
  const possibleStatus = ["TO DO", "IN PROGRESS", "DONE"];
  const possiblePriority = ["HIGH", "MEDIUM", "LOW"];
  const possibleCategory = ["WORK", "HOME", "LEARNING"];
  const isvalidDate = isValid(new Date(dueDate));
  const statusCond = possibleStatus.includes(status);
  const priorityCond = possiblePriority.includes(priority);
  const catCond = possibleCategory.includes(category);
  if (statusCond !== true) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priorityCond !== true) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (catCond !== true) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isvalidDate !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
     const formatdate = format(new Date(dueDate), "yyyy-MM-dd");
    const insertquery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
 VALUES(
     ${id},'${todos}','${priority}','${status}','${category}','${formatdate}');`;
    await db.run(insertquery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const possibleStatus = ["TO DO", "IN PROGRESS", "DONE"];
  const possiblePriority = ["HIGH", "MEDIUM", "LOW"];
  const possibleCategory = ["WORK", "HOME", "LEARNING"];
  const requestparameters = request.body;
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = requestparameters;
  const isvalidDate = isValid(new Date(dueDate));
  let query;
  let responseMsg;
  if (status !== undefined) {
    if (possibleStatus.includes(status)) {
      query = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
      responseMsg = "Status Updated";
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (possiblePriority.includes(priority)) {
      query = `UPDATE todo SET priority = '${priority}' WHERE id =${todoId};`;
      responseMsg = "Priority Updated";
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (todo !== undefined) {
    query = `UPDATE todo SET todo = '${todo}' WHERE id =${todoId};`;
    responseMsg = "Todo Updated";
  } else if (category !== undefined) {
    if (possibleCategory.includes(category)) {
      query = `UPDATE todo SET category = '${category}' WHERE id =${todoId};`;
      responseMsg = "Category Updated";
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate !== undefined) {
    if (isvalidDate) {
      query = `UPDATE todo SET due_date = '${dueDate}' WHERE id =${todoId};`;
      responseMsg = "Due Date Updated";
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  if (query !== undefined) {
    await db.run(query);
    response.send(responseMsg);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const delQuery = `DELETE FROM todo WHERE id = '${todoId}';`;
  await db.run(delQuery);
  response.send("Todo Deleted");
});

module.exports = app;
