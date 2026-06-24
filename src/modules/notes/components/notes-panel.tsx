"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StickyNote } from "lucide-react";
import { saveNoteAction } from "@/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { env } from "@/config/env";
import { useDeviceStore, useWorkspaceStore } from "@/stores";
import type { Note } from "@/types";

interface NotesPanelProps {
  roomId: string;
}

export function NotesPanel({ roomId }: NotesPanelProps) {
  const { notes, memberToken, addNote, updateNote } = useWorkspaceStore();
  const { deviceId } = useDeviceStore();
  const [activeNote, setActiveNote] = useState<Note | null>(notes[0] ?? null);
  const [title, setTitle] = useState(activeNote?.title ?? "");
  const [content, setContent] = useState(activeNote?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notes.length && !activeNote) {
      setActiveNote(notes[0]);
      setTitle(notes[0].title);
      setContent(notes[0].content);
    }
  }, [notes, activeNote]);

  const saveNote = useCallback(async () => {
    if (!memberToken) return;
    setIsSaving(true);
    const result = await saveNoteAction({
      roomId,
      accessToken: memberToken,
      noteId: activeNote?.id,
      title,
      content,
      deviceId,
    });
    if (result.success && result.data) {
      if (!activeNote) {
        addNote(result.data);
        setActiveNote(result.data);
      } else {
        updateNote(result.data);
      }
    }
    setIsSaving(false);
  }, [
    roomId,
    memberToken,
    activeNote,
    title,
    content,
    deviceId,
    addNote,
    updateNote,
  ]);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (title || content) saveNote();
    }, env.notesAutosaveIntervalMs);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, content, saveNote]);

  const createNewNote = () => {
    setActiveNote(null);
    setTitle("Untitled Note");
    setContent("");
  };

  if (notes.length === 0 && !activeNote && !title && !content) {
    return (
      <EmptyState
        icon={StickyNote}
        title="No notes yet"
        description="Create a shared note that syncs in real-time across all devices"
        action={{ label: "Create Note", onClick: createNewNote }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-md border-none text-lg font-semibold shadow-none focus-visible:ring-0"
          placeholder="Note title"
        />
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          <button
            onClick={createNewNote}
            className="text-xs text-primary hover:underline"
          >
            + New Note
          </button>
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="Write in markdown... **bold**, *italic*, # heading, - list, ```code```"
            className="font-mono text-sm"
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="prose prose-sm dark:prose-invert min-h-[400px] max-w-none rounded-md border border-border p-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "*No content yet*"}
            </ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>

      {notes.length > 1 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setActiveNote(note);
                setTitle(note.title);
                setContent(note.content);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                activeNote?.id === note.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              {note.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
