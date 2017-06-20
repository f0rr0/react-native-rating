# react-native-rating

> Display ratings in your react-native app like a pro. Works on both iOS and Android.

<p align="center">
![alt text](./assets/rating.gif)
</p>

### Install
`npm i -S react-native-rating`
or
`yarn add react-native-rating`

### Usage
```js
import Rating from 'react-native-rating'

const myRandoComponent = () => (
  <Stars
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
```

### License
MIT
