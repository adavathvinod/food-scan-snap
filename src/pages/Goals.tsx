import { useEffect, useState, memo, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Scale } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { startOfWeek, format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

// Lazy load heavy chart components
const BarChart = lazy(() => import("recharts").then(m => ({ default: m.BarChart })));
const Bar = lazy(() => import("recharts").then(m => ({ default: m.Bar })));
const XAxis = lazy(() => import("recharts").then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import("recharts").then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import("recharts").then(m => ({ default: m.Tooltip })));
const ResponsiveContainer = lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })));
const PieChart = lazy(() => import("recharts").then(m => ({ default: m.PieChart })));
const Pie = lazy(() => import("recharts").then(m => ({ default: m.Pie })));
const Cell = lazy(() => import("recharts").then(m => ({ default: m.Cell })));
const LineChart = lazy(() => import("recharts").then(m => ({ default: m.LineChart })));
const Line = lazy(() => import("recharts").then(m => ({ default: m.Line })));

interface UserGoals {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_fat_goal: number;
  daily_carbs_goal: number;
}

interface DailyTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Goals = () => {
  const [newWeight, setNewWeight] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [editing, setEditing] = useState(false);
  const [goals, setGoals] = useState<UserGoals>({
    daily_calorie_goal: 2000,
    daily_protein_goal: 50,
    daily_fat_goal: 70,
    daily_carbs_goal: 250,
  });
  const queryClient = useQueryClient();
  
  const { t, loading: translationLoading } = useTranslation([
    "Goals & Progress", "Today's Progress", "Track your daily nutritional intake",
    "Calories", "Protein", "Fat", "Carbs", "Weekly Calorie Trend",
    "Today's Macros Distribution", "Weight Tracking", "Monitor your weight progress over time",
    "Weight (kg)", "Height (cm) - Optional", "Add Entry", "Daily Goals",
    "Set your daily nutritional targets", "Daily Calorie Goal", "Daily Protein Goal (g)",
    "Daily Fat Goal (g)", "Daily Carbs Goal (g)", "Save Goals", "Cancel", "Edit Goals",
    "Weight entry added!", "Failed to add weight entry", "Please enter your weight",
    "Goals updated successfully!", "Failed to save goals"
  ]);

  // Fetch all data with React Query for caching
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ["userGoals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: todayTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 }, isLoading: todayLoading } = useQuery({
    queryKey: ["todayTotals"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("scan_history")
        .select("calories, protein, fat, carbs")
        .gte("scanned_at", today.toISOString());
      if (error) throw error;
      return data.reduce(
        (acc, scan) => ({
          calories: acc.calories + scan.calories,
          protein: acc.protein + scan.protein,
          fat: acc.fat + scan.fat,
          carbs: acc.carbs + scan.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      );
    },
  });

  const { data: weeklyData = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ["weeklyData"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date());
      const { data, error } = await supabase
        .from("scan_history")
        .select("calories, scanned_at")
        .gte("scanned_at", weekStart.toISOString());
      if (error) throw error;
      
      // Initialize all 7 days of the week with 0 calories
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyCalories: any = {};
      daysOfWeek.forEach(day => {
        dailyCalories[day] = 0;
      });
      
      // Add actual data
      data.forEach(scan => {
        const day = new Date(scan.scanned_at).toLocaleDateString('en-US', { weekday: 'short' });
        dailyCalories[day] = (dailyCalories[day] || 0) + scan.calories;
      });
      
      return daysOfWeek.map(day => ({ day, calories: dailyCalories[day] }));
    },
  });

  const { data: weightData = [], isLoading: weightLoading } = useQuery({
    queryKey: ["weightData"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_entries")
        .select("weight, height, recorded_at")
        .order("recorded_at", { ascending: true })
        .limit(30);
      if (error) throw error;
      return data.map(entry => ({
        date: format(new Date(entry.recorded_at), 'MMM dd'),
        weight: entry.weight,
        height: entry.height,
      }));
    },
  });

  useEffect(() => {
    if (goalsData) {
      setGoals({
        daily_calorie_goal: goalsData.daily_calorie_goal,
        daily_protein_goal: goalsData.daily_protein_goal,
        daily_fat_goal: goalsData.daily_fat_goal,
        daily_carbs_goal: goalsData.daily_carbs_goal,
      });
    }
  }, [goalsData]);

  const addWeightMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weight_entries").insert({
        user_id: user.id,
        weight: parseFloat(newWeight),
        height: newHeight ? parseFloat(newHeight) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Weight entry added!"));
      setNewWeight("");
      setNewHeight("");
      queryClient.invalidateQueries({ queryKey: ["weightData"] });
    },
    onError: () => toast.error(t("Failed to add weight entry")),
  });

  const saveGoalsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_goals").upsert({ user_id: user.id, ...goals });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Goals updated successfully!"));
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["userGoals"] });
    },
    onError: () => toast.error(t("Failed to save goals")),
  });

  const addWeightEntry = () => {
    if (!newWeight) {
      toast.error(t("Please enter your weight"));
      return;
    }
    addWeightMutation.mutate();
  };

  const saveGoals = () => saveGoalsMutation.mutate();

  const macrosData = [
    { name: 'Protein', value: todayTotals.protein },
    { name: 'Fat', value: todayTotals.fat },
    { name: 'Carbs', value: todayTotals.carbs },
  ];

  const loading = goalsLoading || todayLoading || weeklyLoading || weightLoading || translationLoading;

  if (loading) {
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
      <div className="container max-w-4xl mx-auto p-4 pt-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">{t("Goals & Progress")}</h1>

        {/* Today's Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Today's Progress")}</CardTitle>
            <CardDescription>{t("Track your daily nutritional intake")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{t("Calories")}</span>
                <span className="text-sm text-muted-foreground">
                  {todayTotals.calories} / {goals.daily_calorie_goal}
                </span>
              </div>
              <Progress value={(todayTotals.calories / goals.daily_calorie_goal) * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{t("Protein")}</span>
                <span className="text-sm text-muted-foreground">
                  {todayTotals.protein}g / {goals.daily_protein_goal}g
                </span>
              </div>
              <Progress value={(todayTotals.protein / goals.daily_protein_goal) * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{t("Fat")}</span>
                <span className="text-sm text-muted-foreground">
                  {todayTotals.fat}g / {goals.daily_fat_goal}g
                </span>
              </div>
              <Progress value={(todayTotals.fat / goals.daily_fat_goal) * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{t("Carbs")}</span>
                <span className="text-sm text-muted-foreground">
                  {todayTotals.carbs}g / {goals.daily_carbs_goal}g
                </span>
              </div>
              <Progress value={(todayTotals.carbs / goals.daily_carbs_goal) * 100} />
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calorie Trend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Weekly Calorie Trend")}</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto" />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data for this week yet</p>
            )}
          </CardContent>
        </Card>

        {/* Macros Distribution */}
        {todayTotals.calories > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("Today's Macros Distribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto" />}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={macrosData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}g`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macrosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Suspense>
            </CardContent>
          </Card>
        )}

        {/* Weight Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              {t("Weight Tracking")}
            </CardTitle>
            <CardDescription>{t("Monitor your weight progress over time")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>{t("Weight (kg)")}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>{t("Height (cm) - Optional")}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="175"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addWeightEntry} className="w-full">{t("Add Entry")}</Button>
            
            {weightData.length > 0 ? (
              <div className="mt-4">
                <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto" />}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Suspense>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Add weight entries to see your progress chart
              </p>
            )}
          </CardContent>
        </Card>

        {/* Goal Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Daily Goals")}</CardTitle>
            <CardDescription>{t("Set your daily nutritional targets")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Daily Calorie Goal")}</Label>
              <Input
                type="number"
                value={goals.daily_calorie_goal}
                onChange={(e) => setGoals({ ...goals, daily_calorie_goal: parseInt(e.target.value) })}
                disabled={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Daily Protein Goal (g)")}</Label>
              <Input
                type="number"
                value={goals.daily_protein_goal}
                onChange={(e) => setGoals({ ...goals, daily_protein_goal: parseFloat(e.target.value) })}
                disabled={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Daily Fat Goal (g)")}</Label>
              <Input
                type="number"
                value={goals.daily_fat_goal}
                onChange={(e) => setGoals({ ...goals, daily_fat_goal: parseFloat(e.target.value) })}
                disabled={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Daily Carbs Goal (g)")}</Label>
              <Input
                type="number"
                value={goals.daily_carbs_goal}
                onChange={(e) => setGoals({ ...goals, daily_carbs_goal: parseFloat(e.target.value) })}
                disabled={!editing}
              />
            </div>
            {editing ? (
              <div className="flex gap-2">
                <Button onClick={saveGoals} className="flex-1">{t("Save Goals")}</Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="flex-1">{t("Cancel")}</Button>
              </div>
            ) : (
              <Button onClick={() => setEditing(true)} className="w-full">{t("Edit Goals")}</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Goals;