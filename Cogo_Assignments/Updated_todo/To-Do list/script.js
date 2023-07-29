// Get references to the input elements
const taskInput = document.getElementById("taskInput");
const newCategoryInput = document.getElementById("newCategoryInput");
const categorySelect = document.getElementById("categorySelect");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");
const dueDateFilter = document.getElementById("dueDateFilter");
const categoryFilter = document.getElementById("categoryFilter");
const priorityFilter = document.getElementById("priorityFilter");

// Function to get saved tasks from local storage
function getSavedTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

const tasks = getSavedTasks();

// Function to save tasks to local storage
function saveTasksToLocalStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Function to get saved categories from local storage
function getSavedCategories() {
  return JSON.parse(localStorage.getItem("categories")) || [];
}

// Function to add a new category
function addCategory() {
  const newCategory = newCategoryInput.value.trim();
  if (newCategory !== "") {
    const option = document.createElement("option");
    option.value = newCategory;
    option.text = newCategory;
    categorySelect.add(option);
    newCategoryInput.value = "";

    // Save the updated categories to local storage
    const savedCategories = getSavedCategories();
    const updatedCategories = [...savedCategories, newCategory];
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
  }
}

// Function to remove a category
function removeCategory() {
  const selectedCategory = categorySelect.value;
  if (selectedCategory !== "") {
    categorySelect.removeChild(categorySelect.selectedOptions[0]);

    // Remove the category from local storage
    const savedCategories = getSavedCategories();
    const updatedCategories = savedCategories.filter(
      (category) => category !== selectedCategory
    );
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
  }
}

// Function to log activity
function logActivity(action, taskText) {
  const activityLog = document.getElementById("activityLog");

  const logEntry = document.createElement("li");
  logEntry.textContent = `${action}: ${taskText} [${new Date().toLocaleString()}]`;
  activityLog.prepend(logEntry);
}

// Function to add a new task
function addTask() {
  const taskText = taskInput.value.trim();
  const selectedCategory = categorySelect.value;
  const dueDate = dueDateInput.value;
  const priority = priorityInput.value;

  if (taskText !== "" && selectedCategory !== "") {
    const tasks = getSavedTasks();
    const task = {
      id: Date.now(),
      text: taskText,
      category: selectedCategory,
      dueDate: dueDate,
      priority: priority,
      tags: [], // Initialize tags as an empty array
      subtasks: [], // Initialize subtasks as an empty array
      completed: false,
      editMode: false,
    };

    task.tags = task.tags || [];
    task.subtasks = task.subtasks || [];
    logActivity("Added", taskText);
    setReminder(task);
    tasks.push(task);
    saveTasksToLocalStorage(tasks);
    renderTasks();
    taskInput.value = "";
    categorySelect.value = "";
    dueDateInput.value = "";
  }
}

// Function to toggle task completion status
function toggleTaskCompleted(id) {
  const tasks = getSavedTasks();
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  const task = tasks.find((task) => task.id === id);
  logActivity(
    task.completed ? "Marked as Not Done" : "Marked as Done",
    task.text
  );

  saveTasksToLocalStorage(updatedTasks);
  renderTasks();
}

// Function to delete a task
function deleteTask(id) {
  const tasks = getSavedTasks();
  const updatedTasks = tasks.filter((task) => task.id !== id);
  const task = tasks.find((task) => task.id === id);
  logActivity("Deleted", task.text);
  saveTasksToLocalStorage(updatedTasks);
  renderTasks();
}

// Function to edit a task
function editTask(id) {
  const tasks = getSavedTasks();
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, editMode: true } : task
  );
  saveTasksToLocalStorage(updatedTasks);
  renderTasks();
}

// Function to save an edited task with subtasks and tags
function saveTask(
  id,
  newText,
  newCategory,
  newPriority,
  newDueDate,
  tags,
  subtasks
) {
  const tasks = getSavedTasks();
  const updatedTasks = tasks.map((task) => {
    if (task.id === id) {
      return {
        ...task,
        text: newText,
        category: newCategory,
        priority: newPriority,
        dueDate: newDueDate,
        tags: tags.split(",").map((tag) => tag.trim()), // Convert tags to an array of strings
        subtasks: subtasks.map((subtask) => ({
          ...subtask,
          text: subtask.text.trim(),
        })), // Trim subtask texts
        editMode: false,
      };
    }
    return task;
  });
  logActivity("Edited", task.text);
  setReminder(task);
  saveTasksToLocalStorage(updatedTasks);
  renderTasks();
}

// Variables to store the dragged task and subtask
let draggedTask;
let draggedSubtask;

// Function to start dragging a task or subtask
function dragStart(event) {
  const target = event.target;
  if (target.classList.contains("task")) {
    draggedTask = target;
    event.dataTransfer.setData("text/plain", target.id);
  } else if (target.classList.contains("subtask")) {
    draggedSubtask = target;
    event.dataTransfer.setData("text/plain", target.id);
  }
}

// Function to handle dragging over a task or subtask
function dragOver(event) {
  event.preventDefault();
  const target = event.target;
  if (
    target.classList.contains("task") ||
    target.classList.contains("subtask")
  ) {
    event.dataTransfer.dropEffect = "move";
  }
}

// Function to set a reminder for a task
function setReminder(task) {
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const reminderTime = dueDate.getTime() - 15 * 60 * 1000; // 15 minutes before the due date

    const currentTime = new Date().getTime();
    const timeDifference = reminderTime - currentTime;

    if (timeDifference > 0) {
      // Schedule the reminder
      const reminderTimeout = setTimeout(() => {
        console.log(`Reminder: ${task.text} is due in 15 minutes!`);
        // You can also show a notification or send an email here for the reminder
      }, timeDifference);

      // Store the reminderTimeout in the task object
      task.reminderTimeout = reminderTimeout;
    }
  }
}

// Function to drop a task or subtask in the new position
function drop(event) {
  event.preventDefault();
  const target = event.target;
  const data = event.dataTransfer.getData("text/plain");
  const sourceElement = document.getElementById(data);

  if (
    target.classList.contains("task") &&
    !target.classList.contains("subtask")
  ) {
    // Reorder tasks
    const taskList = document.getElementById("taskList");
    taskList.insertBefore(sourceElement, target);
  } else if (target.classList.contains("subtask")) {
    // Reorder subtasks within the same task
    const subtaskList = target.parentNode.querySelector("ul");
    subtaskList.insertBefore(sourceElement, target);
  }

  // Clear the dragged task and subtask variables
  draggedTask = null;
  draggedSubtask = null;
}

// Function to end dragging
function dragEnd(event) {
  event.preventDefault();
  const taskList = document.getElementById("taskList");
  const subtasks = taskList.querySelectorAll(".subtask");
  subtasks.forEach((subtask) => subtask.classList.remove("drag-over"));
}

// Function to cancel editing a task
function cancelEdit(id) {
  const tasks = getSavedTasks();
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, editMode: false } : task
  );
  saveTasksToLocalStorage(updatedTasks);
  renderTasks();
}

// Function to render subtasks
function renderSubtasks(subtasks, parentListItem) {
  const subtaskList = document.createElement("ul");
  subtasks.forEach((subtask) => {
    const subtaskItem = document.createElement("li");
    subtaskItem.setAttribute("data-id", subtask.id);
    if (subtask.complete) subtaskItem.classList.add("completed");

    const subtaskText = document.createElement("span");
    subtaskText.innerText = subtask.text;
    subtaskItem.appendChild(subtaskText);

    const subtaskDoneButton = document.createElement("button");
    subtaskDoneButton.innerText = "Done";
    subtaskDoneButton.onclick = () =>
      toggleSubtaskCompleted(parentListItem, subtask.id);
    subtaskItem.appendChild(subtaskDoneButton);

    const subtaskDeleteButton = document.createElement("button");
    subtaskDeleteButton.innerText = "Delete";
    subtaskDeleteButton.onclick = () =>
      deleteSubtask(parentListItem, subtask.id);
    subtaskItem.appendChild(subtaskDeleteButton);

    subtaskList.appendChild(subtaskItem);
  });

  parentListItem.appendChild(subtaskList);
}

// Function to toggle subtask completion status
function toggleSubtaskCompleted(parentListItem, subtaskId) {
  const taskId = parseInt(parentListItem.getAttribute("data-id"));
  const tasks = getSavedTasks();
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      const updatedSubtasks = task.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      );
      return { ...task, subtasks: updatedSubtasks };
    }
    return task;
  });
  saveTasksToLocalStorage(updatedTasks);
  renderTasks();
}

// Function to delete a subtask
function deleteSubtask(parentListItem, subtaskId) {
  const taskId = parseInt(parentListItem.getAttribute("data-id"));
  const tasks = getSavedTasks();
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      const updatedSubtasks = task.subtasks.filter(
        (subtask) => subtask.id !== subtaskId
      );
      return { ...task, subtasks: updatedSubtasks };
    }
    return task;
  });
  saveTasksToLocalStorage(updatedTasks);
  renderTasks();
}

// Function to sort tasks by due date
function sortByDueDate() {
  const tasks = getSavedTasks();
  const sortedTasks = tasks.sort((a, b) => {
    if (a.dueDate < b.dueDate) return -1;
    if (a.dueDate > b.dueDate) return 1;
    return 0;
  });
  renderTasks(sortedTasks);
}

// Function to sort tasks by priority
function sortByPriority() {
  const tasks = getSavedTasks();
  const priorityOrder = { low: 1, medium: 2, high: 3 };
  const sortedTasks = tasks.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  renderTasks(sortedTasks);
}

// Event listener to trigger sorting by due date
document
  .getElementById("sortByDueDateButton")
  .addEventListener("click", sortByDueDate);

// Event listener to trigger sorting by priority
document
  .getElementById("sortByPriorityButton")
  .addEventListener("click", sortByPriority);

// Function to check for a valid date format in the task text
function checkForDueDateInTaskText() {
  const taskText = taskInput.value.trim();
  const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/; // Matches date format yyyy-mm-dd

  const dueDateMatch = taskText.match(dateRegex);
  if (dueDateMatch) {
    dueDateInput.value = dueDateMatch[0];
  }
}

// Event listener to auto-complete due date while typing in the task input
taskInput.addEventListener("input", checkForDueDateInTaskText);

// Function to filter tasks based on due date, category, and priority
function filterTasks() {
  const dueDateValue = dueDateFilter.value;
  const categoryValue = categoryFilter.value;
  const priorityValue = priorityFilter.value;

  const filteredTasks = tasks.filter((task) => {
    const dueDateMatch = task.dueDate === dueDateValue || dueDateValue === "";
    const categoryMatch =
      task.category === categoryValue || categoryValue === "";
    const priorityMatch =
      task.priority === priorityValue || priorityValue === "";

    return dueDateMatch && categoryMatch && priorityMatch;
  });

  renderTasks(filteredTasks);
}

// Function to add a new subtask to a task
function addSubtask(taskID, subtaskText) {
  const task = tasks.find((task) => task.id === taskID);
  if (!task) {
    return;
  }

  const subtask = subtaskText.trim();
  if (subtask === "") {
    alert("Subtask text cannot be empty!");
    return;
  }

  task.subtasks.push(subtask);
  saveTasks(tasks);
  renderTasks(tasks);
}

// Function to remove a subtask from a task
function removeSubtask(taskID, subtaskIndex) {
  const task = tasks.find((task) => task.id === taskID);
  if (!task) {
    return;
  }

  task.subtasks.splice(subtaskIndex, 1);
  saveTasks(tasks);
  renderTasks(tasks);
}

document.getElementById("taskList").addEventListener("click", function (event) {
  console.log(event);
  if (event.target.classList.contains("addSubtaskButton")) {
    const taskID = event.target.getAttribute("data-task-id");
    const subtaskText = prompt("Add Subtask:");
    addSubtask(taskID, subtaskText);
  }
});

// Event listener for removing subtasks
document.getElementById("taskList").addEventListener("click", function (event) {
  if (event.target.classList.contains("removeSubtaskButton")) {
    const taskID = event.target.getAttribute("data-task-id");
    const subtaskIndex = event.target.getAttribute("data-subtask-index");
    removeSubtask(taskID, subtaskIndex);
  }
});

// Function to render the tasks
function renderTasks(filteredTasks = []) {
  // console.log("Tasks rendered!");
  const tasks = filteredTasks.length ? filteredTasks : getSavedTasks();

  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const listItem = document.createElement("li");
    listItem.setAttribute("data-id", task.id);
    listItem.classList.add("task");
    if (task.completed) listItem.classList.add("completed");

    if (task.editMode) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = task.text;
      listItem.appendChild(editInput);

      const categorySelect = document.createElement("select");
      getSavedCategories().forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.text = category;
        categorySelect.appendChild(option);
      });
      categorySelect.value = task.category;
      listItem.appendChild(categorySelect);

      const prioritySelect = document.createElement("select");
      ["low", "medium", "high"].forEach((priority) => {
        const option = document.createElement("option");
        option.value = priority;
        option.text = priority.charAt(0).toUpperCase() + priority.slice(1);
        prioritySelect.appendChild(option);
      });
      prioritySelect.value = task.priority;
      listItem.appendChild(prioritySelect);

      const dueDateInput = document.createElement("input");
      dueDateInput.type = "date";
      dueDateInput.value = task.dueDate;
      listItem.appendChild(dueDateInput);

      const tagsInput = document.createElement("input");
      tagsInput.type = "text";
      tagsInput.placeholder = "Tags (comma separated)";
      tagsInput.value = task.tags.join(", ");
      listItem.appendChild(tagsInput);

      const addSubtaskButton = document.createElement("button");
      addSubtaskButton.innerText = "Add Subtask";
      addSubtaskButton.onclick = () => addSubtask(listItem);
      listItem.appendChild(addSubtaskButton);

      renderSubtasks(task.subtasks, listItem);

      const saveButton = document.createElement("button");
      saveButton.innerText = "Save";
      saveButton.onclick = () =>
        saveTask(
          task.id,
          editInput.value.trim(),
          categorySelect.value,
          prioritySelect.value,
          dueDateInput.value,
          tagsInput.value.trim(),
          task.subtasks
        );
      listItem.appendChild(saveButton);

      const cancelButton = document.createElement("button");
      cancelButton.innerText = "Cancel";
      cancelButton.onclick = () => cancelEdit(task.id);
      listItem.appendChild(cancelButton);
    } else {
      const taskText = document.createElement("span");
      taskText.classList.add("task-text");
      taskText.innerText = task.text;
      listItem.appendChild(taskText);

      const categorySpan = document.createElement("span");
      categorySpan.innerText = ` Category: ${task.category}`;
      listItem.appendChild(categorySpan);

      const prioritySpan = document.createElement("span");
      prioritySpan.innerText = ` Priority: ${
        task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
      }`;
      listItem.appendChild(prioritySpan);

      const dueDateSpan = document.createElement("span");
      dueDateSpan.innerText = ` Due Date: ${task.dueDate}`;
      listItem.appendChild(dueDateSpan);

      if (task.tags?.length > 0) {
        const tagsSpan = document.createElement("span");
        tagsSpan.innerText = ` Tags: ${task.tags.join(", ")}`;
        listItem.appendChild(tagsSpan);
      }

      const doneButton = document.createElement("button");
      doneButton.innerText = "Mark as Done";
      doneButton.onclick = () => {
        toggleTaskCompleted(task.id);
        if (task.completed) doneButton.innerText = "Mark as Undone";
      };
      listItem.appendChild(doneButton);

      const editButton = document.createElement("button");
      editButton.innerText = "Edit";
      editButton.onclick = () => editTask(task.id);
      listItem.appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.innerText = "Delete";
      deleteButton.onclick = () => deleteTask(task.id);
      listItem.appendChild(deleteButton);
    }

    taskList.appendChild(listItem);
  });
}

// Function to search for tasks with exact todo name
function searchExactTodo() {
  const searchQuery = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const filteredTasks = tasks.filter(
    (task) => task.text.toLowerCase() === searchQuery
  );
  renderTasks(filteredTasks);
}

// Function to search for tasks based on subtasks
function searchSubtasks() {
  const searchQuery = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const filteredTasks = tasks.filter((task) =>
    task.subtasks.some((subtask) => subtask.toLowerCase().includes(searchQuery))
  );
  renderTasks(filteredTasks);
}

// Function to search for tasks with names similar to the given search term
function searchSimilarWords() {
  const searchQuery = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const filteredTasks = tasks.filter((task) =>
    task.text.toLowerCase().includes(searchQuery)
  );
  renderTasks(filteredTasks);
}

// Function to search for tasks using partial keywords
function searchPartialSearch() {
  const searchQuery = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const filteredTasks = tasks.filter((task) => {
    const words = task.text.toLowerCase().split(" ");
    return words.some((word) => word.startsWith(searchQuery));
  });
  renderTasks(filteredTasks);
}

// Function to search for tasks based on specific tags
function searchTags() {
  const searchQuery = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const filteredTasks = tasks.filter(
    (task) =>
      task.tags &&
      task.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
  );
  renderTasks(filteredTasks);
}

// Event listener for search
document.getElementById("searchInput").addEventListener("input", function () {
  // console.log("Hello!");
  const searchQuery = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  if (searchQuery === "") {
    renderTasks(tasks); // If search query is empty, render all tasks
    return;
  }

  const searchType = document.getElementById("searchType").value;
  let filteredTasks;

  switch (searchType) {
    case "exactTodo":
      filteredTasks = tasks.filter(
        (task) => task.text.toLowerCase() === searchQuery
      );
      break;
    case "subtasks":
      filteredTasks = tasks.filter((task) =>
        task.subtasks.some((subtask) =>
          subtask.toLowerCase().includes(searchQuery)
        )
      );
      break;
    case "similarWords":
      filteredTasks = tasks.filter((task) =>
        task.text.toLowerCase().includes(searchQuery)
      );
      break;
    case "partialSearch":
      filteredTasks = tasks.filter((task) => {
        const words = task.text.toLowerCase().split(" ");
        return words.some((word) => word.startsWith(searchQuery));
      });
      break;
    case "tags":
      filteredTasks = tasks.filter(
        (task) =>
          task.tags &&
          task.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
      );
      break;
    default:
      filteredTasks = tasks;
  }

  renderTasks(filteredTasks);
});

// Function to view backlogs (pending or missed tasks)
function viewBacklogs(status) {
  const tasks = getSavedTasks();
  const currentDate = new Date();

  const filteredTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    if (status === "pending") {
      return !task.completed && dueDate >= currentDate;
    } else if (status === "missed") {
      return !task.completed && dueDate < currentDate;
    }
  });

  renderTasks(filteredTasks);
}

// Event listener to trigger viewing pending tasks (backlogs)
document
  .getElementById("viewPendingButton")
  .addEventListener("click", () => viewBacklogs("pending"));

// Event listener to trigger viewing missed tasks (backlogs)
document
  .getElementById("viewMissedButton")
  .addEventListener("click", () => viewBacklogs("missed"));

// Event listener to filter tasks
dueDateFilter.addEventListener("change", filterTasks);
categoryFilter.addEventListener("change", filterTasks);
priorityFilter.addEventListener("change", filterTasks);

// Event listener to add a new category
document
  .getElementById("addCategoryButton")
  .addEventListener("click", addCategory);

// Event listener to remove a category
document
  .getElementById("removeCategoryButton")
  .addEventListener("click", removeCategory);

// Event listener to add a new task
document.getElementById("addTaskButton").addEventListener("click", addTask);

function loadSavedCategories() {
  const savedCategories = JSON.parse(localStorage.getItem("categories")) || [];
  savedCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.text = category;
    categorySelect.add(option);
  });
}

// Load saved categories when the page is loaded
loadSavedCategories();

// Render the tasks on page load
renderTasks();
