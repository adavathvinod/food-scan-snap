# Smart Food Ads & Product Recommendations Feature

## Overview
After each successful food scan, users will see a "You May Also Like" section showing 3-5 related dishes or food products based on the scanned item.

## Features Implemented

### 1. **Food Recommendations Component** (`src/components/FoodRecommendations.tsx`)
- Displays related food items in a beautiful horizontal scrollable card layout
- Each card shows:
  - Food/product image
  - Name
  - Short description (1-2 lines)
  - Tag badge (e.g., "Low Calorie", "Protein Rich", "Popular")
  - "Order Now" button with external link
  - Platform indicator (Zomato, Swiggy, Amazon, Flipkart)

### 2. **AI-Powered Recommendations** (`supabase/functions/get-food-recommendations/index.ts`)
- Uses Lovable AI (Gemini) to generate contextual recommendations
- Specialized for Indian cuisine (biryani, rotis, curries, dal, sambar, etc.)
- Also handles international foods
- Provides complementary items (e.g., if biryani, suggests raita, curry)
- Supports multi-language responses (English, Hindi, Telugu)

### 3. **Settings Toggle** (`src/pages/Settings.tsx`)
- New "Smart Recommendations" section with ON/OFF toggle
- When OFF, recommendations section is completely hidden
- Setting persists across sessions via localStorage

### 4. **Seamless Integration** (`src/pages/Index.tsx`)
- Recommendations appear automatically after each successful scan
- Non-intrusive design below the nutrition card
- Does not affect existing scanning or analysis functionality

## How It Works

1. **User scans food** → Gets nutrition data
2. **Food name is sent** to the recommendations edge function
3. **AI generates** 3-5 related items based on:
   - Food type (rice, curry, salad, etc.)
   - User's dietary patterns (if available)
   - Indian food specialties
4. **Recommendations displayed** with images and links
5. **User can click** "Order Now" to open food delivery or shopping platforms

## Fallback System

If the AI service fails or is unavailable:
- System uses **static dummy recommendations** based on food categories
- Ensures the feature always works, even without API connection

## Multi-Language Support

- Recommendations adapt to user's selected language
- Currently supports: English, Hindi, Telugu
- Can be extended to other languages (Tamil, Kannada, Malayalam, etc.)

## Performance Optimization

- **Lazy loading** of images
- **Horizontal scroll** for smooth mobile experience
- **Skeleton loaders** while fetching recommendations
- **Non-blocking** - doesn't slow down scan results

## Indian Food Specialization

The system recognizes and provides contextual recommendations for:
- **Rice dishes**: Biryani, Pulao, Fried Rice
- **Rotis & Breads**: Chapati, Naan, Paratha
- **Curries**: Paneer dishes, Chicken curries, Dal varieties
- **South Indian**: Dosa, Idli, Sambar, Vada
- **Street Foods**: Pani Puri, Bhel Puri, Vada Pav
- **Healthy Options**: Salads, Juices, Smoothies

## Monetization Ready

The feature includes:
- External links to food delivery platforms (Zomato, Swiggy)
- Shopping links (Amazon, Flipkart)
- Easy integration for affiliate tracking (add affiliate IDs to URLs)
- Platform attribution for each recommendation

## User Privacy

- Recommendations are generated based only on the current scanned food
- No user data is shared with third-party platforms
- Links open in new tabs/external apps

## Settings

Users can control recommendations via **Settings → Smart Recommendations**:
- **ON**: Show recommendations after each scan
- **OFF**: Hide recommendations completely

## Future Enhancements (Optional)

1. **Personalization**: Learn user preferences over time
2. **Affiliate Links**: Add tracking codes for monetization
3. **Local Stores**: Show nearby restaurant recommendations
4. **Nutritional Comparison**: Compare recommended items' nutrition
5. **User Ratings**: Display ratings/reviews for recommended items
6. **Sponsored Ads**: Premium placement for partner restaurants/brands

## Technical Details

- **Component**: React functional component with hooks
- **State Management**: Local state + localStorage
- **API**: Supabase Edge Function with Lovable AI
- **Styling**: Tailwind CSS with design system tokens
- **Performance**: Optimized with lazy loading and caching
- **Accessibility**: Proper ARIA labels and semantic HTML

## Testing

To test the feature:
1. Scan any food item
2. Scroll below the nutrition card
3. See "You May Also Like" section with recommendations
4. Click "Order Now" to test external links
5. Toggle OFF in Settings to hide recommendations
6. Toggle ON to show them again

## Credits

- AI powered by Lovable AI (Gemini)
- Images from Unsplash
- Design follows FoodyScan's existing UI/UX patterns
