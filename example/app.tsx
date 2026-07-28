import { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Rating, RatingDisplay, RatingScale } from "react-native-rating";
import type {
  RatingRenderItemProps,
  RatingScaleItem,
} from "react-native-rating";

const EXPERIENCE_ITEMS = [
  {
    content: "😕",
    label: "Needs work",
    value: -1,
  },
  {
    content: "😐",
    label: "It was okay",
    value: 0,
  },
  {
    content: "😊",
    label: "Loved it",
    value: 1,
  },
] as const satisfies readonly RatingScaleItem<number>[];

const styles = StyleSheet.create({
  app: {
    backgroundColor: "#FAF7F2",
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7E0D8",
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: "0 12px 32px rgba(64, 45, 28, 0.08)",
      },
    }),
  },
  content: {
    alignSelf: "center",
    gap: 20,
    maxWidth: 720,
    paddingBottom: 64,
    paddingHorizontal: 20,
    paddingTop: 48,
    width: "100%",
  },
  eyebrow: {
    color: "#9A3412",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  header: {
    gap: 10,
    marginBottom: 4,
  },
  hint: {
    color: "#6B625B",
    fontSize: 14,
    lineHeight: 20,
  },
  score: {
    color: "#292524",
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  staticRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  status: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    color: "#7C2D12",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subtitle: {
    color: "#57534E",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 600,
  },
  title: {
    color: "#1C1917",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 43,
  },
  sectionTitle: {
    color: "#292524",
    fontSize: 18,
    fontWeight: "700",
  },
  showcaseCell: {
    alignItems: "center",
    flexGrow: 1,
    gap: 10,
    minWidth: 220,
  },
  showcaseLabel: {
    color: "#57534E",
    fontSize: 13,
    fontWeight: "600",
  },
  showcaseRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "space-around",
  },
  customGlyph: {
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
  customGlyphActive: {
    position: "absolute",
  },
  customIcon: {
    overflow: "hidden",
  },
  customMask: {
    overflow: "hidden",
    position: "absolute",
  },
  customStart: {
    left: 0,
  },
  customEnd: {
    right: 0,
  },
  customBottom: {
    bottom: 0,
  },
  customTop: {
    top: 0,
  },
});

const formatScore = (value: number): string =>
  `${value.toFixed(2)} out of 5 stars`;

const renderHeart = ({
  activeColor,
  fill,
  fillOrigin,
  inactiveColor,
  size,
}: RatingRenderItemProps) => {
  const textStyle = [
    styles.customGlyph,
    {
      color: inactiveColor,
      fontSize: size * 0.88,
      height: size,
      lineHeight: size,
      width: size,
    },
  ];
  const fromEnd = fillOrigin === "right";
  const fromBottom = fillOrigin === "bottom";
  const verticalOrigin = fromBottom ? styles.customBottom : styles.customTop;

  return (
    <View style={[styles.customIcon, { height: size, width: size }]}>
      <Text allowFontScaling={false} selectable={false} style={textStyle}>
        ♡
      </Text>
      <View
        style={[
          styles.customMask,
          verticalOrigin,
          fromEnd ? styles.customEnd : styles.customStart,
          {
            height: fromBottom ? size * fill : size,
            width: fromBottom ? size : size * fill,
          },
        ]}
      >
        <Text
          allowFontScaling={false}
          selectable={false}
          style={[
            textStyle,
            styles.customGlyphActive,
            verticalOrigin,
            fromEnd ? styles.customEnd : styles.customStart,
            { color: activeColor },
          ]}
        >
          ♥
        </Text>
      </View>
    </View>
  );
};

export function App() {
  const [score, setScore] = useState(3.75);
  const [heartScore, setHeartScore] = useState(3.5);
  const [intensity, setIntensity] = useState(3);
  const [experience, setExperience] = useState<number | null>(0);
  const [status, setStatus] = useState(
    "Try touch, mouse, keyboard, or a screen reader."
  );

  const handleScoreEnd = useCallback((value: number): void => {
    setStatus(`Saved a ${value}-star rating.`);
  }, []);
  const handleExperienceEnd = useCallback((value: number | null): void => {
    const label =
      EXPERIENCE_ITEMS.find((item) => item.value === value)?.label ??
      "No selection";
    setStatus(`Saved “${label}”.`);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.app}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>React Native Rating</Text>
        <Text accessibilityRole="header" style={styles.title}>
          One input, every way people rate.
        </Text>
        <Text style={styles.subtitle}>
          Precise stars, quiet motion, semantic scales, and the same accessible
          interaction model on native and Web.
        </Text>
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Your rating
        </Text>
        <Rating
          accessibilityLabel="Your product rating"
          allowClear
          gap={6}
          interactionMode="tap-and-drag"
          min={0.25}
          onChange={setScore}
          onChangeEnd={handleScoreEnd}
          size={42}
          step={0.25}
          value={score}
        />
        <Text style={styles.score}>{score.toFixed(2)} / 5</Text>
        <Text style={styles.hint}>
          Drag across the stars. On Web, focus the control and use the arrow,
          Home, or End keys.
        </Text>
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          RTL, vertical, and your own icon
        </Text>
        <View style={styles.showcaseRow}>
          <View style={styles.showcaseCell}>
            <Text style={styles.showcaseLabel}>RTL custom hearts</Text>
            <Rating
              accessibilityLabel="RTL heart rating"
              activeColor="#BE123C"
              direction="rtl"
              gap={5}
              interactionMode="tap-and-drag"
              onChange={setHeartScore}
              renderItem={renderHeart}
              size={36}
              step={0.5}
              value={heartScore}
            />
            <Text style={styles.score}>{heartScore.toFixed(1)}</Text>
          </View>
          <View style={styles.showcaseCell}>
            <Text style={styles.showcaseLabel}>Vertical intensity</Text>
            <Rating
              accessibilityLabel="Vertical intensity"
              gap={2}
              interactionMode="tap-and-drag"
              onChange={setIntensity}
              orientation="vertical"
              size={32}
              value={intensity}
            />
          </View>
        </View>
        <Text style={styles.hint}>
          Direction, orientation, and fill origin stay explicit. The custom
          renderer receives the same fractional value used by input and
          accessibility.
        </Text>
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          How was the experience?
        </Text>
        <RatingScale
          accessibilityLabel="Overall experience"
          allowClear
          gap={12}
          interactionMode="tap-and-drag"
          items={EXPERIENCE_ITEMS}
          onChange={setExperience}
          onChangeEnd={handleExperienceEnd}
          size={50}
          value={experience}
        />
        <Text style={styles.hint}>
          Semantic values can include zero and negatives without treating either
          as an empty rating.
        </Text>
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Read-only average
        </Text>
        <View style={styles.staticRow}>
          <RatingDisplay
            accessibilityLabel="Average customer rating"
            decorative
            formatAccessibilityValue={formatScore}
            gap={3}
            size={26}
            value={4.37}
          />
          <Text style={styles.score}>4.37</Text>
        </View>
        <Text style={styles.hint}>
          RatingDisplay preserves exact aggregate values and avoids interaction
          work, making it the list-friendly path.
        </Text>
      </View>

      <Text
        accessibilityLiveRegion="polite"
        aria-live="polite"
        style={styles.status}
      >
        {status}
      </Text>
    </ScrollView>
  );
}
