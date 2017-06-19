import React from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  }
})

export default function CenterView(props) {
  return (
    <View style={styles.main}>
      {props.children}
    </View>
  )
}

CenterView.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)])
}

CenterView.defaultProps = {
  children: null
}
