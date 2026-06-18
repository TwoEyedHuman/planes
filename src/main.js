import './style.css'
import { getInitialCenter } from './location.js'
import { initMap } from './map.js'

getInitialCenter().then((center) => {
  initMap(center)
})
