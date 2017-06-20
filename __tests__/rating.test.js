import { Easing } from 'react-native'
import React from 'react'
import renderer from 'react-test-renderer'
import Rating from 'rating'

const images = {
  starFilled: require('../assets/star_filled.png'),
  starUnfilled: require('../assets/star_unfilled.png')
}

// eslint-disable-next-line
const logCurrentRating = console.log.bind(console)

describe('<Rating />', () => {
  it('renders correctly with default props', () => {
    const tree = renderer.create(
      <Rating
        onChange={logCurrentRating}
        selectedStar={images.starFilled}
        unselectedStar={images.starUnfilled}
      />
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with custom props', () => {
    const tree = renderer.create(
      <Rating
        max={6}
        initial={2}
        onChange={logCurrentRating}
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
          height: 40,
          backgroundColor: '#5e23dc'
        }}
        containerStyle={{ flexDirection: 'column' }}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
