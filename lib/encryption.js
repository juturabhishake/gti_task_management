export const encodeData = (data) => {
  try {
    return btoa(JSON.stringify(data));
  } catch (e) {
    console.error("Encoding error", e);
    return "";
  }
};
export const decodeData = (encodedString) => {
  try {
    return JSON.parse(atob(encodedString));
  } catch (e) {
    console.error("Decoding error", e);
    return null;
  }
};