'use client';
import { UserButton, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { generateTasks, createTask } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState<number | null>(null);

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await generateTasks(token, topic);
      setGeneratedTasks(data.tasks);
      setTopic("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (task: string, idx: number) => {
    setAddLoading(idx);
    try {
      const token = await getToken();
      if (!token) return;
      await createTask(token, task);
      setGeneratedTasks((prev) => prev.filter((t, i) => i !== idx));
      toast({
        title: "Task added!",
        description: "View it in My Progress to track completion.",
        variant: "default",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      toast({
        title: "Failed to add task",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setAddLoading(null);
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10 px-4 bg-white rounded-xl shadow-lg mt-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4 items-center">
          <h1 className="text-3xl font-extrabold text-blue-900">Your Tasks</h1>
          <Link href="/progress">
            <Button variant="secondary">My Progress</Button>
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="mb-8 flex gap-2 items-center">
        <Input
          placeholder="Enter topic (e.g. Learn Python)"
          value={topic}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
          className="flex-1 text-lg bg-white text-blue-900 dark:text-gray-900 border-2 border-blue-500 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !topic}
          size="lg"
          className="transition-colors bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 border-none"
        >
          Generate Tasks
        </Button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="space-y-4">
        {generatedTasks.map((task, idx) => (
          <div key={idx} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 shadow-sm">
            <span className="text-base text-blue-900 font-medium">{task}</span>
            <Button onClick={() => handleAdd(task, idx)} variant="default" size="sm" disabled={addLoading === idx}>
              {addLoading === idx ? "Adding..." : "Add"}
            </Button>
          </div>
        ))}
        {generatedTasks.length === 0 && (
          <div className="text-gray-400 text-center py-8">No generated tasks yet. Enter a topic and click Generate Tasks.</div>
        )}
      </div>
    </main>
  );
}