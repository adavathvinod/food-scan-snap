import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Calendar, Flame } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FoodStory {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  template_style: string;
  caption: string | null;
  image_url: string;
  story_image_url: string | null;
  created_at: string;
}

const StoryGallery = () => {
  const [user, setUser] = useState<any>(null);
  const [stories, setStories] = useState<FoodStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadStories(session.user.id);
      }
    };
    checkUser();
  }, [navigate]);

  const loadStories = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("food_stories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("Error loading stories:", error);
      toast.error("Failed to load your stories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("food_stories")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setStories(stories.filter((s) => s.id !== deleteId));
      toast.success("Story deleted successfully");
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Failed to delete story");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading || !user) {
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
      <div className="container max-w-4xl mx-auto p-4 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Story Gallery 📸</h1>
          <p className="text-muted-foreground">
            Your collection of shared food stories
          </p>
        </div>

        {stories.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                No Stories Yet
              </h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Scan your food first to create your first Foody Story!
              </p>
              <Button onClick={() => navigate("/")} size="lg">
                Start Scanning
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((story) => (
              <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[9/16] bg-muted">
                  {story.story_image_url ? (
                    <img
                      src={story.story_image_url}
                      alt={story.food_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={story.image_url}
                      alt={story.food_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full shadow-lg"
                      onClick={() => setDeleteId(story.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-1 text-foreground">
                    {story.food_name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(story.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {story.calories} kcal
                    </span>
                    <span className="text-muted-foreground">
                      P: {story.protein}g | F: {story.fat}g | C: {story.carbs}g
                    </span>
                  </div>

                  {story.caption && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {story.caption}
                    </p>
                  )}

                  <div className="mt-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                      {story.template_style}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Story?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your food story.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default StoryGallery;
