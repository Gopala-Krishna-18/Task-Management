const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api";

export async function generateTasks(token: string, topic: string) {
  const res = await fetch(`${API_BASE}/tasks/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ topic }),
  });
  if (!res.ok) throw new Error("Failed to generate tasks");
  return res.json();
}

export async function getTasks(token: string, category?: string) {
  const url = category ? `${API_BASE}/tasks?category=${encodeURIComponent(category)}` : `${API_BASE}/tasks`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(token: string, content: string, category?: string) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, category }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(token: string, id: number, content?: string, category?: string) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, category }),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(token: string, id: number) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}

export async function setTaskCompleted(token: string, id: number, completed: boolean) {
  const res = await fetch(`${API_BASE}/tasks/${id}/complete`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error("Failed to update task status");
  return res.json();
}

export async function getProgress(token: string) {
  const res = await fetch(`${API_BASE}/tasks/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
} 