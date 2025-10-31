import { supabase } from "@/integrations/supabase/client";

export const initializeOneSignal = async () => {
  const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
  
  if (!ONESIGNAL_APP_ID) {
    console.warn("OneSignal App ID not configured");
    return;
  }

  try {
    // Initialize OneSignal SDK
    const OneSignal = (window as any).OneSignal || [];
    OneSignal.push(() => {
      OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: "web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        notifyButton: {
          enable: false,
        },
        allowLocalhostAsSecureOrigin: true,
      });
    });
  } catch (error) {
    console.error("Failed to initialize OneSignal:", error);
  }
};

export const scheduleMealReminders = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: mealSchedules } = await supabase
      .from("meal_schedules")
      .select("*")
      .eq("user_id", user.id)
      .eq("reminder_enabled", true);

    if (!mealSchedules || mealSchedules.length === 0) return;

    // Schedule notifications for each meal
    for (const meal of mealSchedules) {
      const mealTime = meal.meal_time;
      const [hours, minutes] = mealTime.split(':').map(Number);
      
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0, 0);

      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      // Create notification payload
      const notification = {
        contents: { en: `Time for ${meal.meal_name}!` },
        headings: { en: "Meal Reminder" },
        data: { 
          mealId: meal.id,
          mealName: meal.meal_name,
          instructions: meal.meal_instructions 
        },
        send_after: scheduledTime.toISOString(),
      };

      console.log(`Scheduled reminder for ${meal.meal_name} at ${scheduledTime}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to schedule meal reminders:", error);
    return false;
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return false;
  }
};
