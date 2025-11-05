import { useRef, useEffect } from "react";
import { Apple } from "lucide-react";

interface StoryTemplateProps {
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  imageUrl: string;
  template: "minimal" | "bold" | "dark";
  caption?: string;
  showWatermark: boolean;
}

const StoryTemplate = ({
  foodName,
  calories,
  protein,
  fat,
  carbs,
  imageUrl,
  template,
  caption,
  showWatermark,
}: StoryTemplateProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions (Instagram story size)
    canvas.width = 1080;
    canvas.height = 1920;

    // Load and draw background image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Draw background image with darkening overlay
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Apply template-specific styling
      if (template === "minimal") {
        drawMinimalTemplate(ctx, canvas, foodName, calories, protein, fat, carbs, caption, showWatermark);
      } else if (template === "bold") {
        drawBoldTemplate(ctx, canvas, foodName, calories, protein, fat, carbs, caption, showWatermark);
      } else if (template === "dark") {
        drawDarkTemplate(ctx, canvas, foodName, calories, protein, fat, carbs, caption, showWatermark);
      }
    };
    img.src = imageUrl;
  }, [foodName, calories, protein, fat, carbs, imageUrl, template, caption, showWatermark]);

  const drawMinimalTemplate = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    foodName: string,
    calories: number,
    protein: number,
    fat: number,
    carbs: number,
    caption?: string,
    showWatermark?: boolean
  ) => {
    // Light overlay
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Food name at top
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 20;
    ctx.fillText(foodName, canvas.width / 2, 180);

    // Nutrition info card (white semi-transparent)
    ctx.shadowBlur = 30;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillRect(90, canvas.height - 580, canvas.width - 180, 420);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Nutrition details
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "left";
    
    const startY = canvas.height - 520;
    const startX = 140;
    
    ctx.fillText(`🔥 ${calories} kcal`, startX, startY);
    ctx.fillText(`💪 Protein: ${protein}g`, startX, startY + 90);
    ctx.fillText(`🥑 Fat: ${fat}g`, startX, startY + 180);
    ctx.fillText(`🌾 Carbs: ${carbs}g`, startX, startY + 270);

    // Caption if provided
    if (caption) {
      ctx.font = "40px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 15;
      wrapText(ctx, caption, canvas.width / 2, 320, canvas.width - 180, 50);
      ctx.shadowBlur = 0;
    }

    // Watermark
    if (showWatermark) {
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#666666";
      ctx.textAlign = "center";
      ctx.fillText("#FoodyScan — Know What You Eat 🍽️", canvas.width / 2, canvas.height - 100);
    }
  };

  const drawBoldTemplate = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    foodName: string,
    calories: number,
    protein: number,
    fat: number,
    carbs: number,
    caption?: string,
    showWatermark?: boolean
  ) => {
    // Gradient overlay (orange to pink)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(255, 107, 53, 0.6)");
    gradient.addColorStop(1, "rgba(255, 53, 127, 0.6)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Food name with bold style
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 90px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#ff6b35";
    ctx.lineWidth = 8;
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 25;
    ctx.strokeText(foodName, canvas.width / 2, 180);
    ctx.fillText(foodName, canvas.width / 2, 180);

    // Colorful nutrition boxes
    ctx.shadowBlur = 20;
    const boxY = canvas.height - 700;
    const boxHeight = 140;
    const boxSpacing = 20;
    
    // Calories box (red)
    ctx.fillStyle = "rgba(255, 75, 75, 0.9)";
    ctx.fillRect(90, boxY, canvas.width - 180, boxHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`🔥 ${calories} kcal`, canvas.width / 2, boxY + 90);

    // Protein box (blue)
    ctx.fillStyle = "rgba(75, 144, 255, 0.9)";
    ctx.fillRect(90, boxY + boxHeight + boxSpacing, canvas.width - 180, boxHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`💪 Protein: ${protein}g`, canvas.width / 2, boxY + boxHeight + boxSpacing + 90);

    // Fat box (green)
    ctx.fillStyle = "rgba(75, 255, 144, 0.9)";
    ctx.fillRect(90, boxY + (boxHeight + boxSpacing) * 2, canvas.width - 180, boxHeight);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillText(`🥑 Fat: ${fat}g`, canvas.width / 2, boxY + (boxHeight + boxSpacing) * 2 + 90);

    // Carbs box (yellow)
    ctx.fillStyle = "rgba(255, 204, 75, 0.9)";
    ctx.fillRect(90, boxY + (boxHeight + boxSpacing) * 3, canvas.width - 180, boxHeight);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillText(`🌾 Carbs: ${carbs}g`, canvas.width / 2, boxY + (boxHeight + boxSpacing) * 3 + 90);

    // Caption
    if (caption) {
      ctx.font = "bold 45px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 20;
      wrapText(ctx, caption, canvas.width / 2, 320, canvas.width - 180, 55);
      ctx.shadowBlur = 0;
    }

    // Watermark
    if (showWatermark) {
      ctx.font = "bold 45px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#ff6b35";
      ctx.lineWidth = 4;
      ctx.strokeText("#FoodyScan 🍽️", canvas.width / 2, canvas.height - 100);
      ctx.fillText("#FoodyScan 🍽️", canvas.width / 2, canvas.height - 100);
    }
  };

  const drawDarkTemplate = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    foodName: string,
    calories: number,
    protein: number,
    fat: number,
    carbs: number,
    caption?: string,
    showWatermark?: boolean
  ) => {
    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Food name with elegant style
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 85px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.shadowBlur = 30;
    ctx.fillText(foodName, canvas.width / 2, 180);

    // Sleek dark card
    ctx.shadowBlur = 40;
    ctx.shadowColor = "rgba(255, 215, 0, 0.3)";
    ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
    ctx.fillRect(90, canvas.height - 650, canvas.width - 180, 480);

    // Gold accent line
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(90, canvas.height - 650, canvas.width - 180, 8);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Nutrition details with gold accents
    ctx.font = "bold 55px Arial";
    ctx.textAlign = "left";
    
    const startY = canvas.height - 570;
    const startX = 140;
    
    ctx.fillStyle = "#ffd700";
    ctx.fillText("🔥", startX, startY);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${calories} kcal`, startX + 80, startY);

    ctx.fillStyle = "#ffd700";
    ctx.fillText("💪", startX, startY + 100);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Protein: ${protein}g`, startX + 80, startY + 100);

    ctx.fillStyle = "#ffd700";
    ctx.fillText("🥑", startX, startY + 200);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Fat: ${fat}g`, startX + 80, startY + 200);

    ctx.fillStyle = "#ffd700";
    ctx.fillText("🌾", startX, startY + 300);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Carbs: ${carbs}g`, startX + 80, startY + 300);

    // Caption
    if (caption) {
      ctx.font = "italic 42px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
      ctx.shadowBlur = 15;
      wrapText(ctx, caption, canvas.width / 2, 320, canvas.width - 180, 52);
      ctx.shadowBlur = 0;
    }

    // Watermark
    if (showWatermark) {
      ctx.font = "bold 42px Arial";
      ctx.fillStyle = "#ffd700";
      ctx.textAlign = "center";
      ctx.fillText("#FoodyScan — Know What You Eat 🍽️", canvas.width / 2, canvas.height - 100);
    }
  };

  // Helper function to wrap text
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto max-h-[600px] object-contain rounded-lg border border-border"
    />
  );
};

export default StoryTemplate;
