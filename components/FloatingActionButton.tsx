// components/FloatingActionButton.tsx
import { TouchableOpacity, View } from "react-native";
import { Plus } from "lucide-react-native";

interface FloatingActionButtonProps {
  onPress: () => void;
  visible?: boolean;
  position?: "bottom-right" | "bottom-center" | "bottom-left";
}

export default function FloatingActionButton({
  onPress,
  visible = true,
  position = "bottom-right",
}: FloatingActionButtonProps) {
  if (!visible) return null;

  const positionStyles = {
    "bottom-right": "bottom-4 right-4",
    "bottom-center": "bottom-4 self-center",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <View className={`absolute ${positionStyles[position]}`}>
      <TouchableOpacity
        onPress={onPress}
        className="bg-blue-500 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-black/30"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
