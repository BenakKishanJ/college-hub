// components/TextInput.tsx
import { TextInput as RNTextInput, TextInputProps } from "react-native";
import { forwardRef } from "react";

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <RNTextInput
        ref={ref}
        className={`text-white ${className}`}
        placeholderTextColor="#6B7280"
        {...props}
      />
    );
  },
);

TextInput.displayName = "TextInput";
