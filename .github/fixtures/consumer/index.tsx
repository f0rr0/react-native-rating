import { useState } from "react";
import { Text } from "react-native";
import { Rating } from "react-native-rating";
import type { RatingRenderItemProps } from "react-native-rating";

const renderItem = ({ fill, index }: RatingRenderItemProps) => (
  <Text>{`${index + 1}:${fill}`}</Text>
);

export const RatingConsumer = () => {
  const [value, setValue] = useState(3.5);

  return (
    <Rating
      accessibilityLabel="Review score"
      max={5}
      onChange={setValue}
      renderItem={renderItem}
      step={0.5}
      value={value}
    />
  );
};
