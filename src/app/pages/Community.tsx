import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Heart, MessageCircle, Plus, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { community } from "../lib/api";
import { toast } from "sonner";

interface Post { _id: string; title: string; content: string; category: string; heartCount: number; isHearted: boolean; createdAt: string; authorId?: { anonymousHandle: string }; }
interface Note { _id: string; message: string; createdAt: string; }

export function Community() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [category, setCategory] = useState("General");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showPostInput, setShowPostInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCommunity = async () => {
    try { setError(""); const [noteResponse, postResponse] = await Promise.all([community.getEncouragement(), community.getPosts()]); setNotes(noteResponse.data?.notes || []); setPosts(postResponse.data?.posts || []); }
    catch (err: any) { setError(err.message || "Unable to load the community."); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { loadCommunity(); }, []);

  const addNote = async () => { if (!newMessage.trim()) return; try { const response = await community.addEncouragement(newMessage.trim()); if (response.data?.note) setNotes((current) => [response.data!.note, ...current]); setNewMessage(""); setShowNoteInput(false); toast.success("Encouragement shared"); } catch (err: any) { toast.error(err.message || "Unable to share your note"); } };
  const addPost = async () => { if (!newTitle.trim() || !newContent.trim()) return; try { const response = await community.createPost(newTitle.trim(), newContent.trim(), category); if (response.data?.post) setPosts((current) => [response.data!.post, ...current]); setNewTitle(""); setNewContent(""); setShowPostInput(false); toast.success("Story shared"); } catch (err: any) { toast.error(err.message || "Unable to publish your story"); } };
  const toggleHeart = async (post: Post) => { try { const response = await community.toggleHeart(post._id); setPosts((current) => current.map((item) => item._id === post._id ? { ...item, heartCount: response.data?.heartCount ?? item.heartCount, isHearted: response.data?.isHearted ?? !item.isHearted } : item)); } catch (err: any) { toast.error(err.message || "Unable to update reaction"); } };

  return <div className="p-4 lg:p-8 max-w-6xl mx-auto"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><h1 className="text-3xl mb-3">Community Support</h1><p className="text-muted-foreground">Share encouragement, read lived experiences, and know you're not alone.</p></motion.div>
    {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
    {!isLoading && error && <Card className="p-8 mb-8 text-center bg-white/80 rounded-2xl"><AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" /><p className="text-muted-foreground">{error}</p><Button onClick={loadCommunity} variant="outline" className="mt-4 rounded-full">Try again</Button></Card>}
    {!isLoading && !error && <>
      <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-3xl mb-8 shadow-xl"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" /><h2 className="text-2xl">Encouragement Wall</h2></div><Button onClick={() => setShowNoteInput(!showNoteInput)} className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full"><Plus className="w-4 h-4 mr-2" />Add Note</Button></div>{showNoteInput && <div className="mb-6"><textarea value={newMessage} onChange={(event) => setNewMessage(event.target.value)} placeholder="Share an encouraging message…" className="w-full p-4 rounded-xl bg-white/80 border border-border resize-none mb-3 h-24" /><div className="flex gap-2"><Button onClick={addNote} className="rounded-full">Post</Button><Button onClick={() => setShowNoteInput(false)} variant="outline" className="rounded-full">Cancel</Button></div></div>}<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{notes.length === 0 ? <p className="text-sm text-muted-foreground col-span-full text-center py-8">No notes yet. Be the first to encourage someone.</p> : notes.slice(0, 12).map((note) => <div key={note._id} className="bg-white/90 p-5 rounded-xl shadow-md"><p className="text-sm text-center italic">“{note.message}”</p><p className="text-xs text-muted-foreground text-center mt-3">{new Date(note.createdAt).toLocaleDateString()}</p></div>)}</div></Card>
      <Card className="p-6 lg:p-8 bg-white/80 border-border rounded-3xl mb-8"><div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl">Shared Experiences</h2><p className="text-muted-foreground">Anonymous stories from the MindMate community.</p></div><Button onClick={() => setShowPostInput(!showPostInput)} className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full"><Plus className="w-4 h-4 mr-2" />Share Story</Button></div>{showPostInput && <div className="mb-6 p-4 bg-muted rounded-xl space-y-3"><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Story title" className="w-full p-3 rounded-lg border border-border bg-white" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full p-3 rounded-lg border border-border bg-white">{["Academic Stress", "Loneliness", "Mental Health", "Career", "Relationships", "Adjustment", "General"].map((item) => <option key={item}>{item}</option>)}</select><textarea value={newContent} onChange={(event) => setNewContent(event.target.value)} placeholder="Share your experience…" className="w-full p-3 rounded-lg border border-border bg-white h-28 resize-none" /><div className="flex gap-2"><Button onClick={addPost} className="rounded-full">Publish</Button><Button onClick={() => setShowPostInput(false)} variant="outline" className="rounded-full">Cancel</Button></div></div>}<div className="space-y-4">{posts.length === 0 ? <p className="text-center text-muted-foreground py-8">No stories yet. Start the conversation.</p> : posts.map((post) => <Card key={post._id} className="p-6 bg-white/70 border-border rounded-2xl"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0"><span className="text-xl">💙</span></div><div className="flex-1"><div className="flex flex-wrap items-start justify-between gap-2 mb-2"><div><h3 className="text-lg">{post.title}</h3><span className="inline-block bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground mt-1">{post.category}</span></div><span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span></div><p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{post.content}</p><div className="flex items-center gap-4"><button onClick={() => toggleHeart(post)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><Heart className={`w-5 h-5 ${post.isHearted ? "fill-primary text-primary" : ""}`} /><span>{post.heartCount}</span></button><span className="flex items-center gap-2 text-sm text-muted-foreground"><MessageCircle className="w-5 h-5" />Community story</span></div></div></div></Card>)}</div></Card>
    </>}
  </div>;
}
