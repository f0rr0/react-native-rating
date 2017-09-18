# react-native-rating

> Display ratings in your react-native app like a pro. Works on both iOS and Android.

<p align="center">
  <img src="./assets/rating.gif" align="center" alt="" height="400"/>
</p>

### Install
`npm i -S react-native-rating`
or
`yarn add react-native-rating`

### Usage
```js
import Rating from 'react-native-rating'
import { Easing } from 'react-native'

const images = {
  starFilled: require('./assets/star_filled.png'),
  starUnfilled: require('./assets/star_unfilled.png')
}

const myRandoComponent = () => (
  <Rating
    onChange={rating => console.log(rating)}
    selectedStar={images.starFilled}
    unselectedStar={images.starUnfilled}
    config={{
      easing: Easing.inOut(Easing.ease),
      duration: 350
    }}
    stagger={80}
    maxScale={1.4}
    starStyle={{
      width: 40,
      height: 40
    }}
  />
)
```

### Customization
Refer to the `propTypes` and `defaultProps` definition below:

```js
static propTypes = {
  max: PropTypes.number,
  initial: PropTypes.number,
  onChange: PropTypes.func,
  config: PropTypes.shape({
    easing: PropTypes.func.isRequired,
    duration: PropTypes.number.isRequired
  }),
  editable: PropTypes.bool,
  stagger: PropTypes.number,
  maxScale: PropTypes.number,
  starStyle: ViewPropTypes.style,
  containerStyle: ViewPropTypes.style,
  selectedStar: PropTypes.number.isRequired,
  unselectedStar: PropTypes.number.isRequired,
  onAnimationComplete: PropTypes.func
}

static defaultProps = {
  max: 5,
  initial: 0,
  onChange: () => {},
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
  editable: true,
  containerStyle: { flexDirection: 'row' },
  onAnimationComplete: () => {}
}
```

### License
MIT
