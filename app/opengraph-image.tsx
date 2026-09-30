import {
  createSocialImage,
  socialImageAlt as alt,
  socialImageContentType as contentType,
  socialImageSize as size,
} from "../lib/social-image";

export { alt, contentType, size };
export const runtime = "nodejs";

export default createSocialImage;
