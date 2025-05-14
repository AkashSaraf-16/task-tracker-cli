#!/usr/bin/env node

const fs = require("fs");

const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done",
};

// Check file exists, if not create an empty file
// NOTE: this needs to be sync because if it becomes async we can't guarantee that other ops are performed
// after creating tasks.json file
if (!fs.existsSync("./tasks.json")) {
  const fd = fs.openSync("./tasks.json", "w");
  // Save an empty tasks in JSON file
  const initData = {
    tasks: [],
  };
  try {
    fs.writeFileSync(fd, JSON.stringify(initData));
    console.log("tasks.json file written successfully");
  } catch (error) {
    console.error("Error writing file:", error);
  }
}

function readAndWrite(opsFunction) {
  fs.readFile("./tasks.json", (err, data) => {
    if (err) {
      console.log("Error in reading the tasks.json file: ", err);
      throw err;
    }
    const jsonData = JSON.parse(data.toString());
    const { updatedData, msg } = opsFunction(jsonData);
    fs.writeFile("./tasks.json", JSON.stringify(updatedData), (err) => {
      if (err) {
        console.log("Error in adding tasks.");
        throw err;
      }
      console.log(msg);
    });
  });
}

const command = process.argv[2];
switch (command.split("-")[0]) {
  case "add":
    readAndWrite((jsonData) => {
      const lastIndex =
        jsonData.tasks && jsonData.tasks.length != 0
          ? jsonData.tasks[jsonData.tasks.length - 1].id
          : 0;
      const task = {
        id: lastIndex + 1,
        description: process.argv[3],
        status: TASK_STATUS.TODO,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (!jsonData.tasks) {
        jsonData = {
          tasks: [task],
        };
      } else {
        jsonData.tasks.push(task);
      }
      return {
        updatedData: jsonData,
        msg: `Task added successfully (ID: ${task.id})`,
      };
    });
    break;
  case "update":
    readAndWrite((jsonData) => {
      const id = process.argv[3];
      const updatedDescription = process.argv[4];
      const taskIndex = jsonData.tasks.findIndex((task) => task.id == id);
      if (taskIndex == -1) {
        console.log("Requested id", id, "doesn't exists.");
        return;
      }
      jsonData.tasks[taskIndex].description = updatedDescription;
      jsonData.tasks[taskIndex].updatedAt = Date.now();
      return {
        updatedData: jsonData,
        msg: `Task (ID: ${id}) updated successfully `,
      };
    });
    break;
  case "delete":
    readAndWrite((jsonData) => {
      const id = process.argv[3];
      const prevtasksCount = jsonData.tasks.length;
      jsonData.tasks = jsonData.tasks.filter((task) => task.id != id);
      return {
        updatedData: jsonData,
        msg:
          prevtasksCount != jsonData.tasks.length
            ? console.log(`Task (ID: ${id}) deleted successfully`)
            : console.log(`Task (ID: ${id}) doesn't exists.`),
      };
    });
    break;
  case "mark":
    readAndWrite((jsonData) => {
      const id = process.argv[3];
      const taskIndex = jsonData.tasks.findIndex((task) => task.id == id);
      if (taskIndex == -1) {
        console.log("Requested id", id, "doesn't exists.");
        return;
      }
      jsonData.tasks[taskIndex].status =
        command.split("-")[1] == "done"
          ? TASK_STATUS.DONE
          : TASK_STATUS.IN_PROGRESS;
      jsonData.tasks[taskIndex].updatedAt = Date.now();
      return {
        updatedData: jsonData,
        msg: `Task (ID: ${id}) status updated successfully`,
      };
    });
    break;
  case "list":
    fs.readFile("./tasks.json", (err, data) => {
      if (err) {
        console.log("Error in reading the tasks.json file: ", err);
        return err;
      }
      let jsonData = JSON.parse(data.toString());
      const filterStatus = process.argv["3"];
      if (!filterStatus) {
        console.log(jsonData.tasks);
        return;
      }
      const filteredTask = jsonData.tasks.filter(
        (task) => task.status == filterStatus
      );
      console.log(filteredTask);
    });
}
