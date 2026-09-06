import {oauthMetadataResponse} from './_shared/oauth-metadata'

export const onRequestGet = ({request}: {request: Request}) =>
  oauthMetadataResponse(request, true)
