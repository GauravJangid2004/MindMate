import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Heart, MessageCircle, Plus, Sparkles } from "lucide-react";

const encouragingQuotes = [
  "You survived today. That's enough.",
  "Your feelings are valid.",
  "Exams don't define you.",
  "Someone believes in you.",
  "It's okay to ask for help.",
  "You are stronger than you think.",
  "Taking it one day at a time is okay.",
  "You matter, even on your hardest days.",
  "Progress, not perfection.",
  "Your mental health matters more than grades.",
];

const studentStories = [
  {
    id: 1,
    title: "How I Overcame Exam Anxiety",
    excerpt: "I used to panic before every test. Here's what helped me...",
    category: "Academic Stress",
    hearts: 124,
    comments: 23,
    timeAgo: "2 days ago",
  },
  {
    id: 2,
    title: "Finding Friends After Moving Away",
    excerpt: "Leaving home was hard, but I learned that connection is possible...",
    category: "Loneliness",
    hearts: 98,
    comments: 15,
    timeAgo: "5 days ago",
  },
  {
    id: 3,
    title: "My Journey with Depression",
    excerpt: "It wasn't easy, but reaching out changed everything...",
    category: "Mental Health",
    hearts: 156,
    comments: 34,
    timeAgo: "1 week ago",
  },
  {
    id: 4,
    title: "Dealing with Career Confusion",
    excerpt: "Not knowing what to do after graduation felt overwhelming...",
    category: "Career",
    hearts: 87,
    comments: 19,
    timeAgo: "1 week ago",
  },
];

export function Community() {
  const [encouragementWall, setEncouragementWall] = useState(encouragingQuotes);
  const [newMessage, setNewMessage] = useState("");
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [likedStories, setLikedStories] = useState<number[]>([]);

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      setEncouragementWall([newMessage, ...encouragementWall]);
      setNewMessage("");
      setShowMessageInput(false);
    }
  };

  const toggleLike = (storyId: number) => {
    setLikedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Community Support</h1>
        <p className="text-muted-foreground">
          Share encouragement, read inspiring stories, and know you're not alone.
        </p>
      </motion.div>

      {/* Encouragement Wall */}
      <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-3xl mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl">Encouragement Wall</h2>
          </div>
          <Button
            onClick={() => setShowMessageInput(!showMessageInput)}
            className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>

        {showMessageInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6"
          >
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share an encouraging message..."
              className="w-full p-4 rounded-xl bg-white/80 border border-border resize-none mb-3 h-24 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddMessage}
                className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full"
              >
                Post
              </Button>
              <Button
                onClick={() => {
                  setShowMessageInput(false);
                  setNewMessage("");
                }}
                variant="outline"
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {encouragementWall.slice(0, 9).map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-md border border-white/50 cursor-default"
            >
              <p className="text-sm text-center text-foreground italic">"{message}"</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Student Stories */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Shared Experiences</h2>
        <p className="text-muted-foreground mb-6">
          Real stories from students who've been through similar challenges.
        </p>

        <div className="space-y-4">
          {studentStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-lg transition-all rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">💙</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-lg mb-1">{story.title}</h3>
                        <span className="inline-block bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {story.category}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {story.timeAgo}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{story.excerpt}</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(story.id)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            likedStories.includes(story.id)
                              ? "fill-primary text-primary"
                              : ""
                          }`}
                        />
                        <span>
                          {story.hearts + (likedStories.includes(story.id) ? 1 : 0)}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>{story.comments}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Community Guidelines */}
      <Card className="p-6 bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border-none rounded-2xl">
        <h3 className="mb-3">Community Guidelines</h3>
        <ul className="space-y-2 text-sm text-accent-foreground">
          <li className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Be kind, supportive, and non-judgmental</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Respect everyone's anonymity and privacy</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Share your experiences to help others feel less alone</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>If you see concerning content, report it to mentors</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
