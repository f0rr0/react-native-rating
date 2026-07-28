import { useState } from "react";
import { Text } from "react-native";
import { Rating, RatingDisplay, RatingScale } from "react-native-rating";
import type {
  RatingRenderItemProps,
  RatingScaleItem,
  RatingScaleRenderItemProps,
} from "react-native-rating";

type Sentiment = "negative" | "neutral" | "positive";

const sentimentItems = [
  { content: "😞", label: "Negative", value: "negative" },
  { content: "😐", label: "Neutral", value: "neutral" },
  { content: "🙂", label: "Positive", value: "positive" },
] as const satisfies readonly RatingScaleItem<Sentiment>[];

const renderItem = ({ fill, index }: RatingRenderItemProps) => (
  <Text>{`${index + 1}:${fill}`}</Text>
);

const renderScaleItem = ({
  content,
  label,
  selected,
}: RatingScaleRenderItemProps<Sentiment>) => (
  <Text>{`${content ?? label}:${selected}`}</Text>
);

// @ts-expect-error Interactive accessibility ownership cannot be overridden.
const _hiddenInteractiveRating = <Rating accessible />;

export const RatingConsumer = () => {
  const [value, setValue] = useState(3.5);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);

  return (
    <>
      <Rating
        accessibilityLabel="Review score"
        interactionMode="tap-and-drag"
        max={5}
        onChange={setValue}
        renderItem={renderItem}
        step={0.5}
        value={value}
      />
      <RatingDisplay
        accessibilityLabel="Average review score"
        decorative
        renderItem={renderItem}
        value={4.37}
      />
      <RatingScale
        accessibilityLabel="Sentiment"
        focusStyle={{ outlineColor: "#0F766E" }}
        itemExtent={72}
        items={sentimentItems}
        onChange={setSentiment}
        renderItem={renderScaleItem}
        value={sentiment}
      />
    </>
  );
};
