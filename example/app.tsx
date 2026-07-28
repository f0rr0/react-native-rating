import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Rating, RatingDisplay, RatingScale } from "react-native-rating";
import type {
  RatingInteractionDetails,
  RatingInteractionEndDetails,
  RatingRenderItemProps,
  RatingScaleItem,
  RatingScaleRenderItemProps,
} from "react-native-rating";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

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

const NPS_ITEMS = Array.from({ length: 11 }, (_, score) => ({
  content: score,
  label: `${score} out of 10`,
  value: score,
})) satisfies RatingScaleItem<number>[];

const LIKERT_ITEMS = [
  { content: "Strong no", label: "Strongly disagree", value: "strong-no" },
  { content: "No", label: "Disagree", value: "no" },
  { content: "Mixed", label: "Neither agree nor disagree", value: "mixed" },
  { content: "Yes", label: "Agree", value: "yes" },
  { content: "Strong yes", label: "Strongly agree", value: "strong-yes" },
] as const satisfies readonly RatingScaleItem<string>[];

const COMPACT_LIKERT_ITEMS = [
  { content: "S no", label: "Strongly disagree", value: "strong-no" },
  { content: "No", label: "Disagree", value: "no" },
  { content: "Mixed", label: "Neither agree nor disagree", value: "mixed" },
  { content: "Yes", label: "Agree", value: "yes" },
  { content: "S yes", label: "Strongly agree", value: "strong-yes" },
] as const satisfies readonly RatingScaleItem<string>[];

const PRIORITY_ITEMS = [
  { content: "P1", label: "Low priority", value: "low" },
  { content: "P2", label: "Medium priority", value: "medium" },
  { content: "P3", label: "High priority", value: "high" },
  { content: "P4", label: "Critical priority", value: "critical" },
] as const satisfies readonly RatingScaleItem<string>[];

const CONFIDENCE_ITEMS = [
  { content: "Guess", label: "Guess", value: "guess" },
  { content: "Some", label: "Some evidence", value: "some" },
  { content: "Good", label: "Good evidence", value: "good" },
  { content: "Certain", label: "Certain", value: "certain" },
] as const satisfies readonly RatingScaleItem<string>[];

const formatRating = (value: number, max: number): string =>
  `${value.toFixed(2)} of ${max}`;

const formatPercent = (value: number, max: number): string =>
  `${Math.round((value / max) * 100)} percent filled`;

const styles = StyleSheet.create({
  app: {
    backgroundColor: "#06080F",
    flex: 1,
  },
  card: {
    backgroundColor: "#10141D",
    borderColor: "#273244",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: "0 18px 45px rgba(0, 0, 0, 0.34)",
      },
    }),
  },
  cell: {
    flexBasis: 260,
    flexGrow: 1,
    flexShrink: 1,
    gap: 8,
    minWidth: 0,
  },
  content: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 920,
    paddingBottom: 56,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: "100%",
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
  eyebrow: {
    color: "#5EEAD4",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  footerStatus: {
    backgroundColor: "#F4C95D",
    borderRadius: 8,
    color: "#17120B",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 18,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hint: {
    color: "#8FA0B8",
    fontSize: 13,
    lineHeight: 18,
  },
  inlineRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metric: {
    color: "#F8FAFC",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 21,
  },
  scaleBox: {
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: "center",
  },
  scaleBoxLabel: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    textAlign: "center",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
  },
  splitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  scroll: {
    backgroundColor: "#06080F",
    flex: 1,
  },
});

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

const renderBlock = ({
  activeColor,
  fill,
  fillOrigin,
  inactiveColor,
  size,
}: RatingRenderItemProps) => {
  const fromEnd = fillOrigin === "right";
  const fromBottom = fillOrigin === "bottom";

  return (
    <View
      style={[
        styles.customIcon,
        {
          backgroundColor: inactiveColor,
          borderRadius: 5,
          height: size,
          width: size,
        },
      ]}
    >
      <View
        style={[
          styles.customMask,
          fromBottom ? styles.customBottom : styles.customTop,
          fromEnd ? styles.customEnd : styles.customStart,
          {
            backgroundColor: activeColor,
            height: fromBottom ? size * fill : size,
            width: fromBottom ? size : size * fill,
          },
        ]}
      />
    </View>
  );
};

const renderScaleBox = ({
  activeColor,
  content,
  inactiveColor,
  itemExtent,
  label,
  orientation,
  selected,
  size,
}: RatingScaleRenderItemProps<string | number>) => (
  <View
    style={[
      styles.scaleBox,
      {
        backgroundColor: selected ? activeColor : "#121826",
        borderColor: selected ? activeColor : inactiveColor,
        height: orientation === "vertical" ? itemExtent : size,
        width: orientation === "vertical" ? 96 : itemExtent,
      },
    ]}
  >
    <Text
      numberOfLines={1}
      style={[
        styles.scaleBoxLabel,
        { color: selected ? "#FFFFFF" : "#CBD5E1" },
      ]}
    >
      {content ?? label}
    </Text>
  </View>
);

const Section = ({
  children,
  hint,
  title,
}: {
  children: ReactNode;
  hint?: string;
  title: string;
}) => (
  <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.sectionTitle}>
      {title}
    </Text>
    {children}
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const FeatureCell = ({
  children,
  label,
  value,
}: {
  children: ReactNode;
  label: string;
  value?: string;
}) => (
  <View style={styles.cell}>
    <Text style={styles.eyebrow}>{label}</Text>
    {children}
    {value ? <Text style={styles.metric}>{value}</Text> : null}
  </View>
);

const describeStart = (
  label: string,
  value: number | string | null,
  details: RatingInteractionDetails
): string => `${label} start: ${value ?? "empty"} by ${details.source}`;

const describeEnd = (
  label: string,
  value: number | string | null,
  details: RatingInteractionEndDetails
): string =>
  `${label} end: ${value ?? "empty"} by ${details.source}${
    details.cancelled ? " (cancelled)" : ""
  }`;

export function App() {
  const { width } = useWindowDimensions();
  const [preciseScore, setPreciseScore] = useState(3.75);
  const [tapScore, setTapScore] = useState(4);
  const [tenPointScore, setTenPointScore] = useState(7);
  const [heartScore, setHeartScore] = useState(3.5);
  const [blockScore, setBlockScore] = useState(2.6);
  const [verticalScore, setVerticalScore] = useState(3);
  const [calmScore, setCalmScore] = useState(4);
  const [experience, setExperience] = useState<number | null>(0);
  const [npsScore, setNpsScore] = useState<number | null>(8);
  const [likert, setLikert] = useState<string | null>("yes");
  const [priority, setPriority] = useState<string | null>("medium");
  const [confidence, setConfidence] = useState<string | null>("good");
  const [status, setStatus] = useState("Ready for capture.");
  const compactScales = width < 520;
  const likertItems = compactScales ? COMPACT_LIKERT_ITEMS : LIKERT_ITEMS;

  const focusStyle = useMemo(
    () => ({
      borderColor: "#5EEAD4",
      borderRadius: 8,
      borderWidth: 2,
    }),
    []
  );

  const setNumericStatus = useCallback(
    (label: string) =>
      (value: number, details: RatingInteractionEndDetails): void => {
        setStatus(describeEnd(label, value, details));
      },
    []
  );
  const setScaleStatus = useCallback(
    (label: string) =>
      (
        value: number | string | null,
        details: RatingInteractionEndDetails
      ): void => {
        setStatus(describeEnd(label, value, details));
      },
    []
  );

  return (
    <SafeAreaProvider style={styles.app}>
      <SafeAreaView
        edges={["top", "right", "bottom", "left"]}
        style={styles.app}
      >
        <StatusBar backgroundColor="#06080F" barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scroll}
        >
          <Section
            hint="Tap, drag, clear, clamp, and format."
            title="Rating input"
          >
            <View style={styles.featureGrid}>
              <FeatureCell
                label="Quarter step drag"
                value={`${preciseScore.toFixed(2)} / 5`}
              >
                <Rating
                  accessibilityLabel="Quarter step product rating"
                  activeColor="#F97316"
                  allowClear
                  focusStyle={focusStyle}
                  formatAccessibilityValue={formatRating}
                  gap={6}
                  inactiveColor="#64748B"
                  interactionMode="tap-and-drag"
                  min={0.25}
                  onChange={setPreciseScore}
                  onChangeEnd={setNumericStatus("Quarter step")}
                  onInteractionStart={(value, details) => {
                    setStatus(describeStart("Quarter step", value, details));
                  }}
                  size={40}
                  step={0.25}
                  value={preciseScore}
                />
              </FeatureCell>

              <FeatureCell
                label="Tap only"
                value={`${tapScore.toFixed(0)} / 5`}
              >
                <Rating
                  accessibilityLabel="Tap only rating"
                  activeColor="#2DD4BF"
                  inactiveColor="#64748B"
                  gap={4}
                  onChange={setTapScore}
                  onChangeEnd={setNumericStatus("Tap only")}
                  size={34}
                  value={tapScore}
                />
              </FeatureCell>

              <FeatureCell
                label="Ten point minimum"
                value={`${tenPointScore.toFixed(0)} / 10`}
              >
                <Rating
                  accessibilityLabel="Ten point rating"
                  activeColor="#60A5FA"
                  inactiveColor="#64748B"
                  allowClear
                  gap={2}
                  max={10}
                  min={1}
                  onChange={setTenPointScore}
                  onChangeEnd={setNumericStatus("Ten point")}
                  size={25}
                  value={tenPointScore}
                />
              </FeatureCell>

              <FeatureCell
                label="Uncontrolled default"
                value="Local state inside"
              >
                <Rating
                  accessibilityLabel="Uncontrolled default rating"
                  activeColor="#F59E0B"
                  inactiveColor="#64748B"
                  defaultValue={3}
                  gap={5}
                  onChangeEnd={setNumericStatus("Uncontrolled")}
                  size={34}
                />
              </FeatureCell>
            </View>
          </Section>

          <Section
            hint="Custom visuals share the same interaction model."
            title="Custom renderers"
          >
            <View style={styles.featureGrid}>
              <FeatureCell
                label="RTL hearts"
                value={`${heartScore.toFixed(1)} / 5`}
              >
                <Rating
                  accessibilityLabel="RTL heart rating"
                  activeColor="#FB7185"
                  inactiveColor="#64748B"
                  direction="rtl"
                  gap={5}
                  interactionMode="tap-and-drag"
                  onChange={setHeartScore}
                  onChangeEnd={setNumericStatus("RTL hearts")}
                  renderItem={renderHeart}
                  size={36}
                  step={0.5}
                  value={heartScore}
                />
              </FeatureCell>

              <FeatureCell
                label="Custom blocks"
                value={`${blockScore.toFixed(1)} / 5`}
              >
                <Rating
                  accessibilityLabel="Custom block rating"
                  activeColor="#A3E635"
                  inactiveColor="#334155"
                  interactionMode="tap-and-drag"
                  onChange={setBlockScore}
                  onChangeEnd={setNumericStatus("Blocks")}
                  renderItem={renderBlock}
                  size={30}
                  step={0.2}
                  value={blockScore}
                />
              </FeatureCell>

              <FeatureCell
                label="Vertical drag"
                value={`${verticalScore.toFixed(0)} / 5`}
              >
                <Rating
                  accessibilityLabel="Vertical intensity rating"
                  activeColor="#A78BFA"
                  inactiveColor="#64748B"
                  gap={3}
                  interactionMode="tap-and-drag"
                  onChange={setVerticalScore}
                  onChangeEnd={setNumericStatus("Vertical")}
                  orientation="vertical"
                  size={30}
                  value={verticalScore}
                />
              </FeatureCell>

              <FeatureCell
                label="No pulse animation"
                value={`${calmScore} / 5`}
              >
                <Rating
                  accessibilityLabel="Reduced animation rating"
                  activeColor="#F97316"
                  inactiveColor="#64748B"
                  animated={false}
                  gap={5}
                  onChange={setCalmScore}
                  onChangeEnd={setNumericStatus("No animation")}
                  size={34}
                  value={calmScore}
                />
              </FeatureCell>
            </View>
          </Section>

          <Section
            hint="Static displays preserve exact aggregate values."
            title="Read-only display"
          >
            <View style={styles.featureGrid}>
              <FeatureCell label="Exact aggregate" value="4.37 unsnapped">
                <View style={styles.inlineRow}>
                  <RatingDisplay
                    accessibilityLabel="Average customer rating"
                    activeColor="#F4C95D"
                    inactiveColor="#64748B"
                    formatAccessibilityValue={formatRating}
                    gap={3}
                    size={26}
                    value={4.37}
                  />
                  <Text style={styles.metric}>4.37</Text>
                </View>
              </FeatureCell>

              <FeatureCell label="Snapped display" value="4.5 shown">
                <RatingDisplay
                  accessibilityLabel="Snapped average rating"
                  activeColor="#F59E0B"
                  inactiveColor="#64748B"
                  gap={3}
                  size={26}
                  step={0.5}
                  value={4.37}
                />
              </FeatureCell>

              <FeatureCell label="Decorative duplicate" value="Hidden from AT">
                <View style={styles.inlineRow}>
                  <Text style={styles.metric}>4.80 of 5</Text>
                  <RatingDisplay
                    activeColor="#F4C95D"
                    decorative
                    gap={3}
                    inactiveColor="#64748B"
                    size={24}
                    value={4.8}
                  />
                </View>
              </FeatureCell>

              <FeatureCell label="Disabled static" value="Dimmed">
                <RatingDisplay
                  accessibilityLabel="Disabled aggregate rating"
                  disabled
                  activeColor="#FB7185"
                  inactiveColor="#64748B"
                  gap={3}
                  renderItem={renderHeart}
                  size={28}
                  value={3.2}
                />
              </FeatureCell>

              <FeatureCell label="Rating readOnly" value="Static Rating path">
                <Rating
                  accessibilityLabel="Read only rating"
                  activeColor="#22D3EE"
                  inactiveColor="#64748B"
                  gap={4}
                  readOnly
                  size={30}
                  value={2.75}
                />
              </FeatureCell>

              <FeatureCell label="Disabled input" value="Unavailable">
                <Rating
                  accessibilityLabel="Disabled rating input"
                  disabled
                  inactiveColor="#64748B"
                  gap={4}
                  size={30}
                  value={3}
                />
              </FeatureCell>
            </View>
          </Section>

          <Section
            hint="Number, string, null, zero, and negative values."
            title="Semantic scales"
          >
            <View style={styles.splitRow}>
              <FeatureCell
                label="Negative, zero, positive"
                value={experience === null ? "empty" : `${experience}`}
              >
                <RatingScale
                  accessibilityLabel="Overall experience"
                  activeColor="#F4C95D"
                  allowClear
                  inactiveColor="#64748B"
                  gap={10}
                  interactionMode="tap-and-drag"
                  items={EXPERIENCE_ITEMS}
                  onChange={setExperience}
                  onChangeEnd={setScaleStatus("Experience")}
                  size={48}
                  value={experience}
                />
              </FeatureCell>

              <FeatureCell
                label="NPS cumulative"
                value={npsScore === null ? "empty" : `${npsScore} / 10`}
              >
                <RatingScale
                  accessibilityLabel="Likelihood to recommend"
                  activeColor="#3B82F6"
                  allowClear
                  inactiveColor="#64748B"
                  gap={compactScales ? 2 : 3}
                  interactionMode="tap-and-drag"
                  itemExtent={compactScales ? 28 : 34}
                  items={NPS_ITEMS}
                  onChange={setNpsScore}
                  onChangeEnd={setScaleStatus("NPS")}
                  renderItem={renderScaleBox}
                  selectionMode="cumulative"
                  size={30}
                  value={npsScore}
                />
              </FeatureCell>
            </View>

            <View style={styles.splitRow}>
              <FeatureCell
                label="String Likert"
                value={likert === null ? "empty" : likert}
              >
                <RatingScale
                  accessibilityLabel="Agreement"
                  activeColor="#14B8A6"
                  allowClear
                  inactiveColor="#64748B"
                  gap={compactScales ? 4 : 5}
                  itemExtent={compactScales ? 56 : 82}
                  items={likertItems}
                  onChange={setLikert}
                  onChangeEnd={setScaleStatus("Likert")}
                  renderItem={renderScaleBox}
                  size={34}
                  value={likert}
                />
              </FeatureCell>

              <FeatureCell
                label="Reversed priority"
                value={priority === null ? "empty" : priority}
              >
                <RatingScale
                  accessibilityLabel="Priority"
                  activeColor="#E11D48"
                  allowClear
                  inactiveColor="#64748B"
                  gap={compactScales ? 5 : 6}
                  itemExtent={compactScales ? 50 : 58}
                  items={PRIORITY_ITEMS}
                  onChange={setPriority}
                  onChangeEnd={setScaleStatus("Priority")}
                  renderItem={renderScaleBox}
                  reversed
                  size={36}
                  value={priority}
                />
              </FeatureCell>
            </View>
          </Section>

          <Section
            hint="Vertical, static, decorative, and disabled states."
            title="Scale states"
          >
            <View style={styles.featureGrid}>
              <FeatureCell
                label="Vertical scale"
                value={confidence === null ? "empty" : confidence}
              >
                <RatingScale
                  accessibilityLabel="Evidence confidence"
                  activeColor="#A78BFA"
                  allowClear
                  inactiveColor="#64748B"
                  gap={6}
                  interactionMode="tap-and-drag"
                  itemExtent={82}
                  items={CONFIDENCE_ITEMS}
                  onChange={setConfidence}
                  onChangeEnd={setScaleStatus("Confidence")}
                  orientation="vertical"
                  renderItem={renderScaleBox}
                  size={36}
                  value={confidence}
                />
              </FeatureCell>

              <FeatureCell label="Read-only scale" value="Selected: good">
                <RatingScale
                  accessibilityLabel="Read only confidence"
                  activeColor="#22D3EE"
                  inactiveColor="#64748B"
                  itemExtent={74}
                  items={CONFIDENCE_ITEMS}
                  readOnly
                  renderItem={renderScaleBox}
                  size={34}
                  value="good"
                />
              </FeatureCell>

              <FeatureCell
                label="Decorative scale"
                value="Adjacent text owns label"
              >
                <View style={styles.inlineRow}>
                  <Text style={styles.metric}>Priority: high</Text>
                  <RatingScale
                    decorative
                    activeColor="#F97316"
                    inactiveColor="#64748B"
                    itemExtent={46}
                    items={PRIORITY_ITEMS}
                    readOnly
                    renderItem={renderScaleBox}
                    size={30}
                    value="high"
                  />
                </View>
              </FeatureCell>

              <FeatureCell label="Disabled scale" value="Unavailable">
                <RatingScale
                  accessibilityLabel="Disabled priority"
                  disabled
                  activeColor="#E11D48"
                  inactiveColor="#64748B"
                  itemExtent={58}
                  items={PRIORITY_ITEMS}
                  renderItem={renderScaleBox}
                  size={34}
                  value="critical"
                />
              </FeatureCell>
            </View>
          </Section>

          <Section
            hint="Custom announced values and localized labels."
            title="Accessibility formatting"
          >
            <View style={styles.featureGrid}>
              <FeatureCell
                label="Percent formatter"
                value="formatAccessibilityValue"
              >
                <Rating
                  accessibilityLabel="Completion"
                  activeColor="#A3E635"
                  inactiveColor="#64748B"
                  formatAccessibilityValue={formatPercent}
                  gap={3}
                  max={4}
                  readOnly
                  size={30}
                  value={3}
                />
              </FeatureCell>

              <FeatureCell label="Scale formatter" value="Custom empty text">
                <RatingScale
                  accessibilityLabel="Recommendation"
                  activeColor="#F97316"
                  allowClear
                  formatAccessibilityValue={(item) =>
                    item ? `Selected ${item.label}` : "Nothing selected yet"
                  }
                  gap={compactScales ? 2 : 3}
                  itemExtent={compactScales ? 28 : 34}
                  inactiveColor="#64748B"
                  items={NPS_ITEMS}
                  readOnly
                  renderItem={renderScaleBox}
                  selectionMode="cumulative"
                  size={30}
                  value={6}
                />
              </FeatureCell>
            </View>
          </Section>

          <Text
            accessibilityLiveRegion="polite"
            aria-live="polite"
            style={styles.footerStatus}
          >
            {status}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
