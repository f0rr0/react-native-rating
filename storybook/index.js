import { AppRegistry } from 'react-native'
import { getStorybookUI, configure } from '@storybook/react-native'
import './addons'

configure(() => {
  require('./stories/react-native-rating.story')
}, module)

const StorybookUI = getStorybookUI({ port: 7007, host: 'localhost' })
AppRegistry.registerComponent('ReactNativeRating', () => StorybookUI)
