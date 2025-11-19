import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HealthConditionsBadge } from "@/components/HealthConditionsBadge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadChatHistory();
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    // Handle initial message from navigation state
    const state = location.state as { initialMessage?: string };
    if (state?.initialMessage && messages.length === 0) {
      setInput(state.initialMessage);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_history")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;
      
      const msgs: Message[] = data?.map(d => ({
        role: d.role as "user" | "assistant",
        content: d.content
      })) || [];
      
      setMessages(msgs);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const sendMessage = async (messageText?: string, imageData?: string) => {
    if (!user) return;
    
    const text = messageText || input.trim();
    if (!text && !imageData) return;

    setLoading(true);
    
    const userMessage: Message = {
      role: "user",
      content: imageData ? "[Image]" : text
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: { 
          message: text,
          image: imageData,
          userId: user.id 
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
      
      // Remove failed user message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onloadend = () => {
      sendMessage("Analyze this image", reader.result as string);
    };
  };

  const clearHistory = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("chat_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      
      setMessages([]);
      toast.success("Chat history cleared");
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Failed to clear history");
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Health Assistant</h1>
            <p className="text-sm text-muted-foreground">Ask me anything about nutrition and health</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearHistory}
            disabled={messages.length === 0}
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <Card className="border-dashed bg-secondary/20">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Start a conversation! Ask me about:
                </p>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>• Nutrition advice for specific conditions</p>
                  <p>• Meal planning and recipes</p>
                  <p>• Indian diet recommendations</p>
                  <p>• Health tips and guidance</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <Card className="bg-card">
                <CardContent className="p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="chat-image-upload"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('chat-image-upload')?.click()}
              disabled={loading}
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask about nutrition, health, or upload an image..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚠️ For information only — consult a doctor for medical advice.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;
