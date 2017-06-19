import { storiesOf } from '@storybook/react-native'
import { action } from '@storybook/addon-actions'
import Rating from '../../src'
import React from 'react'
import { Easing } from 'react-native'
import CenterView from './CenterView'

const images = {
  starFilled: require('../../assets/star_filled.png'),
  starUnfilled: require('../../assets/star_unfilled.png')
}

storiesOf('Rating', module)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('Default', () =>
    (<Rating
      onChange={action('selected')}
      selectedStar={images.starFilled}
      unselectedStar={images.starUnfilled}
    />)
  )
  .add('Custom', () =>
    (<Rating
      max={6}
      initial={2}
      onChange={action('selected')}
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
    />)
  )
