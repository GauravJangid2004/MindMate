import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Heart,
  MessageCircle,
  Plus,
  Sparkles,
  Loader2,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { community } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface Comment {
  _id: string;
  authorId?: string;
  anonymousHandle: string;
  authorRole?: string;
  content: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  category: string;
  heartCount: number;
  isHearted: boolean;
  createdAt: string;
  authorId?: { anonymousHandle: string; userType?: string };
  comments?: Comment[];
}

interface Note {
  _id: string;
  message: string;
  createdAt: string;
}

export function Community() {
  const { userType } = useAuth();
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

  // Comment section state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  const loadCommunity = async () => {
    try {
      setError("");
      const [noteResponse, postResponse] = await Promise.all([
        community.getEncouragement(),
        community.getPosts(),
      ]);
      setNotes(noteResponse.data?.notes || []);
      setPosts(postResponse.data?.posts || []);
    } catch (err: any) {
      setError(err.message || "Unable to load the community.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunity();
  }, []);

  const addNote = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await community.addEncouragement(newMessage.trim());
      if (response.data?.note) {
        setNotes((current) => [response.data!.note, ...current]);
      }
      setNewMessage("");
      setShowNoteInput(false);
      toast.success("Encouragement shared");
    } catch (err: any) {
      toast.error(err.message || "Unable to share your note");
    }
  };

  const addPost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const response = await community.createPost(
        newTitle.trim(),
        newContent.trim(),
        category
      );
      if (response.data?.post) {
        setPosts((current) => [
          { ...response.data!.post, comments: [] },
          ...current,
        ]);
      }
      setNewTitle("");
      setNewContent("");
      setShowPostInput(false);
      toast.success(userType === "elder" ? "Wisdom shared with the community" : "Story shared");
    } catch (err: any) {
      toast.error(err.message || "Unable to publish your story");
    }
  };

  const toggleHeart = async (post: Post) => {
    try {
      const response = await community.toggleHeart(post._id);
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id
            ? {
                ...item,
                heartCount: response.data?.heartCount ?? item.heartCount,
                isHearted: response.data?.isHearted ?? !item.isHearted,
              }
            : item
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Unable to update reaction");
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: text,
    }));
  };

  const submitComment = async (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const response = await community.addComment(postId, text);
      if (response.data?.comment) {
        setPosts((current) =>
          current.map((post) => {
            if (post._id === postId) {
              const updatedComments = [
                ...(post.comments || []),
                response.data!.comment,
              ];
              return {
                ...post,
                comments: updatedComments,
              };
            }
            return post;
          })
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        setExpandedComments((prev) => ({ ...prev, [postId]: true }));
        toast.success("Comment added!");
      }
    } catch (err: any) {
      toast.error(err.message || "Unable to post comment");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl">Community Support</h1>
          {userType === "elder" && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
              Mentor View
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          {userType === "elder"
            ? "Connect with students, share guiding experiences, and leave uplifting words of encouragement."
            : "Share encouragement, read lived experiences, and know you're not alone."}
        </p>
      </motion.div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && error && (
        <Card className="p-8 mb-8 text-center bg-white/80 rounded-2xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadCommunity} variant="outline" className="mt-4 rounded-full">
            Try again
          </Button>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {/* Encouragement Wall */}
          <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-3xl mb-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl">Encouragement Wall</h2>
              </div>
              <Button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full shadow-sm hover:opacity-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                {userType === "elder" ? "Encourage Someone" : "Add Note"}
              </Button>
            </div>

            {showNoteInput && (
              <div className="mb-6">
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder={
                    userType === "elder"
                      ? "Share a brief uplifting piece of advice or encouragement for a student…"
                      : "Share an encouraging message…"
                  }
                  className="w-full p-4 rounded-xl bg-white/80 border border-border resize-none mb-3 h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                  <Button onClick={addNote} className="rounded-full">
                    Post
                  </Button>
                  <Button
                    onClick={() => setShowNoteInput(false)}
                    variant="outline"
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                  No notes yet. Be the first to encourage someone.
                </p>
              ) : (
                notes.slice(0, 12).map((note) => (
                  <div key={note._id} className="bg-white/90 p-5 rounded-xl shadow-md border border-white/60">
                    <p className="text-sm text-center italic">“{note.message}”</p>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Shared Experiences */}
          <Card className="p-6 lg:p-8 bg-white/80 border-border rounded-3xl mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl">Shared Experiences</h2>
                <p className="text-muted-foreground">
                  Anonymous stories and reflections from students and mentors.
                </p>
              </div>
              <Button
                onClick={() => setShowPostInput(!showPostInput)}
                className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full shadow-sm hover:opacity-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                {userType === "elder" ? "Share Wisdom / Story" : "Share Story"}
              </Button>
            </div>

            {showPostInput && (
              <div className="mb-6 p-4 bg-muted/50 rounded-2xl space-y-3 border border-border/60">
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder={userType === "elder" ? "Story title or reflection topic" : "Story title"}
                  className="w-full p-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {[
                    "Academic Stress",
                    "Loneliness",
                    "Mental Health",
                    "Career",
                    "Relationships",
                    "Adjustment",
                    "General",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <textarea
                  value={newContent}
                  onChange={(event) => setNewContent(event.target.value)}
                  placeholder={
                    userType === "elder"
                      ? "Share a life experience or advice that could help students going through tough times…"
                      : "Share your experience…"
                  }
                  className="w-full p-3 rounded-xl border border-border bg-white h-28 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                  <Button onClick={addPost} className="rounded-full">
                    Publish
                  </Button>
                  <Button
                    onClick={() => setShowPostInput(false)}
                    variant="outline"
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No stories yet. Start the conversation.
                </p>
              ) : (
                posts.map((post) => {
                  const commentsCount = post.comments?.length || 0;
                  const isCommentsOpen = !!expandedComments[post._id];

                  return (
                    <Card
                      key={post._id}
                      className="p-6 bg-white/70 border-border rounded-2xl hover:bg-white/90 transition-all shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                          <span className="text-xl">💙</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-lg font-medium">{post.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block bg-muted px-3 py-0.5 rounded-full text-xs text-muted-foreground">
                                  {post.category}
                                </span>
                                {post.authorId?.anonymousHandle && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    by {post.authorId.anonymousHandle}
                                    {post.authorId.userType === "elder" ? (
                                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-200">
                                        Mentor
                                      </span>
                                    ) : post.authorId.userType === "student" ? (
                                      <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-[10px] font-medium border border-sky-200">
                                        Student
                                      </span>
                                    ) : null}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <p className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap leading-relaxed">
                            {post.content}
                          </p>

                          {/* Reaction & Comment actions */}
                          <div className="flex items-center gap-5 pt-1">
                            <button
                              type="button"
                              onClick={() => toggleHeart(post)}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Heart
                                className={`w-5 h-5 transition-transform active:scale-125 ${
                                  post.isHearted ? "fill-primary text-primary" : ""
                                }`}
                              />
                              <span>{post.heartCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleComments(post._id)}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span>
                                {commentsCount} {commentsCount === 1 ? "Comment" : "Comments"}
                              </span>
                              {isCommentsOpen ? (
                                <ChevronUp className="w-4 h-4 ml-0.5" />
                              ) : (
                                <ChevronDown className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                          </div>

                          {/* Expandable Comments Drawer */}
                          {isCommentsOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-border/60 space-y-3"
                            >
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Discussion ({commentsCount})
                              </h4>

                              {/* Comment List */}
                              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                {commentsCount === 0 ? (
                                  <p className="text-xs text-muted-foreground italic py-2">
                                    No comments yet. Be the first to share your thoughts or words of encouragement!
                                  </p>
                                ) : (
                                  post.comments?.map((comment) => (
                                    <div
                                      key={comment._id}
                                      className="p-3 bg-muted/40 rounded-xl text-sm space-y-1 border border-border/40"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-medium text-xs text-primary">
                                            {comment.anonymousHandle}
                                          </span>
                                          {comment.authorRole === "elder" ? (
                                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[9px] font-medium border border-amber-200">
                                              Mentor
                                            </span>
                                          ) : comment.authorRole === "student" ? (
                                            <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full text-[9px] font-medium border border-sky-200">
                                              Student
                                            </span>
                                          ) : null}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-snug">
                                        {comment.content}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* New Comment Input */}
                              <div className="flex gap-2 items-center pt-2">
                                <input
                                  type="text"
                                  value={commentInputs[post._id] || ""}
                                  onChange={(e) => handleCommentChange(post._id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      void submitComment(post._id);
                                    }
                                  }}
                                  placeholder={
                                    userType === "elder"
                                      ? "Leave supportive advice or encouragement..."
                                      : "Write a supportive comment..."
                                  }
                                  className="flex-1 px-4 py-2 text-sm rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  maxLength={1000}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    submittingComment[post._id] ||
                                    !(commentInputs[post._id] || "").trim()
                                  }
                                  onClick={() => void submitComment(post._id)}
                                  className="rounded-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white px-4 h-9 shadow-sm hover:opacity-95"
                                >
                                  {submittingComment[post._id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
