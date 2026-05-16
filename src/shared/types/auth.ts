/** Authenticated player profile decoded from the OAuth id_token. */
export interface UserInfo {
  sub: string
  username: string
  email: string
}
