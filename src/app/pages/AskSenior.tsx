import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MessageCircle, TrendingUp, Heart, Clock } from "lucide-react";

const questions = [
  {
    id: 1,
    question: "How do I handle career confusion after graduation?",
    category: "Career",
    askedBy: "Anonymous Student",
    timeAgo: "2 hours ago",
    answers: 12,
    helpful: 45,
    preview: "I was exactly where you are. Here's what helped me find my path...",
  },
  {
    id: 2,
    question: "Tips for adjusting to hostel life away from home?",
    category: "Adjustment",
    askedBy: "Anonymous First Year",
    timeAgo: "5 hours ago",
    answers: 8,
    helpful: 32,
    preview: "The first month is the hardest. Start by making small connections...",
  },
  {
    id: 3,
    question: "How to deal with failure and self-doubt?",
    category: "Mental Health",
    askedBy: "Anonymous",
    timeAgo: "1 day ago",
    answers: 15,
    helpful: 67,
    preview: "Failure is part of growth. What matters is how you respond...",
  },
  {
    id: 4,
    question: "Balancing studies with relationships?",
    category: "Relationships",
    askedBy: "Anonymous Student",
    timeAgo: "2 days ago",
    answers: 10,
    helpful: 28,
    preview: "Communication is key. Here's what worked for me...",
  },
  {
    id: 5,
    question: "How to maintain mental health during exam season?",
    category: "Academic Stress",
    askedBy: "Anonymous",
    timeAgo: "3 days ago",
    answers: 20,
    helpful: 89,
    preview: "Exams can be overwhelming. These strategies helped me stay sane...",
  },
];

const categories = ["All", "Career", "Academic Stress", "Relationships", "Adjustment", "Mental Health"];

export function AskSenior() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [questionCategory, setQuestionCategory] = useState("Career");

  const filteredQuestions = selectedCategory === "All"
    ? questions
    : questions.filter((q) => q.category === selectedCategory);

  const handleSubmitQuestion = () => {
    if (newQuestion.trim()) {
      // Submit logic would go here
      setNewQuestion("");
      setShowAskForm(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Ask a Senior</h1>
        <p className="text-muted-foreground">
          Get advice from those who've been through similar challenges
        </p>
      </motion.div>

      {/* Ask Question CTA */}
      <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-3xl mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl mb-2">Have a Question?</h2>
            <p className="text-muted-foreground mb-4">
              Ask anonymously and get support from seniors, alumni, and experienced students.
            </p>
            <Button
              onClick={() => setShowAskForm(!showAskForm)}
              className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full px-6"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Ask Your Question
            </Button>
          </div>
        </div>

        {showAskForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 pt-6 border-t border-white/30"
          >
            <div className="bg-white/80 rounded-xl p-4">
              <select
                value={questionCategory}
                onChange={(e) => setQuestionCategory(e.target.value)}
                className="w-full p-3 rounded-lg border border-border mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What would you like to ask? (completely anonymous)"
                className="w-full p-4 rounded-lg border border-border resize-none mb-3 h-32 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitQuestion}
                  className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full"
                >
                  Post Question
                </Button>
                <Button
                  onClick={() => {
                    setShowAskForm(false);
                    setNewQuestion("");
                  }}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <Badge
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`cursor-pointer px-4 py-2 rounded-full transition-all ${
              selectedCategory === category
                ? "bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white hover:from-[#A78BFA] hover:to-[#8B5CF6]"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-lg transition-all rounded-2xl cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="text-lg group-hover:text-primary transition-colors flex-1">
                      {q.question}
                    </h3>
                    <Badge className="bg-[#E9E4FF] text-[#6B21A8] hover:bg-[#E9E4FF] text-xs">
                      {q.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{q.preview}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{q.answers} answers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{q.helpful} helpful</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{q.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <Card className="p-12 bg-white/80 backdrop-blur-sm rounded-2xl text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No questions found in this category yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Be the first to ask!</p>
        </Card>
      )}
    </div>
  );
}
