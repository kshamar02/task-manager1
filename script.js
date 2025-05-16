const API_URL = 'http://localhost:3000/tasks';

let tasks = [];
let dragSrcEl = null;

const taskList = document.getElementById('taskList');
const addBtn = document.getElementById('addBtn');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const filterSelect = document.getElementById('filterSelect');

addBtn.addEventListener('click', addTask);
sortSelect.addEventListener('change', renderTasks);
filterSelect.addEventListener('change', renderTasks);

async function fetchTasks() {
  const res = await fetch(API_URL);
  tasks = await res.json();
  renderTasks();
}

function renderTasks() {
  let filteredTasks = [...tasks];

  // Filter
  const filter = filterSelect.value;
  if (filter === 'completed') {
    filteredTasks = filteredTasks.filter(t => t.completed);
  } else if (filter === 'incomplete') {
    filteredTasks = filteredTasks.filter(t => !t.completed);
  } else if (filter.startsWith('category-')) {
    const category = filter.split('-')[1];
    filteredTasks = filteredTasks.filter(t => t.category === category);
  }

  // Sort
  const sort = sortSelect.value;
  if (sort === 'priority') {
    filteredTasks.sort((a, b) => a.priority - b.priority);
  } else if (sort === 'timestamp') {
    filteredTasks.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } else if (sort === 'dueDate') {
    filteredTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (sort === 'order') {
    filteredTasks.sort((a, b) => a.order - b.order);
  }

  taskList.innerHTML = '';

  filteredTasks.forEach(task => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
  });

  addDragAndDropListeners();
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  if (task.completed) li.classList.add('completed');
  li.draggable = true;
  li.dataset.id = task.id;

  // Checkbox for completion
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox-complete';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => toggleComplete(task.id, checkbox.checked));
  li.appendChild(checkbox);

  const taskInfo = document.createElement('div');
  taskInfo.className = 'task-info';

  const taskText = document.createElement('span');
  taskText.className = 'task-text';
  taskText.textContent = task.task;
  taskInfo.appendChild(taskText);

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  const dateSpan = document.createElement('span');
  dateSpan.textContent = `Added: ${task.timestamp}`;
  meta.appendChild(dateSpan);

  if (task.dueDate) {
    const dueDateSpan = document.createElement('span');
    dueDateSpan.textContent = `Due: ${task.dueDate}`;
    const now = new Date();
    const due = new Date(task.dueDate);
    if (!task.completed && due < now) {
      dueDateSpan.style.color = 'red';
      dueDateSpan.style.fontWeight = 'bold';
    }
    meta.appendChild(dueDateSpan);
  }

  const prioritySpan = document.createElement('span');
  prioritySpan.textContent = `Priority: ${task.priority}`;
  meta.appendChild(prioritySpan);

  const categorySpan = document.createElement('span');
  categorySpan.textContent = `Category: ${task.category}`;
  meta.appendChild(categorySpan);

  taskInfo.appendChild(meta);
  li.appendChild(taskInfo);

  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.display = 'flex';
  buttonsDiv.style.gap = '5px';

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => editTask(task, li));
  buttonsDiv.appendChild(editBtn);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => deleteTask(task.id));
  buttonsDiv.appendChild(removeBtn);

  li.appendChild(buttonsDiv);

  return li;
}

function editTask(task, li) {
  li.innerHTML = '';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox-complete';
  checkbox.checked = task.completed;
  checkbox.disabled = true;
  li.appendChild(checkbox);

  const taskInfo = document.createElement('div');
  taskInfo.className = 'task-info';

  const taskInput = document.createElement('input');
  taskInput.type = 'text';
  taskInput.className = 'edit-input';
  taskInput.value = task.task;
  taskInfo.appendChild(taskInput);

  const prioritySelectEdit = document.createElement('select');
  prioritySelectEdit.className = 'edit-select';
  for (let i = 1; i <= 5; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Priority ${i}`;
    if (i === task.priority) option.selected = true;
    prioritySelectEdit.appendChild(option);
  }
  taskInfo.appendChild(prioritySelectEdit);

  const dueDateInputEdit = document.createElement('input');
  dueDateInputEdit.type = 'date';
  dueDateInputEdit.className = 'edit-date';
  dueDateInputEdit.value = task.dueDate || '';
  taskInfo.appendChild(dueDateInputEdit);

  const categorySelectEdit = document.createElement('select');
  categorySelectEdit.className = 'edit-select';
  ['General', 'Work', 'Personal', 'Shopping', 'Others'].forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    if (cat === task.category) option.selected = true;
    categorySelectEdit.appendChild(option);
  });
  taskInfo.appendChild(categorySelectEdit);

  li.appendChild(taskInfo);

  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.display = 'flex';
  buttonsDiv.style.gap = '5px';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'edit-btn';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', async () => {
    const updatedTask = {
      task: taskInput.value.trim() || task.task,
      priority: parseInt(prioritySelectEdit.value),
      dueDate: dueDateInputEdit.value || null,
      category: categorySelectEdit.value,
    };
    await updateTask(task.id, updatedTask);
  });
  buttonsDiv.appendChild(saveBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'remove-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', renderTasks);
  buttonsDiv.appendChild(cancelBtn);

  li.appendChild(buttonsDiv);
}

async function toggleComplete(id, completed) {
  await updateTask(id, { completed });
}

async function updateTask(id, updatedFields) {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFields)
  });
  await fetchTasks();
}

async function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) return alert('Please enter a task.');
  const newTask = {
    task: taskText,
    priority: parseInt(prioritySelect.value),
    dueDate: dueDateInput.value || null,
    category: categorySelect.value,
  };
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTask)
  });
  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = '3';
  categorySelect.value = 'General';
  await fetchTasks();
}

async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  await fetchTasks();
}

function addDragAndDropListeners() {
  const listItems = document.querySelectorAll('#taskList li.task-item');

  listItems.forEach(item => {
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragover', dragOver);
    item.addEventListener('drop', dragDrop);
    item.addEventListener('dragend', dragEnd);
  });
}

function dragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
  this.classList.add('dragging');
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

async function dragDrop(e) {
  e.stopPropagation();

  if (dragSrcEl !== this) {
    const fromId = parseInt(dragSrcEl.dataset.id);
    const toId = parseInt(this.dataset.id);

    const fromTask = tasks.find(t => t.id === fromId);
    const toTask = tasks.find(t => t.id === toId);

    if (fromTask && toTask) {
      const tempOrder = fromTask.order;
      fromTask.order = toTask.order;
      toTask.order = tempOrder;

      await updateTask(fromId, { order: fromTask.order });
      await updateTask(toId, { order: toTask.order });
    }
  }
  this.classList.remove('dragging');
  await fetchTasks();
  return false;
}

function dragEnd() {
  this.classList.remove('dragging');
}

fetchTasks();
