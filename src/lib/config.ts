// Confirmation and recovery emails should open the deployed app even when requested locally.
// Override only when deploying this repository to another trusted app URL.
export const authRedirectUrl =
  import.meta.env.VITE_AUTH_REDIRECT_URL || 'https://muhammadazfaraslam.github.io/fitness-app/';
