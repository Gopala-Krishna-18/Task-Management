"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@clerk/nextjs";
import { getTasks, deleteTask, setTaskCompleted } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

interface Task {
  id: number;
  content: string;
  completed: boolean;
}

export default function ProgressPage() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "not-completed">("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getTasks(token);
      setTasks(data.tasks);
    } catch (e: unknown) {
      console.error("Error fetching tasks:", e);
      toast({
        title: "Error fetching tasks",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (taskId: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      await setTaskCompleted(token, taskId, !task.completed);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (e: unknown) {
      console.error("Error updating task:", e);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      await deleteTask(token, taskId);

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({
        title: "Task deleted",
        description: "The task has been removed from your list.",
        variant: "default",
      });
    } catch (e: unknown) {
      console.error("Error deleting task:", e);
      toast({
        title: "Error",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "not-completed") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Progress</h1>
        <Link
          href="/dashboard"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm font-medium">
            Progress: {completedCount}/{tasks.length} tasks completed
          </span>
          <Progress value={progressPercentage} className="w-64" />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 rounded ${
              filter === "completed"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("not-completed")}
            className={`px-3 py-1 rounded ${
              filter === "not-completed"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Not Completed
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-4 rounded-lg shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            <span
              className={`text-lg font-medium ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-blue-900 dark:text-white"}`}
            >
              {task.content}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant={task.completed ? "secondary" : "default"}
                size="sm"
                onClick={() => handleToggleComplete(task.id)}
              >
                {task.completed ? "Mark Incomplete" : "Mark Complete"}
              </Button>
              <Button
                onClick={() => handleDeleteTask(task.id)}
                variant="destructive"
                size="sm"
                aria-label="Delete task"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No tasks found. {filter === "all" ? "Generate some tasks from the dashboard!" : "Try a different filter."}
          </div>
        )}
      </div>
    </div>
  );
} 