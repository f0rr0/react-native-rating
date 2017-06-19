import React, { PureComponent } from 'react'
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  ViewPropTypes
} from 'react-native'
import PropTypes from 'prop-types'

const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'contain'
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject
  }
})

const initializeAnimatedValues = (max, initial) =>
  Array(max).fill(null).map((value, index) => new Animated.Value(index + 1 <= initial ? 1 : 0))

const createAnimations = (config, values, prev, curr) => {
  if (curr > prev) {
    const startIndex = prev === 0 ? 0 : prev - 1
    return values.slice(startIndex, curr).map(value =>
      Animated.timing(value, {
        ...config,
        toValue: 1,
        useNativeDriver: true
      })
    )
  }
  return values
    .slice(curr, prev)
    .map(value =>
      Animated.timing(value, {
        ...config,
        toValue: 0,
        useNativeDriver: true
      })
    )
    .reverse()
}

export default class Stars extends PureComponent {
  static propTypes = {
    max: PropTypes.number,
    initial: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    config: PropTypes.shape({
      easing: PropTypes.func.isRequired,
      duration: PropTypes.number.isRequired
    }),
    stagger: PropTypes.number,
    maxScale: PropTypes.number,
    starStyle: ViewPropTypes.style,
    containerStyle: ViewPropTypes.style,
    selectedStar: PropTypes.number.isRequired,
    unselectedStar: PropTypes.number.isRequired
  }

  static defaultProps = {
    max: 5,
    initial: 0,
    config: {
      easing: Easing.elastic(1),
      duration: 400
    },
    stagger: 100,
    maxScale: 1.1,
    starStyle: {
      width: 36,
      height: 36
    },
    containerStyle: { flexDirection: 'row' }
  }

  constructor(props) {
    super(props)
    this.state = {
      selected: props.initial
    }
  }

  getSelectedOpacity = index =>
    this.animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    })

  getUnselectedOpacity = index =>
    this.animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
      extrapolate: 'clamp'
    })

  getScale = index =>
    this.animatedValues[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, this.props.maxScale, 1],
      extrapolate: 'clamp'
    })

  animatedValues = initializeAnimatedValues(this.props.max, this.props.initial)

  animate = curr => () => {
    const { config, stagger, onChange } = this.props
    const animations = createAnimations(config, this.animatedValues, this.state.selected, curr)
    this.setState(
      () => ({
        selected: curr
      }),
      () => {
        onChange(this.state.selected)
        Animated.stagger(stagger, animations).start()
      }
    )
  }

  renderStar = (value, index) =>
    (<TouchableWithoutFeedback key={index} onPress={this.animate(index + 1)}>
      <View style={this.props.starStyle}>
        <View style={styles.imageContainer}>
          <Animated.Image
            style={[
              styles.image,
              {
                opacity: this.getUnselectedOpacity(index),
                transform: [{ scale: this.getScale(index) }]
              }
            ]}
            source={this.props.unselectedStar}
          />
        </View>
        <View style={styles.imageContainer}>
          <Animated.Image
            style={[
              styles.image,
              {
                opacity: this.getSelectedOpacity(index),
                transform: [{ scale: this.getScale(index) }]
              }
            ]}
            source={this.props.selectedStar}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>)

  render() {
    return (
      <View style={this.props.containerStyle}>
        {this.animatedValues.map(this.renderStar)}
      </View>
    )
  }
}
