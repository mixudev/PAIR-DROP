"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Plus, StickyNote, Trash2 } from "lucide-react";
import { saveNoteAction } from "@/actions";
import { Button } from "@/components/ui/button";
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
  const { notes, memberToken, addNote, updateNote, setNotes } = useWorkspaceStore();
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

  const switchNote = (note: Note) => {
    if (activeNote) saveNote();
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const createNewNote = () => {
    if (activeNote) saveNote();
    setActiveNote(null);
    setTitle("Untitled Note");
    setContent("");
  };

  const deleteNote = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("notes").delete().eq("id", note.id);
    const updated = notes.filter((n) => n.id !== note.id);
    setNotes(updated);
    if (activeNote?.id === note.id) {
      const next = updated[0] ?? null;
      setActiveNote(next);
      setTitle(next?.title ?? "");
      setContent(next?.content ?? "");
    }
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
    <div className="flex gap-6">
      <div className="w-56 shrink-0 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={createNewNote}
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>
        <div className="space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => switchNote(note)}
              className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                activeNote?.id === note.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{note.title}</span>
              <Trash2
                className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                onClick={(e) => deleteNote(e, note)}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4">
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
      </div>
    </div>
  );
}
