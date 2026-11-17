import {createContext} from 'react'
import {type TextStyle} from 'react-native'

export const NameTextContext = createContext<TextStyle>({fontSize: 16})
